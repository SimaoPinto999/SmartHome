import { createPortal } from 'react-dom';
import { useIntrusionAlerts } from '../hooks/useIntrusionAlerts';

export function IntrusionAlertModal() {
  const { alerts, acknowledge } = useIntrusionAlerts();
  const current = alerts[0] ?? null;

  if (!current) return null;

  const time = new Date(current.triggeredAt + 'Z').toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Lisbon',
  });

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-red-500/40 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-scale-in">
        <div className="h-1.5 w-full bg-red-500 animate-pulse" />

        <div className="p-8 flex flex-col items-center text-center gap-6">
          <div className="size-20 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-red-500 animate-pulse">crisis_alert</span>
          </div>

          <div>
            <h2 className="text-2xl font-black text-red-600 dark:text-red-400 tracking-tight">
              Intrusion Detected!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{time}</p>
          </div>

          <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
            {current.message}
          </p>

          <button
            onClick={() => acknowledge(current.alertId)}
            className="w-full py-3 px-6 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm transition-all"
          >
            I understand — Dismiss
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.25s ease-out forwards; }
      `}</style>
    </div>,
    document.body
  );
}
