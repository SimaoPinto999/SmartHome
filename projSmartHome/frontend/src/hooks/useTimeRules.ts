import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import type { TimeBasedRule } from '../types/timeRules';

export function useTimeRules() {
  const { apiFetch } = useApi();
  const [rules, setRules] = useState<TimeBasedRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/time-rules');
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setRules(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load time-based rules');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return { rules, loading, error, refetch: fetchRules };
}
