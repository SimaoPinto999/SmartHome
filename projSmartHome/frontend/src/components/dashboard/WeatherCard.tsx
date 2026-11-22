import { motion } from 'motion/react';
import { useWeather } from '../../hooks/useWeather';

export default function WeatherCard() {
  const { data, isLoading: loading } = useWeather();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
      className="rounded-2xl border border-primary/20 bg-slate-50 dark:bg-background-dark p-5 flex flex-col justify-between h-full"
    >
      {loading || !data ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin size-5 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* City */}
          <p className="text-xs text-slate-400 flex items-center gap-0.5 mb-3">
            <span className="material-symbols-outlined text-base">location_on</span>
            {data.city}
          </p>

          {/* Temp */}
          <div className="flex items-center gap-3 mb-auto">
            <span className="material-symbols-outlined text-5xl text-primary">{data.icon}</span>
            <div>
              <p className="text-4xl font-black tabular-nums leading-none text-slate-900 dark:text-white">{data.temp}°C</p>
              <p className="text-sm text-slate-400 mt-1">{data.description}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            {[
              { icon: 'thermostat',   value: `${data.feelsLike}°C`,     label: 'Feels like' },
              { icon: 'humidity_mid', value: `${data.humidity}%`,        label: 'Humidity' },
              { icon: 'air',          value: `${data.windSpeed} km/h`,   label: 'Wind' },
              { icon: 'water_drop',   value: `${data.precipitation} mm`, label: 'Rain' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary/60">{s.icon}</span>
                <div>
                  <p className="text-[11px] text-slate-400 leading-none">{s.label}</p>
                  <p className="text-sm font-bold mt-0.5">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
