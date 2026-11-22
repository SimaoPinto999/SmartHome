import { useAuth } from 'react-oidc-context';

export default function Login() {
  const auth = useAuth();

  const handleLogin = () => {
    auth.signinRedirect();
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      {/* Subtle Background Layer */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background-dark via-background-dark/95 to-primary/10"></div>
        <div 
          className="w-full h-full opacity-20 bg-center bg-no-repeat bg-cover" 
          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBl0_FshePXHsTQYi9BycOVKIh0L-JaIPGc2EZw_IjNb0ZzbbyUh440mtCI3BwFGcLxVcw8ImVeI0CBtD_esU88SNZtutss7UrVotPb-kdr8_O3NQp5aWp49dllTl3gXPIsHZQg-pc6dTPxikIXSH1b5SvHdT1mul4k1bCHWCmT8WRo9BuMylud-01NYOGnjk4jLjtc3WYeoZHyhpub6Fbtx2OTQqf_QxMKcEzP1UixL19hWGEpoGB3gbUrXEDo6fI9CeKl0d5kN71F")' }}
        ></div>
      </div>
      
      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-[480px] px-6 py-12">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 mb-2">Welcome Back</h1>
          <p className="text-slate-400">Secure access to your smart ecosystem</p>
        </div>
        
        {/* Login Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-xl p-8 shadow-2xl space-y-6">
          
          <div className="text-center">
            <p className="text-slate-400 text-sm">
              Sign in with your SmartHome account to access your dashboard and devices.
            </p>
          </div>

          {/* Primary SSO Button */}
          <button
            onClick={handleLogin}
            className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">lock_open</span>
            <span>Sign In with SmartHome SSO</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>

          {/* Divider */}
          <div className="relative py-2 flex items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-xs text-slate-500 uppercase tracking-widest">secured by</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Authentik Badge */}
          <div className="flex items-center justify-center gap-3 text-slate-500 text-sm">
            <span className="material-symbols-outlined text-green-500">verified_user</span>
            <span>Authentik Identity Provider</span>
          </div>
        </div>
      </div>
    </div>
  );
}
