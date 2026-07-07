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
  title:       "WealthLens — Financial Command Center",
  description: "The financial command center for high earners. Track net worth, cash flow, recurring, and more in one place.",
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
