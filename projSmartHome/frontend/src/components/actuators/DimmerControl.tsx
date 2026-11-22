import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ToggleButton } from './ActuatorDetail';

interface DimmerControlProps {
  currentValue: string | null;
  onCommand: (value: string) => Promise<void>;
  disabled?: boolean;
}

const PILL_HEIGHT = 220;
const STEP = 5;

function parseRaw(v: string | null): { isOff: boolean; value: number } {
  if (!v || v.toUpperCase() === 'OFF') return { isOff: true, value: 50 };
  const n = parseInt(v, 10);
  if (isNaN(n)) return { isOff: true, value: 50 };
  return { isOff: false, value: Math.min(100, Math.max(0, n)) };
}

export function DimmerControl({ currentValue, onCommand, disabled = false }: DimmerControlProps) {
  const { isOff, value: serverValue } = parseRaw(currentValue);

  // Internal float brightness — avoids integer snapping during drag
  const [brightness, setBrightness] = useState<number>(serverValue);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const dragStartBrightness = useRef<number>(brightness);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDragging) setBrightness(serverValue);
  }, [isDragging, currentValue]);

  const sendDebounced = useCallback((value: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onCommand(String(Math.round(value))), 300);
  }, [onCommand]);

  const adjust = (delta: number) => {
    if (disabled || isOff) return;
    setBrightness((prev: number) => {
      const next = Math.min(100, Math.max(0, prev + delta));
      sendDebounced(next);
      return next;
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || isOff) return;
    e.preventDefault();
    dragStartY.current = e.clientY;
    dragStartBrightness.current = brightness;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartY.current === null || disabled || isOff) return;
    const dy = dragStartY.current - e.clientY;
    const deltaPct = (dy / PILL_HEIGHT) * 100;
    const next = Math.min(100, Math.max(0, dragStartBrightness.current + deltaPct));
    setBrightness(next);
    sendDebounced(next);
  };

  const onPointerUp = () => {
    dragStartY.current = null;
    setIsDragging(false);
  };

  const displayBrightness = Math.round(brightness);
  const fillFraction = isOff ? 0 : brightness / 100;

  // Handle sits 40% up inside the filled area
  const handleBottom = fillFraction * PILL_HEIGHT * 0.4;

  return (
    <div className="flex flex-col items-center gap-5 py-2 select-none">

      {/* Value label */}
      <div className="text-center min-h-[3.5rem]">
        <p className="text-4xl font-bold tabular-nums">
          {isOff ? '—' : `${displayBrightness}%`}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {isOff ? 'Off' : displayBrightness < 30 ? 'Dim' : displayBrightness < 70 ? 'Moderate' : 'Bright'}
        </p>
      </div>

      {/* Pill */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ height: PILL_HEIGHT, width: 120 }}
        className={`relative rounded-[60px] overflow-hidden bg-amber-50 dark:bg-slate-800 border border-amber-100 dark:border-slate-700 touch-none ${
          disabled || isOff
            ? 'cursor-default opacity-60'
            : isDragging
              ? 'cursor-grabbing'
              : 'cursor-grab'
        }`}
      >
        {/* Fill — no transition during drag, smooth on release */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-[60px] will-change-[height]"
          style={{
            height: `${fillFraction * 100}%`,
            background: 'linear-gradient(to top, #f59e0b, #fcd34d)',
            transition: isDragging ? 'none' : 'height 0.2s ease-out',
          }}
        />

        {/* Handle — floats inside the fill, hidden at extremes */}
        {!isOff && fillFraction > 0.08 && fillFraction < 0.95 && (
          <div
            className="absolute left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-white/50"
            style={{
              bottom: handleBottom,
              transition: isDragging ? 'none' : 'bottom 0.2s ease-out',
            }}
          />
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => adjust(-STEP)}
          disabled={disabled || isOff}
          className="size-11 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          −
        </button>
        <ToggleButton isOn={!isOff} onToggle={() => !disabled && onCommand(isOff ? String(displayBrightness) : 'OFF')} disabled={disabled} />
        <button
          onClick={() => adjust(+STEP)}
          disabled={disabled || isOff}
          className="size-11 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function DimmerInline({ currentValue, onCommand, disabled = false }: DimmerControlProps) {
  const { isOff, value: brightness } = parseRaw(currentValue);
  const lastBrightness = useRef(brightness);
  if (!isOff) lastBrightness.current = brightness;

  return (
    <div className="flex items-center gap-3">
      <span className={`text-sm font-bold tabular-nums ${isOff ? 'text-slate-400' : 'text-amber-400'}`}>
        {isOff ? 'OFF' : `${brightness}%`}
      </span>
      <ToggleButton
        isOn={!isOff}
        onToggle={() => onCommand(isOff ? String(lastBrightness.current) : 'OFF')}
        disabled={disabled}
      />
    </div>
  );
}
