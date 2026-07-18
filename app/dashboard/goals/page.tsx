'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { showToast } from '../../components/finance/toast';
import { useFinancialData as useWealthData } from '../../lib/financialdatacontext';
import { useFinancialData as useFlowData }   from '../../lib/hooks/usefinancialdata';
import {
  type FundingStrategy, type GoalPriority, type GoalCategoryKey,
  type LifeGoal, type TrackAnalysis,
  GOAL_CATS, PRESET_COLORS, GOAL_EMOJIS, WIZARD_CATS,
  trackAnalysis, monthsUntil, addMonths, fmtMonthYear, fmtShortDate,
  calcMonthlyPayment, futureValueInvested, monthDiff,
  fmt, fmtShort,
} from '../../lib/goals';
import {
  type PurchaseType, type PurchaseCategory,
  PURCHASE_CATS, analyzeCashPurchase, analyzeFinancePurchase,
  analyzeDownPaymentReadiness, analyzeBudgetReadiness,
} from '../../lib/purchaseanalyzer';

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────── */
const T = {
  bg:            '#EDF0F7',
  surface:       '#FFFFFF',
  border:        '#E2E8F0',
  borderMed:     '#CBD5E1',
  shadow:        '0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
  shadowMd:      '0 4px 16px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
  textPrimary:   '#0F172A',
  textSecondary: '#475569',
  textTertiary:  '#64748B',
  primary:       '#0a3fa8',
  primaryBg:     'rgba(10,63,168,0.08)',
  primaryBorder: 'rgba(10,63,168,0.28)',
  green:         '#16A34A',
  greenBg:       '#F0FDF4',
  greenBorder:   '#BBF7D0',
  greenText:     '#15803D',
  red:           '#DC2626',
  redBg:         '#FEF2F2',
  redBorder:     '#FECACA',
  redText:       '#B91C1C',
  amber:         '#D97706',
  amberBg:       '#FFFBEB',
  amberBorder:   '#FDE68A',
  amberText:     '#B45309',
  purple:        '#7C3AED',
  purpleBg:      '#F5F3FF',
  purpleBorder:  '#DDD6FE',
  purpleText:    '#6D28D9',
  teal:          '#0891B2',
  tealBg:        '#ECFEFF',
  tealBorder:    '#A5F3FC',
  tealText:      '#0E7490',
  radius:        '12px',
  radiusSm:      '6px',
  radiusMd:      '8px',
};

/* ─────────────────────────────────────────────────────────────
   SHARED UI
───────────────────────────────────────────────────────────── */
function ProgressBar({ pct, color, height = 8 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ height, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, pct))}%`, background: color, borderRadius: 100, transition: 'width 0.4s ease' }} />
    </div>
  );
}

function Pill({ children, color, bg, border }: { children: React.ReactNode; color: string; bg: string; border?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 100, background: bg, color, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', border: border ? `1px solid ${border}` : undefined }}>
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   SVG RING PROGRESS
───────────────────────────────────────────────────────────── */
function RingProgress({ pct, color, size = 72 }: { pct: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={'var(--t-border)'} strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   FUNDING STRATEGY DISPLAY
───────────────────────────────────────────────────────────── */
const STRATEGY_META: Record<FundingStrategy, { icon: string; label: string; color: string; bg: string; border: string }> = {
  monthly:     { icon: '📅', label: 'Monthly Savings',    color: 'var(--t-primary)',     bg: 'var(--t-primary-bg)',  border: 'var(--t-primary-border)' },
  cash:        { icon: '💰', label: 'Existing Cash',      color: 'var(--t-green-text)',  bg: 'var(--t-green-bg)',   border: 'var(--t-green-border)' },
  investments: { icon: '📈', label: 'Investments',        color: 'var(--t-purple-text)', bg: 'var(--t-purple-bg)',  border: 'var(--t-purple-border)' },
  hybrid:      { icon: '⚡', label: 'Hybrid',             color: 'var(--t-amber-text)',  bg: 'var(--t-amber-bg)',   border: 'var(--t-amber-border)' },
  debt:        { icon: '🏦', label: 'Debt Financing',     color: 'var(--t-teal-text)',   bg: 'var(--t-teal-bg)',    border: 'var(--t-teal-border)' },
};

function FundingStrategyDisplay({ goal, monthsLeft }: { goal: LifeGoal; monthsLeft: number }) {
  const strategy = goal.fundingStrategy ?? 'monthly';
  const meta = STRATEGY_META[strategy];

  const items: { label: string; value: string; color?: string }[] = [];

  if (strategy === 'monthly') {
    if (goal.monthlyContrib > 0) items.push({ label: 'Monthly', value: `${fmt(goal.monthlyContrib)}/mo` });
    if (goal.monthlyContrib > 0) {
      const rem = Math.max(0, goal.targetAmount - goal.currentSaved);
      const proj = rem > 0 ? Math.ceil(rem / goal.monthlyContrib) : 0;
      items.push({ label: 'Projected', value: proj > 0 ? fmtMonthYear(addMonths(new Date(), proj)) : '✓ Done' });
    }
  } else if (strategy === 'cash') {
    const allocated = goal.allocatedCash ?? goal.currentSaved;
    items.push({ label: 'Allocated', value: fmt(allocated), color: 'var(--t-green-text)' });
    items.push({ label: 'Status', value: allocated >= goal.targetAmount ? '✓ Fully Funded' : `${Math.round(allocated / goal.targetAmount * 100)}% covered`, color: allocated >= goal.targetAmount ? 'var(--t-green-text)' : undefined });
  } else if (strategy === 'investments') {
    const inv = goal.allocatedInvestment ?? 0;
    items.push({ label: 'Invested', value: fmt(inv) });
    if (inv > 0 && monthsLeft > 0) {
      const fv = futureValueInvested(inv, 8, monthsLeft);
      items.push({ label: 'Est. @ target', value: fmt(fv), color: fv >= goal.targetAmount ? 'var(--t-green-text)' : 'var(--t-amber-text)' });
    }
  } else if (strategy === 'hybrid') {
    if (goal.allocatedCash) items.push({ label: 'Cash', value: fmt(goal.allocatedCash) });
    if (goal.allocatedInvestment) items.push({ label: 'Invested', value: fmt(goal.allocatedInvestment) });
    if (goal.monthlyContrib > 0) items.push({ label: '+Monthly', value: `${fmt(goal.monthlyContrib)}/mo` });
  } else if (strategy === 'debt') {
    if (goal.debtRate && goal.debtTermMonths) {
      const pmt = calcMonthlyPayment(goal.targetAmount, goal.debtRate, goal.debtTermMonths);
      items.push({ label: 'Payment', value: `${fmt(pmt)}/mo` });
      items.push({ label: 'Rate / Term', value: `${goal.debtRate}% · ${goal.debtTermMonths}mo` });
    }
  }

  return (
    <div style={{ marginTop: 10, padding: '9px 12px', borderRadius: T.radiusMd, background: meta.bg, border: `1px solid ${meta.border}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: meta.color, letterSpacing: '0.05em', marginBottom: 5 }}>
        {meta.icon} {meta.label.toUpperCase()}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {items.map(item => (
          <div key={item.label}>
            <div style={{ fontSize: 9, color: 'var(--t-text-tertiary)', fontWeight: 600, letterSpacing: '0.04em' }}>{item.label.toUpperCase()}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: item.color ?? 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   GOAL WIZARD (5-step, replaces GoalForm)
───────────────────────────────────────────────────────────── */

function GoalWizard({ initial, onSave, onCancel, defaultCashBalance, defaultMonthlyExpenses, saving }: {
  initial?: LifeGoal | null;
  onSave: (g: LifeGoal) => void;
  onCancel: () => void;
  defaultCashBalance: number;
  defaultMonthlyExpenses: number;
  saving?: boolean;
}) {
  const startStep = initial ? 1 : 0;
  const [step,       setStep]      = useState(startStep);
  const [cat,        setCat]       = useState<GoalCategoryKey>(initial?.category ?? 'custom');
  const [name,       setName]      = useState(initial?.name ?? '');
  const [emoji,      setEmoji]     = useState(initial?.emoji ?? '⭐');
  const [color,      setColor]     = useState(initial?.color ?? PRESET_COLORS[3]);
  const [priority,   setPriority]  = useState<GoalPriority>(initial?.priority ?? 'medium');
  const [notes,      setNotes]     = useState(initial?.notes ?? '');
  const [target,     setTarget]    = useState(initial?.targetAmount ?? 0);
  const [saved,      setSaved]     = useState(initial?.currentSaved ?? 0);
  const [targetDate, setTargetDate]= useState(initial?.targetDate ?? '');
  const [strategy,   setStrategy]  = useState<FundingStrategy>(initial?.fundingStrategy ?? 'monthly');
  const [contrib,    setContrib]   = useState(initial?.monthlyContrib ?? 0);
  const [allocCash,  setAllocCash] = useState(initial?.allocatedCash ?? 0);
  const [allocInv,   setAllocInv]  = useState(initial?.allocatedInvestment ?? 0);
  const [debtRate,   setDebtRate]  = useState(initial?.debtRate ?? 6.5);
  const [debtTerm,   setDebtTerm]  = useState(initial?.debtTermMonths ?? 60);
  const [homePrice,  setHomePrice] = useState(initial?.homePrice ?? 0);
  const [downPct,    setDownPct]   = useState(initial?.downPaymentPct ?? 20);
  const [childName,  setChildName] = useState(initial?.childName ?? '');
  const [childAge,   setChildAge]  = useState(initial?.childAge ?? 0);
  const [emMonths,   setEmMonths]  = useState<3|6|12>(initial?.emergencyMonths ?? 3);

  // Auto-fill from category on new goals
  useEffect(() => {
    if (initial) return;
    const meta = GOAL_CATS[cat];
    setEmoji(meta.emoji); setColor(meta.defaultColor); setName(meta.label);
  }, [cat, initial]);

  useEffect(() => {
    if (cat !== 'home' || homePrice <= 0) return;
    setTarget(Math.round(homePrice * downPct / 100 + homePrice * 0.03));
  }, [cat, homePrice, downPct]);

  useEffect(() => {
    if (cat !== 'emergency' || defaultMonthlyExpenses <= 0) return;
    setTarget(Math.round(defaultMonthlyExpenses * emMonths));
    setSaved(Math.round(defaultCashBalance));
  }, [cat, emMonths, defaultMonthlyExpenses, defaultCashBalance]);

  useEffect(() => {
    if (cat !== 'education' || childAge <= 0) return;
    const d = new Date(); d.setFullYear(d.getFullYear() + Math.max(0, 18 - childAge));
    setTargetDate(d.toISOString().split('T')[0]);
  }, [cat, childAge]);

  const monthsLeft      = targetDate ? monthsUntil(targetDate) : 0;
  // Remaining after already-saved + any lump sums the user has allocated
  const remaining       = Math.max(0, target - saved
    - ((strategy === 'cash' || strategy === 'hybrid') ? allocCash : 0)
    - ((strategy === 'investments' || strategy === 'hybrid') ? allocInv : 0));
  const requiredMonthly = monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : 0;

  // Auto-populate monthly contribution when strategy or inputs change
  // Only auto-fill for strategies that involve monthly savings; don't clobber
  // a value the user typed manually (only fire on strategy change or when
  // entering step 4 from step 3 on a new goal).
  useEffect(() => {
    if (strategy !== 'monthly' && strategy !== 'hybrid') return;
    if (requiredMonthly <= 0) return;
    setContrib(requiredMonthly);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategy, allocCash, allocInv, target, saved, targetDate]);

  const STEPS = initial ? ['Details', 'Amount', 'Date', 'Funding'] : ['Category', 'Details', 'Amount', 'Date', 'Funding'];
  const dispIdx = initial ? step - 1 : step;

  const canProceed = [true, !!name, target > 0, !!targetDate, true][step] ?? true;

  const iStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: `1px solid var(--t-border-med)`,
    borderRadius: T.radiusMd, fontSize: 13, color: 'var(--t-text-primary)',
    outline: 'none', boxSizing: 'border-box', background: 'var(--t-surface)',
  };

  const dollarInput = (value: number, onChange: (v: number) => void, placeholder = '0') => (
    <div style={{ display: 'flex', border: `1px solid var(--t-border-med)`, borderRadius: T.radiusMd, overflow: 'hidden' }}>
      <span style={{ padding: '9px 12px', background: 'var(--t-bg)', fontSize: 13, color: 'var(--t-text-tertiary)', borderRight: `1px solid var(--t-border-med)`, flexShrink: 0 }}>$</span>
      <input
        type="text"
        inputMode="numeric"
        value={value > 0 ? value.toLocaleString('en-US', { maximumFractionDigits: 0 }) : ''}
        placeholder={placeholder}
        onChange={e => {
          const raw = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '');
          onChange(raw === '' ? 0 : Number(raw));
        }}
        style={{ flex: 1, padding: '9px 12px', border: 'none', outline: 'none', fontSize: 13, color: 'var(--t-text-primary)', background: 'transparent', fontVariantNumeric: 'tabular-nums', minWidth: 0 }}
      />
    </div>
  );

  function handleSave() {
    const id = initial?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    onSave({
      id, category: cat, name, emoji, color,
      targetAmount: target, currentSaved: saved,
      monthlyContrib: (strategy === 'monthly' || strategy === 'hybrid') ? contrib : 0,
      targetDate, notes,
      fundingStrategy: strategy, priority,
      ...(allocCash > 0       && { allocatedCash: allocCash }),
      ...(allocInv > 0        && { allocatedInvestment: allocInv }),
      ...(strategy === 'debt' && { debtRate, debtTermMonths: debtTerm }),
      ...(cat === 'home'      && { homePrice, downPaymentPct: downPct }),
      ...(cat === 'education' && { childName, childAge }),
      ...(cat === 'emergency' && { emergencyMonths: emMonths }),
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      ...(initial?.completedAt && { completedAt: initial.completedAt }),
    });
  }

  return (
    <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `2px solid var(--t-primary-border)`, boxShadow: 'var(--t-shadow-md)', padding: '24px 26px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)' }}>{initial ? 'Edit Goal' : 'New Life Goal'}</div>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-text-tertiary)', fontSize: 18, padding: 4 }}>✕</button>
      </div>

      {/* Step tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 22, borderRadius: T.radiusMd, overflow: 'hidden', border: `1px solid var(--t-border)` }}>
        {STEPS.map((label, i) => {
          const done   = i < dispIdx;
          const active = i === dispIdx;
          const goStep = initial ? i + 1 : i;
          return (
            <button key={label} onClick={() => done ? setStep(goStep) : undefined}
              style={{
                flex: 1, padding: '8px 4px', border: 'none',
                borderRight: i < STEPS.length - 1 ? `1px solid var(--t-border)` : 'none',
                background: active ? 'var(--t-primary)' : done ? 'var(--t-primary-bg)' : 'var(--t-bg)',
                color: active ? '#fff' : done ? 'var(--t-primary)' : 'var(--t-text-tertiary)',
                fontSize: 11, fontWeight: active ? 700 : 500, cursor: done ? 'pointer' : 'default', transition: 'all 0.15s',
              }}>
              {done ? '✓ ' : ''}{label}
            </button>
          );
        })}
      </div>

      {/* Step 0 — Category */}
      {step === 0 && !initial && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', marginBottom: 10 }}>WHAT ARE YOU WORKING TOWARD?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {WIZARD_CATS.map(k => {
              const meta = GOAL_CATS[k]; const sel = cat === k;
              return (
                <button key={k} onClick={() => { setCat(k); setStep(1); }} style={{
                  padding: '13px 8px', borderRadius: T.radiusMd, border: `2px solid ${sel ? meta.defaultColor : 'var(--t-border)'}`,
                  background: sel ? `${meta.defaultColor}12` : 'var(--t-surface)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 5 }}>{meta.emoji}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: sel ? meta.defaultColor : 'var(--t-text-primary)', lineHeight: 1.3 }}>{meta.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 1 — Details */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>GOAL NAME</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={`e.g. ${GOAL_CATS[cat].label}`} style={iStyle} autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', marginBottom: 7 }}>ICON</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {GOAL_EMOJIS.map(em => (
                  <button key={em} onClick={() => setEmoji(em)} style={{
                    width: 32, height: 32, borderRadius: T.radiusSm, border: `2px solid ${emoji === em ? color : 'var(--t-border)'}`,
                    background: emoji === em ? `${color}15` : 'var(--t-surface)', cursor: 'pointer', fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{em}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', marginBottom: 7 }}>COLOR</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{
                    width: 26, height: 26, borderRadius: '50%', background: c,
                    border: `3px solid ${color === c ? 'var(--t-text-primary)' : 'transparent'}`, cursor: 'pointer', flexShrink: 0,
                  }} />
                ))}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', marginBottom: 7 }}>PRIORITY</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {([['high','🔴','High'],['medium','🟡','Medium'],['low','🟢','Low']] as [GoalPriority,string,string][]).map(([p, dot, lbl]) => (
                  <button key={p} onClick={() => setPriority(p)} style={{
                    flex: 1, padding: '6px 0', borderRadius: T.radiusMd, border: `2px solid ${priority === p ? color : 'var(--t-border)'}`,
                    background: priority === p ? `${color}12` : 'var(--t-surface)', cursor: 'pointer',
                    fontSize: 11, fontWeight: priority === p ? 700 : 500, color: priority === p ? color : 'var(--t-text-secondary)',
                  }}>{dot} {lbl}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>NOTES (OPTIONAL)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any details or motivation…" style={iStyle} />
          </div>
        </div>
      )}

      {/* Step 2 — Amount */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {cat === 'home' && (
            <div style={{ padding: '14px 16px', background: 'var(--t-primary-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-primary-border)` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-primary)', marginBottom: 10 }}>HOME PURCHASE CALCULATOR</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>HOME PRICE</label>
                  {dollarInput(homePrice, setHomePrice, '350000')}
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>DOWN PAYMENT — {downPct}%</label>
                  <input type="range" min={3} max={50} step={1} value={downPct} onChange={e => setDownPct(Number(e.target.value))}
                    style={{ width: '100%', accentColor: color, cursor: 'pointer', marginTop: 8 }} />
                  {homePrice > 0 && <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 4 }}>Down: {fmt(homePrice * downPct / 100)} + ~{fmt(homePrice * 0.03)} closing = <strong>{fmt(homePrice * downPct / 100 + homePrice * 0.03)}</strong></div>}
                </div>
              </div>
            </div>
          )}
          {cat === 'emergency' && (
            <div style={{ padding: '14px 16px', background: 'var(--t-green-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-green-border)` }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-green-text)', display: 'block', marginBottom: 8 }}>TARGET MONTHS OF EXPENSES</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([3,6,12] as const).map(m => (
                  <button key={m} onClick={() => setEmMonths(m)} style={{
                    flex: 1, padding: '9px 0', borderRadius: T.radiusMd, border: `2px solid ${emMonths===m?'var(--t-green)':'var(--t-green-border)'}`,
                    background: emMonths===m ? 'var(--t-green)' : 'var(--t-surface)', color: emMonths===m ? '#fff' : 'var(--t-green-text)',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}>{m} months</button>
                ))}
              </div>
              {defaultMonthlyExpenses > 0 && <div style={{ fontSize: 12, color: 'var(--t-green-text)', marginTop: 8 }}>Based on {fmt(defaultMonthlyExpenses)}/mo → target: <strong>{fmt(defaultMonthlyExpenses * emMonths)}</strong></div>}
            </div>
          )}
          {cat === 'education' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '14px 16px', background: 'var(--t-teal-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-teal-border)` }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-teal-text)', display: 'block', marginBottom: 5 }}>CHILD'S NAME</label>
                <input value={childName} onChange={e => setChildName(e.target.value)} placeholder="e.g. Emma" style={iStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-teal-text)', display: 'block', marginBottom: 5 }}>CHILD'S AGE</label>
                <input type="number" min={0} max={17} value={childAge||''} placeholder="0" onChange={e => setChildAge(Number(e.target.value))} style={iStyle} />
                {childAge > 0 && childAge < 18 && <div style={{ fontSize: 11, color: 'var(--t-teal-text)', marginTop: 4 }}>{18-childAge} years until college</div>}
              </div>
            </div>
          )}
          {cat === 'retirement' && (
            <div style={{ padding: '12px 14px', background: 'var(--t-purple-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-purple-border)` }}>
              <div style={{ fontSize: 12, color: 'var(--t-purple-text)' }}>
                💡 For a detailed projection visit the <a href="/dashboard/retirement" style={{ color: 'var(--t-purple)', fontWeight: 700 }}>Retirement page →</a>. Use this goal for a high-level savings milestone.
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>TARGET AMOUNT</label>
              {dollarInput(target, setTarget)}
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>ALREADY SAVED</label>
              {dollarInput(saved, setSaved)}
              <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', marginTop: 4, lineHeight: 1.4 }}>
                Cash already sitting in a dedicated account for this goal. Existing cash or investments you plan to redirect are set in the Funding step and count toward progress automatically.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — Date */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>TARGET DATE</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]} style={iStyle} />
          </div>
          {targetDate && target > 0 && (
            <div style={{ padding: '14px 16px', background: `${color}10`, borderRadius: T.radiusMd, border: `1px solid ${color}25` }}>
              <div style={{ fontSize: 12, color: 'var(--t-text-secondary)' }}>
                {monthsLeft > 0
                  ? <>Target: <strong>{fmtMonthYear(new Date(targetDate))}</strong> · <strong>{monthsLeft} months away</strong>. Roughly <strong style={{ color }}>{fmt(Math.ceil(Math.max(0, target - saved) / monthsLeft))}/mo</strong> to reach {fmt(target)}.</>
                  : 'Target date is today or past — fund this immediately.'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4 — Funding Strategy */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', marginBottom: 2 }}>HOW WILL YOU FUND THIS GOAL?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {([
              { stratKey: 'monthly'     as FundingStrategy, icon: '📅', title: 'Monthly Savings',       desc: 'Set aside a fixed amount each month' },
              { stratKey: 'cash'        as FundingStrategy, icon: '💰', title: 'Allocate Existing Cash', desc: 'Reserve cash you already have' },
              { stratKey: 'investments' as FundingStrategy, icon: '📈', title: 'Existing Investments',   desc: 'Allocate from your investment portfolio' },
              { stratKey: 'hybrid'      as FundingStrategy, icon: '⚡', title: 'Hybrid',                 desc: 'Combine existing assets with monthly savings' },
              { stratKey: 'debt'        as FundingStrategy, icon: '🏦', title: 'Debt Financing',         desc: 'Finance the purchase with a loan' },
            ]).map(({ stratKey, icon, title, desc }) => (
              <button key={stratKey} onClick={() => setStrategy(stratKey)} style={{
                padding: '12px 14px', borderRadius: T.radiusMd, border: `2px solid ${strategy===stratKey ? color : 'var(--t-border)'}`,
                background: strategy===stratKey ? `${color}10` : 'var(--t-surface)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: strategy===stratKey ? color : 'var(--t-text-primary)' }}>{title}</div>
                    <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 1 }}>{desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Strategy-specific inputs */}
          {(strategy === 'monthly' || strategy === 'hybrid') && (
            <div style={{ padding: '13px 14px', background: 'var(--t-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-border)` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', marginBottom: 7 }}>MONTHLY CONTRIBUTION</div>
              {dollarInput(contrib, setContrib)}
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {saved > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)' }}>
                    Already saved: <strong>{fmt(saved)}</strong>
                    {(strategy === 'hybrid' && (allocCash > 0 || allocInv > 0)) && (
                      <> · Lump sum: <strong>{fmt(allocCash + allocInv)}</strong></>
                    )}
                    {' '}· Remaining: <strong>{fmt(remaining)}</strong>
                  </div>
                )}
                {requiredMonthly > 0 && monthsLeft > 0 && (
                  <div style={{ fontSize: 11, color, fontWeight: 600 }}>
                    {fmt(requiredMonthly)}/mo for {monthsLeft} months reaches {fmt(target)} by {fmtShortDate(targetDate)}
                  </div>
                )}
              </div>
            </div>
          )}

          {(strategy === 'cash' || strategy === 'hybrid') && (
            <div style={{ padding: '13px 14px', background: 'var(--t-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-border)` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', marginBottom: 7 }}>CASH TO ALLOCATE</div>
              {dollarInput(allocCash, setAllocCash)}
              {allocCash > 0 && target > 0 && (
                <div style={{ fontSize: 12, color: allocCash >= target ? 'var(--t-green-text)' : 'var(--t-text-tertiary)', marginTop: 5 }}>
                  {allocCash >= target ? '✓ Fully funded from existing cash' : `Covers ${Math.round(allocCash/target*100)}% — ${fmt(target-allocCash)} remaining`}
                </div>
              )}
            </div>
          )}

          {(strategy === 'investments' || strategy === 'hybrid') && (
            <div style={{ padding: '13px 14px', background: 'var(--t-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-border)` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', marginBottom: 7 }}>INVESTMENT AMOUNT TO ALLOCATE</div>
              {dollarInput(allocInv, setAllocInv)}
              {allocInv > 0 && monthsLeft > 0 && (
                <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 5 }}>
                  At 8% growth → projected <strong style={{ color }}>{fmt(futureValueInvested(allocInv, 8, monthsLeft))}</strong> by target date
                </div>
              )}
            </div>
          )}

          {strategy === 'debt' && (
            <div style={{ padding: '13px 14px', background: 'var(--t-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-border)` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>INTEREST RATE (APR)</label>
                  <div style={{ display: 'flex', border: `1px solid var(--t-border-med)`, borderRadius: T.radiusMd, overflow: 'hidden' }}>
                    <input type="number" value={debtRate} step={0.1} min={0} max={30} onChange={e => setDebtRate(Number(e.target.value))}
                      style={{ flex: 1, padding: '9px 10px', border: 'none', outline: 'none', fontSize: 13, color: 'var(--t-text-primary)', background: 'transparent', minWidth: 0 }} />
                    <span style={{ padding: '9px 10px', background: 'var(--t-bg)', fontSize: 13, color: 'var(--t-text-tertiary)', borderLeft: `1px solid var(--t-border-med)` }}>%</span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>LOAN TERM</label>
                  <select value={debtTerm} onChange={e => setDebtTerm(Number(e.target.value))} style={{ ...iStyle, cursor: 'pointer' }}>
                    {[{m:12,l:'12 mo'},{m:24,l:'24 mo'},{m:36,l:'36 mo'},{m:48,l:'48 mo'},{m:60,l:'60 mo'},{m:72,l:'72 mo'},{m:84,l:'84 mo'},{m:120,l:'10 yr'},{m:180,l:'15 yr'},{m:360,l:'30 yr'}]
                      .map(({m,l}) => <option key={m} value={m}>{l}</option>)}
                  </select>
                </div>
              </div>
              {target > 0 && (
                <div style={{ fontSize: 12, color: 'var(--t-text-secondary)', marginTop: 7 }}>
                  Est. payment: <strong style={{ color }}>{fmt(calcMonthlyPayment(target, debtRate, debtTerm))}/mo</strong> · Total interest: {fmt(calcMonthlyPayment(target, debtRate, debtTerm) * debtTerm - target)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      {step > 0 && (
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button onClick={() => setStep(s => s - 1)} style={{
            padding: '10px 20px', borderRadius: T.radiusMd, border: `1px solid var(--t-border-med)`,
            background: 'var(--t-surface)', color: 'var(--t-text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>← Back</button>
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canProceed} style={{
              flex: 1, padding: '10px 0', borderRadius: T.radiusMd, border: 'none',
              background: canProceed ? color : 'var(--t-border)', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: canProceed ? 'pointer' : 'not-allowed', opacity: canProceed ? 1 : 0.6,
            }}>Continue →</button>
          ) : (
            <button onClick={handleSave} disabled={saving} style={{
              flex: 1, padding: '10px 0', borderRadius: T.radiusMd, border: 'none',
              background: color, color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}>{saving ? 'Saving…' : initial ? '💾 Save Changes' : '✓ Create Goal'}</button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   GOAL FORM (legacy — replaced by GoalWizard)
───────────────────────────────────────────────────────────── */
function GoalForm({ initial, onSave, onCancel, defaultCashBalance, defaultMonthlyExpenses, saving }: {
  initial?: LifeGoal | null;
  onSave: (g: LifeGoal) => void;
  onCancel: () => void;
  defaultCashBalance: number;
  defaultMonthlyExpenses: number;
  saving?: boolean;
}) {
  const [cat,          setCat]          = useState<GoalCategoryKey>(initial?.category ?? 'custom');
  const [name,         setName]         = useState(initial?.name ?? '');
  const [emoji,        setEmoji]        = useState(initial?.emoji ?? '⭐');
  const [color,        setColor]        = useState(initial?.color ?? PRESET_COLORS[3]);
  const [target,       setTarget]       = useState(initial?.targetAmount ?? 0);
  const [saved,        setSaved]        = useState(initial?.currentSaved ?? 0);
  const [contrib,      setContrib]      = useState(initial?.monthlyContrib ?? 0);
  const [targetDate,   setTargetDate]   = useState(initial?.targetDate ?? '');
  const [notes,        setNotes]        = useState(initial?.notes ?? '');
  // Home
  const [homePrice,    setHomePrice]    = useState(initial?.homePrice ?? 0);
  const [downPct,      setDownPct]      = useState(initial?.downPaymentPct ?? 20);
  // Education
  const [childName,    setChildName]    = useState(initial?.childName ?? '');
  const [childAge,     setChildAge]     = useState(initial?.childAge ?? 0);
  // Emergency
  const [emMonths,     setEmMonths]     = useState<3|6|12>(initial?.emergencyMonths ?? 3);

  // Auto-fill from category
  useEffect(() => {
    if (initial) return;
    const meta = GOAL_CATS[cat];
    setEmoji(meta.emoji);
    setColor(meta.defaultColor);
    setName(meta.label);
  }, [cat, initial]);

  // Auto-calc home target
  useEffect(() => {
    if (cat !== 'home' || homePrice <= 0) return;
    const down    = homePrice * downPct / 100;
    const closing = homePrice * 0.03;
    setTarget(Math.round(down + closing));
  }, [cat, homePrice, downPct]);

  // Auto-calc emergency target
  useEffect(() => {
    if (cat !== 'emergency' || defaultMonthlyExpenses <= 0) return;
    setTarget(Math.round(defaultMonthlyExpenses * emMonths));
    setSaved(Math.round(defaultCashBalance));
  }, [cat, emMonths, defaultMonthlyExpenses, defaultCashBalance]);

  // Auto-calc education target date from child age
  useEffect(() => {
    if (cat !== 'education' || childAge <= 0) return;
    const yearsToCollege = Math.max(0, 18 - childAge);
    const d = new Date();
    d.setFullYear(d.getFullYear() + yearsToCollege);
    setTargetDate(d.toISOString().split('T')[0]);
  }, [cat, childAge]);

  function handleSave() {
    const id  = initial?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    onSave({
      id, category: cat, name, emoji, color,
      targetAmount: target, currentSaved: saved, monthlyContrib: contrib,
      targetDate, notes,
      ...(cat === 'home'      && { homePrice, downPaymentPct: downPct }),
      ...(cat === 'education' && { childName, childAge }),
      ...(cat === 'emergency' && { emergencyMonths: emMonths }),
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      ...(initial?.completedAt && { completedAt: initial.completedAt }),
    });
  }

  const isValid = !!name && target > 0 && !!targetDate;

  const iStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: `1px solid var(--t-border-med)`,
    borderRadius: T.radiusMd, fontSize: 13, color: 'var(--t-text-primary)',
    outline: 'none', boxSizing: 'border-box', background: 'var(--t-surface)',
  };

  const dollarInput = (value: number, onChange: (v: number) => void, placeholder = '0') => (
    <div style={{ display: 'flex', border: `1px solid var(--t-border-med)`, borderRadius: T.radiusMd, overflow: 'hidden' }}>
      <span style={{ padding: '9px 12px', background: 'var(--t-bg)', fontSize: 13, color: 'var(--t-text-tertiary)', borderRight: `1px solid var(--t-border-med)`, flexShrink: 0 }}>$</span>
      <input type="number" value={value || ''} placeholder={placeholder}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, padding: '9px 12px', border: 'none', outline: 'none', fontSize: 13, color: 'var(--t-text-primary)', background: 'transparent', fontVariantNumeric: 'tabular-nums', minWidth: 0 }} />
    </div>
  );

  return (
    <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `2px solid var(--t-primary-border)`, boxShadow: 'var(--t-shadow-md)', padding: '24px 26px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)' }}>{initial ? 'Edit Goal' : 'New Life Goal'}</div>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-text-tertiary)', fontSize: 18, padding: 4 }}>✕</button>
      </div>

      {/* Category grid */}
      {!initial && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', marginBottom: 9 }}>WHAT ARE YOU WORKING TOWARD?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {(Object.keys(GOAL_CATS) as GoalCategoryKey[]).map(k => {
              const meta = GOAL_CATS[k];
              const sel  = cat === k;
              return (
                <button key={k} onClick={() => setCat(k)} style={{
                  padding: '11px 12px', borderRadius: T.radiusMd, border: `2px solid ${sel ? meta.defaultColor : 'var(--t-border)'}`,
                  background: sel ? `${meta.defaultColor}12` : 'var(--t-surface)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{meta.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: sel ? meta.defaultColor : 'var(--t-text-primary)', lineHeight: 1.3 }}>{meta.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color + emoji */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, marginBottom: 18, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', marginBottom: 7 }}>COLOR</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', maxWidth: 160 }}>
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{
                width: 26, height: 26, borderRadius: '50%', background: c, border: `3px solid ${color === c ? 'var(--t-text-primary)' : 'transparent'}`,
                cursor: 'pointer', flexShrink: 0,
              }} />
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', marginBottom: 7 }}>EMOJI</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {GOAL_EMOJIS.map(em => (
              <button key={em} onClick={() => setEmoji(em)} style={{
                width: 32, height: 32, borderRadius: T.radiusSm, border: `2px solid ${emoji === em ? color : 'var(--t-border)'}`,
                background: emoji === em ? `${color}15` : 'var(--t-surface)', cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{em}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Name */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>GOAL NAME</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Buy my first home" style={iStyle} />
      </div>

      {/* Category-specific extras */}
      {cat === 'home' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, padding: '14px 16px', background: 'var(--t-primary-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-primary-border)` }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>HOME PRICE ESTIMATE</label>
            {dollarInput(homePrice, setHomePrice, '350000')}
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>DOWN PAYMENT — {downPct}%</label>
            <input type="range" min={3} max={50} step={1} value={downPct} onChange={e => setDownPct(Number(e.target.value))}
              style={{ width: '100%', accentColor: color, cursor: 'pointer', marginTop: 8 }} />
            {homePrice > 0 && <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 4 }}>Down: {fmt(homePrice * downPct / 100)} + ~{fmt(homePrice * 0.03)} closing = <strong>{fmt(homePrice * downPct / 100 + homePrice * 0.03)}</strong></div>}
          </div>
        </div>
      )}

      {cat === 'emergency' && (
        <div style={{ marginBottom: 16, padding: '14px 16px', background: 'var(--t-green-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-green-border)` }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-green-text)', display: 'block', marginBottom: 8 }}>TARGET MONTHS OF EXPENSES</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {([3, 6, 12] as const).map(m => (
              <button key={m} onClick={() => setEmMonths(m)} style={{
                flex: 1, padding: '9px 0', borderRadius: T.radiusMd, border: `2px solid ${emMonths === m ? 'var(--t-green)' : 'var(--t-green-border)'}`,
                background: emMonths === m ? 'var(--t-green)' : 'var(--t-surface)', color: emMonths === m ? '#fff' : 'var(--t-green-text)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>{m} months</button>
            ))}
          </div>
          {defaultMonthlyExpenses > 0 && (
            <div style={{ fontSize: 12, color: 'var(--t-green-text)', marginTop: 8 }}>
              Based on your {fmt(defaultMonthlyExpenses)}/mo avg expenses → target: <strong>{fmt(defaultMonthlyExpenses * emMonths)}</strong>
            </div>
          )}
        </div>
      )}

      {cat === 'education' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, padding: '14px 16px', background: 'var(--t-teal-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-teal-border)` }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-teal-text)', display: 'block', marginBottom: 5 }}>CHILD'S NAME (OPTIONAL)</label>
            <input value={childName} onChange={e => setChildName(e.target.value)} placeholder="e.g. Emma" style={iStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-teal-text)', display: 'block', marginBottom: 5 }}>CHILD'S CURRENT AGE</label>
            <input type="number" min={0} max={17} value={childAge || ''} placeholder="0"
              onChange={e => setChildAge(Number(e.target.value))} style={iStyle} />
            {childAge > 0 && childAge < 18 && (
              <div style={{ fontSize: 11, color: 'var(--t-teal-text)', marginTop: 4 }}>{18 - childAge} years until college</div>
            )}
          </div>
        </div>
      )}

      {cat === 'retirement' && (
        <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--t-purple-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-purple-border)` }}>
          <div style={{ fontSize: 12, color: 'var(--t-purple-text)' }}>
            💡 For a detailed retirement projection, visit the <a href="/dashboard/retirement" style={{ color: 'var(--t-purple)', fontWeight: 700 }}>Retirement page →</a>. Use this goal to set a high-level savings milestone.
          </div>
        </div>
      )}

      {/* Core fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>TARGET AMOUNT</label>
          {dollarInput(target, setTarget)}
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>ALREADY SAVED</label>
          {dollarInput(saved, setSaved)}
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>MONTHLY CONTRIBUTION</label>
          {dollarInput(contrib, setContrib)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>TARGET DATE</label>
          <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]} style={iStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>NOTES (OPTIONAL)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any details or motivation…" style={iStyle} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleSave} disabled={!isValid || saving} style={{
          flex: 1, padding: '11px 0', borderRadius: T.radiusMd, border: 'none',
          cursor: isValid && !saving ? 'pointer' : 'not-allowed',
          background: isValid ? color : 'var(--t-border)', color: '#fff',
          fontSize: 13, fontWeight: 700, transition: 'all 0.15s', opacity: isValid && !saving ? 1 : 0.6,
        }}>
          {saving ? 'Saving…' : initial ? '💾 Save Changes' : '+ Add Goal'}
        </button>
        <button onClick={onCancel} style={{
          padding: '11px 20px', borderRadius: T.radiusMd, border: `1px solid var(--t-border-med)`,
          background: 'var(--t-surface)', color: 'var(--t-text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>Cancel</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   GOAL CARD
───────────────────────────────────────────────────────────── */
function GoalCard({ goal, onEdit, onDelete, onAddFunds, onUpdateSaved }: {
  goal: LifeGoal;
  onEdit: () => void;
  onDelete: () => void;
  onAddFunds: (amount: number) => void;
  onUpdateSaved: (amount: number) => void;
}) {
  const [addingFunds, setAddingFunds] = useState(false);
  const [fundsAmt,    setFundsAmt]    = useState('');

  const ta    = trackAnalysis(goal);
  const meta  = GOAL_CATS[goal.category] ?? GOAL_CATS.custom;

  const noFunding   = !goal.fundingStrategy || goal.fundingStrategy === 'monthly' ? goal.monthlyContrib === 0 : false;
  const pastDue     = !ta.done && ta.monthsLeft <= 0;
  const statusColor  = ta.done ? 'var(--t-green)' : ta.onTrack ? 'var(--t-green)' : pastDue ? 'var(--t-red)' : noFunding ? 'var(--t-amber)' : 'var(--t-red)';
  const statusBg     = ta.done ? 'var(--t-green-bg)' : ta.onTrack ? 'var(--t-green-bg)' : pastDue ? 'var(--t-red-bg)' : noFunding ? 'var(--t-amber-bg)' : 'var(--t-red-bg)';
  const statusBorder = ta.done ? 'var(--t-green-border)' : ta.onTrack ? 'var(--t-green-border)' : pastDue ? 'var(--t-red-border)' : noFunding ? 'var(--t-amber-border)' : 'var(--t-red-border)';
  const statusText   = ta.done ? 'var(--t-green-text)' : ta.onTrack ? 'var(--t-green-text)' : pastDue ? 'var(--t-red-text)' : noFunding ? 'var(--t-amber-text)' : 'var(--t-red-text)';
  const statusLabel  = ta.done ? '✅ Fully Funded' : ta.onTrack ? '✓ On Track' : pastDue ? '🔴 Past Due' : noFunding ? '⚠ Needs Attention' : '⏰ Behind Schedule';

  const PRIORITY_STYLE: Record<GoalPriority, { dot: string; color: string }> = {
    high:   { dot: '🔴', color: '#DC2626' },
    medium: { dot: '🟡', color: '#D97706' },
    low:    { dot: '🟢', color: '#16A34A' },
  };
  const pri = goal.priority ?? 'medium';
  const priStyle = PRIORITY_STYLE[pri];

  function confirmFunds() {
    const amt = parseFloat(fundsAmt);
    if (amt > 0) { onAddFunds(amt); setFundsAmt(''); setAddingFunds(false); }
  }

  return (
    <div style={{
      background: 'var(--t-surface)', borderRadius: T.radius,
      border: `1px solid ${ta.done ? 'var(--t-green-border)' : 'var(--t-border)'}`,
      boxShadow: 'var(--t-shadow-sm)', overflow: 'hidden',
    }}>
      {/* Color top bar */}
      <div style={{ height: 5, background: goal.color }} />

      <div style={{ padding: '20px 22px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {/* Ring + emoji */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <RingProgress pct={ta.pct} color={ta.done ? 'var(--t-green)' : goal.color} size={64} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {goal.emoji}
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)' }}>{goal.name}</div>
                <span title={`${pri} priority`} style={{ fontSize: 11, cursor: 'default' }}>{priStyle.dot}</span>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                <Pill color={statusText} bg={statusBg} border={statusBorder}>{statusLabel}</Pill>
                {goal.fundingStrategy && goal.fundingStrategy !== 'monthly' && (
                  <Pill color={STRATEGY_META[goal.fundingStrategy].color} bg={STRATEGY_META[goal.fundingStrategy].bg} border={STRATEGY_META[goal.fundingStrategy].border}>
                    {STRATEGY_META[goal.fundingStrategy].icon} {STRATEGY_META[goal.fundingStrategy].label}
                  </Pill>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 5 }}>
                {meta.label} · Target: {fmtShortDate(goal.targetDate)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={onEdit}   style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-text-tertiary)', fontSize: 14, padding: 4, borderRadius: T.radiusSm }}>✏️</button>
            <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-text-tertiary)', fontSize: 14, padding: 4, borderRadius: T.radiusSm }}>🗑️</button>
          </div>
        </div>

        {/* Progress bar */}
        <ProgressBar pct={ta.pct} color={ta.done ? 'var(--t-green)' : goal.color} height={10} />
        {/* effective = currentSaved + any lump-sum allocations */}
        {(() => {
          const effectiveSaved = goal.currentSaved + (goal.allocatedCash ?? 0) + (goal.allocatedInvestment ?? 0);
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--t-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(effectiveSaved)} funded
                {(goal.allocatedCash || goal.allocatedInvestment) ? (
                  <span style={{ color: 'var(--t-text-tertiary)', fontWeight: 400 }}>
                    {goal.currentSaved > 0 ? ` (${fmt(goal.currentSaved)} saved` : ' ('}
                    {goal.allocatedCash ? ` + ${fmt(goal.allocatedCash)} cash` : ''}
                    {goal.allocatedInvestment ? ` + ${fmt(goal.allocatedInvestment)} invested` : ''})
                  </span>
                ) : null}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: goal.color, fontVariantNumeric: 'tabular-nums' }}>{ta.pct.toFixed(0)}% of {fmt(goal.targetAmount)}</span>
            </div>
          );
        })()}

        {/* Stats grid */}
        {!ta.done && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
            <div style={{ padding: '9px 11px', background: 'var(--t-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-border)` }}>
              <div style={{ fontSize: 9, color: 'var(--t-text-tertiary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 3 }}>STILL NEEDED</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(Math.max(0, goal.targetAmount - goal.currentSaved - (goal.allocatedCash ?? 0) - (goal.allocatedInvestment ?? 0)))}</div>
            </div>
            <div style={{ padding: '9px 11px', background: 'var(--t-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-border)` }}>
              <div style={{ fontSize: 9, color: 'var(--t-text-tertiary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 3 }}>MONTHS LEFT</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text-primary)' }}>{ta.monthsLeft > 0 ? ta.monthsLeft : '—'}</div>
            </div>
            <div style={{ padding: '9px 11px', background: `${goal.color}10`, borderRadius: T.radiusMd, border: `1px solid ${goal.color}25` }}>
              <div style={{ fontSize: 9, color: 'var(--t-text-tertiary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 3 }}>NEED / MO</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: goal.color, fontVariantNumeric: 'tabular-nums' }}>
                {ta.monthsLeft > 0 ? fmtShort(ta.monthlyNeeded) : '—'}
              </div>
            </div>
          </div>
        )}

        {/* On-track analysis */}
        {!ta.done && goal.monthlyContrib > 0 && (
          <div style={{ marginTop: 12, padding: '11px 13px', background: statusBg, borderRadius: T.radiusMd, border: `1px solid ${statusBorder}` }}>
            <div style={{ fontSize: 12, color: ta.onTrack ? 'var(--t-text-secondary)' : statusText }}>
              {ta.onTrack ? (
                <>
                  At <strong>{fmt(goal.monthlyContrib)}/mo</strong> you'll reach your goal by{' '}
                  <strong style={{ color: 'var(--t-green)' }}>{fmtMonthYear(ta.projectedDate)}</strong>
                  {ta.projectedDate < new Date(goal.targetDate) && ' — ahead of schedule! 🎉'}
                </>
              ) : (
                <>
                  <strong style={{ color: statusText }}>Add {fmt(ta.gapPerMonth)}/mo</strong> to hit your{' '}
                  {fmtShortDate(goal.targetDate)} deadline. At {fmt(goal.monthlyContrib)}/mo you'd reach it{' '}
                  <strong>{isFinite(ta.projectedMonths) ? `in ${ta.projectedMonths} months` : 'beyond your timeline'}</strong>.
                </>
              )}
            </div>
          </div>
        )}

        {!ta.done && goal.monthlyContrib === 0 && !goal.fundingStrategy && (
          <div style={{ marginTop: 12, padding: '11px 13px', background: 'var(--t-amber-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-amber-border)` }}>
            <div style={{ fontSize: 12, color: 'var(--t-amber-text)' }}>
              No monthly contribution set. Add at least <strong>{fmtShort(ta.monthlyNeeded)}/mo</strong> to reach your goal by {fmtShortDate(goal.targetDate)}.
            </div>
          </div>
        )}

        {/* Funding strategy summary */}
        <FundingStrategyDisplay goal={goal} monthsLeft={ta.monthsLeft} />

        {goal.notes && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--t-text-tertiary)', fontStyle: 'italic', borderTop: `1px solid var(--t-border)`, paddingTop: 10 }}>
            {goal.notes}
          </div>
        )}

        {/* Add funds */}
        {!ta.done && (
          addingFunds ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <div style={{ display: 'flex', border: `1px solid var(--t-border-med)`, borderRadius: T.radiusMd, overflow: 'hidden', flex: 1 }}>
                <span style={{ padding: '8px 10px', background: 'var(--t-bg)', fontSize: 13, color: 'var(--t-text-tertiary)', borderRight: `1px solid var(--t-border-med)` }}>$</span>
                <input autoFocus type="number" value={fundsAmt} placeholder="Amount"
                  onChange={e => setFundsAmt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmFunds()}
                  style={{ flex: 1, padding: '8px 10px', border: 'none', outline: 'none', fontSize: 13, color: 'var(--t-text-primary)', background: 'transparent' }} />
              </div>
              <button onClick={confirmFunds} style={{ padding: '8px 14px', borderRadius: T.radiusMd, border: 'none', background: goal.color, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Add</button>
              <button onClick={() => setAddingFunds(false)} style={{ padding: '8px 12px', borderRadius: T.radiusMd, border: `1px solid var(--t-border-med)`, background: 'var(--t-surface)', color: 'var(--t-text-secondary)', fontSize: 12, cursor: 'pointer' }}>✕</button>
            </div>
          ) : (
            <button onClick={() => setAddingFunds(true)} style={{
              display: 'block', width: '100%', marginTop: 14, padding: '9px 0',
              borderRadius: T.radiusMd, border: `1.5px dashed ${goal.color}60`,
              background: `${goal.color}08`, color: goal.color, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              + Add Funds
            </button>
          )
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   GOAL TIMELINE
───────────────────────────────────────────────────────────── */
function GoalTimeline({ goals }: { goals: LifeGoal[] }) {
  if (goals.length === 0) return null;

  const sorted = [...goals].filter(g => g.targetDate).sort((a, b) =>
    new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );

  const now    = new Date();
  const last   = new Date(sorted[sorted.length - 1]?.targetDate ?? now);
  const totalMs = Math.max(1, last.getTime() - now.getTime());

  return (
    <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 26px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text-primary)', marginBottom: 18 }}>Goal Timeline</div>
      {/* Track */}
      <div style={{ position: 'relative', height: 80 }}>
        {/* Base line */}
        <div style={{ position: 'absolute', top: 20, left: 0, right: 0, height: 3, background: 'var(--t-border)', borderRadius: 100 }} />
        {/* NOW marker */}
        <div style={{ position: 'absolute', top: 10, left: 0 }}>
          <div style={{ width: 3, height: 22, background: 'var(--t-text-tertiary)', borderRadius: 2 }} />
          <div style={{ fontSize: 9, color: 'var(--t-text-tertiary)', fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap' }}>NOW</div>
        </div>
        {/* Goal markers */}
        {sorted.map((g) => {
          const pct = Math.max(5, Math.min(96, ((new Date(g.targetDate).getTime() - now.getTime()) / totalMs) * 100));
          const ta  = trackAnalysis(g);
          const clr = ta.done ? 'var(--t-green)' : ta.onTrack ? g.color : 'var(--t-red)';
          return (
            <div key={g.id} style={{ position: 'absolute', left: `${pct}%`, transform: 'translateX(-50%)', textAlign: 'center' }}>
              {/* Emoji above dot */}
              <div style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', fontSize: 15, lineHeight: 1 }}>{g.emoji}</div>
              {/* Connector dot on line */}
              <div style={{ position: 'absolute', top: 15, left: '50%', transform: 'translateX(-50%)', width: 12, height: 12, borderRadius: '50%', background: clr, border: `2px solid #fff`, boxShadow: `0 0 0 2px ${clr}40` }} />
              {/* Name + date below dot */}
              <div style={{ position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t-text-primary)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                <div style={{ fontSize: 9, color: 'var(--t-text-tertiary)', fontWeight: 600 }}>{fmtShortDate(g.targetDate)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PURCHASE ANALYZER SECTION (calc engine lives in lib/purchaseanalyzer.ts)
───────────────────────────────────────────────────────────── */
function PurchaseAnalyzerSection({ goals, currentCash, monthlySurplus, avgMonthlyExpenses, avgMonthlyIncome }: {
  goals: LifeGoal[];
  currentCash: number;
  monthlySurplus: number;
  avgMonthlyExpenses: number;
  avgMonthlyIncome: number;
}) {
  const linkableGoals = goals.filter(g => g.category === 'home' || g.category === 'vehicle');

  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(linkableGoals[0]?.id ?? null);
  const [name,         setName]         = useState('');
  const [category,     setCategory]     = useState<PurchaseCategory>('home');
  const [cost,         setCost]         = useState<number>(0);
  const [purchType,    setPurchType]    = useState<PurchaseType>('finance');
  const [targetDate,   setTargetDate]   = useState('');
  const [downPct,      setDownPct]      = useState(20);
  const [loanRate,     setLoanRate]     = useState(6.5);
  const [loanTerm,     setLoanTerm]     = useState(360);
  const [monthlyTax,   setMonthlyTax]   = useState<number>(0);
  const [monthlyIns,   setMonthlyIns]   = useState<number>(0);

  const linkedGoal = goals.find(g => g.id === linkedGoalId) ?? null;

  // Pre-fill from linked goal
  useEffect(() => {
    if (!linkedGoal) return;
    if (linkedGoal.homePrice && linkedGoal.homePrice > 0) setCost(linkedGoal.homePrice);
    if (linkedGoal.downPaymentPct)                        setDownPct(linkedGoal.downPaymentPct);
    if (linkedGoal.targetDate)                            setTargetDate(linkedGoal.targetDate);
    setName(linkedGoal.name);
    setCategory(linkedGoal.category === 'home' ? 'home' : 'vehicle');
    if (linkedGoal.category === 'home') { setPurchType('finance'); setLoanTerm(360); }
  }, [linkedGoalId]); // eslint-disable-line react-hooks/exhaustive-deps

  const analysis = useMemo(() => {
    if (purchType === 'cash') {
      return analyzeCashPurchase({ cost, category, currentCash, monthlySurplus, targetDate });
    }
    return analyzeFinancePurchase({ cost, category, currentCash, monthlySurplus, downPct, loanRate, loanTerm, monthlyTax, monthlyIns });
  }, [cost, purchType, currentCash, monthlySurplus, downPct, loanRate, loanTerm, targetDate, category, monthlyTax, monthlyIns]);

  const dpStatus = useMemo(() => analyzeDownPaymentReadiness(analysis, linkedGoal, currentCash), [analysis, linkedGoal, currentCash]);
  const budgetReadiness = useMemo(() => analyzeBudgetReadiness(analysis, avgMonthlyExpenses, avgMonthlyIncome), [analysis, avgMonthlyExpenses, avgMonthlyIncome]);

  const iStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: `1px solid var(--t-border-med)`,
    borderRadius: T.radiusMd, fontSize: 13, color: 'var(--t-text-primary)',
    outline: 'none', boxSizing: 'border-box', background: 'var(--t-surface)',
  };

  const statusColor  = budgetReadiness?.affordable ? 'var(--t-green)' : budgetReadiness?.stretched ? 'var(--t-amber)' : 'var(--t-red)';
  const statusBg     = budgetReadiness?.affordable ? 'var(--t-green-bg)' : budgetReadiness?.stretched ? 'var(--t-amber-bg)' : 'var(--t-red-bg)';
  const statusBorder = budgetReadiness?.affordable ? 'var(--t-green-border)' : budgetReadiness?.stretched ? 'var(--t-amber-border)' : 'var(--t-red-border)';
  const statusText   = budgetReadiness?.affordable ? 'var(--t-green-text)' : budgetReadiness?.stretched ? 'var(--t-amber-text)' : 'var(--t-red-text)';
  const statusLabel  = budgetReadiness?.affordable ? '✓ Affordable' : budgetReadiness?.stretched ? '⚠ Stretched' : '⚠ Strained';

  return (
    <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '24px 26px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)', letterSpacing: '-0.01em' }}>🔍 Purchase Analyzer</div>
          <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 2 }}>Model the true cost of any major purchase — cash or financed. See your savings readiness and budget impact.</div>
        </div>
        {linkableGoals.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t-text-secondary)' }}>LINK TO GOAL</div>
            <select value={linkedGoalId ?? ''} onChange={e => setLinkedGoalId(e.target.value || null)}
              style={{ ...iStyle, width: 'auto', minWidth: 180, fontSize: 12, padding: '7px 10px' }}>
              <option value="">— No link —</option>
              {linkableGoals.map(g => (
                <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24 }}>

        {/* ── LEFT: INPUTS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Name + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>Purchase Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="My first home…" style={iStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as PurchaseCategory)} style={{ ...iStyle, cursor: 'pointer' }}>
                {(Object.keys(PURCHASE_CATS) as PurchaseCategory[]).map(k => (
                  <option key={k} value={k}>{PURCHASE_CATS[k].icon} {PURCHASE_CATS[k].label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cost + Payment Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>Total Cost</label>
              <div style={{ display: 'flex', border: `1px solid var(--t-border-med)`, borderRadius: T.radiusMd, overflow: 'hidden' }}>
                <span style={{ padding: '9px 12px', background: 'var(--t-bg)', fontSize: 13, color: 'var(--t-text-tertiary)', borderRight: `1px solid var(--t-border-med)`, flexShrink: 0 }}>$</span>
                <input type="number" value={cost || ''} placeholder="0"
                  onChange={e => setCost(Number(e.target.value))}
                  style={{ flex: 1, padding: '9px 12px', border: 'none', outline: 'none', fontSize: 13, color: 'var(--t-text-primary)', background: 'transparent', fontVariantNumeric: 'tabular-nums', minWidth: 0 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>Payment Type</label>
              <div style={{ display: 'flex', background: 'var(--t-bg)', borderRadius: T.radiusMd, padding: 3, border: `1px solid var(--t-border)` }}>
                {(['cash', 'finance'] as PurchaseType[]).map(t => (
                  <button key={t} onClick={() => setPurchType(t)} style={{
                    flex: 1, padding: '7px 0', borderRadius: T.radiusSm, border: 'none', cursor: 'pointer',
                    background: purchType === t ? 'var(--t-surface)' : 'transparent',
                    color: purchType === t ? 'var(--t-primary)' : 'var(--t-text-tertiary)',
                    fontWeight: purchType === t ? 700 : 500, fontSize: 12,
                    boxShadow: purchType === t ? 'var(--t-shadow-sm)' : 'none', transition: 'all 0.15s',
                  }}>{t === 'cash' ? '💵 Cash' : '🏦 Finance'}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Finance-specific fields */}
          {purchType === 'finance' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>Down Payment — {downPct}%</label>
                  <input type="range" min={0} max={80} step={5} value={downPct}
                    onChange={e => setDownPct(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--t-primary)', cursor: 'pointer', marginTop: 8 }} />
                  {cost > 0 && <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{fmt(cost * downPct / 100)}</div>}
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>Interest Rate (APR)</label>
                  <div style={{ display: 'flex', border: `1px solid var(--t-border-med)`, borderRadius: T.radiusMd, overflow: 'hidden' }}>
                    <input type="number" value={loanRate} step={0.1} min={0} max={30}
                      onChange={e => setLoanRate(Number(e.target.value))}
                      style={{ flex: 1, padding: '9px 10px', border: 'none', outline: 'none', fontSize: 13, color: 'var(--t-text-primary)', background: 'transparent', fontVariantNumeric: 'tabular-nums', minWidth: 0 }} />
                    <span style={{ padding: '9px 10px', background: 'var(--t-bg)', fontSize: 13, color: 'var(--t-text-tertiary)', borderLeft: `1px solid var(--t-border-med)`, flexShrink: 0 }}>%</span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>Loan Term</label>
                  <select value={loanTerm} onChange={e => setLoanTerm(Number(e.target.value))} style={{ ...iStyle, cursor: 'pointer' }}>
                    {[
                      { m: 12,  label: '12 mo (1 yr)' },
                      { m: 24,  label: '24 mo (2 yrs)' },
                      { m: 36,  label: '36 mo (3 yrs)' },
                      { m: 48,  label: '48 mo (4 yrs)' },
                      { m: 60,  label: '60 mo (5 yrs)' },
                      { m: 72,  label: '72 mo (6 yrs)' },
                      { m: 84,  label: '84 mo (7 yrs)' },
                      { m: 180, label: '180 mo (15 yrs)' },
                      { m: 360, label: '360 mo (30 yrs)' },
                    ].map(({ m, label }) => <option key={m} value={m}>{label}</option>)}
                  </select>
                </div>
              </div>

              {/* Taxes + Insurance */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 6 }}>
                  Additional Monthly Costs <span style={{ fontWeight: 400, color: 'var(--t-text-tertiary)' }}>(taxes, insurance, HOA)</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t-text-tertiary)', display: 'block', marginBottom: 4 }}>Property Tax / mo</label>
                    <div style={{ display: 'flex', border: `1px solid var(--t-border-med)`, borderRadius: T.radiusMd, overflow: 'hidden' }}>
                      <span style={{ padding: '9px 10px', background: 'var(--t-bg)', fontSize: 13, color: 'var(--t-text-tertiary)', borderRight: `1px solid var(--t-border-med)`, flexShrink: 0 }}>$</span>
                      <input type="number" value={monthlyTax || ''} placeholder="0" min={0}
                        onChange={e => setMonthlyTax(Number(e.target.value))}
                        style={{ flex: 1, padding: '9px 10px', border: 'none', outline: 'none', fontSize: 13, color: 'var(--t-text-primary)', background: 'transparent', fontVariantNumeric: 'tabular-nums', minWidth: 0 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t-text-tertiary)', display: 'block', marginBottom: 4 }}>Insurance / mo</label>
                    <div style={{ display: 'flex', border: `1px solid var(--t-border-med)`, borderRadius: T.radiusMd, overflow: 'hidden' }}>
                      <span style={{ padding: '9px 10px', background: 'var(--t-bg)', fontSize: 13, color: 'var(--t-text-tertiary)', borderRight: `1px solid var(--t-border-med)`, flexShrink: 0 }}>$</span>
                      <input type="number" value={monthlyIns || ''} placeholder="0" min={0}
                        onChange={e => setMonthlyIns(Number(e.target.value))}
                        style={{ flex: 1, padding: '9px 10px', border: 'none', outline: 'none', fontSize: 13, color: 'var(--t-text-primary)', background: 'transparent', fontVariantNumeric: 'tabular-nums', minWidth: 0 }} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Cash — target date */}
          {purchType === 'cash' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>Target Date (optional)</label>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} style={iStyle} />
            </div>
          )}

          {/* Empty state hint */}
          {!cost && (
            <div style={{ padding: '18px', background: 'var(--t-bg)', borderRadius: T.radiusMd, border: `1px dashed var(--t-border)`, color: 'var(--t-text-tertiary)', fontSize: 12, textAlign: 'center', lineHeight: 1.6 }}>
              Enter a purchase cost to see your readiness analysis, savings timeline, and post-purchase budget impact.
            </div>
          )}
        </div>

        {/* ── RIGHT: RESULTS ── */}
        {analysis ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {analysis.type === 'cash' ? (
              <>
                {/* Cash readiness */}
                <div style={{ padding: '16px 18px', borderRadius: T.radiusMd, background: analysis.canAfford ? 'var(--t-green-bg)' : 'var(--t-amber-bg)', border: `1px solid ${analysis.canAfford ? 'var(--t-green-border)' : 'var(--t-amber-border)'}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: analysis.canAfford ? 'var(--t-green-text)' : 'var(--t-amber-text)', marginBottom: 8 }}>
                    {analysis.cat.icon} {name || analysis.cat.label} — Cash Purchase
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: analysis.canAfford ? 'var(--t-green)' : 'var(--t-amber)', marginBottom: 10 }}>
                    {analysis.canAfford ? 'Ready to buy' : `Save ${fmt(analysis.cashShortage)} more`}
                  </div>
                  <ProgressBar pct={analysis.savingsPct} color={analysis.canAfford ? 'var(--t-green)' : 'var(--t-amber)'} height={8} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--t-text-tertiary)' }}>{fmt(Math.min(currentCash, analysis.cashNeeded))} saved</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-primary)' }}>{fmt(analysis.cashNeeded)} target</span>
                  </div>
                  {!analysis.canAfford && analysis.monthsToSave != null && (
                    <div style={{ fontSize: 12, color: 'var(--t-text-secondary)', marginTop: 8 }}>
                      At {fmt(monthlySurplus)}/mo surplus — ready in <strong>{analysis.monthsToSave} months</strong>
                      {analysis.readyDate && ` (${analysis.readyDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`}.
                    </div>
                  )}
                </div>
                {analysis.oppCost5yr > 0 && (
                  <div style={{ padding: '12px 14px', borderRadius: T.radiusMd, background: 'var(--t-purple-bg)', border: `1px solid var(--t-purple-border)` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-purple-text)', marginBottom: 4 }}>Opportunity Cost (5 years @ 8%)</div>
                    <div style={{ fontSize: 12, color: 'var(--t-text-secondary)' }}>
                      Investing {fmt(analysis.cashNeeded)} instead could grow to <strong style={{ color: 'var(--t-purple)' }}>{fmt(analysis.cashNeeded + analysis.oppCost5yr)}</strong> — a gain of {fmt(analysis.oppCost5yr)}.
                      {analysis.cat.appreciates ? ' This asset tends to appreciate, which may offset this.' : ' Consider the true net cost of paying cash.'}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* ─── FINANCE RESULTS GRID ─── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div style={{ padding: '12px 14px', background: 'var(--t-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-border)` }}>
                    <div style={{ fontSize: 9, color: 'var(--t-text-tertiary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 3 }}>DOWN PAYMENT</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(analysis.downPayment)}</div>
                    <div style={{ fontSize: 11, color: analysis.canAffordDown ? 'var(--t-green-text)' : 'var(--t-red-text)', marginTop: 2 }}>
                      {analysis.canAffordDown ? '✓ In cash balance' : `Need ${fmt(analysis.downShortage)} more`}
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px', background: 'var(--t-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-border)` }}>
                    <div style={{ fontSize: 9, color: 'var(--t-text-tertiary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 3 }}>P&I / MONTH</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(analysis.monthlyPmt)}</div>
                    <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 2 }}>Principal &amp; interest</div>
                  </div>
                  <div style={{ padding: '12px 14px', background: 'var(--t-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-border)` }}>
                    <div style={{ fontSize: 9, color: 'var(--t-text-tertiary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 3 }}>TOTAL INTEREST</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-red)', fontVariantNumeric: 'tabular-nums' }}>{fmt(analysis.totalInterest)}</div>
                    <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 2 }}>Over {loanTerm} months</div>
                  </div>
                </div>

                {/* PITI row when addl costs are set */}
                {analysis.hasAddlCosts && (
                  <div style={{ padding: '14px 16px', borderRadius: T.radiusMd, background: 'var(--t-primary-bg)', border: `1px solid var(--t-primary-border)` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t-primary)', marginBottom: 8 }}>TOTAL MONTHLY HOUSING COST (PITI)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--t-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(analysis.monthlyPITI)}</div>
                        <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 2 }}>
                          P&amp;I {fmt(analysis.monthlyPmt)}
                          {monthlyTax > 0 && ` + Tax ${fmt(monthlyTax)}`}
                          {monthlyIns > 0 && ` + Ins ${fmt(monthlyIns)}`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: analysis.paymentFeasible ? 'var(--t-green-text)' : 'var(--t-red-text)' }}>
                          {analysis.paymentFeasible ? `✓ ${fmt(analysis.surplusAfter)}/mo left` : `⚠ Over by ${fmt(Math.abs(analysis.surplusAfter))}`}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', marginTop: 2 }}>vs current surplus</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── DOWN PAYMENT READINESS ─── */}
                {dpStatus && (
                  <div style={{ padding: '14px 16px', borderRadius: T.radiusMd, background: dpStatus.onTrack ? 'var(--t-green-bg)' : 'var(--t-amber-bg)', border: `1px solid ${dpStatus.onTrack ? 'var(--t-green-border)' : 'var(--t-amber-border)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: dpStatus.onTrack ? 'var(--t-green-text)' : 'var(--t-amber-text)' }}>
                        {dpStatus.fromGoal ? `📌 Down Payment — from "${linkedGoal?.name}"` : '💰 Down Payment Readiness'}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: dpStatus.onTrack ? 'var(--t-green)' : 'var(--t-amber)' }}>
                        {dpStatus.pct.toFixed(0)}%
                      </span>
                    </div>
                    <ProgressBar pct={dpStatus.pct} color={dpStatus.onTrack ? 'var(--t-green)' : 'var(--t-amber)'} height={8} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--t-text-tertiary)' }}>{fmt(dpStatus.saved)} saved</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-primary)' }}>{fmt(dpStatus.needed)} needed</span>
                    </div>
                    {!dpStatus.onTrack && dpStatus.monthlyNeeded != null && (
                      <div style={{ fontSize: 12, color: 'var(--t-text-secondary)', marginTop: 6 }}>
                        Need <strong>{fmt(dpStatus.monthlyNeeded)}/mo</strong> to reach down payment{dpStatus.monthsLeft ? ` in ${dpStatus.monthsLeft} months` : ''}.
                      </div>
                    )}
                    {!dpStatus.onTrack && dpStatus.monthlyNeeded == null && (
                      <div style={{ fontSize: 12, color: 'var(--t-text-secondary)', marginTop: 6 }}>
                        Short by {fmt(dpStatus.needed - dpStatus.saved)}. At {fmt(monthlySurplus)}/mo surplus — ready in {monthlySurplus > 0 ? Math.ceil((dpStatus.needed - dpStatus.saved) / monthlySurplus) : '∞'} months.
                      </div>
                    )}
                    {dpStatus.onTrack && <div style={{ fontSize: 12, color: 'var(--t-green-text)', marginTop: 6 }}>✓ Down payment fully saved.</div>}
                  </div>
                )}

                {/* ─── BUDGET WATERFALL ─── */}
                {budgetReadiness && (
                  <div style={{ padding: '16px 18px', borderRadius: T.radiusMd, background: statusBg, border: `1px solid ${statusBorder}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: statusText }}>📊 Budget After Purchase</div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: statusColor, color: '#fff' }}>{statusLabel}</span>
                    </div>
                    {/* Waterfall bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[
                        { label: 'Monthly Income', value: avgMonthlyIncome, color: 'var(--t-green)', width: 100 },
                        { label: 'Current Expenses', value: -avgMonthlyExpenses, color: 'var(--t-red)', width: avgMonthlyIncome > 0 ? (avgMonthlyExpenses / avgMonthlyIncome) * 100 : 0 },
                        { label: `Housing (PITI)`, value: -budgetReadiness.piti, color: 'var(--t-primary)', width: avgMonthlyIncome > 0 ? (budgetReadiness.piti / avgMonthlyIncome) * 100 : 0 },
                        { label: 'Remaining', value: budgetReadiness.remainingAfterPITI, color: budgetReadiness.remainingAfterPITI >= 0 ? 'var(--t-green)' : 'var(--t-red)', width: avgMonthlyIncome > 0 ? Math.abs(budgetReadiness.remainingAfterPITI / avgMonthlyIncome) * 100 : 0 },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ fontSize: 11, color: 'var(--t-text-secondary)', width: 130, flexShrink: 0 }}>{row.label}</div>
                          <div style={{ flex: 1, height: 6, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, row.width)}%`, background: row.color, borderRadius: 100 }} />
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: row.value >= 0 ? 'var(--t-text-primary)' : 'var(--t-red)', fontVariantNumeric: 'tabular-nums', width: 80, textAlign: 'right', flexShrink: 0 }}>
                            {row.value >= 0 ? '' : '−'}{fmt(Math.abs(row.value))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Housing ratio benchmark */}
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${statusBorder}`, fontSize: 11, color: statusText }}>
                      Housing ratio: <strong>{budgetReadiness.housingRatio.toFixed(1)}%</strong> of income
                      {budgetReadiness.affordable && ' — within the 28% guideline ✓'}
                      {budgetReadiness.stretched && ' — above the 28% guideline, under 36%'}
                      {budgetReadiness.strained && ' — exceeds the 36% max DTI rule ⚠'}
                    </div>
                  </div>
                )}

                {/* Finance vs invest */}
                <div style={{ padding: '12px 14px', borderRadius: T.radiusMd, background: analysis.betterToFinance ? 'var(--t-green-bg)' : 'var(--t-purple-bg)', border: `1px solid ${analysis.betterToFinance ? 'var(--t-green-border)' : 'var(--t-purple-border)'}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: analysis.betterToFinance ? 'var(--t-green-text)' : 'var(--t-purple-text)', marginBottom: 4 }}>Finance vs. Pay Cash</div>
                  <div style={{ fontSize: 12, color: 'var(--t-text-secondary)' }}>
                    {analysis.betterToFinance
                      ? `At ${loanRate}% APR, financing may be smart — your down payment invested at 8% could grow by ${fmt(analysis.oppCostDown5yr)} over 5 years, more than the ${fmt(analysis.totalInterest)} interest cost.`
                      : `At ${loanRate}% APR, the ${fmt(analysis.totalInterest)} interest cost exceeds what your ${fmt(analysis.downPayment)} down payment would earn invested at 8%. Paying cash saves more long-term.`}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--t-bg)', borderRadius: T.radiusMd, border: `1px dashed var(--t-border)`, color: 'var(--t-text-tertiary)', fontSize: 13 }}>
            Enter a purchase cost to see your analysis.
          </div>
        )}

      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────
   HERO CARD
───────────────────────────────────────────────────────────── */
function HeroCard({ goals, taMap, monthlySurplus }: {
  goals: LifeGoal[];
  taMap: Record<string, TrackAnalysis>;
  monthlySurplus: number;
}) {
  const totalTarget   = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved    = goals.reduce((s, g) => s + g.currentSaved + (g.allocatedCash ?? 0) + (g.allocatedInvestment ?? 0), 0);
  const totalContrib  = goals.reduce((s, g) => s + g.monthlyContrib, 0);
  const fullyFunded   = goals.filter(g => taMap[g.id]?.done).length;
  const onTrackCount  = goals.filter(g => taMap[g.id]?.onTrack && !taMap[g.id]?.done).length;
  const overallPct    = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
  const nearestGoal   = [...goals]
    .filter(g => !taMap[g.id]?.done && g.targetDate)
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())[0];

  return (
    <div style={{
      background: 'var(--t-surface)', border: '1px solid var(--t-border)',
      borderLeft: '4px solid var(--t-primary)',
      borderRadius: 14, boxShadow: 'var(--t-shadow-sm)',
      padding: '40px 48px', marginBottom: 20, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--t-primary), #4da3ff, var(--t-primary), transparent)' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(77,163,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(77,163,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 100% 50%, black 30%, transparent 80%)', maskImage: 'radial-gradient(ellipse 80% 100% at 100% 50%, black 30%, transparent 80%)' }} />

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 28 }}>
        {/* Left */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--t-primary)', marginBottom: 8 }}>
            Life Goals · {goals.length} Active
          </div>
          <div style={{
            fontSize: 56, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 14,
            fontVariantNumeric: 'tabular-nums',
            background: 'linear-gradient(135deg, var(--t-text-primary) 0%, var(--t-primary) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>{goals.length > 0 ? `${overallPct}%` : '—'}</div>
          {nearestGoal && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--t-primary-bg)', border: '1px solid var(--t-primary-border)' }}>
              <span style={{ fontSize: 13 }}>{nearestGoal.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-primary)' }}>Next: {nearestGoal.name} · {fmtShortDate(nearestGoal.targetDate)}</span>
            </div>
          )}
        </div>

        {/* Right stats */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {[
            { label: 'Fully Funded',  value: String(fullyFunded),          color: 'var(--t-green-text, #16a34a)' },
            { label: 'On Track',      value: String(onTrackCount),          color: 'var(--t-primary)' },
            { label: 'Monthly',       value: totalContrib > 0 ? fmt(totalContrib) : '—', color: 'var(--t-amber-text, #b45309)' },
            { label: 'Total Value',   value: totalTarget > 0 ? fmtShort(totalTarget) : '—', color: 'var(--t-text-primary)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'right', paddingTop: 8, minWidth: 72 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t-text-tertiary)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      {goals.length > 0 && (
        <div style={{ paddingTop: 24, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'var(--t-border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, overallPct)}%`, background: 'var(--t-primary)', borderRadius: 5, transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--t-primary)', minWidth: 40, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{overallPct}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-primary)' }}>{fmt(totalSaved)} saved</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalTarget)} total</span>
          </div>
          {monthlySurplus > totalContrib && totalContrib > 0 && (
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--t-green-text, #15803d)', fontWeight: 600 }}>
              💚 {fmt(monthlySurplus - totalContrib)}/mo unallocated surplus — available to accelerate goals
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────
   MOBILE VIEW — shared mobile design system
───────────────────────────────────────────────────────────── */
function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

const MN = {
  card:   '#172554',
  border: 'rgba(255,255,255,0.08)',
  text:   '#ffffff',
  muted:  'rgba(255,255,255,0.55)',
  faint:  'rgba(255,255,255,0.35)',
  green:  '#34D399',
  red:    '#F87171',
  gold:   '#2ED3C6',
  amber:  '#FBBF24',
};

function MobileGoalCard({ goal, ta, onEdit, onAddFunds }: {
  goal: LifeGoal; ta: any; onEdit: () => void; onAddFunds: (amt: number) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [amt, setAmt] = useState('');
  const pct = goal.targetAmount > 0 ? Math.min(100, (goal.currentSaved / goal.targetAmount) * 100) : 0;
  const done = ta?.done;
  const onTrack = ta?.onTrack || done;
  const statusColor = done ? MN.green : onTrack ? MN.gold : MN.amber;

  return (
    <div style={{ background: MN.card, borderRadius: 16, border: `1px solid ${MN.border}`, padding: '14px 14px', marginBottom: 12 }}>
      <div onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: `${goal.color}22`, border: `1px solid ${goal.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>{goal.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: MN.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.name}</div>
          <div style={{ fontSize: 11, color: MN.faint, marginTop: 2 }}>
            {fmt(goal.currentSaved)} of {fmt(goal.targetAmount)}
            {goal.monthlyContrib > 0 ? ` · ${fmt(goal.monthlyContrib)}/mo` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: goal.color, fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(0)}%</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: statusColor }}>{done ? '🎉 Done' : onTrack ? 'On track' : 'Behind'}</div>
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginTop: 10 }}>
        <div style={{ height: 6, borderRadius: 3, width: `${pct}%`, background: goal.color, transition: 'width 0.6s ease' }} />
      </div>
      {!done && !onTrack && ta?.gapPerMonth > 0 && (
        <div style={{ fontSize: 11, color: MN.amber, fontWeight: 600, marginTop: 6 }}>
          Add {fmt(ta.gapPerMonth)}/mo to hit {fmtShortDate(goal.targetDate)}
        </div>
      )}
      {/* Quick add funds */}
      <div style={{ marginTop: 10 }}>
        {adding ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number" inputMode="decimal" placeholder="Amount" value={amt} autoFocus
              onChange={e => setAmt(e.target.value)}
              style={{ flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 16, background: 'rgba(255,255,255,0.06)', border: `1px solid ${MN.border}`, color: MN.text, outline: 'none', boxSizing: 'border-box' }}
            />
            <button onClick={() => { const v = parseFloat(amt); if (v > 0) { onAddFunds(v); showToast(`Added ${fmt(v)} to ${goal.name} ✓`); } setAdding(false); setAmt(''); }} style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: goal.color, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Add</button>
            <button onClick={() => { setAdding(false); setAmt(''); }} style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${MN.border}`, background: 'transparent', color: MN.muted, fontSize: 13, cursor: 'pointer' }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{
            width: '100%', padding: '9px 0', borderRadius: 10,
            border: `1px solid ${goal.color}40`, background: `${goal.color}15`,
            color: goal.color, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>+ Add Funds</button>
        )}
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const isMobile = useMobile();
  const { currentSnapshot }               = useWealthData();
  const { incomeAnalytics, expenseAnalytics } = useFlowData();

  const [goals,    setGoals]    = useState<LifeGoal[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<LifeGoal | null>(null);
  const [filter,   setFilter]   = useState<GoalCategoryKey | 'all'>('all');

  /* ── Load from Supabase on mount ── */
  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then((data: LifeGoal[]) => { setGoals(Array.isArray(data) ? data : []); })
      .catch(() => setGoals([]))
      .finally(() => setLoading(false));
  }, []);

  /* ── Create or update a goal ── */
  const upsert = useCallback(async (g: LifeGoal) => {
    setSaving(true);
    const isNew = !goals.find(i => i.id === g.id);
    try {
      if (isNew) {
        const res   = await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(g) });
        const saved = await res.json();
        if (!res.ok) { console.error('Goal save failed:', saved.error); return; }
        setGoals(prev => [...prev, saved]);
      } else {
        const res   = await fetch(`/api/goals/${g.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(g) });
        const saved = await res.json();
        if (!res.ok) { console.error('Goal update failed:', saved.error); return; }
        setGoals(prev => prev.map(i => i.id === g.id ? saved : i));
      }
    } finally {
      setSaving(false);
      setShowForm(false);
      setEditing(null);
    }
  }, [goals]);

  /* ── Delete ── */
  const remove = useCallback(async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id)); // optimistic
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
  }, []);

  /* ── Add funds (increment currentSaved) ── */
  const addFunds = useCallback(async (id: string, amt: number) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const newSaved = goal.currentSaved + amt;
    setGoals(prev => prev.map(g => g.id === id ? { ...g, currentSaved: newSaved } : g)); // optimistic
    await fetch(`/api/goals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentSaved: newSaved }) });
  }, [goals]);

  /* ── Set saved amount directly ── */
  const updateSaved = useCallback(async (id: string, amt: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, currentSaved: amt } : g)); // optimistic
    await fetch(`/api/goals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentSaved: amt }) });
  }, []);

  /* ── context data ── */
  const cashBalance       = (currentSnapshot?.bankAccounts ?? []).reduce((s: number, a: any) => s + (a.balance ?? 0), 0);
  const avgMonthlyExpenses = expenseAnalytics?.averageMonthlyExpenses ?? 0;
  const avgMonthlyIncome   = incomeAnalytics?.averageMonthlyIncome   ?? 0;
  const monthlySurplus     = Math.max(0, avgMonthlyIncome - avgMonthlyExpenses);

  /* ── derived ── */
  const analyses   = useMemo(() => goals.map(g => ({ id: g.id, ta: trackAnalysis(g) })), [goals]);
  const taMap      = Object.fromEntries(analyses.map(a => [a.id, a.ta]));

  const totalCommitted   = goals.reduce((s, g) => s + g.monthlyContrib, 0);
  const onTrackCount     = goals.filter(g => taMap[g.id]?.onTrack || taMap[g.id]?.done).length;
  const doneCount        = goals.filter(g => taMap[g.id]?.done).length;
  const totalTargetAmt   = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSavedAmt    = goals.reduce((s, g) => s + g.currentSaved, 0);
  const overallPct       = totalTargetAmt > 0 ? Math.round((totalSavedAmt / totalTargetAmt) * 100) : 0;

  const filteredGoals = filter === 'all' ? goals : goals.filter(g => g.category === filter);

  const activeCategories = useMemo(() =>
    Array.from(new Set(goals.map(g => g.category))),
  [goals]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div style={{ width: 32, height: 32, border: `3px solid var(--t-border)`, borderTop: `3px solid var(--t-primary)`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── MOBILE VIEW ── */
  if (isMobile) {
    const behindGoals = goals.filter(g => !taMap[g.id]?.onTrack && !taMap[g.id]?.done);
    return (
      <div style={{ color: MN.text, fontFamily: 'var(--font-body)', paddingBottom: 16 }}>

        {/* WIZARD — reuse desktop wizard (stacks vertically) */}
        {(showForm || editing) && (
          <GoalWizard
            initial={editing}
            onSave={upsert}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            defaultCashBalance={cashBalance}
            defaultMonthlyExpenses={avgMonthlyExpenses}
            saving={saving}
          />
        )}

        {/* HERO */}
        <div style={{
          background: 'linear-gradient(135deg, #0a3fa8 0%, #0F2044 100%)',
          borderRadius: 20, padding: '24px 20px 20px', marginBottom: 16,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, transparent, ${MN.gold}, #67E6D5, ${MN.gold}, transparent)` }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(46,211,198,0.75)', marginBottom: 6 }}>
            Life Goals · Total Saved
          </div>
          <div style={{
            fontSize: 42, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 12,
            backgroundImage: `linear-gradient(135deg, #ffffff 0%, ${MN.gold} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {fmt(totalSavedAmt)}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(46,211,198,0.15)', border: '1px solid rgba(46,211,198,0.35)',
            borderRadius: 100, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: MN.gold,
          }}>
            {overallPct}% of {fmt(totalTargetAmt)}
            <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>· {onTrackCount}/{goals.length} on track</span>
          </div>
          {goals.length > 0 && (
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.12)', marginTop: 14 }}>
              <div style={{ height: 8, borderRadius: 4, width: `${overallPct}%`, background: `linear-gradient(90deg, #0a3fa8, ${MN.gold})`, transition: 'width 0.8s ease' }} />
            </div>
          )}
        </div>

        {/* NEW GOAL */}
        <button onClick={() => { setEditing(null); setShowForm(s => !s); }} style={{
          width: '100%', padding: '14px 0', borderRadius: 14, marginBottom: 16,
          background: 'linear-gradient(135deg, #0a3fa8, #4DA3FF)', border: 'none',
          color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(10,63,168,0.3)',
        }}>
          {showForm && !editing ? '✕ Cancel' : '+ New Goal'}
        </button>

        {goals.length === 0 ? (
          <div style={{ background: MN.card, borderRadius: 16, border: `1px dashed ${MN.border}`, padding: '36px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: MN.text, marginBottom: 6 }}>Set your first life goal</div>
            <div style={{ fontSize: 12, color: MN.muted, lineHeight: 1.6, marginBottom: 16 }}>
              Home, emergency fund, education, early retirement — define it and Nautilus shows you how to get there.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {(['home','emergency','education','retirement'] as GoalCategoryKey[]).map(k => (
                <button key={k} onClick={() => setShowForm(true)} style={{
                  padding: '10px 14px', borderRadius: 100,
                  background: `${GOAL_CATS[k].defaultColor}18`, border: `1px solid ${GOAL_CATS[k].defaultColor}40`,
                  color: GOAL_CATS[k].defaultColor, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>
                  {GOAL_CATS[k].emoji} {GOAL_CATS[k].label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* FILTER CHIPS */}
            {activeCategories.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}>
                <button onClick={() => setFilter('all')} style={{
                  padding: '8px 14px', borderRadius: 100, whiteSpace: 'nowrap', flexShrink: 0,
                  border: `1px solid ${filter === 'all' ? MN.gold : MN.border}`,
                  background: filter === 'all' ? 'rgba(46,211,198,0.15)' : MN.card,
                  color: filter === 'all' ? MN.gold : MN.muted,
                  fontSize: 12.5, fontWeight: 700, cursor: 'pointer', minHeight: 36,
                }}>All ({goals.length})</button>
                {activeCategories.map(k => (
                  <button key={k} onClick={() => setFilter(k)} style={{
                    padding: '8px 14px', borderRadius: 100, whiteSpace: 'nowrap', flexShrink: 0,
                    border: `1px solid ${filter === k ? GOAL_CATS[k].defaultColor : MN.border}`,
                    background: filter === k ? `${GOAL_CATS[k].defaultColor}22` : MN.card,
                    color: filter === k ? GOAL_CATS[k].defaultColor : MN.muted,
                    fontSize: 12.5, fontWeight: 700, cursor: 'pointer', minHeight: 36,
                  }}>
                    {GOAL_CATS[k].emoji} {GOAL_CATS[k].label}
                  </button>
                ))}
              </div>
            )}

            {/* GOAL CARDS */}
            {filteredGoals.map(g => (
              <MobileGoalCard
                key={g.id}
                goal={g}
                ta={taMap[g.id]}
                onEdit={() => { setEditing(g); setShowForm(false); }}
                onAddFunds={amt => addFunds(g.id, amt)}
              />
            ))}

            {/* INSIGHTS */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 2px 8px' }}>Insights</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {monthlySurplus > 0 && totalCommitted < monthlySurplus && (
                <div style={{ background: MN.card, borderRadius: 14, border: `1px solid ${MN.border}`, borderLeft: `3px solid ${MN.green}`, padding: '11px 13px', fontSize: 12, color: MN.muted, lineHeight: 1.55 }}>
                  💚 <strong style={{ color: MN.green }}>{fmt(monthlySurplus - totalCommitted)}/mo unallocated</strong> above your goal contributions — route it to your top goal to accelerate.
                </div>
              )}
              {monthlySurplus > 0 && totalCommitted > monthlySurplus && (
                <div style={{ background: MN.card, borderRadius: 14, border: `1px solid ${MN.border}`, borderLeft: `3px solid ${MN.red}`, padding: '11px 13px', fontSize: 12, color: MN.muted, lineHeight: 1.55 }}>
                  ⚠️ Contributions ({fmt(totalCommitted)}/mo) exceed your surplus ({fmt(monthlySurplus)}/mo) by <strong style={{ color: MN.red }}>{fmt(totalCommitted - monthlySurplus)}</strong>.
                </div>
              )}
              {behindGoals.map(g => (
                <div key={g.id} style={{ background: MN.card, borderRadius: 14, border: `1px solid ${MN.border}`, borderLeft: `3px solid ${MN.amber}`, padding: '11px 13px', fontSize: 12, color: MN.muted, lineHeight: 1.55 }}>
                  {g.emoji} <strong style={{ color: MN.text }}>{g.name}</strong> is behind — add <strong style={{ color: MN.amber }}>{fmt(taMap[g.id]?.gapPerMonth ?? 0)}/mo</strong> to hit {fmtShortDate(g.targetDate)}.
                </div>
              ))}
              {goals.length > 0 && goals.every(g => taMap[g.id]?.onTrack || taMap[g.id]?.done) && (
                <div style={{ background: MN.card, borderRadius: 14, border: `1px solid ${MN.border}`, borderLeft: `3px solid ${MN.green}`, padding: '11px 13px', fontSize: 12, color: MN.green, fontWeight: 600 }}>
                  ✅ All goals on track. You're building the life you planned.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 72px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--t-text-primary)', letterSpacing: '-0.02em' }}>Life Goals</div>
          <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)', marginTop: 3 }}>
            Big milestones — home, retirement, education, and beyond. Track your progress toward the life you're building.
          </div>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(s => !s); }} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
          background: 'var(--t-primary)', color: '#fff', border: 'none', borderRadius: T.radiusMd,
          fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(10,63,168,0.28)',
        }}>
          {showForm && !editing ? '✕ Cancel' : '+ New Goal'}
        </button>
      </div>

      {/* ── WIZARD ── */}
      {(showForm || editing) && (
        <GoalWizard
          initial={editing}
          onSave={upsert}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          defaultCashBalance={cashBalance}
          defaultMonthlyExpenses={avgMonthlyExpenses}
          saving={saving}
        />
      )}

      {/* ── HERO CARD ── */}
      <HeroCard goals={goals} taMap={taMap} monthlySurplus={monthlySurplus} />

      {goals.length === 0 ? (
        /* ── EMPTY STATE ── */
        <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `2px dashed var(--t-border)`, padding: '80px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t-text-primary)', marginBottom: 8 }}>Set your first life goal</div>
          <div style={{ fontSize: 14, color: 'var(--t-text-tertiary)', maxWidth: 400, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Whether it's buying a home, building an emergency fund, funding college, or retiring early — define your milestones and Nautilius will show you exactly how to get there.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            {(['home','emergency','education','retirement'] as GoalCategoryKey[]).map(k => (
              <button key={k} onClick={() => setShowForm(true)} style={{
                padding: '10px 16px', borderRadius: T.radiusMd,
                background: `${GOAL_CATS[k].defaultColor}12`,
                border: `1.5px solid ${GOAL_CATS[k].defaultColor}30`,
                color: GOAL_CATS[k].defaultColor, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                {GOAL_CATS[k].emoji} {GOAL_CATS[k].label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowForm(true)} style={{
            padding: '12px 28px', borderRadius: T.radiusMd, border: 'none',
            background: 'var(--t-primary)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(10,63,168,0.3)',
          }}>
            + Create a Goal
          </button>
        </div>
      ) : (
        <>
          {/* ── TIMELINE ── */}
          <GoalTimeline goals={goals} />

          {/* ── FILTER TABS ── */}
          {activeCategories.length > 1 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
              <button onClick={() => setFilter('all')} style={{
                padding: '6px 14px', borderRadius: 100, border: `1.5px solid ${filter === 'all' ? 'var(--t-primary)' : 'var(--t-border)'}`,
                background: filter === 'all' ? 'var(--t-primary-bg)' : 'var(--t-surface)', color: filter === 'all' ? 'var(--t-primary)' : 'var(--t-text-tertiary)',
                fontSize: 12, fontWeight: filter === 'all' ? 700 : 500, cursor: 'pointer',
              }}>All Goals ({goals.length})</button>
              {activeCategories.map(k => (
                <button key={k} onClick={() => setFilter(k)} style={{
                  padding: '6px 14px', borderRadius: 100,
                  border: `1.5px solid ${filter === k ? GOAL_CATS[k].defaultColor : 'var(--t-border)'}`,
                  background: filter === k ? `${GOAL_CATS[k].defaultColor}12` : 'var(--t-surface)',
                  color: filter === k ? GOAL_CATS[k].defaultColor : 'var(--t-text-tertiary)',
                  fontSize: 12, fontWeight: filter === k ? 700 : 500, cursor: 'pointer',
                }}>
                  {GOAL_CATS[k].emoji} {GOAL_CATS[k].label}
                </button>
              ))}
            </div>
          )}

          {/* ── GOALS GRID ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, marginBottom: 28 }}>
            {filteredGoals.map(g => (
              <GoalCard
                key={g.id}
                goal={g}
                onEdit={() => { setEditing(g); setShowForm(false); }}
                onDelete={() => remove(g.id)}
                onAddFunds={amt => addFunds(g.id, amt)}
                onUpdateSaved={amt => updateSaved(g.id, amt)}
              />
            ))}
          </div>

          {/* ── INSIGHTS PANEL ── */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text-primary)', marginBottom: 14 }}>Nautilius Goal Insights</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Surplus allocation tip */}
              {monthlySurplus > 0 && totalCommitted < monthlySurplus && (
                <div style={{ display: 'flex', gap: 10, padding: '11px 13px', borderRadius: T.radiusMd, background: 'var(--t-green-bg)', border: `1px solid var(--t-green-border)` }}>
                  <span style={{ flexShrink: 0 }}>💚</span>
                  <span style={{ fontSize: 12, color: 'var(--t-text-secondary)', lineHeight: 1.55 }}>
                    You have <strong style={{ color: 'var(--t-green)' }}>{fmt(monthlySurplus - totalCommitted)}/mo unallocated</strong> above your goal contributions. Routing it to your highest-priority goal would accelerate your timeline.
                  </span>
                </div>
              )}

              {/* Over-committed warning */}
              {monthlySurplus > 0 && totalCommitted > monthlySurplus && (
                <div style={{ display: 'flex', gap: 10, padding: '11px 13px', borderRadius: T.radiusMd, background: 'var(--t-red-bg)', border: `1px solid var(--t-red-border)` }}>
                  <span style={{ flexShrink: 0 }}>⚠️</span>
                  <span style={{ fontSize: 12, color: 'var(--t-text-secondary)', lineHeight: 1.55 }}>
                    Your goal contributions ({fmt(totalCommitted)}/mo) exceed your monthly surplus ({fmt(monthlySurplus)}/mo) by <strong style={{ color: 'var(--t-red)' }}>{fmt(totalCommitted - monthlySurplus)}</strong>. Consider reducing some contributions or increasing income.
                  </span>
                </div>
              )}

              {/* Off-track goals */}
              {goals.filter(g => !taMap[g.id]?.onTrack && !taMap[g.id]?.done).map(g => (
                <div key={g.id} style={{ display: 'flex', gap: 10, padding: '11px 13px', borderRadius: T.radiusMd, background: 'var(--t-amber-bg)', border: `1px solid var(--t-amber-border)` }}>
                  <span style={{ flexShrink: 0 }}>{g.emoji}</span>
                  <span style={{ fontSize: 12, color: 'var(--t-text-secondary)', lineHeight: 1.55 }}>
                    <strong>{g.name}</strong> is behind schedule. Add <strong style={{ color: 'var(--t-amber)' }}>{fmt(taMap[g.id]?.gapPerMonth ?? 0)}/mo</strong> to hit your {fmtShortDate(g.targetDate)} target.
                  </span>
                </div>
              ))}

              {/* Achieved goals */}
              {goals.filter(g => taMap[g.id]?.done).map(g => (
                <div key={g.id} style={{ display: 'flex', gap: 10, padding: '11px 13px', borderRadius: T.radiusMd, background: 'var(--t-green-bg)', border: `1px solid var(--t-green-border)` }}>
                  <span style={{ flexShrink: 0 }}>🎉</span>
                  <span style={{ fontSize: 12, color: 'var(--t-text-secondary)', lineHeight: 1.55 }}>
                    <strong style={{ color: 'var(--t-green)' }}>{g.name}</strong> is complete! You saved {fmt(g.currentSaved)} — amazing work. Consider redirecting that {fmt(g.monthlyContrib)}/mo to your next goal.
                  </span>
                </div>
              ))}

              {/* Approaching deadlines */}
              {goals.filter(g => !taMap[g.id]?.done && taMap[g.id] && monthsUntil(g.targetDate) <= 6 && monthsUntil(g.targetDate) > 0).map(g => (
                <div key={g.id} style={{ display: 'flex', gap: 10, padding: '11px 13px', borderRadius: T.radiusMd, background: 'var(--t-primary-bg)', border: `1px solid var(--t-primary-border)` }}>
                  <span style={{ flexShrink: 0 }}>⏰</span>
                  <span style={{ fontSize: 12, color: 'var(--t-text-secondary)', lineHeight: 1.55 }}>
                    <strong>{g.name}</strong> is due in <strong>{monthsUntil(g.targetDate)} months</strong> — {fmt(Math.max(0, g.targetAmount - g.currentSaved))} still needed. You're {taMap[g.id]!.pct.toFixed(0)}% there.
                  </span>
                </div>
              ))}

              {/* Retirement cross-link */}
              {goals.some(g => g.category === 'retirement') && (
                <div style={{ display: 'flex', gap: 10, padding: '11px 13px', borderRadius: T.radiusMd, background: 'var(--t-purple-bg)', border: `1px solid var(--t-purple-border)` }}>
                  <span style={{ flexShrink: 0 }}>🏖️</span>
                  <span style={{ fontSize: 12, color: 'var(--t-text-secondary)', lineHeight: 1.55 }}>
                    For a full retirement projection with Social Security, withdrawal rates, and portfolio longevity, visit the <a href="/dashboard/retirement" style={{ color: 'var(--t-purple)', fontWeight: 700 }}>Retirement page →</a>
                  </span>
                </div>
              )}


              {goals.length > 0 && goals.every(g => taMap[g.id]?.onTrack || taMap[g.id]?.done) && (
                <div style={{ display: 'flex', gap: 10, padding: '11px 13px', borderRadius: T.radiusMd, background: 'var(--t-green-bg)', border: `1px solid var(--t-green-border)` }}>
                  <span style={{ flexShrink: 0 }}>✅</span>
                  <span style={{ fontSize: 12, color: 'var(--t-green-text)', fontWeight: 600, lineHeight: 1.55 }}>
                    All goals are on track. You're building the life you planned. Keep it up!
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── PURCHASE ANALYZER — always visible ── */}
      <div style={{ marginTop: 28 }} />
      <PurchaseAnalyzerSection
        goals={goals}
        currentCash={cashBalance}
        monthlySurplus={monthlySurplus}
        avgMonthlyExpenses={avgMonthlyExpenses}
        avgMonthlyIncome={avgMonthlyIncome}
      />
    </div>
  );
}
