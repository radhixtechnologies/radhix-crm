import api from './api';

export const retailService = {
  getSummary: () => api.get('/retail/summary'),
  getProducts: (params) => api.get('/retail/products', { params }),
  createProduct: (data) => api.post('/retail/products', data),
  updateProduct: (id, data) => api.put(`/retail/products/${id}`, data),
  adjustStock: (id, data) => api.post(`/retail/products/${id}/stock-adjustment`, data),
  getOrders: (params) => api.get('/retail/orders', { params }),
  createOrder: (data) => api.post('/retail/orders', data),
  updateOrder: (id, data) => api.put(`/retail/orders/${id}`, data),
};
