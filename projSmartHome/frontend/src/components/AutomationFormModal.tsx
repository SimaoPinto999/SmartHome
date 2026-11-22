import { useReducer, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useApi } from '../hooks/useApi';
import { useHouse } from '../hooks/useHouse';
import type { AutomationRule, AutomationRuleRequest, RuleConditionDto, RuleActionDto } from '../types/automations';
import type { DeviceComponent } from '../types/devices';
import { isBinarySensor } from '../types/devices';
import { formReducer, initialState } from './automation/automationFormReducer';
import { TriggerSection } from './automation/TriggerSection';
import { ActionsSection } from './automation/ActionsSection';

interface AutomationFormModalProps {
  open: boolean;
  rule?: AutomationRule | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AutomationFormModal({ open, rule, onClose, onSaved }: AutomationFormModalProps) {
  const { apiFetch } = useApi();
  const { data: house } = useHouse();
  const isEdit = !!rule;

  const [form, dispatch] = useReducer(formReducer, initialState);
  const [sensors, setSensors] = useState<DeviceComponent[]>([]);
  const [actuators, setActuators] = useState<DeviceComponent[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (rule) {
      dispatch({ type: 'LOAD_RULE', rule });
    } else {
      dispatch({ type: 'RESET' });
    }
    setError(null);
  }, [open, rule]);

  useEffect(() => {
    if (!house || !open) return;
    apiFetch(`/api/device-components/house/${house.houseId}`)
      .then(res => res.ok ? res.json() : [])
      .then((data: DeviceComponent[]) => {
        setSensors(data.filter(c => c.componentType === 'SENSOR'));
        setActuators(data.filter(c => c.componentType === 'ACTUATOR'));
      })
      .catch(() => {});
  }, [house, open, apiFetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hasCommand && !form.hasAlert) {
      setError('Please select at least one action.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const selectedSensor = sensors.find(s => String(s.componentId) === form.sensorId) ?? null;
      const binary = isBinarySensor(selectedSensor?.sensorType ?? null);

      const condition: RuleConditionDto = binary
        ? { type: 'FIXED', threshold: form.binaryValue === 'ON' ? 1 : 0 }
        : form.condType === 'FIXED'
          ? { type: 'FIXED', threshold: Number(form.threshold) }
          : { type: 'EXTERNAL', externalSource: 'WEATHER_TEMP', offsetValue: Number(form.offset) };

      const actions: RuleActionDto[] = [];
      if (form.hasCommand) {
        for (const cmd of form.commands) {
          if (cmd.targetId) {
            actions.push({
              type: 'MQTT_COMMAND',
              targetComponentId: Number(cmd.targetId),
              value: cmd.value,
              autoOffMinutes: cmd.autoOffMinutes ? Number(cmd.autoOffMinutes) : null,
            });
          }
        }
      }
      if (form.hasAlert) {
        actions.push({ type: 'ALERT', severity: form.severity });
      }

      const body: AutomationRuleRequest = {
        sensorComponentId: Number(form.sensorId),
        name: form.name,
        operator: form.operator,
        cooldownMinutes: form.cooldown,
        enabled: true,
        condition,
        actions,
      };

      const res = isEdit
        ? await apiFetch(`/api/automations/${rule!.ruleId}`, { method: 'PUT', body: JSON.stringify(body) })
        : await apiFetch('/api/automations', { method: 'POST', body: JSON.stringify(body) });

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
              <h2 className="text-base font-bold">{isEdit ? 'Edit Rule' : 'New Automation Rule'}</h2>
              <button onClick={onClose} className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <TriggerSection state={form} sensors={sensors} dispatch={dispatch} />
              <ActionsSection state={form} actuators={actuators} dispatch={dispatch} />

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
