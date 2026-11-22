import { useState, useEffect, useMemo } from 'react';
import type { ActiveProfile } from './useProfile';
import type { Device } from '../types/devices';
import type { PermissionRecord } from '../types/permissions';
import { ROLES } from '../types/role';
import { useApi } from './useApi';
import { useToast } from '../context/ToastContext';

export function useTeamAccess(profile: ActiveProfile | null) {
  const { apiFetch } = useApi();
  const { showToast } = useToast();

  const [teamProfiles, setTeamProfiles] = useState<ActiveProfile[]>([]);
  const [teamRoles, setTeamRoles] = useState<Record<number, string>>({});
  const [teamLoading, setTeamLoading] = useState<Record<number, boolean>>({});
  const [teamErrors, setTeamErrors] = useState<Record<number, string | null>>({});
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [profilePermissions, setProfilePermissions] = useState<Record<number, PermissionRecord[]>>({});

  useEffect(() => {
    if (profile?.role !== ROLES.ADMIN || !profile.accountId) return;
    apiFetch(`/api/profiles/account/${profile.accountId}`)
      .then(res => res.json())
      .then((data: ActiveProfile[]) => {
        const others = data
          .filter(p => p.profileId !== profile.profileId)
          .sort((a, b) => a.profileId - b.profileId);
        setTeamProfiles(others);
        setTeamRoles(Object.fromEntries(others.map(p => [p.profileId, p.role])));
        others.filter(p => p.role !== ROLES.ADMIN).forEach(p => {
          apiFetch(`/api/permissions/profile/${p.profileId}`)
            .then(r => r.json())
            .then((perms: PermissionRecord[]) =>
              setProfilePermissions(prev => ({ ...prev, [p.profileId]: perms }))
            )
            .catch(() => {});
        });
      })
      .catch(() => {});
    apiFetch('/api/devices')
      .then(res => res.json())
      .then((data: Device[]) => setAllDevices(data))
      .catch(() => {});
  }, [profile?.accountId, profile?.profileId, profile?.role, apiFetch]);

  const roomsWithDevices = useMemo(() => {
    const map = new Map<number, { room: NonNullable<Device['room']>; devices: Device[] }>();
    for (const d of allDevices) {
      if (!d.room) continue;
      if (!map.has(d.room.roomId)) map.set(d.room.roomId, { room: d.room, devices: [] });
      map.get(d.room.roomId)!.devices.push(d);
    }
    return Array.from(map.values()).sort((a, b) => a.room.roomId - b.room.roomId);
  }, [allDevices]);

  const handleApplyRole = async (p: ActiveProfile) => {
    const newRole = teamRoles[p.profileId];
    setTeamLoading(prev => ({ ...prev, [p.profileId]: true }));
    setTeamErrors(prev => ({ ...prev, [p.profileId]: null }));
    try {
      const res = await apiFetch(`/api/profiles/${p.profileId}`, {
        method: 'PUT',
        body: JSON.stringify({ accountId: p.accountId, firstName: p.firstName, lastName: p.lastName, role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setTeamErrors(prev => ({ ...prev, [p.profileId]: err.message ?? 'Failed to update.' }));
      } else {
        showToast(`${p.firstName}'s role updated to ${teamRoles[p.profileId]}.`, 'success');
        setTeamErrors(prev => ({ ...prev, [p.profileId]: null }));
      }
    } catch {
      setTeamErrors(prev => ({ ...prev, [p.profileId]: 'Network error.' }));
    } finally {
      setTeamLoading(prev => ({ ...prev, [p.profileId]: false }));
    }
  };

  const handleToggleRoomAccess = async (profileId: number, roomId: number, existing: PermissionRecord | undefined) => {
    if (existing) {
      const res = await apiFetch(`/api/permissions/${existing.permissionId}`, { method: 'DELETE' });
      if (res.ok) setProfilePermissions(prev => ({ ...prev, [profileId]: (prev[profileId] ?? []).filter(p => p.permissionId !== existing.permissionId) }));
    } else {
      const res = await apiFetch('/api/permissions', { method: 'POST', body: JSON.stringify({ profileId, roomId, permissionLevel: 1 }) });
      if (res.ok) {
        const created: PermissionRecord = await res.json();
        setProfilePermissions(prev => ({ ...prev, [profileId]: [...(prev[profileId] ?? []), created] }));
      }
    }
  };

  const handleToggleDeviceAccess = async (profileId: number, deviceId: string, existing: PermissionRecord | undefined) => {
    if (existing) {
      const res = await apiFetch(`/api/permissions/${existing.permissionId}`, { method: 'DELETE' });
      if (res.ok) setProfilePermissions(prev => ({ ...prev, [profileId]: (prev[profileId] ?? []).filter(p => p.permissionId !== existing.permissionId) }));
    } else {
      const res = await apiFetch('/api/permissions', { method: 'POST', body: JSON.stringify({ profileId, deviceId, permissionLevel: 1 }) });
      if (res.ok) {
        const created: PermissionRecord = await res.json();
        setProfilePermissions(prev => ({ ...prev, [profileId]: [...(prev[profileId] ?? []), created] }));
      }
    }
  };

  return {
    teamProfiles,
    teamRoles,
    setTeamRoles,
    teamLoading,
    teamErrors,
    roomsWithDevices,
    profilePermissions,
    handleApplyRole,
    handleToggleRoomAccess,
    handleToggleDeviceAccess,
  };
}
