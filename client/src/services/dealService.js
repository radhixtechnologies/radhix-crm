import axios from 'axios';

const API_URL = 'http://localhost:5000/api/deals';

// Get auth token from localStorage
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

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

    return axios.get(`${API_URL}?${params.toString()}`, {
        headers: getAuthHeader()
    });
};

// Get single deal by ID
export const getDealById = async (id) => {
    return axios.get(`${API_URL}/${id}`, {
        headers: getAuthHeader()
    });
};

// Create new deal
export const createDeal = async (dealData) => {
    return axios.post(API_URL, dealData, {
        headers: getAuthHeader()
    });
};

// Update deal
export const updateDeal = async (id, dealData) => {
    return axios.put(`${API_URL}/${id}`, dealData, {
        headers: getAuthHeader()
    });
};

// Delete deal
export const deleteDeal = async (id) => {
    return axios.delete(`${API_URL}/${id}`, {
        headers: getAuthHeader()
    });
};

// Change deal stage (for drag-and-drop)
export const changeDealStage = async (id, stage) => {
    return axios.patch(`${API_URL}/${id}/stage`, { stage }, {
        headers: getAuthHeader()
    });
};

// Change deal status (won/lost)
export const changeDealStatus = async (id, status, lostReason = null, lostNotes = null) => {
    return axios.patch(`${API_URL}/${id}/status`, {
        status,
        lostReason,
        lostNotes
    }, {
        headers: getAuthHeader()
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
