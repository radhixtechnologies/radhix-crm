import { useState, useEffect } from 'react';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import { FiUsers, FiTrendingUp, FiCalendar, FiDollarSign, FiBarChart2 } from 'react-icons/fi';
import '../../styles/employee/statistics.css';

const EmployeeStatistics = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    department: '',
  });

  useEffect(() => {
    if (isAdmin || isSuperAdmin) {
      fetchStatistics();
    }
  }, [filters, isAdmin, isSuperAdmin]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.year) params.year = filters.year;
      if (filters.department) params.department = filters.department;

      const response = await employeeService.getEmployeeStatistics(params);
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      alert('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Employee Statistics</h1>
        </div>
        <div className="page-content">
          <div className="card">
            <p style={{ textAlign: 'center', padding: '20px' }}>
              You don't have permission to view this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <Loader />;

  if (!statistics) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Employee Statistics</h1>
        </div>
        <div className="page-content">
          <div className="card">
            <p style={{ textAlign: 'center', padding: '20px' }}>
              No statistics available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { overview, byDepartment, byStatus, byEmploymentType, byMonth, attendance, leaves } = statistics;

  return (
    <div className="fade-in employee-statistics-page">
      <div className="page-header">
        <h1 className="page-title">Employee Statistics</h1>
        <p className="page-subtitle">Comprehensive employee analytics and insights</p>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="statistics-filters">
          <div className="filter-group">
            <label>Year</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="filter-group">
            <label>Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            >
              <option value="">All Departments</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Sales">Sales</option>
              <option value="Management">Management</option>
              <option value="Operations">Operations</option>
            </select>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="statistics-overview">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <FiUsers />
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Employees</div>
              <div className="stat-value">{overview.total}</div>
              <div className="stat-subtitle">{overview.active} active</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <div className="stat-label">New Hires</div>
              <div className="stat-value">{overview.newHires}</div>
              <div className="stat-subtitle">This year</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <FiCalendar />
            </div>
            <div className="stat-content">
              <div className="stat-label">Average Tenure</div>
              <div className="stat-value">{overview.averageTenureYears} years</div>
              <div className="stat-subtitle">{overview.averageTenureMonths} months</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
              <FiBarChart2 />
            </div>
            <div className="stat-content">
              <div className="stat-label">Attendance Rate</div>
              <div className="stat-value">{attendance.averageRate.toFixed(1)}%</div>
              <div className="stat-subtitle">{attendance.presentDays} / {attendance.totalDays} days</div>
            </div>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="statistics-section">
          <h2 className="section-title">Department Distribution</h2>
          <div className="department-stats">
            {byDepartment.map((dept) => (
              <div key={dept.department} className="department-item">
                <div className="department-name">{dept.department}</div>
                <div className="department-bar">
                  <div
                    className="department-bar-fill"
                    style={{
                      width: `${(dept.count / overview.total) * 100}%`,
                    }}
                  />
                </div>
                <div className="department-count">{dept.count} employees</div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="statistics-section">
          <h2 className="section-title">Status Distribution</h2>
          <div className="status-grid">
            {byStatus.map((status) => (
              <div key={status.status} className="status-item">
                <div className="status-name">{status.status}</div>
                <div className="status-count">{status.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Employment Type Distribution */}
        <div className="statistics-section">
          <h2 className="section-title">Employment Type Distribution</h2>
          <div className="employment-type-grid">
            {byEmploymentType.map((type) => (
              <div key={type.type} className="employment-type-item">
                <div className="employment-type-name">{type.type}</div>
                <div className="employment-type-count">{type.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Hires */}
        {byMonth.length > 0 && (
          <div className="statistics-section">
            <h2 className="section-title">Monthly Hires (Last 12 Months)</h2>
            <div className="monthly-hires">
              {byMonth.map((month) => (
                <div key={month.month} className="month-item">
                  <div className="month-label">{month.month}</div>
                  <div className="month-bar">
                    <div
                      className="month-bar-fill"
                      style={{
                        height: `${(month.count / Math.max(...byMonth.map(m => m.count))) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="month-count">{month.count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leave Statistics */}
        {leaves.length > 0 && (
          <div className="statistics-section">
            <h2 className="section-title">Leave Statistics</h2>
            <div className="leave-stats">
              {leaves.map((leave) => (
                <div key={leave.status} className="leave-item">
                  <div className="leave-status">{leave.status}</div>
                  <div className="leave-count">{leave.count} requests</div>
                  <div className="leave-days">{leave.totalDays} days</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeStatistics;

