import { createContext, useContext, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuth } from 'react-oidc-context';
import { useHouse } from '../hooks/useHouse';

export interface SensorReadingMessage {
  componentId: number;
  value: string;
  unit: string;
  measurement: string;
  timestamp: string;
}

type SensorHandler = (msg: SensorReadingMessage) => void;
type AlertHandler = (msg: unknown) => void;

interface RealtimeContextValue {
  onSensorReading: (handler: SensorHandler) => () => void;
  onAlert: (handler: AlertHandler) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

const WS_URL = 'ws://localhost:8081/ws';

export function RealtimeProvider({ houseId, children }: { houseId: number | null; children: ReactNode }) {
  const auth = useAuth();
  const token = auth.user?.access_token;
  const sensorHandlers = useRef<Set<SensorHandler>>(new Set());
  const alertHandlers = useRef<Set<AlertHandler>>(new Set());

  useEffect(() => {
    if (!token || houseId == null) return;

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/houses/${houseId}/sensors`, frame => {
          const msg = JSON.parse(frame.body) as SensorReadingMessage;
          sensorHandlers.current.forEach(h => h(msg));
        });
        client.subscribe(`/topic/houses/${houseId}/alerts`, frame => {
          const msg = JSON.parse(frame.body);
          alertHandlers.current.forEach(h => h(msg));
        });
      },
    });

    client.activate();
    return () => { client.deactivate(); };
  }, [token, houseId]);

  const onSensorReading = useCallback((handler: SensorHandler) => {
    sensorHandlers.current.add(handler);
    return () => { sensorHandlers.current.delete(handler); };
  }, []);

  const onAlert = useCallback((handler: AlertHandler) => {
    alertHandlers.current.add(handler);
    return () => { alertHandlers.current.delete(handler); };
  }, []);

  return (
    <RealtimeContext.Provider value={{ onSensorReading, onAlert }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function RealtimeProviderWithHouse({ children }: { children: ReactNode }) {
  const { data: house } = useHouse();
  return <RealtimeProvider houseId={house?.houseId ?? null}>{children}</RealtimeProvider>;
}

export function useRealtime(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    return { onSensorReading: () => () => {}, onAlert: () => () => {} };
  }
  return ctx;
}
