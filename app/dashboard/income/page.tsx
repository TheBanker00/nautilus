'use client';

import { useMemo, useState } from 'react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import { startOfYear } from 'date-fns';
import { format } from 'date-fns';

/* -----------------------------------
   FINAL CANONICAL DATA LAYER
----------------------------------- */

import { useFinancialData } from '../../lib/hooks/usefinancialdata';
import { useFinancialPeriod } from '../../lib/financialperiodcontext';

/* -----------------------------------
   ENGINE (ONLY VISUALIZATION HELPERS)
----------------------------------- */

import { buildCashFlowTimeSeries } from '../../lib/financialengine/cashflow/buildcashflowtimeseries';
import { parseFinancialDate } from '../../lib/financialengine/time/parsefinancialdate';

/* -----------------------------------
   UI COMPONENTS
----------------------------------- */

import SummaryCard from '../../components/SummaryCard';
import KPIGrid from '../../components/finance/KPIGrid';
import FinanceCard from '../../components/finance/FinanceCard';
import TransactionFeed from '../../components/finance/TransactionFeed';
import FilterBar from '../../components/finance/FilterBar';
import MonthPicker from '../../components/finance/MonthPicker';
import { useDashboardTheme } from '../../lib/dashboardthemecontext';

/* -----------------------------------
   COLORS
----------------------------------- */

import { INCOME_COLORS } from '../../components/finance/incomecatagorycolors';
import { ca } from 'date-fns/locale';

/* -----------------------------------
   HELPERS
----------------------------------- */

function groupTransactionsByDate(transactions: any[]) {
  return transactions.reduce((groups: Record<string, any[]>, transaction) => {
    const parsedDate = parseFinancialDate(transaction.date);
    const date = format(parsedDate, 'yyyy-MM-dd');

    if (!groups[date]) {
      groups[date] = [];
    }

    groups[date].push(transaction);

    return groups;
  }, {});
}

/* -----------------------------------
   COMPONENT
----------------------------------- */

export default function IncomePage() {
  /**
   * 🧠 FINAL CANONICAL INPUT
   * This is now fully enriched Transaction[]
   */
  const { transactions } = useFinancialData();

  const {
    currentPeriod,
    periodType,
    setPeriodType,
    currentDate,
    setCurrentDate,
  } = useFinancialPeriod();

  /* -----------------------------------
     FILTER STATE
  ----------------------------------- */

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [keywordFilter, setKeywordFilter] = useState('');

  /* -----------------------------------
     PERIOD AWARE INCOME FILTER
  ----------------------------------- */

const incomeTransactions = useMemo(() => {

  return transactions.filter((t) => {

    if (t.transaction_type !== 'Income' || t.is_refund) {
      return false;
    }

    const transactionDate =
      parseFinancialDate(t.date);

    if (
      transactionDate < currentPeriod.startDate ||
      transactionDate > currentPeriod.endDate
    ) {
      return false;
    }

    if (
      categoryFilter !== 'all' &&
      t.category !== categoryFilter
    ) {
      return false;
    }

    if (keywordFilter.trim()) {

      const keyword =
        keywordFilter.toLowerCase();

      return (
        t.merchant
          ?.toLowerCase()
          .includes(keyword) ||
        t.rawMerchant
          ?.toLowerCase()
          .includes(keyword) ||
        t.name
          ?.toLowerCase()
          .includes(keyword)
      );
    }

    return true;

  });


}, [
  transactions,
  currentPeriod,
  categoryFilter,
  keywordFilter,
]);



  /* -----------------------------------
     SNAPSHOT (DERIVED ONLY)
  ----------------------------------- */

  const snapshot = useMemo(() => {
    const categories: Record<string, number> = {};

    incomeTransactions.forEach((t) => {
      categories[t.category] =
        (categories[t.category] || 0) + Math.abs(t.amount);
    });

    return {
      categories: Object.keys(categories).map((category) => ({
        category,
      })),
    };
  }, [incomeTransactions]);

  /* -----------------------------------
     PRIOR PERIOD
  ----------------------------------- */

  const priorIncome = useMemo(() => {
    const start = currentPeriod.startDate;
    const end = currentPeriod.endDate;

    const duration = end.getTime() - start.getTime();

    const priorStart = new Date(start.getTime() - duration);
    const priorEnd = new Date(end.getTime() - duration);

    return transactions.filter((t) => {
      if (t.transaction_type !== 'Income' || t.is_refund) return false;

      const d = parseFinancialDate(t.date);
      return d >= priorStart && d <= priorEnd;
    });
  }, [transactions, currentPeriod]);

const priorMonthIncome = useMemo(() => {

  const currentMonth =
    currentDate.getMonth();

  const currentYear =
    currentDate.getFullYear();

  return transactions
    .filter((t) => {

      if (t.transaction_type !== 'Income' || t.is_refund) {
        return false;
      }

      const d =
        parseFinancialDate(t.date);

      const priorMonth =
        currentMonth === 0
          ? 11
          : currentMonth - 1;

      const priorYear =
        currentMonth === 0
          ? currentYear - 1
          : currentYear;

      return (
        d.getMonth() === priorMonth &&
        d.getFullYear() === priorYear
      );

    })
    .reduce(
      (sum, transaction) =>
        sum + Math.abs(transaction.amount),
      0
    );

}, [
  transactions,
  currentDate,
]);

const allIncomeTransactions = useMemo(() => {
  return transactions.filter(
    (t) => t.transaction_type === 'Income' && !t.is_refund
  );
}, [transactions]);

  /* -----------------------------------
     YTD
  ----------------------------------- */

  const ytdIncome = useMemo(() => {
    return transactions.filter((t) => {
      if (t.transaction_type !== 'Income' || t.is_refund) return false;

      const d = parseFinancialDate(t.date);
      return d >= startOfYear(currentDate) && d <= currentPeriod.endDate;
    });
  }, [transactions, currentDate, currentPeriod]);



  /* -----------------------------------
     KPI VALUES (PURE DERIVATION)
  ----------------------------------- */

const currentPeriodIncome = useMemo(
  () =>
    incomeTransactions.reduce(
      (sum, transaction) =>
        sum + Math.abs(transaction.amount),
      0
    ),
  [incomeTransactions]
);

  const ytdTotal = useMemo(
    () => ytdIncome.reduce((s, t) => s + Math.abs(t.amount), 0),
    [ytdIncome]
  );

  const priorYtdIncome = useMemo(() => {

  const currentYear =
    currentDate.getFullYear();

  const comparisonEnd =
    new Date(
      currentYear - 1,
      currentDate.getMonth(),
      currentDate.getDate()
    );

  return transactions
    .filter((t) => {

      if (t.transaction_type !== 'Income' || t.is_refund) {
        return false;
      }

      const d =
        parseFinancialDate(t.date);

      return (
        d >=
          new Date(
            currentYear - 1,
            0,
            1
          ) &&
        d <= comparisonEnd
      );

    })
    .reduce(
      (sum, transaction) =>
        sum + Math.abs(transaction.amount),
      0
    );

}, [
  transactions,
  currentDate,
]);

const priorPayrollIncome = useMemo(() => {

  const currentMonth =
    currentDate.getMonth();

  const currentYear =
    currentDate.getFullYear();

  const priorMonth =
    currentMonth === 0
      ? 11
      : currentMonth - 1;

  const priorYear =
    currentMonth === 0
      ? currentYear - 1
      : currentYear;

  return transactions
    .filter((transaction) => {

      if (
        transaction.transaction_type !== 'Income' ||
        transaction.is_refund
      ) {
        return false;
      }

      if (
        transaction.category !== 'Payroll'
      ) {
        return false;
      }

      const d =
        parseFinancialDate(
          transaction.date
        );

      return (
        d.getMonth() === priorMonth &&
        d.getFullYear() === priorYear
      );

    })
    .reduce(
      (sum, transaction) =>
        sum + Math.abs(transaction.amount),
      0
    );

}, [
  transactions,
  currentDate,
]);

const ytdVariance =
  priorYtdIncome === 0
    ? 0
    :
        (
          ytdTotal -
          priorYtdIncome
        )

const payrollIncome = useMemo(
  () =>
    incomeTransactions
      .filter(
        (t) => t.category === 'Payroll'
      )
      .reduce(
        (sum, transaction) =>
          sum + Math.abs(transaction.amount),
        0
      ),
  [incomeTransactions]
);

const nonPayrollIncome = useMemo(
  () =>
    incomeTransactions
      .filter(
        (t) => t.category !== 'Payroll'
      )
      .reduce(
        (sum, transaction) =>
          sum + Math.abs(transaction.amount),
        0
      ),
  [incomeTransactions]
);

const priorNonPayrollIncome = useMemo(
  () =>
    priorIncome
      .filter(
        (t) => t.category !== 'Payroll'
      )
      .reduce(
        (sum, transaction) =>
          sum + Math.abs(transaction.amount),
        0
      ),
  [priorIncome]
);



const mtdVariance =
  priorMonthIncome === 0
    ? 0
    :
        (
          currentPeriodIncome -
          priorMonthIncome
        )

const payrollVariance = useMemo(() => {

  if (priorPayrollIncome === 0) {
    return null;
  }

  return payrollIncome - priorPayrollIncome;

}, [payrollIncome, priorPayrollIncome]);


const nonPayrollVariance = useMemo(() => {

  if (priorNonPayrollIncome === 0) {
    return null;
  }

  return (
    (nonPayrollIncome -
      priorNonPayrollIncome)
  );

}, [
  nonPayrollIncome,
  priorNonPayrollIncome,
]);

  /* -----------------------------------
     CATEGORY MIX
  ----------------------------------- */

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};

    incomeTransactions.forEach((t) => {
      map[t.category] =
        (map[t.category] || 0) + Math.abs(t.amount);
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
    }));
  }, [incomeTransactions]);



  const INCOME_CATEGORIES = [
  'Payroll',
  'Business',
  'Investment',
  'Other',
];

  /* -----------------------------------
     TREND DATA (POST-NORMALIZATION ONLY)
  ----------------------------------- */

const trendData = useMemo(() => {
  return buildCashFlowTimeSeries(
    allIncomeTransactions,
      periodType === 'quarter'
        ? 'quarter'
        : periodType === 'year'
        ? 'year'
        : 'month',
      6,
      currentDate
    );
  }, [incomeTransactions, periodType, currentDate]);



  /* -----------------------------------
     GROUPED FEED
  ----------------------------------- */

  const groupedFeed = useMemo(() => {
    const sorted = [...incomeTransactions].sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return groupTransactionsByDate(sorted);
  }, [incomeTransactions]);

  /* -----------------------------------
     MTD BY INCOME CATEGORY
  ----------------------------------- */

  const mtdByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    incomeTransactions.forEach(t => {
      const cat = t.category || 'Other';
      map[cat] = (map[cat] || 0) + Math.abs(t.amount);
    });
    return map;
  }, [incomeTransactions]);

  /* -----------------------------------
     RENDER
  ----------------------------------- */

  const { T } = useDashboardTheme();
  const fmtDollars = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
  const fmtDelta   = (n: number) => `${n >= 0 ? '+' : '-'}${fmtDollars(Math.abs(n))}`;
  const chartAccent = T.isDark ? '#2ED3C6' : '#0a3fa8';

  const ytdUp = ytdVariance >= 0;
  const sparkData = trendData.map((d: any) => ({ label: d.period, income: d.income }));

  const SOURCE_BOXES = [
    { label: 'Payroll',    key: 'Payroll'    },
    { label: 'Business',   key: 'Business'   },
    { label: 'Investment', key: 'Investment' },
    { label: 'Other',      key: 'Other'      },
    { label: 'MTD Total',  key: '__total__'  },
  ];

  return (
    <div style={{ color: T.text, fontFamily: 'var(--font-body)' }}>
      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text, margin: '0 0 4px' }}>Income</h1>
        <p style={{ color: T.muted, margin: 0, fontSize: 14, lineHeight: 1.5 }}>
          Year-to-date income, monthly sources, and trend — so you always know where your income is coming from.
        </p>
      </div>

      {/* ── FILTER ROW ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--t-surface)', border: '1px solid var(--t-border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderRadius: 14,
        padding: '8px 12px', marginBottom: 20, flexWrap: 'wrap',
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
          onChange={(value) => setPeriodType(value as any)}
        />
        <div style={{ width: 1, height: 22, background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />
        <MonthPicker
          value={format(currentDate, 'yyyy-MM')}
          onChange={v => { const [y, m] = v.split('-').map(Number); setCurrentDate(new Date(y, m - 1, 1)); }}
        />
        <div style={{ width: 1, height: 22, background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: 9, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: '#6B7280', colorScheme: T.isDark ? 'dark' : 'light', fontWeight: 500, fontSize: 13, outline: 'none', flexShrink: 0 }}
        >
          <option value="all">All Categories</option>
          {INCOME_CATEGORIES.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <div style={{ width: 1, height: 22, background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />
        <input
          placeholder="Search keywords..."
          value={keywordFilter}
          onChange={(e) => setKeywordFilter(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: 9, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: T.text, fontWeight: 500, fontSize: 13, outline: 'none', minWidth: 200, flexShrink: 0 }}
        />
      </div>

      {/* ── HERO CARD ── */}
      <div style={{
        background: T.cardBg, borderRadius: 20, padding: '36px 44px',
        marginBottom: 24, position: 'relative', overflow: 'hidden',
        border: `1px solid ${T.border}`,
        boxShadow: T.isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.07)',
      }}>
        {/* accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: T.isDark
            ? 'linear-gradient(90deg, #2ED3C6, #0891B2)'
            : 'linear-gradient(90deg, #0a3fa8, #4da3ff 60%, #0891B2)',
        }} />

        {/* background grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(77,163,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(77,163,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 50% 0%, black 40%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 80% 100% at 50% 0%, black 40%, transparent 100%)',
        }} />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32 }}>

          {/* LEFT — YTD primary number */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              YTD Income · {currentDate.getFullYear()}
            </div>
            <div style={{
              fontSize: 60, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em',
              backgroundImage: `linear-gradient(135deg, ${T.text} 0%, ${chartAccent} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              marginBottom: 16, fontFamily: 'var(--font-display)',
            }}>
              {fmtDollars(ytdTotal)}
            </div>

            {/* YTD delta badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: ytdUp ? 'rgba(52,211,153,0.12)' : 'rgba(255,90,90,0.12)',
                border: `1px solid ${ytdUp ? 'rgba(52,211,153,0.3)' : 'rgba(255,90,90,0.3)'}`,
                borderRadius: 100, padding: '6px 14px', fontSize: 14, fontWeight: 700,
                color: ytdUp ? '#34D399' : '#F87171',
              }}>
                {ytdUp ? '▲' : '▼'} {fmtDelta(ytdVariance)}
              </div>
              <span style={{ color: T.muted, fontSize: 13 }}>vs prior year same period</span>
            </div>
          </div>

          {/* RIGHT — 5 source boxes */}
          <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
            {SOURCE_BOXES.map((src, i) => {
              const amount = src.key === '__total__' ? currentPeriodIncome : (mtdByCategory[src.key] ?? 0);
              const isTotal = src.key === '__total__';
              const isLast = i === SOURCE_BOXES.length - 1;
              return (
                <div key={src.key} style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div style={{
                    textAlign: 'right', padding: '0 24px',
                    borderLeft: i > 0 ? `1px solid ${T.border}` : 'none',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                      {src.label}
                    </div>
                    <div style={{
                      fontSize: isTotal ? 26 : 22, fontWeight: 700, letterSpacing: '-0.02em',
                      color: isTotal ? '#34D399' : T.text,
                    }}>
                      {fmtDollars(amount)}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                      {isTotal ? `${incomeTransactions.length} deposits` : (amount > 0 ? `${Math.round(amount / currentPeriodIncome * 100)}% of MTD` : '—')}
                    </div>
                  </div>
                </div>
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
                  <linearGradient id="incSparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartAccent} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={chartAccent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="income" stroke={chartAccent} strokeWidth={2} fill="url(#incSparkGrad)" dot={false} isAnimationActive={false} />
                <XAxis hide dataKey="label" />
                <YAxis hide domain={['auto', 'auto']} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {sparkData.map((d: any, i: number) => (
                <span key={i} style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>{d.label}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        <FinanceCard title="Income Trend">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#0a3fa8" stopOpacity={0.28} />
                  <stop offset="45%"  stopColor="#0a3fa8" stopOpacity={0.10} />
                  <stop offset="100%" stopColor="#0a3fa8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="incomeGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#0a3fa8" stopOpacity={0.10} />
                  <stop offset="100%" stopColor="#0a3fa8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fill: 'var(--t-text-tertiary)', fontSize: 11, fontWeight: 600 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${Math.round(v).toLocaleString('en-US')}`}
                tick={{ fill: 'var(--t-text-tertiary)', fontSize: 11 }}
                axisLine={false} tickLine={false}
                width={72}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)', borderRadius: 12, padding: '10px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 130 }}>
                      <div style={{ color: 'var(--t-text-tertiary)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--t-primary)', boxShadow: '0 0 6px rgba(10,63,168,0.5)' }} />
                        <span style={{ color: 'var(--t-text-primary)', fontSize: 15, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                          {fmtDollars(Number(payload[0].value))}
                        </span>
                      </div>
                    </div>
                  );
                }}
                cursor={{ stroke: '#0a3fa8', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.5 }}
              />
              {/* Glow bloom layer */}
              <Area type="natural" dataKey="income" stroke="#0a3fa8" strokeWidth={8} strokeOpacity={0.12} fill="url(#incomeGlow)" dot={false} isAnimationActive={false} />
              {/* Main line */}
              <Area
                type="natural"
                dataKey="income"
                name="Income"
                stroke="#0a3fa8"
                strokeWidth={2.5}
                fill="url(#incomeGrad)"
                dot={false}
                isAnimationActive
                activeDot={{ r: 5, fill: '#0a3fa8', stroke: '#ffffff', strokeWidth: 2.5, filter: 'drop-shadow(0 0 6px rgba(10,63,168,0.5))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </FinanceCard>

        <FinanceCard title="Income Mix">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name">
  {categoryData.map((entry) => (
    <Cell
      key={entry.name}
      fill={
        INCOME_COLORS[
          entry.name as keyof typeof INCOME_COLORS
        ]
      }
    />
  ))}
</Pie>
<Tooltip
  formatter={(value) =>
    `$${Math.round(Number(value)).toLocaleString('en-US')}`
  }
/>
            </PieChart>
          </ResponsiveContainer>
        </FinanceCard>
      </div>

      <div style={{ marginTop: 30 }} />
      <FinanceCard title="Recent Income">
        <TransactionFeed groupedTransactions={groupedFeed} />
      </FinanceCard>
    </div>
  );
}
