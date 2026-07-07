'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

/* ── Token palettes ── */
export const LIGHT_TOKENS = {
  isDark:      false,
  // Page background
  pageBg:      '#EDF0F7',
  // Card surfaces
  cardBg:      '#FFFFFF',
  cardBg2:     '#F8FAFC',
  cardBg3:     '#F1F5F9',
  // Text
  text:        '#111827',
  textSub:     '#374151',
  muted:       '#6B7280',
  // Borders
  border:      'rgba(0,0,0,0.09)',
  borderMed:   'rgba(0,0,0,0.14)',
  // Brand
  gold:        '#B8860B',
  goldBg:      'rgba(184,134,11,0.08)',
  goldBorder:  'rgba(184,134,11,0.25)',
  accent:      '#2563EB',
  accentBg:    'rgba(37,99,235,0.07)',
  // Chart axes / grid
  gridLine:    'rgba(0,0,0,0.06)',
  axisText:    '#9CA3AF',
  tooltipBg:   '#FFFFFF',
  tooltipBorder: 'rgba(0,0,0,0.1)',
  // Inputs
  inputBg:     '#FFFFFF',
  inputBorder: 'rgba(0,0,0,0.12)',
  // Control strip
  stripBg:     '#FFFFFF',
  stripBorder: 'rgba(0,0,0,0.09)',
};

export const DARK_TOKENS = {
  isDark:      true,
  pageBg:      '#07111F',
  cardBg:      'linear-gradient(180deg, #0D1C30 0%, #0B1A2D 90%, rgba(46,211,198,0.04) 100%)',
  cardBg2:     '#0D1C30',
  cardBg3:     '#122040',
  text:        '#F0F4FF',
  textSub:     '#C8D8EC',
  muted:       '#7A90B8',
  border:      'rgba(46,211,198,0.22)',
  borderMed:   'rgba(46,211,198,0.35)',
  gold:        '#2ED3C6',
  goldBg:      'rgba(46,211,198,0.12)',
  goldBorder:  'rgba(46,211,198,0.45)',
  accent:      '#4DA3FF',
  accentBg:    'rgba(77,163,255,0.1)',
  gridLine:    'rgba(46,211,198,0.07)',
  axisText:    '#4A6080',
  tooltipBg:   '#0D1C30',
  tooltipBorder: 'rgba(46,211,198,0.25)',
  inputBg:     '#122040',
  inputBorder: 'rgba(46,211,198,0.28)',
  stripBg:     '#0D1C30',
  stripBorder: 'rgba(46,211,198,0.28)',
};

export type ThemeTokens = typeof LIGHT_TOKENS;

interface ThemeCtx {
  T:           ThemeTokens;
  isDark:      boolean;
  toggleTheme: () => void;
}

const DashboardThemeContext = createContext<ThemeCtx>({
  T:           LIGHT_TOKENS,
  isDark:      false,
  toggleTheme: () => {},
});

export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  // Rehydrate from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('wl-dark-mode');
    if (stored === 'true') setIsDark(true);
  }, []);

  // Write data-theme attribute so CSS variables in tokens.css flip
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  function toggleTheme() {
    setIsDark(prev => {
      const next = !prev;
      sessionStorage.setItem('wl-dark-mode', String(next));
      return next;
    });
  }

  const T = isDark ? DARK_TOKENS : LIGHT_TOKENS;

  return (
    <DashboardThemeContext.Provider value={{ T, isDark, toggleTheme }}>
      {children}
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  return useContext(DashboardThemeContext);
}
