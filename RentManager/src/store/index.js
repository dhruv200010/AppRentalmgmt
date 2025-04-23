import { configureStore } from '@reduxjs/toolkit';
import propertyReducer from './slices/propertySlice';
import leadReducer from './slices/leadSlice';

export const store = configureStore({
  reducer: {
    properties: propertyReducer,
    leads: leadReducer,
  },
}); 