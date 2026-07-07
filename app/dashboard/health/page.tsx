'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { useFinancialData as useWealthData } from '../../lib/financialdatacontext';
import { useDashboardTheme } from '../../lib/dashboardthemecontext';
import { useFinancialData as useFlowData }   from '../../lib/hooks/usefinancialdata';
import { useUserProfile } from '../../lib/hooks/useuserprofile';

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
  shadowLg:      '0 8px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
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

function AccentLine() {
  const { T: TH } = useDashboardTheme();
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
      background: TH.isDark
        ? 'linear-gradient(90deg, transparent, #2ED3C6, #67E6D5, #2ED3C6, transparent)'
        : 'linear-gradient(90deg, transparent, #0a3fa8, #4da3ff, #0a3fa8, transparent)',
    }} />
  );
}
const ACCENT_LINE = <AccentLine />;

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface HealthProfile { currentAge: number; retirementAge: number; }
interface ScoreSnapshot { date: string; score: number; }

interface ComponentScore {
  key: string; name: string; question: string;
  weight: number; score: number;
  color: string; grade: string; label: string;
  insight: string;
  subMetrics: { label: string; value: string; status: 'good'|'ok'|'warn'|'bad' }[];
}

interface ImprovementAction {
  title: string; detail: string;
  scoreImpact: number; secondaryImpact: string;
  priority: 'critical'|'high'|'medium';
  color: string; icon: string;
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const PROFILE_KEY  = 'wl_health_profile';
const HISTORY_KEY  = 'wl_score_history';

const FIDELITY_BENCHMARKS: [number, number][] = [
  [25, 0.25], [30, 1], [35, 2], [40, 3],
  [45, 4.5],  [50, 6], [55, 7], [60, 8], [65, 10],
];

const DISCRETIONARY_CATS = new Set([
  'Entertainment','Dining','Dining & Restaurants','Shopping',
  'Travel','Personal Care','Subscriptions',
]);

/* ─────────────────────────────────────────────────────────────
   SCORE ENGINE
───────────────────────────────────────────────────────────── */
function clamp(v: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, Math.round(v)));
}

function scoreGrade(s: number): { grade: string; label: string; color: string } {
  if (s >= 90) return { grade: 'A+', label: 'Exceptional',  color: 'var(--t-green)'   };
  if (s >= 80) return { grade: 'A',  label: 'Excellent',    color: 'var(--t-green)'   };
  if (s >= 70) return { grade: 'B+', label: 'Strong',       color: 'var(--t-primary)' };
  if (s >= 60) return { grade: 'B',  label: 'Good',         color: 'var(--t-teal)'    };
  if (s >= 50) return { grade: 'C',  label: 'Fair',         color: 'var(--t-amber)'   };
  if (s >= 40) return { grade: 'D',  label: 'Needs Work',   color: 'var(--t-amber)'   };
  return             { grade: 'F',  label: 'Critical',      color: 'var(--t-red)'     };
}

function scoreToPercentile(score: number): number {
  if (score >= 92) return 3;
  if (score >= 87) return 8;
  if (score >= 82) return 16;
  if (score >= 76) return 27;
  if (score >= 70) return 38;
  if (score >= 63) return 50;
  if (score >= 55) return 63;
  if (score >= 45) return 75;
  if (score >= 35) return 85;
  return 93;
}

function scoreCashFlow(savingsRate: number): number {
  if (savingsRate >= 0.25) return 98;
  if (savingsRate >= 0.20) return 85 + (savingsRate - 0.20) / 0.05 * 13;
  if (savingsRate >= 0.15) return 70 + (savingsRate - 0.15) / 0.05 * 15;
  if (savingsRate >= 0.10) return 52 + (savingsRate - 0.10) / 0.05 * 18;
  if (savingsRate >= 0.05) return 30 + (savingsRate - 0.05) / 0.05 * 22;
  if (savingsRate >= 0)    return savingsRate / 0.05 * 30;
  return clamp(10 + savingsRate * 50);
}

function scoreEmergency(months: number): number {
  if (months >= 9) return 100;
  if (months >= 6) return 85 + (months - 6) / 3 * 15;
  if (months >= 3) return 55 + (months - 3) / 3 * 30;
  if (months >= 1) return 22 + (months - 1) / 2 * 33;
  return clamp(months * 22);
}

function scoreRetirement(retBal: number, age: number, annualIncome: number): number {
  if (annualIncome <= 0) return 50;
  let benchmark = 0;
  for (let i = 0; i < FIDELITY_BENCHMARKS.length - 1; i++) {
    const [a0, m0] = FIDELITY_BENCHMARKS[i];
    const [a1, m1] = FIDELITY_BENCHMARKS[i + 1];
    if (age >= a0 && age <= a1) {
      benchmark = m0 + ((age - a0) / (a1 - a0)) * (m1 - m0);
      break;
    }
  }
  if (age < 25) benchmark = 0;
  if (age >= 65) benchmark = 10;
  const target = annualIncome * benchmark;
  if (target <= 0) return 75;
  const ratio = retBal / target;
  if (ratio >= 1.2) return 100;
  if (ratio >= 1.0) return 88 + (ratio - 1.0) / 0.2 * 12;
  if (ratio >= 0.75) return 70 + (ratio - 0.75) / 0.25 * 18;
  if (ratio >= 0.50) return 48 + (ratio - 0.50) / 0.25 * 22;
  if (ratio >= 0.25) return 24 + (ratio - 0.25) / 0.25 * 24;
  return clamp(ratio / 0.25 * 24);
}

interface DebtBreakdown {
  mortgage:    number;
  creditCard:  number;
  auto:        number;
  studentLoan: number;
  other:       number;  // personal loans, BNPL, etc.
}

/**
 * Estimates monthly minimum payment for each debt category using
 * conventional underwriting assumptions (used when actual payment data
 * is unavailable from liability_details).
 */
function estimateMonthlyPayments(d: DebtBreakdown): number {
  // mortgage:    30-yr amortisation at ~7% → factor ≈ 0.00665
  // credit card: 2.5% of balance (typical min payment floor)
  // auto:        5-yr term at ~7% → factor ≈ 0.0198
  // student:     10-yr term at ~5% → factor ≈ 0.0106
  // other/personal: 3-yr term at ~12% → factor ≈ 0.0332
  return (
    d.mortgage   * 0.00665 +
    d.creditCard * 0.025   +
    d.auto       * 0.0198  +
    d.studentLoan* 0.0106  +
    d.other      * 0.0332
  );
}

// Age-bracket D/A thresholds — returns { excellent, veryGood, healthy, high } upper bounds
function getDAThresholds(age: number): { excellent: number; veryGood: number; healthy: number; high: number; bracket: string } {
  if (age < 35)  return { excellent: 0.30, veryGood: 0.50, healthy: 0.70, high: 0.90, bracket: 'Early Wealth Building (18–35)' };
  if (age < 50)  return { excellent: 0.20, veryGood: 0.40, healthy: 0.60, high: 0.80, bracket: 'Wealth Accumulation (35–50)' };
  if (age < 65)  return { excellent: 0.15, veryGood: 0.30, healthy: 0.45, high: 0.60, bracket: 'Pre-Retirement (50–65)' };
  return           { excellent: 0.10, veryGood: 0.20, healthy: 0.35, high: 0.50, bracket: 'Retirement (65+)' };
}

export function getDALabel(ratio: number, age: number): { label: string; color: string } {
  const t = getDAThresholds(age);
  if (ratio < t.excellent) return { label: 'Excellent',  color: '#4ADE80' };
  if (ratio < t.veryGood)  return { label: 'Very Good',  color: '#86EFAC' };
  if (ratio < t.healthy)   return { label: 'Healthy',    color: '#D4AF37' };
  if (ratio < t.high)      return { label: 'High',       color: '#FB923C' };
  return                          { label: 'Critical',   color: '#F87171' };
}

function scoreDebt(
  d: DebtBreakdown,
  totalAssets: number,
  annualIncome: number,
  age: number,
  actualMonthlyPayments?: number,
): number {
  const total = d.mortgage + d.creditCard + d.auto + d.studentLoan + d.other;
  if (total <= 0) return 100;

  /* ── 1. DEBT COVERAGE  (50%) ──────────────────────────────
     Monthly debt service as % of gross monthly income.
     Lenders use 28/36 rule; we grade more generously for mortgage-heavy debt. */
  const monthlyIncome   = annualIncome / 12;
  const monthlyPayments = actualMonthlyPayments ?? estimateMonthlyPayments(d);
  const dsr = monthlyIncome > 0 ? monthlyPayments / monthlyIncome : 1;
  let coverageScore: number;
  if      (dsr <= 0.10) coverageScore = 100;
  else if (dsr <= 0.20) coverageScore = 82 + (0.20 - dsr) / 0.10 * 18;
  else if (dsr <= 0.28) coverageScore = 65 + (0.28 - dsr) / 0.08 * 17;
  else if (dsr <= 0.36) coverageScore = 42 + (0.36 - dsr) / 0.08 * 23;
  else if (dsr <= 0.50) coverageScore = 18 + (0.50 - dsr) / 0.14 * 24;
  else                  coverageScore = Math.max(0, 18 - (dsr - 0.50) * 36);

  /* ── 2. DEBT-TO-ASSETS  (20%) — age-adjusted thresholds ───
     Uses life-stage brackets: expectations differ for a 28-year-old
     vs a 62-year-old. Score maps the ratio against bracket thresholds. */
  const t = getDAThresholds(age > 0 ? age : 35);
  const leverage = totalAssets > 0 ? total / totalAssets : 1;
  let leverageScore: number;
  if      (leverage <= t.excellent) leverageScore = 100;
  else if (leverage <= t.veryGood)  leverageScore = 80 + (t.veryGood  - leverage) / (t.veryGood  - t.excellent) * 20;
  else if (leverage <= t.healthy)   leverageScore = 55 + (t.healthy   - leverage) / (t.healthy   - t.veryGood)  * 25;
  else if (leverage <= t.high)      leverageScore = 28 + (t.high      - leverage) / (t.high      - t.healthy)   * 27;
  else                              leverageScore = Math.max(0, 28 - (leverage - t.high) / 0.20 * 28);

  /* ── 3. DEBT TYPE  (30%) ──────────────────────────────────
     Bad debt (high-rate, no asset backing) penalised heavily.
     Good debt (collateralised, tax-advantaged, low-rate) penalised lightly. */
  const badWeighted = (d.creditCard * 1.5 + d.other * 1.2) / total;
  const neutralW    = (d.auto * 0.6) / total;
  const goodW       = (d.mortgage * 0.2 + d.studentLoan * 0.3) / total;
  const typeScore   = clamp(100 - (badWeighted * 90 + neutralW * 35 + goodW * 12));

  return clamp(coverageScore * 0.50 + leverageScore * 0.20 + typeScore * 0.30);
}

function scoreNetWorth(nw: number, age: number, annualIncome: number): number {
  if (nw <= 0) return clamp(15 + nw / Math.max(1, annualIncome) * 10);
  if (age <= 0 || annualIncome <= 0) return 50;
  const target = (age * annualIncome) / 10;
  if (target <= 0) return 50;
  const ratio = nw / target;
  if (ratio >= 2.0) return 100;
  if (ratio >= 1.5) return 88 + (ratio - 1.5) / 0.5 * 12;
  if (ratio >= 1.0) return 72 + (ratio - 1.0) / 0.5 * 16;
  if (ratio >= 0.5) return 46 + (ratio - 0.5) / 0.5 * 26;
  return clamp(ratio / 0.5 * 46);
}

function scoreSpending(discretionaryPct: number): number {
  if (discretionaryPct <= 0.15) return 96;
  if (discretionaryPct <= 0.25) return 80 + (0.25 - discretionaryPct) / 0.10 * 16;
  if (discretionaryPct <= 0.40) return 58 + (0.40 - discretionaryPct) / 0.15 * 22;
  if (discretionaryPct <= 0.60) return 32 + (0.60 - discretionaryPct) / 0.20 * 26;
  return clamp(32 - (discretionaryPct - 0.60) * 80);
}

function scoreResilience(cashMonths: number, liabilities: number, annualIncome: number): number {
  const base  = cashMonths >= 6 ? 70 : cashMonths >= 3 ? 48 : cashMonths >= 1 ? 25 : 10;
  const ratio = annualIncome > 0 ? liabilities / annualIncome : 0;
  const bonus = ratio <= 0 ? 30 : ratio <= 1 ? 20 : ratio <= 2 ? 10 : 0;
  return clamp(base + bonus);
}

function scoreOrganization(accountCount: number, txnCount: number): number {
  const acct = Math.min(50, accountCount * 10);
  const txn  = Math.min(50, (txnCount / 10) * 5);
  return clamp(acct + txn);
}

/* ─────────────────────────────────────────────────────────────
   FINANCIAL FREEDOM ENGINE
───────────────────────────────────────────────────────────── */
function calcFIDate(
  currentNW: number, annualExpenses: number,
  monthlySavings: number, currentAge: number,
): { months: number; age: number; date: Date; fiNumber: number } {
  const fiNumber = annualExpenses * 25;
  const r        = 0.07 / 12;
  let nw         = currentNW;
  let months     = 0;
  while (nw < fiNumber && months < 720) {
    nw = nw * (1 + r) + Math.max(0, monthlySavings);
    months++;
  }
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return { months, age: currentAge + months / 12, date, fiNumber };
}

function addMonthsToDate(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/* ─────────────────────────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const fmtShort = (n: number) => {
  const abs = Math.abs(n), s = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${s}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${s}$${(abs / 1_000).toFixed(0)}K`;
  return `${s}$${Math.round(abs)}`;
};

const fmtY = (v: number) => {
  const abs = Math.abs(v), s = v < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${s}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${s}$${(abs / 1_000).toFixed(0)}K`;
  return `${s}$${v}`;
};

/* ─────────────────────────────────────────────────────────────
   SVG SCORE GAUGE
───────────────────────────────────────────────────────────── */
function ScoreGauge({ score, size = 220 }: { score: number; size?: number }) {
  const cx = size / 2, cy = size * 0.58;
  const r  = size * 0.40;
  const startAngle = -210, endAngle = 30; // 240° sweep
  const sweep = endAngle - startAngle;

  function polarToXY(angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(fromDeg: number, toDeg: number) {
    const s = polarToXY(fromDeg);
    const e = polarToXY(toDeg);
    const large = toDeg - fromDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const { color } = scoreGrade(score);
  const fillEnd = startAngle + (score / 100) * sweep;

  // Tick marks
  const ticks = [0, 20, 40, 60, 80, 100].map(v => {
    const a = startAngle + (v / 100) * sweep;
    const inner = polarToXY(a);
    const outer = { x: cx + (r + 12) * Math.cos((a * Math.PI) / 180), y: cy + (r + 12) * Math.sin((a * Math.PI) / 180) };
    const label = { x: cx + (r + 24) * Math.cos((a * Math.PI) / 180), y: cy + (r + 24) * Math.sin((a * Math.PI) / 180) };
    return { inner, outer, label, v };
  });

  // Needle
  const needleAngle = startAngle + (score / 100) * sweep;
  const needleTip   = polarToXY(needleAngle);

  return (
    <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`}>
      {/* Track */}
      <path d={arcPath(startAngle, endAngle)} fill="none" stroke={'var(--t-border)'} strokeWidth={18} strokeLinecap="round" />
      {/* Zone colors (faint) */}
      <path d={arcPath(startAngle, startAngle + sweep * 0.40)} fill="none" stroke="#FEE2E2" strokeWidth={18} strokeLinecap="round" />
      <path d={arcPath(startAngle + sweep * 0.40, startAngle + sweep * 0.65)} fill="none" stroke="#FEF9C3" strokeWidth={18} strokeLinecap="round" />
      <path d={arcPath(startAngle + sweep * 0.65, endAngle)} fill="none" stroke="#DCFCE7" strokeWidth={18} strokeLinecap="round" />
      {/* Fill */}
      <path d={arcPath(startAngle, fillEnd)} fill="none" stroke={color} strokeWidth={18} strokeLinecap="round" />
      {/* Ticks */}
      {ticks.map(({ inner, outer, label, v }) => (
        <g key={v}>
          <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={'var(--t-border-med)'} strokeWidth={1.5} />
          <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill={'var(--t-text-tertiary)'}>{v}</text>
        </g>
      ))}
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke={'var(--t-text-primary)'} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill={'var(--t-text-primary)'} />
      <circle cx={cx} cy={cy} r={3} fill={'var(--t-surface)'} />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   COMPONENT ROW (expandable)
───────────────────────────────────────────────────────────── */
function ComponentRow({ comp, expanded, onToggle }: {
  comp: ComponentScore; expanded: boolean; onToggle: () => void;
}) {
  const { color } = scoreGrade(comp.score);
  const statusColor = (s: ComponentScore['subMetrics'][0]['status']) =>
    s === 'good' ? 'var(--t-green)' : s === 'ok' ? 'var(--t-teal)' : s === 'warn' ? 'var(--t-amber)' : 'var(--t-red)';

  return (
    <div style={{ border: `1px solid var(--t-inner-box-border)`, borderRadius: T.radiusMd, overflow: 'hidden', marginBottom: 8, background: 'var(--t-inner-box-bg)' }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
        background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        {/* Score circle */}
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${color}18`, border: `2px solid ${color}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1 }}>{comp.score}</span>
        </div>
        {/* Name + bar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text-primary)' }}>{comp.name}</span>
            <span style={{ fontSize: 11, color: 'var(--t-text-tertiary)' }}>{comp.weight}% weight</span>
          </div>
          <div style={{ height: 6, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${comp.score}%`, background: color, borderRadius: 100, transition: 'width 0.6s ease' }} />
          </div>
        </div>
        {/* Grade + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ padding: '3px 9px', borderRadius: 100, background: `${color}18`, color, fontSize: 11, fontWeight: 700 }}>{comp.grade}</span>
          <svg width={12} height={12} viewBox="0 0 20 20" fill="none" stroke={'var(--t-text-tertiary)'} strokeWidth={2} style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
            <path d="M5 8l5 5 5-5" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 18px 16px', background: 'transparent' }}>
          <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', fontStyle: 'italic', marginBottom: 12, paddingTop: 12, borderTop: `1px solid var(--t-border)` }}>
            {comp.question}
          </div>
          {/* Sub-metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginBottom: 12 }}>
            {comp.subMetrics.map(m => (
              <div key={m.label} style={{ padding: '9px 12px', borderRadius: T.radiusMd, background: 'var(--t-inner-box-bg)', border: `1px solid var(--t-inner-box-border)` }}>
                <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', fontWeight: 600, marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: statusColor(m.status), fontVariantNumeric: 'tabular-nums' }}>{m.value}</div>
              </div>
            ))}
          </div>
          {/* Insight */}
          <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: `${color}0D`, border: `1px solid ${color}30`, borderRadius: T.radiusMd }}>
            <span style={{ color, flexShrink: 0 }}>💡</span>
            <span style={{ fontSize: 12, color: 'var(--t-text-secondary)', lineHeight: 1.55 }}>{comp.insight}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ACTION CARD
───────────────────────────────────────────────────────────── */
function ActionCard({ action, rank }: { action: ImprovementAction; rank: number }) {
  const priorityBg  = action.priority === 'critical' ? 'var(--t-red-bg)'  : action.priority === 'high' ? 'var(--t-amber-bg)'  : 'var(--t-primary-bg)';
  const priorityClr = action.priority === 'critical' ? 'var(--t-red)'    : action.priority === 'high' ? 'var(--t-amber)'    : 'var(--t-primary)';
  const priorityLbl = action.priority === 'critical' ? 'CRITICAL' : action.priority === 'high' ? 'HIGH IMPACT' : 'MEDIUM';

  return (
    <div style={{ background: 'var(--t-surface)', borderRadius: T.radiusMd, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '16px 18px', display: 'flex', gap: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${action.color}18`, border: `1.5px solid ${action.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
        {action.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text-primary)' }}>{rank}. {action.title}</div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
            <span style={{ padding: '2px 8px', borderRadius: 100, background: priorityBg, color: priorityClr, fontSize: 9, fontWeight: 800, letterSpacing: '0.05em' }}>{priorityLbl}</span>
            <span style={{ padding: '2px 8px', borderRadius: 100, background: 'var(--t-green-bg)', color: 'var(--t-green-text)', fontSize: 10, fontWeight: 700 }}>+{action.scoreImpact} pts</span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--t-text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>{action.detail}</div>
        <div style={{ fontSize: 11, color: action.color, fontWeight: 600 }}>{action.secondaryImpact}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CUSTOM TOOLTIP
───────────────────────────────────────────────────────────── */
function WealthTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--t-surface)', border: `1px solid var(--t-border)`, borderRadius: T.radiusMd, padding: '10px 14px', boxShadow: 'var(--t-shadow-md)' }}>
      <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
          <span style={{ fontSize: 11, color: p.color }}>{p.name}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function HealthScorePage() {
  const { T: TH } = useDashboardTheme();
  const headingColor = TH.isDark ? '#2ED3C6' : '#0a3fa8';
  const { currentSnapshot }                                                         = useWealthData();
  const { incomeAnalytics, expenseAnalytics, recurringTransactions, transactions, loading } = useFlowData();

  const { profile: userProfile, save: saveUserProfile } = useUserProfile();
  const [profile,      setProfile]      = useState<HealthProfile>({ currentAge: 35, retirementAge: 65 });
  const [profileSet,   setProfileSet]   = useState(false);
  const [scoreHistory, setScoreHistory] = useState<ScoreSnapshot[]>([]);
  const [mounted,      setMounted]      = useState(false);
  const [expanded,     setExpanded]     = useState<Record<string, boolean>>({});
  const [ffExtra,      setFfExtra]      = useState({ saveMore: 0, spendLess: 0 });

  /* ── hydrate from Supabase profile, then localStorage fallback ── */
  useEffect(() => {
    setMounted(true);
    try {
      const h = localStorage.getItem(HISTORY_KEY);
      if (h) setScoreHistory(JSON.parse(h));
    } catch {}
  }, []);

  useEffect(() => {
    if (userProfile.age != null) {
      setProfile(p => ({ ...p, currentAge: userProfile.age! }));
      setProfileSet(true);
    } else {
      try {
        const p = localStorage.getItem(PROFILE_KEY);
        if (p) { setProfile(JSON.parse(p)); setProfileSet(true); }
      } catch {}
    }
  }, [userProfile.age]);

  const saveProfile = useCallback((p: HealthProfile) => {
    setProfile(p);
    setProfileSet(true);
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
    // Persist age to Supabase user_profiles
    saveUserProfile({ age: p.currentAge });
  }, [saveUserProfile]);

  /* ── asset snapshot ── */
  const sumArr  = (arr: any[], f: string) => (arr ?? []).reduce((s: number, x: any) => s + Number(x[f] || 0), 0);
  const sumLiab = (arr?: { amount?: number }[]) => (arr ?? []).reduce((s, x) => s + (x.amount ?? 0), 0);

  const assets = useMemo(() => {
    const s = currentSnapshot;
    const cash        = sumArr(s?.bankAccounts       ?? [], 'balance');
    const investments = sumArr(s?.investmentAccounts ?? [], 'balance');
    const retirement  = sumArr(s?.retirementAccounts ?? [], 'balance');
    const realEstate  = sumArr(s?.realEstate         ?? [], 'value');
    const other       = sumArr(s?.otherAssets        ?? [], 'value');

    // Exclude primary residence from retirement-eligible real estate.
    // Taxonomy subtype value is 'primary residence' (lowercase, space-separated).
    // Name fallback covers mock data and any legacy records without a subtype.
    const isPrimaryResidence = (item: any) =>
      item.subtype === 'primary residence' ||
      /primary\s*residence/i.test(item.name ?? '');

    const nonPrimaryRealEstate = (s?.realEstate ?? [])
      .filter(item => !isPrimaryResidence(item))
      .reduce((sum: number, item: any) => sum + (item.value ?? 0), 0);

    // Broad retirement savings: all investable / liquidatable wealth (excl. primary home)
    const retirementSavings = cash + investments + retirement + nonPrimaryRealEstate;

    const liabilities = s
      ? sumLiab(s.liabilities.mortgage)    + sumLiab(s.liabilities.creditCard) +
        sumLiab(s.liabilities.auto)        + sumLiab(s.liabilities.studentLoan) +
        sumLiab(s.liabilities.other)
      : 0;
    const totalAssets = cash + investments + retirement + realEstate + other;
    const nw          = totalAssets - liabilities;
    // Liquid investable assets only — housing excluded because it can't fund monthly withdrawals
    const liquidAssets = cash + investments + retirement;
    return { cash, investments, retirement, retirementSavings, nonPrimaryRealEstate, realEstate, other, liabilities, totalAssets, nw, liquidAssets };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSnapshot]);

  /* ── cash flow ── */
  const avgIncome   = incomeAnalytics?.averageMonthlyIncome   ?? 0;
  const avgExpenses = expenseAnalytics?.averageMonthlyExpenses ?? 0;
  const surplus     = avgIncome - avgExpenses;
  const savingsRate = avgIncome > 0 ? surplus / avgIncome : 0;
  const annualIncome = avgIncome * 12;

  /* ── emergency fund months ── */
  const emergencyMonths = avgExpenses > 0 ? assets.cash / avgExpenses : 0;

  /* ── discretionary spending ── */
  const { discretionaryPct, subCount } = useMemo(() => {
    const active = (recurringTransactions ?? []).filter(r => r.isActive && r.transaction_type === 'Expense');
    const discTotal = active.filter(r => DISCRETIONARY_CATS.has(r.category ?? '')).reduce((s, r) => s + r.monthlyEquivalent, 0);
    const totalRec  = active.reduce((s, r) => s + r.monthlyEquivalent, 0);
    const subCount  = active.filter(r => r.type === 'subscription').length;
    return { discretionaryPct: totalRec > 0 ? discTotal / totalRec : 0, subCount };
  }, [recurringTransactions]);

  /* ── debt breakdown + monthly payments ── */
  const { debtBreakdown, monthlyDebtPayments } = useMemo(() => {
    const s = currentSnapshot;
    const debtBreakdown: DebtBreakdown = {
      mortgage:    sumLiab(s?.liabilities.mortgage),
      creditCard:  sumLiab(s?.liabilities.creditCard),
      auto:        sumLiab(s?.liabilities.auto),
      studentLoan: sumLiab(s?.liabilities.studentLoan),
      other:       sumLiab(s?.liabilities.other),
    };

    // Try to read actual monthly payments from recurring transactions.
    // Loan Payment transfers + Mortgage (Housing) expenses are the two taxonomy paths.
    const DEBT_PAYMENT_CATS = new Set(['Loan Payment', 'Housing']);
    const MORTGAGE_SUBCATS  = new Set(['Mortgage']);
    const LOAN_PAYMENT_SUBCATS = new Set([
      'Credit Card Payment', 'Auto Loan Payment', 'Student Loan Payment',
      'Personal Loan Payment', 'Other Loan Payment', 'Buy Now Pay Later Payment',
      'Cash Advance Payment',
    ]);

    const debtRecs = (recurringTransactions ?? []).filter(r => {
      if (!r.isActive) return false;
      const cat  = r.category    ?? '';
      const sub  = r.category ?? '';
      if (cat === 'Loan Payment') return true;
      if (cat === 'Housing' && MORTGAGE_SUBCATS.has(sub)) return true;
      return false;
    });

    const monthlyDebtPayments = debtRecs.length > 0
      ? debtRecs.reduce((s, r) => s + r.monthlyEquivalent, 0)
      : undefined;  // undefined → scoreDebt will use balance-based estimates

    return { debtBreakdown, monthlyDebtPayments };
  }, [currentSnapshot, recurringTransactions]);

  /* ── account + txn counts ── */
  const accountCount = useMemo(() => {
    const s = currentSnapshot;
    return (s?.bankAccounts?.length ?? 0) + (s?.investmentAccounts?.length ?? 0) +
           (s?.retirementAccounts?.length ?? 0) + (s?.realEstate?.length ?? 0);
  }, [currentSnapshot]);
  const txnCount = transactions?.length ?? 0;

  /* ── compute all component scores ── */
  const components: ComponentScore[] = useMemo(() => {
    const cf  = clamp(scoreCashFlow(savingsRate));
    const em  = clamp(scoreEmergency(emergencyMonths));
    const ret = clamp(scoreRetirement(assets.retirementSavings, profile.currentAge, annualIncome));
    const dbt = clamp(scoreDebt(debtBreakdown, assets.totalAssets, annualIncome, profile.currentAge, monthlyDebtPayments));
    const nw  = clamp(scoreNetWorth(assets.nw, profile.currentAge, annualIncome));
    const sp  = clamp(scoreSpending(discretionaryPct));
    const res = clamp(scoreResilience(emergencyMonths, assets.liabilities, annualIncome));
    const org = clamp(scoreOrganization(accountCount, txnCount));

    const g = (s: number) => scoreGrade(s);

    return [
      {
        key: 'cashflow', name: 'Cash Flow Health', weight: 20, score: cf,
        ...g(cf),
        question: 'Are you consistently creating surplus cash each month?',
        insight: cf >= 70
          ? `Strong — you save ${(savingsRate * 100).toFixed(1)}% of income. Keep this rate and you're building real wealth.`
          : savingsRate > 0
          ? `Your savings rate of ${(savingsRate * 100).toFixed(1)}% is below the 20% target. Each 5% improvement adds ~${fmtShort(avgIncome * 0.05 * 12)}/yr to your wealth.`
          : 'Expenses exceed income. This is the most urgent item to address — even small spending cuts compound significantly.',
        subMetrics: [
          { label: 'Savings Rate',        value: `${(savingsRate * 100).toFixed(1)}%`,     status: savingsRate >= 0.20 ? 'good' : savingsRate >= 0.10 ? 'ok' : savingsRate >= 0 ? 'warn' : 'bad' },
          { label: 'Monthly Surplus',     value: fmt(surplus),                              status: surplus >= 500 ? 'good' : surplus >= 0 ? 'ok' : 'bad' },
          { label: 'Avg Monthly Income',  value: fmt(avgIncome),                            status: 'ok' },
          { label: 'Avg Monthly Expenses',value: fmt(avgExpenses),                          status: avgExpenses < avgIncome ? 'good' : 'bad' },
        ],
      },
      {
        key: 'emergency', name: 'Emergency Preparedness', weight: 15, score: em,
        ...g(em),
        question: 'Could you survive an unexpected loss of income without financial crisis?',
        insight: emergencyMonths >= 6
          ? `Excellent — ${emergencyMonths.toFixed(1)} months of expenses in cash. You can weather most financial emergencies.`
          : `${emergencyMonths.toFixed(1)} months covered. Building to 6 months (${fmt(avgExpenses * 6 - assets.cash)} more) would add ${Math.round((scoreEmergency(6) - em))} points to this score.`,
        subMetrics: [
          { label: 'Cash Reserves',   value: fmtShort(assets.cash),                          status: assets.cash > 0 ? 'ok' : 'bad' },
          { label: 'Months Covered',  value: `${emergencyMonths.toFixed(1)} mo`,              status: emergencyMonths >= 6 ? 'good' : emergencyMonths >= 3 ? 'ok' : 'bad' },
          { label: '6-Month Target',  value: fmt(avgExpenses * 6),                     status: 'ok' },
          { label: 'Gap to Target',   value: fmt(Math.max(0, avgExpenses * 6 - assets.cash)), status: assets.cash >= avgExpenses * 6 ? 'good' : 'warn' },
        ],
      },
      {
        key: 'retirement', name: 'Retirement Readiness', weight: 20, score: ret,
        ...g(ret),
        question: 'Are you on track to maintain your lifestyle in retirement?',
        insight: !profileSet
          ? 'Set your age in the profile above to get an accurate retirement readiness score based on Fidelity benchmarks.'
          : ret >= 75
          ? `On track. Your total retirement-eligible wealth (cash + investments + retirement accounts + non-primary real estate) is well-positioned for age ${profile.currentAge}.`
          : `For age ${profile.currentAge}, the benchmark is ${FIDELITY_BENCHMARKS.find(([a]) => Math.abs(a - profile.currentAge) <= 5)?.[1] ?? '?'}× annual salary. Includes cash, brokerage, retirement accounts, and investment properties (excluding primary residence).`,
        subMetrics: [
          { label: 'Total Retirement Wealth', value: fmtShort(assets.retirementSavings),  status: assets.retirementSavings > annualIncome ? 'good' : 'ok' },
          { label: '401k / IRA',              value: fmtShort(assets.retirement),          status: assets.retirement > 0 ? 'good' : 'warn' },
          { label: 'Brokerage + Cash',        value: fmtShort(assets.investments + assets.cash), status: 'ok' },
          { label: 'Invest. Properties',      value: assets.nonPrimaryRealEstate > 0 ? fmtShort(assets.nonPrimaryRealEstate) : 'None', status: assets.nonPrimaryRealEstate > 0 ? 'good' : 'ok' },
          { label: 'Your Age',                value: profileSet ? `${profile.currentAge}` : '—', status: 'ok' },
          { label: 'Fidelity Target',         value: profileSet ? fmtShort(annualIncome * (FIDELITY_BENCHMARKS.find(([a]) => Math.abs(a - profile.currentAge) <= 5)?.[1] ?? 0)) : '—', status: 'ok' },
        ],
      },
      {
        key: 'debt', name: 'Debt Health', weight: 15, score: dbt,
        ...g(dbt),
        question: 'Is debt working for you or against you?',
        insight: (() => {
          const total = assets.liabilities;
          if (total === 0) return 'Debt-free! This score is perfect. Keep avoiding high-interest debt.';
          const estPayments = monthlyDebtPayments ?? estimateMonthlyPayments(debtBreakdown);
          const dsr = avgIncome > 0 ? estPayments / avgIncome : 0;
          const badDebt = debtBreakdown.creditCard + debtBreakdown.other;
          const daRatio = assets.totalAssets > 0 ? assets.liabilities / assets.totalAssets : 1;
          const daInfo = getDALabel(daRatio, profile.currentAge);
          const { bracket } = getDAThresholds(profile.currentAge > 0 ? profile.currentAge : 35);
          if (badDebt > total * 0.30)
            return `${(badDebt / total * 100).toFixed(0)}% of your debt is high-rate (credit cards / personal loans). Paying these off first with the avalanche method will save the most in interest and has the highest score impact.`;
          if (dsr > 0.36)
            return `Your monthly debt payments are ${(dsr * 100).toFixed(0)}% of income — above the 36% threshold lenders use for financial stress. Reducing this ratio is the single biggest lever for this score.`;
          return `Your debt-to-assets ratio of ${(daRatio * 100).toFixed(0)}% is rated ${daInfo.label} for your life stage (${bracket}). Debt service is ${(dsr * 100).toFixed(0)}% of income. Stay on your paydown plan.`;
        })(),
        subMetrics: [
          {
            label: 'Monthly Payments',
            value: fmt(monthlyDebtPayments ?? estimateMonthlyPayments(debtBreakdown)) + '/mo',
            status: (() => { const dsr = avgIncome > 0 ? (monthlyDebtPayments ?? estimateMonthlyPayments(debtBreakdown)) / avgIncome : 1; return dsr <= 0.20 ? 'good' : dsr <= 0.36 ? 'ok' : 'bad'; })(),
          },
          {
            label: 'Debt Service Ratio',
            value: avgIncome > 0 ? `${((monthlyDebtPayments ?? estimateMonthlyPayments(debtBreakdown)) / avgIncome * 100).toFixed(0)}% of income` : '—',
            status: (() => { const dsr = avgIncome > 0 ? (monthlyDebtPayments ?? estimateMonthlyPayments(debtBreakdown)) / avgIncome : 1; return dsr <= 0.20 ? 'good' : dsr <= 0.36 ? 'ok' : 'bad'; })(),
          },
          {
            label: 'Debt / Assets (Age-Adjusted)',
            value: (() => { const r = assets.totalAssets > 0 ? assets.liabilities / assets.totalAssets : 1; return `${(r * 100).toFixed(0)}% — ${getDALabel(r, profile.currentAge).label}`; })(),
            status: (() => { const r = assets.totalAssets > 0 ? assets.liabilities / assets.totalAssets : 1; const l = getDALabel(r, profile.currentAge).label; return l === 'Excellent' || l === 'Very Good' ? 'good' : l === 'Healthy' ? 'ok' : 'bad'; })(),
          },
          { label: 'Mortgage',       value: debtBreakdown.mortgage    > 0 ? fmtShort(debtBreakdown.mortgage)    : 'None', status: 'good' },
          { label: 'Student Loans',  value: debtBreakdown.studentLoan > 0 ? fmtShort(debtBreakdown.studentLoan) : 'None', status: 'good' },
          { label: 'Auto Loans',     value: debtBreakdown.auto        > 0 ? fmtShort(debtBreakdown.auto)        : 'None', status: debtBreakdown.auto > 0 ? 'ok' : 'good' },
          { label: 'Credit Cards',   value: debtBreakdown.creditCard  > 0 ? fmtShort(debtBreakdown.creditCard)  : 'None', status: debtBreakdown.creditCard > 0 ? 'warn' : 'good' },
          { label: 'Personal / Other', value: debtBreakdown.other     > 0 ? fmtShort(debtBreakdown.other)       : 'None', status: debtBreakdown.other > 0 ? 'warn' : 'good' },
        ],
      },
      {
        key: 'networth', name: 'Net Worth Strength', weight: 10, score: nw,
        ...g(nw),
        question: 'Are you accumulating wealth at the right velocity?',
        insight: assets.nw <= 0
          ? 'Net worth is negative. Focus on debt reduction and building savings — every dollar of debt eliminated improves this score.'
          : profileSet
          ? `The Thomas Stanley benchmark for age ${profile.currentAge} on ${fmtShort(annualIncome)}/yr income is ${fmtShort(profile.currentAge * annualIncome / 10)}. You're at ${fmtShort(assets.nw)}.`
          : 'Set your age to see how your net worth compares to wealth-building benchmarks.',
        subMetrics: [
          { label: 'Net Worth',         value: fmtShort(assets.nw),                      status: assets.nw > annualIncome ? 'good' : assets.nw > 0 ? 'ok' : 'bad' },
          { label: 'Total Assets',      value: fmtShort(assets.totalAssets),             status: 'ok' },
          { label: 'Total Liabilities', value: fmtShort(assets.liabilities),             status: assets.liabilities < assets.totalAssets * 0.5 ? 'ok' : 'warn' },
          { label: 'Asset-to-Debt',     value: assets.liabilities > 0 ? `${(assets.totalAssets / assets.liabilities).toFixed(1)}×` : '∞', status: assets.totalAssets > assets.liabilities ? 'good' : 'bad' },
        ],
      },
      {
        key: 'spending', name: 'Spending Efficiency', weight: 10, score: sp,
        ...g(sp),
        question: 'Is your spending aligned with building wealth, not just comfort?',
        insight: sp >= 75
          ? 'Excellent spending discipline — discretionary expenses are well-controlled.'
          : `${(discretionaryPct * 100).toFixed(0)}% of committed spending is discretionary. Reducing by 10% would free ${fmtShort(avgExpenses * 0.10 * 12)}/yr for wealth building.`,
        subMetrics: [
          { label: 'Discretionary %',   value: `${(discretionaryPct * 100).toFixed(0)}%`, status: discretionaryPct < 0.25 ? 'good' : discretionaryPct < 0.40 ? 'ok' : 'warn' },
          { label: 'Active Subscriptions', value: `${subCount}`,                          status: subCount <= 5 ? 'good' : 'warn' },
        ],
      },
      {
        key: 'resilience', name: 'Financial Resilience', weight: 5, score: res,
        ...g(res),
        question: 'How well could you withstand a job loss, market crash, or major unexpected expense?',
        insight: res >= 70
          ? 'Your finances show strong resilience to short-term shocks. Emergency reserves and manageable debt work together.'
          : 'Resilience improves by building emergency reserves and reducing high-interest debt. These two levers compound each other.',
        subMetrics: [
          { label: 'Job Loss Runway',    value: `${emergencyMonths.toFixed(1)} months`,  status: emergencyMonths >= 3 ? 'good' : 'warn' },
          { label: 'Debt Load',          value: assets.liabilities === 0 ? 'None' : fmtShort(assets.liabilities), status: assets.liabilities === 0 ? 'good' : 'ok' },
        ],
      },
      {
        key: 'organization', name: 'Financial Organization', weight: 5, score: org,
        ...g(org),
        question: 'Do you have a reliable system to track and manage your finances?',
        insight: org >= 70
          ? 'Well-organized — multiple accounts connected and solid transaction history.'
          : 'Connect more accounts and let Nautilius build a complete picture of your finances to improve this score.',
        subMetrics: [
          { label: 'Connected Accounts', value: `${accountCount}`,  status: accountCount >= 4 ? 'good' : accountCount >= 2 ? 'ok' : 'warn' },
          { label: 'Transactions',       value: `${txnCount}`,      status: txnCount >= 50 ? 'good' : txnCount >= 20 ? 'ok' : 'warn' },
        ],
      },
    ];
  }, [savingsRate, surplus, avgIncome, avgExpenses, emergencyMonths, assets, profile, annualIncome, discretionaryPct, subCount, accountCount, txnCount, profileSet, debtBreakdown, monthlyDebtPayments]);

  /* ── composite score ── */
  const totalScore = useMemo(() =>
    clamp(components.reduce((s, c) => s + (c.score * c.weight) / 100, 0)),
  [components]);

  const { grade, label: gradeLabel, color: gradeColor } = scoreGrade(totalScore);
  const percentile = scoreToPercentile(totalScore);

  /* ── score history: append today's snapshot ── */
  useEffect(() => {
    if (!mounted || totalScore === 0) return;
    // Always keep the live score available for the summary dashboard
    try { localStorage.setItem('wl_score_live', String(totalScore)); } catch {}
    const today = new Date().toISOString().slice(0, 7); // YYYY-MM
    setScoreHistory(prev => {
      const exists = prev.some(s => s.date === today);
      const next   = exists ? prev : [...prev, { date: today, score: totalScore }].slice(-24);
      if (!exists) { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {} }
      return next;
    });
  }, [mounted, totalScore]);

  /* ── score trend ── */
  const scoreTrend = useMemo(() => {
    if (scoreHistory.length < 2) return null;
    const oldest = scoreHistory[0].score;
    const delta  = totalScore - oldest;
    return { delta, months: scoreHistory.length };
  }, [scoreHistory, totalScore]);

  /* ── Financial Freedom projection ── */
  const fiBase = useMemo(() =>
    calcFIDate(assets.liquidAssets, avgExpenses * 12, surplus, profile.currentAge),
  [assets.liquidAssets, avgExpenses, surplus, profile.currentAge]);

  const fiWithExtras = useMemo(() =>
    calcFIDate(assets.liquidAssets, (avgExpenses - ffExtra.spendLess) * 12, surplus + ffExtra.saveMore + ffExtra.spendLess, profile.currentAge),
  [assets.liquidAssets, avgExpenses, surplus, ffExtra, profile.currentAge]);

  const fiMonthsSaved = fiBase.months - fiWithExtras.months;

  /* ── momentum score ── */
  const momentum = useMemo(() => {
    let pts = 0;
    if (savingsRate >= 0.20) pts += 4;
    else if (savingsRate >= 0.10) pts += 2;
    else if (savingsRate > 0) pts += 1;
    if (assets.retirement > 0 && recurringTransactions?.some(r => r.isActive && r.transaction_type === 'Income' && r.category === 'Investment')) pts += 3;
    if (assets.liabilities < annualIncome) pts += 2;
    if (assets.liabilities === 0) pts += 2;
    if (emergencyMonths >= 3) pts += 2;
    if (assets.nw > 0) pts += 2;
    if (discretionaryPct < 0.35) pts += 2;
    if (accountCount >= 3) pts += 1;
    const label = pts >= 12 ? 'Accelerating' : pts >= 7 ? 'Building' : pts >= 4 ? 'Stable' : 'Needs Focus';
    const color = pts >= 12 ? 'var(--t-green)' : pts >= 7 ? 'var(--t-primary)' : pts >= 4 ? 'var(--t-amber)' : 'var(--t-red)';
    return { pts, label, color };
  }, [savingsRate, assets, annualIncome, emergencyMonths, discretionaryPct, accountCount, recurringTransactions]);

  /* ── asset allocation analysis ── */
  const assetAlloc = useMemo(() => {
    const total = assets.totalAssets;
    if (total === 0) return null;
    const cashPct   = assets.cash        / total;
    const investPct = (assets.investments + assets.retirement) / total;
    const rePct     = assets.realEstate  / total;
    let score = 65, insight = '', label = 'Balanced', color = 'var(--t-primary)';
    if (cashPct > 0.50)       { score = 30; label = 'Too Much Cash';     color = 'var(--t-amber)'; insight = `${(cashPct*100).toFixed(0)}% of assets sit in cash losing ground to inflation. Investing excess could add ${fmtShort(assets.cash * 0.5 * Math.pow(1.07, 10) - assets.cash * 0.5)} to your 10-year projection.`; }
    else if (cashPct > 0.30)  { score = 55; label = 'Cash-Heavy';        color = 'var(--t-amber)'; insight = `${(cashPct*100).toFixed(0)}% in cash is above recommended. Consider investing surplus beyond your 6-month emergency fund.`; }
    else if (investPct < 0.20){ score = 45; label = 'Under-Invested';    color = 'var(--t-amber)'; insight = 'Low investment participation limits long-term wealth creation. Market-invested assets historically outperform cash by 5-7%/yr.'; }
    else if (investPct > 0.85){ score = 60; label = 'Equity-Heavy';      color = 'var(--t-teal)'; insight = 'High equity concentration can mean strong growth but higher volatility. Ensure your emergency fund is fully funded.'; }
    else                       { score = 85; label = 'Well Diversified';  color = 'var(--t-green)'; insight = 'Asset allocation looks healthy with a balance of liquid, invested, and long-term assets.'; }
    return { score, label, color, cashPct, investPct, rePct, insight };
  }, [assets]);

  /* ── future wealth simulation (3 scenarios × 4 horizons) ── */
  const simulation = useMemo(() => {
    const rates = { conservative: 0.04, base: 0.07, growth: 0.10 };
    const horizons = [36, 60, 120, Math.max(1, (profile.retirementAge - profile.currentAge) * 12)];
    const now = new Date();
    const chartData = Array.from({ length: horizons[2] + 1 }, (_, m) => {
      const date  = addMonthsToDate(now, m);
      const label = m === 0 ? 'Now' : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const point: any = { label, month: m };
      Object.entries(rates).forEach(([k, r]) => {
        let nw = assets.nw;
        for (let i = 0; i < m; i++) nw = nw * (1 + r / 12) + Math.max(0, surplus);
        point[k] = Math.round(nw);
      });
      return point;
    }).filter((_, i) => i % (horizons[2] > 60 ? 6 : 3) === 0);
    return { chartData, horizons };
  }, [assets.nw, surplus, profile]);

  /* ── improvement actions ── */
  const actions: ImprovementAction[] = useMemo(() => {
    const list: ImprovementAction[] = [];
    const sorted = [...components].sort((a, b) => a.score - b.score);

    sorted.forEach(c => {
      if (c.key === 'emergency' && c.score < 70) {
        const gap = Math.max(0, avgExpenses * 6 - assets.cash);
        if (gap > 0) list.push({ title: 'Build Emergency Fund to 6 Months', detail: `Add ${fmt(Math.ceil(gap / 6))}/mo for 6 months. You currently cover ${emergencyMonths.toFixed(1)} months.`, scoreImpact: Math.round((scoreEmergency(6) - c.score) * 0.15), secondaryImpact: `+${Math.round(scoreResilience(6, assets.liabilities, annualIncome) - scoreResilience(emergencyMonths, assets.liabilities, annualIncome))} Resilience points`, priority: c.score < 40 ? 'critical' : 'high', color: 'var(--t-amber)', icon: '🛡️' });
      }
      if (c.key === 'retirement' && c.score < 75) {
        list.push({ title: 'Increase Retirement Contributions', detail: `Adding $250/mo to your retirement account could close the gap to your age benchmark faster.`, scoreImpact: 5, secondaryImpact: `Financial Freedom ${Math.round(calcFIDate(assets.liquidAssets, avgExpenses*12, surplus+250, profile.currentAge).months < fiBase.months ? fiBase.months - calcFIDate(assets.liquidAssets, avgExpenses*12, surplus+250, profile.currentAge).months : 0)} months sooner`, priority: 'high', color: 'var(--t-primary)', icon: '📈' });
      }
      if (c.key === 'cashflow' && savingsRate < 0.15) {
        list.push({ title: 'Increase Savings Rate to 15%+', detail: `Currently saving ${(savingsRate * 100).toFixed(1)}%. Cutting ${fmt(Math.abs(avgIncome * 0.15 - surplus))} from monthly expenses reaches 15%.`, scoreImpact: Math.round((scoreCashFlow(0.15) - c.score) * 0.20), secondaryImpact: `+${fmtShort((avgIncome * 0.15 - surplus) * 12)}/yr flowing to wealth-building`, priority: savingsRate <= 0 ? 'critical' : 'high', color: 'var(--t-green)', icon: '💰' });
      }
      if (c.key === 'debt' && assets.liabilities > 0 && c.score < 70) {
        const hasBadDebt = debtBreakdown.creditCard + debtBreakdown.other > 0;
        if (hasBadDebt) {
          const badTotal = debtBreakdown.creditCard + debtBreakdown.other;
          list.push({ title: 'Eliminate High-Rate Debt First (Avalanche)', detail: `You have ${fmtShort(badTotal)} in credit cards / personal loans — the highest-penalty debt in the scoring model. Paying these off completely would significantly boost your Debt Type sub-score.`, scoreImpact: Math.round((100 - c.score) * 0.30 * 0.15), secondaryImpact: `Est. annual interest saved: ${fmtShort(badTotal * 0.20)}`, priority: debtBreakdown.creditCard > annualIncome * 0.10 ? 'critical' : 'high', color: 'var(--t-red)', icon: '💳' });
        } else {
          list.push({ title: 'Reduce Monthly Debt Service Ratio', detail: `Paying an extra $200/mo toward your highest-rate remaining debt lowers your debt service ratio and improves your coverage score.`, scoreImpact: 4, secondaryImpact: `Est. interest savings: ${fmtShort(assets.liabilities * 0.04)} over payoff period`, priority: 'high', color: 'var(--t-red)', icon: '💳' });
        }
      }
      if (c.key === 'spending' && c.score < 65) {
        list.push({ title: 'Audit Subscriptions & Discretionary Spend', detail: `${subCount} active subscriptions detected. A 15-minute audit often reveals $100-300/mo in forgotten charges.`, scoreImpact: 3, secondaryImpact: `${fmtShort(avgExpenses * 0.10 * 12)}/yr freed at a 10% cut`, priority: 'medium', color: 'var(--t-purple)', icon: '📺' });
      }
    });

    return list.slice(0, 5);
  }, [components, assets, avgExpenses, avgIncome, surplus, emergencyMonths, annualIncome, savingsRate, subCount, fiBase, profile, debtBreakdown, monthlyDebtPayments]);

  /* ── profile form state ── */
  const [profileForm, setProfileForm] = useState({ age: String(profile.currentAge), retAge: String(profile.retirementAge) });
  const [showProfileForm, setShowProfileForm] = useState(false);

  /* ── loading ── */
  if (!mounted || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 500, flexDirection: 'column', gap: 14 }}>
        <div style={{ width: 40, height: 40, border: `3px solid var(--t-border)`, borderTop: `3px solid var(--t-primary)`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ fontSize: 14, color: 'var(--t-text-tertiary)' }}>Calculating your Nautilus Score…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const fiDateStr = fiBase.months < 720 ? fiBase.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Beyond projection';
  const fiYrs     = fiBase.months < 720 ? (fiBase.months / 12).toFixed(1) : '—';

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }`}</style>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: headingColor, letterSpacing: '-0.02em' }}>Nautilus Score</div>
          <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)', marginTop: 3 }}>Your complete financial health — where you stand, what to fix, and when you'll be free.</div>
        </div>
        <button onClick={() => setShowProfileForm(s => !s)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
          background: profileSet ? 'var(--t-surface)' : 'var(--t-primary)', color: profileSet ? 'var(--t-text-secondary)' : '#fff',
          border: `1px solid ${profileSet ? 'var(--t-border-med)' : 'var(--t-primary)'}`, borderRadius: T.radiusMd,
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>
          {profileSet ? `Age ${profile.currentAge} · Retire ${profile.retirementAge} ✏️` : '⚡ Set Your Profile'}
        </button>
      </div>

      {/* ── PROFILE SETUP ── */}
      {showProfileForm && (
        <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `2px solid var(--t-primary-border)`, boxShadow: 'var(--t-shadow-md)', padding: '20px 24px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        {ACCENT_LINE}
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text-primary)', marginBottom: 14 }}>Your Financial Profile</div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {[
              { label: 'Current Age', value: profileForm.age,    key: 'age',    min: 18, max: 80 },
              { label: 'Retire At',   value: profileForm.retAge, key: 'retAge', min: 45, max: 80 },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-secondary)', display: 'block', marginBottom: 5 }}>{f.label}</label>
                <input type="number" value={f.value} min={f.min} max={f.max}
                  onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: 100, padding: '9px 12px', border: `1px solid var(--t-border-med)`, borderRadius: T.radiusMd, fontSize: 13, color: 'var(--t-text-primary)', outline: 'none' }}
                />
              </div>
            ))}
            <button onClick={() => { saveProfile({ currentAge: Number(profileForm.age), retirementAge: Number(profileForm.retAge) }); setShowProfileForm(false); }}
              style={{ padding: '10px 20px', background: 'var(--t-primary)', color: '#fff', border: 'none', borderRadius: T.radiusMd, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Save Profile
            </button>
            <button onClick={() => setShowProfileForm(false)} style={{ padding: '10px 16px', background: 'var(--t-surface)', color: 'var(--t-text-secondary)', border: `1px solid var(--t-border-med)`, borderRadius: T.radiusMd, fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 10 }}>Used for retirement readiness benchmarks and financial freedom projections. Stored locally.</div>
        </div>
      )}

      {/* ── HERO ROW: Score + Freedom Projection ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 20, marginBottom: 20 }}>

        {/* SCORE GAUGE */}
        <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-md)', padding: '28px 28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        {ACCENT_LINE}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--t-card-accent)', borderRadius: `${T.radius} ${T.radius} 0 0` }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t-card-accent)', marginBottom: 12 }}>Nautilus Score</div>
          <div style={{ position: 'relative', width: 220 }}>
            <ScoreGauge score={totalScore} size={220} />
            <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center' }}>
              <div style={{ fontSize: 52, fontWeight: 800, color: gradeColor, lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>{totalScore}</div>
              <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 2 }}>out of 100</div>
            </div>
          </div>

          {/* Grade + label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: gradeColor }}>{grade}</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--t-text-primary)' }}>{gradeLabel}</span>
          </div>

          {/* Percentile */}
          <div style={{ marginTop: 10, padding: '7px 16px', borderRadius: 100, background: `${gradeColor}12`, border: `1px solid ${gradeColor}30` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: gradeColor }}>Top {percentile}% of Nautilius users</span>
          </div>

          {/* Trend */}
          {scoreTrend && (
            <div style={{ marginTop: 12, fontSize: 12, color: scoreTrend.delta >= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)', fontWeight: 600 }}>
              {scoreTrend.delta >= 0 ? '▲' : '▼'} {Math.abs(scoreTrend.delta)} pts over {scoreTrend.months} months
            </div>
          )}
          {!scoreTrend && (
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--t-text-tertiary)' }}>Score history builds as you use Nautilius</div>
          )}

          {/* Score history sparkline */}
          {scoreHistory.length >= 2 && (
            <div style={{ width: '100%', marginTop: 14 }}>
              <ResponsiveContainer width="100%" height={52}>
                <AreaChart data={scoreHistory} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={gradeColor} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={gradeColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="score" stroke={gradeColor} fill="url(#sg)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* FINANCIAL FREEDOM PROJECTION */}
        <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-md)', padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        {ACCENT_LINE}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--t-card-accent)', borderRadius: `${T.radius} ${T.radius} 0 0` }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t-card-accent)', marginBottom: 8 }}>Financial Freedom Projection</div>
            <div style={{ fontSize: 13, color: 'var(--t-text-secondary)', marginBottom: 20 }}>If you stay on your current path, financial independence arrives:</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ padding: '16px 18px', background: 'var(--t-inner-box-bg)', border: `1px solid var(--t-inner-box-border)`, borderRadius: T.radiusMd }}>
              <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 6 }}>FREEDOM AGE</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--t-text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {fiBase.months < 720 ? Math.round(fiBase.age) : '75+'}
              </div>
            </div>
            <div style={{ padding: '16px 18px', background: 'var(--t-inner-box-bg)', border: `1px solid var(--t-inner-box-border)`, borderRadius: T.radiusMd }}>
              <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 6 }}>ESTIMATED DATE</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t-text-primary)', lineHeight: 1.3 }}>{fiDateStr}</div>
            </div>
            <div style={{ padding: '16px 18px', background: 'var(--t-inner-box-bg)', border: `1px solid var(--t-inner-box-border)`, borderRadius: T.radiusMd }}>
              <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 6 }}>YEARS AWAY</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--t-text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>{fiYrs}</div>
            </div>
          </div>

          <div style={{ padding: '14px 16px', background: 'var(--t-inner-box-bg)', border: `1px solid var(--t-inner-box-border)`, borderRadius: T.radiusMd, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginBottom: 3 }}>FI Number (25× annual expenses)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(fiBase.fiNumber)}</div>
            <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 2 }}>Current net worth: {fmtShort(assets.nw)} · {fiBase.fiNumber > 0 ? ((assets.nw / fiBase.fiNumber) * 100).toFixed(0) : 0}% there</div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, fiBase.fiNumber > 0 ? (assets.nw / fiBase.fiNumber) * 100 : 0)}%`, background: 'var(--t-card-accent)', borderRadius: 100, transition: 'width 0.6s ease' }} />
          </div>
        </div>
      </div>

      {/* ── PEER BENCHMARK ── */}
      {(() => {
        const brackets: {
          label: string; min: number; max: number;
          savingsRate: number; dti: number; expenseRatio: number; medScore: number;
        }[] = [
          { label: 'Under $50K',  min: 0,      max: 50000,   savingsRate: 3,  dti: 12, expenseRatio: 97, medScore: 42 },
          { label: '$50K–$75K',   min: 50000,  max: 75000,   savingsRate: 7,  dti: 18, expenseRatio: 90, medScore: 51 },
          { label: '$75K–$100K',  min: 75000,  max: 100000,  savingsRate: 12, dti: 22, expenseRatio: 85, medScore: 59 },
          { label: '$100K–$150K', min: 100000, max: 150000,  savingsRate: 16, dti: 25, expenseRatio: 80, medScore: 65 },
          { label: '$150K–$200K', min: 150000, max: 200000,  savingsRate: 21, dti: 28, expenseRatio: 75, medScore: 71 },
          { label: 'Over $200K',  min: 200000, max: Infinity, savingsRate: 28, dti: 30, expenseRatio: 68, medScore: 78 },
        ];
        const bracket = brackets.find(b => annualIncome >= b.min && annualIncome < b.max) ?? brackets[brackets.length - 1];

        const userSavingsRate  = Math.round(savingsRate * 100);
        // DTI = monthly debt payments ÷ avg monthly income (standard lender definition)
        const monthlyDebtPmt   = monthlyDebtPayments ?? estimateMonthlyPayments(debtBreakdown);
        const userDti          = avgIncome > 0 ? Math.round((monthlyDebtPmt / avgIncome) * 100) : 0;
        const userExpenseRatio = avgIncome > 0 ? Math.round((avgExpenses / avgIncome) * 100) : 100;

        // Net worth vs Thomas Stanley benchmark (age × income / 10)
        const stanleyTarget    = profile.currentAge > 0 && annualIncome > 0 ? profile.currentAge * annualIncome / 10 : 0;
        const nwRatioPct       = stanleyTarget > 0 ? Math.round((assets.nw / stanleyTarget) * 100) : 0;

        type Dir = 'above' | 'on-par' | 'below';
        const compare = (user: number, peer: number, higherIsBetter: boolean): Dir => {
          if (Math.abs(user - peer) < peer * 0.08) return 'on-par';
          return (user > peer) === higherIsBetter ? 'above' : 'below';
        };
        const dirColor = (d: Dir) => d === 'above' ? 'var(--t-green)' : d === 'on-par' ? 'var(--t-teal)' : 'var(--t-amber)';
        const dirLabel = (d: Dir) => d === 'above' ? '↑ Above avg' : d === 'on-par' ? '≈ On par' : '↓ Below avg';
        const nwDir: Dir = nwRatioPct >= 108 ? 'above' : nwRatioPct >= 92 ? 'on-par' : 'below';

        const metrics = [
          { label: 'Savings Rate',    user: `${userSavingsRate}%`,  peer: `${bracket.savingsRate}%`,  dir: compare(userSavingsRate, bracket.savingsRate, true),   note: 'Higher is better' },
          { label: 'Debt-to-Income',  user: `${userDti}%`,          peer: `${bracket.dti}%`,          dir: compare(userDti, bracket.dti, false),                  note: 'Monthly debt payments ÷ monthly income · lower is better' },
          { label: 'Expense Ratio',   user: `${userExpenseRatio}%`, peer: `${bracket.expenseRatio}%`, dir: compare(userExpenseRatio, bracket.expenseRatio, false), note: 'Monthly expenses ÷ income · lower is better' },
          {
            label: 'Net Worth Target',
            user: nwRatioPct > 0 ? `${nwRatioPct}%` : '—',
            peer: fmtShort(stanleyTarget),
            dir: nwDir,
            note: profileSet ? `Stanley benchmark for age ${profile.currentAge}: ${fmtShort(stanleyTarget)}` : 'Set your age in the profile to unlock this benchmark',
          },
        ];

        return (
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '24px 26px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          {ACCENT_LINE}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)' }}>How You Compare</div>
                <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 2 }}>
                  Benchmarks for your income bracket · <span style={{ fontWeight: 600, color: 'var(--t-text-secondary)' }}>{bracket.label}</span>
                </div>
              </div>
              <div style={{ padding: '5px 12px', borderRadius: 100, background: 'var(--t-inner-box-bg)', border: `1px solid var(--t-inner-box-border)`, fontSize: 11, color: 'var(--t-text-tertiary)' }}>
                Based on Fed SCF &amp; BLS data
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
              {metrics.map(m => {
                const c = dirColor(m.dir);
                return (
                  <div key={m.label} style={{ padding: '16px 18px', borderRadius: T.radiusMd, background: 'var(--t-inner-box-bg)', border: `1px solid var(--t-inner-box-border)`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Header row: label + badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-inner-box-heading)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 100, background: `${c}25`, border: `1px solid ${c}50`, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{dirLabel(m.dir)}</span>
                      </div>
                    </div>
                    {/* Side-by-side values, mid-split */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--t-inner-box-subtext)', marginBottom: 3 }}>You</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--t-inner-box-text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{m.user}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--t-inner-box-subtext)', marginBottom: 3 }}>Peer avg</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--t-inner-box-text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{m.peer}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--t-inner-box-subtext)', lineHeight: 1.4 }}>{m.note}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: T.radiusMd, background: 'var(--t-inner-box-bg)', border: `1px solid var(--t-inner-box-border)`, fontSize: 11, color: 'var(--t-text-tertiary)', lineHeight: 1.55 }}>
              Peer data is derived from the Federal Reserve Survey of Consumer Finances and Bureau of Labor Statistics Consumer Expenditure Survey, segmented by household income bracket. These are statistical averages, not Nautilius user data.
            </div>
          </div>
        );
      })()}

      {/* ── MOMENTUM + ASSET ALLOC ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* MOMENTUM */}
        <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 26px', position: 'relative', overflow: 'hidden' }}>
          {ACCENT_LINE}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-text-tertiary)', marginBottom: 4 }}>Financial Momentum</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 40, fontWeight: 800, color: momentum.color, letterSpacing: '-0.03em' }}>+{momentum.pts}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: momentum.color }}>{momentum.label}</span>
              </div>
            </div>
            <div style={{ padding: '8px 14px', borderRadius: T.radiusMd, background: `${momentum.color}12`, border: `1px solid ${momentum.color}30` }}>
              <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginBottom: 2 }}>Direction</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: momentum.color }}>
                {momentum.pts >= 12 ? '↗ Accelerating' : momentum.pts >= 7 ? '→ Building' : momentum.pts >= 4 ? '→ Stable' : '↘ Stalling'}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginBottom: 12 }}>Nautilius measures your financial direction, not just your current position. Progress is rewarded even when health is imperfect.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Savings rate', active: savingsRate >= 0.10 },
              { label: 'Positive monthly cash flow', active: surplus > 0 },
              { label: 'Retirement contributions active', active: assets.retirement > 0 },
              { label: 'Debt manageable vs income', active: assets.liabilities < annualIncome || assets.liabilities === 0 },
              { label: 'Emergency reserves building', active: emergencyMonths >= 1 },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: f.active ? 'var(--t-text-secondary)' : 'var(--t-text-tertiary)' }}>
                <span style={{ color: f.active ? 'var(--t-green)' : 'var(--t-border-med)', fontSize: 14, flexShrink: 0 }}>{f.active ? '✓' : '○'}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* ASSET ALLOCATION */}
        <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 26px', position: 'relative', overflow: 'hidden' }}>
          {ACCENT_LINE}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-text-tertiary)', marginBottom: 4 }}>Asset Allocation Health</div>
          {assetAlloc ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: assetAlloc.color, letterSpacing: '-0.03em' }}>{assetAlloc.score}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: assetAlloc.color }}>{assetAlloc.label}</span>
              </div>
              {/* Allocation bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', height: 14, borderRadius: 100, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ width: `${assetAlloc.cashPct * 100}%`, background: '#16A34A', transition: 'width 0.6s' }} title="Cash" />
                  <div style={{ width: `${assetAlloc.investPct * 100}%`, background: 'var(--t-primary)', transition: 'width 0.6s' }} title="Investments" />
                  <div style={{ width: `${assetAlloc.rePct * 100}%`, background: '#0891B2', transition: 'width 0.6s' }} title="Real Estate" />
                  <div style={{ flex: 1, background: 'var(--t-border)' }} title="Other" />
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Cash', pct: assetAlloc.cashPct, color: '#0891B2' },
                    { label: 'Invested', pct: assetAlloc.investPct, color: 'var(--t-primary)' },
                    { label: 'Real Estate', pct: assetAlloc.rePct, color: 'var(--t-green)' },
                  ].map(a => (
                    <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color }} />
                      <span style={{ color: 'var(--t-text-tertiary)' }}>{a.label}:</span>
                      <span style={{ fontWeight: 700, color: 'var(--t-text-primary)' }}>{(a.pct * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: '10px 12px', background: `${assetAlloc.color}0D`, border: `1px solid ${assetAlloc.color}30`, borderRadius: T.radiusMd, fontSize: 12, color: 'var(--t-text-secondary)', lineHeight: 1.5 }}>
                💡 {assetAlloc.insight}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)', padding: '20px 0' }}>Connect accounts to see your asset allocation analysis.</div>
          )}
        </div>
      </div>

      {/* ── SCORE BREAKDOWN ── */}
      <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '24px 26px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          {ACCENT_LINE}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)' }}>Score Breakdown</div>
            <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 2 }}>8 weighted components · tap any to expand details and actions</div>
          </div>
          <button onClick={() => setExpanded(prev => {
            const allOpen = components.every(c => prev[c.key]);
            return allOpen ? {} : Object.fromEntries(components.map(c => [c.key, true]));
          })} style={{ fontSize: 12, color: 'var(--t-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {components.every(c => expanded[c.key]) ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
        {components.map(c => (
          <ComponentRow
            key={c.key} comp={c}
            expanded={!!expanded[c.key]}
            onToggle={() => setExpanded(p => ({ ...p, [c.key]: !p[c.key] }))}
          />
        ))}
      </div>

      {/* ── MAIN GRID: Freedom Engine + Simulation + Improvement ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* FINANCIAL FREEDOM ENGINE */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '24px 26px', position: 'relative', overflow: 'hidden' }}>
            {ACCENT_LINE}
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)', marginBottom: 4 }}>Financial Freedom Engine</div>
            <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginBottom: 20 }}>See how small changes accelerate your path to financial independence.</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
              {[
                { label: 'Extra Monthly Savings', key: 'saveMore', min: 0, max: 2000, step: 50 },
                { label: 'Monthly Spending Cut',  key: 'spendLess', min: 0, max: 1000, step: 50 },
              ].map(s => (
                <div key={s.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'var(--t-text-secondary)', fontWeight: 500 }}>{s.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-primary)' }}>{fmt(ffExtra[s.key as keyof typeof ffExtra])}/mo</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={ffExtra[s.key as keyof typeof ffExtra]}
                    onChange={e => setFfExtra(p => ({ ...p, [s.key]: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: 'var(--t-primary)', cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div style={{ padding: '14px 16px', background: 'var(--t-primary-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-primary-border)` }}>
                <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', fontWeight: 600, marginBottom: 3 }}>CURRENT PROJECTION</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t-primary)' }}>{fiDateStr}</div>
                <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 2 }}>Age {fiBase.months < 720 ? Math.round(fiBase.age) : '75+'}</div>
              </div>
              {(ffExtra.saveMore > 0 || ffExtra.spendLess > 0) ? (
                <>
                  <div style={{ padding: '14px 16px', background: 'var(--t-green-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-green-border)` }}>
                    <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', fontWeight: 600, marginBottom: 3 }}>WITH YOUR CHANGES</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t-green)' }}>
                      {fiWithExtras.months < 720 ? fiWithExtras.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Beyond 60yr'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 2 }}>Age {Math.round(fiWithExtras.age)}</div>
                  </div>
                  <div style={{ padding: '14px 16px', background: 'var(--t-green-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-green-border)` }}>
                    <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', fontWeight: 600, marginBottom: 3 }}>TIME SAVED</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--t-green)' }}>
                      {fiMonthsSaved > 0 ? `${fiMonthsSaved > 12 ? (fiMonthsSaved / 12).toFixed(1) + 'yr' : fiMonthsSaved + 'mo'} sooner` : 'No change'}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ gridColumn: '2 / 4', padding: '14px 16px', background: 'var(--t-inner-box-bg)', borderRadius: T.radiusMd, border: `1px dashed var(--t-inner-box-border)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--t-text-tertiary)' }}>Adjust sliders above to model your impact →</span>
                </div>
              )}
            </div>
          </div>

          {/* FUTURE WEALTH SIMULATION */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '24px 26px', position: 'relative', overflow: 'hidden' }}>
            {ACCENT_LINE}
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)', marginBottom: 4 }}>Future Wealth Simulation</div>
            <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginBottom: 20 }}>Three scenarios at your current savings rate. Based on {fmtShort(assets.nw)} net worth + {fmt(surplus)}/mo surplus.</div>

            <div style={{ background: 'var(--t-inner-box-bg)', border: `1px solid var(--t-inner-box-border)`, borderRadius: 8, padding: '12px 8px 4px' }}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={simulation.chartData} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
                <defs>
                  {[['growth','#16A34A'], ['base','#0a3fa8'], ['conservative','#D97706']].map(([k, c]) => (
                    <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={c} stopOpacity={0.01} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={'var(--t-border)'} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--t-text-tertiary)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tickFormatter={fmtY} tick={{ fontSize: 10, fill: 'var(--t-text-tertiary)' }} tickLine={false} axisLine={false} width={68} />
                <Tooltip content={<WealthTooltip />} />
                <Area type="monotone" dataKey="growth"       name="Growth (10%)"       stroke={'var(--t-green)'}  fill="url(#grad-growth)"       strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="base"         name="Expected (7%)"       stroke={'var(--t-primary)'} fill="url(#grad-base)"         strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="conservative" name="Conservative (4%)"   stroke={'var(--t-amber)'}  fill="url(#grad-conservative)" strokeWidth={2} dot={false} />
                {assets.nw !== 0 && <ReferenceLine y={assets.nw} stroke={'var(--t-text-tertiary)'} strokeDasharray="4 3" label={{ value: 'Today', position: 'right', fontSize: 9, fill: 'var(--t-text-tertiary)' }} />}
              </AreaChart>
            </ResponsiveContainer>
            </div>

            {/* Horizon callouts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
              {[
                { label: '3 Years', months: 36  },
                { label: '5 Years', months: 60  },
                { label: '10 Years', months: 120 },
                { label: 'Retire', months: Math.max(1, (profile.retirementAge - profile.currentAge) * 12) },
              ].map(h => {
                const r = 0.07 / 12;
                let nw = assets.nw;
                for (let i = 0; i < h.months; i++) nw = nw * (1 + r) + Math.max(0, surplus);
                return (
                  <div key={h.label} style={{ padding: '10px 12px', background: 'var(--t-inner-box-bg)', borderRadius: T.radiusMd, border: `1px solid var(--t-inner-box-border)` }}>
                    <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', fontWeight: 600, marginBottom: 2 }}>{h.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(nw)}</div>
                    <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', marginTop: 1 }}>Expected</div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* IMPROVEMENT CENTER */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            {ACCENT_LINE}
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)', marginBottom: 4 }}>Improvement Center</div>
            <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginBottom: 16 }}>Highest-impact actions to improve your score.</div>
            {actions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--t-text-tertiary)', fontSize: 13 }}>
                🏆 All major areas look strong. Keep it up!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {actions.map((a, i) => <ActionCard key={i} action={a} rank={i + 1} />)}
              </div>
            )}
          </div>

          {/* AI FINANCIAL COACH */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            {ACCENT_LINE}
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)', marginBottom: 4 }}>AI Financial Coach</div>
            <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginBottom: 16 }}>Personalized insights from your data.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                assets.nw > 0 && surplus > 0 && `At your current pace, you'll add ${fmtShort(surplus * 12)} to your net worth this year — putting you at ${fmtShort(assets.nw + surplus * 12)} by year-end.`,
                emergencyMonths < 6 && avgExpenses > 0 && `Your emergency fund covers ${emergencyMonths.toFixed(1)} months. Adding ${fmt(Math.ceil((avgExpenses * 6 - assets.cash) / 6))}/mo for 6 months reaches the 6-month target and adds ${Math.round(scoreEmergency(6) - scoreEmergency(emergencyMonths))} points to your score.`,
                assets.retirementSavings > 0 && annualIncome > 0 && `Your total retirement-eligible wealth (401k/IRA + brokerage + cash + investment properties) is ${fmtShort(assets.retirementSavings)}, or ${((assets.retirementSavings / annualIncome) * 100).toFixed(0)}% of annual income. ${assets.retirementSavings >= annualIncome * 3 ? 'Strong foundation.' : 'Increasing contributions by $200/mo compounds significantly over time.'}`,
                assetAlloc && assetAlloc.cashPct > 0.35 && `${(assetAlloc.cashPct * 100).toFixed(0)}% of your assets are in cash. Investing excess beyond your emergency fund could add ${fmtShort(assets.cash * 0.5 * (Math.pow(1.07, 10) - 1))} over 10 years at historical market returns.`,
                savingsRate > 0 && fiBase.months < 720 && `Increasing your monthly savings by $500 could move your financial independence date ${Math.round(Math.max(0, fiBase.months - calcFIDate(assets.liquidAssets, avgExpenses * 12, surplus + 500, profile.currentAge).months))} months sooner.`,
                surplus <= 0 && 'Your expenses currently exceed income. Focus on identifying and eliminating the 2-3 largest discretionary expenses — small cuts now compound dramatically over a 10-year horizon.',
              ].filter(Boolean).slice(0, 4).map((insight, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: T.radiusMd, background: 'var(--t-primary-bg)', border: `1px solid var(--t-primary-border)` }}>
                  <span style={{ color: 'var(--t-primary)', flexShrink: 0 }}>💡</span>
                  <span style={{ fontSize: 12, color: 'var(--t-text-secondary)', lineHeight: 1.55 }}>{insight}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
