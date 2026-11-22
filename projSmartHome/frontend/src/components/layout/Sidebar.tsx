import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useDevices } from '../../hooks/useDevices';
import { useApi } from '../../hooks/useApi';
import { useRealtime } from '../../context/RealtimeContext';
import { ROLES } from '../../types/role';

function HomeStatus() {
  const { devices, loading, refetch: refetchDevices } = useDevices();
  const { apiFetch } = useApi();
  const { onAlert } = useRealtime();
  const [alertCount, setAlertCount] = useState(0);

  const fetchAlerts = useCallback(() => {
    apiFetch('/api/alerts?onlyUnack=true')
      .then(r => r.ok ? r.json() : [])
      .then((data: { alertId: number }[]) => setAlertCount(data.length))
      .catch(() => {});
  }, [apiFetch]);

  // initial load
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // react to mutations anywhere in the app
  useEffect(() => {
    const onDevicesChanged = () => refetchDevices();
    const onAlertsChanged = () => fetchAlerts();
    window.addEventListener('smarthome:devices-changed', onDevicesChanged);
    window.addEventListener('smarthome:alerts-changed', onAlertsChanged);
    return () => {
      window.removeEventListener('smarthome:devices-changed', onDevicesChanged);
      window.removeEventListener('smarthome:alerts-changed', onAlertsChanged);
    };
  }, [refetchDevices, fetchAlerts]);

  // new alerts arriving via WebSocket
  useEffect(() => onAlert(() => { fetchAlerts(); }), [onAlert, fetchAlerts]);

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 space-y-3 animate-pulse">
        <div className="h-3 w-24 bg-primary/20 rounded" />
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    );
  }

  const total = devices.length;
  const available = devices.filter(d => d.status === 'ONLINE').length;
  const pct = total === 0 ? 100 : Math.round((available / total) * 100);
  const barColor = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-500';
  const statusColor = pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 space-y-3">
      <p className="text-xs font-bold text-primary uppercase tracking-wider">Home Status</p>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400">Devices</span>
          <span className={`text-xs font-bold ${statusColor}`}>{available}/{total} available</span>
        </div>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-500`}
            style={{ width: total === 0 ? '100%' : `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">Alerts</span>
        {alertCount === 0 ? (
          <span className="flex items-center gap-1 text-xs text-green-400 font-bold">
            <span className="size-1.5 rounded-full bg-green-500" />
            All clear
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-red-400 font-bold">
            <span className="material-symbols-outlined text-sm">warning</span>
            {alertCount} unread
          </span>
        )}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();
  const profile = useProfile();

  const handleSwitchProfile = () => {
    sessionStorage.removeItem('activeProfile');
    navigate('/profile-selection');
  };
  const isLimited = profile?.role === ROLES.RESTRICTED || profile?.role === ROLES.GUEST;

  const getLinkClass = (currentPath: string) => {
    const isActive = path === currentPath || (path === '/' && currentPath === '/dashboard');
    return `flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
      isActive
        ? 'bg-primary text-background-dark font-bold shadow-[0_0_15px_rgba(6,188,249,0.15)]'
        : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary'
    }`;
  };

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 dark:border-primary/10 bg-background-light dark:bg-background-dark p-4 gap-6 shrink-0 z-40 h-full">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="size-10 flex items-center justify-center rounded-xl bg-primary text-background-dark shadow-[0_0_15px_rgba(6,188,249,0.2)]">
          <span className="material-symbols-outlined font-bold">hub</span>
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100">SmartHome</h2>
        </div>
      </div>

      <nav className="flex flex-col gap-2 flex-1 mt-2">
        <Link to="/dashboard" className={getLinkClass('/dashboard')}>
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-sm">Dashboard</span>
        </Link>
        <Link to="/devices" className={getLinkClass('/devices')}>
          <span className="material-symbols-outlined">devices</span>
          <span className="text-sm">Devices</span>
        </Link>
        {!isLimited && (
          <Link to="/rooms" className={getLinkClass('/rooms')}>
            <span className="material-symbols-outlined">meeting_room</span>
            <span className="text-sm">Rooms</span>
          </Link>
        )}
        <Link to="/schedules" className={getLinkClass('/schedules')}>
          <span className="material-symbols-outlined">schedule</span>
          <span className="text-sm">Schedules</span>
        </Link>
        {!isLimited && (
          <Link to="/energy" className={getLinkClass('/energy')}>
            <span className="material-symbols-outlined">analytics</span>
            <span className="text-sm">Energy Usage</span>
          </Link>
        )}
        {!isLimited && (
          <Link to="/security" className={getLinkClass('/security')}>
            <span className="material-symbols-outlined">security</span>
            <span className="text-sm">Security Logs</span>
          </Link>
        )}
        <Link to="/edit-profile" className={getLinkClass('/edit-profile')}>
          <span className="material-symbols-outlined">settings</span>
          <span className="text-sm">Settings</span>
        </Link>
      </nav>

      {/* System Status */}
      <div className="mt-auto flex flex-col gap-4">
        {profile && (
          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-100 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 group/profile">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-sm">person</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{profile.firstName} {profile.lastName}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{profile.role}</p>
              </div>
            </div>
            <button
              onClick={handleSwitchProfile}
              className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
              title="Trocar perfil"
            >
              <span className="material-symbols-outlined text-lg">switch_account</span>
            </button>
          </div>
        )}
        <HomeStatus />
      </div>
    </aside>
  );
}
