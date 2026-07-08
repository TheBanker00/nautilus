"use client";

import { useFadeUp } from "./useFadeUp";

const items = [
  {
    icon: "🏦",
    name: "Plaid-Powered Connection",
    desc: "Your bank credentials go directly to your bank via Plaid's OAuth flow — Nautilus Money never sees them.",
  },
  {
    icon: "🚫",
    name: "No Account Numbers",
    desc: "We deliberately don't import account or routing numbers. Transaction data only, by design.",
  },
  {
    icon: "🏛️",
    name: "Read-Only, Always",
    desc: "Nautilus can never move your money. Payment initiation is architecturally disabled on every connection.",
  },
  {
    icon: "🔒",
    name: "Encrypted & Isolated",
    desc: "AES-256 encryption at rest, TLS 1.3 in transit, and row-level security so your data is yours alone.",
  },
];

export default function Security() {
  const ref = useFadeUp() as React.RefObject<HTMLElement>;

  return (
    <section ref={ref} className="py-20 px-[5vw] text-center">
      <div className="text-[0.75rem] font-bold tracking-[0.12em] uppercase text-gold mb-3 flex justify-center items-center gap-2">
        <span className="inline-block w-6 h-[1.5px] bg-gold" />
        Enterprise-Grade Security
      </div>
      <h2 className="font-display text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.15] tracking-tight mx-auto max-w-[600px]">
        Your data, locked down like a vault
      </h2>
      <p className="text-muted text-[1.05rem] leading-[1.7] max-w-[520px] mx-auto mt-3">
        We apply the same security protocols used by the world's largest
        financial institutions.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
        {items.map((item, i) => (
          <div
            key={item.name}
            className="fade-up bg-bg2 border border-glass-border rounded-card p-7 text-center transition-all duration-300 hover:border-accent/30 hover:-translate-y-1"
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <div className="text-[2rem] mb-3">{item.icon}</div>
            <div className="font-bold text-[0.95rem] mb-1.5">{item.name}</div>
            <div className="text-[0.82rem] text-muted leading-[1.5]">{item.desc}</div>
          </div>
        ))}
      </div>
      <div className="mt-10">
        <a href="/landingpage/security" className="text-[0.85rem] font-semibold text-accent hover:text-accent/80 transition-colors no-underline">
          Read our full security architecture →
        </a>
      </div>
    </section>
  );
}