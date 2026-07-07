import { LogoMark } from "./logo";

export default function CtaSection() {
  return (
    <section className="relative pt-10 pb-24 px-[5vw] text-center overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 50%, rgba(11,45,137,0.3) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex justify-center mb-4">
        <LogoMark size={50} className="!rounded-none" />
      </div>

      <h2 className="relative z-10 font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.15] tracking-tight mb-4">
        The system wasn&apos;t built
        <br />
        to set you{" "}
        <span className="text-gold">free.</span>
      </h2>
      <p className="relative z-10 text-[1.1rem] max-w-[500px] mx-auto leading-[1.75] mb-3" style={{ color: '#7A90B8' }}>
        But understanding your finances is how you start getting there. WealthLens gives you the visibility, the score, and the roadmap — the same intelligence large organizations use to make better decisions, built for your financial life.
      </p>
      <p className="relative z-10 text-[0.92rem] mb-10" style={{ color: '#2ED3C6' }}>
        Launch pricing locked in for the first 100,000 subscribers.
      </p>

      <div className="relative z-10 flex flex-wrap justify-center gap-4">
        <a
          href="/onboarding"
          className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-bg font-bold text-[1rem] px-9 py-4 rounded-xl no-underline transition-all hover:-translate-y-0.5 hover:shadow-gold-glow-lg"
          style={{ boxShadow: "0 4px 24px rgba(46,211,198,0.25)" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Get your free score today
        </a>
        <a
          href="/landingpage/pricing"
          className="inline-flex items-center bg-transparent font-medium text-[1rem] px-8 py-4 rounded-xl no-underline border border-glass-border hover:border-accent/40 hover:bg-accent/5 hover:text-accent transition-all"
          style={{ color: '#C8D8EC' }}
        >
          See pricing →
        </a>
      </div>

      <p className="relative z-10 mt-6 text-[0.8rem]" style={{ color: '#7A90B8' }}>
        14-day free trial. Premium from $12/month. Cancel before it ends and you won&apos;t be charged.
      </p>
    </section>
  );
}
