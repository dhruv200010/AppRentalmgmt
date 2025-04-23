import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  properties: [],
  loading: false,
  error: null,
};

const propertySlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    setProperties: (state, action) => {
      state.properties = action.payload;
    },
    addProperty: (state, action) => {
      state.properties.push(action.payload);
    },
    updateProperty: (state, action) => {
      const index = state.properties.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.properties[index] = action.payload;
      }
    },
    deleteProperty: (state, action) => {
      state.properties = state.properties.filter(p => p.id !== action.payload);
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
  setProperties,
  addProperty,
  updateProperty,
  deleteProperty,
  setLoading,
  setError,
} = propertySlice.actions;

export default propertySlice.reducer; 