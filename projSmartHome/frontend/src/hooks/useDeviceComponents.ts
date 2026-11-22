import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import type { DeviceComponent } from '../types/devices';

interface UseDeviceComponentsResult {
  components: DeviceComponent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createComponent: (body: Partial<DeviceComponent>) => Promise<void>;
  updateComponent: (componentId: number, body: Partial<DeviceComponent>) => Promise<void>;
  deleteComponent: (componentId: number) => Promise<void>;
  sendCommand: (componentId: number, value: string) => Promise<void>;
}

export function useDeviceComponents(deviceId: string | null): UseDeviceComponentsResult {
  const { apiFetch } = useApi();
  const [components, setComponents] = useState<DeviceComponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComponents = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/device-components/device/${deviceId}`);
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data: DeviceComponent[] = await res.json();
      setComponents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, deviceId]);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  const updateComponent = useCallback(async (
    componentId: number,
    body: Partial<DeviceComponent>,
  ) => {
    const res = await apiFetch(`/api/device-components/${componentId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const updated: DeviceComponent = await res.json();
    setComponents(prev => prev.map(c => c.componentId === componentId ? updated : c));
  }, [apiFetch]);

  const createComponent = useCallback(async (body: Partial<DeviceComponent>) => {
    const res = await apiFetch('/api/device-components', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const created: DeviceComponent = await res.json();
    setComponents(prev => [...prev, created]);
  }, [apiFetch]);

  const deleteComponent = useCallback(async (componentId: number) => {
    const res = await apiFetch(`/api/device-components/${componentId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    setComponents(prev => prev.filter(c => c.componentId !== componentId));
  }, [apiFetch]);

  const sendCommand = useCallback(async (componentId: number, value: string) => {
    const res = await apiFetch(`/api/metrics/${componentId}/command`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
  }, [apiFetch]);

  return { components, loading, error, refetch: fetchComponents, createComponent, updateComponent, deleteComponent, sendCommand };
}