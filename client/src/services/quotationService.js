import api from './api';

export const quotationService = {
    // Get all quotations
    getQuotations: (params = {}) => {
        return api.get('/sales/quotations', { params });
    },

    // Get single quotation
    getQuotation: (id) => {
        return api.get(`/sales/quotations/${id}`);
    },

    // Create quotation
    createQuotation: (data) => {
        return api.post('/sales/quotations', data);
    },

    // Update quotation
    updateQuotation: (id, data) => {
        return api.put(`/sales/quotations/${id}`, data);
    },

    // Send quotation (generates PDF and sends email)
    sendQuotation: (id) => {
        return api.post(`/sales/quotations/${id}/send`);
    },

    // Delete quotation
    deleteQuotation: (id) => {
        return api.delete(`/sales/quotations/${id}`);
    },
};
