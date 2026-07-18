'use client';

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import AddAssetModal from '../../../components/accounts/addassetmodal';
import { useFinancialData } from '../../../lib/financialdatacontext';
import { useDashboardTheme } from '../../../lib/dashboardthemecontext';
import MobileAccountSheet, { type AccountSheetData } from '../../../components/finance/MobileAccountSheet';
import MobileMonthStrip from '../../../components/finance/MobileMonthStrip';
import MobileScrubChart from '../../../components/finance/MobileScrubChart';

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS — tool workspace (matches recurring page)
───────────────────────────────────────────────────────────── */
const T = {
  bg:           '#EDF0F7',
  surface:      '#FFFFFF',
  border:       '#E2E8F0',
  borderMed:    '#CBD5E1',
  shadow:       '0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
  shadowMd:     '0 4px 16px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',

  textPrimary:   '#0F172A',
  textSecondary: '#475569',
  textTertiary:  '#64748B',

  primary:       '#0a3fa8',
  primaryBg:     'rgba(10,63,168,0.08)',
  primaryBorder: 'rgba(10,63,168,0.28)',

  green:         '#00A86B',   // cash — jade green
  greenBg:       'rgba(0,168,107,0.10)',
  greenBorder:   'rgba(0,168,107,0.28)',

  red:           '#FF4D4D',
  redBg:         'rgba(255,77,77,0.10)',
  redBorder:     'rgba(255,77,77,0.28)',

  purple:        '#6d30fb',
  purpleBg:      'rgba(109,48,251,0.10)',
  purpleBorder:  'rgba(109,48,251,0.28)',

  yellow:        '#E8B800',   // #ffef00 dimmed slightly for readability on white
  yellowBg:      'rgba(255,239,0,0.12)',
  yellowBorder:  'rgba(255,239,0,0.40)',

  upColor:       '#00A86B',
  downColor:     '#FF4D4D',

  radius:        '12px',
  radiusSm:      '6px',
  radiusMd:      '8px',
  radiusLg:      '16px',
};

/* ─────────────────────────────────────────────────────────────
   ASSET CATEGORY COLOR PALETTE (user-specified)
───────────────────────────────────────────────────────────── */
const DONUT: Record<string, string> = {
  cash:        '#00A86B',   // green
  investments: '#0891B2',   // turquoise
  retirement:  '#2ED3C6',   // teal
  realEstate:  '#0a3fa8',   // blue
  other:       '#4da3ff',   // electric blue
};

/* ─────────────────────────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────────────────────────── */
const fmt  = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtK = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`;
  return fmt(n);
};

/* ─────────────────────────────────────────────────────────────
   SHARED UI PRIMITIVES
───────────────────────────────────────────────────────────── */
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background:   'var(--t-surface)',
      border:       `1px solid var(--t-border)`,
      borderRadius: T.radius,
      boxShadow:    'var(--t-shadow-sm)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title, note, right, accentColor }: {
  title:         string;
  note?:         string;
  right?:        React.ReactNode;
  accentColor?:  string;
}) {
  return (
    <div style={{
      display:        'flex',
      justifyContent: 'space-between',
      alignItems:     'center',
      padding:        '14px 20px 13px',
      borderBottom:   `1px solid var(--t-border)`,
      background:     'var(--t-card-header-bg)',
      borderRadius:   `${T.radius} ${T.radius} 0 0`,
      borderLeft:     accentColor ? `4px solid ${accentColor}` : undefined,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text-primary)', letterSpacing: '-.1px' }}>{title}</div>
        {note && <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 1 }}>{note}</div>}
      </div>
      {right}
    </div>
  );
}

function Badge({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      fontSize:     10,
      fontWeight:   700,
      padding:      '2px 9px',
      borderRadius: 100,
      background:   bg,
      color,
      border:       `1px solid ${border}`,
      whiteSpace:   'nowrap',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   CHART TOOLTIP
───────────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  const color = payload[0]?.stroke ?? 'var(--t-primary)';
  return (
    <div style={{
      background:   'var(--t-surface)',
      border:       `1px solid var(--t-border)`,
      borderRadius: 12,
      padding:      '10px 16px',
      boxShadow:    '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
      minWidth:     120,
    }}>
      <div style={{ color: 'var(--t-text-tertiary)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}80` }} />
        <span style={{ color: 'var(--t-text-primary)', fontSize: 15, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{fmt(value)}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MOBILE HOOK
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

/* ─────────────────────────────────────────────────────────────
   MOBILE ASSETS VIEW
───────────────────────────────────────────────────────────── */
/* category key → snapshot array key, for balance history lookups */
const SNAP_KEY: Record<string, string> = {
  cash:        'bankAccounts',
  investments: 'investmentAccounts',
  retirement:  'retirementAccounts',
  realEstate:  'realEstate',
  other:       'otherAssets',
};

function MobileAssetsView({
  categories, totalAssets, totalChange, totalChangePct, assetsUp, onAddAsset,
  allSnapshots, availableMonths, selectedMonthKey, setSelectedMonthKey, trendData,
}: {
  categories: any[];
  totalAssets: number;
  totalChange: number;
  totalChangePct: number;
  assetsUp: boolean;
  onAddAsset: () => void;
  allSnapshots: Record<string, any>;
  availableMonths: string[];
  selectedMonthKey: string;
  setSelectedMonthKey: (key: string) => void;
  trendData: { label: string; assets: number }[];
}) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [sheetAccount, setSheetAccount] = React.useState<AccountSheetData | null>(null);
  const toggle = (key: string) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  /* build monthly balance history for one account across snapshots */
  function openAccountSheet(acc: any, c: any) {
    const arrKey = SNAP_KEY[c.key];
    const months = availableMonths.slice(-24);
    const history = months
      .map(m => {
        const snap = allSnapshots[m];
        const rows: any[] = snap?.[arrKey] ?? [];
        const match = rows.find(r => (acc.id != null && r.id === acc.id) || (r.name && r.name === acc.name));
        if (!match) return null;
        const [y, mo] = m.split('-').map(Number);
        return {
          label: new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          value: Number(match[c.vf] || 0),
        };
      })
      .filter(Boolean) as { label: string; value: number }[];

    setSheetAccount({
      name: acc.name || acc[c.sf] || 'Account',
      subtitle: acc[c.sf] || c.label,
      icon: c.icon,
      color: c.color,
      value: Number(acc[c.vf] || 0),
      history,
    });
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
  };
  const changeColor = assetsUp ? MN.green : MN.red;
  const changeBg    = assetsUp ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)';

  const [y, m] = selectedMonthKey.split('-').map(Number);
  const selectedDate = new Date(y, (m || 1) - 1, 1);

  return (
    <div style={{ fontFamily: 'var(--font-body)', color: MN.text, paddingBottom: 16 }}>

      {/* ── HERO ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0a3fa8 0%, #0F2044 100%)',
        borderRadius: 0, padding: '20px 20px 16px', margin: '-16px -16px 16px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, transparent, ${MN.gold}, #67E6D5, ${MN.gold}, transparent)` }} />
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(46,211,198,0.75)', marginBottom: 6 }}>
          Total Assets
        </div>
        <div style={{
          fontSize: 32, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 10,
          backgroundImage: `linear-gradient(135deg, #ffffff 0%, ${MN.gold} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          {fmt(totalAssets)}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: changeBg, border: `1px solid ${changeColor}40`, fontSize: 12, fontWeight: 700, color: changeColor }}>
          {assetsUp ? '▲' : '▼'} {fmt(Math.abs(totalChange))} ({Math.abs(totalChangePct).toFixed(1)}%)
          <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>this period</span>
        </div>

        {/* scrubbable trendline */}
        {trendData.length > 1 && (
          <MobileScrubChart height={104}
            data={trendData.map(d => ({ label: d.label, value: d.assets }))}
            formatValue={v => fmt(v)}
          />
        )}

        {/* month pills — extension of the hero, no separate row above */}
        <MobileMonthStrip
          currentDate={selectedDate}
          onChange={(d) => setSelectedMonthKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)}
          variant="hero"
        />
      </div>

      {/* ── CATEGORY BREAKDOWN — one row, slide to see more ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, overflowX: 'auto', paddingBottom: 2, WebkitOverflowScrolling: 'touch' }}>
        {categories.filter(c => c.total > 0).map(c => (
          <div key={c.key} style={{
            background: MN.card, borderRadius: 14, padding: '14px 16px',
            border: `1px solid ${MN.border}`,
            flex: '0 0 auto', width: 132,
          }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontSize: 10, color: MN.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: MN.text }}>{fmtK(c.total)}</div>
            <div style={{ marginTop: 6, height: 3, borderRadius: 100, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${totalAssets > 0 ? (c.total / totalAssets) * 100 : 0}%`, background: c.color, borderRadius: 100 }} />
            </div>
            <div style={{ fontSize: 10, color: MN.faint, marginTop: 3 }}>{totalAssets > 0 ? ((c.total / totalAssets) * 100).toFixed(0) : 0}% of total</div>
          </div>
        ))}
      </div>

      {/* ── ACCOUNT GROUPS ── */}
      {categories.filter(c => c.accounts.length > 0).map(c => {
        const open = expanded[c.key] !== false; // default open
        return (
          <div key={c.key} style={{ marginBottom: 12 }}>
            {/* Group header */}
            <button
              onClick={() => toggle(c.key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', background: MN.card, borderRadius: open ? '14px 14px 0 0' : 14,
                border: `1px solid ${MN.border}`, borderBottom: `1px solid ${MN.border}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{c.icon}</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: MN.text }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: MN.muted }}>{c.accounts.length} account{c.accounts.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: MN.text }}>{fmtK(c.total)}</div>
                <div style={{ fontSize: 11, color: MN.gold, fontWeight: 600 }}>{open ? '▲' : '▼'}</div>
              </div>
            </button>

            {/* Account rows */}
            {open && (
              <div style={{ background: MN.card, borderRadius: '0 0 14px 14px', border: `1px solid ${MN.border}`, borderTop: 'none', overflow: 'hidden' }}>
                {c.accounts.map((acc: any, i: number) => {
                  const val = Number(acc[c.vf] || 0);
                  const isLast = i === c.accounts.length - 1;
                  return (
                    <div key={acc.id || i} onClick={() => openAccountSheet(acc, c)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '13px 16px', cursor: 'pointer',
                      borderBottom: isLast ? 'none' : `1px solid ${MN.border}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${c.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width={18} height={18} viewBox="0 0 20 20" fill="none" stroke={c.color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 18h16M2 9h16M4 9V7M8 9V7M12 9V7M16 9V7M4 18v-9M8 18v-9M12 18v-9M16 18v-9M10 2L2 7h16z" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: MN.text }}>{acc.name || acc[c.sf] || 'Account'}</div>
                          <div style={{ fontSize: 11, color: MN.faint }}>{acc[c.sf] || ''}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: MN.text, fontVariantNumeric: 'tabular-nums' }}>{fmt(val)}</div>
                        <span style={{ color: MN.faint, fontSize: 15 }}>›</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* ── ADD ASSET BUTTON ── */}
      <button
        onClick={onAddAsset}
        style={{
          width: '100%', padding: '15px', borderRadius: 14, marginTop: 8,
          background: 'linear-gradient(135deg, #0a3fa8, #4DA3FF)',
          border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 4px 16px rgba(10,63,168,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <span style={{ fontSize: 20 }}>+</span> Add Asset
      </button>

      {/* Account detail bottom sheet */}
      <MobileAccountSheet account={sheetAccount} onClose={() => setSheetAccount(null)} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function AssetsPage() {
  const isMobile = useMobile();
  const [showModal, setShowModal] = useState(false);
  const [chartRange, setChartRange] = useState<'6M'|'1Y'|'2Y'|'All'>('1Y');
  const { T: TH } = useDashboardTheme();
  const isDark = TH.isDark;
  const { currentSnapshot, priorMonthSnapshot, trendData, availableMonths, allSnapshots, periodType, selectedMonthKey, setSelectedMonthKey } = useFinancialData();
  const { bankAccounts = [], investmentAccounts = [], retirementAccounts = [], realEstate = [], otherAssets = [] } = currentSnapshot || {};

  const sumF       = (arr: any[], f: string) => arr.reduce((t, i) => t + Number(i[f] || 0), 0);
  const totalCash  = sumF(bankAccounts, 'balance');
  const totalInvest= sumF(investmentAccounts, 'balance');
  const totalRetire= sumF(retirementAccounts, 'balance');
  const totalRE    = sumF(realEstate, 'value');
  const totalOther = sumF(otherAssets, 'value');
  const totalAssets= totalCash + totalInvest + totalRetire + totalRE + totalOther;

  const prior      = priorMonthSnapshot;
  const priorTotal = prior
    ? sumF(prior.bankAccounts, 'balance') + sumF(prior.investmentAccounts, 'balance') +
      sumF(prior.retirementAccounts, 'balance') + sumF(prior.realEstate, 'value') + sumF(prior.otherAssets, 'value')
    : 0;
  const totalChange    = totalAssets - priorTotal;
  const totalChangePct = priorTotal > 0 ? (totalChange / priorTotal) * 100 : 0;
  const assetsUp       = totalChange >= 0;
  const periodLabel    = periodType === 'month' ? 'Monthly' : periodType === 'quarter' ? 'Quarterly' : 'Yearly';

  const categories = [
    { key: 'cash',        label: 'Cash & Bank',  total: totalCash,   prior: prior ? sumF(prior.bankAccounts, 'balance') : 0,         color: DONUT.cash,        accounts: bankAccounts,       vf: 'balance', sf: 'institution', icon: '🏦' },
    { key: 'investments', label: 'Investments',  total: totalInvest, prior: prior ? sumF(prior.investmentAccounts, 'balance') : 0,    color: DONUT.investments, accounts: investmentAccounts, vf: 'balance', sf: 'institution', icon: '📈' },
    { key: 'retirement',  label: 'Retirement',   total: totalRetire, prior: prior ? sumF(prior.retirementAccounts, 'balance') : 0,    color: DONUT.retirement,  accounts: retirementAccounts, vf: 'balance', sf: 'institution', icon: '🔒' },
    { key: 'realEstate',  label: 'Real Estate',  total: totalRE,     prior: prior ? sumF(prior.realEstate, 'value') : 0,              color: DONUT.realEstate,  accounts: realEstate,         vf: 'value',   sf: 'address',     icon: '🏛' },
    { key: 'other',       label: 'Other Assets', total: totalOther,  prior: prior ? sumF(prior.otherAssets, 'value') : 0,             color: DONUT.other,       accounts: otherAssets,        vf: 'value',   sf: 'assetType',   icon: '◈' },
  ];

  const donutData = categories.filter(c => c.total > 0).map(c => ({ name: c.label, value: c.total, color: c.color }));

  // range-filtered chart data
  const rangeChartData = useMemo(() => {
    if (!availableMonths.length) return trendData;
    const now = new Date();
    const cutoffs: Record<string, string> = {
      '6M': `${now.getFullYear()}-${String(now.getMonth() - 4).padStart(2, '0')}`,
      '1Y': `${now.getFullYear() - 1}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      '2Y': `${now.getFullYear() - 2}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      'All': '0000-00',
    };
    const minKey = cutoffs[chartRange];
    const months = availableMonths.filter(m => m >= minKey);
    const step = Math.max(1, Math.floor(months.length / 24));
    const kept = months.filter((_, i) => i % step === 0 || i === months.length - 1);
    const sumAssets = (s: any) =>
      ['bankAccounts','investmentAccounts','retirementAccounts'].reduce((t: number, k: string) =>
        t + (s[k] || []).reduce((a: number, x: any) => a + Number(x.balance || 0), 0), 0) +
      ['realEstate','otherAssets'].reduce((t: number, k: string) =>
        t + (s[k] || []).reduce((a: number, x: any) => a + Number(x.value || 0), 0), 0);
    return kept.map(m => {
      const snap = allSnapshots[m];
      const assets = snap ? sumAssets(snap) : 0;
      const [yr, mo] = m.split('-');
      const label = new Date(Number(yr), Number(mo) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      return { label, monthKey: m, assets };
    });
  }, [chartRange, availableMonths, allSnapshots, trendData]);

  // summary stats for selected range
  const rangeStart   = rangeChartData[0]?.assets ?? 0;
  const rangeEnd     = rangeChartData[rangeChartData.length - 1]?.assets ?? 0;
  const rangeDelta   = rangeEnd - rangeStart;
  const rangePct     = rangeStart > 0 ? (rangeDelta / rangeStart) * 100 : 0;
  const peakAssets   = Math.max(...rangeChartData.map(d => d.assets), 0);

  // smart Y-axis: when totals are large, raise the floor so movements are visible
  // floor = 90% of min value — gives consistent headroom without over-zooming
  const _chartMin = Math.min(...rangeChartData.map(d => d.assets).filter(v => v > 0));
  const assetYDomain = useMemo((): [number, number] => {
    if (!_chartMin || !peakAssets || peakAssets < 50_000) return [0, (peakAssets || 1) * 1.05];
    const floor = Math.max(0, _chartMin * 0.90);
    return [floor, peakAssets * 1.02];
  }, [_chartMin, peakAssets]);

  if (isMobile) return (
    <>
      {showModal && <AddAssetModal open={showModal} onClose={() => setShowModal(false)} />}
      <MobileAssetsView
        categories={categories}
        totalAssets={totalAssets}
        totalChange={totalChange}
        totalChangePct={totalChangePct}
        assetsUp={assetsUp}
        onAddAsset={() => setShowModal(true)}
        allSnapshots={allSnapshots}
        availableMonths={availableMonths}
        selectedMonthKey={selectedMonthKey}
        setSelectedMonthKey={setSelectedMonthKey}
        trendData={trendData}
      />
    </>
  );

  return (
    <div style={{ color: 'var(--t-text-primary)' }}>

      {/* ── HERO CARD ── */}
      <Card style={{ padding: '32px 40px', marginBottom: 20, borderLeft: `4px solid var(--t-primary)`, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 1,
          background: isDark
            ? 'linear-gradient(90deg, transparent, #2ED3C6, #67E6D5, #2ED3C6, transparent)'
            : 'linear-gradient(90deg, transparent, #0a3fa8, #4da3ff, #0a3fa8, transparent)',
        }} />
        {/* Subtle grid watermark */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(77,163,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(77,163,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 100% 50%, black 30%, transparent 80%)',
          maskImage:       'radial-gradient(ellipse 80% 100% at 100% 50%, black 30%, transparent 80%)',
        }} />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 28 }}>
          {/* Total */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t-primary)', marginBottom: 8 }}>
              Nautilus · Asset Intelligence
            </div>
            <div style={{
              fontSize: 56, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 10, fontVariantNumeric: 'tabular-nums',
              backgroundImage: isDark
                ? `linear-gradient(135deg, var(--t-text-primary) 0%, #2ED3C6 100%)`
                : `linear-gradient(135deg, var(--t-text-primary) 0%, #0a3fa8 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {fmt(totalAssets)}
            </div>
            <div style={{ color: 'var(--t-text-tertiary)', fontSize: 13, marginBottom: 12 }}>Total Assets · {periodLabel} view</div>

            {/* Change badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Badge
                label={`${assetsUp ? '▲' : '▼'} ${fmt(Math.abs(totalChange))} (${Math.abs(totalChangePct).toFixed(2)}%)`}
                color={assetsUp ? T.upColor : T.downColor}
                bg={assetsUp ? 'var(--t-green-bg)' : 'var(--t-red-bg)'}
                border={assetsUp ? 'var(--t-green-border)' : 'var(--t-red-border)'}
              />
              <span style={{ color: 'var(--t-text-tertiary)', fontSize: 12 }}>vs prior {periodType}</span>
            </div>
          </div>

          {/* Per-category mini stats */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {categories.filter(c => c.total > 0).map(c => {
              const chg = c.prior > 0 ? ((c.total - c.prior) / c.prior) * 100 : 0;
              return (
                <div key={c.key} style={{
                  padding:      '4px 0',
                  minWidth:     96,
                  textAlign:    'right',
                  borderTop:    `2px solid ${c.color}`,
                  paddingTop:   8,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t-text-tertiary)', marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c.color, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{fmtK(c.total)}</div>
                  {c.prior > 0 && (
                    <div style={{ fontSize: 11, color: chg >= 0 ? T.upColor : T.downColor, marginTop: 3, fontWeight: 600 }}>
                      {chg >= 0 ? '▲' : '▼'} {Math.abs(chg).toFixed(1)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* asset composition bar */}
        <div style={{ padding: '24px 0 0' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t-inner-box-heading)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Asset Composition
          </div>
          <div style={{ height: 10, borderRadius: 5, display: 'flex', overflow: 'hidden', gap: 2 }}>
            {categories.filter(c => c.total > 0).map(c => (
              <div key={c.key} style={{ flex: c.total, background: c.color, borderRadius: 3, transition: 'flex 0.8s ease' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
            {categories.filter(c => c.total > 0).map(c => (
              <span key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--t-text-tertiary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, display: 'inline-block', flexShrink: 0 }} />
                {c.label}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* ── DONUT + TREND ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 16, marginBottom: 16 }}>

        {/* Donut */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <CardHeader title="Portfolio Allocation" note="Asset Breakdown" accentColor={'var(--t-primary)'} />

          {/* Chart — grows to fill all available space, centered */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 24px 0', minHeight: 0 }}>
            <div style={{ position: 'relative', width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData} cx="50%" cy="50%"
                    innerRadius={90} outerRadius={124}
                    paddingAngle={3} dataKey="value" isAnimationActive
                  >
                    {donutData.map((d, i) => (
                      <Cell key={i} fill={d.color} stroke={'var(--t-surface)'} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => [fmt(v), '']}
                    contentStyle={{ background: 'var(--t-surface)', border: `1px solid var(--t-border)`, borderRadius: 10, color: 'var(--t-text-primary)', fontSize: 12, boxShadow: 'var(--t-shadow-md)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Centre label — positioned relative to fixed-height chart div */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtK(totalAssets)}</div>
                <div style={{ fontSize: 9, color: 'var(--t-primary)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 2 }}>Total</div>
              </div>
            </div>
          </div>

          {/* Legend — pinned to bottom */}
          <div style={{ borderTop: `1px solid var(--t-border)`, padding: '10px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', flexShrink: 0 }}>
            {categories.filter(c => c.total > 0).map((c) => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--t-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
                <span style={{ fontSize: 10, color: 'var(--t-text-tertiary)', marginLeft: 'auto', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {totalAssets > 0 ? (c.total / totalAssets * 100).toFixed(1) : 0}%
                </span>
              </div>
            ))}
          </div>

          {/* bottom accent bar */}
          <div style={{
            height: 2,
            background: isDark
              ? `linear-gradient(90deg, transparent, #2ED3C6, #67E6D5, #2ED3C6, transparent)`
              : `linear-gradient(90deg, transparent, #0a3fa8, #4da3ff, #0a3fa8, transparent)`,
          }} />
        </Card>

        {/* Trend Chart */}
        <Card>
          <CardHeader
            title="Asset Growth Trend"
            note="Historical Performance"
            accentColor={'var(--t-primary)'}
            right={
              <div style={{ display: 'flex', gap: 4, background: 'rgba(10,63,168,0.06)', borderRadius: 10, padding: 4 }}>
                {(['6M','1Y','2Y','All'] as const).map(r => (
                  <button key={r} onClick={() => setChartRange(r)} style={{
                    padding: '4px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                    background: chartRange === r ? 'var(--t-primary)' : 'transparent',
                    color: chartRange === r ? '#fff' : 'var(--t-text-tertiary)',
                  }}>{r}</button>
                ))}
              </div>
            }
          />

          {/* Summary stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: '16px 20px 4px' }}>
            {[
              { label: 'Asset Change',   value: `${rangeDelta >= 0 ? '+' : ''}${fmtK(rangeDelta)}`,   sub: `${rangePct >= 0 ? '+' : ''}${rangePct.toFixed(1)}% over period`,  color: rangeDelta >= 0 ? 'var(--t-green)' : 'var(--t-red)' },
              { label: 'Current Total',  value: fmtK(rangeEnd),                                        sub: 'total assets today',                                               color: 'var(--t-primary)' },
              { label: 'Peak Assets',    value: fmtK(peakAssets),                                      sub: 'highest in this period',                                           color: isDark ? '#2ED3C6' : '#0a3fa8' },
            ].map(s => (
              <div key={s.label} style={{
                background: isDark ? 'rgba(103,230,213,0.07)' : 'rgba(0,0,0,0.03)',
                border: isDark ? '1px solid rgba(103,230,213,0.2)' : `1px solid var(--t-border)`,
                borderRadius: 10,
                padding: '10px 14px',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t-inner-box-heading)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--t-inner-box-subtext)', marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '16px 20px' }}>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={rangeChartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  {/* Main fill gradient — rich 3-stop fade */}
                  <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={'var(--t-primary)'} stopOpacity={0.28} />
                    <stop offset="45%"  stopColor={'var(--t-primary)'} stopOpacity={0.10} />
                    <stop offset="100%" stopColor={'var(--t-primary)'} stopOpacity={0} />
                  </linearGradient>
                  {/* Glow layer — wide, very faint bloom behind the line */}
                  <linearGradient id="assetGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={'var(--t-primary)'} stopOpacity={0.10} />
                    <stop offset="100%" stopColor={'var(--t-primary)'} stopOpacity={0} />
                  </linearGradient>
                  {/* Drop-shadow filter for the stroke glow */}
                  <filter id="lineglow" x="-20%" y="-80%" width="140%" height="260%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke={'var(--t-border)'}
                  strokeOpacity={0.7}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--t-text-tertiary)', fontSize: 11, fontWeight: 600 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tickFormatter={fmtK}
                  tick={{ fill: 'var(--t-text-tertiary)', fontSize: 11 }}
                  axisLine={false} tickLine={false}
                  width={64}
                  domain={assetYDomain}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--t-primary)', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.5 }} />

                {/* Glow bloom layer behind the main line */}
                <Area
                  type="natural"
                  dataKey="assets"
                  stroke={'var(--t-primary)'}
                  strokeWidth={8}
                  strokeOpacity={0.12}
                  fill="url(#assetGlow)"
                  dot={false}
                  isAnimationActive={false}
                />
                {/* Main line */}
                <Area
                  type="natural"
                  dataKey="assets"
                  name="Assets"
                  stroke={'var(--t-primary)'}
                  strokeWidth={2.5}
                  fill="url(#assetGrad)"
                  dot={false}
                  isAnimationActive
                  activeDot={{
                    r: 5,
                    fill: 'var(--t-primary)',
                    stroke: '#ffffff',
                    strokeWidth: 2.5,
                    filter: `drop-shadow(0 0 6px var(--t-primary)80)`,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════
          ROW 3 — ASSET ANALYSIS + RETIREMENT CALCULATOR
      ═══════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* ASSET ANALYSIS */}
        <Card style={{ padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: isDark
              ? `linear-gradient(90deg, transparent, #0a3fa8, #2ED3C6, transparent)`
              : `linear-gradient(90deg, transparent, #0a3fa8, #4da3ff, transparent)`,
          }} />
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t-text-tertiary)', marginBottom: 6 }}>Nautilus Intelligence</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-text-primary)', marginBottom: 20 }}>Asset Analysis</div>

          {(() => {
            const boxBg     = isDark ? 'rgba(103,230,213,0.07)' : 'rgba(77,163,255,0.07)';
            const boxBorder = isDark ? '1px solid rgba(103,230,213,0.2)' : '1px solid rgba(77,163,255,0.2)';
            const headColor = isDark ? '#2ED3C6' : '#0a3fa8';

            // Largest single category
            const largest = [...categories].filter(c => c.total > 0).sort((a, b) => b.total - a.total)[0];
            // Diversification — how concentrated is the largest
            const largestPct = totalAssets > 0 && largest ? (largest.total / totalAssets) * 100 : 0;
            const isDiversified = largestPct < 60;

            // Liquid assets (cash + investments)
            const liquid = totalCash + totalInvest;
            const liquidPct = totalAssets > 0 ? (liquid / totalAssets) * 100 : 0;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* growth momentum */}
                <div style={{ padding: '14px 16px', borderRadius: 12, background: boxBg, border: boxBorder }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: headColor, marginBottom: 4 }}>
                    {assetsUp ? '✦ Positive Growth Momentum' : '⚠ Asset Value Declining'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)', lineHeight: 1.6 }}>
                    {assetsUp
                      ? `Assets grew by ${fmt(Math.abs(totalChange))} (${Math.abs(totalChangePct).toFixed(1)}%) this ${periodLabel.toLowerCase()} — strong trajectory toward your financial goals.`
                      : `Assets decreased by ${fmt(Math.abs(totalChange))} (${Math.abs(totalChangePct).toFixed(1)}%) this ${periodLabel.toLowerCase()}. Review contributions and market exposure.`}
                  </div>
                </div>

                {/* diversification */}
                {largest && (
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: boxBg, border: boxBorder }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: headColor, marginBottom: 4 }}>
                      {isDiversified ? '✦ Well Diversified Portfolio' : '→ Concentration Risk'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)', lineHeight: 1.6 }}>
                      <span style={{ color: 'var(--t-text-primary)', fontWeight: 700 }}>{largest.label}</span> represents {largestPct.toFixed(0)}% of total assets.
                      {isDiversified
                        ? ' Portfolio spread looks healthy across multiple categories.'
                        : ' Consider rebalancing to reduce single-category exposure.'}
                    </div>
                  </div>
                )}

                {/* liquidity */}
                <div style={{ padding: '14px 16px', borderRadius: 12, background: boxBg, border: boxBorder }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: headColor, marginBottom: 4 }}>✦ Liquidity Position</div>
                  <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)', lineHeight: 1.6 }}>
                    <span style={{ color: 'var(--t-text-primary)', fontWeight: 700 }}>{fmt(liquid)}</span> ({liquidPct.toFixed(0)}%) in liquid assets.
                    {liquidPct >= 20
                      ? ' Liquidity looks solid — good buffer for unexpected expenses.'
                      : ' Consider building liquid reserves to at least 20% of total assets.'}
                  </div>
                </div>
              </div>
            );
          })()}
        </Card>

        {/* RETIREMENT CALCULATOR LINK */}
        <Card style={{ padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: isDark
              ? `linear-gradient(90deg, #0a3fa8, #2ED3C6, #0891B2)`
              : `linear-gradient(90deg, #0a3fa8, #4da3ff, #0891B2)`,
          }} />
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t-text-tertiary)', marginBottom: 6 }}>Planning</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-text-primary)', marginBottom: 20 }}>Retirement Calculator</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: isDark ? 'rgba(46,211,198,0.12)' : 'rgba(77,163,255,0.10)',
                border: isDark ? '1px solid rgba(46,211,198,0.25)' : '1px solid rgba(77,163,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width={18} height={18} viewBox="0 0 20 20" fill="none" stroke={isDark ? '#2ED3C6' : '#0a3fa8'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="10" r="8" /><path d="M10 6v4l3 3" />
                </svg>
              </div>
              <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)', lineHeight: 1.5 }}>
                Project your retirement date, simulate contribution scenarios, and track progress toward your number.
              </div>
            </div>

            {/* category chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {categories.filter(c => c.total > 0).map(c => (
                <div key={c.key} style={{
                  padding: '8px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${c.color}35`,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: 13 }}>{c.icon}</span>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--t-text-tertiary)' }}>{c.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{fmtK(c.total)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* summary */}
            <div style={{ padding: '14px 16px', borderRadius: 12, background: isDark ? 'rgba(46,211,198,0.06)' : 'rgba(77,163,255,0.07)', border: isDark ? '1px solid rgba(46,211,198,0.18)' : '1px solid rgba(77,163,255,0.20)' }}>
              <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)', lineHeight: 1.6 }}>
                You have{' '}
                <span style={{ color: 'var(--t-text-primary)', fontWeight: 700 }}>{fmt(totalAssets)}</span>{' '}
                in total assets.{' '}
                {totalRetire > 0 && (
                  <>The Retirement Calculator will project how your <span style={{ color: isDark ? '#2ED3C6' : '#0a3fa8', fontWeight: 700 }}>{fmt(totalRetire)}</span> in retirement accounts grows toward your goal.</>
                )}
                {totalRetire === 0 && 'Use the Retirement Calculator to set a target and build your path to financial independence.'}
              </div>
            </div>

            {/* CTA */}
            <a href="/dashboard/retirement" style={{
              marginTop: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 0',
              borderRadius: 12,
              background: isDark
                ? `linear-gradient(135deg, #0a3fa8, #0891B2 60%, #2ED3C6)`
                : `linear-gradient(135deg, #0a3fa8, #4da3ff 60%, #0891B2)`,
              color: '#fff',
              fontSize: 13, fontWeight: 700,
              textDecoration: 'none',
              letterSpacing: '0.03em',
              boxShadow: isDark ? '0 4px 20px rgba(46,211,198,0.2)' : '0 4px 20px rgba(10,63,168,0.2)',
            }}>
              Open Retirement Calculator
              <svg width={14} height={14} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10h12M12 5l5 5-5 5" />
              </svg>
            </a>
          </div>
        </Card>
      </div>

      {/* ── ACCOUNT SECTIONS ── */}
      {categories.map(cat => (
        <Card key={cat.key} style={{ marginBottom: 14, overflow: 'hidden', borderLeft: `4px solid ${cat.color}` }}>
          {/* Category header */}
          <div style={{
            padding:        '18px 24px',
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
            background:     'var(--t-card-header-bg)',
            borderBottom:   cat.accounts.length > 0 ? `1px solid var(--t-border)` : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Color-coded avatar */}
              <div style={{
                width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                background: `${cat.color}18`,
                border:     `1.5px solid ${cat.color}50`,
                display:    'flex', alignItems: 'center', justifyContent: 'center',
                fontSize:   18,
              }}>
                {cat.icon}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)' }}>{cat.label}</div>
                <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 1 }}>
                  {cat.accounts.length === 0 ? 'No accounts' : `${cat.accounts.length} account${cat.accounts.length !== 1 ? 's' : ''}`}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: cat.color, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {cat.total > 0 ? fmtK(cat.total) : '—'}
              </div>
              {cat.prior > 0 && cat.total > 0 && (() => {
                const chg = ((cat.total - cat.prior) / cat.prior) * 100;
                return (
                  <div style={{ fontSize: 11, color: chg >= 0 ? T.upColor : T.downColor, marginTop: 2, fontWeight: 600 }}>
                    {chg >= 0 ? '▲' : '▼'} {Math.abs(chg).toFixed(1)}% vs prior {periodType}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Empty state */}
          {cat.accounts.length === 0 && (
            <div style={{ padding: '16px 24px', color: 'var(--t-text-tertiary)', fontSize: 13, fontStyle: 'italic' }}>
              No {cat.label.toLowerCase()} recorded.
            </div>
          )}

          {/* Account rows */}
          {cat.accounts.map((account: any, idx: number) => (
            <div key={account.id}>
              {idx > 0 && <div style={{ height: 1, background: 'var(--t-border)', margin: '0 24px' }} />}
              <div
                style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'default', transition: 'background .15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--t-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Left accent bar */}
                  <div style={{ width: 3, height: 34, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
                  {/* Account initials */}
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: `${cat.color}18`,
                    border:     `1.5px solid ${cat.color}50`,
                    display:    'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize:   12, fontWeight: 800, color: cat.color,
                  }}>
                    {(account[cat.sf] || account.name || 'A').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text-primary)' }}>{account.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 2 }}>
                      {account[cat.sf] ?? '—'} · {account.owner ?? 'Primary'} ·{' '}
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase',
                        color: account.sourceType === 'manual' ? '#D97706' : 'var(--t-primary)',
                      }}>
                        {account.sourceType === 'manual' ? 'Manual' : 'Linked'}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--t-text-primary)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(Number(account[cat.vf] ?? 0))}
                  </div>
                  {totalAssets > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                      {(Number(account[cat.vf] ?? 0) / totalAssets * 100).toFixed(1)}% of assets
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </Card>
      ))}

      {/* ── ADD ASSET BUTTON ── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, marginBottom: 8 }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          8,
            padding:      '12px 36px',
            background:   isDark
              ? 'linear-gradient(135deg, #0a3fa8, #0891B2 60%, #2ED3C6)'
              : 'linear-gradient(135deg, #0a3fa8, #4da3ff 60%, #0891B2)',
            border:       'none',
            borderRadius: 12,
            color:        '#fff',
            fontSize:     14,
            fontWeight:   700,
            cursor:       'pointer',
            boxShadow:    isDark ? '0 4px 20px rgba(46,211,198,0.2)' : '0 4px 20px rgba(10,63,168,0.2)',
            letterSpacing: '0.03em',
            transition:   'box-shadow .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = isDark ? '0 6px 28px rgba(46,211,198,0.35)' : '0 6px 28px rgba(10,63,168,0.35)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = isDark ? '0 4px 20px rgba(46,211,198,0.2)' : '0 4px 20px rgba(10,63,168,0.2)')}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Asset
        </button>
      </div>

      {showModal && <AddAssetModal open={showModal} onClose={() => setShowModal(false)} />}
    </div>
  );
}
