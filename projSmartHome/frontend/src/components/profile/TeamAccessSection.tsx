import { useState } from 'react';
import type { ActiveProfile } from '../../hooks/useProfile';
import type { Device } from '../../types/devices';
import type { PermissionRecord } from '../../types/permissions';
import { ROLES } from '../../types/role';
import DevicePermissionsModal from './DevicePermissionsModal';

interface RoomWithDevices {
  room: NonNullable<Device['room']>;
  devices: Device[];
}

interface Props {
  teamProfiles: ActiveProfile[];
  teamRoles: Record<number, string>;
  teamLoading: Record<number, boolean>;
  teamErrors: Record<number, string | null>;
  roomsWithDevices: RoomWithDevices[];
  profilePermissions: Record<number, PermissionRecord[]>;
  onRoleChange: (profileId: number, role: string) => void;
  onApplyRole: (p: ActiveProfile) => void;
  onToggleRoomAccess: (profileId: number, roomId: number, existing: PermissionRecord | undefined) => void;
  onToggleDeviceAccess: (profileId: number, deviceId: string, existing: PermissionRecord | undefined) => void;
}

export default function TeamAccessSection({
  teamProfiles,
  teamRoles,
  teamLoading,
  teamErrors,
  roomsWithDevices,
  profilePermissions,
  onRoleChange,
  onApplyRole,
  onToggleRoomAccess,
  onToggleDeviceAccess,
}: Props) {
  const [modalProfileId, setModalProfileId] = useState<number | null>(null);

  if (teamProfiles.length === 0) return null;

  const modalProfile = modalProfileId != null
    ? teamProfiles.find(p => p.profileId === modalProfileId) ?? null
    : null;

  return (
    <>
      <section className="bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">manage_accounts</span>
          Team Access
        </h4>
        <div className="space-y-3">
          {teamProfiles.map(p => {
            const currentRole = teamRoles[p.profileId] ?? p.role;
            const isLimited = currentRole === ROLES.GUEST || currentRole === ROLES.RESTRICTED;
            return (
              <div key={p.profileId} className="bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-slate-400">{p.role}</p>
                  </div>
                  <select
                    value={currentRole}
                    onChange={e => onRoleChange(p.profileId, e.target.value)}
                    disabled={teamLoading[p.profileId]}
                    className="bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-900 dark:text-white transition-colors disabled:opacity-50"
                  >
                    <option value="ADMIN">Administrator</option>
                    <option value="GUEST">Guest</option>
                    <option value="RESTRICTED">Restricted</option>
                  </select>
                  <button
                    onClick={() => onApplyRole(p)}
                    disabled={teamLoading[p.profileId] || currentRole === p.role}
                    className="px-4 py-1.5 rounded-lg bg-primary text-background-dark text-xs font-black uppercase tracking-tight disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {teamLoading[p.profileId] ? '...' : 'Apply'}
                  </button>
                  {isLimited && (
                    <button
                      onClick={() => setModalProfileId(p.profileId)}
                      title="Manage device access"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">devices</span>
                    </button>
                  )}
                </div>
                {teamErrors[p.profileId] && (
                  <p className="px-4 pb-2 text-xs text-red-400">{teamErrors[p.profileId]}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {modalProfile && (
        <DevicePermissionsModal
          profile={modalProfile}
          roomsWithDevices={roomsWithDevices}
          permissions={profilePermissions[modalProfile.profileId] ?? []}
          onToggleRoomAccess={onToggleRoomAccess}
          onToggleDeviceAccess={onToggleDeviceAccess}
          onClose={() => setModalProfileId(null)}
        />
      )}
    </>
  );
}
