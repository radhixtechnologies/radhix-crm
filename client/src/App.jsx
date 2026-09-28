import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import { QuickActionsProvider } from './context/QuickActionsContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import Breadcrumbs from './components/common/Breadcrumbs';

// Auth
const Login = lazy(() => import('./pages/auth/Login'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const ChangePassword = lazy(() => import('./pages/auth/ChangePassword'));

// Dashboard
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ReportsDashboard = lazy(() => import('./pages/reports/ReportsDashboard'));

// Employee
const EmployeeProfile = lazy(() => import('./pages/employee/EmployeeProfile'));
const Attendance = lazy(() => import('./pages/employee/Attendance'));
const MyAttendance = lazy(() => import('./pages/employee/MyAttendance'));
const MyLeaves = lazy(() => import('./pages/employee/MyLeaves'));
const HRMLeaves = lazy(() => import('./pages/hrm/HRMLeaves'));
const Leaves = lazy(() => import('./pages/employee/Leaves'));
const Tasks = lazy(() => import('./pages/employee/Tasks'));
const Timesheets = lazy(() => import('./pages/employee/Timesheets'));
const LeaveBalance = lazy(() => import('./pages/employee/LeaveBalance'));
const Performance = lazy(() => import('./pages/employee/MyPerformanceReview'));
const Payroll = lazy(() => import('./pages/employee/Payroll'));
const Assets = lazy(() => import('./pages/employee/Assets'));
const ExitProcess = lazy(() => import('./pages/employee/ExitProcess'));
const ActivityLogs = lazy(() => import('./pages/employee/ActivityLogs'));
const MySalarySlips = lazy(() => import('./pages/employee/MySalarySlips'));
const Reimbursements = lazy(() => import('./pages/employee/Reimbursements'));
const EmployeeReports = lazy(() => import('./pages/employee/EmployeeReports'));
const EmployeeStatistics = lazy(() => import('./pages/employee/EmployeeStatistics'));
const EmployeeImportExport = lazy(() => import('./pages/employee/EmployeeImportExport'));

// Add Employee
const AddEmployee = lazy(() => import('./pages/Employees/AddEmployee'));
const EditEmployee = lazy(() => import('./pages/Employees/EditEmployee'));

// Finance
const FinanceDashboard = lazy(() => import('./pages/finance/FinanceDashboard'));
const InvoiceList = lazy(() => import('./pages/finance/InvoiceList.jsx'));
const AddInvoice = lazy(() => import('./pages/finance/AddInvoice'));
const InvoiceDetails = lazy(() => import('./pages/finance/InvoiceDetails'));
const ExpenseList = lazy(() => import('./pages/finance/ExpenseList'));
const AddExpense = lazy(() => import('./pages/finance/AddExpense'));
const ExpenseDetail = lazy(() => import('./pages/finance/ExpenseDetail'));
const PayrollList = lazy(() => import('./pages/finance/PayrollList'));
const GeneratePayroll = lazy(() => import('./pages/finance/GeneratePayroll'));
const GenerateSalarySlip = lazy(() => import('./pages/finance/GenerateSalarySlip'));
const SalarySlipList = lazy(() => import('./pages/finance/SalarySlipList'));
const SalaryStructureList = lazy(() => import('./pages/finance/SalaryStructureList'));
const SalaryStructureForm = lazy(() => import('./pages/finance/SalaryStructureForm'));
const SalaryStructureDetail = lazy(() => import('./pages/finance/SalaryStructureDetail'));
const FinanceReports = lazy(() => import('./pages/finance/FinanceReports'));
const TaxSettings = lazy(() => import('./pages/finance/TaxSettings'));
const Payments = lazy(() => import('./pages/finance/Payments'));
const RecordPayment = lazy(() => import('./pages/finance/RecordPayment'));
const PaymentDetails = lazy(() => import('./pages/finance/PaymentDetails'));

// Inventory
const ProductList = lazy(() => import('./pages/inventory/ProductList'));
const AddProduct = lazy(() => import('./pages/inventory/AddProduct'));

// Sales
const SalesDashboard = lazy(() => import('./pages/sales/SalesDashboard'));
const LeadList = lazy(() => import('./pages/sales/LeadList'));
const AddLead = lazy(() => import('./pages/sales/AddLead'));
const LeadDetails = lazy(() => import('./pages/sales/LeadDetails'));
const LeadTracking = lazy(() => import('./pages/sales/LeadTracking'));
const ClientList = lazy(() => import('./pages/sales/ClientList'));
const AddClient = lazy(() => import('./pages/sales/AddClient'));
const ClientDetails = lazy(() => import('./pages/sales/ClientDetails'));
const SalesPipeline = lazy(() => import('./pages/sales/SalesPipeline'));
const Deals = lazy(() => import('./pages/sales/Deals'));
const DealDetails = lazy(() => import('./pages/sales/DealDetails'));
const UpdateDeal = lazy(() => import('./pages/sales/UpdateDeal'));
const SalesDocuments = lazy(() => import('./pages/sales/SalesDocuments'));
const AddProposal = lazy(() => import('./pages/sales/AddProposal'));
const ProposalDetails = lazy(() => import('./pages/sales/ProposalDetails'));
const CreateQuotation = lazy(() => import('./pages/sales/CreateQuotation'));
const FollowupList = lazy(() => import('./pages/sales/FollowupList'));

// Contact Management
const ContactList = lazy(() => import('./pages/contacts/ContactList'));
const AddContact = lazy(() => import('./pages/contacts/AddContact'));
const ContactDetails = lazy(() => import('./pages/contacts/ContactDetails'));

// Marketing Module
const CampaignList = lazy(() => import('./pages/marketing/CampaignList'));
const AddCampaign = lazy(() => import('./pages/marketing/AddCampaign'));
const CampaignDetails = lazy(() => import('./pages/marketing/CampaignDetails'));
const MarketingDashboard = lazy(() => import('./pages/marketing/MarketingDashboard'));
const EmailList = lazy(() => import('./pages/marketing/EmailList'));
const SegmentList = lazy(() => import('./pages/marketing/SegmentList'));
const CreateEmail = lazy(() => import('./pages/marketing/CreateEmail'));
const AddSegment = lazy(() => import('./pages/marketing/AddSegment'));
const SegmentDetails = lazy(() => import('./pages/marketing/SegmentDetails'));
const AutomationList = lazy(() => import('./pages/marketing/AutomationList'));
const AddAutomation = lazy(() => import('./pages/marketing/AddAutomation'));
const MarketingReports = lazy(() => import('./pages/marketing/MarketingReports'));

// Support Module
const TicketList = lazy(() => import('./pages/support/TicketList'));
const AddTicket = lazy(() => import('./pages/support/AddTicket'));
const TicketDetails = lazy(() => import('./pages/support/TicketDetails'));

const CalendarView = lazy(() => import('./pages/activities/CalendarView'));

// HRM
const HRMDashboard = lazy(() => import('./pages/hrm/HRMDashboard'));
const HRMAttendance = lazy(() => import('./pages/hrm/HRMAttendance'));
const HRAnalyticsDashboard = lazy(() => import('./pages/hrm/Analytics/HRAnalyticsDashboard'));
const PolicyCenter = lazy(() => import('./pages/hrm/Policies/PolicyCenter'));
const PolicyList = lazy(() => import('./pages/hrm/Policies/PolicyList'));
const PolicyDetails = lazy(() => import('./pages/hrm/Policies/PolicyDetails'));
const EmployeePolicyView = lazy(() => import('./pages/hrm/Policies/EmployeePolicyView'));
const PolicyForm = lazy(() => import('./pages/hrm/Policies/PolicyForm'));
const SkillMatrix = lazy(() => import('./pages/hrm/Skills/SkillMatrix'));
const MySkills = lazy(() => import('./pages/hrm/Skills/MySkills'));
const AddEditSkill = lazy(() => import('./pages/hrm/Skills/AddEditSkill'));
const SkillDetails = lazy(() => import('./pages/hrm/Skills/SkillDetails'));
const EmployeeSkillProfile = lazy(() => import('./pages/hrm/Skills/EmployeeSkillProfile'));
const ExitManagement = lazy(() => import('./pages/hrm/Exit/ExitManagement'));
const SubmitResignation = lazy(() => import('./pages/hrm/Exit/SubmitResignation'));
const ExitDashboard = lazy(() => import('./pages/hrm/Exit/ExitDashboard'));
const ExitRequestDetails = lazy(() => import('./pages/hrm/Exit/ExitRequestDetails'));
const PerformanceDashboard = lazy(() => import('./pages/hrm/Performance/PerformanceDashboard'));
const SelfAssessment = lazy(() => import('./pages/hrm/Performance/SelfAssessment'));
const ManagerReview = lazy(() => import('./pages/hrm/Performance/ManagerReview'));
const GoalsList = lazy(() => import('./pages/hrm/Performance/GoalsList'));
const OnboardingDashboard = lazy(() => import('./pages/hrm/Onboarding/OnboardingDashboard'));
const OnboardingTasks = lazy(() => import('./pages/hrm/Onboarding/OnboardingTasks'));
const NewHireChecklist = lazy(() => import('./pages/hrm/Onboarding/NewHireChecklist'));
const JobList = lazy(() => import('./pages/hrm/Recruitment/JobList'));
const AddJob = lazy(() => import('./pages/hrm/Recruitment/AddJob'));
const JobDetails = lazy(() => import('./pages/hrm/Recruitment/JobDetails'));
const ApplicantsList = lazy(() => import('./pages/hrm/Recruitment/ApplicantsList'));
const ApplicantDetails = lazy(() => import('./pages/hrm/Recruitment/ApplicantDetails'));
const InterviewScheduling = lazy(() => import('./pages/hrm/Recruitment/InterviewScheduling'));
const OfferList = lazy(() => import('./pages/hrm/Recruitment/OfferList'));
const OfferForm = lazy(() => import('./pages/hrm/Recruitment/OfferForm'));
const SelectApplicantForOffer = lazy(() => import('./pages/hrm/Recruitment/SelectApplicantForOffer'));
const TrainingCatalog = lazy(() => import('./pages/hrm/Training/TrainingCatalog'));
const TrainingDetails = lazy(() => import('./pages/hrm/Training/TrainingDetails'));
const HRReports = lazy(() => import('./pages/hrm/Reports/HRReports'));
const EmployeeTimeline = lazy(() => import('./pages/hrm/Lifecycle/EmployeeTimeline'));
const EmployeeDirectory = lazy(() => import('./pages/hrm/EmployeeDirectory'));

// Settings & Admin
const Settings = lazy(() => import('./pages/settings/Settings'));
const AllGoals = lazy(() => import('./pages/admin/AllGoals'));
const AllReviews = lazy(() => import('./pages/admin/AllReviews'));
const AppraisalCycles = lazy(() => import('./pages/admin/AppraisalCycles'));
const LeaveAllocation = lazy(() => import('./pages/admin/LeaveAllocation'));
const LeaveBalanceOverview = lazy(() => import('./pages/admin/LeaveBalanceOverview'));
const LeaveReports = lazy(() => import('./pages/admin/LeaveReports'));

// Styles
import './styles/design-system.css';
import './styles/globals.css';
import './styles/dashboard.css';
import './styles/forms.css';
import './styles/animations.css';
import './styles/infinity-edition.css';

const Layout = ({ children }) => {
  const { isOpen } = useSidebar();
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className={`main-content ${isOpen ? 'main-content-open' : 'main-content-closed'}`}>
        <Navbar />
        <Breadcrumbs />
        {children}
      </div>
    </div>
  );
};

// Redirect component for /sales route
const SalesRedirect = () => {
  const { isEmployee, isAdmin, isSuperAdmin } = useAuth();

  // Basic employees go to leads, management/admins go to dashboard
  if (isEmployee && !isAdmin && !isSuperAdmin) {
    return <Navigate to="/sales/leads" replace />;
  }

  return <SalesDashboard />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Loading CRM...</div>}>
      <Routes>
        <Route
          path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/forgot-password"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPassword />}
      />
      <Route
        path="/reset-password/:resettoken"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPassword />}
      />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <Layout>
              <ChangePassword />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <ReportsDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Layout>
              <CalendarView />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <EmployeeDirectory />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* Specific routes must come before parameterized route */}
      <Route
        path="/employees/add"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <AddEmployee />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/edit/:id"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <EditEmployee />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/attendance"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <Attendance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/my-attendance"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <MyAttendance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/my-leaves"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <MyLeaves />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/leaves"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <Leaves />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/tasks"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <Tasks />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/timesheets"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <Timesheets />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/leave-balance"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <LeaveBalance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/performance"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <Performance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/payroll"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <Payroll />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/salary-slips"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <MySalarySlips />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/reimbursements"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <Reimbursements />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/reports"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <EmployeeReports />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/statistics"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <EmployeeStatistics />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/import-export"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <EmployeeImportExport />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/assets"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <Assets />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/:id/exit-process"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <ExitProcess />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/:id/activity-logs"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <ActivityLogs />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* My Workspace Routes - Must come before /employees/:id */}
      <Route
        path="/employees/my-attendance"
        element={
          <ProtectedRoute>
            <Layout>
              <MyAttendance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/my-leaves"
        element={
          <ProtectedRoute>
            <Layout>
              <MyLeaves />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/tasks"
        element={
          <ProtectedRoute>
            <Layout>
              <Tasks />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/timesheets"
        element={
          <ProtectedRoute>
            <Layout>
              <Timesheets hrmMode={false} />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/performance"
        element={
          <ProtectedRoute>
            <Layout>
              <Performance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/salary-slips"
        element={
          <ProtectedRoute>
            <Layout>
              <MySalarySlips />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/reimbursements"
        element={
          <ProtectedRoute>
            <Layout>
              <Reimbursements />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={<Navigate to="/employees/me" replace />}
      />
      <Route
        path="/employees/me"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <EmployeeProfile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/:id"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <EmployeeProfile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <FinanceDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/invoices"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <InvoiceList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/invoices/new"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <AddInvoice />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/invoices/:id"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <InvoiceDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/invoices/:id/edit"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <AddInvoice />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/expenses/new"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <AddExpense />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/expenses/:id"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <ExpenseDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/expenses"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <ExpenseList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/payrol"
        element={<Navigate to="/finance/payroll" replace />}
      />
      <Route
        path="/finance/payroll/generate"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <GeneratePayroll />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/payroll"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <PayrollList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/reports"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <FinanceReports />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/salary-slips"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <SalarySlipList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/salary-slips/generate"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <GenerateSalarySlip />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/salary-structures/new"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <SalaryStructureForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/salary-structures/:id/edit"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <SalaryStructureForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/salary-structures/:id"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <SalaryStructureDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/salary-structures"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <SalaryStructureList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/taxes"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <TaxSettings />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Payment Management Routes */}
      <Route
        path="/finance/payments"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <Payments />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/payments/new"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <RecordPayment />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/payments/:id"
        element={
          <ProtectedRoute requiredModule="finance">
            <Layout>
              <PaymentDetails />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Inventory Routes */}
      <Route
        path="/inventory/products"
        element={
          <ProtectedRoute requiredModule="inventory">
            <Layout>
              <ProductList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/products/new"
        element={
          <ProtectedRoute requiredModule="inventory">
            <Layout>
              <AddProduct />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/products/:id/edit"
        element={
          <ProtectedRoute requiredModule="inventory">
            <Layout>
              <AddProduct />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <SalesRedirect />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/leads"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <LeadList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/leads/new"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <AddLead />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/leads/:id"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <LeadDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/leads/:id/edit"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <AddLead />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/leads/tracking"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <LeadTracking />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/clients"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <ClientList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/clients/new"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <AddClient />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/clients/:id"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <ClientDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/clients/:id/edit"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <AddClient />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/pipeline"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <SalesPipeline />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/deals"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <Deals />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/deals/:id"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <DealDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/deals/:id/update"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <UpdateDeal />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/proposals"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <SalesDocuments />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/quotations/new"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <CreateQuotation />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* Fallback for details/edit - to be implemented fully later */}
      <Route
        path="/sales/quotations/:id"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <CreateQuotation /> {/* reuse form for now or need details page */}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/quotations/:id/edit"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <CreateQuotation />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/proposals/new"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <AddProposal />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/proposals/:id"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <ProposalDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/proposals/:id/edit"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <AddProposal />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/followups"
        element={
          <ProtectedRoute requiredModule="sales">
            <Layout>
              <FollowupList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <HRMDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/analytics"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <HRAnalyticsDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* HRM - Recruitment Routes */}
      <Route
        path="/hrm/recruitment/jobs"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <JobList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/recruitment/jobs/new"
        element={
          <ProtectedRoute requiredModule="hrm" requiredRole="super_admin">
            <Layout>
              <AddJob />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/recruitment/jobs/:id/edit"
        element={
          <ProtectedRoute requiredModule="hrm" requiredRole="super_admin">
            <Layout>
              <AddJob />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/recruitment/jobs/:id"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <JobDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/recruitment/applicants"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <ApplicantsList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/recruitment/applicants/:id"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <ApplicantDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/recruitment/applicants/:id/schedule-interview"
        element={
          <ProtectedRoute requiredModule="hrm" requiredRole="super_admin">
            <Layout>
              <InterviewScheduling />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/recruitment/offers"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <OfferList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/recruitment/offers/new"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <SelectApplicantForOffer />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/recruitment/offers/:offerId/edit"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <OfferForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/recruitment/applicants/:applicationId/create-offer"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <OfferForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* HRM - Onboarding Routes */}
      <Route
        path="/hrm/onboarding/:employeeId/tasks"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <OnboardingTasks />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/onboarding/:employeeId/checklist"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <NewHireChecklist />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/onboarding/:employeeId/dashboard"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <OnboardingDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* HRM - Performance Routes */}
      <Route
        path="/hrm/performance/goals"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <GoalsList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/performance"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <PerformanceDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/performance/reviews/:id/self"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <SelfAssessment />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/performance/reviews/:id/manager"
        element={
          <ProtectedRoute requiredModule="hrm" requiredRole="super_admin">
            <Layout>
              <ManagerReview />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* HRM - Training Routes */}
      <Route
        path="/hrm/training"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <TrainingCatalog />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/training/:id"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <TrainingDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* HRM - Skills Routes */}
      <Route
        path="/hrm/skills/my"
        element={
          <ProtectedRoute>
            <Layout>
              <MySkills />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/skills/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <SkillDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/skills/add"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <AddEditSkill />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/skills/employee/:employeeId"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <EmployeeSkillProfile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/skills"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <SkillMatrix />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/exit"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <ExitManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/exit/:id"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <ExitRequestDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* HRM - Reports Routes */}
      <Route
        path="/hrm/reports"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <HRReports />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* HRM - Lifecycle & Directory Routes */}
      <Route
        path="/hrm/lifecycle/employee/:employeeId/timeline"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <EmployeeTimeline />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/timesheets"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <Timesheets hrmMode={true} />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/directory"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <EmployeeDirectory />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* Admin Routes */}
      <Route
        path="/admin/leave-allocation"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <LeaveAllocation />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/leave-balance-overview"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <LeaveBalanceOverview />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/leave-reports"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <LeaveReports />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/all-goals"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <AllGoals />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/all-reviews"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <AllReviews />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/appraisal-cycles"
        element={
          <ProtectedRoute requiredModule="employee">
            <Layout>
              <AppraisalCycles />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredRole="super_admin">
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* Contact Management Routes */}
      <Route
        path="/contacts"
        element={
          <ProtectedRoute>
            <Layout>
              <ContactList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts/new"
        element={
          <ProtectedRoute>
            <Layout>
              <AddContact />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts/edit/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <AddContact />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <ContactDetails />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Marketing Routes */}
      <Route
        path="/marketing"
        element={
          <ProtectedRoute requiredModule="marketing">
            <Layout>
              <MarketingDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/campaigns"
        element={
          <ProtectedRoute requiredModule="marketing">
            <Layout>
              <CampaignList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/campaigns/new"
        element={
          <ProtectedRoute requiredModule="marketing">
            <Layout>
              <AddCampaign />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/campaigns/edit/:id"
        element={
          <ProtectedRoute requiredModule="marketing">
            <Layout>
              <AddCampaign />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/campaigns/:id"
        element={
          <ProtectedRoute requiredModule="marketing">
            <Layout>
              <CampaignDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/emails"
        element={
          <ProtectedRoute requiredModule="marketing">
            <Layout>
              <EmailList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/segments"
        element={
          <ProtectedRoute requiredModule="marketing">
            <Layout>
              <SegmentList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/segments/new"
        element={
          <ProtectedRoute requiredModule="marketing">
            <Layout>
              <AddSegment />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/segments/:id"
        element={
          <ProtectedRoute requiredModule="marketing">
            <Layout>
              <SegmentDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/segments/:id/edit"
        element={
          <ProtectedRoute requiredModule="marketing">
            <Layout>
              <AddSegment />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/automations"
        element={
          <ProtectedRoute requiredModule="marketing">
            <Layout>
              <AutomationList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/automations/new"
        element={
          <ProtectedRoute requiredModule="marketing">
            <Layout>
              <AddAutomation />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/emails/new"
        element={
          <ProtectedRoute requiredModule="marketing">
            <Layout>
              <CreateEmail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/reports"
        element={
          <ProtectedRoute requiredModule="marketing">
            <Layout>
              <MarketingReports />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Support Routes */}
      <Route
        path="/support"
        element={<Navigate to="/support/tickets" replace />}
      />
      <Route
        path="/support/tickets"
        element={
          <ProtectedRoute requiredModule="support">
            <Layout>
              <TicketList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/support/tickets/new"
        element={
          <ProtectedRoute requiredModule="support">
            <Layout>
              <AddTicket />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/support/tickets/:id"
        element={
          <ProtectedRoute requiredModule="support">
            <Layout>
              <TicketDetails />
            </Layout>
          </ProtectedRoute>
        }
      />



      <Route path="/" element={<Navigate to="/dashboard" replace />} />


      {/* HRM - Policies Routes */}
      <Route
        path="/hrm/policies/create"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <PolicyForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/policies/:id"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <PolicyDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/policies/:id/edit"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <PolicyForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/policies/my"
        element={
          <ProtectedRoute>
            <Layout>
              <EmployeePolicyView />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/policies"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <PolicyList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/attendance"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <HRMAttendance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm/leaves"
        element={
          <ProtectedRoute requiredModule="hrm">
            <Layout>
              <HRMLeaves />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <QuickActionsProvider>
          <Router>
            <AppRoutes />
          </Router>
        </QuickActionsProvider>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;
