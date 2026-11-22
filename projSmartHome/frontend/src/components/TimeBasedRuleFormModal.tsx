import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useApi } from '../hooks/useApi';
import { useHouse } from '../hooks/useHouse';
import type { TimeBasedRule, TimeBasedRuleRequest, ReferencePoint } from '../types/timeRules';
import type { DeviceComponent } from '../types/devices';

interface Props {
  open: boolean;
  rule?: TimeBasedRule | null;
  onClose: () => void;
  onSaved: () => void;
}

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none focus:border-primary transition-colors';
const labelClass = 'text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1.5';

function offsetLabel(minutes: number): string {
  if (minutes === 0) return 'exactly at';
  const abs = Math.abs(minutes);
  return minutes < 0 ? `${abs} min before` : `${abs} min after`;
}

export function TimeBasedRuleFormModal({ open, rule, onClose, onSaved }: Props) {
  const { apiFetch } = useApi();
  const { data: house } = useHouse();
  const isEdit = !!rule;

  const [name, setName] = useState('');
  const [referencePoint, setReferencePoint] = useState<ReferencePoint>('SUNSET');
  const [offsetMinutes, setOffsetMinutes] = useState(-30);
  const [targetId, setTargetId] = useState('');
  const [value, setValue] = useState('100');
  const [cooldown, setCooldown] = useState(60);
  const [actuators, setActuators] = useState<DeviceComponent[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (rule) {
      setName(rule.name);
      setReferencePoint(rule.referencePoint);
      setOffsetMinutes(rule.offsetMinutes);
      setTargetId(String(rule.targetComponentId));
      setValue(rule.value);
      setCooldown(rule.cooldownMinutes);
    } else {
      setName('');
      setReferencePoint('SUNSET');
      setOffsetMinutes(-30);
      setTargetId('');
      setValue('100');
      setCooldown(60);
    }
    setError(null);
  }, [open, rule]);

  useEffect(() => {
    if (!house || !open) return;
    apiFetch(`/api/device-components/house/${house.houseId}`)
      .then(res => res.ok ? res.json() : [])
      .then((data: DeviceComponent[]) => setActuators(data.filter(c => c.componentType === 'ACTUATOR')))
      .catch(() => {});
  }, [house, open, apiFetch]);

  const selectedActuator = actuators.find(a => String(a.componentId) === targetId);
  const isDimmer = selectedActuator?.actuatorType === 'LIGHT' && selectedActuator?.unit === 'PERCENT';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body: TimeBasedRuleRequest = {
        name,
        referencePoint,
        offsetMinutes,
        targetComponentId: Number(targetId),
        value,
        cooldownMinutes: cooldown,
        enabled: isEdit ? rule!.enabled : true,
      };
      const res = isEdit
        ? await apiFetch(`/api/time-rules/${rule!.ruleId}`, { method: 'PUT', body: JSON.stringify(body) })
        : await apiFetch('/api/time-rules', { method: 'POST', body: JSON.stringify(body) });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? `Error ${res.status}`);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            className="relative w-full sm:max-w-lg bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
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
              <h2 className="text-base font-bold">{isEdit ? 'Edit Sunset Rule' : 'New Sunset Rule'}</h2>
              <button onClick={onClose} className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className={labelClass}>Rule name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputClass} placeholder="e.g. Sunset Ambient Lighting" />
              </div>

              <div>
                <label className={labelClass}>Trigger based on</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['SUNSET', 'SUNRISE'] as ReferencePoint[]).map(ref => (
                    <button
                      key={ref}
                      type="button"
                      onClick={() => setReferencePoint(ref)}
                      className={`py-2.5 rounded-xl text-sm font-bold border transition-colors flex items-center justify-center gap-2 ${
                        referencePoint === ref
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {ref === 'SUNSET' ? 'wb_twilight' : 'wb_sunny'}
                      </span>
                      {ref === 'SUNSET' ? 'Sunset' : 'Sunrise'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Offset — <span className="text-amber-500 normal-case font-bold">{offsetLabel(offsetMinutes)} {referencePoint.toLowerCase()}</span>
                </label>
                <input
                  type="range" min={-120} max={120} step={5}
                  value={offsetMinutes}
                  onChange={e => setOffsetMinutes(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>2h before</span><span>exact</span><span>2h after</span>
                </div>
              </div>

              <div>
                <label className={labelClass}>Device to control</label>
                <select value={targetId} onChange={e => setTargetId(e.target.value)} required className={inputClass}>
                  <option value="">Select a device...</option>
                  {actuators.map(a => (
                    <option key={a.componentId} value={a.componentId}>
                      {a.componentName} ({a.actuatorType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  {isDimmer ? `Brightness — ${value}%` : 'Command to send'}
                </label>
                {isDimmer ? (
                  <input
                    type="range" min={0} max={100} step={5}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    className="w-full accent-amber-500"
                  />
                ) : (
                  <input type="text" value={value} onChange={e => setValue(e.target.value)} required className={inputClass} placeholder="e.g. ON, OFF" />
                )}
              </div>

              <div>
                <label className={labelClass}>Cooldown (minutes)</label>
                <input type="number" min={1} value={cooldown} onChange={e => setCooldown(Number(e.target.value))} className={inputClass} />
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-background-dark text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                  {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create rule'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
