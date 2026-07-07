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
const EMAIL     = 'legal@nautiliusmoney.com';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: [
      'By accessing or using Nautilius Money ("Service"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, do not use the Service.',
      'We may update these Terms from time to time. We will notify you of material changes by email or prominent notice within the app. Continued use of the Service after such notice constitutes acceptance of the updated Terms.',
    ],
  },
  {
    title: '2. Eligibility',
    body: [
      'You must be at least 18 years old and a resident of the United States to use Nautilius Money. By creating an account, you represent that you meet these requirements.',
      'You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.',
    ],
  },
  {
    title: '3. Description of Service',
    body: [
      'Nautilius Money is a personal financial management platform that allows you to aggregate financial accounts, track net worth, analyze cash flow, set goals, and receive financial insights.',
      'Nautilius Money is not a bank, broker-dealer, investment adviser, or financial planner. The Service is provided for informational and organizational purposes only and does not constitute financial, investment, legal, or tax advice.',
      'We connect to your financial institutions through Plaid, a third-party data aggregation service. Your use of Plaid is subject to Plaid\'s own terms of service and privacy policy.',
    ],
  },
  {
    title: '4. Account Registration',
    body: [
      'You must provide accurate, current, and complete information when creating your account. You agree to keep your information up to date.',
      'You may not share your account or transfer it to another person. You are responsible for all activity under your account and must notify us immediately at ' + EMAIL + ' if you suspect unauthorized access.',
    ],
  },
  {
    title: '5. Subscription and Billing',
    body: [
      'Nautilius Money offers a free tier and paid subscription plans. Paid plans are billed on a monthly or annual basis as selected at checkout.',
      'Subscriptions renew automatically unless cancelled before the renewal date. You may cancel at any time from your account settings. Cancellation takes effect at the end of the current billing period — we do not provide prorated refunds for partial periods.',
      'We reserve the right to change pricing with 30 days\' advance notice. Continued use after the price change takes effect constitutes acceptance of the new pricing.',
    ],
  },
  {
    title: '6. Acceptable Use',
    body: [
      'You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to gain unauthorized access to any part of the Service or its related systems; (c) reverse-engineer, decompile, or disassemble any part of the Service; (d) use automated tools to scrape or extract data from the Service; (e) interfere with or disrupt the integrity or performance of the Service.',
      'We reserve the right to suspend or terminate your account immediately if we determine, in our sole discretion, that you have violated these Terms.',
    ],
  },
  {
    title: '7. Data and Privacy',
    body: [
      'Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to the collection and use of your data as described in the Privacy Policy.',
      'You retain ownership of your financial data. We do not sell your personal financial data to third parties for advertising purposes.',
    ],
  },
  {
    title: '8. Intellectual Property',
    body: [
      'The Service, including all software, design, text, and graphics, is owned by Nautilius Money, Inc. and is protected by applicable intellectual property laws. These Terms do not grant you any rights to use our trademarks, logos, or brand elements.',
      'You grant Nautilius Money a limited, non-exclusive license to process and display your data solely to provide the Service to you.',
    ],
  },
  {
    title: '9. Disclaimers',
    body: [
      'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.',
      'Nautilius Money does not guarantee the accuracy, completeness, or timeliness of financial data retrieved from third-party sources. Account balances and transaction data are provided by your financial institutions via Plaid and may be delayed.',
      'Nautilius Money is not responsible for any financial decisions you make based on information provided by the Service.',
    ],
  },
  {
    title: '10. Limitation of Liability',
    body: [
      'TO THE FULLEST EXTENT PERMITTED BY LAW, Nautilius Money, INC. AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.',
      'OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) $100.',
    ],
  },
  {
    title: '11. Governing Law and Disputes',
    body: [
      'These Terms are governed by the laws of the State of Delaware, without regard to conflict of law principles.',
      'Any dispute arising from these Terms or the Service shall be resolved through binding arbitration under the rules of the American Arbitration Association, except that either party may seek injunctive relief in a court of competent jurisdiction.',
    ],
  },
  {
    title: '12. Termination',
    body: [
      'You may terminate your account at any time by contacting us or using the account deletion option in settings. Upon termination, your right to use the Service ceases immediately.',
      'We may terminate or suspend your access at any time, with or without notice, for any reason including violation of these Terms. Sections 7, 8, 9, 10, and 11 survive termination.',
    ],
  },
  {
    title: '13. Contact Us',
    body: [
      'If you have questions about these Terms, please contact us at ' + EMAIL + ' or by mail at: Nautilius Money, Inc., Legal Department, [Address], United States.',
    ],
  },
];

export default function TermsPage() {
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
          Terms of Use
        </h1>
        <p style={{ fontSize: '0.95rem', color: T.muted, lineHeight: 1.75, maxWidth: 560, margin: '0 auto' }}>
          Please read these terms carefully before using Nautilius Money. They govern your access to and use of our Service.
        </p>
        <p style={{ fontSize: '0.82rem', color: T.muted, marginTop: 16 }}>
          Effective date: <strong style={{ color: T.text }}>{EFFECTIVE}</strong>
        </p>
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
