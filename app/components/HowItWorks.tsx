const steps = [
  {
    number: "01",
    color: "#4DA3FF",
    headline: "Connect your accounts",
    body: "Securely link your bank, credit cards, and investments via Plaid in about 60 seconds. Read-only — we never move money.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="16" rx="3" stroke="#4DA3FF" strokeWidth="1.5"/>
        <path d="M4 13h24" stroke="#4DA3FF" strokeWidth="1.5"/>
        <rect x="8" y="17" width="5" height="3" rx="1" fill="#4DA3FF" opacity="0.5"/>
      </svg>
    ),
  },
  {
    number: "02",
    color: "#2ED3C6",
    headline: "Get your Nautilus Score",
    body: "We grade your cash flow, emergency fund, retirement pace, and debt in one number. Instant. No waiting, no questionnaire.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M6 22 Q16 6 26 22" stroke="#2ED3C6" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <line x1="16" y1="22" x2="22" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="16" cy="22" r="2.5" fill="#2ED3C6"/>
        <text x="16" y="29" textAnchor="middle" fontSize="7" fill="#2ED3C6" fontWeight="bold">SCORE</text>
      </svg>
    ),
  },
  {
    number: "03",
    color: "#A78BFA",
    headline: "Know exactly what to fix",
    body: "Nautilius gives you a ranked action list — the one change that will move your score the most, not a wall of generic tips.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M10 10h12M10 16h9M10 22h6" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="24" cy="22" r="4" stroke="#A78BFA" strokeWidth="1.5"/>
        <path d="M22.5 22l1 1 2-2" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 px-[5vw]">
      <div className="text-[0.75rem] font-bold tracking-[0.12em] uppercase text-gold mb-3 flex items-center gap-2">
        <span className="inline-block w-6 h-[1.5px] bg-gold" />
        How It Works
      </div>
      <h2 className="font-display text-[clamp(1.8rem,3vw,2.8rem)] font-bold leading-[1.15] tracking-tight mb-12">
        Up and running in under 2 minutes.
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {/* Connector line — desktop only */}
        <div
          className="hidden md:block absolute top-[44px] left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] h-[1px] pointer-events-none"
          style={{ background: "linear-gradient(90deg, rgba(77,163,255,0.3), rgba(46,211,198,0.3), rgba(167,139,250,0.3))" }}
        />

        {steps.map((s, i) => (
          <div
            key={s.number}
            className="relative bg-bg2 border border-glass-border rounded-card p-7 hover:border-accent/30 transition-colors"
          >
            <div className="flex items-start gap-4 mb-5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}
              >
                {s.icon}
              </div>
              <span
                className="font-display text-[2.5rem] font-black leading-none mt-[-4px] select-none"
                style={{ color: `${s.color}20` }}
              >
                {s.number}
              </span>
            </div>
            <h3 className="font-bold text-[1.05rem] text-text mb-2">{s.headline}</h3>
            <p className="text-[0.9rem] text-muted leading-[1.65]">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
