"use client";

import { useFadeUp } from "./useFadeUp";

const features = [
  {
    icon: "🏦",
    name: "Unified Accounts",
    desc: "Link every bank, credit card, investment account, loan, and crypto wallet in one place. Real-time balances, always accurate.",
  },
  {
    icon: "📊",
    name: "AI Cash Flow Forecasting",
    desc: "Know exactly how much you'll have — next week, next month, next year. Our model learns your income and spending patterns automatically.",
  },
  {
    icon: "🎯",
    name: "Goal Architecture",
    desc: "Build custom goals from retirement to a dream vacation. Nautilius Money maps your path, tracks progress, and adjusts recommendations in real time.",
  },
  {
    icon: "🔍",
    name: "Subscription Intelligence",
    desc: "Surface every recurring charge — including ones you forgot about. Cancel with one tap. We find the average member $347 per month.",
  },
  {
    icon: "📈",
    name: "Investment Tracking",
    desc: "See your full portfolio across brokerages. Track performance, asset allocation, and rebalancing opportunities without switching apps.",
  },
  {
    icon: "🤖",
    name: "Your Personal CFO",
    desc: "Ask Nautilius anything. Can I afford a new car? Am I saving enough for retirement? Get personalized, data-backed answers instantly.",
  },
];

export default function Features() {
  const ref = useFadeUp() as React.RefObject<HTMLElement>;

  return (
    <section ref={ref} className="py-24 px-[5vw]">
      <div className="text-[0.75rem] font-bold tracking-[0.12em] uppercase text-gold mb-3 flex items-center gap-2">
        <span className="inline-block w-6 h-[1.5px] bg-gold" />
        Platform Capabilities
      </div>
      <h2 className="font-display text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.15] tracking-tight mb-4 max-w-[600px]">
        Everything your financial life requires
      </h2>
      <p className="text-muted text-[1.05rem] leading-[1.7] max-w-[540px] mb-12">
        Nautilius Money connects to over 12,000 financial institutions, giving you a
        complete picture that no single bank can provide.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <div
            key={f.name}
            className="feature-card fade-up relative bg-bg2 border border-glass-border rounded-card p-8 overflow-hidden transition-all duration-300 hover:border-accent/30 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
            style={{ transitionDelay: `${(i % 3) * 80}ms` }}
          >
            <div className="w-11 h-11 bg-royal/40 border border-accent/20 rounded-xl flex items-center justify-center text-xl mb-5">
              {f.icon}
            </div>
            <div className="font-bold text-[1.05rem] mb-2 text-text">{f.name}</div>
            <div className="text-[0.9rem] text-muted leading-[1.6]">{f.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
