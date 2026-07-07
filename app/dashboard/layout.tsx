'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase-browser';
import { FinancialDataProvider } from '../lib/financialdatacontext';
import { TransactionProvider } from '../lib/transactioncontext';
import { FinancialPeriodProvider } from '../lib/financialperiodcontext';
import { DashboardThemeProvider, useDashboardTheme } from '../lib/dashboardthemecontext';
import ConnectBankButton from '../components/ConnectBankButton';


/* ─────────────────────────────────────────────────────────────
   ADD ACCOUNT MODAL — Plaid Link
───────────────────────────────────────────────────────────── */
function AddAccountModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0F2044', borderRadius: 16, padding: '32px 28px',
          width: 380, border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Connect an Account</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Securely link your bank or brokerage via Plaid</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
        </div>
        <ConnectBankButton
          label="Connect with Plaid"
          onSuccess={onClose}
          style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #0a3fa8, #4da3ff)', borderRadius: 10, padding: '14px', fontSize: 14 }}
        />
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, marginTop: 10,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'transparent', color: 'rgba(255,255,255,0.5)',
            fontSize: 13, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS — tool sidebar
   All values reference the CSS custom properties in tokens.css.
   Hard-coded here for inline styles; any change should update
   tokens.css first, then mirror here.
───────────────────────────────────────────────────────────── */
const N = {
  bg:            '#0F2044',
  border:        'rgba(255,255,255,0.07)',
  text:          'rgba(255,255,255,0.60)',
  textHover:     'rgba(255,255,255,0.88)',
  textActive:    '#FFFFFF',
  section:       'rgba(255,255,255,0.28)',
  hoverBg:       'rgba(255,255,255,0.05)',
  activeBg:      'rgba(77,163,255,0.14)',
  activeBorder:  '#4DA3FF',
  muted:         'rgba(255,255,255,0.40)',
  subDot:        'rgba(77,163,255,0.6)',
  subDotActive:  '#4DA3FF',
};

/* ─────────────────────────────────────────────────────────────
   SVG ICON PRIMITIVES
───────────────────────────────────────────────────────────── */
type SvgProps = { size?: number };

function Svg({ size = 18, children }: SvgProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
function P({ d }: { d: string }) { return <path d={d} />; }

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width={12} height={12} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
      <path d="M5 8l5 5 5-5" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   ICON LIBRARY — clean line icons, no emoji
───────────────────────────────────────────────────────────── */
const I = {
  Dashboard: () => (
    <Svg>
      <P d="M2 2h7v7H2z" /><P d="M11 2h7v7h-7z" />
      <P d="M2 11h7v7H2z" /><P d="M11 11h7v7h-7z" />
    </Svg>
  ),
  NetWorth: () => (
    <Svg>
      <P d="M2 15L7 9l4 3 5-8" /><P d="M14 4h4v4" />
    </Svg>
  ),
  Assets: () => (
    <Svg>
      <P d="M2 18h16M4 18v-6M8 18v-9M12 18v-6M16 18v-9" />
      <P d="M10 2L1 9h18z" />
    </Svg>
  ),
  Liabilities: () => (
    <Svg>
      <P d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      <P d="M2 10h16M6 14h3" />
    </Svg>
  ),
  CashFlow: () => (
    <Svg>
      <P d="M2 10h16" />
      <P d="M14 6l4 4-4 4" />
      <P d="M6 14l-4-4 4-4" />
    </Svg>
  ),
  Income: () => (
    <Svg>
      <P d="M10 16V4" /><P d="M5 9l5-5 5 5" />
      <P d="M5 16h10" />
    </Svg>
  ),
  Expenses: () => (
    <Svg>
      <P d="M10 4v12" /><P d="M15 11l-5 5-5-5" />
      <P d="M5 4h10" />
    </Svg>
  ),
  Recurring: () => (
    <Svg>
      <P d="M17 8A7 7 0 004 8" />
      <P d="M17 5v3h-3" />
      <P d="M3 12a7 7 0 0013 2" />
      <P d="M3 15v-3h3" />
    </Svg>
  ),
  Transactions: () => (
    <Svg>
      <P d="M3 5h14M3 10h14M3 15h8" />
      <P d="M14 13l3 2-3 2" />
    </Svg>
  ),
  Budget: () => (
    <Svg>
      <P d="M7 2h6a1 1 0 010 2H7a1 1 0 010-2z" />
      <P d="M5 3a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2" />
      <P d="M7 11h6M7 14h4" />
    </Svg>
  ),
  DebtPlanner: () => (
    <Svg>
      <P d="M2 8a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8z" />
      <P d="M6 8V6a4 4 0 018 0v2" />
      <P d="M10 12v2M8 13h4" />
    </Svg>
  ),
  Retirement: () => (
    <Svg>
      <P d="M10 3a7 7 0 100 14A7 7 0 0010 3z" />
      <P d="M10 7v4l2.5 2.5" />
    </Svg>
  ),
  Forecast: () => (
    <Svg>
      <P d="M2 15L7 10l4 3 6-6" />
      <P d="M14 7h3v3" />
      <P d="M2 18h16" />
    </Svg>
  ),
  Goals: () => (
    <Svg>
      <P d="M5 2v16M5 2h10l-2.5 4 2.5 4H5" />
    </Svg>
  ),
  HealthScore: () => (
    <Svg>
      <path d="M4 15a7 7 0 1112 0" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" />
      <path d="M10 15L13.5 9" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" />
      <circle cx="10" cy="15" r="1.5" fill="currentColor" stroke="none" />
    </Svg>
  ),
  AI: () => (
    <Svg>
      <P d="M10 2v2M10 16v2M2 10h2M16 10h2" />
      <P d="M4.9 4.9l1.4 1.4M13.7 13.7l1.4 1.4M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4" />
      <P d="M10 7a3 3 0 100 6 3 3 0 000-6z" />
    </Svg>
  ),
  Analytics: () => (
    <Svg>
      <P d="M2 17v-5h4v5H2z" />
      <P d="M8 17V8h4v9H8z" />
      <P d="M14 17V5h4v12h-4z" />
    </Svg>
  ),
  Settings: () => (
    /* 8-tooth gear: polygon traces tooth tips (r=8.5) and roots (r=6.2), hub circle r=2.8 */
    <svg width={18} height={18} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="
        8.55,3.97 9.03,3.88 8.67,1.61 11.33,1.61 10.97,3.88 11.45,3.97
        13.24,4.71 13.64,4.98 15.00,3.12 16.88,5.00 15.02,6.36 15.29,6.76
        16.03,8.55 16.12,9.03 18.40,8.67 18.40,11.33 16.12,10.97 16.03,11.45
        15.29,13.24 15.02,13.64 16.88,15.00 15.00,16.88 13.64,15.02 13.24,15.29
        11.45,16.03 10.97,16.12 11.33,18.40 8.67,18.40 9.03,16.12 8.55,16.03
        6.76,15.29 6.36,15.02 5.00,16.88 3.12,15.00 4.98,13.64 4.71,13.24
        3.97,11.45 3.88,10.97 1.61,11.33 1.61,8.67 3.88,9.03 3.97,8.55
        4.71,6.76 4.98,6.36 3.12,5.00 5.00,3.12 6.36,4.98 6.76,4.71
      " />
      <circle cx="10" cy="10" r="2.8" />
    </svg>
  ),
  Profile: () => (
    <Svg>
      <P d="M10 9a3 3 0 100-6 3 3 0 000 6z" />
      <P d="M3.5 18a6.5 6.5 0 0113 0" />
    </Svg>
  ),
  Collapse: () => (
    <Svg size={14}>
      <P d="M4 5h12M4 10h12M4 15h12" />
    </Svg>
  ),
  Bank: () => (
    <Svg>
      <P d="M2 18h16M2 9h16M4 9V7M8 9V7M12 9V7M16 9V7M4 18v-9M8 18v-9M12 18v-9M16 18v-9M10 2L2 7h16z" />
    </Svg>
  ),
};

/* ─────────────────────────────────────────────────────────────
   NAV COMPONENTS
───────────────────────────────────────────────────────────── */

type NavItemProps = {
  href:         string;
  label:        string;
  icon:         React.ReactNode;
  isCollapsed:  boolean;
  active:       boolean;
  hasChildren?: boolean;
  expanded?:    boolean;
  onToggle?:    () => void;
};

function NavItem({
  href, label, icon, isCollapsed, active, hasChildren, expanded, onToggle,
}: NavItemProps) {
  const style: React.CSSProperties = {
    display:        'flex',
    alignItems:     'center',
    gap:            9,
    padding:        isCollapsed ? '11px 0' : '9px 12px',
    justifyContent: isCollapsed ? 'center' : 'space-between',
    borderRadius:   8,
    textDecoration: 'none',
    cursor:         'pointer',
    transition:     'all 0.15s ease',
    color:          active ? N.textActive : N.text,
    background:     active ? N.activeBg : 'transparent',
    // Electric blue left border for active — no gold
    borderLeft:     active ? `3px solid ${N.activeBorder}` : '3px solid transparent',
    fontWeight:     active ? 600 : 400,
    fontSize:       13,
    margin:         '1px 0',
    userSelect:     'none',
  };

  const inner = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1 }}>
        <span style={{ flexShrink: 0, opacity: active ? 1 : 0.65 }}>{icon}</span>
        {!isCollapsed && (
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label}
          </span>
        )}
      </div>
      {!isCollapsed && hasChildren && <Chevron open={!!expanded} />}
    </>
  );

  if (hasChildren) {
    return <div style={style} onClick={onToggle}>{inner}</div>;
  }

  return <Link href={href} style={style}>{inner}</Link>;
}

function SubItem({
  href, label, active, isCollapsed,
}: { href: string; label: string; active: boolean; isCollapsed: boolean }) {
  if (isCollapsed) return null;
  return (
    <Link href={href} style={{
      display:        'flex',
      alignItems:     'center',
      gap:            8,
      padding:        '7px 12px 7px 34px',
      borderRadius:   7,
      textDecoration: 'none',
      fontSize:       12.5,
      color:          active ? N.textActive : N.muted,
      fontWeight:     active ? 600 : 400,
      background:     active ? N.activeBg : 'transparent',
      borderLeft:     active ? `3px solid ${N.activeBorder}` : '3px solid transparent',
      transition:     'all 0.15s ease',
      margin:         '1px 0',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
        background: active ? N.subDotActive : N.subDot,
        opacity:    active ? 1 : 0.6,
      }} />
      {label}
    </Link>
  );
}

function SectionLabel({ label, isCollapsed }: { label: string; isCollapsed: boolean }) {
  if (isCollapsed) return <div style={{ height: 18 }} />;
  return (
    <div style={{
      fontSize:      10,
      fontWeight:    700,
      letterSpacing: '0.09em',
      color:         N.section,
      textTransform: 'uppercase',
      padding:       '14px 12px 5px',
      userSelect:    'none',
    }}>
      {label}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DARK MODE TOGGLE BUTTON
───────────────────────────────────────────────────────────── */
function SignOutButton({ isCollapsed }: { isCollapsed: boolean }) {
  const router = useRouter();
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/landingpage/signin');
    router.refresh();
  };
  return (
    <button
      onClick={handleSignOut}
      title="Sign out"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: isCollapsed ? '8px' : '8px 10px',
        borderRadius: 8, border: 'none', background: 'transparent',
        cursor: 'pointer', color: N.muted, fontSize: 13, fontWeight: 500,
        marginTop: 4, justifyContent: isCollapsed ? 'center' : 'flex-start',
        transition: 'color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = N.hoverBg; (e.currentTarget as HTMLButtonElement).style.color = N.textHover; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = N.muted; }}
    >
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      {!isCollapsed && <span>Sign Out</span>}
    </button>
  );
}

function ThemeToggle({ isCollapsed }: { isCollapsed: boolean }) {
  const { isDark, toggleTheme } = useDashboardTheme();
  const icon = isDark ? (
    <svg width={18} height={18} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="4" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.9 4.9l1.4 1.4M13.7 13.7l1.4 1.4M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4" />
    </svg>
  ) : (
    <svg width={18} height={18} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 12A7.5 7.5 0 018 2.5a7.5 7.5 0 100 15 7.5 7.5 0 009.5-5.5z" />
    </svg>
  );
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            9,
        width:          '100%',
        padding:        isCollapsed ? '11px 0' : '9px 12px',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        borderRadius:   8,
        border:         'none',
        background:     'transparent',
        color:          N.text,
        fontSize:       13,
        fontWeight:     400,
        cursor:         'pointer',
        transition:     'all 0.15s ease',
        margin:         '1px 0',
      }}
    >
      <span style={{ flexShrink: 0, opacity: 0.65 }}>{icon}</span>
      {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{isDark ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   INNER LAYOUT (uses theme context)
───────────────────────────────────────────────────────────── */
function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { T, isDark } = useDashboardTheme();
  const [isCollapsed,     setIsCollapsed]     = useState(false);
  const [netWorthOpen,    setNetWorthOpen]    = useState(true);
  const [cashFlowOpen,    setCashFlowOpen]    = useState(false);
  const [addAccountOpen,  setAddAccountOpen]  = useState(false);

  const is         = (href: string) => pathname === href;
  const startsWith = (href: string) => pathname.startsWith(href);

  const sidebarWidth = isCollapsed ? 68 : 252;

  return (
          <div style={{ display: 'flex', background: T.pageBg, minHeight: '100vh', transition: 'background 0.2s ease' }}>
            {addAccountOpen && <AddAccountModal onClose={() => setAddAccountOpen(false)} />}

            {/* ─────── SIDEBAR ─────── */}
            <div style={{
              width:           sidebarWidth,
              background:      N.bg,
              position:        'fixed',
              height:          '100vh',
              left: 0, top: 0,
              zIndex:          'var(--t-z-sidebar)' as any,
              display:         'flex',
              flexDirection:   'column',
              transition:      'width 0.22s ease',
              overflow:        'hidden',
              borderRight:     `1px solid ${N.border}`,
              boxShadow:       '2px 0 20px rgba(0,0,0,0.25)',
            }}>

              {/* Logo + settings + collapse toggle */}
              <div style={{
                padding:         isCollapsed ? '16px 0' : '16px 10px 16px 0',
                borderBottom:    `1px solid ${N.border}`,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  isCollapsed ? 'center' : 'space-between',
                flexShrink:      0,
                minHeight:       64,
                gap:             8,
              }}>
                {!isCollapsed && (
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, paddingLeft: 8 }}>
                    <img
                      src="/nautilus logo 1.png"
                      alt="Nautilus"
                      style={{ height: 40, width: 'auto', objectFit: 'contain', flexShrink: 0, display: 'block' }}
                    />
                  </div>
                )}
                {/* Settings gear */}
                <Link
                  href="/dashboard/settings"
                  title="Settings"
                  style={{
                    background:     is('/dashboard/settings') ? N.activeBg : 'none',
                    border:         `1px solid ${is('/dashboard/settings') ? N.activeBorder : N.border}`,
                    borderRadius:   7,
                    color:          is('/dashboard/settings') ? '#4DA3FF' : N.muted,
                    width:          28, height: 28,
                    cursor:         'pointer',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    flexShrink:     0,
                    transition:     'all 0.15s ease',
                    textDecoration: 'none',
                  }}
                >
                  <I.Settings />
                </Link>
                {/* Collapse toggle */}
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  style={{
                    background:      'none',
                    border:          `1px solid ${N.border}`,
                    borderRadius:    7,
                    color:           N.muted,
                    width:           28, height: 28,
                    cursor:          'pointer',
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    flexShrink:      0,
                    transition:      'all 0.15s ease',
                  }}
                  title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <I.Collapse />
                </button>
              </div>

              {/* Scrollable nav area */}
              <div style={{
                flex:       1,
                overflowY:  'auto',
                overflowX:  'hidden',
                padding:    isCollapsed ? '6px 8px' : '6px 10px',
              }}>

                {/* ── OVERVIEW ── */}
                <SectionLabel label="Overview" isCollapsed={isCollapsed} />
                <NavItem href="/dashboard" label="Dashboard" icon={<I.Dashboard />}
                  isCollapsed={isCollapsed} active={is('/dashboard')} />
                <NavItem href="/dashboard/health" label="Nautilus Score" icon={<I.HealthScore />}
                  isCollapsed={isCollapsed} active={is('/dashboard/health')} />
                <NavItem href="/dashboard/ai-insights" label="AI Insights" icon={<I.AI />}
                  isCollapsed={isCollapsed} active={is('/dashboard/ai-insights')} />

                {/* Connect Bank — sits under Overview as setup/infrastructure */}
                {isCollapsed ? (
                  <button
                    onClick={() => setAddAccountOpen(true)}
                    title="Connect a bank account"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '100%', padding: '9px 0', margin: '2px 0',
                      background: 'transparent', border: '1px solid transparent',
                      borderRadius: 8, color: N.text, cursor: 'pointer', opacity: 0.85,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { const b = e.currentTarget; b.style.background = N.hoverBg; b.style.color = N.textHover; }}
                    onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'transparent'; b.style.color = N.text; }}
                  >
                    <I.Bank />
                  </button>
                ) : (
                  <button
                    onClick={() => setAddAccountOpen(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      width: '100%', padding: '9px 12px', margin: '2px 0',
                      background: 'transparent', border: '3px solid transparent',
                      borderRadius: 8, color: N.text, cursor: 'pointer',
                      fontSize: 13, fontWeight: 400, borderLeft: '3px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { const b = e.currentTarget; b.style.background = N.hoverBg; b.style.color = N.textHover; }}
                    onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'transparent'; b.style.color = N.text; }}
                  >
                    <span style={{ flexShrink: 0, opacity: 0.65 }}><I.Bank /></span>
                    Connect Bank
                  </button>
                )}

                {/* ── WEALTH ── */}
                <SectionLabel label="Wealth" isCollapsed={isCollapsed} />
                <NavItem
                  href="/dashboard/net-worth" label="Net Worth" icon={<I.NetWorth />}
                  isCollapsed={isCollapsed}
                  active={startsWith('/dashboard/net-worth')}
                  hasChildren expanded={netWorthOpen}
                  onToggle={() => setNetWorthOpen(!netWorthOpen)}
                />
                {netWorthOpen && (
                  <>
                    <SubItem href="/dashboard/net-worth"             label="Summary"     active={is('/dashboard/net-worth')}             isCollapsed={isCollapsed} />
                    <SubItem href="/dashboard/net-worth/assets"      label="Assets"      active={is('/dashboard/net-worth/assets')}      isCollapsed={isCollapsed} />
                    <SubItem href="/dashboard/net-worth/liabilities" label="Liabilities" active={is('/dashboard/net-worth/liabilities')} isCollapsed={isCollapsed} />
                  </>
                )}
                <NavItem
                  href="/dashboard/cashflow" label="Cash Flow" icon={<I.CashFlow />}
                  isCollapsed={isCollapsed}
                  active={
                    startsWith('/dashboard/cashflow') ||
                    startsWith('/dashboard/income')   ||
                    startsWith('/dashboard/expenses')
                  }
                  hasChildren expanded={cashFlowOpen}
                  onToggle={() => setCashFlowOpen(!cashFlowOpen)}
                />
                {cashFlowOpen && (
                  <>
                    <SubItem href="/dashboard/cashflow"  label="Overview"  active={is('/dashboard/cashflow')}  isCollapsed={isCollapsed} />
                    <SubItem href="/dashboard/income"    label="Income"    active={is('/dashboard/income')}    isCollapsed={isCollapsed} />
                    <SubItem href="/dashboard/expenses"  label="Expenses"  active={is('/dashboard/expenses')}  isCollapsed={isCollapsed} />
                  </>
                )}
                <NavItem href="/dashboard/recurring"    label="Recurring"    icon={<I.Recurring />}
                  isCollapsed={isCollapsed} active={startsWith('/dashboard/recurring')} />

                {/* ── PLANNING ── */}
                <SectionLabel label="Planning" isCollapsed={isCollapsed} />
                <NavItem href="/dashboard/budget"     label="Budget"       icon={<I.Budget />}
                  isCollapsed={isCollapsed} active={is('/dashboard/budget')} />
                <NavItem href="/dashboard/goals"      label="Goals"        icon={<I.Goals />}
                  isCollapsed={isCollapsed} active={is('/dashboard/goals')} />
                <NavItem href="/dashboard/debt"       label="Debt Planner" icon={<I.DebtPlanner />}
                  isCollapsed={isCollapsed} active={is('/dashboard/debt')} />
                <NavItem href="/dashboard/retirement" label="Retirement"   icon={<I.Retirement />}
                  isCollapsed={isCollapsed} active={is('/dashboard/retirement')} />
                <NavItem href="/dashboard/forecast"   label="Forecast"     icon={<I.Forecast />}
                  isCollapsed={isCollapsed} active={is('/dashboard/forecast')} />

              </div>

              {/* ── BOTTOM — pinned ── */}
              <div style={{
                borderTop: `1px solid ${N.border}`,
                padding:   isCollapsed ? '8px 8px' : '8px 10px',
                flexShrink: 0,
              }}>
                {/* Dark mode toggle */}
                <div style={{ marginTop: 0 }}>
                  <ThemeToggle isCollapsed={isCollapsed} />
                </div>
                {/* Sign out */}
                <SignOutButton isCollapsed={isCollapsed} />
              </div>

            </div>
            {/* ─────── END SIDEBAR ─────── */}

            {/* ─────── MAIN CONTENT ─────── */}
            <div className="dashboard-scroll" style={{
              flex:       1,
              marginLeft: sidebarWidth,
              transition: 'margin-left 0.22s ease, background 0.2s ease',
              height:     '100vh',
              overflowY:  'auto',
              background: T.pageBg,
              color:      T.text,
              padding:    '32px 36px',
            }}>
              {children}
            </div>

          </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DASHBOARD LAYOUT (exported — wraps with all providers)
───────────────────────────────────────────────────────────── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TransactionProvider>
      <FinancialDataProvider>
        <FinancialPeriodProvider>
          <DashboardThemeProvider>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
          </DashboardThemeProvider>
        </FinancialPeriodProvider>
      </FinancialDataProvider>
    </TransactionProvider>
  );
}

