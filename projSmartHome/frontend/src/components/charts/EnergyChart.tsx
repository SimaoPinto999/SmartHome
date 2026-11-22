import React, { useId, useRef, useState, useCallback, useMemo } from 'react';
import type { EnergyChartPoint } from '../../hooks/useEnergy';

interface EnergyChartProps {
  points: EnergyChartPoint[];
  loading: boolean;
}

const W = 700; const H = 180;
const PL = 56; const PR = 8; const PT = 8; const PB = 32;
const cW = W - PL - PR;
const cH = H - PT - PB;

function fmtKwh(v: number): string {
  if (v === 0) return '0';
  if (v < 0.001) return `${(v * 1_000_000).toFixed(1)}μWh`;
  if (v < 1)    return `${(v * 1000).toFixed(2)}Wh`;
  return `${v.toFixed(3)}kWh`;
}

function fmtTime(ts: string, points: EnergyChartPoint[]): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  const spanMs = points.length > 1
    ? new Date(points[points.length - 1].timestamp).getTime() - new Date(points[0].timestamp).getTime()
    : 0;
  if (spanMs <= 3_600_000 * 24)
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
}

export function EnergyChart({ points, loading }: EnergyChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const values  = points.map(p => parseFloat(p.value));
  const hasData = values.length >= 1 && values.some(v => v > 0);

  const rawMax = hasData ? Math.max(...values) : 1;
  const yMax   = rawMax > 0 ? rawMax * 1.15 : 1;

  const barCount = values.length;
  const barGap   = Math.max(1, cW / Math.max(barCount * 6, 1));
  const barW     = barCount > 0 ? Math.max(2, (cW - barGap * (barCount + 1)) / barCount) : 8;

  const toX  = (i: number) => PL + barGap + i * (barW + barGap);
  const toY  = (v: number) => PT + cH - (v / yMax) * cH;
  const toH  = (v: number) => (v / yMax) * cH;

  const yLabels = [0, 0.33, 0.66, 1].map(frac => ({
    y: PT + cH - frac * cH,
    label: fmtKwh(frac * yMax),
  }));

  const xLabels = useMemo(() => {
    if (points.length === 0) return [];
    const step = Math.max(1, Math.floor(points.length / 4));
    return [0, ...Array.from({ length: 3 }, (_, i) => Math.min((i + 1) * step, points.length - 1))]
      .filter((v, i, a) => a.indexOf(v) === i)
      .map(i => ({ x: toX(i) + barW / 2, label: fmtTime(points[i].timestamp, points) }));
  }, [points, barW]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || !hasData) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgX = pt.matrixTransform(ctm.inverse()).x;
    const idx  = Math.round((svgX - PL - barGap - barW / 2) / (barW + barGap));
    if (idx >= 0 && idx < values.length) setHoveredIdx(idx);
    else setHoveredIdx(null);
  }, [hasData, values.length, barW, barGap]);

  const handleMouseLeave = useCallback(() => setHoveredIdx(null), []);

  const tip = useMemo(() => {
    if (hoveredIdx === null || !hasData) return null;
    const x     = toX(hoveredIdx) + barW / 2;
    const y     = toY(values[hoveredIdx]);
    const label = fmtKwh(values[hoveredIdx]);
    const time  = fmtTime(points[hoveredIdx].timestamp, points);
    const tipW  = Math.max(label.length, time.length) * 5.8 + 16;
    const tipH  = 28;
    const tipX  = Math.min(Math.max(x - tipW / 2, PL), W - PR - tipW);
    const tipY  = y - tipH - 8 < PT ? y + 8 : y - tipH - 8;
    return { x, y, label, time, tipX, tipY, tipW, tipH };
  }, [hoveredIdx, values, points, barW]);

  if (loading) {
    return (
      <div className="h-44 flex items-center justify-center gap-2 text-slate-400">
        <div className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
        <span className="text-xs">Loading...</span>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="h-44 flex flex-col items-center justify-center gap-2 text-slate-400">
        <span className="material-symbols-outlined text-3xl text-primary/20">bar_chart</span>
        <span className="text-xs">No data for this period</span>
      </div>
    );
  }

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      style={{ cursor: 'crosshair' }}>

      {/* Y grid + labels */}
      {yLabels.map((l, i) => (
        <g key={i}>
          <line x1={PL} y1={l.y} x2={W - PR} y2={l.y}
            stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" strokeDasharray="4 3" />
          <text x={PL - 4} y={l.y + 3.5} textAnchor="end"
            fontSize="9" fill="currentColor" fillOpacity="0.5" fontFamily="monospace">
            {l.label}
          </text>
        </g>
      ))}

      {/* X axis */}
      <line x1={PL} y1={PT + cH} x2={W - PR} y2={PT + cH}
        stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />

      {/* X labels */}
      {xLabels.map((l, i) => (
        <text key={i} x={l.x} y={PT + cH + 16} textAnchor="middle"
          fontSize="9" fill="currentColor" fillOpacity="0.4" fontFamily="monospace">
          {l.label}
        </text>
      ))}

      {/* Bars */}
      {values.map((v, i) => {
        const bx  = toX(i);
        const bh  = toH(v);
        const by  = PT + cH - bh;
        const isHovered = hoveredIdx === i;
        const hasValue  = v > 0;
        return (
          <g key={i}>
            {/* Background bar for hover area */}
            <rect x={bx} y={PT} width={barW} height={cH}
              fill="transparent" />
            {/* Actual bar */}
            {hasValue && (
              <rect x={bx} y={by} width={barW} height={Math.max(bh, 1)}
                rx="2"
                fill={isHovered ? 'rgb(6,188,249)' : 'rgb(6,188,249)'}
                fillOpacity={isHovered ? 1 : 0.7}
              />
            )}
          </g>
        );
      })}

      {/* Tooltip */}
      {hoveredIdx !== null && tip && (
        <g>
          <rect x={tip.tipX} y={tip.tipY} width={tip.tipW} height={tip.tipH}
            rx="4" fill="rgb(15,23,42)" fillOpacity="0.92" />
          <text x={tip.tipX + tip.tipW / 2} y={tip.tipY + 10} textAnchor="middle"
            fontSize="9" fill="rgb(6,188,249)" fontFamily="monospace" fontWeight="bold">
            {tip.label}
          </text>
          <text x={tip.tipX + tip.tipW / 2} y={tip.tipY + 21} textAnchor="middle"
            fontSize="8" fill="white" fillOpacity="0.5" fontFamily="monospace">
            {tip.time}
          </text>
        </g>
      )}
    </svg>
  );
}