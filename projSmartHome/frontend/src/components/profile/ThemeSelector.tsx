type Theme = 'system' | 'light' | 'dark';

interface Props {
  theme: Theme;
  onChange: (t: Theme) => void;
}

const THEMES: { value: Theme; label: string; icon: string }[] = [
  { value: 'system', label: 'System Default', icon: 'settings_brightness' },
  { value: 'light', label: 'Light Mode', icon: 'light_mode' },
  { value: 'dark', label: 'Dark Mode', icon: 'dark_mode' },
];

export default function ThemeSelector({ theme, onChange }: Props) {
  return (
    <section className="bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-6">
      <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">palette</span>
        UI Theme
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-wider font-bold">
        Personalized display mode
      </p>
      <div className="grid grid-cols-1 gap-3">
        {THEMES.map(t => (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
              theme === t.value
                ? 'bg-primary/20 border-primary text-primary dark:text-primary'
                : 'bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'
            }`}
          >
            <span className="material-symbols-outlined">{t.icon}</span>
            <span className="text-sm font-bold uppercase tracking-tight">{t.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
