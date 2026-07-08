import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets:  ["latin"],
  display:  "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets:  ["latin"],
  display:  "swap",
});

export const metadata: Metadata = {
  title:       "Nautilus Money | Your AI Financial Command Center",
  description: "Nautilus Money is an AI-powered Personal Financial Command Center that helps you track spending, investments, debt, cash flow, and financial health with personalized AI insights.",
  metadataBase: new URL('https://www.nautilusmoney.com'),
  openGraph: {
    type:        'website',
    url:         'https://www.nautilusmoney.com',
    siteName:    'Nautilus Money',
    title:       'Nautilus Money | Your AI Financial Command Center',
    description: 'Track spending, investments, debt, and cash flow in one place. Nautilus Money gives you AI-powered insights to help you build wealth.',
    images: [
      {
        url:    '/og-image.png',
        width:  1200,
        height: 630,
        alt:    'Nautilus Money — AI Financial Command Center',
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Nautilus Money | Your AI Financial Command Center',
    description: 'Track spending, investments, debt, and cash flow in one place. AI-powered insights to help you build wealth.',
    images:      ['/og-image.png'],
  },
  keywords: [
    'personal finance app',
    'AI financial advisor',
    'budget tracker',
    'net worth tracker',
    'expense tracking',
    'investment tracker',
    'financial dashboard',
    'money management app',
    'cash flow tracker',
    'debt payoff planner',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} antialiased`}
      style={{ height: '100%' }}
    >
      <body
        className="flex flex-col"
        style={{ background: '#07111F', color: '#C8D8EC', height: '100%', overflowY: 'auto' }}
      >
        {children}
      </body>
    </html>
  );
}
