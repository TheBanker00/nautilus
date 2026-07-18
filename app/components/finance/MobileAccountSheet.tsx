'use client';

import React from 'react';
import MobileScrubChart from './MobileScrubChart';

/*
  Bottom sheet showing detail for a single asset or liability account.
  Slides up from the bottom (same pattern as the transaction editor sheet):
  current value, change vs last month, scrubbable balance history, and for
  liabilities: APR, monthly payment, and estimated payoff date.
*/

const MN = {
  sheet:  '#0F2044',
  card:   '#172554',
  border: 'rgba(255,255,255,0.10)',
  text:   '#ffffff',
  muted:  'rgba(255,255,255,0.55)',
  faint:  'rgba(255,255,255,0.35)',
  green:  '#34D399',
  red:    '#F87171',
  gold:   '#2ED3C6',
};

const fmt = (n: number) => '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

export interface AccountSheetData {
  name: string;
  subtitle?: string;          // institution / address / asset type
  icon: string;               // emoji
  color: string;              // category color
  value: number;              // current balance / value / amount owed
  isLiability?: boolean;
  interestRate?: number;      // liabilities: APR %
  paymentAmount?: number;     // liabilities: monthly payment
  history: { label: string; value: number }[];  // oldest → newest
}

/* months to pay off a balance at a given APR and monthly payment */
function payoffMonths(balance: number, aprPct: number, payment: number): number | null {
  if (balance <= 0 || payment <= 0) return null;
  const r = aprPct / 100 / 12;
  if (r === 0) return Math.ceil(balance / payment);
  if (payment <= balance * r) return null; // payment doesn't cover interest
  return Math.ceil(-Math.log(1 - (r * balance) / payment) / Math.log(1 + r));
}

function moLabel(mo: number) {
  const y = Math.floor(mo / 12), m = mo % 12;
  if (y === 0) return `${m} mo`;
  if (m === 0) return `${y} yr`;
  return `${y} yr ${m} mo`;
}

export default function MobileAccountSheet({ account, onClose }: {
  account: AccountSheetData | null;
  onClose: () => void;
}) {
  if (!account) return null;

  const hist = account.history;
  const prior = hist.length >= 2 ? hist[hist.length - 2].value : null;
  const change = prior != null ? account.value - prior : null;
  const changePct = prior && prior !== 0 && change != null ? (change / Math.abs(prior)) * 100 : null;
  // for liabilities, balance going DOWN is good
  const changeGood = change != null && (account.isLiability ? change <= 0 : change >= 0);

  const payoff = account.isLiability && account.interestRate != null && account.paymentAmount
    ? payoffMonths(account.value, account.interestRate, account.paymentAmount)
    : null;
  const payoffDate = payoff != null ? (() => {
    const d = new Date(); d.setMonth(d.getMonth() + payoff);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  })() : null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      }} />

      {/* Sheet — stop touch propagation so page-level swipe nav doesn't fire underneath */}
      <div
        onTouchStart={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}
        style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, maxHeight: '85dvh',
        background: MN.sheet, zIndex: 1001,
        borderRadius: '20px 20px 0 0',
        border: `1px solid ${MN.border}`, borderBottom: 'none',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column',
        animation: 'acctSheetUp 0.25s ease',
        paddingBottom: 'env(safe-area-inset-bottom)',
        color: MN.text, fontFamily: 'var(--font-body)',
        overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        <style>{`@keyframes acctSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        {/* Drag handle */}
        <div onClick={onClose} style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.25)' }} />
        </div>

        <div style={{ padding: '8px 18px 20px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: `${account.color}22`, border: `1px solid ${account.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21,
            }}>{account.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: MN.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.name}</div>
              {account.subtitle && <div style={{ fontSize: 12, color: MN.faint, marginTop: 1 }}>{account.subtitle}</div>}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: MN.muted, lineHeight: 1, padding: 6 }}>✕</button>
          </div>

          {/* Current value + change */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(46,211,198,0.75)', marginBottom: 4 }}>
              {account.isLiability ? 'Current Balance Owed' : 'Current Value'}
            </div>
            <div style={{
              fontSize: 36, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em',
              backgroundImage: `linear-gradient(135deg, #ffffff 0%, ${MN.gold} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              marginBottom: 8,
            }}>
              {fmt(account.value)}
            </div>
            {change != null && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: changeGood ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                border: `1px solid ${changeGood ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}`,
                borderRadius: 100, padding: '4px 11px',
                fontSize: 12, fontWeight: 700, color: changeGood ? MN.green : MN.red,
              }}>
                {change >= 0 ? '▲' : '▼'} {fmt(change)}{changePct != null ? ` (${Math.abs(changePct).toFixed(1)}%)` : ''}
                <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>vs last month</span>
              </div>
            )}
          </div>

          {/* Scrubbable balance history */}
          {hist.length >= 2 ? (
            <MobileScrubChart
              data={hist}
              height={80}
              formatValue={v => fmt(v)}
            />
          ) : (
            <div style={{ fontSize: 12, color: MN.faint, padding: '16px 0', textAlign: 'center' }}>
              Not enough history yet — check back after the next monthly snapshot.
            </div>
          )}

          {/* Liability details */}
          {account.isLiability && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 16 }}>
              <div style={{ background: MN.card, borderRadius: 14, border: `1px solid ${MN.border}`, padding: '12px 10px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: MN.muted, marginBottom: 5 }}>APR</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: MN.text }}>
                  {account.interestRate != null && account.interestRate > 0 ? `${account.interestRate}%` : '—'}
                </div>
              </div>
              <div style={{ background: MN.card, borderRadius: 14, border: `1px solid ${MN.border}`, padding: '12px 10px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: MN.muted, marginBottom: 5 }}>Payment</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: MN.text }}>
                  {account.paymentAmount ? `${fmt(account.paymentAmount)}/mo` : '—'}
                </div>
              </div>
              <div style={{ background: MN.card, borderRadius: 14, border: `1px solid ${MN.border}`, padding: '12px 10px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: MN.muted, marginBottom: 5 }}>Paid Off</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: payoff != null ? MN.gold : MN.muted }}>
                  {payoff != null ? payoffDate : '—'}
                </div>
                {payoff != null && <div style={{ fontSize: 9, color: MN.faint, marginTop: 2 }}>{moLabel(payoff)}</div>}
              </div>
            </div>
          )}
          {account.isLiability && payoff == null && account.value > 0 && (account.paymentAmount ?? 0) > 0 && (
            <div style={{ fontSize: 11, color: MN.red, marginTop: 8 }}>
              ⚠ Current payment doesn't cover monthly interest — the balance won't decrease.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
