import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const T = {
  gold:      '#2ED3C6',
  accent:    '#4DA3FF',
  muted:     '#7A9BB5',
  text:      '#C8D8EC',
  bg:        '#07111F',
  bg2:       '#0D1E30',
  border:    'rgba(77,163,255,0.12)',
  borderMed: 'rgba(77,163,255,0.22)',
};

const EFFECTIVE = 'June 19, 2026';
const EMAIL     = 'privacy@nautilusmoney.com';

const cookieTypes = [
  {
    name: 'Strictly Necessary',
    color: '#00A86B',
    canDisable: false,
    description: 'These cookies are required for the Service to function and cannot be disabled. They are set in response to your actions — such as logging in or filling out a form — and do not store any personally identifiable information.',
    examples: [
      { name: 'sb-auth-token', purpose: 'Stores your encrypted session token so you remain logged in across page loads. Set by Supabase (our authentication provider).' },
      { name: 'sb-refresh-token', purpose: 'Allows us to silently refresh your session without requiring you to log in again. Expires after 7 days of inactivity.' },
      { name: '__Host-next-auth.*', purpose: 'CSRF protection token for form submissions. Deleted when you close your browser.' },
    ],
  },
  {
    name: 'Functional',
    color: '#4DA3FF',
    canDisable: true,
    description: 'Functional cookies remember your preferences and settings to give you a more personalized experience. Disabling these may reduce convenience but will not prevent you from using the Service.',
    examples: [
      { name: 'wl_theme', purpose: 'Remembers your light/dark mode preference so it persists between sessions.' },
      { name: 'wl_dashboard_layout', purpose: 'Stores your last-viewed dashboard section and time period filter.' },
      { name: 'wl_onboarding_step', purpose: 'Tracks your progress through the onboarding flow so you can resume where you left off.' },
    ],
  },
  {
    name: 'Analytics',
    color: '#A78BFA',
    canDisable: true,
    description: 'Analytics cookies help us understand how users interact with the Service so we can improve it. All data is aggregated and anonymized — we cannot identify you from analytics data.',
    examples: [
      { name: '_ga, _ga_*', purpose: 'Google Analytics. Counts unique visitors and page views. Data is anonymized and retained for 13 months.' },
      { name: 'posthog_*', purpose: 'PostHog product analytics. Records which features are used most to help us prioritize improvements. No financial data is ever sent.' },
    ],
  },
  {
    name: 'Third-Party Services',
    color: '#E8B800',
    canDisable: false,
    description: 'Some cookies are set by trusted third-party services that power core functionality. These are governed by each provider\'s own privacy policy.',
    examples: [
      { name: 'Plaid cookies', purpose: 'Set during the bank-connection flow. Used by Plaid to manage your OAuth session with your financial institution. Cleared once the connection is complete.' },
      { name: 'Stripe cookies', purpose: 'Set during checkout. Used by Stripe to detect fraudulent payments and comply with PCI DSS requirements.' },
    ],
  },
];

const sections = [
  {
    title: 'What Are Cookies?',
    body: 'Cookies are small text files stored in your browser when you visit a website. They help websites remember information about your visit — like whether you\'re logged in — and allow certain features to work.',
  },
  {
    title: 'How We Use Cookies',
    body: 'Nautilius Money uses cookies for a narrow set of purposes: to keep you authenticated, to remember your preferences, and to understand aggregate usage patterns so we can improve the product. We do not use cookies to track you across other websites, build advertising profiles, or sell your data.',
  },
  {
    title: 'Managing Your Cookie Preferences',
    body: 'Strictly necessary cookies cannot be disabled — the Service cannot function without them. For all other cookie categories, you can opt out by adjusting your browser settings or using the cookie preference center in your account settings. Note that disabling analytics cookies does not affect the quality of the Service.',
  },
  {
    title: 'Local Storage',
    body: 'In addition to cookies, Nautilius Money uses browser localStorage to store certain non-sensitive preferences (such as your financial health profile inputs and chart settings). This data never leaves your device and is not transmitted to our servers unless you explicitly save it to your account.',
  },
  {
    title: 'Retention Periods',
    body: 'Session cookies are deleted when you close your browser. Persistent cookies expire on the schedule listed in the table above. You can delete all cookies at any time through your browser\'s privacy settings — this will log you out of the Service.',
  },
  {
    title: 'Changes to This Policy',
    body: 'We may update this Cookie Policy to reflect changes in the cookies we use or for other operational, legal, or regulatory reasons. We will notify you of material changes by posting a notice in the app or by email.',
  },
];

export default function CookiesPage() {
  return (
    <main style={{ background: T.bg, color: T.text, minHeight: '100vh' }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{ paddingTop: 120, paddingBottom: 64, paddingLeft: '5vw', paddingRight: '5vw', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', borderRadius: 100, border: `1px solid rgba(46,211,198,0.25)`, background: 'rgba(46,211,198,0.08)', marginBottom: 24 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.gold, display: 'inline-block' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gold }}>Legal</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>
          Cookie Policy
        </h1>
        <p style={{ fontSize: '0.95rem', color: T.muted, lineHeight: 1.75, maxWidth: 580, margin: '0 auto' }}>
          We believe you should know exactly what we store in your browser and why. This page explains every cookie Nautilius Money uses — no surprises.
        </p>
        <p style={{ fontSize: '0.82rem', color: T.muted, marginTop: 16 }}>
          Effective date: <strong style={{ color: T.text }}>{EFFECTIVE}</strong>
        </p>
      </section>

      {/* ── INTRO SECTIONS ── */}
      <section style={{ padding: '0 5vw 64px', maxWidth: 800, margin: '0 auto' }}>
        {sections.slice(0, 2).map((s, i) => (
          <div key={i} style={{ borderTop: `1px solid ${T.border}`, padding: '28px 0' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: T.text, marginBottom: 12 }}>{s.title}</h2>
            <p style={{ fontSize: '0.9rem', color: T.muted, lineHeight: 1.8, margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </section>

      {/* ── COOKIE TYPE CARDS ── */}
      <section style={{ padding: '0 5vw 64px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: T.text, marginBottom: 8, letterSpacing: '-0.02em' }}>Cookies We Use</h2>
        <p style={{ fontSize: '0.88rem', color: T.muted, marginBottom: 32, lineHeight: 1.7 }}>
          A full breakdown of every cookie category, what each one does, and whether you can disable it.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {cookieTypes.map((ct) => (
            <div key={ct.name} style={{
              background: T.bg2,
              borderRadius: 16,
              border: `1px solid ${T.border}`,
              padding: '28px 28px 24px',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: ct.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: ct.color }}>{ct.name}</span>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: 100,
                  background: ct.canDisable ? 'rgba(77,163,255,0.10)' : 'rgba(255,77,77,0.10)',
                  border: `1px solid ${ct.canDisable ? 'rgba(77,163,255,0.25)' : 'rgba(255,77,77,0.25)'}`,
                  fontSize: '0.68rem', fontWeight: 700,
                  color: ct.canDisable ? T.accent : '#FF6B6B',
                  whiteSpace: 'nowrap',
                }}>
                  {ct.canDisable ? 'Optional' : 'Required'}
                </span>
              </div>

              <p style={{ fontSize: '0.82rem', color: T.muted, lineHeight: 1.7, marginBottom: 20 }}>{ct.description}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ct.examples.map((ex, i) => (
                  <div key={i} style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: ct.color, fontFamily: 'monospace', marginBottom: 4 }}>{ex.name}</div>
                    <div style={{ fontSize: '0.78rem', color: T.muted, lineHeight: 1.6 }}>{ex.purpose}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── REMAINING SECTIONS ── */}
      <section style={{ padding: '0 5vw 100px', maxWidth: 800, margin: '0 auto' }}>
        {sections.slice(2).map((s, i) => (
          <div key={i} style={{ borderTop: `1px solid ${T.border}`, padding: '28px 0' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: T.text, marginBottom: 12 }}>{s.title}</h2>
            <p style={{ fontSize: '0.9rem', color: T.muted, lineHeight: 1.8, margin: 0 }}>{s.body}</p>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 28 }}>
          <p style={{ fontSize: '0.82rem', color: T.muted, lineHeight: 1.7 }}>
            Questions about our cookie practices? Contact us at{' '}
            <a href={`mailto:${EMAIL}`} style={{ color: T.accent, textDecoration: 'none', fontWeight: 600 }}>
              {EMAIL}
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
