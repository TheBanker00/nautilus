'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { showToast } from '../../components/finance/toast';
import { createClient } from '../../lib/supabase-browser';
import { useTransactionData } from '../../lib/transactioncontext';
import {
  calculateSmartBudget,
  CANONICAL_CATEGORIES,
  CATEGORY_SUBCATEGORIES,
  FIXED_SUBCATEGORIES,
  INCOME_GROUPS,
  type CategoryBudgetData,
  type SubcategoryBudgetData,
  type IncomeGroupData,
  type IncomeGroupName,
} from '../../lib/financialengine/budget/calculatesmartbudget';
import { CATEGORY_EMOJI, SUBCATEGORY_EMOJI } from '../../lib/taxonomy-emojis';

/* ─────────────────────────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

/* ─────────────────────────────────────────────────────────────
   LOCAL STORAGE
───────────────────────────────────────────────────────────── */
const STORAGE_KEY = 'wl-smart-budgets-v2';
type StoredState = {
  catBudgets:    Record<string, number>;
  subBudgets:    Record<string, Record<string, number>>;
  incomeBudgets: Record<string, number>;
  mode:          'lock-parent' | 'lock-children';
  bannerState:   'pending' | 'accepted' | 'manual';
};
function loadStored(): StoredState {
  try {
    if (typeof window === 'undefined') throw new Error();
    const d = localStorage.getItem(STORAGE_KEY);
    if (d) return JSON.parse(d);
  } catch {}
  return { catBudgets: {}, subBudgets: {}, incomeBudgets: {}, mode: 'lock-parent', bannerState: 'pending' };
}

/* ─────────────────────────────────────────────────────────────
   MOBILE — shared mobile design system
───────────────────────────────────────────────────────────── */
function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
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
  amber:  '#FBBF24',
};

/* plain numeric input for mobile edit rows — 16px prevents iOS zoom */
function MobileBudgetInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value === 0 ? '' : String(value)}
      placeholder="0"
      onChange={e => onChange(Math.max(0, Number(e.target.value) || 0))}
      style={{
        width: 90, padding: '8px 10px', borderRadius: 10, fontSize: 16,
        background: 'rgba(255,255,255,0.06)', border: `1px solid ${MN.border}`,
        color: MN.text, outline: 'none', textAlign: 'right', boxSizing: 'border-box',
        fontVariantNumeric: 'tabular-nums',
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   CURRENCY INPUT — inline editable
───────────────────────────────────────────────────────────── */
function CurrencyInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [raw,     setRaw]     = useState('');

  function start() { setRaw(String(Math.round(value))); setEditing(true); }
  function commit() {
    onChange(Math.max(0, Math.round(Number(raw) || 0)));
    setEditing(false);
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--t-primary)', borderRadius: 8, overflow: 'hidden', background: 'var(--t-surface)', minWidth: 120 }}>
        <span style={{ padding: '5px 4px 5px 10px', color: 'var(--t-text-tertiary)', fontSize: 13 }}>$</span>
        <input
          autoFocus type="number" value={raw}
          onChange={e => setRaw(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          style={{ flex: 1, minWidth: 0, padding: '5px 10px 5px 0', border: 'none', outline: 'none', fontSize: 14, fontWeight: 700, color: 'var(--t-text-primary)', background: 'transparent', fontVariantNumeric: 'tabular-nums' }}
        />
      </div>
    );
  }

  return (
    <button
      onClick={start}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--t-primary)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--t-border)')}
      style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid var(--t-border)', background: 'var(--t-surface)', cursor: 'text', fontSize: 14, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums', minWidth: 120, textAlign: 'right', transition: 'border-color 0.15s', display: 'block' }}
    >
      {fmt(value)}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   CONFIDENCE BADGE
───────────────────────────────────────────────────────────── */
function ConfidenceBadge({ confidence, reason }: { confidence: number; reason?: string }) {
  const [color, bg] =
    confidence >= 85 ? ['#15803D', '#F0FDF4'] :
    confidence >= 70 ? ['var(--t-primary)', 'var(--t-primary-bg)'] :
    confidence >= 50 ? ['#B45309', '#FFFBEB'] :
                       ['var(--t-text-tertiary)', 'var(--t-bg)'];
  return (
    <span title={reason} style={{ padding: '2px 8px', borderRadius: 100, background: bg, color, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', cursor: reason ? 'help' : 'default' }}>
      {confidence}%
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   SUBCATEGORY ROW
───────────────────────────────────────────────────────────── */
function SubRow({ sub, budget, onBudgetChange }: {
  sub: SubcategoryBudgetData;
  budget: number;
  onBudgetChange: (v: number) => void;
}) {
  const diff = budget - sub.historicalAvg;
  const emoji = SUBCATEGORY_EMOJI[sub.subcategory] || '📄';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 90px 80px', alignItems: 'center', gap: '0 16px', padding: '10px 24px 10px 56px', borderBottom: '1px solid var(--t-border)', background: 'var(--t-bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>{emoji}</span>
        <span style={{ fontSize: 13, color: 'var(--t-text-secondary)' }}>{sub.subcategory}</span>
        {sub.isFixed && (
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.05em', border: '1px solid var(--t-border)', borderRadius: 4, padding: '1px 4px' }}>FIXED</span>
        )}
      </div>
      <div onClick={e => e.stopPropagation()}>
        <CurrencyInput value={budget} onChange={onBudgetChange} />
      </div>
      <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--t-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
        {sub.historicalAvg > 0 ? fmt(sub.historicalAvg) : '—'}
      </div>
      <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: diff >= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)' }}>
        {sub.historicalAvg > 0 ? (diff >= 0 ? '+' : '') + fmt(diff) : '—'}
      </div>
      <div style={{ textAlign: 'right' }}>
        <ConfidenceBadge confidence={sub.confidence} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CATEGORY ROW
───────────────────────────────────────────────────────────── */
function CategoryRow({ catData, budget, subBudgets, expanded, onToggle, onBudgetChange, onSubBudgetChange }: {
  catData: CategoryBudgetData;
  budget: number;
  subBudgets: Record<string, number>;
  expanded: boolean;
  onToggle: () => void;
  onBudgetChange: (v: number) => void;
  onSubBudgetChange: (sub: string, v: number) => void;
}) {
  const { category, historicalAvg, confidence, confidenceReason, trendDirection, trendPct, subcategories, needsAttention, spanMonths, ytdSpend, ytdMonths, isLumpy } = catData;
  const emoji    = CATEGORY_EMOJI[category] || '📦';
  const diff     = budget - historicalAvg;
  const pct      = budget > 0 && historicalAvg > 0 ? Math.min(110, (historicalAvg / budget) * 100) : 0;
  const barColor = pct > 100 ? 'var(--t-red)' : pct > 85 ? 'var(--t-amber)' : 'var(--t-green)';

  // Annual tracker (shown in expanded view)
  const annualBudget  = budget * 12;
  const ytdBudgetSoFar = budget * ytdMonths;   // how much budget has elapsed so far this year
  const ytdPct        = ytdBudgetSoFar > 0 ? Math.min(110, (ytdSpend / ytdBudgetSoFar) * 100) : 0;
  const ytdBarColor   = ytdPct > 100 ? 'var(--t-red)' : ytdPct > 85 ? 'var(--t-amber)' : 'var(--t-green)';
  const ytdRemaining  = Math.max(0, annualBudget - ytdSpend);

  return (
    <>
      <div
        onClick={onToggle}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = 'var(--t-bg)'; }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = 'var(--t-surface)'; }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 90px 170px 80px 28px', alignItems: 'center', gap: '0 16px', padding: '15px 24px', borderBottom: '1px solid var(--t-border)', cursor: 'pointer', background: expanded ? 'var(--t-primary-bg)' : 'var(--t-surface)', transition: 'background 0.12s' }}
      >
        {/* Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--t-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>
            {emoji}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text-primary)' }}>{category}</div>
            {needsAttention
              ? <div style={{ fontSize: 11, color: 'var(--t-amber-text)', marginTop: 1 }}>⚠ Trending up</div>
              : isLumpy
              ? <div style={{ fontSize: 11, color: 'var(--t-primary)', marginTop: 1 }}>Irregular · {catData.monthsOfData} of {spanMonths} months</div>
              : spanMonths > 0
              ? <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 1 }}>{spanMonths} month{spanMonths !== 1 ? 's' : ''} of history</div>
              : <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 1 }}>No history</div>
            }
          </div>
        </div>

        {/* Budget input */}
        <div onClick={e => e.stopPropagation()}>
          <CurrencyInput value={budget} onChange={onBudgetChange} />
        </div>

        {/* Avg */}
        <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--t-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
          {historicalAvg > 0 ? fmt(historicalAvg) : '—'}
        </div>

        {/* Variance */}
        <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: diff >= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)' }}>
          {historicalAvg > 0 ? (diff >= 0 ? '+' : '') + fmt(diff) : '—'}
        </div>

        {/* Progress + trend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 6, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: barColor, borderRadius: 100, transition: 'width 0.4s ease' }} />
          </div>
          {trendDirection !== 'stable' && (
            <span style={{ fontSize: 11, fontWeight: 700, color: trendDirection === 'up' ? 'var(--t-red-text)' : 'var(--t-green-text)', whiteSpace: 'nowrap' }}>
              {trendDirection === 'up' ? '↑' : '↓'}{trendPct}%
            </span>
          )}
        </div>

        {/* Confidence */}
        <div style={{ textAlign: 'right' }}>
          <ConfidenceBadge confidence={confidence} reason={confidenceReason} />
        </div>

        {/* Expand arrow */}
        <div style={{ textAlign: 'center', color: 'var(--t-text-tertiary)', fontSize: 11, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</div>
      </div>

      {/* Annual tracker — shown when expanded */}
      {expanded && (ytdSpend > 0 || annualBudget > 0) && (
        <div style={{ padding: '12px 24px 12px 72px', background: 'var(--t-bg)', borderBottom: '1px solid var(--t-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.05em' }}>
              📅 {new Date().getFullYear()} ANNUAL TRACKER
              {isLumpy && <span style={{ marginLeft: 6, color: 'var(--t-primary)' }}>· Irregular category</span>}
            </span>
            <span style={{ fontSize: 12, color: 'var(--t-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(ytdSpend)} spent · {fmt(ytdRemaining)} remaining of {fmt(annualBudget)} annual
            </span>
          </div>
          <div style={{ height: 5, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, ytdPct)}%`, background: ytdBarColor, borderRadius: 100, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--t-text-tertiary)' }}>{ytdMonths} of 12 months elapsed</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: ytdPct > 100 ? 'var(--t-red-text)' : 'var(--t-text-tertiary)' }}>
              {ytdPct.toFixed(0)}% of YTD budget used
            </span>
          </div>
        </div>
      )}

      {/* Subcategory rows */}
      {expanded && subcategories.map(sub => (
        <SubRow
          key={sub.subcategory}
          sub={sub}
          budget={subBudgets[sub.subcategory] ?? sub.suggestedBudget}
          onBudgetChange={v => onSubBudgetChange(sub.subcategory, v)}
        />
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   TRACKING VIEW COMPONENTS
───────────────────────────────────────────────────────────── */
function TrackingRow({ label, emoji, budget, spent, editMode, onBudgetChange }: {
  label: string; emoji: string; budget: number; spent: number;
  editMode: boolean; onBudgetChange: (v: number) => void;
}) {
  const remaining = budget - spent;
  const pct       = budget > 0 ? Math.min(110, (spent / budget) * 100) : 0;
  const barColor  = pct >= 100 ? 'var(--t-red)' : 'var(--t-primary)';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 150px 1fr auto', alignItems: 'center', gap: '0 16px', padding: '14px 32px', borderBottom: '1px solid var(--t-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--t-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{emoji}</div>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text-primary)' }}>{label}</span>
      </div>
      <div onClick={e => e.stopPropagation()}>
        {editMode
          ? <CurrencyInput value={budget} onChange={onBudgetChange} />
          : <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(budget)}</span>
        }
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(spent)}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: remaining >= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)', fontVariantNumeric: 'tabular-nums' }}>
        {remaining >= 0 ? fmt(remaining) + ' left' : fmt(Math.abs(remaining)) + ' over'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 8, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: barColor, borderRadius: 100, transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: barColor, minWidth: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(pct)}%</span>
      </div>
      <div />
    </div>
  );
}

function IncomeTrackingRow({ label, emoji, expected, received, editMode, onExpectedChange }: {
  label: string; emoji: string; expected: number; received: number;
  editMode: boolean; onExpectedChange: (v: number) => void;
}) {
  const diff     = received - expected;
  const pct      = expected > 0 ? Math.min(110, (received / expected) * 100) : 0;
  const barColor = pct >= 100 ? 'var(--t-green)' : pct >= 75 ? 'var(--t-amber)' : 'var(--t-red)';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 150px 1fr auto', alignItems: 'center', gap: '0 16px', padding: '14px 32px', borderBottom: '1px solid var(--t-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'color-mix(in srgb, var(--t-green) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{emoji}</div>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text-primary)' }}>{label}</span>
      </div>
      <div onClick={e => e.stopPropagation()}>
        {editMode
          ? <CurrencyInput value={expected} onChange={onExpectedChange} />
          : <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(expected)}</span>
        }
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(received)}</div>
      <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: diff >= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)' }}>
        {diff >= 0 ? '+' : ''}{fmt(diff)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 8, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: barColor, borderRadius: 100, transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: barColor, minWidth: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(pct)}%</span>
      </div>
      <div />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function BudgetPage() {
  const isMobile = useMobile();
  const { transactions } = useTransactionData();

  const smartBudget = useMemo(() => calculateSmartBudget(transactions), [transactions]);

  // ── Phase state ────────────────────────────────────────────
  // 'loading' → checking SQL; 'setup' → no saved budget; 'tracking' → budget active
  const [phase,         setPhase]         = useState<'loading' | 'setup' | 'tracking'>('loading');
  const [editMode,      setEditMode]      = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [saveError,     setSaveError]     = useState<string | null>(null);

  // Saved budgets (from SQL / authoritative)
  const [savedCats,     setSavedCats]     = useState<Record<string, number>>({});
  const [savedIncome,   setSavedIncome]   = useState<Record<string, number>>({});

  // Edit buffers (in-flight changes before Save)
  const [editCats,      setEditCats]      = useState<Record<string, number>>({});
  const [editInc,       setEditInc]       = useState<Record<string, number>>({});

  // Setup-phase working state (unchanged from before)
  const [catBudgets,    setCatBudgets]    = useState<Record<string, number>>({});
  const [subBudgets,    setSubBudgets]    = useState<Record<string, Record<string, number>>>({});
  const [incomeBudgets, setIncomeBudgets] = useState<Record<string, number>>({});
  const [expanded,      setExpanded]      = useState<Set<string>>(new Set());
  const [mode,          setMode]          = useState<'lock-parent' | 'lock-children'>('lock-parent');
  const [bannerState,   setBannerState]   = useState<'pending' | 'accepted' | 'manual'>('pending');

  // ── Load saved budget from Supabase on mount ──────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const uid = session?.user?.id;
      if (!uid) { setPhase('setup'); return; }

      const { data, error } = await supabase
        .from('budgets')
        .select('name, budget_limit, category')
        .eq('user_id', uid)
        .eq('color', 'smart-budget');

      if (!error && data && data.length > 0) {
        const cats: Record<string, number> = {};
        const inc:  Record<string, number> = {};
        for (const row of data) {
          if (row.category === '__income__') inc[row.name]  = Number(row.budget_limit ?? 0);
          else                               cats[row.name] = Number(row.budget_limit ?? 0);
        }
        setSavedCats(cats);
        setSavedIncome(inc);
        setPhase('tracking');
      } else {
        // No saved budget — restore setup-phase draft from localStorage
        const stored = loadStored();
        if (Object.keys(stored.catBudgets).length)  setCatBudgets(stored.catBudgets);
        if (Object.keys(stored.subBudgets).length)  setSubBudgets(stored.subBudgets);
        if (stored.incomeBudgets && Object.keys(stored.incomeBudgets).length) setIncomeBudgets(stored.incomeBudgets);
        setMode(stored.mode);
        setBannerState(stored.bannerState);
        setPhase('setup');
      }
    });
  }, []);

  // Persist setup-phase draft to localStorage
  useEffect(() => {
    if (phase !== 'setup') return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ catBudgets, subBudgets, incomeBudgets, mode, bannerState })); } catch {}
  }, [catBudgets, subBudgets, incomeBudgets, mode, bannerState, phase]);

  // Effective category budget: user-set → AI suggestion → 0
  const effectiveBudgets = useMemo(() => {
    const r: Record<string, number> = {};
    for (const cat of CANONICAL_CATEGORIES) {
      const catData = smartBudget.categories.find(c => c.category === cat);
      r[cat] = catBudgets[cat] ?? catData?.suggestedBudget ?? 0;
    }
    return r;
  }, [catBudgets, smartBudget.categories]);

  // Effective sub-budgets: user-set → AI suggestion
  const getEffectiveSubs = useCallback((cat: string): Record<string, number> => {
    if (subBudgets[cat] && Object.keys(subBudgets[cat]).length) return subBudgets[cat];
    const catData = smartBudget.categories.find(c => c.category === cat);
    if (!catData) return {};
    const r: Record<string, number> = {};
    for (const s of catData.subcategories) r[s.subcategory] = s.suggestedBudget;
    return r;
  }, [subBudgets, smartBudget.categories]);

  // Effective income budgets: user-set → historical avg
  const effectiveIncomeBudgets = useMemo(() => {
    const r: Record<string, number> = {};
    for (const grp of smartBudget.incomeGroups) {
      r[grp.group] = incomeBudgets[grp.group] ?? grp.historicalAvg;
    }
    return r;
  }, [incomeBudgets, smartBudget.incomeGroups]);

  // KPIs
  const totalBudgeted      = Object.values(effectiveBudgets).reduce((a, b) => a + b, 0);
  const totalHistoricalAvg = smartBudget.categories.reduce((s, c) => s + c.historicalAvg, 0);
  const monthlyIncome      = Object.values(effectiveIncomeBudgets).reduce((a, b) => a + b, 0) || smartBudget.monthlyIncome;
  const savings            = monthlyIncome - totalBudgeted;

  /* ── Subcategory redistribution ──────────────────────────── */
  function redistributeSubs(currentSubs: Record<string, number>, newParent: number): Record<string, number> {
    const fixedKeys = Object.keys(currentSubs).filter(s => FIXED_SUBCATEGORIES.has(s));
    const varKeys   = Object.keys(currentSubs).filter(s => !FIXED_SUBCATEGORIES.has(s));
    const fixedTotal  = fixedKeys.reduce((s, k) => s + (currentSubs[k] || 0), 0);
    const varTarget   = Math.max(0, newParent - fixedTotal);
    const varTotal    = varKeys.reduce((s, k) => s + (currentSubs[k] || 0), 0) || 1;
    const result: Record<string, number> = {};
    for (const k of fixedKeys) result[k] = currentSubs[k] || 0;
    for (const k of varKeys)   result[k] = Math.round((currentSubs[k] / varTotal) * varTarget);
    return result;
  }

  function handleCatChange(cat: string, v: number) {
    setCatBudgets(prev => ({ ...prev, [cat]: v }));
    const subs = getEffectiveSubs(cat);
    if (Object.keys(subs).length) {
      setSubBudgets(prev => ({ ...prev, [cat]: redistributeSubs(subs, v) }));
    }
  }

  function handleSubChange(cat: string, sub: string, v: number) {
    const currentSubs = { ...getEffectiveSubs(cat), [sub]: v };

    if (mode === 'lock-parent') {
      const parentBudget = effectiveBudgets[cat];
      const fixedKeys    = Object.keys(currentSubs).filter(s => FIXED_SUBCATEGORIES.has(s));
      const otherVarKeys = Object.keys(currentSubs).filter(s => !FIXED_SUBCATEGORIES.has(s) && s !== sub);
      const fixedTotal   = fixedKeys.reduce((s, k) => s + (currentSubs[k] || 0), 0);
      const remainTarget = Math.max(0, parentBudget - fixedTotal - v);
      const otherTotal   = otherVarKeys.reduce((s, k) => s + (currentSubs[k] || 0), 0) || 1;
      for (const k of otherVarKeys) currentSubs[k] = Math.round((currentSubs[k] / otherTotal) * remainTarget);
      setSubBudgets(prev => ({ ...prev, [cat]: currentSubs }));
    } else {
      const newParent = Object.values(currentSubs).reduce((a, b) => a + b, 0);
      setSubBudgets(prev => ({ ...prev, [cat]: currentSubs }));
      setCatBudgets(prev => ({ ...prev, [cat]: newParent }));
    }
  }

  async function saveBudgetToSQL(cats: Record<string, number>, inc: Record<string, number>) {
    setSaving(true);
    setSaveError(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) { setSaveError('Not signed in — please refresh and try again'); return; }

      // Delete existing smart-budget rows for this user then re-insert
      const { error: delErr } = await supabase
        .from('budgets')
        .delete()
        .eq('user_id', uid)
        .eq('color', 'smart-budget');
      if (delErr) { setSaveError(delErr.message); return; }

      const rows = [
        ...Object.entries(cats).map(([name, limit]) => ({
          user_id: uid, item_type: 'spending', name, category: name,
          budget_limit: limit, period: 'monthly', color: 'smart-budget',
        })),
        ...Object.entries(inc).map(([name, limit]) => ({
          user_id: uid, item_type: 'spending', name, category: '__income__',
          budget_limit: limit, period: 'monthly', color: 'smart-budget',
        })),
      ];

      const { error: insErr } = await supabase.from('budgets').insert(rows);
      if (insErr) { setSaveError(insErr.message); return; }

      setSavedCats(cats);
      setSavedIncome(inc);
      setPhase('tracking');
      setEditMode(false);
    } catch (e: any) {
      setSaveError(e?.message ?? 'Unexpected error — budget not saved');
    } finally {
      setSaving(false);
    }
  }

  function handleAcceptAll() {
    const cats: Record<string, number> = {};
    const subs: Record<string, Record<string, number>> = {};
    for (const c of smartBudget.categories) {
      cats[c.category] = c.suggestedBudget;
      const sm: Record<string, number> = {};
      for (const s of c.subcategories) sm[s.subcategory] = s.suggestedBudget;
      subs[c.category] = sm;
    }
    const inc: Record<string, number> = {};
    for (const g of smartBudget.incomeGroups) inc[g.group] = g.historicalAvg;
    setCatBudgets(cats);
    setSubBudgets(subs);
    setIncomeBudgets(inc);
    saveBudgetToSQL(cats, inc);
  }

  function handleSetupSave() {
    const inc: Record<string, number> = {};
    for (const g of smartBudget.incomeGroups) inc[g.group] = effectiveIncomeBudgets[g.group] ?? g.historicalAvg;
    saveBudgetToSQL({ ...effectiveBudgets }, inc);
  }

  function handleReset() {
    setCatBudgets({});
    setSubBudgets({});
    setIncomeBudgets({});
    setBannerState('pending');
  }

  function handleStartEdit() {
    setEditCats({ ...savedCats });
    setEditInc({ ...savedIncome });
    setEditMode(true);
  }

  function handleCancelEdit() {
    setEditMode(false);
  }

  async function handleSaveEdit() {
    await saveBudgetToSQL(editCats, editInc);
  }

  const attentionItems  = smartBudget.categories.filter(c => c.needsAttention);
  const consistentItems = smartBudget.categories.filter(c => !c.needsAttention && c.monthsOfData > 1).slice(0, 3);

  // ── MTD actuals (tracking phase) ──────────────────────────
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const mtdByCategory = useMemo(() => {
    const r: Record<string, number> = {};
    for (const t of transactions) {
      if (!t.date?.startsWith(currentMonth)) continue;
      if (t.transaction_type !== 'Expense') continue;
      const cat = t.category || 'Miscellaneous';
      r[cat] = (r[cat] || 0) + Math.abs(Number(t.amount || 0));
    }
    return r;
  }, [transactions, currentMonth]);

  const mtdIncomeByGroup = useMemo(() => {
    const r: Record<string, number> = {};
    for (const [group, subcats] of Object.entries(INCOME_GROUPS)) {
      const subSet = new Set(subcats as readonly string[]);
      r[group] = transactions
        .filter(t => t.date?.startsWith(currentMonth) && t.transaction_type === 'Income')
        .reduce((s, t) => s + (subSet.has(t.subcategory ?? '') || subSet.has(t.category ?? '') ? Math.abs(Number(t.amount || 0)) : 0), 0);
    }
    return r;
  }, [transactions, currentMonth]);

  // Active budgets for tracking view (edit buffers override saved when editing)
  const activeCats   = editMode ? editCats   : savedCats;
  const activeIncome = editMode ? editInc    : savedIncome;

  const mtdTotalSpent    = CANONICAL_CATEGORIES.reduce((s, c) => s + (mtdByCategory[c] || 0), 0);
  const totalActiveBudget = Object.values(activeCats).reduce((a, b) => a + b, 0);
  const mtdTotalIncome   = Object.values(mtdIncomeByGroup).reduce((a, b) => a + b, 0);
  const totalExpectedIncome = Object.values(activeIncome).reduce((a, b) => a + b, 0);

  /* ── Render ─────────────────────────────────────────────── */
  if (phase === 'loading') {
    return <div style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 24px', textAlign: 'center', color: 'var(--t-text-tertiary)' }}>Loading budget…</div>;
  }

  if (phase === 'tracking') {
    const now         = new Date();
    const monthLabel  = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    const dayOfMonth  = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthPct    = dayOfMonth / daysInMonth;                           // elapsed fraction of month

    const remaining   = totalActiveBudget - mtdTotalSpent;
    const budgetPct   = totalActiveBudget > 0 ? (mtdTotalSpent / totalActiveBudget) * 100 : 0;
    const paceRatio   = monthPct > 0 ? (budgetPct / 100) / monthPct : 0;   // 1.0 = exactly on pace
    const paceOffset  = Math.round((paceRatio - 1) * 100);                  // negative = under pace (good)
    const onPace      = Math.abs(paceOffset) <= 5;
    const underPace   = paceOffset < -5;
    const paceColor   = onPace ? 'var(--t-text-tertiary)' : underPace ? 'var(--t-green-text)' : 'var(--t-red-text)';
    const barColor    = budgetPct >= 100 ? 'var(--t-red)' : 'var(--t-primary)';

    /* ── MOBILE TRACKING VIEW ── */
    if (isMobile) {
      const mtdSaved = mtdTotalIncome - mtdTotalSpent;
      const mPaceColor = onPace ? MN.muted : underPace ? MN.green : MN.red;
      return (
        <div style={{ color: MN.text, fontFamily: 'var(--font-body)', paddingBottom: 16 }}>

          {/* HERO — left to spend */}
          <div style={{
            background: 'linear-gradient(135deg, #0a3fa8 0%, #0F2044 100%)',
            borderRadius: 20, padding: '24px 20px 20px', marginBottom: 16,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, transparent, ${MN.gold}, #67E6D5, ${MN.gold}, transparent)` }} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(46,211,198,0.75)', marginBottom: 6 }}>
              Left to Spend · {monthLabel}
            </div>
            <div style={{
              fontSize: 42, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 12,
              backgroundImage: `linear-gradient(135deg, #ffffff 0%, ${remaining >= 0 ? MN.gold : MN.red} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {remaining >= 0 ? fmt(remaining) : '-' + fmt(Math.abs(remaining))}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.08)', border: `1px solid rgba(255,255,255,0.15)`,
              borderRadius: 100, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: mPaceColor,
            }}>
              {onPace ? '→ On pace' : underPace ? `↓ ${Math.abs(paceOffset)}% under pace` : `↑ ${paceOffset}% over pace`}
              <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>Day {dayOfMonth} of {daysInMonth}</span>
            </div>
            {/* usage bar with pace tick */}
            <div style={{ marginTop: 16, position: 'relative' }}>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.12)' }}>
                <div style={{ height: 8, borderRadius: 4, width: `${Math.min(100, budgetPct)}%`, background: budgetPct >= 100 ? MN.red : MN.gold, transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ position: 'absolute', top: -3, left: `${Math.min(99, monthPct * 100)}%`, width: 2, height: 14, background: '#ffffff', borderRadius: 1, opacity: 0.7 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10, color: MN.faint }}>
                <span>{Math.round(budgetPct)}% used</span>
                <span>{fmt(totalActiveBudget)} budget</span>
              </div>
            </div>
          </div>

          {/* STAT TILES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Spent',  value: fmt(mtdTotalSpent), color: mtdTotalSpent > totalActiveBudget ? MN.red : MN.text },
              { label: 'Income', value: mtdTotalIncome > 0 ? fmt(mtdTotalIncome) : '—', color: MN.green },
              { label: 'Saved',  value: (mtdSaved >= 0 ? '' : '-') + fmt(Math.abs(mtdSaved)), color: mtdSaved >= 0 ? MN.green : MN.red },
            ].map(s => (
              <div key={s.label} style={{ background: MN.card, borderRadius: 14, border: `1px solid ${MN.border}`, padding: '12px 12px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: MN.muted, marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* EDIT TOGGLE */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            {editMode ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCancelEdit} style={{ padding: '9px 16px', borderRadius: 100, border: `1px solid ${MN.border}`, background: MN.card, color: MN.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button onClick={async () => { await handleSaveEdit(); showToast('Budget updated ✓'); }} disabled={saving} style={{ padding: '9px 18px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg, #0a3fa8, #4DA3FF)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            ) : (
              <button onClick={handleStartEdit} style={{ padding: '9px 16px', borderRadius: 100, border: `1px solid ${MN.border}`, background: MN.card, color: MN.gold, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✏️ Edit Budgets</button>
            )}
          </div>

          {/* INCOME */}
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 2px 8px' }}>Income</div>
          <div style={{ background: MN.card, borderRadius: 14, border: `1px solid ${MN.border}`, overflow: 'hidden', marginBottom: 16 }}>
            {(Object.keys(INCOME_GROUPS) as (keyof typeof INCOME_GROUPS)[]).map((group, gi, arr) => {
              const expected = activeIncome[group] ?? 0;
              const received = mtdIncomeByGroup[group] ?? 0;
              const pct = expected > 0 ? Math.min(100, (received / expected) * 100) : 0;
              return (
                <div key={group} style={{ padding: '12px 14px', borderBottom: gi < arr.length - 1 ? `1px solid ${MN.border}` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: MN.text }}>{group === 'Payroll Income' ? '💼' : '📈'} {group}</span>
                    {editMode ? (
                      <MobileBudgetInput value={editInc[group] ?? 0} onChange={v => setEditInc(prev => ({ ...prev, [group]: v }))} />
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 700, color: MN.green, fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(received)} <span style={{ color: MN.faint, fontWeight: 400 }}>/ {fmt(expected)}</span>
                      </span>
                    )}
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
                    <div style={{ height: 5, borderRadius: 3, width: `${pct}%`, background: MN.green, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* EXPENSE CATEGORIES */}
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 2px 8px' }}>Spending by Category</div>
          <div style={{ background: MN.card, borderRadius: 14, border: `1px solid ${MN.border}`, overflow: 'hidden' }}>
            {CANONICAL_CATEGORIES.map((cat, ci) => {
              const budget = activeCats[cat] ?? 0;
              const spent = mtdByCategory[cat] ?? 0;
              const catRemaining = budget - spent;
              const pct = budget > 0 ? Math.min(110, (spent / budget) * 100) : 0;
              const rowBar = pct >= 100 ? MN.red : pct >= 85 ? MN.amber : MN.gold;
              return (
                <div key={cat} style={{ padding: '12px 14px', borderBottom: ci < CANONICAL_CATEGORIES.length - 1 ? `1px solid ${MN.border}` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: MN.text, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {CATEGORY_EMOJI[cat] || '📦'} {cat}
                    </span>
                    {editMode ? (
                      <MobileBudgetInput value={editCats[cat] ?? 0} onChange={v => setEditCats(prev => ({ ...prev, [cat]: v }))} />
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: catRemaining >= 0 ? MN.muted : MN.red, flexShrink: 0, marginLeft: 10 }}>
                        {fmt(spent)} <span style={{ color: MN.faint, fontWeight: 400 }}>/ {fmt(budget)}</span>
                      </span>
                    )}
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
                    <div style={{ height: 5, borderRadius: 3, width: `${Math.min(100, pct)}%`, background: rowBar, transition: 'width 0.5s ease' }} />
                  </div>
                  {!editMode && (
                    <div style={{ fontSize: 10, color: catRemaining >= 0 ? MN.faint : MN.red, marginTop: 4 }}>
                      {catRemaining >= 0 ? `${fmt(catRemaining)} left` : `${fmt(Math.abs(catRemaining))} over`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {saveError && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(248,113,113,0.12)', border: `1px solid rgba(248,113,113,0.3)`, color: MN.red, fontSize: 12 }}>
              ⚠ Save failed: {saveError}
            </div>
          )}
          {editMode && !saveError && (
            <div style={{ marginTop: 10, fontSize: 11, color: MN.faint, textAlign: 'center' }}>
              Changes take effect next month · MTD numbers reflect actual spending
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={{ padding: '0 0 72px' }}>

        {/* ── HERO CARD ── */}
        <div style={{
          background: 'var(--t-surface)', border: '1px solid var(--t-border)',
          borderLeft: '4px solid var(--t-primary)',
          borderRadius: 14, boxShadow: 'var(--t-shadow-sm)',
          padding: '40px 48px', marginBottom: 20, position: 'relative', overflow: 'hidden',
        }}>
          {/* Top gradient line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 1, background: 'linear-gradient(90deg, transparent, var(--t-primary), #4da3ff, var(--t-primary), transparent)' }} />
          {/* Subtle grid watermark */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(77,163,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(77,163,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 100% 50%, black 30%, transparent 80%)', maskImage: 'radial-gradient(ellipse 80% 100% at 100% 50%, black 30%, transparent 80%)' }} />

          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 28 }}>

            {/* Left — headline */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t-primary)', marginBottom: 8 }}>
                Budget Spend Left This Month · {monthLabel}
              </div>
              {/* Remaining — big number */}
              <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 14, fontVariantNumeric: 'tabular-nums', background: 'linear-gradient(135deg, var(--t-text-primary) 0%, var(--t-primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {remaining >= 0 ? fmt(remaining) : '-' + fmt(Math.abs(remaining))}
              </div>
              {/* Pace badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: onPace ? 'var(--t-bg)' : underPace ? 'color-mix(in srgb, var(--t-green) 12%, transparent)' : 'color-mix(in srgb, var(--t-red) 12%, transparent)', border: `1px solid ${onPace ? 'var(--t-border)' : underPace ? 'var(--t-green-border, var(--t-border))' : 'var(--t-red-border, var(--t-border))'}` }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: paceColor }}>
                    {onPace ? '→' : underPace ? '↓' : '↑'} {onPace ? 'On pace' : underPace ? `${Math.abs(paceOffset)}% under pace` : `${paceOffset}% over pace`}
                  </span>
                </div>
                <span style={{ color: 'var(--t-text-tertiary)', fontSize: 12 }}>Day {dayOfMonth} of {daysInMonth}</span>
              </div>
            </div>

            {/* Right — four stat columns */}
            {(() => {
              const mtdSaved = mtdTotalIncome - mtdTotalSpent;
              const spentColor = mtdTotalSpent > totalActiveBudget ? 'var(--t-red-text, #dc2626)' : 'var(--t-green-text, #16a34a)';
              const savedColor = mtdSaved >= 0 ? 'var(--t-green-text, #16a34a)' : 'var(--t-red-text, #dc2626)';
              return (
                <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Spent',     value: fmt(mtdTotalSpent), color: spentColor },
                    { label: 'Budget',    value: fmt(totalActiveBudget), color: 'var(--t-primary)' },
                    { label: 'Income',    value: mtdTotalIncome > 0 ? fmt(mtdTotalIncome) : '—', color: 'var(--t-green-text, #16a34a)' },
                    { label: 'MTD Saved', value: (mtdSaved >= 0 ? '' : '-') + fmt(Math.abs(mtdSaved)), color: savedColor },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: 'right', paddingTop: 8, minWidth: 90 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t-text-tertiary)', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Fill bar */}
          <div style={{ paddingTop: 28 }}>
            {/* Above-bar row: mirrors the flex structure so labels align with bar positions */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 4 }}>
              {/* Bar-width zone — labels positioned relative to bar width */}
              <div style={{ flex: 1, position: 'relative', height: 20 }}>
                <span style={{ position: 'absolute', left: 0, bottom: 0, fontSize: 10, fontWeight: 800, color: 'var(--t-primary)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
                  Budget Usage This Month
                </span>
                {/* Expected Pace label — tracks tick position */}
                <span style={{ position: 'absolute', bottom: 0, left: `${Math.min(99, monthPct * 100)}%`, transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, color: 'var(--t-primary)', whiteSpace: 'nowrap' }}>
                  Expected Pace
                </span>
              </div>
              {/* Spacer matching the % label width so bar zone is identical */}
              <div style={{ minWidth: 42, flexShrink: 0 }} />
            </div>

            {/* Track with pace marker — flex row keeps % label outside bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, position: 'relative', height: 10, borderRadius: 5, background: 'var(--t-border)', overflow: 'visible' }}>
                <div style={{ height: '100%', width: `${Math.min(100, budgetPct)}%`, background: barColor, borderRadius: 5, transition: 'width 0.6s ease' }} />
                {/* Pace tick */}
                <div style={{ position: 'absolute', top: -4, left: `${Math.min(99, monthPct * 100)}%`, width: 2, height: 18, background: 'var(--t-primary)', borderRadius: 1, opacity: 0.6, transform: 'translateX(-1px)' }} />
              </div>
              {/* Percentage — outside the bar, right side */}
              <span style={{ fontSize: 13, fontWeight: 800, color: barColor, minWidth: 42, textAlign: 'left', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {Math.round(budgetPct)}%
              </span>
            </div>

            {/* Below bar: mirrors flex structure — $0 left, total centered at 100% */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 4 }}>
              <div style={{ flex: 1, position: 'relative', height: 16 }}>
                <span style={{ position: 'absolute', left: 0, top: 0, fontSize: 11, fontWeight: 600, color: 'var(--t-primary)' }}>$0</span>
                <span style={{ position: 'absolute', left: '100%', top: 0, transform: 'translateX(-50%)', fontSize: 11, fontWeight: 600, color: 'var(--t-primary)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {fmt(totalActiveBudget)}
                </span>
              </div>
              <div style={{ minWidth: 42, flexShrink: 0 }} />
            </div>
          </div>
        </div>

        {/* Income tracking table */}
        <div style={{ background: 'var(--t-surface)', borderRadius: 14, boxShadow: 'var(--t-shadow-sm)', overflow: 'hidden', position: 'relative', marginBottom: 16 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--t-primary), #4da3ff, var(--t-primary), transparent)' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 150px 1fr auto', gap: '0 16px', padding: '12px 32px', borderBottom: '2px solid var(--t-border)', background: 'var(--t-bg)', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-green-text)', letterSpacing: '0.06em' }}>💵 INCOME</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em' }}>EXPECTED / MO</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em' }}>RECEIVED MTD</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em' }}>DIFFERENCE</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em' }}>PROGRESS</div>
            <div>
              {editMode ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleCancelEdit} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--t-border)', background: 'var(--t-surface)', color: 'var(--t-text-secondary)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>Cancel</button>
                  <button onClick={handleSaveEdit} disabled={saving} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: 'var(--t-primary)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, whiteSpace: 'nowrap' }}>{saving ? 'Saving…' : 'Save Changes'}</button>
                </div>
              ) : (
                <button onClick={handleStartEdit} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--t-border)', background: 'transparent', color: 'var(--t-text-tertiary)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>✏️ Edit</button>
              )}
            </div>
          </div>
          {(Object.keys(INCOME_GROUPS) as (keyof typeof INCOME_GROUPS)[]).map(group => (
            <IncomeTrackingRow
              key={group}
              label={group}
              emoji={group === 'Payroll Income' ? '💼' : '📈'}
              expected={activeIncome[group] ?? 0}
              received={mtdIncomeByGroup[group] ?? 0}
              editMode={editMode}
              onExpectedChange={v => setEditInc(prev => ({ ...prev, [group]: v }))}
            />
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 150px 1fr auto', gap: '0 16px', padding: '12px 32px', background: 'var(--t-bg)', borderTop: '2px solid var(--t-border)', alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-text-secondary)' }}>Total Income</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--t-green-text)', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalExpectedIncome)}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(mtdTotalIncome)}</div>
            <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: (mtdTotalIncome - totalExpectedIncome) >= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)' }}>
              {(mtdTotalIncome - totalExpectedIncome) >= 0 ? '+' : ''}{fmt(mtdTotalIncome - totalExpectedIncome)}
            </div>
            <div /><div />
          </div>
        </div>

        {/* Expense tracking table */}
        <div style={{ background: 'var(--t-surface)', borderRadius: 14, boxShadow: 'var(--t-shadow-sm)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 150px 1fr auto', gap: '0 16px', padding: '12px 32px', borderBottom: '2px solid var(--t-border)', background: 'var(--t-bg)', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em' }}>CATEGORY</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em' }}>MONTHLY BUDGET</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em' }}>SPENT MTD</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em' }}>REMAINING</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em' }}>MTD USAGE</div>
            <div>
              {editMode ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleCancelEdit} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--t-border)', background: 'var(--t-surface)', color: 'var(--t-text-secondary)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>Cancel</button>
                  <button onClick={handleSaveEdit} disabled={saving} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: 'var(--t-primary)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, whiteSpace: 'nowrap' }}>{saving ? 'Saving…' : 'Save Changes'}</button>
                </div>
              ) : (
                <button onClick={handleStartEdit} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--t-border)', background: 'transparent', color: 'var(--t-text-tertiary)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>✏️ Edit</button>
              )}
            </div>
          </div>
          {CANONICAL_CATEGORIES.map(cat => (
            <TrackingRow
              key={cat}
              label={cat}
              emoji={CATEGORY_EMOJI[cat] || '📦'}
              budget={activeCats[cat] ?? 0}
              spent={mtdByCategory[cat] ?? 0}
              editMode={editMode}
              onBudgetChange={v => setEditCats(prev => ({ ...prev, [cat]: v }))}
            />
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 150px 1fr auto', gap: '0 16px', padding: '14px 32px', background: 'var(--t-bg)', borderTop: '2px solid var(--t-border)', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t-text-primary)' }}>Total</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalActiveBudget)}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(mtdTotalSpent)}</div>
            <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: (totalActiveBudget - mtdTotalSpent) >= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)' }}>
              {(totalActiveBudget - mtdTotalSpent) >= 0 ? fmt(totalActiveBudget - mtdTotalSpent) + ' left' : fmt(Math.abs(totalActiveBudget - mtdTotalSpent)) + ' over'}
            </div>
            <div /><div />
          </div>
        </div>

        {saveError && (
          <div style={{ marginTop: 12, padding: '10px 16px', borderRadius: 8, background: 'color-mix(in srgb, var(--t-red) 10%, transparent)', border: '1px solid var(--t-red)', color: 'var(--t-red-text)', fontSize: 13 }}>
            ⚠ Save failed: {saveError}
          </div>
        )}
        {editMode && !saveError && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--t-text-tertiary)', textAlign: 'right' }}>
            Changes will take effect next month · current MTD numbers reflect actual spending
          </div>
        )}
      </div>
    );
  }

  /* ── MOBILE SETUP VIEW ── */
  if (isMobile) {
    return (
      <div style={{ color: MN.text, fontFamily: 'var(--font-body)', paddingBottom: 16 }}>

        {/* HERO */}
        <div style={{
          background: 'linear-gradient(135deg, #0a3fa8 0%, #0F2044 100%)',
          borderRadius: 20, padding: '24px 20px 20px', marginBottom: 16,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, transparent, ${MN.gold}, #67E6D5, ${MN.gold}, transparent)` }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(46,211,198,0.75)', marginBottom: 6 }}>
            Monthly Budget
          </div>
          <div style={{
            fontSize: 42, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 12,
            backgroundImage: `linear-gradient(135deg, #ffffff 0%, ${MN.gold} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {fmt(totalBudgeted)}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: savings >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
            border: `1px solid ${savings >= 0 ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}`,
            borderRadius: 100, padding: '5px 12px',
            fontSize: 12, fontWeight: 700, color: savings >= 0 ? MN.green : MN.red,
          }}>
            {monthlyIncome > 0
              ? `${savings >= 0 ? '+' : '-'}${fmt(Math.abs(savings))}/mo ${savings >= 0 ? 'expected savings' : 'over income'}`
              : 'Set expected income below'}
          </div>
        </div>

        {/* RECOMMENDATION */}
        {smartBudget.hasHistory && bannerState === 'pending' && (
          <div style={{ background: MN.card, borderRadius: 16, border: `1px solid rgba(46,211,198,0.3)`, padding: '16px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: MN.text, marginBottom: 5 }}>
              💡 Smart budget ready
            </div>
            <div style={{ fontSize: 12, color: MN.muted, lineHeight: 1.5, marginBottom: 12 }}>
              We analyzed {smartBudget.historyLabel} of your spending and built a recommended budget of <strong style={{ color: MN.gold }}>{fmt(smartBudget.totalSuggestedBudget)}/mo</strong>.
            </div>
            <button onClick={handleAcceptAll} disabled={saving} style={{
              width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #0a3fa8, #4DA3FF)', color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1, marginBottom: 8,
            }}>
              {saving ? 'Saving…' : 'Accept & Save'}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setBannerState('accepted')} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: `1px solid ${MN.border}`, background: 'transparent', color: MN.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Review & Adjust
              </button>
              <button onClick={() => { setCatBudgets({}); setSubBudgets({}); setBannerState('manual'); }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: `1px solid ${MN.border}`, background: 'transparent', color: MN.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Build Manually
              </button>
            </div>
          </div>
        )}

        {/* INCOME INPUTS */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 2px 8px' }}>Expected Income</div>
        <div style={{ background: MN.card, borderRadius: 14, border: `1px solid ${MN.border}`, overflow: 'hidden', marginBottom: 16 }}>
          {smartBudget.incomeGroups.map((grp, gi, arr) => (
            <div key={grp.group} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 14px', borderBottom: gi < arr.length - 1 ? `1px solid ${MN.border}` : 'none',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: MN.text }}>{grp.group === 'Payroll Income' ? '💼' : '📈'} {grp.group}</div>
                <div style={{ fontSize: 10, color: MN.faint, marginTop: 2 }}>
                  {grp.historicalAvg > 0 ? `Avg ${fmt(grp.historicalAvg)}/mo` : 'No history'}
                </div>
              </div>
              <MobileBudgetInput
                value={effectiveIncomeBudgets[grp.group] ?? 0}
                onChange={v => setIncomeBudgets(prev => ({ ...prev, [grp.group]: v }))}
              />
            </div>
          ))}
        </div>

        {/* CATEGORY INPUTS */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 2px 8px' }}>Category Budgets</div>
        <div style={{ background: MN.card, borderRadius: 14, border: `1px solid ${MN.border}`, overflow: 'hidden', marginBottom: 16 }}>
          {CANONICAL_CATEGORIES.map((cat, ci) => {
            const catData = smartBudget.categories.find(c => c.category === cat);
            return (
              <div key={cat} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px', borderBottom: ci < CANONICAL_CATEGORIES.length - 1 ? `1px solid ${MN.border}` : 'none',
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: MN.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {CATEGORY_EMOJI[cat] || '📦'} {cat}
                  </div>
                  <div style={{ fontSize: 10, color: MN.faint, marginTop: 2 }}>
                    {catData && catData.historicalAvg > 0 ? `Avg ${fmt(catData.historicalAvg)}/mo` : 'No history'}
                  </div>
                </div>
                <MobileBudgetInput
                  value={effectiveBudgets[cat] ?? 0}
                  onChange={v => handleCatChange(cat, v)}
                />
              </div>
            );
          })}
          {/* Total row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 14px', background: 'rgba(255,255,255,0.04)', borderTop: `1px solid ${MN.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: MN.text }}>Total</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: MN.gold, fontVariantNumeric: 'tabular-nums' }}>{fmt(totalBudgeted)}</span>
          </div>
        </div>

        {saveError && (
          <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(248,113,113,0.12)', border: `1px solid rgba(248,113,113,0.3)`, color: MN.red, fontSize: 12 }}>
            ⚠ Save failed: {saveError}
          </div>
        )}

        {bannerState !== 'pending' && (
          <button onClick={async () => { await handleSetupSave(); showToast('Budget saved ✓'); }} disabled={saving} style={{
            width: '100%', padding: '15px 0', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #0a3fa8, #4DA3FF)', color: '#fff',
            fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1, boxShadow: '0 4px 16px rgba(10,63,168,0.3)',
          }}>
            {saving ? 'Saving…' : '💾 Save Budget'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 0 72px' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--t-text-primary)', margin: 0 }}>Budget</h1>
          <p style={{ fontSize: 13, color: 'var(--t-text-tertiary)', margin: '4px 0 0' }}>
            {smartBudget.hasHistory
              ? `Powered by ${smartBudget.historyLabel} of history · averages span the full period`
              : 'Set spending limits for each category'}
          </p>
        </div>
        {bannerState !== 'pending' && (
          <button onClick={handleReset} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--t-border)', background: 'var(--t-surface)', color: 'var(--t-text-secondary)', fontSize: 13, cursor: 'pointer' }}>
            Recalculate
          </button>
        )}
      </div>

      {/* ── Summary strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          {
            label: 'Monthly Income',
            value: monthlyIncome > 0 ? fmt(monthlyIncome) : '—',
            note:  'Average monthly',
            accent: 'var(--t-green)',
          },
          {
            label: 'Monthly Budget',
            value: fmt(totalBudgeted),
            note:  `Across ${CANONICAL_CATEGORIES.length} categories`,
            accent: 'var(--t-primary)',
          },
          {
            label: 'Expected Savings',
            value: monthlyIncome > 0 ? fmt(Math.abs(savings)) : '—',
            note:  savings >= 0 ? 'Monthly surplus' : 'Budget exceeds income',
            accent: savings >= 0 ? 'var(--t-green)' : 'var(--t-red)',
          },
          {
            label: 'Unallocated',
            value: monthlyIncome > 0 ? fmt(Math.max(0, savings)) : '—',
            note:  savings >= 0 ? 'Available to reallocate' : 'Over budget by ' + fmt(Math.abs(savings)),
            accent: savings >= 0 ? 'var(--t-text-primary)' : 'var(--t-red)',
          },
        ].map(({ label, value, note, accent }) => (
          <div key={label} style={{ background: 'var(--t-surface)', borderRadius: 14, padding: '18px 20px', boxShadow: 'var(--t-shadow-sm)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: accent, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 4 }}>{note}</div>
          </div>
        ))}
      </div>

      {/* ── Recommendation banner ── */}
      {smartBudget.hasHistory && bannerState === 'pending' && (
        <div style={{ background: 'var(--t-primary-bg)', border: '1px solid var(--t-primary-border)', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text-primary)', marginBottom: 4 }}>
                💡 We analyzed your last {smartBudget.historyLabel} of spending and created a recommended monthly budget.
              </div>
              <div style={{ fontSize: 13, color: 'var(--t-text-secondary)' }}>
                Suggested total: <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(smartBudget.totalSuggestedBudget)}/month</strong>
                {monthlyIncome > 0 && (
                  <> · Projected savings: <strong style={{ color: smartBudget.projectedSavings >= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(Math.abs(smartBudget.projectedSavings))}{smartBudget.projectedSavings < 0 ? ' deficit' : ''}
                  </strong></>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>
              <button onClick={handleAcceptAll} disabled={saving} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--t-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Accept & Save'}
              </button>
              <button onClick={() => setBannerState('accepted')} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--t-border-med)', background: 'var(--t-surface)', color: 'var(--t-text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                Review & Adjust
              </button>
              <button onClick={() => { setCatBudgets({}); setSubBudgets({}); setBannerState('manual'); }} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--t-border-med)', background: 'var(--t-surface)', color: 'var(--t-text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                Build Manually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Smart review ── */}
      {(attentionItems.length > 0 || consistentItems.length > 0) && (
        <div style={{ background: 'var(--t-surface)', borderRadius: 14, padding: '18px 22px', marginBottom: 24, boxShadow: 'var(--t-shadow-sm)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text-primary)', marginBottom: 12 }}>Smart Review</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {attentionItems.map(c => (
              <div key={c.category} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 15 }}>⚠️</span>
                <span style={{ fontSize: 13, color: 'var(--t-text-secondary)', fontWeight: 500 }}>{c.attentionMessage}</span>
                <span style={{ fontSize: 12, color: 'var(--t-text-tertiary)' }}>— {c.confidenceReason}</span>
              </div>
            ))}
            {consistentItems.map(c => (
              <div key={c.category} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 15 }}>✅</span>
                <span style={{ fontSize: 13, color: 'var(--t-text-secondary)' }}>{c.category} looks consistent</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Income table ── */}
      <div style={{ background: 'var(--t-surface)', borderRadius: 14, boxShadow: 'var(--t-shadow-sm)', overflow: 'hidden', position: 'relative', marginBottom: 16 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-green)' }} />

        {/* Income header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 90px 170px 80px', gap: '0 16px', padding: '12px 32px', borderBottom: '2px solid var(--t-border)', background: 'var(--t-bg)', alignItems: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-green-text)', letterSpacing: '0.06em' }}>💵 INCOME</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em' }}>EXPECTED</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em', textAlign: 'right' }}>AVG INCOME</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em', textAlign: 'right' }}>VARIANCE</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em' }}>HISTORY / TREND</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em', textAlign: 'right' }}>CONFIDENCE</div>
        </div>

        {/* Income rows */}
        {smartBudget.incomeGroups.map(grp => {
          const expected   = effectiveIncomeBudgets[grp.group] ?? 0;
          const diff       = grp.historicalAvg - expected;   // positive = earning more than expected (good)
          const pct        = expected > 0 && grp.historicalAvg > 0 ? Math.min(110, (grp.historicalAvg / expected) * 100) : 0;
          const barColor   = pct < 85 ? 'var(--t-amber)' : 'var(--t-green)';
          const emoji      = grp.group === 'Payroll Income' ? '💼' : '📈';
          return (
            <div key={grp.group} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 90px 170px 80px', alignItems: 'center', gap: '0 16px', padding: '15px 24px', borderBottom: '1px solid var(--t-border)' }}>
              {/* Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--t-green-bg, color-mix(in srgb, var(--t-green) 12%, transparent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>
                  {emoji}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text-primary)' }}>{grp.group}</div>
                  {grp.trendDirection !== 'stable'
                    ? <div style={{ fontSize: 11, color: grp.trendDirection === 'up' ? 'var(--t-green-text)' : 'var(--t-amber-text)', marginTop: 1 }}>
                        {grp.trendDirection === 'up' ? '↑' : '↓'} Income {grp.trendDirection === 'up' ? 'increasing' : 'decreasing'} {grp.trendPct}%
                      </div>
                    : grp.spanMonths > 0
                    ? <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 1 }}>{grp.spanMonths} month{grp.spanMonths !== 1 ? 's' : ''} of history</div>
                    : <div style={{ fontSize: 11, color: 'var(--t-text-tertiary)', marginTop: 1 }}>No history</div>
                  }
                </div>
              </div>
              {/* Expected input */}
              <CurrencyInput value={expected} onChange={v => setIncomeBudgets(prev => ({ ...prev, [grp.group]: v }))} />
              {/* Avg income */}
              <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--t-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                {grp.historicalAvg > 0 ? fmt(grp.historicalAvg) : '—'}
              </div>
              {/* Variance: avg - expected (positive = earning above expectation = green) */}
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: grp.historicalAvg === 0 ? 'var(--t-text-tertiary)' : diff >= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)' }}>
                {grp.historicalAvg > 0 ? (diff >= 0 ? '+' : '') + fmt(diff) : '—'}
              </div>
              {/* Progress bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: 'var(--t-border)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: barColor, borderRadius: 100, transition: 'width 0.4s ease' }} />
                </div>
                {grp.trendDirection !== 'stable' && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: grp.trendDirection === 'up' ? 'var(--t-green-text)' : 'var(--t-amber-text)', whiteSpace: 'nowrap' }}>
                    {grp.trendDirection === 'up' ? '↑' : '↓'}{grp.trendPct}%
                  </span>
                )}
              </div>
              {/* Confidence */}
              <div style={{ textAlign: 'right' }}>
                <ConfidenceBadge confidence={grp.confidence} reason={grp.confidenceReason} />
              </div>
            </div>
          );
        })}

        {/* Income footer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 90px 170px 80px', gap: '0 16px', padding: '13px 24px', background: 'var(--t-bg)', alignItems: 'center', borderTop: '2px solid var(--t-border)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-text-secondary)' }}>Total Income</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--t-green-text)', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(Object.values(effectiveIncomeBudgets).reduce((a, b) => a + b, 0))}
          </div>
          <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--t-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(smartBudget.incomeGroups.reduce((s, g) => s + g.historicalAvg, 0))}
          </div>
          <div />
          <div />
          <div />
        </div>
      </div>

      {/* ── Category grid ── */}
      <div style={{ background: 'var(--t-surface)', borderRadius: 14, boxShadow: 'var(--t-shadow-sm)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />

        {/* Grid header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 90px 170px 80px 28px', gap: '0 16px', padding: '12px 32px', borderBottom: '2px solid var(--t-border)', background: 'var(--t-bg)', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em' }}>CATEGORY</span>
            <div style={{ display: 'flex', background: 'var(--t-surface)', borderRadius: 6, padding: 2, border: '1px solid var(--t-border)' }}>
              {(['lock-parent', 'lock-children'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{ padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: mode === m ? 'var(--t-primary)' : 'transparent', color: mode === m ? '#fff' : 'var(--t-text-tertiary)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                  {m === 'lock-parent' ? 'Lock Category' : 'Lock Subcategory'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em' }}>MY BUDGET</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em', textAlign: 'right' }}>AVG SPEND</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em', textAlign: 'right' }}>VARIANCE</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em' }}>HISTORY / TREND</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-tertiary)', letterSpacing: '0.06em', textAlign: 'right' }}>CONFIDENCE</div>
          <div />
        </div>

        {/* Category rows */}
        {CANONICAL_CATEGORIES.map(cat => {
          const catData = smartBudget.categories.find(c => c.category === cat);
          if (!catData) return null;
          return (
            <CategoryRow
              key={cat}
              catData={catData}
              budget={effectiveBudgets[cat] ?? 0}
              subBudgets={getEffectiveSubs(cat)}
              expanded={expanded.has(cat)}
              onToggle={() => setExpanded(prev => {
                const next = new Set(prev);
                next.has(cat) ? next.delete(cat) : next.add(cat);
                return next;
              })}
              onBudgetChange={v => handleCatChange(cat, v)}
              onSubBudgetChange={(sub, v) => handleSubChange(cat, sub, v)}
            />
          );
        })}

        {/* Totals footer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 90px 170px 80px 28px', gap: '0 16px', padding: '16px 24px', background: 'var(--t-bg)', borderTop: '2px solid var(--t-border)', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t-text-primary)' }}>Total</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalBudgeted)}</div>
          <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--t-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
            {totalHistoricalAvg > 0 ? fmt(totalHistoricalAvg) : '—'}
          </div>
          <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: (totalBudgeted - totalHistoricalAvg) >= 0 ? 'var(--t-green-text)' : 'var(--t-red-text)' }}>
            {totalHistoricalAvg > 0
              ? ((totalBudgeted - totalHistoricalAvg) >= 0 ? '+' : '') + fmt(totalBudgeted - totalHistoricalAvg)
              : '—'}
          </div>
          <div />
          <div />
          <div />
        </div>
      </div>

      {saveError && (
        <div style={{ marginTop: 12, padding: '10px 16px', borderRadius: 8, background: 'color-mix(in srgb, var(--t-red) 10%, transparent)', border: '1px solid var(--t-red)', color: 'var(--t-red-text)', fontSize: 13 }}>
          ⚠ Save failed: {saveError}
        </div>
      )}

      {/* Mode explanation + Save */}
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)' }}>
          {mode === 'lock-parent'
            ? 'Lock Category: editing a subcategory redistributes the others to keep the category total fixed'
            : 'Lock Subcat: editing a subcategory updates the category total'}
        </div>
        {bannerState !== 'pending' && (
          <button
            onClick={handleSetupSave}
            disabled={saving}
            style={{ padding: '10px 28px', borderRadius: 10, border: 'none', background: 'var(--t-primary)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving…' : '💾 Save Budget'}
          </button>
        )}
      </div>
    </div>
  );
}
