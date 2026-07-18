export default function PhoneMockup() {
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

        {/* Screen content — live mobile screenshot, inset below the status bar */}
        <div style={{ height: 530, overflow: 'hidden', position: 'relative' }}>
          <img
            src="/mobileview.png"
            alt="WealthLens mobile dashboard"
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          />
        </div>

        {/* Home indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
          <div style={{ width: 80, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
        </div>
      </div>
    </div>
  );
}
