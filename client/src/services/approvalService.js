import api from './api';

export const approvalService = {
  // Get pending approvals with optional type filter: 'all' | 'leave' | 'expense' | 'standup' | 'exit'
  getPendingApprovals: (type = 'all') => api.get(`/approvals?type=${type}`),

  // Process approval action: action = 'approve' | 'reject', remarks = string
  processAction: (type, id, action, remarks = '') =>
    api.post(`/approvals/${type}/${id}/action`, { action, remarks }),
};

export default approvalService;

