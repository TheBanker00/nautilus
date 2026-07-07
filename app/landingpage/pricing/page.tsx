"use client";

import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const T = {
  gold:      '#2ED3C6',
  goldLight: '#67E6D5',
  accent:    '#4DA3FF',
  muted:     '#7A9BB5',
  text:      '#C8D8EC',
  bg:        '#07111F',
  bg2:       '#0D1E30',
  border:    'rgba(77,163,255,0.12)',
  borderMed: 'rgba(77,163,255,0.22)',
  green:     '#4ADE80',
};

/* ── Comparison table cell ── must be module-level to avoid hydration mismatch ── */
function Cell({ val, green, muted }: { val: boolean | string; green: string; muted: string }) {
  if (val === true)  return <span style={{ color: green,           fontSize: '1rem'  }}>✓</span>;
  if (val === false) return <span style={{ color: `${muted}50`,   fontSize: '0.9rem' }}>—</span>;
  return <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#C8D8EC' }}>{val}</span>;
}

/* ── Feature list ── */
type Tier = 'free' | 'premium';

const features: { label: string; free: boolean | string; premium: boolean | string; section?: string }[] = [
  { section: 'Accounts & Sync', label: '', free: false, premium: false },
  { label: 'Manual transaction entry',         free: true,           premium: true },
  { label: 'Manual account tracking',          free: 'Up to 3',      premium: 'Unlimited' },
  { label: 'Plaid bank sync (automatic)',       free: false,          premium: true },
  { label: 'Connected accounts',               free: false,          premium: 'Unlimited' },
  { label: 'Transaction history',              free: '90 days',      premium: 'All time' },
  { label: 'Auto transaction categorization',  free: false,          premium: true },

  { section: 'Insights & Analysis', label: '', free: false, premium: false },
  { label: 'Basic budget tracking',            free: true,           premium: true },
  { label: 'AI-powered insights',              free: false,          premium: true },
  { label: 'Recurring bill detection',         free: false,          premium: true },
  { label: 'Subscription audit',              free: false,          premium: true },
  { label: 'Anomaly & fraud alerts',           free: false,          premium: true },
  { label: 'Cash flow forecasting',            free: false,          premium: true },

  { section: 'Planning Tools', label: '', free: false, premium: false },
  { label: 'Goal tracking',                    free: '1 goal',       premium: 'Unlimited' },
  { label: 'Debt payoff planner',              free: false,          premium: true },
  { label: 'Net worth tracking & trends',      free: false,          premium: true },
  { label: 'Retirement readiness score',       free: false,          premium: true },
  { label: 'Financial freedom projection',     free: false,          premium: true },

  { section: 'Health & Benchmarks', label: '', free: false, premium: false },
  { label: ' Nautilus Score',                  free: false,          premium: true },
  { label: 'Peer benchmarks by income bracket',free: false,          premium: true },
  { label: 'Score history & trend',            free: false,          premium: true },
  { label: 'Improvement action plan',          free: false,          premium: true },
];

const faqs = [
  {
    q: "What does the free plan actually include?",
    a: "Free lets you manually enter transactions and track up to 3 accounts with basic budget categories. It's a genuine starting point — no expiring trial. When you're ready for automatic bank sync and the full feature set, upgrading takes 30 seconds.",
  },
  {
    q: "How does bank connection work on Premium?",
    a: "Nautilius Money uses Plaid to connect your bank accounts. You log in directly with your bank — we never see your credentials. The connection is read-only, meaning Nautilius Money can view your transactions and balances but cannot move money under any circumstance.",
  },
  {
    q: "Do you store my account or routing numbers?",
    a: "No. We deliberately do not request account or routing numbers from Plaid. We use transaction and balance data only. This is an architectural decision, not a policy — the data never flows into our systems.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from Settings at any time and you won't be charged again. Your data remains accessible on the free plan. Annual plans are non-refundable after 14 days but you can cancel renewal at any time.",
  },
  {
    q: "Is there a trial for Premium?",
    a: "Yes — Premium includes a 14-day free trial. Your card is required to start the trial but you won't be charged until day 15. Cancel any time before then and you owe nothing. If you upgrade to annual during your trial you lock in the discounted rate immediately.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit and debit cards via Stripe. Your card details never touch Nautilus servers — Stripe handles all payment processing under PCI DSS Level 1 certification.",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const monthlyPrice     = 6;    // launch promo
  const monthlyRegular   = 12;   // regular price
  const annualPrice      = 50;   // launch promo
  const annualRegular    = 99;   // regular price
  const annualMonthly    = (annualPrice / 12).toFixed(2);  // 4.17
  const annualMonthlyReg = (annualRegular / 12).toFixed(2); // 8.25

  return (
    <main style={{ background: T.bg, color: T.text, minHeight: '100vh' }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{ paddingTop: 120, paddingBottom: 64, textAlign: 'center', paddingLeft: '5vw', paddingRight: '5vw' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', borderRadius: 100, border: `1px solid rgba(46,211,198,0.25)`, background: 'rgba(46,211,198,0.08)', marginBottom: 24 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.gold, display: 'inline-block' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gold }}>Simple Pricing</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>
          Start free. Lock in launch pricing<br />
          <span style={{ color: T.gold }}>before it's gone.</span>
        </h1>
        <p style={{ fontSize: '1.05rem', color: T.muted, lineHeight: 1.75, maxWidth: 540, margin: '0 auto 16px' }}>
          Premium is ${monthlyPrice}/mo during our launch — then ${monthlyRegular}/mo for everyone after the first 100,000 subscribers.
          Lock in the lower rate forever by signing up now.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 100, background: 'rgba(46,211,198,0.1)', border: '1px solid rgba(46,211,198,0.3)', marginBottom: 28 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.gold, display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: T.gold }}>Launch pricing · First 100,000 subscribers only</span>
        </div>

        {/* ── Billing toggle ── */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '6px 8px', borderRadius: 100, background: T.bg2, border: `1px solid ${T.border}` }}>
          <button
            onClick={() => setAnnual(false)}
            style={{ padding: '8px 22px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, transition: 'all 0.2s',
              background: !annual ? T.text : 'transparent',
              color:      !annual ? T.bg   : T.muted,
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            style={{ padding: '8px 22px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8,
              background: annual ? T.text : 'transparent',
              color:      annual ? T.bg   : T.muted,
            }}
          >
            Annual
            <span style={{ padding: '2px 8px', borderRadius: 100, background: T.gold, color: T.bg, fontSize: '0.7rem', fontWeight: 800 }}>
              Save 30%
            </span>
          </button>
        </div>
      </section>

      {/* ── PLAN CARDS ── */}
      <section style={{ padding: '0 5vw 80px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* FREE */}
          <div style={{ background: T.bg2, borderRadius: 20, border: `1px solid ${T.border}`, padding: '36px 36px 32px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, marginBottom: 12 }}>Free</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: '3.2rem', fontWeight: 900, color: T.text, letterSpacing: '-0.04em', lineHeight: 1 }}>$0</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: T.muted, marginBottom: 28, lineHeight: 1.5 }}>
              Forever free. Manual entry only — no bank connection.
            </div>

            <a href="/onboarding" style={{ display: 'block', textAlign: 'center', padding: '13px 0', borderRadius: 12, border: `1.5px solid ${T.borderMed}`, color: T.text, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', marginBottom: 28, transition: 'border-color 0.2s',
            }}>
              Get started free
            </a>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[
                'Manual transaction entry',
                'Up to 3 manual accounts',
                '90-day transaction history',
                'Basic budget tracking',
                '1 savings goal',
              ].map(f => (
                <li key={f} style={{ display: 'flex', gap: 10, fontSize: '0.87rem', color: T.muted }}>
                  <span style={{ color: T.accent, flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
              {[
                'Plaid bank sync',
                'AI insights & alerts',
                'Health score & benchmarks',
                'Debt planner & forecasting',
              ].map(f => (
                <li key={f} style={{ display: 'flex', gap: 10, fontSize: '0.87rem', color: `${T.muted}60`, textDecoration: 'line-through' }}>
                  <span style={{ color: `${T.muted}40`, flexShrink: 0 }}>✕</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* PREMIUM */}
          <div style={{ background: 'linear-gradient(145deg, #0a2d5e 0%, #0D1E30 60%)', borderRadius: 20, border: `1.5px solid rgba(46,211,198,0.35)`, padding: '36px 36px 32px', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 0 60px rgba(46,211,198,0.08)' }}>
            {/* Launch promo badge */}
            <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: T.gold, color: T.bg, padding: '4px 18px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              🚀 Launch Pricing
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gold, marginBottom: 12 }}>Premium</div>

            {/* Promo price with regular struck through */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: '3.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
                ${annual ? annualMonthly : monthlyPrice}
              </span>
              <div style={{ paddingBottom: 10 }}>
                <div style={{ fontSize: '0.9rem', color: T.muted }}>/mo</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(122,155,181,0.6)', textDecoration: 'line-through' }}>
                  ${annual ? annualMonthlyReg : monthlyRegular}/mo
                </div>
              </div>
            </div>

            {/* Promo notice */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, background: 'rgba(46,211,198,0.12)', border: '1px solid rgba(46,211,198,0.3)', marginBottom: 10 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: T.gold }}>
                First 100,000 subscribers lock this price forever
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: T.muted, marginBottom: 8, lineHeight: 1.5 }}>
              {annual
                ? `$${annualPrice}/yr billed annually — regular price $${annualRegular}/yr.`
                : `Billed monthly — regular price $${monthlyRegular}/mo.`}
            </div>
            <div style={{ fontSize: '0.82rem', color: T.muted, marginBottom: 28, lineHeight: 1.5 }}>
              14-day free trial included. Cancel anytime.
            </div>

            <a href="/onboarding" style={{ display: 'block', textAlign: 'center', padding: '13px 0', borderRadius: 12, background: T.gold, color: T.bg, fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none', marginBottom: 28, boxShadow: '0 4px 24px rgba(46,211,198,0.25)', transition: 'background 0.2s' }}>
              Start free trial
            </a>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[
                'Everything in Free',
                'Plaid bank sync — unlimited accounts',
                'Auto transaction categorization',
                'AI-powered insights & anomaly alerts',
                'Recurring & subscription audit',
                'Full Nautilus Score',
                'Peer benchmarks by income bracket',
                'Debt payoff planner',
                'Net worth tracking & trends',
                'Financial freedom projection',
                'Retirement readiness score',
                'Unlimited goals',
                'Full transaction history',
              ].map(f => (
                <li key={f} style={{ display: 'flex', gap: 10, fontSize: '0.87rem', color: T.text }}>
                  <span style={{ color: T.gold, flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

      {/* ── FULL COMPARISON TABLE ── */}
      <section style={{ padding: '0 5vw 80px', maxWidth: 860, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 40 }}>
          Full feature comparison
        </h2>

        <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}` }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', background: T.bg2, padding: '14px 24px', borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Feature</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Free</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: T.gold,  textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Premium</span>
          </div>

          {features.map((f, i) => {
            if (f.section) {
              return (
                <div key={`section-${f.section}`} style={{ padding: '10px 24px 6px', background: `${T.bg2}99`, borderBottom: `1px solid ${T.border}`, fontSize: '0.72rem', fontWeight: 800, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {f.section}
                </div>
              );
            }
            return (
              <div key={`row-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', padding: '13px 24px', borderBottom: i < features.length - 1 ? `1px solid ${T.border}` : 'none', background: i % 2 === 0 ? 'transparent' : `${T.bg2}40` }}>
                <span style={{ fontSize: '0.87rem', color: T.muted }}>{f.label}</span>
                <span style={{ textAlign: 'center' }}><Cell val={f.free}    green={T.green} muted={T.muted} /></span>
                <span style={{ textAlign: 'center' }}><Cell val={f.premium} green={T.green} muted={T.muted} /></span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '0 5vw 100px', maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 40 }}>
          Frequently asked questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ borderRadius: 12, border: `1px solid ${openFaq === i ? T.borderMed : T.border}`, background: T.bg2, overflow: 'hidden', transition: 'border-color 0.2s' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}
              >
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: T.text, lineHeight: 1.4 }}>{faq.q}</span>
                <span style={{ color: T.muted, flexShrink: 0, fontSize: '1.2rem', transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 22px 18px', fontSize: '0.87rem', color: T.muted, lineHeight: 1.75 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section style={{ padding: '0 5vw 100px', textAlign: 'center' }}>
        <div style={{ padding: '56px 40px', borderRadius: 20, background: 'linear-gradient(135deg, #0a2d5e 0%, #0D1E30 100%)', border: `1px solid rgba(46,211,198,0.2)`, maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>
            Try Premium free for 14 days
          </h2>
          <p style={{ fontSize: '1rem', color: T.muted, lineHeight: 1.7, marginBottom: 32, maxWidth: 440, margin: '0 auto 32px' }}>
            Full access to every feature for 14 days. Cancel before day 15 and you won&apos;t be charged. Downgrade or cancel anytime from Settings.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
            <a href="/onboarding" style={{ padding: '14px 36px', borderRadius: 14, background: T.gold, color: T.bg, fontWeight: 800, fontSize: '1rem', textDecoration: 'none', boxShadow: '0 4px 24px rgba(46,211,198,0.3)' }}>
              Start free trial
            </a>
            <a href="/landingpage/security" style={{ padding: '14px 28px', borderRadius: 14, border: `1px solid ${T.borderMed}`, color: T.text, fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none' }}>
              Read our security policy
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
