import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

function getGreeting(): { text: string; icon: string } {
  const h = new Date().getHours();
  if (h < 6)  return { text: 'Good Night',     icon: 'bedtime' };
  if (h < 12) return { text: 'Good Morning',   icon: 'wb_sunny' };
  if (h < 18) return { text: 'Good Afternoon', icon: 'partly_cloudy_day' };
  return       { text: 'Good Evening',         icon: 'nights_stay' };
}

interface WelcomeCardProps {
  name: string;
  isLimited: boolean;
  houseName?: string;
}

export default function WelcomeCard({ name, isLimited, houseName }: WelcomeCardProps) {
  const [time, setTime] = useState(new Date());
  const greeting = getGreeting();

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = time.getHours().toString().padStart(2, '0');
  const mm = time.getMinutes().toString().padStart(2, '0');
  const ss = time.getSeconds().toString().padStart(2, '0');
  const dateStr = time.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-slate-50 dark:bg-background-dark w-full"
      style={{ minHeight: '180px' }}
    >
      {/* Aurora orbs - dark mode */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full opacity-0 dark:opacity-20"
        style={{ background: 'radial-gradient(circle, #06bcf9 0%, transparent 70%)', animation: 'orb-drift-a 8s ease-in-out infinite alternate' }} />
      <div className="pointer-events-none absolute -bottom-20 right-10 h-72 w-72 rounded-full opacity-0 dark:opacity-15"
        style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', animation: 'orb-drift-b 10s ease-in-out infinite alternate' }} />
      <div className="pointer-events-none absolute top-8 right-1/3 h-48 w-48 rounded-full opacity-0 dark:opacity-10"
        style={{ background: 'radial-gradient(circle, #06bcf9 0%, transparent 70%)', animation: 'orb-drift-a 12s ease-in-out infinite alternate-reverse' }} />

      {/* Aurora orbs - light mode */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full opacity-30 dark:opacity-0"
        style={{ background: 'radial-gradient(circle, #bae6fd 0%, transparent 70%)', animation: 'orb-drift-a 8s ease-in-out infinite alternate' }} />
      <div className="pointer-events-none absolute -bottom-20 right-10 h-72 w-72 rounded-full opacity-20 dark:opacity-0"
        style={{ background: 'radial-gradient(circle, #ddd6fe 0%, transparent 70%)', animation: 'orb-drift-b 10s ease-in-out infinite alternate' }} />

      {/* Scanline grid - dark mode only */}
      <div className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(6,188,249,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,188,249,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 p-7 h-full">
        <div className="flex-1">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
            className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">{greeting.icon}</span>
            <span className="text-sm font-bold uppercase tracking-widest text-primary/70">{greeting.text}</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 0.4 }}
            className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            {name}
          </motion.h1>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-sm font-bold">
              <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
              All systems normal
              {houseName && (
                <>
                  <span className="text-green-400/40 mx-0.5">·</span>
                  <span className="material-symbols-outlined text-[15px]">home</span>
                  {houseName}
                </>
              )}
            </span>
            {isLimited && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <span className="material-symbols-outlined text-sm">lock</span>
                Restricted View
              </span>
            )}
          </motion.div>
        </div>

        {/* Live clock */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col items-end shrink-0">
          <div className="flex items-end gap-1 tabular-nums leading-none">
            <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{hh}:{mm}</span>
            <span className="text-xl font-bold text-primary/60 mb-1">{ss}</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 font-medium">{dateStr}</span>
        </motion.div>
      </div>

      <style>{`
        @keyframes orb-drift-a {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, 20px) scale(1.15); }
        }
        @keyframes orb-drift-b {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(-25px, -15px) scale(1.1); }
        }
      `}</style>
    </motion.div>
  );
}
