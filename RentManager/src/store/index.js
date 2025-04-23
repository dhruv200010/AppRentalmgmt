import { configureStore } from '@reduxjs/toolkit';
import propertyReducer from './slices/propertySlice';
import roomReducer from './slices/roomSlice';
import leadReducer from './slices/leadSlice';

export const store = configureStore({
  reducer: {
    properties: propertyReducer,
    rooms: roomReducer,
    leads: leadReducer,
  },
}); 