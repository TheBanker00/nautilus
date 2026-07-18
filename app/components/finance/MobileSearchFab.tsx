'use client';

import React, { useEffect, useRef, useState } from 'react';

/*
  Auto-hiding search box for mobile transaction pages.

  Search is a rare-use feature here, so it shouldn't hold permanent screen space.
  Instead a slim box slides up from the bottom edge whenever the user scrolls,
  then quietly slides away again once they stop (idle). It stays put while the
  field is focused or a query is active, so a search-in-progress never vanishes
  under the user.

  Bound to external `value` / `onChange` so results filter live.
*/

const MN = {
  card:   '#172554',
  border: 'rgba(255,255,255,0.12)',
  text:   '#ffffff',
  muted:  'rgba(255,255,255,0.55)',
  gold:   '#2ED3C6',
};

const IDLE_MS = 1800;

export default function MobileSearchFab({
  value,
  onChange,
  placeholder = 'Search transactions…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasQuery = value.trim().length > 0;

  /* keep latest "sticky" state readable inside the scroll/idle closures */
  const stickyRef = useRef(false);
  stickyRef.current = focused || hasQuery;

  /* while a search is active or focused, force it to stay up */
  useEffect(() => {
    if (stickyRef.current) setVisible(true);
  }, [focused, hasQuery]);

  /* show on scroll, hide after the user goes idle */
  useEffect(() => {
    const scroller: HTMLElement | Window =
      (document.querySelector('.dashboard-main') as HTMLElement | null) || window;

    let idle = 0;
    const armIdle = () => {
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        if (!stickyRef.current) setVisible(false);
      }, IDLE_MS);
    };

    const onScroll = () => {
      setVisible(true);
      armIdle();
    };

    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', onScroll as EventListener);
      window.clearTimeout(idle);
    };
  }, []);

  const shown = visible || focused || hasQuery;

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 'calc(80px + env(safe-area-inset-bottom))',
        zIndex: 150,
        transform: shown ? 'translateY(0)' : 'translateY(160%)',
        opacity: shown ? 1 : 0,
        transition: 'transform 0.28s cubic-bezier(0.22,1,0.36,1), opacity 0.22s ease',
        pointerEvents: shown ? 'auto' : 'none',
      }}
    >
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: MN.card,
          border: `1px solid ${hasQuery || focused ? `${MN.gold}66` : MN.border}`,
          borderRadius: 14, padding: '11px 12px 11px 14px',
          boxShadow: '0 12px 34px rgba(0,0,0,0.5)',
        }}
      >
        <span style={{ fontSize: 15, color: MN.muted, flexShrink: 0 }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, minWidth: 0, background: 'transparent', border: 'none',
            outline: 'none', color: MN.text, fontSize: 15, padding: 0,
          }}
        />
        {hasQuery && (
          <button
            onClick={e => { e.stopPropagation(); onChange(''); inputRef.current?.focus(); }}
            aria-label="Clear search"
            style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
              border: 'none', background: 'rgba(255,255,255,0.1)', color: MN.text,
              fontSize: 14, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
