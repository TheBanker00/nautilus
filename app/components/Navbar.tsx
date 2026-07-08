"use client";

import { useState } from "react";
import { LogoMark } from "./logo";

const links = [
  { label: "Features", href: "/landingpage/features" },
  { label: "Pricing",  href: "/landingpage/pricing" },
  { label: "Security", href: "/landingpage/security" },
  { label: "FAQ",      href: "/landingpage/faq" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
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

        {/* Desktop nav — hidden on mobile */}
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

          <li>
            <a
              href="/landingpage/signin"
              className="text-muted text-[0.88rem] font-medium px-4 py-[0.45rem] rounded-lg no-underline hover:text-text transition-all"
            >
              Log In
            </a>
          </li>

          <li>
            <a
              href="/landingpage/signup"
              className="text-bg text-[0.88rem] font-semibold bg-gold hover:bg-gold-light px-5 py-[0.45rem] rounded-lg no-underline transition-all hover:shadow-[0_0_20px_rgba(255,215,0,0.65)] hover:scale-[1.03]"
            >
              Get Started Free
            </a>
          </li>
        </ul>

        {/* Hamburger button — mobile only */}
        <button
          className="md:hidden flex flex-col justify-center items-center gap-[5px] w-10 h-10 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(77,163,255,0.18)' }}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span style={{
            display: 'block', width: 18, height: 2, background: '#F0F4FF', borderRadius: 2,
            transition: 'all 0.2s',
            transform: open ? 'translateY(7px) rotate(45deg)' : 'none',
          }} />
          <span style={{
            display: 'block', width: 18, height: 2, background: '#F0F4FF', borderRadius: 2,
            transition: 'all 0.2s',
            opacity: open ? 0 : 1,
          }} />
          <span style={{
            display: 'block', width: 18, height: 2, background: '#F0F4FF', borderRadius: 2,
            transition: 'all 0.2s',
            transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none',
          }} />
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      <div
        className="md:hidden fixed left-0 right-0 z-40"
        style={{
          top: 68,
          background: "rgba(7,17,31,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: '1px solid rgba(77,163,255,0.15)',
          overflow: 'hidden',
          maxHeight: open ? 400 : 0,
          transition: 'max-height 0.3s ease',
        }}
      >
        <div style={{ padding: '16px 24px 24px' }}>
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                padding: '13px 0',
                color: '#C8D8EC',
                fontSize: 16,
                fontWeight: 500,
                textDecoration: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {l.label}
            </a>
          ))}

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a
              href="/landingpage/signin"
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '12px',
                color: '#C8D8EC',
                fontSize: 15,
                fontWeight: 500,
                textDecoration: 'none',
                border: '1px solid rgba(77,163,255,0.25)',
                borderRadius: 10,
              }}
            >
              Log In
            </a>
            <a
              href="/landingpage/signup"
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '12px',
                background: '#D4AF37',
                color: '#07111F',
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
                borderRadius: 10,
              }}
            >
              Get Started Free
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
