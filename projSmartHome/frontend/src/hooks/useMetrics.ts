import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from './useApi';
import type { MetricLatest, MetricHistory } from '../types/devices';
import { useRealtime, type SensorReadingMessage } from '../context/RealtimeContext';

// ─── Latest value ─────────────────────────────────────────────────────────────

interface UseLatestMetricResult {
  data: MetricLatest | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLatestMetric(componentId: number | null): UseLatestMetricResult {
  const { apiFetch } = useApi();
  const [data, setData]       = useState<MetricLatest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchLatest = useCallback(async () => {
    if (componentId === null) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/metrics/${componentId}/latest`);
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const json: MetricLatest = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, componentId]);

  const { onSensorReading } = useRealtime();

  useEffect(() => {
    if (componentId === null) return;
    fetchLatest(); // initial value
  }, [fetchLatest, componentId]);

  useEffect(() => {
    if (componentId === null) return;
    return onSensorReading((msg: SensorReadingMessage) => {
      if (msg.componentId === componentId) {
        setData({
          componentId: String(msg.componentId),
          value: msg.value,
          timestamp: msg.timestamp,
        });
      }
    });
  }, [componentId, onSensorReading]);

  const refresh = useCallback(() => {
    fetchLatest();
  }, [fetchLatest]);

  return { data, loading, error, refresh };
}

// ─── History ──────────────────────────────────────────────────────────────────

export type HistoryRange    = '15m' | '1h' | '6h' | '24h';
export type HistoryInterval = '30s' | '1m' | '5m' | '15m' | 'raw';

const RANGE_TO_INTERVAL: Record<HistoryRange, string> = {
  '15m': '30s',
  '1h':  '1m',
  '6h':  '5m',
  '24h': '15m',
};

interface UseMetricHistoryResult {
  data: MetricHistory | null;
  loading: boolean;
  error: string | null;
  range: HistoryRange;
  setRange: (r: HistoryRange) => void;
}

export function useMetricHistory(
  componentId: number | null,
  isToggle: boolean = false,
): UseMetricHistoryResult {
  const { apiFetch } = useApi();
  const [data, setData]       = useState<MetricHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [range, setRange]     = useState<HistoryRange>('15m');
  const rangeRef              = useRef<HistoryRange>(range);
  const isToggleRef           = useRef<boolean>(isToggle);

  useEffect(() => { rangeRef.current = range; }, [range]);
  useEffect(() => { isToggleRef.current = isToggle; }, [isToggle]);

  const fetchHistory = useCallback(async () => {
    if (componentId === null) return;
    setLoading(true);
    try {
      const currentRange    = rangeRef.current;
      // Toggle signals: send interval=raw so backend skips aggregateWindow
      // and returns every raw event (ON/OFF transitions).
      const currentInterval = isToggleRef.current ? 'raw' : RANGE_TO_INTERVAL[currentRange];
      const res = await apiFetch(
        `/api/metrics/${componentId}/history?range=${currentRange}&interval=${currentInterval}`,
      );
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const json: MetricHistory = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, componentId]);

  const { onSensorReading } = useRealtime();

  // On mount / componentId change — initial load
  useEffect(() => {
    if (componentId === null) return;
    fetchHistory();
  }, [fetchHistory, componentId]);

  // Append new readings straight from the WS message — no refetch
  useEffect(() => {
    if (componentId === null) return;
    return onSensorReading(msg => {
      if (msg.componentId !== componentId) return;
      setData(prev => {
        if (!prev) return prev;
        const points = [...prev.points, { timestamp: msg.timestamp, value: msg.value }];
        return { ...prev, points: points.length > 400 ? points.slice(-400) : points };
      });
    });
  }, [componentId, onSensorReading]);

  // When range changes — fetch immediately
  useEffect(() => {
    if (componentId === null) return;
    fetchHistory();
  }, [range]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, range, setRange };
}