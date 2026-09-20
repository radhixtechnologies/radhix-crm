import api from './api';

export const searchService = {
    globalSearch: (query) => api.get(`/search?query=${query}`),
};
