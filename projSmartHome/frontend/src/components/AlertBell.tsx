import { useState, useRef, useEffect } from 'react';
import { useAlerts } from '../hooks/useAlerts';


export function AlertBell() {
  const { alerts, acknowledge, acknowledgeAll } = useAlerts();
  const [open, setOpen] = useState(false);
  const [ringing, setRinging] = useState(false);
  const prevCountRef = useRef(alerts.length);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (alerts.length > prevCountRef.current) {
      setRinging(true);
    }
    prevCountRef.current = alerts.length;
  }, [alerts.length]);

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
        className="flex items-center justify-center rounded-lg size-10 bg-slate-100 dark:bg-primary/10 text-slate-700 dark:text-primary hover:bg-primary/20 transition-colors relative"
      >
        <span
          className={`material-symbols-outlined${ringing ? ' animate-bell-ring' : ''}`}
          onAnimationEnd={() => setRinging(false)}
        >
          notifications
        </span>
        {alerts.length > 0 && (
          <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-dropdown-in">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm font-bold">
              {alerts.length > 0 ? `${alerts.length} unacknowledged alert${alerts.length !== 1 ? 's' : ''}` : 'No alerts'}
            </span>
            {alerts.length > 0 && (
              <button onClick={acknowledgeAll} className="text-xs font-bold text-slate-400 hover:text-primary transition-colors">
                Clear all
              </button>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-slate-400">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
              <span className="text-sm font-bold">All clear</span>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
              {alerts.map(alert => (
                <li key={alert.alertId} className="px-4 py-3 flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold uppercase tracking-widest ${alert.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`}>
                        {alert.severity} · {alert.ruleName}
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5 break-words">{alert.message}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(alert.triggeredAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Lisbon' })}
                      </p>
                    </div>
                    <button
                      onClick={() => acknowledge(alert.alertId)}
                      className="shrink-0 text-xs font-bold text-primary hover:underline mt-0.5"
                    >
                      Ack
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
