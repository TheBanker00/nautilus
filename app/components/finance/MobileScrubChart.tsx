'use client';

import React, { useMemo, useRef, useState } from 'react';

/*
  Scrubbable sparkline for mobile hero cards.
  Drag a finger (or mouse) across the chart to see the value at any point —
  a dot + vertical hairline track the touch, and a floating label shows
  "Mar '25 · $248,300". Releasing hides the scrubber.

  Data: [{ label: string, value: number }]
  Designed for the navy gradient hero cards (teal line on dark).
*/

const GOLD = '#2ED3C6';

export default function MobileScrubChart({
  data,
  height = 64,
  formatValue,
  color = GOLD,
}: {
  data: { label: string; value: number }[];
  height?: number;
  formatValue: (v: number) => string;
  color?: string;
}) {
  const W = 320;
  const H = height;
  const svgRef = useRef<SVGSVGElement>(null);
  const [scrubIdx, setScrubIdx] = useState<number | null>(null);

  const points = useMemo(() => {
    if (data.length < 2) return [];
    const vals = data.map(d => d.value);
    const mn = Math.min(...vals);
    const mx = Math.max(...vals);
    const rng = mx - mn || 1;
    return data.map((d, i) => ({
      x: (i / (data.length - 1)) * W,
      y: H - ((d.value - mn) / rng) * (H - 8) - 4,
    }));
  }, [data, H]);

  const gradId = useMemo(() => `scrubGrad-${Math.random().toString(36).slice(2, 8)}`, []);

  if (data.length < 2) return null;

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = line + ` L${W},${H} L0,${H} Z`;

  /* map a client X coordinate to the nearest data index */
  function idxFromClientX(clientX: number): number {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(frac * (data.length - 1));
  }

  const onMove = (clientX: number) => setScrubIdx(idxFromClientX(clientX));
  const stop = () => setScrubIdx(null);

  const active = scrubIdx != null ? data[scrubIdx] : null;
  const activePt = scrubIdx != null ? points[scrubIdx] : null;

  /* keep the floating label inside the card */
  const labelLeftPct = activePt ? Math.min(78, Math.max(0, (activePt.x / W) * 100 - 11)) : 0;

  return (
    <div style={{ position: 'relative', marginTop: 0 }}>
      {/* floating value label */}
      <div style={{
        height: 24, position: 'relative', marginBottom: 2,
        visibility: active ? 'visible' : 'hidden',
      }}>
        {active && (
          <div style={{
            position: 'absolute', left: `${labelLeftPct}%`,
            background: 'rgba(15,32,68,0.95)', border: `1px solid ${color}50`,
            borderRadius: 8, padding: '4px 10px', whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 600, marginRight: 6 }}>{active.label}</span>
            <span style={{ fontSize: 12, color, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{formatValue(active.value)}</span>
          </div>
        )}
      </div>

      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ display: 'block', touchAction: 'pan-y', cursor: 'crosshair' }}
        onTouchStart={e => onMove(e.touches[0].clientX)}
        onTouchMove={e => onMove(e.touches[0].clientX)}
        onTouchEnd={stop}
        onTouchCancel={stop}
        onMouseDown={e => onMove(e.clientX)}
        onMouseMove={e => { if (e.buttons === 1) onMove(e.clientX); }}
        onMouseUp={stop}
        onMouseLeave={stop}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {activePt && (
          <>
            <line x1={activePt.x} y1={0} x2={activePt.x} y2={H} stroke="rgba(255,255,255,0.4)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <circle cx={activePt.x} cy={activePt.y} r={4.5} fill={color} stroke="#0F2044" strokeWidth={2} />
          </>
        )}
      </svg>

      {/* start / end labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
        <span>{data[0].label}</span>
        <span>{data[data.length - 1].label}</span>
      </div>
    </div>
  );
}
