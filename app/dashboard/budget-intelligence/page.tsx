'use client';

import React, { useMemo } from 'react';

import { useTransactionData } from '../../lib/transactioncontext';

import { calculateAutoBudgets } from '../../lib/financialengine/budget/calculateautobudgets';
import { calculateBudgetForecast } from '../../lib/financialengine/budget/calculatebudgetforecast';

import SummaryCard from '../../components/SummaryCard';
import KPIGrid from '../../components/finance/KPIGrid';
import FinanceCard from '../../components/finance/FinanceCard';

export default function BudgetIntelligencePage() {
  const { transactions } = useTransactionData();

  // STEP 1: auto budgets
  const autoBudgets = useMemo(
    () => calculateAutoBudgets(transactions),
    [transactions]
  );

  // STEP 2: forecast engine
  const forecast = useMemo(
    () => calculateBudgetForecast(transactions, autoBudgets, 5000),
    [transactions, autoBudgets]
  );

  // TOP BUDGET PRESSURE CATEGORIES
  const topBudgets = autoBudgets.slice(0, 5);

  return (
    <div>
      {/* HEADER */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 32, color: '#0a1f5c' }}>
          Budget Intelligence Dashboard
        </h1>
      </div>

      {/* CORE FORECAST KPIS */}
      <KPIGrid>
        <SummaryCard
          title="Projected Income"
          value={`$${Math.round(forecast.projectedIncome).toLocaleString()}`}
          subtitle="Monthly forecast"
          subtitleColor="#0b563d"
        />

        <SummaryCard
          title="Projected Expenses"
          value={`$${Math.round(forecast.projectedExpenses).toLocaleString()}`}
          subtitle="Expected burn rate"
          subtitleColor="#c0392b"
        />

        <SummaryCard
          title="End of Month Balance"
          value={`$${Math.round(forecast.projectedEndBalance).toLocaleString()}`}
          subtitle={`Runway: ${forecast.runwayDays} days`}
          subtitleColor={
            forecast.projectedEndBalance > 0 ? '#0b563d' : '#c0392b'
          }
        />

        <SummaryCard
          title="Recurring Obligations"
          value={`$${Math.round(forecast.recurringObligations).toLocaleString()}`}
          subtitle="Fixed monthly commitments"
          subtitleColor="#6d30fb"
        />
      </KPIGrid>

      {/* INSIGHTS PANEL */}
      <FinanceCard title="Budget Intelligence Insights">
        <div style={{ lineHeight: 1.6, color: '#444' }}>
          <p>
            • Your recurring obligations represent a fixed baseline of{' '}
            <b>${Math.round(forecast.recurringObligations)}</b>/month.
          </p>

          <p>
            • Discretionary spending pressure is{' '}
            <b>${Math.round(forecast.discretionarySpend)}</b>/month.
          </p>

          <p>
            • Net monthly projection is{' '}
            <b>${Math.round(forecast.projectedNet)}</b>.
          </p>

          <p>
            • Runway estimation suggests{' '}
            <b>{forecast.runwayDays} days</b> of coverage at current burn rate.
          </p>
        </div>
      </FinanceCard>

      {/* TOP BUDGET PRESSURE */}
      <FinanceCard title="Top Budget Pressure Categories">
        {topBudgets.map((b) => (
          <div
            key={b.category}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid #eee',
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{b.category}</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {b.type} • {b.confidence}% confidence
              </div>
            </div>

            <div style={{ fontWeight: 700 }}>
              ${Math.round(b.recommendedMonthly).toLocaleString()}
            </div>
          </div>
        ))}
      </FinanceCard>
    </div>
  );
}