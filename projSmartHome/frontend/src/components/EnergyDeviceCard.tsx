import React from 'react';
import type { EnergyDevice } from '../hooks/useEnergy';

interface EnergyDeviceCardProps {
  device: EnergyDevice;
  totalKwh: number;
}

function resolveIcon(componentType: string, sensorType: string | null, actuatorType: string | null): string {
  if (componentType === 'ACTUATOR') {
    switch (actuatorType) {
      case 'LIGHT': return 'lightbulb';
      case 'MOTOR': return 'garage';
      case 'VALVE': return 'valve';
      case 'HVAC':  return 'thermostat';
      default:      return 'electrical_services';
    }
  }
  switch (sensorType) {
    case 'TEMPERATURE': return 'thermometer';
    case 'POWER':       return 'bolt';
    case 'SMOKE':       return 'detector_smoke';
    case 'RAIN':        return 'water_drop';
    case 'LIGHT':       return 'light_mode';
    case 'CONTACT':     return 'sensor_door';
    case 'MOTION':      return 'sensors';
    default:            return 'electric_meter';
  }
}

export function EnergyDeviceCard({ device, totalKwh }: EnergyDeviceCardProps) {
  const pct = totalKwh > 0 ? Math.round((device.consumptionKwh / totalKwh) * 100) : 0;
  const color = pct >= 40 ? 'bg-red-400' : pct >= 20 ? 'bg-amber-400' : 'bg-primary';
  const textColor = pct >= 40 ? 'text-red-400' : pct >= 20 ? 'text-amber-400' : 'text-primary';
  const icon = resolveIcon(device.componentType, device.sensorType, device.actuatorType);

  return (
    <div className="bg-background-light dark:bg-background-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">{icon}</span>
        </div>
        <span className={`text-xs font-bold ${textColor}`}>{pct}%</span>
      </div>
      <div>
        <p className="font-bold text-sm truncate">{device.componentName}</p>
        <p className="text-[10px] text-slate-400 truncate">{device.deviceName} · {device.roomName}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-500 font-medium">{device.consumptionKwh.toFixed(3)} kWh</span>
          <span className="text-xs font-bold">{device.estimatedCost.toFixed(3)} €</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2">
          <div className={`${color} h-1.5 rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}