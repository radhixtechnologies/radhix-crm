import api from './api';

export const manufacturingService = {
  getSummary: () => api.get('/manufacturing/summary'),
  getProducts: (params) => api.get('/manufacturing/products', { params }),
  createProduct: (data) => api.post('/manufacturing/products', data),
  updateProduct: (id, data) => api.put(`/manufacturing/products/${id}`, data),
  adjustStock: (id, data) => api.post(`/manufacturing/products/${id}/stock-adjustment`, data),
  deleteProduct: (id) => api.delete(`/manufacturing/products/${id}`),
  getSuppliers: (params) => api.get('/manufacturing/suppliers', { params }),
  createSupplier: (data) => api.post('/manufacturing/suppliers', data),
  updateSupplier: (id, data) => api.put(`/manufacturing/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/manufacturing/suppliers/${id}`),
  getOrders: (params) => api.get('/manufacturing/orders', { params }),
  createOrder: (data) => api.post('/manufacturing/orders', data),
  updateOrder: (id, data) => api.put(`/manufacturing/orders/${id}`, data),
  deleteOrder: (id) => api.delete(`/manufacturing/orders/${id}`),
};
