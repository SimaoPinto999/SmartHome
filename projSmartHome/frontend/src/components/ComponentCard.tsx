import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { DeviceComponent, SensorType, ActuatorType } from '../types/devices';
import { resolveSignalType, parseMetricValue } from '../types/devices';
import { useLatestMetric } from '../hooks/useMetrics';
import { MetricChart } from './charts/MetricChart';
import { SensorDetail } from './sensors/SensorDetail';
import { ActuatorDetail, ActuatorInline } from './actuators/ActuatorDetail';

// Translation maps

const COMPONENT_TYPE_PT: Record<string, string> = {
  SENSOR:   'Sensor',
  ACTUATOR: 'Actuator',
};

const SENSOR_TYPE_PT: Record<string, string> = {
  TEMPERATURE: 'Temperature',
  CONTACT:     'Contact',
  POWER:       'Power',
  SMOKE:       'Smoke',
  RAIN:        'Rain',
  LIGHT:       'Brightness',
  MOTION:      'Motion',
};

const ACTUATOR_TYPE_PT: Record<string, string> = {
  LIGHT: 'Light',
  MOTOR: 'Motor',
  VALVE: 'Valve',
};

// Icon maps

const SENSOR_ICON: Record<SensorType, string> = {
  TEMPERATURE: 'thermometer',
  CONTACT:     'sensor_door',
  POWER:       'bolt',
  SMOKE:       'detector_smoke',
  RAIN:        'water_drop',
  LIGHT:       'light_mode',
  MOTION:      'motion_sensor_active',
};

const ACTUATOR_ICON: Record<ActuatorType, string> = {
  LIGHT: 'lightbulb',
  MOTOR: 'garage',
  VALVE: 'valve',
  HVAC: 'ac_unit',
};

// Sensor value badge

function SensorBadge({ value, signal }: {
  value: string;
  signal: ReturnType<typeof resolveSignalType>;
}) {
  const parsed = parseMetricValue(value, signal);

  if (signal === 'toggle') {
    return (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
        parsed.isOn
          ? 'bg-green-500/20 text-green-400'
          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
      }`}>
        {parsed.label}
      </span>
    );
  }

  if (signal === 'rgb') {
    return (
      <div className="flex items-center gap-2">
        <div className="size-4 rounded-full border border-white/20" style={{ backgroundColor: parsed.rgb }} />
        <span className="text-xs font-mono text-slate-400">{parsed.label}</span>
      </div>
    );
  }

  return <span className="text-sm font-bold text-primary">{parsed.label}</span>;
}

// ComponentCard

export interface ComponentCardProps {
  component: DeviceComponent;
  /**
   * false → tab "Controlar": header only. Actuators show inline control.
   * true  → tab "Detalhes": header + rich display + chart.
   */
  showChart?: boolean;
  onCommand: (componentId: number, value: string) => Promise<void>;
  isOnline?: boolean;
}

export function ComponentCard({ component, showChart = false, onCommand, isOnline = true }: ComponentCardProps) {
  const signal     = resolveSignalType(component);
  const isActuator = component.componentType === 'ACTUATOR';
  const isSensor   = component.componentType === 'SENSOR';

  const { data: latest, loading: latestLoading, error: latestError, refresh } = useLatestMetric(component.componentId);
  const currentValue = latest?.value ?? null;

  // pendingValue — optimistic UI: show the command value immediately while
  // waiting for the next polling cycle to confirm the actual state.
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  const prevLatestRef = useRef(latest);
  useEffect(() => {
    if (latest !== prevLatestRef.current) {
      prevLatestRef.current = latest;
      setPendingValue(null); // real value arrived — clear optimistic state
    }
  }, [latest]);

  const displayValue = pendingValue ?? currentValue;

  const handleCommand = useCallback(async (componentId: number, value: string) => {
    setPendingValue(value); // optimistic update
    try {
      await onCommand(componentId, value);
      // After successful command, force an immediate refresh instead of
      // waiting up to 8s for the next polling cycle.
      setTimeout(refresh, 1500);
    } catch {
      setPendingValue(null); // revert on error
    }
  }, [onCommand, refresh]);

  const icon = isActuator
    ? (ACTUATOR_ICON[component.actuatorType!] ?? 'electrical_services')
    : (SENSOR_ICON[component.sensorType!]    ?? 'sensors');

  const typeLabel =
    SENSOR_TYPE_PT[component.sensorType ?? ''] ??
    ACTUATOR_TYPE_PT[component.actuatorType ?? ''] ??
    (component.sensorType ?? component.actuatorType);

  const isActuatorOn = (() => {
    if (!displayValue) return false;
    const upper = displayValue.toUpperCase();
    if (upper === 'OFF') return false;
    if (upper === 'ON' || upper === 'OPEN') return true;
    if (displayValue.startsWith('#')) return true; // hex color = light on
    return !isNaN(parseFloat(displayValue)); // numeric setpoint = thermostat on
  })();
  // Header right-hand side
  let headerRight: React.ReactNode;

  const offlineBadge = (
    <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400">
      <span className="material-symbols-outlined text-xs">signal_disconnected</span>
      Unavailable
    </span>
  );

  if (!isOnline) {
    headerRight = offlineBadge;
  } else if (latestLoading && displayValue === null) {
    headerRight = <span className="text-xs text-slate-400 animate-pulse">...</span>;
  } else if (isActuator && !showChart) {
    headerRight = (
      <ActuatorInline
        actuatorType={component.actuatorType!}
        unit={component.unit}
        currentValue={displayValue}
        onCommand={v => handleCommand(component.componentId, v)}
      />
    );
  } else if (isActuator && showChart) {
    const label = signal === 'thermostat' && isActuatorOn
      ? `${parseFloat(displayValue!).toFixed(1)} °C`
      : isActuatorOn ? 'ON' : 'OFF';
    headerRight = (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full transition-colors duration-300 ${
        isActuatorOn ? 'bg-green-500/20 text-green-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
      }`}>
        {label}
      </span>
    );
  } else if (latestError && displayValue === null) {
    headerRight = <span className="text-xs text-slate-400 animate-pulse">Waiting...</span>;
  } else {
    headerRight = displayValue
      ? <SensorBadge value={displayValue} signal={signal} />
      : <span className="text-xs text-slate-400">—</span>;
  }

  return (
    <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`size-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
            isActuator
              ? (isActuatorOn ? 'bg-primary/20 text-primary' : 'bg-slate-200 dark:bg-slate-700 text-slate-400')
              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
          }`}>
            <span className="material-symbols-outlined text-lg">{icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{component.componentName}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                {COMPONENT_TYPE_PT[component.componentType] ?? component.componentType} · {typeLabel}
              </p>
              {component.nominalWatts != null && component.nominalWatts > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400">
                  <span className="material-symbols-outlined" style={{fontSize: '10px'}}>electric_bolt</span>
                  {component.nominalWatts}W
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          {headerRight}
        </div>
      </div>

      {/* Detail section — tab Detalhes only */}
      {showChart && (
        <>
          {isSensor && component.sensorType && (
            <SensorDetail
              sensorType={component.sensorType}
              value={displayValue}
              unit={component.unit}
            />
          )}

          {isActuator && component.actuatorType && (
            <ActuatorDetail
              actuatorType={component.actuatorType}
              unit={component.unit}
              value={displayValue}
              onCommand={v => handleCommand(component.componentId, v)}
              disabled={!isOnline}
            />
          )}

          {(isSensor || (isActuator && signal === 'toggle')) && (
            <MetricChart
              componentId={component.componentId}
              isToggle={signal === 'toggle'}
            />
          )}
        </>
      )}
    </div>
  );
}