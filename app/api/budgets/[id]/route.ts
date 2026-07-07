import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase-server';

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

  return {
    ...base,
    debtKind:       row.debt_kind        ?? 'other',
    currentBalance: Number(row.current_balance  ?? 0),
    interestRate:   Number(row.interest_rate    ?? 0),
    minimumPayment: Number(row.minimum_payment  ?? 0),
    monthlyPayment: Number(row.monthly_payment  ?? 0),
  };
}

/* ── PATCH /api/budgets/[id] ── */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  const body   = await req.json();

  const patch: Record<string, any> = {};

  // shared
  if (body.name  !== undefined) patch.name  = body.name;
  if (body.emoji !== undefined) patch.emoji = body.emoji;
  if (body.color !== undefined) patch.color = body.color;

  // spending
  if (body.category !== undefined) patch.category     = body.category;
  if (body.limit    !== undefined) patch.budget_limit = body.limit;
  if (body.period   !== undefined) patch.period       = body.period;

  // goal
  if (body.target     !== undefined) patch.target_amount = body.target;
  if (body.saved      !== undefined) patch.saved_amount  = body.saved;
  if (body.targetDate !== undefined) patch.target_date   = body.targetDate || null;

  // debt
  if (body.debtKind       !== undefined) patch.debt_kind       = body.debtKind;
  if (body.currentBalance !== undefined) patch.current_balance = body.currentBalance;
  if (body.interestRate   !== undefined) patch.interest_rate   = body.interestRate;
  if (body.minimumPayment !== undefined) patch.minimum_payment = body.minimumPayment;
  if (body.monthlyPayment !== undefined) patch.monthly_payment = body.monthlyPayment;

  const { data, error } = await supabase
    .from('budgets')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToItem(data));
}

/* ── DELETE /api/budgets/[id] ── */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
