import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase-server';

// GET — fetch splits for a transaction
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('transaction_splits')
    .select('*')
    .eq('transaction_id', id)
    .eq('user_id', user.id)
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — replace all splits for a transaction
// Body: { splits: [{ amount, category, note? }] }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { splits } = await request.json();

  if (!Array.isArray(splits) || splits.length < 2) {
    return NextResponse.json({ error: 'Splits must have at least 2 lines' }, { status: 400 });
  }

  // Delete existing splits then insert new ones atomically
  const { error: deleteError } = await supabase
    .from('transaction_splits')
    .delete()
    .eq('transaction_id', id)
    .eq('user_id', user.id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  const rows = splits.map((s: any) => ({
    transaction_id: id,
    user_id:        user.id,
    amount:         s.amount,
    category:       s.category,
    subcategory:    s.subcategory ?? null,
    note:           s.note ?? null,
  }));

  const { data, error: insertError } = await supabase
    .from('transaction_splits')
    .insert(rows)
    .select();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Mark the parent transaction as split
  await supabase
    .from('transactions')
    .update({ is_split: true, is_manually_categorized: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  return NextResponse.json(data);
}

// DELETE — remove all splits, revert transaction to normal
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('transaction_splits')
    .delete()
    .eq('transaction_id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from('transactions')
    .update({ is_split: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  return NextResponse.json({ success: true });
}
