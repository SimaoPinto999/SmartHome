import { useState, useEffect, useCallback, useMemo } from 'react';
import { ROLES } from '../types/role';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

import { useProfile } from '../hooks/useProfile';
import { useApi } from '../hooks/useApi';
import { useRealtime } from '../context/RealtimeContext';
import { ToggleButton } from '../components/actuators/ActuatorDetail';
import type { Device, DeviceComponent, ActuatorType } from '../types/devices';
import Layout from '../components/layout/Layout';
import { useHouse } from '../hooks/useHouse';
import { useAlarm } from '../hooks/useAlarm';
import { useToast } from '../context/ToastContext';
import { useWeather } from '../hooks/useWeather';

// ─── Design Spell: Greeting based on time of day ─────────────
function getGreeting(): { text: string; icon: string } {
  const h = new Date().getHours();
  if (h < 6)  return { text: 'Good Night',    icon: 'bedtime' };
  if (h < 12) return { text: 'Good Morning',  icon: 'wb_sunny' };
  if (h < 18) return { text: 'Good Afternoon',icon: 'partly_cloudy_day' };
  return       { text: 'Good Evening',        icon: 'nights_stay' };
}

// ─── Design Spell: Welcome Card with aurora + live clock + weather ────────────
function WelcomeCard({ name, isLimited, houseName }: { name: string; isLimited: boolean; houseName?: string }) {
  const [time, setTime] = useState(new Date());
  const greeting = getGreeting();
  const { data: weather, isLoading: weatherLoading } = useWeather();

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = time.getHours().toString().padStart(2, '0');
  const mm = time.getMinutes().toString().padStart(2, '0');
  const ss = time.getSeconds().toString().padStart(2, '0');
  const dateStr = time.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-slate-50 dark:bg-background-dark"
      style={{ minHeight: '180px' }}
    >
      {/* ── Aurora orbs — dark mode ── */}
      <div
        className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full opacity-0 dark:opacity-20"
        style={{
          background: 'radial-gradient(circle, #06bcf9 0%, transparent 70%)',
          animation: 'orb-drift-a 8s ease-in-out infinite alternate',
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 right-10 h-72 w-72 rounded-full opacity-0 dark:opacity-15"
        style={{
          background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
          animation: 'orb-drift-b 10s ease-in-out infinite alternate',
        }}
      />
      <div
        className="pointer-events-none absolute top-8 right-1/3 h-48 w-48 rounded-full opacity-0 dark:opacity-10"
        style={{
          background: 'radial-gradient(circle, #06bcf9 0%, transparent 70%)',
          animation: 'orb-drift-a 12s ease-in-out infinite alternate-reverse',
        }}
      />

      {/* ── Aurora orbs — light mode ── */}
      <div
        className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full opacity-30 dark:opacity-0"
        style={{
          background: 'radial-gradient(circle, #bae6fd 0%, transparent 70%)',
          animation: 'orb-drift-a 8s ease-in-out infinite alternate',
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 right-10 h-72 w-72 rounded-full opacity-20 dark:opacity-0"
        style={{
          background: 'radial-gradient(circle, #ddd6fe 0%, transparent 70%)',
          animation: 'orb-drift-b 10s ease-in-out infinite alternate',
        }}
      />

      {/* ── Scanline grid — dark mode only ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(6,188,249,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,188,249,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col sm:flex-row items-stretch gap-0 p-7">

        {/* Left: greeting + name + status + clock */}
        <div className="flex flex-col justify-between flex-1 gap-4">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="flex items-center gap-2 mb-1"
            >
              <span className="material-symbols-outlined text-primary text-lg">{greeting.icon}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-primary/70">{greeting.text}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2"
            >
              {name}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 flex-wrap"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-xs font-bold">
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                All systems normal
              </span>
              {houseName && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary/70 text-xs font-bold">
                  <span className="material-symbols-outlined text-sm">home</span>
                  {houseName}
                </span>
              )}
              {isLimited && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Restricted View
                </span>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex flex-col"
          >
            <div className="flex items-end gap-1 tabular-nums leading-none">
              <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{hh}:{mm}</span>
              <span className="text-xl font-bold text-primary/60 mb-1">{ss}</span>
            </div>
            <span className="text-xs text-slate-500 mt-1 font-medium">{dateStr}</span>
          </motion.div>
        </div>

        {/* Divider — vertical on sm+, horizontal on mobile */}
        <div className="block sm:hidden w-full h-px bg-slate-200 dark:bg-slate-700/60 my-5" />
        <div className="hidden sm:block w-px bg-slate-200 dark:bg-slate-700/60 mx-7 self-stretch" />

        {/* Right: weather */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="flex flex-col justify-between shrink-0 w-full sm:w-52"
        >
          {weatherLoading || !weather ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin size-5 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-400 flex items-center gap-0.5 mb-3">
                <span className="material-symbols-outlined text-base">location_on</span>
                {weather.city}
              </p>
              <div className="flex items-center gap-3 mb-auto">
                <span className="material-symbols-outlined text-5xl text-primary">{weather.icon}</span>
                <div>
                  <p className="text-4xl font-black tabular-nums leading-none text-slate-900 dark:text-white">{weather.temp}°C</p>
                  <p className="text-sm text-slate-400 mt-1">{weather.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                {[
                  { icon: 'thermostat',   value: `${weather.feelsLike}°C`,     label: 'Feels like' },
                  { icon: 'humidity_mid', value: `${weather.humidity}%`,        label: 'Humidity' },
                  { icon: 'air',          value: `${weather.windSpeed} km/h`,   label: 'Wind' },
                  { icon: 'water_drop',   value: `${weather.precipitation} mm`, label: 'Rain' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary/60">{s.icon}</span>
                    <div>
                      <p className="text-[11px] text-slate-400 leading-none">{s.label}</p>
                      <p className="text-sm font-bold mt-0.5">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* ── CSS keyframes injected inline ── */}
      <style>{`
        @keyframes orb-drift-a {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, 20px) scale(1.15); }
        }
        @keyframes orb-drift-b {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(-25px, -15px) scale(1.1); }
        }
      `}</style>
    </motion.div>
  );
}

// ─── Actuator state ───────────────────────────────────────────
interface ActuatorState {
  device: Device;
  componentId: number | null;
  actuatorType: ActuatorType | null;
  unit: string;
  currentValue: string | null;
}

const ACTUATOR_ICON: Record<ActuatorType, string> = {
  LIGHT: 'lightbulb',
  MOTOR: 'garage',
  VALVE: 'valve',
  HVAC: 'ac_unit',
};

function isActuatorOn(actuatorType: ActuatorType | null, value: string | null): boolean {
  if (!value) return false;
  const upper = value.toUpperCase();
  if (upper === 'OFF') return false;
  if (upper === 'ON' || upper === 'OPEN') return true;
  if (actuatorType === 'HVAC') return !isNaN(parseFloat(value));
  return false;
}

function actuatorLabel(actuatorType: ActuatorType | null, isOn: boolean, value?: string | null): string {
  if (actuatorType === 'HVAC') {
    if (!isOn) return 'Off';
    const n = value ? parseFloat(value) : NaN;
    return isNaN(n) ? 'On' : `${n.toFixed(1)} °C`;
  }
  if (actuatorType === 'MOTOR') return isOn ? 'Open' : 'Closed';
  if (actuatorType === 'VALVE') return isOn ? 'Open' : 'Closed';
  return isOn ? 'On' : 'Off';
}

// ─── Hook: fetch actuator devices with current state ──────────
function useActuatorStates() {
  const { apiFetch } = useApi();
  const { onSensorReading } = useRealtime();
  const [states, setStates] = useState<ActuatorState[]>([]);

  const fetchAll = useCallback(async () => {
    const devRes = await apiFetch('/api/devices');
    if (!devRes.ok) return;
    const devices: Device[] = await devRes.json();
    const actuatorDevices = devices;

    const results = await Promise.allSettled(
      actuatorDevices.map(async (device): Promise<ActuatorState> => {
        const compRes = await apiFetch(`/api/device-components/device/${device.deviceId}`);
        if (!compRes.ok) return { device, componentId: null, actuatorType: null, unit: '', currentValue: null };
        const components: DeviceComponent[] = await compRes.json();
        const comp = components.find(c => c.componentType === 'ACTUATOR') ?? null;
        if (!comp) return { device, componentId: null, actuatorType: null, unit: '', currentValue: null };

        const metRes = await apiFetch(`/api/metrics/${comp.componentId}/latest`);
        const currentValue: string | null = metRes.ok ? ((await metRes.json())?.value ?? null) : null;

        return { device, componentId: comp.componentId, actuatorType: comp.actuatorType, unit: comp.unit, currentValue };
      })
    );

    setStates(
      results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<ActuatorState>).value)
    );
  }, [apiFetch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Patch the affected actuator's value directly from the WS message — no refetch
  useEffect(() => onSensorReading(msg => {
    setStates(prev => prev.map(s => s.componentId === msg.componentId ? { ...s, currentValue: msg.value } : s));
  }), [onSensorReading]);

  const sendCommand = useCallback(async (componentId: number, value: string) => {
    setStates(prev =>
      prev.map(s => s.componentId === componentId ? { ...s, currentValue: value } : s)
    );
    const res = await apiFetch(`/api/metrics/${componentId}/command`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
    if (!res.ok) fetchAll();
  }, [apiFetch, fetchAll]);

  return { states, sendCommand };
}

// ─── Active Devices grid ──────────────────────────────────────
function ActiveDevices({ states, sendCommand, showToast }: {
  states: ActuatorState[];
  sendCommand: (componentId: number, value: string) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {

  const actuatorStates = states.filter(s => s.componentId !== null).slice(0, 6);

  if (actuatorStates.length === 0) {
    return (
      <div className="text-sm text-slate-400 py-6 text-center">No actuator devices available.</div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {actuatorStates.map(({ device, componentId, actuatorType, unit, currentValue }) => {
        const isOnline = device.status === 'ONLINE';
        const isOn = isActuatorOn(actuatorType, currentValue);
        const icon = actuatorType ? (ACTUATOR_ICON[actuatorType] ?? 'electrical_services') : 'electrical_services';
        const label = actuatorLabel(actuatorType, isOn, currentValue);
        const isRgb = actuatorType === 'LIGHT' && unit === 'RGB';
        const colorValue = isRgb && currentValue?.startsWith('#') ? currentValue : null;
        const isHvac = actuatorType === 'HVAC';

        const handleToggle = () => {
          if (!componentId) return;
          if (isHvac) {
            if (isOn) {
              sendCommand(componentId, 'OFF');
            } else {
              sendCommand(componentId, '21.0');
              showToast('Thermostat turned on: 21.0°C', 'info');
            }
          } else {
            sendCommand(componentId, isOn ? 'OFF' : 'ON');
          }
        };
        return (
          <div
            key={device.deviceId}
            className={`bg-white dark:bg-slate-800/40 border rounded-xl p-5 transition-all ${
              isOnline && isOn
                ? 'border-primary/30 dark:border-primary/20 hover:border-primary/60'
                : 'border-slate-200 dark:border-slate-700/50 opacity-80'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`size-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                isOnline && isOn
                  ? 'bg-primary/10 text-primary'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}>
                <span className="material-symbols-outlined">{icon}</span>
              </div>
              {componentId && isOnline ? (
                <ToggleButton isOn={isOn} onToggle={handleToggle} />
              ) : (
                <span className="text-xs text-slate-400 font-medium">{isOnline ? '—' : 'Unavailable'}</span>
              )}
            </div>
            <h3 className="font-bold text-sm">{device.deviceName}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {device.room?.roomName ?? '—'} · <span className={isOnline && isOn ? 'text-primary' : ''}>{label}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────
interface Feedback { msg: string; type: 'success' | 'warn' }

const BULK_TOAST: Record<string, { on: string; off: string }> = {
  secure:     { on: 'Security activated on all devices.', off: '' },
  'lights-off': { on: '', off: 'All lights turned off.' },
  'lights-on':  { on: 'All lights turned on.', off: '' },
};

function QuickActions({ states, sendCommand, isLimited, showToast, alarm }: {
  states: ActuatorState[];
  sendCommand: (componentId: number, value: string) => Promise<void>;
  isLimited: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  alarm: ReturnType<typeof useAlarm>;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const showFeedback = (msg: string, type: Feedback['type'] = 'warn') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const online = (s: ActuatorState) => s.componentId !== null && s.device.status === 'ONLINE';

  const bulkCommand = async (id: string, filter: (s: ActuatorState) => boolean, value: string) => {
    const targets = states.filter(s => online(s) && filter(s));
    if (targets.length === 0) {
      showFeedback('No actuators available for this action.');
      return;
    }
    setLoading(id);
    await Promise.allSettled(targets.map(s => sendCommand(s.componentId!, value)));
    setLoading(null);
    const msg = BULK_TOAST[id]?.[value === 'OFF' ? 'off' : 'on'];
    if (msg) showToast(msg, 'success');
  };

  const leaveHome = async () => {
    const lights    = states.filter(s => online(s) && s.actuatorType === 'LIGHT');
    const security  = !isLimited ? states.filter(s => online(s) && s.device.deviceType === 'SECURITY') : [];
    const closeable = states.filter(s => online(s) && (s.actuatorType === 'MOTOR' || s.actuatorType === 'VALVE'));

    if (lights.length + security.length + closeable.length === 0) {
      showFeedback('No actuators available.');
      return;
    }

    setLoading('leave');
    await Promise.allSettled([
      ...lights.map(s => sendCommand(s.componentId!, 'OFF')),
      ...security.map(s => sendCommand(s.componentId!, 'ON')),
      ...closeable.map(s => sendCommand(s.componentId!, 'OFF')),
    ]);
    setLoading(null);

    if (!isLimited && !alarm.armed) await alarm.toggle();

    const parts: string[] = [];
    if (lights.length > 0)    parts.push(`${lights.length} light${lights.length > 1 ? 's' : ''} turned off`);
    if (security.length > 0)  parts.push(`${security.length} security device${security.length > 1 ? 's' : ''} activated`);
    if (closeable.length > 0) parts.push(`${closeable.length} motor${closeable.length > 1 ? 's' : ''}/valve${closeable.length > 1 ? 's' : ''} closed`);
    if (!isLimited) parts.push('alarm armed');
    showFeedback(parts.join(', ') + '.', 'success');
  };

  const btnClass = (id: string, variant: 'dark' | 'danger' | 'default' = 'default') =>
    `flex items-center gap-3 p-4 w-full rounded-xl font-bold transition-all active:scale-95 ${
      loading === id ? 'opacity-50 pointer-events-none' : ''
    } ${
      variant === 'danger'
        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-400/40 hover:bg-amber-500/25'
        : variant === 'dark'
        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
        : 'bg-slate-100 dark:bg-primary/10 border border-slate-200 dark:border-primary/20'
    }`;

  return (
    <div className="flex flex-col gap-3">
      {feedback && (
        <div className={`text-xs rounded-lg px-3 py-2 flex items-center gap-2 ${
          feedback.type === 'success'
            ? 'text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20'
            : 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
        }`}>
          <span className="material-symbols-outlined text-sm">
            {feedback.type === 'success' ? 'check_circle' : 'info'}
          </span>
          {feedback.msg}
        </div>
      )}

      {/* Alarm toggle — US-09 — admin only */}
      {!isLimited && !alarm.loading && (
        <button
          className={`flex items-center gap-3 p-4 w-full rounded-xl font-bold transition-all active:scale-95 border ${
            alarm.toggling ? 'opacity-50 pointer-events-none' : ''
          } ${
            alarm.armed
              ? 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-400/40 hover:bg-red-500/25'
              : 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-400/30 hover:bg-green-500/20'
          }`}
          onClick={alarm.toggle}
        >
          <span className="material-symbols-outlined">
            {alarm.armed ? 'security' : 'no_encryption'}
          </span>
          <div className="text-left">
            <div className="text-sm font-bold">
              {alarm.armed ? 'Alarm Armed' : 'Alarm Disarmed'}
            </div>
            <div className="text-xs opacity-70 font-normal">
              {alarm.armed ? 'Click to disarm' : 'Click to arm'}
            </div>
          </div>
          {alarm.toggling
            ? <span className="ml-auto text-xs opacity-60">A atualizar...</span>
            : <span className={`ml-auto size-2.5 rounded-full ${alarm.armed ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
          }
        </button>
      )}

      {/* Leave Home — admin only */}
      {!isLimited && (
        <button
          className={btnClass('leave', 'danger')}
          onClick={leaveHome}
        >
          <span className="material-symbols-outlined">exit_to_app</span>
          <div className="text-left">
            <div className="text-sm font-bold">Leave Home</div>
            <div className="text-xs opacity-70 font-normal">Turn off lights · Close everything · Activate security</div>
          </div>
          {loading === 'leave'
            ? <span className="ml-auto text-xs opacity-60">Sending...</span>
            : <span className="ml-auto material-symbols-outlined">chevron_right</span>
          }
        </button>
      )}

      {!isLimited && (  
        <button
          className={btnClass('secure')}
          onClick={() => bulkCommand('secure', s => s.device.deviceType === 'SECURITY', 'ON')}
        >
          <span className="material-symbols-outlined text-primary">lock</span>
          <span>Secure Home</span>
          {loading === 'secure'
            ? <span className="ml-auto text-xs opacity-60">Sending...</span>
            : <span className="ml-auto material-symbols-outlined">chevron_right</span>
          }
        </button>
      )}
      <button
        className={btnClass('lights-off')}
        onClick={() => bulkCommand('lights-off', s => s.actuatorType === 'LIGHT', 'OFF')}
      >
        <span className="material-symbols-outlined text-primary">light_off</span>
        <span>{isLimited ? 'Room Lights Off' : 'All Lights Off'}</span>
        {loading === 'lights-off'
          ? <span className="ml-auto text-xs opacity-60">Sending...</span>
          : <span className="ml-auto material-symbols-outlined">chevron_right</span>
        }
      </button>
      <button
        className={btnClass('lights-on')}
        onClick={() => bulkCommand('lights-on', s => s.actuatorType === 'LIGHT', 'ON')}
      >
        <span className="material-symbols-outlined text-primary">wb_sunny</span>
        <span>All Lights On</span>
        {loading === 'lights-on'
          ? <span className="ml-auto text-xs opacity-60">Sending...</span>
          : <span className="ml-auto material-symbols-outlined">chevron_right</span>
        }
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function Dashboard() {
  const profile = useProfile();
  const { data: house } = useHouse();
  const alarm = useAlarm();
  const { showToast } = useToast();
  const { apiFetch } = useApi();
  const isLimited = profile?.role === ROLES.RESTRICTED || profile?.role === ROLES.GUEST;
  const displayName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'Alex';
  const { states, sendCommand } = useActuatorStates();

  const [permissions, setPermissions] = useState<{ deviceIds: Set<string>; roomIds: Set<number> } | null>(null);

  useEffect(() => {
    if (!isLimited || !profile) return;
    apiFetch(`/api/permissions/profile/${profile.profileId}`)
      .then(res => res.json())
      .then((perms: { permissionId: number; deviceId: string | null; roomId: number | null }[]) => {
        setPermissions({
          deviceIds: new Set(perms.filter(p => p.deviceId != null).map(p => p.deviceId!)),
          roomIds: new Set(perms.filter(p => p.deviceId == null && p.roomId != null).map(p => p.roomId!)),
        });
      })
      .catch(() => setPermissions({ deviceIds: new Set(), roomIds: new Set() }));
  }, [profile?.profileId, isLimited]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleStates = useMemo(() => {
    if (!isLimited || !permissions) return states;
    return states.filter(s =>
      permissions.deviceIds.has(s.device.deviceId) ||
      (s.device.room != null && permissions.roomIds.has(s.device.room.roomId))
    );
  }, [states, isLimited, permissions]);

  return (
    <Layout title="Dashboard" showSearch={false}>

      <WelcomeCard name={displayName} isLimited={isLimited} houseName={house?.houseName} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <section className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">Active Devices</h2>
              {(() => {
                const onCount = states.filter(s => s.componentId !== null && s.device.status === 'ONLINE' && isActuatorOn(s.actuatorType, s.currentValue)).length;
                return onCount > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                    <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                    {onCount} active
                  </span>
                ) : null;
              })()}
            </div>
            <Link to="/devices" className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
              View all <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <ActiveDevices states={visibleStates} sendCommand={sendCommand} showToast={showToast} />
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-bold">Quick Actions</h2>
          <QuickActions states={visibleStates} sendCommand={sendCommand} isLimited={isLimited} showToast={showToast} alarm={alarm} />
        </section>
      </div>
    </Layout>
  );
}
