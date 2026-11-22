import React, { useState, useRef, useCallback } from 'react';
import { ToggleButton } from './ActuatorDetail';

interface ThermostatControlProps {
  currentValue: string | null;
  onCommand: (value: string) => Promise<void>;
}

const MIN_TEMP = 10;
const MAX_TEMP = 30;
const STEP = 0.5;

// SVG arc helpers
const RADIUS = 80;
const CENTER = 110;
const ARC_START_DEG = 135;   // bottom-left
const ARC_SPAN_DEG  = 270;

function polarToXY(deg: number, r: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CENTER + r * Math.cos(rad), CENTER + r * Math.sin(rad)];
}

function arcPath(startDeg: number, endDeg: number, r: number): string {
  const [x1, y1] = polarToXY(startDeg, r);
  const [x2, y2] = polarToXY(endDeg, r);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function tempToDeg(temp: number): number {
  const frac = (temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);
  return ARC_START_DEG + frac * ARC_SPAN_DEG;
}

export function ThermostatControl({ currentValue, onCommand }: ThermostatControlProps) {
  const isOff = !currentValue || currentValue.toUpperCase() === 'OFF';
  const parsedCurrent = isOff ? null : parseFloat(currentValue!);

  const [setpoint, setSetpoint] = useState<number>(() => {
    if (!isOff && parsedCurrent !== null && !isNaN(parsedCurrent)) return parsedCurrent;
    return 21.0;
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendDebounced = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onCommand(value), 400);
  }, [onCommand]);

  const adjust = (delta: number) => {
    setSetpoint(prev => {
      const next = Math.min(MAX_TEMP, Math.max(MIN_TEMP, +(prev + delta).toFixed(1)));
      sendDebounced(next.toFixed(1));
      return next;
    });
  };

  const handleToggle = () => {
    if (isOff) {
      onCommand(setpoint.toFixed(1));
    } else {
      onCommand('OFF');
    }
  };

  // Arc geometry
  const trackStart = ARC_START_DEG;
  const trackEnd   = ARC_START_DEG + ARC_SPAN_DEG;
  const fillEnd    = isOff ? trackStart : tempToDeg(setpoint);
  const [ix, iy]   = polarToXY(isOff ? trackStart : fillEnd, RADIUS);

  const statusLabel = isOff ? 'Off' : setpoint > (parsedCurrent ?? 0) ? 'Heating' : 'Comfortable';
  const statusColor = isOff ? 'text-slate-400' : setpoint > (parsedCurrent ?? 0) ? 'text-orange-400' : 'text-green-400';

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      {/* Dial */}
      <div className="relative">
        <svg width={CENTER * 2} height={CENTER * 2} viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}>
          {/* Track */}
          <path
            d={arcPath(trackStart, trackEnd, RADIUS)}
            fill="none"
            stroke="currentColor"
            strokeWidth={10}
            strokeLinecap="round"
            className="text-slate-200 dark:text-slate-700"
          />

          {/* Fill arc */}
          {!isOff && fillEnd > trackStart && (
            <path
              d={arcPath(trackStart, fillEnd, RADIUS)}
              fill="none"
              stroke="currentColor"
              strokeWidth={10}
              strokeLinecap="round"
              className="text-orange-400"
            />
          )}

          {/* Indicator dot */}
          {!isOff && (
            <circle cx={ix} cy={iy} r={7} className="fill-orange-400" />
          )}
        </svg>

        {/* Centre content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
          <div className="flex items-start leading-none">
            <span className="text-5xl font-bold tabular-nums">
              {isOff ? '—' : Math.floor(setpoint)}
            </span>
            {!isOff && (
              <span className="text-xs mt-1 ml-0.5 text-slate-400">
                °C<br />.{(setpoint % 1 === 0 ? 0 : 5)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* +/- controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => adjust(-STEP)}
          disabled={isOff}
          className="size-11 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          −
        </button>
        <ToggleButton isOn={!isOff} onToggle={handleToggle} />
        <button
          onClick={() => adjust(+STEP)}
          disabled={isOff}
          className="size-11 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
}

// Compact inline version for ComponentCard list
export function ThermostatInline({ currentValue, onCommand }: ThermostatControlProps) {
  const isOff = !currentValue || currentValue.toUpperCase() === 'OFF';
  const parsed = isOff ? null : parseFloat(currentValue!);
  const lastSetpoint = useRef(21.0);

  if (!isOff && parsed !== null && !isNaN(parsed)) lastSetpoint.current = parsed;

  const handleToggle = () => {
    onCommand(isOff ? lastSetpoint.current.toFixed(1) : 'OFF');
  };

  return (
    <div className="flex items-center gap-3">
      <span className={`text-sm font-bold ${isOff ? 'text-slate-400' : 'text-orange-400'}`}>
        {isOff ? 'OFF' : `${parsed?.toFixed(1)} °C`}
      </span>
      <ToggleButton isOn={!isOff} onToggle={handleToggle} />
    </div>
  );
}
