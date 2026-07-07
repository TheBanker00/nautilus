import { NextResponse } from 'next/server';
import { plaidClient } from '../../../lib/plaid-client';
import { createClient } from '../../../lib/supabase-server';
import { createServiceClient } from '../../../lib/supabase-service';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();
  const body = await req.json().catch(() => ({}));

  // Load plaid items for this user (optionally filter to one item_id)
  let itemQuery = service
    .from('plaid_items')
    .select('id, item_id, access_token, cursor')
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (body.item_id) itemQuery = itemQuery.eq('item_id', body.item_id);

  const { data: items, error: itemsErr } = await itemQuery;
  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  if (!items?.length) return NextResponse.json({ synced: 0 });

  let totalSynced = 0;

  for (const item of items) {
    try {
      // ── 1. Sync accounts ──────────────────────────────────────
      const accountsRes = await plaidClient.accountsGet({ access_token: item.access_token });

      // Resolve taxonomy_id for each account (best-effort match)
      const accountRows = await Promise.all(accountsRes.data.accounts.map(async (a) => {
        // account_taxonomy can contain duplicate (type, subtype) rows — use
        // limit(1) instead of maybeSingle() so a duplicate never silently
        // nulls out the match (maybeSingle() errors on >1 row, and the error
        // here was previously discarded, leaving every account untagged).
        const { data: taxRows } = await service
          .from('account_taxonomy')
          .select('id')
          .eq('type', a.type)
          .eq('subtype', a.subtype ?? '')
          .limit(1);
        const tax = taxRows?.[0];

        return {
          account_id:       a.account_id,
          user_id:          user.id,
          // plaid_item_id is a UUID FK to plaid_items.id — NOT Plaid's text item_id
          plaid_item_id:    item.id,
          taxonomy_id:      tax?.id ?? null,
          name:             a.name,
          official_name:    a.official_name ?? null,
          type:             a.type,
          subtype:          a.subtype ?? null,
          current:          a.balances.current ?? 0,
          available:        a.balances.available ?? null,
          mask:             a.mask ?? null,
          provider:         'plaid',
          updated_at:       new Date().toISOString(),
        };
      }));

      const { error: accountsErr } = await service
        .from('accounts')
        .upsert(accountRows, { onConflict: 'account_id' });
      if (accountsErr) throw accountsErr;

      // ── 2. Sync transactions (cursor-based) ───────────────────
      let cursor  = item.cursor ?? undefined;
      let hasMore = true;

      const added:    any[] = [];
      const modified: any[] = [];
      const removedIds: string[] = [];

      while (hasMore) {
        const txRes = await plaidClient.transactionsSync({
          access_token: item.access_token,
          cursor,
          count: 500,
        });

        // transactions_update_status tells us whether Sandbox has actually
        // finished generating fixture data yet (NOT_READY means "ask again later").
        console.log(
          `[plaid sync] item ${item.item_id}: added=${txRes.data.added.length} modified=${txRes.data.modified.length} removed=${txRes.data.removed.length} has_more=${txRes.data.has_more} update_status=${(txRes.data as any).transactions_update_status}`
        );

        added.push(...txRes.data.added);
        modified.push(...txRes.data.modified);
        removedIds.push(...txRes.data.removed.map((r: any) => r.transaction_id));

        hasMore = txRes.data.has_more;
        cursor  = txRes.data.next_cursor;
      }

      // Map Plaid transactions to our schema
      const toUpsert = [...added, ...modified].map(t => ({
        user_id:              user.id,
        plaid_transaction_id: t.transaction_id,
        account_id:           t.account_id,  // accounts.account_id (text) is the PK — same value Plaid returns
        date:                 t.date,
        amount:               Math.abs(t.amount),
        transaction_type:     t.amount < 0 ? 'Income' : 'Expense',
        merchant:             t.merchant_name ?? t.name,
        raw_merchant:         t.name,
        provider_category:    t.personal_finance_category?.primary ?? null,
        provider_subcategory: t.personal_finance_category?.detailed ?? null,
        pending:              t.pending,
        logo:                 t.logo_url ?? null,
        source_type:          'plaid',
        item_id:              item.item_id,
      }));

      if (toUpsert.length > 0) {
        const { error: txErr } = await service
          .from('transactions')
          .upsert(toUpsert, { onConflict: 'plaid_transaction_id' });
        if (txErr) throw txErr;
      }

      // Remove transactions Plaid says are deleted
      if (removedIds.length > 0) {
        const { error: delErr } = await service
          .from('transactions')
          .delete()
          .in('plaid_transaction_id', removedIds)
          .eq('user_id', user.id);
        if (delErr) throw delErr;
      }

      // ── 3. Update cursor + last_synced ─────────────────────────
      await service
        .from('plaid_items')
        .update({ cursor, last_synced: new Date().toISOString() })
        .eq('item_id', item.item_id);

      totalSynced += toUpsert.length;
    } catch (err: any) {
      // err may be a Plaid API error (response.data.error_code) or a
      // Postgres/Supabase error ({ code, message, details, hint }) — capture
      // whichever shape applies so error_code is actually useful for debugging.
      const errorCode =
        err?.response?.data?.error_code ??
        err?.code ??
        err?.message ??
        'UNKNOWN';

      await service
        .from('plaid_items')
        .update({ status: 'error', error_code: String(errorCode).slice(0, 255) })
        .eq('item_id', item.item_id);

      console.error(`Sync failed for item ${item.item_id}:`, err?.response?.data ?? err);
    }
  }

  return NextResponse.json({ synced: totalSynced });
}
