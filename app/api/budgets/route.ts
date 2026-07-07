import { NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase-server';

async function getSupabaseAndUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

/* ── row → BudgetItem ── */
function rowToItem(row: any) {
  const base = {
    id:        row.id,
    type:      row.item_type as 'spending' | 'goal' | 'debt',
    name:      row.name,
    emoji:     row.emoji,
    color:     row.color,
    createdAt: row.created_at,
  };

  if (row.item_type === 'spending') {
    return {
      ...base,
      category: row.category ?? '',
      limit:    Number(row.budget_limit ?? 0),
      period:   (row.period ?? 'monthly') as 'weekly' | 'monthly',
    };
  }

  if (row.item_type === 'goal') {
    return {
      ...base,
      target:     Number(row.target_amount ?? 0),
      saved:      Number(row.saved_amount  ?? 0),
      targetDate: row.target_date ?? '',
    };
  }

  // debt
  return {
    ...base,
    debtKind:       row.debt_kind        ?? 'other',
    currentBalance: Number(row.current_balance  ?? 0),
    interestRate:   Number(row.interest_rate    ?? 0),
    minimumPayment: Number(row.minimum_payment  ?? 0),
    monthlyPayment: Number(row.monthly_payment  ?? 0),
  };
}

/* ── BudgetItem → row ── */
function itemToRow(item: any) {
  const base: Record<string, any> = {
    id:        item.id,
    user_id:   null, // overridden at call site with real userId
    item_type: item.type,
    name:      item.name,
    emoji:     item.emoji,
    color:     item.color,
    created_at: item.createdAt,
  };

  if (item.type === 'spending') {
    base.category     = item.category ?? null;
    base.budget_limit = item.limit    ?? null;
    base.period       = item.period   ?? null;
  } else if (item.type === 'goal') {
    base.target_amount = item.target     ?? null;
    base.saved_amount  = item.saved      ?? 0;
    base.target_date   = item.targetDate || null;
  } else {
    base.debt_kind       = item.debtKind       ?? null;
    base.current_balance = item.currentBalance ?? null;
    base.interest_rate   = item.interestRate   ?? null;
    base.minimum_payment = item.minimumPayment ?? null;
    base.monthly_payment = item.monthlyPayment ?? null;
  }

  return base;
}

/* ── GET /api/budgets ── */
export async function GET() {
  const { supabase, userId } = await getSupabaseAndUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(rowToItem));
}

/* ── POST /api/budgets ── */
export async function POST(req: Request) {
  const { supabase, userId } = await getSupabaseAndUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const row  = { ...itemToRow(body), user_id: userId };

  const { data, error } = await supabase
    .from('budgets')
    .insert(row)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToItem(data), { status: 201 });
}
