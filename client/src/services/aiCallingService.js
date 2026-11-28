import api from './api';

export const STATUS_LABELS = {
  queued: 'Queued',
  ringing: 'Ringing',
  'in-progress': 'In Progress',
  completed: 'Completed',
  'no-answer': 'No Answer',
  busy: 'Busy',
  failed: 'Failed',
};

export const OUTCOME_META = {
  interested: { label: 'Interested (Hot)', cls: 'ai-outcome-interested' },
  callback_requested: { label: 'Callback Requested', cls: 'ai-outcome-callback_requested' },
  not_interested: { label: 'Not Interested', cls: 'ai-outcome-not_interested' },
  no_answer: { label: 'No Answer', cls: 'ai-outcome-neutral' },
  busy: { label: 'Line Busy', cls: 'ai-outcome-neutral' },
  voicemail: { label: 'Voicemail', cls: 'ai-outcome-neutral' },
  other: { label: 'Discussed', cls: 'ai-outcome-neutral' },
};

export const formatCallDuration = (seconds) => {
  const num = Number(seconds) || 0;
  if (num <= 0) return '0:00';
  const mins = Math.floor(num / 60);
  const secs = num % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export const aiCallingService = {
  getConfig: () => api.get('/sales/ai-calling/config'),
  updateConfig: (data) => api.put('/sales/ai-calling/config', data),
  testConnection: (data) => api.post('/sales/ai-calling/test-connection', data),
  getCalls: (params = {}) => api.get('/sales/ai-calling/calls', { params }),
  triggerLeadCall: (leadId, data = {}) => api.post(`/sales/leads/${leadId}/ai-call`, data),
  bulkTriggerCalls: (data = {}) => api.post('/sales/leads/bulk/ai-call', data),
  simulateCallComplete: (callId, data = {}) =>
    api.post(`/sales/ai-calling/calls/${callId}/simulate-complete`, data),
};

export default aiCallingService;
