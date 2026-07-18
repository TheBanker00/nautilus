'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts';
import { useFinancialData as useWealthData } from '../../lib/financialdatacontext';
import { useFinancialData as useFlowData }   from '../../lib/hooks/usefinancialdata';

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
  teal:          '#0891B2',
  tealBg:        '#ECFEFF',
  tealBorder:    '#A5F3FC',
  tealText:      '#0E7490',
  purple:        '#7C3AED',
  purpleBg:      '#F5F3FF',
  purpleBorder:  '#DDD6FE',
  purpleText:    '#6D28D9',
  radius:        '12px',
  radiusSm:      '6px',
  radiusMd:      '8px',
};

/* ─────────────────────────────────────────────────────────────
   PURCHASE ANALYZER TYPES
───────────────────────────────────────────────────────────── */
type PurchaseType = 'cash' | 'finance';
type PurchaseCategory = 'vehicle' | 'home' | 'renovation' | 'vacation' | 'electronics' | 'education' | 'other';

const PURCHASE_CATS: Record<PurchaseCategory, { label: string; icon: string; appreciates: boolean }> = {
  vehicle:     { label: 'Vehicle',          icon: '🚗', appreciates: false },
  home:        { label: 'Home / Property',  icon: '🏠', appreciates: true  },
  renovation:  { label: 'Renovation',       icon: '🔨', appreciates: true  },
  vacation:    { label: 'Vacation',         icon: '✈️', appreciates: false },
  electronics: { label: 'Electronics',      icon: '💻', appreciates: false },
  education:   { label: 'Education',        icon: '🎓', appreciates: true  },
  other:       { label: 'Other',            icon: '📦', appreciates: false },
};

/* ─────────────────────────────────────────────────────────────
   FINANCE MATH
───────────────────────────────────────────────────────────── */
function calcMonthlyPayment(principal: number, annualRatePct: number, termMonths: number): number {
  if (termMonths <= 0) return 0;
  if (annualRatePct === 0) return principal / termMonths;
  const r = annualRatePct / 100 / 12;
  return principal * r * Math.pow(1 + r, termMonths) / (Math.pow(1 + r, termMonths) - 1);
}

function futureValueInvested(amount: number, annualRatePct: number, months: number): number {
  return amount * Math.pow(1 + annualRatePct / 100 / 12, months);
}

/* ─────────────────────────────────────────────────────────────
   DATE HELPERS
───────────────────────────────────────────────────────────── */
function addMonths(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

function monthDiff(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function daysFromNow(dateStr: string): number {
  const target = new Date(dateStr);
  const now    = new Date();
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

/* ─────────────────────────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────────────────────────── */
const fmt = (n: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const fmtShort = (n: number): string => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${Math.round(abs)}`;
};

const fmtY = (v: number): string => {
  const abs = Math.abs(v);
  const s   = v < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${s}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${s}$${(abs / 1_000).toFixed(0)}K`;
  return `${s}$${v}`;
};

const fmtDate = (d: Date): string =>
  d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

/* ─────────────────────────────────────────────────────────────
   SHARED UI
───────────────────────────────────────────────────────────── */
import MobileScrubChart from '../../components/finance/MobileScrubChart';

/* ── mobile design system ── */
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

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)', letterSpacing: '-0.01em' }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function KpiCard({ label, value, sub, accent, badge, badgeColor, badgeText }: {
  label: string; value: string; sub?: string;
  accent?: string; badge?: string; badgeColor?: string; badgeText?: string;
}) {
  return (
    <div style={{
      background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`,
      boxShadow: 'var(--t-shadow-sm)', padding: '18px 20px', borderLeft: `4px solid ${accent ?? 'var(--t-primary)'}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--t-text-tertiary)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      {badge && (
        <div style={{ display: 'inline-block', marginTop: 6, padding: '2px 10px', borderRadius: 100, background: badgeColor ?? 'var(--t-primary-bg)', color: badgeText ?? 'var(--t-primary)', fontSize: 11, fontWeight: 700 }}>{badge}</div>
      )}
      {sub && !badge && <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ pct, color, height = 6 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ height, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, pct))}%`, background: color, borderRadius: 100, transition: 'width 0.4s ease' }} />
    </div>
  );
}

function Tag({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 100, background: bg, color, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   CHART TOOLTIPS
───────────────────────────────────────────────────────────── */
function CashPositionTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div style={{ background: 'var(--t-surface)', border: `1px solid var(--t-border)`, borderRadius: T.radiusMd, padding: '12px 14px', boxShadow: 'var(--t-shadow-md)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-tertiary)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: val >= 0 ? 'var(--t-text-primary)' : 'var(--t-red)', fontVariantNumeric: 'tabular-nums' }}>
        {fmt(val)}
      </div>
      <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 2 }}>Projected cash balance</div>
    </div>
  );
}

function FlowTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const income   = payload.find((p: any) => p.dataKey === 'income')?.value   ?? 0;
  const expenses = payload.find((p: any) => p.dataKey === 'expenses')?.value ?? 0;
  const net = income - expenses;
  return (
    <div style={{ background: 'var(--t-surface)', border: `1px solid var(--t-border)`, borderRadius: T.radiusMd, padding: '12px 14px', boxShadow: 'var(--t-shadow-md)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-tertiary)', marginBottom: 8 }}>{label}</div>
      <div style={{ marginBottom: 3, fontSize: 12 }}><span style={{ color: 'var(--t-green-text)' }}>Income   </span><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(income)}</span></div>
      <div style={{              fontSize: 12 }}><span style={{ color: 'var(--t-red-text)'  }}>Expenses </span><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(expenses)}</span></div>
      <div style={{ borderTop: `1px solid var(--t-border)`, marginTop: 6, paddingTop: 6, fontSize: 12, fontWeight: 700, color: net >= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)' }}>
        Net: {net >= 0 ? '+' : ''}{fmt(net)}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ENHANCED PURCHASE ANALYZER
───────────────────────────────────────────────────────────── */
function PurchaseAnalyzer({ currentCash, monthlySurplus }: { currentCash: number; monthlySurplus: number }) {
  const [name,         setName]         = useState('');
  const [category,     setCategory]     = useState<PurchaseCategory>('other');
  const [cost,         setCost]         = useState<number>(0);
  const [purchType,    setPurchType]    = useState<PurchaseType>('cash');
  const [targetDate,   setTargetDate]   = useState('');
  const [downPct,       setDownPct]       = useState(20);
  const [loanRate,      setLoanRate]      = useState(6.5);
  const [loanTerm,      setLoanTerm]      = useState(60);
  const [monthlyTax,    setMonthlyTax]    = useState<number>(0);
  const [monthlyIns,    setMonthlyIns]    = useState<number>(0);

  const today = new Date();

  const analysis = useMemo(() => {
    if (cost <= 0) return null;

    const cat = PURCHASE_CATS[category];

    // ── CASH PURCHASE ────────────────────────────────────────
    if (purchType === 'cash') {
      const cashNeeded   = cost;
      const cashShortage = Math.max(0, cashNeeded - currentCash);
      const canAfford    = cashShortage === 0;

      // Months to save the shortage
      const monthsToSave = cashShortage > 0 && monthlySurplus > 0
        ? Math.ceil(cashShortage / monthlySurplus)
        : cashShortage > 0 ? null : 0;

      const readyDate = monthsToSave != null
        ? addMonths(today, monthsToSave)
        : null;

      // Target date analysis
      let targetMonths: number | null = null;
      let targetFeasible: boolean | null = null;
      if (targetDate) {
        const td = new Date(targetDate);
        targetMonths = Math.max(0, monthDiff(today, td));
        const savedByTarget = currentCash + monthlySurplus * targetMonths;
        targetFeasible = savedByTarget >= cashNeeded;
      }

      // Opportunity cost — what if you invested that money instead for 5 years?
      const oppCost5yr = futureValueInvested(cashNeeded, 8, 60) - cashNeeded;

      return {
        type: 'cash' as const,
        cashNeeded,
        canAfford,
        cashShortage,
        monthsToSave,
        readyDate,
        targetMonths,
        targetFeasible,
        oppCost5yr,
        cat,
        savingsPct: Math.min(100, currentCash / cashNeeded * 100),
        // extra monthly needed if target date set
        monthlyNeededForTarget: targetMonths && targetMonths > 0 && cashShortage > 0
          ? Math.ceil(cashShortage / targetMonths)
          : 0,
      };
    }

    // ── FINANCE PURCHASE ─────────────────────────────────────
    const downPayment  = cost * (downPct / 100);
    const loanAmount   = cost - downPayment;
    const monthlyPmt   = calcMonthlyPayment(loanAmount, loanRate, loanTerm);
    const totalPaid    = downPayment + monthlyPmt * loanTerm;
    const totalInterest = totalPaid - cost;
    const monthlyPITI  = monthlyPmt + monthlyTax + monthlyIns;

    const canAffordDown = currentCash >= downPayment;
    const downShortage  = Math.max(0, downPayment - currentCash);
    const monthsForDown = downShortage > 0 && monthlySurplus > 0
      ? Math.ceil(downShortage / monthlySurplus)
      : 0;

    // Can they absorb the total monthly housing cost?
    const paymentFeasible = monthlySurplus >= monthlyPITI;

    // Opportunity cost of the down payment invested instead
    const oppCostDown5yr = futureValueInvested(downPayment, 8, 60) - downPayment;

    // Break-even: financing cost vs investing the down payment
    // Is the interest cost less than what the down payment would earn?
    const betterToFinance = totalInterest < oppCostDown5yr && loanRate < 8;

    return {
      type:           'finance' as const,
      downPayment,
      loanAmount,
      monthlyPmt,
      totalPaid,
      totalInterest,
      canAffordDown,
      downShortage,
      monthsForDown,
      paymentFeasible,
      oppCostDown5yr,
      betterToFinance,
      cat,
      monthlyPITI,
      hasAddlCosts: monthlyTax > 0 || monthlyIns > 0,
      savingsPct:   Math.min(100, currentCash / downPayment * 100),
      surplusAfter: monthlySurplus - monthlyPITI,
    };
  }, [cost, purchType, currentCash, monthlySurplus, downPct, loanRate, loanTerm, targetDate, category, today, monthlyTax, monthlyIns]);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: `1px solid var(--t-border-med)`,
    borderRadius: T.radiusMd, fontSize: 13, color: 'var(--t-text-primary)',
    outline: 'none', boxSizing: 'border-box', background: 'var(--t-surface)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── INPUTS ── */}
      {/* Name + Category */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>Purchase Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="New car, vacation…"
            style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as PurchaseCategory)}
            style={{ ...inputStyle, cursor: 'pointer' }}>
            {(Object.keys(PURCHASE_CATS) as PurchaseCategory[]).map(k => (
              <option key={k} value={k}>{PURCHASE_CATS[k].icon} {PURCHASE_CATS[k].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cost + Purchase Type toggle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>Total Cost</label>
          <div style={{ display: 'flex', border: `1px solid var(--t-border-med)`, borderRadius: T.radiusMd, overflow: 'hidden' }}>
            <span style={{ padding: '9px 12px', background: 'var(--t-bg)', fontSize: 13, color: 'var(--t-text-tertiary)', borderRight: `1px solid var(--t-border-med)`, flexShrink: 0 }}>$</span>
            <input type="number" value={cost || ''} placeholder="0"
              onChange={e => setCost(Number(e.target.value))}
              style={{ flex: 1, padding: '9px 12px', border: 'none', outline: 'none', fontSize: 13, color: 'var(--t-text-primary)', background: 'transparent', fontVariantNumeric: 'tabular-nums', minWidth: 0 }}
            />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>Payment Type</label>
          <div style={{ display: 'flex', background: 'var(--t-bg)', borderRadius: T.radiusMd, padding: 3, border: `1px solid var(--t-border)` }}>
            {(['cash', 'finance'] as PurchaseType[]).map(t => (
              <button key={t} onClick={() => setPurchType(t)} style={{
                flex: 1, padding: '6px 0', borderRadius: T.radiusSm, border: 'none', cursor: 'pointer',
                background: purchType === t ? 'var(--t-surface)' : 'transparent',
                color: purchType === t ? 'var(--t-primary)' : 'var(--t-text-tertiary)',
                fontWeight: purchType === t ? 700 : 500, fontSize: 12,
                boxShadow: purchType === t ? 'var(--t-shadow-sm)' : 'none',
                transition: 'all 0.15s ease', textTransform: 'capitalize',
              }}>{t === 'cash' ? '💵 Cash' : '🏦 Finance'}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Conditional fields */}
      {purchType === 'cash' ? (
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>Target Date (optional)</label>
          <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            style={inputStyle} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>Down Payment %</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="range" min={0} max={80} step={5} value={downPct}
                onChange={e => setDownPct(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--t-primary)', cursor: 'pointer' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-primary)', minWidth: 32, textAlign: 'right' }}>{downPct}%</span>
            </div>
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
            <select value={loanTerm} onChange={e => setLoanTerm(Number(e.target.value))}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              {[
                { m: 12, label: '12 months (1 yr)' },
                { m: 24, label: '24 months (2 yrs)' },
                { m: 36, label: '36 months (3 yrs)' },
                { m: 48, label: '48 months (4 yrs)' },
                { m: 60, label: '60 months (5 yrs)' },
                { m: 72, label: '72 months (6 yrs)' },
                { m: 84, label: '84 months (7 yrs)' },
                { m: 180, label: '180 months (15 yrs)' },
                { m: 360, label: '360 months (30 yrs)' },
              ].map(({ m, label }) => (
                <option key={m} value={m}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Additional Monthly Costs — shown in finance mode */}
      {purchType === 'finance' && (
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 8 }}>
            Additional Monthly Costs <span style={{ fontWeight: 400, color: 'var(--t-text-tertiary)' }}>(optional — taxes, insurance, HOA)</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t-text-tertiary)', display: 'block', marginBottom: 4 }}>Property Taxes / mo</label>
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
      )}

      {/* ── RESULTS ── */}
      {analysis ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {analysis.type === 'cash' ? (
            <>
              {/* Savings readiness */}
              <div style={{
                padding: '14px 16px', borderRadius: T.radiusMd,
                background: analysis.canAfford ? 'var(--t-green-bg)' : 'var(--t-amber-bg)',
                border: `1px solid ${analysis.canAfford ? 'var(--t-green-border)' : 'var(--t-amber-border)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: analysis.canAfford ? 'var(--t-green-text)' : 'var(--t-amber-text)' }}>
                      {analysis.cat.icon} {name || analysis.cat.label} — Cash Purchase
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: analysis.canAfford ? 'var(--t-green)' : 'var(--t-amber)', marginTop: 2 }}>
                      {analysis.canAfford ? 'Ready to buy' : `Save ${fmtShort(analysis.cashShortage)} more`}
                    </div>
                  </div>
                  <Tag color={analysis.canAfford ? 'var(--t-green-text)' : 'var(--t-amber-text)'} bg={analysis.canAfford ? '#BBF7D0' : 'var(--t-amber-border)'}>
                    {analysis.canAfford ? 'CAN AFFORD' : 'NOT YET'}
                  </Tag>
                </div>
                {/* Progress bar */}
                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--t-text-tertiary)' }}>Savings progress</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(Math.min(currentCash, analysis.cashNeeded))} / {fmt(analysis.cashNeeded)}
                    </span>
                  </div>
                  <ProgressBar pct={analysis.savingsPct} color={analysis.canAfford ? 'var(--t-green)' : 'var(--t-amber)'} height={8} />
                </div>
                {!analysis.canAfford && analysis.monthsToSave != null && (
                  <div style={{ fontSize: 12, color: 'var(--t-text-secondary)', marginTop: 4 }}>
                    At your current surplus of <strong>{fmt(monthlySurplus)}/mo</strong>, you can afford this in{' '}
                    <strong>{analysis.monthsToSave} month{analysis.monthsToSave !== 1 ? 's' : ''}</strong>
                    {analysis.readyDate && ` (${analysis.readyDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`}.
                  </div>
                )}
                {!analysis.canAfford && analysis.monthsToSave == null && (
                  <div style={{ fontSize: 12, color: 'var(--t-red-text)', marginTop: 4 }}>
                    Your current cash flow is negative or zero — build a surplus first.
                  </div>
                )}
              </div>

              {/* Target date analysis */}
              {analysis.targetMonths != null && (
                <div style={{
                  padding: '12px 14px', borderRadius: T.radiusMd,
                  background: analysis.targetFeasible ? 'var(--t-green-bg)' : 'var(--t-red-bg)',
                  border: `1px solid ${analysis.targetFeasible ? 'var(--t-green-border)' : 'var(--t-red-border)'}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: analysis.targetFeasible ? 'var(--t-green-text)' : 'var(--t-red-text)', marginBottom: 4 }}>
                    Target Date Analysis — {new Date(targetDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  {analysis.targetFeasible ? (
                    <div style={{ fontSize: 12, color: 'var(--t-text-secondary)' }}>
                      ✓ You'll have enough saved by your target date ({analysis.targetMonths} months away).
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--t-text-secondary)' }}>
                      You need <strong>{fmt(analysis.monthlyNeededForTarget ?? 0)}/mo</strong> extra savings to afford this by your target date.
                    </div>
                  )}
                </div>
              )}

              {/* Opportunity cost */}
              {analysis.oppCost5yr > 0 && (
                <div style={{ padding: '12px 14px', borderRadius: T.radiusMd, background: 'var(--t-purple-bg)', border: `1px solid var(--t-purple-border)` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-purple-text)', marginBottom: 4 }}>Opportunity Cost (5 years @ 8%)</div>
                  <div style={{ fontSize: 13, color: 'var(--t-text-secondary)' }}>
                    If you invested {fmt(analysis.cashNeeded)} instead, it could grow to{' '}
                    <strong style={{ color: 'var(--t-purple)' }}>{fmt(analysis.cashNeeded + analysis.oppCost5yr)}</strong>{' '}
                    — gaining <strong style={{ color: 'var(--t-purple)' }}>{fmtShort(analysis.oppCost5yr)}</strong>.
                    {analysis.cat.appreciates
                      ? ' This asset tends to appreciate, which may offset the opportunity cost.'
                      : ' This asset tends to depreciate — consider the true net cost.'}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Finance summary */}
              <div style={{ padding: '14px 16px', borderRadius: T.radiusMd, background: 'var(--t-primary-bg)', border: `1px solid var(--t-primary-border)` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-primary)', marginBottom: 10 }}>
                  {analysis.cat.icon} {name || analysis.cat.label} — Financing
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', fontWeight: 600, marginBottom: 2 }}>DOWN PAYMENT</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(analysis.downPayment)}</div>
                    <div style={{ fontSize: 11, color: analysis.canAffordDown ? 'var(--t-green-text)' : 'var(--t-red-text)', marginTop: 2 }}>
                      {analysis.canAffordDown ? '✓ In your cash balance' : `Need ${fmtShort(analysis.downShortage)} more`}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', fontWeight: 600, marginBottom: 2 }}>P&I PAYMENT / MO</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(analysis.monthlyPmt)}</div>
                    <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 2 }}>Principal &amp; interest only</div>
                  </div>
                  {analysis.hasAddlCosts && (
                    <div style={{ gridColumn: '1 / -1', background: 'var(--t-primary-bg)', borderRadius: T.radiusSm, padding: '10px 12px', border: `1px solid var(--t-primary-border)` }}>
                      <div style={{ fontSize: 10, color: 'var(--t-primary)', fontWeight: 700, marginBottom: 6 }}>TOTAL MONTHLY HOUSING COST (PITI)</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--t-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(analysis.monthlyPITI)}</div>
                          <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 2 }}>
                            P&amp;I {fmt(analysis.monthlyPmt)}
                            {monthlyTax > 0 && ` + Tax ${fmt(monthlyTax)}`}
                            {monthlyIns > 0 && ` + Ins ${fmt(monthlyIns)}`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: analysis.paymentFeasible ? 'var(--t-green-text)' : 'var(--t-red-text)' }}>
                            {analysis.paymentFeasible
                              ? `✓ Leaves ${fmt(analysis.surplusAfter)}/mo`
                              : `⚠ Over budget by ${fmt(Math.abs(analysis.surplusAfter))}`}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', marginTop: 2 }}>vs. current surplus</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {!analysis.hasAddlCosts && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 11, color: analysis.paymentFeasible ? 'var(--t-green-text)' : 'var(--t-red-text)' }}>
                        {analysis.paymentFeasible
                          ? `✓ Leaves ${fmt(analysis.surplusAfter)}/mo surplus after payment`
                          : `⚠ Exceeds current surplus by ${fmt(Math.abs(analysis.surplusAfter))}`}
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', fontWeight: 600, marginBottom: 2 }}>TOTAL INTEREST</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t-red)', fontVariantNumeric: 'tabular-nums' }}>{fmt(analysis.totalInterest)}</div>
                    <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 2 }}>
                      {((analysis.totalInterest / cost) * 100).toFixed(1)}% above purchase price
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', fontWeight: 600, marginBottom: 2 }}>TOTAL COST</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(analysis.totalPaid)}</div>
                    <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 2 }}>Over {loanTerm} months</div>
                  </div>
                </div>
              </div>

              {/* Down payment readiness */}
              {!analysis.canAffordDown && (
                <div style={{ padding: '12px 14px', borderRadius: T.radiusMd, background: 'var(--t-amber-bg)', border: `1px solid var(--t-amber-border)` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-amber-text)', marginBottom: 6 }}>Down Payment Timeline</div>
                  <ProgressBar pct={analysis.savingsPct} color={'var(--t-amber)'} height={6} />
                  <div style={{ fontSize: 12, color: 'var(--t-text-secondary)', marginTop: 6 }}>
                    {analysis.monthsForDown > 0
                      ? `Save ${fmtShort(analysis.downShortage)} more over ${analysis.monthsForDown} month${analysis.monthsForDown !== 1 ? 's' : ''} to afford the down payment.`
                      : 'Build positive monthly cash flow to save for the down payment.'}
                  </div>
                </div>
              )}

              {/* Finance vs invest comparison */}
              <div style={{ padding: '12px 14px', borderRadius: T.radiusMd, background: analysis.betterToFinance ? 'var(--t-green-bg)' : 'var(--t-purple-bg)', border: `1px solid ${analysis.betterToFinance ? 'var(--t-green-border)' : 'var(--t-purple-border)'}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: analysis.betterToFinance ? 'var(--t-green-text)' : 'var(--t-purple-text)', marginBottom: 4 }}>
                  Finance vs. Pay Cash Analysis
                </div>
                <div style={{ fontSize: 12, color: 'var(--t-text-secondary)' }}>
                  {analysis.betterToFinance
                    ? `At ${loanRate}% APR, financing may be smart — your down payment invested at 8% could grow by ${fmtShort(analysis.oppCostDown5yr)} over 5 years, more than the ${fmt(analysis.totalInterest)} interest cost.`
                    : `At ${loanRate}% APR, the ${fmt(analysis.totalInterest)} interest cost exceeds what your ${fmt(analysis.downPayment)} down payment would earn invested. Paying cash saves more long-term.`}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px', background: 'var(--t-bg)', borderRadius: T.radiusMd, border: `1px dashed var(--t-border)`, color: 'var(--t-text-tertiary)', fontSize: 13 }}>
          Enter a purchase cost above to see your personalized analysis.
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SURPLUS ROUTING SUGGESTIONS
───────────────────────────────────────────────────────────── */
function SurplusRouting({ monthlySurplus, cashBalance, monthlyExpenses, liabilities }: {
  monthlySurplus: number; cashBalance: number; monthlyExpenses: number; liabilities: number;
}) {
  if (monthlySurplus <= 0) {
    return (
      <div style={{ padding: '14px 16px', borderRadius: T.radiusMd, background: 'var(--t-red-bg)', border: `1px solid var(--t-red-border)` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-red)', marginBottom: 4 }}>Negative Cash Flow Detected</div>
        <div style={{ fontSize: 12, color: 'var(--t-text-secondary)' }}>
          Your expenses exceed income by <strong>{fmt(Math.abs(monthlySurplus))}/month</strong>.
          Focus on reducing recurring expenses or increasing income before allocating surplus.
        </div>
      </div>
    );
  }

  const emergencyTarget = monthlyExpenses * 3;
  const emergencyGap    = Math.max(0, emergencyTarget - cashBalance);
  const hasEmergencyFund = cashBalance >= emergencyTarget;

  const suggestions: { label: string; amount: number; pct: number; color: string; bg: string; border: string; reason: string }[] = [];

  if (!hasEmergencyFund) {
    const emAlloc = Math.min(monthlySurplus * 0.5, emergencyGap);
    suggestions.push({
      label: 'Emergency Fund Top-Up', amount: emAlloc,
      pct: (emAlloc / monthlySurplus) * 100,
      color: 'var(--t-amber)', bg: 'var(--t-amber-bg)', border: 'var(--t-amber-border)',
      reason: `${(emergencyGap / monthlySurplus).toFixed(0)}mo to reach 3-month cushion`,
    });
  }

  if (liabilities > 0) {
    const debtAlloc = monthlySurplus * (hasEmergencyFund ? 0.4 : 0.3);
    suggestions.push({
      label: 'Extra Debt Paydown', amount: debtAlloc,
      pct: (debtAlloc / monthlySurplus) * 100,
      color: 'var(--t-red)', bg: 'var(--t-red-bg)', border: 'var(--t-red-border)',
      reason: 'Reduces interest cost and improves net worth',
    });
  }

  const investAlloc = monthlySurplus * (hasEmergencyFund && liabilities === 0 ? 0.8 : 0.3);
  suggestions.push({
    label: 'Invest (Index Funds / Retirement)', amount: investAlloc,
    pct: (investAlloc / monthlySurplus) * 100,
    color: 'var(--t-primary)', bg: 'var(--t-primary-bg)', border: 'var(--t-primary-border)',
    reason: 'Long-term compounding — 8% average annual return',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--t-text-tertiary)' }}>Monthly surplus to allocate</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-green)', fontVariantNumeric: 'tabular-nums' }}>{fmt(monthlySurplus)}</span>
      </div>
      {suggestions.map(s => (
        <div key={s.label} style={{ padding: '12px 14px', borderRadius: T.radiusMd, background: s.bg, border: `1px solid ${s.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{fmt(s.amount)}/mo</span>
          </div>
          <ProgressBar pct={s.pct} color={s.color} height={4} />
          <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 5 }}>{s.reason}</div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function ForecastPage() {
  const isMobile = useMobile();
  const { currentSnapshot }                                                = useWealthData();
  const { incomeAnalytics, expenseAnalytics, recurringTransactions, loading } = useFlowData();

  const [flowHorizon, setFlowHorizon] = useState<12 | 24>(12);

  /* ── Goals + Budget debts from Supabase ── */
  const [lifeGoals,   setLifeGoals]   = useState<any[]>([]);
  const [budgetDebts, setBudgetDebts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/goals').then(r => r.json()).then(d => { if (Array.isArray(d)) setLifeGoals(d); }).catch(() => {});
    fetch('/api/budgets').then(r => r.json()).then(d => { if (Array.isArray(d)) setBudgetDebts(d.filter((i: any) => i.type === 'debt')); }).catch(() => {});
  }, []);

  /* ── cash balance from bank accounts ── */
  const sumArr = (arr: any[], f: string) => (arr ?? []).reduce((s: number, x: any) => s + Number(x[f] || 0), 0);
  const sumLiab = (arr?: { amount?: number }[]) => (arr ?? []).reduce((s, x) => s + (x.amount ?? 0), 0);

  const currentCash = useMemo(() =>
    sumArr(currentSnapshot?.bankAccounts ?? [], 'balance'),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [currentSnapshot]);

  const totalLiabilities = useMemo(() => {
    const s = currentSnapshot;
    if (!s) return 0;
    return sumLiab(s.liabilities.mortgage) + sumLiab(s.liabilities.creditCard) +
           sumLiab(s.liabilities.auto)     + sumLiab(s.liabilities.studentLoan) +
           sumLiab(s.liabilities.other);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSnapshot]);

  /* ── monthly averages ── */
  const avgMonthlyIncome   = incomeAnalytics?.averageMonthlyIncome   ?? 0;
  const avgMonthlyExpenses = expenseAnalytics?.averageMonthlyExpenses ?? 0;
  const monthlySurplus     = avgMonthlyIncome - avgMonthlyExpenses;

  /* ── Committed obligations from goals + debts ── */
  const monthlyGoalContribs = lifeGoals.reduce((s: number, g: any) => s + (g.monthlyContrib ?? 0), 0);
  const monthlyDebtPayments = budgetDebts.reduce((s: number, d: any) => s + (d.monthlyPayment ?? 0), 0);
  const totalMonthlyObligations = monthlyGoalContribs + monthlyDebtPayments;
  const investableSurplus = Math.max(0, monthlySurplus - totalMonthlyObligations);

  /* ── 12/24-month cash position (running balance) ── */
  const cashPositionData = useMemo(() => {
    const active = (recurringTransactions ?? []).filter(r => r.isActive);
    const now    = new Date();
    let balance  = currentCash;
    return Array.from({ length: flowHorizon + 1 }, (_, i) => {
      if (i > 0) {
        const income   = active.filter(r => r.transaction_type === 'Income').reduce((s, r) => s + r.monthlyEquivalent, 0);
        const expenses = active.filter(r => r.transaction_type !== 'Income' && r.transaction_type !== 'Transfer').reduce((s, r) => s + r.monthlyEquivalent, 0);
        balance += income - expenses;
      }
      return {
        label:   i === 0 ? 'Now' : fmtDate(addMonths(now, i)),
        balance: Math.round(balance),
        month:   i,
      };
    });
  }, [recurringTransactions, currentCash, flowHorizon]);

  /* ── monthly income vs expense bars ── */
  const monthlyFlowData = useMemo(() => {
    const active = (recurringTransactions ?? []).filter(r => r.isActive);
    const now    = new Date();
    return Array.from({ length: flowHorizon }, (_, i) => {
      const date     = addMonths(now, i + 1);
      const income   = active.filter(r => r.transaction_type === 'Income').reduce((s, r) => s + r.monthlyEquivalent, 0);
      const expenses = active.filter(r => r.transaction_type !== 'Income' && r.transaction_type !== 'Transfer').reduce((s, r) => s + r.monthlyEquivalent, 0);
      return { label: fmtDate(date), income: Math.round(income), expenses: Math.round(expenses), net: Math.round(income - expenses) };
    });
  }, [recurringTransactions, flowHorizon]);

  /* ── upcoming bills next 60 days ── */
  const upcomingBills = useMemo(() => {
    const now = new Date();
    return (recurringTransactions ?? [])
      .filter(r => r.isActive && r.transaction_type !== 'Income' && r.transaction_type !== 'Transfer' && r.nextExpectedDate)
      .map(r => ({ ...r, daysOut: daysFromNow(r.nextExpectedDate!) }))
      .filter(r => r.daysOut >= 0 && r.daysOut <= 60)
      .sort((a, b) => a.daysOut - b.daysOut)
      .slice(0, 8);
  }, [recurringTransactions]);

  /* ── KPI calcs ── */
  const projected12mo     = cashPositionData[Math.min(12, cashPositionData.length - 1)]?.balance ?? currentCash;
  const cashRunwayMonths  = avgMonthlyExpenses > 0 ? currentCash / avgMonthlyExpenses : 0;
  const deficitMonths     = monthlyFlowData.filter(m => m.net < 0).length;
  const noRecurringData   = monthlyFlowData.every(m => m.income === 0 && m.expenses === 0);

  /* ── short-term AI insights ── */
  const insights = useMemo(() => {
    const list: string[] = [];
    if (monthlySurplus > 0 && totalMonthlyObligations > 0)
      list.push(`After ${fmt(totalMonthlyObligations)}/mo in goal contributions and debt payments, you have ${fmt(investableSurplus)} free to invest or save.`);
    else if (monthlySurplus > 0)
      list.push(`You have a ${fmt(monthlySurplus)}/month surplus. Routing even 20% (${fmt(monthlySurplus * 0.2)}) to investments adds ${fmtShort(monthlySurplus * 0.2 * 12)} to your portfolio this year.`);
    if (monthlyGoalContribs > 0)
      list.push(`You're contributing ${fmt(monthlyGoalContribs)}/mo toward ${lifeGoals.filter((g: any) => g.monthlyContrib > 0).length} goal${lifeGoals.filter((g: any) => g.monthlyContrib > 0).length !== 1 ? 's' : ''}. That's ${fmtShort(monthlyGoalContribs * 12)}/year building toward your targets.`);
    if (deficitMonths > 0)
      list.push(`${deficitMonths} month${deficitMonths > 1 ? 's' : ''} in the next ${flowHorizon} months show projected cash deficits. Review your largest recurring expenses.`);
    if (cashRunwayMonths < 3 && avgMonthlyExpenses > 0)
      list.push(`Your cash covers only ${cashRunwayMonths.toFixed(1)} months of expenses. Priority: build to 3 months (${fmt((avgMonthlyExpenses / 12) * 3 - currentCash)} needed).`);
    if (upcomingBills.length > 0) {
      const largest = [...upcomingBills].sort((a, b) => b.expectedAmount - a.expectedAmount)[0];
      list.push(`Largest upcoming bill: ${largest.merchant} (${fmt(largest.expectedAmount)}) in ${largest.daysOut} day${largest.daysOut !== 1 ? 's' : ''}.`);
    }
    if (totalLiabilities > 0 && monthlySurplus > 0)
      list.push(`With ${fmt(monthlySurplus)}/mo surplus, you could eliminate ${fmt(totalLiabilities)} in debt in ${(totalLiabilities / monthlySurplus).toFixed(0)} months with full paydown focus.`);
    return list.slice(0, 4);
  }, [monthlySurplus, deficitMonths, flowHorizon, cashRunwayMonths, avgMonthlyExpenses, currentCash, upcomingBills, totalLiabilities]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: `3px solid var(--t-border)`, borderTop: `3px solid var(--t-primary)`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)' }}>Loading your forecast…</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const horizonTabs: { label: string; value: 12 | 24 }[] = [
    { label: '12 Months', value: 12 },
    { label: '24 Months', value: 24 },
  ];

  /* ── MOBILE VIEW ── */
  if (isMobile) {
    const growing = projected12mo >= currentCash;
    const runwayColor = cashRunwayMonths >= 6 ? MN.green : cashRunwayMonths >= 3 ? MN.amber : MN.red;

    return (
      <div style={{ color: MN.text, fontFamily: 'var(--font-body)', paddingBottom: 16 }}>

        {/* HERO — projected cash */}
        <div style={{
          background: 'linear-gradient(135deg, #0a3fa8 0%, #0F2044 100%)',
          borderRadius: 20, padding: '24px 20px 18px', marginBottom: 16,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, transparent, ${MN.gold}, #67E6D5, ${MN.gold}, transparent)` }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(46,211,198,0.75)', marginBottom: 6 }}>
            Projected Cash · {flowHorizon} Months
          </div>
          <div style={{
            fontSize: 32, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 10,
            backgroundImage: `linear-gradient(135deg, #ffffff 0%, ${growing ? MN.gold : MN.red} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {fmtShort(cashPositionData[cashPositionData.length - 1]?.balance ?? currentCash)}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: growing ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
            border: `1px solid ${growing ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}`,
            borderRadius: 100, padding: '5px 12px', fontSize: 12, fontWeight: 700,
            color: growing ? MN.green : MN.red,
          }}>
            {monthlySurplus >= 0 ? '▲' : '▼'} {fmtShort(Math.abs(monthlySurplus))}/mo
            <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>{monthlySurplus >= 0 ? 'surplus' : 'deficit'}</span>
          </div>

          {/* scrubbable sparkline */}
          <MobileScrubChart height={104}
            data={cashPositionData.map(d => ({ label: d.label, value: d.balance }))}
            formatValue={v => fmtShort(v)}
          />
        </div>

        {/* HORIZON CHIPS */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {horizonTabs.map(({ label, value }) => {
            const active = flowHorizon === value;
            return (
              <button key={value} onClick={() => setFlowHorizon(value)} style={{
                flex: 1, padding: '9px 0', borderRadius: 100,
                border: `1px solid ${active ? MN.gold : MN.border}`,
                background: active ? 'rgba(46,211,198,0.15)' : MN.card,
                color: active ? MN.gold : MN.muted,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 40,
              }}>{label}</button>
            );
          })}
        </div>

        {/* STAT TILES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Cash Now', value: fmtShort(currentCash), color: MN.gold },
            { label: 'Runway',   value: cashRunwayMonths >= 100 ? '100+ mo' : `${cashRunwayMonths.toFixed(1)} mo`, color: runwayColor },
            { label: 'Deficits', value: deficitMonths === 0 ? 'None' : `${deficitMonths} mo`, color: deficitMonths === 0 ? MN.green : MN.red },
          ].map(s => (
            <div key={s.label} style={{ background: MN.card, borderRadius: 14, border: `1px solid ${MN.border}`, padding: '12px 12px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: MN.muted, marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* INSIGHTS */}
        {insights.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {insights.map((text, i) => (
              <div key={i} style={{
                background: MN.card, borderRadius: 14, border: `1px solid ${MN.border}`,
                borderLeft: `3px solid ${MN.gold}`, padding: '11px 13px',
                fontSize: 12, color: MN.muted, lineHeight: 1.55,
              }}>
                ✦ {text}
              </div>
            ))}
          </div>
        )}

        {/* UPCOMING BILLS */}
        {upcomingBills.length > 0 && (
          <div style={{ background: MN.card, borderRadius: 16, border: `1px solid ${MN.border}`, padding: '15px 14px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: MN.text, marginBottom: 8 }}>Bills Next 60 Days</div>
            {upcomingBills.map((bill: any, i: number) => (
              <div key={`${bill.merchantKey}-${i}`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 0', borderBottom: i < upcomingBills.length - 1 ? `1px solid ${MN.border}` : 'none',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: MN.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bill.merchant}</div>
                  <div style={{ fontSize: 11, color: bill.daysOut <= 3 ? MN.amber : MN.faint, fontWeight: bill.daysOut <= 3 ? 700 : 400, marginTop: 1 }}>
                    {bill.daysOut === 0 ? 'Today' : bill.daysOut === 1 ? 'Tomorrow' : `in ${bill.daysOut} days`}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: MN.text, fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginLeft: 12 }}>
                  {fmt(bill.expectedAmount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--t-text-primary)', letterSpacing: '-0.02em' }}>Cash Flow Forecast</div>
        <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)', marginTop: 3 }}>
          Short-term cash position, upcoming bills, and purchase planning. For long-term wealth projections, see the{' '}
          <a href="/dashboard/retirement" style={{ color: 'var(--t-primary)', fontWeight: 600 }}>Retirement page →</a>
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard
          label="Current Cash Balance"
          value={fmtShort(currentCash)}
          sub="Bank accounts"
          accent={'var(--t-primary)'}
        />
        <KpiCard
          label="Monthly Surplus / Deficit"
          value={`${monthlySurplus >= 0 ? '+' : ''}${fmtShort(monthlySurplus)}`}
          sub="Income minus expenses"
          accent={monthlySurplus >= 0 ? 'var(--t-green)' : 'var(--t-red)'}
        />
        <KpiCard
          label="Projected Cash (12mo)"
          value={fmtShort(projected12mo)}
          sub="At current trajectory"
          accent={projected12mo >= currentCash ? 'var(--t-green)' : 'var(--t-amber)'}
        />
        <KpiCard
          label="Cash Runway"
          value={cashRunwayMonths >= 100 ? '100+ mo' : `${cashRunwayMonths.toFixed(1)} mo`}
          badge={cashRunwayMonths >= 6 ? 'Healthy' : cashRunwayMonths >= 3 ? 'Adequate' : 'Low'}
          badgeColor={cashRunwayMonths >= 6 ? 'var(--t-green-bg)' : cashRunwayMonths >= 3 ? 'var(--t-amber-bg)' : 'var(--t-red-bg)'}
          badgeText={cashRunwayMonths >= 6 ? 'var(--t-green-text)' : cashRunwayMonths >= 3 ? 'var(--t-amber-text)' : 'var(--t-red-text)'}
          accent={cashRunwayMonths >= 6 ? 'var(--t-green)' : cashRunwayMonths >= 3 ? 'var(--t-amber)' : 'var(--t-red)'}
        />
        <KpiCard
          label="Deficit Months Ahead"
          value={deficitMonths === 0 ? 'None' : `${deficitMonths} month${deficitMonths > 1 ? 's' : ''}`}
          badge={deficitMonths === 0 ? 'All Clear' : 'Review Needed'}
          badgeColor={deficitMonths === 0 ? 'var(--t-green-bg)' : 'var(--t-red-bg)'}
          badgeText={deficitMonths === 0 ? 'var(--t-green-text)' : 'var(--t-red-text)'}
          accent={deficitMonths === 0 ? 'var(--t-green)' : 'var(--t-red)'}
        />
      </div>

      {/* ── CASH POSITION AREA CHART ── */}
      <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-md)', padding: '24px 28px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)' }}>Rolling Cash Position</div>
            <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 2 }}>
              Projected cash balance using your recurring income and committed expenses.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--t-bg)', borderRadius: T.radiusMd, padding: 3, border: `1px solid var(--t-border)` }}>
            {horizonTabs.map(({ label, value }) => (
              <button key={value} onClick={() => setFlowHorizon(value)} style={{
                padding: '5px 14px', borderRadius: T.radiusSm, border: 'none', cursor: 'pointer',
                background: flowHorizon === value ? 'var(--t-surface)' : 'transparent',
                color:      flowHorizon === value ? 'var(--t-primary)'  : 'var(--t-text-tertiary)',
                fontWeight: flowHorizon === value ? 700 : 500, fontSize: 12,
                boxShadow:  flowHorizon === value ? 'var(--t-shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}>{label}</button>
            ))}
          </div>
        </div>
        {noRecurringData ? (
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--t-bg)', borderRadius: T.radiusMd, color: 'var(--t-text-tertiary)', fontSize: 13 }}>
            No recurring transaction data yet. Add transactions to see your cash position forecast.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={cashPositionData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={'var(--t-primary)'} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={'var(--t-primary)'} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={'var(--t-border)'} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--t-text-tertiary)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={fmtY} tick={{ fontSize: 11, fill: 'var(--t-text-tertiary)' }} tickLine={false} axisLine={false} width={72} />
              <Tooltip content={<CashPositionTooltip />} />
              <ReferenceLine y={0} stroke={'var(--t-red)'} strokeDasharray="4 4" strokeWidth={1.5} />
              <Area type="monotone" dataKey="balance" name="Cash Balance"
                stroke={'var(--t-primary)'} fill="url(#cashGradient)" strokeWidth={2.5}
                dot={false} activeDot={{ r: 4, fill: 'var(--t-primary)' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', gap: 20 }}>

        {/* ─── LEFT ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* MONTHLY INCOME vs EXPENSES BARS */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '24px 26px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
            <SectionHeader title="Month-by-Month Cash Flow" sub="Recurring income vs. committed expenses from your transaction engine." />
            {noRecurringData ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--t-text-tertiary)', fontSize: 13 }}>
                No recurring data yet. Add transactions to see projections.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyFlowData} barGap={2} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={'var(--t-border)'} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--t-text-tertiary)' }} tickLine={false} axisLine={false} interval={flowHorizon > 12 ? 2 : 1} />
                    <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: 'var(--t-text-tertiary)' }} tickLine={false} axisLine={false} width={52} />
                    <Tooltip content={<FlowTooltip />} />
                    <Bar dataKey="income"   name="Income"   fill={'var(--t-green)'} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill={'var(--t-red)'}   radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                {/* Month summary row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16, padding: '12px 14px', background: 'var(--t-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-border)` }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', fontWeight: 600, marginBottom: 3 }}>AVG MONTHLY INCOME</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t-green-text)', fontVariantNumeric: 'tabular-nums' }}>{fmt(avgMonthlyIncome)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', fontWeight: 600, marginBottom: 3 }}>AVG MONTHLY EXPENSES</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t-red-text)', fontVariantNumeric: 'tabular-nums' }}>{fmt(avgMonthlyExpenses)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', fontWeight: 600, marginBottom: 3 }}>MONTHLY NET</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: monthlySurplus >= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)' }}>
                      {monthlySurplus >= 0 ? '+' : ''}{fmt(monthlySurplus)}
                    </div>
                  </div>
                </div>
                {deficitMonths > 0 && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12, padding: '10px 12px', background: 'var(--t-amber-bg)', border: `1px solid var(--t-amber-border)`, borderRadius: T.radiusMd }}>
                    <span style={{ color: 'var(--t-amber)' }}>⚠</span>
                    <span style={{ fontSize: 12, color: 'var(--t-amber-text)' }}>
                      {deficitMonths} month{deficitMonths > 1 ? 's' : ''} ahead show projected negative cash flow. Review your largest recurring expenses.
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* UPCOMING BILLS */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '24px 26px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
            <SectionHeader title="Upcoming Bills — Next 60 Days" sub="Scheduled from your recurring transaction engine." />
            {upcomingBills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', background: 'var(--t-bg)', borderRadius: T.radiusMd, border: `1px dashed var(--t-border)`, color: 'var(--t-text-tertiary)', fontSize: 13 }}>
                No upcoming bills detected in the next 60 days.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {upcomingBills.map((bill, i) => {
                  const urgent  = bill.daysOut <= 7;
                  const soon    = bill.daysOut <= 21;
                  const dueBg   = urgent ? 'var(--t-red-bg)'   : soon ? 'var(--t-amber-bg)'   : 'var(--t-bg)';
                  const dueClr  = urgent ? 'var(--t-red)'     : soon ? 'var(--t-amber)'     : 'var(--t-text-tertiary)';
                  const dueTxt  = urgent ? 'var(--t-red-text)' : soon ? 'var(--t-amber-text)' : 'var(--t-text-tertiary)';
                  return (
                    <div key={`${bill.merchant}-${i}`} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 14px', borderRadius: T.radiusMd, marginBottom: 6,
                      background: i % 2 === 0 ? 'var(--t-bg)' : 'var(--t-surface)',
                      border: `1px solid ${urgent ? 'var(--t-red-border)' : 'var(--t-border)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: dueBg, border: `1px solid ${dueClr}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                          {urgent ? '🔴' : soon ? '🟡' : '📅'}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-text-primary)' }}>{bill.merchant}</div>
                          <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 1 }}>
                            {bill.category} · {bill.frequency}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(bill.expectedAmount)}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: dueTxt, marginTop: 1 }}>
                          {bill.daysOut === 0 ? 'Due today' : `In ${bill.daysOut} day${bill.daysOut !== 1 ? 's' : ''}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COMMITTED OBLIGATIONS + SURPLUS ROUTING */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '24px 26px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
            <SectionHeader title="Surplus Routing Engine" sub="How to allocate your monthly surplus after all committed obligations." />

            {/* Waterfall breakdown */}
            {totalMonthlyObligations > 0 && (
              <div style={{ marginBottom: 20, padding: '14px 16px', background: 'var(--t-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-border)` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Monthly Surplus Breakdown</div>
                {[
                  { label: 'Gross Surplus',           value: monthlySurplus,            color: 'var(--t-green)',   sign: '' },
                  ...(monthlyGoalContribs > 0 ? [{ label: `Goal Contributions (${lifeGoals.filter((g: any) => g.monthlyContrib > 0).length})`, value: monthlyGoalContribs, color: 'var(--t-purple)', sign: '−' }] : []),
                  ...(monthlyDebtPayments > 0 ? [{ label: `Debt Payments (${budgetDebts.length})`,       value: monthlyDebtPayments, color: 'var(--t-red)',    sign: '−' }] : []),
                ].map(({ label, value, color, sign }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--t-text-secondary)' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{sign}{fmt(value)}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid var(--t-border)`, marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-text-primary)' }}>Investable Surplus</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: investableSurplus > 0 ? 'var(--t-green)' : 'var(--t-amber)', fontVariantNumeric: 'tabular-nums' }}>{fmt(investableSurplus)}/mo</span>
                </div>
              </div>
            )}

            <SurplusRouting
              monthlySurplus={investableSurplus > 0 ? investableSurplus : monthlySurplus}
              cashBalance={currentCash}
              monthlyExpenses={avgMonthlyExpenses}
              liabilities={totalLiabilities}
            />
          </div>

        </div>

        {/* ─── RIGHT ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* MAJOR PURCHASE ANALYZER — moved to Goals */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
            <div style={{ fontSize: 36 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)' }}>Purchase Analyzer</div>
            <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)', maxWidth: 320, lineHeight: 1.6 }}>
              Model any major purchase — cash or financed — and see your savings readiness, full PITI breakdown, and post-purchase budget impact.
            </div>
            <a href="/dashboard/goals" style={{
              display: 'inline-block', marginTop: 4, padding: '10px 22px',
              background: 'var(--t-primary)', color: '#fff', borderRadius: T.radiusMd,
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(10,63,168,0.28)',
            }}>
              Open in Goals →
            </a>
          </div>

          {/* INSIGHTS */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
            <SectionHeader title="Nautilius Insights" sub="Short-term signals from your cash flow." />
            {insights.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)' }}>Add transaction data to generate personalized insights.</div>
            ) : (
              insights.map((insight, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '10px 12px', borderRadius: T.radiusMd,
                  background: 'var(--t-primary-bg)', border: `1px solid var(--t-primary-border)`,
                  marginBottom: i < insights.length - 1 ? 8 : 0,
                }}>
                  <span style={{ color: 'var(--t-primary)', fontSize: 14, flexShrink: 0 }}>💡</span>
                  <span style={{ fontSize: 12, color: 'var(--t-text-secondary)', lineHeight: 1.55 }}>{insight}</span>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
