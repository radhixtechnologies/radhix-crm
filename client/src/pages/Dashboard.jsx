import { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';

import { employeeService } from '../services/employeeService';
import SuperAdminDashboard from './Dashboard/SuperAdminDashboard';
import AdminEmployeeDashboard from './Dashboard/AdminEmployeeDashboard';
import AdminHRMDashboard from './Dashboard/AdminHRMDashboard';
import EmployeeDashboard from './Dashboard/EmployeeDashboard';
import FinanceDashboard from './finance/FinanceDashboard';
import SalesDashboard from './sales/SalesDashboard';
import MarketingDashboard from './marketing/MarketingDashboard';
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

import '../styles/dashboard.css';

const Dashboard = () => {
  const {  isAdmin, isSuperAdmin, isEmployee, hasModuleAccess } = useAuth();
  
  
  const [, setEmployeeData] = useState(null);
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
    return <SuperAdminDashboard />;
  }

  // Module Admin / Manager Dashboards
  if (isAdmin) {
    return <AdminEmployeeDashboard />;
  }

  // Employee Dashboard - Personal workspace
  if (isEmployee) {
    return <EmployeeDashboard />;
  }

  // Fallback for any role that has dashboard access but doesn't fit the above categories
  if (hasModuleAccess('dashboard')) {
    return <EmployeeDashboard />;
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

