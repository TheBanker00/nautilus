'use client';

import React, { useMemo, useState } from 'react';
import { useFinancialData as useFlowData } from '../../lib/hooks/usefinancialdata';
import { useFinancialData as useWealthData } from '../../lib/financialdatacontext';
import { useUserProfile } from '../../lib/hooks/useuserprofile';
import { useDashboardTheme } from '../../lib/dashboardthemecontext';
import { getDALabel } from '../health/page';
import { calculateCategorySpending } from '../../lib/financialengine/cashflow/analytics/calculatecategoryspending';
import {
  buildAnnualCostRollup,
  detectSubscriptionOverlap,
  analyzeIncomeVariance,
  detectAnomalies,
} from '../../lib/financialengine/recurring/phase4insights';

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
  primaryBg:     'rgba(10,63,168,0.07)',
  primaryBorder: 'rgba(10,63,168,0.22)',
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

const DARK_T = {
  bg:            '#07111F',
  surface:       '#0D1C30',
  border:        'rgba(46,211,198,0.18)',
  borderMed:     'rgba(46,211,198,0.32)',
  shadow:        '0 2px 8px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)',
  shadowMd:      '0 4px 16px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.4)',
  textPrimary:   '#F0F4FF',
  textSecondary: '#C8D8EC',
  textTertiary:  '#7A90B8',
  primary:       '#4DA3FF',
  primaryBg:     'rgba(77,163,255,0.1)',
  primaryBorder: 'rgba(77,163,255,0.28)',
  green:         '#4ADE80',
  greenBg:       'rgba(74,222,128,0.1)',
  greenBorder:   'rgba(74,222,128,0.28)',
  greenText:     '#4ADE80',
  red:           '#F87171',
  redBg:         'rgba(248,113,113,0.1)',
  redBorder:     'rgba(248,113,113,0.28)',
  redText:       '#F87171',
  amber:         '#FCD34D',
  amberBg:       'rgba(252,211,77,0.1)',
  amberBorder:   'rgba(252,211,77,0.28)',
  amberText:     '#FCD34D',
  purple:        '#A78BFA',
  purpleBg:      'rgba(167,139,250,0.1)',
  purpleBorder:  'rgba(167,139,250,0.28)',
  purpleText:    '#A78BFA',
  teal:          '#2ED3C6',
  tealBg:        'rgba(46,211,198,0.1)',
  tealBorder:    'rgba(46,211,198,0.28)',
  tealText:      '#2ED3C6',
  radius:        '12px',
  radiusSm:      '6px',
  radiusMd:      '8px',
};

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type InsightSeverity = 'positive' | 'warning' | 'critical' | 'info';
type InsightCategory = 'spending' | 'income' | 'subscriptions' | 'anomalies' | 'savings' | 'debt' | 'forecast';

interface Insight {
  id:          string;
  category:    InsightCategory;
  severity:    InsightSeverity;
  title:       string;
  body:        string;
  action?:     string;
  actionHref?: string;
  value?:      string;
  engine:      string; // which engine produced this
}

/* ─────────────────────────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────────────────────────── */
const fmt  = (n: number) => '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtD = (n: number) => '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct  = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

/* ─────────────────────────────────────────────────────────────
   INSIGHT ENGINE — pure rule-based analysis
   All logic lives here. When Claude is added later, this
   function's output can become the "context" sent to the API.
───────────────────────────────────────────────────────────── */
function generateInsights(
  transactions: any[],
  recurringTransactions: any[],
  incomeAnalytics: any,
  expenseAnalytics: any,
  netWorth: number,
  totalAssets: number,
  totalLiabilities: number,
  age: number,
): Insight[] {
  const insights: Insight[] = [];

  if (!transactions.length) return insights;

  /* ── CATEGORY SPENDING ── */
  const categorySpending = calculateCategorySpending(transactions, 10);
  const totalSpend       = categorySpending.reduce((s, c) => s + c.total, 0);

  // Top spending category
  if (categorySpending[0]) {
    const top = categorySpending[0];
    const isHigh = top.percentOfTotal > 35;
    insights.push({
      id:       'top-category',
      category: 'spending',
      severity: isHigh ? 'warning' : 'info',
      title:    `${top.category} is your #1 expense`,
      body:     `You've spent ${fmt(top.total)} on ${top.category} — ${top.percentOfTotal.toFixed(1)}% of all expenses. ${isHigh ? 'This is high relative to a balanced budget. The 50/30/20 rule suggests no single category should dominate more than a third of spending.' : "That's within a healthy range."}`,
      value:    fmt(top.total),
      action:   'View spending breakdown',
      actionHref: '/dashboard/expenses',
      engine:   'calculateCategorySpending',
    });
  }

  // Dining out flag (common overspend category)
  const dining = categorySpending.find(c =>
    c.category.toLowerCase().includes('dining') ||
    c.category.toLowerCase().includes('restaurant') ||
    c.category.toLowerCase().includes('food')
  );
  if (dining && dining.percentOfTotal > 15) {
    insights.push({
      id:       'dining-flag',
      category: 'spending',
      severity: 'warning',
      title:    `Dining spend is ${dining.percentOfTotal.toFixed(0)}% of expenses`,
      body:     `You've spent ${fmt(dining.total)} eating out. Most financial advisors suggest keeping dining under 10–15% of take-home pay. Cooking just 2 more meals at home per week could save ${fmt(dining.total * 0.2 * 12)}/year.`,
      value:    fmt(dining.total),
      action:   'View expense details',
      actionHref: '/dashboard/expenses',
      engine:   'calculateCategorySpending',
    });
  }

  /* ── INCOME ANALYTICS ── */
  if (incomeAnalytics) {
    // ── INCOME VOLATILITY — corrected methodology ──
    //
    // Two problems with raw monthly totals:
    //   1. Bi-weekly pay creates 2-paycheck vs 3-paycheck months (~50% swing)
    //      that looks like volatility but is a calendar artifact, not real variance.
    //   2. The current (incomplete) month drags down "lowest income month" because
    //      only 1 paycheck may have landed so far this month.
    //
    // Fix: exclude the current month, then normalize to per-paycheck amounts
    // for any recurring income source so the comparison is apples-to-apples.

    const currentMonthKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    // Only completed months
    const completedMonths = (incomeAnalytics.monthlyIncome ?? []).filter(
      (m: { month: string }) => m.month < currentMonthKey
    );

    // Find the dominant recurring income pattern (payroll, salary, etc.)
    const primaryRecurring = recurringTransactions
      .filter((r: any) => r.transaction_type === 'Income' && r.isActive)
      .sort((a: any, b: any) => b.monthlyEquivalent - a.monthlyEquivalent)[0];

    const isRecurringPay = primaryRecurring &&
      ['weekly', 'biweekly', 'semimonthly', 'monthly'].includes(primaryRecurring.frequency);

    let normalizedValues: number[] = [];

    if (isRecurringPay && completedMonths.length > 0) {
      // Sum only the primary payroll merchant's deposits per month, excluding
      // Transfer-typed transactions (401k contributions, investment transfers, etc.
      // that Plaid may tag as Income but are not take-home pay).
      const payrollByMonth: Record<string, { total: number; count: number }> = {};
      transactions
        .filter((t: any) =>
          t.transaction_type === 'Income' &&
          t.transaction_type !== 'Transfer' &&
          t.merchant === primaryRecurring.merchant &&
          t.date.slice(0, 7) < currentMonthKey &&
          // Exclude investment/retirement transfers by category
          !['Investment Transfer', 'Transfer In', 'Transfer Out'].includes(t.category)
        )
        .forEach((t: any) => {
          const mo = t.date.slice(0, 7);
          if (!payrollByMonth[mo]) payrollByMonth[mo] = { total: 0, count: 0 };
          payrollByMonth[mo].total += t.amount;
          payrollByMonth[mo].count += 1;
        });

      // Per-paycheck amount — eliminates the 2-vs-3 artifact AND excludes 401k noise
      const months = Object.values(payrollByMonth).filter(v => v.count > 0);
      normalizedValues = months.length >= 2
        ? months.map(v => v.total / v.count)
        : completedMonths.map((m: { month: string; income: number }) => m.income);
    } else {
      normalizedValues = completedMonths.map((m: { month: string; income: number }) => m.income);
    }

    if (normalizedValues.length >= 2) {
      const high = Math.max(...normalizedValues);
      const low  = Math.min(...normalizedValues);
      const avg  = normalizedValues.reduce((a, b) => a + b, 0) / normalizedValues.length;
      const volatilityPct = avg > 0 ? ((high - low) / avg) * 100 : 0;

      if (volatilityPct > 25) {
        const payLabel = isRecurringPay ? 'per paycheck' : 'monthly';
        insights.push({
          id:       'income-volatility',
          category: 'income',
          severity: volatilityPct > 50 ? 'critical' : 'warning',
          title:    'Your income varies significantly',
          body:     `Your ${payLabel} income varies by ${volatilityPct.toFixed(0)}% — ranging from ${fmt(low)} to ${fmt(high)} ${payLabel}. This isn't a calendar artifact from pay frequency; it appears to be real variance. Budget off your lowest ${payLabel} amount to avoid cash shortfalls.`,
          value:    `${volatilityPct.toFixed(0)}% swing`,
          action:   'View income trends',
          actionHref: '/dashboard/income',
          engine:   'calculateIncomeAnalytics',
        });
      } else {
        const note = isRecurringPay && primaryRecurring.frequency === 'biweekly'
          ? 'Bi-weekly pay naturally creates 2- and 3-paycheck months — normalized per paycheck your income is highly consistent.'
          : 'Month-to-month variation is well within a stable range.';
        insights.push({
          id:       'income-stable',
          category: 'income',
          severity: 'positive',
          title:    'Your income is consistent and predictable',
          body:     `${note} This makes budgeting and goal planning significantly more accurate.`,
          value:    `${volatilityPct.toFixed(0)}% variation`,
          engine:   'calculateIncomeAnalytics',
        });
      }
    }

    // Income concentration risk
    if (incomeAnalytics.incomeSources?.length > 0) {
      const topSource = incomeAnalytics.incomeSources[0];
      if (topSource.percentOfIncome > 90) {
        insights.push({
          id:       'income-concentration',
          category: 'income',
          severity: 'warning',
          title:    `${topSource.source} is your only income source`,
          body:     `${topSource.percentOfIncome.toFixed(0)}% of your income comes from a single source. A job loss, contract end, or pay cut would immediately impact your finances. Consider building a secondary income stream or 6-month emergency fund.`,
          value:    `${topSource.percentOfIncome.toFixed(0)}% concentration`,
          action:   'View goals',
          actionHref: '/dashboard/goals',
          engine:   'calculateIncomeAnalytics',
        });
      } else if (incomeAnalytics.incomeSources.length >= 3) {
        insights.push({
          id:       'income-diversified',
          category: 'income',
          severity: 'positive',
          title:    'You have diversified income sources',
          body:     `Income comes from ${incomeAnalytics.incomeSources.length} different sources. This reduces risk — even if one source drops, others provide a cushion. Keep building this diversity.`,
          value:    `${incomeAnalytics.incomeSources.length} sources`,
          engine:   'calculateIncomeAnalytics',
        });
      }
    }

    // Savings rate — age-adjusted benchmark
    if (incomeAnalytics.averageMonthlyIncome > 0 && expenseAnalytics?.averageMonthlyExpenses > 0) {
      const monthlySurplus = incomeAnalytics.averageMonthlyIncome - expenseAnalytics.averageMonthlyExpenses;
      const savingsRate    = (monthlySurplus / incomeAnalytics.averageMonthlyIncome) * 100;

      // Age-bracket targets: younger = lower bar (still building income), older = higher bar (peak earning, runway shrinking)
      const savingsBracket =
        age < 35 ? { low: 10, target: 15, label: 'Early Wealth Building (18–35)', rationale: 'Focus on establishing the habit; 10–15% is the right starting range.' } :
        age < 50 ? { low: 15, target: 25, label: 'Wealth Accumulation (35–50)',   rationale: 'Peak earning years — aim for 15–25% to build serious compounding momentum.' } :
        age < 65 ? { low: 25, target: 35, label: 'Pre-Retirement (50–65)',         rationale: 'Catch-up window. Aim for 25–35%+ to maximize pre-retirement accumulation.' } :
                   { low: 0,  target: 0,  label: 'Retirement (65+)',               rationale: 'In retirement, focus on sustainable withdrawal rate, not saving rate.' };

      if (savingsRate < 0) {
        insights.push({
          id:       'negative-savings',
          category: 'savings',
          severity: 'critical',
          title:    'You are spending more than you earn',
          body:     `Your monthly expenses (${fmt(expenseAnalytics.averageMonthlyExpenses)}) exceed income (${fmt(incomeAnalytics.averageMonthlyIncome)}) by ${fmt(Math.abs(monthlySurplus))}/mo. At this rate you would deplete ${fmt(Math.abs(monthlySurplus) * 12)} of savings per year. Identify which expense categories to cut first.`,
          value:    fmt(monthlySurplus),
          action:   'Review budget',
          actionHref: '/dashboard/budget',
          engine:   'calculateIncomeAnalytics + calculateExpenseAnalytics',
        });
      } else if (age < 65 && savingsRate < savingsBracket.low) {
        insights.push({
          id:       'low-savings-rate',
          category: 'savings',
          severity: 'warning',
          title:    `Savings rate is only ${savingsRate.toFixed(1)}%`,
          body:     `For your life stage (${savingsBracket.label}), a target of ${savingsBracket.low}–${savingsBracket.target}% is recommended. ${savingsBracket.rationale} You're saving ${fmt(monthlySurplus)}/mo — reaching ${savingsBracket.target}% would mean ${fmt(incomeAnalytics.averageMonthlyIncome * savingsBracket.target / 100)}/mo, an extra ${fmt(incomeAnalytics.averageMonthlyIncome * savingsBracket.target / 100 - monthlySurplus)}/mo.`,
          value:    `${savingsRate.toFixed(1)}%`,
          action:   'View forecast',
          actionHref: '/dashboard/forecast',
          engine:   'calculateIncomeAnalytics + calculateExpenseAnalytics',
        });
      } else if (age < 65 && savingsRate >= savingsBracket.target) {
        insights.push({
          id:       'strong-savings-rate',
          category: 'savings',
          severity: 'positive',
          title:    `Strong savings rate: ${savingsRate.toFixed(1)}%`,
          body:     `For your life stage (${savingsBracket.label}), the target is ${savingsBracket.low}–${savingsBracket.target}%. At ${savingsRate.toFixed(1)}% you're ahead of the curve. At this rate you'll accumulate ${fmt(monthlySurplus * 12)}/year before investment returns — make sure it's working in high-yield or invested accounts.`,
          value:    `${savingsRate.toFixed(1)}%`,
          action:   'View forecast',
          actionHref: '/dashboard/forecast',
          engine:   'calculateIncomeAnalytics + calculateExpenseAnalytics',
        });
      } else if (age < 65) {
        // Between low and target — on track
        insights.push({
          id:       'ok-savings-rate',
          category: 'savings',
          severity: 'info',
          title:    `Savings rate ${savingsRate.toFixed(1)}% — on track`,
          body:     `For your life stage (${savingsBracket.label}), you're within the recommended ${savingsBracket.low}–${savingsBracket.target}% range. ${savingsBracket.rationale} Push toward the upper end when possible.`,
          value:    `${savingsRate.toFixed(1)}%`,
          action:   'View forecast',
          actionHref: '/dashboard/forecast',
          engine:   'calculateIncomeAnalytics + calculateExpenseAnalytics',
        });
      }
    }

    /* ── EMERGENCY FUND COVERAGE ── */
    if (incomeAnalytics.averageMonthlyIncome > 0 && expenseAnalytics?.averageMonthlyExpenses > 0 && totalAssets > 0) {
      // Approximate liquid assets as total assets minus illiquid estimate (rough heuristic: 60% liquid)
      // In production this would use account-type breakdown; here we use a conservative fraction
      const liquidEstimate  = totalAssets * 0.3; // conservative — most assets may be invested/property
      const monthsCovered   = liquidEstimate / expenseAnalytics.averageMonthlyExpenses;
      const targetMonths    = age < 50 ? 6 : 3; // older: mortgages/insurance typically more stable

      if (monthsCovered < 1) {
        insights.push({
          id:       'emergency-fund-critical',
          category: 'savings',
          severity: 'critical',
          title:    'No emergency fund cushion detected',
          body:     `Based on your asset breakdown, liquid savings appear to cover less than 1 month of expenses (${fmt(expenseAnalytics.averageMonthlyExpenses)}/mo). A job loss or medical emergency could force debt immediately. Build to ${targetMonths} months (${fmt(expenseAnalytics.averageMonthlyExpenses * targetMonths)}) in a high-yield savings account as your first financial priority.`,
          value:    `< 1 month`,
          action:   'View goals',
          actionHref: '/dashboard/goals',
          engine:   'financialdatacontext',
        });
      } else if (monthsCovered < targetMonths) {
        insights.push({
          id:       'emergency-fund-low',
          category: 'savings',
          severity: 'warning',
          title:    `Emergency fund covers ~${monthsCovered.toFixed(1)} months`,
          body:     `Financial advisors recommend ${targetMonths} months of expenses in liquid savings. Your estimated liquid assets cover roughly ${monthsCovered.toFixed(1)} months of your ${fmt(expenseAnalytics.averageMonthlyExpenses)}/mo in expenses. Target: ${fmt(expenseAnalytics.averageMonthlyExpenses * targetMonths)}.`,
          value:    `${monthsCovered.toFixed(1)} mo`,
          action:   'View goals',
          actionHref: '/dashboard/goals',
          engine:   'financialdatacontext',
        });
      }
    }
  }

  /* ── SUBSCRIPTION OVERLAP ── */
  if (recurringTransactions.length) {
    const overlap = detectSubscriptionOverlap(recurringTransactions);
    if (overlap.overlaps.length > 0) {
      const top = overlap.overlaps[0];
      insights.push({
        id:       'subscription-overlap',
        category: 'subscriptions',
        severity: 'warning',
        title:    `Redundant ${top.purposeCategory} subscriptions detected`,
        body:     top.recommendation,
        value:    `${fmt(overlap.totalRedundantAnnual)}/yr wasted`,
        action:   'View recurring',
        actionHref: '/dashboard/recurring',
        engine:   'detectSubscriptionOverlap',
      });
    }

    /* ── ANNUAL COST ROLLUP ── */
    const rollup = buildAnnualCostRollup(recurringTransactions);
    if (rollup.totalAnnualSubscriptions > 0) {
      const perDay = rollup.totalAnnualSubscriptions / 365;
      insights.push({
        id:       'subscription-total',
        category: 'subscriptions',
        severity: rollup.totalAnnualSubscriptions > 3000 ? 'warning' : 'info',
        title:    `${fmt(rollup.totalAnnualSubscriptions)}/year in subscriptions`,
        body:     `You're spending ${fmtD(perDay)}/day on subscriptions alone — ${fmt(rollup.totalAnnualSubscriptions / 12)}/month. ${rollup.totalAnnualSubscriptions > 3000 ? 'This is above average. Review each subscription to confirm it\'s actively used.' : 'This is within a normal range, but it\'s worth auditing quarterly.'}`,
        value:    fmt(rollup.totalAnnualSubscriptions),
        action:   'Audit subscriptions',
        actionHref: '/dashboard/recurring',
        engine:   'buildAnnualCostRollup',
      });
    }

    /* ── INCOME VARIANCE ── */
    const incomeVariance = analyzeIncomeVariance(transactions, recurringTransactions);
    if (incomeVariance.concentrationRisk > 85 && incomeVariance.sources.length > 0) {
      const declining = incomeVariance.sources.find(s => s.trend === 'declining');
      if (declining) {
        insights.push({
          id:       'income-declining',
          category: 'income',
          severity: 'critical',
          title:    `${declining.merchant} income is trending down`,
          body:     `Your income from ${declining.merchant} has been declining. YTD total is ${fmt(declining.ytdTotal)}, and the projected annual figure (${fmt(declining.ytdProjected)}) is trending lower than prior periods. Review whether this is seasonal or structural.`,
          value:    fmt(declining.ytdTotal),
          action:   'View income',
          actionHref: '/dashboard/income',
          engine:   'analyzeIncomeVariance',
        });
      }

      if (incomeVariance.sources.some(s => s.missedPayments > 0)) {
        const missed = incomeVariance.sources.find(s => s.missedPayments > 0)!;
        insights.push({
          id:       'missed-payment',
          category: 'income',
          severity: 'warning',
          title:    `Possible missed payment from ${missed.merchant}`,
          body:     `Based on the established frequency, you may have missed ${missed.missedPayments} expected payment(s) from ${missed.merchant}. This could be a late payment, contract change, or data gap worth investigating.`,
          engine:   'analyzeIncomeVariance',
        });
      }
    }

    /* ── ANOMALY DETECTION ── */
    const anomalyReport = detectAnomalies(transactions, recurringTransactions);
    const highAnomalies = anomalyReport.anomalies.filter(a => a.severity === 'high').slice(0, 3);

    highAnomalies.forEach((anomaly, i) => {
      insights.push({
        id:       `anomaly-${i}`,
        category: 'anomalies',
        severity: 'critical',
        title:    anomaly.type === 'duplicate_charge'    ? 'Possible duplicate charge'
                : anomaly.type === 'amount_spike'        ? 'Unusual charge detected'
                : anomaly.type === 'charge_after_cancel' ? 'Charge from cancelled subscription'
                : 'Unexpected large charge',
        body:     anomaly.description,
        value:    anomaly.amount ? fmt(anomaly.amount) : undefined,
        action:   'Review transactions',
        actionHref: '/dashboard/cashflow',
        engine:   'detectAnomalies',
      });
    });

    if (anomalyReport.totalFlagged === 0) {
      insights.push({
        id:       'no-anomalies',
        category: 'anomalies',
        severity: 'positive',
        title:    'No suspicious transactions detected',
        body:     'All transactions match expected patterns. No duplicate charges, unusual spikes, or unexpected activity found in your recent history.',
        engine:   'detectAnomalies',
      });
    }
  }

  /* ── NET WORTH / DEBT — age-adjusted D/A scoring ── */
  if (totalAssets > 0) {
    const debtRatio = totalLiabilities / totalAssets;
    const daInfo    = getDALabel(debtRatio, age);
    const debtPct   = (debtRatio * 100).toFixed(1);

    // Build age-bracket context for the insight body
    const bracket = age < 35 ? 'Early Wealth Building (18–35)' : age < 50 ? 'Wealth Accumulation (35–50)' : age < 65 ? 'Pre-Retirement (50–65)' : 'Retirement (65+)';
    const targets  = age < 35 ? 'below 70%' : age < 50 ? 'below 60%' : age < 65 ? 'below 45%' : 'below 35%';
    const goals    = age < 35 ? 'focus on building assets alongside debt repayment' : age < 50 ? 'shift focus toward paying down debt as you approach peak earning years' : age < 65 ? 'prioritize debt elimination ahead of retirement' : 'carrying debt in retirement strains fixed income — pay down aggressively';

    if (daInfo.label === 'Critical' || daInfo.label === 'High') {
      insights.push({
        id:       'high-debt-ratio',
        category: 'debt',
        severity: daInfo.label === 'Critical' ? 'critical' : 'warning',
        title:    `Debt-to-asset ratio is ${debtPct}% — ${daInfo.label}`,
        body:     `At your life stage (${bracket}), a healthy ratio is ${targets}. Your current ${debtPct}% means ${goals}. Liabilities: ${fmt(totalLiabilities)} vs assets: ${fmt(totalAssets)}.`,
        value:    `${debtPct}%`,
        action:   'Open debt planner',
        actionHref: '/dashboard/debt',
        engine:   'financialdatacontext',
      });
    } else if (daInfo.label === 'Excellent' || daInfo.label === 'Very Good') {
      insights.push({
        id:       'low-debt-ratio',
        category: 'debt',
        severity: 'positive',
        title:    `Debt-to-asset ratio is ${debtPct}% — ${daInfo.label}`,
        body:     `For your life stage (${bracket}), a target of ${targets} is recommended. At ${debtPct}% you're well positioned — this leverage gives you financial flexibility and strong borrowing power.`,
        value:    `${debtPct}%`,
        engine:   'financialdatacontext',
      });
    } else {
      // Healthy — informational
      insights.push({
        id:       'ok-debt-ratio',
        category: 'debt',
        severity: 'info',
        title:    `Debt-to-asset ratio is ${debtPct}% — Healthy`,
        body:     `For your life stage (${bracket}), you're within the healthy range. The target is ${targets}. Stay on your current paydown plan to move toward Very Good or Excellent.`,
        value:    `${debtPct}%`,
        engine:   'financialdatacontext',
      });
    }
  }

  // Sort: critical first, then warning, positive, info
  const order: Record<InsightSeverity, number> = { critical: 0, warning: 1, positive: 2, info: 3 };
  return insights.sort((a, b) => order[a.severity] - order[b.severity]);
}

/* ─────────────────────────────────────────────────────────────
   MOBILE VIEW — shared mobile design system
───────────────────────────────────────────────────────────── */
function useMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
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

const MN_SEVERITY: Record<InsightSeverity, { color: string; label: string }> = {
  critical: { color: '#F87171', label: 'Action Required' },
  warning:  { color: '#FBBF24', label: 'Heads Up' },
  positive: { color: '#34D399', label: 'Looking Good' },
  info:     { color: '#2ED3C6', label: 'Insight' },
};

function MobileInsightCard({ insight }: { insight: Insight }) {
  const [expanded, setExpanded] = useState(false);
  const s = MN_SEVERITY[insight.severity];
  return (
    <div style={{
      background: MN.card, borderRadius: 14, border: `1px solid ${MN.border}`,
      borderLeft: `3px solid ${s.color}`, padding: '13px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: s.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
        <span style={{ fontSize: 10, color: MN.faint }}>{CATEGORY_META[insight.category].icon} {CATEGORY_META[insight.category].label}</span>
        {insight.value && (
          <span style={{ fontSize: 10, fontWeight: 800, color: MN.text, background: 'rgba(255,255,255,0.08)', padding: '1px 8px', borderRadius: 20, marginLeft: 'auto' }}>
            {insight.value}
          </span>
        )}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: MN.text, marginBottom: 5, lineHeight: 1.35 }}>{insight.title}</div>
      <div style={{
        fontSize: 12.5, color: MN.muted, lineHeight: 1.6,
        overflow: expanded ? 'visible' : 'hidden',
        display: expanded ? 'block' : '-webkit-box',
        WebkitLineClamp: expanded ? undefined : 2,
        WebkitBoxOrient: 'vertical' as any,
      }}>
        {insight.body}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
        {insight.body.length > 110 && (
          <button onClick={() => setExpanded(e => !e)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 12, fontWeight: 700, color: MN.gold,
          }}>
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
        {insight.action && insight.actionHref && (
          <a href={insight.actionHref} style={{ fontSize: 12, fontWeight: 700, color: MN.gold, textDecoration: 'none' }}>
            {insight.action} →
          </a>
        )}
      </div>
    </div>
  );
}

function MobileAIInsightsView({
  insights, filtered, activeFilter, setActiveFilter, categoryCounts, hasTransactions,
}: {
  insights: Insight[]; filtered: Insight[];
  activeFilter: InsightCategory | 'all';
  setActiveFilter: (c: InsightCategory | 'all') => void;
  categoryCounts: Record<string, number>;
  hasTransactions: boolean;
}) {
  const critical  = insights.filter(i => i.severity === 'critical').length;
  const warnings  = insights.filter(i => i.severity === 'warning').length;
  const positives = insights.filter(i => i.severity === 'positive').length;

  const statusColor = critical > 0 ? MN.red : warnings > 0 ? MN.amber : MN.green;
  const statusLabel = critical > 0 ? 'Needs Your Attention' : warnings > 0 ? 'A Few Things to Review' : 'All Clear';

  const allCategories: (InsightCategory | 'all')[] = ['all', 'spending', 'income', 'savings', 'subscriptions', 'anomalies', 'debt'];

  return (
    <div style={{ color: MN.text, fontFamily: 'var(--font-body)', paddingBottom: 16 }}>

      {/* ── HERO — pulse ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0a3fa8 0%, #0F2044 100%)',
        borderRadius: 0, padding: '24px 20px 20px', margin: '-16px -16px 16px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, transparent, ${MN.gold}, #67E6D5, ${MN.gold}, transparent)` }} />
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(46,211,198,0.75)', marginBottom: 6 }}>
          AI Insights · Today
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: statusColor, letterSpacing: '-0.02em', marginBottom: 14 }}>
          {statusLabel}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Issues',    count: critical,  color: MN.red },
            { label: 'Warnings',  count: warnings,  color: MN.amber },
            { label: 'Positives', count: positives, color: MN.green },
          ].map(b => (
            <div key={b.label} style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: 12,
              border: `1px solid rgba(255,255,255,0.1)`, padding: '10px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: b.color, lineHeight: 1 }}>{b.count}</div>
              <div style={{ fontSize: 10, color: MN.muted, fontWeight: 600, marginTop: 4 }}>{b.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FILTER CHIPS ── */}
      {insights.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14, paddingBottom: 2 }}>
          {allCategories.map(cat => {
            const count = cat === 'all' ? insights.length : (categoryCounts[cat] ?? 0);
            if (cat !== 'all' && count === 0) return null;
            const isActive = activeFilter === cat;
            return (
              <button key={cat} onClick={() => setActiveFilter(cat)} style={{
                padding: '8px 14px', borderRadius: 100, whiteSpace: 'nowrap', flexShrink: 0,
                border: `1px solid ${isActive ? MN.gold : MN.border}`,
                background: isActive ? 'rgba(46,211,198,0.15)' : MN.card,
                color: isActive ? MN.gold : MN.muted,
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer', minHeight: 36,
              }}>
                {cat === 'all' ? '✦ All' : `${CATEGORY_META[cat as InsightCategory].icon} ${CATEGORY_META[cat as InsightCategory].label}`} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* ── INSIGHTS ── */}
      {filtered.length === 0 ? (
        <div style={{ background: MN.card, borderRadius: 16, border: `1px solid ${MN.border}`, padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: MN.text, marginBottom: 5 }}>
            {!hasTransactions ? 'No transaction data yet' : 'No insights in this category'}
          </div>
          <div style={{ fontSize: 12, color: MN.muted }}>
            {!hasTransactions
              ? 'Connect your accounts to see personalized insights.'
              : 'Try a different filter above.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(insight => (
            <MobileInsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   UI PRIMITIVES
───────────────────────────────────────────────────────────── */
type TT = typeof T;
function getSeverityStyles(TT: TT): Record<InsightSeverity, { bg: string; accentColor: string; label: string }> {
  return {
    critical: { bg: TT.redBg,     accentColor: TT.red,     label: 'Action Required' },
    warning:  { bg: TT.amberBg,   accentColor: TT.amber,   label: 'Heads Up'        },
    positive: { bg: TT.greenBg,   accentColor: TT.green,   label: 'Looking Good'    },
    info:     { bg: TT.primaryBg, accentColor: TT.primary, label: 'Insight'         },
  };
}

const CATEGORY_META: Record<InsightCategory, { label: string; icon: string }> = {
  spending:       { label: 'Spending',       icon: '💳' },
  income:         { label: 'Income',         icon: '💰' },
  subscriptions:  { label: 'Subscriptions',  icon: '🔄' },
  anomalies:      { label: 'Anomalies',      icon: '🔍' },
  savings:        { label: 'Savings Rate',   icon: '🏦' },
  debt:           { label: 'Debt',           icon: '📊' },
  forecast:       { label: 'Forecast',       icon: '📈' },
};

function InsightCard({ insight }: { insight: Insight }) {
  const { isDark } = useDashboardTheme();
  const TT = isDark ? DARK_T : T;
  const S = getSeverityStyles(TT);
  const s = S[insight.severity];
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: TT.surface,
      border: `1px solid ${TT.border}`,
      borderLeft: `3px solid ${s.accentColor}`,
      borderRadius: TT.radius,
      padding: '18px 20px 18px 18px',
      boxShadow: TT.shadow,
      transition: 'box-shadow 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
        {/* Severity dot */}
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: s.accentColor, marginTop: 6,
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Labels row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, fontWeight: 800, color: s.accentColor,
              textTransform: 'uppercase', letterSpacing: '0.09em',
              background: s.bg, padding: '2px 7px', borderRadius: 20,
            }}>
              {s.label}
            </span>
            <span style={{ fontSize: 10, color: TT.textTertiary, fontWeight: 600 }}>
              {CATEGORY_META[insight.category].icon} {CATEGORY_META[insight.category].label}
            </span>
            {insight.value && (
              <span style={{
                fontSize: 11, fontWeight: 800, color: TT.textSecondary,
                background: TT.bg, border: `1px solid ${TT.border}`,
                padding: '2px 8px', borderRadius: 20,
              }}>
                {insight.value}
              </span>
            )}
          </div>

          {/* Title */}
          <div style={{ fontSize: 14.5, fontWeight: 700, color: TT.textPrimary, marginBottom: 7, lineHeight: 1.35 }}>
            {insight.title}
          </div>

          {/* Body */}
          <div
            style={{
              fontSize: 13, color: TT.textSecondary, lineHeight: 1.65,
              overflow: expanded ? 'visible' : 'hidden',
              display: expanded ? 'block' : '-webkit-box',
              WebkitLineClamp: expanded ? undefined : 2,
              WebkitBoxOrient: 'vertical' as any,
            }}
          >
            {insight.body}
          </div>

          {insight.body.length > 120 && (
            <button onClick={() => setExpanded(e => !e)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, color: TT.primary, padding: '4px 0 0', marginTop: 2,
            }}>
              {expanded ? 'Show less ↑' : 'Read more ↓'}
            </button>
          )}

          {insight.action && insight.actionHref && (
            <a href={insight.actionHref} style={{
              display: 'inline-block', marginTop: 10,
              fontSize: 12, fontWeight: 700, color: TT.primary,
              textDecoration: 'none', borderBottom: `1px solid ${TT.primaryBorder}`,
            }}>
              {insight.action} →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const { isDark } = useDashboardTheme();
  const TT = isDark ? DARK_T : T;
  const accentLine = isDark
    ? 'linear-gradient(90deg, transparent, #2ED3C6, #67E6D5, #2ED3C6, transparent)'
    : 'linear-gradient(90deg, transparent, #0a3fa8, #4da3ff, #0a3fa8, transparent)';
  return (
    <div style={{ background: TT.surface, borderRadius: TT.radius, border: `1px solid ${TT.border}`, boxShadow: TT.shadow, padding: '24px', position: 'relative', overflow: 'hidden', ...style }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accentLine }} />
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TODAY'S ALERTS PANEL
───────────────────────────────────────────────────────────── */
function FinancialPulse({ insights }: { insights: Insight[] }) {
  const { isDark } = useDashboardTheme();
  const TT = isDark ? DARK_T : T;

  const critical = insights.filter(i => i.severity === 'critical').length;
  const warnings = insights.filter(i => i.severity === 'warning').length;
  const positives = insights.filter(i => i.severity === 'positive').length;
  const total = critical + warnings + positives;

  const statusColor = critical > 0 ? TT.red : warnings > 0 ? TT.amber : TT.green;
  const statusLabel = critical > 0 ? 'Needs Your Attention' : warnings > 0 ? 'A Few Things to Review' : 'All Clear';
  const statusSub   = critical > 0
    ? `You have ${critical} item${critical > 1 ? 's' : ''} requiring action.`
    : warnings > 0
    ? `${warnings} head${warnings > 1 ? 's' : ''}-up worth reviewing.`
    : `Your finances look healthy today. ${positives > 0 ? `${positives} positive signal${positives > 1 ? 's' : ''} detected.` : ''}`;

  return (
    <Card style={{ padding: '24px 28px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: TT.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Today's Alerts
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: statusColor }}>{statusLabel}</div>
          <div style={{ fontSize: 13, color: TT.textSecondary, marginTop: 3 }}>{statusSub}</div>
        </div>

        {/* Count pills */}
        <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
          {[
            { label: 'Issues',    count: critical,  color: TT.red,   bg: TT.redBg,   border: TT.redBorder   },
            { label: 'Warnings',  count: warnings,  color: TT.amber, bg: TT.amberBg, border: TT.amberBorder },
            { label: 'Positives', count: positives, color: TT.green, bg: TT.greenBg, border: TT.greenBorder },
          ].map(b => (
            <div key={b.label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '10px 16px', borderRadius: 12,
              background: b.bg, border: `1px solid ${b.border}`,
              minWidth: 64,
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: b.color, lineHeight: 1 }}>{b.count}</div>
              <div style={{ fontSize: 10.5, color: TT.textTertiary, fontWeight: 600, marginTop: 3 }}>{b.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Color bar */}
      <div style={{ height: 5, borderRadius: 3, display: 'flex', overflow: 'hidden', gap: 2 }}>
        {total === 0
          ? <div style={{ flex: 1, background: TT.green, borderRadius: 3 }} />
          : <>
              <div style={{ flex: critical, background: TT.red,   borderRadius: 3, minWidth: critical > 0 ? 4 : 0, transition: 'flex 0.8s ease' }} />
              <div style={{ flex: warnings,  background: TT.amber, borderRadius: 3, minWidth: warnings > 0  ? 4 : 0, transition: 'flex 0.8s ease' }} />
              <div style={{ flex: positives, background: TT.green, borderRadius: 3, minWidth: positives > 0 ? 4 : 0, transition: 'flex 0.8s ease' }} />
            </>
        }
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────
   CATEGORY FILTER BAR
───────────────────────────────────────────────────────────── */
function FilterBar({ active, setActive, counts }: {
  active: InsightCategory | 'all';
  setActive: (c: InsightCategory | 'all') => void;
  counts: Record<string, number>;
}) {
  const { isDark } = useDashboardTheme();
  const TT = isDark ? DARK_T : T;
  const allCategories: (InsightCategory | 'all')[] = ['all', 'spending', 'income', 'savings', 'subscriptions', 'anomalies', 'debt'];

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {allCategories.map(cat => {
        const count = cat === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[cat] ?? 0);
        if (cat !== 'all' && count === 0) return null;
        const isActive = active === cat;
        return (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            style={{
              padding: '7px 14px', borderRadius: 20,
              border: `1px solid ${isActive ? TT.primary : TT.border}`,
              background: isActive ? TT.primaryBg : TT.surface,
              cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
              color: isActive ? TT.primary : TT.textSecondary,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            {cat === 'all' ? '✦' : CATEGORY_META[cat as InsightCategory].icon}
            {cat === 'all' ? 'All Insights' : CATEGORY_META[cat as InsightCategory].label}
            <span style={{
              fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 12,
              background: isActive ? TT.primary : TT.bg,
              color: isActive ? '#fff' : TT.textTertiary,
            }}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   AI UPGRADE BANNER
───────────────────────────────────────────────────────────── */
function AIUpgradeBanner() {
  const { isDark } = useDashboardTheme();
  const TT = isDark ? DARK_T : T;
  return (
    <div style={{
      padding: '18px 22px', borderRadius: TT.radius,
      background: isDark
        ? 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(77,163,255,0.08))'
        : 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(10,63,168,0.08))',
      border: `1px solid ${TT.purpleBorder}`,
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ fontSize: 28, flexShrink: 0 }}>✦</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: TT.purpleText, marginBottom: 4 }}>
          AI-Powered Insights — Coming Soon
        </div>
        <div style={{ fontSize: 12.5, color: TT.textSecondary, lineHeight: 1.5 }}>
          These insights are generated by Nautilus's rules engine. Our upcoming Claude AI integration will provide deeper, conversational analysis — explaining the "why" behind your patterns and answering follow-up questions about your finances.
        </div>
      </div>
      <div style={{
        fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 20,
        background: TT.purpleBg, color: TT.purpleText, border: `1px solid ${TT.purpleBorder}`,
        flexShrink: 0,
      }}>
        Premium Feature
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function AIInsightsPage() {
  const isMobile = useMobile();
  const { isDark } = useDashboardTheme();
  const TT = isDark ? DARK_T : T;
  const { transactions, recurringTransactions, incomeAnalytics, expenseAnalytics, loading } = useFlowData();
  const { currentSnapshot } = useWealthData();
  const { profile: userProfile } = useUserProfile();
  const currentAge = userProfile?.age ?? 35;

  const [activeFilter, setActiveFilter] = useState<InsightCategory | 'all'>('all');

  /* ── compute net worth from snapshot ── */
  const { netWorth, totalAssets, totalLiabilities } = useMemo(() => {
    if (!currentSnapshot) return { netWorth: 0, totalAssets: 0, totalLiabilities: 0 };
    const sumF = (arr: any[], f: string) => (arr || []).reduce((t: number, i: any) => t + Number(i[f] || 0), 0);
    const sumL = (arr?: any[]) => (arr || []).reduce((t: number, i: any) => t + Number(i.amount || 0), 0);
    const totalAssets =
      sumF(currentSnapshot.bankAccounts, 'balance') +
      sumF(currentSnapshot.investmentAccounts, 'balance') +
      sumF(currentSnapshot.retirementAccounts, 'balance') +
      sumF(currentSnapshot.realEstate, 'value') +
      sumF(currentSnapshot.otherAssets, 'value');
    const totalLiabilities =
      sumL(currentSnapshot.liabilities?.mortgage) +
      sumL(currentSnapshot.liabilities?.creditCard) +
      sumL(currentSnapshot.liabilities?.auto) +
      sumL(currentSnapshot.liabilities?.studentLoan) +
      sumL(currentSnapshot.liabilities?.other);
    return { netWorth: totalAssets - totalLiabilities, totalAssets, totalLiabilities };
  }, [currentSnapshot]);

  /* ── run engine ── */
  const insights = useMemo(() => {
    if (!transactions.length) return [];
    return generateInsights(
      transactions,
      recurringTransactions,
      incomeAnalytics,
      expenseAnalytics,
      netWorth,
      totalAssets,
      totalLiabilities,
      currentAge,
    );
  }, [transactions, recurringTransactions, incomeAnalytics, expenseAnalytics, netWorth, totalAssets, totalLiabilities, currentAge]);

  /* ── category counts for filter bar ── */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    insights.forEach(i => { counts[i.category] = (counts[i.category] ?? 0) + 1; });
    return counts;
  }, [insights]);

  /* ── filtered list ── */
  const filtered = activeFilter === 'all' ? insights : insights.filter(i => i.category === activeFilter);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: TT.textTertiary, fontSize: 14 }}>
      Analyzing your financial data…
    </div>
  );

  /* ── MOBILE BRANCH ── */
  if (isMobile) {
    return (
      <MobileAIInsightsView
        insights={insights}
        filtered={filtered}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        categoryCounts={categoryCounts}
        hasTransactions={transactions.length > 0}
      />
    );
  }

  return (
    <div style={{ background: TT.bg, minHeight: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: TT.textPrimary, margin: 0 }}>AI Insights</h1>
        <p style={{ fontSize: 14, color: TT.textTertiary, marginTop: 4, marginBottom: 0 }}>
          Personalized analysis of your spending, income, subscriptions, and financial health.
        </p>
      </div>

      {/* Financial Pulse score */}
      {insights.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <FinancialPulse insights={insights} />
        </div>
      )}

      {/* AI upgrade banner */}
      <div style={{ marginBottom: 24 }}>
        <AIUpgradeBanner />
      </div>

      {/* Filter bar */}
      {insights.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <FilterBar active={activeFilter} setActive={setActiveFilter} counts={categoryCounts} />
        </div>
      )}

      {/* Insights list */}
      {filtered.length === 0 && !loading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: TT.textPrimary, marginBottom: 8 }}>
              {transactions.length === 0 ? 'No transaction data yet' : 'No insights in this category'}
            </div>
            <div style={{ fontSize: 14, color: TT.textTertiary }}>
              {transactions.length === 0
                ? 'Connect your accounts or import transactions to see personalized insights.'
                : 'Try selecting a different category filter above.'}
            </div>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      {/* Engine credits — useful for debugging and future AI handoff */}
      {insights.length > 0 && (
        <div style={{ marginTop: 32, padding: '16px 20px', borderRadius: TT.radiusMd, background: TT.surface, border: `1px solid ${TT.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TT.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Engines powering these insights
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Array.from(new Set(insights.map(i => i.engine))).map(engine => (
              <span key={engine} style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20,
                background: TT.bg, color: TT.textTertiary, border: `1px solid ${TT.border}`,
                fontFamily: 'monospace',
              }}>
                {engine}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
