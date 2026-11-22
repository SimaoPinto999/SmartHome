interface Props {
  pin: string;
  onChange: (pin: string) => void;
}

export default function PinInput({ pin, onChange }: Props) {
  return (
    <section className="bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-6">
      <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">lock</span>
        Security
      </h4>
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase px-1">Change PIN</label>
        <p className="text-xs text-slate-500 dark:text-slate-400 px-1">Enter a new 4-digit PIN, or leave blank to keep your current one.</p>
        <div className="flex items-center gap-3 mt-2">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-lg font-black transition-colors ${
                pin.length > i
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/50'
              }`}
            >
              {pin.length > i ? '●' : ''}
            </div>
          ))}
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="sr-only"
            aria-label="New PIN"
            id="pin-input"
          />
          <button
            type="button"
            onClick={() => document.getElementById('pin-input')?.focus()}
            className="ml-2 text-xs text-primary underline underline-offset-2 font-bold"
          >
            {pin.length === 0 ? 'Tap to enter' : pin.length < 4 ? `${pin.length}/4` : 'PIN set ✓'}
          </button>
          {pin.length > 0 && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
