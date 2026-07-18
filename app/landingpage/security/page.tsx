import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const T = {
  gold:    '#2ED3C6',
  accent:  '#4DA3FF',
  muted:   '#7A9BB5',
  text:    '#C8D8EC',
  bg:      '#07111F',
  bg2:     '#0D1E30',
  border:  'rgba(77,163,255,0.12)',
  borderMed: 'rgba(77,163,255,0.22)',
};

/* ── Partner trust pillars ── */
const partners = [
  {
    name: 'Plaid',
    logo: '🏦',
    cert: 'SOC 2 Type II · ISO 27001',
    color: '#0085FF',
    headline: 'Your bank credentials never touch our servers',
    points: [
      'OAuth-based connection — you log in directly with your bank, not with us',
      'Nautilius Money receives a secure access token, never your username or password',
      'We request read-only transaction data only — no account or routing numbers imported',
      'Payment initiation products are not enabled, making fund movement architecturally impossible',
    ],
  },
  {
    name: 'Supabase',
    logo: '🗄️',
    cert: 'SOC 2 Type II · HIPAA eligible',
    color: '#3ECF8E',
    headline: 'Data encrypted at rest and in transit',
    points: [
      'AES-256 encryption at rest; TLS 1.3 in transit on every request',
      'Row-Level Security (RLS) enforced at the database layer — one user can never read another\'s data',
      'Data hosted in US-East region; no cross-border transfers',
      'Automated backups with point-in-time recovery',
    ],
  },
  {
    name: 'Stripe',
    logo: '💳',
    cert: 'PCI DSS Level 1',
    color: '#635BFF',
    headline: 'Card numbers never enter our systems',
    points: [
      'All payment processing handled entirely within Stripe\'s PCI-certified environment',
      'Nautilius Money never sees, stores, or logs your card number, CVV, or billing details',
      'Subscription tokens are the only payment reference stored on our side',
      'Stripe Radar fraud protection active on all transactions',
    ],
  },
];

/* ── Architecture principles ── */
const principles = [
  {
    icon: '🔑',
    title: 'Zero credential storage',
    body: 'We never store bank usernames, passwords, or PINs. Plaid\'s OAuth flow means your credentials go directly to your bank\'s servers. Nautilius Money receives only a time-limited access token.',
  },
  {
    icon: '🚫',
    title: 'No account numbers by design',
    body: 'Plaid offers an "Auth" product that returns account and routing numbers. Nautilius Money deliberately does not request it. We use transaction and balance data only — your account numbers are never in our database.',
  },
  {
    icon: '👁️',
    title: 'Read-only, always',
    body: 'The Plaid connection Nautilius Money creates has no payment or transfer products attached. Even if our systems were fully compromised, there is no technical path to move money from your accounts.',
  },
  {
    icon: '🏗️',
    title: 'Certified infrastructure, not certified Nautilius Money',
    body: 'Rather than pursuing our own SOC 2 certification (which audits internal processes), we architect so that sensitive data lives exclusively inside certified third parties. Plaid, Supabase, and Stripe carry their own Type II certifications — covering the data that actually matters.',
  },
  {
    icon: '🔒',
    title: 'Row-level isolation',
    body: 'Supabase Row-Level Security policies mean your financial data is isolated at the database layer — not just in application code. Even a bug in our API cannot return another user\'s data.',
  },
  {
    icon: '🗑️',
    title: 'Right to deletion',
    body: 'Disconnecting an account immediately revokes the Plaid access token and queues deletion of associated transaction data. You can delete your Nautilius Money account and all data from Settings at any time.',
  },
];

/* ── What we don't do ── */
const neverDo = [
  'Store your bank username or password',
  'Import account or routing numbers',
  'Enable any payment or transfer capability',
  'Sell your financial data to third parties',
  'Share data with advertisers or data brokers',
  'Store card numbers or CVV codes',
];

export default function SecurityPage() {
  return (
    <main style={{ background: T.bg, color: T.text, minHeight: '100vh' }}>
      <Navbar />

      {/* ── TOP: writing + partner cards, sharing one background ── */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Background — security art, covers both sections (contained via overflow-hidden + cover) */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/security.png')", backgroundSize: 'cover', backgroundPosition: 'center', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,17,31,0.6) 0%, rgba(7,17,31,0.4) 50%, rgba(7,17,31,0.7) 100%)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 120, paddingBottom: 72, paddingLeft: '5vw', paddingRight: '5vw', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', borderRadius: 100, border: `1px solid rgba(46,211,198,0.25)`, background: 'rgba(46,211,198,0.08)', marginBottom: 24 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.gold, display: 'inline-block' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gold }}>Security &amp; Privacy</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
          Your data is safe.<br />
          <span style={{ color: T.gold }}>Here's exactly how.</span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: T.muted, lineHeight: 1.75, maxWidth: 600, margin: '0 auto' }}>
          Nautilius Money is built on a deliberate principle: sensitive financial data should live inside
          certified infrastructure, not ours. We connect the pipes — Plaid, Supabase, and Stripe
          hold the data and carry the certifications.
        </p>
      </section>

      {/* ── PARTNER PILLARS ── */}
      <section style={{ padding: '0 5vw 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {partners.map(p => (
            <div key={p.name} style={{
              background: T.bg2, borderRadius: 16,
              border: `1px solid ${T.border}`,
              padding: '32px 32px 28px',
              transition: 'border-color 0.2s',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '1.6rem' }}>{p.logo}</span>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: p.color }}>{p.name}</div>
                    <div style={{ fontSize: '0.7rem', color: T.muted, marginTop: 2, letterSpacing: '0.04em' }}>{p.cert}</div>
                  </div>
                </div>
                <div style={{ padding: '3px 10px', borderRadius: 100, background: `${p.color}18`, border: `1px solid ${p.color}30`, fontSize: '0.7rem', fontWeight: 700, color: p.color, whiteSpace: 'nowrap' }}>
                  Certified
                </div>
              </div>

              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: T.text, marginBottom: 16, lineHeight: 1.45 }}>{p.headline}</div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {p.points.map((pt, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, fontSize: '0.82rem', color: T.muted, lineHeight: 1.55 }}>
                    <span style={{ color: p.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

        </div>
      </div>

      {/* ── ARCHITECTURE PRINCIPLES ── */}
      <section style={{ padding: '72px 5vw', background: T.bg2, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gold, marginBottom: 12 }}>How It Works</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 12 }}>
              Security built into the architecture
            </h2>
            <p style={{ fontSize: '1rem', color: T.muted, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              These aren't policies or promises — they're constraints enforced by how the system is built.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {principles.map(p => (
              <div key={p.title} style={{ padding: '24px 26px', borderRadius: 14, background: T.bg, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>{p.icon}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: T.text, marginBottom: 8 }}>{p.title}</div>
                <div style={{ fontSize: '0.82rem', color: T.muted, lineHeight: 1.65 }}>{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEVER DO ── */}
      <section style={{ padding: '72px 5vw', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gold, marginBottom: 12 }}>Our Commitments</div>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>
          What Nautilius Money will <span style={{ color: T.gold }}>never</span> do
        </h2>
        <p style={{ fontSize: '1rem', color: T.muted, maxWidth: 500, margin: '0 auto 44px', lineHeight: 1.7 }}>
          These aren't buried in a terms of service. They're architectural decisions we've made permanent.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, textAlign: 'left' }}>
          {neverDo.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 20px', borderRadius: 12, background: T.bg2, border: `1px solid ${T.border}` }}>
              <span style={{ color: '#EF4444', fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>✕</span>
              <span style={{ fontSize: '0.87rem', color: T.muted, lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOC 2 EXPLANATION ── */}
      <section style={{ padding: '0 5vw 80px', maxWidth: 820, margin: '0 auto' }}>
        <div style={{ padding: '36px 40px', borderRadius: 16, background: T.bg2, border: `1px solid ${T.borderMed}` }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>📋</span>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: T.text, marginBottom: 10 }}>
                A note on SOC 2 certification
              </div>
              <p style={{ fontSize: '0.87rem', color: T.muted, lineHeight: 1.75, margin: '0 0 12px' }}>
                SOC 2 audits a company's internal systems and processes for handling sensitive data.
                Nautilius Money is designed so that the data requiring that level of oversight — bank credentials,
                card numbers, account numbers — never enters our systems in the first place.
              </p>
              <p style={{ fontSize: '0.87rem', color: T.muted, lineHeight: 1.75, margin: 0 }}>
                The infrastructure partners we rely on (Plaid, Supabase, Stripe) each hold SOC 2 Type II
                certification and undergo independent annual audits. Our architecture is intentionally
                designed to keep Nautilius Money outside the scope of data that would require our own certification.
                As the product grows, we will pursue additional certifications where they add genuine
                user protection — not just compliance theater.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section style={{ padding: '0 5vw 100px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.87rem', color: T.muted }}>
          Security questions or concerns?{' '}
          <a href="mailto:security@nautiliusmoney.com" style={{ color: T.accent, textDecoration: 'none', fontWeight: 600 }}>
            security@nautiliusmoney.com
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
