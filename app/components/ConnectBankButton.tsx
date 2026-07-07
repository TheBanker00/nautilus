'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';

interface Props {
  onSuccess?: () => void;
  label?: string;
  style?: React.CSSProperties;
}

export default function ConnectBankButton({ onSuccess, label = '+ Connect Bank', style }: Props) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [syncing,   setSyncing]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Fetch a link token from our API on mount.
  // Guarded against React Strict Mode's double-invoked effect in dev — fetching
  // twice and swapping linkToken mid-session breaks Plaid Link while it's open.
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch('/api/plaid/create-link-token', { method: 'POST' })
      .then(r => r.json())
      .then(d => setLinkToken(d.link_token))
      .catch(() => setError('Failed to initialise Plaid'));
  }, []);

  const onPlaidSuccess = useCallback(async (public_token: string, metadata: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/plaid/exchange-token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token,
          institution_name: metadata?.institution?.name,
          institution_id:   metadata?.institution?.institution_id,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Exchange failed (${res.status})`);
      }
      setSyncing(true);
      // Sync is triggered server-side by exchange-token, give it a moment then callback
      setTimeout(() => { setSyncing(false); onSuccess?.(); }, 3000);
    } catch (err: any) {
      console.error('Plaid connect failed:', err);
      setError(err?.message || 'Failed to connect account. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  const { open, ready } = usePlaidLink({
    token:     linkToken ?? '',
    onSuccess: onPlaidSuccess,
    onExit:    (err) => { if (err) setError(err.display_message ?? 'Connection cancelled'); },
  });

  const defaultStyle: React.CSSProperties = {
    display:      'inline-flex',
    alignItems:   'center',
    gap:          8,
    padding:      '10px 20px',
    background:   'var(--t-primary)',
    color:        '#fff',
    border:       'none',
    borderRadius: '8px',
    fontSize:     13,
    fontWeight:   700,
    cursor:       ready && !loading && !syncing ? 'pointer' : 'not-allowed',
    opacity:      ready && !loading && !syncing ? 1 : 0.6,
    transition:   'all 0.15s',
    ...style,
  };

  if (syncing) return (
    <div style={{ fontSize: 13, color: 'var(--t-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 16, height: 16, border: '2px solid var(--t-primary)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
      Syncing your accounts…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      <button
        onClick={() => open()}
        disabled={!ready || loading || syncing}
        style={defaultStyle}
      >
        {loading ? 'Connecting…' : label}
      </button>
      {error && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--t-red, #dc2626)' }}>{error}</div>
      )}
    </div>
  );
}
