'use client';

import React, { useEffect, useMemo, useRef } from 'react';

/*
  Horizontally scrollable month selector for mobile pages.
  Renders the last `monthsBack` months as pills; the selected month is
  highlighted and auto-scrolled into view. Swipe the strip to reach
  earlier months, tap a pill to select it.
*/

const N = {
  card:   '#172554',
  border: 'rgba(255,255,255,0.08)',
  muted:  'rgba(255,255,255,0.55)',
  gold:   '#2ED3C6',
};

export default function MobileMonthStrip({
  currentDate,
  onChange,
  monthsBack = 24,
  variant = 'standalone',
}: {
  currentDate: Date;
  onChange: (d: Date) => void;
  monthsBack?: number;
  /** 'standalone' — full-size pills, own card row (legacy).
   *  'hero' — compact pills styled to sit along the bottom edge of a hero card. */
  variant?: 'standalone' | 'hero';
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const months = useMemo(() => {
    const now = new Date();
    const list: Date[] = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      list.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
    }
    return list;
  }, [monthsBack]);

  const isSelected = (d: Date) =>
    d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth();

  useEffect(() => {
    // keep the selected pill visible (centered) whenever it changes
    selectedRef.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [currentDate]);

  const thisYear = new Date().getFullYear();
  const hero = variant === 'hero';

  return (
    <div
      ref={scrollRef}
      style={{
        display: 'flex', gap: hero ? 6 : 8, overflowX: 'auto',
        marginBottom: hero ? 0 : 12, marginTop: hero ? 14 : 0,
        paddingBottom: hero ? 0 : 4, WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}
    >
      {months.map(d => {
        const sel = isSelected(d);
        const label = d.getFullYear() === thisYear
          ? d.toLocaleString('en-US', { month: 'short' })
          : d.toLocaleString('en-US', { month: 'short', year: '2-digit' }).replace(' ', ' ’');
        return (
          <button
            key={`${d.getFullYear()}-${d.getMonth()}`}
            ref={sel ? selectedRef : undefined}
            onClick={() => onChange(d)}
            style={hero ? {
              padding: '5px 11px', borderRadius: 100, whiteSpace: 'nowrap', flexShrink: 0,
              border: `1px solid ${sel ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.12)'}`,
              background: sel ? 'rgba(255,255,255,0.16)' : 'transparent',
              color: sel ? '#ffffff' : 'rgba(255,255,255,0.45)',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              minHeight: 26,
            } : {
              padding: '8px 15px', borderRadius: 100, whiteSpace: 'nowrap', flexShrink: 0,
              border: `1px solid ${sel ? N.gold : N.border}`,
              background: sel ? 'rgba(46,211,198,0.15)' : N.card,
              color: sel ? N.gold : N.muted,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              minHeight: 36,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
