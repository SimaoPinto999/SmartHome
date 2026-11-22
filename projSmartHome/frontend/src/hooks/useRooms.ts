import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import type { RoomType } from '../types/devices';
import type { RoomWithCount } from '../types/rooms';

export interface CreateRoomBody {
  houseId: number;
  roomName: string;
  roomType: RoomType;
  floor: number;
}

export type UpdateRoomBody = Omit<CreateRoomBody, 'houseId'>;

interface UseRoomsResult {
  rooms: RoomWithCount[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createRoom: (body: CreateRoomBody) => Promise<void>;
  updateRoom: (roomId: number, body: UpdateRoomBody) => Promise<void>;
  deleteRoom: (roomId: number) => Promise<void>;
}

export function useRooms(houseId: number | null): UseRoomsResult {
  const { apiFetch } = useApi();
  const [rooms, setRooms] = useState<RoomWithCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    if (houseId == null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/rooms/house/${houseId}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: RoomWithCount[] = await res.json();
      setRooms(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, houseId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const createRoom = useCallback(async (body: CreateRoomBody) => {
    const res = await apiFetch('/api/rooms', { method: 'POST', body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const created: RoomWithCount = await res.json();
    setRooms(prev => [...prev, created]);
  }, [apiFetch]);

  const updateRoom = useCallback(async (roomId: number, body: UpdateRoomBody) => {
    const res = await apiFetch(`/api/rooms/${roomId}`, { method: 'PUT', body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const updated: RoomWithCount = await res.json();
    setRooms(prev => prev.map(r => r.roomId === roomId ? { ...updated, deviceCount: r.deviceCount } : r));
  }, [apiFetch]);

  const deleteRoom = useCallback(async (roomId: number) => {
    const res = await apiFetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    setRooms(prev => prev.filter(r => r.roomId !== roomId));
  }, [apiFetch]);

  return { rooms, loading, error, refetch: fetchRooms, createRoom, updateRoom, deleteRoom };
}
