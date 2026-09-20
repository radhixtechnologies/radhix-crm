import api from './api';

export const supportService = {
    // Ticket services
    getTickets: (params) => api.get('/tickets', { params }),
    getMetrics: () => api.get('/tickets/metrics/overview'),
    getTicket: (id) => api.get(`/tickets/${id}`),
    createTicket: (data) => api.post('/tickets', data),
    updateTicket: (id, data) => api.put(`/tickets/${id}`, data),
    deleteTicket: (id) => api.delete(`/tickets/${id}`),
    addMessage: (id, data) => api.post(`/tickets/${id}/messages`, data),
};
