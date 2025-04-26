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
        responses: [],
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
    addResponse: (state, action) => {
      const { leadId, response } = action.payload;
      const lead = state.leads.find(lead => lead.id === leadId);
      if (lead) {
        lead.responses = lead.responses || [];
        lead.responses.push({
          text: response,
          timestamp: new Date().toISOString(),
        });
      }
    },
    rescheduleAlert: (state, action) => {
      const { leadId, newAlertTime, notificationId } = action.payload;
      const lead = state.leads.find(lead => lead.id === leadId);
      if (lead) {
        lead.alertTime = newAlertTime;
        lead.notificationId = notificationId;
      }
    },
  },
});

export const { addLead, updateLead, deleteLead, addResponse, rescheduleAlert } = leadSlice.actions;
export default leadSlice.reducer; 