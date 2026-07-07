'use client';

import React, { useEffect, useRef, useState } from 'react';

/* ── category → subcategory map ── */
const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  'Housing':               ['Rent', 'Mortgage', 'Furniture', 'Hardware', 'Repairs', 'Security', 'Home Improvement', 'Other'],
  'Bills & Utilities':     ['Gas & Electric', 'Internet & Cable', 'Phone', 'Water', 'Waste', 'Utilities', 'Insurance', 'Other'],
  'Groceries':             ['Groceries', 'Other'],
  'Dining & Restaurants':  ['Restaurant', 'Fast Food', 'Coffee', 'Alcohol', 'Food & Drink', 'Vending', 'Other'],
  'Transportation':        ['Car Payment', 'Gas', 'Parking', 'Transit', 'Ride Share', 'Tolls', 'Automotive', 'Bikes & Scooters', 'Transportation', 'Other'],
  'Shopping':              ['Online Marketplaces', 'Department Stores', 'Discount Stores', 'Superstores', 'Clothing & Accessories', 'Electronics', 'Sporting Goods', 'Office Supplies', 'Gifts & Novelties', 'Convenience Stores', 'Other Merchandise', 'Other'],
  'Entertainment':         ['Music & Audio', 'Events & Attractions', 'TV & Movies', 'Video Games', 'Gambling', 'Other Entertainment', 'Other'],
  'Health & Wellness':     ['Primary Care', 'Dental Care', 'Eye Care', 'Pharmacy & Supplements', 'Fitness', 'Nursing Care', 'Veterinary Services', 'Other Medical', 'Other'],
  'Travel':                ['Flights', 'Lodging', 'Rental Car', 'Travel', 'Other'],
  'Financial':             ['Accounting & Financial Planning', 'Interest Charge', 'ATM Fees', 'Late Fee', 'Overdraft Fee', 'Other Bank Fees', 'Consulting & Legal', 'Government Services', 'Other'],
  'Family & Education':    ['Childcare', 'Education Services', 'Pet Supplies', 'Student Loan Payment', 'Other'],
  'Miscellaneous':         ['Donations', 'Postage & Shipping', 'Storage', 'Tobacco & Vape', 'Books & News', 'Hair & Beauty', 'Laundry & Dry Cleaning', 'Other Personal Care', 'Other Services', 'Other'],
  'Payroll':               ['Salary', 'Military Pay', 'Contractor Income', 'Gig Work', 'Other Income'],
  'Investment':            ['Dividends', 'Interest', 'Other Income'],
  'Business':              ['Contractor Income', 'Rental Income', 'Other Income'],
  'Other':                 ['Tax Refund', 'Child Support', 'Disability Income', 'Pension', 'Unemployment Benefits', 'Other Income'],
  'Transfer In':           ['Account Transfer In', 'Cash Deposit', 'Investment Transfer In', 'Savings Transfer In', 'App Transfer In', 'Incoming Wire', 'Other Transfer In'],
  'Transfer Out':          ['Account Transfer Out', 'Investment Transfer Out', 'Savings Transfer Out', 'App Transfer Out', 'Outgoing Wire', 'Cash Withdrawal', 'Other Transfer Out'],
  'Loan Payment':          ['Car Payment', 'Student Loan Payment', 'Personal Loan Payment', 'Other Loan Payment'],
  'Credit Card Payment':   ['Credit Card Payment'],
  'Investment Transfer':   ['Investment Transfer In', 'Investment Transfer Out'],
};

const EXPENSE_CATEGORIES = [
  'Housing','Bills & Utilities','Groceries','Dining & Restaurants','Transportation',
  'Shopping','Entertainment','Health & Wellness','Travel','Financial','Family & Education','Miscellaneous',
];
const INCOME_CATEGORIES  = ['Payroll','Investment','Business','Other'];
const TRANSFER_CATEGORIES = ['Transfer In','Transfer Out','Loan Payment','Credit Card Payment','Investment Transfer'];

function categoriesForType(type: string) {
  if (type === 'Income')   return INCOME_CATEGORIES;
  if (type === 'Transfer') return TRANSFER_CATEGORIES;
  return EXPENSE_CATEGORIES;
}

/* ── types ── */
interface Split {
  id?: string;
  amount: string;
  category: string;
  subcategory: string;
  note: string;
}

interface Props {
  transaction: any | null;
  onClose: () => void;
  onSaved: (updated: any) => void;
}

/* ── helpers ── */
const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function TransactionEditDrawer({ transaction, onClose, onSaved }: Props) {
  const [tab, setTab]           = useState<'recategorize' | 'split'>('recategorize');
  const [category, setCategory] = useState('');
  const [subcategory, setSub]   = useState('');
  const [splits, setSplits]     = useState<Split[]>([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const drawerRef               = useRef<HTMLDivElement>(null);

  // Initialise state when transaction changes
  useEffect(() => {
    if (!transaction) return;
    setCategory(transaction.category ?? '');
    setSub(transaction.subcategory ?? '');
    setError('');
    setTab('recategorize');

    if (transaction.is_split) {
      // Load existing splits
      fetch(`/api/transactions/${transaction.id}/splits`)
        .then(r => r.json())
        .then((rows: any[]) => {
          setSplits(rows.map(r => ({
            id:          r.id,
            amount:      String(r.amount),
            category:    r.category,
            subcategory: r.subcategory ?? '',
            note:        r.note ?? '',
          })));
          setTab('split');
        });
    } else {
      const abs    = Math.abs(transaction.amount);
      const half   = parseFloat((abs / 2).toFixed(2));
      const rest   = parseFloat((abs - half).toFixed(2));
      const defCat = transaction.category || EXPENSE_CATEGORIES[0];
      const defSub = transaction.subcategory || '';
      setSplits([
        { amount: String(half), category: defCat, subcategory: defSub, note: '' },
        { amount: String(rest), category: defCat, subcategory: defSub, note: '' },
      ]);
    }
  }, [transaction]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) onClose();
    }
    if (transaction) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [transaction, onClose]);

  if (!transaction) return null;

  const absAmount  = transaction ? Math.abs(transaction.amount) : 0;
  const totalSplit = splits.reduce((s, sp) => s + (parseFloat(sp.amount) || 0), 0);
  const remaining  = absAmount - totalSplit;
  const splitValid = splits.length >= 2 && Math.round(remaining * 100) === 0 && splits.every(s => s.category && parseFloat(s.amount) > 0);

  /* ── save recategorize ── */
  async function saveCategory() {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subcategory }),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved({ ...transaction, category, subcategory, is_manually_categorized: true });
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  /* ── save splits ── */
  async function saveSplits() {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/transactions/${transaction.id}/splits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ splits: splits.map(s => ({ ...s, amount: parseFloat(s.amount) })) }),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved({ ...transaction, is_split: true, splits: splits.map(s => ({ ...s, amount: parseFloat(s.amount) })) });
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  /* ── remove splits ── */
  async function removeSplits() {
    setSaving(true); setError('');
    try {
      await fetch(`/api/transactions/${transaction.id}/splits`, { method: 'DELETE' });
      onSaved({ ...transaction, is_split: false });
      setTab('recategorize');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function updateSplit(idx: number, field: keyof Split, value: string) {
    setSplits(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  function addSplit() {
    setSplits(prev => [...prev, { amount: '0.00', category: transaction.category ?? '', subcategory: transaction.subcategory ?? '', note: '' }]);
  }

  function removeSplit(idx: number) {
    setSplits(prev => prev.filter((_, i) => i !== idx));
  }

  const isIncome = transaction.transaction_type === 'Income';
  const availableCategories = categoriesForType(transaction.transaction_type);
  const availableSubs = CATEGORY_SUBCATEGORIES[category] ?? [];

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
    background: 'var(--t-bg)', border: '1px solid var(--t-border)',
    color: 'var(--t-text-primary)', outline: 'none', boxSizing: 'border-box',
  };

  const btnPrimary: React.CSSProperties = {
    padding: '10px 20px', borderRadius: 8, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
    background: 'var(--t-card-accent)', color: '#fff', fontWeight: 700, fontSize: 13,
    opacity: saving ? 0.6 : 1, transition: 'opacity 0.15s',
  };

  const btnSecondary: React.CSSProperties = {
    padding: '10px 16px', borderRadius: 8, border: '1px solid var(--t-border)', cursor: 'pointer',
    background: 'transparent', color: 'var(--t-text-secondary)', fontWeight: 600, fontSize: 13,
  };

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 1000, transition: 'opacity 0.2s',
      }} />

      {/* Drawer */}
      <div ref={drawerRef} style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
        background: 'var(--t-surface-raised)', zIndex: 1001,
        boxShadow: '-8px 0 40px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.22s ease',
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--t-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t-text-primary)', marginBottom: 2 }}>
                {transaction.merchant || 'Transaction'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)' }}>
                {transaction.date} · {transaction.accountName ?? ''}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                fontSize: 18, fontWeight: 800,
                color: isIncome ? 'var(--t-green)' : 'var(--t-red)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {isIncome ? '+' : '-'}${fmt(transaction.amount)}
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--t-text-tertiary)', lineHeight: 1 }}>✕</button>
            </div>
          </div>

          {/* Status badges */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {transaction.is_manually_categorized && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(46,211,198,0.12)', border: '1px solid rgba(46,211,198,0.3)', color: 'var(--t-card-accent)' }}>
                ✎ Edited
              </span>
            )}
            {transaction.is_split && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(77,163,255,0.12)', border: '1px solid rgba(77,163,255,0.3)', color: 'var(--t-primary)' }}>
                ⊕ Split
              </span>
            )}
            {transaction.pending && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)', color: '#ca8a04' }}>
                Pending
              </span>
            )}
            {transaction.isRecurring && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#7c3aed' }}>
                ↻ Recurring
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--t-border)', padding: '0 24px' }}>
          {(['recategorize', 'split'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              color: tab === t ? 'var(--t-card-accent)' : 'var(--t-text-tertiary)',
              borderBottom: tab === t ? '2px solid var(--t-card-accent)' : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.15s', textTransform: 'capitalize',
            }}>
              {t === 'recategorize' ? 'Recategorize' : 'Split Transaction'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* ── RECATEGORIZE TAB ── */}
          {tab === 'recategorize' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                  Category
                </label>
                <select value={category} onChange={e => { setCategory(e.target.value); setSub(''); }} style={inputStyle}>
                  {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                  Subcategory
                </label>
                <select value={subcategory} onChange={e => setSub(e.target.value)} style={inputStyle}>
                  <option value="">— None —</option>
                  {availableSubs.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Original category for reference */}
              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--t-inner-box-bg)', border: '1px solid var(--t-inner-box-border)', fontSize: 12, color: 'var(--t-text-tertiary)' }}>
                Originally: <span style={{ fontWeight: 600, color: 'var(--t-text-secondary)' }}>{transaction.category}</span>
                {transaction.subcategory && transaction.subcategory !== transaction.category && (
                  <> › <span style={{ fontWeight: 600, color: 'var(--t-text-secondary)' }}>{transaction.subcategory}</span></>
                )}
              </div>
            </div>
          )}

          {/* ── SPLIT TAB ── */}
          {tab === 'split' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginBottom: 4 }}>
                Divide <span style={{ fontWeight: 700, color: 'var(--t-text-primary)' }}>${fmt(transaction.amount)}</span> across multiple categories.
              </div>

              {splits.map((sp, idx) => (
                <div key={idx} style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--t-inner-box-bg)', border: '1px solid var(--t-inner-box-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Line {idx + 1}
                    </span>
                    {splits.length > 2 && (
                      <button onClick={() => removeSplit(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--t-text-tertiary)' }}>✕</button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t-text-tertiary)', display: 'block', marginBottom: 4 }}>Amount</label>
                      <input
                        type="number" step="1"
                        value={sp.amount}
                        onChange={e => updateSplit(idx, 'amount', e.target.value)}
                        style={{ ...inputStyle, textAlign: 'right' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t-text-tertiary)', display: 'block', marginBottom: 4 }}>Category</label>
                      <select value={sp.category} onChange={e => { updateSplit(idx, 'category', e.target.value); updateSplit(idx, 'subcategory', ''); }} style={inputStyle}>
                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t-text-tertiary)', display: 'block', marginBottom: 4 }}>Subcategory (optional)</label>
                    <select value={sp.subcategory} onChange={e => updateSplit(idx, 'subcategory', e.target.value)} style={inputStyle}>
                      <option value="">— None —</option>
                      {(CATEGORY_SUBCATEGORIES[sp.category] ?? []).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t-text-tertiary)', display: 'block', marginBottom: 4 }}>Note (optional)</label>
                    <input
                      type="text" value={sp.note} placeholder="e.g. auto part for truck"
                      onChange={e => updateSplit(idx, 'note', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              ))}

              {/* Running total */}
              <div style={{ padding: '10px 14px', borderRadius: 8, background: Math.round(remaining * 100) === 0 ? 'rgba(46,211,198,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${Math.round(remaining * 100) === 0 ? 'rgba(46,211,198,0.25)' : 'rgba(239,68,68,0.25)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--t-text-tertiary)' }}>
                  {Math.round(remaining * 100) === 0 ? '✓ Fully allocated' : remaining > 0 ? `$${fmt(remaining)} remaining` : `Over by $${fmt(Math.abs(remaining))}`}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: Math.round(remaining * 100) === 0 ? 'var(--t-card-accent)' : 'var(--t-red)' }}>
                  ${fmt(totalSplit)} / ${fmt(absAmount)}
                </span>
              </div>

              <button onClick={addSplit} style={{ ...btnSecondary, textAlign: 'center', width: '100%' }}>
                + Add Line
              </button>

              {transaction.is_split && (
                <button onClick={removeSplits} style={{ ...btnSecondary, textAlign: 'center', width: '100%', color: 'var(--t-red)', borderColor: 'rgba(239,68,68,0.3)' }}>
                  Remove Splits
                </button>
              )}
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 12, color: 'var(--t-red)' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--t-border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          {tab === 'recategorize' && (
            <button onClick={saveCategory} disabled={saving} style={btnPrimary}>
              {saving ? 'Saving…' : 'Save Category'}
            </button>
          )}
          {tab === 'split' && (
            <button onClick={saveSplits} disabled={saving || !splitValid} style={{ ...btnPrimary, opacity: (saving || !splitValid) ? 0.5 : 1 }}>
              {saving ? 'Saving…' : 'Save Splits'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
