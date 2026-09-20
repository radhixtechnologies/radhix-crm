import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import { QuickActionsProvider } from './context/QuickActionsContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import Breadcrumbs from './components/common/Breadcrumbs';

// Auth
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ChangePassword from './pages/auth/ChangePassword';

// Dashboard
import Dashboard from './pages/Dashboard';
import ReportsDashboard from './pages/reports/ReportsDashboard';

// Employee

import EmployeeProfile from './pages/employee/EmployeeProfile';
import Attendance from './pages/employee/Attendance';
import MyAttendance from './pages/employee/MyAttendance';
import MyLeaves from './pages/employee/MyLeaves';
import HRMLeaves from './pages/hrm/HRMLeaves'; // New Import
import Leaves from './pages/employee/Leaves';
import Tasks from './pages/employee/Tasks';
import Timesheets from './pages/employee/Timesheets';
import LeaveBalance from './pages/employee/LeaveBalance';
import Performance from './pages/employee/MyPerformanceReview';
import Payroll from './pages/employee/Payroll';
import Assets from './pages/employee/Assets';
import ExitProcess from './pages/employee/ExitProcess';
import ActivityLogs from './pages/employee/ActivityLogs';
import MySalarySlips from './pages/employee/MySalarySlips';
import Reimbursements from './pages/employee/Reimbursements';
import EmployeeReports from './pages/employee/EmployeeReports';
import EmployeeStatistics from './pages/employee/EmployeeStatistics';
import EmployeeImportExport from './pages/employee/EmployeeImportExport';

// Add Employee (correct folder)
import AddEmployee from './pages/Employees/AddEmployee';
import EditEmployee from './pages/Employees/EditEmployee';

// Finance (FIXED: finance, not Finance)
import FinanceDashboard from './pages/finance/FinanceDashboard';
import InvoiceList from './pages/finance/InvoiceList.jsx';
import AddInvoice from './pages/finance/AddInvoice';
import InvoiceDetails from './pages/finance/InvoiceDetails';
import ExpenseList from './pages/finance/ExpenseList';
import AddExpense from './pages/finance/AddExpense';
import ExpenseDetail from './pages/finance/ExpenseDetail';
import PayrollList from './pages/finance/PayrollList';
import GeneratePayroll from './pages/finance/GeneratePayroll';
import GenerateSalarySlip from './pages/finance/GenerateSalarySlip';
import SalarySlipList from './pages/finance/SalarySlipList';
import SalaryStructureList from './pages/finance/SalaryStructureList';
import SalaryStructureForm from './pages/finance/SalaryStructureForm';
import SalaryStructureDetail from './pages/finance/SalaryStructureDetail';
import FinanceReports from './pages/finance/FinanceReports';
import TaxSettings from './pages/finance/TaxSettings';
// Payment Management
import Payments from './pages/finance/Payments';
import RecordPayment from './pages/finance/RecordPayment';
import PaymentDetails from './pages/finance/PaymentDetails';

// Inventory
import ProductList from './pages/inventory/ProductList';
import AddProduct from './pages/inventory/AddProduct';

// Sales (FIXED: sales, not Sales)
import SalesDashboard from './pages/sales/SalesDashboard';
import LeadList from './pages/sales/LeadList';
import AddLead from './pages/sales/AddLead';
import LeadDetails from './pages/sales/LeadDetails';
import LeadTracking from './pages/sales/LeadTracking';
import ClientList from './pages/sales/ClientList';
import AddClient from './pages/sales/AddClient';
import ClientDetails from './pages/sales/ClientDetails';
import SalesPipeline from './pages/sales/SalesPipeline';
import Deals from './pages/sales/Deals';
import DealDetails from './pages/sales/DealDetails';
import UpdateDeal from './pages/sales/UpdateDeal';
import SalesDocuments from './pages/sales/SalesDocuments';
import AddProposal from './pages/sales/AddProposal';
import ProposalDetails from './pages/sales/ProposalDetails';
import CreateQuotation from './pages/sales/CreateQuotation';
import FollowupList from './pages/sales/FollowupList';

// Contact Management
import ContactList from './pages/contacts/ContactList';
import AddContact from './pages/contacts/AddContact';
import ContactDetails from './pages/contacts/ContactDetails';

// Marketing Module
import CampaignList from './pages/marketing/CampaignList';
import AddCampaign from './pages/marketing/AddCampaign';
import CampaignDetails from './pages/marketing/CampaignDetails';
import MarketingDashboard from './pages/marketing/MarketingDashboard';
import EmailList from './pages/marketing/EmailList';
import SegmentList from './pages/marketing/SegmentList';
import AddSegment from './pages/marketing/AddSegment';
import SegmentDetails from './pages/marketing/SegmentDetails';
import AutomationList from './pages/marketing/AutomationList';
import MarketingReports from './pages/marketing/MarketingReports';

// Support Module
import TicketList from './pages/support/TicketList';
import AddTicket from './pages/support/AddTicket';
import TicketDetails from './pages/support/TicketDetails';

import CalendarView from './pages/activities/CalendarView';


// HRM (unchanged)
import HRMDashboard from './pages/hrm/HRMDashboard';
import HRMAttendance from './pages/hrm/HRMAttendance';
import HRAnalyticsDashboard from './pages/hrm/Analytics/HRAnalyticsDashboard';
import PolicyCenter from './pages/hrm/Policies/PolicyCenter';
import PolicyList from './pages/hrm/Policies/PolicyList';
import PolicyDetails from './pages/hrm/Policies/PolicyDetails';
import EmployeePolicyView from './pages/hrm/Policies/EmployeePolicyView';
import PolicyForm from './pages/hrm/Policies/PolicyForm';
import SkillMatrix from './pages/hrm/Skills/SkillMatrix';
import MySkills from './pages/hrm/Skills/MySkills'; // Import MySkills
import AddEditSkill from './pages/hrm/Skills/AddEditSkill';
import SkillDetails from './pages/hrm/Skills/SkillDetails'; // New import
import EmployeeSkillProfile from './pages/hrm/Skills/EmployeeSkillProfile';
import ExitManagement from './pages/hrm/Exit/ExitManagement';
import SubmitResignation from './pages/hrm/Exit/SubmitResignation';
import ExitDashboard from './pages/hrm/Exit/ExitDashboard';
import ExitRequestDetails from './pages/hrm/Exit/ExitRequestDetails';
import PerformanceDashboard from './pages/hrm/Performance/PerformanceDashboard';
import SelfAssessment from './pages/hrm/Performance/SelfAssessment';
import ManagerReview from './pages/hrm/Performance/ManagerReview';
import GoalsList from './pages/hrm/Performance/GoalsList';
import OnboardingDashboard from './pages/hrm/Onboarding/OnboardingDashboard';
import OnboardingTasks from './pages/hrm/Onboarding/OnboardingTasks';
import NewHireChecklist from './pages/hrm/Onboarding/NewHireChecklist';
import JobList from './pages/hrm/Recruitment/JobList';
import AddJob from './pages/hrm/Recruitment/AddJob';
import JobDetails from './pages/hrm/Recruitment/JobDetails';
import ApplicantsList from './pages/hrm/Recruitment/ApplicantsList';
import ApplicantDetails from './pages/hrm/Recruitment/ApplicantDetails';
import InterviewScheduling from './pages/hrm/Recruitment/InterviewScheduling';
import OfferList from './pages/hrm/Recruitment/OfferList';
import OfferForm from './pages/hrm/Recruitment/OfferForm';
import SelectApplicantForOffer from './pages/hrm/Recruitment/SelectApplicantForOffer';
import TrainingCatalog from './pages/hrm/Training/TrainingCatalog';
import TrainingDetails from './pages/hrm/Training/TrainingDetails';
import HRReports from './pages/hrm/Reports/HRReports';
import EmployeeTimeline from './pages/hrm/Lifecycle/EmployeeTimeline';
import EmployeeDirectory from './pages/hrm/EmployeeDirectory';

// Settings & Admin
import Settings from './pages/settings/Settings';
import AllGoals from './pages/admin/AllGoals';
import AllReviews from './pages/admin/AllReviews';
import AppraisalCycles from './pages/admin/AppraisalCycles';
import LeaveAllocation from './pages/admin/LeaveAllocation';
import LeaveBalanceOverview from './pages/admin/LeaveBalanceOverview';
import LeaveReports from './pages/admin/LeaveReports';

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
