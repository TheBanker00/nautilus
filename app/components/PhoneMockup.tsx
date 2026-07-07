export default function PhoneMockup() {
  const score = 82;
  const scoreColor = '#4ADE80';
  const peerRows = [
    { label: 'Savings Rate',   you: '18%', avg: '12%', up: true },
    { label: 'Debt-to-Income', you: '22%', avg: '25%', up: true },
    { label: 'Expense Ratio',  you: '79%', avg: '85%', up: true },
  ];
  const components = [
    { label: 'Cash Flow',   score: 88, color: '#4ADE80' },
    { label: 'Emergency',   score: 72, color: '#2ED3C6' },
    { label: 'Retirement',  score: 65, color: '#2ED3C6' },
    { label: 'Debt Health', score: 91, color: '#4ADE80' },
  ];

  // Gauge math — same as health page: 240° sweep
  const size = 160;
  const cx = size / 2, cy = size * 0.58, r = size * 0.40;
  const startAngle = -210, endAngle = 30, sweep = 240;
  const fillEnd = startAngle + (score / 100) * sweep;

  function polarToXY(deg: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  function arcPath(from: number, to: number) {
    const s = polarToXY(from), e = polarToXY(to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const needleTip = polarToXY(fillEnd);
  const ticks = [0, 20, 40, 60, 80, 100].map(v => {
    const a = startAngle + (v / 100) * sweep;
    const inner = polarToXY(a);
    const outer = { x: cx + (r + 6) * Math.cos((a * Math.PI) / 180), y: cy + (r + 6) * Math.sin((a * Math.PI) / 180) };
    const label = { x: cx + (r + 14) * Math.cos((a * Math.PI) / 180), y: cy + (r + 14) * Math.sin((a * Math.PI) / 180) };
    return { inner, outer, label, v };
  });

  return (
    <div
      className="w-[260px] relative z-10 flex flex-col"
      style={{
        background: "linear-gradient(160deg, #1a2a3a 0%, #0a1420 100%)",
        borderRadius: 44,
        border: "2px solid rgba(255,255,255,0.12)",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.5), 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
        padding: 3,
      }}
    >
      {/* Screen */}
      <div className="flex flex-col overflow-hidden" style={{ borderRadius: 42, background: "linear-gradient(180deg, #060e1c 0%, #0a1628 100%)", flex: 1 }}>

        {/* Status bar */}
        <div className="relative flex items-center justify-between px-5 pt-3 pb-1">
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>9:41</div>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center" style={{ width: 80, height: 20, background: "#000", borderRadius: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: "#1a1a1a", border: "1px solid #333" }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 18, height: 10, border: "1px solid rgba(255,255,255,0.5)", borderRadius: 2.5 }}>
                <div style={{ position: 'absolute', left: 1, top: 1, bottom: 1, width: '85%', background: "rgba(46,211,198,0.9)", borderRadius: 1.5 }} />
              </div>
              <div style={{ width: 2, height: 5, background: "rgba(255,255,255,0.4)", borderRadius: "0 1px 1px 0" }} />
            </div>
          </div>
        </div>

        {/* Screen content */}
        <div className="px-[14px] pb-5" style={{ background: "transparent", height: 530, overflow: 'hidden' }}>

        {/* Header */}
        <div className="flex justify-between items-center py-[10px] pb-[12px]">
          <img src="/nautilus logo 1.png" alt="Nautilus" style={{ height: 18, width: 'auto' }} />
          <span className="text-[0.6rem] font-bold text-gold uppercase tracking-widest">Nautilus Score</span>
        </div>

        {/* Score gauge */}
        <div
          className="rounded-[14px] p-[12px] mb-[10px]"
          style={{ background: "rgba(13,30,48,0.9)", border: "1px solid rgba(77,163,255,0.12)" }}
        >
          <div className="flex flex-col items-center">
            <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A90B8', marginBottom: 2 }}>Nautilus Score</div>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`}>
                <path d={arcPath(startAngle, endAngle)} fill="none" stroke="rgba(77,163,255,0.12)" strokeWidth={10} strokeLinecap="round" />
                <path d={arcPath(startAngle, startAngle + sweep * 0.40)} fill="none" stroke="#FEE2E2" strokeWidth={10} strokeLinecap="round" opacity={0.5} />
                <path d={arcPath(startAngle + sweep * 0.40, startAngle + sweep * 0.65)} fill="none" stroke="#FEF9C3" strokeWidth={10} strokeLinecap="round" opacity={0.5} />
                <path d={arcPath(startAngle + sweep * 0.65, endAngle)} fill="none" stroke="#DCFCE7" strokeWidth={10} strokeLinecap="round" opacity={0.5} />
                <path d={arcPath(startAngle, fillEnd)} fill="none" stroke={scoreColor} strokeWidth={10} strokeLinecap="round" />
                {ticks.map(({ inner, outer, label, v }) => (
                  <g key={v}>
                    <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(122,144,184,0.4)" strokeWidth={1} />
                    <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fontSize={6} fill="rgba(122,144,184,0.7)">{v}</text>
                  </g>
                ))}
                <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke="white" strokeWidth={1.5} strokeLinecap="round" />
                <circle cx={cx} cy={cy} r={4} fill="white" />
                <circle cx={cx} cy={cy} r={2} fill="#0d1828" />
              </svg>
              <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.04em' }}>{score}</div>
                <div style={{ fontSize: '0.45rem', color: '#7A90B8', marginTop: 1 }}>out of 100</div>
              </div>
            </div>

            <div className="flex items-center gap-2 -mt-1">
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: scoreColor }}>A</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#C8D8EC' }}>Excellent</span>
            </div>
            <div
              className="mt-1.5 px-3 py-[3px] rounded-full text-[0.55rem] font-bold"
              style={{ background: `${scoreColor}18`, border: `1px solid ${scoreColor}35`, color: scoreColor, letterSpacing: '0.04em' }}
            >
              Top 16% of Nautilus users
            </div>
          </div>
        </div>

        {/* Peer benchmark strip */}
        <div
          className="rounded-[11px] p-[10px] mb-[10px]"
          style={{ background: "rgba(13,30,48,0.9)", border: "1px solid rgba(77,163,255,0.12)" }}
        >
          <div style={{ fontSize: '0.52rem', fontWeight: 700, color: '#7A9BB5', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            How You Compare · $75K–$100K
          </div>
          {peerRows.map(p => (
            <div key={p.label} className="flex justify-between items-center mb-[5px]">
              <span style={{ fontSize: '0.6rem', color: '#7A9BB5' }}>{p.label}</span>
              <div className="flex items-center gap-[6px]">
                <span style={{ fontSize: '0.58rem', color: '#4a6a88' }}>avg {p.avg}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: p.up ? '#4ADE80' : '#F87171' }}>
                  {p.up ? '↑' : '↓'} {p.you}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Score breakdown mini bars */}
        <div
          className="rounded-[11px] p-[10px]"
          style={{ background: "rgba(13,30,48,0.9)", border: "1px solid rgba(77,163,255,0.12)" }}
        >
          <div style={{ fontSize: '0.52rem', fontWeight: 700, color: '#7A9BB5', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Score Breakdown
          </div>
          {components.map(c => (
            <div key={c.label} className="mb-[6px]">
              <div className="flex justify-between mb-[3px]">
                <span style={{ fontSize: '0.58rem', color: '#C8D8EC' }}>{c.label}</span>
                <span style={{ fontSize: '0.58rem', fontWeight: 700, color: c.color }}>{c.score}</span>
              </div>
              <div style={{ height: 4, background: 'rgba(77,163,255,0.1)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${c.score}%`, background: c.color, borderRadius: 100 }} />
              </div>
            </div>
          ))}
        </div>

        </div>

        {/* Home indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
          <div style={{ width: 80, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
        </div>
      </div>
    </div>
  );
}
