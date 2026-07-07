'use client';

import React, { useState } from 'react';
import { useFinancialData } from '../../lib/financialdatacontext';
import { useDashboardTheme } from '../../lib/dashboardthemecontext';
import ConnectBankButton from '../ConnectBankButton';

type AssetCategory =
  | 'bankAccounts'
  | 'investmentAccounts'
  | 'retirementAccounts'
  | 'realEstate'
  | 'otherAssets';

const CATEGORY_TYPE_MAP: Record<AssetCategory, { type: string; subtype: string }> = {
  bankAccounts:       { type: 'depository', subtype: 'checking'  },
  investmentAccounts: { type: 'investment', subtype: 'brokerage' },
  retirementAccounts: { type: 'investment', subtype: '401k'      },
  realEstate:         { type: 'realestate', subtype: 'primary residence' },
  otherAssets:        { type: 'other',      subtype: 'other'     },
};

const PROPERTY_TYPES = [
  { label: 'Primary Residence',      subtype: 'primary residence'    },
  { label: 'Second Home / Vacation', subtype: '2nd home'             },
  { label: 'Investment / Rental',    subtype: 'investment property'  },
  { label: 'Rental Property',        subtype: 'rental property'      },
];

const OTHER_ASSET_TYPES = [
  { label: 'Automobile',         subtype: 'automobile'        },
  { label: 'Art',                subtype: 'art'               },
  { label: 'Jewelry',            subtype: 'jewelry'           },
  { label: 'Collectibles',       subtype: 'collectibles'      },
  { label: 'Cryptocurrency',     subtype: 'crypto_wallet'     },
  { label: 'Business Ownership', subtype: 'Business Ownership'},
  { label: 'Other',              subtype: 'other'             },
];

type AddAssetModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AddAssetModal({ open, onClose }: AddAssetModalProps) {
  const { addManualAsset } = useFinancialData();
  const { T } = useDashboardTheme();
  const isDark = T.isDark;

  const [step, setStep] = useState<'choice' | 'manual'>('choice');
  const [assetCategory, setAssetCategory] = useState<AssetCategory>('bankAccounts');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    institution: '',
    name: '',
    value: '',
    otherSubtype: 'other',
    address: '',
    propertyType: 'primary residence',
  });

  if (!open) return null;

  // ── CHOICE SCREEN ──────────────────────────────────────────
  if (step === 'choice') {
    return (
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: 420,
            background: 'var(--t-surface)',
            borderRadius: 20,
            padding: '28px 28px 24px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
            border: '1px solid var(--t-border)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #0a3fa8, #4da3ff, #0a3fa8, transparent)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-text-primary)', marginBottom: 4 }}>Add Asset</div>
              <div style={{ fontSize: 13, color: 'var(--t-text-tertiary)' }}>How would you like to add this account?</div>
            </div>
            <button onClick={onClose} style={{ background: 'var(--t-inner-box-bg)', border: '1px solid var(--t-inner-box-border)', borderRadius: 8, color: 'var(--t-text-tertiary)', width: 30, height: 30, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>

          {/* Plaid option */}
          <div style={{ marginBottom: 12 }}>
            <ConnectBankButton
              label="🏦  Connect with Plaid"
              onSuccess={onClose}
              style={{
                width: '100%', justifyContent: 'flex-start', gap: 12,
                padding: '18px 20px', borderRadius: 14, fontSize: 14,
                background: 'linear-gradient(135deg, #0a3fa8, #4da3ff)',
                boxShadow: '0 4px 16px rgba(10,63,168,0.25)',
              }}
            />
            <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 6, paddingLeft: 4 }}>
              Banks, brokerages, credit cards — balances sync automatically
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--t-border)' }} />
            <span style={{ fontSize: 11, color: 'var(--t-text-tertiary)', fontWeight: 600, letterSpacing: '0.06em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--t-border)' }} />
          </div>

          {/* Manual option */}
          <div>
            <button
              onClick={() => setStep('manual')}
              style={{
                width: '100%', padding: '18px 20px', borderRadius: 14,
                border: '1px solid var(--t-border)',
                background: 'var(--t-inner-box-bg)',
                color: 'var(--t-text-primary)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'all 0.15s ease', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 20 }}>✏️</span>
              Add Manually
            </button>
            <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)', marginTop: 6, paddingLeft: 4 }}>
              Real estate, vehicles, crypto, collectibles &amp; other assets
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const numericValue = Number(form.value);
    if (!form.name || !numericValue) {
      alert('Please complete required fields');
      return;
    }
    const { type } = CATEGORY_TYPE_MAP[assetCategory];
    const subtype =
      assetCategory === 'realEstate'  ? form.propertyType  :
      assetCategory === 'otherAssets' ? form.otherSubtype  :
      CATEGORY_TYPE_MAP[assetCategory].subtype;
    setSaving(true);
    try {
      await addManualAsset({
        name: form.name,
        category: assetCategory,
        balance: numericValue,
        institution: form.institution || undefined,
        address: assetCategory === 'realEstate' ? form.address : undefined,
        type,
        subtype,
      });
      setStep('choice');
      setForm({ institution: '', name: '', value: '', otherSubtype: 'other', address: '', propertyType: 'primary residence' });
      onClose();
    } catch (err: any) {
      alert(err.message ?? 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 520,
          background: 'var(--t-surface)',
          borderRadius: 20,
          padding: '28px 32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
          border: '1px solid var(--t-border)',
          position: 'relative',
          overflow: 'hidden',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #0a3fa8, #4da3ff, #0a3fa8, transparent)',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setStep('choice')}
              title="Back"
              style={{ background: 'var(--t-inner-box-bg)', border: '1px solid var(--t-inner-box-border)', borderRadius: 8, color: 'var(--t-text-tertiary)', width: 30, height: 30, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >‹</button>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-text-primary)', marginBottom: 2 }}>Add Manual Asset</div>
              <div style={{ fontSize: 12, color: 'var(--t-text-tertiary)' }}>Track an asset not connected via Plaid</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'var(--t-inner-box-bg)', border: '1px solid var(--t-inner-box-border)', borderRadius: 8, color: 'var(--t-text-tertiary)', width: 30, height: 30, cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >×</button>
        </div>

        <Field label="Asset Category">
          <select
            value={assetCategory}
            onChange={e => setAssetCategory(e.target.value as AssetCategory)}
            style={getInputStyle(isDark)}
          >
            <option value="bankAccounts">Cash / Bank Account</option>
            <option value="investmentAccounts">Investment</option>
            <option value="retirementAccounts">Retirement</option>
            <option value="realEstate">Real Estate</option>
            <option value="otherAssets">Other Assets</option>
          </select>
        </Field>

        <Field label="Institution">
          <input
            name="institution"
            value={form.institution}
            onChange={handleChange}
            placeholder="e.g. Fidelity"
            style={getInputStyle(isDark)}
          />
        </Field>

        <Field label="Account / Asset Name *">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Primary Brokerage"
            style={getInputStyle(isDark)}
          />
        </Field>


        <Field label="Value / Balance ($) *">
          <input
            type="number"
            name="value"
            value={form.value}
            onChange={handleChange}
            placeholder="0"
            style={getInputStyle(isDark)}
          />
        </Field>

        {assetCategory === 'realEstate' && (
          <>
            <Field label="Property Type">
              <select
                name="propertyType"
                value={form.propertyType}
                onChange={handleChange}
                style={getInputStyle(isDark)}
              >
                {PROPERTY_TYPES.map(p => (
                  <option key={p.subtype} value={p.subtype}>{p.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Property Address">
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="123 Main St, City, State"
                style={getInputStyle(isDark)}
              />
            </Field>
          </>
        )}

        {assetCategory === 'otherAssets' && (
          <Field label="Asset Type">
            <select name="otherSubtype" value={form.otherSubtype} onChange={handleChange} style={getInputStyle(isDark)}>
              {OTHER_ASSET_TYPES.map(o => (
                <option key={o.subtype} value={o.subtype} style={{ background: isDark ? '#1a2a4a' : '#fff', color: isDark ? '#e8edf5' : '#111827' }}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 28 }}>
          <button
            onClick={onClose}
            style={{
              padding: '11px 20px',
              background: 'var(--t-inner-box-bg)',
              border: '1px solid var(--t-inner-box-border)',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              color: 'var(--t-text-secondary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: '11px 24px',
              background: 'linear-gradient(135deg, #0a3fa8, #4da3ff 60%, #0891B2)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: 13,
              opacity: saving ? 0.7 : 1,
              boxShadow: '0 4px 16px rgba(10,63,168,0.25)',
            }}
          >
            {saving ? 'Saving…' : 'Save Asset'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6, color: 'var(--t-text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function getInputStyle(isDark: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #d7dce5',
    fontSize: 14,
    outline: 'none',
    background: isDark ? '#1a2a4a' : '#f4f7fb',
    color: isDark ? '#e8edf5' : '#111827',
    boxSizing: 'border-box',
  };
}
