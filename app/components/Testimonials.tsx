"use client";

import { useFadeUp } from "./useFadeUp";

const discoveries = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="13" stroke="#2ED3C6" strokeWidth="1.5" />
        <path d="M9 14.5l3.5 3.5 6.5-7" stroke="#2ED3C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    headline: "Subscriptions bleeding you dry",
    body: "Most users find $100–$300/month in forgotten or duplicate subscriptions within the first week. Nautilius Money surfaces every recurring charge automatically.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="13" stroke="#4DA3FF" strokeWidth="1.5" />
        <path d="M8 18l4-5 3 3 5-7" stroke="#4DA3FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    headline: "Where you actually stand vs. your peers",
    body: "Your Nautilus Score tells you exactly how your savings rate, debt load, and net worth compare to people in your income bracket — not a vague \"good job.\"",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="13" stroke="#A78BFA" strokeWidth="1.5" />
        <path d="M14 8v6l3.5 3.5" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    headline: "How far off track your retirement is",
    body: "The retirement component of your score shows whether you're on pace or falling behind — and by how much. No guesswork, no spreadsheets.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="13" stroke="#4ADE80" strokeWidth="1.5" />
        <path d="M10 17c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="14" cy="10" r="2" fill="#4ADE80"/>
      </svg>
    ),
    headline: "What to fix first",
    body: "Instead of overwhelming you with 50 data points, Nautilius Money gives you a prioritized action list. The highest-impact change to your financial health, ranked.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="13" stroke="#2ED3C6" strokeWidth="1.5" />
        <path d="M8 14h12M14 8v12" stroke="#2ED3C6" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    headline: "Cash flow you didn't know you had",
    body: "By categorizing every transaction, Nautilius Money shows exactly where money leaks out — and finds the slack you can redirect toward goals without lifestyle cuts.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="13" stroke="#4DA3FF" strokeWidth="1.5" />
        <path d="M10 11h8M10 14.5h6M10 18h4" stroke="#4DA3FF" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    headline: "A single number that tells the whole story",
    body: "Cash flow, emergency fund, retirement pace, debt health — scored, weighted, and combined into one Nautilus Score. Finally an honest answer to \"am I doing ok?\"",
  },
];

export default function Testimonials() {
  const ref = useFadeUp() as React.RefObject<HTMLElement>;

  return (
    <section ref={ref} className="py-24 px-[5vw] bg-bg2">
      <div className="text-[0.75rem] font-bold tracking-[0.12em] uppercase text-gold mb-3 flex items-center gap-2">
        <span className="inline-block w-6 h-[1.5px] bg-gold" />
        What You&apos;ll Discover
      </div>
      <h2 className="font-display text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.15] tracking-tight mb-3">
        Most people are surprised.
      </h2>
      <p className="text-muted text-[1.05rem] max-w-[540px] leading-[1.7]">
        Nautilius Money shows you things your bank won&apos;t tell you. Here&apos;s what users find in their first session.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {discoveries.map((d, i) => (
          <div
            key={d.headline}
            className="fade-up relative bg-bg3 border border-glass-border rounded-card p-7 overflow-hidden hover:border-accent/30 transition-colors"
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <div style={{ marginBottom: 14 }}>{d.icon}</div>
            <h3 className="font-bold text-[1rem] text-text mb-2">{d.headline}</h3>
            <p className="text-[0.9rem] text-muted leading-[1.65]">{d.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
