import axios from 'axios';

const API_URL = 'http://localhost:5000/api/pipeline-stages';

// Get auth token from localStorage
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get all pipeline stages
export const getStages = async (includeInactive = false) => {
    const params = includeInactive ? '?includeInactive=true' : '';
    return axios.get(`${API_URL}${params}`, {
        headers: getAuthHeader()
    });
};

// Create new stage (Admin only)
export const createStage = async (stageData) => {
    return axios.post(API_URL, stageData, {
        headers: getAuthHeader()
    });
};

// Update stage (Admin only)
export const updateStage = async (id, stageData) => {
    return axios.put(`${API_URL}/${id}`, stageData, {
        headers: getAuthHeader()
    });
};

// Delete stage (Admin only)
export const deleteStage = async (id) => {
    return axios.delete(`${API_URL}/${id}`, {
        headers: getAuthHeader()
    });
};

// Reorder stages (Admin only)
export const reorderStages = async (stages) => {
    return axios.patch(`${API_URL}/reorder`, { stages }, {
        headers: getAuthHeader()
    });
};

const pipelineStageService = {
    getStages,
    createStage,
    updateStage,
    deleteStage,
    reorderStages
};

export default pipelineStageService;
