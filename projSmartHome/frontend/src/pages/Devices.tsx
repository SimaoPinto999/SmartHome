import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ROLES } from '../types/role';
import { useRealtime } from '../context/RealtimeContext';
import Layout from '../components/layout/Layout';
import { DeviceCard } from '../components/DeviceCard';
import { DeviceModal } from '../components/DeviceModal';
import { DeviceFormModal } from '../components/DeviceFormModal';
import { Dropdown } from '../components/Dropdown';
import { useDevices } from '../hooks/useDevices';
import { useApi } from '../hooks/useApi';
import { useProfile } from '../hooks/useProfile';
import type { Device, DeviceComponent, SensorType, ActuatorType } from '../types/devices';
import type { DropdownOption } from '../components/Dropdown';
import type { PermissionRecord } from '../types/permissions';

// ─── Filter definitions ───────────────────────────────────────────────────────

type ComponentFilter = 'all' | SensorType | ActuatorType;

const COMPONENT_FILTERS: { id: ComponentFilter; label: string; icon: string }[] = [
  { id: 'all',         label: 'All',         icon: 'widgets' },
  { id: 'TEMPERATURE', label: 'Temperature', icon: 'thermometer' },
  { id: 'CONTACT',     label: 'Contact',     icon: 'sensor_door' },
  { id: 'POWER',       label: 'Power',       icon: 'bolt' },
  { id: 'SMOKE',       label: 'Smoke',       icon: 'detector_smoke' },
  { id: 'RAIN',        label: 'Rain',        icon: 'water_drop' },
  { id: 'LIGHT',       label: 'Light',       icon: 'light_mode' },
  { id: 'MOTOR',       label: 'Motor',       icon: 'garage' },
  { id: 'VALVE',       label: 'Valve',       icon: 'valve' },
  { id: 'HVAC',        label: 'HVAC',        icon: 'ac_unit' },
];

// ─── Hook: active actuator state per device ───────────────────────────────────

function useDeviceActiveMap(componentMap: Map<string, DeviceComponent[]>): [Map<string, boolean>, React.Dispatch<React.SetStateAction<Map<string, boolean>>>] {
  const { apiFetch } = useApi();
  const { onSensorReading } = useRealtime();
  const [activeMap, setActiveMap] = useState<Map<string, boolean>>(new Map());

  const fetchStates = useCallback(() => {
    const actuatorEntries: { deviceId: string; componentId: number }[] = [];
    for (const [deviceId, components] of componentMap.entries()) {
      for (const c of components) {
        if (c.componentType === 'ACTUATOR') {
          actuatorEntries.push({ deviceId, componentId: c.componentId });
        }
      }
    }
    if (actuatorEntries.length === 0) return;

    Promise.allSettled(
      actuatorEntries.map(async ({ deviceId, componentId }) => {
        const res = await apiFetch(`/api/metrics/${componentId}/latest`);
        if (!res.ok) return { deviceId, isOn: false };
        const data = await res.json();
        const value: string | null = data?.value ?? null;
        const isOn = value?.toUpperCase() === 'ON' || value?.toUpperCase() === 'OPEN' ||
          (!!value && value.toUpperCase() !== 'OFF' && (value.startsWith('#') || !isNaN(parseFloat(value))));
        return { deviceId, isOn };
      }),
    ).then(results => {
      const map = new Map<string, boolean>();
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { deviceId, isOn } = result.value;
          if (isOn) map.set(deviceId, true);
          else if (!map.has(deviceId)) map.set(deviceId, false);
        }
      }
      setActiveMap(map);
    });
  }, [componentMap, apiFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchStates(); }, [fetchStates]);

  const componentToDevice = useMemo(() => {
    const map = new Map<number, string>();
    for (const [deviceId, comps] of componentMap.entries()) {
      for (const c of comps) map.set(c.componentId, deviceId);
    }
    return map;
  }, [componentMap]);

  // Patch the affected device's on/off state directly from the WS message — no refetch
  useEffect(() => onSensorReading(msg => {
    const owner = componentToDevice.get(msg.componentId);
    if (!owner) return;
    const v = msg.value?.toUpperCase();
    const isOn = v === 'ON' || v === 'OPEN' ||
      (!!v && v !== 'OFF' && (msg.value.startsWith('#') || !isNaN(parseFloat(msg.value))));
    setActiveMap(prev => new Map(prev).set(owner!, isOn));
  }), [onSensorReading, componentMap]);

  return [activeMap, setActiveMap];
}

// ─── Hook: load components for all devices in parallel ────────────────────────

function useAllComponents(deviceIds: string[]): Map<string, DeviceComponent[]> {
  const { apiFetch } = useApi();
  const [componentMap, setComponentMap] = useState<Map<string, DeviceComponent[]>>(new Map());

  const fetchAll = useCallback(async () => {
    if (deviceIds.length === 0) return;
    const results = await Promise.allSettled(
      deviceIds.map(async id => {
        const res = await apiFetch(`/api/device-components/device/${id}`);
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        const data: DeviceComponent[] = await res.json();
        return { id, data };
      }),
    );
    const map = new Map<string, DeviceComponent[]>();
    for (const result of results) {
      if (result.status === 'fulfilled') {
        map.set(result.value.id, result.value.data);
      }
    }
    setComponentMap(map);
  }, [apiFetch, deviceIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return componentMap;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Devices() {
  const { devices, loading, error, refetch } = useDevices();
  const { apiFetch } = useApi();
  const profile = useProfile();
  const isLimited = profile?.role === ROLES.GUEST || profile?.role === ROLES.RESTRICTED;

  const [selected, setSelected]     = useState<Device | null>(null);
  const [activeRoom, setActiveRoom] = useState<number | 'all'>('all');
  const [activeFilter, setActiveFilter] = useState<ComponentFilter>('all');
  const [search, setSearch]         = useState('');
  const [deviceForm, setDeviceForm] = useState<{ open: boolean; device: Device | null }>({ open: false, device: null });

  const [permissions, setPermissions] = useState<{ deviceIds: Set<string>; roomIds: Set<number> } | null>(null);

  useEffect(() => {
    if (!isLimited || !profile) return;
    apiFetch(`/api/permissions/profile/${profile.profileId}`)
      .then(res => res.json())
      .then((perms: PermissionRecord[]) => {
        setPermissions({
          deviceIds: new Set(perms.filter(p => p.deviceId != null).map(p => p.deviceId!)),
          roomIds: new Set(perms.filter(p => p.deviceId == null && p.roomId != null).map(p => p.roomId!)),
        });
      })
      .catch(() => setPermissions({ deviceIds: new Set(), roomIds: new Set() }));
  }, [profile?.profileId, isLimited]); // eslint-disable-line react-hooks/exhaustive-deps

  const deviceIds    = useMemo(() => devices.map(d => d.deviceId), [devices]);
  const componentMap = useAllComponents(deviceIds);
  const [activeMap, setActiveMap] = useDeviceActiveMap(componentMap);

  const componentToDevice = useMemo(() => {
    const map = new Map<number, string>();
    for (const [deviceId, components] of componentMap.entries()) {
      for (const c of components) map.set(c.componentId, deviceId);
    }
    return map;
  }, [componentMap]);

  const handleModalCommand = useCallback((componentId: number, value: string) => {
    const deviceId = componentToDevice.get(componentId);
    if (!deviceId) return;
    const upper = value.toUpperCase();
    const isOn = upper === 'ON' || upper === 'OPEN' ||
      (upper !== 'OFF' && !isNaN(parseFloat(value)));
    setActiveMap(prev => new Map(prev).set(deviceId, isOn));
  }, [componentToDevice, setActiveMap]);

  // Room options derived from loaded devices
  const roomOptions = useMemo((): DropdownOption[] => {
    const seen = new Map<number, DropdownOption>();
    for (const d of devices) {
      if (d.room && !seen.has(d.room.roomId)) {
        seen.set(d.room.roomId, {
          id:    d.room.roomId,
          label: d.room.roomName,
          icon:  'meeting_room',
        });
      }
    }
    return [
      { id: 'all', label: 'All rooms', icon: 'home' },
      ...Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label as string)),
    ];
  }, [devices]);

  const permFiltered = useMemo(() => {
    if (!isLimited || !permissions) return devices;
    return devices.filter(d =>
      permissions.deviceIds.has(d.deviceId) ||
      (d.room != null && permissions.roomIds.has(d.room.roomId))
    );
  }, [devices, isLimited, permissions]);

  const onlineCount  = permFiltered.filter(d => d.status === 'ONLINE').length;
  const offlineCount = permFiltered.length - onlineCount;

  const filtered = useMemo(() => {
    let list = permFiltered;

    if (activeRoom !== 'all') {
      list = list.filter(d => d.room?.roomId === activeRoom);
    }

    if (activeFilter !== 'all') {
      list = list.filter(device => {
        const comps = componentMap.get(device.deviceId) ?? [];
        return comps.some(
          c => c.sensorType === activeFilter || c.actuatorType === activeFilter,
        );
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        d =>
          d.deviceName.toLowerCase().includes(q) ||
          d.room?.roomName?.toLowerCase().includes(q) ||
          d.deviceId.toLowerCase().includes(q),
      );
    }

    return list;
  }, [permFiltered, componentMap, activeRoom, activeFilter, search]);
  const hasActiveFilters = search || activeRoom !== 'all' || activeFilter !== 'all';

  const topbarRight = (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
        <div className="size-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-bold text-green-500">{onlineCount} Available</span>
      </div>
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
        <span className="text-sm font-bold text-slate-500">{offlineCount} Unavailable</span>
      </div>
      <button
        onClick={refetch}
        className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Refresh"
      >
        <span className="material-symbols-outlined text-lg text-slate-400">refresh</span>
      </button>
    </div>
  );

  return (
    <>
      <Layout
        title="Devices"
        topbarRight={topbarRight}
        showSearch={true}
        searchPlaceholder="Search devices..."
        searchValue={search}
        onSearch={setSearch}
      >
        <div className="space-y-5">

          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Dropdown
              value={activeRoom}
              options={roomOptions}
              onChange={setActiveRoom}
              placeholder="Room"
              icon="home"
            />
            <Dropdown
              value={activeFilter}
              options={COMPONENT_FILTERS}
              onChange={setActiveFilter}
              placeholder="Type"
              icon="category"
            />
            {hasActiveFilters && (
              <button
                onClick={() => { setSearch(''); setActiveRoom('all'); setActiveFilter('all'); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/20 transition-all"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                Clear
              </button>
            )}
            {!isLimited && (
              <button
                onClick={() => setDeviceForm({ open: true, device: null })}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-background-dark text-sm font-bold hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span className="hidden sm:inline">New Device</span>
              </button>
            )}
            <span className="ml-auto text-xs text-slate-400 font-bold">
              {filtered.length} device{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
              <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-sm font-bold">Loading devices...</span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-400">
              <span className="material-symbols-outlined text-5xl">error</span>
              <p className="font-bold">{error}</p>
              <button onClick={refetch}
                className="text-sm px-4 py-2 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors">
                Try again
              </button>
            </div>
          )}

          {/* Device grid */}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(device => (
                <DeviceCard
                  key={device.deviceId}
                  device={device}
                  onClick={() => setSelected(device)}
                  isActive={activeMap.get(device.deviceId)}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
              <span className="material-symbols-outlined text-6xl">devices_off</span>
              <p className="font-bold text-lg">No devices found</p>
              {hasActiveFilters && (
                <button
                  onClick={() => { setSearch(''); setActiveRoom('all'); setActiveFilter('all'); }}
                  className="text-sm text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </Layout>

      <DeviceModal
        device={selected}
        onClose={() => setSelected(null)}
        onCommand={handleModalCommand}
        onEdit={device => {
          setSelected(null);
          setDeviceForm({ open: true, device });
        }}
        onDelete={async device => {
          await apiFetch(`/api/devices/${device.deviceId}`, { method: 'DELETE' });
          setSelected(null);
          refetch();
          window.dispatchEvent(new CustomEvent('smarthome:devices-changed'));
        }}
      />

      <DeviceFormModal
        open={deviceForm.open}
        device={deviceForm.device}
        existingDevices={devices}
        onClose={() => setDeviceForm({ open: false, device: null })}
        onSaved={() => { refetch(); setDeviceForm({ open: false, device: null }); }}
      />
    </>
  );
}