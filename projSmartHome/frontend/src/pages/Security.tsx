import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
import { ROLES } from '../types/role';
import { useProfile } from '../hooks/useProfile';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useDevices } from '../hooks/useDevices';
import { Dropdown, type DropdownOption } from '../components/Dropdown';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function CustomDatePicker({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
  const selectedDate = value ? new Date(value) : null;
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">{label}</span>
      <DatePicker
        selected={selectedDate}
        onChange={(date: Date | null) => {
          if (!date) {
            onChange('');
          } else {
            // Local timezone ISO string
            const pad = (n: number) => n.toString().padStart(2, '0');
            const localStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
            onChange(localStr);
          }
        }}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        timeCaption="Time"
        dateFormat="MMMM d, yyyy HH:mm"
        placeholderText="Select date and time"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded px-3 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all w-48"
      />
    </div>
  );
}

export default function Security() {
  const profile = useProfile();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeRoom, setActiveRoom] = useState<number | 'all'>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(20);

  const { devices } = useDevices();

  const fromIso = fromDate ? `${fromDate}:00` : undefined;
  const toIso = toDate ? `${toDate}:59` : undefined;
  const roomId = activeRoom === 'all' ? undefined : activeRoom;
  
  const eventTypeMap: Record<string, string | undefined> = {
    ALL: undefined,
    INTRUSIONS: 'ALERT',
    LOCKS: 'ACTUATOR',
    SENSORS: 'SENSOR'
  };
  const eventType = eventTypeMap[filter];

  const { logs, totalPages, totalElements, loading } = useActivityLogs(roomId, eventType, fromIso, toIso, searchQuery, page, limit);

  useEffect(() => {
    // Reset to page 0 when filters change
    setPage(0);
  }, [filter, activeRoom, fromDate, toDate, searchQuery, limit]);

  useEffect(() => {
    if (profile?.role === ROLES.RESTRICTED || profile?.role === ROLES.GUEST) {
      navigate('/dashboard', { replace: true });
    }
  }, [profile, navigate]);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, typeof logs> = {};

    logs.forEach(log => {
      const dateStr = new Date(log.timestamp).toLocaleDateString();
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(log);
    });
    return groups;
  }, [logs, searchQuery]);

  // Room options derived from loaded devices
  const roomOptions = useMemo((): DropdownOption[] => {
    const seen = new Map<number, DropdownOption>();
    for (const d of devices) {
      if (d.room && !seen.has(d.room.roomId)) {
        seen.set(d.room.roomId, {
          id:    d.room.roomId,
          label: d.room.roomName,
          icon:  'meeting_room',
        });
      }
    }
    return [
      { id: 'all', label: 'All rooms', icon: 'home' },
      ...Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label as string)),
    ];
  }, [devices]);

  const getEventIcon = (eventType: string, message: string) => {
    if (eventType === 'ALERT') return 'warning';
    if (eventType === 'SYSTEM') return 'shield';
    if (eventType === 'ACTUATOR') return 'lock';
    if (eventType === 'SENSOR') {
      if (message.toLowerCase().includes('motion')) return 'motion_sensor_active';
      return 'sensor_door';
    }
    return 'info';
  };

  const getEventColor = (eventType: string) => {
    if (eventType === 'ALERT') return 'bg-red-500/20 text-red-500';
    if (eventType === 'SYSTEM') return 'bg-primary/20 text-primary';
    if (eventType === 'ACTUATOR') return 'bg-amber-500/20 text-amber-500';
    return 'bg-slate-200 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400';
  };

  return (
    <Layout 
      title="Security Logs" 
      showSearch={true} 
      searchPlaceholder="Search events..."
      searchValue={searchQuery}
      onSearch={setSearchQuery}
    >
      <div className="space-y-6 mx-auto w-full">
          {/* Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="mr-2">
                <Dropdown
                  value={activeRoom}
                  options={roomOptions}
                  onChange={setActiveRoom}
                  placeholder="Room"
                  icon="home"
                />
              </div>
              <button onClick={() => setFilter('ALL')} className={`${filter === 'ALL' ? 'bg-primary text-background-dark' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'} px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-colors`}>
                <span className="material-symbols-outlined text-sm">checklist</span>
                All
              </button>
              <button onClick={() => setFilter('INTRUSIONS')} className={`${filter === 'INTRUSIONS' ? 'bg-primary text-background-dark' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'} px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-colors`}>
                <span className="material-symbols-outlined text-sm">warning</span>
                Intrusions
              </button>
              <button onClick={() => setFilter('LOCKS')} className={`${filter === 'LOCKS' ? 'bg-primary text-background-dark' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'} px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-colors`}>
                <span className="material-symbols-outlined text-sm">lock</span>
                Locks
              </button>
              <button onClick={() => setFilter('SENSORS')} className={`${filter === 'SENSORS' ? 'bg-primary text-background-dark' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'} px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-colors`}>
                <span className="material-symbols-outlined text-sm">motion_sensor_active</span>
                Sensors
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4 relative">
              <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <CustomDatePicker label="From" value={fromDate} onChange={setFromDate} />
                <CustomDatePicker label="To" value={toDate} onChange={setToDate} />
                {(fromDate || toDate) && (
                  <button 
                    onClick={() => { setFromDate(''); setToDate(''); }}
                    className="text-slate-400 hover:text-red-500 transition-colors ml-1 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
                    title="Clear Dates"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
              
              {/* Items Per Page Dropdown */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Show</span>
                <select 
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-primary"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : Object.keys(groupedLogs).length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700">history_off</span>
                <p className="text-slate-500 dark:text-slate-400 mt-4 font-bold">No security events found</p>
              </div>
            ) : (
              Object.entries(groupedLogs).map(([dateStr, dateLogs]) => {
                const isToday = dateStr === new Date().toLocaleDateString();
                const isYesterday = dateStr === new Date(Date.now() - 86400000).toLocaleDateString();
                const displayDate = isToday ? 'Today' : isYesterday ? 'Yesterday' : dateStr;

                return (
                  <div key={dateStr} className="space-y-3">
                    <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest pl-1">{displayDate}</h3>
                    {dateLogs.map(log => (
                      <div key={log.logId} className="bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex gap-4 transition-all hover:bg-slate-200/50 dark:hover:bg-slate-800/50">
                        <div className={`size-10 flex-shrink-0 rounded-full flex items-center justify-center ${getEventColor(log.eventType)}`}>
                          <span className="material-symbols-outlined text-[20px]">{getEventIcon(log.eventType, log.message)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="text-slate-800 dark:text-slate-100 text-sm font-bold">{log.message}</h4>
                              {log.componentName && (
                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                  {log.deviceName} • {log.componentName} {log.roomName && `• ${log.roomName}`}
                                </p>
                              )}
                            </div>
                            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 p-4 rounded-xl">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold">
                  Showing page {page + 1} of {totalPages} ({totalElements} total events)
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-300 px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                    Prev
                  </button>
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-300 px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1"
                  >
                    Next
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
    </Layout>
  );
}
