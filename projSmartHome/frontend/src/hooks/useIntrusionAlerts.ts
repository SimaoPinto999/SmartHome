import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from './useApi';
import { useRealtime } from '../context/RealtimeContext';
import type { Alert } from '../types/automations';

export function useIntrusionAlerts() {
  const { apiFetch } = useApi();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const pollingActive = useRef(true);

  const fetchAlerts = useCallback(async () => {
    if (!pollingActive.current) return;
    try {
      const res = await apiFetch('/api/alerts?onlyUnack=true');
      if (res.status === 401 || res.status === 403) {
        pollingActive.current = false;
        return;
      }
      if (!res.ok) return;
      const data: Alert[] = await res.json();
      setAlerts(data.filter(a => a.alertType === 'INTRUSION'));
    } catch {
      // network error — keep polling, will retry on next interval
    }
  }, [apiFetch]);

  const { onAlert } = useRealtime();

  useEffect(() => {
    pollingActive.current = true;
    fetchAlerts();
    return () => { pollingActive.current = false; };
  }, [fetchAlerts]);

  useEffect(() => {
    return onAlert(() => { fetchAlerts(); });
  }, [onAlert, fetchAlerts]);

  const acknowledge = useCallback(async (alertId: number) => {
    const res = await apiFetch(`/api/alerts/${alertId}/acknowledge`, { method: 'PATCH' });
    if (res.ok) setAlerts(prev => prev.filter(a => a.alertId !== alertId));
  }, [apiFetch]);

  return { alerts, acknowledge };
}
