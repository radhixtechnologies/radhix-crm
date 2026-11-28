import api from './api';

export const growthService = {
  getRoutingConfig: () => api.get('/sales/lead-routing/config'),
  updateRoutingConfig: (data) => api.put('/sales/lead-routing/config', data),
  testRoutingWebhook: (data) => api.post('/sales/lead-routing/test-webhook', data),
  shareQuotationLink: (quotationId) => api.post(`/sales/quotations/${quotationId}/share-link`),
  getPublicQuotation: (token) => api.get(`/public/quotations/${token}`),
  respondPublicQuotation: (token, data) => api.post(`/public/quotations/${token}/respond`, data),
};

export default growthService;
