'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFinancialData } from '../../lib/financialdatacontext';
import FilterBar from '../../components/finance/FilterBar';
import MonthPicker from '../../components/finance/MonthPicker';
import { useDashboardTheme } from '../../lib/dashboardthemecontext';

const C = {
  gold:   '#2ED3C6',
  text:   '#F0F4FF',
  muted:  '#7A90B8',
  border: 'rgba(77,163,255,0.28)',
  bg2:    '#0D1C30',
  bg3:    '#122040',
};

export default function NetWorthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { T } = useDashboardTheme();

  const {
    selectedMonthKey,
    setSelectedMonthKey,
    periodType,
    setPeriodType,
    availableMonths,
  } = useFinancialData();

  const tabs = [
    { label: 'Summary',     href: '/dashboard/net-worth' },
    { label: 'Assets',      href: '/dashboard/net-worth/assets' },
    { label: 'Liabilities', href: '/dashboard/net-worth/liabilities' },
  ];

  return (
    <div style={{ color: T.text, fontFamily: 'var(--font-body)' }}>

      {/* ── UNIFIED CONTROL STRIP ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: T.stripBg,
        border: `1px solid ${T.stripBorder}`,
        boxShadow: T.isDark ? '0 0 0 1px rgba(77,163,255,0.08), 0 4px 24px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
        borderRadius: 16,
        padding: '5px 5px 5px 6px',
        marginBottom: 24,
        gap: 8,
        flexWrap: 'wrap',
        position: 'relative',
      }}>
        {/* thin transparent-centre accent line — own radius instead of parent overflow:hidden,
            so dropdowns (MonthPicker) aren't clipped by the parent's bounds */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          borderRadius: '16px 16px 0 0',
          background: T.isDark
            ? 'linear-gradient(90deg, transparent, #2ED3C6, #0891B2, #2ED3C6, transparent)'
            : 'linear-gradient(90deg, transparent, #0a3fa8, #4da3ff, #0a3fa8, transparent)',
        }} />

        {/* LEFT — page tabs */}
        <div style={{
          display: 'flex',
          gap: 0,
          border: '1px solid rgba(0,0,0,0.12)',
          borderRadius: 9,
          overflow: 'hidden',
          background: 'transparent',
        }}>
          {tabs.map((tab, i) => {
            const active = pathname === tab.href ||
              (tab.href !== '/dashboard/net-worth' && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  padding: '7px 20px',
                  textDecoration: 'none',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  transition: 'all 0.15s ease',
                  background: active ? 'var(--t-primary)' : 'transparent',
                  color: active ? '#ffffff' : '#6B7280',
                  borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.12)' : 'none',
                  whiteSpace: 'nowrap' as const,
                  display: 'block',
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* RIGHT — period controls */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingRight: 2 }}>
          <FilterBar
            options={['month', 'quarter', 'year'] as const}
            active={periodType}
            onChange={(value) => setPeriodType(value as any)}
          />

          {/* divider */}
          <div style={{ width: 1, height: 24, background: T.border, margin: '0 2px' }} />

          <MonthPicker
            value={selectedMonthKey}
            min={availableMonths[0]}
            max={availableMonths[availableMonths.length - 1]}
            onChange={setSelectedMonthKey}
          />
        </div>
      </div>

      {/* ── PAGE CONTENT ── */}
      {children}
    </div>
  );
}
