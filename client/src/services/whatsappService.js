import api from './api';

export const whatsappService = {
  // Campaigns
  getCampaigns: (params) => api.get('/marketing/whatsapp/campaigns', { params }),
  
  // Templates
  getTemplates: () => api.get('/marketing/whatsapp/templates'),
  createTemplate: (data) => api.post('/marketing/whatsapp/templates', data),
  
  // Messaging
  sendSingle: (data) => api.post('/marketing/whatsapp/send-single', data),
  sendBroadcast: (data) => api.post('/marketing/whatsapp/broadcast', data),
  
  // Meta API status
  getStatus: () => api.get('/marketing/whatsapp/status'),
};
