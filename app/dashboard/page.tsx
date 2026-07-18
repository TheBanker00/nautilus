'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinancialData as useWealthData } from '../lib/financialdatacontext';
import { useFinancialData as useFlowData } from '../lib/hooks/usefinancialdata';
import { scoreCashFlow, scoreEmergency, scoreRetirement, scoreResilience, dimensionColor } from '../lib/nautilusScore';
import { useDashboardTheme } from '../lib/dashboardthemecontext';
import NoDataEmptyState from '../components/NoDataEmptyState';
import { getTxEmoji } from '../lib/taxonomy-emojis';

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS — hardcoded hex, matches tokens.css
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

  radius:        '12px',
  radiusSm:      '6px',
  radiusMd:      '8px',
};

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

/* ── mobile design tokens — shared with transactions/accounts mobile views ── */
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

function MobileScoreRing({ score, color, size = 108 }: { score: number; color: string; size?: number }) {
  const R = (size - 14) / 2;
  const circ = 2 * Math.PI * R;
  const dash = (Math.min(100, Math.max(0, score)) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={9} />
      <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={color} strokeWidth={9}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.28} fontWeight={800} fill="#ffffff">{score}</text>
      <text x="50%" y="65%" textAnchor="middle" fontSize={size * 0.09} fontWeight={600} fill="rgba(255,255,255,0.5)">of 100</text>
    </svg>
  );
}

function MobileDashboardView({
  displayScore, healthGrade, healthLabel,
  netWorth, totalAssets, totalLiabilities, totalCash,
  netCashFlow, liquidityMonths, mtdSpent, mtdIncome,
  totalBudgeted, upcomingBills, txns, alerts,
}: any) {
  const scoreColor = displayScore >= 70 ? MN.green : displayScore >= 50 ? MN.gold : displayScore >= 40 ? MN.amber : MN.red;
  const pctile = displayScore >= 92 ? 3 : displayScore >= 87 ? 8 : displayScore >= 82 ? 16 : displayScore >= 76 ? 27 : displayScore >= 70 ? 38 : displayScore >= 63 ? 50 : displayScore >= 55 ? 63 : displayScore >= 45 ? 75 : displayScore >= 35 ? 85 : 93;

  const topAlert = (alerts ?? [])[0];

  /* recent transactions — last 5 */
  const recent = (txns ?? [])
    .filter((t: any) => t.date)
    .sort((a: any, b: any) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 5);

  return (
    <div style={{ color: MN.text, fontFamily: 'var(--font-body)', paddingBottom: 16 }}>

      {/* ── HERO — score + net worth ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0a3fa8 0%, #0F2044 100%)',
        borderRadius: 0, padding: '24px 20px 20px', margin: '-16px -16px 16px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, transparent, ${MN.gold}, #67E6D5, ${MN.gold}, transparent)` }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/dashboard/health" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <MobileScoreRing score={displayScore} color={scoreColor} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(46,211,198,0.75)', marginBottom: 3 }}>
              Nautilus Score
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor }}>{healthGrade}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: MN.text }}>{healthLabel}</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(46,211,198,0.75)', marginBottom: 3 }}>
              Net Worth
            </div>
            <div style={{
              fontSize: 28, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em',
              backgroundImage: `linear-gradient(135deg, #ffffff 0%, ${MN.gold} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {netWorth < 0 ? '-' : ''}{fmt(Math.abs(netWorth), true)}
            </div>
            <div style={{ fontSize: 11, color: MN.faint, marginTop: 5 }}>Top {pctile}% of Nautilus users</div>
          </div>
        </div>
      </div>

      {/* ── TODAY'S PRIORITY ── */}
      {topAlert && (
        <Link href="/dashboard/ai-insights" style={{ textDecoration: 'none' }}>
          <div style={{
            background: MN.card, borderRadius: 14, border: `1px solid ${MN.border}`,
            borderLeft: `3px solid ${topAlert.level === 'danger' ? MN.red : topAlert.level === 'warning' ? MN.amber : MN.gold}`,
            padding: '13px 14px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: 20, flexShrink: 0 }}>✦</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: MN.gold, marginBottom: 3 }}>Today's Priority</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: MN.text, lineHeight: 1.4 }}>{topAlert.text}</div>
            </div>
            <div style={{ color: MN.muted, fontSize: 16, flexShrink: 0 }}>›</div>
          </div>
        </Link>
      )}

      {/* ── STAT TILES — each is a deep link ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Cash', value: fmt(totalCash, true), color: MN.gold, href: '/dashboard/net-worth/assets' },
          { label: 'Assets', value: fmt(totalAssets, true), color: MN.green, href: '/dashboard/net-worth/assets' },
          { label: 'Liabilities', value: fmt(totalLiabilities, true), color: MN.red, href: '/dashboard/net-worth/liabilities' },
        ].map(s => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: MN.card, borderRadius: 14, border: `1px solid ${MN.border}`, padding: '12px 12px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: MN.muted, marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── MTD SPEND VS INCOME — whole card links to Cash Flow ── */}
      <Link href="/dashboard/cashflow" style={{ textDecoration: 'none' }}>
      <div style={{ background: MN.card, borderRadius: 16, border: `1px solid ${MN.border}`, padding: '15px 14px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: MN.text }}>This Month</div>
          <span style={{ color: MN.faint, fontSize: 15 }}>›</span>
        </div>
        {[
          { label: 'Income', value: mtdIncome, color: MN.green },
          { label: 'Spent',  value: mtdSpent,  color: MN.red },
        ].map(row => {
          const max = Math.max(mtdIncome, mtdSpent, 1);
          return (
            <div key={row.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: MN.muted }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: row.color, fontVariantNumeric: 'tabular-nums' }}>{fmt(row.value)}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ height: 6, borderRadius: 3, width: `${(row.value / max) * 100}%`, background: row.color, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          );
        })}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${MN.border}` }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: MN.muted }}>Saved so far</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: mtdIncome - mtdSpent >= 0 ? MN.green : MN.red, fontVariantNumeric: 'tabular-nums' }}>
            {mtdIncome - mtdSpent < 0 ? '-' : '+'}{fmt(Math.abs(mtdIncome - mtdSpent))}
          </span>
        </div>
      </div>
      </Link>

      {/* ── BUDGET — left to spend, whole card links to Budget ── */}
      <Link href="/dashboard/budget" style={{ textDecoration: 'none' }}>
        <div style={{ background: MN.card, borderRadius: 16, border: `1px solid ${MN.border}`, padding: '15px 14px', marginBottom: 16 }}>
          {totalBudgeted > 0 ? (() => {
            const remaining = totalBudgeted - mtdSpent;
            const pct = Math.min(110, (mtdSpent / totalBudgeted) * 100);
            const barColor = pct >= 100 ? MN.red : pct >= 85 ? MN.amber : MN.gold;
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: MN.text }}>Budget</div>
                  <span style={{ color: MN.faint, fontSize: 15 }}>›</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: remaining >= 0 ? MN.green : MN.red, fontVariantNumeric: 'tabular-nums' }}>
                    {remaining < 0 ? '-' : ''}{fmt(Math.abs(remaining))}
                  </span>
                  <span style={{ fontSize: 12, color: MN.muted }}>{remaining >= 0 ? 'left to spend this month' : 'over budget'}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', marginBottom: 6 }}>
                  <div style={{ height: 8, borderRadius: 4, width: `${Math.min(100, pct)}%`, background: barColor, transition: 'width 0.8s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: MN.faint }}>
                  {fmt(mtdSpent)} of {fmt(totalBudgeted)} used ({Math.round(pct)}%)
                </div>
              </>
            );
          })() : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>💸</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: MN.text, marginBottom: 2 }}>Set up your budget</div>
                <div style={{ fontSize: 11, color: MN.faint }}>Track spending against monthly limits</div>
              </div>
              <span style={{ color: MN.faint, fontSize: 15 }}>›</span>
            </div>
          )}
        </div>
      </Link>

      {/* ── UPCOMING BILLS — whole card links to Recurring ── */}
      {upcomingBills.length > 0 && (
        <Link href="/dashboard/recurring" style={{ textDecoration: 'none' }}>
        <div style={{ background: MN.card, borderRadius: 16, border: `1px solid ${MN.border}`, padding: '15px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: MN.text }}>Bills Next 14 Days</div>
            <span style={{ color: MN.faint, fontSize: 15 }}>›</span>
          </div>
          {upcomingBills.slice(0, 4).map((bill: any, i: number) => {
            const dueDate = new Date(bill.nextExpectedDate!);
            const daysOut = Math.round((dueDate.getTime() - today.getTime()) / 86_400_000);
            const urgent = daysOut <= 3;
            return (
              <div key={bill.merchantKey} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 0', borderBottom: i < Math.min(upcomingBills.length, 4) - 1 ? `1px solid ${MN.border}` : 'none',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: MN.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bill.merchant}</div>
                  <div style={{ fontSize: 11, color: urgent ? MN.amber : MN.faint, fontWeight: urgent ? 700 : 400, marginTop: 1 }}>
                    {daysOut === 0 ? 'Today' : daysOut === 1 ? 'Tomorrow' : `in ${daysOut} days`}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: MN.text, fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginLeft: 12 }}>
                  {fmt(bill.expectedAmount)}
                </div>
              </div>
            );
          })}
        </div>
        </Link>
      )}

      {/* ── RECENT TRANSACTIONS — whole card links to Cash Flow ── */}
      <Link href="/dashboard/cashflow" style={{ textDecoration: 'none' }}>
      <div style={{ background: MN.card, borderRadius: 16, border: `1px solid ${MN.border}`, padding: '15px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: MN.text }}>Recent Activity</div>
          <span style={{ color: MN.faint, fontSize: 15 }}>›</span>
        </div>
        {recent.length === 0 ? (
          <div style={{ fontSize: 12, color: MN.faint, textAlign: 'center', padding: '14px 0' }}>No recent transactions</div>
        ) : recent.map((t: any, i: number) => {
          const isIncome = t.transaction_type === 'Income';
          return (
            <div key={t.id ?? i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 0', borderBottom: i < recent.length - 1 ? `1px solid ${MN.border}` : 'none',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', fontSize: 14,
              }}>
                {t.logo
                  ? <img src={t.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : getTxEmoji(t.subcategory, t.category)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: MN.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.merchant || 'Transaction'}</div>
                <div style={{ fontSize: 11, color: MN.faint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.category || '—'}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isIncome ? MN.green : MN.text, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {isIncome ? '+' : '-'}{fmt(Math.abs(t.amount ?? 0))}
              </div>
            </div>
          );
        })}
      </div>
      </Link>
    </div>
  );
}

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

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`,
      boxShadow: T.shadow, position: 'relative', overflow: 'hidden', ...style,
    }}>
      {ACCENT_LINE}
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────────────────────────── */
const fmt = (n: number, compact = false) => {
  if (compact && Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (compact && Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
};
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
const today = new Date();
const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });


function scoreLabel(s: number): { label: string; color: string; bg: string; border: string } {
  if (s >= 85) return { label: 'Excellent',        color: 'var(--t-green)',  bg: 'var(--t-green-bg)',  border: 'var(--t-green-border)' };
  if (s >= 70) return { label: 'Good',              color: 'var(--t-primary)', bg: 'var(--t-primary-bg)', border: 'var(--t-primary-border)' };
  if (s >= 55) return { label: 'Fair',              color: 'var(--t-amber)',  bg: 'var(--t-amber-bg)',  border: 'var(--t-amber-border)' };
  if (s >= 40) return { label: 'Needs Attention',   color: 'var(--t-amber)',  bg: 'var(--t-amber-bg)',  border: 'var(--t-amber-border)' };
  return               { label: 'At Risk',           color: 'var(--t-red)',    bg: 'var(--t-red-bg)',    border: 'var(--t-red-border)' };
}

/* ─────────────────────────────────────────────────────────────
   FI ENGINE (lightweight mirror of health page)
───────────────────────────────────────────────────────────── */
function calcFIDate(currentNW: number, annualExpenses: number, monthlySavings: number, currentAge: number) {
  const fiNumber = annualExpenses * 25;
  const r = 0.07 / 12;
  let nw = currentNW, months = 0;
  while (nw < fiNumber && months < 720) { nw = nw * (1 + r) + Math.max(0, monthlySavings); months++; }
  return { months, age: currentAge + months / 12, fiNumber };
}

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────── */

function scoreGrade(s: number): { grade: string; label: string; color: string } {
  if (s >= 90) return { grade: 'A+', label: 'Exceptional', color: 'var(--t-green)' };
  if (s >= 80) return { grade: 'A',  label: 'Excellent',   color: 'var(--t-green)' };
  if (s >= 70) return { grade: 'B+', label: 'Strong',      color: 'var(--t-primary)' };
  if (s >= 60) return { grade: 'B',  label: 'Good',        color: '#0891b2' };
  if (s >= 50) return { grade: 'C',  label: 'Fair',        color: 'var(--t-amber)' };
  if (s >= 40) return { grade: 'D',  label: 'Needs Work',  color: 'var(--t-amber)' };
  return             { grade: 'F',  label: 'Critical',     color: 'var(--t-red)' };
}

function ScoreGauge({ score, size = 160 }: { score: number; size?: number }) {
  const cx = size / 2, cy = size * 0.58;
  const r  = size * 0.40;
  const startAngle = -210, endAngle = 30;
  const sweep = endAngle - startAngle;
  function polarToXY(deg: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  function arcPath(from: number, to: number) {
    const s = polarToXY(from), e = polarToXY(to);
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
  }
  const { color } = scoreGrade(score);
  const fillEnd = startAngle + (score / 100) * sweep;
  const ticks = [0, 20, 40, 60, 80, 100].map(v => {
    const a = startAngle + (v / 100) * sweep;
    const inner = polarToXY(a);
    const outer = { x: cx + (r + 9) * Math.cos((a * Math.PI) / 180), y: cy + (r + 9) * Math.sin((a * Math.PI) / 180) };
    const label = { x: cx + (r + 18) * Math.cos((a * Math.PI) / 180), y: cy + (r + 18) * Math.sin((a * Math.PI) / 180) };
    return { inner, outer, label, v };
  });
  const needleTip = polarToXY(fillEnd);
  return (
    <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`}>
      <path d={arcPath(startAngle, endAngle)} fill="none" stroke={'var(--t-border)'} strokeWidth={15} strokeLinecap="round" />
      <path d={arcPath(startAngle, startAngle + sweep * 0.40)} fill="none" stroke="#FEE2E2" strokeWidth={15} strokeLinecap="round" />
      <path d={arcPath(startAngle + sweep * 0.40, startAngle + sweep * 0.65)} fill="none" stroke="#FEF9C3" strokeWidth={15} strokeLinecap="round" />
      <path d={arcPath(startAngle + sweep * 0.65, endAngle)} fill="none" stroke="#DCFCE7" strokeWidth={15} strokeLinecap="round" />
      <path d={arcPath(startAngle, fillEnd)} fill="none" stroke={color} strokeWidth={15} strokeLinecap="round" />
      {ticks.map(({ inner, outer, label, v }) => (
        <g key={v}>
          <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={'var(--t-border-med)'} strokeWidth={1.5} />
          <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fontSize={8.5} fontWeight={600} fill={'var(--t-text-secondary)'}>{v}</text>
        </g>
      ))}
      <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke={'var(--t-text-primary)'} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={5} fill={'var(--t-text-primary)'} />
      <circle cx={cx} cy={cy} r={2.5} fill={'var(--t-surface)'} />
    </svg>
  );
}

function KpiCard({
  label, value, sub, trend, trendDir, accent,
}: {
  label: string; value: string; sub?: string;
  trend?: string; trendDir?: 'up' | 'down' | 'neutral'; accent?: string;
}) {
  const trendColor = trendDir === 'up' ? 'var(--t-green)' : trendDir === 'down' ? 'var(--t-red)' : 'var(--t-text-tertiary)';
  return (
    <div style={{
      background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`,
      boxShadow: 'var(--t-shadow-sm)', padding: '20px 22px',
      borderLeft: `4px solid ${accent ?? 'var(--t-primary)'}`,
      position: 'relative', overflow: 'hidden',
    }}>
      {ACCENT_LINE}
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--t-card-accent)', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 6 }}>{sub}</div>
      )}
      {trend && (
        <div style={{ fontSize: 12, fontWeight: 600, color: trendColor, marginTop: 4 }}>
          {trendDir === 'up' ? '↑' : trendDir === 'down' ? '↓' : '→'} {trend}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, href, linkLabel = 'View all' }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text-primary)', letterSpacing: '-0.01em' }}>{title}</div>
      {href && (
        <Link href={href} style={{ fontSize: 12, color: 'var(--t-primary)', fontWeight: 600, textDecoration: 'none' }}>
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}


function SubScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--t-text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(score)}</span>
      </div>
      <div style={{ height: 5, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 100, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const isMobile = useMobile();
  const { T: TH } = useDashboardTheme();
  const headingColor = TH.isDark ? '#2ED3C6' : '#0a3fa8';
  const { currentSnapshot, refetch: refetchWealth } = useWealthData();
  const { cashflow, incomeAnalytics, expenseAnalytics, recurringTransactions, transactions: txns, forecastAnalytics, mtdIncome, mtdSpent, mtdSaved, loading, error, refresh: refreshFlow } = useFlowData();

  /* ── Profile + live score from localStorage (set on health page) ── */
  const [fiProfile, setFiProfile] = useState<{ currentAge: number; retirementAge: number } | null>(null);
  const [liveScore, setLiveScore] = useState<number | null>(null);
  useEffect(() => {
    try {
      const p = localStorage.getItem('wl_health_profile'); if (p) setFiProfile(JSON.parse(p));
      const s = localStorage.getItem('wl_score_live'); if (s) setLiveScore(Number(s));
    } catch {}
  }, []);

  /* ── Goals + Budget from Supabase ── */
  const [lifeGoals,   setLifeGoals]   = useState<any[]>([]);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/goals').then(r => r.json()).then(d => { if (Array.isArray(d)) setLifeGoals(d); }).catch(() => {});
    fetch('/api/budgets').then(r => r.json()).then(d => { if (Array.isArray(d)) setBudgetItems(d); }).catch(() => {});
  }, []);

  /* ── Asset / Liability totals ── */
  const snap = currentSnapshot;
  const sumArr = (arr: any[], field: string) =>
    (arr ?? []).reduce((s: number, x: any) => s + Number(x[field] || 0), 0);

  const totalCash        = sumArr(snap?.bankAccounts ?? [],        'balance');
  const totalInvestments = sumArr(snap?.investmentAccounts ?? [],  'balance');
  const totalRetirement  = sumArr(snap?.retirementAccounts ?? [],  'balance');
  const totalRealEstate  = sumArr(snap?.realEstate ?? [],          'value');
  const totalOther       = sumArr(snap?.otherAssets ?? [],         'value');
  const totalAssets      = totalCash + totalInvestments + totalRetirement + totalRealEstate + totalOther;

  const sumLiab = (arr?: { amount?: number }[]) => (arr ?? []).reduce((s, x) => s + (x.amount ?? 0), 0);
  const totalLiabilities = snap
    ? sumLiab(snap.liabilities.mortgage) + sumLiab(snap.liabilities.creditCard) +
      sumLiab(snap.liabilities.auto)     + sumLiab(snap.liabilities.studentLoan) +
      sumLiab(snap.liabilities.other)
    : 0;
  const netWorth = totalAssets - totalLiabilities;

  /* ── Cash Flow — use monthly averages, not period totals ── */
  const monthlyIncome   = incomeAnalytics?.averageMonthlyIncome   ?? cashflow?.totalIncome   ?? 0;
  const monthlyExpenses = expenseAnalytics?.averageMonthlyExpenses ?? cashflow?.totalExpenses ?? 0;
  const netCashFlow     = monthlyIncome - monthlyExpenses;
  const savingsRate     = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : (cashflow?.savingsRate ?? 0);

  /* ── Recurring ── */
  const activeRecurring = useMemo(() =>
    (recurringTransactions ?? []).filter(r => r.isActive),
  [recurringTransactions]);

  const monthlyCommitted = useMemo(() =>
    activeRecurring
      .filter(r => r.transaction_type === 'Expense')
      .reduce((s, r) => s + r.monthlyEquivalent, 0),
  [activeRecurring]);

  const recurringIncomeItems = useMemo(() =>
    activeRecurring.filter(r => r.type === 'income'),
  [activeRecurring]);

  const avgIncomeConfidence = recurringIncomeItems.length
    ? recurringIncomeItems.reduce((s, r) => s + r.confidence, 0) / recurringIncomeItems.length
    : 50;

  const liquidityMonths = monthlyExpenses > 0 ? totalCash / monthlyExpenses : 0;

  const recurringRatio = monthlyExpenses > 0
    ? Math.min(1, monthlyCommitted / monthlyExpenses)
    : 0.5;

  /* ── Nautilus Score dimension scores (same math as health page) ── */
  const annualIncome = monthlyIncome * 12;
  const retirementWealth = totalRetirement + totalInvestments + totalCash;
  const health = useMemo(() => {
    const cf  = Math.round(scoreCashFlow(savingsRate));
    const em  = Math.round(scoreEmergency(liquidityMonths));
    const ret = Math.round(scoreRetirement(retirementWealth, fiProfile?.currentAge ?? 0, annualIncome));
    const res = Math.round(scoreResilience(liquidityMonths, totalLiabilities, annualIncome));
    const total = Math.round(cf * 0.20 + em * 0.15 + ret * 0.20 + res * 0.05);
    return { cf, em, ret, res, total };
  }, [savingsRate, liquidityMonths, retirementWealth, fiProfile, annualIncome, totalLiabilities]);

  const scoreStyle = scoreLabel(health.total);
  // Prefer the full 8-factor score stored by the health page; fall back to partial 4-factor estimate
  const displayScore = liveScore ?? health.total;
  const { grade: healthGrade, label: healthLabel, color: healthColor } = scoreGrade(displayScore);

  /* ── FI projection ── */
  const liquidAssets = totalCash + totalInvestments + totalRetirement;
  const fiResult = fiProfile
    ? calcFIDate(liquidAssets, monthlyExpenses * 12, netCashFlow, fiProfile.currentAge)
    : null;
  const fiReadinessPct = fiResult ? Math.min(100, Math.round((liquidAssets / fiResult.fiNumber) * 100)) : null;
  const fiAge = fiResult ? Math.round(fiResult.age) : null;

  /* ── Bills next 14 days ── */
  const upcomingBills = useMemo(() => {
    const now   = new Date();
    const cutoff = new Date(now.getTime() + 14 * 86_400_000);
    return activeRecurring
      .filter(r => r.type !== 'income' && r.type !== 'transfer' && r.nextExpectedDate)
      .filter(r => {
        const d = new Date(r.nextExpectedDate!);
        return d >= now && d <= cutoff;
      })
      .sort((a, b) => new Date(a.nextExpectedDate!).getTime() - new Date(b.nextExpectedDate!).getTime())
      .slice(0, 6);
  }, [activeRecurring]);

  /* ── Top expense categories ── */
  const topCategories = useMemo(() => {
    const now = new Date();
    const cats: Record<string, number> = {};
    (txns ?? [])
      .filter(t => {
        if (t.transaction_type !== 'Expense') return false;
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .forEach(t => {
        const cat = t.category ?? 'Other';
        cats[cat] = (cats[cat] ?? 0) + Math.abs(t.amount);
      });
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [txns]);

  /* ── Budget KPIs ── */
  const budgetSpending    = budgetItems.filter((i: any) => i.type === 'spending' && i.category !== '__income__');
  const budgetDebts       = budgetItems.filter(i => i.type === 'debt');
  const totalBudgeted     = budgetSpending.reduce((s: number, b: any) => s + b.limit, 0);
  const totalDebtBal      = totalLiabilities;
  const totalDebtPayments = budgetDebts.reduce((s: number, d: any) => s + (d.monthlyPayment ?? 0), 0);

  /* mtdIncome, mtdSpent, mtdSaved come from useFlowData hook */

  /* ── Prior-month + YTD computations ── */
  const { prevMonthSpent, prevMonthIncome, ytdExpenses } = useMemo(() => {
    const now = new Date();
    const curY = now.getFullYear(), curM = now.getMonth();
    const prevY = curM === 0 ? curY - 1 : curY;
    const prevM = curM === 0 ? 11 : curM - 1;
    const prevYM = `${prevY}-${String(prevM + 1).padStart(2, '0')}`;
    let pSpent = 0, pIncome = 0, ytd = 0;
    for (const t of txns ?? []) {
      const amt = Math.abs(Number(t.amount || 0));
      if (t.date?.startsWith(prevYM)) {
        if (t.transaction_type === 'Expense') pSpent  += amt;
        if (t.transaction_type === 'Income')  pIncome += amt;
      }
      if (t.transaction_type === 'Expense' && t.date?.startsWith(String(curY))) {
        ytd += amt;
      }
    }
    return { prevMonthSpent: pSpent, prevMonthIncome: pIncome, ytdExpenses: ytd };
  }, [txns]);

  /* ── Goals KPIs ── */
  const totalGoalSaved   = lifeGoals.reduce((s: number, g: any) => s + (g.currentSaved ?? 0), 0);
  const totalGoalTarget  = lifeGoals.reduce((s: number, g: any) => s + (g.targetAmount ?? 0), 0);
  const totalGoalContrib = lifeGoals.reduce((s: number, g: any) => s + (g.monthlyContrib ?? 0), 0);
  const goalPct          = totalGoalTarget > 0 ? Math.round((totalGoalSaved / totalGoalTarget) * 100) : 0;
  const goalsOnTrack     = lifeGoals.filter((g: any) => {
    if ((g.currentSaved ?? 0) >= (g.targetAmount ?? 0)) return true;
    if (!g.targetDate || !g.monthlyContrib) return false;
    const moLeft    = Math.max(0, (new Date(g.targetDate).getFullYear() - today.getFullYear()) * 12 + (new Date(g.targetDate).getMonth() - today.getMonth()));
    const remaining = Math.max(0, (g.targetAmount ?? 0) - (g.currentSaved ?? 0));
    const needed    = moLeft > 0 ? remaining / moLeft : remaining;
    return g.monthlyContrib >= needed * 0.95;
  }).length;

  /* ── Forecast KPIs (from recurring transactions already in scope) ── */
  const avgMonthlyIncome = useMemo(() => {
    const active = (recurringTransactions ?? []).filter((r: any) => r.isActive);
    return active.filter((r: any) => r.transaction_type === 'Income').reduce((s: number, r: any) => s + r.monthlyEquivalent, 0);
  }, [recurringTransactions]);

  const avgMonthlyExpenses = useMemo(() => {
    const active = (recurringTransactions ?? []).filter((r: any) => r.isActive);
    return active.filter((r: any) => r.transaction_type !== 'Income' && r.transaction_type !== 'Transfer').reduce((s: number, r: any) => s + r.monthlyEquivalent, 0);
  }, [recurringTransactions]);

  const monthlySurplus    = avgMonthlyIncome - avgMonthlyExpenses;
  const projected12mo     = totalCash + monthlySurplus * 12;
  const investableSurplus = Math.max(0, monthlySurplus - totalGoalContrib - totalDebtPayments);

  /* ── Alerts ── */
  const alerts = useMemo(() => {
    const list: { text: string; level: 'warning' | 'info' | 'danger' }[] = [];
    if (netCashFlow < 0) list.push({ text: 'Spending exceeds income this period', level: 'danger' });
    if (savingsRate < 10 && monthlyIncome > 0) list.push({ text: `Savings rate is low at ${savingsRate.toFixed(1)}% — target is 20%+`, level: 'warning' });
    if (liquidityMonths < 3 && totalCash > 0) list.push({ text: `Only ${liquidityMonths.toFixed(1)} months of emergency coverage — target is 3+`, level: 'warning' });
    if (upcomingBills.length > 0) list.push({ text: `${upcomingBills.length} bill${upcomingBills.length > 1 ? 's' : ''} due in the next 14 days`, level: 'info' });
    // Goal deadline alerts
    lifeGoals.forEach((g: any) => {
      if (!g.targetDate) return;
      const moLeft    = Math.max(0, (new Date(g.targetDate).getFullYear() - today.getFullYear()) * 12 + (new Date(g.targetDate).getMonth() - today.getMonth()));
      const remaining = Math.max(0, (g.targetAmount ?? 0) - (g.currentSaved ?? 0));
      if (moLeft <= 3 && remaining > 0)
        list.push({ text: `Goal "${g.name}" is due in ${moLeft} month${moLeft !== 1 ? 's' : ''} — ${fmt(remaining)} still needed`, level: 'warning' });
    });
    if (totalDebtBal > 0 && monthlySurplus > 0 && totalDebtPayments === 0)
      list.push({ text: `${fmt(totalDebtBal)} in tracked debt with no paydown plan set`, level: 'warning' });
    return list.slice(0, 5);
  }, [savingsRate, liquidityMonths, upcomingBills, netCashFlow, monthlyIncome, totalCash, lifeGoals, totalDebtBal, monthlySurplus, totalDebtPayments]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: `3px solid var(--t-border)`, borderTop: `3px solid var(--t-primary)`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)' }}>Loading your financial data…</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── No accounts at all yet — prompt to connect/add instead of an empty dashboard ── */
  const hasAnyAccounts = totalAssets > 0 || totalLiabilities > 0 || (txns?.length ?? 0) > 0;
  if (!hasAnyAccounts) {
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: headingColor, letterSpacing: '-0.02em' }}>
            Nautilus Command Center
          </div>
          <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)', marginTop: 3 }}>{monthName}</div>
        </div>
        <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', position: 'relative', overflow: 'hidden' }}>
          {ACCENT_LINE}
          <NoDataEmptyState
            title="Welcome to Nautilus"
            subtitle="Connect a bank account to see your full financial picture, or add your assets and liabilities manually to get started."
            onPlaidSuccess={() => { refetchWealth(); refreshFlow(); }}
          />
        </div>
      </div>
    );
  }

  /* ── MOBILE BRANCH ── */
  if (isMobile) {
    return (
      <MobileDashboardView
        displayScore={displayScore}
        healthGrade={healthGrade}
        healthLabel={healthLabel}
        netWorth={netWorth}
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
        totalCash={totalCash}
        netCashFlow={netCashFlow}
        liquidityMonths={liquidityMonths}
        mtdSpent={mtdSpent}
        mtdIncome={mtdIncome}
        totalBudgeted={totalBudgeted}
        upcomingBills={upcomingBills}
        txns={txns}
        alerts={alerts}
      />
    );
  }

  /* ── Bars for income vs expense ── */
  const barMax   = Math.max(monthlyIncome, monthlyExpenses, 1);
  const incomePct  = (monthlyIncome   / barMax) * 100;
  const expensePct = (monthlyExpenses / barMax) * 100;

  return (
    <div>

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: headingColor, letterSpacing: '-0.02em' }}>
          Naultilus Command Center
        </div>
        <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)', marginTop: 3 }}>{monthName}</div>
      </div>

      {/* ── FINANCIAL HEALTH SCORE ── */}
      <div style={{
        background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`,
        boxShadow: 'var(--t-shadow-md)', padding: '28px 32px', marginBottom: 24,
        position: 'relative', overflow: 'hidden',
      }}>
        {ACCENT_LINE}
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Score gauge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: 180 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--t-card-accent)', marginBottom: 8 }}>
              Nautilus Score
            </div>
            <div style={{ position: 'relative' }}>
              <ScoreGauge score={displayScore} size={170} />
              <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 800, color: healthColor, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{displayScore}</div>
                <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)' }}>out of 100</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: healthColor }}>{healthGrade}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-text-primary)' }}>{healthLabel}</span>
            </div>
            {(() => {
              const pct = displayScore >= 92 ? 3 : displayScore >= 87 ? 8 : displayScore >= 82 ? 16 : displayScore >= 76 ? 27 : displayScore >= 70 ? 38 : displayScore >= 63 ? 50 : displayScore >= 55 ? 63 : displayScore >= 45 ? 75 : displayScore >= 35 ? 85 : 93;
              return (
                <div style={{ marginTop: 8, fontSize: 11, color: healthColor, fontWeight: 700, textAlign: 'center' }}>
                  Top {pct}% of Nautilus users
                </div>
              );
            })()}
            <Link href="/dashboard/health" style={{ marginTop: 6, fontSize: 11, color: 'var(--t-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Full breakdown →
            </Link>
          </div>

          {/* Divider */}
          <div style={{ width: 1, background: 'var(--t-border)', alignSelf: 'stretch', flexShrink: 0 }} />

          {/* Net Worth Breakdown */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-card-accent)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Net Worth
            </div>
            {/* Three summary boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Assets',      value: totalAssets,       color: 'var(--t-green)' },
                { label: 'Liabilities', value: -totalLiabilities, color: 'var(--t-red)'   },
                { label: 'Net Worth',   value: netWorth,          color: 'var(--t-primary)'},
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--t-inner-box-bg)', border: `1px solid var(--t-inner-box-border)`, borderRadius: T.radiusMd, padding: '10px 12px', borderLeft: `3px solid ${color}` }}>
                  <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                    {value < 0 ? '-' : ''}{fmt(Math.abs(value), true)}
                  </div>
                </div>
              ))}
            </div>
            {/* Asset allocation bars */}
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asset Allocation</div>
            {[
              { label: 'Cash',        value: totalCash,        color: '#00A86B' },
              { label: 'Investments', value: totalInvestments, color: 'var(--t-primary)' },
              { label: 'Retirement',  value: totalRetirement,  color: '#6d30fb' },
              { label: 'Real Estate', value: totalRealEstate,  color: '#FF4D4D' },
              { label: 'Other',       value: totalOther,       color: '#E8B800' },
            ].filter(a => a.value > 0).map(({ label, value, color }) => {
              const pct = totalAssets > 0 ? (value / totalAssets) * 100 : 0;
              return (
                <div key={label} style={{ marginBottom: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: 'var(--t-text-secondary)' }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(value, true)} <span style={{ color: 'var(--t-text-tertiary)', fontWeight: 400 }}>({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 100 }} />
                  </div>
                </div>
              );
            })}
            <Link href="/dashboard/net-worth" style={{ display: 'block', marginTop: 10, fontSize: 11, color: 'var(--t-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Full net worth →
            </Link>
          </div>

          {/* Divider */}
          <div style={{ width: 1, background: 'var(--t-border)', alignSelf: 'stretch', flexShrink: 0 }} />

          {/* FI Projection */}
          <div style={{ flexShrink: 0, minWidth: 160 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-card-accent)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Financial Independence
            </div>
            {fiProfile ? (
              <>
                {/* Top row: FI Readiness (left) + Projected FI Age (right) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--t-text-secondary)', marginBottom: 3 }}>FI Readiness</div>
                    <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
                      color: fiReadinessPct != null && fiReadinessPct >= 70 ? 'var(--t-green)' : fiReadinessPct != null && fiReadinessPct >= 40 ? '#7A90B8' : 'var(--t-red)' }}>
                      {fiReadinessPct != null ? `${fiReadinessPct}%` : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--t-text-secondary)', marginBottom: 3 }}>Proj. FI Age</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--t-primary)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                      {fiAge != null ? fiAge : '—'}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {fiResult && (
                  <div style={{ height: 4, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden', marginBottom: 5 }}>
                    <div style={{ height: '100%', width: `${fiReadinessPct ?? 0}%`, borderRadius: 100,
                      background: fiReadinessPct != null && fiReadinessPct >= 80 ? 'var(--t-green)' : fiReadinessPct != null && fiReadinessPct >= 50 ? 'var(--t-amber)' : 'var(--t-red)' }} />
                  </div>
                )}

                {/* FI Number */}
                {fiResult && (
                  <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginBottom: 14 }}>
                    FI Number: <span style={{ fontWeight: 700, color: 'var(--t-text-secondary)' }}>{fmt(fiResult.fiNumber, true)}</span>
                  </div>
                )}

                <Link href="/dashboard/health" style={{ display: 'block', marginTop: 6, fontSize: 11, color: 'var(--t-primary)', fontWeight: 600, textDecoration: 'none', marginBottom: 12 }}>
                  Full FI analysis →
                </Link>

                {/* Bottom metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'Monthly Cash Flow', value: fmt(netCashFlow), color: netCashFlow >= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)' },
                    { label: 'Emergency Coverage', value: `${Math.min(liquidityMonths, 99).toFixed(1)} mo`, color: liquidityMonths >= 6 ? 'var(--t-green-text)' : liquidityMonths >= 3 ? 'var(--t-text-secondary)' : 'var(--t-red-text)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--t-text-secondary)' }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', lineHeight: 1.6, marginBottom: 10 }}>
                  Set your age on the Nautilus Score page to unlock your FI projection.
                </div>
                <Link href="/dashboard/health" style={{ fontSize: 12, color: 'var(--t-primary)', fontWeight: 600, textDecoration: 'none' }}>
                  Set up profile →
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard
          label="MTD Expenses"
          value={fmt(mtdSpent, true)}
          sub={prevMonthSpent > 0 ? `Prior month: ${fmt(prevMonthSpent, true)}` : monthName}
          trend={prevMonthSpent > 0 ? (() => { const d = mtdSpent - prevMonthSpent; return `${d >= 0 ? '+' : ''}${fmt(d, true)} vs last mo`; })() : undefined}
          trendDir={prevMonthSpent > 0 ? (mtdSpent <= prevMonthSpent ? 'up' : 'down') : undefined}
          accent={'var(--t-red)'}
        />
        <KpiCard
          label="MTD Income"
          value={fmt(mtdIncome, true)}
          sub={prevMonthIncome > 0 ? `Prior month: ${fmt(prevMonthIncome, true)}` : monthName}
          trend={prevMonthIncome > 0 ? (() => { const d = mtdIncome - prevMonthIncome; return `${d >= 0 ? '+' : ''}${fmt(d, true)} vs last mo`; })() : undefined}
          trendDir={prevMonthIncome > 0 ? (mtdIncome >= prevMonthIncome ? 'up' : 'down') : undefined}
          accent={'var(--t-green)'}
        />
        <KpiCard
          label="Monthly Cash Flow"
          value={fmt(netCashFlow)}
          sub={`${monthName}`}
          trend={netCashFlow >= 0 ? 'Positive' : 'Negative'}
          trendDir={netCashFlow >= 0 ? 'up' : 'down'}
          accent={netCashFlow >= 0 ? 'var(--t-green)' : 'var(--t-red)'}
        />
        <KpiCard
          label="YTD Expenses"
          value={fmt(ytdExpenses, true)}
          sub={`Jan – ${today.toLocaleDateString('en-US', { month: 'short' })} ${today.getFullYear()}`}
          accent={'var(--t-amber)'}
        />
        <KpiCard
          label="Emergency Coverage"
          value={`${Math.min(liquidityMonths, 99).toFixed(1)} mo`}
          sub={fmt(totalCash) + ' cash'}
          trend={liquidityMonths >= 3 ? '3-month target met' : 'Below 3-month target'}
          trendDir={liquidityMonths >= 3 ? 'up' : 'down'}
          accent={liquidityMonths >= 3 ? 'var(--t-green)' : 'var(--t-amber)'}
        />
      </div>

      {/* ── BUDGET / FORECAST / GOALS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>

        {/* Budget */}
        <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
          {ACCENT_LINE}
          <SectionHeader title="Budget" href="/dashboard/budget" linkLabel="View budget →" />
          {totalBudgeted === 0 ? (
            <div style={{ background: 'var(--t-primary-bg)', borderRadius: T.radiusMd, border: `1px dashed var(--t-primary-border)`, padding: '18px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>💸</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-primary)', marginBottom: 4 }}>No budget set yet</div>
              <Link href="/dashboard/budget" style={{ fontSize: 12, color: 'var(--t-primary)', fontWeight: 600, textDecoration: 'none' }}>Set up budget →</Link>
            </div>
          ) : (() => {
            const budgetPct  = Math.min(110, totalBudgeted > 0 ? (mtdSpent / totalBudgeted) * 100 : 0);
            const amountLeft = totalBudgeted - mtdSpent;
            const ringColor  = budgetPct >= 100 ? 'var(--t-red)' : budgetPct >= 85 ? 'var(--t-amber)' : 'var(--t-primary)';
            const leftColor  = amountLeft >= 0 ? 'var(--t-green)' : 'var(--t-red)';
            const R = 50, stroke = 10, circ = 2 * Math.PI * R;
            const dash = (Math.min(100, budgetPct) / 100) * circ;
            const savedColor = mtdSaved >= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)';
            const rows = [
              { label: 'Budget',       value: totalBudgeted, color: 'var(--t-primary)',    dividerAfter: false },
              { label: 'MTD Spent',    value: mtdSpent,      color: 'var(--t-red-text)',   dividerAfter: false },
              { label: 'Amount Left',  value: amountLeft,    color: leftColor,             dividerAfter: true  },
              { label: 'MTD Income',   value: mtdIncome,     color: 'var(--t-green-text)', dividerAfter: false },
              { label: 'Amount Saved', value: mtdSaved,      color: savedColor,            dividerAfter: false },
            ];
            return (
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ flex: '0 1 68%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {rows.map(({ label, value, color, dividerAfter }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--t-text-secondary)' }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
                          {value < 0 ? '-' : ''}{fmt(Math.abs(value))}
                        </span>
                      </div>
                      {dividerAfter && <div style={{ height: 1, background: 'var(--t-border)', margin: '6px 0 2px' }} />}
                    </div>
                  ))}
                </div>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <svg width={120} height={120} viewBox="0 0 120 120">
                    <circle cx={60} cy={60} r={R} fill="none" stroke="var(--t-border)" strokeWidth={stroke} />
                    <circle cx={60} cy={60} r={R} fill="none" stroke={ringColor} strokeWidth={stroke}
                      strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 60 60)"
                      style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                    <text x={60} y={56} textAnchor="middle" fontSize={15} fontWeight={800} fill="var(--t-text-primary)" fontFamily="var(--font-body)">{Math.round(budgetPct)}%</text>
                    <text x={60} y={72} textAnchor="middle" fontSize={10} fill="var(--t-text-tertiary)" fontFamily="var(--font-body)">used</text>
                  </svg>
                  <span style={{ fontSize: 10, color: 'var(--t-text-tertiary)', fontWeight: 600 }}>MTD Budget</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Monthly Forecast */}
        <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
          {ACCENT_LINE}
          <SectionHeader title="Monthly Forecast" href="/dashboard/forecast" linkLabel="Full forecast →" />
          {!forecastAnalytics || forecastAnalytics.recurringExpenseCount === 0 ? (
            <div style={{ background: 'var(--t-primary-bg)', borderRadius: T.radiusMd, border: `1px dashed var(--t-primary-border)`, padding: '18px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>📈</div>
              <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)' }}>Add transactions to generate your forecast.</div>
              <Link href="/dashboard/forecast" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: 'var(--t-primary)', fontWeight: 600, textDecoration: 'none' }}>Go to Forecast →</Link>
            </div>
          ) : (() => {
            const fa = forecastAnalytics;
            const cfColor = fa.eomProjectedCashFlow >= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)';
            const today_d = new Date();
            const dayOfMonth = today_d.getDate();
            const daysInMonth = new Date(today_d.getFullYear(), today_d.getMonth() + 1, 0).getDate();
            const fRows = [
              { label: 'Fixed Expenses',  value: fa.eomFixedExpenses,         color: 'var(--t-red-text)',   sub: `${fa.recurringExpenseCount} recurring · ${fa.recurringExpensePaidCount} paid`, dividerAfter: false },
              { label: 'Discretionary',   value: fa.eomDiscretionaryProjected, color: 'var(--t-red-text)',   sub: `pace · day ${dayOfMonth} of ${daysInMonth}`,                                  dividerAfter: false },
              { label: 'EOM Expenses',    value: fa.eomTotalExpenses,          color: 'var(--t-red-text)',   sub: null,                                                                           dividerAfter: false },
              { label: 'EOM Income',      value: fa.eomProjectedIncome,        color: 'var(--t-green-text)', sub: null,                                                                           dividerAfter: true  },
              { label: 'Income vs Spend', value: fa.eomProjectedCashFlow,      color: cfColor,               sub: null,                                                                           dividerAfter: false },
            ];
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {fRows.map(({ label, value, color, sub, dividerAfter }) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div>
                        <span style={{ fontSize: 12, color: 'var(--t-text-secondary)' }}>{label}</span>
                        {sub && <span style={{ fontSize: 10, color: 'var(--t-text-tertiary)', marginLeft: 5 }}>{sub}</span>}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginLeft: 8 }}>
                        {value < 0 ? '-' : ''}{fmt(Math.abs(value))}
                      </span>
                    </div>
                    {dividerAfter && <div style={{ height: 1, background: 'var(--t-border)', margin: '6px 0 2px' }} />}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Goals */}
        <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
          {ACCENT_LINE}
          <SectionHeader title="Goals" href="/dashboard/goals" linkLabel={lifeGoals.length > 0 ? 'View all →' : 'Create goal →'} />
          {lifeGoals.length === 0 ? (
            <div style={{ background: 'var(--t-purple-bg)', borderRadius: T.radiusMd, border: `1px dashed rgba(124,58,237,0.3)`, padding: '18px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>🎯</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-purple)', marginBottom: 4 }}>No goals yet</div>
              <Link href="/dashboard/goals" style={{ fontSize: 12, color: 'var(--t-purple)', fontWeight: 600, textDecoration: 'none' }}>Create your first goal →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--t-text-secondary)', marginBottom: 2 }}>On Track</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: goalsOnTrack === lifeGoals.length ? 'var(--t-green)' : 'var(--t-amber)' }}>{goalsOnTrack} / {lifeGoals.length}</div>
                </div>
                {totalGoalContrib > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--t-text-secondary)', marginBottom: 2 }}>Monthly Saving</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--t-purple)', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalGoalContrib)}</div>
                  </div>
                )}
              </div>
              <div style={{ height: 1, background: 'var(--t-border)', marginBottom: 10 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {lifeGoals.slice(0, 3).map((g: any) => {
                  const pct = g.targetAmount > 0 ? Math.min(100, (g.currentSaved / g.targetAmount) * 100) : 0;
                  return (
                    <div key={g.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span style={{ fontSize: 13, flexShrink: 0 }}>{g.emoji}</span>
                          <span style={{ fontSize: 12, color: 'var(--t-text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--t-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(g.currentSaved, true)} / {fmt(g.targetAmount, true)}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: g.color, fontVariantNumeric: 'tabular-nums', minWidth: 34, textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div style={{ height: 4, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: g.color, borderRadius: 100, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {lifeGoals.length > 0 && (
                <>
                  <div style={{ height: 1, background: 'var(--t-border)', margin: '10px 0 8px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--t-text-secondary)', marginBottom: 1 }}>Total Saved</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-green-text)', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalGoalSaved, true)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--t-text-secondary)', marginBottom: 1 }}>Total Target</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalGoalTarget, true)}</div>
                    </div>
                  </div>
                  {lifeGoals.length > 3 && (
                    <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', textAlign: 'center', marginTop: 6 }}>+{lifeGoals.length - 3} more goal{lifeGoals.length - 3 !== 1 ? 's' : ''}</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '8fr 5fr', gap: 20 }}>

        {/* ─── LEFT COLUMN ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* MTD Expense Trend */}
          {(() => {
            const now         = new Date();
            const year        = now.getFullYear();
            const month       = now.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const ym          = `${year}-${String(month + 1).padStart(2, '0')}`;

            // Sum expenses per day for the current month
            const dailyTotals: Record<number, number> = {};
            for (const t of (txns ?? [])) {
              if (!t.date?.startsWith(ym) || t.transaction_type !== 'Expense') continue;
              const d = parseInt(t.date.split('-')[2], 10);
              dailyTotals[d] = (dailyTotals[d] ?? 0) + Math.abs(Number(t.amount ?? 0));
            }

            // Build cumulative series starting at day 0 = $0
            const todayDay = now.getDate();
            let running = 0;
            const allPoints: { day: number; total: number }[] = [{ day: 0, total: 0 }];
            for (let d = 1; d <= todayDay; d++) {
              running += dailyTotals[d] ?? 0;
              allPoints.push({ day: d, total: running });
            }
            const mtdTotal = running;

            // Fixed 5-day ticks: 5, 10, 15, 20, 25, 30
            const ticks = [0];
            for (let d = 5; d <= daysInMonth; d += 5) ticks.push(d);
            if (ticks[ticks.length - 1] !== daysInMonth) ticks.push(daysInMonth);

            const lineColor = TH.isDark ? '#2ED3C6' : '#0a3fa8';

            return (
              <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
                {ACCENT_LINE}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text-primary)' }}>Monthly Expense Trend</div>
                    <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 2 }}>Cumulative spending · {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginBottom: 2 }}>MTD Expenses</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--t-red-text)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{fmt(mtdTotal)}</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={allPoints} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={lineColor} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={lineColor} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      ticks={ticks}
                      tickFormatter={d => d === 0 ? '' : `${d}`}
                      tick={{ fontSize: 11, fill: 'var(--t-text-tertiary)' }}
                      axisLine={false} tickLine={false}
                      domain={[0, daysInMonth]}
                      type="number"
                    />
                    <YAxis
                      tickFormatter={v => v === 0 ? '' : `$${(v / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11, fill: 'var(--t-text-tertiary)' }}
                      axisLine={false} tickLine={false} width={42}
                    />
                    <Tooltip
                      formatter={(v: number) => [fmt(v), 'Total Spent']}
                      labelFormatter={(d: number) => `Day ${d}`}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--t-border)', background: 'var(--t-surface)', color: 'var(--t-text-primary)' }}
                    />
                    <Area
                      type="monotone" dataKey="total"
                      stroke={lineColor} strokeWidth={2}
                      fill="url(#expGrad)"
                      dot={false} activeDot={{ r: 4, fill: lineColor }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            );
          })()}

          {/* Cash Flow This Period */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            {ACCENT_LINE}
            <SectionHeader title="Cash Flow This Period" href="/dashboard/cashflow" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ background: 'var(--t-inner-box-bg)', borderRadius: T.radiusMd, padding: '14px 16px', border: `1px solid var(--t-inner-box-border)` }}>
                <div style={{ fontSize: 11, color: 'var(--t-green-text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Total Income</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--t-green)', fontVariantNumeric: 'tabular-nums' }}>{fmt(monthlyIncome)}</div>
              </div>
              <div style={{ background: 'var(--t-inner-box-bg)', borderRadius: T.radiusMd, padding: '14px 16px', border: `1px solid var(--t-inner-box-border)` }}>
                <div style={{ fontSize: 11, color: 'var(--t-red-text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Total Expenses</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--t-red)', fontVariantNumeric: 'tabular-nums' }}>{fmt(monthlyExpenses)}</div>
              </div>
            </div>
            {/* Visual income vs expense bars */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--t-text-secondary)' }}>Income</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-green-text)', fontVariantNumeric: 'tabular-nums' }}>{fmt(monthlyIncome)}</span>
              </div>
              <div style={{ height: 10, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${incomePct}%`, background: 'var(--t-green)', borderRadius: 100 }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--t-text-secondary)' }}>Expenses</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-red-text)', fontVariantNumeric: 'tabular-nums' }}>{fmt(monthlyExpenses)}</span>
              </div>
              <div style={{ height: 10, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${expensePct}%`, background: 'var(--t-red)', borderRadius: 100 }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: netCashFlow >= 0 ? 'var(--t-green-bg)' : 'var(--t-red-bg)', borderRadius: T.radiusMd, border: `1px solid ${netCashFlow >= 0 ? 'var(--t-green-border)' : 'var(--t-red-border)'}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-text-secondary)' }}>Net Cash Flow</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: netCashFlow >= 0 ? 'var(--t-green)' : 'var(--t-red)', fontVariantNumeric: 'tabular-nums' }}>
                {netCashFlow >= 0 ? '+' : ''}{fmt(netCashFlow)}
              </span>
            </div>
          </div>

          {/* Top Spending Categories */}
          {topCategories.length > 0 && (
            <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            {ACCENT_LINE}
              <SectionHeader title="Top Spending Categories" href="/dashboard/expenses" />
              {(() => {
                const totalThisMonth = topCategories.reduce((s, [, v]) => s + v, 0);
                return topCategories.map(([cat, amount], i) => {
                const pct = totalThisMonth > 0 ? (amount / totalThisMonth) * 100 : 0;
                const catColors = ['#0a3fa8', '#6d30fb', '#FF4D4D', '#00A86B', '#E8B800'];
                const color = catColors[i % catColors.length];
                return (
                  <div key={cat} style={{ marginBottom: i < topCategories.length - 1 ? 14 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: 'var(--t-text-secondary)' }}>{cat}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: 'var(--t-text-tertiary)' }}>{pct.toFixed(0)}%</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums', minWidth: 80, textAlign: 'right' }}>{fmt(amount)}</span>
                      </div>
                    </div>
                    <div style={{ height: 5, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 100 }} />
                    </div>
                  </div>
                );
              });
              })()}
            </div>
          )}
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Recent Transactions */}
          {(() => {
            const todayStr = today.toISOString().split('T')[0];
            const cutoff   = new Date(today); cutoff.setDate(cutoff.getDate() - 7);
            const cutoffStr = cutoff.toISOString().split('T')[0];

            const recent = (txns ?? [])
              .filter(t => t.date && t.date >= cutoffStr && t.date <= todayStr)
              .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || (b.amount ?? 0) - (a.amount ?? 0))
              .slice(0, 10);

            // Group by date
            const byDate = new Map<string, typeof recent>();
            for (const t of recent) {
              const d = t.date ?? '';
              if (!byDate.has(d)) byDate.set(d, []);
              byDate.get(d)!.push(t);
            }

            const formatDateHeader = (dateStr: string) => {
              if (dateStr === todayStr) return 'Today';
              const yest = new Date(today); yest.setDate(yest.getDate() - 1);
              if (dateStr === yest.toISOString().split('T')[0]) return 'Yesterday';
              const d = new Date(dateStr + 'T00:00:00');
              return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            };

            const typeEmoji = (t: any) =>
              t.transaction_type === 'Income' ? '💰' : t.transaction_type === 'Transfer' ? '🔄' : '💳';

            return (
              <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
                {ACCENT_LINE}
                <SectionHeader title="Recent Transactions" href="/dashboard/cashflow" linkLabel="View all →" />
                {recent.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)', textAlign: 'center', padding: '16px 0' }}>No transactions in the last 7 days</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {Array.from(byDate.entries()).map(([dateStr, group]) => (
                      <div key={dateStr}>
                        {/* Date header */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 0 6px' }}>
                          {formatDateHeader(dateStr)}
                        </div>
                        {group.map((t, i) => {
                          const isIncome   = t.transaction_type === 'Income';
                          const isTransfer = t.transaction_type === 'Transfer';
                          const amtColor   = isIncome ? 'var(--t-green-text)' : isTransfer ? 'var(--t-text-secondary)' : 'var(--t-red-text)';
                          const amtPrefix  = isIncome ? '+' : isTransfer ? '' : '-';
                          const sub        = t.subcategory ?? t.category ?? t.transaction_type;
                          const subEmoji   = getTxEmoji(t.subcategory, t.category);
                          return (
                            <div key={t.id ?? i} style={{
                              display: 'grid',
                              gridTemplateColumns: '28px 1fr 150px 76px',
                              alignItems: 'center',
                              gap: '0 8px',
                              padding: '6px 0',
                              borderBottom: `1px solid var(--t-border)`,
                            }}>
                              {/* Logo */}
                              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--t-bg)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 13 }}>
                                {t.logo
                                  ? <img src={t.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : typeEmoji(t)}
                              </div>
                              {/* Merchant */}
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                                {t.merchant || 'Transaction'}
                              </div>
                              {/* Subcategory — fixed width so all rows align */}
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ flexShrink: 0 }}>{subEmoji}</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span>
                              </div>
                              {/* Amount */}
                              <div style={{ fontSize: 13, fontWeight: 700, color: amtColor, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', textAlign: 'right' }}>
                                {amtPrefix}{fmt(Math.abs(t.amount ?? 0))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Upcoming Bills */}
          <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            {ACCENT_LINE}
            <SectionHeader title="Bills Next 14 Days" href="/dashboard/recurring" />
            {upcomingBills.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)', textAlign: 'center', padding: '16px 0' }}>No bills due in the next 14 days</div>
            ) : (
              upcomingBills.map((bill, i) => {
                const dueDate  = new Date(bill.nextExpectedDate!);
                const daysOut  = Math.round((dueDate.getTime() - today.getTime()) / 86_400_000);
                const dateStr  = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const urgent   = daysOut <= 3;
                return (
                  <div key={bill.merchantKey} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 0', borderBottom: i < upcomingBills.length - 1 ? `1px solid var(--t-border)` : 'none',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {bill.merchant}
                      </div>
                      <div style={{ fontSize: 11, color: urgent ? 'var(--t-amber)' : 'var(--t-text-tertiary)', marginTop: 1, fontWeight: urgent ? 600 : 400 }}>
                        {dateStr} · {daysOut === 0 ? 'Today' : daysOut === 1 ? 'Tomorrow' : `${daysOut}d`}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-red-text)', fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginLeft: 12 }}>
                      {fmt(bill.expectedAmount)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div style={{ background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            {ACCENT_LINE}
              <SectionHeader title="Alerts" />
              {alerts.map((alert, i) => {
                const alertStyle = alert.level === 'danger'
                  ? { bg: 'var(--t-red-bg)',   border: 'var(--t-red-border)',   color: 'var(--t-red-text)',   dot: 'var(--t-red)' }
                  : alert.level === 'warning'
                  ? { bg: 'var(--t-amber-bg)', border: 'var(--t-amber-border)', color: 'var(--t-amber-text)', dot: 'var(--t-amber)' }
                  : { bg: 'var(--t-primary-bg)', border: 'var(--t-primary-border)', color: 'var(--t-primary)', dot: 'var(--t-primary)' };
                return (
                  <div key={i} style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    padding: '10px 12px', borderRadius: T.radiusMd,
                    background: alertStyle.bg, border: `1px solid ${alertStyle.border}`,
                    marginBottom: i < alerts.length - 1 ? 8 : 0,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: alertStyle.dot, flexShrink: 0, marginTop: 4 }} />
                    <div style={{ fontSize: 12, color: alertStyle.color, lineHeight: 1.5 }}>{alert.text}</div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
