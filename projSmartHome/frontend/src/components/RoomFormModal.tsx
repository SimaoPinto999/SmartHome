import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { RoomType } from '../types/devices';
import type { RoomWithCount } from '../types/rooms';
import { ROOM_TYPES } from '../types/rooms';

export interface RoomFormValues {
  roomName: string;
  roomType: RoomType;
  floor: number;
}

interface RoomFormModalProps {
  open: boolean;
  room?: RoomWithCount | null;
  onClose: () => void;
  onSubmit: (values: RoomFormValues) => Promise<void>;
}

export function RoomFormModal({ open, room, onClose, onSubmit }: RoomFormModalProps) {
  const isEdit = !!room;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<RoomFormValues>({
    roomName: '',
    roomType: 'LIVING_ROOM',
    floor: 0,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      roomName: room?.roomName ?? '',
      roomType: room?.roomType ?? 'LIVING_ROOM',
      floor: room?.floor ?? 0,
    });
    setError(null);
  }, [open, room]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.roomName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ roomName: form.roomName.trim(), roomType: form.roomType, floor: form.floor });
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
              <h2 className="text-base font-bold">{isEdit ? 'Edit Room' : 'New Room'}</h2>
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
                  value={form.roomName}
                  onChange={e => setForm(f => ({ ...f, roomName: e.target.value }))}
                  placeholder="e.g. Living Room"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Type</label>
                <select
                  value={form.roomType}
                  onChange={e => setForm(f => ({ ...f, roomType: e.target.value as RoomType }))}
                  className={inputClass}
                >
                  {ROOM_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Floor</label>
                <input
                  type="number"
                  value={form.floor}
                  step={1}
                  onChange={e => setForm(f => ({ ...f, floor: Number(e.target.value) }))}
                  className={inputClass}
                />
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
