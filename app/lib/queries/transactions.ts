import { createClient } from '../supabase-browser';
import { IngestionTransaction } from '../types/ingestiontransaction';

function rowToIngestion(row: any, accountSubtype?: string, accountName?: string): IngestionTransaction {
  return {
    id:                   row.id,
    date:                 row.date,
    amount:               Number(row.amount),
    transaction_type:     row.transaction_type as IngestionTransaction['transaction_type'],
    merchant:             row.merchant || row.raw_merchant || '',
    name:                 row.raw_merchant || undefined,
    provider_subcategory: row.provider_subcategory ?? undefined,
    accountId:            row.account_id ?? undefined,
    accountName:          accountName ?? undefined,
    institution:          row.institution ?? undefined,
    sourceType:           row.source_type ?? undefined,
    pending:              row.pending ?? false,
    logo:                 row.logo ?? undefined,
    notes:                row.notes ?? undefined,
    category:             row.category ?? undefined,
    subcategory:          row.subcategory ?? undefined,
    is_manually_categorized: row.is_manually_categorized ?? false,
    is_split:             row.is_split ?? false,
    accountSubtype:       accountSubtype ?? undefined,
  };
}

export async function fetchTransactions(): Promise<IngestionTransaction[]> {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

  // Fetch accounts to get IDs, names, and subtype labels
  const { data: accountRows } = await supabase
    .from('accounts')
    .select('account_id, name, subtype')
    .eq('user_id', session.user.id);

  const accountIds = (accountRows ?? []).map((a) => a.account_id);
  if (accountIds.length === 0) return [];

  const subtypeByAccountId: Record<string, string> = {};
  const nameByAccountId: Record<string, string> = {};
  (accountRows ?? []).forEach((a) => {
    if (a.subtype) subtypeByAccountId[a.account_id] = a.subtype;
    if (a.name)    nameByAccountId[a.account_id]    = a.name;
  });

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .in('account_id', accountIds)
    .order('date', { ascending: false })
    .range(0, 9999);

  if (error) {
    console.error('[fetchTransactions]', error.message);
    return [];
  }

  return (data ?? []).map(row => rowToIngestion(row, subtypeByAccountId[row.account_id], nameByAccountId[row.account_id]));
}

export interface TransactionSplit {
  id:           string;
  transaction_id: string;
  amount:       number;
  category:     string;
  subcategory?: string;
  note?:        string;
}

export async function fetchSplits(userId: string): Promise<TransactionSplit[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('transaction_splits')
    .select('id, transaction_id, amount, category, subcategory, note')
    .eq('user_id', userId);

  if (error) {
    console.error('[fetchSplits]', error.message);
    return [];
  }

  return (data ?? []).map(r => ({
    id:             r.id,
    transaction_id: r.transaction_id,
    amount:         Number(r.amount),
    category:       r.category,
    subcategory:    r.subcategory ?? undefined,
    note:           r.note ?? undefined,
  }));
}
