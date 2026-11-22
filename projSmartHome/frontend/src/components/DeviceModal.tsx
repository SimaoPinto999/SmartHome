import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Device, DeviceComponent } from '../types/devices';
import { useDeviceComponents } from '../hooks/useDeviceComponents';
import { ComponentCard } from './ComponentCard';
import { ComponentFormModal } from './ComponentFormModal';

type ModalTab = 'controls' | 'details';

interface DeviceModalProps {
  device: Device | null;
  onClose: () => void;
  onCommand?: (componentId: number, value: string) => void;
  onEdit?: (device: Device) => void;
  onDelete?: (device: Device) => void;
}

const DEVICE_TYPE_ICON: Record<string, string> = {
  GATEWAY:     'hub',
  CONTROLLER:  'developer_board',
  SENSOR_NODE: 'vital_signs',
  ACTUATOR:    'toggle_on',
  SECURITY:    'shield',
};

const DEVICE_TYPE_COLOR: Record<string, string> = {
  GATEWAY:     'from-violet-500/20 to-transparent border-violet-500/30',
  CONTROLLER:  'from-yellow-400/20 to-transparent border-yellow-400/30',
  SENSOR_NODE: 'from-sky-500/20 to-transparent border-sky-500/30',
  ACTUATOR:    'from-amber-500/20 to-transparent border-amber-500/30',
  SECURITY:    'from-red-500/20 to-transparent border-red-500/30',
};

const DEVICE_TYPE_ICON_COLOR: Record<string, string> = {
  GATEWAY:     'bg-violet-500 text-white',
  CONTROLLER:  'bg-yellow-400 text-slate-900',
  SENSOR_NODE: 'bg-sky-500 text-white',
  ACTUATOR:    'bg-amber-500 text-slate-900',
  SECURITY:    'bg-red-500 text-white',
};

const DEVICE_TYPE_LABEL: Record<string, string> = {
  GATEWAY:     'Gateway',
  CONTROLLER:  'Controller',
  SENSOR_NODE: 'Sensor',
  ACTUATOR:    'Actuator',
  SECURITY:    'Security',
};

const STATUS_LABEL: Record<string, string> = {
  ONLINE:  'Available',
  OFFLINE: 'Unavailable',
  ERROR:   'Error',
};

// Inner component receives a non-null device so hooks are always called
// consistently regardless of open/close state.
function ModalContent({ device, onClose, onCommand, onEdit, onDelete }: { device: Device; onClose: () => void; onCommand?: (componentId: number, value: string) => void; onEdit?: (device: Device) => void; onDelete?: (device: Device) => void }) {
  const [activeTab, setActiveTab] = useState<ModalTab>('controls');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [componentForm, setComponentForm] = useState<{ open: boolean; component: DeviceComponent | null }>({ open: false, component: null });

  useEffect(() => {
    setActiveTab('controls');
    setConfirmDelete(false);
  }, [device.deviceId]);

  const { components, loading, error, createComponent, updateComponent, deleteComponent, sendCommand } = useDeviceComponents(device.deviceId);

  const handleCommand = React.useCallback(async (componentId: number, value: string) => {
    await sendCommand(componentId, value);
    onCommand?.(componentId, value);
  }, [sendCommand, onCommand]);

  const actuators = components.filter(c => c.componentType === 'ACTUATOR');
  const sensors   = components.filter(c => c.componentType === 'SENSOR');

  const color     = DEVICE_TYPE_COLOR[device.deviceType]     ?? DEVICE_TYPE_COLOR.SENSOR_NODE;
  const icon      = DEVICE_TYPE_ICON[device.deviceType]      ?? 'device_unknown';
  const iconColor = DEVICE_TYPE_ICON_COLOR[device.deviceType] ?? DEVICE_TYPE_ICON_COLOR.SENSOR_NODE;
  const isOnline  = device.status === 'ONLINE';

  return (
    <motion.div
      className="relative w-full sm:max-w-2xl bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[80vh] flex flex-col"
      onClick={e => e.stopPropagation()}
      initial={{ y: 48, opacity: 0, scale: 0.97 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 48, opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Drag handle (mobile) */}
      <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
        <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
      </div>

      {/* Header */}
      <div className={`px-6 pt-4 pb-4 bg-gradient-to-br ${color} border-b border-slate-200 dark:border-slate-700 flex-shrink-0`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div
              className={`size-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isOnline
                  ? iconColor
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">{device.deviceName}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {device.room?.roomName ?? `Room ${device.roomId}`} · {DEVICE_TYPE_LABEL[device.deviceType] ?? device.deviceType.replace('_', ' ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isOnline
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}
            >
              <span className={`size-1.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`} />
              {STATUS_LABEL[device.status] ?? device.status}
            </div>
            <button
              onClick={onClose}
              className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        {(['controls', 'details'] as ModalTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-bold transition-all ${
              activeTab === tab
                ? 'text-primary border-b-2 border-primary'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tab === 'controls' ? 'Controls' : 'Details'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-sm text-red-400">{error}</div>
        ) : (
          <div className="p-4 space-y-3">
            {activeTab === 'controls' ? (
              <>
                {actuators.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                      Actuators
                    </p>
                    <div className="space-y-2">
                      {actuators.map(c => (
                        <ComponentCard
                          key={c.componentId}
                          component={c}
                          showChart={false}
                          onCommand={handleCommand}
                          isOnline={isOnline}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {sensors.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                      Sensors
                    </p>
                    <div className="space-y-2">
                      {sensors.map(c => (
                        <ComponentCard
                          key={c.componentId}
                          component={c}
                          showChart={false}
                          onCommand={handleCommand}
                          isOnline={isOnline}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {components.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">
                    No components registered.
                  </p>
                )}
              </>
            ) : (
              <>
                {/* Device info */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Information</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Device ID', value: device.deviceId },
                      { label: 'Type',      value: DEVICE_TYPE_LABEL[device.deviceType] ?? device.deviceType.replace('_', ' ') },
                      { label: 'Status',    value: STATUS_LABEL[device.status] ?? device.status },
                      { label: 'Room',      value: device.room?.roomName ?? `Room ${device.roomId}` },
                    ].map(item => (
                      <div key={item.label} className="flex flex-col p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{item.label}</span>
                        <span className="text-sm font-bold mt-0.5 truncate">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Components management */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Components</p>
                    <button
                      onClick={() => setComponentForm({ open: true, component: null })}
                      className="flex items-center gap-1 text-xs font-bold text-primary hover:opacity-75 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Add
                    </button>
                  </div>
                  {components.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No components. Add one to get started.</p>
                  ) : (
                    <div className="space-y-2">
                      {components.map(c => (
                        <div key={c.componentId} className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <ComponentCard component={c} showChart={true} onCommand={handleCommand} isOnline={isOnline} />
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              onClick={() => setComponentForm({ open: true, component: c })}
                              className="size-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-sm text-slate-400">edit</span>
                            </button>
                            <button
                              onClick={() => deleteComponent(c.componentId)}
                              className="size-7 flex items-center justify-center rounded-lg hover:bg-red-400/10 transition-colors"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-sm text-red-400">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(device)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-bold"
                    >
                      <span className="material-symbols-outlined text-primary">edit</span>
                      Edit device
                      <span className="ml-auto material-symbols-outlined text-slate-400">chevron_right</span>
                    </button>
                  )}

                  {onDelete && !confirmDelete && (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors text-sm font-bold"
                    >
                      <span className="material-symbols-outlined">delete</span>
                      Delete device
                    </button>
                  )}

                  {confirmDelete && (
                    <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 space-y-3">
                      <p className="text-sm font-bold text-red-400">Are you sure? This action cannot be undone.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => onDelete(device)}
                          className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <ComponentFormModal
        open={componentForm.open}
        deviceId={device.deviceId}
        component={componentForm.component}
        onClose={() => setComponentForm({ open: false, component: null })}
        onSave={async data => {
          if (componentForm.component) {
            await updateComponent(componentForm.component.componentId, data);
          } else {
            await createComponent(data);
          }
        }}
      />
    </motion.div>
  );
}

// DeviceModal

export function DeviceModal({ device, onClose, onCommand, onEdit, onDelete }: DeviceModalProps) {
  return (
    <AnimatePresence>
      {device && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <ModalContent key={device.deviceId} device={device} onClose={onClose} onCommand={onCommand} onEdit={onEdit} onDelete={onDelete} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}