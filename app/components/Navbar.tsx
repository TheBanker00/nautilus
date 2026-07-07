"use client";

import { LogoMark } from "./logo";

const links = [
  { label: "Features", href: "/landingpage/features" },
  { label: "Pricing",  href: "/landingpage/pricing" },
  { label: "Security", href: "/landingpage/security" },
  { label: "FAQ",      href: "/landingpage/faq" },
];

export default function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5vw] h-[68px] border-b border-glass-border"
      style={{
        background: "rgba(7,17,31,0.82)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <a href="/" className="no-underline flex items-center" style={{ height: 68, overflow: 'hidden' }}>
        <LogoMark size={40} />
      </a>

      <ul className="hidden md:flex items-center gap-8 list-none">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-muted text-sm font-medium tracking-wide no-underline hover:text-text transition-colors"
            >
              {l.label}
            </a>
          </li>
        ))}

        {/* Login Button */}
        <li>
          <a
            href="/landingpage/signin"
            className="text-muted text-[0.88rem] font-medium px-4 py-[0.45rem] rounded-lg no-underline hover:text-text transition-all"
          >
            Log In
          </a>
        </li>

        {/* Get Started Button */}
        <li>
          <a
            href="/landingpage/signup"
            className="text-bg text-[0.88rem] font-semibold bg-gold hover:bg-gold-light px-5 py-[0.45rem] rounded-lg no-underline transition-all hover:shadow-[0_0_20px_rgba(255,215,0,0.65)] hover:scale-[1.03]"
          >
            Get Started Free
          </a>
        </li>
      </ul>
    </nav>
  );
}
