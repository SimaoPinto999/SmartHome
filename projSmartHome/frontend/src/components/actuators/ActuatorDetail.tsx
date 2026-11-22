import React, { useState, useEffect, useRef } from 'react';
import type { ActuatorType } from '../../types/devices';
import { ThermostatControl, ThermostatInline } from './ThermostatControl';
import { DimmerControl, DimmerInline } from './DimmerControl';

// Toggle button

export function ToggleButton({ isOn, onToggle, disabled = false }: { isOn: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none flex-shrink-0 ${
        disabled
          ? 'opacity-40 cursor-not-allowed bg-slate-300 dark:bg-slate-600'
          : isOn
            ? 'bg-primary shadow-[0_0_10px_rgba(6,188,249,0.4)]'
            : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 size-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
        isOn ? 'translate-x-7' : 'translate-x-0'
      }`} />
    </button>
  );
}

// Formats: '#rrggbb' = ON with color; 'OFF' = off (no color memory); 'OFF:#rrggbb' = off with last color
function parseLightState(value: string | null): { isOn: boolean; color: string } {
  if (!value) return { isOn: false, color: '#ffffff' };
  if (value.startsWith('#')) return { isOn: true, color: value };
  const offWithColor = value.match(/^OFF:(#[0-9a-fA-F]{6})$/i);
  if (offWithColor) return { isOn: false, color: offWithColor[1] };
  return { isOn: false, color: '#ffffff' };
}

function LightRgbInline({ currentValue, onCommand, disabled = false }: { currentValue: string | null; onCommand: (v: string) => Promise<void>; disabled?: boolean }) {
  const { isOn, color: serverColor } = parseLightState(currentValue);
  const [pendingColor, setPendingColor] = useState(serverColor);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (currentValue?.startsWith('#')) setPendingColor(currentValue);
  }, [currentValue]);

  const handleColorChange = (newColor: string) => {
    if (disabled) return;
    setPendingColor(newColor);
    if (!isOn) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onCommand(newColor), 200);
  };

  return (
    <div className="flex items-center gap-2">
      <ToggleButton isOn={isOn} onToggle={() => onCommand(isOn ? 'OFF' : pendingColor)} disabled={disabled} />
      <input
        type="color"
        value={pendingColor}
        onChange={e => handleColorChange(e.target.value)}
        disabled={disabled}
        className={`w-10 h-7 rounded border-0 bg-transparent ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      />
    </div>
  );
}

function LightRgbDetail({ value, onCommand, disabled = false }: { value: string | null; onCommand: (v: string) => Promise<void>; disabled?: boolean }) {
  const { isOn, color: serverColor } = parseLightState(value);
  const [pendingColor, setPendingColor] = useState(serverColor);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value?.startsWith('#')) setPendingColor(value);
  }, [value]);

  const handleColorChange = (newColor: string) => {
    if (disabled) return;
    setPendingColor(newColor);
    if (!isOn) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onCommand(newColor), 200);
  };

  return (
    <div className="mt-3 flex items-center gap-4">
      <div className="size-12 rounded-xl border border-white/10 shadow-md flex-shrink-0"
        style={{ backgroundColor: pendingColor }} />
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 mb-0.5">Current color</p>
        <p className="font-mono font-bold text-sm truncate">{pendingColor}</p>
      </div>
      <div className="ml-auto flex items-center gap-3 flex-shrink-0">
        <ToggleButton isOn={isOn} onToggle={() => onCommand(isOn ? 'OFF' : pendingColor)} disabled={disabled} />
        <input
          type="color"
          value={pendingColor}
          onChange={e => handleColorChange(e.target.value)}
          disabled={disabled}
          className={`w-10 h-10 rounded border-0 bg-transparent ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        />
      </div>
    </div>
  );
}

// Actuator inline control

interface ActuatorInlineProps {
  actuatorType: ActuatorType;
  unit: string;
  currentValue: string | null;
  onCommand: (value: string) => Promise<void>;
  disabled?: boolean;
}

export function ActuatorInline({ actuatorType, unit, currentValue, onCommand, disabled = false }: ActuatorInlineProps) {
  if (actuatorType === 'HVAC') {
    return <ThermostatInline currentValue={currentValue} onCommand={onCommand} />;
  }

  if (actuatorType === 'LIGHT' && unit === 'RGB') {
    return <LightRgbInline currentValue={currentValue} onCommand={onCommand} disabled={disabled} />;
  }

  if (actuatorType === 'LIGHT' && unit === 'PERCENT') {
    return <DimmerInline currentValue={currentValue} onCommand={onCommand} disabled={disabled} />;
  }

  const isOn =
    currentValue?.toUpperCase() === 'ON' ||
    currentValue?.toUpperCase() === 'OPEN';

  return <ToggleButton isOn={isOn} onToggle={() => onCommand(isOn ? 'OFF' : 'ON')} disabled={disabled} />;
}

// Actuator rich detail

interface ActuatorDetailProps {
  actuatorType: ActuatorType;
  unit: string;
  value: string | null;
  onCommand: (value: string) => Promise<void>;
  disabled?: boolean;
}

export function ActuatorDetail({ actuatorType, unit, value, onCommand, disabled = false }: ActuatorDetailProps) {
  if (actuatorType === 'HVAC') {
    return <ThermostatControl currentValue={value} onCommand={onCommand} />;
  }

  if (actuatorType === 'LIGHT' && unit === 'RGB') {
    return <LightRgbDetail value={value} onCommand={onCommand} disabled={disabled} />;
  }

  if (actuatorType === 'LIGHT' && unit === 'PERCENT') {
    return <DimmerControl currentValue={value} onCommand={onCommand} disabled={disabled} />;
  }

  const isOn =
    value?.toUpperCase() === 'ON' ||
    value?.toUpperCase() === 'OPEN';

  const label =
    actuatorType === 'MOTOR' ? (isOn ? 'Open' : 'Closed')
    : actuatorType === 'VALVE' ? (isOn ? 'Open' : 'Closed')
    : (isOn ? 'On' : 'Off');

  const icon =
    actuatorType === 'MOTOR' ? 'garage'
    : actuatorType === 'VALVE' ? 'valve'
    : 'lightbulb';

  return (
    <div className="mt-3 flex items-center gap-4">
      <div className={`size-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isOn ? 'bg-primary/20 text-primary' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
      }`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <span className={`text-xl font-bold ${isOn ? 'text-primary' : 'text-slate-400'}`}>
        {label}
      </span>
      <div className="ml-auto">
        <ToggleButton isOn={isOn} onToggle={() => onCommand(isOn ? 'OFF' : 'ON')} disabled={disabled} />
      </div>
    </div>
  );
}