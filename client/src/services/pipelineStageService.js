import api from './api';

const API_URL = '/pipeline-stages';

// Get all pipeline stages
export const getStages = async (includeInactive = false) => {
    const params = includeInactive ? '?includeInactive=true' : '';
    return api.get(`${API_URL}${params}`);
};

// Create new stage (Admin only)
export const createStage = async (stageData) => {
    return api.post(API_URL, stageData);
};

// Update stage (Admin only)
export const updateStage = async (id, stageData) => {
    return api.put(`${API_URL}/${id}`, stageData);
};

// Delete stage (Admin only)
export const deleteStage = async (id) => {
    return api.delete(`${API_URL}/${id}`);
};

// Reorder stages (Admin only)
export const reorderStages = async (stages) => {
    return api.patch(`${API_URL}/reorder`, { stages });
};

const pipelineStageService = {
    getStages,
    createStage,
    updateStage,
    deleteStage,
    reorderStages
};

export default pipelineStageService;
