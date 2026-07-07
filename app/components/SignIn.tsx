"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase-browser";
import {LogoMark } from "./logo";
import PhoneMockup from "./PhoneMockup";

// ── Insight cards — reuses Hero's exact pattern ──────────────────────────────
const insightCards = [
  {
    pos: "top-[6%] -left-[45%] animate-float1",
    label: "Monthly Savings Found",
    value: "↑ +$347",
    valueClass: "text-green-400",
  },
  {
    pos: "top-[22%] -right-[42%] animate-float2",
    label: "Retirement Goal",
    value: "73% Complete",
    valueClass: "text-gold",
  },
  {
    pos: "top-[44%] -left-[48%] animate-float3 hidden lg:block",
    label: "Vacation Goal",
    value: "● On Track",
    valueClass: "text-accent",
  },
  {
    pos: "top-[62%] -right-[38%] animate-float1-slow",
    label: "Net Worth YTD",
    value: "+12.4%",
    valueClass: "text-green-400",
  },
  {
    pos: "bottom-[8%] -left-[40%] animate-float2-fast",
    label: "Active Subscriptions",
    value: "17 Tracked",
    valueClass: "text-gold",
  },
];

// ── Trust items — aligned with Security.tsx content ──────────────────────────
const trustItems = [
  {
    icon: "🔒",
    title: "256-bit AES Encryption",
    desc: "All data encrypted at rest and in transit",
  },
  {
    icon: "👁️",
    title: "Read-Only Access",
    desc: "We can never move or access your funds",
  },
  {
    icon: "🛡️",
    title: "Your Data, Private",
    desc: "We never sell or share your financial data",
  },
  {
    icon: "📊",
    title: "Secure Aggregation",
    desc: "Powered by Supabase + Plaid infrastructure",
  },
];

// ── Floating label input ──────────────────────────────────────────────────────
interface FloatInputProps {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  value: string;
  onChange: (v: string) => void;
  error?: string;
  rightSlot?: React.ReactNode;
  onBlur?: () => void;
}

function FloatInput({
  id,
  label,
  type = "text",
  autoComplete,
  inputMode,
  value,
  onChange,
  error,
  rightSlot,
  onBlur,
}: FloatInputProps) {
  const filled = value.length > 0;

  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder=" "
        className={[
          "peer w-full bg-bg3/60 border rounded-xl pt-[22px] pb-[8px] px-4",
          "text-[0.95rem] text-text font-body outline-none transition-all duration-200",
          rightSlot ? "pr-12" : "",
          error
            ? "border-red-500/50 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
            : filled
            ? "border-accent/30 focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(77,163,255,0.1)]"
            : "border-glass-border focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(77,163,255,0.08)]",
          "focus:bg-accent/[0.04]",
        ]
          .filter(Boolean)
          .join(" ")}
      />
      <label
        htmlFor={id}
        className={[
          "absolute left-4 pointer-events-none transition-all duration-200 font-body",
          "peer-placeholder-shown:top-[50%] peer-placeholder-shown:-translate-y-1/2",
          "peer-placeholder-shown:text-[0.9rem] peer-placeholder-shown:text-muted",
          "peer-focus:top-[8px] peer-focus:translate-y-0",
          "peer-focus:text-[0.68rem] peer-focus:font-semibold peer-focus:tracking-[0.06em] peer-focus:uppercase peer-focus:text-accent",
          filled
            ? "top-[8px] translate-y-0 text-[0.68rem] font-semibold tracking-[0.06em] uppercase text-accent"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {label}
      </label>
      {rightSlot && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
      )}
      {error && (
        <p className="mt-1.5 ml-1 text-[0.75rem] text-red-400">{error}</p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SignIn() {
  const emailId = useId();
  const passwordId = useId();
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const validateEmail = () => {
    if (!email) { setEmailError("Email is required."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = () => {
    if (!password) { setPasswordError("Password is required."); return false; }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async () => {
    const emailOk = validateEmail();
    const passwordOk = validatePassword();
    if (!emailOk || !passwordOk) return;

    setAuthError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setAuthError(error.message); return; }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setEmailError("Enter your email above first."); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/landingpage/reset-password`,
    });
    setLoading(false);
    if (error) { setAuthError(error.message); return; }
    setResetSent(true);
  };

  return (
    <div className="min-h-screen bg-bg grid grid-cols-1 lg:grid-cols-2">

      {/* ═══════════════════════════════════════════════════════
          LEFT — Brand experience (mirrors Hero layout exactly)
      ═══════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex flex-col justify-start items-center px-[5vw] pt-8 pb-20 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 50%, rgba(11,45,137,0.35) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(77,163,255,0.08) 0%, transparent 60%), #07111F",
        }}
      >
        {/* Grid overlay — same as Hero */}
        <div className="absolute inset-0 pointer-events-none hero-grid-overlay" />

        {/* Logo — pinned top-left */}
        <a href="/" className="absolute top-6 left-[5vw] z-20 no-underline">
          <LogoMark size={40}/>
        </a>

        <div className="relative z-10 flex flex-col items-start max-w-[520px] w-full gap-10 pt-20">

          {/* Headline */}
          <div>
            <h1 className="font-display text-[clamp(2.2rem,3.5vw,3.2rem)] font-bold leading-[1.12] tracking-tight mb-4">
              Your Financial Journey<br />
              <span className="text-gold">Continues Here.</span>
            </h1>
            <p className="text-muted text-[1.05rem] leading-[1.7] max-w-[440px]">
              Everything you need to understand your money, from spending and subscriptions to retirement forecasts and your Nautilus Score is waiting for you.
            </p>
          </div>

          {/* Phone scene */}
          <div className="relative flex items-center justify-center w-full min-h-[540px]">
            {/* Glow behind phone */}
            <div
              className="absolute pointer-events-none"
              style={{
                width: 280,
                height: 480,
                background:
                  "radial-gradient(ellipse, rgba(11,45,137,0.6) 0%, rgba(77,163,255,0.15) 40%, transparent 70%)",
                filter: "blur(30px)",
              }}
            />

            {/* Phone + cards together so cards position relative to phone */}
            <div className="relative" style={{ width: 260, height: 580 }}>
              <PhoneMockup />
              {insightCards.map((c, i) => (
                <div
                  key={i}
                  className={`absolute glass rounded-xl px-3.5 py-2.5 whitespace-nowrap shadow-glass ${c.pos}`}
                  style={{ zIndex: 20 }}
                >
                  <div className="text-[0.65rem] text-muted tracking-wide">{c.label}</div>
                  <div className={`text-[0.88rem] font-bold ${c.valueClass}`}>{c.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          RIGHT — Auth card
      ═══════════════════════════════════════════════════════ */}
      <div
        className="flex flex-col justify-start items-center px-6 sm:px-12 pt-8 pb-16 relative"
        style={{
          background: "rgba(13,28,48,0.5)",
          borderLeft: "1px solid rgba(77,163,255,0.08)",
        }}
      >
        {/* Top edge light streak */}
        <div
          className="absolute top-0 left-1/4 right-1/4 h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(77,163,255,0.5), transparent)",
          }}
        />

        {/* Mobile-only logo */}
        <div className="flex lg:hidden mb-8">
          <LogoMark />
        </div>

        {/* ── Glass auth card ── */}
        <div
          className="glass rounded-card w-full max-w-[420px] px-8 sm:px-10 pt-3 pb-8 sm:pb-10 relative overflow-hidden"
          style={{
            background: "rgba(13,28,48,0.72)",
          }}
        >
          {/* Card top shimmer — same pattern as feature-card */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(77,163,255,0.5), transparent)",
            }}
          />

          {/* Card brand — desktop only (left panel has logo) */}
          <div className="hidden lg:flex justify-center mb-3">
            <LogoMark size={40} />
          </div>

          <h2 className="font-display text-[1.85rem] font-bold leading-tight tracking-tight mb-1.5">
            Welcome Back
          </h2>
          <p className="text-muted text-[0.9rem] leading-[1.6] mb-8">
            Sign in to your Financial Command Center.
          </p>

          {/* ── Form fields ── */}
          <div className="flex flex-col gap-4 mb-5">
            <FloatInput
              id={emailId}
              label="Email Address"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(v) => { setEmail(v); if (emailError) setEmailError(""); }}
              onBlur={validateEmail}
              error={emailError}
            />

            <FloatInput
              id={passwordId}
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(v) => { setPassword(v); if (passwordError) setPasswordError(""); }}
              onBlur={validatePassword}
              error={passwordError}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-muted hover:text-text transition-colors p-1"
                >
                  {showPassword ? (
                    /* eye-off */
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    /* eye */
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              }
            />
          </div>

          {/* ── Auth-level error ── */}
          {authError && (
            <p className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[0.82rem] text-red-400 leading-snug">
              {authError}
            </p>
          )}
          {resetSent && (
            <p className="mb-4 px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/30 text-[0.82rem] text-green-400 leading-snug">
              Password reset email sent — check your inbox.
            </p>
          )}

          {/* ── Remember / Forgot ── */}
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div
                onClick={() => setRememberMe((v) => !v)}
                className={[
                  "w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all duration-150 cursor-pointer",
                  rememberMe
                    ? "bg-accent border-accent"
                    : "bg-bg3/60 border-glass-border group-hover:border-accent/40",
                ].join(" ")}
                role="checkbox"
                aria-checked={rememberMe}
                tabIndex={0}
                onKeyDown={(e) => e.key === " " && setRememberMe((v) => !v)}
              >
                {rememberMe && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-[0.83rem] text-muted group-hover:text-text transition-colors">
                Remember me
              </span>
            </label>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[0.83rem] text-accent font-medium hover:opacity-75 hover:underline transition-opacity bg-transparent border-none cursor-pointer p-0"
            >
              Forgot Password?
            </button>
          </div>

          {/* ── Sign In button — matches CTA pattern ── */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl text-[0.95rem] font-bold transition-all duration-200 py-3.5 mb-6 relative overflow-hidden disabled:opacity-70 disabled:pointer-events-none hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #0B2D89 0%, #1A4FCC 60%, #4DA3FF 140%)",
              boxShadow: "0 4px 24px rgba(11,45,137,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
              color: "#fff",
            }}
          >
            {/* Inner shimmer — same as feature-card::before approach */}
            <span
              className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)",
              }}
            />

            {loading ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-glass-border" />
            <span className="text-[0.75rem] text-muted font-medium">New to  Nautilus Money?</span>
            <div className="flex-1 h-px bg-glass-border" />
          </div>

          {/* ── Create account ── */}
          <p className="text-center text-[0.875rem] text-muted">
            Start building wealth today.{" "}
            <a
              href="/landingpage/signup"
              className="text-accent font-semibold no-underline hover:opacity-75 hover:underline transition-opacity"
            >
              Create Account →
            </a>
          </p>
        </div>

        {/* ── Trust footer ── */}
        <div className="w-full max-w-[420px] mt-7">

          {/* Label — matches Security.tsx eyebrow style */}
          <div className="text-[0.72rem] font-bold tracking-[0.12em] uppercase text-muted text-center mb-4 flex justify-center items-center gap-2">
            <span className="inline-block w-5 h-px bg-muted/40" />
            Trusted Financial Infrastructure
            <span className="inline-block w-5 h-px bg-muted/40" />
          </div>

          {/* Trust grid — same card style as Security.tsx */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {trustItems.map((item) => (
              <div
                key={item.title}
                className="bg-bg2 border border-glass-border rounded-[14px] p-3.5 flex items-start gap-2.5 hover:border-accent/30 transition-colors duration-300"
              >
                <div className="text-[1.1rem] mt-0.5 shrink-0">{item.icon}</div>
                <div>
                  <div className="text-[0.78rem] font-bold text-text leading-tight mb-0.5">
                    {item.title}
                  </div>
                  <div className="text-[0.7rem] text-muted leading-[1.4]">
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Powered-by badges */}
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-glass-border">
            <span className="text-[0.72rem] text-muted">Powered by</span>
            {["Supabase Auth", "Plaid"].map((name) => (
              <span
                key={name}
                className="flex items-center gap-1.5 bg-bg2 border border-glass-border rounded-md px-2.5 py-1"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-dot-pulse"
                  style={{ background: "#00C896" }}
                />
                <span className="text-[0.72rem] font-semibold text-muted">
                  {name}
                </span>
              </span>
            ))}
          </div>

          {/* Privacy note */}
          <p className="text-center text-[0.72rem] text-muted leading-[1.6] mt-4 px-2">
            By signing in you agree to our{" "}
            <a href="/terms" className="text-accent/70 no-underline hover:underline">
              Terms
            </a>{" "}
            &amp;{" "}
            <a href="/landingpage/privacy" className="text-accent/70 no-underline hover:underline">
              Privacy Policy
            </a>
            . Nautilus never sells or uses your financial data beyond delivering the service.
          </p>
        </div>
      </div>
    </div>
  );
}
