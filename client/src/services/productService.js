import api from './api';

export const productService = {
    // Get all products
    getProducts: (params) => api.get('/inventory/products', { params }),

    // Get single product
    getProduct: (id) => api.get(`/inventory/products/${id}`),

    // Create product
    createProduct: (data) => api.post('/inventory/products', data),

    // Update product
    updateProduct: (id, data) => api.put(`/inventory/products/${id}`, data),

    // Delete product
    deleteProduct: (id) => api.delete(`/inventory/products/${id}`),
};
