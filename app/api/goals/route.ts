import { NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase-server';
import { rowToGoal, goalToRow } from '../../lib/goals';

async function getSupabaseAndUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

/* ── GET /api/goals ── */
export async function GET() {
  const { supabase, userId } = await getSupabaseAndUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(rowToGoal));
}

/* ── POST /api/goals ── */
export async function POST(req: Request) {
  const { supabase, userId } = await getSupabaseAndUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const row  = goalToRow(body, userId);

  const { data, error } = await supabase
    .from('goals')
    .insert(row)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToGoal(data), { status: 201 });
}
