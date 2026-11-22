import { useAuth } from 'react-oidc-context';
import { useCallback } from 'react';

// TODO: Put BASE_URL in .env file
const BASE_URL = 'http://localhost:8081';

export function useApi() {
  const auth = useAuth();

  const apiFetch = useCallback(
    async (path: string, options: RequestInit = {}): Promise<Response> => {
      const token = auth.user?.access_token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      console.log(`[useApi] ${options.method ?? 'GET'} ${BASE_URL}${path}`, { headers, body: options.body });
      const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
      res.clone().json()
        .then(data => console.log(`[useApi] ${res.status} ${res.statusText}`, data))
        .catch(() => res.clone().text().then(t => console.log(`[useApi] ${res.status} ${res.statusText}`, t)));
      return res;
    },
    [auth.user]
  );

  return { apiFetch };
}
