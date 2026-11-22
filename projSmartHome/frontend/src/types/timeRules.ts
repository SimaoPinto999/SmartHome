export type ReferencePoint = 'SUNSET' | 'SUNRISE';

export interface TimeBasedRule {
  ruleId: number;
  houseId: number;
  name: string;
  enabled: boolean;
  referencePoint: ReferencePoint;
  offsetMinutes: number;
  targetComponentId: number;
  targetComponentName: string;
  value: string;
  cooldownMinutes: number;
  lastTriggeredAt: string | null;
}

export interface TimeBasedRuleRequest {
  name: string;
  referencePoint: ReferencePoint;
  offsetMinutes: number;
  targetComponentId: number;
  value: string;
  cooldownMinutes: number;
  enabled: boolean;
}
