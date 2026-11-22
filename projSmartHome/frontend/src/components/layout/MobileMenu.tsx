import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useProfile } from '../../hooks/useProfile';
import { ROLES } from '../../types/role';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useProfile();
  const path = location.pathname;

  const isLimited = profile?.role === ROLES.RESTRICTED || profile?.role === ROLES.GUEST;

  const getLinkClass = (currentPath: string) => {
    const isActive = path === currentPath || (path === '/' && currentPath === '/dashboard');
    return `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      isActive
        ? 'bg-primary text-background-dark font-bold'
        : 'text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary'
    }`;
  };

  const handleSwitchProfile = () => {
    sessionStorage.removeItem('activeProfile');
    onClose();
    navigate('/profile-selection');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Drawer */}
          <motion.div
            className="fixed inset-y-0 left-0 z-50 w-72 bg-background-light dark:bg-background-dark border-r border-slate-200 dark:border-primary/10 flex flex-col p-4 gap-6 lg:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-3">
                <div className="size-10 flex items-center justify-center rounded-xl bg-primary text-background-dark">
                  <span className="material-symbols-outlined font-bold">hub</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">SmartHome</h2>
              </div>
              <button
                onClick={onClose}
                className="size-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-1 flex-1">
              <Link to="/dashboard" className={getLinkClass('/dashboard')} onClick={onClose}>
                <span className="material-symbols-outlined">dashboard</span>
                <span className="text-sm">Dashboard</span>
              </Link>
              <Link to="/devices" className={getLinkClass('/devices')} onClick={onClose}>
                <span className="material-symbols-outlined">devices</span>
                <span className="text-sm">Devices</span>
              </Link>
              {!isLimited && (
                <Link to="/rooms" className={getLinkClass('/rooms')} onClick={onClose}>
                  <span className="material-symbols-outlined">meeting_room</span>
                  <span className="text-sm">Rooms</span>
                </Link>
              )}
              <Link to="/schedules" className={getLinkClass('/schedules')} onClick={onClose}>
                <span className="material-symbols-outlined">schedule</span>
                <span className="text-sm">Schedules</span>
              </Link>
              {!isLimited && (
                <Link to="/energy" className={getLinkClass('/energy')} onClick={onClose}>
                  <span className="material-symbols-outlined">analytics</span>
                  <span className="text-sm">Energy Usage</span>
                </Link>
              )}
              {!isLimited && (
                <Link to="/security" className={getLinkClass('/security')} onClick={onClose}>
                  <span className="material-symbols-outlined">security</span>
                  <span className="text-sm">Security Logs</span>
                </Link>
              )}
              <Link to="/edit-profile" className={getLinkClass('/edit-profile')} onClick={onClose}>
                <span className="material-symbols-outlined">settings</span>
                <span className="text-sm">Settings</span>
              </Link>
            </nav>

            {/* Profile */}
            {profile && (
              <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-100 dark:bg-primary/5 border border-slate-200 dark:border-primary/10">
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
