import type { AutomationRule } from '../../types/automations';

export interface CommandEntry {
  targetId: string;
  value: string;
  autoOffMinutes: string;
}

export interface FormState {
  name: string;
  sensorId: string;
  operator: 'GT' | 'LT' | 'EQ';
  cooldown: number;
  condType: 'FIXED' | 'EXTERNAL';
  threshold: string;
  offset: string;
  binaryValue: 'ON' | 'OFF';
  hasCommand: boolean;
  commands: CommandEntry[];
  hasAlert: boolean;
  severity: 'WARNING' | 'CRITICAL';
}

export type FormAction =
  | { type: 'SET'; field: keyof FormState; value: FormState[keyof FormState] }
  | { type: 'SET_SENSOR'; sensorId: string; isBinary: boolean }
  | { type: 'ADD_COMMAND' }
  | { type: 'REMOVE_COMMAND'; index: number }
  | { type: 'UPDATE_COMMAND'; index: number; field: keyof CommandEntry; value: string }
  | { type: 'LOAD_RULE'; rule: AutomationRule }
  | { type: 'RESET' };

export const initialState: FormState = {
  name: '',
  sensorId: '',
  operator: 'GT',
  cooldown: 5,
  condType: 'FIXED',
  threshold: '',
  offset: '',
  binaryValue: 'ON',
  hasCommand: false,
  commands: [{ targetId: '', value: 'ON', autoOffMinutes: '' }],
  hasAlert: true,
  severity: 'WARNING',
};

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET':
      return { ...state, [action.field]: action.value };
    case 'SET_SENSOR':
      return {
        ...state,
        sensorId: action.sensorId,
        operator: action.isBinary ? 'EQ' : 'GT',
        condType: 'FIXED',
        threshold: '',
        binaryValue: 'ON',
      };
    case 'ADD_COMMAND':
      return { ...state, commands: [...state.commands, { targetId: '', value: 'ON', autoOffMinutes: '' }] };
    case 'REMOVE_COMMAND':
      return { ...state, commands: state.commands.filter((_, i) => i !== action.index) };
    case 'UPDATE_COMMAND': {
      const commands = state.commands.map((cmd, i) =>
        i === action.index ? { ...cmd, [action.field]: action.value } : cmd
      );
      return { ...state, commands };
    }
    case 'RESET':
      return initialState;
    case 'LOAD_RULE': {
      const { rule } = action;
      const cmds = rule.actions.filter(a => a.type === 'MQTT_COMMAND');
      const alert = rule.actions.find(a => a.type === 'ALERT');
      const isBinaryOp = rule.operator === 'EQ';
      const thresholdNum = rule.condition?.threshold;
      return {
        name: rule.name,
        sensorId: String(rule.sensorComponentId),
        operator: rule.operator,
        cooldown: rule.cooldownMinutes,
        condType: rule.condition?.type ?? 'FIXED',
        threshold: !isBinaryOp && thresholdNum != null ? String(thresholdNum) : '',
        offset: rule.condition?.offsetValue != null ? String(rule.condition.offsetValue) : '',
        binaryValue: isBinaryOp ? (thresholdNum === 1 ? 'ON' : 'OFF') : 'ON',
        hasCommand: cmds.length > 0,
        commands: cmds.length > 0
          ? cmds.map(c => ({ targetId: c.targetComponentId != null ? String(c.targetComponentId) : '', value: c.value ?? 'ON', autoOffMinutes: c.autoOffMinutes != null ? String(c.autoOffMinutes) : '' }))
          : [{ targetId: '', value: 'ON', autoOffMinutes: '' }],
        hasAlert: !!alert,
        severity: (alert?.severity as 'WARNING' | 'CRITICAL') ?? 'WARNING',
      };
    }
  }
}
