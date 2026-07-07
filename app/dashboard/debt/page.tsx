'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useFinancialData } from '../../lib/financialdatacontext';
import { useDashboardTheme } from '../../lib/dashboardthemecontext';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, Cell, Legend,
} from 'recharts';

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
  radius:        '12px',
  radiusSm:      '6px',
  radiusMd:      '8px',
};

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface Debt {
  id:                  string;
  name:                string;
  emoji:               string;
  color:               string;
  debtKind:            string;
  currentBalance:      number;
  interestRate:        number;
  minimumPayment:      number;
  monthlyPayment:      number;
  remainingTermMonths: number;  // used to derive P&I for mortgages
}

type Strategy = 'avalanche' | 'snowball' | 'minimum';

interface PayoffMonth {
  month:     number;
  label:     string;
  total:     number;
  interest:  number;
  principal: number;
  [key: string]: number | string; // per-debt balances
}

/* ─────────────────────────────────────────────────────────────
   MATH ENGINE
───────────────────────────────────────────────────────────── */
function simulate(debts: Debt[], strategy: Strategy, extraPayment: number): {
  schedule: PayoffMonth[];
  totalInterest: number;
  totalPaid: number;
  payoffDate: Date;
  monthsToPayoff: number;
  debtPayoffOrder: string[];
} {
  if (!debts.length) return { schedule: [], totalInterest: 0, totalPaid: 0, payoffDate: new Date(), monthsToPayoff: 0, debtPayoffOrder: [] };

  /* ── derive the true P&I-only floor payment for each debt ──
     Mortgages store the full PITI payment (P&I + escrow). We back-calculate
     the actual P&I using the amortization formula so escrow doesn't inflate
     the payoff speed. For all other debts we use minimumPayment directly.   */
  function calcPandI(balance: number, annualRate: number, termMonths: number): number {
    if (annualRate === 0 || termMonths <= 0) return balance / Math.max(termMonths, 1);
    const r = annualRate / 100 / 12;
    return balance * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
  }

  // deep-copy balances; compute effective floor payment per debt
  const state = debts.map(d => {
    let floorPayment: number;
    if (d.debtKind === 'mortgage' && d.remainingTermMonths > 0 && d.interestRate > 0) {
      // derive P&I only — ignores escrow stored in minimumPayment
      floorPayment = calcPandI(d.currentBalance, d.interestRate, d.remainingTermMonths);
    } else {
      floorPayment = d.minimumPayment;
    }
    return { ...d, balance: d.currentBalance, floorPayment };
  });

  const schedule: PayoffMonth[] = [];
  let totalInterest = 0;
  let totalPaid     = 0;
  const debtPayoffOrder: string[] = [];
  const MAX_MONTHS = 600;

  // (budget not used — floors paid individually, only extraPayment is directed strategically)

  for (let mo = 1; mo <= MAX_MONTHS; mo++) {
    if (state.every(d => d.balance <= 0)) break;

    // 1. accrue interest on opening balance (before any payment this month)
    let monthInterest  = 0;
    let monthPrincipal = 0;

    state.forEach(d => {
      if (d.balance <= 0) return;
      const r       = d.interestRate / 100 / 12;
      const interest = d.balance * r;
      d.balance    += interest;
      monthInterest += interest;
    });

    // 2. everyone pays their floor — no cascade when debts pay off (freed money stays in pocket)
    state.forEach(d => {
      if (d.balance <= 0) return;
      const pay = Math.min(d.floorPayment, d.balance);
      d.balance     -= pay;
      monthPrincipal += pay;
      if (d.balance < 0.01) d.balance = 0;
    });

    // 3. direct the extra slider amount strategically — cascade to next target if one debt
    //    is fully covered before the extra runs out
    if (strategy !== 'minimum' && extraPayment > 0.01) {
      let remainingExtra = extraPayment;
      while (remainingExtra > 0.01) {
        const alive = state.filter(d => d.balance > 0);
        if (!alive.length) break;
        const target = strategy === 'avalanche'
          ? alive.reduce((hi, d) => d.interestRate > hi.interestRate ? d : hi, alive[0])
          : alive.reduce((lo, d) => d.balance < lo.balance ? d : lo, alive[0]);
        const pay = Math.min(remainingExtra, target.balance);
        target.balance -= pay;
        monthPrincipal += pay;
        remainingExtra -= pay;
        if (target.balance < 0.01) target.balance = 0;
      }
    }

    // detect newly paid-off debts
    state.forEach(d => {
      if (d.balance === 0 && !debtPayoffOrder.includes(d.id)) {
        debtPayoffOrder.push(d.id);
      }
    });

    const now = new Date();
    now.setMonth(now.getMonth() + mo - 1);
    const label = now.toLocaleString('en-US', { month: 'short', year: '2-digit' });

    const point: PayoffMonth = {
      month:     mo,
      label,
      total:     state.reduce((s, d) => s + d.balance, 0),
      interest:  monthInterest,
      principal: monthPrincipal,
    };
    state.forEach(d => { point[d.id] = Math.max(0, d.balance); });
    schedule.push(point);

    totalInterest += monthInterest;
    totalPaid     += monthPrincipal;  // principal payments = cash out (interest is accrued, not a separate cash flow)

    if (state.every(d => d.balance <= 0)) break;
  }

  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + schedule.length);

  return { schedule, totalInterest, totalPaid, payoffDate, monthsToPayoff: schedule.length, debtPayoffOrder };
}

/* ─────────────────────────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────────────────────────── */
const fmt  = (n: number) => '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtK = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return fmt(n);
};
function moLabel(mo: number) {
  if (mo <= 0) return '—';
  const y = Math.floor(mo / 12);
  const m = mo % 12;
  if (y === 0) return `${m}mo`;
  if (m === 0) return `${y}yr`;
  return `${y}yr ${m}mo`;
}

/* ─────────────────────────────────────────────────────────────
   UI PRIMITIVES
───────────────────────────────────────────────────────────── */
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '24px', position: 'relative', overflow: 'hidden', ...style }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
      {children}
    </div>
  );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>{children}</div>;
}
function Pill({ children, color, bg, border }: { children: React.ReactNode; color: string; bg: string; border: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: bg, color, border: `1px solid ${border}` }}>
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   DEBT CARD
───────────────────────────────────────────────────────────── */
function DebtRow({ debt, payoffMonth, highlightColor }: { debt: Debt; payoffMonth: number; highlightColor: string }) {
  const pct = debt.currentBalance > 0 ? Math.min(100, (debt.minimumPayment * 12 / debt.currentBalance) * 100) : 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: `1px solid var(--t-border)` }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${debt.color}18`, border: `1px solid ${debt.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
        {debt.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-text-primary)' }}>{debt.name}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text-primary)' }}>{fmt(debt.currentBalance)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--t-text-tertiary)' }}>{debt.interestRate}% APR · {fmt(debt.monthlyPayment)}/mo</span>
          <span style={{ fontSize: 12, color: highlightColor, fontWeight: 600 }}>Paid off in {moLabel(payoffMonth)}</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: 'var(--t-border)' }}>
          <div style={{ height: 4, borderRadius: 2, width: `${pct}%`, background: debt.color, transition: 'width 0.8s ease' }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STRATEGY BUTTON
───────────────────────────────────────────────────────────── */
function StratBtn({ active, onClick, label, sub, icon }: { active: boolean; onClick: () => void; label: string; sub: string; icon: string }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '14px 16px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
      border: active ? `2px solid var(--t-primary)` : `1px solid var(--t-border)`,
      background: active ? 'var(--t-primary-bg)' : 'var(--t-surface)',
      transition: 'all 0.15s',
    }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--t-primary)' : 'var(--t-text-primary)' }}>{label}</div>
      <div style={{ fontSize: 11.5, color: 'var(--t-text-tertiary)', marginTop: 3, lineHeight: 1.4 }}>{sub}</div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   TOOLTIP
───────────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--t-surface)', border: `1px solid var(--t-border)`, borderRadius: 10, padding: '12px 16px', boxShadow: 'var(--t-shadow-md)', minWidth: 160 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--t-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill || p.color, display: 'inline-block' }} />
            {p.name}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-text-primary)' }}>{fmtK(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DEBT COLORS — consistent palette per debt
───────────────────────────────────────────────────────────── */
const PALETTE = ['#0a3fa8','#7C3AED','#0891B2','#16A34A','#D97706','#DC2626','#DB2777','#0F766E'];

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
const DEBT_KIND_MAP: Record<string, string> = {
  mortgage:    'mortgage',
  creditCard:  'credit_card',
  auto:        'auto',
  studentLoan: 'student',
  other:       'other',
};

const DEBT_EMOJI_MAP: Record<string, string> = {
  mortgage:    '🏠',
  creditCard:  '💳',
  auto:        '🚗',
  studentLoan: '🎓',
  other:       '📋',
};

export default function DebtPayoffPage() {
  const { currentSnapshot } = useFinancialData();
  const { T } = useDashboardTheme();
  const chartColor = T.isDark ? '#2ED3C6' : '#0a3fa8';
  const [manualDebts, setManualDebts] = useState<Debt[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [strategy,    setStrategy]    = useState<Strategy>('avalanche');
  const [extra,       setExtra]       = useState(200);
  const [chartView,   setChartView]   = useState<'balance' | 'breakdown'>('balance');

  /* ── load manual budget debt items (ones not in accounts table) ── */
  useEffect(() => {
    fetch('/api/budgets')
      .then(r => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        setManualDebts(
          data
            .filter(d => d.type === 'debt' && d.source === 'manual')
            .map((d, i) => ({ ...d, color: d.color || PALETTE[i % PALETTE.length] }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* ── build debts from live liability snapshot ── */
  const debts = useMemo<Debt[]>(() => {
    const result: Debt[] = [];
    if (currentSnapshot) {
      const { liabilities } = currentSnapshot;
      Object.entries(liabilities).forEach(([key, items]: [string, any[]]) => {
        items.forEach((item, i) => {
          const colorIdx = result.length % PALETTE.length;
          result.push({
            id:                  item.id,
            name:                item.name,
            emoji:               DEBT_EMOJI_MAP[key] ?? '📋',
            color:               PALETTE[colorIdx],
            debtKind:            DEBT_KIND_MAP[key] ?? 'other',
            currentBalance:      item.amount ?? 0,
            interestRate:        item.interestRate ?? 0,
            minimumPayment:      item.paymentAmount ?? 0,
            monthlyPayment:      item.paymentAmount ?? 0,
            remainingTermMonths: item.remainingTermMonths ?? 0,
          });
        });
      });
    }
    // append any manual debts not already covered by accounts
    manualDebts.forEach((d, i) => {
      result.push({ ...d, color: d.color || PALETTE[(result.length + i) % PALETTE.length] });
    });
    return result;
  }, [currentSnapshot, manualDebts]);

  /* ── run simulations ── */
  const current   = useMemo(() => simulate(debts, strategy,  extra),   [debts, strategy,  extra]);
  const minimum   = useMemo(() => simulate(debts, 'minimum', 0),        [debts]);
  const avalanche = useMemo(() => simulate(debts, 'avalanche', extra),  [debts, extra]);
  const snowball  = useMemo(() => simulate(debts, 'snowball',  extra),  [debts, extra]);

  /* ── thin the chart to ~36 data points max ── */
  const chartData = useMemo(() => {
    const s = current.schedule;
    if (s.length <= 36) return s;
    const step = Math.ceil(s.length / 36);
    return s.filter((_, i) => i % step === 0 || i === s.length - 1);
  }, [current.schedule]);

  /* ── savings vs minimum (only meaningful when extra > 0) ── */
  const interestSaved  = extra > 0 ? Math.max(0, minimum.totalInterest - current.totalInterest) : 0;
  const monthsSaved    = extra > 0 ? Math.max(0, minimum.monthsToPayoff - current.monthsToPayoff) : 0;
  const totalDebtBal   = debts.reduce((s, d) => s + d.currentBalance, 0);
  const totalMinPayment = debts.reduce((s, d) => s + d.minimumPayment, 0);

  /* ── this month's action plan: cascade extra across targets until it's used up ── */
  const actionPlan = useMemo(() => {
    if (extra <= 0 || strategy === 'minimum') return null;
    const alive = debts.filter(d => d.currentBalance > 0);
    if (!alive.length) return null;

    // available room on each debt = balance above its minimum (can't overpay beyond balance)
    const room = new Map(debts.map(d => [d.id, Math.max(0, d.currentBalance - d.minimumPayment)]));
    const extraByDebt = new Map<string, number>();
    let remaining = extra;

    while (remaining > 0.01) {
      const available = debts.filter(d => (room.get(d.id) ?? 0) > 0.01);
      if (!available.length) break;
      const target = strategy === 'avalanche'
        ? available.reduce((hi, d) => d.interestRate > hi.interestRate ? d : hi, available[0])
        : available.reduce((lo, d) => d.currentBalance < lo.currentBalance ? d : lo, available[0]);
      const apply = Math.min(remaining, room.get(target.id) ?? 0);
      room.set(target.id, (room.get(target.id) ?? 0) - apply);
      extraByDebt.set(target.id, (extraByDebt.get(target.id) ?? 0) + apply);
      remaining -= apply;
    }

    const firstTargetId = [...extraByDebt.keys()][0];
    const firstTarget   = debts.find(d => d.id === firstTargetId);

    return {
      targetName:  firstTarget?.name  ?? '',
      targetEmoji: firstTarget?.emoji ?? '',
      multiTarget: extraByDebt.size > 1,
      payments: debts.map(d => {
        const applied = extraByDebt.get(d.id) ?? 0;
        return {
          ...d,
          thisMonth:    d.minimumPayment + applied,
          isTarget:     applied > 0,
          extraApplied: applied,
        };
      }),
    };
  }, [debts, extra, strategy]);

  /* ── per-debt payoff months ── */
  const debtPayoffMonths = useMemo(() => {
    const result: Record<string, number> = {};
    debts.forEach(d => {
      const mo = current.schedule.findIndex(p => (p[d.id] as number) === 0);
      result[d.id] = mo === -1 ? current.monthsToPayoff : mo + 1;
    });
    return result;
  }, [current.schedule, debts, current.monthsToPayoff]);

  /* ── strategy comparison ── */
  const comparison = [
    { label: 'Minimum Only',     months: minimum.monthsToPayoff,   interest: minimum.totalInterest,   color: 'var(--t-red)' },
    { label: 'Snowball Method',  months: snowball.monthsToPayoff,   interest: snowball.totalInterest,  color: 'var(--t-amber)' },
    { label: 'Avalanche Method', months: avalanche.monthsToPayoff,  interest: avalanche.totalInterest, color: 'var(--t-green)' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--t-text-tertiary)', fontSize: 14 }}>
      Loading your debt data…
    </div>
  );

  if (!debts.length) return (
    <div style={{ maxWidth: 560, margin: '80px auto', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t-text-primary)', marginBottom: 8 }}>No debts tracked yet</h2>
      <p style={{ fontSize: 15, color: 'var(--t-text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
        Add your credit cards, loans, and other debts on the Budget page to see your personalized payoff plan here.
      </p>
      <a href="/dashboard/budget" style={{
        display: 'inline-block', padding: '12px 28px', borderRadius: '8px',
        background: 'var(--t-primary)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14,
      }}>
        Go to Budget →
      </a>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--t-text-primary)', margin: 0 }}>Debt Payoff Planner</h1>
        <p style={{ fontSize: 14, color: 'var(--t-text-tertiary)', marginTop: 4, marginBottom: 0 }}>
          Compare payoff strategies and see exactly when you'll be debt-free.
        </p>
      </div>

      {/* ── KPI STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Debt',          value: fmt(totalDebtBal),                    sub: `across ${debts.length} account${debts.length !== 1 ? 's' : ''}`, color: 'var(--t-red)' },
          { label: 'Payoff Date',         value: current.payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), sub: moLabel(current.monthsToPayoff) + ' from now', color: 'var(--t-primary)' },
          { label: 'Total Interest',      value: fmt(current.totalInterest),           sub: 'at current payments',                    color: 'var(--t-amber)' },
          { label: 'Interest Saved',      value: fmt(interestSaved),                   sub: `vs minimums · ${moLabel(monthsSaved)} sooner`, color: 'var(--t-green)' },
        ].map(k => (
          <Card key={k.label} style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, letterSpacing: '-0.02em' }}>{k.value}</div>
            <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 4 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* STRATEGY + EXTRA PAYMENT */}
          <Card>
            <SectionTitle>Payoff Strategy</SectionTitle>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <StratBtn active={strategy === 'avalanche'} onClick={() => setStrategy('avalanche')}
                icon="🔥" label="Avalanche"
                sub="Pay highest interest first. Saves the most money overall." />
              <StratBtn active={strategy === 'snowball'} onClick={() => setStrategy('snowball')}
                icon="⛄" label="Snowball"
                sub="Pay smallest balance first. Builds momentum with quick wins." />
              <StratBtn active={strategy === 'minimum'} onClick={() => setStrategy('minimum')}
                icon="🐢" label="Minimums Only"
                sub="Pay only required minimums. Slowest and most expensive." />
            </div>

            {strategy !== 'minimum' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-text-secondary)' }}>Extra Monthly Payment</div>
                    <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 2 }}>Added on top of all minimum payments ({fmt(totalMinPayment)}/mo)</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--t-primary)' }}>{fmt(extra)}/mo</span>
                  </div>
                </div>
                <input
                  type="range" min={0} max={2000} step={25} value={extra}
                  onChange={e => setExtra(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--t-primary)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 4 }}>
                  <span>$0</span><span>$500</span><span>$1,000</span><span>$1,500</span><span>$2,000</span>
                </div>
              </div>
            )}
          </Card>

          {/* PAYOFF TIMELINE CHART */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <SectionTitle>Payoff Timeline</SectionTitle>
              </div>
              <div style={{ display: 'flex', gap: 4, background: 'var(--t-bg)', borderRadius: 8, padding: 3 }}>
                {(['balance', 'breakdown'] as const).map(v => (
                  <button key={v} onClick={() => setChartView(v)} style={{
                    padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                    background: chartView === v ? 'var(--t-surface)' : 'transparent',
                    color: chartView === v ? 'var(--t-primary)' : 'var(--t-text-tertiary)',
                    boxShadow: chartView === v ? 'var(--t-shadow-sm)' : 'none',
                  }}>
                    {v === 'balance' ? 'Total Balance' : 'Per Debt'}
                  </button>
                ))}
              </div>
            </div>

            {chartView === 'balance' ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={chartColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: 'var(--t-text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--t-text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} width={64} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="total" name="Total Debt" stroke={chartColor} strokeWidth={2.5} fill="url(#debtGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: 'var(--t-text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--t-text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} width={64} />
                  <Tooltip content={<ChartTooltip />} />
                  {debts.map(d => (
                    <Area key={d.id} type="monotone" dataKey={d.id} name={d.name}
                      stroke={d.color} strokeWidth={1.5} fill={d.color} fillOpacity={0.15}
                      stackId="debts" dot={false} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* STRATEGY COMPARISON */}
          <Card>
            <SectionTitle>Strategy Comparison</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              {comparison.map(c => (
                <div key={c.label} style={{
                  padding: '14px 16px', borderRadius: '8px',
                  background: 'var(--t-bg)', border: `1px solid var(--t-border)`,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-text-tertiary)', marginBottom: 8 }}>{c.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{moLabel(c.months)}</div>
                  <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 4 }}>{fmt(c.interest)} in interest</div>
                </div>
              ))}
            </div>

            {/* interest paid bar chart */}
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={comparison} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={40}>
                <XAxis dataKey="label" tick={{ fill: 'var(--t-text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--t-text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} width={64} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="interest" name="Total Interest" radius={[6, 6, 0, 0]}>
                  {comparison.map((c, i) => <Cell key={i} fill={c.color} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* MONTHLY PAYMENT ACTION PLAN */}
          <Card>
            <SectionTitle>{actionPlan ? 'This Month\'s Action Plan' : 'Monthly Payments'}</SectionTitle>

            {actionPlan && (
              <div style={{
                marginBottom: 12, padding: '10px 14px', borderRadius: 10,
                background: 'var(--t-inner-box-bg)', border: '1px solid var(--t-border)',
                fontSize: 12, color: 'var(--t-text-secondary)', lineHeight: 1.6,
              }}>
                <span style={{ fontWeight: 700, color: 'var(--t-primary)' }}>
                  {strategy === 'avalanche' ? '⬆ Avalanche' : '⬇ Snowball'}:
                </span>{' '}
                Pay minimums on all debts, then apply your extra{' '}
                <span style={{ fontWeight: 700, color: 'var(--t-text-primary)' }}>{fmt(extra)}</span>{' '}
                {actionPlan.multiTarget
                  ? 'across multiple debts this month (first target is fully covered, remainder cascades):'
                  : <>toward <span style={{ fontWeight: 700, color: 'var(--t-primary)' }}>{actionPlan.targetEmoji} {actionPlan.targetName}</span>{strategy === 'avalanche' ? ' (highest rate)' : ' (smallest balance)'}.</>
                }
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(actionPlan ? actionPlan.payments : debts.map(d => ({ ...d, thisMonth: d.minimumPayment, isTarget: false }))).map(d => (
                <div key={d.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 13, padding: '8px 10px', borderRadius: 8,
                  background: d.isTarget ? 'rgba(10,63,168,0.06)' : 'transparent',
                  border: d.isTarget ? '1px solid rgba(10,63,168,0.15)' : '1px solid transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{d.emoji}</span>
                    <div>
                      <div style={{ color: 'var(--t-text-primary)', fontWeight: d.isTarget ? 700 : 400 }}>{d.name}</div>
                      {d.isTarget && extra > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)' }}>
                          {fmt(d.minimumPayment)} min + {fmt(extra)} extra
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {d.isTarget && extra > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--t-text-tertiary)', textDecoration: 'line-through' }}>
                        {fmt(d.minimumPayment)}
                      </span>
                    )}
                    <span style={{
                      fontWeight: 700,
                      color: d.isTarget ? 'var(--t-primary)' : 'var(--t-text-primary)',
                      fontSize: d.isTarget ? 14 : 13,
                    }}>
                      {fmt(d.thisMonth)}
                    </span>
                  </div>
                </div>
              ))}

              <div style={{ borderTop: `1px solid var(--t-border)`, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text-secondary)' }}>Total / month</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--t-primary)' }}>
                  {fmt(totalMinPayment + (strategy !== 'minimum' ? extra : 0))}
                </span>
              </div>
            </div>
          </Card>

          {/* DEBT LIST */}
          <Card>
            <SectionTitle>Your Debts · Payoff Order</SectionTitle>
            <div>
              {current.debtPayoffOrder.map((id, rank) => {
                const d = debts.find(x => x.id === id);
                if (!d) return null;
                return (
                  <div key={id} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -8, top: 14, width: 18, height: 18, borderRadius: '50%', background: 'var(--t-primary)', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                      {rank + 1}
                    </div>
                    <div style={{ paddingLeft: 16 }}>
                      <DebtRow debt={d} payoffMonth={debtPayoffMonths[id] ?? 0} highlightColor={'var(--t-primary)'} />
                    </div>
                  </div>
                );
              })}
              {/* debts not yet in order (if sim didn't complete) */}
              {debts.filter(d => !current.debtPayoffOrder.includes(d.id)).map(d => (
                <DebtRow key={d.id} debt={d} payoffMonth={debtPayoffMonths[d.id] ?? 0} highlightColor={'var(--t-text-tertiary)'} />
              ))}
            </div>
          </Card>

          {/* AVALANCHE VS SNOWBALL TIP */}
          <Card style={{ background: 'var(--t-primary-bg)', border: `1px solid var(--t-primary-border)` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-primary)', marginBottom: 10 }}>
              {strategy === 'avalanche' ? '🔥 Why Avalanche Wins Mathematically' :
               strategy === 'snowball'  ? '⛄ Why Snowball Builds Motivation' :
               '⚠️ Minimum Payments Are Expensive'}
            </div>
            <p style={{ fontSize: 13, color: 'var(--t-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {strategy === 'avalanche'
                ? `By targeting the ${debts.sort((a,b) => b.interestRate - a.interestRate)[0]?.name ?? 'highest-rate debt'} first (${debts.sort((a,b) => b.interestRate - a.interestRate)[0]?.interestRate ?? 0}% APR), you stop the most expensive interest from compounding. You save ${fmt(avalanche.totalInterest > snowball.totalInterest ? 0 : snowball.totalInterest - avalanche.totalInterest)} more in interest vs snowball.`
                : strategy === 'snowball'
                ? `By eliminating ${debts.sort((a,b) => a.currentBalance - b.currentBalance)[0]?.name ?? 'your smallest debt'} first, you get your first payoff in ${moLabel(debtPayoffMonths[current.debtPayoffOrder[0]] ?? 0)}. Each payoff frees up cash to accelerate the next one.`
                : `Paying only minimums will cost you ${fmt(minimum.totalInterest)} in interest and take ${moLabel(minimum.monthsToPayoff)}. Adding even ${fmt(100)}/mo extra would save you significant time and money.`}
            </p>
          </Card>

        </div>
      </div>
    </div>
  );
}
