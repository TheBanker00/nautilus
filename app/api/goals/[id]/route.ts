import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase-server';
import { rowToGoal } from '../../../lib/goals';

/* ── PATCH /api/goals/[id] ── */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id }  = await params;
  const body    = await req.json();

  const patch: Record<string, unknown> = {};
  if (body.name                !== undefined) patch.name                = body.name;
  if (body.category            !== undefined) patch.category            = body.category;
  if (body.emoji               !== undefined) patch.emoji               = body.emoji;
  if (body.color               !== undefined) patch.color               = body.color;
  if (body.targetAmount        !== undefined) patch.target_amount       = body.targetAmount;
  if (body.currentSaved        !== undefined) patch.current_saved       = body.currentSaved;
  if (body.monthlyContrib      !== undefined) patch.monthly_contrib     = body.monthlyContrib;
  if (body.targetDate          !== undefined) patch.target_date         = body.targetDate || null;
  if (body.notes               !== undefined) patch.notes               = body.notes ?? null;
  if (body.homePrice           !== undefined) patch.home_price          = body.homePrice ?? null;
  if (body.downPaymentPct      !== undefined) patch.down_payment_pct    = body.downPaymentPct ?? null;
  if (body.childName           !== undefined) patch.child_name          = body.childName ?? null;
  if (body.childAge            !== undefined) patch.child_age           = body.childAge ?? null;
  if (body.emergencyMonths     !== undefined) patch.emergency_months    = body.emergencyMonths ?? null;
  if (body.completedAt         !== undefined) patch.completed_at        = body.completedAt ?? null;
  if (body.fundingStrategy     !== undefined) patch.funding_strategy    = body.fundingStrategy ?? null;
  if (body.priority            !== undefined) patch.priority            = body.priority ?? null;
  if (body.allocatedCash       !== undefined) patch.allocated_cash      = body.allocatedCash ?? null;
  if (body.allocatedInvestment !== undefined) patch.allocated_investment = body.allocatedInvestment ?? null;
  if (body.debtRate            !== undefined) patch.debt_rate           = body.debtRate ?? null;
  if (body.debtTermMonths      !== undefined) patch.debt_term_months    = body.debtTermMonths ?? null;

  const { data, error } = await supabase
    .from('goals')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToGoal(data));
}

/* ── DELETE /api/goals/[id] ── */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id }  = await params;

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
