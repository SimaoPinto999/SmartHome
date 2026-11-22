import { useQuery } from '@tanstack/react-query';
import { useAuth } from 'react-oidc-context';
import { useApi } from './useApi';

export interface House {
  houseId: number;
  houseName: string;
  address: string;
  timezone: string;
}

export function useHouse() {
  const { apiFetch } = useApi();
  const auth = useAuth();
  const token = auth.user?.access_token;

  return useQuery({
    queryKey: ['house'],
    enabled: !!token,
    queryFn: async (): Promise<House | null> => {
      const account = await apiFetch('/api/accounts/me').then(r => (r.ok ? r.json() : null));
      if (!account) return null;
      const houses: House[] | null = await apiFetch(`/api/houses/account/${account.accountId}`)
        .then(r => (r.ok ? r.json() : null));
      return houses && houses.length > 0 ? houses[0] : null;
    },
  });
}
