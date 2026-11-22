import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';

export default function OidcCallback() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      navigate('/profile-selection', { replace: true });
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);

  if (auth.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark">
        <div className="text-center">
          <span className="material-symbols-outlined text-red-400 text-5xl">error</span>
          <p className="text-slate-300 mt-4">Authentication error: {auth.error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark">
      <div className="flex flex-col items-center gap-4">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">autorenew</span>
        <p className="text-slate-400 text-sm">Completing sign in...</p>
      </div>
    </div>
  );
}
