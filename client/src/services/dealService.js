import api from './api';

const API_URL = '/deals';

// Get all deals with filters
export const getDeals = async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.stage) params.append('stage', filters.stage);
    if (filters.status) params.append('status', filters.status);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters.source) params.append('source', filters.source);
    if (filters.search) params.append('search', filters.search);
    if (filters.minValue) params.append('minValue', filters.minValue);
    if (filters.maxValue) params.append('maxValue', filters.maxValue);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    return api.get(`${API_URL}?${params.toString()}`);
};

// Get single deal by ID
export const getDealById = async (id) => {
    return api.get(`${API_URL}/${id}`);
};

// Create new deal
export const createDeal = async (dealData) => {
    return api.post(API_URL, dealData);
};

// Update deal
export const updateDeal = async (id, dealData) => {
    return api.put(`${API_URL}/${id}`, dealData);
};

// Delete deal
export const deleteDeal = async (id) => {
    return api.delete(`${API_URL}/${id}`);
};

// Change deal stage (for drag-and-drop)
export const changeDealStage = async (id, stage) => {
    return api.patch(`${API_URL}/${id}/stage`, { stage });
};

// Change deal status (won/lost)
export const changeDealStatus = async (id, status, lostReason = null, lostNotes = null) => {
    return api.patch(`${API_URL}/${id}/status`, {
        status,
        lostReason,
        lostNotes
    });
};

const dealService = {
    getDeals,
    getDealById,
    createDeal,
    updateDeal,
    deleteDeal,
    changeDealStage,
    changeDealStatus
};

export default dealService;
