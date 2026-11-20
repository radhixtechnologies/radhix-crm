import api from './api';

const apiBase = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? 'https://radhix-crm.onrender.com/api' : 'http://localhost:5000/api'
);
const mediaBase = apiBase.replace(/\/api\/?$/, '');

export const getRealEstateMediaUrl = (url) => (
  url?.startsWith('http') ? url : `${mediaBase}${url?.startsWith('/') ? url : `/${url || ''}`}`
);

export const realEstateService = {
  getSummary: () => api.get('/real-estate/summary'),
  getProperties: (params) => api.get('/real-estate/properties', { params }),
  getProperty: (id) => api.get(`/real-estate/properties/${id}`),
  createProperty: (data) => api.post('/real-estate/properties', data),
  updateProperty: (id, data) => api.put(`/real-estate/properties/${id}`, data),
  deleteProperty: (id) => api.delete(`/real-estate/properties/${id}`),
  uploadPropertyPhotos: (id, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));
    return api.post(`/real-estate/properties/${id}/photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deletePropertyPhoto: (id, photoId) => api.delete(`/real-estate/properties/${id}/photos/${photoId}`),
  uploadPropertyDocument: (id, file, name) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('name', name);
    return api.post(`/real-estate/properties/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deletePropertyDocument: (id, documentId) => api.delete(`/real-estate/properties/${id}/documents/${documentId}`),
  getSiteVisits: (params) => api.get('/real-estate/site-visits', { params }),
  createSiteVisit: (data) => api.post('/real-estate/site-visits', data),
  updateSiteVisit: (id, data) => api.put(`/real-estate/site-visits/${id}`, data),
  deleteSiteVisit: (id) => api.delete(`/real-estate/site-visits/${id}`),
  getOffers: (params) => api.get('/real-estate/offers', { params }),
  createOffer: (data) => api.post('/real-estate/offers', data),
  updateOffer: (id, data) => api.put(`/real-estate/offers/${id}`, data),
  getBookings: (params) => api.get('/real-estate/bookings', { params }),
  updateBooking: (id, data) => api.put(`/real-estate/bookings/${id}`, data),
};
