import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const T = {
  gold:       '#2ED3C6',
  accent:     '#4DA3FF',
  muted:      '#7A9BB5',
  text:       '#C8D8EC',
  bg:         '#07111F',
  bg2:        '#0D1E30',
  bg3:        '#122338',
  border:     'rgba(77,163,255,0.12)',
  borderGold: 'rgba(46,211,198,0.2)',
};

const pillars = [
  {
    color: T.accent,
    headline: "Visibility",
    body: "You can't improve what you can't see. Nautilus Money surfaces the complete picture of your financial life — cash flow, net worth, debt, savings pace — in one place.",
  },
  {
    color: T.gold,
    headline: "Clarity",
    body: "Data without context is noise. Nautilus Money translates raw numbers into a single score with a plain-English explanation of what it means and why it matters.",
  },
  {
    color: '#A78BFA',
    headline: "Action",
    body: "A score is only useful if it tells you what to do next. Nautilus Money gives you a ranked list of the highest-impact changes to your financial health — specific, not generic.",
  },
];

const companyQuestions = [
  "Are we on track?",
  "Where are we overspending?",
  "What risks are ahead?",
  "What should we do next?",
];

const personalQuestions = [
  "Where is my money actually going?",
  "Am I saving enough?",
  "Am I on track for retirement?",
  "What happens if I keep spending this way?",
];

export default function AboutPage() {
  return (
    <main style={{ background: T.bg, color: T.text, minHeight: '100vh' }}>
      <Navbar />

      {/* ── Hero ── */}
      <section style={{ paddingTop: 140, paddingBottom: 80, padding: '140px 5vw 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(11,45,137,0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '6px 18px', marginBottom: 28, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gold, background: 'rgba(46,211,198,0.08)', border: `1px solid rgba(46,211,198,0.2)` }}>
            Our Story
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 24 }}>
            Helping people understand their money with the same tools{' '}
            <span style={{ color: T.gold }}>businesses use to understand theirs.</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: T.muted, lineHeight: 1.75, maxWidth: 580, margin: '0 auto' }}>
            For more than two decades, our founder built financial dashboards, analytics platforms, and decision-making tools for some of the largest organizations in America.
          </p>
        </div>
      </section>

      {/* ── The Realization ── */}
      <section style={{ padding: '0 5vw 80px', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 60 }}>
          {/* What companies had */}
          <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 18, padding: '32px 28px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.accent, marginBottom: 16 }}>
              What every company had
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {companyQuestions.map(q => (
                <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.95rem', color: T.text }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke={T.accent} strokeWidth="1.2"/>
                    <path d="M5 8l2 2 4-4" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {q}
                </div>
              ))}
            </div>
          </div>
          {/* What families lacked */}
          <div style={{ background: T.bg2, border: `1px solid rgba(248,113,113,0.15)`, borderRadius: 18, padding: '32px 28px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F87171', marginBottom: 16 }}>
              What most families didn&apos;t
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {personalQuestions.map(q => (
                <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.95rem', color: T.muted }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="rgba(248,113,113,0.4)" strokeWidth="1.2"/>
                    <path d="M6 6l4 4M10 6l-4 4" stroke="rgba(248,113,113,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {q}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Narrative */}
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <p style={{ fontSize: '1.08rem', color: T.text, lineHeight: 1.8 }}>
            The better the information, the better the decisions. That&apos;s true whether you&apos;re running a Fortune 500 company or a household.
          </p>
          <p style={{ fontSize: '1.08rem', color: T.muted, lineHeight: 1.8 }}>
            What became clear over time was that most people were making some of the most important financial decisions of their lives with far less visibility than the companies they worked for.
          </p>
          <p style={{ fontSize: '1.08rem', color: T.text, lineHeight: 1.8 }}>
            Even high-income professionals often felt overwhelmed by their finances. Not because they lacked income — because they lacked{' '}
            <span style={{ color: T.gold, fontWeight: 600 }}>clarity.</span>
          </p>
        </div>
      </section>

      {/* ── Pull quote ── */}
      <section style={{ padding: '0 5vw 80px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', padding: '52px 40px', borderRadius: 20, background: `linear-gradient(135deg, #0a2d5e 0%, ${T.bg2} 100%)`, border: `1px solid ${T.borderGold}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -10, left: 32, fontSize: '8rem', fontWeight: 900, color: 'rgba(46,211,198,0.06)', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>&ldquo;</div>
          <p style={{ fontSize: 'clamp(1.15rem, 2.2vw, 1.5rem)', fontWeight: 600, lineHeight: 1.6, color: T.text, position: 'relative', zIndex: 1, marginBottom: 20 }}>
            I spent two decades helping large companies use data to make better decisions. Then I realized families needed the same level of financial intelligence.
          </p>
          <div style={{ fontSize: '0.82rem', color: T.gold, fontWeight: 700, letterSpacing: '0.06em' }}>— Nautilus Money Founder</div>
        </div>
      </section>

      {/* ── How it started ── */}
      <section style={{ padding: '0 5vw 80px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gold, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 24, height: 1.5, background: T.gold }} />
          How Nautilus Money Began
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: '1.08rem', color: T.muted, lineHeight: 1.8 }}>
            It started small — helping friends, family members, and colleagues organize their finances and build financial plans. Simple guidance, given freely.
          </p>
          <p style={{ fontSize: '1.08rem', color: T.text, lineHeight: 1.8 }}>
            People began asking for ongoing help. Many were willing to pay for financial coaching because they wanted a system — something that helped them understand their money and make better decisions week after week.
          </p>
          <p style={{ fontSize: '1.08rem', color: T.muted, lineHeight: 1.8 }}>
            The problem was obvious. There were millions of people facing the same challenges. No one person could help them all.
          </p>
          <p style={{ fontSize: '1.12rem', color: T.text, fontWeight: 600, lineHeight: 1.7 }}>
            So the decision was made to build something that could.
          </p>
          <p style={{ fontSize: '1.08rem', color: T.gold, lineHeight: 1.8, fontWeight: 500 }}>
            That idea became Nautilus Money.
          </p>
        </div>
      </section>

      {/* ── Three pillars ── */}
      <section style={{ padding: '0 5vw 80px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gold, marginBottom: 12 }}>
              Our Philosophy
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 12 }}>
              Visibility. Clarity. Action.
            </h2>
            <p style={{ fontSize: '1rem', color: T.muted, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
              The same principles that drive better decisions inside great organizations drive better decisions inside great households.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {pillars.map((p, i) => (
              <div key={p.headline} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 18, padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: '4rem', fontWeight: 900, color: `${p.color}10`, position: 'absolute', top: 8, right: 16, lineHeight: 1, userSelect: 'none' }}>0{i + 1}</div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${p.color}15`, border: `1px solid ${p.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: p.color, opacity: 0.8 }} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: p.color, marginBottom: 10 }}>{p.headline}</h3>
                <p style={{ fontSize: '0.92rem', color: T.muted, lineHeight: 1.7 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section style={{ padding: '0 5vw 80px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 20, padding: '52px 48px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gold, marginBottom: 16 }}>
            Our Mission
          </div>
          <p style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 800, lineHeight: 1.35, letterSpacing: '-0.01em', color: T.text, marginBottom: 24 }}>
            Turn financial complexity into{' '}
            <span style={{ color: T.gold }}>financial clarity.</span>
          </p>
          <p style={{ fontSize: '1rem', color: T.muted, lineHeight: 1.8, marginBottom: 20 }}>
            Most financial apps focus on tracking transactions. Nautilus Money focuses on helping people understand their financial lives — and answering three questions that actually matter:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 8 }}>
            {['Am I okay?', 'What should I do next?', 'Am I getting closer to financial freedom?'].map(q => (
              <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '1rem', fontWeight: 600, color: T.text }}>
                <span style={{ color: T.gold, fontSize: '1.1rem' }}>→</span>
                {q}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.95rem', color: T.muted, lineHeight: 1.7, marginTop: 24 }}>
            When people can answer those questions with confidence, better financial decisions follow naturally.
          </p>
        </div>
      </section>

      {/* ── Founder note ── */}
      <section style={{ padding: '0 5vw 100px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gold, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 24, height: 1.5, background: T.gold }} />
            A Note From the Founder
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <p style={{ fontSize: '1.05rem', color: T.muted, lineHeight: 1.85, fontStyle: 'italic' }}>
              &ldquo;I&apos;ve spent my career helping organizations use data to make smarter decisions. The principles are exactly the same when it comes to personal finances.
            </p>
            <p style={{ fontSize: '1.05rem', color: T.muted, lineHeight: 1.85, fontStyle: 'italic' }}>
              Visibility creates awareness. Awareness creates action. Action creates results.
            </p>
            <p style={{ fontSize: '1.05rem', color: T.text, lineHeight: 1.85, fontStyle: 'italic' }}>
              Nautilus Money was built to give everyday people the clarity, confidence, and tools they need to take control of their financial future. I used these principles to achieve financial freedom earlier than most — and now I&apos;ve built a platform that makes those same insights available to everyone.
            </p>
            <p style={{ fontSize: '1.05rem', color: T.text, lineHeight: 1.85, fontStyle: 'italic' }}>
              Because understanding your money shouldn&apos;t be complicated. It should be empowering.&rdquo;
            </p>
            <div style={{ paddingTop: 8, borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #0B2D89, #4DA3FF)', border: `2px solid rgba(46,211,198,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>
                A
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: T.text }}>Founder, Nautilus Money</div>
                <div style={{ fontSize: '0.8rem', color: T.muted }}>20+ years in enterprise financial analytics</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{ padding: '0 5vw 100px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '56px 40px', borderRadius: 20, background: `linear-gradient(135deg, #0a2d5e 0%, ${T.bg2} 100%)`, border: `1px solid ${T.borderGold}` }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 14 }}>
            Find out where you stand.
          </h2>
          <p style={{ fontSize: '1rem', color: T.muted, lineHeight: 1.7, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
            Get your Nautilus Score in under 2 minutes. No financial expertise required.
          </p>
          <a href="/onboarding" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 40px', borderRadius: 14, background: T.gold, color: T.bg, fontWeight: 800, fontSize: '1rem', textDecoration: 'none', boxShadow: '0 4px 28px rgba(46,211,198,0.3)' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M3 7.5h9M8.5 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Get your free score
          </a>
          <p style={{ marginTop: 16, fontSize: '0.8rem', color: T.muted }}>
            14-day free trial · Cancel before day 15, no charge
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
