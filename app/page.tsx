import Navbar           from "./components/Navbar";
import Hero             from "./components/Hero";
import StatsStrip       from "./components/StatsStrip";
import WhatTheyWontTell from "./components/WhatTheyWontTell";
import HowItWorks       from "./components/HowItWorks";
import Features         from "./components/Features";
import Testimonials     from "./components/Testimonials";
import Security         from "./components/Security";
import CtaSection       from "./components/CtaSection";
import Footer           from "./components/Footer";
import ChatWidget       from "./components/ChatWidget";

export default function LandingPage() {
  return (
    <main style={{ background: '#07111F', color: '#C8D8EC', minHeight: '100vh' }}>
      <Navbar />
      <Hero />
      <StatsStrip />
      <WhatTheyWontTell />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Security />
      <CtaSection />
      <Footer />
      <ChatWidget />
    </main>
  );
}
