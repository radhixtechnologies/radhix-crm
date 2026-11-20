import api from './api';

export const brandingService = {
  getBranding: () => api.get('/branding'),
  getPublicBranding: (slug) => api.get(`/branding/public${slug ? `?slug=${slug}` : ''}`),
  updateBranding: (data) => api.put('/branding', data),
  resetBranding: () => api.post('/branding/reset'),
};

export default brandingService;

