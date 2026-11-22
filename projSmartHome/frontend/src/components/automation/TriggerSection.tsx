import type { DeviceComponent } from '../../types/devices';
import { isBinarySensor } from '../../types/devices';
import type { FormState, FormAction } from './automationFormReducer';

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none focus:border-primary transition-colors';
const labelClass = 'text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1.5';

interface Props {
  state: FormState;
  sensors: DeviceComponent[];
  dispatch: React.Dispatch<FormAction>;
}

export function TriggerSection({ state, sensors, dispatch }: Props) {
  const set = (field: keyof FormState, value: FormState[keyof FormState]) =>
    dispatch({ type: 'SET', field, value });

  const selectedSensor = sensors.find(s => String(s.componentId) === state.sensorId) ?? null;
  const isBinary = isBinarySensor(selectedSensor?.sensorType ?? null);

  const handleSensorChange = (sensorId: string) => {
    const sensor = sensors.find(s => String(s.componentId) === sensorId) ?? null;
    dispatch({ type: 'SET_SENSOR', sensorId, isBinary: isBinarySensor(sensor?.sensorType ?? null) });
  };

  const unitLabel = selectedSensor ? ` (${selectedSensor.unit.toLowerCase()})` : '';

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Rule Name</label>
        <input
          type="text"
          value={state.name}
          onChange={e => set('name', e.target.value)}
          required
          className={inputClass}
          placeholder="e.g. High Temperature Alert"
        />
      </div>

      <div>
        <label className={labelClass}>Which sensor triggers this rule?</label>
        <select
          value={state.sensorId}
          onChange={e => handleSensorChange(e.target.value)}
          required
          className={inputClass}
        >
          <option value="">Select a sensor...</option>
          {sensors.map(s => (
            <option key={s.componentId} value={s.componentId}>
              {s.componentName} ({s.sensorType})
            </option>
          ))}
        </select>
      </div>

      {isBinary ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Condition</label>
            <div className={`${inputClass} flex items-center text-slate-400`}>
              State is equal to
            </div>
          </div>
          <div>
            <label className={labelClass}>Value</label>
            <select
              value={state.binaryValue}
              onChange={e => set('binaryValue', e.target.value as 'ON' | 'OFF')}
              className={inputClass}
            >
              <option value="ON">ON / Open / Detected</option>
              <option value="OFF">OFF / Closed / Clear</option>
            </select>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Condition</label>
              <select
                value={state.operator}
                onChange={e => set('operator', e.target.value as 'GT' | 'LT')}
                className={inputClass}
              >
                <option value="GT">Reading is above</option>
                <option value="LT">Reading is below</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Wait between triggers (min)</label>
              <input
                type="number"
                min={1}
                value={state.cooldown}
                onChange={e => set('cooldown', Number(e.target.value))}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Threshold type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set('condType', 'FIXED')}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${state.condType === 'FIXED' ? 'bg-primary/10 border-primary/40 text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
              >
                Fixed value
              </button>
              <button
                type="button"
                onClick={() => set('condType', 'EXTERNAL')}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${state.condType === 'EXTERNAL' ? 'bg-primary/10 border-primary/40 text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
              >
                Based on outdoor temp
              </button>
            </div>
          </div>

          {state.condType === 'FIXED' ? (
            <div>
              <label className={labelClass}>
                Trigger when reading is {state.operator === 'GT' ? 'above' : 'below'}{unitLabel}
              </label>
              <input
                type="number"
                step="any"
                value={state.threshold}
                onChange={e => set('threshold', e.target.value)}
                required
                className={inputClass}
                placeholder="e.g. 50"
              />
            </div>
          ) : (
            <div>
              <label className={labelClass}>Offset from outdoor temperature (°C)</label>
              <input
                type="number"
                step="any"
                value={state.offset}
                onChange={e => set('offset', e.target.value)}
                required
                className={inputClass}
                placeholder="e.g. 3"
              />
              <p className="text-xs text-slate-400 mt-1">
                Triggers when sensor reading is {state.operator === 'GT' ? 'above' : 'below'} outdoor temp + offset
              </p>
            </div>
          )}
        </>
      )}

      {isBinary && (
        <div>
          <label className={labelClass}>Wait between triggers (min)</label>
          <input
            type="number"
            min={1}
            value={state.cooldown}
            onChange={e => set('cooldown', Number(e.target.value))}
            required
            className={inputClass}
          />
        </div>
      )}
    </div>
  );
}
