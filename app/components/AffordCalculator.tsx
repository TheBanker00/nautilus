"use client";

import { useState, useEffect, useRef } from "react";

interface GoalPreset {
  label: string;
  emoji: string;
  name: string;
  amount: string;
  amountNum: number;
  months: number;
  pct: number;
  monthlyNeeded: number;
  status: "Achievable" | "Stretch" | "On Track";
}

const PRESETS: GoalPreset[] = [
  { label: "Vacation",      emoji: "🌴", name: "Vacation to Europe",  amount: "$4,500",     amountNum: 4500,    months: 12,  pct: 68, monthlyNeeded: 350,   status: "Achievable" },
  { label: "Home Purchase", emoji: "🏠", name: "Home Down Payment",   amount: "$62,000",    amountNum: 62000,   months: 36,  pct: 42, monthlyNeeded: 1720,  status: "Stretch"    },
  { label: "New Car",       emoji: "🚗", name: "New Car",             amount: "$8,000",     amountNum: 8000,    months: 18,  pct: 78, monthlyNeeded: 444,   status: "Achievable" },
  { label: "Retirement",    emoji: "☀️", name: "Retirement Fund",    amount: "$1,200,000", amountNum: 1200000, months: 240, pct: 29, monthlyNeeded: 2180,  status: "On Track"   },
  { label: "Custom",        emoji: "✏️", name: "Custom Goal",        amount: "$10,000",    amountNum: 10000,   months: 24,  pct: 55, monthlyNeeded: 416,   status: "Achievable" },
];

const MONTHLY_CAPACITY = 2840;

export default function AffordCalculator() {
  const [active, setActive] = useState(0);
  const [goalName, setGoalName] = useState(PRESETS[0].name);
  const [months, setMonths] = useState(PRESETS[0].months);
  const rangeRef = useRef<HTMLInputElement>(null);

  const preset = PRESETS[active];
  const surplus = MONTHLY_CAPACITY - preset.monthlyNeeded;
  const maxMonths = preset.label === "Retirement" ? 360 : 60;

  function updateRangeStyle() {
    const el = rangeRef.current;
    if (!el) return;
    const pct = ((months - 1) / (maxMonths - 1)) * 100;
    el.style.background = `linear-gradient(90deg, #0B2D89 0%, #4DA3FF ${pct}%, #122040 ${pct}%, #122040 100%)`;
  }

  useEffect(() => {
    updateRangeStyle();
  });

  function selectPreset(i: number) {
    setActive(i);
    setGoalName(PRESETS[i].name);
    setMonths(PRESETS[i].months);
  }

  return (
    <section
      id="afford"
      className="relative py-24 px-[5vw] bg-bg2 overflow-hidden"
    >
      {/* BG glow */}
      <div
        className="absolute -top-48 -right-48 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(11,45,137,0.25) 0%, transparent 70%)",
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start relative z-10">
        {/* LEFT — inputs */}
        <div>
          <div className="text-[0.75rem] font-bold tracking-[0.12em] uppercase text-gold mb-3 flex items-center gap-2">
            <span className="inline-block w-6 h-[1.5px] bg-gold" />
            Financial Intelligence
          </div>
          <h2 className="font-display text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.15] tracking-tight mb-3">
            What Can I Afford?
          </h2>
          <p className="text-muted text-[1.05rem] leading-[1.7] max-w-[520px] mb-8">
            Stop guessing. Enter your situation and Nautilius instantly models
            whether your goal is achievable — and how to get there faster.
          </p>

          {/* Goal tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {PRESETS.map((p, i) => (
              <button
                key={p.label}
                onClick={() => selectPreset(i)}
                className={`text-[0.85rem] font-semibold px-4 py-2 rounded-lg border transition-all cursor-pointer ${
                  active === i
                    ? "bg-royal border-accent text-text"
                    : "bg-transparent border-glass-border text-muted hover:bg-royal/30 hover:border-accent/40 hover:text-text"
                }`}
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>

          {/* Inputs */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-semibold text-muted uppercase tracking-wider">
                Goal Name
              </label>
              <input
                type="text"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="bg-bg3 border border-glass-border rounded-xl px-4 py-3 text-text font-semibold text-base outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-semibold text-muted uppercase tracking-wider">
                Target Amount
              </label>
              <input
                type="text"
                defaultValue={preset.amount}
                key={preset.amount}
                className="bg-bg3 border border-glass-border rounded-xl px-4 py-3 text-text font-semibold text-base outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-semibold text-muted uppercase tracking-wider">
                Timeline:{" "}
                <span className="text-text font-bold">
                  {months} month{months !== 1 ? "s" : ""}
                </span>
              </label>
              <input
                ref={rangeRef}
                type="range"
                className="range-track"
                min={1}
                max={maxMonths}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-semibold text-muted uppercase tracking-wider">
                Monthly Savings Capacity
              </label>
              <input
                type="text"
                defaultValue="$2,840/mo available"
                className="bg-bg3 border border-glass-border rounded-xl px-4 py-3 text-text font-semibold text-base outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>
        </div>

        {/* RIGHT — result */}
        <div className="bg-bg3 border border-glass-border rounded-card p-8 lg:sticky lg:top-24">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="text-[0.75rem] font-bold tracking-[0.1em] uppercase text-gold">
              Nautilius Analysis
            </div>
            <div
              className={`text-[0.72rem] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                preset.status === "Stretch"
                  ? "bg-gold/10 text-gold border border-gold/25"
                  : "bg-green-400/10 text-green-400 border border-green-400/25"
              }`}
            >
              {preset.status === "Stretch" ? "Stretch Goal" : `${preset.status} ✓`}
            </div>
          </div>

          <div className="font-display text-[2.8rem] font-bold text-text leading-none mb-1">
            {preset.amount}
          </div>
          <div className="text-[0.85rem] text-muted mb-6">
            {goalName} — {months} month{months !== 1 ? "s" : ""} away
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-[0.78rem] mb-2">
              <span className="text-muted">Current savings toward goal</span>
              <span className="text-accent font-semibold">{preset.pct}%</span>
            </div>
            <div className="h-1.5 bg-bg rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${preset.pct}%`,
                  background: "linear-gradient(90deg, #0B2D89, #4DA3FF)",
                }}
              />
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex flex-col">
            {[
              {
                label: "Monthly contribution needed",
                value: `$${preset.monthlyNeeded.toLocaleString()}/mo`,
                cls: "text-text",
              },
              {
                label: "Your available capacity",
                value: `$${MONTHLY_CAPACITY.toLocaleString()}/mo`,
                cls: "text-green-400",
              },
              {
                label: "Surplus after goal",
                value: `${surplus >= 0 ? "+" : ""}$${Math.abs(surplus).toLocaleString()}/mo`,
                cls: surplus >= 0 ? "text-green-400" : "text-red-400",
              },
              {
                label: "Recommended savings account",
                value: "HYSA @ 4.8% APY",
                cls: "text-accent",
              },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className={`flex justify-between items-center py-3 ${
                  i < arr.length - 1 ? "border-b border-glass-border" : ""
                }`}
              >
                <span className="text-[0.85rem] text-muted">{row.label}</span>
                <span className={`text-[0.9rem] font-bold ${row.cls}`}>{row.value}</span>
              </div>
            ))}
          </div>

          <a
            href="#"
            className="flex justify-center items-center w-full mt-6 bg-gold hover:bg-gold-light text-bg font-bold text-[0.95rem] py-3.5 rounded-xl no-underline transition-all hover:-translate-y-0.5 hover:shadow-gold-glow"
          >
            Open My Nautilius Plan →
          </a>
          <p className="text-[0.75rem] text-muted text-center mt-3">
            Based on your connected accounts. Actual results may vary.
          </p>
        </div>
      </div>
    </section>
  );
}