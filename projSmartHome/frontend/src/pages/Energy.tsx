import React, { useState, useMemo, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { EnergyChart } from '../components/charts/EnergyChart';
import { EnergyDeviceCard } from '../components/EnergyDeviceCard';
import { Dropdown } from '../components/Dropdown';
import type { DropdownOption } from '../components/Dropdown';
import {
  useEnergyPrice,
  useEnergySummary,
  useEnergyChart,
  getPeriod,
} from '../hooks/useEnergy';
import type { PeriodType } from '../hooks/useEnergy';

const LIVE_PERIODS: { id: PeriodType; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week',  label: '7 days' },
];

const COMPONENT_TYPES = [
  { id: 'all',      label: 'All types',  icon: 'widgets' },
  { id: 'ACTUATOR', label: 'Actuators',  icon: 'electrical_services' },
  { id: 'SENSOR',   label: 'Sensors',    icon: 'sensors' },
];

const SENSOR_TYPES = [
  { id: 'all',         label: 'All sensors',  icon: 'sensors' },
  { id: 'TEMPERATURE', label: 'Temperature',  icon: 'thermometer' },
  { id: 'CONTACT',     label: 'Contact',      icon: 'sensor_door' },
  { id: 'POWER',       label: 'Power',        icon: 'bolt' },
  { id: 'SMOKE',       label: 'Smoke',        icon: 'detector_smoke' },
  { id: 'RAIN',        label: 'Rain',         icon: 'water_drop' },
  { id: 'LIGHT',       label: 'Light',        icon: 'light_mode' },
];

const ACTUATOR_TYPES = [
  { id: 'all',   label: 'All actuators', icon: 'electrical_services' },
  { id: 'LIGHT', label: 'Light',         icon: 'lightbulb' },
  { id: 'MOTOR', label: 'Motor',         icon: 'garage' },
  { id: 'VALVE', label: 'Valve',         icon: 'valve' },
];

function MonthSelector({ year, month, onChange }: {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}) {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const prev = () => month === 0 ? onChange(year - 1, 11) : onChange(year, month - 1);
  const next = () => { if (isCurrentMonth) return; month === 11 ? onChange(year + 1, 0) : onChange(year, month + 1); };
  const label = new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  return (
    <div className="flex items-center gap-2">
      <button onClick={prev} className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
        <span className="material-symbols-outlined text-sm">chevron_left</span>
      </button>
      <span className="text-sm font-bold min-w-[140px] text-center">{label}</span>
      <button onClick={next} disabled={isCurrentMonth} className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </button>
      {!isCurrentMonth && (
        <button onClick={() => onChange(now.getFullYear(), now.getMonth())} className="text-xs font-bold text-primary hover:underline">
          Current
        </button>
      )}
    </div>
  );
}

function SummaryCards({ totalKwh, totalCost, pricePerKwh, loading, hasData, onEditPrice }: {
  totalKwh: number;
  totalCost: number;
  pricePerKwh: number;
  loading: boolean;
  hasData: boolean;
  onEditPrice?: (price: number) => Promise<void>;
}) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceValue, setPriceValue]     = useState(pricePerKwh.toFixed(4));
  const [saving, setSaving]             = useState(false);

  React.useEffect(() => {
    if (!editingPrice) setPriceValue(pricePerKwh.toFixed(4));
  }, [pricePerKwh, editingPrice]);

  const handleSavePrice = async () => {
    const n = parseFloat(priceValue);
    if (isNaN(n) || n <= 0 || !onEditPrice) return;
    setSaving(true);
    try { await onEditPrice(n); setEditingPrice(false); }
    finally { setSaving(false); }
  };

  // initialLoading = first fetch not yet done; hasData becomes true after first success
  const initialLoading = loading && !hasData;

  const cards = [
    { label: 'Total consumption', value: `${totalKwh.toFixed(3)} kWh`, icon: 'electric_meter', color: 'text-primary',  editable: false },
    { label: 'Estimated cost',    value: `${Number(totalCost).toFixed(3)} €`, icon: 'euro',     color: 'text-amber-400', editable: false },
    { label: 'Current price',     value: `${pricePerKwh.toFixed(4)} €/kWh`,  icon: 'bolt',     color: 'text-green-400', editable: !!onEditPrice },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map(card => (
        <div key={card.label}
          className={`bg-slate-100 dark:bg-card-dark rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4 transition-opacity duration-300 ${loading && !initialLoading ? 'opacity-60' : 'opacity-100'}`}>
          <div className="size-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
            <span className={`material-symbols-outlined ${card.color}`}>{card.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{card.label}</p>
            {initialLoading ? (
              <div className="h-7 w-28 bg-slate-300 dark:bg-slate-600 rounded-lg animate-pulse mt-1" />
            ) : card.editable && editingPrice ? (
              <div className="flex items-center gap-2 mt-1">
                <input type="text" inputMode="decimal" value={priceValue}
                  onChange={e => setPriceValue(e.target.value)}
                  className="w-24 px-2 py-0.5 text-sm font-bold rounded-lg border border-primary bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  autoFocus onKeyDown={e => e.key === 'Enter' && handleSavePrice()} />
                <button onClick={handleSavePrice} disabled={saving}
                  className="px-2 py-0.5 text-xs font-bold rounded-lg bg-primary text-background-dark disabled:opacity-50">
                  {saving ? '...' : 'Save'}
                </button>
                <button onClick={() => setEditingPrice(false)} className="text-xs text-slate-400 hover:text-slate-600">✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xl font-bold">{card.value}</p>
                {card.editable && !loading && (
                  <button onClick={() => { setPriceValue(pricePerKwh.toFixed(4)); setEditingPrice(true); }}
                    className="text-slate-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DeviceGrid({ summary, loading }: { summary: any; loading: boolean }) {
  const [roomFilter, setRoomFilter]       = useState<string>('all');
  const [typeFilter, setTypeFilter]       = useState<string>('all');
  const [subTypeFilter, setSubTypeFilter] = useState<string>('all');

  const rooms = useMemo((): DropdownOption[] => {
    if (!summary) return [{ id: 'all', label: 'All rooms', icon: 'home' }];
    const unique = Array.from(new Set(summary.devices.map((d: any) => d.roomName))).sort() as string[];
    return [{ id: 'all', label: 'All rooms', icon: 'home' }, ...unique.map(r => ({ id: r, label: r, icon: 'meeting_room' }))];
  }, [summary]);

  const handleTypeChange = (t: string) => { setTypeFilter(t); setSubTypeFilter('all'); };

  const filtered = useMemo(() => {
    if (!summary) return [];
    return summary.devices.filter((d: any) => {
      if (roomFilter !== 'all' && d.roomName !== roomFilter) return false;
      if (typeFilter !== 'all' && d.componentType !== typeFilter) return false;
      if (subTypeFilter !== 'all') {
        if (typeFilter === 'SENSOR'   && d.sensorType   !== subTypeFilter) return false;
        if (typeFilter === 'ACTUATOR' && d.actuatorType !== subTypeFilter) return false;
      }
      return true;
    });
  }, [summary, roomFilter, typeFilter, subTypeFilter]);

  const hasFilters = roomFilter !== 'all' || typeFilter !== 'all' || subTypeFilter !== 'all';

  // Use the sum of all devices' consumptionKwh as denominator so percentages are
  // consistent with the rounded individual values shown on each card. Using
  // summary.totalKwh can differ from this sum because the backend rounds each
  // device's kwh independently before accumulating the total.
  const allDevicesTotal = useMemo(
    () => summary?.devices?.reduce((s: number, d: any) => s + d.consumptionKwh, 0) ?? 0,
    [summary],
  );

  return (
    <div className="bg-slate-100 dark:bg-card-dark rounded-xl p-6 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-bold">Consumption by device</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Dropdown value={roomFilter} options={rooms} onChange={setRoomFilter} placeholder="All rooms" icon="home" />
          <Dropdown value={typeFilter} options={COMPONENT_TYPES} onChange={handleTypeChange} placeholder="All types" icon="category" />
          {typeFilter === 'SENSOR'   && <Dropdown value={subTypeFilter} options={SENSOR_TYPES}   onChange={setSubTypeFilter} placeholder="All sensors"   icon="sensors" />}
          {typeFilter === 'ACTUATOR' && <Dropdown value={subTypeFilter} options={ACTUATOR_TYPES} onChange={setSubTypeFilter} placeholder="All actuators" icon="electrical_services" />}
          {hasFilters && (
            <button onClick={() => { setRoomFilter('all'); setTypeFilter('all'); setSubTypeFilter('all'); }}
              className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-400 transition-colors">
              <span className="material-symbols-outlined text-sm">close</span>
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
          <div className="animate-spin size-5 border-2 border-primary border-t-transparent rounded-full" />
          <span className="text-sm">Loading...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
          <span className="material-symbols-outlined text-4xl">power_off</span>
          <p className="text-sm">No consumption data for this period</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...filtered].sort((a: any, b: any) => b.consumptionKwh - a.consumptionKwh).map((device: any) => (
            <EnergyDeviceCard key={device.componentId} device={device} totalKwh={allDevicesTotal} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Energy() {
  const [activeTab, setActiveTab]   = useState<'live' | 'history'>('live');
  const [livePeriod, setLivePeriod] = useState<PeriodType>('today');
  const [histYear, setHistYear]     = useState(() => new Date().getFullYear());
  const [histMonth, setHistMonth]   = useState(() => new Date().getMonth());

  // Tracks the current calendar date so liveStart resets at midnight.
  // Without this, a page left open overnight keeps querying from yesterday's
  // midnight, causing an ever-growing period and "yesterday's value increasing".
  const [dayKey, setDayKey] = useState(() => new Date().toDateString());
  useEffect(() => {
    const now      = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer    = setTimeout(() => setDayKey(new Date().toDateString()), midnight.getTime() - now.getTime());
    return () => clearTimeout(timer);
  }, [dayKey]); // re-arms itself each day

  const { data: price, loading: priceLoading, updatePrice } = useEnergyPrice();

  const { start: liveStart } = useMemo(() => getPeriod(livePeriod), [livePeriod, dayKey]);

  const { histStart, histEnd, isCurrentMonth } = useMemo(() => {
    const now = new Date();
    const histStart = new Date(Date.UTC(histYear, histMonth, 1));
    const isCurrentMonth = histYear === now.getFullYear() && histMonth === now.getMonth();
    // null → dynamic end (always fetched up to now); fixed Date for past months.
    const histEnd = isCurrentMonth ? null : new Date(Date.UTC(histYear, histMonth + 1, 1) - 1);
    return { histStart, histEnd, isCurrentMonth };
  }, [histYear, histMonth]);

  // Live: null end → each fetch uses new Date(), so consumption grows in real-time.
  // History: fixed histEnd so the result is stable.
  const { data: liveSummary, loading: liveSummaryLoading, refetch: refetchLive } = useEnergySummary(liveStart, null);
  const { data: liveChart,   loading: liveChartLoading }                         = useEnergyChart(liveStart, null);
  const { data: histSummary, loading: histSummaryLoading, refetch: refetchHist } = useEnergySummary(histStart, histEnd);
  const { data: histChart,   loading: histChartLoading }                         = useEnergyChart(histStart, histEnd);

  const handleUpdatePrice = async (p: number) => {
    await updatePrice(p);
    refetchLive();
    refetchHist();
  };

  return (
    <Layout title="Energy" showSearch={false}>
      <div className="space-y-5">

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['live', 'history'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                  activeTab === tab ? 'bg-primary text-background-dark shadow' : 'text-slate-500 hover:text-primary'
                }`}>
                {tab === 'live' ? 'Live' : 'History'}
              </button>
            ))}
          </div>

          {activeTab === 'live' && (
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {LIVE_PERIODS.map(p => (
                <button key={p.id} onClick={() => setLivePeriod(p.id)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    livePeriod === p.id ? 'bg-primary text-background-dark shadow' : 'text-slate-500 hover:text-primary'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <MonthSelector year={histYear} month={histMonth}
              onChange={(y, m) => { setHistYear(y); setHistMonth(m); }} />
          )}
        </div>

        {activeTab === 'live' && (
          <>
            <SummaryCards
              totalKwh={liveSummary?.totalKwh ?? 0}
              totalCost={liveSummary?.totalCost ?? 0}
              pricePerKwh={liveSummary?.pricePerKwh ?? price?.pricePerKwh ?? 0}
              loading={liveSummaryLoading || priceLoading}
              hasData={liveSummary !== null}
              onEditPrice={handleUpdatePrice}
            />
            <div className="bg-slate-100 dark:bg-card-dark rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Energy consumption</h3>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">kWh</span>
              </div>
              <div className="h-64">
                <EnergyChart points={liveChart} loading={liveChartLoading} />
              </div>
            </div>
            <DeviceGrid summary={liveSummary} loading={liveSummaryLoading} />
          </>
        )}

        {activeTab === 'history' && (
          <>
            <SummaryCards
              totalKwh={histSummary?.totalKwh ?? 0}
              totalCost={histSummary?.totalCost ?? 0}
              pricePerKwh={histSummary?.pricePerKwh ?? 0}
              loading={histSummaryLoading}
              hasData={histSummary !== null}
            />
            <div className="bg-slate-100 dark:bg-card-dark rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Energy consumption</h3>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">kWh</span>
              </div>
              <div className="h-64">
                <EnergyChart points={histChart} loading={histChartLoading} />
              </div>
            </div>
            <DeviceGrid summary={histSummary} loading={histSummaryLoading} />

            {isCurrentMonth && histSummary && (() => {
              const now         = new Date();
              const daysInMonth = new Date(histYear, histMonth + 1, 0).getDate();
              // Use UTC dates to match histStart (also UTC), so elapsedFrac correctly
              // represents how many days of data are actually in histSummary.
              const monthStartUTC = new Date(Date.UTC(histYear, histMonth, 1));
              const monthEndUTC   = new Date(Date.UTC(histYear, histMonth + 1, 1) - 1);
              const elapsedFrac   = (now.getTime() - monthStartUTC.getTime()) / 86_400_000;
              const remainingDays = (monthEndUTC.getTime() - now.getTime()) / 86_400_000;
              // Whole-day counts for display labels only.
              const daysPassed    = now.getDate();
              const daysLeft      = daysInMonth - daysPassed;
              const kwh           = histSummary.totalKwh ?? 0;
              const dailyRate     = elapsedFrac > 0 ? kwh / elapsedFrac : 0;
              const forecastKwh   = kwh + dailyRate * remainingDays;
              const pricePerKwh   = histSummary.pricePerKwh ?? 0;
              const forecastCost  = forecastKwh * pricePerKwh;
              const pct           = Math.min(Math.round((elapsedFrac / daysInMonth) * 100), 100);
              return (
                <div className="bg-slate-100 dark:bg-card-dark rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-bold">Monthly forecast</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Based on current consumption rate</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="material-symbols-outlined text-sm">calendar_month</span>
                      Day {daysPassed} of {daysInMonth}
                    </div>
                  </div>
                  <div className="mb-5">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
                      <span>{daysPassed} days elapsed</span>
                      <span>{daysLeft} days remaining</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Consumed so far',      value: `${kwh.toFixed(3)} kWh`,                   icon: 'electric_meter', color: 'text-primary' },
                      { label: 'Daily rate',            value: `${(dailyRate * 1000).toFixed(1)} Wh/day`, icon: 'trending_up',    color: 'text-amber-400' },
                      { label: 'Monthly forecast',      value: `${forecastKwh.toFixed(3)} kWh`,           icon: 'query_stats',    color: 'text-green-400' },
                      { label: 'Estimated bill',        value: `${forecastCost.toFixed(2)} €`,             icon: 'euro',           color: 'text-red-400' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-slate-200 dark:bg-slate-800 rounded-xl p-4">
                        <span className={`material-symbols-outlined text-lg ${stat.color}`}>{stat.icon}</span>
                        <p className="text-base font-bold mt-1">{stat.value}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </Layout>
  );
}