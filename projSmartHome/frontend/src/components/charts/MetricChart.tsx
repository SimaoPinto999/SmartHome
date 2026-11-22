import React from 'react';
import { useMetricHistory } from '../../hooks/useMetrics';
import type { HistoryRange } from '../../hooks/useMetrics';
import { NumericChart } from './NumericChart';
import { StepChart } from './StepChart';

const RANGES: HistoryRange[] = ['15m', '1h', '6h', '24h'];

interface MetricChartProps {
  componentId: number;
  isToggle: boolean;
}

export function MetricChart({ componentId, isToggle }: MetricChartProps) {
  // Pass isToggle to the hook so it can use interval=raw for ON/OFF signals
  const { data, loading, range, setRange } = useMetricHistory(componentId, isToggle);
  const hasData = data && data.points.length > 0;

  return (
    <div className="mt-4">
      {/* Header — hide range selector for toggle signals since raw events are always shown */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Histórico</p>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${
                range === r ? 'bg-primary text-background-dark' : 'text-slate-400 hover:text-primary'
              }`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className={`relative rounded-xl border overflow-hidden transition-all ${
        hasData
          ? 'h-36 bg-slate-200 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700/40'
          : 'h-24 bg-slate-100 dark:bg-slate-800 border-dashed border-primary/20'
      }`}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="animate-spin size-3.5 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-xs">A carregar...</span>
            </div>
          </div>
        ) : hasData ? (
          <div className="absolute inset-0 p-1">
            {isToggle
              ? <StepChart points={data!.points} />
              : <NumericChart points={data!.points} />
            }
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="material-symbols-outlined text-primary/25 text-2xl">area_chart</span>
            <span className="text-[10px] text-slate-400">Sem dados para este período</span>
          </div>
        )}
      </div>
    </div>
  );
}