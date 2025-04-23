import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  leads: [],
  loading: false,
  error: null,
};

const leadSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setLeads: (state, action) => {
      state.leads = action.payload;
    },
    addLead: (state, action) => {
      state.leads.push(action.payload);
    },
    updateLead: (state, action) => {
      const index = state.leads.findIndex(l => l.id === action.payload.id);
      if (index !== -1) {
        state.leads[index] = action.payload;
      }
    },
    deleteLead: (state, action) => {
      state.leads = state.leads.filter(l => l.id !== action.payload);
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
  setLeads,
  addLead,
  updateLead,
  deleteLead,
  setLoading,
  setError,
} = leadSlice.actions;

export default leadSlice.reducer; 