'use client';

import React, { useState } from 'react';
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const T = {
  gold:       '#2ED3C6',
  accent:     '#4DA3FF',
  muted:      '#7A9BB5',
  text:       '#C8D8EC',
  textDim:    '#7A90B8',
  bg:         '#07111F',
  bg2:        '#0D1E30',
  bg3:        '#122338',
  border:     'rgba(77,163,255,0.12)',
  borderGold: 'rgba(46,211,198,0.2)',
};

const FAQS: { category: string; questions: { q: string; a: string }[] }[] = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'What is Nautilus?',
        a: 'Nautilus is your personal financial command center. It connects all your accounts in one place — bank, investments, retirement, real estate — and gives you a live Nautilus Score, cash flow analysis, AI-powered insights, and net worth tracking. Think of it as the financial dashboard your bank should have built.',
      },
      {
        q: 'How do I sign up?',
        a: 'Getting started takes about 2 minutes. Enter your email, set a password, and connect your first account. We\'ll generate your Nautilus Score the moment your data loads.',
      },
      {
        q: 'How is Nautilus different from Rocket Money, Mint, or Monarch?',
        a: 'Most personal finance apps answer one question: "Where did my money go?" Nautilus is designed to not only tell you where your money went but also answer a much broader set of questions:\n\n• How healthy is my financial position?\n• Am I building wealth efficiently?\n• How much equity am I creating?\n• Is my debt helping or hurting me?\n• Am I on track for retirement?\n• How is my financial health changing over time?\n• What should I focus on next?',
      },
    ],
  },
  {
    category: 'Pricing',
    questions: [
      {
        q: 'How much does Nautilus cost?',
        a: 'Nautilus is available through a paid subscription that gives you access to all core features, AI-powered insights, advanced financial analytics, and continuous product improvements. Pricing is simple and transparent, with both monthly and annual plans available.\n\nAs a thank-you to our early adopters, we\'re offering 50% off for a limited time. Visit our Pricing page for current plans, features, and eligibility.',
      },
      {
        q: 'Do you offer a free trial?',
        a: 'Yes — we offer a free 14-day trial so you can explore everything Nautilus has to offer before committing to a plan. No credit card required to get started.',
      },
      {
        q: 'Why is Nautilus a paid subscription?',
        a: 'We built Nautilus to provide powerful financial analytics, AI-driven insights, and a secure, ad-free experience. Our subscription model allows us to focus on building tools that help you make better financial decisions — not on selling advertising or promoting financial products.',
      },
      {
        q: 'Can I cancel my subscription at any time?',
        a: 'Yes. You can cancel your subscription at any time, and your access will remain active until the end of your current billing period. After that, your subscription will end and you won\'t be charged again.\n\nFor example, if you\'re on a monthly plan that renews on the 1st and you cancel on the 15th, you\'ll continue to have access through the end of the month. Annual plans work the same way — you\'ll keep access through the end of your paid subscription term.',
      },
    ],
  },
  {
    category: 'Security & Privacy',
    questions: [
      {
        q: 'Does Nautilus store my bank login credentials?',
        a: 'No — Nautilus never sees, stores, or has access to your bank login credentials. When you connect an account, the login is handled entirely through Plaid, a secure connection layer used by more than 9,000 financial apps including Venmo, Cash App, and SoFi. Your credentials go directly to your bank through Plaid — Nautilus is never in that loop.',
      },
      {
        q: 'Is my data safe?',
        a: 'Security is non-negotiable for us. Account connections use Plaid — the same bank-grade infrastructure used by Venmo, Cash App, and SoFi. We never see or store your banking credentials. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We don\'t sell your data — ever.',
      },
      {
        q: 'What is Plaid?',
        a: 'Plaid is the industry-standard bank connection layer used by thousands of financial apps. When you connect an account, Plaid handles the authentication directly with your bank — Nautilus never sees your login credentials. Plaid is trusted by over 9,000 financial apps including Venmo, Cash App, and SoFi.',
      },
      {
        q: 'Does Nautilus sell my data?',
        a: 'We do not sell, rent, or share your personal financial data with third parties for advertising — ever. You can request a full export or deletion of your data at any time. Full details are in our Privacy Policy.',
      },
    ],
  },
  {
    category: 'Connecting Accounts',
    questions: [
      {
        q: 'What banks and accounts are supported?',
        a: 'Nautilus connects to over 12,000 financial institutions via Plaid — including Chase, Bank of America, Wells Fargo, Fidelity, Vanguard, Schwab, and most credit unions. We support checking, savings, credit cards, investment accounts, 401(k)s, and IRAs. You can also manually add real estate and other assets.',
      },
      {
        q: 'How do I connect an account?',
        a: 'After signing up, you\'ll go through a quick onboarding flow where you connect your accounts using Plaid. It takes about 60 seconds per account — you search for your institution, log in securely, and Nautilus pulls your data automatically.',
      },
    ],
  },
  {
    category: 'Features',
    questions: [
      {
        q: 'What is the Nautilus Score?',
        a: 'The Nautilus Score is a 0–100 financial health grade across 8 components: cash flow, emergency fund, debt-to-income, savings rate, net worth trajectory, investment diversification, retirement pace, and debt-to-asset ratio. Each is age-adjusted — so a 28-year-old and a 58-year-old are measured against the right benchmarks for their life stage.',
      },
      {
        q: 'What are AI Insights?',
        a: 'The AI Insights page runs a rules engine across your transactions, income, subscriptions, and net worth — flagging issues like high debt-to-asset ratios, income volatility, subscription overlap, and budget overruns. It also highlights wins. When we add Claude AI, the same engine feeds it context for deeper, conversational analysis.',
      },
    ],
  },
  {
    category: 'Support',
    questions: [
      {
        q: 'How do I contact support?',
        a: 'For support during our beta, you can reach us directly at support@nautilusmoney.com. We\'re a small team and respond quickly — usually within a few hours on weekdays.',
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        borderBottom: `1px solid ${T.border}`,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none',
          cursor: 'pointer', padding: '20px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: open ? T.gold : T.text, lineHeight: 1.4, transition: 'color 0.2s' }}>
          {q}
        </span>
        <span style={{
          flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
          border: `1px solid ${open ? T.borderGold : T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: open ? T.gold : T.muted, fontSize: 16, lineHeight: 1,
          transition: 'all 0.2s',
        }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div style={{ fontSize: 15, color: T.muted, lineHeight: 1.75, paddingBottom: 20, paddingRight: 40 }}>
          {a.split('\n').map((line, i) =>
            line.startsWith('•') ? (
              <div key={i} style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <span style={{ color: T.gold, flexShrink: 0 }}>•</span>
                <span>{line.slice(1).trim()}</span>
              </div>
            ) : line.trim() === '' ? (
              <div key={i} style={{ height: 8 }} />
            ) : (
              <p key={i} style={{ margin: '0 0 4px' }}>{line}</p>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <main style={{ background: T.bg, color: T.text, minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <section style={{ padding: '80px 5vw 60px', textAlign: 'center', maxWidth: 952, margin: '0 auto' }}>
        <div style={{
          display: 'inline-block', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: T.gold, border: `1px solid ${T.borderGold}`,
          padding: '5px 14px', borderRadius: 20, marginBottom: 20,
        }}>
          FAQ
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: '#F0F4FF', lineHeight: 1.15, margin: '0 0 16px' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ fontSize: 17, color: T.muted, lineHeight: 1.7, margin: 0 }}>
          Everything you need to know about Nautilus. Can't find your answer?{' '}
          <a href="mailto:support@nautilusmoney.com" style={{ color: T.accent, textDecoration: 'none', fontWeight: 600 }}>
            Email us
          </a>.
        </p>
      </section>

      {/* FAQ sections */}
      <section style={{ padding: '0 5vw 100px', maxWidth: 1032, margin: '0 auto' }}>
        {FAQS.map(section => (
          <div key={section.category} style={{ marginBottom: 52 }}>
            {/* Category label */}
            <div style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: T.gold, marginBottom: 4,
            }}>
              {section.category}
            </div>
            <div style={{ borderTop: `1px solid ${T.border}` }}>
              {section.questions.map(item => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}

        {/* Still have questions CTA */}
        <div style={{
          marginTop: 20, padding: '32px 36px', borderRadius: 16,
          background: 'rgba(77,163,255,0.05)',
          border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#F0F4FF', marginBottom: 6 }}>
              Still have questions?
            </div>
            <div style={{ fontSize: 14, color: T.muted }}>
              Our team typically responds within a few hours on weekdays.
            </div>
          </div>
          <a
            href="mailto:support@nautilusmoney.com"
            style={{
              padding: '11px 24px', borderRadius: 10, fontWeight: 700,
              fontSize: 14, textDecoration: 'none', flexShrink: 0,
              background: 'linear-gradient(135deg, #2ED3C6, #4DA3FF)',
              color: '#07111F',
            }}
          >
            Contact Support
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
