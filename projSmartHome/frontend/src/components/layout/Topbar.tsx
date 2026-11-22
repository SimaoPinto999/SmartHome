import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertBell } from '../AlertBell';
import { useTheme } from '../../hooks/useTheme';

type TopbarProps = {
  title: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearch?: (value: string) => void;
  extraActions?: React.ReactNode;
  onMenuOpen?: () => void;
};

export default function Topbar({
  title,
  showSearch = true,
  searchPlaceholder = "Search devices...",
  searchValue,
  onSearch,
  extraActions,
  onMenuOpen,
}: TopbarProps) {
  const navigate = useNavigate();
  const [theme, setTheme] = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [themeKey, setThemeKey] = useState(0);
  const [gearSpinning, setGearSpinning] = useState(false);

  return (
    <header className="h-20 border-b border-slate-200 dark:border-primary/10 flex items-center justify-between px-6 lg:px-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md z-40 sticky top-0 shrink-0">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMenuOpen}
          className="lg:hidden flex items-center justify-center size-9 rounded-lg hover:bg-slate-100 dark:hover:bg-primary/10 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">menu</span>
        </button>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
      </div>
      <div className="flex items-center gap-4 lg:gap-6 justify-end">
        {extraActions && (
          <div className="flex items-center gap-4 border-r border-slate-200 dark:border-slate-800 pr-4">
            {extraActions}
          </div>
        )}
        
        {showSearch && (
          <div className="hidden md:block relative min-w-40 w-64 h-10">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 dark:text-primary/50 pointer-events-none">
              search
            </span>
            <input 
              className="w-full h-full pl-10 pr-4 bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-lg text-sm placeholder:text-slate-400 dark:placeholder:text-primary/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-900 dark:text-slate-100" 
              placeholder={searchPlaceholder}
              value={searchValue || ''}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        )}

        <div className="flex gap-2 shrink-0">
          <AlertBell />
          <button
            onClick={() => { setTheme(isDark ? 'light' : 'dark'); setThemeKey(k => k + 1); }}
            className="flex items-center justify-center rounded-lg size-10 bg-slate-100 dark:bg-primary/10 text-slate-700 dark:text-primary hover:bg-primary/20 transition-colors overflow-hidden"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span key={themeKey} className="material-symbols-outlined animate-icon-flip-in">{isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button
            onClick={() => { setGearSpinning(true); navigate('/edit-profile'); }}
            onAnimationEnd={() => setGearSpinning(false)}
            className="flex items-center justify-center rounded-lg size-10 bg-slate-100 dark:bg-primary/10 text-slate-700 dark:text-primary hover:bg-primary/20 transition-colors"
          >
            <span className={`material-symbols-outlined${gearSpinning ? ' animate-gear-spin' : ''}`}>settings</span>
          </button>
        </div>  
      </div>
    </header>
  );
}
