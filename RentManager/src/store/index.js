import { configureStore } from '@reduxjs/toolkit';
import propertyReducer from './slices/propertySlice';

export const store = configureStore({
  reducer: {
    properties: propertyReducer,
  },
}); 