import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const T = {
  gold:    '#2ED3C6',
  accent:  '#4DA3FF',
  muted:   '#7A9BB5',
  text:    '#C8D8EC',
  bg:      '#07111F',
  bg2:     '#0D1E30',
  bg3:     '#122338',
  border:  'rgba(77,163,255,0.12)',
  borderMed: 'rgba(77,163,255,0.22)',
  green:   '#4ADE80',
  red:     '#F87171',
};

/* ── Feature sections ── */
const featureSections = [
  {
    eyebrow: 'Your Financial Score',
    headline: 'Finally know if you\'re doing well — or just think you are.',
    sub: 'The Nautilus Score grades your entire financial life on a single number. Not a credit score. A real measure of whether your money is working for you.',
    accent: T.gold,
    features: [
      { icon: '📊', title: '8-component health score', body: 'Cash flow, emergency readiness, retirement pace, debt quality, net worth velocity, spending discipline, resilience, and organization — all weighted and scored.' },
      { icon: '👥', title: 'Peer benchmarks by income bracket', body: 'See how your savings rate, debt-to-income, and expense ratio compare to people in your income bracket. Finally answer "am I doing well?"' },
      { icon: '📈', title: 'Score history & trend', body: 'Track your score month over month. Watch it move as you make better decisions. Progress is motivating — we show it to you.' },
      { icon: '🎯', title: 'Improvement action plan', body: 'Not just a score — a ranked list of the exact moves that will improve it most. Prioritized by impact, not difficulty.' },
    ],
    visual: {
      type: 'score',
      score: 74,
      grade: 'B+',
      label: 'Strong',
      color: '#0a3fa8',
      peers: [
        { metric: 'Savings Rate', you: '18%', avg: '12%', better: true },
        { metric: 'Debt-to-Income', you: '22%', avg: '25%', better: true },
        { metric: 'Expense Ratio', you: '79%', avg: '85%', better: true },
      ],
    },
  },
  {
    eyebrow: 'Bank Sync & Insights',
    headline: 'Your money, explained. Without the spreadsheet.',
    sub: 'Connect your accounts once and Nautilus Money automatically categorizes every transaction, detects every subscription, and flags anything that looks wrong.',
    accent: T.accent,
    features: [
      { icon: '🏦', title: 'Automatic bank sync via Plaid', body: 'Every account — checking, savings, credit cards, investments, loans — in one place. Balances update automatically. No CSV uploads.' },
      { icon: '🔍', title: 'Subscription & bill audit', body: 'We surface every recurring charge, including ones you forgot about. The average member finds $200+ in subscriptions they no longer use.' },
      { icon: '⚡', title: 'AI-powered insights', body: 'Unusual spending, income changes, duplicate charges, high-fee months — flagged automatically before they become problems.' },
      { icon: '📂', title: 'Smart categorization', body: 'Transactions are categorized automatically using merchant intelligence. Rename, reclassify, or split — it learns your preferences.' },
    ],
    visual: { type: 'insights' },
  },
  {
    eyebrow: 'Planning & Goals',
    headline: 'A plan for every dollar. Even the ones you haven\'t saved yet.',
    sub: 'From getting out of debt to buying a house to retiring early — Nautilus maps the path, tracks the progress, and tells you when you\'re off course.',
    accent: '#A78BFA',
    features: [
      { icon: '🏠', title: 'Goal tracking', body: 'Set goals for anything — house down payment, vacation, emergency fund, early retirement. Nautilus calculates your monthly contribution target and tracks progress in real time.' },
      { icon: '💳', title: 'Debt payoff planner', body: 'Model avalanche vs snowball strategies. Adjust extra payments with a slider and watch your payoff date move. See exactly how much interest you\'ll save.' },
      { icon: '📅', title: 'Cash flow forecasting', body: 'Know what your bank balance will look like in 30, 60, and 90 days — based on your actual income schedule and recurring bills.' },
      { icon: '🏖️', title: 'Financial freedom projection', body: 'Your FI number, your estimated date, and how many years away you are — updated every time your income or spending changes.' },
    ],
    visual: { type: 'goals' },
  },
  {
    eyebrow: 'Retirement & Net Worth',
    headline: 'Are you on track for retirement? Now you\'ll actually know.',
    sub: 'Most people have no idea if their retirement savings are on pace. Nautilus Money benchmarks against Fidelity targets for your age and shows the gap — clearly.',
    accent: T.green,
    features: [
      { icon: '📉', title: 'Net worth tracking & trends', body: 'Every asset and liability in one number. Watch it grow month over month. See which accounts are driving the change.' },
      { icon: '🎯', title: 'Retirement readiness score', body: 'Benchmarked against the Fidelity age-based multiplier — how much you should have saved at your age relative to your income. No guessing.' },
      { icon: '📊', title: 'Future wealth simulation', body: 'Three scenarios (conservative / expected / growth) projected 10 years out. Based on your actual net worth and monthly surplus.' },
      { icon: '🏗️', title: 'Asset allocation health', body: 'Too much in cash? Too little invested? We flag imbalances and show the 10-year cost of leaving money idle.' },
    ],
    visual: { type: 'networth' },
  },
];

/* ── Pain points ── */
const painPoints = [
  { bad: 'Paying a financial advisor $200/hr', good: 'Nautilus Money at $6/mo does it automatically' },
  { bad: 'Ignoring your finances and hoping for the best', good: 'Knowing exactly where you stand, every day' },
  { bad: '"I think I have about $X in savings"', good: 'Your real balance, updated this morning' },
  { bad: 'Discovering a forgotten subscription on your statement', good: 'Flagged and summarized before you even noticed' },
  { bad: 'Wondering if you\'re saving enough for retirement', good: 'A score, a gap, and a plan — all in one screen' },
  { bad: 'Spreadsheets you stop updating after week two', good: 'Everything automatic. Nothing to maintain.' },
];

/* ── Static visual components ── */
function ScoreGaugeSVG({ score, size = 240 }: { score: number; size?: number }) {
  const cx = size / 2, cy = size * 0.58, r = size * 0.40;
  const startAngle = -210, endAngle = 30, sweep = 240;
  const gradeColor = score >= 80 ? '#4ADE80' : score >= 60 ? '#2ED3C6' : score >= 40 ? '#FBBF24' : '#F87171';

  function polarToXY(deg: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  function arcPath(from: number, to: number) {
    const s = polarToXY(from), e = polarToXY(to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const fillEnd = startAngle + (score / 100) * sweep;
  const needleTip = polarToXY(fillEnd);
  const ticks = [0, 20, 40, 60, 80, 100].map(v => {
    const a = startAngle + (v / 100) * sweep;
    const inner = polarToXY(a);
    const outer = { x: cx + (r + 10) * Math.cos((a * Math.PI) / 180), y: cy + (r + 10) * Math.sin((a * Math.PI) / 180) };
    const label = { x: cx + (r + 22) * Math.cos((a * Math.PI) / 180), y: cy + (r + 22) * Math.sin((a * Math.PI) / 180) };
    return { inner, outer, label, v };
  });

  return (
    <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`}>
      <path d={arcPath(startAngle, endAngle)} fill="none" stroke="rgba(77,163,255,0.12)" strokeWidth={18} strokeLinecap="round" />
      <path d={arcPath(startAngle, startAngle + sweep * 0.40)} fill="none" stroke="#FEE2E2" strokeWidth={18} strokeLinecap="round" opacity={0.5} />
      <path d={arcPath(startAngle + sweep * 0.40, startAngle + sweep * 0.65)} fill="none" stroke="#FEF9C3" strokeWidth={18} strokeLinecap="round" opacity={0.5} />
      <path d={arcPath(startAngle + sweep * 0.65, endAngle)} fill="none" stroke="#DCFCE7" strokeWidth={18} strokeLinecap="round" opacity={0.5} />
      <path d={arcPath(startAngle, fillEnd)} fill="none" stroke={gradeColor} strokeWidth={18} strokeLinecap="round" />
      {ticks.map(({ inner, outer, label, v }) => (
        <g key={v}>
          <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(122,144,184,0.4)" strokeWidth={1.5} />
          <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="rgba(122,144,184,0.8)">{v}</text>
        </g>
      ))}
      <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill="white" />
      <circle cx={cx} cy={cy} r={3} fill="#0D1C30" />
    </svg>
  );
}

function ScoreVisual({ section }: { section: typeof featureSections[0] }) {
  const v = section.visual as any;
  const gradeColor = v.score >= 80 ? '#4ADE80' : v.score >= 60 ? '#2ED3C6' : v.score >= 40 ? '#FBBF24' : '#F87171';
  const components = [
    { label: 'Cash Flow',   score: 81, color: '#4ADE80' },
    { label: 'Emergency',   score: 72, color: '#2ED3C6' },
    { label: 'Retirement',  score: 65, color: '#2ED3C6' },
    { label: 'Debt Health', score: 79, color: '#4ADE80' },
  ];
  return (
    <div style={{ background: '#0D1C30', borderRadius: 20, border: '1px solid rgba(46,211,198,0.2)', padding: 28, boxShadow: '0 0 60px rgba(46,211,198,0.06)' }}>
      {/* Gauge card */}
      <div style={{ background: 'linear-gradient(135deg, rgba(11,45,137,0.5) 0%, rgba(13,28,48,0.95) 100%)', border: '1px solid rgba(46,211,198,0.18)', borderRadius: 14, padding: '20px 16px 8px', marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A90B8', marginBottom: 6 }}>Nautilus Score</div>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <ScoreGaugeSVG score={v.score} size={240} />
          <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.04em' }}>{v.score}</div>
            <div style={{ fontSize: '0.75rem', color: '#7A90B8', marginTop: 2 }}>out of 100</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: gradeColor }}>{v.grade}</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#C8D8EC' }}>{v.label}</span>
        </div>
        <div style={{ marginTop: 8, marginBottom: 4, display: 'inline-block', padding: '3px 14px', borderRadius: 100, background: `${gradeColor}18`, border: `1px solid ${gradeColor}30`, fontSize: '0.72rem', fontWeight: 700, color: gradeColor }}>
          Top 38% of Nautilus users
        </div>
      </div>

      {/* Score breakdown bars */}
      <div style={{ background: 'rgba(13,30,48,0.9)', border: '1px solid rgba(77,163,255,0.12)', borderRadius: 11, padding: '12px 14px', marginBottom: 12 }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#7A90B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Score Breakdown</div>
        {components.map(c => (
          <div key={c.label} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: '0.75rem', color: '#C8D8EC' }}>{c.label}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: c.color }}>{c.score}</span>
            </div>
            <div style={{ height: 5, background: 'rgba(77,163,255,0.1)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${c.score}%`, background: c.color, borderRadius: 100 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Peer comparison */}
      <div style={{ background: 'rgba(13,30,48,0.9)', border: '1px solid rgba(77,163,255,0.12)', borderRadius: 11, padding: '12px 14px' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7A90B8', marginBottom: 10 }}>Your bracket · $75K–$100K</div>
        {v.peers.map((p: any) => (
          <div key={p.metric} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.78rem', color: '#7A90B8' }}>{p.metric}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.75rem', color: '#4a6a88' }}>avg {p.avg}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: p.better ? '#4ADE80' : '#F87171' }}>
                {p.better ? '↑' : '↓'} {p.you}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsVisual() {
  const insights = [
    { color: '#F87171', icon: '⚠️', title: 'Unusual charge detected', body: 'DoorDash billed $89 — 3× your typical order. Worth reviewing.', tag: 'Anomaly' },
    { color: '#FBBF24', icon: '📋', title: '4 forgotten subscriptions', body: 'Hulu, Headspace, Adobe CC, and a gym you haven\'t visited.', tag: 'Subscriptions' },
    { color: '#4ADE80', icon: '✓',  title: 'Income is consistent', body: 'Bi-weekly payroll is steady. Per-paycheck variance under 3%.', tag: 'Income' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {insights.map(ins => (
        <div key={ins.title} style={{ background: T.bg2, borderRadius: 14, border: `1px solid ${ins.color}25`, padding: '16px 20px', display: 'flex', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${ins.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{ins.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: T.text }}>{ins.title}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: ins.color, background: `${ins.color}15`, padding: '2px 8px', borderRadius: 100, whiteSpace: 'nowrap', marginLeft: 8 }}>{ins.tag}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: T.muted, lineHeight: 1.5 }}>{ins.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GoalsVisual() {
  const goals = [
    { label: 'House Down Payment', target: '$60,000', saved: '$31,200', pct: 52, color: T.accent },
    { label: 'Emergency Fund',     target: '$18,000', saved: '$14,400', pct: 80, color: T.green },
    { label: 'Vacation Fund',      target: '$4,000',  saved: '$1,600',  pct: 40, color: '#A78BFA' },
  ];
  return (
    <div style={{ background: T.bg2, borderRadius: 20, border: `1px solid ${T.border}`, padding: 28 }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.muted, marginBottom: 20 }}>Active Goals</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {goals.map(g => (
          <div key={g.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.87rem', fontWeight: 600, color: T.text }}>{g.label}</span>
              <span style={{ fontSize: '0.8rem', color: T.muted }}>{g.saved} / {g.target}</span>
            </div>
            <div style={{ height: 8, background: '#1e3a5f', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${g.pct}%`, background: g.color, borderRadius: 100 }} />
            </div>
            <div style={{ marginTop: 4, fontSize: '0.72rem', color: g.color, fontWeight: 600 }}>{g.pct}% complete</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 22, padding: '14px 16px', borderRadius: 12, background: 'rgba(10,63,168,0.15)', border: '1px solid rgba(10,63,168,0.3)' }}>
        <div style={{ fontSize: '0.72rem', color: T.muted, marginBottom: 3 }}>Financial Freedom Projection</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Age 51</div>
        <div style={{ fontSize: '0.78rem', color: T.muted }}>14.3 years away · $1.2M FI number</div>
      </div>
    </div>
  );
}

function NetWorthVisual() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const values = [142000, 148000, 151000, 159000, 163000, 171000];
  const max = Math.max(...values), min = Math.min(...values);
  const h = 80, w = 260;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${h} ` + pts + ` ${w},${h}`;

  return (
    <div style={{ background: T.bg2, borderRadius: 20, border: `1px solid ${T.border}`, padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Net Worth</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>$171,000</div>
        </div>
        <div style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', fontSize: '0.78rem', fontWeight: 700, color: T.green }}>
          ↑ +$29K YTD
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h + 4}`} style={{ display: 'block', marginBottom: 8 }}>
        <defs>
          <linearGradient id="nwg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={T.green} stopOpacity={0.25} />
            <stop offset="100%" stopColor={T.green} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#nwg)" />
        <polyline points={pts} fill="none" stroke={T.green} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {months.map(m => <span key={m} style={{ fontSize: '0.65rem', color: T.muted }}>{m}</span>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
        {[
          { label: 'Total Assets', value: '$284,000', color: T.green },
          { label: 'Total Debt',   value: '$113,000', color: T.red },
        ].map(r => (
          <div key={r.label} style={{ padding: '12px 14px', borderRadius: 10, background: T.bg, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: '0.7rem', color: T.muted, marginBottom: 4 }}>{r.label}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: r.color }}>{r.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionVisual({ section }: { section: typeof featureSections[0] }) {
  if (section.visual.type === 'score')    return <ScoreVisual section={section} />;
  if (section.visual.type === 'insights') return <InsightsVisual />;
  if (section.visual.type === 'goals')    return <GoalsVisual />;
  return <NetWorthVisual />;
}

export default function FeaturesPage() {
  return (
    <main style={{ background: T.bg, color: T.text, minHeight: '100vh' }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{ paddingTop: 130, paddingBottom: 80, paddingLeft: '5vw', paddingRight: '5vw', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', borderRadius: 100, border: `1px solid rgba(46,211,198,0.25)`, background: 'rgba(46,211,198,0.08)', marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.gold, display: 'inline-block' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gold }}>Your Personal Financial Advisor</span>
        </div>

        <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 24 }}>
          You might be bad with money.{' '}
          <span style={{ color: T.gold }}>We handle that.</span>
        </h1>

        <p style={{ fontSize: '1.15rem', color: T.muted, lineHeight: 1.8, maxWidth: 640, margin: '0 auto 40px' }}>
          Most people don't have a financial advisor. They're expensive, intimidating, and you only see them once a year.
          Nautilus is the advisor that runs 24/7, connects to your actual accounts, and tells you exactly what to do next — for $6 a month.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
          <a href="/onboarding" style={{ padding: '15px 38px', borderRadius: 14, background: T.gold, color: T.bg, fontWeight: 800, fontSize: '1rem', textDecoration: 'none', boxShadow: '0 4px 28px rgba(46,211,198,0.3)' }}>
            Get your free score
          </a>
          <a href="/landingpage/pricing" style={{ padding: '15px 28px', borderRadius: 14, border: `1px solid rgba(77,163,255,0.25)`, color: T.text, fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none' }}>
            See pricing →
          </a>
        </div>
      </section>

      {/* ── PAIN → SOLUTION ── */}
      <section style={{ padding: '0 5vw 100px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, marginBottom: 12 }}>Sound Familiar?</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            The old way vs. the Nautilus way
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {painPoints.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 48px 1fr', alignItems: 'center', gap: 16, padding: '18px 28px', borderRadius: 14, background: T.bg2, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ color: T.red, fontSize: '1rem', flexShrink: 0, marginTop: 2 }}>✕</span>
                <span style={{ fontSize: '0.9rem', color: T.muted, lineHeight: 1.5 }}>{p.bad}</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: '1.2rem', color: T.gold }}>→</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ color: T.green, fontSize: '1rem', flexShrink: 0, marginTop: 2 }}>✓</span>
                <span style={{ fontSize: '0.9rem', color: T.text, fontWeight: 500, lineHeight: 1.5 }}>{p.good}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURE SECTIONS ── */}
      {featureSections.map((section, si) => (
        <section key={section.eyebrow} style={{ padding: '80px 5vw', background: si % 2 === 1 ? T.bg2 : T.bg, borderTop: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>

            {/* Text — alternate sides */}
            <div style={{ order: si % 2 === 0 ? 0 : 1 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: section.accent, marginBottom: 14 }}>
                {section.eyebrow}
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 2.8vw, 2.6rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.025em', marginBottom: 18 }}>
                {section.headline}
              </h2>
              <p style={{ fontSize: '1rem', color: T.muted, lineHeight: 1.75, marginBottom: 36 }}>
                {section.sub}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                {section.features.map(f => (
                  <div key={f.title}>
                    <div style={{ fontSize: '1.3rem', marginBottom: 8 }}>{f.icon}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: T.text, marginBottom: 5 }}>{f.title}</div>
                    <div style={{ fontSize: '0.79rem', color: T.muted, lineHeight: 1.6 }}>{f.body}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual */}
            <div style={{ order: si % 2 === 0 ? 1 : 0 }}>
              <SectionVisual section={section} />
            </div>

          </div>
        </section>
      ))}

      {/* ── ADVISOR POSITIONING ── */}
      <section style={{ padding: '100px 5vw', background: T.bg, borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gold, marginBottom: 14 }}>The Bigger Picture</div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24 }}>
            A real financial advisor costs{' '}
            <span style={{ color: T.red, textDecoration: 'line-through' }}>$200/hr</span>.
            <br />
            <span style={{ color: T.gold }}>Nautilus Money costs $6/month.</span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: T.muted, lineHeight: 1.8, maxWidth: 640, margin: '0 auto 52px' }}>
            Financial advisors are for people who already have money. Everyone else is left to figure it out alone.
            Nautilus Money exists to fix that — giving every household the same financial intelligence that used to cost hundreds of dollars an hour.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              {
                icon: (
                  <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
                    <circle cx={16} cy={16} r={15} stroke={T.gold} strokeWidth={1.5} strokeOpacity={0.3} />
                    <circle cx={16} cy={16} r={6} stroke={T.gold} strokeWidth={1.5} />
                    <circle cx={16} cy={16} r={2.5} fill={T.gold} />
                    <line x1={16} y1={1} x2={16} y2={7} stroke={T.gold} strokeWidth={1.5} strokeOpacity={0.5} />
                    <line x1={16} y1={25} x2={16} y2={31} stroke={T.gold} strokeWidth={1.5} strokeOpacity={0.5} />
                    <line x1={1} y1={16} x2={7} y2={16} stroke={T.gold} strokeWidth={1.5} strokeOpacity={0.5} />
                    <line x1={25} y1={16} x2={31} y2={16} stroke={T.gold} strokeWidth={1.5} strokeOpacity={0.5} />
                  </svg>
                ),
                title: 'Always on',
                body: 'Your Nautilus Score updates every time your data changes. No appointment needed.',
              },
              {
                icon: (
                  <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
                    <polyline points="2,20 7,12 11,18 16,8 20,14 24,10 30,16" stroke={T.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx={30} cy={16} r={2.5} fill={T.accent} />
                    <circle cx={2} cy={20} r={2} fill={T.accent} fillOpacity={0.4} />
                  </svg>
                ),
                title: 'Connected to reality',
                body: 'Advice based on your actual accounts, not what you tell someone in an annual meeting.',
              },
              {
                icon: (
                  <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
                    <rect x={3} y={14} width={9} height={4} rx={2} stroke="#A78BFA" strokeWidth={1.5} />
                    <rect x={20} y={14} width={9} height={4} rx={2} stroke="#A78BFA" strokeWidth={1.5} />
                    <line x1={12} y1={16} x2={20} y2={16} stroke="#A78BFA" strokeWidth={1.5} strokeDasharray="2 2" />
                    <path d="M14 10 Q16 6 18 10" stroke="#A78BFA" strokeWidth={1.5} strokeLinecap="round" fill="none" />
                    <path d="M14 22 Q16 26 18 22" stroke="#A78BFA" strokeWidth={1.5} strokeLinecap="round" fill="none" />
                    <text x={16} y={20} textAnchor="middle" fontSize={7} fontWeight="800" fill="#A78BFA">$</text>
                  </svg>
                ),
                title: 'Specific, not generic',
                body: 'Not "spend less." Exactly which subscriptions to cancel and how much that buys you toward retirement.',
              },
            ].map(c => (
              <div key={c.title} style={{ padding: '32px 28px', borderRadius: 16, background: T.bg2, border: `1px solid ${T.border}` }}>
                <div style={{ marginBottom: 14, lineHeight: 1 }}>{c.icon}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: T.text, marginBottom: 10 }}>{c.title}</div>
                <div style={{ fontSize: '0.85rem', color: T.muted, lineHeight: 1.65 }}>{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '80px 5vw 120px', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 40px', borderRadius: 24, background: 'linear-gradient(135deg, #0a2d5e 0%, #0D1E30 100%)', border: `1px solid rgba(46,211,198,0.2)`, boxShadow: '0 0 80px rgba(46,211,198,0.05)' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 14 }}>
            Find out your Nautilus Score.
          </h2>
          <p style={{ fontSize: '1rem', color: T.muted, lineHeight: 1.7, marginBottom: 36, maxWidth: 440, margin: '0 auto 36px' }}>
            Takes 2 minutes. See exactly where you stand — and what to fix first.
          </p>
          <a href="/onboarding" style={{ display: 'inline-block', padding: '16px 44px', borderRadius: 14, background: T.gold, color: T.bg, fontWeight: 800, fontSize: '1.05rem', textDecoration: 'none', boxShadow: '0 4px 28px rgba(46,211,198,0.3)' }}>
            Get your free score →
          </a>
          <div style={{ marginTop: 18, fontSize: '0.82rem', color: T.muted }}>
            14-day free trial · Cancel any time · Premium from $12/month
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
