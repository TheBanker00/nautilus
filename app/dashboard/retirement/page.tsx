'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea, ReferenceDot, CartesianGrid,
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
  purple:        '#7C3AED',
  purpleBg:      '#F5F3FF',
  purpleText:    '#6D28D9',
  radius:        '12px',
  radiusSm:      '6px',
  radiusMd:      '8px',
};

/* ─────────────────────────────────────────────────────────────
   INVESTMENT STRATEGY RATES  (annual %)
───────────────────────────────────────────────────────────── */
type AssetRates = { cash: number; investments: number; retirement: number; realEstate: number; other: number };
type RiskKey = 'conservative' | 'moderate' | 'growth' | 'aggressive';

const RISK_RATES: Record<RiskKey, AssetRates> = {
  conservative: { cash: 2.5, investments: 5.5,  retirement: 5.5,  realEstate: 3.0, other: 0.5 },
  moderate:     { cash: 3.0, investments: 7.5,  retirement: 7.5,  realEstate: 4.5, other: 1.0 },
  growth:       { cash: 3.5, investments: 9.0,  retirement: 9.0,  realEstate: 5.5, other: 1.5 },
  aggressive:   { cash: 3.5, investments: 11.0, retirement: 11.0, realEstate: 6.5, other: 2.0 },
};

const RISK_META: Record<RiskKey, { color: string; fill: string; label: string; stocks: number; bonds: number }> = {
  conservative: { color: '#D97706', fill: 'rgba(217,119,6,0.09)',   label: 'Conservative (5.5%)', stocks: 30, bonds: 70 },
  moderate:     { color: '#0a3fa8', fill: 'rgba(10,63,168,0.10)',   label: 'Moderate (7.5%)',     stocks: 60, bonds: 40 },
  growth:       { color: '#16A34A', fill: 'rgba(22,163,74,0.09)',   label: 'Growth (9%)',         stocks: 80, bonds: 20 },
  aggressive:   { color: '#7C3AED', fill: 'rgba(124,58,237,0.08)', label: 'Aggressive (11%)',    stocks: 90, bonds: 10 },
};

const RISK_KEYS: RiskKey[] = ['conservative', 'moderate', 'growth', 'aggressive'];

/* ─────────────────────────────────────────────────────────────
   PROJECTION ENGINE
───────────────────────────────────────────────────────────── */
type AssetSnapshot = {
  cash: number; investments: number; retirement: number;
  realEstate: number; other: number; liabilities: number;
};

function projectByAssetClass(
  snap: AssetSnapshot,
  monthlySavings: number,
  rates: AssetRates,
  months: number,
  extraDebtPaydown = 0,
  annualSalaryGrowth = 0,
  stopContribAtMonth = Infinity,
  annualWithdrawalRate = 0,
  postRetirementRates?: AssetRates,  // different growth rates after retirement
): number[] {
  const rM = (pct: number) => pct / 100 / 12;
  let { cash, investments, retirement, realEstate, other, liabilities } = snap;
  let monthly = monthlySavings;
  const salaryFactor = Math.pow(1 + annualSalaryGrowth / 100, 1 / 12);
  const points: number[] = [Math.round(cash + investments + retirement + realEstate + other - liabilities)];
  for (let m = 1; m <= months; m++) {
    const activeRates = (m > stopContribAtMonth && postRetirementRates) ? postRetirementRates : rates;
    cash        *= (1 + rM(activeRates.cash));
    investments *= (1 + rM(activeRates.investments));
    retirement  *= (1 + rM(activeRates.retirement));
    realEstate  *= (1 + rM(activeRates.realEstate));
    other       *= (1 + rM(activeRates.other));

    if (m <= stopContribAtMonth) {
      investments += Math.max(0, monthly);
      liabilities  = Math.max(0, liabilities - extraDebtPaydown);
      if (annualSalaryGrowth > 0) monthly *= salaryFactor;
    } else if (annualWithdrawalRate > 0) {
      const liquid = cash + investments + retirement + other;
      if (liquid > 0) {
        const f = Math.max(0, 1 - (liquid * (annualWithdrawalRate / 100 / 12)) / liquid);
        cash        = Math.max(0, cash        * f);
        investments = Math.max(0, investments * f);
        retirement  = Math.max(0, retirement  * f);
        other       = Math.max(0, other       * f);
      }
    }
    points.push(Math.round(cash + investments + retirement + realEstate + other - liabilities));
  }
  return points;
}

/* Portfolio longevity — years until nest egg depletes at a given withdrawal and growth rate */
function portfolioLongevityYears(pv: number, annualWithdrawal: number, growthRatePct: number): number {
  if (annualWithdrawal <= 0) return 100;
  if (pv <= 0) return 0;
  const r = growthRatePct / 100 / 12;
  const pmt = annualWithdrawal / 12;
  if (r <= 0) return (pv / pmt) / 12;
  const ratio = r * pv / pmt;
  if (ratio >= 1) return 100; // portfolio grows faster than withdrawal — never depletes
  return -Math.log(1 - ratio) / Math.log(1 + r) / 12;
}

function monthsUntilTarget(series: number[], target: number): number | null {
  const idx = series.findIndex(v => v >= target);
  return idx <= 0 ? null : idx;
}

function addMonths(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

/* ─────────────────────────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────────────────────────── */
const fmtShort = (n: number): string => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
};
const fmt = (n: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const fmtY = (v: number): string => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
};

/* ─────────────────────────────────────────────────────────────
   SHARED UI
───────────────────────────────────────────────────────────── */
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)', letterSpacing: '-0.01em' }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function KpiCard({ label, value, sub, accent, badge, badgeColor, badgeTextColor }: {
  label: string; value: string; sub?: string; accent?: string;
  badge?: string; badgeColor?: string; badgeTextColor?: string;
}) {
  return (
    <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '18px 20px', borderLeft: `4px solid ${accent ?? 'var(--t-primary)'}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--t-text-tertiary)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      {badge && (
        <div style={{ display: 'inline-block', marginTop: 6, padding: '2px 10px', borderRadius: 100, background: badgeColor ?? 'var(--t-primary-bg)', color: badgeTextColor ?? 'var(--t-primary)', fontSize: 11, fontWeight: 700 }}>{badge}</div>
      )}
      {sub && !badge && <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function SliderRow({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--t-text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-primary)', fontVariantNumeric: 'tabular-nums' }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--t-primary)', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 10, color: 'var(--t-text-tertiary)' }}>{format(min)}</span>
        <span style={{ fontSize: 10, color: 'var(--t-text-tertiary)' }}>{format(max)}</span>
      </div>
    </div>
  );
}

function NumberInput({ label, value, prefix, suffix, onChange }: {
  label: string; value: number; prefix?: string; suffix?: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', border: `1px solid var(--t-border-med)`, borderRadius: T.radiusMd, overflow: 'hidden' }}>
        {prefix && <span style={{ padding: '9px 12px', background: 'var(--t-bg)', fontSize: 13, color: 'var(--t-text-tertiary)', borderRight: `1px solid var(--t-border-med)`, flexShrink: 0 }}>{prefix}</span>}
        <input
          type="number" value={value || ''}
          onChange={e => onChange(Number(e.target.value))}
          style={{ flex: 1, padding: '9px 12px', border: 'none', outline: 'none', fontSize: 13, color: 'var(--t-text-primary)', background: 'transparent', fontVariantNumeric: 'tabular-nums', minWidth: 0 }}
        />
        {suffix && <span style={{ padding: '9px 12px', background: 'var(--t-bg)', fontSize: 13, color: 'var(--t-text-tertiary)', borderLeft: `1px solid var(--t-border-med)`, flexShrink: 0 }}>{suffix}</span>}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--t-surface)', border: `1px solid var(--t-border)`, borderRadius: T.radiusMd, padding: '12px 14px', boxShadow: 'var(--t-shadow-md)', minWidth: 180 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-tertiary)', marginBottom: 8 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ fontSize: 12, color: 'var(--t-text-secondary)' }}>{p.name}</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function AssetRateTable({ riskKey, assets }: { riskKey: RiskKey; assets: AssetSnapshot }) {
  const rates = RISK_RATES[riskKey];
  const rows = [
    { label: 'Cash & Banking', value: assets.cash,       rate: rates.cash,       color: '#00A86B' },
    { label: 'Investments',    value: assets.investments, rate: rates.investments, color: 'var(--t-primary)' },
    { label: 'Retirement Accts', value: assets.retirement, rate: rates.retirement, color: '#6d30fb' },
    { label: 'Real Estate',    value: assets.realEstate,  rate: rates.realEstate,  color: '#FF4D4D' },
    { label: 'Other Assets',   value: assets.other,       rate: rates.other,       color: '#E8B800' },
  ].filter(r => r.value > 0);
  return (
    <div>
      {rows.map(r => (
        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid var(--t-border)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--t-text-secondary)' }}>{r.label}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(r.value)}</span>
            <span style={{ fontSize: 11, color: r.rate < 0 ? 'var(--t-red-text)' : 'var(--t-green-text)', marginLeft: 8 }}>
              {r.rate >= 0 ? '+' : ''}{r.rate}%/yr
            </span>
          </div>
        </div>
      ))}
      {assets.liabilities > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0' }}>
          <span style={{ fontSize: 12, color: 'var(--t-text-secondary)' }}>Liabilities</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-red-text)', fontVariantNumeric: 'tabular-nums' }}>−{fmtShort(assets.liabilities)}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   READINESS GAUGE — SVG arc
───────────────────────────────────────────────────────────── */
function ReadinessGauge({ pct, color }: { pct: number; color: string }) {
  // Half-circle gauge (180°)
  const clampedPct = Math.min(100, Math.max(0, pct));
  const angle = (clampedPct / 100) * 180 - 90; // -90 to +90
  const rad   = angle * (Math.PI / 180);
  const r = 52;
  const cx = 70, cy = 70;
  // Arc from -90° to angle°
  const startX = cx + r * Math.cos(-Math.PI / 2);
  const startY = cy + r * Math.sin(-Math.PI / 2);
  const endX   = cx + r * Math.cos(rad);
  const endY   = cy + r * Math.sin(rad);
  const largeArc = clampedPct > 50 ? 1 : 0;
  return (
    <svg width={140} height={80} viewBox="0 0 140 80" style={{ flexShrink: 0 }}>
      {/* Background track */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={'var(--t-border)'} strokeWidth={10} />
      {/* Filled arc */}
      {clampedPct > 0 && (
        <path d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" />
      )}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight={700} fill={'var(--t-text-primary)'} fontFamily="system-ui">{clampedPct}%</text>
      <text x={18}  y={cy + 18} textAnchor="middle" fontSize={9} fill={'var(--t-text-tertiary)'} fontFamily="system-ui">0%</text>
      <text x={122} y={cy + 18} textAnchor="middle" fontSize={9} fill={'var(--t-text-tertiary)'} fontFamily="system-ui">100%</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function RetirementPage() {
  const { currentSnapshot } = useWealthData();
  const { incomeAnalytics, expenseAnalytics, loading } = useFlowData();

  /* ── retirement profile inputs ── */
  const [currentAge,     setCurrentAge]     = useState(40);
  const [retirementAge,  setRetirementAge]  = useState(65);
  const [isRetired,      setIsRetired]      = useState(false);
  const [ssMonthly,      setSsMonthly]      = useState(2200);   // SS benefit at retirement
  const [pensionMonthly, setPensionMonthly] = useState(0);      // pension / business income
  const [withdrawalRate, setWithdrawalRate] = useState(4.0);    // safe withdrawal rate %
  const [retExpenses,    setRetExpenses]    = useState(0);      // monthly expenses in retirement

  // Planned monthly savings toward retirement — auto-seeded from cash flow, user-editable
  const [plannedMonthlySavings, setPlannedMonthlySavings] = useState<number | null>(null);
  const [savingsAutoSet,        setSavingsAutoSet]         = useState(false);

  /* ── chart / scenario controls ── */
  const [activeScen, setActiveScen] = useState<Record<RiskKey, boolean>>({ conservative: true, moderate: true, growth: true, aggressive: true });
  const [riskKey,    setRiskKey]    = useState<RiskKey>('moderate');
  const [postRetirementRiskKey, setPostRetirementRiskKey] = useState<RiskKey>('conservative');
  const [chartTimeRange, setChartTimeRange] = useState<'retirement' | 10 | 20 | 30>(10);
  const [whatIf, setWhatIf] = useState({ additionalSavings: 0, retirementContrib: 0, salaryGrowth: 3, extraDebtPaydown: 0 });

  /* ── asset snapshot ── */
  const snap = currentSnapshot;
  const sumArr = (arr: any[], f: string) => (arr ?? []).reduce((s: number, x: any) => s + Number(x[f] || 0), 0);
  const sumLiab = (arr?: { amount?: number }[]) => (arr ?? []).reduce((s, x) => s + (x.amount ?? 0), 0);

  // Auto-exclude primary residence and second homes; include investment/commercial property
  const NON_INVESTABLE_RE = ['primary_residence', 'second_home'];
  const investableRealEstate = useMemo(() =>
    (snap?.realEstate ?? [])
      .filter(r => !NON_INVESTABLE_RE.includes((r.subtype ?? 'real_estate').toLowerCase()))
      .reduce((s, r) => s + (r.value ?? 0), 0),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [snap]);

  const totalRealEstateValue = sumArr(snap?.realEstate ?? [], 'value');

  const assetSnap: AssetSnapshot = useMemo(() => ({
    cash:        sumArr(snap?.bankAccounts ?? [],       'balance'),
    investments: sumArr(snap?.investmentAccounts ?? [], 'balance'),
    retirement:  sumArr(snap?.retirementAccounts ?? [], 'balance'),
    realEstate:  0,   // Real estate excluded — not a liquid retirement asset
    other:       sumArr(snap?.otherAssets ?? [],        'value'),
    liabilities: 0,   // Debt excluded — payments already reflected in monthly expenses
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [snap]);

  // Investable portfolio value (liquid assets only, no RE or debt)
  const currentNW = assetSnap.cash + assetSnap.investments + assetSnap.retirement + assetSnap.other;

  /* ── monthly cashflow ── */
  const avgMonthlyIncome   = incomeAnalytics?.averageMonthlyIncome   ?? 0;
  const avgMonthlyExpenses = expenseAnalytics?.averageMonthlyExpenses ?? 0;
  const baseMonthlySavings = Math.max(0, avgMonthlyIncome - avgMonthlyExpenses);

  // Auto-populate planned savings from cash flow on first load
  useEffect(() => {
    if (!savingsAutoSet && baseMonthlySavings > 0) {
      setPlannedMonthlySavings(Math.round(baseMonthlySavings));
      setSavingsAutoSet(true);
    }
  }, [baseMonthlySavings, savingsAutoSet]);

  // Auto-populate retirement expenses from average monthly expenses on first load
  useEffect(() => {
    if (retExpenses === 0 && avgMonthlyExpenses > 0) {
      setRetExpenses(Math.round(avgMonthlyExpenses));
    }
  // Only run once when expenses first become available
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avgMonthlyExpenses]);

  // User's planned savings — defaults to cash flow but is independently editable
  const effectiveMonthlySavings = plannedMonthlySavings ?? baseMonthlySavings;
  const adjMonthlySavings = effectiveMonthlySavings + whatIf.additionalSavings + whatIf.retirementContrib;

  /* ── retirement horizon ── */
  const yearsToRetirement   = isRetired ? 0 : Math.max(1, retirementAge - currentAge);
  const retirementMonths    = yearsToRetirement * 12;
  // Always project full 30yr post-retirement; chart slices based on chartTimeRange
  const totalHorizonMonths  = retirementMonths + 360;

  /* ── projections ── */
  const projections = useMemo(() => {
    const build = (key: RiskKey, postKey: RiskKey, extraSav = 0, salGrowth = 0, extraDebt = 0) =>
      projectByAssetClass(
        assetSnap, effectiveMonthlySavings + extraSav, RISK_RATES[key],
        totalHorizonMonths, extraDebt, salGrowth, retirementMonths, withdrawalRate, RISK_RATES[postKey],
      );
    return {
      conservative: build('conservative', postRetirementRiskKey),
      moderate:     build('moderate',     postRetirementRiskKey),
      growth:       build('growth',       postRetirementRiskKey),
      aggressive:   build('aggressive',   postRetirementRiskKey),
      whatIf:       build(riskKey, postRetirementRiskKey, whatIf.additionalSavings + whatIf.retirementContrib, whatIf.salaryGrowth, whatIf.extraDebtPaydown),
    };
  }, [assetSnap, effectiveMonthlySavings, totalHorizonMonths, retirementMonths, withdrawalRate, riskKey, postRetirementRiskKey, whatIf]);

  /* ── retirement balance across strategies ── */
  const retBalance = {
    conservative: projections.conservative[retirementMonths] ?? 0,
    moderate:     projections.moderate[retirementMonths]     ?? 0,
    growth:       projections.growth[retirementMonths]       ?? 0,
    aggressive:   projections.aggressive[retirementMonths]   ?? 0,
    whatIf:       projections.whatIf[retirementMonths]       ?? 0,
  };
  // Primary balance uses user's selected strategy
  const primaryBalance = retBalance[riskKey];

  /* ── retirement income analysis ── */
  const monthlyExpensesInRetirement = retExpenses > 0 ? retExpenses : avgMonthlyExpenses;
  const annualExpensesInRetirement  = monthlyExpensesInRetirement * 12;

  // Portfolio income from selected strategy at retirement
  const annualPortfolioWithdrawal    = primaryBalance * (withdrawalRate / 100);
  const monthlyPortfolioIncome       = annualPortfolioWithdrawal / 12;
  const totalMonthlyRetirementIncome = monthlyPortfolioIncome + ssMonthly + pensionMonthly;
  const monthlyGap                   = monthlyExpensesInRetirement - totalMonthlyRetirementIncome;

  // FI Number = 25× annual expenses (4% rule), adjusted for SS + pension offset
  const fiNumberNoSS   = annualExpensesInRetirement * 25;
  const annualSSOffset = (ssMonthly + pensionMonthly) * 12;
  const fiNumberWithSS = Math.max(0, annualExpensesInRetirement - annualSSOffset) * 25;

  // Readiness = how close today's liquid assets are to the 25× FI number
  const readinessPct = fiNumberWithSS > 0
    ? Math.min(100, Math.round((currentNW / fiNumberWithSS) * 100))
    : currentNW > 0 ? 100 : 0;

  // Longevity: only the portion of expenses not covered by SS + pension draws from the portfolio
  const netAnnualPortfolioWithdrawal = Math.max(0, (monthlyExpensesInRetirement - ssMonthly - pensionMonthly) * 12);
  const longevityYears = portfolioLongevityYears(primaryBalance, netAnnualPortfolioWithdrawal, RISK_RATES[riskKey].investments);

  /* ── readiness color ── */
  const readinessColor = readinessPct >= 100 ? 'var(--t-green)' : readinessPct >= 80 ? 'var(--t-primary)' : readinessPct >= 60 ? 'var(--t-amber)' : 'var(--t-red)';
  const readinessLabel = readinessPct >= 100 ? 'Fully Funded' : readinessPct >= 80 ? 'On Track' : readinessPct >= 60 ? 'Needs Attention' : 'Underfunded';

  /* ── chart data ── */
  const chartSliceMonths = chartTimeRange === 'retirement' ? retirementMonths : retirementMonths + chartTimeRange * 12;
  const chartData = useMemo(() => {
    const now  = new Date();
    const step = 12; // monthly → yearly steps for clean age labels
    const data: any[] = [];
    for (let m = 0; m <= chartSliceMonths; m += step) {
      const date  = addMonths(now, m);
      const age   = currentAge + Math.floor(m / 12);
      const entry: any = {
        label: m === 0 ? 'Now' : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        age,
        month: m,
      };
      RISK_KEYS.forEach(k => {
        entry[k] = projections[k][Math.min(m, projections[k].length - 1)];
      });
      entry.whatIf = projections.whatIf[Math.min(m, projections.whatIf.length - 1)];
      data.push(entry);
    }
    return data;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projections, chartSliceMonths, currentAge]);

  /* ── milestones ── */
  const milestones = useMemo(() => {
    const primaryProj = projections[riskKey];
    const millionMo   = monthsUntilTarget(primaryProj, 1_000_000);
    const fiMo        = fiNumberWithSS > 0 ? monthsUntilTarget(primaryProj, fiNumberWithSS) : null;
    return [
      { label: isRetired ? 'Currently Retired' : `Retire at ${retirementAge}`, months: retirementMonths, color: 'var(--t-primary)', done: isRetired, value: fmtShort(primaryBalance) },
      { label: '$1M Net Worth',              months: millionMo,         color: 'var(--t-green)',   done: currentNW >= 1_000_000, value: null },
      { label: `FI Number: ${fmtShort(fiNumberWithSS)}`, months: fiMo, color: 'var(--t-purple)',  done: currentNW >= fiNumberWithSS, value: null },
    ];
  }, [projections, riskKey, retirementMonths, fiNumberWithSS, retirementAge, primaryBalance, currentNW, isRetired]);

  /* ── AI insights ── */
  const insights = useMemo(() => {
    const list: string[] = [];
    const stratLabel = RISK_META[riskKey].label;
    if (primaryBalance > 0 && monthlyPortfolioIncome > 0)
      list.push(isRetired
        ? `Your ${fmtShort(primaryBalance)} portfolio currently generates ${fmt(monthlyPortfolioIncome)}/mo at a ${withdrawalRate}% withdrawal rate (${stratLabel} strategy).`
        : `At ${retirementAge} (${stratLabel} strategy), your ${fmtShort(primaryBalance)} portfolio generates ${fmt(monthlyPortfolioIncome)}/mo at a ${withdrawalRate}% withdrawal rate.`);
    if (ssMonthly > 0 || pensionMonthly > 0) {
      const extras = [ssMonthly > 0 ? `${fmt(ssMonthly)}/mo SS` : '', pensionMonthly > 0 ? `${fmt(pensionMonthly)}/mo pension` : ''].filter(Boolean).join(' + ');
      list.push(`Adding ${extras} brings total retirement income to ${fmt(totalMonthlyRetirementIncome)}/mo.`);
    }
    if (monthlyGap > 0)
      list.push(`You have a ${fmt(monthlyGap)}/mo retirement income gap. You need ${fmtShort(fiNumberWithSS)} total (25× expenses minus SS offset) — or reduce monthly expenses by ${fmt(monthlyGap)}.`);
    else
      list.push(`Your projected income exceeds your expenses by ${fmt(Math.abs(monthlyGap))}/mo in retirement — you have a surplus.`);
    if (longevityYears < 30)
      list.push(`At this withdrawal rate, your portfolio lasts ~${longevityYears.toFixed(0)} years. Consider reducing to ${(withdrawalRate - 0.5).toFixed(1)}% to extend longevity.`);
    const boost500 = projectByAssetClass(assetSnap, effectiveMonthlySavings + 500, RISK_RATES[riskKey], retirementMonths, 0, 0, retirementMonths);
    const lift = (boost500[retirementMonths] ?? 0) - primaryBalance;
    if (lift > 0 && effectiveMonthlySavings > 0)
      list.push(`Adding $500/month now grows your nest egg by ${fmtShort(lift)} — an extra ${fmt((lift * withdrawalRate / 100) / 12)}/mo in retirement income.`);
    return list.slice(0, 4);
  }, [primaryBalance, riskKey, monthlyPortfolioIncome, ssMonthly, totalMonthlyRetirementIncome, monthlyGap, withdrawalRate, longevityYears, retirementAge, assetSnap, effectiveMonthlySavings, retirementMonths, fiNumberWithSS, isRetired]);

  const hasWhatIf = whatIf.additionalSavings !== 0 || whatIf.retirementContrib !== 0 || whatIf.extraDebtPaydown !== 0 || whatIf.salaryGrowth !== 3;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: `3px solid var(--t-border)`, borderTop: `3px solid var(--t-primary)`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)' }}>Building your retirement plan…</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--t-text-primary)', letterSpacing: '-0.02em' }}>Retirement Planning</div>
        <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)', marginTop: 3 }}>Model your path to financial independence. Every input updates your projections instantly.</div>
      </div>

      {/* ── RETIREMENT PROFILE SETUP ── */}
      <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 26px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text-primary)' }}>Your Retirement Profile</div>
          <button
            onClick={() => setIsRetired(r => !r)}
            style={{
              fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
              border: `1px solid ${isRetired ? 'var(--t-green)' : 'var(--t-border-med)'}`,
              background: isRetired ? 'var(--t-green)' : 'transparent',
              color: isRetired ? '#fff' : 'var(--t-text-secondary)',
              cursor: 'pointer', letterSpacing: '0.04em', transition: 'all 0.15s',
            }}
          >
            {isRetired ? 'RETIRED ✓' : 'Mark as Retired'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
          {/* Current age */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 6 }}>Current Age</label>
            <input
              type="number" min={18} max={80}
              defaultValue={currentAge}
              onBlur={e => setCurrentAge(Math.max(18, Math.min(80, Number(e.target.value) || currentAge)))}
              onChange={e => { const v = Number(e.target.value); if (v >= 18 && v <= 80) setCurrentAge(v); }}
              style={{ width: '100%', padding: '9px 12px', border: `1px solid var(--t-border-med)`, borderRadius: T.radiusMd, fontSize: 18, fontWeight: 700, color: 'var(--t-primary)', outline: 'none', textAlign: 'center', fontVariantNumeric: 'tabular-nums', boxSizing: 'border-box' }}
            />
          </div>

          {/* Retirement age / retired display */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 6 }}>
              {isRetired ? 'Retirement Status' : 'Target Retirement Age'}
            </label>
            {isRetired ? (
              <div style={{
                width: '100%', padding: '9px 12px', border: `1px solid var(--t-green)`,
                borderRadius: T.radiusMd, fontSize: 16, fontWeight: 700, color: 'var(--t-green)',
                textAlign: 'center', background: 'color-mix(in srgb, var(--t-green) 8%, transparent)',
                boxSizing: 'border-box',
              }}>
                Already Retired
              </div>
            ) : (
              <input
                type="number" min={currentAge + 1} max={90}
                defaultValue={retirementAge}
                onBlur={e => setRetirementAge(Math.max(currentAge + 1, Math.min(90, Number(e.target.value) || retirementAge)))}
                onChange={e => { const v = Number(e.target.value); if (v > currentAge && v <= 90) setRetirementAge(v); }}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid var(--t-border-med)`, borderRadius: T.radiusMd, fontSize: 18, fontWeight: 700, color: 'var(--t-green)', outline: 'none', textAlign: 'center', fontVariantNumeric: 'tabular-nums', boxSizing: 'border-box' }}
              />
            )}
          </div>

          {/* Social Security */}
          <NumberInput label="Social Security / mo" value={ssMonthly} prefix="$" onChange={setSsMonthly} />

          {/* Pension / business income */}
          <NumberInput label="Pension / Business / mo" value={pensionMonthly} prefix="$" onChange={setPensionMonthly} />

          {/* Withdrawal rate */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 6 }}>Withdrawal Rate</label>
            <div style={{ display: 'flex', border: `1px solid var(--t-border-med)`, borderRadius: T.radiusMd, overflow: 'hidden' }}>
              <input type="number" value={withdrawalRate} min={1} max={10} step={0.1}
                onChange={e => setWithdrawalRate(Math.max(1, Math.min(10, Number(e.target.value))))}
                style={{ flex: 1, minWidth: 0, padding: '9px 8px', border: 'none', outline: 'none', fontSize: 14, fontWeight: 700, color: 'var(--t-purple)', background: 'transparent', fontVariantNumeric: 'tabular-nums' }}
              />
              <span style={{ padding: '9px 8px', background: 'var(--t-bg)', fontSize: 12, color: 'var(--t-text-tertiary)', borderLeft: `1px solid var(--t-border-med)`, whiteSpace: 'nowrap' }}>% / yr</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', marginTop: 3 }}>4% = traditional safe withdrawal</div>
          </div>

          {/* Monthly expenses in retirement */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 6 }}>Monthly Expenses in Retirement</label>
            <div style={{ display: 'flex', border: `1px solid var(--t-border-med)`, borderRadius: T.radiusMd, overflow: 'hidden' }}>
              <span style={{ padding: '9px 12px', background: 'var(--t-bg)', fontSize: 13, color: 'var(--t-text-tertiary)', borderRight: `1px solid var(--t-border-med)` }}>$</span>
              <input type="number" value={retExpenses || ''}
                onChange={e => setRetExpenses(Number(e.target.value))}
                style={{ flex: 1, padding: '9px 12px', border: 'none', outline: 'none', fontSize: 13, color: 'var(--t-text-primary)', background: 'transparent', fontVariantNumeric: 'tabular-nums' }}
              />
            </div>
            <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', marginTop: 3 }}>
              Auto-filled from your avg monthly expenses
            </div>
          </div>
        </div>

        {/* Second row — savings intent + investment strategy */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16, paddingTop: 16, borderTop: `1px solid var(--t-border)` }}>

          {/* Planned monthly savings toward retirement */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 6 }}>
              Planned Monthly Savings Toward Retirement
            </label>
            <div style={{ display: 'flex', border: `1px solid var(--t-border-med)`, borderRadius: T.radiusMd, overflow: 'hidden' }}>
              <span style={{ padding: '9px 12px', background: 'var(--t-bg)', fontSize: 13, color: 'var(--t-text-tertiary)', borderRight: `1px solid var(--t-border-med)` }}>$</span>
              <input
                type="number"
                value={effectiveMonthlySavings || ''}
                onChange={e => setPlannedMonthlySavings(Math.max(0, Number(e.target.value)))}
                style={{ flex: 1, padding: '9px 12px', border: 'none', outline: 'none', fontSize: 13, color: 'var(--t-primary)', background: 'transparent', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}
              />
              {plannedMonthlySavings !== null && Math.round(plannedMonthlySavings) !== Math.round(baseMonthlySavings) && (
                <button
                  onClick={() => setPlannedMonthlySavings(Math.round(baseMonthlySavings))}
                  style={{ padding: '9px 10px', background: 'var(--t-primary-bg)', border: 'none', borderLeft: `1px solid var(--t-border-med)`, color: 'var(--t-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Reset to actual
                </button>
              )}
            </div>
            <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', marginTop: 3 }}>
              Current cash flow is {fmt(baseMonthlySavings)}/mo — reduce if not all goes toward retirement
            </div>
          </div>

          {/* Investment strategy */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 6 }}>
              Investment Strategy
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, height: 38 }}>
              {RISK_KEYS.map(k => (
                <button key={k} onClick={() => setRiskKey(k)} style={{
                  height: '100%', borderRadius: T.radiusMd, cursor: 'pointer', transition: 'all 0.15s',
                  border: `1.5px solid ${riskKey === k ? RISK_META[k].color : 'var(--t-border)'}`,
                  background: riskKey === k ? `${RISK_META[k].color}14` : 'var(--t-surface)',
                  color: riskKey === k ? RISK_META[k].color : 'var(--t-text-secondary)',
                  fontSize: 11, fontWeight: riskKey === k ? 700 : 500, textAlign: 'center' as const,
                  display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 1,
                }}>
                  <div style={{ textTransform: 'capitalize' }}>{k}</div>
                  <div style={{ fontSize: 10, opacity: 0.8 }}>
                    {RISK_RATES[k].investments}%
                  </div>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', marginTop: 4 }}>
              Rate applied to cash, investment &amp; retirement accounts
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div style={{ display: 'flex', gap: 24, marginTop: 18, paddingTop: 16, borderTop: `1px solid var(--t-border)` }}>
          {[
            { label: 'Years to Retirement', value: `${yearsToRetirement}`, color: 'var(--t-primary)' },
            { label: 'Retirement Date', value: addMonths(new Date(), retirementMonths).getFullYear().toString(), color: 'var(--t-text-secondary)' },
            { label: `Portfolio at Retirement (${riskKey})`, value: fmtShort(primaryBalance), color: RISK_META[riskKey].color },
            { label: 'Monthly Withdrawal', value: fmt(monthlyPortfolioIncome), color: 'var(--t-green)' },
            { label: 'Financial Independence Number', value: fmtShort(fiNumberWithSS), color: 'var(--t-purple)' },
            { label: 'Portfolio Longevity', value: longevityYears >= 100 ? '100+ yrs' : `${longevityYears.toFixed(0)} yrs`, color: longevityYears >= 30 ? 'var(--t-green)' : 'var(--t-amber)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Current Net Worth"      value={fmtShort(currentNW)}            sub="As of today"             accent={'var(--t-primary)'} />
        <KpiCard label={isRetired ? 'Current Nest Egg' : 'Nest Egg at Retirement'} value={fmtShort(primaryBalance)} sub={isRetired ? `${riskKey} strategy, today` : `${riskKey} strategy, age ${retirementAge}`} accent={RISK_META[riskKey].color} />
        <KpiCard label="Total Monthly Income"  value={fmt(totalMonthlyRetirementIncome)}
          sub={[`${fmt(monthlyPortfolioIncome)} portfolio`, ssMonthly > 0 ? `${fmt(ssMonthly)} SS` : '', pensionMonthly > 0 ? `${fmt(pensionMonthly)} pension` : ''].filter(Boolean).join(' + ')}
          accent={'var(--t-green)'} />
        <KpiCard label="Retirement Readiness"  value={`${readinessPct}%`}
          badge={readinessLabel} badgeColor={`${readinessColor}18`} badgeTextColor={readinessColor} accent={readinessColor}
        />
        <KpiCard
          label="Income Gap / Surplus"
          value={fmt(Math.abs(monthlyGap))}
          badge={monthlyGap <= 0 ? 'Surplus' : 'Gap'}
          badgeColor={monthlyGap <= 0 ? 'var(--t-green-bg)' : 'var(--t-red-bg)'}
          badgeTextColor={monthlyGap <= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)'}
          accent={monthlyGap <= 0 ? 'var(--t-green)' : 'var(--t-red)'}
        />
      </div>

      {/* ── HERO CHART ── */}
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.7; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .you-are-here-pulse { animation: pulse-ring 2s ease-out infinite; }
      `}</style>
      <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-md)', padding: '24px 28px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />

        {/* ── Chart header row 1: title + post-retirement strategy ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)' }}>Wealth Projection</div>
            <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 2 }}>
              Accumulation at <strong style={{ color: RISK_META[riskKey].color }}>{RISK_META[riskKey].label}</strong>
              {' → '} retirement at <strong style={{ color: RISK_META[postRetirementRiskKey].color }}>{RISK_META[postRetirementRiskKey].label}</strong>
            </div>
          </div>

          {/* Post-retirement strategy selector */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Post-Retirement Strategy</div>
            <div style={{ display: 'flex', gap: 0, border: `1px solid rgba(0,0,0,0.12)`, borderRadius: 9, overflow: 'hidden' }}>
              {RISK_KEYS.map((k, i) => (
                <button key={k} onClick={() => setPostRetirementRiskKey(k)} style={{
                  padding: '5px 11px', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  borderLeft: i > 0 ? `1px solid rgba(0,0,0,0.1)` : 'none',
                  background: postRetirementRiskKey === k ? RISK_META[k].color : 'transparent',
                  color: postRetirementRiskKey === k ? '#fff' : 'var(--t-text-tertiary)',
                  fontSize: 11, fontWeight: postRetirementRiskKey === k ? 700 : 500,
                  textTransform: 'capitalize',
                }}>
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Chart header row 2: scenario toggles + time range ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          {/* Scenario toggles */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {RISK_KEYS.map(k => (
              <button key={k} onClick={() => setActiveScen(p => ({ ...p, [k]: !p[k] }))} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 100,
                border: `1.5px solid ${activeScen[k] ? RISK_META[k].color : 'var(--t-border)'}`,
                background: activeScen[k] ? `${RISK_META[k].color}12` : 'var(--t-surface)',
                color: activeScen[k] ? RISK_META[k].color : 'var(--t-text-tertiary)',
                cursor: 'pointer', fontSize: 11, fontWeight: riskKey === k ? 700 : 500, transition: 'all 0.15s ease',
                boxShadow: riskKey === k && activeScen[k] ? `0 0 0 2px ${RISK_META[k].color}30` : 'none',
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: activeScen[k] ? RISK_META[k].color : 'var(--t-border-med)' }} />
                {RISK_META[k].label}
              </button>
            ))}
            {hasWhatIf && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 100, border: `1.5px dashed var(--t-purple)`, background: 'var(--t-purple-bg)', color: 'var(--t-purple)', fontSize: 11, fontWeight: 600 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--t-purple)' }} />
                Your Scenario
              </div>
            )}
          </div>

          {/* Time range pills */}
          <div style={{ display: 'flex', gap: 0, border: `1px solid rgba(0,0,0,0.12)`, borderRadius: 9, overflow: 'hidden' }}>
            {([['To Retirement', 'retirement'], ['+10 yrs', 10], ['+20 yrs', 20], ['+30 yrs', 30]] as const).map(([label, val], i) => (
              <button key={String(val)} onClick={() => setChartTimeRange(val as any)} style={{
                padding: '5px 12px', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                borderLeft: i > 0 ? `1px solid rgba(0,0,0,0.1)` : 'none',
                background: chartTimeRange === val ? '#0a3fa8' : 'transparent',
                color: chartTimeRange === val ? '#fff' : 'var(--t-text-tertiary)',
                fontSize: 11, fontWeight: chartTimeRange === val ? 700 : 500, whiteSpace: 'nowrap',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Chart ── */}
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData} margin={{ top: 16, right: 80, left: 10, bottom: 24 }}>
            <defs>
              <linearGradient id="accumZone" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={'var(--t-primary)'} stopOpacity={0.04} />
                <stop offset="100%" stopColor={'var(--t-primary)'} stopOpacity={0.04} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={'var(--t-border)'} vertical={false} />

            {/* Dual X-axis: date + age */}
            <XAxis
              dataKey="label"
              tickLine={false} axisLine={false}
              height={40}
              tick={(props: any) => {
                const d = chartData[props.index];
                const isRetire = d && d.month >= retirementMonths && (props.index === 0 || chartData[props.index - 1]?.month < retirementMonths);
                return (
                  <g>
                    <text x={props.x} y={props.y + 12} textAnchor="middle" fontSize={10} fill={'var(--t-text-tertiary)'}>{props.payload.value}</text>
                    <text x={props.x} y={props.y + 24} textAnchor="middle" fontSize={10} fill={'var(--t-primary)'} fontWeight={600}>
                      {d ? `Age ${d.age}` : ''}
                    </text>
                  </g>
                );
              }}
              interval="preserveStartEnd"
            />

            <YAxis tickFormatter={fmtY} tick={{ fontSize: 10, fill: 'var(--t-text-tertiary)' }} tickLine={false} axisLine={false} width={72} />

            {/* Unified crosshair tooltip */}
            <Tooltip
              cursor={{ stroke: 'var(--t-border-med)', strokeWidth: 1, strokeDasharray: '4 2' }}
              content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                const isPostRetirement = d?.month > retirementMonths;
                return (
                  <div style={{ background: 'var(--t-surface)', border: `1px solid var(--t-border)`, borderRadius: 10, padding: '12px 14px', boxShadow: 'var(--t-shadow-md)', minWidth: 200 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-text-primary)' }}>{label}</span>
                      <span style={{ fontSize: 11, color: isPostRetirement ? 'var(--t-amber)' : 'var(--t-primary)', fontWeight: 600, background: isPostRetirement ? 'var(--t-amber-bg)' : 'var(--t-primary-bg)', padding: '2px 7px', borderRadius: 100 }}>
                        Age {d?.age} · {isPostRetirement ? 'Distribution' : 'Building'}
                      </span>
                    </div>
                    {RISK_KEYS.filter(k => activeScen[k]).map(k => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: RISK_META[k].color, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: 'var(--t-text-secondary)', fontWeight: k === riskKey ? 700 : 400 }}>{RISK_META[k].label}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: RISK_META[k].color, fontVariantNumeric: 'tabular-nums' }}>{fmtShort(d?.[k] ?? 0)}</span>
                      </div>
                    ))}
                    {hasWhatIf && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, paddingTop: 4, borderTop: `1px solid var(--t-border)`, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--t-purple)' }}>Your Scenario</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-purple)', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(d?.whatIf ?? 0)}</span>
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* Accumulation zone shading */}
            {(() => {
              const retLabel = chartData.find(d => d.month >= retirementMonths)?.label;
              const lastLabel = chartData[chartData.length - 1]?.label;
              return (
                <>
                  {retLabel && (
                    <ReferenceArea x1="Now" x2={retLabel} fill="rgba(10,63,168,0.04)" ifOverflow="visible"
                      label={{ value: 'Building', position: 'insideTopLeft', fontSize: 10, fill: 'var(--t-primary)', fontWeight: 600, dy: 4, dx: 6 }} />
                  )}
                  {retLabel && chartTimeRange !== 'retirement' && (
                    <ReferenceArea x1={retLabel} x2={lastLabel} fill="rgba(217,119,6,0.04)" ifOverflow="visible"
                      label={{ value: 'Drawing Down', position: 'insideTopLeft', fontSize: 10, fill: 'var(--t-amber)', fontWeight: 600, dy: 4, dx: 6 }} />
                  )}
                </>
              );
            })()}

            {/* FI Number reference line */}
            {fiNumberWithSS > 0 && (
              <ReferenceLine y={fiNumberWithSS} stroke={'var(--t-purple)'} strokeWidth={1.5} strokeDasharray="6 3"
                label={{ value: `FI: ${fmtShort(fiNumberWithSS)}`, position: 'right', fontSize: 10, fill: 'var(--t-purple)', fontWeight: 700 }} />
            )}

            {/* $1M milestone line */}
            {currentNW < 1_000_000 && (
              <ReferenceLine y={1_000_000} stroke={'var(--t-green)'} strokeWidth={1} strokeDasharray="4 4"
                label={{ value: '$1M', position: 'right', fontSize: 10, fill: 'var(--t-green-text)', fontWeight: 700 }} />
            )}

            {/* Strategy areas */}
            {RISK_KEYS.map(k => activeScen[k] && (
              <Area key={k} type="monotone" dataKey={k} name={RISK_META[k].label}
                stroke={RISK_META[k].color} fill={RISK_META[k].fill}
                strokeWidth={riskKey === k ? 2.5 : 1.5}
                strokeDasharray={riskKey === k ? '0' : '5 3'}
                dot={false} activeDot={{ r: 5, strokeWidth: 2 }} />
            ))}
            {hasWhatIf && (
              <Area type="monotone" dataKey="whatIf" name="Your Scenario"
                stroke={'var(--t-purple)'} fill="rgba(124,58,237,0.06)" strokeWidth={2.5}
                strokeDasharray="6 3" dot={false} activeDot={{ r: 4 }} />
            )}

            {/* Retirement date line + delta annotation */}
            {(() => {
              const retLabel = chartData.find(d => d.month >= retirementMonths)?.label;
              const spread   = (retBalance.aggressive ?? 0) - (retBalance.conservative ?? 0);
              return retLabel ? (
                <ReferenceLine x={retLabel} stroke={'var(--t-green)'} strokeWidth={2} strokeDasharray="6 3"
                  label={{ value: isRetired ? `Retired${spread > 0 ? `  ±${fmtShort(spread/2)}` : ''}` : `Retire ${retirementAge}${spread > 0 ? `  ±${fmtShort(spread/2)}` : ''}`, position: 'top', fontSize: 11, fill: 'var(--t-green)', fontWeight: 700 }} />
              ) : null;
            })()}

            {/* "You are here" dot at current NW */}
            {currentNW > 0 && (
              <ReferenceDot x="Now" y={currentNW} r={6} fill={'var(--t-primary)'} stroke="#fff" strokeWidth={2}
                label={{ value: `You · ${fmtShort(currentNW)}`, position: 'right', fontSize: 10, fill: 'var(--t-primary)', fontWeight: 700 }} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

        {/* ─── LEFT ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* RETIREMENT INCOME ANALYSIS */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '24px 26px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
            <SectionHeader title="Retirement Income Analysis" sub="How your monthly income stacks up against your retirement expenses." />

            {/* Readiness gauge + breakdown */}
            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 20 }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <ReadinessGauge pct={readinessPct} color={readinessColor} />
                <div style={{ fontSize: 11, fontWeight: 700, color: readinessColor, marginTop: 4 }}>{readinessLabel}</div>
                <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)' }}>Income coverage</div>
              </div>

              <div style={{ flex: 1, minWidth: 220 }}>
                {/* Income sources */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Income Sources</div>
                  {[
                    { label: `Portfolio (${withdrawalRate}% withdrawal)`, value: monthlyPortfolioIncome, color: 'var(--t-primary)' },
                    { label: 'Social Security',                           value: ssMonthly,             color: 'var(--t-green)'  },
                    ...(pensionMonthly > 0 ? [{ label: 'Pension / Business Income', value: pensionMonthly, color: 'var(--t-amber)' }] : []),
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid var(--t-border)` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                        <span style={{ fontSize: 12, color: 'var(--t-text-secondary)' }}>{label}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{fmt(value)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `2px solid var(--t-border-med)` }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text-primary)' }}>Total Monthly Income</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-green)', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalMonthlyRetirementIncome)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text-primary)' }}>Monthly Expenses</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-red)', fontVariantNumeric: 'tabular-nums' }}>{fmt(monthlyExpensesInRetirement)}</span>
                  </div>
                </div>

                {/* Gap or surplus */}
                <div style={{ padding: '12px 16px', borderRadius: T.radiusMd, background: monthlyGap <= 0 ? 'var(--t-green-bg)' : 'var(--t-red-bg)', border: `1px solid ${monthlyGap <= 0 ? 'var(--t-green-border)' : 'var(--t-red-border)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: monthlyGap <= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)' }}>
                      {monthlyGap <= 0 ? 'Monthly Surplus' : 'Monthly Gap'}
                    </span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: monthlyGap <= 0 ? 'var(--t-green)' : 'var(--t-red)', fontVariantNumeric: 'tabular-nums' }}>
                      {monthlyGap <= 0 ? '+' : '-'}{fmt(Math.abs(monthlyGap))}
                    </span>
                  </div>
                  {monthlyGap > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--t-red-text)', marginTop: 4 }}>
                      You need {fmtShort(monthlyGap * 12 / (withdrawalRate / 100))} more in your portfolio, or reduce withdrawal rate.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Strategy comparison at retirement */}
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text-tertiary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portfolio at Retirement by Strategy</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {RISK_KEYS.map(k => {
                const val = retBalance[k] ?? 0;
                const monthly = val * (withdrawalRate / 100) / 12;
                return (
                  <div key={k} style={{ padding: '12px', borderRadius: T.radiusMd, border: `1.5px solid ${RISK_META[k].color}${k === riskKey ? '60' : '20'}`, background: `${RISK_META[k].color}08`, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: RISK_META[k].color, marginBottom: 6 }}>{RISK_META[k].label.split('(')[0].trim()}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(val)}</div>
                    <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{fmt(monthly)}/mo</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WHAT-IF SIMULATOR */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '24px 26px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
            <SectionHeader title="What-If Simulator" sub="Adjust inputs to see how decisions change your retirement nest egg. Updates the purple line on the chart." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
              <div>
                <SliderRow label="Extra Monthly Savings" value={whatIf.additionalSavings} min={0} max={5000} step={50}
                  format={v => fmt(v)} onChange={v => setWhatIf(p => ({ ...p, additionalSavings: v }))} />
                <SliderRow label="Extra Retirement Contributions" value={whatIf.retirementContrib} min={0} max={3000} step={50}
                  format={v => fmt(v)} onChange={v => setWhatIf(p => ({ ...p, retirementContrib: v }))} />
              </div>
              <div>
                <SliderRow label="Annual Salary Growth" value={whatIf.salaryGrowth} min={0} max={15} step={0.5}
                  format={v => `${v.toFixed(1)}%`} onChange={v => setWhatIf(p => ({ ...p, salaryGrowth: v }))} />
                <SliderRow label="Extra Debt Paydown / Month" value={whatIf.extraDebtPaydown} min={0} max={2000} step={50}
                  format={v => fmt(v)} onChange={v => setWhatIf(p => ({ ...p, extraDebtPaydown: v }))} />
              </div>
            </div>
            {hasWhatIf && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: '14px 16px', background: 'var(--t-purple-bg)', borderRadius: T.radiusMd, border: `1px solid rgba(124,58,237,0.20)`, marginTop: 4 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--t-purple-text)', fontWeight: 600, marginBottom: 3 }}>Nest Egg (Your Scenario)</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-purple)', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(retBalance.whatIf)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--t-purple-text)', fontWeight: 600, marginBottom: 3 }}>vs. {riskKey} strategy</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: retBalance.whatIf >= primaryBalance ? 'var(--t-green)' : 'var(--t-red)', fontVariantNumeric: 'tabular-nums' }}>
                    {retBalance.whatIf >= primaryBalance ? '+' : ''}{fmtShort(retBalance.whatIf - primaryBalance)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--t-purple-text)', fontWeight: 600, marginBottom: 3 }}>Monthly Income Change</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: retBalance.whatIf >= primaryBalance ? 'var(--t-green)' : 'var(--t-red)', fontVariantNumeric: 'tabular-nums' }}>
                    {retBalance.whatIf >= primaryBalance ? '+' : ''}{fmt((retBalance.whatIf - primaryBalance) * (withdrawalRate / 100) / 12)}/mo
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ─── RIGHT ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* GROWTH RATE ASSUMPTIONS */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
            <SectionHeader title="Growth Rate Assumptions" sub={`Rates for ${riskKey} strategy`} />
            <AssetRateTable riskKey={riskKey} assets={assetSnap} />
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--t-bg)', borderRadius: T.radiusMd, fontSize: 11, color: 'var(--t-text-tertiary)', lineHeight: 1.5 }}>
              Returns: long-term historical averages by asset class. Past performance does not guarantee future results.
            </div>
          </div>

          {/* STRATEGY OUTCOMES AT RETIREMENT */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
            <SectionHeader title={isRetired ? 'Current Portfolio Value' : `At Retirement (Age ${retirementAge})`} sub="By investment strategy" />
            {RISK_KEYS.map((k, i) => {
              const val  = retBalance[k] ?? 0;
              const gain = val - currentNW;
              const isSelected = k === riskKey;
              return (
                <div key={k} onClick={() => setRiskKey(k)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 10px', borderRadius: T.radiusMd, marginBottom: 4, cursor: 'pointer',
                  border: `1.5px solid ${isSelected ? RISK_META[k].color : 'var(--t-border)'}`,
                  background: isSelected ? `${RISK_META[k].color}08` : 'transparent',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: RISK_META[k].color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: isSelected ? 700 : 500, color: isSelected ? RISK_META[k].color : 'var(--t-text-primary)' }}>
                        {RISK_META[k].label}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)' }}>
                        {fmt(val * (withdrawalRate / 100) / 12)}/mo income
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(val)}</div>
                    <div style={{ fontSize: 11, color: gain >= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)', fontVariantNumeric: 'tabular-nums' }}>
                      {gain >= 0 ? '+' : ''}{fmtShort(gain)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MILESTONES */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
            <SectionHeader title="Milestones" sub="Base scenario." />
            {milestones.map((m, i) => (
              <div key={m.label} style={{ marginBottom: i < milestones.length - 1 ? 18 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.done ? 'var(--t-green)' : m.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--t-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: m.done ? 'var(--t-green)' : m.color }}>
                      {m.done ? '✓ Done' : m.months == null ? 'Beyond' : m.months < 12 ? `${m.months}mo` : `${(m.months / 12).toFixed(1)}yr`}
                    </div>
                    {m.value && <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{m.value}</div>}
                  </div>
                </div>
                <div style={{ height: 4, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: m.done ? '100%' : m.months == null ? '5%' : `${Math.min(100, (m.months / (totalHorizonMonths * 0.8)) * 100)}%`, background: m.done ? 'var(--t-green)' : m.color, borderRadius: 100 }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--t-purple-bg)', borderRadius: T.radiusMd, border: `1px solid rgba(124,58,237,0.20)` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-purple-text)', marginBottom: 2 }}>Financial Independence Number</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t-purple)', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(fiNumberWithSS)}</div>
              <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', marginTop: 2 }}>Without SS offset: {fmtShort(fiNumberNoSS)}</div>
            </div>
          </div>

          {/* AI INSIGHTS */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
            <SectionHeader title="Nautilus Insights" />
            {insights.map((insight, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: T.radiusMd, background: 'var(--t-primary-bg)', border: `1px solid var(--t-primary-border)`, marginBottom: i < insights.length - 1 ? 8 : 0 }}>
                <span style={{ color: 'var(--t-primary)', fontSize: 14, flexShrink: 0 }}>💡</span>
                <span style={{ fontSize: 12, color: 'var(--t-text-secondary)', lineHeight: 1.55 }}>{insight}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── LEGAL DISCLAIMER ── */}
      <div style={{
        marginTop: 32,
        padding: '18px 22px',
        background: 'var(--t-amber-bg)',
        border: '1px solid var(--t-amber-border)',
        borderLeft: '4px solid var(--t-amber)',
        borderRadius: T.radius,
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Important Disclaimer — Not Financial Advice
            </div>
            <p style={{ fontSize: 12, color: '#78350F', margin: 0, lineHeight: 1.6 }}>
              All projections, growth rates, and retirement estimates shown in this calculator are based on historical market averages and are provided for <strong>illustrative and educational purposes only</strong>. Past performance is not indicative of future results. Markets are volatile and actual returns will vary — they may be significantly higher or lower than the rates modeled here, and there is no guarantee that any investment strategy will achieve its projected outcome.
            </p>
            <p style={{ fontSize: 12, color: '#78350F', margin: '8px 0 0', lineHeight: 1.6 }}>
              This tool does not constitute financial, investment, tax, or legal advice. Nautilius Money is not a registered investment advisor. You should consult a qualified financial professional before making any investment or retirement planning decisions.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
