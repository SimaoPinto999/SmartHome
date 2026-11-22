import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

export function useAutomations() {
  const { apiFetch } = useApi();

  return useQuery({
    queryKey: ['automations'],
    queryFn: async () => {
       const response = await apiFetch('/api/automations');
       if (!response.ok) {
         throw new Error(`Failed to fetch automations: ${response.status}`);
       }
       return response.json();
     },
  });
}
