import type { Room, RoomType } from './devices';

export interface RoomTypeOption {
  value: RoomType;
  label: string;
  icon: string; // Material Symbols name
}

export const ROOM_TYPES: RoomTypeOption[] = [
  { value: 'LIVING_ROOM', label: 'Living Room', icon: 'living'    },
  { value: 'KITCHEN',     label: 'Kitchen',     icon: 'kitchen'   },
  { value: 'BEDROOM',     label: 'Bedroom',     icon: 'bed'       },
  { value: 'BATHROOM',    label: 'Bathroom',    icon: 'bathtub'   },
  { value: 'OFFICE',      label: 'Office',      icon: 'desk'      },
  { value: 'GARAGE',      label: 'Garage',      icon: 'garage'    },
  { value: 'HALLWAY',     label: 'Hallway',     icon: 'door_open' },
  { value: 'OUTSIDE',     label: 'Outside',     icon: 'yard'      },
];

// Backend GET /api/rooms/house/{houseId} returns deviceCount; model it here only.
export interface RoomWithCount extends Room {
  deviceCount: number;
}
