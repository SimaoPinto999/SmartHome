export interface PermissionRecord {
  permissionId: number;
  profileId: number;
  deviceId: string | null;
  roomId: number | null;
  permissionLevel: number;
}
