'use client';

import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useFinancialData } from '../../../lib/financialdatacontext';
import { useDashboardTheme } from '../../../lib/dashboardthemecontext';
import AddLiabilityModal, { type LiabilityInitial } from '../../../components/accounts/addliabilitymodal';
import MobileAccountSheet, { type AccountSheetData } from '../../../components/finance/MobileAccountSheet';
import MobileMonthStrip from '../../../components/finance/MobileMonthStrip';
import MobileScrubChart from '../../../components/finance/MobileScrubChart';

/* ─── brand accent constants (same in light + dark) ─── */
const BRAND = {
  teal:   '#2ED3C6',
  tealLt: '#67E6D5',
  blue:   '#4DA3FF',
  blueDk: '#0A3FA8',
  green:  '#2ED3C6',
};

type LiabilityItem = {
  id: string;
  sourceType: 'plaid' | 'manual';
  amount: number;
  owner: string;
  institution?: string;
  name: string;
  interestRate?: number;
  remainingTerm?: string;
  remainingTermMonths?: number;
  paymentAmount?: number;
};

type LiabilityCat = 'mortgage' | 'creditCard' | 'auto' | 'studentLoan' | 'other';

function getCAT(isDark: boolean): Record<LiabilityCat, { label: string; color: string; icon: string; glow: string }> {
  return {
    mortgage:    { label: 'Mortgage',      color: isDark ? '#4DA3FF' : '#0a3fa8', icon: '🏠', glow: isDark ? 'rgba(77,163,255,0.22)'   : 'rgba(10,63,168,0.15)'  },
    creditCard:  { label: 'Credit Cards',  color: isDark ? '#2ED3C6' : '#0891B2', icon: '💳', glow: isDark ? 'rgba(46,211,198,0.22)'   : 'rgba(8,145,178,0.15)'  },
    auto:        { label: 'Auto Loans',    color: isDark ? '#34D399' : '#00A86B', icon: '🚗', glow: isDark ? 'rgba(52,211,153,0.22)'   : 'rgba(0,168,107,0.15)'  },
    studentLoan: { label: 'Student Loans', color: isDark ? '#818CF8' : '#fd5602', icon: '🎓', glow: isDark ? 'rgba(129,140,248,0.22)'  : 'rgba(253,86,2,0.15)'   },
    other:       { label: 'Other Debt',    color: isDark ? '#C084FC' : '#4da3ff', icon: '◈',  glow: isDark ? 'rgba(192,132,252,0.18)'  : 'rgba(77,163,255,0.15)' },
  };
}

const fmt  = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtK = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return fmt(n);
};
const pct  = (v?: number) => v !== undefined ? `${v.toFixed(2)}%` : '—';

/* ─── card ─── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const { T } = useDashboardTheme();
  return (
    <div style={{
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderRadius: 20,
      boxShadow: `0 0 0 1px ${T.isDark ? 'rgba(46,211,198,0.07)' : 'rgba(0,0,0,0.04)'}, 0 8px 40px rgba(0,0,0,0.${T.isDark ? '35' : '08'})`,
      position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent)', borderRadius: '20px 20px 0 0' }} />
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  const { T } = useDashboardTheme();
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.isDark ? 'rgba(46,211,198,0.65)' : T.muted, marginBottom: 6 }}>
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  const { T } = useDashboardTheme();
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.tooltipBg, border: `1px solid ${T.tooltipBorder}`, borderRadius: 12, padding: '12px 16px' }}>
      <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      {payload.filter((_: any, i: number) => i === payload.length - 1).map((p: any, i: number) => (
        <div key={`${p.dataKey}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill }} />
          <span style={{ color: T.text, fontSize: 13, fontWeight: 700 }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── mobile hook ─── */
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

/* ─── mobile liabilities view ─── */
function MobileLiabilitiesView({
  liabilities, totals, totalDebt, debtChange, debtChangePct, debtDown, CAT, onAdd,
  allSnapshots, availableMonths, selectedMonthKey, setSelectedMonthKey, trendData,
}: {
  liabilities: any; totals: any; totalDebt: number;
  debtChange: number; debtChangePct: number; debtDown: boolean;
  CAT: any; onAdd: () => void;
  allSnapshots: Record<string, any>; availableMonths: string[];
  selectedMonthKey: string; setSelectedMonthKey: (key: string) => void;
  trendData: { label: string; liabilities: number }[];
}) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [sheetAccount, setSheetAccount] = React.useState<AccountSheetData | null>(null);
  const toggle = (key: string) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  /* monthly balance history for one liability across snapshots */
  function openLiabilitySheet(item: any, catKey: string) {
    const months = availableMonths.slice(-24);
    const history = months
      .map(m => {
        const rows: any[] = allSnapshots[m]?.liabilities?.[catKey] ?? [];
        const match = rows.find(r => (item.id != null && r.id === item.id) || (r.name && r.name === item.name));
        if (!match) return null;
        const [y, mo] = m.split('-').map(Number);
        return {
          label: new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          value: Number(match.amount || 0),
        };
      })
      .filter(Boolean) as { label: string; value: number }[];

    setSheetAccount({
      name: item.name,
      subtitle: item.institution || CAT[catKey].label,
      icon: CAT[catKey].icon,
      color: CAT[catKey].color,
      value: Number(item.amount || 0),
      isLiability: true,
      interestRate: item.interestRate ?? undefined,
      paymentAmount: item.paymentAmount ?? undefined,
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
  const changeColor = debtDown ? MN.green : MN.red;
  const changeBg    = debtDown ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)';

  const [y, m] = selectedMonthKey.split('-').map(Number);
  const selectedDate = new Date(y, (m || 1) - 1, 1);

  return (
    <div style={{ fontFamily: 'var(--font-body)', color: MN.text, paddingBottom: 16 }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0a3fa8 0%, #0F2044 100%)',
        borderRadius: 0, padding: '20px 20px 16px', margin: '-16px -16px 16px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, transparent, ${MN.gold}, #67E6D5, ${MN.gold}, transparent)` }} />
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(46,211,198,0.75)', marginBottom: 6 }}>Total Debt</div>
        <div style={{
          fontSize: 32, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 10,
          backgroundImage: `linear-gradient(135deg, #ffffff 0%, ${MN.gold} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>{fmt(totalDebt)}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: changeBg, border: `1px solid ${changeColor}40`, fontSize: 12, fontWeight: 700, color: changeColor }}>
          {debtDown ? '▼' : '▲'} {fmt(Math.abs(debtChange))} ({Math.abs(debtChangePct).toFixed(1)}%)
          <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>{debtDown ? 'paid down' : 'increase'}</span>
        </div>

        {/* scrubbable trendline */}
        {trendData.length > 1 && (
          <MobileScrubChart height={104}
            data={trendData.map(d => ({ label: d.label, value: d.liabilities }))}
            formatValue={v => fmt(v)}
            color={MN.red}
          />
        )}

        {/* month pills — extension of the hero, no separate row above */}
        <MobileMonthStrip
          currentDate={selectedDate}
          onChange={(d) => setSelectedMonthKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)}
          variant="hero"
        />
      </div>

      {/* Category tiles — one row, slide to see more */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, overflowX: 'auto', paddingBottom: 2, WebkitOverflowScrolling: 'touch' }}>
        {(Object.keys(CAT) as string[]).filter(k => totals[k] > 0).map(k => (
          <div key={k} style={{ background: MN.card, borderRadius: 14, padding: '14px 16px', border: `1px solid ${MN.border}`, flex: '0 0 auto', width: 132 }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{CAT[k].icon}</div>
            <div style={{ fontSize: 10, color: MN.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{CAT[k].label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: MN.text }}>{fmtK(totals[k])}</div>
            <div style={{ marginTop: 6, height: 3, borderRadius: 100, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${totalDebt > 0 ? (totals[k] / totalDebt) * 100 : 0}%`, background: CAT[k].color, borderRadius: 100 }} />
            </div>
            <div style={{ fontSize: 10, color: MN.faint, marginTop: 3 }}>{totalDebt > 0 ? ((totals[k] / totalDebt) * 100).toFixed(0) : 0}% of total</div>
          </div>
        ))}
      </div>

      {/* Account groups */}
      {(Object.keys(CAT) as string[]).filter(k => (liabilities[k]?.length ?? 0) > 0).map(k => {
        const open = expanded[k] !== false;
        const items: LiabilityItem[] = liabilities[k];
        return (
          <div key={k} style={{ marginBottom: 12 }}>
            <button onClick={() => toggle(k)} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', background: MN.card, borderRadius: open ? '14px 14px 0 0' : 14,
              border: `1px solid ${MN.border}`, borderBottom: `1px solid ${MN.border}`,
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${CAT[k].color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{CAT[k].icon}</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: MN.text }}>{CAT[k].label}</div>
                  <div style={{ fontSize: 12, color: MN.muted }}>{items.length} account{items.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: MN.text }}>{fmtK(totals[k])}</div>
                <div style={{ fontSize: 11, color: MN.gold, fontWeight: 600 }}>{open ? '▲' : '▼'}</div>
              </div>
            </button>
            {open && (
              <div style={{ background: MN.card, borderRadius: '0 0 14px 14px', border: `1px solid ${MN.border}`, borderTop: 'none', overflow: 'hidden' }}>
                {items.map((item, i) => (
                  <div key={item.id || i} onClick={() => openLiabilitySheet(item, k)} style={{ padding: '13px 16px', cursor: 'pointer', borderBottom: i < items.length - 1 ? `1px solid ${MN.border}` : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: item.interestRate ? 6 : 0 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: MN.text }}>{item.name}</div>
                        {item.institution && <div style={{ fontSize: 11, color: MN.faint }}>{item.institution}</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: MN.text, fontVariantNumeric: 'tabular-nums' }}>{fmt(item.amount)}</div>
                        <span style={{ color: MN.faint, fontSize: 15 }}>›</span>
                      </div>
                    </div>
                    {item.interestRate && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                        <span style={{ fontSize: 11, background: `${CAT[k].color}25`, color: MN.text, padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>{pct(item.interestRate)} APR</span>
                        {item.paymentAmount && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', color: MN.muted, padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>{fmt(item.paymentAmount)}/mo</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add button */}
      <button onClick={onAdd} style={{
        width: '100%', padding: '15px', borderRadius: 14, marginTop: 8,
        background: 'linear-gradient(135deg, #0a3fa8, #4DA3FF)',
        border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
        cursor: 'pointer', boxShadow: '0 4px 16px rgba(10,63,168,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 20 }}>+</span> Add Liability
      </button>

      {/* Account detail bottom sheet */}
      <MobileAccountSheet account={sheetAccount} onClose={() => setSheetAccount(null)} />
    </div>
  );
}

export default function LiabilitiesPage() {
  const { currentSnapshot, priorMonthSnapshot, trendData, periodType, allSnapshots, availableMonths, deleteManualLiability, selectedMonthKey, setSelectedMonthKey } = useFinancialData();
  const { T } = useDashboardTheme();
  const isMobile = useMobile();
  const [expanded,   setExpanded]   = useState<Record<string, boolean>>({});
  const [showModal,  setShowModal]  = useState(false);
  const [editTarget, setEditTarget] = useState<LiabilityInitial | null>(null);
  const [chartRange, setChartRange] = useState<'6M'|'1Y'|'2Y'|'All'>('1Y');

  const CAT = getCAT(T.isDark);

  /* Merge brand accents + theme surfaces — all existing C.xxx refs work */
  const C = {
    ...BRAND,
    text:   T.text,
    muted:  T.muted,
    border: T.border,
    bg3:    T.cardBg3,
  };

  const liabilities = currentSnapshot.liabilities;

  const totals = useMemo(() => ({
    mortgage:    liabilities.mortgage.reduce((s, i) => s + i.amount, 0),
    creditCard:  liabilities.creditCard.reduce((s, i) => s + i.amount, 0),
    auto:        liabilities.auto.reduce((s, i) => s + i.amount, 0),
    studentLoan: liabilities.studentLoan.reduce((s, i) => s + i.amount, 0),
    other:       liabilities.other.reduce((s, i) => s + i.amount, 0),
  }), [liabilities]);

  const totalDebt = Object.values(totals).reduce((s, v) => s + v, 0);

  /* trend chart data — range filtered */
  const chartTrendData = useMemo(() => {
    if (!availableMonths.length) return trendData.map((d: any, i: number) => ({ label: d.label ?? `M${i+1}`, liabilities: d.liabilities ?? 0 }));
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
    const sumLiabilities = (s: any) =>
      Object.values(s?.liabilities ?? {}).flat().reduce((t: number, x: any) => t + (x?.amount || 0), 0);
    return kept.map(m => {
      const snap = allSnapshots[m];
      const [yr, mo] = m.split('-');
      const label = new Date(Number(yr), Number(mo) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      return { label, liabilities: snap ? sumLiabilities(snap) : 0 };
    });
  }, [chartRange, availableMonths, allSnapshots, trendData]);

  const priorTotal = useMemo(() => {
    if (periodType === 'month') {
      return priorMonthSnapshot
        ? Object.values(priorMonthSnapshot.liabilities).flat().reduce((s, i: any) => s + (i.amount || 0), 0)
        : 0;
    }
    // quarter/year: use second-to-last entry in trendData as the prior period
    if (chartTrendData.length >= 2) {
      return chartTrendData[chartTrendData.length - 2].liabilities;
    }
    return 0;
  }, [periodType, priorMonthSnapshot, chartTrendData]);

  const debtChange    = totalDebt - priorTotal;
  const debtChangePct = priorTotal > 0 ? (debtChange / priorTotal) * 100 : 0;

  // smart Y-axis floor for liability trend chart
  // floor = 90% of min value — gives consistent headroom without over-zooming
  const _liabMin = Math.min(...chartTrendData.map(d => d.liabilities).filter(v => v > 0));
  const _liabMax = Math.max(...chartTrendData.map(d => d.liabilities), 0);
  const liabYDomain = useMemo((): [number, number] => {
    if (!_liabMin || !_liabMax || _liabMax < 50_000) return [0, (_liabMax || 1) * 1.05];
    const floor = Math.max(0, _liabMin * 0.90);
    return [floor, _liabMax * 1.02];
  }, [_liabMin, _liabMax]);
  const debtDown      = debtChange <= 0;
  const periodLabel   = periodType === 'month' ? 'month' : periodType === 'quarter' ? 'quarter' : 'year';

  /* donut data — one slice per category */
  const donutData = (Object.keys(CAT) as LiabilityCat[])
    .filter(k => totals[k] > 0)
    .map(k => ({ name: CAT[k].label, value: totals[k], color: CAT[k].color, icon: CAT[k].icon }));

  /* all categories for legend — zero-balance ones show as $0 */
  const legendData = (Object.keys(CAT) as LiabilityCat[])
    .map(k => ({ name: CAT[k].label, value: totals[k], color: CAT[k].color }));


  /* highest interest debt for insight */
  const allItems: (LiabilityItem & { cat: LiabilityCat })[] = (Object.keys(CAT) as LiabilityCat[])
    .flatMap(k => (liabilities[k] as LiabilityItem[]).map(i => ({ ...i, cat: k })));

  const highestRate = allItems
    .filter(i => i.interestRate)
    .sort((a, b) => (b.interestRate ?? 0) - (a.interestRate ?? 0))[0];

  if (isMobile) return (
    <>
      {showModal && <AddLiabilityModal initial={editTarget ?? undefined} onClose={() => { setShowModal(false); setEditTarget(null); }} />}
      <MobileLiabilitiesView
        liabilities={liabilities}
        totals={totals}
        totalDebt={totalDebt}
        debtChange={debtChange}
        debtChangePct={debtChangePct}
        debtDown={debtDown}
        CAT={CAT}
        onAdd={() => setShowModal(true)}
        allSnapshots={allSnapshots}
        availableMonths={availableMonths}
        selectedMonthKey={selectedMonthKey}
        setSelectedMonthKey={setSelectedMonthKey}
        trendData={trendData}
      />
    </>
  );

  return (
    <div style={{ color: C.text, fontFamily: 'var(--font-body)' }}>

      {/* ═══════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════ */}
      <Card style={{ padding: '40px 48px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        {/* teal-to-blue top accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${C.blueDk}, ${C.blue}, ${C.teal}, ${C.tealLt}, ${C.teal}, ${C.blue}, transparent)`,
        }} />
        {/* background grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(77,163,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(77,163,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 50% 0%, black 40%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 80% 100% at 50% 0%, black 40%, transparent 100%)',
        }} />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32 }}>
          {/* left — total debt */}
          <div>
            <Label>Total Outstanding Debt · {periodType === 'month' ? 'This Month' : periodType === 'quarter' ? 'This Quarter' : 'This Year'}</Label>
            <div style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              backgroundImage: `linear-gradient(135deg, ${C.text} 0%, ${C.teal} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 16,
              fontFamily: 'var(--font-display)',
            }}>
              {fmt(totalDebt)}
            </div>

            {/* delta — debt going DOWN is good */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: debtDown ? 'rgba(46,211,198,0.12)' : 'rgba(77,163,255,0.12)',
                border: `1px solid ${debtDown ? 'rgba(46,211,198,0.3)' : 'rgba(77,163,255,0.3)'}`,
                borderRadius: 100,
                padding: '6px 14px',
                fontSize: 14, fontWeight: 700,
                color: debtDown ? '#4ADE80' : '#F87171',
              }}>
                {debtDown ? '▼' : '▲'} {fmt(Math.abs(debtChange))} ({Math.abs(debtChangePct).toFixed(2)}%)
              </div>
              <span style={{ color: C.muted, fontSize: 13 }}>
                {debtDown ? 'reduction' : 'increase'} vs prior {periodType}
              </span>
            </div>
          </div>

          {/* right — category quick stats */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {(Object.keys(CAT) as LiabilityCat[]).filter(k => totals[k] > 0).map(k => (
              <div key={k} style={{ textAlign: 'right' }}>
                <Label>{CAT[k].label}</Label>
                <div style={{ fontSize: 22, fontWeight: 700, color: CAT[k].color, letterSpacing: '-0.02em' }}>
                  {fmtK(totals[k])}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                  {totalDebt > 0 ? `${(totals[k] / totalDebt * 100).toFixed(1)}% of debt` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* debt composition bar */}
        <div style={{ marginTop: 32 }}>
          <Label>Debt Composition</Label>
          <div style={{ height: 10, borderRadius: 5, display: 'flex', overflow: 'hidden', gap: 2 }}>
            {(Object.keys(CAT) as LiabilityCat[]).filter(k => totals[k] > 0).map(k => (
              <div key={k} style={{
                flex: totals[k],
                background: CAT[k].color,
                borderRadius: 3,
                boxShadow: `0 0 8px ${CAT[k].glow}`,
                transition: 'flex 0.8s ease',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
            {(Object.keys(CAT) as LiabilityCat[]).filter(k => totals[k] > 0).map(k => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.muted }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: CAT[k].color, display: 'inline-block' }} />
                {CAT[k].label}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* ═══════════════════════════════════════════════════
          ROW 2 — DONUT + TREND CHART
      ═══════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* DONUT — debt by category */}
        <Card style={{ padding: '28px 32px' }}>
          <Label>Debt by Category</Label>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>Outstanding Balances</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {/* donut */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <defs>
                    {donutData.map((d, i) => (
                      <filter key={i} id={`glow-${i}`}>
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    ))}
                  </defs>
                  <Pie
                    data={donutData}
                    cx={75} cy={75}
                    innerRadius={48} outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((d, i) => (
                      <Cell key={i} fill={d.color} opacity={0.92} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* centre label */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center', pointerEvents: 'none',
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {fmtK(totalDebt)}
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>total</div>
              </div>
            </div>

            {/* legend — 2-col grid: 3 left, 2 right */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', flex: 1, alignContent: 'start' }}>
              {legendData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: d.value === 0 ? 0.45 : 1 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0, boxShadow: d.value > 0 ? `0 0 6px ${d.color}60` : 'none' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {d.value === 0 ? '$0' : `${fmtK(d.value)} · ${totalDebt > 0 ? (d.value / totalDebt * 100).toFixed(0) : 0}%`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* TREND CHART — liabilities over time */}
        <Card style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <div>
              <Label>Liability Trend</Label>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Total Debt Over Time</div>
            </div>
            <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 9, overflow: 'hidden' }}>
              {(['6M','1Y','2Y','All'] as const).map(r => (
                <button key={r} onClick={() => setChartRange(r)} style={{
                  padding: '5px 14px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  background: chartRange === r ? 'var(--t-primary)' : 'transparent',
                  color: chartRange === r ? '#fff' : C.muted,
                  transition: 'all 0.15s',
                }}>{r}</button>
              ))}
            </div>
          </div>
          {chartTrendData.length > 1 && (() => {
            const first = chartTrendData[0].liabilities;
            const last  = chartTrendData[chartTrendData.length - 1].liabilities;
            const diff  = last - first;
            const p     = first > 0 ? Math.abs(diff / first * 100).toFixed(1) : '0';
            return (
              <div style={{ fontSize: 12, color: diff <= 0 ? (T.isDark ? C.teal : C.blue) : C.blue, fontWeight: 600, marginBottom: 16 }}>
                {diff <= 0 ? `▼ ${p}% reduction` : `▲ ${p}% increase`} over tracked period
              </div>
            );
          })()}
          {chartTrendData.length <= 1 && <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Not enough data yet</div>}
          {(() => {
            const chartColor = T.isDark ? '#2ED3C6' : '#0a3fa8';
            return (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartTrendData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="liabGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="liabGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(77,163,255,0.07)" />
              <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={52} domain={liabYDomain} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="liabilities" stroke={chartColor} strokeWidth={7} strokeOpacity={0.12} fill="url(#liabGlow)" dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="liabilities" stroke={chartColor} strokeWidth={2} fill="url(#liabGrad)"
                activeDot={{ r: 4, fill: chartColor, stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
          );
          })()}
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════
          ROW 3 — DEBT ANALYSIS + PAYOFF STRATEGY PLANNER
      ═══════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* DEBT ANALYSIS */}
        <Card style={{ padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${C.blue}, ${C.teal}, transparent)`,
          }} />
          <Label>Nautilus Intelligence</Label>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>Debt Analysis</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* shared box styles */}
            {(() => {
              const boxBg     = T.isDark ? 'rgba(103,230,213,0.07)' : 'rgba(77,163,255,0.07)';
              const boxBorder = T.isDark ? '1px solid rgba(103,230,213,0.2)' : '1px solid rgba(77,163,255,0.2)';
              const headColor = T.isDark ? C.tealLt : C.blue;
              return (
                <>
                  {/* paydown momentum */}
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: boxBg, border: boxBorder }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: headColor, marginBottom: 4 }}>
                      {debtDown ? '✦ Positive Paydown Momentum' : '⚠ Debt Balance Increasing'}
                    </div>
                    <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                      {debtDown
                        ? `Debt reduced by ${fmt(Math.abs(debtChange))} (${Math.abs(debtChangePct).toFixed(1)}%) this ${periodLabel} — excellent progress toward financial freedom.`
                        : `Debt grew by ${fmt(Math.abs(debtChange))} (${Math.abs(debtChangePct).toFixed(1)}%) this ${periodLabel}. Review spending in high-rate categories.`}
                    </div>
                  </div>

                  {/* highest rate debt */}
                  {highestRate && (
                    <div style={{ padding: '14px 16px', borderRadius: 12, background: boxBg, border: boxBorder }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: headColor, marginBottom: 4 }}>→ Highest Rate Debt</div>
                      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                        <span style={{ color: C.text, fontWeight: 700 }}>{highestRate.name}</span> at {pct(highestRate.interestRate)}.
                        {highestRate.interestRate && highestRate.interestRate > 10
                          ? ' Consider refinancing or accelerated paydown.'
                          : ' Rate is within a manageable range.'}
                      </div>
                    </div>
                  )}

                  {/* debt structure */}
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: boxBg, border: boxBorder }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: headColor, marginBottom: 4 }}>✦ Debt Structure</div>
                    <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                      {totals.mortgage > 0 && `Mortgage represents ${(totals.mortgage / totalDebt * 100).toFixed(0)}% of total debt — `}
                      {totals.mortgage / totalDebt > 0.7
                        ? 'primary residence is driving your liability structure, which is typical.'
                        : totals.creditCard / totalDebt > 0.3
                        ? 'high-rate revolving debt is elevated. Prioritize credit card payoff.'
                        : 'debt mix looks balanced across categories.'}
                    </div>
                  </div>

                </>
              );
            })()}
          </div>
        </Card>

        {/* PAYOFF STRATEGY PLANNER */}
        <Card style={{ padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, ${C.blueDk}, ${C.blue}, ${C.teal})`,
          }} />
          <Label>Strategy</Label>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>Payoff Strategy Planner</div>

          {allItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: T.isDark ? 'rgba(46,211,198,0.12)' : 'rgba(77,163,255,0.10)',
                  border: T.isDark ? '1px solid rgba(46,211,198,0.25)' : '1px solid rgba(77,163,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width={18} height={18} viewBox="0 0 20 20" fill="none" stroke={T.isDark ? C.teal : C.blue} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 15L7 9l4 3 5-8" /><path d="M14 4h4v4" />
                  </svg>
                </div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
                  Avalanche vs Snowball comparison — see which strategy saves the most interest.
                </div>
              </div>

              {/* mini category chips */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(Object.keys(CAT) as LiabilityCat[]).filter(k => totals[k] > 0).map(k => (
                  <div key={k} style={{
                    padding: '8px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${CAT[k].color}35`,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ fontSize: 13 }}>{CAT[k].icon}</span>
                    <div>
                      <div style={{ fontSize: 10, color: C.muted }}>{CAT[k].label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: CAT[k].color }}>{fmtK(totals[k])}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* summary */}
              <div style={{ padding: '14px 16px', borderRadius: 12, background: T.isDark ? 'rgba(46,211,198,0.06)' : 'rgba(77,163,255,0.07)', border: T.isDark ? '1px solid rgba(46,211,198,0.18)' : '1px solid rgba(77,163,255,0.20)' }}>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                  You have{' '}
                  <span style={{ color: C.text, fontWeight: 700 }}>{allItems.length} debt{allItems.length !== 1 ? 's' : ''}</span>{' '}
                  totalling{' '}
                  <span style={{ color: T.isDark ? C.teal : C.blue, fontWeight: 700 }}>{fmt(totalDebt)}</span>.
                  The Debt Planner calculates your exact payoff timeline and total interest saved under each strategy.
                </div>
              </div>

              {/* CTA */}
              <a href="/dashboard/debt" style={{
                marginTop: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 0',
                borderRadius: 12,
                background: `linear-gradient(135deg, ${C.blueDk}, ${C.blue} 60%, ${C.teal})`,
                color: '#fff',
                fontSize: 13, fontWeight: 700,
                textDecoration: 'none',
                letterSpacing: '0.03em',
                boxShadow: '0 4px 20px rgba(46,211,198,0.2)',
              }}>
                Compare Payoff Strategies
                <svg width={14} height={14} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10h12M12 5l5 5-5 5" />
                </svg>
              </a>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: C.muted, fontStyle: 'italic' }}>
              Add liabilities above to enable strategy comparison.
            </div>
          )}
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════
          ROW 3 — LIABILITY CATEGORIES
      ═══════════════════════════════════════════════════ */}
      {(Object.keys(CAT) as LiabilityCat[]).map(cat => {
        const items: LiabilityItem[] = liabilities[cat] as LiabilityItem[];
        const { label, color, icon, glow } = CAT[cat];
        const total = totals[cat];

        return (
          <Card key={cat} style={{ marginBottom: 16, overflow: 'hidden' }}>
            {/* top accent bar */}
            <div style={{
              height: 2,
              background: `linear-gradient(90deg, transparent, ${color}80, ${C.teal}90, transparent)`,
            }} />

            {/* category header */}
            <div style={{
              padding: '20px 28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: items.length > 0 ? `1px solid rgba(46,211,198,0.14)` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${color}18`,
                  border: `1px solid ${color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, boxShadow: `0 0 16px ${glow}`,
                }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{label}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {items.length === 0 ? 'No accounts' : `${items.length} account${items.length !== 1 ? 's' : ''}`}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: '-0.02em' }}>
                  {total > 0 ? fmtK(total) : '—'}
                </div>
                {totalDebt > 0 && total > 0 && (
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {(total / totalDebt * 100).toFixed(1)}% of total debt
                  </div>
                )}
              </div>
            </div>

            {/* empty state */}
            {items.length === 0 && (
              <div style={{ padding: '20px 28px', color: C.muted, fontSize: 13, fontStyle: 'italic' }}>
                No {label.toLowerCase()} recorded.
              </div>
            )}

            {/* account rows */}
            {items.map((item, idx) => {
              const isOpen = expanded[item.id];
              return (
                <div key={item.id}>
                  {idx > 0 && <div style={{ height: 1, background: 'rgba(46,211,198,0.12)', marginLeft: 28, marginRight: 28 }} />}

                  {/* main row — full row clickable */}
                  <div
                    onClick={() => setExpanded(p => ({ ...p, [item.id]: !p[item.id] }))}
                    style={{
                      padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: 'pointer', transition: 'background 0.15s ease',
                      background: isOpen ? (T.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(10,63,168,0.02)') : 'transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(10,63,168,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = isOpen ? (T.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(10,63,168,0.02)') : 'transparent')}
                  >
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      {/* color pip */}
                      <div style={{ width: 3, height: 36, borderRadius: 2, background: color, boxShadow: `0 0 8px ${glow}`, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                          {item.institution ?? 'Manual'} · {item.owner}
                          {item.interestRate ? ` · ${pct(item.interestRate)} APR` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{fmt(item.amount)}</div>
                        {item.remainingTerm && (
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.remainingTerm} remaining</div>
                        )}
                      </div>

                      {/* edit / delete — manual accounts only */}
                      {item.sourceType === 'manual' && (
                        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                          <button
                            title="Edit"
                            onClick={() => setEditTarget({
                              accountId:           item.id,
                              category:            cat,
                              name:                item.name,
                              institution:         item.institution,
                              owner:               item.owner,
                              amount:              item.amount,
                              interestRate:        item.interestRate,
                              minimumPayment:      item.paymentAmount,
                              remainingTermMonths: item.remainingTermMonths,
                            })}
                            style={{
                              border: `1px solid ${T.border}`, background: 'transparent',
                              borderRadius: 8, padding: '5px 8px', cursor: 'pointer',
                              fontSize: 13, color: C.muted, lineHeight: 1,
                            }}
                          >
                            ✎
                          </button>
                          <button
                            title="Delete"
                            onClick={async () => {
                              if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
                              try { await deleteManualLiability(item.id); }
                              catch (err: any) { alert(err.message ?? 'Failed to delete'); }
                            }}
                            style={{
                              border: '1px solid rgba(220,38,38,0.3)', background: 'transparent',
                              borderRadius: 8, padding: '5px 8px', cursor: 'pointer',
                              fontSize: 13, color: '#dc2626', lineHeight: 1,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {/* chevron */}
                      <svg width={18} height={18} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: C.muted }}>
                        <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  {/* expanded detail */}
                  {isOpen && (
                    <div style={{
                      padding: '0 28px 22px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: 12,
                    }}>
                      {[
                        { label: 'Owner',          value: item.owner },
                        { label: 'Payment',        value: item.paymentAmount != null ? `$${item.paymentAmount.toLocaleString()}` : '—' },
                        { label: 'Interest Rate',  value: pct(item.interestRate) },
                        { label: 'Remaining Term', value: item.remainingTerm ?? '—' },
                      ].map(({ label: l, value: v }) => (
                        <div key={l} style={{
                          padding: '14px 16px',
                          background: T.isDark ? 'rgba(255,255,255,0.04)' : T.cardBg3,
                          border: `1px solid ${T.border}`,
                          borderRadius: 12,
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(46,211,198,0.55)', marginBottom: 6 }}>{l}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        );
      })}

      {/* ═══════════════════════════════════════════════════
          ADD BUTTON (floating)
      ═══════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 32px',
            background: `linear-gradient(135deg, ${C.blueDk}, ${C.blue}, ${C.teal})`,
            border: 'none',
            borderRadius: 14,
            color: '#fff',
            fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 8px 28px rgba(46,211,198,0.25)`,
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <span style={{ fontSize: 18 }}>＋</span>
          Add Liability
        </button>
      </div>

      {showModal  && <AddLiabilityModal onClose={() => setShowModal(false)} />}
      {editTarget && <AddLiabilityModal initial={editTarget} onClose={() => setEditTarget(null)} />}
    </div>
  );
}
