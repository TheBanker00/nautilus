import PhoneMockup from "./PhoneMockup";
import Image from "next/image";

const trustBadges = ["Plaid Connected", "256-bit Encryption", "Read-Only Access", "No Account Numbers Stored"];

export default function Hero() {
  return (
    <section className="relative min-h-screen pt-[120px] pb-20 px-[5vw] grid grid-cols-1 lg:grid-cols-2 gap-16 items-center overflow-hidden">
      {/* Background — hero art on all sizes, contained to this section only.
          The section has overflow-hidden and this layer is absolute inset-0,
          so background-size:cover crops to fit without bleeding out. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/Backround3.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* legibility overlay so headline + copy stay readable over the art.
            Horizontal scrim on desktop; a stronger vertical scrim on mobile where content is centered. */}
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(7,17,31,0.55) 0%, rgba(7,17,31,0.45) 50%, rgba(7,17,31,0.7) 100%)",
          }}
        />
        <div
          className="absolute inset-0 hidden lg:block"
          style={{
            background:
              "linear-gradient(90deg, rgba(7,17,31,0.6) 0%, rgba(7,17,31,0.25) 45%, rgba(7,17,31,0.5) 100%)",
          }}
        />
      </div>
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

        <p className="text-[1.08rem] font-medium leading-[1.75] max-w-[480px] mb-10" style={{ color: '#DCE7F5', textShadow: '0 1px 2px rgba(0,0,0,0.55), 0 2px 18px rgba(0,0,0,0.6)' }}>
          Bring every account, investment, bill, subscription, loan, and financial goal into one intelligent platform. Discover your Nautilus Score, see exactly where you stand today, and confidently chart your course to financial independence.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
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
        <div className="mt-10 flex flex-wrap gap-2 justify-center lg:justify-start">
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
        {/* Mobile — just the phone mockup as the example (no desktop screenshot) */}
        <div className="lg:hidden flex justify-center w-full">
          <PhoneMockup />
        </div>

        {/* Desktop — full composition: dashboard screenshot + phone + floating cards */}
        <div className="hidden lg:block relative" style={{ width: 'min(1060px, 63vw)', height: 650 }}>

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
              left: '-20%',
              transform: 'translateY(-50%)',
              zIndex: 5,
              borderRadius: 12,
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(46,211,198,0.15)',
              width: '98%',
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
              right: 0,
              transform: 'translateY(-48%)',
              zIndex: 10,
              width: 'min(260px, 13vw)',
              height: 580,
            }}
          >
            <PhoneMockup />
          </div>

        </div>
      </div>
    </section>
  );
}
