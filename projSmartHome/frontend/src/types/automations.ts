export type RuleOperator = 'GT' | 'LT' | 'EQ';
export type ConditionType = 'FIXED' | 'EXTERNAL';
export type ActionType = 'MQTT_COMMAND' | 'ALERT';
export type AlertSeverity = 'WARNING' | 'CRITICAL';

export interface RuleConditionDto {
  type: ConditionType;
  threshold?: number | null;
  externalSource?: string | null;
  offsetValue?: number | null;
}

export interface RuleActionDto {
  actionId?: number;
  type: ActionType;
  targetComponentId?: number | null;
  targetComponentName?: string | null;
  value?: string | null;
  severity?: AlertSeverity | null;
  autoOffMinutes?: number | null;
}

export interface AutomationRule {
  ruleId: number;
  houseId: number;
  sensorComponentId: number;
  sensorComponentName: string;
  sensorType: string;
  name: string;
  operator: RuleOperator;
  cooldownMinutes: number;
  lastTriggeredAt: string | null;
  enabled: boolean;
  condition: RuleConditionDto;
  actions: RuleActionDto[];
}

export interface AutomationRuleRequest {
  sensorComponentId: number;
  name: string;
  operator: RuleOperator;
  cooldownMinutes: number;
  enabled: boolean;
  condition: RuleConditionDto;
  actions: RuleActionDto[];
}

export type AlertType = 'AUTOMATION' | 'INTRUSION';

export interface Alert {
  alertId: number;
  ruleId: number;
  ruleName: string;
  message: string;
  severity: AlertSeverity;
  triggeredAt: string;
  acknowledged: boolean;
  alertType: AlertType;
}
