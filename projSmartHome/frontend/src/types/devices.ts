// Enums

export type DeviceType = 'GATEWAY' | 'CONTROLLER' | 'SENSOR_NODE' | 'ACTUATOR' | 'SECURITY';
export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'ERROR';
export type ComponentType = 'SENSOR' | 'ACTUATOR';
export type SensorType = 'TEMPERATURE' | 'CONTACT' | 'POWER' | 'SMOKE' | 'RAIN' | 'LIGHT' | 'MOTION';
export type ActuatorType = 'LIGHT' | 'MOTOR' | 'VALVE' | 'HVAC';
export type SensorUnit = 'CELSIUS' | 'BINARY' | 'WATTS' | 'PERCENT' | 'MM' | 'LUX' | 'RGB';
export type RoomType = 'LIVING_ROOM' | 'KITCHEN' | 'BEDROOM' | 'OFFICE' | 'GARAGE' | 'OUTSIDE' | 'BATHROOM' | 'HALLWAY';

// Postgres Models

export interface Room {
  roomId: number;
  houseId: number;
  roomName: string;
  roomType: RoomType;
  floor: number;
}

export interface Device {
  deviceId: string;
  roomId: number;
  deviceName: string;
  deviceType: DeviceType;
  status: DeviceStatus;
  room?: Room;
}

export interface DeviceComponent {
  componentId: number;
  deviceId: string;
  componentName: string;
  componentType: ComponentType;
  sensorType: SensorType | null;
  actuatorType: ActuatorType | null;
  unit: SensorUnit;
  mqttTopic: string;
  nominalWatts?: number | null;
}

// InfluxDB / Metrics

export interface MetricPoint {
  timestamp: string;
  value: string;
}

export interface MetricLatest {
  componentId: string;
  value: string;
  timestamp: string;
}

export interface MetricHistory {
  componentId: string;
  points: MetricPoint[];
}

// Sensor kind classification

const BINARY_SENSOR_TYPES: SensorType[] = ['CONTACT', 'MOTION'];
export function isBinarySensor(sensorType: SensorType | null): boolean {
  return sensorType !== null && BINARY_SENSOR_TYPES.includes(sensorType);
}

// Signal type resolution

export type SignalType = 'temperature' | 'toggle' | 'rgb' | 'energy' | 'percent' | 'rain' | 'lux' | 'thermostat';

export function resolveSignalType(component: DeviceComponent): SignalType {
  if (component.componentType === 'ACTUATOR') {
    if (component.actuatorType === 'HVAC') return 'thermostat';
    if (component.actuatorType === 'LIGHT' && component.unit === 'RGB') return 'rgb';
    if (component.actuatorType === 'LIGHT' && component.unit === 'PERCENT') return 'percent';
    return 'toggle';
  }
  switch (component.sensorType) {
    case 'TEMPERATURE': return 'temperature';
    case 'POWER':       return 'energy';
    case 'SMOKE':       return 'percent';
    case 'RAIN':        return 'rain';
    case 'LIGHT':       return 'lux';
    case 'CONTACT':     return 'toggle';
    case 'MOTION':      return 'toggle';
    default:            return 'toggle';
  }
}

// Parsed metric value

export interface ParsedMetric {
  raw: string;
  numeric?: number;
  isOn?: boolean;
  rgb?: string;
  unit: string;
  label: string;
}

export function parseMetricValue(raw: string, signal: SignalType): ParsedMetric {
  switch (signal) {
    case 'thermostat': {
      if (!raw || raw.toUpperCase() === 'OFF') {
        return { raw, isOn: false, unit: '°C', label: 'Off' };
      }
      const n = parseFloat(raw);
      return { raw, numeric: n, isOn: true, unit: '°C', label: `${n.toFixed(1)} °C` };
    }
    case 'temperature': {
      const n = parseFloat(raw);
      return { raw, numeric: n, unit: '°C', label: `${n.toFixed(1)} °C` };
    }
    case 'energy': {
      const n = parseFloat(raw);
      return { raw, numeric: n, unit: 'W', label: `${n} W` };
    }
    case 'percent': {
      const n = parseFloat(raw);
      return { raw, numeric: n, unit: '%', label: `${n.toFixed(1)} %` };
    }
    case 'rain': {
      const n = parseFloat(raw);
      return { raw, numeric: n, unit: 'mm', label: `${n.toFixed(1)} mm` };
    }
    case 'lux': {
      const n = parseFloat(raw);
      return { raw, numeric: n, unit: 'lux', label: `${n} lux` };
    }
    case 'toggle': {
      const isOn = raw.toUpperCase() === 'ON' || raw === '1' || raw === 'true';
      return { raw, isOn, unit: '', label: isOn ? 'ON' : 'OFF' };
    }
    case 'rgb': {
      return { raw, rgb: raw, unit: 'RGB', label: raw };
    }
  }
}
