'use client';

import { useState } from 'react';
import StickyDateHeader from './StickyDateHeader';
import CategoryPill from './CategoryPill';
import TransactionEditDrawer from './TransactionEditDrawer';
import { getTxEmoji } from '../../lib/taxonomy-emojis';
import { isInflow } from '../../lib/financialengine/cashflow/utils/transactiondirection';

export default function TransactionFeed({ groupedTransactions, onTransactionUpdated }: any) {
  const [editing, setEditing] = useState<any>(null);

  function handleSaved(updated: any) {
    if (onTransactionUpdated) onTransactionUpdated(updated);
  }

  return (
    <>
      <div>
        {Object.entries(groupedTransactions).map(([date, items]: any) => (
          <div key={date} style={{ color: 'var(--t-text-primary)', marginBottom: '28px' }}>
            <StickyDateHeader label={date} />

            {items.map((t: any) => {
              const isIncome = isInflow(t);
              const showSub  = t.subcategory && t.subcategory !== t.category;
              const txEmoji  = getTxEmoji(t.subcategory, t.category);
              const toTitleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
              const accountLabel = toTitleCase(t.accountName || t.institution || '');

              return (
                <div key={`${t.id}-${t.date}`}>
                  {/* Main transaction row */}
                  <div
                    onClick={() => setEditing(t)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--t-inner-box-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 200px 160px 130px 1fr 120px auto',
                      alignItems: 'center',
                      gap: '0 12px',
                      padding: '10px 10px',
                      borderBottom: '1px solid var(--t-border)',
                      cursor: 'pointer',
                      borderRadius: 8,
                      transition: 'background 0.12s ease',
                      background: 'transparent',
                    }}
                  >
                    {/* Avatar / logo */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'var(--t-bg)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', fontSize: 16,
                    }}>
                      {t.logo
                        ? <img src={t.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : txEmoji}
                    </div>

                    {/* Merchant */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--t-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.merchant || 'Transaction'}
                      </div>
                      {t.is_manually_categorized && !t.is_split && (
                        <span title="Manually categorized" style={{ fontSize: 10, color: 'var(--t-card-accent)', flexShrink: 0 }}>✎</span>
                      )}
                      {t.is_split && (
                        <span title="Split transaction" style={{ fontSize: 10, color: 'var(--t-primary)', flexShrink: 0 }}>⊕</span>
                      )}
                    </div>

                    {/* Account */}
                    <div style={{ fontSize: 13, color: 'var(--t-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {accountLabel || '—'}
                    </div>

                    {/* Category */}
                    <div style={{ fontSize: 13, color: 'var(--t-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.is_split ? <span style={{ color: 'var(--t-primary)', fontWeight: 600 }}>Split</span> : (t.category || '—')}
                    </div>

                    {/* Subcategory with emoji */}
                    <div style={{ fontSize: 13, color: 'var(--t-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {!t.is_split && showSub && (
                        <>
                          <span style={{ fontSize: 14, lineHeight: 1 }}>{txEmoji}</span>
                          <span>{t.subcategory}</span>
                        </>
                      )}
                    </div>

                    {/* Status pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {t.isRecurring && <CategoryPill label="Recurring" variant="recurring" />}
                      {t.pending     && <CategoryPill label="Pending"   variant="pending"   />}
                    </div>

                    {/* Amount */}
                    <div style={{
                      fontWeight: 700, fontSize: 15, textAlign: 'right',
                      color: isIncome ? '#15803d' : '#c0392b',
                      fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                    }}>
                      {isIncome ? '+' : '-'}${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Split lines */}
                  {t.is_split && t.splits && t.splits.length > 0 && (
                    <div style={{ paddingLeft: 58, paddingBottom: 6 }}>
                      {t.splits.map((sp: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 10px 5px 0', borderBottom: idx < t.splits.length - 1 ? '1px dashed var(--t-border)' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 2, height: 16, borderRadius: 1, background: 'var(--t-card-accent)', opacity: 0.5 }} />
                            <span style={{ fontSize: 13 }}>{getTxEmoji(sp.subcategory, sp.category)}</span>
                            <span style={{ fontSize: 11, color: 'var(--t-text-secondary)', fontWeight: 500 }}>{sp.category}</span>
                            {sp.subcategory && sp.subcategory !== sp.category && (
                              <span style={{ fontSize: 10, color: 'var(--t-text-tertiary)', background: 'var(--t-inner-box-bg)', padding: '1px 6px', borderRadius: 4 }}>{sp.subcategory}</span>
                            )}
                            {sp.note && <span style={{ fontSize: 10, color: 'var(--t-text-tertiary)' }}>· {sp.note}</span>}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                            ${parseFloat(sp.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <TransactionEditDrawer
        transaction={editing}
        onClose={() => setEditing(null)}
        onSaved={handleSaved}
      />
    </>
  );
}
