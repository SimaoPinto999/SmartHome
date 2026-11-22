import { ROLES } from '../types/role';
import type { Role } from '../types/role';

export function roleToAccessLevel(role?: Role): string {
  if (role === ROLES.ADMIN) return 'Administrator (Full System Control)';
  if (role === ROLES.GUEST) return 'Guest (Temporary Limited Access)';
  if (role === ROLES.RESTRICTED) return 'Restricted (Limited Access)';
  return 'Standard User (Device Control Only)';
}

export function accessLevelToRole(accessLevel: string): Role {
  if (accessLevel === 'Administrator (Full System Control)') return ROLES.ADMIN;
  if (accessLevel === 'Guest (Temporary Limited Access)') return ROLES.GUEST;
  if (accessLevel === 'Restricted (Limited Access)') return ROLES.RESTRICTED;
  return ROLES.GUEST;
}
