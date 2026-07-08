'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash; onAuthStateChange
    // picks it up and establishes a session automatically.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/landingpage/signin'), 2500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 80% 60% at 70% 50%, rgba(11,45,137,0.35) 0%, transparent 70%), #07111F',
      fontFamily: 'var(--font-body)',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(77,163,255,0.18)',
        borderRadius: 20,
        padding: '40px 36px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/nautilus logo 1.png" alt="Nautilus Money" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <p style={{ color: '#2ED3C6', fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Password updated!</p>
            <p style={{ color: '#7A90B8', fontSize: 14 }}>Redirecting you to sign in…</p>
          </div>
        ) : (
          <>
            <h1 style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
              Set a new password
            </h1>
            <p style={{ color: '#7A90B8', fontSize: 14, textAlign: 'center', marginBottom: 28 }}>
              Choose a strong password for your Nautilus Money account.
            </p>

            {!sessionReady && (
              <div style={{
                background: 'rgba(255,180,0,0.08)',
                border: '1px solid rgba(255,180,0,0.3)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#FCD34D',
                fontSize: 13,
                marginBottom: 20,
              }}>
                Waiting for your reset link to be verified…
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', color: '#7A90B8', fontSize: 13, marginBottom: 6 }}>
                  New password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(77,163,255,0.22)',
                    borderRadius: 10,
                    color: '#F0F4FF',
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#7A90B8', fontSize: 13, marginBottom: 6 }}>
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(77,163,255,0.22)',
                    borderRadius: 10,
                    color: '#F0F4FF',
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#FCA5A5',
                  fontSize: 13,
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !sessionReady}
                style={{
                  marginTop: 4,
                  padding: '13px',
                  background: loading || !sessionReady ? 'rgba(77,163,255,0.3)' : 'linear-gradient(135deg, #0a3fa8, #4DA3FF)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: loading || !sessionReady ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.15s',
                }}
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <a href="/landingpage/signin" style={{ color: '#4DA3FF', fontSize: 13, textDecoration: 'none' }}>
                ← Back to sign in
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
