import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  leads: [],
  sources: ['roomies', 'fb', 'roomster', 'telegram', 'sulekha', 'whatsapp', 'others'],
  categories: ['Call', 'Follow up with', 'Send lease to', 'landed', 'Nuh-uh', 'New'],
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
        photo: action.payload.photo || null,
      };
      state.leads.push(newLead);
    },
    updateLead: (state, action) => {
      const index = state.leads.findIndex(lead => lead.id === action.payload.id);
      if (index !== -1) {
        state.leads[index] = {
          ...state.leads[index],
          ...action.payload,
          photo: action.payload.photo || state.leads[index].photo,
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
      const index = state.leads.findIndex(lead => lead.id === leadId);
      if (index !== -1) {
        const updatedLeads = [...state.leads];
        updatedLeads[index] = {
          ...updatedLeads[index],
          alertTime: newAlertTime,
          notificationId: notificationId
        };
        state.leads = updatedLeads;
      }
    },
    deleteResponse: (state, action) => {
      const { leadId, responseIndex } = action.payload;
      const lead = state.leads.find(lead => lead.id === leadId);
      if (lead && lead.responses) {
        lead.responses.splice(responseIndex, 1);
      }
    },
  },
});

export const { addLead, updateLead, deleteLead, addResponse, rescheduleAlert, deleteResponse } = leadSlice.actions;
export default leadSlice.reducer; 