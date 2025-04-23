import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  leads: [],
  sources: ['roomies', 'fb', 'roomster', 'telegram', 'sulekha', 'whatsapp', 'others'],
  categories: ['Call', 'Follow up with', 'Send lease to', 'landed', 'Nuh-uh'],
  locations: ['Austin', 'Kyle'],
};

const leadSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    addLead: (state, action) => {
      const newLead = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      state.leads.push(newLead);
    },
    updateLead: (state, action) => {
      const index = state.leads.findIndex(lead => lead.id === action.payload.id);
      if (index !== -1) {
        state.leads[index] = {
          ...state.leads[index],
          ...action.payload,
        };
      }
    },
    deleteLead: (state, action) => {
      state.leads = state.leads.filter(lead => lead.id !== action.payload);
    },
  },
});

export const { addLead, updateLead, deleteLead } = leadSlice.actions;
export default leadSlice.reducer; 