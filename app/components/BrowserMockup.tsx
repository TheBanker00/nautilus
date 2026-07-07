export default function BrowserMockup() {
  const netWorthHistory = [120, 128, 133, 131, 138, 145, 152, 158, 162, 170, 175, 183];
  const maxVal = 200;
  const pts = netWorthHistory.map((v, i) => {
    const x = 16 + (i / (netWorthHistory.length - 1)) * (340 - 32);
    const y = 90 - (v / maxVal) * 72;
    return `${x},${y}`;
  }).join(' ');
  const areaPath = `M 16,90 L ${pts.replace(/,/g, ' L ').split(' L ').map((p, i) => i === 0 ? `16,90 L ${p}` : p).join(' L ')} L 324,90 Z`
    .replace('M 16,90 L 16,90 L ', 'M 16,90 L ');

  const alloc = [
    { label: 'Investments', pct: 42, color: '#4DA3FF' },
    { label: 'Real Estate', pct: 31, color: '#2ED3C6' },
    { label: 'Retirement', pct: 18, color: '#A78BFA' },
    { label: 'Cash', pct:  9, color: '#34D399' },
  ];

  const summaryCards = [
    { label: 'Net Worth',    value: '$183,200', delta: '+$8.4k',  up: true },
    { label: 'Total Assets', value: '$380,152', delta: '+$12.1k', up: true },
    { label: 'Liabilities',  value: '$196,952', delta: '-$0',     up: false },
    { label: 'Cash Reserves', value: '4.2 mo',  delta: 'Moderate', up: null },
  ];

  return (
    <div
      style={{
        width: 480,
        background: '#07111F',
        borderRadius: 12,
        border: '1px solid rgba(46,211,198,0.18)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          height: 38,
          background: '#0D1C30',
          borderBottom: '1px solid rgba(46,211,198,0.12)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: 8,
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 5 }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.85 }} />
          ))}
        </div>
        {/* Address bar */}
        <div
          style={{
            flex: 1,
            height: 22,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 5,
            border: '1px solid rgba(46,211,198,0.12)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 10,
            gap: 6,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM3.5 8a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z" fill="rgba(46,211,198,0.5)" />
          </svg>
          <span style={{ fontSize: 9.5, color: 'rgba(200,216,236,0.55)', letterSpacing: '0.01em' }}>
            app.wealthlens.com/dashboard/net-worth
          </span>
        </div>
      </div>

      {/* Dashboard content */}
      <div style={{ display: 'flex', height: 310 }}>

        {/* Sidebar strip */}
        <div
          style={{
            width: 36,
            background: '#0F2044',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 12,
            gap: 10,
          }}
        >
          {[
            'M3 12h18M3 6h18M3 18h18',
            'M3 3h7v7H3zM13 3h7v7h-7zM3 13h7v7H3zM13 13h7v7h-7z',
            'M12 2a10 10 0 100 20A10 10 0 0012 2z',
            'M20 7H4M16 3v4M8 3v4M4 11h16v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9z',
          ].map((d, i) => (
            <div
              key={i}
              style={{
                width: 24, height: 24, borderRadius: 6,
                background: i === 0 ? 'rgba(77,163,255,0.15)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={i === 0 ? '#4DA3FF' : 'rgba(255,255,255,0.3)'} strokeWidth="2">
                <path d={d} />
              </svg>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '10px 12px', overflowY: 'hidden', background: '#07111F' }}>

          {/* Page header */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#7A90B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
              Net Worth
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#F0F4FF', letterSpacing: '-0.02em' }}>
              $183,200
            </div>
            <div style={{ fontSize: 9, color: '#4ADE80', fontWeight: 600 }}>↑ +$8,400 this year</div>
          </div>

          {/* Summary cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5, marginBottom: 8 }}>
            {summaryCards.map((c) => (
              <div
                key={c.label}
                style={{
                  background: 'linear-gradient(180deg, #0D1C30 0%, #0B1A2D 90%, rgba(46,211,198,0.04) 100%)',
                  border: '1px solid rgba(46,211,198,0.18)',
                  borderRadius: 7,
                  padding: '6px 7px',
                }}
              >
                <div style={{ fontSize: 7.5, color: '#7A90B8', marginBottom: 2 }}>{c.label}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#F0F4FF' }}>{c.value}</div>
                <div style={{
                  fontSize: 7.5, fontWeight: 600,
                  color: c.up === true ? '#4ADE80' : c.up === false ? '#F87171' : '#FBBF24',
                }}>
                  {c.delta}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom row: chart + allocation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6 }}>

            {/* Net worth chart */}
            <div
              style={{
                background: 'linear-gradient(180deg, #0D1C30 0%, #0B1A2D 90%, rgba(46,211,198,0.04) 100%)',
                border: '1px solid rgba(46,211,198,0.18)',
                borderRadius: 7,
                padding: '7px 8px',
              }}
            >
              <div style={{ fontSize: 7.5, fontWeight: 700, color: '#7A90B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                Net Worth Trend
              </div>
              <svg width="100%" height="90" viewBox="0 0 340 90" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="bm-nw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2ED3C6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2ED3C6" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path
                  d={`M 16,${90 - (netWorthHistory[0] / maxVal) * 72} ` +
                    netWorthHistory.map((v, i) => {
                      const x = 16 + (i / (netWorthHistory.length - 1)) * (340 - 32);
                      const y = 90 - (v / maxVal) * 72;
                      return `L ${x},${y}`;
                    }).join(' ') +
                    ` L 324,90 L 16,90 Z`}
                  fill="url(#bm-nw)"
                />
                <polyline
                  points={pts}
                  fill="none"
                  stroke="#2ED3C6"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Allocation donut */}
            <div
              style={{
                width: 110,
                background: 'linear-gradient(180deg, #0D1C30 0%, #0B1A2D 90%, rgba(46,211,198,0.04) 100%)',
                border: '1px solid rgba(46,211,198,0.18)',
                borderRadius: 7,
                padding: '7px 8px',
              }}
            >
              <div style={{ fontSize: 7.5, fontWeight: 700, color: '#7A90B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Allocation
              </div>
              {/* Mini donut via conic-gradient */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: `conic-gradient(#4DA3FF 0% 42%, #2ED3C6 42% 73%, #A78BFA 73% 91%, #34D399 91% 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#07111F' }} />
                </div>
              </div>
              {alloc.map((a) => (
                <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 2, background: a.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 7, color: '#C8D8EC', flex: 1 }}>{a.label}</span>
                  <span style={{ fontSize: 7, fontWeight: 700, color: '#F0F4FF' }}>{a.pct}%</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
