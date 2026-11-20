import api from './api';

export const travelService = {
  getSummary: () => api.get('/travel/summary'),
  getPackages: (params) => api.get('/travel/packages', { params }),
  createPackage: (data) => api.post('/travel/packages', data),
  updatePackage: (id, data) => api.put(`/travel/packages/${id}`, data),
  deletePackage: (id) => api.delete(`/travel/packages/${id}`),
  getBookings: (params) => api.get('/travel/bookings', { params }),
  createBooking: (data) => api.post('/travel/bookings', data),
  updateBooking: (id, data) => api.put(`/travel/bookings/${id}`, data),
  deleteBooking: (id) => api.delete(`/travel/bookings/${id}`),
};
