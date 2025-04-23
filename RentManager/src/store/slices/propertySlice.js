import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  properties: [],
  nextPropertyId: 1,
};

const propertySlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    addProperty: (state, action) => {
      const newProperty = {
        id: state.nextPropertyId,
        name: action.payload.name,
        rooms: [],
      };
      state.properties.push(newProperty);
      state.nextPropertyId += 1;
    },
    updateProperty: (state, action) => {
      const index = state.properties.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.properties[index] = {
          ...state.properties[index],
          ...action.payload,
        };
      }
    },
    deleteProperty: (state, action) => {
      state.properties = state.properties.filter(
        (property) => property.id !== action.payload
      );
    },
    addRoom: (state, action) => {
      const { propertyId, ...roomData } = action.payload;
      const property = state.properties.find((p) => p.id === propertyId);
      if (property) {
        const newRoom = {
          ...roomData,
          id: (property.rooms.length + 1).toString(),
          status: roomData.status || 'Vacant',
          tenant: roomData.tenant || null,
          occupiedUntil: roomData.occupiedUntil || null,
        };
        property.rooms.push(newRoom);
      }
    },
    updateRoom: (state, action) => {
      const { propertyId, roomId, updates } = action.payload;
      const property = state.properties.find((p) => p.id === propertyId);
      if (property) {
        const roomIndex = property.rooms.findIndex((r) => r.id === roomId);
        if (roomIndex !== -1) {
          property.rooms[roomIndex] = {
            ...property.rooms[roomIndex],
            ...updates,
          };
        }
      }
    },
    deleteRoom: (state, action) => {
      const { propertyId, roomId } = action.payload;
      const property = state.properties.find((p) => p.id === propertyId);
      if (property) {
        property.rooms = property.rooms.filter((room) => room.id !== roomId);
      }
    },
  },
});

export const {
  addProperty,
  updateProperty,
  deleteProperty,
  addRoom,
  updateRoom,
  deleteRoom,
} = propertySlice.actions;

export default propertySlice.reducer; 