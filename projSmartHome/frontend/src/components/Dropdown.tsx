import React, { useState, useEffect, useRef } from 'react';

export interface DropdownOption {
  id: string | number;
  label: string;
  icon?: string;
}

interface DropdownProps {
  value: string | number;
  options: DropdownOption[];
  onChange: (id: any) => void;
  placeholder: string;
  icon: string;
}

export function Dropdown({ value, options, onChange, placeholder, icon }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.id === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border ${
          value !== 'all'
            ? 'bg-primary/10 border-primary/40 text-primary'
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary/30 hover:text-primary'
        }`}
      >
        <span className="material-symbols-outlined text-sm">
          {selected?.icon ?? icon}
        </span>
        <span className="max-w-[120px] truncate">
          {selected?.label ?? placeholder}
        </span>
        <span className={`material-symbols-outlined text-sm transition-transform ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 min-w-[180px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${
                opt.id === value
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {opt.icon && (
                <span className="material-symbols-outlined text-sm flex-shrink-0">{opt.icon}</span>
              )}
              {opt.label}
              {opt.id === value && (
                <span className="material-symbols-outlined text-sm ml-auto">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}