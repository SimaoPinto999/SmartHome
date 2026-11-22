import { useRef, useEffect, type ReactNode } from 'react';
import { useAuth } from 'react-oidc-context';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { oidcConfig } from './oidc.config.ts';
import { ToastProvider } from './context/ToastContext.tsx';
import { RealtimeProviderWithHouse } from './context/RealtimeContext.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000, // dados frescos por 30s — não re-fetch ao mudar de página
    },
  },
});

function AuthAwareQueryProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const prevUserId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentId = auth.user?.profile.sub;
    if (prevUserId.current !== undefined && prevUserId.current !== currentId) {
      queryClient.clear();
    }
    prevUserId.current = currentId;
  }, [auth.user?.profile.sub]);

  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider
      {...oidcConfig}
      automaticSilentRenew={false}
      onSigninCallback={() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthAwareQueryProvider>
          <ToastProvider>
            <RealtimeProviderWithHouse>
              <App />
            </RealtimeProviderWithHouse>
          </ToastProvider>
        </AuthAwareQueryProvider>
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>,
);
