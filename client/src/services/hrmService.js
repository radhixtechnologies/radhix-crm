import api from './api';

export const hrmService = {
  // ========== RECRUITMENT ==========
  // Job Postings
  getJobPostings: (params) => api.get('/hrm/jobs', { params }),
  getPublicJobPostings: () => api.get('/hrm/jobs/public'),
  getInternalJobPostings: () => api.get('/hrm/jobs/internal'),
  getJobPosting: (id) => api.get(`/hrm/jobs/${id}`),
  createJobPosting: (data) => api.post('/hrm/jobs', data),
  updateJobPosting: (id, data) => api.put(`/hrm/jobs/${id}`, data),
  publishJobPosting: (id) => api.put(`/hrm/jobs/${id}/publish`),
  archiveJobPosting: (id) => api.put(`/hrm/jobs/${id}/archive`),
  deleteJobPosting: (id) => api.delete(`/hrm/jobs/${id}`),
  applyForJob: (id, data) => api.post(`/hrm/jobs/${id}/apply`, data),
  applyForJobInternal: (id, data) => api.post(`/hrm/jobs/${id}/apply-internal`, data),

  // Applicants
  getApplicants: (params) => api.get('/hrm/applicants', { params }),
  getJobApplications: (params) => api.get('/hrm/applicants', { params }), // Alias for backward compatibility
  getApplicant: (id) => api.get(`/hrm/applicants/${id}`),
  updateApplicantStatus: (id, data) => api.put(`/hrm/applicants/${id}/status`, data),
  updateApplicantNotes: (id, data) => api.put(`/hrm/applicants/${id}/notes`, data),
  uploadApplicantDocument: (id, data) => api.post(`/hrm/applicants/${id}/documents`, data),
  updateApplicantEvaluation: (id, data) => api.put(`/hrm/applicants/${id}/evaluation`, data),
  scheduleInterview: (id, data) => api.post(`/hrm/applicants/${id}/schedule-interview`, data),
  getMyInterviews: () => api.get('/hrm/interviews/my-interviews'),
  generateOffer: (id, data) => api.post(`/hrm/applicants/${id}/generate-offer`, data),
  hireApplicant: (id, data) => api.post(`/hrm/applicants/${id}/hire`, data),

  // ========== OFFERS ==========
  getMyOffers: () => api.get('/hrm/offers/my'),
  getOffers: (params) => api.get('/hrm/offers', { params }),
  getOffer: (id) => api.get(`/hrm/offers/${id}`),
  createOffer: (data) => api.post('/hrm/offers', data),
  updateOffer: (id, data) => api.put(`/hrm/offers/${id}`, data),
  submitOffer: (id) => api.put(`/hrm/offers/${id}/submit`),
  decideOffer: (id, data) => api.put(`/hrm/offers/${id}/decide`, data),
  generateOfferPDF: (id) => api.post(`/hrm/offers/${id}/generate-pdf`),
  sendOffer: (id) => api.post(`/hrm/offers/${id}/send`),
  withdrawOffer: (id, data) => api.put(`/hrm/offers/${id}/withdraw`, data),
  createEmployeeFromOffer: (id) => api.post(`/hrm/offers/${id}/create-employee`),

  // ========== OFFER TEMPLATES ==========
  getOfferTemplates: (params) => api.get('/hrm/offer-templates', { params }),
  getOfferTemplate: (id) => api.get(`/hrm/offer-templates/${id}`),
  createOfferTemplate: (data) => api.post('/hrm/offer-templates', data),
  updateOfferTemplate: (id, data) => api.put(`/hrm/offer-templates/${id}`, data),
  deleteOfferTemplate: (id) => api.delete(`/hrm/offer-templates/${id}`),
  getDefaultTemplate: (category) => api.get(`/hrm/offer-templates/default/${category}`),

  // ========== CANDIDATE PORTAL ==========
  getCandidateApplications: () => api.get('/hrm/candidate/my-applications'),

  // ========== ONBOARDING ==========
  getOnboardingTasks: (employeeId) => api.get(`/hrm/onboard/${employeeId}`),
  createOnboardingTasks: (employeeId, data) => api.post(`/hrm/onboard/${employeeId}/tasks`, data),
  updateOnboardingTask: (id, data) => api.put(`/hrm/onboard/tasks/${id}`, data),
  completeOnboarding: (employeeId) => api.post(`/hrm/onboard/${employeeId}/complete`),
  getNewHireChecklist: (employeeId) => api.get(`/hrm/onboard/${employeeId}/checklist`),

  // ========== PERFORMANCE ==========
  // Goals
  getGoals: (params) => api.get('/hrm/goals', { params }),
  getGoal: (id) => api.get(`/hrm/goals/${id}`),
  createGoal: (data) => api.post('/hrm/goals', data),
  updateGoal: (id, data) => api.put(`/hrm/goals/${id}`, data),

  // Reviews
  getReviews: (params) => api.get('/hrm/reviews', { params }),
  createReview: (data) => api.post('/hrm/reviews', data),
  updateReview: (id, data) => api.put(`/hrm/reviews/${id}`, data),
  submitSelfAssessment: (id, data) => api.post(`/hrm/reviews/${id}/self-assessment`, data),
  submitManagerAssessment: (id, data) => api.post(`/hrm/reviews/${id}/manager-assessment`, data),
  getEmployeeReviews: (employeeId) => api.get(`/hrm/reviews/employee/${employeeId}`),

  // Legacy performance (backward compatibility)
  getPerformanceReviews: (params) => api.get('/hrm/performance', { params }),
  getPerformanceReview: (id) => api.get(`/hrm/performance/${id}`),
  createPerformanceReview: (data) => api.post('/hrm/performance', data),
  updatePerformanceReview: (id, data) => api.put(`/hrm/performance/${id}`, data),

  // ========== TRAINING ==========
  getTrainings: (params) => api.get('/hrm/trainings', { params }),
  getTrainingCatalog: () => api.get('/hrm/trainings/catalog'),
  getTraining: (id) => api.get(`/hrm/trainings/${id}`),
  createTraining: (data) => api.post('/hrm/trainings', data),
  updateTraining: (id, data) => api.put(`/hrm/trainings/${id}`, data),
  enrollInTraining: (id, data) => api.post(`/hrm/trainings/${id}/enroll`, data),
  updateEnrollment: (id, enrollmentId, data) => api.put(`/hrm/trainings/${id}/enrollments/${enrollmentId}`, data),

  // ========== INTERVIEWS ==========
  getInterviews: (params) => api.get('/hrm/interviews', { params }),
  getInterview: (id) => api.get(`/hrm/interviews/${id}`),
  scheduleNewInterview: (data) => api.post('/hrm/interviews', data),
  updateInterview: (id, data) => api.put(`/hrm/interviews/${id}`, data),
  evaluateInterview: (id, data) => api.post(`/hrm/interviews/${id}/evaluate`, data),
  rescheduleInterview: (id, data) => api.put(`/hrm/interviews/${id}/reschedule`, data),

  // ========== SKILLS ==========
  getSkills: (params) => api.get('/hrm/skills', { params }),
  getMySkills: (params) => api.get('/hrm/skills/my', { params }), // Employee - own skills only
  getSkill: (id) => api.get(`/hrm/skills/${id}`),
  createSkill: (data) => api.post('/hrm/skills', data),
  updateSkill: (id, data) => api.put(`/hrm/skills/${id}`, data),
  deleteSkill: (id) => api.delete(`/hrm/skills/${id}`),
  verifySkill: (id) => api.put(`/hrm/skills/${id}/verify`),
  assessSkill: (id, data) => api.post(`/hrm/skills/${id}/assess`, data),
  addSkillEvidence: (id, data) => api.post(`/hrm/skills/${id}/evidence`, data),
  getCertificationsExpiring: (params) => api.get('/hrm/skills/certifications/expiring', { params }),
  getSkillRecommendations: (employeeId) => api.get(`/hrm/skills/recommendations/${employeeId}`),
  getSkillMatrix: (params) => api.get('/hrm/skills/matrix', { params }), // Admin only

  // ========== SKILL REQUESTS ==========
  createSkillRequest: (data) => api.post('/hrm/skill-requests', data),
  getMySkillRequests: (params) => api.get('/hrm/skill-requests/my', { params }),
  getSkillRequest: (id) => api.get(`/hrm/skill-requests/${id}`),

  // ========== SKILL LIBRARY ==========
  getSkillLibrary: (params) => api.get('/hrm/skill-library', { params }),
  getSkillLibraryItem: (id) => api.get(`/hrm/skill-library/${id}`),
  createSkillLibraryItem: (data) => api.post('/hrm/skill-library', data),
  updateSkillLibraryItem: (id, data) => api.put(`/hrm/skill-library/${id}`, data),
  deleteSkillLibraryItem: (id) => api.delete(`/hrm/skill-library/${id}`),
  getSkillsByRole: (role, params) => api.get(`/hrm/skill-library/by-role/${role}`, { params }),
  linkTrainingToSkill: (id, data) => api.post(`/hrm/skill-library/${id}/link-training`, data),

  // ========== SKILL GAPS ==========
  analyzeSkillGaps: (employeeId) => api.post(`/hrm/skill-gaps/analyze/${employeeId}`),
  getSkillGaps: (params) => api.get('/hrm/skill-gaps', { params }),
  getSkillGap: (id) => api.get(`/hrm/skill-gaps/${id}`),
  updateSkillGap: (id, data) => api.put(`/hrm/skill-gaps/${id}`, data),
  closeSkillGap: (id) => api.put(`/hrm/skill-gaps/${id}/close`),
  getSkillGapsByDepartment: (dept) => api.get(`/hrm/skill-gaps/department/${dept}`),
  getSkillGapSummary: () => api.get('/hrm/skill-gaps/reports/summary'),


  // ========== EXIT MANAGEMENT ==========
  submitExitRequest: (data) => api.post('/hrm/exit', data),
  getExitRequests: (params) => api.get('/hrm/exit', { params }),
  getExitRequest: (id) => api.get(`/hrm/exit/${id}`),
  approveExitRequest: (id, data) => api.put(`/hrm/exit/${id}/approve`, data),
  conductExitInterview: (id, data) => api.post(`/hrm/exit/${id}/interview`, data),
  updateExitChecklist: (id, data) => api.put(`/hrm/exit/${id}/checklist`, data),
  calculateFinalSettlement: (id) => api.post(`/hrm/exit/${id}/settlement`),
  getFinalSettlement: (id) => api.get(`/hrm/exit/${id}/settlement`),
  approveSettlement: (id) => api.put(`/hrm/settlement/${id}/approve`),
  processSettlement: (id, data) => api.put(`/hrm/settlement/${id}/process`, data),
  generateExitDocuments: (id) => api.post(`/hrm/exit/${id}/documents`),
  processSystemExit: (id) => api.post(`/hrm/exit/${id}/system-exit`),

  // ========== LIFECYCLE ==========
  createLifecycleEvent: (data) => api.post('/hrm/lifecycle', data),
  getLifecycleEvents: (params) => api.get('/hrm/lifecycle', { params }),
  getEmployeeTimeline: (employeeId) => api.get(`/hrm/lifecycle/employee/${employeeId}/timeline`),
  getLifecycleEvent: (id) => api.get(`/hrm/lifecycle/${id}`),
  updateLifecycleEvent: (id, data) => api.put(`/hrm/lifecycle/${id}`, data),
  approveLifecycleEvent: (id) => api.put(`/hrm/lifecycle/${id}/approve`),

  // ========== POLICIES ==========
  getPolicies: (params) => api.get('/hrm/policies', { params }),
  getPolicy: (id) => api.get(`/hrm/policies/${id}`),
  createPolicy: (data) => api.post('/hrm/policies', data),
  updatePolicy: (id, data) => api.put(`/hrm/policies/${id}`, data),
  deletePolicy: (id) => api.delete(`/hrm/policies/${id}`),
  publishPolicy: (id) => api.post(`/hrm/policies/${id}/publish`),
  createNewPolicyVersion: (id, data) => api.post(`/hrm/policies/${id}/new-version`, data),
  sendPolicyReminders: (id) => api.post(`/hrm/policies/${id}/send-reminders`),
  getVersionHistory: (id) => api.get(`/hrm/policies/${id}/versions`),
  getComplianceReport: (id) => api.get(`/hrm/policies/${id}/compliance-report`),
  acknowledgePolicy: (id) => api.post(`/hrm/policies/${id}/acknowledge`),
  getAcknowledgmentStatus: (id) => api.get(`/hrm/policies/${id}/acknowledgment-status`),
  getDocumentCenter: () => api.get('/hrm/policies/document-center'),

  // ========== REPORTS ==========
  getHeadcountReport: (params) => api.get('/hrm/reports/headcount', { params }),
  getAttritionReport: (params) => api.get('/hrm/reports/attrition', { params }),
  getAttendanceReport: (params) => api.get('/hrm/reports/attendance', { params }),
  getLeaveReport: (params) => api.get('/hrm/reports/leave', { params }),
  getHiringFunnelReport: (params) => api.get('/hrm/reports/hiring-funnel', { params }),

  // ========== ANALYTICS ==========
  getHRAnalyticsDashboard: (params) => api.get('/hrm/analytics/dashboard', { params }),

  // ========== ADMIN MIGRATIONS (One-time fixes) ==========
  fixInterviewHistory: () => api.post('/hrm/admin/fix-interview-history'),

  // ========== EXIT MANAGEMENT ==========
  // Resignation
  submitResignation: (data) => api.post('/hrm/exit', data),
  getMyExitRequests: () => api.get('/hrm/exit', { params: { employeeId: 'me' } }),
  getAllExitRequests: (params) => api.get('/hrm/exit', { params }),
  getExitRequest: (id) => api.get(`/hrm/exit/${id}`),
  approveExitRequest: (id, data) => api.put(`/hrm/exit/${id}/approve`, data),
  requestEarlyRelease: (id, data) => api.post(`/hrm/exit/${id}/early-release`, data),
  getPendingApprovals: () => api.get('/hrm/exit/pending-approvals'),

  // Exit Tasks
  getExitTasks: (exitId) => api.get(`/hrm/exit/${exitId}/tasks`),
  createExitTask: (exitId, data) => api.post(`/hrm/exit/${exitId}/tasks`, data),
  updateExitTask: (taskId, data) => api.put(`/hrm/exit/tasks/${taskId}`, data),
  completeExitTask: (taskId, data) => api.post(`/hrm/exit/tasks/${taskId}/complete`, data),
  getMyExitTasks: () => api.get('/hrm/exit/my-tasks'),

  // Asset Recovery
  getAssetRecovery: (exitId) => api.get(`/hrm/exit/${exitId}/assets`),
  updateAssetRecovery: (exitId, data) => api.put(`/hrm/exit/${exitId}/assets`, data),
  giveAssetClearance: (exitId, data) => api.post(`/hrm/exit/${exitId}/assets/clearance`, data),

  // Exit Interview
  submitExitInterview: (exitId, data) => api.post(`/hrm/exit/${exitId}/interview`, data),
  getExitInterview: (exitId) => api.get(`/hrm/exit/${exitId}/interview`),
  getAllExitInterviews: (params) => api.get('/hrm/exit/interviews', { params }),

  // FnF Settlement
  calculateFnF: (exitId, data) => api.post(`/hrm/exit/${exitId}/settlement`, data),
  getFnFSettlement: (exitId) => api.get(`/hrm/exit/${exitId}/settlement`),
  approveFnF: (settlementId) => api.put(`/hrm/settlement/${settlementId}/approve`),
  processFnF: (settlementId, data) => api.put(`/hrm/settlement/${settlementId}/process`, data),
};
