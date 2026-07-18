'use client';

import Link from 'next/link';
import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LabelList,
  CartesianGrid,
} from 'recharts';
import { useFinancialData, type TrendPoint } from '../../lib/financialdatacontext';
import MobileScrubChart from '../../components/finance/MobileScrubChart';
import MobileMonthStrip from '../../components/finance/MobileMonthStrip';
import { useFinancialData as useFlowData } from '../../lib/hooks/usefinancialdata';
import { useDashboardTheme } from '../../lib/dashboardthemecontext';
import { useUserProfile } from '../../lib/hooks/useuserprofile';
import { getDALabel } from '../health/page';

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

/* ─── brand accent constants (same in light + dark) ─── */
const BRAND = {
  gold:      '#2ED3C6',
  goldLight: '#67E6D5',
  accent:    '#4DA3FF',
  red:       '#F87171',
  green:     '#34D399',
};

/* ─── formatters ─── */
const fmt = (n: number) =>
  '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

const fmtSigned = (n: number) => (n < 0 ? '-' : '') + fmt(n);

const fmtK = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return fmtSigned(n);
};

/* ─── custom tooltip ─── */
function ChartTooltip({ active, payload, label }: any) {
  const { T } = useDashboardTheme();
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.tooltipBg,
      border: `1px solid ${T.tooltipBorder}`,
      borderRadius: 12,
      padding: '12px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ color: T.muted, fontSize: 12, marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: T.muted, fontSize: 13 }}>{p.name}</span>
          <span style={{ color: T.text, fontSize: 13, fontWeight: 700, marginLeft: 'auto' }}>{fmtSigned(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── enhanced range tooltip ─── */
function RangeTooltip({ active, payload, label }: any) {
  const { T } = useDashboardTheme();
  if (!active || !payload?.length) return null;
  const nw  = payload.find((p: any) => p.dataKey === 'netWorth');
  const ast = payload.find((p: any) => p.dataKey === 'assets');
  const lib = payload.find((p: any) => p.dataKey === 'liabilities');
  return (
    <div style={{
      background: T.tooltipBg, border: `1px solid ${T.tooltipBorder}`,
      borderRadius: 14, padding: '14px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      minWidth: 200,
    }}>
      <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      {nw  && <Row label="Net Worth"    value={nw.value}  color={BRAND.gold}  T={T} />}
      {ast && <Row label="Total Assets" value={ast.value} color={BRAND.green} T={T} />}
      {lib && <Row label="Liabilities"  value={lib.value} color={BRAND.red}   T={T} />}
      {nw && ast && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: T.muted }}>Debt / Asset</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>
            {ast.value > 0 ? ((lib.value / ast.value) * 100).toFixed(1) : 0}%
          </span>
        </div>
      )}
    </div>
  );
}
function Row({ label, value, color, T }: { label: string; value: number; color: string; T: any }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: T.muted }}>{label}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
        {(value < 0 ? '-$' : '$') + Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </span>
    </div>
  );
}

/* ─── card ─── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const { T } = useDashboardTheme();
  return (
    <div style={{
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderRadius: 20,
      boxShadow: `0 0 0 1px ${T.isDark ? 'rgba(46,211,198,0.07)' : 'rgba(0,0,0,0.04)'}, 0 8px 40px rgba(0,0,0,0.${T.isDark ? '35' : '08'})`,
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 1,
        background: T.isDark
          ? `linear-gradient(90deg, transparent, ${BRAND.gold}, ${BRAND.goldLight}, ${BRAND.gold}, transparent)`
          : `linear-gradient(90deg, transparent, #0a3fa8, #4da3ff, #0a3fa8, transparent)`,
      }} />
      {children}
    </div>
  );
}

/* ─── section label ─── */
function Label({ children }: { children: React.ReactNode }) {
  const { T } = useDashboardTheme();
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: T.isDark ? 'rgba(46,211,198,0.65)' : T.muted,
      marginBottom: 6,
    }}>{children}</div>
  );
}

type Range = '6M' | '1Y' | '2Y' | 'All';

/* ══════════════════════════════════════════════════════
   MOBILE VIEW
══════════════════════════════════════════════════════ */
function MobileNetWorthSummaryView({
  netWorth, totalAssets, totalLiabilities,
  nwChange, nwChangePct, nwUp,
  priorAssets, priorLiabilities, periodType,
  rangeChartData, trendData,
  debtToAsset,
  totalMortgage, totalCC, totalAuto, totalStudent, totalOtherL,
  allocData,
  selectedMonthKey, setSelectedMonthKey,
}: {
  netWorth: number; totalAssets: number; totalLiabilities: number;
  nwChange: number; nwChangePct: number; nwUp: boolean;
  priorAssets: number; priorLiabilities: number; periodType: string;
  rangeChartData: TrendPoint[]; trendData: TrendPoint[];
  debtToAsset: number;
  totalMortgage: number; totalCC: number; totalAuto: number; totalStudent: number; totalOtherL: number;
  allocData: { name: string; value: number; color: string }[];
  selectedMonthKey: string;
  setSelectedMonthKey: (key: string) => void;
}) {
  const N = { bg: '#0F2044', card: '#172554', border: 'rgba(255,255,255,0.08)', text: '#ffffff', muted: 'rgba(255,255,255,0.55)' };

  /* SVG bar chart — assets vs liabilities (last 8 months) */
  const barData = rangeChartData.slice(-8);
  const maxVal = Math.max(...barData.flatMap(d => [d.assets, d.liabilities]), 1);
  const BAR_H = 120;
  const SVG_W = Math.max(320, barData.length * 52);

  /* SVG sparkline for wealth over time */
  const sparkData = trendData.length > 1 ? trendData : rangeChartData;
  const sparkMin = Math.min(...sparkData.map(d => d.netWorth));
  const sparkMax = Math.max(...sparkData.map(d => d.netWorth));
  const sparkRange = sparkMax - sparkMin || 1;
  const SPARK_W = 320;
  const SPARK_H = 80;

  const sparkLinePath = sparkData.map((d, i) => {
    const x = (i / Math.max(sparkData.length - 1, 1)) * SPARK_W;
    const y = SPARK_H - ((d.netWorth - sparkMin) / sparkRange) * (SPARK_H - 8) - 4;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const sparkAreaPath = sparkLinePath + ` L${SPARK_W},${SPARK_H} L0,${SPARK_H} Z`;

  const isUp = nwChange >= 0;
  const netWorthColor = netWorth >= 0 ? BRAND.green : BRAND.red;

  const [smy, smm] = selectedMonthKey.split('-').map(Number);
  const selectedDate = new Date(smy, (smm || 1) - 1, 1);

  return (
    <div style={{ color: N.text, fontFamily: 'var(--font-body)', padding: '0 0 16px' }}>

      {/* ── HERO CARD ── */}
      <div style={{
        background: `linear-gradient(135deg, #0a3fa8 0%, #0F2044 100%)`,
        borderRadius: 0,
        padding: '20px 20px 16px',
        margin: '-16px -16px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(77,163,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(77,163,255,0.06) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, transparent, ${BRAND.gold}, ${BRAND.goldLight}, ${BRAND.gold}, transparent)` }} />

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(46,211,198,0.75)', marginBottom: 6 }}>
            Total Net Worth · {selectedMonthKey}
          </div>
          <div style={{
            fontSize: 32, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 10,
            backgroundImage: `linear-gradient(135deg, #ffffff 0%, ${BRAND.gold} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {fmtSigned(netWorth)}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: isUp ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
            border: `1px solid ${isUp ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}`,
            borderRadius: 100, padding: '5px 12px',
            fontSize: 13, fontWeight: 700, color: isUp ? BRAND.green : BRAND.red,
          }}>
            {isUp ? '▲' : '▼'} {fmt(nwChange)} ({nwChangePct >= 0 ? '+' : ''}{nwChangePct.toFixed(1)}%)
            <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400, marginLeft: 4 }}>vs prior {periodType}</span>
          </div>

          {/* scrubbable trendline */}
          {sparkData.length > 1 && (
            <MobileScrubChart height={104}
              data={sparkData.map(d => ({ label: d.label, value: d.netWorth }))}
              formatValue={v => fmtSigned(v)}
            />
          )}

          {/* month pills — extension of the hero, no separate row above */}
          <MobileMonthStrip
            currentDate={selectedDate}
            onChange={(d) => setSelectedMonthKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)}
            variant="hero"
          />
        </div>
      </div>

      {/* ── THREE STAT TILES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Net Worth',   value: netWorth,         color: netWorthColor, icon: '◈' },
          { label: 'Assets',      value: totalAssets,      color: BRAND.green,   icon: '📈' },
          { label: 'Liabilities', value: totalLiabilities, color: BRAND.red,     icon: '📋' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{
            background: N.card, borderRadius: 14,
            border: `1px solid ${N.border}`, padding: '14px 12px',
          }}>
            <div style={{ fontSize: 16, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: N.muted, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color, letterSpacing: '-0.02em', wordBreak: 'break-all' }}>{fmtK(value)}</div>
          </div>
        ))}
      </div>

      {/* ── ASSETS VS LIABILITIES CHART ── */}
      <div style={{ background: N.card, borderRadius: 16, border: `1px solid ${N.border}`, padding: '16px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: N.text, marginBottom: 8 }}>Assets vs Liabilities</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Assets',      value: totalAssets,      color: BRAND.green },
            { label: 'Liabilities', value: totalLiabilities, color: '#4DA3FF'   },
            { label: 'Net Worth',   value: netWorth,         color: BRAND.gold  },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 9, color: N.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{fmtK(s.value)}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <svg width={SVG_W} height={BAR_H + 28} viewBox={`0 0 ${SVG_W} ${BAR_H + 28}`}>
            {barData.map((d, i) => {
              const groupW = SVG_W / barData.length;
              const gx = i * groupW;
              const bw = Math.min(16, groupW * 0.35);
              const aH = (d.assets / maxVal) * BAR_H;
              const lH = (d.liabilities / maxVal) * BAR_H;
              return (
                <g key={i}>
                  <rect x={gx + groupW / 2 - bw - 2} y={BAR_H - aH} width={bw} height={Math.max(aH, 1)}
                    fill={BRAND.green} rx={3} opacity={0.85} />
                  <rect x={gx + groupW / 2 + 2} y={BAR_H - lH} width={bw} height={Math.max(lH, 1)}
                    fill="#4DA3FF" rx={3} opacity={0.85} />
                  <text x={gx + groupW / 2} y={BAR_H + 18} textAnchor="middle"
                    fontSize={9} fill="rgba(255,255,255,0.45)" fontWeight={600}>
                    {d.label}
                  </text>
                </g>
              );
            })}
            <line x1={0} y1={BAR_H} x2={SVG_W} y2={BAR_H}
              stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
          </svg>
        </div>
      </div>

      {/* ── WEALTH OVER TIME ── */}
      <div style={{ background: N.card, borderRadius: 16, border: `1px solid ${N.border}`, padding: '16px 14px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: N.text }}>Wealth Over Time</div>
            <div style={{ fontSize: 11, color: N.muted, marginTop: 2 }}>Net worth trend</div>
          </div>
          {sparkData.length > 1 && (
            <div style={{
              fontSize: 13, fontWeight: 800,
              color: (sparkData[sparkData.length - 1].netWorth) >= (sparkData[0].netWorth) ? BRAND.green : BRAND.red,
            }}>
              {((sparkData[sparkData.length - 1].netWorth - sparkData[0].netWorth) / Math.abs(sparkData[0].netWorth || 1) * 100).toFixed(1)}%
            </div>
          )}
        </div>

        {sparkData.length > 1 ? (
          <MobileScrubChart height={104}
            data={sparkData.map(d => ({ label: d.label, value: d.netWorth }))}
            formatValue={v => fmtSigned(v)}
          />
        ) : (
          <div style={{ color: N.muted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Not enough data yet</div>
        )}
      </div>

      {/* ── ASSET ALLOCATION ── */}
      {allocData.length > 0 && (
        <div style={{ background: N.card, borderRadius: 16, border: `1px solid ${N.border}`, padding: '16px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: N.text, marginBottom: 12 }}>Asset Allocation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {allocData.map(({ name, value, color }) => {
              const pct = totalAssets > 0 ? (value / totalAssets) * 100 : 0;
              return (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: N.muted }}>{name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: N.text }}>{fmtK(value)}</span>
                      <span style={{ fontSize: 11, color: N.muted, width: 36, textAlign: 'right' }}>{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ height: 6, borderRadius: 3, width: `${pct}%`, background: color, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── QUICK NAV ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { href: '/dashboard/net-worth/assets',      label: 'Assets',      sub: 'View all asset accounts', icon: '📊', color: BRAND.green },
          { href: '/dashboard/net-worth/liabilities', label: 'Liabilities', sub: 'View all debts',          icon: '📋', color: BRAND.red   },
        ].map(({ href, label, sub, icon, color }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
            <div style={{
              background: N.card, borderRadius: 14, border: `1px solid ${N.border}`,
              padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 12,
              height: '100%', boxSizing: 'border-box',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: `${color}18`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>{icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: N.text }}>{label}</div>
                <div style={{ fontSize: 11, color: N.muted }}>{sub}</div>
              </div>
              <div style={{ color: N.muted, fontSize: 16 }}>›</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function NetWorthPage() {
  const [chartRange, setChartRange] = useState<Range>('6M');
  const { T } = useDashboardTheme();
  const { profile: userProfile } = useUserProfile();
  const currentAge = userProfile?.age ?? 35;
  const chartAccent = T.isDark ? BRAND.gold : '#0a3fa8';
  const isMobile = useMobile();

  const C = {
    ...BRAND,
    text:   T.text,
    muted:  T.muted,
    border: T.border,
    bg2:    T.tooltipBg,
  };

  const {
    currentSnapshot,
    priorMonthSnapshot,
    selectedMonthKey,
    setSelectedMonthKey,
    trendData,
    allSnapshots,
    availableMonths,
    periodType,
  } = useFinancialData();

  const { expenseAnalytics } = useFlowData();
  const avgMonthlyExpenses = expenseAnalytics?.averageMonthlyExpenses ?? 0;

  const snapshot = currentSnapshot;
  if (!snapshot) return null;

  const { bankAccounts, investmentAccounts, retirementAccounts, realEstate, otherAssets, liabilities } = snapshot;

  const sumF = (arr: any[], f: string) => arr.reduce((t, i) => t + Number(i[f] || 0), 0);
  const sumL = (arr?: any[]) => (arr || []).reduce((t, i) => t + (i.amount || 0), 0);

  const totalCash        = sumF(bankAccounts, 'balance');
  const totalInvest      = sumF(investmentAccounts, 'balance');
  const totalRetire      = sumF(retirementAccounts, 'balance');
  const totalRE          = sumF(realEstate, 'value');
  const totalOther       = sumF(otherAssets, 'value');
  const totalAssets      = totalCash + totalInvest + totalRetire + totalRE + totalOther;
  const totalMortgage    = sumL(liabilities?.mortgage);
  const totalCC          = sumL(liabilities?.creditCard);
  const totalAuto        = sumL(liabilities?.auto);
  const totalStudent     = sumL(liabilities?.studentLoan);
  const totalOtherL      = sumL(liabilities?.other);
  const totalLiabilities = totalMortgage + totalCC + totalAuto + totalStudent + totalOtherL;
  const netWorth         = totalAssets - totalLiabilities;

  const prior = priorMonthSnapshot;
  const priorAssets = prior
    ? sumF(prior.bankAccounts, 'balance') + sumF(prior.investmentAccounts, 'balance') +
      sumF(prior.retirementAccounts, 'balance') + sumF(prior.realEstate, 'value') + sumF(prior.otherAssets, 'value')
    : 0;
  const priorLiabilities = prior
    ? sumL(prior.liabilities?.mortgage) + sumL(prior.liabilities?.creditCard) +
      sumL(prior.liabilities?.auto) + sumL(prior.liabilities?.studentLoan) + sumL(prior.liabilities?.other)
    : 0;
  const priorNetWorth   = priorAssets - priorLiabilities;
  const nwChange        = netWorth - priorNetWorth;
  const nwChangePct     = priorNetWorth !== 0 ? (nwChange / Math.abs(priorNetWorth)) * 100 : 0;
  const nwUp            = nwChange >= 0;

  const debtToAsset     = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
  const investRatio     = totalAssets > 0 ? ((totalInvest + totalRetire) / totalAssets) * 100 : 0;

  const rangeChartData = useMemo((): TrendPoint[] => {
    if (!availableMonths.length) return trendData;

    const sumA  = (s: any) => ['bankAccounts','investmentAccounts','retirementAccounts'].reduce((t: number, k: string) => t + (s[k]||[]).reduce((a: number, x: any) => a + Number(x.balance||0), 0), 0)
      + (s.realEstate||[]).reduce((a: number, x: any) => a + Number(x.value||0), 0)
      + (s.otherAssets||[]).reduce((a: number, x: any) => a + Number(x.value||0), 0);
    const sumLd  = (s: any) => Object.values(s.liabilities||{}).flat().reduce((a: number, x: any) => a + Number((x as any).amount||0), 0);

    const cutoff = (months: number) => {
      const d = new Date();
      d.setMonth(d.getMonth() - months);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const minKey = chartRange === '6M'  ? cutoff(6)
                 : chartRange === '1Y'  ? cutoff(12)
                 : chartRange === '2Y'  ? cutoff(24)
                 : availableMonths[0];

    const months = availableMonths.filter(m => m >= minKey);
    const step   = Math.max(1, Math.floor(months.length / 24));
    const kept   = months.filter((_, i) => i % step === 0 || i === months.length - 1);

    return kept.map((m) => {
      const s     = allSnapshots[m];
      const assets = s ? sumA(s) : 0;
      const liabilities = s ? sumLd(s) : 0;
      const [y, mo] = m.split('-').map(Number);
      const label = new Date(y, mo - 1).toLocaleString('en-US', { month: 'short', year: '2-digit' });
      return { label, monthKey: m, assets, liabilities, netWorth: assets - liabilities };
    });
  }, [chartRange, availableMonths, allSnapshots, trendData]);

  const rangeFirst = rangeChartData[0];
  const rangeLast  = rangeChartData[rangeChartData.length - 1];
  const rangeDelta     = rangeLast && rangeFirst ? rangeLast.netWorth - rangeFirst.netWorth : 0;
  const rangeDeltaPct  = rangeFirst && rangeFirst.netWorth !== 0 ? (rangeDelta / Math.abs(rangeFirst.netWorth)) * 100 : 0;
  const rangeAssetDelta = rangeLast && rangeFirst ? rangeLast.assets - rangeFirst.assets : 0;
  const rangeDebtDelta  = rangeLast && rangeFirst ? rangeLast.liabilities - rangeFirst.liabilities : 0;
  const peakNetWorth   = rangeChartData.reduce((mx, p) => Math.max(mx, p.netWorth), -Infinity);

  const ALLOC_COLORS = { cash: '#00A86B', investments: '#0891B2', retirement: '#2ED3C6', realEstate: '#0a3fa8', other: '#4da3ff' };

  const allocData = [
    { name: 'Cash',        value: totalCash,   color: ALLOC_COLORS.cash },
    { name: 'Investments', value: totalInvest,  color: ALLOC_COLORS.investments },
    { name: 'Retirement',  value: totalRetire,  color: ALLOC_COLORS.retirement },
    { name: 'Real Estate', value: totalRE,      color: ALLOC_COLORS.realEstate },
    { name: 'Other',       value: totalOther,   color: ALLOC_COLORS.other },
  ].filter(d => d.value > 0);

  const insights: { icon: string; text: string; color: string }[] = [];

  const daInfo = getDALabel(debtToAsset / 100, currentAge);
  const daIcon = daInfo.label === 'Critical' || daInfo.label === 'High' ? '⚠' : '✦';
  const daColor = daInfo.label === 'Critical' ? C.red : daInfo.label === 'High' ? C.gold : C.green;
  insights.push({ icon: daIcon, text: `Debt-to-asset ratio of ${debtToAsset.toFixed(1)}% — ${daInfo.label} for your age group.`, color: daColor });

  if (investRatio >= 40)
    insights.push({ icon: '✦', text: `Investment & retirement accounts represent ${investRatio.toFixed(1)}% of assets — on track for long-term wealth accumulation.`, color: C.green });
  else
    insights.push({ icon: '→', text: `Investment & retirement accounts are ${investRatio.toFixed(1)}% of assets. Consider increasing allocation toward the 40–60% target.`, color: C.accent });

  if (nwUp && nwChangePct > 0)
    insights.push({ icon: '✦', text: `Net worth grew ${nwChangePct.toFixed(1)}% this ${periodType} — compounding momentum building.`, color: C.gold });

  const periodLabel = periodType === 'month' ? 'Monthly' : periodType === 'quarter' ? 'Quarterly' : 'Yearly';

  /* ── MOBILE BRANCH ── */
  if (isMobile) {
    return (
      <MobileNetWorthSummaryView
        netWorth={netWorth}
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
        nwChange={nwChange}
        nwChangePct={nwChangePct}
        nwUp={nwUp}
        priorAssets={priorAssets}
        priorLiabilities={priorLiabilities}
        periodType={periodType}
        rangeChartData={rangeChartData}
        trendData={trendData}
        debtToAsset={debtToAsset}
        totalMortgage={totalMortgage}
        totalCC={totalCC}
        totalAuto={totalAuto}
        totalStudent={totalStudent}
        totalOtherL={totalOtherL}
        allocData={allocData}
        selectedMonthKey={selectedMonthKey}
        setSelectedMonthKey={setSelectedMonthKey}
      />
    );
  }

  return (
    <div style={{ color: C.text, fontFamily: 'var(--font-body)' }}>

      {/* ═══════════════════════════════════════════════════
          HERO — NET WORTH COMMAND CENTER
      ═══════════════════════════════════════════════════ */}
      <Card style={{
        padding: '40px 48px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
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
            <Label>Total Net Worth · {selectedMonthKey}</Label>
            <div style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              backgroundImage: `linear-gradient(135deg, ${C.text} 0%, ${C.gold} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 16,
              fontFamily: 'var(--font-display)',
            }}>
              {fmtSigned(netWorth)}
            </div>

            {/* delta badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: nwUp ? 'rgba(52,211,153,0.12)' : 'rgba(255,90,90,0.12)',
                border: `1px solid ${nwUp ? 'rgba(52,211,153,0.3)' : 'rgba(255,90,90,0.3)'}`,
                borderRadius: 100,
                padding: '6px 14px',
                fontSize: 14, fontWeight: 700,
                color: nwUp ? C.green : C.red,
              }}>
                {nwUp ? '▲' : '▼'} {fmt(nwChange)} ({nwChangePct >= 0 ? '+' : ''}{nwChangePct.toFixed(2)}%)
              </div>
              <span style={{ color: C.muted, fontSize: 13 }}>vs prior {periodType}</span>
            </div>
          </div>

          {/* RIGHT — asset / liability split */}
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <Label>Total Assets</Label>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.green, letterSpacing: '-0.02em' }}>{fmtK(totalAssets)}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                {priorAssets > 0 ? `${((totalAssets - priorAssets) / priorAssets * 100).toFixed(1)}% vs prior ${periodType}` : '—'}
              </div>
            </div>
            <div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} />
            <div style={{ textAlign: 'right' }}>
              <Label>Total Liabilities</Label>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.red, letterSpacing: '-0.02em' }}>{fmtK(totalLiabilities)}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                {priorLiabilities > 0 ? `${((totalLiabilities - priorLiabilities) / priorLiabilities * 100).toFixed(1)}% vs prior ${periodType}` : '—'}
              </div>
            </div>
            <div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} />
            <div style={{ textAlign: 'right' }}>
              <Label>Debt / Asset</Label>
              <div style={{
                fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em',
                color: getDALabel(debtToAsset / 100, currentAge).color,
              }}>{debtToAsset.toFixed(1)}%</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{getDALabel(debtToAsset / 100, currentAge).label} for your age</div>
            </div>
          </div>
        </div>

        {/* mini sparkline */}
        {trendData.length > 1 && (
          <div style={{ marginTop: 32, height: 60, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartAccent} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={chartAccent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="netWorth" stroke={chartAccent} strokeWidth={2} fill="url(#sparkGrad)" dot={false} isAnimationActive />
                <XAxis hide dataKey="label" />
                <YAxis hide domain={['auto', 'auto']} />
              </AreaChart>
            </ResponsiveContainer>
            {/* period labels under sparkline */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {trendData.map((d, i) => (
                <span key={i} style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{d.label}</span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ═══════════════════════════════════════════════════
          ROW 2 — CATEGORY BREAKDOWN TILES
      ═══════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Cash & Bank',   value: totalCash,   prior: prior ? sumF(prior.bankAccounts, 'balance') : 0,        color: ALLOC_COLORS.cash,        icon: '🏦' },
          { label: 'Investments',   value: totalInvest,  prior: prior ? sumF(prior.investmentAccounts, 'balance') : 0,  color: ALLOC_COLORS.investments, icon: '📈' },
          { label: 'Retirement',    value: totalRetire,  prior: prior ? sumF(prior.retirementAccounts, 'balance') : 0,  color: ALLOC_COLORS.retirement,  icon: '🔒' },
          { label: 'Real Estate',   value: totalRE,      prior: prior ? sumF(prior.realEstate, 'value') : 0,             color: ALLOC_COLORS.realEstate,  icon: '🏛' },
          { label: 'Other Assets',  value: totalOther,   prior: prior ? sumF(prior.otherAssets, 'value') : 0,            color: ALLOC_COLORS.other,       icon: '◈' },
        ].map(({ label, value, prior: p, color, icon }) => {
          const chg = p > 0 ? ((value - p) / p) * 100 : 0;
          const up = chg >= 0;
          return (
            <Card key={label} style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                {p > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: up ? C.green : C.red }}>
                    {up ? '▲' : '▼'} {Math.abs(chg).toFixed(1)}%
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{fmtK(value)}</div>
            </Card>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════
          ROW 3 — ASSETS VS LIABILITIES BAR + ALLOCATION DONUT
      ═══════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* ASSETS VS LIABILITIES BAR CHART */}
        <Card style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Assets vs Liabilities</div>
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { label: 'Total Assets',      value: totalAssets,      color: '#00A86B' },
                { label: 'Total Liabilities', value: totalLiabilities, color: '#0a3fa8' },
                { label: 'Net Worth',         value: netWorth,         color: chartAccent },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, justifyContent: 'flex-end' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{fmtK(s.value)}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            borderRadius: 12,
            background: T.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
            padding: '12px 4px 4px',
          }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={rangeChartData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }} barGap={2} barCategoryGap="10%">
                <CartesianGrid vertical={false} stroke={T.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: C.muted, fontSize: 11, fontWeight: 600 }}
                  axisLine={false} tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={fmtK}
                  tick={{ fill: C.muted, fontSize: 11 }}
                  axisLine={false} tickLine={false}
                  width={68}
                />
                <Tooltip content={<RangeTooltip />} />
                <Bar dataKey="assets"      name="Assets"      fill="#00A86B" radius={[4,4,0,0]} />
                <Bar dataKey="liabilities" name="Liabilities" fill="#0a3fa8" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ALLOCATION DONUT */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '28px 32px 16px' }}>
            <Label>Asset Allocation</Label>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Portfolio Breakdown</div>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', minHeight: 0 }}>
            <div style={{ position: 'relative', width: '100%', height: 270 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocData}
                    cx="50%" cy="50%"
                    innerRadius={92} outerRadius={122}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive
                  >
                    {allocData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => [fmt(v), '']}
                    contentStyle={{ background: T.tooltipBg, border: `1px solid ${T.tooltipBorder}`, borderRadius: 10, color: T.text, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{fmtK(totalAssets)}</div>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 2 }}>Assets</div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px 8px', flexShrink: 0 }}>
            {allocData.map((d) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                <span style={{ fontSize: 10, color: C.muted, marginLeft: 'auto', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {totalAssets > 0 ? (d.value / totalAssets * 100).toFixed(1) : 0}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════
          ROW 4 — NET WORTH TREND (full width)
      ═══════════════════════════════════════════════════ */}
      <Card style={{ padding: '28px 32px', marginBottom: 24 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Label>Net Worth Trend</Label>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Wealth Over Time</div>
          </div>
          <div style={{ display: 'flex', gap: 4, background: T.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 10, padding: 4 }}>
            {(['6M','1Y','2Y','All'] as Range[]).map(r => (
              <button
                key={r}
                onClick={() => setChartRange(r)}
                style={{
                  padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                  background: chartRange === r ? chartAccent : 'transparent',
                  color: chartRange === r ? '#ffffff' : C.muted,
                }}
              >{r}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Net Worth Change', value: `${rangeDelta >= 0 ? '+' : ''}${fmtK(rangeDelta)}`,         sub: `${rangeDeltaPct >= 0 ? '+' : ''}${rangeDeltaPct.toFixed(1)}% over period`, color: rangeDelta >= 0 ? C.green : C.red },
            { label: 'Asset Growth',     value: `${rangeAssetDelta >= 0 ? '+' : ''}${fmtK(rangeAssetDelta)}`, sub: 'change in total assets',                                                   color: rangeAssetDelta >= 0 ? C.green : C.red },
            { label: 'Debt Change',      value: `${rangeDebtDelta <= 0 ? '' : '+'}${fmtK(rangeDebtDelta)}`,   sub: rangeDebtDelta <= 0 ? 'debt reduced' : 'debt increased',                   color: rangeDebtDelta <= 0 ? C.green : C.red },
            { label: 'Peak Net Worth',   value: fmtK(peakNetWorth === -Infinity ? netWorth : peakNetWorth),   sub: 'highest in this period',                                                   color: chartAccent },
          ].map(stat => (
            <div key={stat.label} style={{ background: T.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderRadius: 10, border: `1px solid ${T.border}`, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 20, fontSize: 12, marginBottom: 12 }}>
          {[
            { label: 'Net Worth',   color: chartAccent,  dash: false },
            { label: 'Assets',      color: C.green, dash: false },
            { label: 'Liabilities', color: C.red,   dash: true  },
          ].map(l => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted }}>
              <svg width={24} height={10}>
                <line x1="0" y1="5" x2="24" y2="5" stroke={l.color} strokeWidth={l.dash ? 1.5 : 2} strokeDasharray={l.dash ? '4 3' : undefined} />
              </svg>
              {l.label}
            </span>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={rangeChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradNW2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={chartAccent}  stopOpacity={0.30} />
                <stop offset="100%" stopColor={chartAccent}  stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradA2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.green} stopOpacity={0.20} />
                <stop offset="100%" stopColor={C.green} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradL2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.red}   stopOpacity={0.18} />
                <stop offset="100%" stopColor={C.red}   stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tickFormatter={fmtK} tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={68} />
            <Tooltip content={<RangeTooltip />} />
            <Area type="monotone" dataKey="liabilities" name="Liabilities" stroke={C.red}   strokeWidth={1.5} strokeDasharray="4 3" fill="url(#gradL2)" dot={false} />
            <Area type="monotone" dataKey="assets"      name="Assets"      stroke={C.green} strokeWidth={1.5} fill="url(#gradA2)" dot={false} />
            <Area type="monotone" dataKey="netWorth"    name="Net Worth"   stroke={chartAccent}  strokeWidth={2.5} fill="url(#gradNW2)" dot={false} isAnimationActive />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* ═══════════════════════════════════════════════════
          ROW 5 — DEBT BREAKDOWN + INSIGHTS
      ═══════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* LIABILITIES HORIZONTAL BAR */}
        <Card style={{ padding: '28px 32px' }}>
          <Label>Liability Structure</Label>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 24 }}>Debt Breakdown</div>
          {(() => {
            const debtItems = [
              { label: 'Mortgage',      value: totalMortgage, color: T.isDark ? '#4DA3FF' : '#0a3fa8' },
              { label: 'Credit Cards',  value: totalCC,       color: T.isDark ? '#2ED3C6' : '#0891B2' },
              { label: 'Auto Loans',    value: totalAuto,     color: T.isDark ? '#34D399' : '#00A86B' },
              { label: 'Student Loans', value: totalStudent,  color: T.isDark ? '#818CF8' : '#fd5602' },
              { label: 'Other Debt',    value: totalOtherL,   color: T.isDark ? '#C084FC' : '#4da3ff' },
            ].filter(d => d.value > 0);

            if (debtItems.length === 0) {
              return (
                <div style={{ color: C.green, fontSize: 14, fontWeight: 600, textAlign: 'center', padding: '24px 0' }}>
                  ✦ No liabilities recorded
                </div>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {debtItems.map(({ label, value, color }) => {
                  const pct = totalLiabilities > 0 ? (value / totalLiabilities) * 100 : 0;
                  return (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{label}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>{fmtK(value)}</span>
                          <span style={{ fontSize: 12, color: C.muted, width: 38, textAlign: 'right' }}>{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: T.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)' }}>
                        <div style={{
                          height: 8, borderRadius: 4, width: `${pct}%`,
                          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                          transition: 'width 0.8s ease',
                          boxShadow: `0 0 8px ${color}50`,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </Card>

        {/* INTELLIGENCE INSIGHTS */}
        <Card style={{ padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
          <Label>Nautilus Intelligence</Label>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 24 }}>Financial Analysis</div>
          {(() => {
            const boxBg     = T.isDark ? 'rgba(103,230,213,0.07)' : 'rgba(77,163,255,0.07)';
            const boxBorder = T.isDark ? '1px solid rgba(103,230,213,0.2)' : '1px solid rgba(77,163,255,0.2)';
            const headColor = T.isDark ? C.gold : '#0a3fa8';
            return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {insights.map((ins, i) => (
              <div key={i} style={{
                padding: '14px 16px',
                background: boxBg,
                borderRadius: 12,
                border: boxBorder,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: headColor, marginBottom: 4 }}>
                  {ins.icon} {ins.text.split('—')[0]}
                </div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                  {ins.text.includes('—') ? ins.text.split('—').slice(1).join('—').trim() : ''}
                </div>
              </div>
            ))}

            {/* cash reserves */}
            {(() => {
              const cashReserves = avgMonthlyExpenses > 0
                ? totalCash / avgMonthlyExpenses
                : null;
              const reserveTarget = 6;
              const pct = cashReserves !== null ? Math.min(100, (cashReserves / reserveTarget) * 100) : 0;
              const barColor = cashReserves === null ? headColor
                : cashReserves >= 6 ? C.green
                : cashReserves >= 3 ? C.gold
                : C.red;
              return (
                <div style={{ padding: '14px 16px', background: boxBg, borderRadius: 12, border: boxBorder }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cash Reserves</span>
                    <span style={{ fontSize: 13, color: barColor, fontWeight: 800 }}>
                      {cashReserves !== null ? `${cashReserves.toFixed(1)} mo` : '—'}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: T.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' }}>
                    <div style={{
                      height: 6, borderRadius: 3,
                      width: `${pct}%`,
                      background: barColor,
                      transition: 'width 1s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 5 }}>
                    {cashReserves === null
                      ? 'Add expense data to calculate'
                      : cashReserves >= 6
                        ? 'Fully funded emergency reserve (6+ mo benchmark)'
                        : cashReserves >= 3
                          ? `${(reserveTarget - cashReserves).toFixed(1)} months short of 6-month benchmark`
                          : 'Below 3-month minimum — consider building reserves'}
                  </div>
                </div>
              );
            })()}
          </div>
            );
          })()}
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════
          ROW 6 — NAVIGATION TILES
      ═══════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          {
            href: '/dashboard/net-worth/assets',
            label: 'Asset Detail',
            sub: 'Account balances, allocation, and growth trends across all asset classes.',
            icon: '📊',
            accent: C.green,
          },
          {
            href: '/dashboard/net-worth/liabilities',
            label: 'Liability Detail',
            sub: 'Debt structure, interest exposure, and payoff trajectory analysis.',
            icon: '📋',
            accent: C.red,
          },
        ].map(({ href, label, sub, icon, accent }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <Card style={{
              padding: '24px 28px',
              display: 'flex', alignItems: 'center', gap: 20,
              transition: 'border-color 0.2s ease',
              cursor: 'pointer',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: `${accent}18`,
                border: `1px solid ${accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{sub}</div>
              </div>
              <div style={{ color: C.muted, fontSize: 18, flexShrink: 0 }}>›</div>
            </Card>
          </Link>
        ))}
      </div>

    </div>
  );
}
