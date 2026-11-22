import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from './useApi';
import { useToast } from '../context/ToastContext';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from 'react-oidc-context';
import type { Alert } from '../types/automations';

export function useAlerts() {
  const { apiFetch } = useApi();
  const { showToast } = useToast();
  const auth = useAuth();
  const storageKey = `alertSeenIds_${auth.user?.profile.sub ?? 'anonymous'}`;
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const seenIds = useRef<Set<number>>(
    new Set(JSON.parse(sessionStorage.getItem(storageKey) ?? '[]') as number[])
  );

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await apiFetch('/api/alerts?onlyUnack=true');
      if (!res.ok) return;
      const data: Alert[] = await res.json();

      data.forEach(alert => {
        if (!seenIds.current.has(alert.alertId)) {
          seenIds.current.add(alert.alertId);
          sessionStorage.setItem(storageKey, JSON.stringify([...seenIds.current]));
          const type = alert.severity === 'CRITICAL' ? 'error' : 'warning';
          showToast(`${alert.ruleName}: ${alert.message}`, type);
        }
      });

      setAlerts(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [apiFetch, showToast]);

  const { onAlert } = useRealtime();

  useEffect(() => {
    fetchAlerts(); // initial load
  }, [fetchAlerts]);

  useEffect(() => {
    return onAlert(() => { fetchAlerts(); });
  }, [onAlert, fetchAlerts]);

  const acknowledge = useCallback(async (alertId: number) => {
    const res = await apiFetch(`/api/alerts/${alertId}/acknowledge`, { method: 'PATCH' });
    if (res.ok) {
      seenIds.current.delete(alertId);
      sessionStorage.setItem(storageKey, JSON.stringify([...seenIds.current]));
      setAlerts(prev => prev.filter(a => a.alertId !== alertId));
      window.dispatchEvent(new CustomEvent('smarthome:alerts-changed'));
    }
  }, [apiFetch]);

  const acknowledgeAll = useCallback(async () => {
    const res = await apiFetch('/api/alerts/acknowledge-all', { method: 'PATCH' });
    if (res.ok) {
      seenIds.current.clear();
      sessionStorage.setItem(storageKey, '[]');
      setAlerts([]);
      window.dispatchEvent(new CustomEvent('smarthome:alerts-changed'));
    }
  }, [apiFetch]);

  return { alerts, loading, acknowledge, acknowledgeAll, refetch: fetchAlerts };
}
