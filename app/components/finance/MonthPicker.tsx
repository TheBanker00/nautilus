'use client';

import React, { useState, useRef, useEffect } from 'react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const C = {
  gold:      '#2ED3C6',
  goldBg:    'rgba(46,211,198,0.12)',
  goldBorder:'rgba(46,211,198,0.45)',
  bg:        '#0B1829',
  surface:   '#0F2236',
  border:    'rgba(77,163,255,0.2)',
  text:      '#E8F2FF',
  muted:     '#4A6080',
  hoverBg:   'rgba(77,163,255,0.08)',
};

type Props = {
  value: string;          // 'YYYY-MM'
  min?: string;           // 'YYYY-MM'
  max?: string;           // 'YYYY-MM'
  onChange: (v: string) => void;
};

export default function MonthPicker({ value, min, max, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const [y] = (value || '').split('-');
    return parseInt(y || String(new Date().getFullYear()), 10);
  });
  const ref = useRef<HTMLDivElement>(null);

  const [selYear, selMonthIdx] = (() => {
    const parts = (value || '').split('-');
    return [parseInt(parts[0] || '0', 10), parseInt(parts[1] || '1', 10) - 1];
  })();

  const minYear  = min  ? parseInt(min.split('-')[0],  10) : 2000;
  const maxYear  = max  ? parseInt(max.split('-')[0],  10) : new Date().getFullYear() + 5;
  const minMonth = min  ? parseInt(min.split('-')[1],  10) - 1 : 0;
  const maxMonth = max  ? parseInt(max.split('-')[1],  10) - 1 : 11;

  function isDisabled(mIdx: number) {
    if (viewYear < minYear) return true;
    if (viewYear > maxYear) return true;
    if (viewYear === minYear && mIdx < minMonth) return true;
    if (viewYear === maxYear && mIdx > maxMonth) return true;
    return false;
  }

  function select(mIdx: number) {
    if (isDisabled(mIdx)) return;
    const mm = String(mIdx + 1).padStart(2, '0');
    onChange(`${viewYear}-${mm}`);
    setOpen(false);
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Sync view year when value changes externally
  useEffect(() => {
    if (selYear && !open) setViewYear(selYear);
  }, [value]);

  const displayLabel = value
    ? `${MONTHS[selMonthIdx]} ${selYear}`
    : 'Select period';

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>

      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 12px',
          borderRadius: 9,
          border: '1px solid rgba(0,0,0,0.12)',
          background: open ? '#0a3fa8' : 'transparent',
          color: open ? '#ffffff' : '#6B7280',
          fontWeight: open ? 700 : 500, fontSize: 13,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap',
          minWidth: 126,
          justifyContent: 'space-between',
        }}
      >
        {/* Calendar icon */}
        <svg width={14} height={14} viewBox="0 0 20 20" fill="none"
          stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
          style={{ opacity: 0.75, flexShrink: 0 }}>
          <rect x="2" y="4" width="16" height="14" rx="2" />
          <path d="M2 9h16M7 2v4M13 2v4" />
        </svg>

        <span style={{ flex: 1, textAlign: 'left', marginLeft: 4 }}>{displayLabel}</span>

        {/* Chevron */}
        <svg width={12} height={12} viewBox="0 0 20 20" fill="none"
          stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
          style={{ opacity: 0.5, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          zIndex: 9999,
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.12)',
          borderRadius: 12,
          padding: 16,
          width: 240,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}>

          {/* Year row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 14,
          }}>
            <button
              onClick={() => viewYear > minYear && setViewYear(v => v - 1)}
              disabled={viewYear <= minYear}
              style={{
                background: 'none', border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 7, color: viewYear <= minYear ? '#D1D5DB' : '#374151',
                width: 30, height: 30, cursor: viewYear <= minYear ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              <svg width={12} height={12} viewBox="0 0 20 20" fill="none"
                stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 4l-6 6 6 6" />
              </svg>
            </button>

            <span style={{
              fontWeight: 700, fontSize: 15, color: '#111827', letterSpacing: '0.02em',
            }}>
              {viewYear}
            </span>

            <button
              onClick={() => viewYear < maxYear && setViewYear(v => v + 1)}
              disabled={viewYear >= maxYear}
              style={{
                background: 'none', border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 7, color: viewYear >= maxYear ? '#D1D5DB' : '#374151',
                width: 30, height: 30, cursor: viewYear >= maxYear ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              <svg width={12} height={12} viewBox="0 0 20 20" fill="none"
                stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 4l6 6-6 6" />
              </svg>
            </button>
          </div>

          {/* Month grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
            {MONTHS.map((m, i) => {
              const disabled = isDisabled(i);
              const selected = viewYear === selYear && i === selMonthIdx;
              return (
                <button
                  key={m}
                  onClick={() => select(i)}
                  disabled={disabled}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: selected ? '1px solid #0a3fa8' : '1px solid transparent',
                    background: selected ? '#0a3fa8' : 'transparent',
                    color: disabled ? '#D1D5DB' : selected ? '#ffffff' : '#374151',
                    fontWeight: selected ? 700 : 400,
                    fontSize: 13,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.12s ease',
                    opacity: disabled ? 0.4 : 1,
                  }}
                  onMouseEnter={e => {
                    if (!disabled && !selected)
                      (e.currentTarget as HTMLElement).style.background = 'rgba(10,63,168,0.07)';
                  }}
                  onMouseLeave={e => {
                    if (!selected)
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Footer hint */}
          <div style={{
            marginTop: 12, paddingTop: 10,
            borderTop: '1px solid rgba(0,0,0,0.08)',
            fontSize: 11, color: '#9CA3AF', textAlign: 'center',
          }}>
            Showing data for selected month
          </div>
        </div>
      )}
    </div>
  );
}
