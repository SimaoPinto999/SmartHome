import React, { useState, useCallback, useRef, useMemo, useId } from 'react';
import type { ChartPoint } from './NumericChart';

const W = 400; const H = 116;
const PL = 28; const PR = 8; const PT = 12; const PB = 20;
const cW = W - PL - PR;
const cH = H - PT - PB;

function toBinary(raw: string): number {
  const v = raw.toUpperCase();
  return v === 'ON' || v === 'OPEN' || v === '1' || v === 'TRUE' ? 1 : 0;
}

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

export function StepChart({ points }: { points: ChartPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const gradId = useId();

  const parsed = points.map(p => toBinary(p.value));

  const toX = (i: number) => PL + (parsed.length > 1 ? (i / (parsed.length - 1)) * cW : 0);
  const toY = (v: number) => v === 1 ? PT : PT + cH;

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
    const idx = Math.round((relX / cW) * (parsed.length - 1));
    setHoveredIdx(idx);
  }, [parsed.length]);

  const handleMouseLeave = useCallback(() => setHoveredIdx(null), []);

  const tip = useMemo(() => {
    if (hoveredIdx === null || parsed.length < 2) return null;
    const x     = toX(hoveredIdx);
    const isOn  = parsed[hoveredIdx] === 1;
    const label = isOn ? 'ON' : 'OFF';
    const time  = fmtTime(points[hoveredIdx].timestamp, points);
    const tipW  = 42;
    const tipH  = 26;
    const tipX  = Math.min(Math.max(x - tipW / 2, PL), W - PR - tipW);
    const tipY  = isOn ? PT + cH / 2 : PT - 4;
    const color = isOn ? 'rgb(34,197,94)' : 'rgb(148,163,184)';
    return { x, isOn, label, time, tipX, tipY, tipW, tipH, color };
  }, [hoveredIdx, parsed, points]);

  if (parsed.length < 2) return null;

  let d = `M ${toX(0)},${toY(parsed[0])}`;
  for (let i = 1; i < parsed.length; i++) {
    const x     = toX(i);
    const prevY = toY(parsed[i - 1]);
    const currY = toY(parsed[i]);
    d += ` L ${x},${prevY} L ${x},${currY}`;
  }
  d += ` L ${toX(parsed.length - 1)},${toY(parsed[parsed.length - 1])}`;

  const areaD = `${d} L ${toX(parsed.length - 1)},${PT + cH} L ${toX(0)},${PT + cH} Z`;

  // X-axis: 3 evenly spaced labels
  const xLabels = [0, Math.floor((points.length - 1) / 2), points.length - 1].map(i => ({
    x: toX(i),
    label: fmtTime(points[i].timestamp, points),
  }));

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      style={{ cursor: 'crosshair' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(34,197,94)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="rgb(34,197,94)" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Y labels */}
      <text x={PL - 4} y={PT + 3} textAnchor="end"
        fontSize="9" fill="rgb(34,197,94)" fillOpacity="0.7" fontFamily="monospace">ON</text>
      <text x={PL - 4} y={PT + cH + 3} textAnchor="end"
        fontSize="9" fill="currentColor" fillOpacity="0.4" fontFamily="monospace">OFF</text>

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

      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={d} fill="none"
        stroke="rgb(34,197,94)" strokeWidth="1.8"
        strokeLinecap="square" strokeLinejoin="miter" />



      {hoveredIdx !== null && tip && (
        <g>
          <line x1={tip.x} y1={PT} x2={tip.x} y2={PT + cH}
            stroke={tip.color} strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3 2" />
          <circle cx={tip.x} cy={toY(parsed[hoveredIdx])} r="4"
            fill={tip.color} stroke="white" strokeWidth="2" />
          <rect x={tip.tipX} y={tip.tipY} width={tip.tipW} height={tip.tipH}
            rx="4" fill="rgb(15,23,42)" fillOpacity="0.88" />
          <text x={tip.tipX + tip.tipW / 2} y={tip.tipY + 9} textAnchor="middle"
            fontSize="8.5" fill={tip.color} fontFamily="monospace" fontWeight="bold">
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