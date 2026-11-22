import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Layout from '../components/layout/Layout';
import { AutomationFormModal } from '../components/AutomationFormModal';
import { TimeBasedRuleFormModal } from '../components/TimeBasedRuleFormModal';
import { useAutomations } from '../hooks/useAutomations';
import { useTimeRules } from '../hooks/useTimeRules';
import { useApi } from '../hooks/useApi';
import type { AutomationRule } from '../types/automations';
import type { TimeBasedRule } from '../types/timeRules';
import { isBinarySensor } from '../types/devices';



type Tab = 'climate' | 'lighting' | 'other';

const SENSOR_TYPE_TAB: Record<string, Tab> = {
  TEMPERATURE: 'climate',
  LIGHT: 'lighting',
};

function tabForRule(rule: AutomationRule): Tab {
  return SENSOR_TYPE_TAB[rule.sensorType] ?? 'other';
}

function operatorLabel(op: string) {
  if (op === 'GT') return '>';
  if (op === 'LT') return '<';
  if (op === 'EQ') return '=';
  return op;
}

function conditionLabel(rule: AutomationRule) {
  const c = rule.condition;
  if (!c) return '—';

  const isBinary = isBinarySensor(rule.sensorType as any);
  if (isBinary && c.type === 'FIXED') {
    const isTrue = c.threshold === 1;
    if (rule.sensorType === 'DOOR_CONTACT' || rule.sensorType === 'CONTACT') {
      return isTrue ? 'is OPEN' : 'is CLOSED';
    }
    if (rule.sensorType === 'MOTION') {
      return isTrue ? 'is DETECTED' : 'is CLEAR';
    }
    return isTrue ? 'is ON' : 'is OFF';
  }

  if (c.type === 'FIXED') return `${operatorLabel(rule.operator)} ${c.threshold}`;
  const offset = c.offsetValue ?? 0;
  const offsetStr = offset === 0 ? 'outdoor temp' : `outdoor ${offset > 0 ? '+' : ''}${offset}°C`;
  return `${operatorLabel(rule.operator)} ${offsetStr}`;
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!enabled)}
      className={`flex h-6 w-11 items-center rounded-full p-1 cursor-pointer transition-colors ${enabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
      <div className={`h-4 w-4 rounded-full transition-transform ${enabled ? 'bg-background-dark translate-x-5' : 'bg-slate-100 dark:bg-slate-400 translate-x-0'}`} />
    </div>
  );
}

function RuleCard({
  rule, onEdit, onDelete, onToggle,
}: {
  rule: AutomationRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
}) {
  const sensorIcon = rule.sensorType === 'TEMPERATURE' ? 'thermostat'
    : rule.sensorType === 'LIGHT' ? 'light_mode'
    : rule.sensorType === 'SMOKE' ? 'detector_smoke'
    : rule.sensorType === 'MOTION' ? 'motion_sensor_active'
    : 'sensors';

  const hasAlert = rule.actions.some(a => a.type === 'ALERT');
  const hasCommand = rule.actions.some(a => a.type === 'MQTT_COMMAND');
  const autoOffMinutes = rule.actions.find(a => a.type === 'MQTT_COMMAND' && a.autoOffMinutes)?.autoOffMinutes;

  return (
    <div className="p-4 rounded-xl bg-slate-100 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg ${rule.enabled ? 'bg-primary/20 text-primary' : 'bg-slate-200 dark:bg-primary/10 text-slate-400'}`}>
            <span className="material-symbols-outlined text-xl">{sensorIcon}</span>
          </div>
          <h4 className="font-bold break-words">{rule.name}</h4>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit} className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined text-sm text-slate-400">edit</span>
          </button>
          <button onClick={onDelete} className="size-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 transition-colors">
            <span className="material-symbols-outlined text-sm text-red-400">delete</span>
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500 break-words">
            {rule.sensorComponentName} · {conditionLabel(rule)} · cooldown {rule.cooldownMinutes}min
          </p>
          <div className="flex gap-1.5 mt-1.5">
            {hasAlert && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/10 text-amber-500">alert</span>}
            {hasCommand && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-primary/10 text-primary">command</span>}
            {autoOffMinutes && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-500/10 text-blue-500">auto-off {autoOffMinutes}min</span>}
          </div>
        </div>
        <Toggle enabled={rule.enabled} onChange={onToggle} />
      </div>
    </div>
  );
}

function offsetLabel(minutes: number): string {
  if (minutes === 0) return 'at';
  const abs = Math.abs(minutes);
  return minutes < 0 ? `${abs}min before` : `${abs}min after`;
}

function TimeBasedRuleCard({
  rule, onEdit, onDelete, onToggle,
}: {
  rule: TimeBasedRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
}) {
  const isSunset = rule.referencePoint === 'SUNSET';
  const valLabel = rule.value.match(/^\d+$/) ? `${rule.value}%` : rule.value;
  return (
    <div className={`p-3 rounded-xl border transition-colors ${rule.enabled ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`size-8 flex-shrink-0 flex items-center justify-center rounded-lg ${rule.enabled ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
            <span className="material-symbols-outlined text-base">{isSunset ? 'wb_twilight' : 'wb_sunny'}</span>
          </div>
          <p className="font-bold text-base truncate">{rule.name}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit} className="size-7 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined text-sm text-slate-400">edit</span>
          </button>
          <button onClick={onDelete} className="size-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 transition-colors">
            <span className="material-symbols-outlined text-sm text-red-400">delete</span>
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="text-amber-500 font-bold">{offsetLabel(rule.offsetMinutes)}</span> {isSunset ? 'sunset' : 'sunrise'} → <span className="font-bold">{valLabel}</span>
        </p>
        <Toggle enabled={rule.enabled} onChange={onToggle} />
      </div>
    </div>
  );
}

export default function Schedules() {
  const { data: rules = [], isLoading: loading, error: automationErrorObj, refetch: refetchAutomations } = useAutomations();
  const automationError = automationErrorObj?.message ?? null;
  const { rules: timeRules, loading: timeLoading, error: timeError, refetch: timeRefetch } = useTimeRules();
  const error = automationError ?? timeError;
  const refetch = automationError ? refetchAutomations : timeRefetch;
  const { apiFetch } = useApi();
  const [activeTab, setActiveTab] = useState<Tab>('climate');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRule, setEditRule] = useState<AutomationRule | null>(null);
  const [timeFormOpen, setTimeFormOpen] = useState(false);
  const [editTimeRule, setEditTimeRule] = useState<TimeBasedRule | null>(null);

  const openNewRule = () => { setEditRule(null); setEditTimeRule(null); setPickerOpen(true); };

  const tabClass = (tab: Tab) =>
    `border-b-2 pb-4 px-1 font-bold transition-colors ${
      activeTab === tab
        ? 'border-primary text-primary'
        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-primary'
    }`;

  const filtered = rules.filter(r => tabForRule(r) === activeTab);

  const activeCount = rules.filter(r => r.enabled).length;
  const withAlerts = rules.filter(r => r.actions.some(a => a.type === 'ALERT')).length;
  const triggeredToday = rules.filter(r => {
    if (!r.lastTriggeredAt) return false;
    return new Date(r.lastTriggeredAt).toDateString() === new Date().toDateString();
  }).length;

  const handleToggle = async (rule: AutomationRule, enabled: boolean) => {
    await apiFetch(`/api/automations/${rule.ruleId}/enabled`, { method: 'PATCH', body: JSON.stringify({ enabled }) });
    refetch();
  };

  const handleDelete = async (rule: AutomationRule) => {
    await apiFetch(`/api/automations/${rule.ruleId}`, { method: 'DELETE' });
    refetch();
  };

  const handleTimeToggle = async (rule: TimeBasedRule, enabled: boolean) => {
    await apiFetch(`/api/time-rules/${rule.ruleId}/enabled`, { method: 'PATCH', body: JSON.stringify({ enabled }) });
    timeRefetch();
  };

  const handleTimeDelete = async (rule: TimeBasedRule) => {
    await apiFetch(`/api/time-rules/${rule.ruleId}`, { method: 'DELETE' });
    timeRefetch();
  };

  return (
    <>
      <Layout title="Schedules" showSearch={false}>
        <div className="w-full min-w-0 overflow-x-hidden space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: 'play_circle', label: 'Active rules', value: activeCount, total: rules.length },
              { icon: 'notifications', label: 'With alerts', value: withAlerts },
            ].map(({ icon, label, value, total }) => (
              <div key={label} className="rounded-xl border border-slate-200 dark:border-primary/10 bg-slate-50 dark:bg-primary/5 p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
                <div>
                  <p className="text-2xl font-bold">{value}{total !== undefined ? <span className="text-sm font-normal text-slate-400"> / {total}</span> : null}</p>
                  <p className="text-xs text-slate-400 font-medium">{label}</p>
                </div>
              </div>
            ))}
            {/* Triggered today + New Rule button */}
            <div className="rounded-xl border border-slate-200 dark:border-primary/10 bg-slate-50 dark:bg-primary/5 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">history</span>
                <div>
                  <p className="text-2xl font-bold">{triggeredToday}</p>
                  <p className="text-xs text-slate-400 font-medium">Triggered today</p>
                </div>
              </div>
              <button
                onClick={openNewRule}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-background-dark text-sm font-bold hover:opacity-90 transition-opacity flex-shrink-0"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                New Rule
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left: tabs + rules list */}
            <div className="flex-1 min-w-0 space-y-6">
              <div className="border-b border-slate-200 dark:border-primary/10 flex items-end">
                <div className="flex gap-8">
                  <button className={tabClass('climate')} onClick={() => setActiveTab('climate')}>Climate</button>
                  <button className={tabClass('lighting')} onClick={() => setActiveTab('lighting')}>Lighting</button>
                  <button className={tabClass('other')} onClick={() => setActiveTab('other')}>Other</button>
                </div>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
                  <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full" />
                  <span className="text-sm font-bold">Loading rules...</span>
                </div>
              )}

              {error && !loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-400">
                  <span className="material-symbols-outlined text-5xl">error</span>
                  <p className="font-bold">{error}</p>
                  <button onClick={() => refetch()} className="text-sm px-4 py-2 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors">Try again</button>
                </div>
              )}

              {!loading && !error && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                  <span className="material-symbols-outlined text-6xl">rule</span>
                  <p className="font-bold text-lg">No rules in this category</p>
                  <button onClick={openNewRule} className="text-sm text-primary hover:underline">Create one</button>
                </div>
              )}

              {!loading && !error && filtered.length > 0 && (
                <div className="space-y-3">
                  {filtered.map(rule => (
                    <RuleCard
                      key={rule.ruleId}
                      rule={rule}
                      onEdit={() => { setEditRule(rule); setFormOpen(true); }}
                      onDelete={() => handleDelete(rule)}
                      onToggle={enabled => handleToggle(rule, enabled)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right: Sunset & Sunrise Rules */}
            <div className="flex-1 min-w-0 space-y-4 lg:pt-1 lg:pl-6 lg:border-l border-t lg:border-t-0 border-slate-200 dark:border-slate-700/60 pt-6">
              <div>
                <h3 className="font-bold">Sunset &amp; Sunrise Rules</h3>
                <p className="text-xs text-slate-400 mt-0.5">Sun-triggered automation</p>
              </div>

              {timeError && !timeLoading && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {timeError}
                </div>
              )}

              {!timeLoading && !timeError && timeRules.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400 border border-dashed border-amber-200 dark:border-amber-500/20 rounded-xl">
                  <span className="material-symbols-outlined text-3xl text-amber-400">wb_twilight</span>
                  <p className="text-xs font-bold">No sunset rules yet</p>
                  <button onClick={openNewRule} className="text-xs text-amber-500 hover:underline">Create one</button>
                </div>
              )}

              <div className="space-y-3">
                {timeRules.map(rule => (
                  <TimeBasedRuleCard
                    key={rule.ruleId}
                    rule={rule}
                    onEdit={() => { setEditTimeRule(rule); setTimeFormOpen(true); }}
                    onDelete={() => handleTimeDelete(rule)}
                    onToggle={enabled => handleTimeToggle(rule, enabled)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>

      {/* Rule type picker */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setPickerOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              className="relative w-full sm:max-w-sm bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              onClick={e => e.stopPropagation()}
              initial={{ y: 48, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 48, opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              </div>
              <div className="px-6 pt-5 pb-2">
                <h2 className="text-lg font-bold">What type of rule?</h2>
                <p className="text-sm text-slate-400 mt-0.5">Choose how this rule gets triggered</p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setPickerOpen(false); setFormOpen(true); }}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-4xl text-primary">sensors</span>
                  <div className="text-center">
                    <p className="font-bold text-base">Sensor Rule</p>
                    <p className="text-xs text-slate-400 mt-0.5">Triggered by a sensor reading</p>
                  </div>
                </button>
                <button
                  onClick={() => { setPickerOpen(false); setTimeFormOpen(true); }}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border border-amber-200 dark:border-amber-500/20 hover:border-amber-400 hover:bg-amber-500/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-4xl text-amber-500">wb_twilight</span>
                  <div className="text-center">
                    <p className="font-bold text-base">Sunset Rule</p>
                    <p className="text-xs text-slate-400 mt-0.5">Triggered by sunset or sunrise</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AutomationFormModal
        open={formOpen}
        rule={editRule}
        onClose={() => setFormOpen(false)}
        onSaved={() => { refetch(); setFormOpen(false); }}
      />

      <TimeBasedRuleFormModal
        open={timeFormOpen}
        rule={editTimeRule}
        onClose={() => setTimeFormOpen(false)}
        onSaved={() => { timeRefetch(); setTimeFormOpen(false); }}
      />
    </>
  );
}
