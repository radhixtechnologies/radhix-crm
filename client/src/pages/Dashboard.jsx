import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analyticsService';
import { employeeService } from '../services/employeeService';
import { useIndustrySuite } from '../context/IndustrySuiteContext';

const SuperAdminDashboard = lazy(() => import('./Dashboard/SuperAdminDashboard'));
const AdminEmployeeDashboard = lazy(() => import('./Dashboard/AdminEmployeeDashboard'));
const AdminHRMDashboard = lazy(() => import('./Dashboard/AdminHRMDashboard'));
const EmployeeDashboard = lazy(() => import('./Dashboard/EmployeeDashboard'));
const FinanceDashboard = lazy(() => import('./finance/FinanceDashboard'));
const SalesDashboard = lazy(() => import('./sales/SalesDashboard'));
const MarketingDashboard = lazy(() => import('./marketing/MarketingDashboard'));
const RealEstateDashboard = lazy(() => import('./realEstate/RealEstateDashboard'));
const GymDashboard = lazy(() => import('./gym/GymDashboard'));
const HealthcareDashboard = lazy(() => import('./healthcare/HealthcareDashboard'));
const AutomotiveDashboard = lazy(() => import('./automotive/AutomotiveDashboard'));
const ConstructionDashboard = lazy(() => import('./construction/ConstructionDashboard'));
const ManufacturingDashboard = lazy(() => import('./manufacturing/ManufacturingDashboard'));
const RestaurantDashboard = lazy(() => import('./restaurant/RestaurantDashboard'));
const SalonDashboard = lazy(() => import('./salon/SalonDashboard'));
const TravelDashboard = lazy(() => import('./travel/TravelDashboard'));
const RetailDashboard = lazy(() => import('./retail/RetailDashboard'));
import {
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiBriefcase,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiFileText,
  FiDollarSign as FiPayroll,
  FiPlus,
  FiEdit,
  FiUser,
  FiBriefcase as FiSkills,
} from 'react-icons/fi';
import Loader from '../components/common/Loader';
import { formatCurrency, formatNumber, formatDate } from '../utils/format';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { user, isAdmin, isSuperAdmin, isEmployee, hasModuleAccess } = useAuth();
  const { activeSuiteId } = useIndustrySuite();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSuperAdmin || isAdmin) {
      // Both Super Admin and Module Admins use the multi-module premium dashboard
      setLoading(false);
      return;
    } else if (isEmployee) {
      fetchEmployeeDashboard();
    } else {
      setLoading(false);
    }
  }, [isAdmin, isSuperAdmin, isEmployee, hasModuleAccess]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsService.getDashboardAnalytics();
      if (response.data?.success) {
        setAnalytics(response.data.data);
      } else {
        // Set default empty structure if API fails
        setAnalytics({
          employees: { total: 0, onLeave: 0 },
          finance: { revenue: 0, profit: 0, pendingInvoices: 0, overdueInvoices: 0 },
          sales: { totalLeads: 0, wonLeads: 0 },
          recent: { leads: [], invoices: [] },
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set default empty structure on error
      setAnalytics({
        employees: { total: 0, onLeave: 0 },
        finance: { revenue: 0, profit: 0, pendingInvoices: 0, overdueInvoices: 0 },
        sales: { totalLeads: 0, wonLeads: 0 },
        recent: { leads: [], invoices: [] },
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeDashboard = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getEmployeeDashboard();
      if (response.data?.success) {
        setEmployeeData(response.data.data);
      } else {
        // Set empty data structure if API fails
        setEmployeeData({
          employeeId: null,
          attendance: null,
          tasks: { pending: 0, list: [] },
          leaveBalance: null,
          recentLeaves: [],
          salarySlip: null,
          performance: null,
          recentTimesheets: [],
        });
      }
    } catch (error) {
      console.error('Error fetching employee dashboard:', error);
      // Set default empty data structure on error
      setEmployeeData({
        employeeId: null,
        attendance: null,
        tasks: { pending: 0, list: [] },
        leaveBalance: null,
        recentLeaves: [],
        salarySlip: null,
        performance: null,
        recentTimesheets: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  // Super Admin Dashboard - Full system overview
  if (isSuperAdmin) {
    return <Suspense fallback={<Loader />}><SuperAdminDashboard /></Suspense>;
  }

  // Tenant Industry Dashboard routing
  const companyIndustry = user?.company?.industry?.toLowerCase()?.trim() || (activeSuiteId !== 'all' ? activeSuiteId : '');
  if (companyIndustry && companyIndustry !== 'all') {
    switch (companyIndustry) {
      case 'real-estate':
        return <Suspense fallback={<Loader />}><RealEstateDashboard /></Suspense>;
      case 'gym':
        return <Suspense fallback={<Loader />}><GymDashboard /></Suspense>;
      case 'healthcare':
        return <Suspense fallback={<Loader />}><HealthcareDashboard /></Suspense>;
      case 'automotive':
        return <Suspense fallback={<Loader />}><AutomotiveDashboard /></Suspense>;
      case 'construction':
        return <Suspense fallback={<Loader />}><ConstructionDashboard /></Suspense>;
      case 'manufacturing':
        return <Suspense fallback={<Loader />}><ManufacturingDashboard /></Suspense>;
      case 'restaurant':
        return <Suspense fallback={<Loader />}><RestaurantDashboard /></Suspense>;
      case 'salon':
        return <Suspense fallback={<Loader />}><SalonDashboard /></Suspense>;
      case 'travel':
        return <Suspense fallback={<Loader />}><TravelDashboard /></Suspense>;
      case 'retail':
        return <Suspense fallback={<Loader />}><RetailDashboard /></Suspense>;
      case 'institute':
        navigate('/institute/admissions', { replace: true });
        return null;
      default:
        break;
    }
  }

  // Module Admin / Manager Dashboards
  if (isAdmin) {
    return <Suspense fallback={<Loader />}><AdminEmployeeDashboard /></Suspense>;
  }

  // Employee Dashboard - Personal workspace
  if (isEmployee) {
    return <Suspense fallback={<Loader />}><EmployeeDashboard /></Suspense>;
  }

  // Fallback for any role that has dashboard access but doesn't fit the above categories
  if (hasModuleAccess('dashboard')) {
    return <Suspense fallback={<Loader />}><EmployeeDashboard /></Suspense>;
  }

  // If truly no access
  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>
      <div className="page-content">
        <div className="card">
          <p style={{ textAlign: 'center', padding: '20px' }}>
            Welcome! Please contact your administrator for access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

