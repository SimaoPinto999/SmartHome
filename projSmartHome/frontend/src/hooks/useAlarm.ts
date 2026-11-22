import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

interface AlarmState {
  houseId: number | null;
  armed: boolean;
  loading: boolean;
  toggling: boolean;
  toggle: () => Promise<void>;
}

export function useAlarm(): AlarmState {
  const { apiFetch } = useApi();
  const [houseId, setHouseId] = useState<number | null>(null);
  const [armed, setArmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    apiFetch('/api/accounts/me')
      .then(res => res.ok ? res.json() : null)
      .then((account: { accountId: number } | null) => {
        if (!account) return null;
        return apiFetch(`/api/houses/account/${account.accountId}`)
          .then(res => res.ok ? res.json() : null);
      })
      .then((houses: { houseId: number; alarmArmed: boolean }[] | null) => {
        if (houses && houses.length > 0) {
          setHouseId(houses[0].houseId);
          setArmed(houses[0].alarmArmed ?? false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiFetch]);

  const toggle = useCallback(async () => {
    if (houseId === null || toggling) return;
    setToggling(true);
    try {
      const res = await apiFetch(`/api/houses/${houseId}/alarm?armed=${!armed}`, { method: 'PATCH' });
      if (res.ok) {
        const updated = await res.json();
        setArmed(updated.alarmArmed ?? !armed);
      }
    } catch {
      // keep current state on error
    } finally {
      setToggling(false);
    }
  }, [apiFetch, houseId, armed, toggling]);

  return { houseId, armed, loading, toggling, toggle };
}
