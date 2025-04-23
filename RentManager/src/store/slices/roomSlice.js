import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  rooms: [],
  loading: false,
  error: null,
};

const roomSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    setRooms: (state, action) => {
      state.rooms = action.payload;
    },
    addRoom: (state, action) => {
      state.rooms.push(action.payload);
    },
    updateRoom: (state, action) => {
      const index = state.rooms.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.rooms[index] = action.payload;
      }
    },
    deleteRoom: (state, action) => {
      state.rooms = state.rooms.filter(r => r.id !== action.payload);
    },
    updateRoomStatus: (state, action) => {
      const { roomId, status, occupiedUntil } = action.payload;
      const room = state.rooms.find(r => r.id === roomId);
      if (room) {
        room.status = status;
        room.occupiedUntil = occupiedUntil;
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setRooms,
  addRoom,
  updateRoom,
  deleteRoom,
  updateRoomStatus,
  setLoading,
  setError,
} = roomSlice.actions;

export default roomSlice.reducer; 