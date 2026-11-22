  import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useApi } from '../hooks/useApi';
import { useHouse } from '../hooks/useHouse';
import type { Device, DeviceType, Room } from '../types/devices';

const DEVICE_TYPES: { value: DeviceType; label: string }[] = [
  { value: 'GATEWAY',     label: 'Gateway' },
  { value: 'CONTROLLER',  label: 'Controller' },
  { value: 'SENSOR_NODE', label: 'Sensor' },
  { value: 'ACTUATOR',    label: 'Actuator' },
  { value: 'SECURITY',    label: 'Security' },
];

interface DeviceFormModalProps {
  open: boolean;
  device?: Device | null;
  existingDevices?: Device[];
  onClose: () => void;
  onSaved: () => void;
}

const ROOM_TYPE_ABBREV: Record<string, string> = {
  LIVING_ROOM: 'LIV',
  KITCHEN:     'KIT',
  BEDROOM:     'BED',
  OFFICE:      'OFF',
  GARAGE:      'GAR',
  OUTSIDE:     'GARD',
  BATHROOM:    'BAT',
  HALLWAY:     'HALL',
};

function generateDeviceId(room: Room, existingDevices: Device[]): string {
  const abbrev = ROOM_TYPE_ABBREV[room.roomType] ?? room.roomName.slice(0, 4).toUpperCase();
  const count = existingDevices.filter(d => d.roomId === room.roomId).length + 1;
  return `ESP32-${abbrev}${room.roomId}-${String(count).padStart(2, '0')}`;
}

export function DeviceFormModal({ open, device, existingDevices = [], onClose, onSaved }: DeviceFormModalProps) {
  const { apiFetch } = useApi();
  const { data: house } = useHouse();
  const isEdit = !!device;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    deviceId:   '',
    deviceName: '',
    deviceType: 'SENSOR_NODE' as DeviceType,
    roomId:     '',
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      deviceId:   device?.deviceId   ?? '',
      deviceName: device?.deviceName ?? '',
      deviceType: device?.deviceType ?? 'SENSOR_NODE',
      roomId:     device?.roomId?.toString() ?? '',
    });
    setError(null);
  }, [open, device]);

  useEffect(() => {
    if (!house || !open) return;
    apiFetch(`/api/rooms/house/${house.houseId}`)
      .then(res => res.ok ? res.json() : [])
      .then((data: Room[]) => setRooms(data))
      .catch(() => {});
  }, [house, open, apiFetch]);

  const handleRoomChange = (roomId: string) => {
    const room = rooms.find(r => r.roomId === Number(roomId));
    const newId = room ? generateDeviceId(room, existingDevices) : '';
    setForm(f => ({ ...f, roomId, deviceId: newId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.deviceName.trim() || !form.roomId) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        deviceName: form.deviceName.trim(),
        deviceType: form.deviceType,
        roomId:     Number(form.roomId),
      };
      const res = isEdit
        ? await apiFetch(`/api/devices/${device!.deviceId}`, { method: 'PUT',  body: JSON.stringify(body) })
        : await apiFetch(`/api/devices/${form.deviceId.trim()}`, { method: 'POST', body: JSON.stringify(body) });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? `Error ${res.status}`);
      }
      onSaved();
      window.dispatchEvent(new CustomEvent('smarthome:devices-changed'));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none focus:border-primary transition-colors';
  const labelClass = 'text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1.5';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            className="relative w-full sm:max-w-md bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            onClick={e => e.stopPropagation()}
            initial={{ y: 48, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>

            <div className="flex items-center justify-between px-6 pt-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-base font-bold">{isEdit ? 'Edit Device' : 'New Device'}</h2>
              <button
                onClick={onClose}
                className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={form.deviceName}
                  onChange={e => setForm(f => ({ ...f, deviceName: e.target.value }))}
                  placeholder="e.g. Living Room Sensor"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Type</label>
                <select
                  value={form.deviceType}
                  onChange={e => setForm(f => ({ ...f, deviceType: e.target.value as DeviceType }))}
                  className={inputClass}
                >
                  {DEVICE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Room</label>
                <select
                  value={form.roomId}
                  onChange={e => handleRoomChange(e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="">Select a room...</option>
                  {rooms.map(r => (
                    <option key={r.roomId} value={r.roomId}>{r.roomName}</option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-background-dark text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Saving...' : isEdit ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
