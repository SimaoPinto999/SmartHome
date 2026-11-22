import type { ActiveProfile } from '../../hooks/useProfile';
import type { Device } from '../../types/devices';
import type { PermissionRecord } from '../../types/permissions';

interface RoomWithDevices {
  room: NonNullable<Device['room']>;
  devices: Device[];
}

interface Props {
  profile: ActiveProfile;
  roomsWithDevices: RoomWithDevices[];
  permissions: PermissionRecord[];
  onToggleRoomAccess: (profileId: number, roomId: number, existing: PermissionRecord | undefined) => void;
  onToggleDeviceAccess: (profileId: number, deviceId: string, existing: PermissionRecord | undefined) => void;
  onClose: () => void;
}

export default function DevicePermissionsModal({
  profile,
  roomsWithDevices,
  permissions,
  onToggleRoomAccess,
  onToggleDeviceAccess,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/10 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="font-bold text-base">{profile.firstName} {profile.lastName}</h3>
            <p className="text-xs text-slate-400">Device & Room Access</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-4 space-y-4">
          {roomsWithDevices.length === 0 && (
            <p className="text-sm text-slate-400">No devices found.</p>
          )}
          {roomsWithDevices.map(({ room, devices: roomDevices }) => {
            const roomPerm = permissions.find(pm => pm.deviceId == null && pm.roomId === room.roomId);
            const hasRoom = roomPerm != null;
            return (
              <div key={room.roomId}>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm font-bold">{room.roomName}</span>
                  <button
                    onClick={() => onToggleRoomAccess(profile.profileId, room.roomId, roomPerm)}
                    className={`w-12 h-6 rounded-full flex items-center transition-colors ${hasRoom ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${hasRoom ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
                {!hasRoom && (
                  <div className="ml-4 mt-1 space-y-1">
                    {roomDevices.map(device => {
                      const devPerm = permissions.find(pm => pm.deviceId === device.deviceId);
                      const hasDev = devPerm != null;
                      return (
                        <div key={device.deviceId} className="flex items-center justify-between py-0.5">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{device.deviceName}</span>
                          <button
                            onClick={() => onToggleDeviceAccess(profile.profileId, device.deviceId, devPerm)}
                            className={`w-10 h-5 rounded-full flex items-center transition-colors ${hasDev ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                          >
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${hasDev ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
