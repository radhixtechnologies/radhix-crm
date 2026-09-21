const express = require('express');
const router = express.Router();
const { protect, checkModuleAccess, authorize, requireRole } = require('../middlewares/auth');
const { uploadResume } = require('../utils/upload');

// Recruitment controllers
const {
  getJobPostings,
  getPublicJobPostings,

  getInternalJobPostings,
  getJobPosting,
  createJobPosting,
  updateJobPosting,
  publishJobPosting,
  archiveJobPosting,
  deleteJobPosting,
  applyForJob,
  getApplicants,
  getApplicant,
  updateApplicantStatus,
  updateApplicantNotes,
  uploadApplicantDocument,
  updateApplicantEvaluation,
  scheduleInterview,
  generateOffer,
  hireApplicant,
  getCandidateApplications,
  applyInternal,
  withdrawApplication,
} = require('../controllers/hrm/recruitmentController');

// Migration controllers (one-time fixes)
const {
  fixInterviewHistory,
} = require('../controllers/hrm/migrationController');

// Offer Letter controllers
const {
  getMyOffers,
  getOffers,
  getOffer,
  createOffer,
  updateOffer,
  submitForApproval,
  decideOffer,
  generatePDF,
  sendOffer,
  withdrawOffer,
  getPublicOffer,
  respondToOffer,
  createEmployeeFromOffer,
} = require('../controllers/hrm/offerLetterController');

// Offer Template controllers
const {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getDefaultTemplate,
} = require('../controllers/hrm/offerTemplateController');

// Onboarding controllers
const {
  getOnboardingTasks,
  createOnboardingTasks,
  updateOnboardingTask,
  completeOnboarding,
  getNewHireChecklist,
} = require('../controllers/hrm/onboardingController');

// Performance controllers
const {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  getReviews,
  createReview,
  updateReview,
  submitSelfAssessment,
  submitManagerAssessment,
  getEmployeeReviews,
} = require('../controllers/hrm/performanceController');

// Training controllers
const {
  getTrainings,
  getTraining,
  createTraining,
  updateTraining,
  enrollInTraining,
  updateEnrollment,
  getTrainingCatalog,
} = require('../controllers/hrm/trainingController');

// Report controllers
const {
  getHeadcountReport,
  getAttritionReport,
  getAttendanceReport,
  getLeaveReport,
  getHiringFunnelReport,
  getHRAnalyticsDashboard,
} = require('../controllers/hrm/reportController');

// Interview controllers
const {
  scheduleInterview: scheduleNewInterview,
  getInterviews,
  getInterview,
  updateInterview,
  evaluateInterview,
  rescheduleInterview,
  getMyInterviews,
} = require('../controllers/hrm/interviewController');

// Skill controllers
const {
  getSkills,
  getMySkills,
  getSkill,
  createSkill,
  updateSkill,
  deleteSkill,
  verifySkill,
  assessSkill,
  addSkillEvidence,
  getCertificationsExpiring,
  getSkillRecommendations,
  getSkillMatrix,
} = require('../controllers/hrm/skillController');

// Skill Library controllers
const {
  getSkillLibrary,
  getSkillLibraryItem,
  createSkillLibraryItem,
  updateSkillLibraryItem,
  deleteSkillLibraryItem,
  getSkillsByRole,
  linkTrainingToSkill,
} = require('../controllers/hrm/skillLibraryController');

// Skill Gap controllers
const {
  analyzeSkillGaps,
  getSkillGaps,
  getSkillGap,
  updateSkillGap,
  closeSkillGap,
  getSkillGapsByDepartment,
  getSkillGapSummary,
} = require('../controllers/hrm/skillGapController');

// Skill Request controllers
const {
  createSkillRequest,
  getMySkillRequests,
  getAllSkillRequests,
  getSkillRequest,
  reviewSkillRequest,
  addEvidence,
  verifyEvidence,
  getPendingCount,
  withdrawRequest,
} = require('../controllers/hrm/skillRequestController');

// Skill Configuration controllers
const {
  getConfiguration,
  updateConfiguration,
  resetToDefaults,
  getProficiencyLevels,
} = require('../controllers/hrm/skillConfigurationController');

// Skill Analytics controllers
const {
  getSkillHeatmap,
  getSkillTrends,
  getComplianceDashboard,
  getTrainingROI,
  getGapStatistics,
} = require('../controllers/hrm/skillAnalyticsController');

// Exit controllers
const {
  submitExitRequest,
  getExitRequests,
  getExitRequest,
  approveExitRequest,
  requestEarlyRelease,
  getPendingApprovals,
  conductExitInterview,
  updateExitChecklist,
  calculateFinalSettlement,
  getFinalSettlement,
  approveSettlement,
  processSettlement,
  generateExitDocuments,
  processSystemExit
} = require('../controllers/hrm/exitController');

// Exit Management Extensions
const {
  getExitTasks,
  createExitTask,
  updateExitTask,
  completeExitTask,
  getMyExitTasks,
  getAssetRecovery,
  updateAssetRecovery,
  giveAssetClearance,
  submitExitInterview,
  getExitInterview,
  getAllExitInterviews,
} = require('../controllers/hrm/exitManagementExtensions');

// Lifecycle controllers
const {
  createLifecycleEvent,
  getLifecycleEvents,
  getEmployeeTimeline,
  getLifecycleEvent,
  updateLifecycleEvent,
  approveLifecycleEvent,
} = require('../controllers/hrm/lifecycleController');

// Policy controllers
const {
  getPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
  publishPolicy,
  createNewVersion,
  getVersionHistory,
  getMyPolicies,
  getPendingAcknowledgments,
  acknowledgePolicy,
  getAcknowledgmentStatus,
  getComplianceReport,
  sendReminders,
  checkEnforcement,
  getDocumentCenter,
} = require('../controllers/hrm/policyController');

// Existing HRM controller (keep for backward compatibility)
const {
  getPerformanceReviews,
  getPerformanceReview,
  createPerformanceReview,
  updatePerformanceReview,
} = require('../controllers/hrmController');

// Public routes (before authentication)
router.get('/jobs/public', getPublicJobPostings);
router.post('/jobs/:id/apply', applyForJob); // Public route - applicants can apply without login
router.post('/jobs/:id/apply-internal', protect, uploadResume, applyInternal); // Internal route - employees only

// Public offer routes
router.get('/offers/public/:token', getPublicOffer);
router.post('/offers/public/:token/respond', respondToOffer);

// Protect all other routes
router.use(protect);

// Internal Jobs route - Accessible to all authenticated users (Employees)
router.get('/jobs/internal', getInternalJobPostings);

// Employee Offer Route - Accessible to all authenticated users
// Employee Offer Route - Accessible to all authenticated users
router.get('/offers/my', getMyOffers);

// Candidate routes - Accessible to all authenticated users
router.get('/candidate/my-applications', getCandidateApplications);
router.post('/applications/:id/withdraw', withdrawApplication);
router.get('/interviews/my-interviews', getMyInterviews);

// Training catalog - Accessible to all authenticated users (Employees can browse trainings)
router.get('/trainings/catalog', getTrainingCatalog);

// Training enrollment - Accessible to all authenticated users (Employees can enroll)
router.post('/trainings/:id/enroll', enrollInTraining);
router.get('/trainings/:id', getTraining);

// ========== SKILL SELF-SERVICE ROUTES ==========
// Accessible to all authenticated users (bypassing HR module check)
router.get('/skills/my', getMySkills);
router.post('/skill-requests', createSkillRequest);
router.get('/skill-requests/my', getMySkillRequests);

router.post('/skill-requests/:id/evidence', addEvidence);
router.put('/skill-requests/:id/withdraw', withdrawRequest);
router.get('/skills/matrix', getSkillMatrix); // Must be before /:id

// ========== EXIT MANAGEMENT ROUTES (Accessible to Employees) ==========
router.route('/exit')
  .get(getExitRequests)
  .post(submitExitRequest);

router.get('/exit/pending-approvals', authorize('super_admin', 'admin'), getPendingApprovals);

router.route('/exit/:id')
  .get(getExitRequest);

router.put('/exit/:id/approve', authorize('super_admin', 'admin'), approveExitRequest);
router.post('/exit/:id/early-release', requestEarlyRelease);

// New Admin Exit Routes
router.post('/exit/:id/documents', authorize('super_admin', 'admin'), generateExitDocuments);
router.post('/exit/:id/system-exit', authorize('super_admin', 'admin'), processSystemExit);

// Exit Tasks
router.get('/exit/:id/tasks', getExitTasks);
router.post('/exit/:id/tasks', authorize('super_admin', 'admin'), createExitTask);
router.put('/exit/tasks/:taskId', updateExitTask);
router.post('/exit/tasks/:taskId/complete', completeExitTask);
router.get('/exit/my-tasks', getMyExitTasks);

// Asset Recovery
router.get('/exit/:id/assets', getAssetRecovery);
router.put('/exit/:id/assets', authorize('super_admin', 'admin'), updateAssetRecovery);
router.post('/exit/:id/assets/clearance', authorize('super_admin', 'admin'), giveAssetClearance);

// Exit Interview (Enhanced)
router.post('/exit/:id/interview', authorize('super_admin', 'admin'), submitExitInterview);
router.get('/exit/:id/interview', getExitInterview);
router.get('/exit/interviews', authorize('super_admin', 'admin'), getAllExitInterviews);

// Legacy routes (keep for compatibility)
router.post('/exit/:id/interview-legacy', authorize('super_admin', 'admin'), conductExitInterview);
router.put('/exit/:id/checklist', updateExitChecklist);

// FnF Settlement
router.post('/exit/:id/settlement', authorize('super_admin', 'admin'), calculateFinalSettlement);
router.get('/exit/:id/settlement', getFinalSettlement);
router.put('/settlement/:id/approve', authorize('super_admin', 'admin'), approveSettlement);
router.put('/settlement/:id/process', authorize('super_admin', 'admin'), processSettlement);
router.get('/skills/:id', getSkill); // View single skill details

// ========== POLICY SELF-SERVICE ROUTES (Employee) ==========
router.get('/policies/my', getMyPolicies);
router.get('/policies/my/pending', getPendingAcknowledgments);
router.get('/policies/enforcement/check', checkEnforcement);
router.get('/policies/document-center', getDocumentCenter);

// Allow all employees to view policies (list and details)
router.get('/policies', getPolicies);
router.get('/policies/:id/versions', getVersionHistory);
router.get('/policies/:id/acknowledgment-status', getAcknowledgmentStatus);
router.post('/policies/:id/acknowledge', acknowledgePolicy);
router.get('/policies/:id', getPolicy);

router.use(checkModuleAccess('hrm'));

// ========== RECRUITMENT ROUTES ==========
router.route('/jobs')
  .get(getJobPostings)
  .post(authorize('super_admin', 'admin'), createJobPosting);

router.route('/jobs/:id')
  .get(getJobPosting)
  .put(authorize('super_admin', 'admin'), updateJobPosting)
  .delete(authorize('super_admin', 'admin'), deleteJobPosting);

router.put('/jobs/:id/publish', authorize('super_admin', 'admin'), publishJobPosting);
router.put('/jobs/:id/archive', authorize('super_admin', 'admin'), archiveJobPosting);

router.route('/applicants')
  .get(getApplicants);

router.route('/applicants/:id')
  .get(getApplicant);

router.put('/applicants/:id/status', authorize('super_admin', 'admin'), updateApplicantStatus);
router.put('/applicants/:id/notes', authorize('super_admin', 'admin'), updateApplicantNotes);
router.post('/applicants/:id/documents', authorize('super_admin', 'admin'), uploadApplicantDocument);
router.put('/applicants/:id/evaluation', authorize('super_admin', 'admin'), updateApplicantEvaluation);
router.post('/applicants/:id/schedule-interview', authorize('super_admin', 'admin'), scheduleInterview);
router.post('/applicants/:id/generate-offer', authorize('super_admin', 'admin'), generateOffer);
router.post('/applicants/:id/hire', authorize('super_admin', 'admin'), hireApplicant);

// ========== MIGRATION ROUTES (One-time fixes) ==========
router.post('/admin/fix-interview-history', authorize('super_admin'), fixInterviewHistory);


// ========== OFFER LETTER ROUTES ==========
router.route('/offers')
  .get(getOffers)
  .post(authorize('super_admin', 'admin', 'employee'), createOffer);

router.route('/offers/:id')
  .get(getOffer)
  .put(authorize('super_admin', 'admin', 'employee'), updateOffer);

router.put('/offers/:id/submit', authorize('super_admin', 'admin', 'employee'), submitForApproval);
router.put('/offers/:id/decide', authorize('super_admin', 'admin'), decideOffer);
router.post('/offers/:id/generate-pdf', authorize('super_admin', 'admin', 'employee'), generatePDF);
router.post('/offers/:id/send', authorize('super_admin', 'admin', 'employee'), sendOffer);
router.put('/offers/:id/withdraw', authorize('super_admin', 'admin', 'employee'), withdrawOffer);
router.post('/offers/:id/create-employee', authorize('super_admin', 'admin'), createEmployeeFromOffer);

// ========== OFFER TEMPLATE ROUTES ==========
router.route('/offer-templates')
  .get(getTemplates)
  .post(authorize('super_admin', 'admin'), createTemplate);

router.get('/offer-templates/default/:category', getDefaultTemplate);

router.route('/offer-templates/:id')
  .get(getTemplate)
  .put(authorize('super_admin', 'admin'), updateTemplate)
  .delete(authorize('super_admin', 'admin'), deleteTemplate);

// ========== CANDIDATE PORTAL ROUTES ==========
// Candidate accessing their own data
// ========== CANDIDATE PORTAL ROUTES ==========
// Candidate accessing their own data
// Moved up to accessible section

// ========== INTERVIEW ROUTES ==========
router.route('/interviews')
  .get(getInterviews)
  .post(authorize('super_admin', 'admin'), scheduleNewInterview);

// IMPORTANT: Specific routes must come before parameterized routes
// IMPORTANT: Specific routes must come before parameterized routes
// router.get('/interviews/my-interviews', getMyInterviews); // Moved up

router.route('/interviews/:id')
  .get(getInterview)
  .put(authorize('super_admin', 'admin'), updateInterview);

router.post('/interviews/:id/evaluate', authorize('super_admin', 'admin'), evaluateInterview);
router.put('/interviews/:id/reschedule', authorize('super_admin', 'admin'), rescheduleInterview);


// ========== ONBOARDING ROUTES ==========
router.route('/onboard/:employeeId')
  .get(getOnboardingTasks)
  .post(authorize('super_admin', 'admin'), createOnboardingTasks);

router.post('/onboard/:employeeId/tasks', authorize('super_admin', 'admin'), createOnboardingTasks);

router.get('/onboard/:employeeId/checklist', getNewHireChecklist);
router.post('/onboard/:employeeId/complete', authorize('super_admin', 'admin'), completeOnboarding);

router.put('/onboard/tasks/:id', updateOnboardingTask);

// ========== PERFORMANCE ROUTES ==========
router.route('/goals')
  .get(getGoals)
  .post(authorize('super_admin', 'admin'), createGoal);

router.route('/goals/:id')
  .get(getGoal)
  .put(updateGoal);

router.route('/reviews')
  .get(getReviews)
  .post(authorize('super_admin', 'admin'), createReview);

router.route('/reviews/:id')
  .put(updateReview);

router.post('/reviews/:id/self-assessment', submitSelfAssessment);
router.post('/reviews/:id/manager-assessment', authorize('super_admin', 'admin'), submitManagerAssessment);
router.get('/reviews/employee/:employeeId', getEmployeeReviews);

// Legacy performance routes (keep for backward compatibility)
router.route('/performance')
  .get(getPerformanceReviews)
  .post(authorize('super_admin', 'admin'), createPerformanceReview);

router.route('/performance/:id')
  .get(getPerformanceReview)
  .put(authorize('super_admin', 'admin'), updatePerformanceReview);

// ========== TRAINING ROUTES ==========
router.route('/trainings')
  .get(getTrainings)
  .post(authorize('super_admin', 'admin'), createTraining);

router.put('/trainings/:id', authorize('super_admin', 'admin'), updateTraining);
router.put('/trainings/:id/enrollments/:enrollmentId', updateEnrollment);


// ========== SKILL ROUTES ==========
// Specific routes first (before parameterized routes)

// Admin routes - all skills
router.get('/skills/matrix', authorize('super_admin', 'admin'), getSkillMatrix);
router.get('/skills/certifications/expiring', getCertificationsExpiring);
router.get('/skills/recommendations/:employeeId', getSkillRecommendations);

router.route('/skills')
  .get(getSkills)
  .post(createSkill);

router.route('/skills/:id')
  .put(updateSkill)
  .delete(deleteSkill);

router.get('/skills/:id', getSkill); // Moved to allow employee access (will be added above)

router.put('/skills/:id/verify', authorize('super_admin', 'admin'), verifySkill);
router.post('/skills/:id/assess', authorize('super_admin', 'admin'), assessSkill);
router.post('/skills/:id/evidence', addSkillEvidence);

// ========== SKILL REQUEST ROUTES ==========
// Employee routes moved up for access

router.get('/skill-requests/pending-count', authorize('super_admin', 'admin'), getPendingCount);

// Admin routes - all requests
router.get('/skill-requests', authorize('super_admin', 'admin'), getAllSkillRequests);
router.put('/skill-requests/:id/review', authorize('super_admin', 'admin'), reviewSkillRequest);
router.put('/skill-requests/:id/verify-evidence', authorize('super_admin', 'admin'), verifyEvidence);

router.get('/skill-requests/:id', getSkillRequest); // Moved to allow employee access (will be added above)

// ========== SKILL CONFIGURATION ROUTES (Super Admin only) ==========
router.get('/skills/configuration', authorize('super_admin', 'admin'), getConfiguration);
router.put('/skills/configuration', authorize('super_admin'), updateConfiguration);
router.post('/skills/configuration/reset', authorize('super_admin'), resetToDefaults);
router.get('/skills/proficiency-levels', getProficiencyLevels);

// ========== SKILL ANALYTICS ROUTES (Super Admin only) ==========
router.get('/skills/analytics/heatmap', authorize('super_admin'), getSkillHeatmap);
router.get('/skills/analytics/trends', authorize('super_admin'), getSkillTrends);
router.get('/skills/analytics/compliance', authorize('super_admin'), getComplianceDashboard);
router.get('/skills/analytics/roi', authorize('super_admin'), getTrainingROI);
router.get('/skills/analytics/gaps', authorize('super_admin'), getGapStatistics);

// ========== SKILL LIBRARY ROUTES ==========
router.route('/skill-library')
  .get(getSkillLibrary)
  .post(authorize('super_admin', 'admin'), createSkillLibraryItem);

router.get('/skill-library/by-role/:role', getSkillsByRole);

router.route('/skill-library/:id')
  .get(getSkillLibraryItem)
  .put(authorize('super_admin', 'admin'), updateSkillLibraryItem)
  .delete(authorize('super_admin', 'admin'), deleteSkillLibraryItem);

router.post('/skill-library/:id/link-training', authorize('super_admin', 'admin'), linkTrainingToSkill);

// ========== SKILL GAP ROUTES ==========
router.post('/skill-gaps/analyze/:employeeId', authorize('super_admin', 'admin'), analyzeSkillGaps);
router.get('/skill-gaps/reports/summary', authorize('super_admin', 'admin'), getSkillGapSummary);
router.get('/skill-gaps/department/:dept', authorize('super_admin', 'admin'), getSkillGapsByDepartment);

router.route('/skill-gaps')
  .get(getSkillGaps);

router.route('/skill-gaps/:id')
  .get(getSkillGap)
  .put(authorize('super_admin', 'admin'), updateSkillGap);

router.put('/skill-gaps/:id/close', authorize('super_admin', 'admin'), closeSkillGap);




// ========== LIFECYCLE ROUTES ==========
router.route('/lifecycle')
  .get(getLifecycleEvents)
  .post(authorize('super_admin', 'admin'), createLifecycleEvent);

router.get('/lifecycle/employee/:employeeId/timeline', getEmployeeTimeline);

router.route('/lifecycle/:id')
  .get(getLifecycleEvent)
  .put(authorize('super_admin', 'admin'), updateLifecycleEvent);

router.put('/lifecycle/:id/approve', authorize('super_admin', 'admin'), approveLifecycleEvent);

// ========== POLICY ROUTES (Admin Only) ==========
// Note: Policy viewing routes are in employee self-service section above

// Admin-only policy management
router.post('/policies', authorize('super_admin', 'admin'), createPolicy);
router.post('/policies/:id/publish', authorize('super_admin', 'admin'), publishPolicy);
router.post('/policies/:id/new-version', authorize('super_admin', 'admin'), createNewVersion);
router.post('/policies/:id/send-reminders', authorize('super_admin', 'admin'), sendReminders);
router.get('/policies/:id/compliance-report', authorize('super_admin', 'admin'), getComplianceReport);
router.put('/policies/:id', authorize('super_admin', 'admin'), updatePolicy);
router.delete('/policies/:id', authorize('super_admin', 'admin'), deletePolicy);


// ========== REPORTS ROUTES ==========
// Accessible to super_admin, admin, hrm_admin, and hrm_employee
router.get('/reports/headcount', requireRole('super_admin', 'admin', 'hrm_admin', 'hrm_employee'), getHeadcountReport);
router.get('/reports/attrition', requireRole('super_admin', 'admin', 'hrm_admin', 'hrm_employee'), getAttritionReport);
router.get('/reports/attendance', requireRole('super_admin', 'admin', 'hrm_admin', 'hrm_employee'), getAttendanceReport);
router.get('/reports/leave', requireRole('super_admin', 'admin', 'hrm_admin', 'hrm_employee'), getLeaveReport);
router.get('/reports/hiring-funnel', requireRole('super_admin', 'admin', 'hrm_admin', 'hrm_employee'), getHiringFunnelReport);

// ========== ANALYTICS ROUTES ==========
// Accessible to super_admin, admin, hrm_admin, and hrm_employee
router.get('/analytics/dashboard', requireRole('super_admin', 'admin', 'hrm_admin', 'hrm_employee'), getHRAnalyticsDashboard);

module.exports = router;

