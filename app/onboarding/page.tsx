'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase-browser';

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS  (dark premium — matches landing / sign-in)
───────────────────────────────────────────────────────────── */
const C = {
  bg:           '#07111F',
  surface:      '#0E1A30',
  surfaceHover: '#132140',
  border:       'rgba(77,163,255,0.18)',
  borderHover:  'rgba(77,163,255,0.45)',
  text:         '#F0F4FF',
  muted:        '#7A90B8',
  accent:       '#4DA3FF',
  gold:         '#2ED3C6',
  goldLight:    '#67E6D5',
  green:        '#34D399',
  red:          '#FF5A5A',
  amber:        '#FBBF24',
  purple:       '#A78BFA',
  primary:      '#1d56c7',
  primaryGlow:  'rgba(29,86,199,0.35)',
};

/* ─────────────────────────────────────────────────────────────
   STEP DEFINITIONS
───────────────────────────────────────────────────────────── */
type StepKey = 'welcome' | 'account' | 'profile' | 'connect' | 'income' | 'goal' | 'done';

const STEPS: { key: StepKey; label: string; icon: string }[] = [
  { key: 'welcome', label: 'Welcome',    icon: '👋' },
  { key: 'account', label: 'Account',    icon: '🔐' },
  { key: 'profile', label: 'Profile',    icon: '👤' },
  { key: 'connect', label: 'Accounts',   icon: '🏦' },
  { key: 'income',  label: 'Income',     icon: '💰' },
  { key: 'goal',    label: 'First Goal', icon: '🎯' },
  { key: 'done',    label: 'Done',       icon: '✓'  },
];

/* ─────────────────────────────────────────────────────────────
   UI PRIMITIVES
───────────────────────────────────────────────────────────── */
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 20,
      border: `1px solid ${C.border}`,
      boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
      padding: '40px 44px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function PrimaryBtn({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: '15px', borderRadius: 12, border: 'none',
        background: disabled ? 'rgba(29,86,199,0.3)' : `linear-gradient(135deg, ${C.primary}, #4DA3FF)`,
        color: disabled ? C.muted : '#fff',
        fontSize: 15, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `0 4px 20px ${C.primaryGlow}`,
        transition: 'all 0.2s ease',
        letterSpacing: '0.01em',
      }}
    >
      {children}
    </button>
  );
}

function SecondaryBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '14px', borderRadius: 12,
      border: `1px solid ${C.border}`, background: 'transparent',
      color: C.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer',
      transition: 'all 0.15s',
    }}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder, prefix }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; prefix?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 8 }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `1px solid ${focused ? C.accent : C.border}`,
        borderRadius: 10, background: 'rgba(255,255,255,0.04)',
        transition: 'border-color 0.15s',
      }}>
        {prefix && <span style={{ padding: '0 0 0 14px', color: C.muted, fontSize: 15, fontWeight: 600 }}>{prefix}</span>}
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, padding: '13px 14px', background: 'transparent', border: 'none', outline: 'none',
            color: C.text, fontSize: 15, borderRadius: 10,
          }}
        />
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 8 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: '100%', padding: '13px 14px', borderRadius: 10,
        border: `1px solid ${C.border}`, background: C.surface,
        color: C.text, fontSize: 15, outline: 'none', cursor: 'pointer',
        boxSizing: 'border-box',
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ChoiceCard({ selected, onClick, icon, label, sub }: {
  selected: boolean; onClick: () => void; icon: string; label: string; sub: string;
}) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '20px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
      border: `2px solid ${selected ? C.accent : C.border}`,
      background: selected ? 'rgba(77,163,255,0.08)' : 'rgba(255,255,255,0.02)',
      transition: 'all 0.15s',
    }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: selected ? C.accent : C.text, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{sub}</div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   PROGRESS BAR
───────────────────────────────────────────────────────────── */
function ProgressBar({ currentIndex, total }: { currentIndex: number; total: number }) {
  const pct = Math.round((currentIndex / (total - 1)) * 100);
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Step {currentIndex + 1} of {total}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>{pct}% complete</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
        <div style={{
          height: 4, borderRadius: 2,
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`,
          transition: 'width 0.4s ease',
          boxShadow: `0 0 8px ${C.accent}60`,
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        {STEPS.map((s, i) => (
          <div key={s.key} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            opacity: i <= currentIndex ? 1 : 0.35,
            transition: 'opacity 0.3s',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: i < currentIndex ? C.green : i === currentIndex ? C.accent : 'rgba(255,255,255,0.06)',
              border: i === currentIndex ? `2px solid ${C.accent}` : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: i < currentIndex ? 13 : 12,
              transition: 'all 0.3s',
              boxShadow: i === currentIndex ? `0 0 10px ${C.accent}50` : 'none',
            }}>
              {i < currentIndex ? '✓' : s.icon}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: i === currentIndex ? C.accent : C.muted }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STEP 1 — WELCOME
───────────────────────────────────────────────────────────── */
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>👋</div>
      <div style={{
        display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: C.accent,
        background: 'rgba(77,163,255,0.1)', border: `1px solid rgba(77,163,255,0.25)`,
        borderRadius: 20, padding: '5px 16px', marginBottom: 20,
      }}>
        Welcome to Nautilus Money
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: C.text, margin: '0 0 14px', lineHeight: 1.2 }}>
        Let's build your financial<br />command center
      </h1>
      <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 36, maxWidth: 420, margin: '0 auto 36px' }}>
        Setup takes about 3 minutes. We'll connect your accounts, understand your income, and set your first goal — then your dashboard is live.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 36 }}>
        {[
          { icon: '🔒', label: 'Bank-level security', sub: '256-bit encryption' },
          { icon: '👁️', label: 'Read-only access', sub: 'We never move money' },
          { icon: '⚡', label: 'Real-time sync', sub: 'Updates automatically' },
        ].map(f => (
          <div key={f.label} style={{
            padding: '16px 14px', borderRadius: 12, textAlign: 'center',
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 3 }}>{f.label}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{f.sub}</div>
          </div>
        ))}
      </div>

      <PrimaryBtn onClick={onNext}>Get Started →</PrimaryBtn>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STEP 2 — CREATE ACCOUNT
───────────────────────────────────────────────────────────── */
function StepAccount({ onNext }: { onNext: (userId: string) => void }) {
  const supabase = createClient();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const valid = email.includes('@') && password.length >= 8 && password === confirm;

  const handleCreate = async () => {
    if (!valid) return;
    setError(''); setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onNext(data.user?.id ?? '');
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Step 1</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: '0 0 8px' }}>Create your account</h2>
        <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>Your login credentials — stored securely with Supabase Auth.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        <Input label="Email address" value={email} onChange={setEmail} type="email" placeholder="you@example.com" />
        <Input label="Password (8+ characters)" value={password} onChange={setPassword} type={showPw ? 'text' : 'password'} placeholder="••••••••" />
        <Input label="Confirm password" value={confirm} onChange={setConfirm} type={showPw ? 'text' : 'password'} placeholder="••••••••" />

        <button onClick={() => setShowPw(v => !v)} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.muted }}>
          {showPw ? '🙈 Hide password' : '👁 Show password'}
        </button>

        {confirm && password !== confirm && (
          <div style={{ fontSize: 12, color: C.red }}>Passwords don't match</div>
        )}
        {error && (
          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,90,90,0.08)', border: '1px solid rgba(255,90,90,0.25)', fontSize: 13, color: C.red }}>
            {error}
          </div>
        )}

        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(77,163,255,0.06)', border: `1px solid ${C.border}`, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
          🔒 Your credentials are encrypted and stored by Supabase. Nautilus never sees your password.
        </div>
      </div>

      <PrimaryBtn onClick={handleCreate} disabled={!valid || loading}>
        {loading ? 'Creating account…' : 'Create Account →'}
      </PrimaryBtn>

      <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: C.muted }}>
        Already have an account?{' '}
        <a href="/landingpage/signin" style={{ color: C.accent, fontWeight: 600, textDecoration: 'none' }}>Sign in</a>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STEP 3 — PROFILE
───────────────────────────────────────────────────────────── */
function StepProfile({ onNext, data, onChange }: {
  onNext: () => void;
  data: { firstName: string; lastName: string; currency: string; householdSize: string };
  onChange: (k: string, v: string) => void;
}) {
  const valid = data.firstName.trim().length > 0;
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Step 2</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: '0 0 8px' }}>Tell us about yourself</h2>
        <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>We'll personalize your dashboard to fit your life.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input label="First name" value={data.firstName} onChange={v => onChange('firstName', v)} placeholder="Anthony" />
          <Input label="Last name"  value={data.lastName}  onChange={v => onChange('lastName',  v)} placeholder="Smith" />
        </div>
        <Select label="Currency" value={data.currency} onChange={v => onChange('currency', v)} options={[
          { value: 'USD', label: '🇺🇸 USD — US Dollar' },
          { value: 'EUR', label: '🇪🇺 EUR — Euro' },
          { value: 'GBP', label: '🇬🇧 GBP — British Pound' },
          { value: 'CAD', label: '🇨🇦 CAD — Canadian Dollar' },
          { value: 'AUD', label: '🇦🇺 AUD — Australian Dollar' },
        ]} />
        <Select label="Household size" value={data.householdSize} onChange={v => onChange('householdSize', v)} options={[
          { value: '1', label: 'Just me' },
          { value: '2', label: '2 people' },
          { value: '3', label: '3 people' },
          { value: '4', label: '4 people' },
          { value: '5', label: '5+ people' },
        ]} />
      </div>

      <PrimaryBtn onClick={onNext} disabled={!valid}>Continue →</PrimaryBtn>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STEP 3 — CONNECT ACCOUNTS
───────────────────────────────────────────────────────────── */
type ConnectMethod = 'plaid' | 'manual' | null;

const SUPPORTED_BANKS = [
  { name: 'Chase',       logo: '🏦' },
  { name: 'Bank of America', logo: '🏛' },
  { name: 'Wells Fargo', logo: '🐎' },
  { name: 'Citibank',    logo: '🔵' },
  { name: 'US Bank',     logo: '⭐' },
  { name: 'Capital One', logo: '💳' },
  { name: 'Ally Bank',   logo: '🟢' },
  { name: '+ 12,000 more', logo: '✦' },
];

function StepConnect({ onNext, onSkip, method, setMethod, connectedCount }: {
  onNext: () => void; onSkip: () => void;
  method: ConnectMethod; setMethod: (m: ConnectMethod) => void;
  connectedCount: number;
}) {
  const [plaidState, setPlaidState] = useState<'idle' | 'launching' | 'connected'>('idle');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  const launchPlaid = () => {
    setMethod('plaid');
    setPlaidState('launching');
    // Simulate Plaid Link flow — replace with real Plaid Link SDK call
    setTimeout(() => setPlaidState('connected'), 2200);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Step 3</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: '0 0 8px' }}>Connect your accounts</h2>
        <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>
          Link your bank and investment accounts for automatic transaction sync and real-time net worth tracking.
        </p>
      </div>

      {/* Method choice */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <ChoiceCard
          selected={method === 'plaid'}
          onClick={() => setMethod('plaid')}
          icon="⚡"
          label="Automatic via Plaid"
          sub="Secure bank-level connection. Syncs automatically."
        />
        <ChoiceCard
          selected={method === 'manual'}
          onClick={() => setMethod('manual')}
          icon="✏️"
          label="Enter manually"
          sub="Type in balances yourself. Works without linking."
        />
      </div>

      {/* PLAID FLOW */}
      {method === 'plaid' && (
        <div style={{ marginBottom: 24 }}>
          {plaidState === 'idle' && (
            <>
              {/* Supported banks grid */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Works with 12,000+ financial institutions</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {SUPPORTED_BANKS.map(b => (
                    <div key={b.name} style={{
                      padding: '10px 8px', borderRadius: 10, textAlign: 'center',
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
                      fontSize: 11, color: C.muted,
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{b.logo}</div>
                      {b.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Security callout */}
              <div style={{
                padding: '14px 16px', borderRadius: 12, marginBottom: 20,
                background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)',
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
                  <strong style={{ color: C.green }}>Powered by Plaid</strong> — the same technology used by Venmo, Robinhood, and Coinbase. Nautilus Money only has read-only access and can never move your money.
                </div>
              </div>

              <button onClick={launchPlaid} style={{
                width: '100%', padding: '15px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #1d56c7, #4DA3FF)',
                color: '#fff', fontSize: 15, fontWeight: 700,
                boxShadow: '0 4px 20px rgba(29,86,199,0.35)',
              }}>
                Connect with Plaid →
              </button>
            </>
          )}

          {plaidState === 'launching' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 16, animation: 'spin 1s linear infinite' }}>⟳</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>Opening secure connection…</div>
              <div style={{ fontSize: 13, color: C.muted }}>Plaid will open in a secure window</div>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {plaidState === 'connected' && (
            <div>
              <div style={{
                padding: '20px', borderRadius: 14, marginBottom: 16,
                background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>✓</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.green, marginBottom: 6 }}>Accounts Connected!</div>
                <div style={{ fontSize: 13, color: C.muted }}>3 accounts linked successfully</div>
              </div>

              {/* Mock account list */}
              {[
                { name: 'Chase Checking',    type: 'Checking',   balance: '$4,218' },
                { name: 'Chase Savings',     type: 'Savings',    balance: '$12,500' },
                { name: 'Chase Sapphire',    type: 'Credit Card', balance: '-$842' },
              ].map(a => (
                <div key={a.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderRadius: 10, marginBottom: 8,
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{a.type}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: a.balance.startsWith('-') ? C.red : C.green }}>{a.balance}</div>
                </div>
              ))}

              <button onClick={launchPlaid} style={{
                marginTop: 12, width: '100%', padding: '12px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: 'transparent',
                color: C.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                + Add another institution
              </button>
            </div>
          )}
        </div>
      )}

      {/* MANUAL FLOW */}
      {method === 'manual' && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            padding: '14px 16px', borderRadius: 12, marginBottom: 20,
            background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
            fontSize: 13, color: C.muted, lineHeight: 1.5,
          }}>
            💡 You can enter balances now and connect Plaid later from Settings. Your dashboard will still work with manually entered data.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Checking account balance',  placeholder: '0.00', icon: '🏦' },
              { label: 'Savings account balance',   placeholder: '0.00', icon: '💰' },
              { label: 'Investment account balance', placeholder: '0.00', icon: '📈' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>
                  {f.icon}
                </div>
                <Input label={f.label} value="" onChange={() => {}} type="number" placeholder={f.placeholder} prefix="$" />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 14, lineHeight: 1.5 }}>
            You can add more accounts (investments, retirement, real estate) from the Assets page after setup.
          </p>
        </div>
      )}

      {!method && (
        <div style={{ height: 20 }} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryBtn
          onClick={onNext}
          disabled={!method}
        >
          {method === 'plaid' && plaidState === 'connected' ? 'Continue with connected accounts →'
           : method === 'manual' ? 'Continue with manual balances →'
           : method === 'plaid'  ? 'Waiting for connection…'
           : 'Choose a method above'}
        </PrimaryBtn>
        <SecondaryBtn onClick={onSkip}>Skip for now — I'll connect later</SecondaryBtn>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STEP 4 — INCOME
───────────────────────────────────────────────────────────── */
type IncomeType = 'salary' | 'hourly' | 'self_employed' | 'multiple';

const INCOME_TYPES: { key: IncomeType; label: string; icon: string; sub: string }[] = [
  { key: 'salary',        label: 'Salary',         icon: '💼', sub: 'Fixed monthly or bi-weekly' },
  { key: 'hourly',        label: 'Hourly',          icon: '⏰', sub: 'Paid by the hour' },
  { key: 'self_employed', label: 'Self-Employed',   icon: '🧑‍💻', sub: 'Freelance or business owner' },
  { key: 'multiple',      label: 'Multiple Sources', icon: '🔄', sub: 'More than one income stream' },
];

function StepIncome({ onNext, data, onChange }: {
  onNext: () => void;
  data: { incomeType: IncomeType | null; grossIncome: string; payFrequency: string };
  onChange: (k: string, v: string) => void;
}) {
  const valid = data.incomeType && data.grossIncome.trim().length > 0;
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Step 4</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: '0 0 8px' }}>What does your income look like?</h2>
        <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>
          This helps us calculate your savings rate, budget targets, and retirement projections accurately.
        </p>
      </div>

      {/* Income type grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {INCOME_TYPES.map(t => (
          <button
            key={t.key}
            onClick={() => onChange('incomeType', t.key)}
            style={{
              padding: '16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
              border: `2px solid ${data.incomeType === t.key ? C.accent : C.border}`,
              background: data.incomeType === t.key ? 'rgba(77,163,255,0.08)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.15s', display: 'flex', gap: 12, alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: data.incomeType === t.key ? C.accent : C.text }}>{t.label}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{t.sub}</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        <Input
          label="Annual gross income"
          value={data.grossIncome}
          onChange={v => onChange('grossIncome', v)}
          type="number" placeholder="85,000" prefix="$"
        />
        <Select label="Pay frequency" value={data.payFrequency} onChange={v => onChange('payFrequency', v)} options={[
          { value: 'biweekly', label: 'Bi-weekly (every 2 weeks)' },
          { value: 'semimonthly', label: 'Semi-monthly (twice a month)' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'irregular', label: 'Irregular / varies' },
        ]} />

        {/* Monthly estimate callout */}
        {data.grossIncome && Number(data.grossIncome) > 0 && (
          <div style={{
            padding: '14px 16px', borderRadius: 12,
            background: 'rgba(46,211,198,0.08)', border: '1px solid rgba(46,211,198,0.2)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: C.muted }}>Estimated monthly take-home</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>
              ${Math.round(Number(data.grossIncome) * 0.72 / 12).toLocaleString()}/mo
            </span>
          </div>
        )}
      </div>

      <PrimaryBtn onClick={onNext} disabled={!valid}>Continue →</PrimaryBtn>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STEP 5 — FIRST GOAL
───────────────────────────────────────────────────────────── */
const GOAL_TEMPLATES = [
  { emoji: '🏠', name: 'Buy a Home',        target: 60000,  months: 36, color: '#D97706' },
  { emoji: '🏖️', name: 'Vacation Fund',     target: 5000,   months: 12, color: '#0891B2' },
  { emoji: '🚗', name: 'New Car',           target: 15000,  months: 24, color: '#7C3AED' },
  { emoji: '🎓', name: 'Education Fund',    target: 25000,  months: 48, color: '#16A34A' },
  { emoji: '🛡️', name: 'Emergency Fund',   target: 15000,  months: 6,  color: '#DC2626' },
  { emoji: '🌴', name: 'Early Retirement',  target: 500000, months: 120, color: '#2ED3C6' },
  { emoji: '💼', name: 'Start a Business',  target: 30000,  months: 24, color: '#4DA3FF' },
  { emoji: '✦',  name: 'Custom Goal',       target: 10000,  months: 12, color: '#64748B' },
];

function StepGoal({ onNext, onSkip, data, onChange }: {
  onNext: () => void; onSkip: () => void;
  data: { goalName: string; goalTarget: string; goalMonths: string; goalEmoji: string };
  onChange: (k: string, v: string) => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  const pickTemplate = (i: number) => {
    const t = GOAL_TEMPLATES[i];
    setSelectedTemplate(i);
    onChange('goalName',   t.name);
    onChange('goalTarget', String(t.target));
    onChange('goalMonths', String(t.months));
    onChange('goalEmoji',  t.emoji);
  };

  const monthly = data.goalTarget && data.goalMonths
    ? Math.ceil(Number(data.goalTarget) / Number(data.goalMonths))
    : 0;

  const valid = data.goalName.trim() && Number(data.goalTarget) > 0 && Number(data.goalMonths) > 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Step 5</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: '0 0 8px' }}>Set your first goal</h2>
        <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>
          What are you saving toward? Pick a template or create your own.
        </p>
      </div>

      {/* Template grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
        {GOAL_TEMPLATES.map((t, i) => (
          <button
            key={t.name}
            onClick={() => pickTemplate(i)}
            style={{
              padding: '12px 8px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
              border: `2px solid ${selectedTemplate === i ? t.color : C.border}`,
              background: selectedTemplate === i ? `${t.color}12` : 'rgba(255,255,255,0.02)',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>{t.emoji}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: selectedTemplate === i ? t.color : C.muted, lineHeight: 1.3 }}>{t.name}</div>
          </button>
        ))}
      </div>

      {/* Custom fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <Input label="Goal name" value={data.goalName} onChange={v => onChange('goalName', v)} placeholder="e.g. House down payment" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Target amount" value={data.goalTarget} onChange={v => onChange('goalTarget', v)} type="number" placeholder="25,000" prefix="$" />
          <Input label="Target (months)" value={data.goalMonths} onChange={v => onChange('goalMonths', v)} type="number" placeholder="24" />
        </div>

        {monthly > 0 && (
          <div style={{
            padding: '14px 16px', borderRadius: 12,
            background: 'rgba(77,163,255,0.08)', border: `1px solid rgba(77,163,255,0.2)`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: C.muted }}>You need to save</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.accent }}>${monthly.toLocaleString()}/mo</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryBtn onClick={onNext} disabled={!valid}>Set this goal →</PrimaryBtn>
        <SecondaryBtn onClick={onSkip}>I'll set goals later</SecondaryBtn>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STEP 6 — DONE
───────────────────────────────────────────────────────────── */
function StepDone({ onFinish, profile, goal }: {
  onFinish: () => void;
  profile: { firstName: string };
  goal: { goalName: string; goalTarget: string; goalMonths: string };
}) {
  const [launching, setLaunching] = useState(false);

  const handleFinish = () => {
    setLaunching(true);
    setTimeout(onFinish, 1200);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
        <div style={{ fontSize: 64 }}>🎉</div>
        <div style={{
          position: 'absolute', top: -4, right: -4,
          width: 22, height: 22, borderRadius: '50%',
          background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: '#fff', fontWeight: 800,
        }}>✓</div>
      </div>

      <h2 style={{ fontSize: 30, fontWeight: 800, color: C.text, margin: '0 0 12px' }}>
        You're all set{profile.firstName ? `, ${profile.firstName}` : ''}!
      </h2>
      <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 36, maxWidth: 380, margin: '0 auto 36px' }}>
        Your financial command center is ready. Here's what we've set up for you.
      </p>

      {/* Summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36, textAlign: 'left' }}>
        {[
          { icon: '✓', label: 'Profile created',        color: C.green },
          { icon: '✓', label: 'Accounts connected',     color: C.green },
          { icon: '✓', label: 'Income configured',      color: C.green },
          { icon: goal.goalName ? '✓' : '○', label: goal.goalName ? `Goal set: ${goal.goalName}` : 'Goals — set anytime from your dashboard', color: goal.goalName ? C.green : C.muted },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, alignItems: 'center',
            padding: '12px 16px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
          }}>
            <span style={{ fontSize: 16, color: item.color, fontWeight: 700, flexShrink: 0 }}>{item.icon}</span>
            <span style={{ fontSize: 14, color: item.color === C.muted ? C.muted : C.text }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* What's next */}
      <div style={{
        padding: '16px 20px', borderRadius: 14, marginBottom: 32,
        background: `linear-gradient(135deg, rgba(29,86,199,0.15), rgba(77,163,255,0.08))`,
        border: `1px solid rgba(77,163,255,0.2)`, textAlign: 'left',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>What's next</div>
        {[
          'Your Dashboard is live with real-time net worth',
          'Transactions will sync within minutes',
          'Add more goals on the Goals page',
          'Set up a budget for each spending category',
        ].map((tip, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: i < 3 ? 8 : 0 }}>
            <span style={{ color: C.accent, fontSize: 14, marginTop: 1 }}>→</span>
            <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{tip}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleFinish}
        disabled={launching}
        style={{
          width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: launching ? 'rgba(29,86,199,0.5)' : `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
          color: '#fff', fontSize: 16, fontWeight: 800,
          boxShadow: launching ? 'none' : `0 4px 24px ${C.primaryGlow}`,
          transition: 'all 0.3s', letterSpacing: '0.01em',
        }}
      >
        {launching ? '✦ Launching your dashboard…' : 'Go to my Dashboard →'}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN ONBOARDING PAGE
───────────────────────────────────────────────────────────── */
export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [stepIndex, setStepIndex] = useState(0);
  const [userId, setUserId] = useState('');

  // Profile state
  const [profile, setProfile] = useState({ firstName: '', lastName: '', currency: 'USD', householdSize: '1' });
  const updateProfile = useCallback((k: string, v: string) => setProfile(p => ({ ...p, [k]: v })), []);

  // Connect state
  const [connectMethod, setConnectMethod] = useState<ConnectMethod>(null);

  // Income state
  const [income, setIncome] = useState({ incomeType: null as IncomeType | null, grossIncome: '', payFrequency: 'biweekly' });
  const updateIncome = useCallback((k: string, v: string) => setIncome(p => ({ ...p, [k]: v })), []);

  // Goal state
  const [goal, setGoal] = useState({ goalName: '', goalTarget: '', goalMonths: '', goalEmoji: '🎯' });
  const updateGoal = useCallback((k: string, v: string) => setGoal(p => ({ ...p, [k]: v })), []);

  const next = () => setStepIndex(i => Math.min(i + 1, STEPS.length - 1));
  const skip = () => next();

  const handleAccountCreated = (uid: string) => { setUserId(uid); next(); };

  const finish = async () => {
    // Persist first goal to Supabase if one was set
    if (goal.goalName && Number(goal.goalTarget) > 0 && userId) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + Number(goal.goalMonths || 12));
      await supabase.from('goals').insert({
        user_id:        userId,
        name:           goal.goalName,
        emoji:          goal.goalEmoji,
        color:          '#4DA3FF',
        category:       'custom',
        target_amount:  Number(goal.goalTarget),
        current_saved:  0,
        monthly_contrib: goal.goalMonths ? Math.ceil(Number(goal.goalTarget) / Number(goal.goalMonths)) : 0,
        target_date:    targetDate.toISOString().split('T')[0],
      });
    }
    router.push('/dashboard');
    router.refresh();
  };

  const currentStep = STEPS[stepIndex].key;

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px',
      backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(29,86,199,0.2) 0%, transparent 70%)`,
    }}>

      {/* Logo */}
      <div style={{ position: 'fixed', top: 24, left: 32 }}>
        <img src="/nautilus logo 1.png" alt="WealthLens" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 560 }}>
        <Card>
          {currentStep !== 'welcome' && currentStep !== 'done' && (
            <ProgressBar currentIndex={stepIndex} total={STEPS.length} />
          )}

          {currentStep === 'welcome' && <StepWelcome onNext={next} />}

          {currentStep === 'account' && <StepAccount onNext={handleAccountCreated} />}

          {currentStep === 'profile' && (
            <StepProfile onNext={next} data={profile} onChange={updateProfile} />
          )}

          {currentStep === 'connect' && (
            <StepConnect
              onNext={next} onSkip={skip}
              method={connectMethod} setMethod={setConnectMethod}
              connectedCount={0}
            />
          )}

          {currentStep === 'income' && (
            <StepIncome onNext={next} data={income} onChange={updateIncome} />
          )}

          {currentStep === 'goal' && (
            <StepGoal onNext={next} onSkip={skip} data={goal} onChange={updateGoal} />
          )}

          {currentStep === 'done' && (
            <StepDone onFinish={finish} profile={profile} goal={goal} />
          )}
        </Card>

        {/* Exit link */}
        {currentStep !== 'done' && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button onClick={() => router.push('/dashboard')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: C.muted, textDecoration: 'underline',
            }}>
              Skip setup and go to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
