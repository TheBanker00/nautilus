const truths = [
  {
    color: '#2ED3C6',
    number: '01',
    headline: "Your real savings rate",
    bank: "Banks show you your balance. Not what percentage of your income you're actually keeping.",
    truth: "Most people saving $500/month on a $90K salary think they're doing fine. Nautilus Money shows your true savings rate is 6.7% — half the minimum needed for a secure retirement.",
  },
  {
    color: '#2ED3C6',
    number: '02',
    headline: "How much of your paycheck is already gone",
    bank: "Your employer deposits your full salary. Your bank shows the running balance. Neither tells you what percentage is claimed by debt before you touch it.",
    truth: "Mortgage, car payment, student loans, minimum card payments — your debt service ratio tells you how much freedom you actually have. Most people have never seen this number.",
  },
  {
    color: '#67E6D5',
    number: '03',
    headline: "The subscription drain",
    bank: "Automatic charges are designed to be invisible. Banks process them silently. No alert, no summary, no annual total.",
    truth: "The average household has $273/month in recurring charges they can't fully account for. Nautilus surfaces every one — including the trials you forgot to cancel two years ago.",
  },
  {
    color: '#2ED3C6',
    number: '04',
    headline: "How many years of work you have left",
    bank: "Your 401k statement shows a balance. Your bank shows a balance. Neither tells you whether those numbers add up to freedom — or another 30 years at a desk.",
    truth: "Nautilus calculates your financial independence timeline based on your actual income, spending, savings rate, and net worth growth. The number is usually a wake-up call.",
  },
  {
    color: '#2ED3C6',
    number: '05',
    headline: "What 'minimum payment' is really costing you",
    bank: "Credit card companies are required to show a minimum. They're not required to show you that paying it means you'll be paying for this purchase for 11 years.",
    truth: "Nautilus shows your true cost of debt — interest drag, payoff timelines, and exactly how much faster you'd be free if you redirected even $200/month.",
  },
  {
    color: '#67E6D5',
    number: '06',
    headline: "The gap between where you are and financial freedom",
    bank: "Nobody with something to sell you wants you to know how close — or how far — you really are from not needing a paycheck.",
    truth: "Nautilus calculates your specific number. The net worth you need to cover your lifestyle indefinitely. And the clear path from here to there.",
  },
];

export default function WhatTheyWontTell() {
  return (
    <section className="py-24 px-[5vw]">
      {/* Header */}
      <div className="max-w-[760px] mb-16">
        <div className="text-[0.75rem] font-bold tracking-[0.12em] uppercase text-gold mb-3 flex items-center gap-2">
          <span className="inline-block w-6 h-[1.5px] bg-gold" />
          The Truth About Your Finances
        </div>
        <h2 className="font-display text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.15] tracking-tight mb-4">
          What the banks{" "}
          <span className="text-gold">won&apos;t tell you.</span>
        </h2>
        <p className="text-[1.05rem] leading-[1.75] max-w-[560px]" style={{ color: '#7A90B8' }}>
          Financial institutions make money when you spend, borrow, and stay in the system. There is no incentive for them to hand you a roadmap out of it.
          <span className="text-[#C8D8EC]"> Nautilus Money is built for the other side of that equation.</span>
        </p>
      </div>

      {/* Truth cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {truths.map((t) => (
          <div
            key={t.number}
            className="bg-bg2 border border-glass-border rounded-card p-7 flex flex-col gap-5 hover:border-accent/25 transition-colors group"
          >
            {/* Number + headline */}
            <div className="flex items-start gap-3">
              <span
                className="font-display text-[2rem] font-black leading-none shrink-0 mt-[-2px]"
                style={{ color: `${t.color}25` }}
              >
                {t.number}
              </span>
              <h3 className="font-bold text-[1rem] leading-[1.3]" style={{ color: t.color }}>
                {t.headline}
              </h3>
            </div>

            {/* What banks do */}
            <div
              className="rounded-xl p-4 text-[0.88rem] leading-[1.65]"
              style={{ background: 'rgba(10,63,168,0.12)', border: '1px solid rgba(77,163,255,0.12)', color: '#7A90B8' }}
            >
              <span className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: 'rgba(77,163,255,0.5)', display: 'block', marginBottom: 6 }}>
                What they show you
              </span>
              {t.bank}
            </div>

            {/* What WealthLens shows */}
            <div
              className="rounded-xl p-4 text-[0.88rem] leading-[1.65] flex-1"
              style={{ background: `${t.color}08`, border: `1px solid ${t.color}20`, color: '#C8D8EC' }}
            >
              <span
                className="text-[0.7rem] font-bold uppercase tracking-widest block mb-2"
                style={{ color: t.color, opacity: 0.8 }}
              >
                What Nautilus Money shows you
              </span>
              {t.truth}
            </div>
          </div>
        ))}
      </div>

      {/* Bridge line */}
      <div
        className="mt-14 mx-auto max-w-[680px] text-center p-8 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(11,45,137,0.4), rgba(13,28,48,0.8))', border: '1px solid rgba(46,211,198,0.15)' }}
      >
        <p className="font-display text-[1.2rem] font-bold leading-[1.5] mb-2" style={{ color: '#C8D8EC' }}>
          Financial independence isn&apos;t about income.
        </p>
        <p className="text-[1rem] leading-[1.7]" style={{ color: '#7A90B8' }}>
          It&apos;s about the gap between what you earn, what you keep, and what your money earns while you sleep. Nautilus Money shows you all three — and the exact path to closing the gap.
        </p>
      </div>
    </section>
  );
}
