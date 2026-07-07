'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell,
  PieChart, Pie, Tooltip, ReferenceLine,
  XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { format, startOfYear } from 'date-fns';

import SummaryCard      from '../../components/SummaryCard';
import KPIGrid          from '../../components/finance/KPIGrid';
import FinanceCard      from '../../components/finance/FinanceCard';
import ChartContainer   from '../../components/finance/ChartContainer';
import TransactionFeed    from '../../components/finance/TransactionFeed';
import NoDataEmptyState   from '../../components/NoDataEmptyState';
import FilterBar        from '../../components/finance/FilterBar';
import MonthPicker      from '../../components/finance/MonthPicker';
import { CATEGORY_COLORS } from '../../components/finance/expensecategorycolors';
import { useFinancialData }     from '../../lib/hooks/usefinancialdata';
import { useFinancialPeriod }   from '../../lib/financialperiodcontext';
import { useDashboardTheme }    from '../../lib/dashboardthemecontext';
import { buildExpenseQuery }    from '../../lib/financialengine/expense/buildexpensequery';
import { buildExpenseSnapshot } from '../../lib/financialengine/expense/buildexpensesnapshot';
import { calculateCategoryIntelligence } from '../../lib/financialengine/cashflow/analytics/calculatecategoryintelligence';
import { buildCashFlowTimeSeries }       from '../../lib/financialengine/cashflow/buildcashflowtimeseries';
import { groupTransactionsByDate }       from '../../lib/financialengine/cashflow/utils/grouptransactionsbydate';
import { CATEGORY_EMOJI }               from '../../lib/taxonomy-emojis';

/* ─── design tokens ─────────────────────────────────────── */
const T = {
  bg:          '#EDF0F7',
  surface:     '#FFFFFF',
  border:      '#E2E8F0',
  borderMed:   '#CBD5E1',
  text:        '#0F172A',
  textSec:     '#475569',
  textTer:     '#94A3B8',
  primary:     '#0a3fa8',
  green:       '#16A34A',
  red:         '#DC2626',
  shadow:      '0 2px 8px rgba(0,0,0,0.07)',
  radius:      '12px',
  radiusSm:    '6px',
};

const fmt  = (n: number) => '$' + Math.round(n).toLocaleString();
const fmtD = (n: number) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });


const EXPENSE_CATEGORIES = [
  'Housing','Bills & Utilities','Groceries','Dining & Restaurants',
  'Transportation','Shopping','Entertainment','Health & Wellness',
  'Travel','Financial','Family & Education','Miscellaneous',
];

/* ─── sunburst label ─────────────────────────────────────── */
/* ─── donut tooltip ──────────────────────────────────────── */
function SunburstTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: 'var(--t-surface)', border: `1px solid var(--t-border)`, borderRadius: T.radiusSm, padding: '10px 14px', boxShadow: 'var(--t-shadow-sm)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3 }}>{d.name}</div>
      {d.payload?.category && d.payload.category !== d.name && (
        <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{d.payload.category}</div>
      )}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-primary)' }}>{fmt(d.value)}</div>
      <div style={{ fontSize: 11, color: T.textTer, marginTop: 2 }}>{(d.payload.percent * 100).toFixed(1)}% of total</div>
    </div>
  );
}

/* ─── spend bar ──────────────────────────────────────────── */
function SpendBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 4, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden', marginTop: 5, width: '100%' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 100, transition: 'width 0.4s ease' }} />
    </div>
  );
}

/* ─── thin accent line (height 2, transparent-centre) ────── */
function ThinAccent({ isDark, radius }: { isDark: boolean; radius?: string }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
      borderRadius: radius,
      background: isDark
        ? 'linear-gradient(90deg, transparent, #2ED3C6, #0891B2, #2ED3C6, transparent)'
        : 'linear-gradient(90deg, transparent, #0a3fa8, #4da3ff, #0a3fa8, transparent)',
    }} />
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function ExpensesPage() {
  const { transactions, refresh } = useFinancialData();
  const { currentDate, currentPeriod, comparisonPeriod, periodType, setPeriodType, setCurrentDate } = useFinancialPeriod();

  const [overrides, setOverrides] = useState<Record<string, any>>({});

  function handleTransactionUpdated(updated: any) {
    setOverrides(prev => ({ ...prev, [updated.id]: updated }));
  }

  const effectiveTransactions = useMemo(
    () => transactions.map(t => overrides[t.id] ? { ...t, ...overrides[t.id] } : t),
    [transactions, overrides]
  );

  const [categoryFilter,  setCategoryFilter]  = useState('all');
  const [keywordFilter,   setKeywordFilter]   = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showPending,     setShowPending]     = useState(true);

  /* ── filtered transactions ── */
  const filteredTransactions = useMemo(() => {
    let rows = buildExpenseQuery(effectiveTransactions, { period: currentPeriod, category: categoryFilter, keyword: keywordFilter });
    if (!showPending) rows = rows.filter(t => !t.pending);
    return rows;
  }, [effectiveTransactions, currentPeriod, categoryFilter, keywordFilter, showPending]);

  const priorTransactions = useMemo(() =>
    comparisonPeriod ? buildExpenseQuery(effectiveTransactions, { period: comparisonPeriod }) : [],
    [effectiveTransactions, comparisonPeriod]);

  const ytdTransactions = useMemo(() =>
    buildExpenseQuery(effectiveTransactions, { period: { startDate: startOfYear(currentDate), endDate: currentPeriod.endDate } }),
    [effectiveTransactions, currentDate, currentPeriod]);

  /* ── snapshot + intelligence ── */
  const snapshot            = useMemo(() => buildExpenseSnapshot(filteredTransactions), [filteredTransactions]);
  const categoryIntelligence = useMemo(() =>
    calculateCategoryIntelligence(filteredTransactions, priorTransactions, ytdTransactions),
    [filteredTransactions, priorTransactions, ytdTransactions]);

  /* ── total spend for % bars ── */
  const totalCurrentSpend = useMemo(() =>
    categoryIntelligence.reduce((s, c) => s + c.currentSpend, 0), [categoryIntelligence]);

  /* ── subcategory drill-down data ── */
  const subcategoryByCategory = useMemo(() => {
    const result: Record<string, { subcategory: string; amount: number; count: number; ytd: number }[]> = {};
    const ytdMap: Record<string, Record<string, number>> = {};

    filteredTransactions
      .filter(t => t.transaction_type === 'Expense')
      .forEach(t => {
        const cat = String(t.category);
        const sub = (t.subcategory && t.subcategory !== t.category) ? String(t.subcategory) : 'Other';
        if (!result[cat]) result[cat] = [];
        const ex = result[cat].find(s => s.subcategory === sub);
        const amt = Math.abs(t.amount);
        if (ex) { ex.amount += amt; ex.count++; }
        else result[cat].push({ subcategory: sub, amount: amt, count: 1, ytd: 0 });
      });

    ytdTransactions
      .filter(t => t.transaction_type === 'Expense')
      .forEach(t => {
        const cat = String(t.category);
        const sub = (t.subcategory && t.subcategory !== t.category) ? String(t.subcategory) : 'Other';
        if (!ytdMap[cat]) ytdMap[cat] = {};
        ytdMap[cat][sub] = (ytdMap[cat][sub] ?? 0) + Math.abs(t.amount);
      });

    Object.entries(result).forEach(([cat, subs]) => {
      subs.forEach(s => { s.ytd = ytdMap[cat]?.[s.subcategory] ?? 0; });
      subs.sort((a, b) => b.amount - a.amount);
    });

    return result;
  }, [filteredTransactions, ytdTransactions]);

  /* ── sunburst data: inner = categories, outer = subcategories ── */
  const sunburstInner = useMemo(() =>
    categoryIntelligence
      .filter(c => c.currentSpend > 0)
      .map(c => ({ name: c.category, value: c.currentSpend, color: c.color, percent: totalCurrentSpend > 0 ? c.currentSpend / totalCurrentSpend : 0 })),
    [categoryIntelligence, totalCurrentSpend]);

  /* ── top merchants ── */
  const topMerchants = useMemo(() => {
    const map: Record<string, { merchant: string; amount: number; count: number; category: string; color: string; logo?: string }> = {};
    filteredTransactions
      .filter(t => t.transaction_type === 'Expense')
      .forEach(t => {
        const key = t.merchant || 'Unknown';
        const color = CATEGORY_COLORS[String(t.category)] ?? '#64748b';
        if (!map[key]) map[key] = { merchant: key, amount: 0, count: 0, category: String(t.category), color, logo: t.logo };
        map[key].amount += Math.abs(t.amount);
        map[key].count  += 1;
      });
    return Object.values(map).sort((a, b) => b.amount - a.amount).slice(0, 8);
  }, [filteredTransactions]);
  const maxMerchantAmount = topMerchants[0]?.amount ?? 1;

  /* ── projected period spend ── */
  const projection = useMemo(() => {
    const start      = currentPeriod.startDate;
    const end        = currentPeriod.endDate;
    const today      = new Date();
    const periodDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
    const elapsed    = Math.max(1, Math.min(periodDays, Math.round((today.getTime() - start.getTime()) / 86_400_000) + 1));
    const dailyRate  = snapshot.analytics.totalExpenses / elapsed;
    const projected  = dailyRate * periodDays;
    const priorTotal = priorTransactions.filter(t => t.transaction_type === 'Expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    const delta      = projected - priorTotal;
    const pctComplete = (elapsed / periodDays) * 100;
    return { projected, dailyRate, delta, priorTotal, pctComplete, elapsed, periodDays };
  }, [snapshot, currentPeriod, priorTransactions]);

  /* ── 12-month bar chart — always monthly, always 12 periods ── */
  const monthlyTrend = useMemo(() => {
    const raw = buildCashFlowTimeSeries(effectiveTransactions, 'month', 12, currentDate);
    const avg = raw.length > 0 ? raw.reduce((s, d) => s + d.expenses, 0) / raw.length : 0;
    return { data: raw.map(d => ({ ...d, avg, aboveAvg: d.expenses > avg })), avg };
  }, [effectiveTransactions, currentDate]);

  /* ── grouped feed ── */
  const groupedTransactions = useMemo(() =>
    groupTransactionsByDate([...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())),
    [filteredTransactions]);

  /* ── toggle category expand ── */
  const toggleCategory = (cat: string) =>
    setExpandedCategory(prev => prev === cat ? null : cat);

  const { T: theme } = useDashboardTheme();
  const chartAccent = theme.isDark ? '#2ED3C6' : '#0a3fa8';

  // Override static T color props with dynamic theme values so all T.text* refs are dark-mode aware
  T.text    = theme.text;
  T.textSec = theme.muted;
  T.textTer = theme.muted;
  const sparkData = monthlyTrend.data.map(d => ({ label: d.period, expenses: d.expenses }));
  const priorTotal = priorTransactions.filter(t => t.transaction_type === 'Expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalDelta = snapshot.analytics.totalExpenses - priorTotal;
  const totalUp = totalDelta > 0;

  const HERO_BOXES = [
    {
      label: 'Recurring Bills',
      value: fmt(snapshot.recurringSpend),
      sub: `${totalCurrentSpend > 0 ? Math.round(snapshot.recurringSpend / totalCurrentSpend * 100) : 0}% of spend`,
      href: '/dashboard/recurring',
    },
    {
      label: 'Discretionary',
      value: fmt(snapshot.variableSpend),
      sub: `${totalCurrentSpend > 0 ? Math.round(snapshot.variableSpend / totalCurrentSpend * 100) : 0}% of spend`,
      href: null,
    },
    {
      label: 'Projected Spend',
      value: fmt(projection.projected),
      sub: projection.priorTotal > 0
        ? `${projection.delta > 0 ? '↑' : '↓'} ${fmt(Math.abs(projection.delta))} vs prior`
        : `${Math.round(projection.pctComplete)}% through period`,
      href: null,
    },
  ];

  return (
    <div style={{ color: theme.text }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: theme.text, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Expenses</h1>
        <div style={{ color: theme.muted, fontSize: 14 }}>Category intelligence, subcategory drill-down, and spending diagnostics.</div>
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '10px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
        <ThinAccent isDark={theme.isDark} radius={`${T.radius} ${T.radius} 0 0`} />
        <FilterBar options={['month','quarter','year'] as const} active={periodType} onChange={v => setPeriodType(v as any)} />
        <div style={{ width: 1, height: 22, background: 'var(--t-border)', flexShrink: 0 }} />
        <MonthPicker
          value={format(currentDate, 'yyyy-MM')}
          onChange={v => { const [y,m] = v.split('-').map(Number); setCurrentDate(new Date(y, m-1, 1)); }}
        />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: '#6B7280', colorScheme: theme.isDark ? 'dark' : 'light', fontWeight: 500, fontSize: 13, minWidth: 170, outline: 'none' }}>
          <option value="all">All Categories</option>
          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Search merchant, keyword…" value={keywordFilter} onChange={e => setKeywordFilter(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: theme.text, fontWeight: 500, fontSize: 13, minWidth: 230, outline: 'none', flex: 1 }}
        />
        <div style={{ width: 1, height: 22, background: 'var(--t-border)', flexShrink: 0 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: T.textSec, cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}>
          <input type="checkbox" checked={showPending} onChange={() => setShowPending(!showPending)}
            style={{ accentColor: 'var(--t-primary)', width: 14, height: 14, cursor: 'pointer' }} />
          Pending
        </label>
      </div>

      {/* ── HERO CARD ── */}
      <div style={{
        background: theme.cardBg, borderRadius: 20, padding: '36px 44px',
        marginBottom: 24, position: 'relative', overflow: 'hidden',
        border: `1px solid ${theme.border}`,
        boxShadow: theme.isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.07)',
      }}>
        <ThinAccent isDark={theme.isDark} />
        {/* background grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(77,163,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(77,163,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 50% 0%, black 40%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 80% 100% at 50% 0%, black 40%, transparent 100%)',
        }} />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32 }}>

          {/* LEFT — total expenses */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              Total Expenses · {format(currentDate, 'MMMM yyyy')}
            </div>
            <div style={{
              fontSize: 60, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em',
              backgroundImage: theme.isDark
                ? `linear-gradient(135deg, ${theme.text} 0%, #2ED3C6 100%)`
                : `linear-gradient(135deg, ${theme.text} 0%, #0a3fa8 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              marginBottom: 16, fontFamily: 'var(--font-display)',
            }}>
              {fmt(snapshot.analytics.totalExpenses)}
            </div>

            {/* delta badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: totalUp ? 'rgba(255,90,90,0.12)' : 'rgba(52,211,153,0.12)',
                border: `1px solid ${totalUp ? 'rgba(255,90,90,0.3)' : 'rgba(52,211,153,0.3)'}`,
                borderRadius: 100, padding: '6px 14px', fontSize: 14, fontWeight: 700,
                color: totalUp ? '#F87171' : '#34D399',
              }}>
                {totalUp ? '▲' : '▼'} {totalDelta < 0 ? '-' : '+'}${Math.abs(Math.round(totalDelta)).toLocaleString()}
              </div>
              <span style={{ color: theme.muted, fontSize: 13 }}>vs prior {periodType}</span>
            </div>
          </div>

          {/* RIGHT — 3 metric boxes */}
          <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap', alignSelf: 'center' }}>
            {HERO_BOXES.map((box, i) => {
              const inner = (
                <div style={{
                  textAlign: 'right', padding: '0 28px',
                  borderLeft: i > 0 ? `1px solid ${theme.border}` : 'none',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {box.label}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: theme.text }}>
                    {box.value}
                  </div>
                  <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>{box.sub}</div>
                </div>
              );
              return box.href ? (
                <Link key={box.label} href={box.href} style={{ textDecoration: 'none' }}>{inner}</Link>
              ) : (
                <div key={box.label}>{inner}</div>
              );
            })}
          </div>
        </div>

        {/* mini sparkline */}
        {sparkData.length > 1 && (
          <div style={{ marginTop: 28, height: 56, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="expSparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartAccent} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={chartAccent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="expenses" stroke={chartAccent} strokeWidth={2} fill="url(#expSparkGrad)" dot={false} isAnimationActive={false} />
                <XAxis hide dataKey="label" />
                <YAxis hide domain={['auto', 'auto']} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {sparkData.map((d: any, i: number) => (
                <span key={i} style={{ fontSize: 10, color: theme.muted, fontWeight: 600 }}>{d.label}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 12-MONTH BAR CHART ── */}
      <div style={{ marginBottom: 24, background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', overflow: 'hidden', position: 'relative' }}>
        <ThinAccent isDark={theme.isDark} />
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px 14px', borderBottom: `1px solid var(--t-border)` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Monthly Spending — 12 Months</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>
              Red bars are above your {fmt(monthlyTrend.avg)}/mo average
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--t-red)' }} />
              <span style={{ fontSize: 11, color: T.textSec }}>Above average</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#0a3fa8' }} />
              <span style={{ fontSize: 11, color: T.textSec }}>Below average</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 18, height: 2, background: 'var(--t-primary)', borderRadius: 1 }} />
              <span style={{ fontSize: 11, color: T.textSec }}>Average</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ height: 260, padding: '16px 16px 8px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend.data} barCategoryGap="28%" margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={'var(--t-border)'} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: T.textSec }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} tickLine={false} axisLine={false} width={60}
                tickFormatter={v => '$' + (v >= 1000 ? Math.round(v / 1000) + 'k' : v)} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0];
                  const above = d.payload?.aboveAvg;
                  return (
                    <div style={{ background: 'var(--t-surface)', border: `1px solid var(--t-border)`, borderRadius: 8, padding: '10px 14px', boxShadow: 'var(--t-shadow-sm)' }}>
                      <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: above ? 'var(--t-red)' : T.text, fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(Number(d.value))}
                      </div>
                      <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>
                        {above ? '↑' : '↓'} {fmt(Math.abs(Number(d.value) - monthlyTrend.avg))} vs avg
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={monthlyTrend.avg} stroke={'var(--t-primary)'} strokeDasharray="5 4" strokeWidth={1.5} />
              <Bar dataKey="expenses" radius={[4, 4, 0, 0]}>
                {monthlyTrend.data.map((entry, i) => (
                  <Cell key={i} fill={entry.aboveAvg ? 'var(--t-red)' : '#0a3fa8'} opacity={entry.aboveAvg ? 0.85 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── CATEGORY TABLE — full width ── */}
      <div id="category-table" style={{ marginBottom: 24 }}>
        <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', overflow: 'hidden', position: 'relative' }}>
          <ThinAccent isDark={theme.isDark} />
          <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid var(--t-border)` }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Spending by Category</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>Click any row to expand subcategories</div>
          </div>

          {/* Table head */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 130px 120px', gap: 0, padding: '10px 22px', borderBottom: `1px solid var(--t-border)`, background: 'var(--t-bg)' }}>
            {['Category', 'Txns', 'Period Spend', 'vs Prior'].map((h, i) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i > 0 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {categoryIntelligence
            .filter(c => c.currentSpend > 0 || c.priorSpend > 0)
            .map((cat) => {
              const pct     = totalCurrentSpend > 0 ? (cat.currentSpend / totalCurrentSpend) * 100 : 0;
              const isOpen  = expandedCategory === cat.category;
              const up      = cat.changeAmount > 0;
              const dn      = cat.changeAmount < 0;
              const chgClr  = up ? 'var(--t-red)' : dn ? 'var(--t-green)' : T.textSec;
              const subs    = subcategoryByCategory[cat.category] ?? [];

              return (
                <div key={cat.category} style={{ borderBottom: `1px solid var(--t-border)` }}>
                  {/* Main row */}
                  <div
                    onClick={() => toggleCategory(cat.category)}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 52px 130px 120px',
                      padding: '12px 22px', cursor: 'pointer',
                      background: isOpen ? (theme.isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC') : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = theme.isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC'; }}
                    onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {/* Category name */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{CATEGORY_EMOJI[cat.category] ?? '📋'}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cat.category}
                        </div>
                        <SpendBar pct={pct} color={cat.color} />
                      </div>
                      <svg width={14} height={14} viewBox="0 0 20 20" fill="none" stroke={T.textSec} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                        <path d="M5 8l5 5 5-5" />
                      </svg>
                    </div>

                    {/* Txns */}
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, textAlign: 'right', alignSelf: 'center' }}>
                      {cat.transactionCount}
                    </div>

                    {/* MTD spend + % */}
                    <div style={{ textAlign: 'right', alignSelf: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontVariantNumeric: 'tabular-nums' }}>{fmt(cat.currentSpend)}</div>
                      <div style={{ fontSize: 11, color: T.textTer, marginTop: 1 }}>{pct.toFixed(1)}% of total</div>
                    </div>

                    {/* Change */}
                    <div style={{ textAlign: 'right', alignSelf: 'center' }}>
                      {cat.changeAmount !== 0 ? (
                        <>
                          <div style={{ fontSize: 13, fontWeight: 700, color: chgClr, fontVariantNumeric: 'tabular-nums' }}>
                            {up ? '↑' : '↓'} {fmt(Math.abs(cat.changeAmount))}
                          </div>
                          <div style={{ fontSize: 11, color: chgClr, marginTop: 1 }}>
                            {Math.abs(cat.percentChange).toFixed(1)}%
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 12, color: T.textTer }}>→ No change</div>
                      )}
                    </div>
                  </div>

                  {/* Subcategory drawer */}
                  {isOpen && (
                    <div style={{ background: 'var(--t-bg)', borderTop: `1px solid var(--t-border)`, padding: '4px 22px 12px 44px' }}>
                      {/* YTD callout */}
                      <div style={{ display: 'flex', gap: 20, padding: '8px 0 10px', borderBottom: `1px dashed var(--t-border)`, marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.textSec, letterSpacing: '0.06em', textTransform: 'uppercase' }}>YTD Spend</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(cat.ytdSpend)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.textSec, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Prior Period</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.textSec, fontVariantNumeric: 'tabular-nums' }}>{fmt(cat.priorSpend)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.textSec, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Avg Transaction</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.textSec, fontVariantNumeric: 'tabular-nums' }}>
                            {cat.transactionCount > 0 ? fmt(cat.currentSpend / cat.transactionCount) : '—'}
                          </div>
                        </div>
                      </div>

                      {/* Subcategory rows */}
                      {subs.length === 0 ? (
                        <div style={{ fontSize: 12, color: T.textTer, padding: '6px 0' }}>No subcategory data available.</div>
                      ) : subs.map(s => {
                        const sPct = cat.currentSpend > 0 ? (s.amount / cat.currentSpend) * 100 : 0;
                        return (
                          <div key={s.subcategory} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: `1px solid var(--t-border)` }}>
                            {/* Sub name + bar */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>{s.subcategory}</span>
                                <span style={{ fontSize: 11, color: T.textTer }}>{s.count} txn{s.count !== 1 ? 's' : ''}</span>
                              </div>
                              <div style={{ height: 3, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${sPct}%`, background: cat.color, opacity: 0.65, borderRadius: 100 }} />
                              </div>
                            </div>
                            {/* Amount */}
                            <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontVariantNumeric: 'tabular-nums' }}>{fmt(s.amount)}</div>
                              <div style={{ fontSize: 10, color: T.textTer }}>{sPct.toFixed(0)}%</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

          {/* Footer total */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 130px 120px', padding: '14px 22px', background: 'var(--t-bg)', borderTop: `2px solid var(--t-border-med)` }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>TOTAL</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.text, textAlign: 'right' }}>
              {categoryIntelligence.reduce((s, c) => s + c.transactionCount, 0)}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(totalCurrentSpend)}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
              color: categoryIntelligence.reduce((s, c) => s + c.changeAmount, 0) > 0 ? 'var(--t-red)' : 'var(--t-green)' }}>
              {(() => { const d = categoryIntelligence.reduce((s, c) => s + c.changeAmount, 0); return `${d > 0 ? '↑' : '↓'} ${fmt(Math.abs(d))}`; })()}
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW: DONUT + BUDGET CARD ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 20, marginBottom: 24, alignItems: 'stretch' }}>

        {/* DONUT */}
        <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <ThinAccent isDark={theme.isDark} />
          <div style={{ padding: '16px 22px 0' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Spend Breakdown</div>
          </div>
          <div style={{ height: 260, padding: '4px 0 0', position: 'relative' }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Tooltip content={<SunburstTooltip />} />
                <Pie data={sunburstInner} dataKey="value" cx="50%" cy="50%"
                  innerRadius="38%" outerRadius="65%"
                  labelLine={false}
                  strokeWidth={2} stroke={'var(--t-bg)'}
                >
                  {sunburstInner.map(entry => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* centre label */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center', pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textTer, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Total Spend</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                {fmt(snapshot.analytics.totalExpenses)}
              </div>
            </div>
          </div>
          <div style={{ padding: '0 20px 18px', display: 'flex', flexWrap: 'wrap', gap: '8px 14px' }}>
            {sunburstInner.map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: T.textTer }}>{fmt(c.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BUDGET PLANNER CARD */}
        <div style={{
          background: theme.cardBg, borderRadius: T.radius,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.isDark ? '0 4px 24px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.07)',
          position: 'relative', overflow: 'hidden',
          padding: '28px 32px',
          display: 'flex', flexDirection: 'column',
        }}>
          <ThinAccent isDark={theme.isDark} />
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.muted, marginBottom: 6 }}>Planning</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.text, marginBottom: 20 }}>Budget Planner</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: theme.isDark ? 'rgba(46,211,198,0.12)' : 'rgba(77,163,255,0.10)',
                border: theme.isDark ? '1px solid rgba(46,211,198,0.25)' : '1px solid rgba(77,163,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width={18} height={18} viewBox="0 0 20 20" fill="none" stroke={theme.isDark ? '#2ED3C6' : '#0a3fa8'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="16" height="14" rx="2" />
                  <path d="M6 7h8M6 10h5M6 13h3" />
                </svg>
              </div>
              <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>
                Set spending targets by category, track actuals vs budget, and get alerted before you overspend.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {categoryIntelligence.filter(c => c.currentSpend > 0).slice(0, 5).map(c => (
                <div key={c.category} style={{
                  padding: '8px 12px', borderRadius: 10,
                  background: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${c.color}35`,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: 13 }}>{CATEGORY_EMOJI[c.category] ?? '📦'}</span>
                  <div>
                    <div style={{ fontSize: 10, color: theme.muted }}>{c.category}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{fmt(c.currentSpend)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              padding: '14px 16px', borderRadius: 12,
              background: theme.isDark ? 'rgba(46,211,198,0.06)' : 'rgba(77,163,255,0.07)',
              border: theme.isDark ? '1px solid rgba(46,211,198,0.18)' : '1px solid rgba(77,163,255,0.20)',
            }}>
              <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.6 }}>
                You've spent{' '}
                <span style={{ color: theme.text, fontWeight: 700 }}>{fmt(snapshot.analytics.totalExpenses)}</span>{' '}
                across{' '}
                <span style={{ color: theme.isDark ? '#2ED3C6' : '#0a3fa8', fontWeight: 700 }}>{categoryIntelligence.filter(c => c.currentSpend > 0).length} categories</span>{' '}
                this period. Set targets for each and see exactly where you stand before you overspend.
              </div>
            </div>
            <Link href="/dashboard/budget" style={{
              marginTop: 'auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 0',
              borderRadius: 12,
              background: theme.isDark
                ? 'linear-gradient(135deg, #0a3fa8, #0891B2 60%, #2ED3C6)'
                : 'linear-gradient(135deg, #0a3fa8, #4da3ff 60%, #0891B2)',
              color: '#fff',
              fontSize: 13, fontWeight: 700,
              textDecoration: 'none',
              letterSpacing: '0.03em',
              boxShadow: theme.isDark ? '0 4px 20px rgba(46,211,198,0.2)' : '0 4px 20px rgba(10,63,168,0.2)',
            }}>
              Open Budget Planner
              <svg width={14} height={14} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10h12M12 5l5 5-5 5" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ── TOP MERCHANTS — full width ── */}
      <div style={{ marginBottom: 24, background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', overflow: 'hidden', position: 'relative' }}>
        <ThinAccent isDark={theme.isDark} />
        <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid var(--t-border)` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Top Merchants</div>
          <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>Ranked by spend this period</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {topMerchants.map((m, i) => {
            const barW = (m.amount / maxMerchantAmount) * 100;
            return (
              <div key={m.merchant} style={{
                padding: '14px 18px',
                borderRight: i % 4 !== 3 ? `1px solid var(--t-border)` : 'none',
                borderBottom: i < topMerchants.length - 4 ? `1px solid var(--t-border)` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--t-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {m.logo
                      ? <img src={m.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 14 }}>💳</span>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.merchant}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 2, background: m.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: T.textSec }}>{m.category}</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: T.text, fontVariantNumeric: 'tabular-nums', marginBottom: 6 }}>
                  {fmt(m.amount)}
                </div>
                <div style={{ height: 3, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{ height: '100%', width: `${barW}%`, background: m.color, borderRadius: 100 }} />
                </div>
                <div style={{ fontSize: 11, color: T.textTer }}>{m.count} transaction{m.count !== 1 ? 's' : ''}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TRANSACTION FEED ── */}
      <div id="expense-feed" style={{ position: 'relative' }}>
        <FinanceCard title="Transaction Feed">
          {transactions.length === 0 ? (
            <NoDataEmptyState
              title="No transactions yet"
              subtitle="Connect a bank account to import your spending history, or add your assets and liabilities manually."
              onPlaidSuccess={refresh}
            />
          ) : (
            <TransactionFeed groupedTransactions={groupedTransactions} onTransactionUpdated={handleTransactionUpdated} />
          )}
        </FinanceCard>
      </div>
    </div>
  );
}
