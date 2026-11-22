import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from './useApi';

export interface ActivityLog {
  logId: number;
  houseId: number;
  componentId?: number;
  componentName?: string;
  deviceName?: string;
  roomId?: number;
  roomName?: string;
  eventType: string;
  message: string;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // current page
}

export function useActivityLogs(roomId?: number, eventType?: string, from?: string, to?: string, search?: string, page: number = 0, limit: number = 50) {
  const { apiFetch } = useApi();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);

    try {
      let url = `/api/activity-logs?page=${page}&limit=${limit}`;
      if (roomId) url += `&roomId=${roomId}`;
      if (eventType) url += `&eventType=${encodeURIComponent(eventType)}`;
      if (from) url += `&from=${encodeURIComponent(from)}`;
      if (to) url += `&to=${encodeURIComponent(to)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Failed to fetch activity logs');
      const data: PageResponse<ActivityLog> = await res.json();
      
      setLogs(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, roomId, eventType, from, to, search, page, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, totalPages, totalElements, loading, error, refetch: fetchLogs };
}
