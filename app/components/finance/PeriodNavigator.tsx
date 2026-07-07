'use client';

import {
  useFinancialPeriod,
} from '../../lib/financialperiodcontext';

import {
  FinancialPeriodType,
} from '../../lib/types/financialperiod';

export default function PeriodNavigator() {

  const {

    currentPeriod,

    periodType,

    setPeriodType,

    nextPeriod,

    previousPeriod,

    goToToday,

    comparisonType,

    setComparisonType,

    enableComparison,

    setEnableComparison,

  } = useFinancialPeriod();

  const periodOptions:
    FinancialPeriodType[] = [
      'month',
      'quarter',
      'year',
    ];

  return (

    <div
      style={{
        background: '#fff',
        borderRadius: 18,
        padding: 24,
        boxShadow:
          '0 4px 18px rgba(0,0,0,0.05)',
        marginBottom: 28,
      }}
    >

      {/* TOP */}

      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >

        {/* NAVIGATION */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >

          <button
            onClick={
              previousPeriod
            }
            style={buttonStyle}
          >
            ←
          </button>

          <div
            style={{
              minWidth: 220,
            }}
          >

            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#0a1f5c',
              }}
            >
              {
                currentPeriod.label
              }
            </div>

            <div
              style={{
                fontSize: 13,
                color: '#64748b',
                marginTop: 4,
              }}
            >
              {
                currentPeriod.daysRemaining
              }{' '}
              days remaining
            </div>

          </div>

          <button
            onClick={nextPeriod}
            style={buttonStyle}
          >
            →
          </button>

        </div>

        {/* PERIOD TYPE */}

        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >

          {periodOptions.map(
            option => (

              <button
                key={option}
                onClick={() =>
                  setPeriodType(
                    option
                  )
                }
                style={{
                  ...filterButton,
                  background:
                    periodType ===
                    option
                      ? '#0a3fa8'
                      : '#fff',
                  color:
                    periodType ===
                    option
                      ? '#fff'
                      : '#333',
                }}
              >
                {option}
              </button>

            )
          )}

          <button
            onClick={goToToday}
            style={filterButton}
          >
            Today
          </button>

        </div>

      </div>

      {/* COMPARISON */}

      <div
        style={{
          marginTop: 24,
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >

        <button
          onClick={() =>
            setEnableComparison(
              !enableComparison
            )
          }
          style={{
            ...filterButton,
            background:
              enableComparison
                ? '#00A86B'
                : '#fff',
            color:
              enableComparison
                ? '#fff'
                : '#333',
          }}
        >
          Comparison
        </button>

        {enableComparison && (

          <>
            <button
              onClick={() =>
                setComparisonType(
                  'previous-period'
                )
              }
              style={{
                ...filterButton,
                background:
                  comparisonType ===
                  'previous-period'
                    ? '#6d30fb'
                    : '#fff',
                color:
                  comparisonType ===
                  'previous-period'
                    ? '#fff'
                    : '#333',
              }}
            >
              Previous Period
            </button>

            <button
              onClick={() =>
                setComparisonType(
                  'previous-year'
                )
              }
              style={{
                ...filterButton,
                background:
                  comparisonType ===
                  'previous-year'
                    ? '#fd5602'
                    : '#fff',
                color:
                  comparisonType ===
                  'previous-year'
                    ? '#fff'
                    : '#333',
              }}
            >
              Previous Year
            </button>
          </>

        )}

      </div>

    </div>
  );
}

const buttonStyle = {
  border: 'none',
  background: '#0a3fa8',
  color: '#fff',
  borderRadius: 10,
  padding: '10px 14px',
  cursor: 'pointer',
  fontWeight: 700,
};

const filterButton = {
  border: '1px solid #d1d5db',
  borderRadius: 10,
  padding: '10px 16px',
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 500,
  textTransform:
    'capitalize' as const,
};