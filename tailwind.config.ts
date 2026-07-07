import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        royal:   "#0B2D89",
        "royal-light": "#1A4FCC",
        gold:    "#D4AF37",
        "gold-light": "#E8C84A",
        accent:  "#4DA3FF",
        bg:      "#07111F",
        bg2:     "#0D1C30",
        bg3:     "#122040",
        muted:   "#7A90B8",
        "glass-border": "rgba(77,163,255,0.18)",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        body:    ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
      },
      keyframes: {
        float1: {
          "0%, 100%": { transform: "translateY(0px) rotate(-1deg)" },
          "50%":      { transform: "translateY(-10px) rotate(1deg)" },
        },
        float2: {
          "0%, 100%": { transform: "translateY(0px) rotate(1deg)" },
          "50%":      { transform: "translateY(-8px) rotate(-1deg)" },
        },
        float3: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-12px)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":      { opacity: "0.5", transform: "scale(0.8)" },
        },
      },
      animation: {
        float1: "float1 5s ease-in-out infinite",
        float2: "float2 6s ease-in-out infinite",
        float3: "float3 5.5s ease-in-out infinite",
        "float1-slow": "float1 7s ease-in-out infinite",
        "float2-fast": "float2 4.5s ease-in-out infinite",
        "dot-pulse": "pulse 2s infinite",
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(ellipse 80% 60% at 70% 50%, rgba(11,45,137,0.35) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(77,163,255,0.08) 0%, transparent 60%)",
        "hero-grid":
          "linear-gradient(rgba(77,163,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(77,163,255,0.04) 1px, transparent 1px)",
        "cf-area":
          "linear-gradient(to bottom, rgba(77,163,255,0.3), rgba(77,163,255,0))",
      },
      boxShadow: {
        "gold-glow":  "0 0 20px rgba(212,175,55,0.3)",
        "gold-glow-lg": "0 8px 32px rgba(212,175,55,0.4)",
        "phone":      "0 40px 80px rgba(0,0,0,0.6)",
        "glass":      "0 8px 32px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};

export default config;