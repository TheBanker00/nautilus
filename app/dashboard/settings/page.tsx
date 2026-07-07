'use client';

import React, { useState } from 'react';
import { useUserProfile } from '../../lib/hooks/useuserprofile';

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────── */
const T = {
  bg:            '#EDF0F7',
  surface:       '#FFFFFF',
  border:        '#E2E8F0',
  borderMed:     '#CBD5E1',
  shadow:        '0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
  shadowMd:      '0 4px 16px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
  textPrimary:   '#0F172A',
  textSecondary: '#475569',
  textTertiary:  '#64748B',
  primary:       '#0a3fa8',
  primaryLight:  '#1d56c7',
  primaryBg:     'rgba(10,63,168,0.08)',
  primaryBorder: 'rgba(10,63,168,0.28)',
  green:         '#16A34A',
  greenBg:       '#F0FDF4',
  greenBorder:   '#BBF7D0',
  greenText:     '#15803D',
  red:           '#DC2626',
  redBg:         '#FEF2F2',
  redBorder:     '#FECACA',
  redText:       '#B91C1C',
  amber:         '#D97706',
  amberBg:       '#FFFBEB',
  amberBorder:   '#FDE68A',
  amberText:     '#B45309',
  purple:        '#7C3AED',
  purpleBg:      '#F5F3FF',
  purpleBorder:  '#DDD6FE',
  purpleText:    '#6D28D9',
  radius:        '12px',
  radiusSm:      '6px',
  radiusMd:      '8px',
};

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type SettingsTab = 'profile' | 'subscription' | 'notifications' | 'data' | 'security' | 'appearance';

interface TabDef { key: SettingsTab; label: string; icon: string; }

const TABS: TabDef[] = [
  { key: 'profile',       label: 'Profile',        icon: '👤' },
  { key: 'subscription',  label: 'Subscription',   icon: '⭐' },
  { key: 'notifications', label: 'Notifications',  icon: '🔔' },
  { key: 'data',          label: 'Data & Privacy',  icon: '🔒' },
  { key: 'security',      label: 'Security',        icon: '🛡️' },
  { key: 'appearance',    label: 'Appearance',      icon: '🎨' },
];

/* ─────────────────────────────────────────────────────────────
   SMALL PRIMITIVES
───────────────────────────────────────────────────────────── */
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--t-surface)', borderRadius: T.radius, border: `1px solid var(--t-border)`,
      boxShadow: 'var(--t-shadow-sm)', padding: '24px', position: 'relative', overflow: 'hidden', ...style,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: `1px solid var(--t-border)`, margin: '20px 0' }} />;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
        background: checked ? 'var(--t-primary)' : 'var(--t-border-med)',
        position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s ease',
      }} />
    </div>
  );
}

function RowToggle({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '4px 0' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--t-text-primary)' }}>{label}</div>
        {description && <div style={{ fontSize: 12.5, color: 'var(--t-text-tertiary)', marginTop: 2 }}>{description}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-text-secondary)', marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: T.radiusMd,
          border: `1px solid var(--t-border)`, fontSize: 14, color: 'var(--t-text-primary)',
          background: 'var(--t-bg)', outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--t-primary)')}
        onBlur={e  => (e.target.style.borderColor = 'var(--t-border)')}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-text-secondary)', marginBottom: 6 }}>{label}</div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: T.radiusMd,
          border: `1px solid var(--t-border)`, fontSize: 14, color: 'var(--t-text-primary)',
          background: 'var(--t-bg)', outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SaveButton({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 24px', borderRadius: T.radiusMd, border: 'none', cursor: 'pointer',
        background: saved ? 'var(--t-green)' : 'var(--t-primary)', color: '#fff', fontSize: 14, fontWeight: 600,
        transition: 'background 0.2s ease',
      }}
    >
      {saved ? '✓ Saved' : 'Save Changes'}
    </button>
  );
}

function DangerButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 18px', borderRadius: T.radiusMd, border: `1px solid var(--t-red-border)`,
        cursor: 'pointer', background: 'var(--t-red-bg)', color: 'var(--t-red-text)', fontSize: 13, fontWeight: 600,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB PANELS
───────────────────────────────────────────────────────────── */

function ProfileTab() {
  const { profile, loading, saving, saved, error, save, setProfile } = useUserProfile();
  const [phone,    setPhone]    = useState('');
  const [timezone, setTimezone] = useState('America/New_York');

  if (loading) return <div style={{ padding: 24, color: 'var(--t-text-tertiary)', fontSize: 14 }}>Loading profile…</div>;

  const handleSave = () => save({
    first_name: profile.first_name,
    last_name:  profile.last_name,
    age:        profile.age,
    currency:   profile.currency,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle>Personal Information</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="First Name" value={profile.first_name} onChange={v => setProfile(p => ({ ...p, first_name: v }))} placeholder="First name" />
          <Input label="Last Name"  value={profile.last_name}  onChange={v => setProfile(p => ({ ...p, last_name: v }))}  placeholder="Last name" />
          <Input label="Age" value={profile.age != null ? String(profile.age) : ''} onChange={v => setProfile(p => ({ ...p, age: v === '' ? null : Number(v) }))} type="number" placeholder="e.g. 35" />
          <Input label="Phone" value={phone} onChange={setPhone} type="tel" placeholder="+1 (555) 000-0000" />
        </div>
        {profile.age == null && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: T.radiusMd, background: T.amberBg, border: `1px solid ${T.amberBorder}`, fontSize: 12.5, color: T.amberText }}>
            ⚠️ Enter your age so we can calculate your Financial Independence projections on the dashboard.
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Regional Preferences</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Select label="Currency" value={profile.currency} onChange={v => setProfile(p => ({ ...p, currency: v }))} options={[
            { value: 'USD', label: 'USD — US Dollar' },
            { value: 'EUR', label: 'EUR — Euro' },
            { value: 'GBP', label: 'GBP — British Pound' },
            { value: 'CAD', label: 'CAD — Canadian Dollar' },
            { value: 'AUD', label: 'AUD — Australian Dollar' },
          ]} />
          <Select label="Timezone" value={timezone} onChange={setTimezone} options={[
            { value: 'America/New_York',    label: 'Eastern Time (ET)' },
            { value: 'America/Chicago',     label: 'Central Time (CT)' },
            { value: 'America/Denver',      label: 'Mountain Time (MT)' },
            { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
            { value: 'Europe/London',       label: 'London (GMT)' },
            { value: 'Europe/Paris',        label: 'Paris (CET)' },
          ]} />
        </div>
      </Card>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: T.radiusMd, background: T.redBg, border: `1px solid ${T.redBorder}`, fontSize: 13, color: T.redText }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton onClick={handleSave} saved={saved || saving} />
      </div>
    </div>
  );
}

function SubscriptionTab() {
  const plan = 'premium'; // placeholder — wire to auth/billing later

  const features = [
    'Unlimited connected accounts',
    'AI-powered financial insights',
    'Tax estimator & year-end summary',
    'Debt payoff planner',
    'Scenario & what-if planner',
    'Advanced forecasting engine',
    'Priority support',
    'CSV & PDF data export',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Current plan banner */}
      <Card style={{ background: 'linear-gradient(135deg, #0a3fa8 0%, #1d56c7 100%)', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              Current Plan
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>Premium</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
              $19.99 / month · Renews July 16, 2026
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: '50%',
            width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>
            ⭐
          </div>
        </div>
      </Card>

      {/* What's included */}
      <Card>
        <SectionTitle>What's Included</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {features.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--t-text-secondary)' }}>
              <span style={{ color: 'var(--t-green)', fontWeight: 700, flexShrink: 0 }}>✓</span>
              {f}
            </div>
          ))}
        </div>
      </Card>

      {/* Billing history placeholder */}
      <Card>
        <SectionTitle>Billing History</SectionTitle>
        {[
          { date: 'Jun 16, 2026', amount: '$19.99', status: 'Paid' },
          { date: 'May 16, 2026', amount: '$19.99', status: 'Paid' },
          { date: 'Apr 16, 2026', amount: '$19.99', status: 'Paid' },
        ].map((row, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 0', borderBottom: i < 2 ? `1px solid var(--t-border)` : 'none',
          }}>
            <div style={{ fontSize: 14, color: 'var(--t-text-primary)' }}>{row.date}</div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-text-primary)' }}>{row.amount}</div>
              <span style={{
                fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                background: 'var(--t-green-bg)', color: 'var(--t-green-text)', border: `1px solid var(--t-green-border)`,
              }}>{row.status}</span>
              <button style={{ fontSize: 12, color: 'var(--t-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Receipt
              </button>
            </div>
          </div>
        ))}
      </Card>

      {/* Manage subscription */}
      <Card>
        <SectionTitle>Manage Subscription</SectionTitle>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{
            padding: '10px 20px', borderRadius: T.radiusMd, border: `1px solid var(--t-primary-border)`,
            background: 'var(--t-primary-bg)', color: 'var(--t-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            Update Payment Method
          </button>
          <DangerButton onClick={() => {}}>Cancel Subscription</DangerButton>
        </div>
      </Card>
    </div>
  );
}

function NotificationsTab() {
  const [emailDigest,    setEmailDigest]    = useState(true);
  const [goalAlerts,     setGoalAlerts]     = useState(true);
  const [budgetAlerts,   setBudgetAlerts]   = useState(true);
  const [largeTransact,  setLargeTransact]  = useState(false);
  const [weeklyReport,   setWeeklyReport]   = useState(true);
  const [monthlyReport,  setMonthlyReport]  = useState(true);
  const [debtReminders,  setDebtReminders]  = useState(true);
  const [marketUpdates,  setMarketUpdates]  = useState(false);
  const [digestFreq,     setDigestFreq]     = useState('weekly');
  const [saved,          setSaved]          = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle>Email Alerts</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RowToggle label="Weekly digest"         description="Summary of your finances every Monday"            checked={emailDigest}   onChange={setEmailDigest} />
          <Divider />
          <RowToggle label="Goal alerts"           description="When a goal is behind schedule or nearly complete" checked={goalAlerts}    onChange={setGoalAlerts} />
          <Divider />
          <RowToggle label="Budget over-spend"     description="When a spending category exceeds its limit"        checked={budgetAlerts}  onChange={setBudgetAlerts} />
          <Divider />
          <RowToggle label="Large transactions"    description="Alert when a transaction exceeds $500"             checked={largeTransact} onChange={setLargeTransact} />
          <Divider />
          <RowToggle label="Debt payment reminders" description="3 days before a scheduled payment"               checked={debtReminders} onChange={setDebtReminders} />
        </div>
      </Card>

      <Card>
        <SectionTitle>Reports</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RowToggle label="Weekly spending report"  description="Top categories + net cash flow"     checked={weeklyReport}  onChange={setWeeklyReport} />
          <Divider />
          <RowToggle label="Monthly financial summary" description="Full breakdown with year-to-date" checked={monthlyReport} onChange={setMonthlyReport} />
          <Divider />
          <RowToggle label="Market & rate updates"   description="Fed rate changes, market summaries" checked={marketUpdates} onChange={setMarketUpdates} />
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton onClick={handleSave} saved={saved} />
      </div>
    </div>
  );
}

function DataTab() {
  const [confirm, setConfirm] = useState('');
  const [resyncing, setResyncing] = useState(false);
  const [resyncResult, setResyncResult] = useState<string | null>(null);

  const handleExportCSV = () => {
    alert('CSV export will be available once data export is wired to the API.');
  };
  const handleExportPDF = () => {
    alert('PDF report generation coming soon.');
  };
  const handleResync = async () => {
    setResyncing(true);
    setResyncResult(null);
    try {
      const res = await fetch('/api/plaid/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await res.json();
      setResyncResult(res.ok ? `Synced ${data.synced ?? 0} transaction(s).` : `Failed: ${data.error ?? 'Unknown error'}`);
    } catch (err: any) {
      setResyncResult(`Failed: ${err?.message ?? 'Network error'}`);
    } finally {
      setResyncing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <Card>
        <SectionTitle>Export Your Data</SectionTitle>
        <p style={{ fontSize: 14, color: 'var(--t-text-secondary)', marginTop: 0, marginBottom: 16 }}>
          Download a full copy of your financial data at any time. Your data is yours.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleExportCSV}
            style={{
              padding: '10px 20px', borderRadius: T.radiusMd, border: `1px solid var(--t-primary-border)`,
              background: 'var(--t-primary-bg)', color: 'var(--t-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Export as CSV
          </button>
          <button
            onClick={handleExportPDF}
            style={{
              padding: '10px 20px', borderRadius: T.radiusMd, border: `1px solid var(--t-purple-border)`,
              background: 'var(--t-purple-bg)', color: 'var(--t-purple-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Download PDF Report
          </button>
        </div>
      </Card>

      <Card>
        <SectionTitle>Connected Accounts</SectionTitle>
        <p style={{ fontSize: 14, color: 'var(--t-text-secondary)', marginTop: 0, marginBottom: 16 }}>
          Manage which financial institutions are sharing data with Nautilus.
        </p>
        <div style={{
          padding: '14px 16px', borderRadius: T.radiusMd, background: 'var(--t-bg)',
          border: `1px solid var(--t-border)`, fontSize: 14, color: 'var(--t-text-tertiary)',
          textAlign: 'center', marginBottom: 14,
        }}>
          Account connection management will be available when Plaid integration is complete.
        </div>
        <button
          onClick={handleResync}
          disabled={resyncing}
          style={{
            padding: '10px 20px', borderRadius: T.radiusMd, border: `1px solid var(--t-primary-border)`,
            background: 'var(--t-primary-bg)', color: 'var(--t-primary)', fontSize: 13, fontWeight: 600,
            cursor: resyncing ? 'not-allowed' : 'pointer', opacity: resyncing ? 0.6 : 1,
          }}
        >
          {resyncing ? 'Syncing…' : 'Resync Connected Accounts'}
        </button>
        {resyncResult && (
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--t-text-secondary)' }}>{resyncResult}</div>
        )}
      </Card>

      <Card>
        <SectionTitle>Data Retention</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Transaction history', value: 'All time' },
            { label: 'Balance snapshots',   value: '24 months' },
            { label: 'Budget records',      value: 'All time' },
            { label: 'Goal history',        value: 'All time' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--t-text-secondary)' }}>{row.label}</span>
              <span style={{ fontWeight: 600, color: 'var(--t-text-primary)' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ border: `1px solid var(--t-red-border)` }}>
        <SectionTitle>Danger Zone</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-text-primary)' }}>Delete all transaction data</div>
              <div style={{ fontSize: 12.5, color: 'var(--t-text-tertiary)', marginTop: 2 }}>Permanently removes all imported transactions. Cannot be undone.</div>
            </div>
            <DangerButton onClick={() => {}}>Delete Transactions</DangerButton>
          </div>
          <Divider />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-text-primary)' }}>Delete account</div>
              <div style={{ fontSize: 12.5, color: 'var(--t-text-tertiary)', marginTop: 2 }}>Permanently deletes your account and all associated data.</div>
            </div>
            <DangerButton onClick={() => {}}>Delete Account</DangerButton>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SecurityTab() {
  const [currentPw,   setCurrentPw]   = useState('');
  const [newPw,       setNewPw]       = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [twoFactor,   setTwoFactor]   = useState(false);
  const [sessionAlerts, setSessionAlerts] = useState(true);
  const [saved,       setSaved]       = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const sessions = [
    { device: 'Chrome on macOS',  location: 'New York, NY',    lastActive: 'Now',          current: true  },
    { device: 'Safari on iPhone', location: 'New York, NY',    lastActive: '2 hours ago',  current: false },
    { device: 'Chrome on Windows',location: 'Brooklyn, NY',    lastActive: '3 days ago',   current: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle>Change Password</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 440 }}>
          <Input label="Current Password" value={currentPw} onChange={setCurrentPw} type="password" placeholder="••••••••" />
          <Input label="New Password"     value={newPw}     onChange={setNewPw}     type="password" placeholder="••••••••" />
          <Input label="Confirm Password" value={confirmPw} onChange={setConfirmPw} type="password" placeholder="••••••••" />
        </div>
        <div style={{ marginTop: 16 }}>
          <SaveButton onClick={handleSave} saved={saved} />
        </div>
      </Card>

      <Card>
        <SectionTitle>Two-Factor Authentication</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RowToggle
            label="Enable 2FA"
            description="Require a verification code when signing in from a new device"
            checked={twoFactor}
            onChange={setTwoFactor}
          />
          <Divider />
          <RowToggle
            label="New sign-in alerts"
            description="Email me when a new session is created"
            checked={sessionAlerts}
            onChange={setSessionAlerts}
          />
        </div>
      </Card>

      <Card>
        <SectionTitle>Active Sessions</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {sessions.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 0', borderBottom: i < sessions.length - 1 ? `1px solid var(--t-border)` : 'none',
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: T.radiusMd, background: 'var(--t-bg)',
                  border: `1px solid var(--t-border)`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 18, flexShrink: 0,
                }}>
                  {s.device.includes('iPhone') ? '📱' : '💻'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--t-text-primary)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {s.device}
                    {s.current && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--t-green-bg)', color: 'var(--t-green-text)', border: `1px solid var(--t-green-border)` }}>
                        This device
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--t-text-tertiary)', marginTop: 2 }}>
                    {s.location} · {s.lastActive}
                  </div>
                </div>
              </div>
              {!s.current && (
                <DangerButton onClick={() => {}}>Revoke</DangerButton>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <DangerButton onClick={() => {}}>Sign Out All Other Sessions</DangerButton>
        </div>
      </Card>
    </div>
  );
}

function AppearanceTab() {
  const [theme,        setTheme]        = useState<'light' | 'dark' | 'system'>('light');
  const [accentColor,  setAccentColor]  = useState('#0a3fa8');
  const [compactMode,  setCompactMode]  = useState(false);
  const [showCents,    setShowCents]    = useState(false);
  const [animReduce,   setAnimReduce]   = useState(false);
  const [saved,        setSaved]        = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const themes: { key: 'light' | 'dark' | 'system'; label: string; icon: string }[] = [
    { key: 'light',  label: 'Light',  icon: '☀️' },
    { key: 'dark',   label: 'Dark',   icon: '🌙' },
    { key: 'system', label: 'System', icon: '💻' },
  ];

  const accents = [
    '#0a3fa8', '#7C3AED', '#0891B2', '#16A34A', '#D97706', '#DC2626',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle>Theme</SectionTitle>
        <div style={{ display: 'flex', gap: 12 }}>
          {themes.map(t => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              style={{
                flex: 1, padding: '14px 12px', borderRadius: T.radiusMd, cursor: 'pointer',
                border: theme === t.key ? `2px solid var(--t-primary)` : `1px solid var(--t-border)`,
                background: theme === t.key ? 'var(--t-primary-bg)' : 'var(--t-surface)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: theme === t.key ? 'var(--t-primary)' : 'var(--t-text-secondary)' }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--t-text-tertiary)' }}>
          Dark mode is coming soon — the toggle is here for preview.
        </div>
      </Card>

      <Card>
        <SectionTitle>Accent Color</SectionTitle>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {accents.map(c => (
            <button
              key={c}
              onClick={() => setAccentColor(c)}
              style={{
                width: 32, height: 32, borderRadius: '50%', background: c, border: 'none',
                cursor: 'pointer', outline: accentColor === c ? `3px solid ${c}` : '3px solid transparent',
                outlineOffset: 2, transition: 'outline 0.15s',
              }}
            />
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Display Options</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RowToggle
            label="Compact mode"
            description="Reduce card padding and spacing for a denser layout"
            checked={compactMode}
            onChange={setCompactMode}
          />
          <Divider />
          <RowToggle
            label="Show cents"
            description="Display $1,234.56 instead of $1,235"
            checked={showCents}
            onChange={setShowCents}
          />
          <Divider />
          <RowToggle
            label="Reduce motion"
            description="Minimize animations and transitions"
            checked={animReduce}
            onChange={setAnimReduce}
          />
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton onClick={handleSave} saved={saved} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SETTINGS PAGE
───────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const panels: Record<SettingsTab, React.ReactNode> = {
    profile:       <ProfileTab />,
    subscription:  <SubscriptionTab />,
    notifications: <NotificationsTab />,
    data:          <DataTab />,
    security:      <SecurityTab />,
    appearance:    <AppearanceTab />,
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--t-text-primary)', margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--t-text-tertiary)', marginTop: 4, marginBottom: 0 }}>
          Manage your account, subscription, and preferences.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* Sidebar nav */}
        <div style={{
          width: 200, flexShrink: 0, background: 'var(--t-surface)', borderRadius: T.radius,
          border: `1px solid var(--t-border)`, boxShadow: 'var(--t-shadow-sm)', overflow: 'hidden',
          position: 'sticky', top: 24,
        }}>
          {TABS.map((tab, i) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: activeTab === tab.key ? 'var(--t-primary-bg)' : 'transparent',
                borderLeft: activeTab === tab.key ? `3px solid var(--t-primary)` : '3px solid transparent',
                borderBottom: i < TABS.length - 1 ? `1px solid var(--t-border)` : 'none',
                color: activeTab === tab.key ? 'var(--t-primary)' : 'var(--t-text-secondary)',
                fontWeight: activeTab === tab.key ? 600 : 400,
                fontSize: 13.5, transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {panels[activeTab]}
        </div>

      </div>
    </div>
  );
}
