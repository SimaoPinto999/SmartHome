import React from 'react';
import type { SensorType } from '../../types/devices';

interface SensorDetailProps {
  sensorType: SensorType;
  value: string | null;
  unit: string;
}

export function SensorDetail({ sensorType, value, unit }: SensorDetailProps) {
  if (!value) return null;

  switch (sensorType) {
    case 'TEMPERATURE': {
      const n = parseFloat(value);
      const pct = Math.min(100, Math.max(0, (n / 50) * 100));
      const barColor = n < 18 ? 'bg-sky-400' : n < 26 ? 'bg-green-400' : 'bg-red-400';
      return (
        <div className="mt-3 space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold">{n.toFixed(1)}</span>
            <span className="text-base text-slate-400 mb-1">{unit}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0 {unit}</span><span>25 {unit}</span><span>50 {unit}</span>
          </div>
        </div>
      );
    }

    case 'CONTACT': {
      const isOpen = value.toUpperCase() === 'ON' || value.toUpperCase() === 'OPEN';
      return (
        <div className="mt-3 flex items-center gap-3">
          <div className={`size-10 rounded-full flex items-center justify-center ${
            isOpen ? 'bg-amber-400/20 text-amber-400' : 'bg-green-500/20 text-green-400'
          }`}>
            <span className="material-symbols-outlined text-xl">{isOpen ? 'door_open' : 'door_front'}</span>
          </div>
          <span className={`text-lg font-bold ${isOpen ? 'text-amber-400' : 'text-green-400'}`}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      );
    }

    case 'MOTION': {
      const isMotion = value.toUpperCase() === 'ON' || value.toUpperCase() === 'TRUE';
      return (
        <div className="mt-3 flex items-center gap-3">
          <div className={`size-10 rounded-full flex items-center justify-center ${
            isMotion ? 'bg-red-500/20 text-red-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
          }`}>
            <span className="material-symbols-outlined text-xl">motion_sensor_active</span>
          </div>
          <span className={`text-lg font-bold ${isMotion ? 'text-red-500' : 'text-slate-400'}`}>
            {isMotion ? 'Motion detected' : 'No motion'}
          </span>
        </div>
      );
    }

    case 'POWER': {
      const n = parseFloat(value);
      const pct = Math.min(100, (n / 3000) * 100);
      return (
        <div className="mt-3 space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold">{n}</span>
            <span className="text-base text-slate-400 mb-1">{unit}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0 {unit}</span><span>1500 {unit}</span><span>3000 {unit}</span>
          </div>
        </div>
      );
    }

    case 'SMOKE': {
      const n = parseFloat(value);
      const danger = n > 3;
      return (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              danger ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-green-500/20 text-green-400'
            }`}>
              <span className="material-symbols-outlined text-xl">detector_smoke</span>
            </div>
            <div>
              <span className={`text-2xl font-bold ${danger ? 'text-red-400' : ''}`}>{n.toFixed(1)} {unit}</span>
              {danger && <p className="text-xs text-red-400 font-bold">⚠ High level</p>}
            </div>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${danger ? 'bg-red-500' : 'bg-green-400'}`}
              style={{ width: `${Math.min(100, n * 10)}%` }} />
          </div>
        </div>
      );
    }

    case 'RAIN': {
      const n = parseFloat(value);
      return (
        <div className="mt-3 flex items-center gap-3">
          <div className="size-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-xl">water_drop</span>
          </div>
          <div>
            <span className="text-2xl font-bold">{n.toFixed(1)}</span>
            <span className="text-sm text-slate-400 ml-1">{unit}</span>
          </div>
        </div>
      );
    }

    case 'LIGHT': {
      const n = parseFloat(value);
      const pct = Math.min(100, (n / 10000) * 100);
      return (
        <div className="mt-3 space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold">{n}</span>
            <span className="text-base text-slate-400 mb-1">{unit}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className="h-full rounded-full bg-yellow-400 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0</span><span>5000</span><span>10000 {unit}</span>
          </div>
        </div>
      );
    }

    default:
      return <span className="text-sm font-bold text-primary mt-3 block">{value}</span>;
  }
}