'use client';

import { useState } from 'react';
import TransactionEditDrawer from './TransactionEditDrawer';
import { getTxEmoji } from '../../lib/taxonomy-emojis';
import { isInflow } from '../../lib/financialengine/cashflow/utils/transactiondirection';

/*
  Mobile-first transaction list.
  Desktop TransactionFeed renders a 7-column grid; on a phone that collapses
  into noise. This renders each transaction as a stacked card row:
    [emoji/logo]  Merchant            +$1,234.56
                  Category · Account   Pending
  Tap opens the same TransactionEditDrawer used on desktop.
*/

const N = {
  card:   '#172554',
  border: 'rgba(255,255,255,0.08)',
  text:   '#ffffff',
  muted:  'rgba(255,255,255,0.55)',
  faint:  'rgba(255,255,255,0.35)',
  green:  '#34D399',
  red:    '#F87171',
  gold:   '#2ED3C6',
};

function formatDateHeader(dateKey: string) {
  // group keys arrive as either 'yyyy-MM-dd' or Date.toDateString() ("Fri Jul 11 2025")
  let date: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    const [y, m, d] = dateKey.split('-').map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(dateKey);
  }
  if (isNaN(date.getTime())) return dateKey;
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function MobileTransactionList({
  groupedTransactions,
  onTransactionUpdated,
  initialLimit = 25,
}: {
  groupedTransactions: Record<string, any[]>;
  onTransactionUpdated?: (t: any) => void;
  initialLimit?: number;
}) {
  const [editing, setEditing] = useState<any>(null);
  const [limit, setLimit] = useState(initialLimit);

  const entries = Object.entries(groupedTransactions);
  const totalCount = entries.reduce((s, [, items]) => s + (items as any[]).length, 0);

  // trim groups so at most `limit` rows render
  let remaining = limit;
  const visible: [string, any[]][] = [];
  for (const [date, items] of entries) {
    if (remaining <= 0) break;
    const slice = (items as any[]).slice(0, remaining);
    visible.push([date, slice]);
    remaining -= slice.length;
  }

  return (
    <>
      <div>
        {visible.map(([date, items]) => (
          <div key={date} style={{ marginBottom: 4 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'var(--t-text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '12px 2px 8px',
            }}>
              {formatDateHeader(date)}
            </div>

            <div style={{ background: N.card, borderRadius: 14, border: `1px solid ${N.border}`, overflow: 'hidden' }}>
              {items.map((t: any, idx: number) => {
                const income = isInflow(t);
                const txEmoji = getTxEmoji(t.subcategory, t.category);
                const sub = !t.is_split && t.subcategory && t.subcategory !== t.category ? t.subcategory : null;
                return (
                  <div
                    key={`${t.id}-${t.date}`}
                    onClick={() => setEditing(t)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px',
                      borderBottom: idx < items.length - 1 ? `1px solid ${N.border}` : 'none',
                      cursor: 'pointer',
                      minHeight: 44,
                    }}
                  >
                    {/* Logo / emoji */}
                    <div style={{
                      width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                      background: 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', fontSize: 17,
                    }}>
                      {t.logo
                        ? <img src={t.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : txEmoji}
                    </div>

                    {/* Merchant + category */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600, color: N.text,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.merchant || 'Transaction'}</span>
                        {t.is_split && <span style={{ fontSize: 10, color: N.gold, flexShrink: 0 }}>⊕</span>}
                        {t.is_manually_categorized && !t.is_split && <span style={{ fontSize: 10, color: N.gold, flexShrink: 0 }}>✎</span>}
                      </div>
                      <div style={{
                        fontSize: 12, color: N.muted, marginTop: 2,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {t.is_split ? 'Split' : (t.category || '—')}{sub ? ` · ${sub}` : ''}
                      </div>
                    </div>

                    {/* Amount + badges */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 700,
                        color: income ? N.green : N.text,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {income ? '+' : '-'}${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      {(t.pending || t.isRecurring) && (
                        <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2, color: t.pending ? '#FBBF24' : N.faint }}>
                          {t.pending ? '● Pending' : '↻ Recurring'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {totalCount > limit && (
          <button
            onClick={() => setLimit(l => l + 25)}
            style={{
              width: '100%', marginTop: 12, padding: '13px 0',
              borderRadius: 14, border: `1px solid ${N.border}`,
              background: N.card, color: N.gold,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Show more ({totalCount - limit} remaining)
          </button>
        )}

        {totalCount === 0 && (
          <div style={{ textAlign: 'center', color: N.muted, fontSize: 13, padding: '28px 0' }}>
            No transactions for this period.
          </div>
        )}
      </div>

      <TransactionEditDrawer
        transaction={editing}
        onClose={() => setEditing(null)}
        onSaved={(u: any) => { if (onTransactionUpdated) onTransactionUpdated(u); }}
      />
    </>
  );
}
