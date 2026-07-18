import { NextResponse } from 'next/server';
import { plaidClient } from '../../../lib/plaid-client';
import { createClient } from '../../../lib/supabase-server';
import { createServiceClient } from '../../../lib/supabase-service';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { public_token, institution_name, institution_id } = await req.json();

  try {
    // Exchange public token for permanent access token
    const exchangeRes = await plaidClient.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = exchangeRes.data;

    // Store in plaid_items using service role (bypasses RLS for secure server write)
    const service = createServiceClient();
    const { error } = await service
      .from('plaid_items')
      .upsert({
        user_id:          user.id,
        item_id,
        access_token,
        institution_name: institution_name ?? null,
        institution_id:   institution_id   ?? null,
        status:           'active',
        updated_at:       new Date().toISOString(),
      }, { onConflict: 'item_id' });

    if (error) {
      console.error('plaid_items upsert failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger initial sync immediately after linking.
    // Build an absolute base URL from the incoming request so this works on
    // localhost, Vercel production, and preview deployments without needing an
    // env var. Falls back to NEXT_PUBLIC_APP_URL if set.
    const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
    const proto = req.headers.get('x-forwarded-proto')
      ?? (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
    const baseUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? '');

    const syncRes = await fetch(`${baseUrl}/api/plaid/sync`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
      body:    JSON.stringify({ item_id }),
    });
    if (!syncRes.ok) {
      console.error('Initial sync failed:', syncRes.status, await syncRes.text().catch(() => ''));
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Plaid exchange-token failed:', err?.response?.data ?? err);
    return NextResponse.json(
      { error: err?.response?.data?.error_message ?? err?.message ?? 'Token exchange failed' },
      { status: 500 },
    );
  }
}
