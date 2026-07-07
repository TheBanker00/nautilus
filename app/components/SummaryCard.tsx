'use client';

import React from 'react';
import { useDashboardTheme } from '../lib/dashboardthemecontext';

type MetricItem = {
  label: string;
  value: string;
  color?: string;
};

type SummaryCardProps = {
  title: string;

  value?: string;

  subtitle?: string;

  subtitleColor?: string;

  customContent?: React.ReactNode;

  contentMode?:
    | 'default'
    | 'metric-list'
    | 'analytics';

  trend?: string;

  trendDirection?:
    | 'up'
    | 'down'
    | 'neutral';

  badge?: string;

  badgeColor?: string;

  metrics?: MetricItem[];

  footer?: string;

  footerColor?: string;
};

function AccentLine() {
  const { T } = useDashboardTheme();
  const grad = T.isDark
    ? 'linear-gradient(90deg, #2ED3C6, #0891B2)'
    : 'linear-gradient(90deg, #0a3fa8, #4da3ff 60%, #0891B2)';
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: grad, borderRadius: '20px 20px 0 0' }} />
  );
}

export default function SummaryCard({
  title,

  value,

  subtitle,

  subtitleColor = '#666',

  customContent,

  contentMode = 'default',

  trend,

  trendDirection = 'neutral',

  badge,

  badgeColor = '#0a3fa8',

  metrics = [],

  footer,

  footerColor = '#6b7280',
}: SummaryCardProps) {

  // -----------------------------------
  // TREND COLORS
  // -----------------------------------
  const trendColor =
    trendDirection === 'up'
      ? '#0b563d'
      : trendDirection === 'down'
      ? '#c0392b'
      : '#6b7280';

  return (
    <div
      style={{
        background: 'var(--t-surface)',

        borderRadius: '20px',

        padding: '24px',

        boxShadow:
          '0 4px 18px rgba(0,0,0,0.06)',

        display: 'flex',

        flexDirection: 'column',

        minHeight: '140px',

        position: 'relative',

        overflow: 'hidden',
      }}
    >

      {/* ACCENT LINE */}
      <AccentLine />

      {/* BADGE */}
      {badge && (
        <div
          style={{
            position: 'absolute',

            top: '18px',

            right: '18px',

            background: badgeColor,

            color: '#fff',

            fontSize: '11px',

            fontWeight: 700,

            padding: '6px 10px',

            borderRadius: '999px',

            letterSpacing: '0.4px',

            textTransform:
              'uppercase',
          }}
        >
          {badge}
        </div>
      )}

      {/* TITLE */}
      <div
        style={{
          fontSize: '15px',

          color: 'var(--t-text-tertiary)',

          marginBottom: '10px',

          fontWeight: 600,

          letterSpacing: '0.2px',
        }}
      >
        {title}
      </div>

      {/* PRIMARY VALUE */}
      {value && (
        <div
          style={{
            fontSize: '32px',

            fontWeight: 700,

            color: 'var(--t-text-primary)',

            lineHeight: 1.1,

            marginBottom: '8px',
          }}
        >
          {value}
        </div>
      )}

      {/* TREND */}
      {trend && (
        <div
          style={{
            fontSize: '13px',

            fontWeight: 600,

            color: trendColor,

            marginBottom: '8px',
          }}
        >
          {trendDirection === 'up'
            ? '▲ '
            : trendDirection === 'down'
            ? '▼ '
            : ''}
          {trend}
        </div>
      )}

      {/* SUBTITLE */}
      {subtitle && (
        <div
          style={{
            fontSize: '13px',

            color: subtitleColor,

            marginBottom:
              metrics.length > 0
                ? '14px'
                : 0,
          }}
        >
          {subtitle}
        </div>
      )}

      {/* METRIC STACK */}
      {metrics.length > 0 && (
        <div
          style={{
            display: 'flex',

            flexDirection: 'column',

            gap: '10px',

            marginTop: '4px',
          }}
        >
          {metrics.map(
            (metric, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',

                  justifyContent:
                    'space-between',

                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',

                    color: '#6b7280',
                  }}
                >
                  {metric.label}
                </div>

                <div
                  style={{
                    fontSize: '13px',

                    fontWeight: 700,

                    color:
                      metric.color ||
                      '#111827',
                  }}
                >
                  {metric.value}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* CUSTOM CONTENT */}
      {customContent && (
        <div
          style={{
            marginTop:
              contentMode ===
              'metric-list'
                ? '16px'
                : '14px',
          }}
        >
          {customContent}
        </div>
      )}

      {/* FOOTER */}
      {footer && (
        <div
          style={{
            marginTop: 'auto',

            paddingTop: '14px',

            fontSize: '12px',

            color: footerColor,

            borderTop:
              '1px solid #f1f5f9',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}