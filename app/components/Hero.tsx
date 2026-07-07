import PhoneMockup from "./PhoneMockup";
import Image from "next/image";

const floatingCards = [
  {
    pos: "top-[6%] -left-[20%] animate-float1",
    label: "Nautilus Score",
    value: "82 — Excellent",
    valueClass: "text-gold",
  },
  {
    pos: "top-[22%] -right-[17%] animate-float2",
    label: "vs. Your Income Bracket",
    value: "↑ Top 16%",
    valueClass: "text-green-400",
  },
  {
    pos: "top-[44%] -left-[23%] animate-float3 hidden lg:block",
    label: "Subscriptions Found",
    value: "$247/mo bleeding out",
    valueClass: "text-gold",
  },
  {
    pos: "top-[62%] -right-[13%] animate-float1-slow",
    label: "Net Worth YTD",
    value: "+$29,400",
    valueClass: "text-green-400",
  },
  {
    pos: "bottom-[8%] -left-[15%] animate-float2-fast",
    label: "Freedom Timeline",
    value: "8.4 years out",
    valueClass: "text-accent",
  },
];

const trustBadges = ["Plaid Connected", "256-bit Encryption", "Read-Only Access", "No Account Numbers Stored"];

export default function Hero() {
  return (
    <section className="relative min-h-screen pt-[120px] pb-20 px-[5vw] grid grid-cols-1 lg:grid-cols-2 gap-16 items-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 50%, rgba(11,45,137,0.35) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 15% 60%, rgba(46,211,198,0.06) 0%, transparent 60%)",
        }}
      />
      <div className="absolute inset-0 pointer-events-none hero-grid-overlay" />

      {/* LEFT */}
      <div className="relative z-10">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[0.78rem] font-semibold tracking-widest uppercase text-gold mb-6"
          style={{
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.25)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-dot-pulse" />
          Explore the depths of Your Finances
        </div>

        <h1 className="font-display text-[clamp(2.4rem,4.5vw,3.8rem)] font-bold leading-[1.1] tracking-tight mb-4">
          Navigate Your
          <br />
          <span className="text-gold">Financial Future.</span>
        </h1>

        <p className="text-[1.05rem] leading-[1.75] max-w-[480px] mb-10" style={{ color: '#7A90B8' }}>
          Bring every account, investment, bill, subscription, loan, and financial goal into one intelligent platform. Discover your Nautilus Score, see exactly where you stand today, and confidently chart your course to financial independence.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4">
          <a
            href="/landingpage/signup"
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-bg font-bold text-[0.95rem] px-7 py-3.5 rounded-xl no-underline transition-all hover:-translate-y-0.5 hover:shadow-gold-glow-lg"
            style={{ boxShadow: "0 4px 24px rgba(212,175,55,0.25)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Get My Nautilus Score
          </a>
          <a
            href="/landingpage/features"
            className="inline-flex items-center gap-2 bg-transparent font-medium text-[0.95rem] px-7 py-3.5 rounded-xl no-underline border border-glass-border hover:border-accent/40 hover:bg-accent/5 hover:text-accent transition-all"
            style={{ color: '#C8D8EC' }}
          >
            How It Works →
          </a>
        </div>

        {/* Trust */}
        <div className="mt-10 flex flex-wrap gap-2">
          {trustBadges.map((b) => (
            <span
              key={b}
              className="text-[0.75rem] font-semibold text-muted border border-glass-border px-2.5 py-0.5 rounded tracking-wide"
            >
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="relative z-10 flex items-center justify-center min-h-[600px]">
        <div className="relative" style={{ width: 1060, height: 650 }}>

          {/* Glow behind everything */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: 500,
              height: 400,
              top: '50%',
              left: '40%',
              transform: 'translate(-50%, -50%)',
              background: "radial-gradient(ellipse, rgba(46,211,198,0.10) 0%, rgba(11,45,137,0.3) 40%, transparent 70%)",
              filter: "blur(48px)",
              zIndex: 0,
            }}
          />

          {/* Browser screenshot */}
          <div
            className="absolute"
            style={{
              top: '50%',
              left: -212,
              transform: 'translateY(-50%)',
              zIndex: 5,
              borderRadius: 12,
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(46,211,198,0.15)',
              width: 1045,
              lineHeight: 0,
            }}
          >
            <Image
              src="/dashboard 1.png"
              alt="Nautilus dashboard preview"
              width={1045}
              height={696}
              style={{ display: 'block', width: '100%', height: 595, objectFit: 'cover', objectPosition: 'top', borderRadius: 12 }}
              priority
            />
          </div>

          {/* Phone + floating cards — cards positioned relative to phone */}
          <div
            className="absolute"
            style={{
              top: '50%',
              right: -80,
              transform: 'translateY(-48%)',
              zIndex: 10,
              width: 260,
              height: 580,
            }}
          >
            <PhoneMockup />

            {floatingCards.map((c, i) => (
              <div
                key={i}
                className={`absolute glass rounded-xl px-3.5 py-2.5 whitespace-nowrap shadow-glass ${c.pos}`}
                style={{ zIndex: 20 }}
              >
                <div className="text-[0.65rem] text-muted tracking-wide">{c.label}</div>
                <div className={`text-[0.88rem] font-bold ${c.valueClass}`}>{c.value}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
