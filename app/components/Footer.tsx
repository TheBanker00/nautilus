import { LogoMark } from "./logo";

const footerCols = [
  {
    title: "Product",
    links: [
      { label: "Features",  href: "/landingpage/features" },
      { label: "Pricing",   href: "/landingpage/pricing" },
      { label: "Security",  href: "/landingpage/security" },
      { label: "Get Started", href: "/landingpage/signup" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us",  href: "/landingpage/about" },
      { label: "FAQ",       href: "/landingpage/faq" },
      { label: "Sign In",   href: "/landingpage/signin" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy",   href: "/landingpage/privacy" },
      { label: "Terms of Service", href: "/landingpage/terms" },
      { label: "Cookie Policy",    href: "/landingpage/cookies" },
    ],
  },
];

const bottomLinks = [
  { label: "Privacy",  href: "/landingpage/privacy" },
  { label: "Terms",    href: "/landingpage/terms" },
  { label: "Security", href: "/landingpage/security" },
];

export default function Footer() {
  return (
    <footer className="bg-bg2 border-t border-glass-border px-[5vw] pt-12 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        <div>
          <LogoMark size={90}/>
          <p className="text-[0.875rem] text-muted leading-[1.7] mt-3 max-w-[280px]">
            Your intelligent financial partner. Connecting every account,
            tracking every goal, and helping you make smarter decisions every
            day.
          </p>
        </div>

        {footerCols.map((col) => (
          <div key={col.title}>
            <div className="text-[0.78rem] font-bold tracking-[0.08em] uppercase text-muted mb-4">
              {col.title}
            </div>
            <ul className="list-none flex flex-col gap-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-[0.875rem] text-muted no-underline hover:text-text transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-glass-border pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-[0.8rem] text-muted max-w-[560px]">
          © 2026 Nautilus Money All rights reserved. Not a registered
          investment advisor. Nautilus Money is not a bank.
        </p>
        <div className="flex gap-6">
          {bottomLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-[0.78rem] text-muted no-underline hover:text-text transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
