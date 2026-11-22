import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import type { Device } from '../types/devices';

interface UseDevicesResult {
  devices: Device[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDevices(): UseDevicesResult {
  const { apiFetch } = useApi();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/devices');
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data: Device[] = await res.json();
      setDevices(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return { devices, loading, error, refetch: fetchDevices };
}
