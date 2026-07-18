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

const EFFECTIVE = 'July 2, 2026';
const EMAIL     = 'privacy@nautiliusmoney.com';

const sections = [
  {
    title: '1. Introduction',
    body: [
      'Nautilus Money ("we," "our," or "us") operates a personal financial management platform available at nautiliusmoney.com and through our mobile applications (collectively, the "Service"). This Privacy Policy explains how we collect, use, disclose, and protect your information when you use the Service.',
      'By creating an account or using the Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree, please do not use the Service.',
      'This Privacy Policy is incorporated into our Terms of Use. Capitalized terms not defined here have the meanings given in the Terms of Use.',
    ],
  },
  {
    title: '2. Information We Collect',
    body: [
      'Account Information: When you register, we collect your email address, password (stored as a cryptographic hash — never in plain text), and profile information such as your name, age, and currency preference.',
      'Financial Account Data via Plaid: To connect your financial institutions, we use Plaid Technologies, Inc. ("Plaid"), a third-party data aggregation service. When you connect an account, Plaid retrieves and transmits to us: account balances, transaction history (merchant name, date, amount, category), and account type and subtype (e.g., checking, savings, credit card). We do not receive, store, or have access to your bank username, password, PIN, or full account and routing numbers. You connect your accounts directly through Plaid\'s secure interface; your credentials go to your bank, not to us.',
      'Financial Goals and Manual Entries: Information you voluntarily enter into the Service, such as savings goals, budget targets, income information, and notes.',
      'Usage Data: We collect information about how you interact with the Service, including pages visited, features used, session duration, and general device and browser information (browser type, operating system, referring URL). This data is used in aggregate to improve the Service and is not linked to your financial data.',
      'Communications: If you contact us by email or through the app, we retain the content of your message and your contact information in order to respond.',
    ],
  },
  {
    title: '3. How We Use Your Information',
    body: [
      'We use the information we collect solely to provide, maintain, and improve the Service. Specifically:',
      '(a) To operate the Service: aggregating your financial accounts, calculating your Nautilus Score, generating spending insights, tracking goals, and producing forecasts.',
      '(b) To personalize your experience: displaying data relevant to your accounts and preferences.',
      '(c) To communicate with you: sending account-related notifications, security alerts, and — where you have opted in — product updates and financial digests.',
      '(d) To improve the Service: analyzing aggregated, de-identified usage patterns to identify bugs, improve features, and develop new functionality.',
      '(e) To comply with legal obligations: responding to lawful requests from government authorities or as required by applicable law.',
      'We do not use your personal financial data to train machine learning models for sale to third parties, serve targeted advertising, or profile you for any purpose beyond delivering the Service to you.',
    ],
  },
  {
    title: '4. Plaid and Third-Party Financial Data',
    body: [
      'Nautilus Money uses Plaid to connect to your financial institutions. By connecting an account, you also agree to Plaid\'s Privacy Policy (available at plaid.com/legal) and End User Privacy Policy. Plaid\'s collection and use of your information is governed by Plaid\'s own policies.',
      'The data we receive from Plaid is used exclusively to provide the personal financial management features of the Service — specifically to display balances, categorize transactions, calculate net worth, generate budgets, and produce financial insights for you.',
      'We do not sell, rent, license, or otherwise share Plaid-sourced financial data with any third party for any purpose other than operating the Service as described in this Privacy Policy.',
      'You may disconnect a financial institution at any time from within the Service. Upon disconnection, we revoke the Plaid access token for that institution and queue deletion of associated transaction data from our database.',
    ],
  },
  {
    title: '5. How We Share Your Information',
    body: [
      'We do not sell your personal information. We do not share your financial data with advertisers, data brokers, or marketing platforms.',
      'We share information only in the following limited circumstances:',
      'Service Providers: We use a small number of trusted service providers who process data on our behalf under written agreements that restrict them to using data only to provide services to us. These include: Supabase, Inc. (database and authentication infrastructure) and Stripe, Inc. (subscription billing). These providers are contractually prohibited from using your data for their own purposes.',
      'Plaid Technologies, Inc.: As described in Section 4, Plaid operates as our data aggregation partner. Data flows between Plaid and Nautilus Money are governed by our agreement with Plaid.',
      'Legal Requirements: We may disclose information if required to do so by law, subpoena, court order, or other governmental request, or when we believe disclosure is necessary to protect our rights, protect your safety or the safety of others, or investigate fraud.',
      'Business Transfers: In the event of a merger, acquisition, or sale of all or substantially all of our assets, your information may be transferred as part of that transaction. We will notify you via email or prominent in-app notice before your information becomes subject to a different privacy policy.',
      'With Your Consent: We may share information for other purposes with your explicit consent.',
    ],
  },
  {
    title: '6. Data Retention',
    body: [
      'We retain your account information and financial data for as long as your account is active, or as long as necessary to provide the Service.',
      'Transaction history retrieved from Plaid is retained indefinitely while your account is active so that historical analysis and net worth tracking remain accurate. You may request deletion at any time.',
      'If you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain certain records for legal or regulatory purposes (for example, billing records may be retained for up to 7 years for tax compliance).',
      'De-identified and aggregated data that cannot reasonably be used to identify you may be retained indefinitely for product improvement purposes.',
    ],
  },
  {
    title: '7. Data Security',
    body: [
      'We take the security of your information seriously. Our security measures include:',
      'Encryption: All data is encrypted in transit using TLS 1.3. All data is encrypted at rest using AES-256 encryption provided by our database infrastructure (Supabase).',
      'Access Controls: Row-Level Security (RLS) policies are enforced at the database layer, ensuring that no user can access another user\'s data — even in the event of an application-layer bug.',
      'Credential Isolation: Your bank credentials are never transmitted to or stored by Nautilus Money. Plaid\'s OAuth flow sends credentials directly to your financial institution.',
      'No Account Numbers: We deliberately do not request account or routing number data from Plaid. This information is never present in our systems.',
      'Despite these measures, no method of transmission over the internet or method of electronic storage is 100% secure. We cannot guarantee absolute security. If you believe your account has been compromised, contact us immediately at ' + EMAIL + '.',
    ],
  },
  {
    title: '8. Your Rights and Choices',
    body: [
      'Access and Correction: You may access and update your profile information at any time from the Settings page within the Service.',
      'Data Export: You may request a copy of your personal data by contacting us at ' + EMAIL + '. We will provide your data in a machine-readable format within 30 days.',
      'Account Deletion: You may delete your account and all associated data at any time from Settings → Data & Privacy → Delete Account. Deletion is permanent and cannot be undone.',
      'Disconnect Financial Accounts: You may disconnect any linked financial institution at any time from within the Service. This revokes our access to new data from that institution.',
      'Email Communications: You may opt out of non-essential email communications (such as weekly digests) at any time from Settings → Notifications or by clicking "unsubscribe" in any email. You cannot opt out of transactional emails related to your account security (e.g., password reset, sign-in alerts).',
      'California Residents: If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect, the right to delete your personal information, and the right to opt out of the sale of your personal information. We do not sell personal information. To exercise your rights, contact us at ' + EMAIL + '.',
    ],
  },
  {
    title: '9. Cookies and Tracking',
    body: [
      'Nautilus Money uses session cookies solely for authentication purposes — to keep you logged in during a session. We do not use third-party advertising cookies, tracking pixels, or behavioral analytics platforms.',
      'We use a minimal set of first-party analytics to understand aggregate usage patterns (e.g., which features are used most). This data is not linked to your identity or financial information.',
      'You may disable cookies in your browser settings, but doing so will prevent you from logging in to the Service.',
    ],
  },
  {
    title: '10. Children\'s Privacy',
    body: [
      'The Service is not directed to children under the age of 18. We do not knowingly collect personal information from anyone under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at ' + EMAIL + ' and we will delete the information promptly.',
    ],
  },
  {
    title: '11. International Users',
    body: [
      'Nautilus Money is operated in the United States and is intended for users located in the United States. If you are accessing the Service from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States, where our servers and service providers are located.',
      'By using the Service, you consent to the transfer of your information to the United States and acknowledge that the privacy laws of the United States may differ from those in your country of residence.',
    ],
  },
  {
    title: '12. Links to Third-Party Sites',
    body: [
      'The Service may contain links to third-party websites or services (such as Plaid\'s interface or Stripe\'s billing portal) that are not operated by us. We are not responsible for the privacy practices of those sites. We encourage you to review the privacy policies of any third-party sites you visit.',
    ],
  },
  {
    title: '13. Changes to This Privacy Policy',
    body: [
      'We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email to the address associated with your account and by posting a notice within the Service at least 14 days before the change takes effect.',
      'Your continued use of the Service after the effective date of the updated Privacy Policy constitutes your acceptance of the changes. If you do not agree to the updated policy, you must stop using the Service and may delete your account.',
      'The date of the most recent revision is shown at the top of this page.',
    ],
  },
  {
    title: '14. Contact Us',
    body: [
      'If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:',
      'Email: ' + EMAIL,
      'Mail: Nautilus Money, Privacy Department, support@nautilusmoney.com',
      'We will respond to all privacy-related inquiries within 30 days.',
    ],
  },
];

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: '0.95rem', color: T.muted, lineHeight: 1.75, maxWidth: 560, margin: '0 auto' }}>
          We believe you deserve to know exactly what data we collect, why we collect it, and how it is protected. This policy is written to be read, not buried.
        </p>
        <p style={{ fontSize: '0.82rem', color: T.muted, marginTop: 16 }}>
          Effective date: <strong style={{ color: T.text }}>{EFFECTIVE}</strong>
        </p>
      </section>

      {/* ── PLAIN-LANGUAGE SUMMARY ── */}
      <section style={{ padding: '0 5vw 56px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{
          background: T.bg2, borderRadius: 16,
          border: `1px solid ${T.borderMed}`,
          padding: '28px 32px',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gold, marginBottom: 14 }}>
            Plain-Language Summary
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { icon: '🚫', label: 'We never sell your data', sub: 'Your financial data is not sold, rented, or shared with advertisers or data brokers — ever.' },
              { icon: '🔒', label: 'Your credentials stay with your bank', sub: 'We use Plaid so your bank username and password go directly to your bank, not to us.' },
              { icon: '🗑️', label: 'You can delete everything', sub: 'Delete your account at any time from Settings. All your data is permanently removed within 30 days.' },
              { icon: '📊', label: 'Data used only to serve you', sub: 'Your financial information is used exclusively to power the Nautilus Money features you use.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: T.text, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: '0.78rem', color: T.muted, lineHeight: 1.6 }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTIONS ── */}
      <section style={{ padding: '0 5vw 100px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {sections.map((s, i) => (
            <div
              key={i}
              style={{
                borderTop: `1px solid ${T.border}`,
                padding: '32px 0',
              }}
            >
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: T.text, marginBottom: 14, letterSpacing: '-0.01em' }}>
                {s.title}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {s.body.map((p, j) => (
                  <p key={j} style={{ fontSize: '0.9rem', color: T.muted, lineHeight: 1.8, margin: 0 }}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 32 }}>
            <p style={{ fontSize: '0.82rem', color: T.muted, lineHeight: 1.7 }}>
              Last updated: {EFFECTIVE}. Questions? Email us at{' '}
              <a href={`mailto:${EMAIL}`} style={{ color: T.accent, textDecoration: 'none', fontWeight: 600 }}>
                {EMAIL}
              </a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
