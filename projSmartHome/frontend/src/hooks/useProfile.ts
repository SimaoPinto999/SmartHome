import { useLocation } from 'react-router-dom';
import type { Role } from '../types/role';

export interface ActiveProfile {
  profileId: number;
  accountId: number;
  firstName: string;
  lastName: string;
  role: Role;
}

export function useProfile(): ActiveProfile | null {
  const location = useLocation();
  const stateProfile = (location.state as { profile?: ActiveProfile } | null)?.profile;
  if (stateProfile) return stateProfile;

  const stored = sessionStorage.getItem('activeProfile');
  if (stored) {
    try { return JSON.parse(stored) as ActiveProfile; } catch { /* ignore */ }
  }
  return null;
}
