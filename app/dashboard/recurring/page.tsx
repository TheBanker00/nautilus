'use client';

import React, { useMemo, useState } from 'react';
import { useTransactionData } from '../../lib/transactioncontext';
import { useDashboardTheme } from '../../lib/dashboardthemecontext';
import { RecurringClassification } from '../../lib/financialengine/cashflow/analytics/calculaterecurringtransactions';
import {
  buildAnnualCostRollup,
  detectSubscriptionOverlap,
  detectAnomalies,
} from '../../lib/financialengine/recurring/phase4insights';

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS — hardcoded hex to match tokens.css exactly.
   Inline styles use these directly so the page never depends
   on CSS variable resolution order.
───────────────────────────────────────────────────────────── */
const T = {
  // Surfaces — slightly deeper bg for better card contrast
  bg:            '#EDF0F7',
  surface:       '#FFFFFF',
  border:        '#E2E8F0',
  borderMed:     '#CBD5E1',
  shadowSm:      '0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',

  // Text — tertiary bumped up for WCAG legibility
  textPrimary:   '#0F172A',
  textSecondary: '#475569',
  textTertiary:  '#64748B',

  // Primary — royal blue
  primary:       '#0a3fa8',
  primaryBg:     'rgba(10,63,168,0.08)',
  primaryBorder: 'rgba(10,63,168,0.28)',

  // Green = income / healthy
  green:         '#16A34A',
  greenBg:       '#F0FDF4',
  greenBorder:   '#BBF7D0',
  greenText:     '#15803D',

  // Red = danger / alert
  red:           '#DC2626',
  redBg:         '#FEF2F2',
  redBorder:     '#FECACA',
  redText:       '#B91C1C',

  // Amber = attention / trial
  amber:         '#D97706',
  amberBg:       '#FFFBEB',
  amberBorder:   '#FDE68A',
  amberText:     '#B45309',

  // Teal = bills / neutral info
  teal:          '#0891B2',
  tealBg:        '#ECFEFF',
  tealBorder:    '#A5F3FC',
  tealText:      '#0E7490',

  // Purple = savings / opportunity
  purple:        '#7C3AED',
  purpleBg:      '#F5F3FF',
  purpleBorder:  '#DDD6FE',
  purpleText:    '#6D28D9',

  radius:        '10px',
  radiusSm:      '6px',
  radiusMd:      '8px',
};

/* ─────────────────────────────────────────────────────────────
   SMALL UI PRIMITIVES
───────────────────────────────────────────────────────────── */

type BadgeVariant = 'blue' | 'green' | 'red' | 'amber' | 'teal' | 'purple';

const BADGE_STYLES: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  blue:   { bg: 'var(--t-primary-bg)',  color: 'var(--t-primary)',    border: 'var(--t-primary-border)' },
  green:  { bg: 'var(--t-green-bg)',    color: 'var(--t-green-text)',   border: 'var(--t-green-border)' },
  red:    { bg: 'var(--t-red-bg)',      color: 'var(--t-red-text)',     border: 'var(--t-red-border)' },
  amber:  { bg: 'var(--t-amber-bg)',    color: 'var(--t-amber-text)',   border: 'var(--t-amber-border)' },
  teal:   { bg: 'var(--t-teal-bg)',     color: 'var(--t-teal-text)',    border: 'var(--t-teal-border)' },
  purple: { bg: 'var(--t-purple-bg)',   color: 'var(--t-purple-text)',  border: 'var(--t-purple-border)' },
};

function Badge({ label, variant }: { label: string; variant: BadgeVariant }) {
  const s = BADGE_STYLES[variant];
  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      fontSize:      10,
      fontWeight:    700,
      padding:       '2px 8px',
      borderRadius:  100,
      background:    s.bg,
      color:         s.color,
      border:        `1px solid ${s.border}`,
      whiteSpace:    'nowrap',
    }}>
      {label}
    </span>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--t-border)', margin: '12px 0' }} />;
}

const SECTION_DOT_COLOR: Record<string, string> = {
  Subscriptions:      'var(--t-primary)',
  Bills:              'var(--t-teal)',
  Income:             'var(--t-green)',
  'Likely Cancelled': 'var(--t-text-tertiary)',
};

function SectionLabel({ label, count }: { label: string; count?: number }) {
  const dotColor = SECTION_DOT_COLOR[label] ?? 'var(--t-primary)';
  return (
    <div style={{
      display:       'flex',
      alignItems:    'center',
      gap:           7,
      padding:       '12px 0 7px',
      fontSize:      10,
      fontWeight:    700,
      textTransform: 'uppercase',
      letterSpacing: '.07em',
      color:         'var(--t-text-secondary)',
    }}>
      {/* Colored dot accent */}
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      {label}{count !== undefined ? ` · ${count}` : ''}
      <div style={{ flex: 1, height: 1, background: 'var(--t-border)' }} />
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background:   'var(--t-surface)',
      border:       `1px solid var(--t-border)`,
      borderRadius: T.radius,
      boxShadow:    'var(--t-shadow-sm)',
      position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
      {children}
    </div>
  );
}

function CardHeader({ title, note, right }: { title: string; note?: string; right?: React.ReactNode }) {
  return (
    <div style={{
      display:        'flex',
      justifyContent: 'space-between',
      alignItems:     'center',
      padding:        '14px 20px 13px',
      borderBottom:   `1px solid var(--t-border)`,
      background:     'var(--t-surface-raised, var(--t-surface))',
      borderRadius:   `${T.radius} ${T.radius} 0 0`,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text-primary)', letterSpacing: '-.1px' }}>{title}</div>
        {note && <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 1 }}>{note}</div>}
      </div>
      {right}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────────────────────────── */

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtDec = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getMonthAbbr(monthIdx: number): string {
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][monthIdx];
}

/* ─────────────────────────────────────────────────────────────
   KPI STRIP
───────────────────────────────────────────────────────────── */

function KpiCard({
  label, value, sub, accentColor, pills,
}: {
  label:        string;
  value:        React.ReactNode;
  sub?:         string;
  accentColor:  string;
  pills?:       React.ReactNode;
}) {
  return (
    <div style={{
      background:    'var(--t-surface)',
      border:        `1px solid var(--t-border)`,
      borderLeft:    `4px solid ${accentColor}`,
      borderRadius:  T.radius,
      boxShadow:     'var(--t-shadow-sm)',
      padding:       '16px 16px 16px 14px',
      position:      'relative',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t-text-tertiary)', marginBottom: 9 }}>
        {label}
      </div>
      <div style={{ fontSize: 23, fontWeight: 800, color: 'var(--t-text-primary)', lineHeight: 1, letterSpacing: '-.5px', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 6 }}>{sub}</div>}
      {pills && <div style={{ display: 'flex', gap: 5, marginTop: 9, flexWrap: 'wrap' }}>{pills}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   RECURRING ROW
───────────────────────────────────────────────────────────── */

function tagFor(p: RecurringClassification): { label: string; variant: BadgeVariant } {
  if (p.isTrial)              return { label: '⏱ Trial',          variant: 'amber' };
  if ((p.cancellationScore ?? 0) >= 70) return { label: 'Likely cancelled', variant: 'red' };
  if (p.priceChange?.detected) return { label: `▲ Price +${p.priceChange.changePct}%`, variant: 'red' };
  if (p.transaction_type === 'Income') return { label: 'Active',           variant: 'green' };
  if (p.type === 'subscription')       return { label: 'Active',           variant: 'green' };
  return { label: 'Bill', variant: 'teal' };
}

function RecurringRow({
  pattern,
  dimmed,
}: {
  pattern: RecurringClassification;
  dimmed?: boolean;
}) {
  const tag         = tagFor(pattern);
  const isIncome    = pattern.transaction_type === 'Income';
  const amountColor = isIncome ? 'var(--t-green)' : 'var(--t-text-primary)';
  const amountSign  = isIncome ? '+' : '';
  const accountName = pattern.transactions[0]?.accountName ?? null;

  const initial = (pattern.merchant || '?')[0].toUpperCase();
  const logo = pattern.transactions[0]?.logo;

  return (
    <div style={{
      display:       'grid',
      gridTemplateColumns: '36px 180px 80px 100px 1fr 70px 80px 64px',
      alignItems:    'center',
      gap:           '0 12px',
      padding:       '9px 12px',
      borderRadius:  T.radiusMd,
      border:        `1px solid var(--t-border)`,
      marginBottom:  6,
      cursor:        'pointer',
      opacity:       dimmed ? 0.45 : 1,
      transition:    'border-color .15s, box-shadow .15s',
      background:    'var(--t-surface)',
    }}
      onMouseEnter={e => {
        if (!dimmed) { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--t-primary-border)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 2px 8px rgba(77,163,255,0.08)`; }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--t-border)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: isIncome ? 'rgba(22,163,74,0.15)' : 'rgba(77,163,255,0.15)',
        border:     `1.5px solid ${isIncome ? 'var(--t-green-border)' : 'var(--t-primary-border)'}`,
        display:    'flex', alignItems: 'center', justifyContent: 'center',
        fontSize:   13, fontWeight: 800,
        color:      isIncome ? 'var(--t-green)' : 'var(--t-primary)',
        overflow:   'hidden', flexShrink: 0,
      }}>
        {logo
          ? <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initial}
      </div>

      {/* Merchant */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {pattern.merchant}
      </div>

      {/* Frequency */}
      <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', whiteSpace: 'nowrap' }}>
        {capitalise(pattern.frequency)}
      </div>

      {/* Next date */}
      <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', whiteSpace: 'nowrap' }}>
        {pattern.nextExpectedDate ? `Next ${formatShortDate(pattern.nextExpectedDate)}` : '—'}
      </div>

      {/* Account */}
      <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {accountName ?? '—'}
      </div>

      {/* Badge */}
      <div><Badge label={tag.label} variant={tag.variant} /></div>

      {/* Monthly amount */}
      <div style={{ fontSize: 13, fontWeight: 700, color: amountColor, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', textAlign: 'right' }}>
        {amountSign}{fmtDec.format(pattern.expectedAmount)}
        <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t-text-tertiary)' }}>/mo</span>
      </div>

      {/* Annual */}
      <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', textAlign: 'right' }}>
        {fmt.format(pattern.annualEquivalent)}/yr
      </div>
    </div>
  );
}

function capitalise(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function formatShortDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return `${getMonthAbbr(d.getMonth())} ${d.getDate()}`;
}

/* ─────────────────────────────────────────────────────────────
   PROJECTION CHART
───────────────────────────────────────────────────────────── */

function ProjectionChart({ rollup }: { rollup: ReturnType<typeof buildAnnualCostRollup> }) {
  const months = rollup.monthlyProjection;
  const maxIncome   = Math.max(...months.map(m => m.projectedIncome), 1);
  const maxExpenses = Math.max(...months.map(m => m.projectedExpenses), 1);
  const maxVal      = Math.max(maxIncome, maxExpenses);

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        {[['Income', 'var(--t-green)'], ['Expenses', 'var(--t-red)']].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--t-text-tertiary)' }}>
            <div style={{ width: 8, height: 8, background: color, borderRadius: 2, opacity: .7 }} />
            {label}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--t-text-tertiary)' }}>
          <div style={{ width: 8, height: 8, border: `1.5px dashed var(--t-text-tertiary)`, borderRadius: 2 }} />
          Forecast
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 88 }}>
        {months.map((m, i) => {
          const isForecast = i >= 6;
          const incomeH  = Math.round((m.projectedIncome   / maxVal) * 76);
          const expenseH = Math.round((m.projectedExpenses / maxVal) * 76);
          const [, month] = m.month.split('-');
          const monthName = getMonthAbbr(parseInt(month) - 1);

          return (
            <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, opacity: isForecast ? 0.45 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, width: '100%', justifyContent: 'center', height: 76 }}>
                <div style={{
                  width: '45%', height: incomeH, borderRadius: '3px 3px 0 0',
                  background: `rgba(22,163,74,${isForecast ? '.3' : '.5'})`,
                  border: isForecast ? `1.5px dashed rgba(22,163,74,.6)` : 'none',
                }} />
                <div style={{
                  width: '45%', height: expenseH, borderRadius: '3px 3px 0 0',
                  background: `rgba(220,38,38,${isForecast ? '.25' : '.4'})`,
                  border: isForecast ? `1.5px dashed rgba(220,38,38,.5)` : 'none',
                }} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--t-text-tertiary)', whiteSpace: 'nowrap' }}>
                {monthName}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CONFIDENCE DISTRIBUTION
───────────────────────────────────────────────────────────── */

function ConfidenceChart({ patterns }: { patterns: RecurringClassification[] }) {
  const high   = patterns.filter(p => p.confidence >= 80).length;
  const medium = patterns.filter(p => p.confidence >= 50 && p.confidence < 80).length;
  const low    = patterns.filter(p => p.confidence < 50).length;
  const total  = patterns.length || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[
        { label: 'High  80–100%',  count: high,   color: 'var(--t-green)',  pct: high   / total },
        { label: 'Medium  50–79%', count: medium, color: 'var(--t-amber)',  pct: medium / total },
        { label: 'Low  < 50%',     count: low,    color: 'var(--t-red)',    pct: low    / total },
      ].map(({ label, count, color, pct }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--t-text-secondary)', flex: 1 }}>{label}</div>
          <div style={{ width: 80, height: 6, background: `#EDF0F7`, borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ width: `${Math.round(pct * 100)}%`, height: '100%', background: color, borderRadius: 3, opacity: 0.85 }} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-primary)', width: 20, textAlign: 'right', flexShrink: 0 }}>{count}</div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ANNUAL DONUT
───────────────────────────────────────────────────────────── */

const DONUT_COLORS = ['var(--t-primary)', 'var(--t-teal)', 'var(--t-amber)', 'var(--t-purple)', '#94A3B8'];

function AnnualDonut({ rollup }: { rollup: ReturnType<typeof buildAnnualCostRollup> }) {
  const cats    = rollup.byCategory.slice(0, 5);
  const total   = rollup.totalAnnualRecurringExpenses || 1;
  const circum  = 2 * Math.PI * 34;
  let offset    = 0;

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <svg width={88} height={88} viewBox="0 0 88 88" style={{ flexShrink: 0 }}>
        <circle cx={44} cy={44} r={34} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth={13} />
        {cats.map((cat, i) => {
          const pct  = cat.annualCost / total;
          const dash = pct * circum;
          const seg  = (
            <circle key={cat.category} cx={44} cy={44} r={34} fill="none"
              stroke={DONUT_COLORS[i]} strokeWidth={13}
              strokeDasharray={`${dash} ${circum - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 44 44)"
            />
          );
          offset += dash;
          return seg;
        })}
        <text x={44} y={48} textAnchor="middle" fontSize={10} fontWeight={700} fill={'var(--t-text-primary)'}>
          {fmt.format(rollup.totalAnnualRecurringExpenses)}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
        {cats.map((cat, i) => (
          <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: DONUT_COLORS[i], flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--t-text-secondary)', flex: 1 }}>{cat.category || 'Other'}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-primary)' }}>{fmt.format(cat.annualCost)}</span>
          </div>
        ))}
        {cats.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)' }}>No data yet</div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DUE THIS MONTH
───────────────────────────────────────────────────────────── */

function BillsNext2Weeks({ patterns }: { patterns: RecurringClassification[] }) {
  const now      = new Date();
  const window14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const upcoming = patterns
    .filter(p => p.isActive && p.nextExpectedDate && p.transaction_type === 'Expense')
    .map(p => ({ p, date: parseLocalDate(p.nextExpectedDate!) }))
    .filter(({ date }) => date >= now && date <= window14)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 7);

  const total14 = upcoming.reduce((sum, { p }) => sum + p.expectedAmount, 0);

  return (
    <div>
      {upcoming.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', padding: '8px 0' }}>
          No bills due in the next 14 days.
        </div>
      )}
      {upcoming.map(({ p, date }) => (
          <div key={`${p.merchantKey}-${p.firstSeenDate}`} style={{
            display:       'flex',
            alignItems:    'center',
            gap:           8,
            padding:       '7px 0',
            borderBottom:  `1px solid var(--t-border)`,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(77,163,255,0.12)',
              border:     `1.5px solid var(--t-primary-border)`,
              display:    'flex', alignItems: 'center', justifyContent: 'center',
              fontSize:   11, fontWeight: 800,
              color:      'var(--t-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {date.getDate()}
            </div>
            <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--t-text-primary)' }}>{p.merchant}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-red)', fontVariantNumeric: 'tabular-nums' }}>
              −{fmtDec.format(p.expectedAmount)}
            </div>
          </div>
      ))}
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--t-text-tertiary)' }}>Upcoming 14-day total</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--t-red)', fontVariantNumeric: 'tabular-nums' }}>
          −{fmt.format(total14)}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   INCOME STABILITY WIDGET
───────────────────────────────────────────────────────────── */

function IncomeStability({ patterns }: { patterns: RecurringClassification[] }) {
  const incomePatterns = patterns.filter(p => p.transaction_type === 'Income' && p.isActive);
  const totalYtd       = incomePatterns.reduce((s, p) => s + p.totalValue, 0);
  const primary        = incomePatterns[0];
  const concentrationRisk = primary && totalYtd > 0
    ? Math.round((primary.totalValue / totalYtd) * 100)
    : 0;

  return (
    <div>
      {incomePatterns.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)' }}>No recurring income detected yet.</div>
      )}
      {incomePatterns.map(p => {
        const score     = p.cadenceStabilityScore;
        const color     = score >= 75 ? 'var(--t-green)' : score >= 50 ? 'var(--t-amber)' : 'var(--t-red)';
        const stability = score >= 75 ? 'Stable' : score >= 50 ? 'Variable' : 'Volatile';
        return (
          <div key={`${p.merchantKey}-${p.firstSeenDate}`} style={{
            display:       'flex',
            alignItems:    'center',
            gap:           10,
            padding:       '10px 12px',
            borderRadius:  T.radiusMd,
            background:    score >= 75 ? 'var(--t-green-bg)' : 'var(--t-amber-bg)',
            border:        `1px solid ${score >= 75 ? 'var(--t-green-border)' : 'var(--t-amber-border)'}`,
            marginBottom:  7,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text-primary)' }}>{p.merchant} · {capitalise(p.frequency)}</div>
              <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color }}>{fmt.format(p.expectedAmount)}</div>
              <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)' }}>{score}% {stability}</div>
            </div>
          </div>
        );
      })}

      {incomePatterns.length > 0 && (
        <>
          <Divider />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', marginBottom: 2 }}>Concentration risk</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: concentrationRisk > 80 ? 'var(--t-amber)' : 'var(--t-green)' }}>
                {concentrationRisk}% from 1 source
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', marginBottom: 2 }}>Full analysis</div>
              <div style={{ fontSize: 11, color: 'var(--t-primary)', cursor: 'pointer', fontWeight: 500 }}>→ Income page</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   OVERLAP WIDGET
───────────────────────────────────────────────────────────── */

function OverlapPanel({ patterns }: { patterns: RecurringClassification[] }) {
  const { T: TH } = useDashboardTheme();
  const isDark = TH.isDark;

  const boxBg      = isDark ? 'rgba(46,211,198,0.07)'          : 'rgba(77,163,255,0.07)';
  const boxBorder  = isDark ? '1px solid rgba(46,211,198,0.18)' : '1px solid rgba(77,163,255,0.18)';
  const rowBg      = isDark ? 'rgba(46,211,198,0.04)'          : 'rgba(10,63,168,0.04)';
  const rowBorder  = isDark ? '1px solid rgba(46,211,198,0.10)' : '1px solid rgba(10,63,168,0.08)';
  const accentColor = isDark ? '#2ED3C6' : '#0a3fa8';
  const savingColor = isDark ? '#34D399' : '#059669';

  // Group active subscriptions by normalized merchant key
  const duplicateGroups = useMemo(() => {
    const active = patterns.filter(p => p.isSubscription && p.isActive);
    const byKey = new Map<string, RecurringClassification[]>();
    active.forEach(p => {
      byKey.set(p.merchantKey, [...(byKey.get(p.merchantKey) ?? []), p]);
    });
    return Array.from(byKey.values()).filter(g => g.length >= 2);
  }, [patterns]);

  const totalSavingsPerYear = useMemo(() =>
    duplicateGroups.reduce((sum, g) => {
      const cheapest = Math.min(...g.map(p => p.monthlyEquivalent));
      return sum + (g.reduce((s, p) => s + p.monthlyEquivalent, 0) - cheapest) * 12;
    }, 0),
  [duplicateGroups]);

  if (duplicateGroups.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: savingColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>✓</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-text-primary)' }}>No duplicates detected</div>
          <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)' }}>All subscriptions look unique</div>
        </div>
      </div>
    );
  }

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {duplicateGroups.map(group => {
        const cheapest  = Math.min(...group.map(p => p.monthlyEquivalent));
        const totalMo   = group.reduce((s, p) => s + p.monthlyEquivalent, 0);
        const savePerYr = (totalMo - cheapest) * 12;

        return (
          <div key={group[0].merchantKey} style={{
            background: boxBg, border: boxBorder, borderRadius: T.radiusMd, overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              padding: '8px 12px 6px',
              borderBottom: rowBorder,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: accentColor }}>
                Duplicate Detected · {group.length}×
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: savingColor }}>
                Save {fmt.format(savePerYr)}/yr
              </div>
            </div>

            {/* Pattern rows */}
            {group.map((p, i) => {
              const letter = p.merchant.charAt(0).toUpperCase();
              const avatarColor = isDark ? '#2ED3C6' : '#0a3fa8';
              const pLogo = p.transactions[0]?.logo;
              return (
                <div key={`${p.merchantKey}-${p.firstSeenDate}`} style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 160px 68px 90px 120px 1fr 70px',
                  alignItems: 'center',
                  gap: '0 10px',
                  padding: '8px 12px',
                  background: rowBg,
                  borderBottom: i < group.length - 1 ? rowBorder : 'none',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: avatarColor + '22',
                    border: `1px solid ${avatarColor}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: avatarColor,
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    {pLogo
                      ? <img src={pLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : letter}
                  </div>

                  {/* Merchant */}
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.merchant}
                  </div>

                  {/* Frequency */}
                  <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                    {p.frequency}
                  </div>

                  {/* Next date */}
                  <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', whiteSpace: 'nowrap' }}>
                    Next {fmtDate(p.nextExpectedDate)}
                  </div>

                  {/* Account */}
                  <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.transactions[0]?.accountName ?? '—'}
                  </div>

                  {/* Spacer */}
                  <div />

                  {/* Amount */}
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text-primary)', whiteSpace: 'nowrap', textAlign: 'right' }}>
                    {fmt.format(p.monthlyEquivalent)}<span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t-text-tertiary)' }}>/mo</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Total savings footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 12px', background: boxBg, border: boxBorder, borderRadius: T.radiusMd,
      }}>
        <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)' }}>Total recoverable</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: savingColor }}>
          {fmt.format(totalSavingsPerYear)}/yr
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ALERTS PANEL
───────────────────────────────────────────────────────────── */

function AlertsPanel({ patterns, transactions }: {
  patterns: RecurringClassification[];
  transactions: ReturnType<typeof useTransactionData>['transactions'];
}) {
  const { T: TH } = useDashboardTheme();
  const isDark = TH.isDark;

  const report = useMemo(
    () => detectAnomalies(transactions as any, patterns),
    [transactions, patterns]
  );

  const ALERT_STYLES: Record<string, { accent: string; pillBg: string; label: string }> = {
    high:   {
      accent: isDark ? '#F87171' : '#DC2626',
      pillBg: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)',
      label:  'Alert',
    },
    medium: {
      accent: isDark ? '#FCD34D' : '#D97706',
      pillBg: isDark ? 'rgba(252,211,77,0.12)' : 'rgba(217,119,6,0.08)',
      label:  'Warning',
    },
    low: {
      accent: isDark ? '#4DA3FF' : '#0a3fa8',
      pillBg: isDark ? 'rgba(77,163,255,0.12)' : 'rgba(10,63,168,0.08)',
      label:  'Note',
    },
  };

  if (report.totalFlagged === 0) {
    return (
      <div style={{
        padding: '12px 14px', borderRadius: T.radiusMd,
        background: 'var(--t-surface)', border: `1px solid var(--t-border)`,
        borderLeft: `3px solid var(--t-green)`,
        fontSize: 12, color: 'var(--t-green)', fontWeight: 600,
      }}>
        ✓ No anomalies detected
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {report.anomalies.slice(0, 4).map((a, i) => {
        const s = ALERT_STYLES[a.severity] ?? ALERT_STYLES.low;
        return (
          <div key={i} style={{
            background:   'var(--t-surface)',
            border:       `1px solid var(--t-border)`,
            borderLeft:   `3px solid ${s.accent}`,
            borderRadius: T.radiusMd,
            padding:      '8px 12px',
          }}>
            {/* Line 1: pill · type — merchant */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'nowrap', overflow: 'hidden' }}>
              <span style={{
                fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.09em', color: s.accent, flexShrink: 0,
                background: s.pillBg, padding: '1px 6px', borderRadius: 20,
              }}>
                {s.label}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} — {a.merchant}
              </span>
            </div>
            {/* Line 2: description */}
            <div style={{ fontSize: 11, color: 'var(--t-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.description}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */

type TabFilter = 'all' | 'subscriptions' | 'bills' | 'income';

function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320, flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 32, height: 32, border: `3px solid #E2E8F0`, borderTop: `3px solid #0a3fa8`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: 13, color: '#64748B' }}>Loading transactions…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function RecurringPage() {
  const { transactions, recurringPatterns, loading, error } = useTransactionData();
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  /* ── Derived data — hooks must be called before any early returns ── */
  const rollup  = useMemo(() => buildAnnualCostRollup(recurringPatterns), [recurringPatterns]);
  const overlap = useMemo(() => detectSubscriptionOverlap(recurringPatterns), [recurringPatterns]);
  const anomaly = useMemo(() => detectAnomalies(transactions as any, recurringPatterns), [transactions, recurringPatterns]);

  const activePatterns    = useMemo(() => recurringPatterns.filter(p => p.isActive && p.type !== 'one_time'), [recurringPatterns]);
  const subscriptions     = useMemo(() => activePatterns.filter(p => p.isSubscription && p.transaction_type === 'Expense'), [activePatterns]);
  const bills             = useMemo(() => activePatterns.filter(p => !p.isSubscription && p.transaction_type === 'Expense'), [activePatterns]);
  const incomePatterns    = useMemo(() => activePatterns.filter(p => p.transaction_type === 'Income'), [activePatterns]);
  const cancelledPatterns = useMemo(() => recurringPatterns.filter(p => !p.isActive && (p.cancellationScore ?? 0) >= 70), [recurringPatterns]);

  const monthlyExpenses  = useMemo(() => activePatterns.filter(p => p.transaction_type === 'Expense').reduce((s, p) => s + p.monthlyEquivalent, 0), [activePatterns]);
  const monthlyIncome    = useMemo(() => incomePatterns.reduce((s, p) => s + p.monthlyEquivalent, 0), [incomePatterns]);
  const netRecurring     = useMemo(() => monthlyIncome - monthlyExpenses, [monthlyIncome, monthlyExpenses]);
  const potentialSavings = useMemo(() => overlap.totalRedundantMonthly + cancelledPatterns.reduce((s, p) => s + p.monthlyEquivalent, 0), [overlap, cancelledPatterns]);

  const filteredPatterns = useMemo(() => {
    if (activeTab === 'subscriptions') return subscriptions;
    if (activeTab === 'bills')         return bills;
    if (activeTab === 'income')        return incomePatterns;
    return activePatterns;
  }, [activeTab, activePatterns, subscriptions, bills, incomePatterns]);

  if (loading) return <LoadingState />;
  if (error)   return <div style={{ padding: 32, color: '#DC2626', fontSize: 13 }}>Error loading transactions: {error}</div>;

  const tabs: { id: TabFilter; label: string }[] = [
    { id: 'all',           label: 'All' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'bills',         label: 'Bills' },
    { id: 'income',        label: 'Income' },
  ];

  return (
    <div>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t-text-primary)', margin: 0, letterSpacing: '-.4px' }}>
            Subscriptions & Monthly Bills
          </h1>

        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Tab bar */}
          <div style={{
            display: 'flex', gap: 2,
            background: 'var(--t-bg)', border: `1px solid var(--t-border)`,
            borderRadius: T.radiusMd, padding: 3, marginRight: 8,
          }}>
            {tabs.map(tab => (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding:      '5px 13px',
                  borderRadius: T.radiusSm,
                  fontSize:     12,
                  fontWeight:   activeTab === tab.id ? 600 : 500,
                  color:        activeTab === tab.id ? 'var(--t-primary)' : 'var(--t-text-tertiary)',
                  background:   activeTab === tab.id ? 'var(--t-surface)' : 'transparent',
                  border:       'none',
                  cursor:       'pointer',
                  boxShadow:    activeTab === tab.id ? 'var(--t-shadow-sm)' : 'none',
                  transition:   'all .15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button style={{
            padding: '7px 14px', borderRadius: T.radiusMd, fontSize: 12, fontWeight: 600,
            background: 'var(--t-surface)', color: 'var(--t-text-secondary)',
            border: `1px solid var(--t-border-med)`, cursor: 'pointer',
          }}>
            Export
          </button>
          {/* Electric blue primary button — matches sign-in */}
          <button style={{
            padding:      '7px 14px',
            borderRadius: T.radiusMd,
            fontSize:     12,
            fontWeight:   600,
            background:   'var(--t-primary)',
            color:        '#fff',
            border:       'none',
            cursor:       'pointer',
            boxShadow:    '0 1px 4px rgba(77,163,255,0.35)',
          }}>
            Run Analysis
          </button>
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard
          label="Recurring Expenses"
          value={<>{fmt.format(monthlyExpenses)}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--t-text-tertiary)' }}>/mo</span></>}
          sub={`${activePatterns.filter(p=>p.transaction_type==='Expense').length} active patterns`}
          accentColor={'var(--t-primary)'}
          pills={<>
            <Badge label={`${bills.length} Bills`}         variant="teal" />
            <Badge label={`${subscriptions.length} Subs`} variant="blue" />
          </>}
        />
        <KpiCard
          label="Recurring Income"
          value={<span style={{ color: 'var(--t-green)' }}>{fmt.format(monthlyIncome)}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--t-text-tertiary)' }}>/mo</span></span>}
          sub={`${incomePatterns.length} income source${incomePatterns.length !== 1 ? 's' : ''}`}
          accentColor={'var(--t-green)'}
          pills={<Badge label={incomePatterns[0] ? `${incomePatterns[0].cadenceStabilityScore}% Stable` : 'No data'} variant="green" />}
        />
        <KpiCard
          label="Net Recurring"
          value={<span style={{ color: netRecurring >= 0 ? 'var(--t-teal)' : 'var(--t-red)' }}>
            {netRecurring >= 0 ? '+' : ''}{fmt.format(netRecurring)}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--t-text-tertiary)' }}>/mo</span>
          </span>}
          sub="After all committed costs"
          accentColor={'var(--t-teal)'}
          pills={<Badge label={`${fmt.format(netRecurring * 12)}/yr net`} variant="teal" />}
        />
        <KpiCard
          label="Alerts"
          value={<span style={{ color: anomaly.totalFlagged > 0 ? 'var(--t-red)' : 'var(--t-green)' }}>{anomaly.totalFlagged}</span>}
          sub={anomaly.totalFlagged > 0 ? 'Needs your attention' : 'All clear'}
          accentColor={anomaly.totalFlagged > 0 ? 'var(--t-red)' : 'var(--t-green)'}
          pills={anomaly.totalFlagged > 0 ? <>
            {anomaly.highCount   > 0 && <Badge label={`${anomaly.highCount} High`}   variant="red" />}
            {anomaly.mediumCount > 0 && <Badge label={`${anomaly.mediumCount} Medium`} variant="amber" />}
          </> : <Badge label="No issues" variant="green" />}
        />
        <KpiCard
          label="Potential Savings"
          value={<span style={{ color: 'var(--t-purple)' }}>{fmt.format(potentialSavings)}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--t-text-tertiary)' }}>/mo</span></span>}
          sub={`${fmt.format(potentialSavings * 12)}/yr recoverable`}
          accentColor={'var(--t-purple)'}
          pills={overlap.overlaps.length > 0 ? <Badge label={`${overlap.overlaps.length} overlaps`} variant="purple" /> : undefined}
        />
      </div>

      {/* ── DUPLICATE + ALERTS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Duplicate Subscription Detection */}
        <Card>
          <CardHeader
            title="Duplicate Subscription Detection"
            right={overlap.overlaps.length > 0
              ? <Badge label={`${overlap.overlaps.length} found`} variant="amber" />
              : undefined
            }
          />
          <div style={{ padding: '12px 16px' }}>
            <OverlapPanel patterns={recurringPatterns} />
          </div>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader
            title="Alerts"
            right={anomaly.totalFlagged > 0
              ? <Badge label={`${anomaly.totalFlagged} open`} variant="red" />
              : <Badge label="All clear" variant="green" />
            }
          />
          <div style={{ padding: '12px 16px' }}>
            <AlertsPanel patterns={recurringPatterns} transactions={transactions} />
          </div>
        </Card>

      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, marginBottom: 16 }}>

        {/* LEFT */}
        <div>
          {/* Recurring List */}
          <Card style={{ marginBottom: 16 }}>
            <CardHeader
              title="Active Recurring"
              note="sorted by annual cost"
            />
            <div style={{ padding: '12px 16px' }}>
              {activeTab !== 'income' && activeTab !== 'bills' && subscriptions.length > 0 && (
                <>
                  <SectionLabel label="Subscriptions" count={subscriptions.length} />
                  {subscriptions.map(p => (
                    <RecurringRow key={`${p.merchantKey}-${p.firstSeenDate}`} pattern={p} />
                  ))}
                </>
              )}

              {(activeTab === 'bills' || activeTab === 'all') && bills.length > 0 && (
                <>
                  <SectionLabel label="Bills" count={bills.length} />
                  {bills.map(p => (
                    <RecurringRow key={`${p.merchantKey}-${p.firstSeenDate}`} pattern={p} />
                  ))}
                </>
              )}

              {(activeTab === 'income' || activeTab === 'all') && incomePatterns.length > 0 && (
                <>
                  <SectionLabel label="Income" count={incomePatterns.length} />
                  {incomePatterns.map(p => (
                    <RecurringRow key={`${p.merchantKey}-${p.firstSeenDate}`} pattern={p} />
                  ))}
                </>
              )}

              {/* Likely cancelled — always show in 'all' tab */}
              {activeTab === 'all' && cancelledPatterns.length > 0 && (
                <>
                  <SectionLabel label="Likely Cancelled" count={cancelledPatterns.length} />
                  {cancelledPatterns.map(p => (
                    <RecurringRow key={`${p.merchantKey}-${p.firstSeenDate}`} pattern={p} dimmed />
                  ))}
                </>
              )}

              {filteredPatterns.length === 0 && (
                <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: 'var(--t-text-tertiary)' }}>
                  No recurring patterns detected yet. Add more transaction history for the engine to learn from.
                </div>
              )}
            </div>
          </Card>

          {/* Projection Chart */}
          <Card>
            <CardHeader
              title="12-Month Projection"
              note="solid = confirmed · outlined = forecast"
            />
            <div style={{ padding: '16px 20px' }}>
              <ProjectionChart rollup={rollup} />
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Bills Next 2 Weeks */}
          <Card>
            <CardHeader
              title="Bills Next 2 Weeks"
              note="next 14 days · expenses only"
            />
            <div style={{ padding: '12px 16px' }}>
              <BillsNext2Weeks patterns={recurringPatterns} />
            </div>
          </Card>

          {/* Annual Committed by Category */}
          <Card>
            <CardHeader title="Annual Committed by Category" />
            <div style={{ padding: '16px 20px' }}>
              <AnnualDonut rollup={rollup} />
            </div>
          </Card>

          {/* Recurring Income */}
          <Card>
            <CardHeader title="Recurring Income" note="stability · concentration risk" />
            <div style={{ padding: '16px 20px' }}>
              <IncomeStability patterns={recurringPatterns} />
            </div>
          </Card>

          {/* Detection Confidence */}
          <Card>
            <CardHeader title="Detection Confidence" />
            <div style={{ padding: '16px 20px' }}>
              <ConfidenceChart patterns={recurringPatterns} />
              <Divider />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', marginBottom: 2 }}>Avg confidence</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t-text-primary)' }}>
                    {recurringPatterns.length > 0
                      ? `${Math.round(recurringPatterns.reduce((s, p) => s + p.confidence, 0) / recurringPatterns.length)}%`
                      : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', marginBottom: 2 }}>Total tracked</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t-text-primary)' }}>{recurringPatterns.length}</div>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
