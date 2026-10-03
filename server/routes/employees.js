const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  addDocument,
  deleteDocument,
  addSkill,
  updateSkill,
  deleteSkill,
  checkIn,
  checkOut,
  getAttendance,
  createLeave,
  getLeaves,
  getLeave,
  updateLeave,
  getTasks,
  getTask,
  createTask,
  updateTask,
  submitTask,
  approveTask,
  rejectTask,
} = require('../controllers/employeeController');
const { getAllAttendance } = require('../controllers/attendanceController');
const {
  getTimesheets,
  getTimesheet,
  createTimesheet,
  updateTimesheet,
  deleteTimesheet,
} = require('../controllers/timesheetController');
const { protect, authorize, checkModuleAccess, requireRole } = require('../middlewares/auth');
const { uploadAvatar, uploadDocument, uploadImport } = require('../utils/upload');
const {
  exportEmployeesCSV,
  exportEmployeesExcel,
  exportEmployeesPDF,
  importEmployees,
  previewImport,
  downloadImportTemplate,
  getImportLogs,
} = require('../controllers/employeeImportExportController');
const { getEmployeeStatistics } = require('../controllers/employeeStatisticsController');
const { getCandidateApplications } = require('../controllers/hrm/recruitmentController');

router.use(protect);

// My Applications (for employees to see their job applications)
router.get('/my-applications', getCandidateApplications);

// Note: Specific routes must come before parameterized routes (:id)

// Leaves - Must come before /:id
// Main leave routes (must come before /:id/leaves to avoid route conflicts)
router.post('/leaves', checkModuleAccess('employee'), createLeave);
router.get('/leaves', checkModuleAccess('employee'), getLeaves);
router.get('/leaves/:id', checkModuleAccess('employee'), getLeave); // Get single leave by leave ID
router.put('/leaves/:id', checkModuleAccess('employee'), authorize('super_admin', 'admin'), updateLeave);
// Route for getting leaves for a specific employee (must come after /leaves routes)
router.get('/:id/leaves', checkModuleAccess('employee'), getLeaves);

// Leave Balance & Reports - Must come before /:id
const {
  getLeaveBalance,
  updateLeaveBalance,
  resetLeaveBalance,
  deductLeave,
  getLeaveBalanceSummary,
  getLeaveReports,
} = require('../controllers/leaveBalanceController');
// Leave balance route with :id (must come before /:id route)
router.get('/leave-balance/:id', checkModuleAccess('employee'), getLeaveBalance);
router.get('/leave-reports', checkModuleAccess('employee'), getLeaveReports);
router.get('/leaves/summary', checkModuleAccess('employee'), authorize('super_admin', 'admin'), getLeaveBalanceSummary);

// Leave Allocation routes - Must come before /:id routes
const {
  allocateLeaveToEmployee,
  allocateLeaveToDepartment,
  resetYearlyLeaves,
} = require('../controllers/leaveAllocationController');
router.post('/leave-allocation/reset', checkModuleAccess('employee'), authorize('super_admin', 'admin'), resetYearlyLeaves);
router.post('/department/:dept/leave-allocation', checkModuleAccess('employee'), authorize('super_admin', 'admin'), allocateLeaveToDepartment);

// Tasks - Must come before /:id
router.get('/tasks', checkModuleAccess('employee'), getTasks);
router.get('/tasks/:id', checkModuleAccess('employee'), getTask);
router.post('/tasks', checkModuleAccess('employee'), createTask); // Allow employees to create tasks for themselves
router.put('/tasks/:id', checkModuleAccess('employee'), updateTask);
router.post('/tasks/:id/submit', checkModuleAccess('employee'), submitTask);
router.post('/tasks/:id/approve', checkModuleAccess('employee'), authorize('admin', 'super_admin'), approveTask);
router.post('/tasks/:id/reject', checkModuleAccess('employee'), authorize('admin', 'super_admin'), rejectTask);

// Performance routes have been moved to /api/performance (see routes/performance.js)

// Payroll - Must come before /:id
const {
  getSalarySlips,
  getSalarySlip,
  createSalarySlip,
  getReimbursements,
  getReimbursement,
  createReimbursement,
  updateReimbursement,
  deleteReimbursement,
} = require('../controllers/payrollController');
router.get('/salary-slips', checkModuleAccess('employee'), getSalarySlips);
router.get('/salary-slips/:id', checkModuleAccess('employee'), getSalarySlip);
router.get('/reimbursements', checkModuleAccess('employee'), getReimbursements);
router.get('/reimbursements/:id', checkModuleAccess('employee'), getReimbursement);
router.post('/reimbursements', checkModuleAccess('employee'), createReimbursement);
router.put('/reimbursements/:id', checkModuleAccess('employee'), updateReimbursement);
router.delete('/reimbursements/:id', checkModuleAccess('employee'), deleteReimbursement);

// Employee Dashboard - Must come before /:id
const { getEmployeeDashboard } = require('../controllers/employeeDashboardController');
router.get('/dashboard', checkModuleAccess('employee'), getEmployeeDashboard);

// Attendance routes - MUST come before any /:id routes
// Get all employees attendance (accessible to all, filtered by department in service layer)
router.get('/attendance/all', checkModuleAccess('employee'), getAllAttendance);

// Exit Process - Must come before /:id
const {
  submitResignation,
  updateExitChecklist,
  calculateSettlement,
  getExitProcess,
  cancelResignation,
} = require('../controllers/exitProcessController');
router.post('/:id/resignation', checkModuleAccess('employee'), submitResignation);
router.get('/:id/exit-process', checkModuleAccess('employee'), getExitProcess);
router.put('/:id/exit-checklist', checkModuleAccess('employee'), authorize('super_admin', 'admin'), updateExitChecklist);
router.post('/:id/calculate-settlement', checkModuleAccess('employee'), authorize('super_admin', 'admin'), calculateSettlement);
router.post('/:id/cancel-resignation', checkModuleAccess('employee'), authorize('super_admin', 'admin'), cancelResignation);

// Activity Logs - Must come before /:id
const {
  getActivityLogs,
  getLoginHistory,
  getActivityTimeline,
  getActivityStats,
} = require('../controllers/activityLogController');
router.get('/activity-logs', checkModuleAccess('employee'), getActivityLogs);
router.get('/login-history', checkModuleAccess('employee'), getLoginHistory);
router.get('/:id/activity-logs', checkModuleAccess('employee'), getActivityLogs);
router.get('/:id/login-history', checkModuleAccess('employee'), getLoginHistory);
router.get('/:id/timeline', checkModuleAccess('employee'), getActivityTimeline);
router.get('/:id/activity-stats', checkModuleAccess('employee'), getActivityStats);

// Assets - Must come before /:id
const {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  assignAsset,
  returnAsset,
  addMaintenance,
  updateStatus,
} = require('../controllers/assetController');
router.get('/assets', checkModuleAccess('employee'), getAssets);
router.get('/assets/:id', checkModuleAccess('employee'), getAsset);
router.post('/assets', checkModuleAccess('employee'), authorize('super_admin', 'admin'), createAsset);
router.put('/assets/:id', checkModuleAccess('employee'), authorize('super_admin', 'admin'), updateAsset);
router.delete('/assets/:id', checkModuleAccess('employee'), authorize('super_admin', 'admin'), deleteAsset);
router.post('/assets/:id/assign', checkModuleAccess('employee'), authorize('super_admin', 'admin'), assignAsset);
router.post('/assets/:id/return', checkModuleAccess('employee'), authorize('super_admin', 'admin'), returnAsset);
router.post('/assets/:id/maintenance', checkModuleAccess('employee'), authorize('super_admin', 'admin'), addMaintenance);
router.put('/assets/:id/status', checkModuleAccess('employee'), authorize('super_admin', 'admin'), updateStatus);

// Timesheets - Must come before /:id
// Routes with employee ID parameter must come before main /:id route
router.get('/timesheets', checkModuleAccess('employee'), getTimesheets); // Get timesheets (role-based)
router.get('/timesheets/:id', checkModuleAccess('employee'), getTimesheet); // Get single timesheet
router.post('/timesheets', checkModuleAccess('employee'), createTimesheet); // Create timesheet (for own user)
router.put('/timesheets/:id', checkModuleAccess('employee'), updateTimesheet); // Update timesheet (own timesheet only)
router.delete('/timesheets/:id', checkModuleAccess('employee'), deleteTimesheet); // Delete timesheet (own timesheet only)

// Import/Export - Must come before /:id
router.get('/export/csv', checkModuleAccess('employee'), authorize('super_admin', 'admin'), exportEmployeesCSV);
router.get('/export/excel', checkModuleAccess('employee'), authorize('super_admin', 'admin'), exportEmployeesExcel);
router.get('/export/pdf', checkModuleAccess('employee'), authorize('super_admin', 'admin'), exportEmployeesPDF);
router.get('/import/template', checkModuleAccess('employee'), authorize('super_admin', 'admin'), downloadImportTemplate);
router.get('/import/logs', checkModuleAccess('employee'), authorize('super_admin', 'admin'), getImportLogs);
router.post('/import/preview', checkModuleAccess('employee'), authorize('super_admin', 'admin'), uploadImport, previewImport);
router.post('/import', checkModuleAccess('employee'), authorize('super_admin', 'admin'), uploadImport, importEmployees);

// Statistics - Must come before /:id
router.get('/statistics', checkModuleAccess('employee'), authorize('super_admin', 'admin'), getEmployeeStatistics);

// Employee CRUD
// Note: Super Admin has access to all modules automatically
router.get('/', checkModuleAccess('employee'), getEmployees);
router.post('/', checkModuleAccess('employee'), authorize('super_admin', 'admin'), createEmployee);

// Leave Allocation route with :id (must come before /:id route but after /department/:dept route)
router.post('/:id/leave-allocation', checkModuleAccess('employee'), authorize('super_admin', 'admin'), allocateLeaveToEmployee);

// Leave Balance routes with :id (duplicate route removed - handled above)
router.put('/leave-balance/:id', checkModuleAccess('employee'), authorize('super_admin', 'admin'), updateLeaveBalance);
router.post('/leave-balance/:id/reset', checkModuleAccess('employee'), authorize('super_admin', 'admin'), resetLeaveBalance);
router.post('/leave-balance/:id/deduct', checkModuleAccess('employee'), authorize('super_admin', 'admin'), deductLeave);

// Attendance routes - These routes use :id parameter, so they must be placed before router.get('/:id', ...)
router.post('/:id/attendance/checkin', checkIn);
router.post('/:id/attendance/checkout', checkOut);
router.get('/:id/attendance', getAttendance);

// Documents - Must come before /:id
router.post('/:id/documents', checkModuleAccess('employee'), uploadDocument, addDocument);
router.delete('/:id/documents/:docId', checkModuleAccess('employee'), deleteDocument);

// Avatar upload - Must come before /:id
router.post('/:id/avatar', checkModuleAccess('employee'), uploadAvatar, require('../controllers/employeeController').uploadAvatar);

// Skills - Must come before /:id
router.post('/:id/skills', checkModuleAccess('employee'), addSkill);
router.put('/:id/skills/:skillId', checkModuleAccess('employee'), updateSkill);
router.delete('/:id/skills/:skillId', checkModuleAccess('employee'), deleteSkill);

// Parameterized routes come last
router.get('/:id', checkModuleAccess('employee'), getEmployee);
router.put('/:id', checkModuleAccess('employee'), updateEmployee);
router.delete('/:id', checkModuleAccess('employee'), authorize('super_admin', 'admin'), deleteEmployee);

module.exports = router;

