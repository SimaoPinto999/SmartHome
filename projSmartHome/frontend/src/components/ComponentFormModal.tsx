import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { DeviceComponent, ComponentType, SensorType, ActuatorType, SensorUnit } from '../types/devices';

const SENSOR_TYPES: { value: SensorType; label: string; unit: SensorUnit }[] = [
  { value: 'TEMPERATURE', label: 'Temperature', unit: 'CELSIUS'  },
  { value: 'CONTACT',     label: 'Contact',     unit: 'BINARY'   },
  { value: 'MOTION',      label: 'Motion',      unit: 'BINARY'   },
  { value: 'POWER',       label: 'Power',       unit: 'WATTS'    },
  { value: 'SMOKE',       label: 'Smoke',       unit: 'PERCENT'  },
  { value: 'RAIN',        label: 'Rain',        unit: 'MM'       },
  { value: 'LIGHT',       label: 'Light',       unit: 'LUX'      },
];

const ACTUATOR_TYPES: { value: ActuatorType; label: string; unit: SensorUnit }[] = [
  { value: 'LIGHT', label: 'Light',       unit: 'BINARY'  },
  { value: 'MOTOR', label: 'Motor',       unit: 'BINARY'  },
  { value: 'VALVE', label: 'Valve',       unit: 'BINARY'  },
  { value: 'HVAC',  label: 'Thermostat',  unit: 'CELSIUS' },
];

interface ComponentFormModalProps {
  open: boolean;
  deviceId: string;
  component?: DeviceComponent | null;
  onClose: () => void;
  onSave: (data: Partial<DeviceComponent>) => Promise<void>;
}

export function ComponentFormModal({ open, deviceId, component, onClose, onSave }: ComponentFormModalProps) {
  const isEdit = !!component;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    componentName:  '',
    componentType:  'SENSOR' as ComponentType,
    sensorType:     'TEMPERATURE' as SensorType,
    actuatorType:   'LIGHT' as ActuatorType,
    unit:           'CELSIUS' as SensorUnit,
    nominalWatts:   '' as string,
  });

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (component) {
      setForm({
        componentName:  component.componentName,
        componentType:  component.componentType,
        sensorType:     component.sensorType ?? 'TEMPERATURE',
        actuatorType:   component.actuatorType ?? 'LIGHT',
        unit:           component.unit,
        nominalWatts:   component.nominalWatts?.toString() ?? '',
      });
    } else {
      setForm({
        componentName:  '',
        componentType:  'SENSOR',
        sensorType:     'TEMPERATURE',
        actuatorType:   'LIGHT',
        unit:           'CELSIUS',
        nominalWatts:   '',
      });
    }
  }, [open, component]);

  const handleTypeChange = (ct: ComponentType) => {
    const unit = ct === 'SENSOR'
      ? (SENSOR_TYPES.find(s => s.value === form.sensorType)?.unit ?? 'CELSIUS')
      : (ACTUATOR_TYPES.find(a => a.value === form.actuatorType)?.unit ?? 'BINARY');
    setForm(f => ({ ...f, componentType: ct, unit }));
  };

  const handleSensorTypeChange = (st: SensorType) => {
    const unit = SENSOR_TYPES.find(s => s.value === st)?.unit ?? 'CELSIUS';
    setForm(f => ({ ...f, sensorType: st, unit }));
  };

  const handleActuatorTypeChange = (at: ActuatorType) => {
    const unit = ACTUATOR_TYPES.find(a => a.value === at)?.unit ?? 'BINARY';
    setForm(f => ({ ...f, actuatorType: at, unit }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.componentName.trim()) return;
    const needsNominalWatts = form.componentType === 'ACTUATOR' ||
      (form.componentType === 'SENSOR' && form.sensorType !== 'POWER');
    const parsedWatts = form.nominalWatts !== '' ? parseFloat(form.nominalWatts) : null;
    if (needsNominalWatts && form.nominalWatts !== '' && (isNaN(parsedWatts!) || parsedWatts! < 0)) {
      setError('Nominal power must be a positive number.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Partial<DeviceComponent> & { nominalWatts?: number | null } = {
        deviceId,
        componentName: form.componentName.trim(),
        componentType: form.componentType,
        sensorType:    form.componentType === 'SENSOR'   ? form.sensorType   : null,
        actuatorType:  form.componentType === 'ACTUATOR' ? form.actuatorType : null,
        unit:          form.unit,
        nominalWatts:  needsNominalWatts && parsedWatts !== null && parsedWatts > 0 ? parsedWatts : null,
      };
      await onSave(body);
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
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
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
              <h2 className="text-base font-bold">{isEdit ? 'Edit Component' : 'New Component'}</h2>
              <button onClick={onClose} className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={form.componentName}
                  onChange={e => setForm(f => ({ ...f, componentName: e.target.value }))}
                  placeholder="e.g. Living Room Temperature Sensor"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Component type</label>
                <div className="flex gap-2">
                  {(['SENSOR', 'ACTUATOR'] as ComponentType[]).map(ct => (
                    <button
                      key={ct}
                      type="button"
                      onClick={() => handleTypeChange(ct)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                        form.componentType === ct
                          ? 'bg-primary/10 border-primary/40 text-primary'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/30'
                      }`}
                    >
                      {ct === 'SENSOR' ? 'Sensor' : 'Actuator'}
                    </button>
                  ))}
                </div>
              </div>

              {form.componentType === 'SENSOR' ? (
                <div>
                  <label className={labelClass}>Sensor type</label>
                  <select
                    value={form.sensorType}
                    onChange={e => handleSensorTypeChange(e.target.value as SensorType)}
                    className={inputClass}
                  >
                    {SENSOR_TYPES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className={labelClass}>Actuator type</label>
                  <select
                    value={form.actuatorType}
                    onChange={e => handleActuatorTypeChange(e.target.value as ActuatorType)}
                    className={inputClass}
                  >
                    {ACTUATOR_TYPES.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={labelClass}>Unit</label>
                <input
                  type="text"
                  value={form.unit}
                  readOnly
                  className={`${inputClass} opacity-60 cursor-not-allowed`}
                />
              </div>

              {(form.componentType === 'ACTUATOR' || (form.componentType === 'SENSOR' && form.sensorType !== 'POWER')) && (
                <div>
                  <label className={labelClass}>Nominal power (W)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.nominalWatts}
                    onChange={e => setForm(f => ({ ...f, nominalWatts: e.target.value }))}
                    placeholder="e.g. 60"
                    className={inputClass}
                  />
                  <p className="text-xs text-slate-400 mt-1">Used to estimate energy consumption. Leave blank to exclude from Energy.</p>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
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
