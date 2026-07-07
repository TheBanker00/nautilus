'use client';

import React, { useState } from 'react';
import { useFinancialData } from '../../lib/financialdatacontext';
import ConnectBankButton from '../ConnectBankButton';

type LiabilityCategory =
  | 'mortgage'
  | 'creditCard'
  | 'auto'
  | 'studentLoan'
  | 'other';

const CATEGORY_TYPE_MAP: Record<LiabilityCategory, { type: string; subtype: string }> = {
  mortgage:    { type: 'loan',   subtype: 'mortgage' },
  creditCard:  { type: 'credit', subtype: 'credit card' },
  auto:        { type: 'loan',   subtype: 'auto' },
  studentLoan: { type: 'loan',   subtype: 'student' },
  other:       { type: 'loan',   subtype: 'other' },
};

const categoryColors: Record<LiabilityCategory, { bg: string; border: string; accent: string }> = {
  mortgage:    { bg: '#fef2f2', border: '#fecaca', accent: '#b91c1c' },
  creditCard:  { bg: '#fff1f2', border: '#fbcfe8', accent: '#e11d48' },
  auto:        { bg: '#fff7ed', border: '#fdba74', accent: '#ea580c' },
  studentLoan: { bg: '#f5f3ff', border: '#c4b5fd', accent: '#7c3aed' },
  other:       { bg: '#f8fafc', border: '#cbd5e1', accent: '#475569' },
};

const SNAPSHOT_KEY_TO_CATEGORY: Record<string, LiabilityCategory> = {
  mortgage:    'mortgage',
  creditCard:  'creditCard',
  auto:        'auto',
  studentLoan: 'studentLoan',
  other:       'other',
};

export type LiabilityInitial = {
  accountId: string;
  category: string;
  name: string;
  institution?: string;
  owner?: string;
  amount: number;
  interestRate?: number;
  minimumPayment?: number;
  remainingTermMonths?: number;
};

type AddLiabilityModalProps = {
  onClose: () => void;
  initial?: LiabilityInitial;
};

export default function AddLiabilityModal({ onClose, initial }: AddLiabilityModalProps) {
  const { addManualLiability, updateManualLiability } = useFinancialData();
  const isEdit = !!initial;

  // Skip choice screen when editing an existing liability
  const [step, setStep] = useState<'choice' | 'manual'>(isEdit ? 'manual' : 'choice');

  const [category, setCategory] = useState<LiabilityCategory>(
    initial ? (SNAPSHOT_KEY_TO_CATEGORY[initial.category] ?? 'other') : 'mortgage'
  );
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    institution:         initial?.institution ?? '',
    name:                initial?.name ?? '',
    owner:               initial?.owner ?? 'Client',
    amount:              initial?.amount != null ? String(initial.amount) : '',
    interestRate:        initial?.interestRate != null ? String(initial.interestRate) : '',
    minimumPayment:      initial?.minimumPayment != null ? String(initial.minimumPayment) : '',
    remainingTermMonths: initial?.remainingTermMonths != null ? String(initial.remainingTermMonths) : '',
  });

  const theme = categoryColors[category];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.name || !form.amount) {
      alert('Please complete required fields');
      return;
    }

    const { type, subtype } = CATEGORY_TYPE_MAP[category];
    const payload = {
      name:                form.name,
      category,
      amount:              Number(form.amount),
      owner:               form.owner,
      institution:         form.institution || undefined,
      interestRate:        form.interestRate ? Number(form.interestRate) : undefined,
      minimumPayment:      form.minimumPayment ? Number(form.minimumPayment) : undefined,
      remainingTermMonths: form.remainingTermMonths ? Number(form.remainingTermMonths) : undefined,
      type,
      subtype,
    };

    setSaving(true);
    try {
      if (isEdit && initial) {
        await updateManualLiability(initial.accountId, payload);
      } else {
        await addManualLiability(payload);
      }
      setStep('choice');
      onClose();
    } catch (err: any) {
      alert(err.message ?? 'Failed to save liability');
    } finally {
      setSaving(false);
    }
  };

  // ── CHOICE SCREEN ──────────────────────────────────────────
  if (step === 'choice') {
    return (
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ width: 420, background: '#fff', borderRadius: 20, padding: '28px 28px 24px', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden', position: 'relative' }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #b91c1c, #f87171, #b91c1c, transparent)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Add Liability</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>How would you like to add this account?</div>
            </div>
            <button onClick={onClose} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, color: '#64748b', width: 30, height: 30, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
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
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, paddingLeft: 4 }}>
              Credit cards, mortgages, auto &amp; student loans — balances sync automatically
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {/* Manual option */}
          <div>
            <button
              onClick={() => setStep('manual')}
              style={{ width: '100%', padding: '18px 20px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s ease', textAlign: 'left' }}
            >
              <span style={{ fontSize: 20 }}>✏️</span>
              Add Manually
            </button>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, paddingLeft: 4 }}>
              Private loans, personal debt &amp; obligations Plaid can't reach
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '760px',
          background: '#ffffff',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: theme.bg,
            borderBottom: `1px solid ${theme.border}`,
            padding: '28px 32px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {!isEdit && (
                <button
                  onClick={() => setStep('choice')}
                  title="Back"
                  style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#64748b', width: 34, height: 34, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >‹</button>
              )}
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: theme.accent,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '8px',
                  }}
                >
                  {isEdit ? 'Edit Liability' : 'Manual Liability'}
                </div>
                <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 800, color: '#0f172a' }}>
                  {isEdit ? 'Update Liability' : 'Add Liability'}
                </h2>
                <div style={{ marginTop: '8px', color: '#64748b', fontSize: '15px' }}>
                  {isEdit ? 'Update the details for this liability' : 'Track loans, credit cards, mortgages, and other obligations'}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: '#fff',
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 700,
                color: '#64748b',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* FORM */}
        <div style={{ padding: '32px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
            }}
          >
            <FieldWrapper label="Liability Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LiabilityCategory)}
                style={inputStyle}
              >
                <option value="mortgage">Mortgage</option>
                <option value="creditCard">Credit Card</option>
                <option value="auto">Auto Loan</option>
                <option value="studentLoan">Student Loan</option>
                <option value="other">Other</option>
              </select>
            </FieldWrapper>

            <FieldWrapper label="Institution">
              <input
                name="institution"
                value={form.institution}
                onChange={handleChange}
                placeholder="Chase, Amex, Wells Fargo..."
                style={inputStyle}
              />
            </FieldWrapper>

            <FieldWrapper label="Liability Name">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Primary Mortgage"
                style={inputStyle}
              />
            </FieldWrapper>

            <FieldWrapper label="Owner">
              <input
                name="owner"
                value={form.owner}
                onChange={handleChange}
                placeholder="Client"
                style={inputStyle}
              />
            </FieldWrapper>

            <FieldWrapper label="Outstanding Balance ($)">
              <input
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                placeholder="12500"
                style={inputStyle}
              />
            </FieldWrapper>

            <FieldWrapper label="Interest Rate (%)">
              <input
                name="interestRate"
                type="number"
                value={form.interestRate}
                onChange={handleChange}
                placeholder="6.25"
                style={inputStyle}
              />
            </FieldWrapper>

            <FieldWrapper label="Minimum Payment ($)">
              <input
                name="minimumPayment"
                type="number"
                value={form.minimumPayment}
                onChange={handleChange}
                placeholder="250"
                style={inputStyle}
              />
            </FieldWrapper>

            <FieldWrapper label="Remaining Term (months)">
              <input
                name="remainingTermMonths"
                type="number"
                value={form.remainingTermMonths}
                onChange={handleChange}
                placeholder="340"
                style={inputStyle}
              />
            </FieldWrapper>
          </div>

          {/* FOOTER */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '36px',
              paddingTop: '24px',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <div style={{ color: '#64748b', fontSize: '14px' }}>
              Liabilities automatically sync into net worth calculations.
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  border: 'none',
                  background: theme.accent,
                  color: '#fff',
                  padding: '12px 22px',
                  borderRadius: '12px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  opacity: saving ? 0.7 : 1,
                  boxShadow: `0 8px 24px ${theme.accent}30`,
                }}
              >
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Liability'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldWrapper({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '14px',
  border: '1px solid #cbd5e1',
  fontSize: '15px',
  outline: 'none',
  background: '#ffffff',
  boxSizing: 'border-box',
};
