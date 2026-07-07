"use client";

import { type RefObject } from "react";
import { useFadeUp } from "./useFadeUp";

const stats = [
  {
    number: "< 2 min",
    label: "to get your Nautilus Score",
  },
  {
    number: "14 days",
    label: "free trial — cancel any time",
  },
  {
    number: "5 ★",
    label: "rated by early beta users",
  },
  {
    number: "Read-only",
    label: "we never touch your money",
  },
];

export default function StatsStrip() {
  const ref = useFadeUp() as RefObject<HTMLDivElement>;

  return (
    <div
      ref={ref}
      className="bg-bg2 border-t border-b border-glass-border px-[5vw] py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
    >
      {stats.map((s) => (
        <div key={s.label} className="fade-up">
          <div className="font-display text-[2rem] font-bold text-gold leading-none mb-1">
            {s.number}
          </div>
          <div className="text-[0.85rem] text-muted">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
