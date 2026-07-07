'use client';

import BudgetProgressBar
from './BudgetProgressBar';

type Props = {
  performance: any;
};

export default function BudgetCard({
  performance,
}: Props) {

  return (
    <div
      style={{
        background: 'var(--t-surface)',
        borderRadius: 18,
        padding: 24,
        boxShadow:
          '0 4px 18px rgba(0,0,0,0.05)',
      }}
    >

      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--t-text-primary)',
          }}
        >
          {performance.category}
        </div>

        <div
          style={{
            fontWeight: 700,
            color:
              performance.status ===
              'over'
                ? '#c0392b'
                : performance.status ===
                  'warning'
                ? '#f39c12'
                : '#00A86B',
          }}
        >
          {Math.round(
            performance.percentUsed
          )}%
        </div>
      </div>

      <BudgetProgressBar
        percent={
          performance.percentUsed
        }
      />

      <div
        style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns:
            '1fr 1fr',
          gap: 14,
        }}
      >

        <Metric
          label="Spent"
          value={`$${Math.round(
            performance.spent
          ).toLocaleString()}`}
        />

        <Metric
          label="Budget"
          value={`$${Math.round(
            performance.budgeted
          ).toLocaleString()}`}
        />

        <Metric
          label="Projected"
          value={`$${Math.round(
            performance.projectedSpend
          ).toLocaleString()}`}
        />

        <Metric
          label="Remaining"
          value={`$${Math.round(
            performance.remaining
          ).toLocaleString()}`}
        />

      </div>

      <div
        style={{
          marginTop: 16,
          fontSize: 13,
          color: 'var(--t-text-tertiary)',
        }}
      >
        ${Math.round(
          performance.dailyBudgetRemaining
        ).toLocaleString()}
        {' '}remaining per day
      </div>

    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--t-text-tertiary)',
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: 600,
          color: 'var(--t-text-primary)',
        }}
      >
        {value}
      </div>
    </div>
  );
}