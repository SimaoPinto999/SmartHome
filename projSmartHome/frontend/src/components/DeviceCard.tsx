import React from 'react';
import type { Device } from '../types/devices';

// Helpers

const DEVICE_TYPE_PT: Record<string, string> = {
  GATEWAY:     'Gateway',
  CONTROLLER:  'Controller',
  SENSOR_NODE: 'Sensor',
  ACTUATOR:    'Actuator',
  SECURITY:    'Security',
};

const STATUS_PT: Record<string, string> = {
  ONLINE:  'Available',
  OFFLINE: 'Unavailable',
  ERROR:   'Error',
};

const DEVICE_TYPE_ICON: Record<string, string> = {
  GATEWAY:     'hub',
  CONTROLLER:  'developer_board',
  SENSOR_NODE: 'vital_signs',
  ACTUATOR:    'toggle_on',
  SECURITY:    'shield',
};

const DEVICE_TYPE_COLOR: Record<string, string> = {
  GATEWAY:     'from-violet-500/20 to-transparent border-violet-500/30',
  CONTROLLER:  'from-yellow-400/20 to-transparent border-yellow-400/30',
  SENSOR_NODE: 'from-sky-500/20 to-transparent border-sky-500/30',
  ACTUATOR:    'from-amber-500/20 to-transparent border-amber-500/30',
  SECURITY:    'from-red-500/20 to-transparent border-red-500/30',
};

const DEVICE_TYPE_ICON_COLOR: Record<string, string> = {
  GATEWAY:     'bg-violet-500 text-white',
  CONTROLLER:  'bg-yellow-400 text-slate-900',
  SENSOR_NODE: 'bg-sky-500 text-white',
  ACTUATOR:    'bg-amber-500 text-slate-900',
  SECURITY:    'bg-red-500 text-white',
};

// Component

interface DeviceCardProps {
  device: Device;
  onClick: () => void;
  isActive?: boolean;
}

export function DeviceCard({ device, onClick, isActive }: DeviceCardProps) {
  const isOnline = device.status === 'ONLINE';
  const hasActuators = isActive !== undefined;
  const dimmed = hasActuators && !isActive;
  const color = (dimmed || !isOnline)
    ? 'from-slate-300/10 to-transparent border-slate-300/20 dark:from-slate-600/10 dark:border-slate-600/20'
    : (DEVICE_TYPE_COLOR[device.deviceType] ?? DEVICE_TYPE_COLOR.SENSOR_NODE);
  const iconColor = (dimmed || !isOnline)
    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400'
    : (DEVICE_TYPE_ICON_COLOR[device.deviceType] ?? DEVICE_TYPE_ICON_COLOR.SENSOR_NODE);
  const icon = DEVICE_TYPE_ICON[device.deviceType] ?? 'device_unknown';

  return (
    <button
      onClick={onClick}
      className={`relative text-left w-full p-5 rounded-2xl bg-gradient-to-br ${color} border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] group cursor-pointer overflow-hidden`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className={`size-12 rounded-xl flex items-center justify-center transition-colors duration-500 ${isOnline ? iconColor : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div className={`size-2.5 rounded-full mt-1.5 ${isOnline ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-slate-400'}`} />
      </div>

      {/* Info */}
      <p className="font-bold text-base leading-tight mb-0.5">{device.deviceName}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        {device.room?.roomName ?? `Room ${device.roomId}`}
      </p>

      {/* Status badge */}
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-bold uppercase tracking-wider ${isOnline ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
          {STATUS_PT[device.status] ?? device.status}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-wide">
          · {DEVICE_TYPE_PT[device.deviceType] ?? device.deviceType.replace('_', ' ')}
        </span>
      </div>

      {/* Hover arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="material-symbols-outlined text-sm text-slate-400">arrow_forward</span>
      </div>
    </button>
  );
}