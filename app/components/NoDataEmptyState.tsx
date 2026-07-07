'use client';

import { useState } from 'react';
import ConnectBankButton from './ConnectBankButton';
import AddAssetModal from './accounts/addassetmodal';
import AddLiabilityModal from './accounts/addliabilitymodal';

interface Props {
  title?:    string;
  subtitle?: string;
  onPlaidSuccess?: () => void;
}

export default function NoDataEmptyState({
  title    = 'No data yet',
  subtitle = 'Connect a bank account or add your assets and liabilities to get started.',
  onPlaidSuccess,
}: Props) {
  const [assetOpen,     setAssetOpen]     = useState(false);
  const [liabilityOpen, setLiabilityOpen] = useState(false);

  return (
    <>
      <AddAssetModal open={assetOpen} onClose={() => setAssetOpen(false)} />
      {liabilityOpen && <AddLiabilityModal onClose={() => setLiabilityOpen(false)} />}

      <div style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '72px 24px',
        textAlign:      'center',
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--t-inner-box-bg)',
          border: '1px solid var(--t-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none"
            stroke="var(--t-text-tertiary)" strokeWidth={1.4}
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>

        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-text-primary)', marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ fontSize: 14, color: 'var(--t-text-tertiary)', maxWidth: 380, lineHeight: 1.6, marginBottom: 36 }}>
          {subtitle}
        </div>

        {/* Three options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360 }}>

          {/* Plaid */}
          <div>
            <ConnectBankButton
              label="🏦  Connect Bank Account"
              onSuccess={onPlaidSuccess}
              style={{
                width: '100%', justifyContent: 'center',
                padding: '14px 20px', borderRadius: 12, fontSize: 14,
                background: 'linear-gradient(135deg, #0a3fa8, #4da3ff)',
                boxShadow: '0 4px 16px rgba(10,63,168,0.2)',
              }}
            />
            <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 5 }}>
              Banks, brokerages &amp; credit cards — syncs automatically
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--t-border)' }} />
            <span style={{ fontSize: 11, color: 'var(--t-text-tertiary)', fontWeight: 600, letterSpacing: '0.06em' }}>OR ADD MANUALLY</span>
            <div style={{ flex: 1, height: 1, background: 'var(--t-border)' }} />
          </div>

          {/* Manual options side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              onClick={() => setAssetOpen(true)}
              style={{
                padding: '13px 16px', borderRadius: 12,
                border: '1px solid var(--t-border)',
                background: 'var(--t-inner-box-bg)',
                color: 'var(--t-text-primary)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#4da3ff')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--t-border)')}
            >
              <span style={{ fontSize: 22 }}>📈</span>
              Add Asset
              <span style={{ fontSize: 11, color: 'var(--t-text-tertiary)', fontWeight: 400 }}>
                Real estate, vehicles, cash
              </span>
            </button>

            <button
              onClick={() => setLiabilityOpen(true)}
              style={{
                padding: '13px 16px', borderRadius: 12,
                border: '1px solid var(--t-border)',
                background: 'var(--t-inner-box-bg)',
                color: 'var(--t-text-primary)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--t-border)')}
            >
              <span style={{ fontSize: 22 }}>📉</span>
              Add Liability
              <span style={{ fontSize: 11, color: 'var(--t-text-tertiary)', fontWeight: 400 }}>
                Loans, mortgages, debt
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
