import React from 'react';
import type { DeviceComponent } from '../../types/devices';
import type { FormState, FormAction } from './automationFormReducer';

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none focus:border-primary transition-colors';
const labelClass = 'text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1.5';

interface Props {
  state: FormState;
  actuators: DeviceComponent[];
  dispatch: React.Dispatch<FormAction>;
}

export function ActionsSection({ state, actuators, dispatch }: Props) {
  const set = (field: keyof FormState, value: FormState[keyof FormState]) =>
    dispatch({ type: 'SET', field, value });

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
        What should happen when this rule triggers?
      </p>

      {/* Alert action */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={state.hasAlert}
          onChange={e => set('hasAlert', e.target.checked)}
          className="rounded"
        />
        <span className="text-sm font-bold">Generate an alert notification</span>
      </label>
      {state.hasAlert && (
        <div className="ml-6">
          <label className={labelClass}>Alert severity</label>
          <select
            value={state.severity}
            onChange={e => set('severity', e.target.value as 'WARNING' | 'CRITICAL')}
            className={inputClass}
          >
            <option value="WARNING">Warning — something needs attention</option>
            <option value="CRITICAL">Critical — immediate action required</option>
          </select>
        </div>
      )}

      {/* Device command action */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={state.hasCommand}
          onChange={e => set('hasCommand', e.target.checked)}
          className="rounded"
        />
        <span className="text-sm font-bold">Send a command to device(s)</span>
      </label>

      {state.hasCommand && (
        <div className="ml-6 space-y-3">
          {state.commands.map((cmd, i) => (
            <div key={i} className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Device {i + 1}</span>
                {state.commands.length > 1 && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'REMOVE_COMMAND', index: i })}
                    className="text-xs text-red-400 hover:text-red-500 font-bold"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div>
                <label className={labelClass}>Which device?</label>
                <select
                  value={cmd.targetId}
                  onChange={e => dispatch({ type: 'UPDATE_COMMAND', index: i, field: 'targetId', value: e.target.value })}
                  required={state.hasCommand}
                  className={inputClass}
                >
                  <option value="">Select a device...</option>
                  {actuators.map(a => (
                    <option key={a.componentId} value={a.componentId}>
                      {a.componentName} ({a.actuatorType})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Command to send</label>
                {(() => {
                  const selected = actuators.find(a => String(a.componentId) === cmd.targetId);
                  const isHvac = selected?.actuatorType === 'HVAC';
                  const isDimmer = selected?.actuatorType === 'LIGHT' && selected?.unit === 'PERCENT';
                  if (isDimmer) {
                    return (
                      <div className="space-y-1">
                        <input
                          type="range" min={0} max={100} step={5}
                          value={cmd.value === '' ? 100 : Number(cmd.value)}
                          onChange={e => dispatch({ type: 'UPDATE_COMMAND', index: i, field: 'value', value: e.target.value })}
                          className="w-full accent-amber-500"
                        />
                        <p className="text-[11px] text-slate-400 text-right">{cmd.value === '' ? 100 : cmd.value}% brightness</p>
                      </div>
                    );
                  }
                  if (isHvac) {
                    const isOff = cmd.value.toUpperCase() === 'OFF';
                    return (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => dispatch({ type: 'UPDATE_COMMAND', index: i, field: 'value', value: isOff ? '21.0' : 'OFF' })}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                              isOff
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-slate-600'
                                : 'bg-primary/10 text-primary border-primary/30'
                            }`}
                          >
                            {isOff ? 'OFF' : 'ON'}
                          </button>
                          <input
                            type="number"
                            min={10} max={30} step={0.5}
                            value={isOff ? '' : cmd.value}
                            disabled={isOff}
                            onChange={e => dispatch({ type: 'UPDATE_COMMAND', index: i, field: 'value', value: e.target.value })}
                            required={state.hasCommand && !isOff}
                            className={`${inputClass} flex-1 disabled:opacity-40`}
                            placeholder="Setpoint °C (10–30)"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {isOff ? 'Vai desligar o termostato.' : `Vai ligar o termostato com setpoint ${cmd.value} °C.`}
                        </p>
                      </div>
                    );
                  }
                  const isOnCommand = cmd.value.toUpperCase() === 'ON';
                  return (
                    <>
                      <input
                        type="text"
                        value={cmd.value}
                        onChange={e => dispatch({ type: 'UPDATE_COMMAND', index: i, field: 'value', value: e.target.value })}
                        required={state.hasCommand}
                        className={inputClass}
                        placeholder="e.g. ON, OFF, OPEN, CLOSE"
                      />
                      {isOnCommand && (
                        <div className="mt-2">
                          <label className={labelClass}>Auto-off after (minutes, optional)</label>
                          <input
                            type="number"
                            min={1}
                            value={cmd.autoOffMinutes}
                            onChange={e => dispatch({ type: 'UPDATE_COMMAND', index: i, field: 'autoOffMinutes', value: e.target.value })}
                            className={inputClass}
                            placeholder="e.g. 5"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">
                            If set, the device will automatically turn OFF after this many minutes.
                          </p>
                          {cmd.autoOffMinutes && Number(cmd.autoOffMinutes) <= state.cooldown && (
                            <p className="text-[11px] text-amber-500 mt-1">
                              Auto-off should be greater than the rule cooldown ({state.cooldown} min), otherwise the device may turn OFF while the trigger is still active.
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => dispatch({ type: 'ADD_COMMAND' })}
            className="w-full py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-400 hover:border-primary hover:text-primary transition-colors"
          >
            + Add another device
          </button>
        </div>
      )}
    </div>
  );
}
