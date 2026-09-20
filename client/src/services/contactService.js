import api from './api';

export const contactService = {
    // Contact services
    getContacts: (params) => api.get('/contacts', { params }),
    getContact: (id) => api.get(`/contacts/${id}`),
    createContact: (data) => api.post('/contacts', data),
    updateContact: (id, data) => api.put(`/contacts/${id}`, data),
    deleteContact: (id) => api.delete(`/contacts/${id}`),

    // Communication
    addCommunication: (id, data) => api.post(`/contacts/${id}/communication`, data),

    // Notes
    addNote: (id, data) => api.post(`/contacts/${id}/notes`, data),

    // Timeline
    getTimeline: (id) => api.get(`/contacts/${id}/timeline`),

    // Lead conversion
    convertLead: (leadId, data) => api.post(`/contacts/convert-lead/${leadId}`, data),
};
