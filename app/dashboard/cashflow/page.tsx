'use client';

import React, {
  useMemo,
  useState,
} from 'react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Line,
  ComposedChart,
  ReferenceLine,
  Label,
} from 'recharts';

import { startOfYear } from 'date-fns';
import { format } from 'date-fns';

import {
  buildCashFlowTimeSeries,
} from '../../lib/financialengine/cashflow/buildcashflowtimeseries';

import {
  groupTransactionsByDate,
} from '../../lib/financialengine/cashflow/utils/grouptransactionsbydate';

import {
  getIncomeTransactions,
} from '../../lib/financialengine/selectors/getincometransactions';

import {
  getExpenseTransactions,
} from '../../lib/financialengine/selectors/getexpensetransactions';

import {
  getTransactionsByCategory,
} from '../../lib/financialengine/selectors/gettransactionsbycategory';

import {
  getTransactionsByMerchant,
} from '../../lib/financialengine/selectors/gettransactionsbymerchant';

import { useFinancialData } from '../../lib/hooks/usefinancialdata';
import { useFinancialPeriod } from '../../lib/financialperiodcontext';
import {CATEGORY_COLORS} from '../../components/finance/expensecategorycolors';
import FilterBar from '../../components/finance/FilterBar';
import MonthPicker from '../../components/finance/MonthPicker';
import { parseFinancialDate } from '../../lib/financialengine/time/parsefinancialdate';
import SummaryCard from '../../components/SummaryCard';
import TransactionFeed  from '../../components/finance/TransactionFeed';
import NoDataEmptyState from '../../components/NoDataEmptyState';
import { useDashboardTheme } from '../../lib/dashboardthemecontext';
import { isInflow } from '../../lib/financialengine/cashflow/utils/transactiondirection';
import { DEBT_PAYMENT_CATEGORIES } from '../../lib/financialengine/cashflow/calculatecashflow';

function AccentLine({ isDark }: { isDark: boolean }) {
  const grad = isDark
    ? 'linear-gradient(90deg, #2ED3C6, #0891B2)'
    : 'linear-gradient(90deg, #0a3fa8, #4da3ff 60%, #0891B2)';
  return <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: grad }} />;
}

export default function CashFlowPage() {
  const {
    transactions,
    refresh,
  } = useFinancialData();

  // -----------------------------------
  // STATE
  // -----------------------------------
  const [viewMode, setViewMode] =
    useState<
      'all' |
      'income' |
      'expenses' |
      'transfers'
    >('all');

  const [searchTerm, setSearchTerm] =
    useState('');

  const [selectedCategory, setSelectedCategory] =
    useState('all');

  const [selectedMerchant, setSelectedMerchant] =
    useState('all');

  const [showPending, setShowPending] =
    useState(true);

      // -----------------------------------
  // Period FILTER
  // -----------------------------------

const {
  currentPeriod,
  currentDate,
  periodType,
  setPeriodType,
  setCurrentDate,
} = useFinancialPeriod();

const filteredTransactions = useMemo(() => {
  let filtered = [...transactions];

  // 1. PERIOD FILTER (PRIMARY SOURCE OF TRUTH)
  filtered = filtered.filter((t) => {
    const d = parseFinancialDate(t.date);
    return (
      d >= currentPeriod.startDate &&
      d <= currentPeriod.endDate
    );
  });

  // 2. VIEW MODE
  if (viewMode === 'income') {
    filtered = getIncomeTransactions(filtered);
  }

  if (viewMode === 'expenses') {
    filtered = getExpenseTransactions(filtered);
  }

  if (viewMode === 'transfers') {
    filtered = filtered.filter(
      (t) => t.transaction_type === 'Transfer'
    );
  }

  // 3. SEARCH
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();

    filtered = filtered.filter(
      (t) =>
        t.merchant?.toLowerCase().includes(term) ||
        t.category?.toLowerCase().includes(term) ||
        t.accountName?.toLowerCase().includes(term)
    );
  }

  // 4. CATEGORY
  if (selectedCategory !== 'all') {
    filtered = getTransactionsByCategory(
      filtered,
      selectedCategory
    );
  }

  // 5. MERCHANT
  if (selectedMerchant !== 'all') {
    filtered = getTransactionsByMerchant(
      filtered,
      selectedMerchant
    );
  }

  // 6. PENDING FILTER
  if (!showPending) {
    filtered = filtered.filter((t) => !t.pending);
  }

  return filtered;
}, [
  transactions,
  currentPeriod,
  viewMode,
  searchTerm,
  selectedCategory,
  selectedMerchant,
  showPending,
]);
  // -----------------------------------
  // FILTERED TRANSACTIONS
  // -----------------------------------



const priorPeriodTransactions = useMemo(() => {
  const periodLength =
    currentPeriod.endDate.getTime() -
    currentPeriod.startDate.getTime();

  const priorStart = new Date(
    currentPeriod.startDate.getTime() - periodLength
  );

  const priorEnd = new Date(
    currentPeriod.startDate.getTime()
  );

  return transactions.filter((t) => {
    const d = parseFinancialDate(t.date);

    return d >= priorStart && d < priorEnd;
  });
}, [transactions, currentPeriod]);

  // -----------------------------------
  // KPI ENGINE
  // -----------------------------------
const periodIncome = useMemo(() =>
  filteredTransactions
    .filter(t => t.transaction_type === 'Income' && !t.is_refund)
    .reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    ),
[filteredTransactions]);

const periodExpenses = useMemo(() =>
  filteredTransactions
    .filter(t => t.transaction_type === 'Expense')
    .reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    ),
[filteredTransactions]);

const priorIncome = useMemo(() =>
  priorPeriodTransactions
    .filter(t => t.transaction_type === 'Income' && !t.is_refund)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0),
[priorPeriodTransactions]);

const priorExpenses = useMemo(() =>
  priorPeriodTransactions
    .filter(t => t.transaction_type === 'Expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0),
[priorPeriodTransactions]);

// Debt payments (credit card / loan payments) are categorized as Transfer by
// Plaid, but they're real cash leaving the account — unlike pure
// account-to-account transfers, which stay excluded from cash flow.
const periodDebtPayments = useMemo(() =>
  filteredTransactions
    .filter(t => t.transaction_type === 'Transfer' && DEBT_PAYMENT_CATEGORIES.includes(t.category))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0),
[filteredTransactions]);

const priorDebtPayments = useMemo(() =>
  priorPeriodTransactions
    .filter(t => t.transaction_type === 'Transfer' && DEBT_PAYMENT_CATEGORIES.includes(t.category))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0),
[priorPeriodTransactions]);

// Transfers have no Income/Expense rows by definition, so the Income/Expense
// KPIs above are always $0 when viewMode is 'transfers' — compute real
// in/out totals from provider_subcategory direction for that view instead.
const periodTransfersIn = useMemo(() =>
  filteredTransactions
    .filter(t => t.transaction_type === 'Transfer' && isInflow(t))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0),
[filteredTransactions]);

const periodTransfersOut = useMemo(() =>
  filteredTransactions
    .filter(t => t.transaction_type === 'Transfer' && !isInflow(t))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0),
[filteredTransactions]);

const currentNetCashFlow = periodIncome - periodExpenses - periodDebtPayments;
const priorNetCashFlow = priorIncome - priorExpenses - priorDebtPayments;

const cashFlowDollarChange =
  currentNetCashFlow - priorNetCashFlow;

const cashFlowPctChange =
  priorNetCashFlow === 0
    ? 0
    : (cashFlowDollarChange / Math.abs(priorNetCashFlow)) * 100;
  // -----------------------------------
  // CHART DATA
  // -----------------------------------

  const trendTransactions = useMemo(() => {
  let filtered = [...transactions];

  if (!showPending) {
    filtered = filtered.filter((t) => !t.pending);
  }

  if (viewMode === 'income') {
    filtered = getIncomeTransactions(filtered);
  }

  if (viewMode === 'expenses') {
    filtered = getExpenseTransactions(filtered);
  }

  if (viewMode === 'transfers') {
    filtered = filtered.filter(
      (t) => t.transaction_type === 'Transfer'
    );
  }

  return filtered;
}, [
  transactions,
  showPending,
  viewMode,
]);

const safePeriodType = (['month', 'quarter', 'year'] as const).includes(periodType as any)
  ? (periodType as 'month' | 'quarter' | 'year')
  : 'month';
const trendData =
  buildCashFlowTimeSeries(
    trendTransactions,
    safePeriodType,
    6,
    currentDate
  );

  // -----------------------------------
  // GROUPED FEED
  // -----------------------------------
const sortedTransactions = useMemo(() => {
  return [...filteredTransactions].sort(
    (a, b) =>
      parseFinancialDate(b.date).getTime() -
      parseFinancialDate(a.date).getTime()
  );
}, [filteredTransactions]);

const groupedTransactions =
  groupTransactionsByDate(
    sortedTransactions
  );

    const categoryAnalytics = useMemo(() => {
  const map = new Map<string, number>();

  filteredTransactions
  .filter((t) => t.transaction_type === 'Expense')
  .forEach((t) => {
    const category = t.category || 'Uncategorized';
    map.set(category, (map.get(category) || 0) + Math.abs(t.amount));
  });

  return Array.from(map.entries()).map(([category, total]) => ({
    category,
    total,
  }));
}, [filteredTransactions]);

  // -----------------------------------
  // FILTER OPTIONS
  // -----------------------------------
  const categories =
    Array.from(
      new Set(
        transactions.map(
          (transaction) =>
            transaction.category
        )
      )
    );

  const merchants =
    Array.from(
      new Set(
        transactions.map(
          (transaction) =>
            transaction.merchant
        )
      )
    );

  /* -----------------------------------
     RENDER
  ----------------------------------- */

  const { T } = useDashboardTheme();
  const C = {
    gold:   T.gold,
    text:   T.text,
    muted:  T.muted,
    border: T.border,
    bg2:    T.cardBg2,
    bg3:    T.cardBg3,
  };

  const monthPickerValue = format(currentDate, 'yyyy-MM');

   return (
      <div style={{ color: C.text, fontFamily: 'var(--font-body)' }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
            Cash Flow
          </h1>
          <p style={{ color: C.muted, margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            Income, expenses, and net cash flow — with month-over-month trends so you always know where your money is going.
          </p>
        </div>

      {/* ── FILTER ROW ── */}
      <div style={{
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: T.stripBg,
        border: `1px solid ${T.stripBorder}`,
        boxShadow: T.isDark ? '0 0 0 1px rgba(77,163,255,0.08), 0 4px 24px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
        borderRadius: 14,
        padding: '8px 12px',
        flexWrap: 'wrap',
        position: 'relative',
      }}>
        {/* own radius instead of parent overflow:hidden, so the MonthPicker dropdown isn't clipped */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          borderRadius: '14px 14px 0 0',
          background: T.isDark
            ? 'linear-gradient(90deg, transparent, #2ED3C6, #0891B2, #2ED3C6, transparent)'
            : 'linear-gradient(90deg, transparent, #0a3fa8, #4da3ff, #0a3fa8, transparent)',
        }} />
        <FilterBar
          options={['month', 'quarter', 'year'] as const}
          active={periodType}
          onChange={(value) => setPeriodType(value as typeof periodType)}
        />
        <div style={{ width: 1, height: 22, background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />
        <MonthPicker
          value={monthPickerValue}
          min={undefined}
          max={undefined}
          onChange={(v) => {
            const [y, m] = v.split('-').map(Number);
            setCurrentDate(new Date(y, m - 1, 1));
          }}
        />
        <div style={{ width: 1, height: 22, background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as any)}
          style={{ padding: '7px 10px', borderRadius: 9, border: '1px solid rgba(0,0,0,0.12)', background: viewMode !== 'all' ? '#0a3fa8' : 'transparent', color: viewMode !== 'all' ? '#ffffff' : '#6B7280', fontSize: 13, fontWeight: viewMode !== 'all' ? 700 : 500, cursor: 'pointer', outline: 'none', flexShrink: 0 }}
        >
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expenses">Expenses</option>
          <option value="transfers">Transfers</option>
        </select>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: 9, border: '1px solid rgba(0,0,0,0.12)', background: selectedCategory !== 'all' ? '#0a3fa8' : 'transparent', color: selectedCategory !== 'all' ? '#ffffff' : '#6B7280', fontSize: 13, fontWeight: selectedCategory !== 'all' ? 700 : 500, cursor: 'pointer', outline: 'none', flexShrink: 0 }}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <svg width={13} height={13} viewBox="0 0 20 20" fill="none" stroke="#9CA3AF" strokeWidth={1.8} strokeLinecap="round"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="9" cy="9" r="6"/><path d="M15 15l-3.5-3.5"/>
          </svg>
          <input
            type="text"
            placeholder="Search merchant or keyword…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: 9, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ width: 1, height: 22, background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: '#6B7280', cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}>
          <input type="checkbox" checked={showPending} onChange={() => setShowPending(!showPending)} style={{ accentColor: '#0a3fa8', width: 14, height: 14, cursor: 'pointer' }} />
          Pending
        </label>
      </div>

      {/* ── HERO CARD ── */}
      {(() => {
        const isTransfersView = viewMode === 'transfers';
        const netTransfers = periodTransfersIn - periodTransfersOut;
        const ncfUp = (isTransfersView ? netTransfers : currentNetCashFlow) >= 0;
        const trendUp = cashFlowDollarChange >= 0;
        const savingsRate = periodIncome > 0 ? (currentNetCashFlow / periodIncome) * 100 : 0;
        const incomeCount = filteredTransactions.filter(t => t.transaction_type === 'Income' && !t.is_refund).length;
        const expenseCount = filteredTransactions.filter(t => t.transaction_type === 'Expense').length;
        const transfersInCount = filteredTransactions.filter(t => t.transaction_type === 'Transfer' && isInflow(t)).length;
        const transfersOutCount = filteredTransactions.filter(t => t.transaction_type === 'Transfer' && !isInflow(t)).length;
        const chartAccent = T.isDark ? '#2ED3C6' : '#0a3fa8';
        // sparkline: use last 6 periods net cash flow (already includes debt payments)
        const sparkData = trendData.map((d: any) => ({ label: d.period, net: d.net }));
        return (
          <div style={{
            background: T.cardBg,
            borderRadius: 20,
            padding: '36px 44px',
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden',
            border: `1px solid ${C.border}`,
            boxShadow: T.isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.07)',
          }}>
            <AccentLine isDark={T.isDark} />

            {/* background grid */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: `linear-gradient(rgba(77,163,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(77,163,255,0.03) 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 50% 0%, black 40%, transparent 100%)',
              maskImage: 'radial-gradient(ellipse 80% 100% at 50% 0%, black 40%, transparent 100%)',
            }} />

            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32 }}>

              {/* LEFT — primary number */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {isTransfersView ? 'Net Transfers' : 'Net Cash Flow'} · {format(currentDate, 'MMMM yyyy')}
                </div>
                <div style={{
                  fontSize: 60,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  backgroundImage: `linear-gradient(135deg, ${C.text} 0%, ${chartAccent} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: 16,
                  fontFamily: 'var(--font-display)',
                }}>
                  {isTransfersView
                    ? `${netTransfers < 0 ? '-' : ''}$${Math.abs(Math.round(netTransfers)).toLocaleString()}`
                    : `${currentNetCashFlow < 0 ? '-' : ''}$${Math.abs(Math.round(currentNetCashFlow)).toLocaleString()}`}
                </div>

                {/* delta badge — not shown for Transfers (no prior-period comparison computed for transfer direction) */}
                {!isTransfersView && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: trendUp ? 'rgba(52,211,153,0.12)' : 'rgba(255,90,90,0.12)',
                      border: `1px solid ${trendUp ? 'rgba(52,211,153,0.3)' : 'rgba(255,90,90,0.3)'}`,
                      borderRadius: 100,
                      padding: '6px 14px',
                      fontSize: 14, fontWeight: 700,
                      color: trendUp ? '#34D399' : '#F87171',
                    }}>
                      {trendUp ? '▲' : '▼'} {cashFlowDollarChange < 0 ? '-' : '+'}${Math.abs(Math.round(cashFlowDollarChange)).toLocaleString()} ({cashFlowPctChange >= 0 ? '+' : ''}{cashFlowPctChange.toFixed(1)}%)
                    </div>
                    <span style={{ color: C.muted, fontSize: 13 }}>vs prior {periodType}</span>
                  </div>
                )}
              </div>

              {/* RIGHT — income / expenses / savings rate, or transfers in/out for Transfers view */}
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                {isTransfersView ? (
                  <>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Transfers In</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#34D399', letterSpacing: '-0.02em' }}>
                        ${Math.round(periodTransfersIn).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{transfersInCount} transfers</div>
                    </div>
                    <div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Transfers Out</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#F87171', letterSpacing: '-0.02em' }}>
                        ${Math.round(periodTransfersOut).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{transfersOutCount} transfers</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Monthly Income</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#34D399', letterSpacing: '-0.02em' }}>
                        ${Math.round(periodIncome).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{incomeCount} deposits</div>
                    </div>
                    <div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Monthly Expenses</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#F87171', letterSpacing: '-0.02em' }}>
                        ${Math.round(periodExpenses).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{expenseCount} transactions</div>
                    </div>
                    <div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Savings Rate</div>
                      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: savingsRate >= 0 ? '#34D399' : '#F87171' }}>
                        {savingsRate.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>of gross income</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* mini sparkline */}
            {sparkData.length > 1 && (
              <div style={{ marginTop: 28, height: 56, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="cfSparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chartAccent} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={chartAccent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="net" stroke={chartAccent} strokeWidth={2} fill="url(#cfSparkGrad)" dot={false} isAnimationActive={false} />
                    <XAxis hide dataKey="label" />
                    <YAxis hide domain={['auto', 'auto']} />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  {sparkData.map((d: any, i: number) => (
                    <span key={i} style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{d.label}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* CHART GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '1.5fr 1fr',
          gap: '30px',
          marginBottom: '36px',
        }}
      >
        {/* CASH FLOW TREND */}
        <div style={{ background: T.cardBg, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' }}>
          <AccentLine isDark={T.isDark} />

          {/* Chart header with period summary stats */}
          {(() => {
            const completed = trendData.filter((d: any) => !d.isCurrent);
            const avgIncome   = completed.length ? completed.reduce((s: number, d: any) => s + d.income, 0) / completed.length : 0;
            const avgExpenses = completed.length ? completed.reduce((s: number, d: any) => s + d.expenses, 0) / completed.length : 0;
            const avgNet      = avgIncome - avgExpenses;
            const positive    = avgNet >= 0;
            return (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, margin: '0 0 2px' }}>Income vs Expenses</h2>
                  <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Last {trendData.length} {periodType}s · current period in progress</p>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  {[
                    { label: 'Avg Income',   value: avgIncome,   color: '#4ADE80' },
                    { label: 'Avg Expenses', value: avgExpenses, color: '#F87171' },
                    { label: 'Avg Net',      value: avgNet,      color: positive ? '#4ADE80' : '#F87171' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 1 }}>{s.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>
                        {positive || s.label !== 'Avg Net' ? '' : '-'}${Math.abs(Math.round(s.value)).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={trendData} barGap={3} barCategoryGap="18%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={(props: any) => {
                    const d = trendData[props.index];
                    return (
                      <text x={props.x} y={props.y + 12} textAnchor="middle" fill={d?.isCurrent ? '#0a3fa8' : C.muted} fontSize={12} fontWeight={d?.isCurrent ? 700 : 400}>
                        {props.payload.value}{d?.isCurrent ? ' *' : ''}
                      </text>
                    );
                  }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `$${Math.abs(Math.round(v / 1000))}k`}
                  tick={{ fill: C.muted, fontSize: 11 }}
                  axisLine={false} tickLine={false} width={48}
                />
                <Tooltip
                  contentStyle={{ background: T.tooltipBg, border: `1px solid ${T.tooltipBorder}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                  content={({ active, payload, label }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    const net = d.income - d.expenses;
                    const positive = net >= 0;
                    return (
                      <div style={{ background: T.tooltipBg, border: `1px solid ${T.tooltipBorder}`, borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
                        <div style={{ fontWeight: 700, color: C.text, marginBottom: 8 }}>{label}{d.isCurrent ? ' (in progress)' : ''}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                            <span style={{ color: C.muted }}>Income</span>
                            <span style={{ fontWeight: 600, color: '#4ADE80' }}>${d.income.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                            <span style={{ color: C.muted }}>Expenses</span>
                            <span style={{ fontWeight: 600, color: '#F87171' }}>${d.expenses.toLocaleString()}</span>
                          </div>
                          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 3, paddingTop: 5, display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                            <span style={{ color: C.muted }}>Net</span>
                            <span style={{ fontWeight: 700, color: positive ? '#4ADE80' : '#F87171' }}>
                              {positive ? '+' : '-'}${Math.abs(net).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                            <span style={{ color: C.muted }}>Savings rate</span>
                            <span style={{ fontWeight: 600, color: d.savingsRate >= 20 ? '#4ADE80' : d.savingsRate >= 10 ? C.gold : '#F87171' }}>
                              {d.savingsRate}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={0} stroke="rgba(0,0,0,0.15)" strokeWidth={1.5} />
                <Bar dataKey="income" name="Income" radius={[5, 5, 0, 0]}
                  shape={(props: any) => {
                    const isCurrent = trendData.find((d: any) => d.period === props.period)?.isCurrent;
                    return <rect x={props.x} y={props.y} width={props.width} height={props.height} fill="#4ADE80" fillOpacity={1} rx={5} ry={5} />;
                  }}
                />
                <Bar dataKey="expenses" name="Expenses" radius={[5, 5, 0, 0]}
                  shape={(props: any) => {
                    const isCurrent = trendData.find((d: any) => d.period === props.period)?.isCurrent;
                    return <rect x={props.x} y={props.y} width={props.width} height={props.height} fill="#F87171" fillOpacity={1} rx={5} ry={5} />;
                  }}
                />
                <Line type="monotone" dataKey="incomeVsExpenses" name="Income − Expenses" stroke="#0a3fa8" strokeWidth={2.5}
                  dot={(props: any) => {
                    const d = trendData[props.index];
                    if (!d) return <g key={props.key} />;
                    return <circle key={props.key} cx={props.cx} cy={props.cy} r={4} fill={d.isCurrent ? 'transparent' : '#0a3fa8'} stroke="#0a3fa8" strokeWidth={2} strokeDasharray={d.isCurrent ? '3 2' : '0'} />;
                  }}
                  strokeDasharray="0"
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                  formatter={(value) => <span style={{ color: C.muted }}>{value}</span>}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 11, color: C.muted }}>
            * Current period is in progress — figures will update as the month completes.
          </p>
        </div>

        {/* CATEGORY ANALYTICS */}
        <div style={{ background: T.cardBg, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' }}>
          <AccentLine isDark={T.isDark} />
          <h2 style={{ marginBottom: 20, color: C.text, fontSize: 15, fontWeight: 700, margin: '0 0 20px' }}>
            Spending Categories
          </h2>

          <div
            style={{
              width: '100%',
              height: '360px',
            }}
          >
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={
                    categoryAnalytics
                  }
                  dataKey="total"
                  nameKey="category"
                  innerRadius={97}
                  outerRadius={150}
                  paddingAngle={3}
                >
{categoryAnalytics.map((entry, index) => (
  <Cell
    key={`cell-${index}`}
    fill={
      CATEGORY_COLORS[
        entry.category as keyof typeof CATEGORY_COLORS
      ] ?? '#94A3B8'
    }
  />
))}
                  <Label
                    content={() => (
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                        <tspan x="50%" dy="-10" fontSize={13} fill={C.muted} fontWeight={500}>Total Spent</tspan>
                        <tspan x="50%" dy={26} fontSize={20} fill={C.text} fontWeight={700}>${Math.round(periodExpenses).toLocaleString()}</tspan>
                      </text>
                    )}
                    position="center"
                  />
                </Pie>

                <Tooltip
                  formatter={(
                    value: any
                  ) =>
                    `$${Number(
                      value
                    ).toLocaleString()}`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TRANSACTION FEED */}
      <div style={{
        background: T.cardBg, borderRadius: 16, padding: '20px 24px',
        border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden',
      }}>
        <AccentLine isDark={T.isDark} />
        <h2 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>
          Transactions
        </h2>
        {transactions.length === 0 ? (
          <NoDataEmptyState
            title="No transactions yet"
            subtitle="Connect a bank account to see your cash flow, or add assets and liabilities to track your net worth."
            onPlaidSuccess={refresh}
          />
        ) : (
          <TransactionFeed groupedTransactions={groupedTransactions} />
        )}
      </div>
    </div>
  );
}
