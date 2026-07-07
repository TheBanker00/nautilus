"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase-browser";
import { LogoMark } from "./logo";

const walkthroughSteps = [
  {
    step: 1,
    title: "Your Email",
    desc: "Enter your email to create your account and get started.",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    ),
    accent: "#4DA3FF",
    detail: "anthonyamifsud@gmail.com",
  },
  {
    step: 2,
    title: "Your Details",
    desc: "Set your name and a secure password for your account.",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    accent: "#4DA3FF",
    detail: "John Smith  ••••••••",
  },
  {
    step: 3,
    title: "Choose Your Plan",
    desc: "Select the plan that fits your financial journey.",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
      </svg>
    ),
    accent: "#D4AF37",
    detail: "Nautilus Pro — $9.99/mo",
  },
  {
    step: 4,
    title: "Set Your Goals",
    desc: "Tell us your retirement age, income, and savings targets.",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    accent: "#2ED3C6",
    detail: "Retire at 55  ·  $120k/yr",
  },
  {
    step: 5,
    title: "Connect Accounts",
    desc: "Securely link your banks and investments via Plaid.",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    accent: "#2ED3C6",
    detail: "Chase  ·  Fidelity  ·  Ally",
  },
  {
    step: 6,
    title: "Your Nautilus Score",
    desc: "See your financial health score and start navigating.",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
    accent: "#D4AF37",
    detail: "Score: 82 — Excellent",
  },
];

function OnboardingWalkthrough() {
  return (
    <div className="flex flex-col items-center justify-center w-full py-8">
      {/* Phone outer shell */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: 260,
          borderRadius: 44,
          background: "linear-gradient(160deg, #1a2a3a 0%, #0a1420 100%)",
          border: "2px solid rgba(255,255,255,0.12)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(0,0,0,0.5)",
          padding: "3px",
        }}
      >
        {/* Screen — fills the shell */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            borderRadius: 42,
            background: "linear-gradient(180deg, #060e1c 0%, #0a1628 100%)",
            flex: 1,
          }}
        >
          {/* Status bar */}
          <div className="relative flex items-center justify-between px-5 pt-3 pb-1">
            {/* Time */}
            <div className="text-[0.62rem] font-bold text-white/80">9:41</div>
            {/* Dynamic island / camera — truly centered */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center" style={{ width: 80, height: 20, background: "#000", borderRadius: 20 }}>
              <div className="w-2 h-2 rounded-full" style={{ background: "#1a1a1a", border: "1px solid #333" }} />
            </div>
            {/* Icons */}
            <div className="flex items-center gap-1">
              {/* Signal */}
              <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                <rect x="0" y="6" width="2" height="3" rx="0.5" fill="rgba(255,255,255,0.8)"/>
                <rect x="3" y="4" width="2" height="5" rx="0.5" fill="rgba(255,255,255,0.8)"/>
                <rect x="6" y="2" width="2" height="7" rx="0.5" fill="rgba(255,255,255,0.8)"/>
                <rect x="9" y="0" width="2" height="9" rx="0.5" fill="rgba(255,255,255,0.4)"/>
              </svg>
              {/* WiFi */}
              <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                <path d="M6 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="rgba(255,255,255,0.8)"/>
                <path d="M2.5 4.5C3.6 3.4 4.7 2.8 6 2.8s2.4.6 3.5 1.7" stroke="rgba(255,255,255,0.8)" strokeWidth="1" strokeLinecap="round" fill="none"/>
                <path d="M0.5 2.5C2.1 1 3.9 0.3 6 0.3s3.9.7 5.5 2.2" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round" fill="none"/>
              </svg>
              {/* Battery */}
              <div className="flex items-center gap-0.5">
                <div className="relative" style={{ width: 18, height: 10, border: "1px solid rgba(255,255,255,0.5)", borderRadius: 2.5 }}>
                  <div style={{ position: 'absolute', left: 1, top: 1, bottom: 1, width: '85%', background: "rgba(46,211,198,0.9)", borderRadius: 1.5 }} />
                </div>
                <div style={{ width: 2, height: 5, background: "rgba(255,255,255,0.4)", borderRadius: "0 1px 1px 0" }} />
              </div>
            </div>
          </div>

          {/* App header bar */}
          <div className="flex items-center justify-between px-5 py-2.5" style={{ borderBottom: "1px solid rgba(77,163,255,0.1)" }}>
            <div className="flex items-center gap-2">
              <img src="/nautilus logo 1.png" alt="Nautilus" style={{ height: 18, width: "auto" }} />
            </div>
            <div className="text-[0.58rem] font-bold tracking-[0.08em] uppercase" style={{ color: "#2ED3C6" }}>Setup Guide</div>
          </div>

          {/* Screen title */}
          <div className="px-5 pt-3 pb-2">
            <div className="text-[0.58rem] font-bold tracking-[0.1em] uppercase text-muted mb-0.5">Your Journey</div>
            <div className="font-display font-bold text-[0.92rem] text-text">Getting Started</div>
          </div>

          {/* Timeline */}
          <div className="px-4 pb-4 flex flex-col">
            {walkthroughSteps.map((s, i) => (
              <div key={s.step} className="flex gap-3">
                <div className="flex flex-col items-center" style={{ width: 28 }}>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[0.65rem] font-bold"
                    style={{ background: `${s.accent}18`, color: s.accent, border: `1.5px solid ${s.accent}40` }}
                  >
                    {s.step}
                  </div>
                  {i < walkthroughSteps.length - 1 && (
                    <div className="flex-1 w-px my-1" style={{ background: "rgba(77,163,255,0.12)", minHeight: 12 }} />
                  )}
                </div>
                <div className="pb-3 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span style={{ color: s.accent }} className="shrink-0">{s.icon}</span>
                    <span className="text-[0.78rem] font-bold text-text leading-tight">{s.title}</span>
                  </div>
                  <div className="text-[0.65rem] text-muted leading-[1.4]">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Home indicator */}
          <div className="flex justify-center py-3">
            <div className="w-20 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

const trustItems = [
  { icon: "🔒", title: "256-bit AES Encryption", desc: "All data encrypted at rest and in transit" },
  { icon: "👁️", title: "Read-Only Access", desc: "We can never move or access your funds" },
  { icon: "🛡️", title: "Your Data, Private", desc: "We never sell or share your financial data" },
  { icon: "📊", title: "Secure Aggregation", desc: "Powered by Supabase + Plaid infrastructure" },
];

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

function FloatInput({ id, label, type = "text", autoComplete, inputMode, value, onChange, error, rightSlot, onBlur }: FloatInputProps) {
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
        ].filter(Boolean).join(" ")}
      />
      <label
        htmlFor={id}
        className={[
          "absolute left-4 pointer-events-none transition-all duration-200 font-body",
          "peer-placeholder-shown:top-[50%] peer-placeholder-shown:-translate-y-1/2",
          "peer-placeholder-shown:text-[0.9rem] peer-placeholder-shown:text-muted",
          "peer-focus:top-[8px] peer-focus:translate-y-0",
          "peer-focus:text-[0.68rem] peer-focus:font-semibold peer-focus:tracking-[0.06em] peer-focus:uppercase peer-focus:text-accent",
          filled ? "top-[8px] translate-y-0 text-[0.68rem] font-semibold tracking-[0.06em] uppercase text-accent" : "",
        ].filter(Boolean).join(" ")}
      >
        {label}
      </label>
      {rightSlot && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      {error && <p className="mt-1.5 ml-1 text-[0.75rem] text-red-400">{error}</p>}
    </div>
  );
}

export default function SignUp() {
  const emailId = useId();
  const firstNameId = useId();
  const lastNameId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState("");

  // Step 2
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = () => {
    if (!email) { setEmailError("Email is required."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError("Please enter a valid email address."); return false; }
    setEmailError(""); return true;
  };

  const handleStep1 = () => {
    const emailOk = validateEmail();
    if (!agreed) { setAgreeError("You must agree to the Terms and Privacy Policy to continue."); return; }
    setAgreeError("");
    if (!emailOk) return;
    setStep(2);
  };

  const handleStep2 = async () => {
    let ok = true;
    if (!firstName.trim()) { setFirstNameError("First name is required."); ok = false; } else setFirstNameError("");
    if (!lastName.trim()) { setLastNameError("Last name is required."); ok = false; } else setLastNameError("");
    if (password.length < 8) { setPasswordError("Password must be at least 8 characters."); ok = false; } else setPasswordError("");
    if (confirm !== password) { setConfirmError("Passwords do not match."); ok = false; } else setConfirmError("");
    if (!ok) return;

    setAuthError("");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName, last_name: lastName } },
      });
      if (error) { setAuthError(error.message); return; }

      // Save name to user_profiles
      if (data.user) {
        await supabase.from("user_profiles").upsert({
          user_id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          email,
        });
      }

      router.push("/onboarding");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const eyeButton = (show: boolean, toggle: () => void) => (
    <button type="button" onClick={toggle} aria-label={show ? "Hide" : "Show"} className="text-muted hover:text-text transition-colors p-1">
      {show ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-bg grid grid-cols-1 lg:grid-cols-2">

      {/* LEFT — Brand panel */}
      <div
        className="hidden lg:flex flex-col justify-start items-center px-[5vw] pt-8 pb-20 relative overflow-hidden"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 70% 50%, rgba(11,45,137,0.35) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(77,163,255,0.08) 0%, transparent 60%), #07111F",
        }}
      >
        <div className="absolute inset-0 pointer-events-none hero-grid-overlay" />

        <a href="/" className="absolute top-6 left-[5vw] z-20 no-underline">
          <LogoMark size={40} />
        </a>

        <div className="relative z-10 flex flex-col items-start max-w-[520px] w-full gap-5 pt-20">
          <div>
            <h1 className="font-display text-[clamp(2.2rem,3.5vw,3.2rem)] font-bold leading-[1.12] tracking-tight mb-4">
              Your Financial Future<br />
              <span className="text-gold">Starts Here.</span>
            </h1>
            <p className="text-muted text-[1.05rem] leading-[1.7] max-w-[480px]">
              Join Nautilus Money and bring every account, investment, and goal into one intelligent platform. Discover your Nautilus Score and chart your course to financial independence.
            </p>
          </div>

          <OnboardingWalkthrough />
        </div>
      </div>

      {/* RIGHT — Auth card */}
      <div
        className="flex flex-col justify-start items-center px-6 sm:px-12 pt-8 pb-16 relative"
        style={{ background: "rgba(13,28,48,0.5)", borderLeft: "1px solid rgba(77,163,255,0.08)" }}
      >
        <div className="absolute top-0 left-1/4 right-1/4 h-px pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(77,163,255,0.5), transparent)" }} />

        {/* Mobile-only logo */}
        <div className="flex lg:hidden mb-8">
          <LogoMark />
        </div>

        <div className="glass rounded-card w-full max-w-[420px] px-8 sm:px-10 pt-3 pb-8 sm:pb-10 relative overflow-hidden" style={{ background: "rgba(13,28,48,0.72)" }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(77,163,255,0.5), transparent)" }} />

          {/* Logo */}
          <div className="hidden lg:flex justify-center mb-3">
            <LogoMark size={40} />
          </div>



          <h2 className="font-display text-[1.85rem] font-bold leading-tight tracking-tight mb-1.5">
            Start Your Financial Journey
          </h2>
          <p className="text-muted text-[0.9rem] leading-[1.6] mb-6">
            {step === 1 ? "Enter your email to get started." : "Set up your name and password."}
          </p>

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
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

              {/* Clickwrap */}
              <div className={["rounded-xl p-3.5 border transition-colors", agreed ? "border-accent/30 bg-accent/[0.04]" : agreeError ? "border-red-500/40 bg-red-500/[0.04]" : "border-glass-border bg-bg3/40"].join(" ")}>
                <label className="flex items-center justify-center gap-3 cursor-pointer select-none group">
                  <div
                    onClick={() => { setAgreed(v => !v); setAgreeError(""); }}
                    className={["w-4 h-4 rounded-[4px] flex items-center justify-center shrink-0 transition-all cursor-pointer", agreed ? "bg-accent border-2 border-accent" : "bg-bg3 border-2 border-accent/50 group-hover:border-accent shadow-[0_0_6px_rgba(77,163,255,0.25)]"].join(" ")}
                    role="checkbox"
                    aria-checked={agreed}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === " " && setAgreed(v => !v)}
                  >
                    {agreed && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-[0.82rem] text-muted leading-[1.5] text-center">
                    I agree to the{" "}
                    <a href="/landingpage/terms" className="text-accent/80 no-underline hover:underline">Terms of Service</a>
                    {" "}and{" "}
                    <a href="/landingpage/privacy" className="text-accent/80 no-underline hover:underline">Privacy Policy</a>
                    .
                  </span>
                </label>
                {agreeError && <p className="mt-2 text-center text-[0.75rem] text-red-400">{agreeError}</p>}
              </div>

              <button
                type="button"
                onClick={handleStep1}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl text-[0.95rem] font-bold transition-all duration-200 py-3.5 relative overflow-hidden hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #0B2D89 0%, #1A4FCC 60%, #4DA3FF 140%)", boxShadow: "0 4px 24px rgba(11,45,137,0.5), inset 0 1px 0 rgba(255,255,255,0.08)", color: "#fff" }}
              >
                Get Started
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              {/* Email confirmation */}
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-accent/[0.06] border border-accent/20">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <span className="text-[0.8rem] text-muted">Signing up as{" "}<span className="text-accent font-semibold">{email}</span></span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FloatInput id={firstNameId} label="First Name" type="text" autoComplete="given-name" value={firstName} onChange={(v) => { setFirstName(v); if (firstNameError) setFirstNameError(""); }} error={firstNameError} />
                <FloatInput id={lastNameId} label="Last Name" type="text" autoComplete="family-name" value={lastName} onChange={(v) => { setLastName(v); if (lastNameError) setLastNameError(""); }} error={lastNameError} />
              </div>
              <FloatInput
                id={passwordId}
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(v) => { setPassword(v); if (passwordError) setPasswordError(""); }}
                error={passwordError}
                rightSlot={eyeButton(showPassword, () => setShowPassword(p => !p))}
              />
              <FloatInput
                id={confirmId}
                label="Confirm Password"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(v) => { setConfirm(v); if (confirmError) setConfirmError(""); }}
                error={confirmError}
                rightSlot={eyeButton(showConfirm, () => setShowConfirm(p => !p))}
              />

              {authError && (
                <p className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[0.82rem] text-red-400 leading-snug">{authError}</p>
              )}

              <button
                type="button"
                onClick={handleStep2}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl text-[0.95rem] font-bold transition-all duration-200 py-3.5 relative overflow-hidden disabled:opacity-70 disabled:pointer-events-none hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #0B2D89 0%, #1A4FCC 60%, #4DA3FF 140%)", boxShadow: "0 4px 24px rgba(11,45,137,0.5), inset 0 1px 0 rgba(255,255,255,0.08)", color: "#fff" }}
              >
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>Creating account…</>
                ) : (
                  <>Create Account<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></>
                )}
              </button>

              <button type="button" onClick={() => setStep(1)} className="text-[0.82rem] text-muted hover:text-text transition-colors bg-transparent border-none cursor-pointer text-center">
                ← Back
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 h-px bg-glass-border" />
            <p className="text-[0.875rem] text-muted whitespace-nowrap">
              Already have an account?{" "}
              <a href="/landingpage/signin" className="text-accent font-semibold no-underline hover:opacity-75 hover:underline transition-opacity">
                Sign In
              </a>
            </p>
            <div className="flex-1 h-px bg-glass-border" />
          </div>
        </div>

        {/* Trust footer */}
        <div className="w-full max-w-[420px] mt-7">
          <div className="text-[0.72rem] font-bold tracking-[0.12em] uppercase text-muted text-center mb-4 flex justify-center items-center gap-2">
            <span className="inline-block w-5 h-px bg-muted/40" />
            Trusted Financial Infrastructure
            <span className="inline-block w-5 h-px bg-muted/40" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {trustItems.map((item) => (
              <div key={item.title} className="bg-bg2 border border-glass-border rounded-[14px] p-3.5 flex items-start gap-2.5 hover:border-accent/30 transition-colors duration-300">
                <div className="text-[1.1rem] mt-0.5 shrink-0">{item.icon}</div>
                <div>
                  <div className="text-[0.78rem] font-bold text-text leading-tight mb-0.5">{item.title}</div>
                  <div className="text-[0.7rem] text-muted leading-[1.4]">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-glass-border">
            <span className="text-[0.72rem] text-muted">Powered by</span>
            {["Supabase Auth", "Plaid"].map((name) => (
              <span key={name} className="flex items-center gap-1.5 bg-bg2 border border-glass-border rounded-md px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full animate-dot-pulse" style={{ background: "#00C896" }} />
                <span className="text-[0.72rem] font-semibold text-muted">{name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
