import api from './api';

export const salesService = {
  // Lead services
  getLeads: (params) => api.get('/sales/leads', { params }),
  getLead: (id) => api.get(`/sales/leads/${id}`),
  createLead: (data) => api.post('/sales/leads', data),
  updateLead: (id, data) => api.put(`/sales/leads/${id}`, data),
  deleteLead: (id) => api.delete(`/sales/leads/${id}`),
  assignLead: (id, employeeId) => api.put(`/sales/leads/${id}/assign`, { employeeId }),
  addLeadNote: (id, content) => api.post(`/sales/leads/${id}/notes`, { content }),
  changeLeadStatus: (id, status) => api.put(`/sales/leads/${id}/status`, { status }),
  addCommunication: (id, data) => api.post(`/sales/leads/${id}/communication`, data),
  convertLead: (id, data) => api.post(`/sales/leads/${id}/convert`, data),

  // Lead Import services
  downloadLeadTemplate: () => api.get('/sales/leads/import/template', { responseType: 'blob' }),
  previewLeadImport: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/sales/leads/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  importLeads: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/sales/leads/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },


  // Client services
  getClients: (params) => api.get('/sales/clients', { params }),
  getClient: (id) => api.get(`/sales/clients/${id}`),
  createClient: (data) => api.post('/sales/clients', data),
  updateClient: (id, data) => api.put(`/sales/clients/${id}`, data),
  deleteClient: (id) => api.delete(`/sales/clients/${id}`),
  addContact: (id, data) => api.post(`/sales/clients/${id}/contacts`, data),
  addClientNote: (id, content) => api.post(`/sales/clients/${id}/notes`, { content }),
  getContacts: (params) => api.get('/contacts', { params }),

  // Deal services
  getDeals: (params) => api.get('/sales/deals', { params }),
  getDeal: (id) => api.get(`/sales/deals/${id}`),
  createDeal: (data) => api.post('/sales/deals', data),
  updateDeal: (id, data) => api.put(`/sales/deals/${id}`, data),
  deleteDeal: (id) => api.delete(`/sales/deals/${id}`),
  changeDealStage: (id, stage, additionalData = {}) => api.patch(`/sales/deals/${id}/stage`, { stage, ...additionalData }),
  addDealNote: (id, content) => api.post(`/sales/deals/${id}/notes`, { content }),

  // Proposal services
  getProposals: (params) => api.get('/sales/proposals', { params }),
  getProposal: (id) => api.get(`/sales/proposals/${id}`),
  createProposal: (data) => api.post('/sales/proposals', data),
  updateProposal: (id, data) => api.put(`/sales/proposals/${id}`, data),
  generateProposalPDF: (id) => api.post(`/sales/proposals/${id}/generate-pdf`),
  emailProposal: (id) => api.post(`/sales/proposals/${id}/email`),
  convertToInvoice: (id) => api.post(`/sales/proposals/${id}/convert-to-invoice`),

  // Quotation services
  getQuotations: (params) => api.get('/sales/quotations', { params }),
  getQuotation: (id) => api.get(`/sales/quotations/${id}`),
  createQuotation: (data) => api.post('/sales/quotations', data),
  updateQuotation: (id, data) => api.put(`/sales/quotations/${id}`, data),
  deleteQuotation: (id) => api.delete(`/sales/quotations/${id}`),
  sendQuotation: (id) => api.post(`/sales/quotations/${id}/send`),
  generateQuotationPDF: (id) => api.post(`/sales/quotations/${id}/generate-pdf`),

  // Follow-up services
  getFollowUps: (params) => api.get('/sales/followups', { params }),
  getFollowUp: (id) => api.get(`/sales/followups/${id}`),
  scheduleFollowUp: (data) => api.post('/sales/followups', data),
  updateFollowUp: (id, data) => api.put(`/sales/followups/${id}`, data),
  deleteFollowUp: (id) => api.delete(`/sales/followups/${id}`),

  // Dashboard services
  getDashboardStats: (params) => api.get('/sales/dashboard/stats', { params }),
};
