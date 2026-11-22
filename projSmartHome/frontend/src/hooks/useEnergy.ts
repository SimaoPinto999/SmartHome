import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { useRealtime } from '../context/RealtimeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EnergyPrice {
  priceId: number;
  pricePerKwh: number;
  validFrom: string;
}

export interface EnergyDevice {
  componentId: number;
  componentName: string;
  componentType: string;
  sensorType: string | null;
  actuatorType: string | null;
  deviceId: string;
  deviceName: string;
  roomName: string;
  consumptionKwh: number;
  estimatedCost: number;
}

export interface EnergySummary {
  totalKwh: number;
  totalCost: number;
  pricePerKwh: number;
  periodStart: string;
  periodEnd: string;
  devices: EnergyDevice[];
}

export interface EnergyChartPoint {
  timestamp: string;
  value: string;
}

// ─── Period helper ────────────────────────────────────────────────────────────

export type PeriodType = 'today' | 'week' | 'month' | 'custom';

export function getPeriod(type: PeriodType, customStart?: Date, customEnd?: Date): { start: Date; end: Date } {
  const now = new Date();
  switch (type) {
    case 'today': {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      return { start, end: now };
    }
    case 'week': {
      const start = new Date(now); start.setDate(now.getDate() - 7); start.setHours(0, 0, 0, 0);
      return { start, end: now };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: now };
    }
    case 'custom':
      return { start: customStart ?? new Date(), end: customEnd ?? now };
  }
}

function toISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

function periodToInterval(start: Date, end: Date): string {
  const hours = (end.getTime() - start.getTime()) / 3_600_000;
  if (hours <= 24)   return '30m';
  if (hours <= 168)  return '3h';
  return '1d';
}

// ─── useEnergyPrice ───────────────────────────────────────────────────────────

export function useEnergyPrice() {
  const { apiFetch } = useApi();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['energyPrice'],
    queryFn: async () => {
      const res = await apiFetch('/api/energy/price');
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      return res.json() as Promise<EnergyPrice>;
    },
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async (pricePerKwh: number) => {
      const res = await apiFetch('/api/energy/price', {
        method: 'POST',
        body: JSON.stringify({ pricePerKwh }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['energyPrice'] }),
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    updatePrice: mutation.mutateAsync,
    refetch: query.refetch,
  };
}

// ─── useEnergySummary ─────────────────────────────────────────────────────────

export function useEnergySummary(start: Date, end: Date | null) {
  const { apiFetch } = useApi();
  const [data, setData]       = useState<EnergySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const endDate = end ?? new Date();
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/energy/summary?start=${toISO(start)}&end=${toISO(endDate)}`,
      );
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, toISO(start), end != null ? toISO(end) : 'live']); // eslint-disable-line react-hooks/exhaustive-deps

  const { onSensorReading } = useRealtime();
  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = onSensorReading(msg => {
      if (msg.unit !== 'WATTS') return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fetch(), 10_000);
    });
    return () => { if (timer) clearTimeout(timer); unsub(); };
  }, [onSensorReading, fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── useEnergyChart ───────────────────────────────────────────────────────────

export function useEnergyChart(start: Date, end: Date | null) {
  const { apiFetch } = useApi();
  const [data, setData]       = useState<EnergyChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const queryEnd = end ?? new Date();
    const interval = periodToInterval(start, queryEnd);
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/energy/chart?start=${toISO(start)}&end=${toISO(queryEnd)}&interval=${interval}`,
      );
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, toISO(start), end != null ? toISO(end) : 'live']); // eslint-disable-line react-hooks/exhaustive-deps

  const { onSensorReading } = useRealtime();
  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = onSensorReading(msg => {
      if (msg.unit !== 'WATTS') return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fetch(), 10_000);
    });
    return () => { if (timer) clearTimeout(timer); unsub(); };
  }, [onSensorReading, fetch]);

  return { data, loading, error };
}