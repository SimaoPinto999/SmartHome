import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { RoomFormModal } from '../components/RoomFormModal';
import type { RoomFormValues } from '../components/RoomFormModal';
import { useHouse } from '../hooks/useHouse';
import { useProfile } from '../hooks/useProfile';
import { useRooms } from '../hooks/useRooms';
import { useToast } from '../context/ToastContext';
import { ROLES } from '../types/role';
import { ROOM_TYPES } from '../types/rooms';
import type { RoomTypeOption, RoomWithCount } from '../types/rooms';

const ROOM_TYPE_META: Record<string, RoomTypeOption> =
  Object.fromEntries(ROOM_TYPES.map(t => [t.value, t]));

function RoomCard({
  room,
  onEdit,
  onDelete,
}: {
  room: RoomWithCount;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const meta = ROOM_TYPE_META[room.roomType];

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
      setConfirm(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="size-11 flex items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
          <span className="material-symbols-outlined">{meta?.icon ?? 'meeting_room'}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold truncate">{room.roomName}</p>
          <p className="text-xs text-slate-400">{meta?.label ?? room.roomType} · Floor {room.floor}</p>
        </div>
        <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 shrink-0">
          {room.deviceCount} device{room.deviceCount !== 1 ? 's' : ''}
        </span>
      </div>

      {!confirm && (
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Edit
          </button>
          <button
            onClick={() => setConfirm(true)}
            className="py-2 px-3 rounded-xl text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/20 transition-all flex items-center justify-center"
            title="Delete room"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      )}

      {confirm && (
        <div className="flex flex-col gap-2">
          {room.deviceCount > 0 && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              This will also delete {room.deviceCount} device{room.deviceCount !== 1 ? 's' : ''} and their access permissions.
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setConfirm(false)}
              disabled={deleting}
              className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Rooms() {
  const profile = useProfile();
  const { data: house } = useHouse();
  const { showToast } = useToast();
  const { rooms, loading, error, refetch, createRoom, updateRoom, deleteRoom } =
    useRooms(house?.houseId ?? null);
  const [form, setForm] = useState<{ open: boolean; room: RoomWithCount | null }>({
    open: false,
    room: null,
  });
  const [search, setSearch] = useState('');

  if (profile && profile.role !== ROLES.ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (values: RoomFormValues) => {
    if (form.room) {
      await updateRoom(form.room.roomId, values);
      showToast('Room updated.', 'success');
    } else {
      if (house == null) {
        showToast('No house configured. Please set up your home first.', 'error');
        setForm({ open: false, room: null });
        return;
      }
      await createRoom({ houseId: house.houseId, ...values });
      showToast('Room created.', 'success');
    }
    setForm({ open: false, room: null });
  };

  const handleDelete = async (room: RoomWithCount) => {
    try {
      await deleteRoom(room.roomId);
      showToast('Room deleted.', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to delete room.', 'error');
    }
  };

  const filteredRooms = rooms.filter(r =>
    r.roomName.toLowerCase().includes(search.toLowerCase())
  );

  const topbarRight = (
    <button
      onClick={() => house == null ? showToast('No house configured. Please set up your home first.', 'error') : setForm({ open: true, room: null })}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-background-dark text-sm font-bold hover:opacity-90 transition-opacity"
    >
      <span className="material-symbols-outlined text-sm">add</span>
      <span className="hidden sm:inline">Add Room</span>
    </button>
  );

  return (
    <>
      <Layout
        title="Rooms"
        topbarRight={topbarRight}
        showSearch={true}
        searchPlaceholder="Search rooms..."
        searchValue={search}
        onSearch={setSearch}
      >
        <div className="space-y-5">
          {house == null && !loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
              <span className="material-symbols-outlined text-6xl">home</span>
              <p className="font-bold text-lg">No home configured</p>
              <p className="text-sm text-center max-w-xs">You need to set up your home before adding rooms. Go back to the profile selection page to create your home.</p>
            </div>
          )}

          {house != null && loading && (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
              <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-sm font-bold">Loading rooms...</span>
            </div>
          )}

          {house != null && error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-400">
              <span className="material-symbols-outlined text-5xl">error</span>
              <p className="font-bold">{error}</p>
              <button
                onClick={refetch}
                className="text-sm px-4 py-2 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && rooms.length > 0 && filteredRooms.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRooms.map(room => (
                <RoomCard
                  key={room.roomId}
                  room={room}
                  onEdit={() => setForm({ open: true, room })}
                  onDelete={() => handleDelete(room)}
                />
              ))}
            </div>
          )}

          {!loading && !error && rooms.length > 0 && filteredRooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <span className="material-symbols-outlined text-5xl">search_off</span>
              <p className="font-bold">No rooms match "{search}"</p>
            </div>
          )}

          {!loading && !error && rooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
              <span className="material-symbols-outlined text-6xl">meeting_room</span>
              <p className="font-bold text-lg">No rooms yet</p>
              <button
                onClick={() => setForm({ open: true, room: null })}
                className="text-sm text-primary hover:underline"
              >
                Add your first room
              </button>
            </div>
          )}
        </div>
      </Layout>

      <RoomFormModal
        open={form.open}
        room={form.room}
        onClose={() => setForm({ open: false, room: null })}
        onSubmit={handleSubmit}
      />
    </>
  );
}
