import React, { useState, useCallback, useRef, useId, useMemo } from 'react';

export interface ChartPoint {
  timestamp: string;
  value: string;
}

const W = 400; const H = 116;
const PL = 44; const PR = 8; const PT = 8; const PB = 20;
const cW = W - PL - PR;
const cH = H - PT - PB;

const fmt = (v: number): string =>
  Math.abs(v) >= 1000
    ? `${(v / 1000).toFixed(1)}k`
    : Number.isInteger(v) ? `${v}` : `${v.toFixed(1)}`;

const fmtTime = (ts: string, points: ChartPoint[]): string => {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  const spanMs = points.length > 1
    ? new Date(points[points.length - 1].timestamp).getTime() - new Date(points[0].timestamp).getTime()
    : 0;
  if (spanMs <= 3_600_000 * 2) return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  if (spanMs <= 3_600_000 * 8) return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }) + ' ' +
         d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
};

export function NumericChart({ points }: { points: ChartPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const gradId = useId();

  const values = points.map(p => parseFloat(p.value)).filter(v => !isNaN(v));

  const min  = values.length >= 2 ? Math.min(...values) : 0;
  const max  = values.length >= 2 ? Math.max(...values) : 1;
  const span = max - min || 1;

  const toX = (i: number) => PL + (values.length > 1 ? (i / (values.length - 1)) * cW : 0);
  const toY = (v: number) => PT + cH - ((v - min) / span) * cH;

  // All hooks must be called before any conditional return
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgX = pt.matrixTransform(ctm.inverse()).x;
    const relX = Math.max(0, Math.min(cW, svgX - PL));
    const idx = Math.round((relX / cW) * (values.length - 1));
    setHoveredIdx(idx);
  }, [values.length]);

  const handleMouseLeave = useCallback(() => setHoveredIdx(null), []);

  const tip = useMemo(() => {
    if (hoveredIdx === null || values.length < 2) return null;
    const x     = toX(hoveredIdx);
    const y     = toY(values[hoveredIdx]);
    const label = fmt(values[hoveredIdx]);
    const time  = fmtTime(points[hoveredIdx].timestamp, points);
    const tipW  = Math.max(label.length, time.length) * 5.5 + 12;
    const tipH  = 26;
    const tipX  = Math.min(Math.max(x - tipW / 2, PL), W - PR - tipW);
    const tipY  = y - tipH - 6 < PT ? y + 8 : y - tipH - 6;
    return { x, y, label, time, tipX, tipY, tipW, tipH };
  }, [hoveredIdx, values, points]);

  if (values.length < 2) return null;

  const linePts = values.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  const areaPts = [
    `${toX(0)},${PT + cH}`,
    ...values.map((v, i) => `${toX(i)},${toY(v)}`),
    `${toX(values.length - 1)},${PT + cH}`,
  ].join(' ');

  // X-axis: pick 3 evenly spaced labels (first, middle, last)
  const xLabels = [0, Math.floor((points.length - 1) / 2), points.length - 1].map(i => ({
    x: toX(i),
    label: fmtTime(points[i].timestamp, points),
  }));

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: 'crosshair' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(6,188,249)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="rgb(6,188,249)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y grid lines + labels */}
      {[min, (min + max) / 2, max].map((v, i) => {
        const y = toY(v);
        return (
          <g key={i}>
            <line x1={PL} y1={y} x2={W - PR} y2={y}
              stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="3 3" />
            <text x={PL - 4} y={y + 3.5} textAnchor="end"
              fontSize="9" fill="currentColor" fillOpacity="0.45" fontFamily="monospace">
              {fmt(v)}
            </text>
          </g>
        );
      })}

      {/* X axis line */}
      <line x1={PL} y1={PT + cH} x2={W - PR} y2={PT + cH}
        stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />

      {/* X axis labels */}
      {xLabels.map((l, i) => (
        <text key={i} x={l.x} y={PT + cH + 12} textAnchor="middle"
          fontSize="8" fill="currentColor" fillOpacity="0.4" fontFamily="monospace">
          {l.label}
        </text>
      ))}

      <polygon points={areaPts} fill={`url(#${gradId})`} />
      <polyline points={linePts} fill="none"
        stroke="rgb(6,188,249)" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />

      {hoveredIdx !== values.length - 1 && (
        <circle cx={toX(values.length - 1)} cy={toY(values[values.length - 1])}
          r="3" fill="rgb(6,188,249)" stroke="white" strokeWidth="1.5" />
      )}

      {hoveredIdx !== null && tip && (
        <g>
          <line x1={tip.x} y1={PT} x2={tip.x} y2={PT + cH}
            stroke="rgb(6,188,249)" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3 2" />
          <circle cx={tip.x} cy={tip.y} r="4"
            fill="rgb(6,188,249)" stroke="white" strokeWidth="2" />
          <rect x={tip.tipX} y={tip.tipY} width={tip.tipW} height={tip.tipH}
            rx="4" fill="rgb(15,23,42)" fillOpacity="0.88" />
          <text x={tip.tipX + tip.tipW / 2} y={tip.tipY + 9} textAnchor="middle"
            fontSize="8.5" fill="rgb(6,188,249)" fontFamily="monospace" fontWeight="bold">
            {tip.label}
          </text>
          <text x={tip.tipX + tip.tipW / 2} y={tip.tipY + 20} textAnchor="middle"
            fontSize="7.5" fill="white" fillOpacity="0.5" fontFamily="monospace">
            {tip.time}
          </text>
        </g>
      )}
    </svg>
  );
}