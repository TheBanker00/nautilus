import { NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase-server';

// Smart budget rows are identified by color = 'smart-budget'
const MARKER = 'smart-budget';

async function getSupabaseAndUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

/* ── GET /api/smart-budget
   Returns { categories: {Housing: 1800, ...}, income: {'Payroll Income': 5000} }
   or {} if no smart budget saved yet ── */
export async function GET() {
  const { supabase, userId } = await getSupabaseAndUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('budgets')
    .select('name, budget_limit, category')
    .eq('user_id', userId)
    .eq('color', MARKER);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const categories: Record<string, number> = {};
  const income:     Record<string, number> = {};

  for (const row of data ?? []) {
    if (row.category === '__income__') {
      income[row.name] = Number(row.budget_limit ?? 0);
    } else {
      categories[row.name] = Number(row.budget_limit ?? 0);
    }
  }

  return NextResponse.json({ categories, income });
}

/* ── POST /api/smart-budget
   Body: { categories: {...}, income: {...} }
   Full replace — deletes all previous smart budget rows then inserts fresh ones ── */
export async function POST(req: Request) {
  const { supabase, userId } = await getSupabaseAndUser();
  console.log('[smart-budget POST] userId:', userId);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const cats:   Record<string, number> = body.categories ?? {};
  const inc:    Record<string, number> = body.income     ?? {};
  console.log('[smart-budget POST] categories:', Object.keys(cats).length, 'income groups:', Object.keys(inc).length);

  // Delete existing smart budget rows for this user
  const { error: delErr } = await supabase
    .from('budgets')
    .delete()
    .eq('user_id', userId)
    .eq('color', MARKER);

  if (delErr) {
    console.error('[smart-budget POST] delete error:', delErr);
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  // Build rows
  const rows = [
    ...Object.entries(cats).map(([name, limit]) => ({
      user_id:      userId,
      item_type:    'spending',
      name,
      category:     name,
      budget_limit: limit,
      period:       'monthly',
      color:        MARKER,
    })),
    ...Object.entries(inc).map(([name, limit]) => ({
      user_id:      userId,
      item_type:    'spending',
      name,
      category:     '__income__',
      budget_limit: limit,
      period:       'monthly',
      color:        MARKER,
    })),
  ];

  console.log('[smart-budget POST] inserting', rows.length, 'rows');
  if (rows.length === 0) return NextResponse.json({ ok: true });

  const { error: insErr } = await supabase.from('budgets').insert(rows);
  if (insErr) {
    console.error('[smart-budget POST] insert error:', insErr);
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  console.log('[smart-budget POST] success');
  return NextResponse.json({ ok: true });
}
