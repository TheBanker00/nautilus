'use client';

import React, { useState, useRef, useEffect } from 'react';

/* ─────────────────────────────────────────────────────────────
   RESPONSE ENGINE
   Pure keyword matching — no API calls.
   To add Claude later: if confidence === 'low', hit the API.
───────────────────────────────────────────────────────────── */
interface BotResponse {
  text: string;
  chips?: string[];          // follow-up quick replies
  cta?: { label: string; href: string };
}

const RESPONSES: { keywords: string[]; response: BotResponse }[] = [
  {
    keywords: ['what is nautilus', 'what does nautilus do', 'how does it work', 'tell me about', 'explain'],
    response: {
      text: "Nautilus is your personal financial command center. It connects all your accounts in one place — bank, investments, retirement, real estate — and gives you a live Nautilus Score, cash flow analysis, AI-powered insights, and net worth tracking. Think of it as the financial dashboard your bank should have built.",
      chips: ['Pricing', 'Is my data safe?', 'What accounts are supported?'],
      cta: { label: 'See how it works →', href: '/landingpage/features' },
    },
  },
  {
    keywords: ['cost', 'price', 'pricing', 'how much', 'plans', 'early adopter', 'discount'],
    response: {
      text: "Nautilus is available through a paid subscription with both monthly and annual plans. As a thank-you to early adopters, we're offering 50% off for a limited time. Visit our Pricing page for current plans and eligibility.",
      chips: ['Do you offer a free trial?', 'Can I cancel anytime?', 'Why is it a paid subscription?'],
      cta: { label: 'View pricing →', href: '/landingpage/pricing' },
    },
  },
  {
    keywords: ['free trial', 'trial', 'try', 'test', 'demo', 'beta'],
    response: {
      text: "Yes — we offer a free 14-day trial so you can explore everything Nautilus has to offer before committing to a plan. No credit card required to get started.",
      chips: ['How much does it cost?', 'How do I sign up?', 'Can I cancel anytime?'],
      cta: { label: 'Start free trial →', href: '/landingpage/signup' },
    },
  },
  {
    keywords: ['why paid', 'why subscription', 'why not free', 'why charge', 'ads', 'advertising'],
    response: {
      text: "We built Nautilus to provide powerful financial analytics, AI-driven insights, and a secure, ad-free experience. Our subscription model lets us focus on tools that help you make better financial decisions — not on selling advertising or promoting financial products.",
      chips: ['How much does it cost?', 'Do you offer a free trial?', 'What is Nautilus?'],
    },
  },
  {
    keywords: ['cancel', 'cancellation', 'refund', 'stop subscription', 'unsubscribe', 'end my plan', 'cancel anytime'],
    response: {
      text: "Yes — you can cancel at any time. Your access stays active through the end of your current billing period and you won't be charged again after that. For example, if your plan renews on the 1st and you cancel on the 15th, you keep access through the end of the month. Annual plans work the same way.",
      chips: ['Pricing', 'How do I sign up?', 'What is Nautilus?'],
    },
  },
  {
    keywords: ['sign up', 'get started', 'join', 'create account', 'register', 'start'],
    response: {
      text: "Getting started takes about 2 minutes. Enter your email, set a password, and connect your first account. We'll generate your Nautilus Score the moment your data loads.",
      chips: ['Pricing', 'Is my data safe?', 'What accounts are supported?'],
      cta: { label: 'Create my account →', href: '/landingpage/signup' },
    },
  },
  {
    keywords: ['safe', 'security', 'secure', 'privacy', 'data', 'plaid', 'encrypt', 'hack', 'trust', 'protect'],
    response: {
      text: "Security is our highest priority. Account connections use Plaid — the same bank-grade infrastructure used by Venmo, Cash App, and Coinbase. We never see or store your banking credentials. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We don't sell your data — ever.",
      chips: ['What is Plaid?', 'What accounts are supported?', 'Pricing'],
      cta: { label: 'Read our security page →', href: '/landingpage/security' },
    },
  },
  {
    keywords: ['plaid', 'what is plaid', 'how do you connect'],
    response: {
      text: "Plaid is the industry-standard bank connection layer used by thousands of financial apps. When you connect an account, Plaid handles the authentication directly with your bank — Nautilus never sees your login credentials. Plaid is trusted by over 9,000 financial apps including Venmo, Cash App, and SoFi.",
      chips: ['Does Nautilus store my login?', 'Is my data safe?', 'What accounts are supported?'],
    },
  },
  {
    keywords: ['store my bank', 'store my login', 'store my password', 'store credentials', 'see my password', 'see my login', 'access my login', 'login credentials', 'bank credentials', 'bank password', 'username and password'],
    response: {
      text: "No — Nautilus never sees, stores, or has access to your bank login credentials. When you connect an account, the login is handled entirely through Plaid, a secure connection layer used by more than 9,000 financial apps including Venmo, Cash App, and SoFi. Your credentials go directly to your bank through Plaid — Nautilus is never in that loop.",
      chips: ['What is Plaid?', 'Is my data safe?', 'What accounts are supported?'],
      cta: { label: 'Read our security page →', href: '/landingpage/security' },
    },
  },
  {
    keywords: ['accounts', 'banks', 'supported', 'connect', 'which banks', 'fidelity', 'chase', 'bofa', 'vanguard', 'schwab', 'wells fargo', 'credit union', 'brokerage', 'investment', '401k', 'retirement'],
    response: {
      text: "Nautilus connects to over 12,000 financial institutions via Plaid — including Chase, Bank of America, Wells Fargo, Fidelity, Vanguard, Schwab, and most credit unions. We support checking, savings, credit cards, investment accounts, 401(k)s, and IRAs. You can also manually add real estate and other assets.",
      chips: ['How do I connect an account?', 'Is my data safe?', 'Pricing'],
      cta: { label: 'Get started →', href: '/landingpage/signup' },
    },
  },
  {
    keywords: ['connect an account', 'how do i connect', 'link my bank', 'add account'],
    response: {
      text: "After signing up, you'll go through a quick onboarding flow where you connect your accounts using Plaid. It takes about 60 seconds per account — you search for your institution, log in securely, and Nautilus pulls your data automatically.",
      chips: ['What accounts are supported?', 'Is my data safe?', 'What is Nautilus?'],
      cta: { label: 'Create my account →', href: '/landingpage/signup' },
    },
  },
  {
    keywords: ['mint', 'ynab', 'personal capital', 'choose', 'select', 'company', 'pick', 'separate', 'empower', 'copilot', 'monarch', 'rocket money', 'different', 'better', 'compare', 'vs', 'versus', 'alternative'],
    response: {
      text: "Most apps answer one question: \"Where did my money go?\" Nautilus answers a much broader set — how healthy is my financial position? Am I building wealth efficiently? Is my debt helping or hurting me? Am I on track for retirement? What should I focus on next? It's built for people who want to build financial independence, not just track spending.",
      chips: ['What is the Nautilus Score?', 'Pricing', 'What accounts are supported?'],
      cta: { label: 'See all features →', href: '/landingpage/features' },
    },
  },
  {
    keywords: ['nautilus score', 'score', 'grade', 'rating', 'health score', 'financial health'],
    response: {
      text: "The Nautilus Score is a 0–100 financial health grade across 8 components: cash flow, emergency fund, debt-to-income, savings rate, net worth trajectory, investment diversification, retirement pace, and debt-to-asset ratio. Each is age-adjusted — so a 28-year-old and a 58-year-old are measured against the right benchmarks for their life stage.",
      chips: ['How is my score calculated?', 'Pricing', 'What is Nautilus?'],
      cta: { label: 'See how it works →', href: '/landingpage/features' },
    },
  },
  {
    keywords: ['ai insights', 'insights', 'analysis', 'recommendations', 'alerts', 'warnings'],
    response: {
      text: "The AI Insights page runs a rules engine across your transactions, income, subscriptions, and net worth — flagging issues like high debt-to-asset ratios, income volatility, subscription overlap, and budget overruns. It also highlights wins. When we add Claude AI, the same engine feeds it context for deeper, conversational analysis.",
      chips: ['What is the Nautilus Score?', 'What accounts are supported?', 'Pricing'],
    },
  },
  {
    keywords: ['contact', 'support', 'help', 'question', 'human', 'person', 'talk', 'email', 'reach'],
    response: {
      text: "You can reach our support team directly at support@nautilusmoney.com. We're a small team and respond quickly — usually within a few hours on weekdays.",
      chips: ['Pricing', 'How do I sign up?', 'What is Nautilus?'],
      cta: { label: 'Email support →', href: 'mailto:support@nautilusmoney.com' },
    },
  },
  {
    keywords: ['billing', 'billed', 'charge', 'invoice', 'monthly', 'annual', 'yearly', 'subscription billing'],
    response: {
      text: "Billing is processed securely through Stripe, one of the most trusted payment platforms used by thousands of SaaS products. Monthly subscribers are billed each month on their renewal date. Annual subscribers are billed once per year and save compared to the monthly rate.",
      chips: ['What payment methods do you accept?', 'Can I cancel anytime?', 'Pricing'],
    },
  },
  {
    keywords: ['payment', 'pay', 'credit card', 'apple pay', 'venmo', 'how do i pay', 'payment method'],
    response: {
      text: "We currently accept all major credit and debit cards through Stripe. Apple Pay is coming soon, and Venmo support is planned for a future update.",
      chips: ['How does billing work?', 'Can I cancel anytime?', 'Pricing'],
    },
  },
  {
    keywords: ['mobile app', 'app', 'iphone', 'android', 'ios', 'google play', 'app store', 'phone'],
    response: {
      text: "A Nautilus Money mobile app is in the works for both the Apple App Store and Google Play Store. We'll announce when it's available — stay tuned!",
      chips: ['What is Nautilus?', 'How do I sign up?', 'Is my data safe?'],
    },
  },
  {
    keywords: ['locked', 'blocked', 'forgot', 'reset password', 'can\'t log in', 'lost access', 'account access', 'forgot password'],
    response: {
      text: "If you can't access your account, click the \"Forgot your password?\" link on the sign-in page to reset it via email. If you're still having trouble, reach out to our support team and we'll get you back in.",
      chips: ['How do I contact support?', 'How do I sign up?'],
    },
  },
  {
    keywords: ['privacy', 'sell my data', 'data policy', 'gdpr', 'ccpa'],
    response: {
      text: "We do not sell, rent, or share your personal financial data with third parties for advertising — ever. You can request a full export or deletion of your data at any time. Full details are in our Privacy Policy.",
      chips: ['Is my data safe?', 'What is Nautilus?'],
      cta: { label: 'Read our Privacy Policy →', href: '/landingpage/privacy' },
    },
  },
];

const FALLBACK: BotResponse = {
  text: "I'm not programmed to answer that question. For further assistance, please contact our support team at support@nautilusmoney.com.",
  chips: ['What is Nautilus?', 'Pricing', 'Is my data safe?', 'Contact support'],
  cta: { label: 'Email support →', href: 'mailto:support@nautilusmoney.com' },
};

const GREETING: BotResponse = {
  text: "Hi there 👋 I'm Navi, Nautilus's assistant. What can I help you with today?",
  chips: ['What is Nautilus?', 'Pricing', 'Is my data safe?', 'How do I sign up?'],
};

function matchResponse(input: string): BotResponse {
  const lower = input.toLowerCase();
  let best: { response: BotResponse; hits: number } | null = null;

  for (const entry of RESPONSES) {
    const hits = entry.keywords.filter(kw => lower.includes(kw)).length;
    if (hits > 0 && (!best || hits > best.hits)) {
      best = { response: entry.response, hits };
    }
  }

  return best?.response ?? FALLBACK;
}

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface Message {
  id: string;
  from: 'bot' | 'user';
  text: string;
  chips?: string[];
  cta?: { label: string; href: string };
}

/* ─────────────────────────────────────────────────────────────
   WIDGET
───────────────────────────────────────────────────────────── */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Greet on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ id: 'greeting', from: 'bot', ...GREETING }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), from: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Simulate a short typing delay for realism
    setTimeout(() => {
      const response = matchResponse(text);
      const botMsg: Message = { id: (Date.now() + 1).toString(), from: 'bot', ...response };
      setMessages(prev => [...prev, botMsg]);
      setTyping(false);
    }, 600);
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: 'fixed', bottom: 88, right: 24, zIndex: 1000,
            width: 360, maxHeight: 520,
            display: 'flex', flexDirection: 'column',
            background: 'linear-gradient(180deg, #0D1C30 0%, #0B1A2D 100%)',
            border: '1px solid rgba(77,163,255,0.22)',
            borderRadius: 20,
            boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid rgba(77,163,255,0.12)',
            background: 'rgba(10,30,55,0.8)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/sexton logo 4.png"
                alt="Navi"
                style={{ width: 34, height: 34, borderRadius: 8, display: 'block', flexShrink: 0 }}
              />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#F0F4FF' }}>Navi</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
                  <span style={{ fontSize: 11, color: '#7A90B8' }}>Nautilus Assistant</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#7A90B8', fontSize: 20, lineHeight: 1, padding: 4,
                borderRadius: 8,
              }}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px 14px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {messages.map(msg => (
              <div key={msg.id}>
                {/* Bubble */}
                <div style={{
                  display: 'flex',
                  justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '82%',
                    padding: '10px 14px',
                    borderRadius: msg.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.from === 'user'
                      ? 'linear-gradient(135deg, #0a3fa8, #4DA3FF)'
                      : 'rgba(255,255,255,0.06)',
                    border: msg.from === 'user' ? 'none' : '1px solid rgba(77,163,255,0.12)',
                    fontSize: 13.5, color: '#E8F0FF', lineHeight: 1.55,
                  }}>
                    {msg.text}
                  </div>
                </div>

                {/* CTA button */}
                {msg.cta && (
                  <div style={{ marginTop: 8, paddingLeft: 4 }}>
                    <a
                      href={msg.cta.href}
                      style={{
                        display: 'inline-block', fontSize: 12, fontWeight: 700,
                        padding: '7px 14px', borderRadius: 20,
                        background: 'rgba(46,211,198,0.1)',
                        border: '1px solid rgba(46,211,198,0.35)',
                        color: '#2ED3C6', textDecoration: 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      {msg.cta.label}
                    </a>
                  </div>
                )}

                {/* Quick-reply chips */}
                {msg.chips && (
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 6,
                    marginTop: 8, paddingLeft: 4,
                  }}>
                    {msg.chips.map(chip => (
                      <button
                        key={chip}
                        onClick={() => sendMessage(chip)}
                        style={{
                          fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                          padding: '5px 12px', borderRadius: 20,
                          background: 'transparent',
                          border: '1px solid rgba(77,163,255,0.3)',
                          color: '#4DA3FF',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(77,163,255,0.1)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 16px', borderRadius: '16px 16px 16px 4px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(77,163,255,0.12)',
                  display: 'flex', gap: 4, alignItems: 'center',
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#4DA3FF', opacity: 0.7,
                      animation: 'dot-pulse 1.2s ease-in-out infinite',
                      animationDelay: `${i * 0.2}s`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{
            padding: '12px 14px',
            borderTop: '1px solid rgba(77,163,255,0.1)',
            background: 'rgba(7,17,31,0.6)',
            flexShrink: 0,
          }}>
            <form
              onSubmit={e => { e.preventDefault(); sendMessage(input); }}
              style={{ display: 'flex', gap: 8, alignItems: 'center' }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask me anything…"
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(77,163,255,0.2)',
                  borderRadius: 12, padding: '9px 14px',
                  fontSize: 13, color: '#E8F0FF', outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!input.trim()}
                style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: input.trim() ? 'linear-gradient(135deg, #2ED3C6, #4DA3FF)' : 'rgba(255,255,255,0.06)',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                aria-label="Send"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M13 7L1 1L4.5 7L1 13L13 7Z" fill={input.trim() ? '#07111F' : '#4A6080'} />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bubble toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1001,
          width: 64, height: 64,
          background: 'none', border: 'none', padding: 0,
          cursor: 'pointer',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? (
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(10,20,40,0.92)',
            border: '1px solid rgba(77,163,255,0.3)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2L16 16M16 2L2 16" stroke="#7A90B8" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
        ) : (
          <div style={{ position: 'relative', width: 64, height: 64 }}>
            {/* Circle image */}
            <img
              src="/sexton logo 2.png"
              alt="Chat with Navi"
              style={{
                width: 64, height: 64, borderRadius: '50%', display: 'block',
                boxShadow: '0 4px 24px rgba(46,211,198,0.45)',
                border: '2px solid rgba(46,211,198,0.35)',
              }}
            />
            {/* Gold sparkle — top right */}
            <svg
              width="24" height="24" viewBox="0 0 24 24" fill="none"
              style={{ position: 'absolute', top: -8, right: -8, pointerEvents: 'none' }}
            >
              <path d="M12 2 L13.8 10.2 L22 12 L13.8 13.8 L12 22 L10.2 13.8 L2 12 L10.2 10.2 Z" fill="#F59E0B" />
              <path d="M12 2 L13.8 10.2 L22 12 L13.8 13.8 L12 22 L10.2 13.8 L2 12 L10.2 10.2 Z" fill="#FDE68A" opacity="0.5" style={{ filter: 'blur(4px)' }} />
            </svg>
          </div>
        )}
      </button>
    </>
  );
}
