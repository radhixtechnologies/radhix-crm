import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiFileText, FiCalendar, FiTrendingUp, FiUsers, FiDownload, FiFilter, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/format';
import dayjs from 'dayjs';
import '../../styles/forms.css';
import '../../styles/employee/reports.css';

const EmployeeReports = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState(null);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: '',
    department: '',
    employeeId: '',
  });
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchReports();
    if (isAdmin || isSuperAdmin) {
      fetchDepartments();
      fetchEmployees();
    }
  }, [filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {
        year: filters.year || new Date().getFullYear(),
      };
      if (filters.month) params.month = filters.month;
      if (filters.department) params.department = filters.department;
      if (filters.employeeId) params.employeeId = filters.employeeId;

      const response = await employeeService.getLeaveReports(params);
      if (response.data.success) {
        const data = response.data.data;
        // Transform backend response to match frontend expectations
        setReports({
          totalRequests: data.stats?.total || 0,
          approved: data.stats?.approved || 0,
          rejected: data.stats?.rejected || 0,
          pending: data.stats?.pending || 0,
          totalDays: data.stats?.totalDays || 0,
          byType: data.stats?.byType || {},
          byDepartment: {}, // Backend doesn't provide this in leave-reports endpoint
          requests: data.leaves || [],
        });
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await employeeService.getEmployees();
      if (response.data.success) {
        const depts = [...new Set(response.data.data.map(emp => emp.department).filter(Boolean))];
        setDepartments(depts);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getEmployees();
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportToCSV = () => {
    if (!reports || !reports.requests || reports.requests.length === 0) {
      alert('No data to export');
      return;
    }

    // Prepare CSV data
    const headers = [
      'Employee Name',
      'Employee ID',
      'Department',
      'Leave Type',
      'Start Date',
      'End Date',
      'Days',
      'Status',
      'Reason',
      'Applied Date',
    ];

    const rows = reports.requests.map(leave => [
      leave.employee?.user?.name || leave.employee?.name || 'N/A',
      leave.employee?.employeeId || 'N/A',
      leave.employee?.department || 'N/A',
      leave.type || 'N/A',
      leave.startDate ? formatDate(leave.startDate) : 'N/A',
      leave.endDate ? formatDate(leave.endDate) : 'N/A',
      leave.days || 0,
      leave.status || 'N/A',
      leave.reason || 'N/A',
      leave.createdAt ? formatDate(leave.createdAt) : 'N/A',
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employee_reports_${filters.year || new Date().getFullYear()}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // PDF export requires additional setup (jsPDF or react-pdf)
    alert('PDF export requires additional setup. Consider using libraries like jsPDF or react-pdf. CSV export is available.');
  };

  const exportReport = () => {
    exportToCSV();
  };

  if (loading) return <Loader />;

  return (
    <div className="fade-in employee-reports-page">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1 className="page-title">Employee Reports</h1>
            <p className="page-subtitle">View leave and attendance reports</p>
          </div>
          {reports && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={exportToCSV} title="Export to CSV">
                <FiDownload /> Export CSV
              </button>
              <button className="btn btn-secondary" onClick={exportToPDF} title="Export to PDF">
                <FiFileText /> Export PDF
            </button>
            </div>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="filters-card">
          <div className="filters-header">
            <FiFilter className="filter-icon" />
            <h3>Filters</h3>
          </div>
          <div className="filters-row">
            <div className="filter-group">
              <label>Year</label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="filter-select"
              >
                {Array.from({ length: 5 }, (_, i) => {
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
              <label>Month (Optional)</label>
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="filter-select"
              >
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1;
                  return (
                    <option key={month} value={month}>
                      {dayjs().month(month - 1).format('MMMM')}
                    </option>
                  );
                })}
              </select>
            </div>

            {(isAdmin || isSuperAdmin) && (
              <>
                <div className="filter-group">
                  <label>Department</label>
                  <select
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Employee</label>
                  <select
                    value={filters.employeeId}
                    onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Employees</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.user?.name || emp.employeeId} - {emp.employeeId}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {(filters.month || filters.department || filters.employeeId) && (
              <button
                className="btn btn-secondary"
                onClick={() => setFilters({ year: new Date().getFullYear(), month: '', department: '', employeeId: '' })}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Reports Content */}
        {reports ? (
          <div className="reports-content">
            {/* Summary Cards */}
            <div className="summary-cards">
              <div className="summary-card">
                <div className="card-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                  <FiFileText />
                </div>
                <div className="card-content">
                  <div className="card-title">Total Requests</div>
                  <div className="card-value">{reports.totalRequests || 0}</div>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                  <FiCalendar />
                </div>
                <div className="card-content">
                  <div className="card-title">Total Days</div>
                  <div className="card-value">{reports.totalDays || 0}</div>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                  <FiCheckCircle />
                </div>
                <div className="card-content">
                  <div className="card-title">Approved</div>
                  <div className="card-value">{reports.approved || 0}</div>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                  <FiClock />
                </div>
                <div className="card-content">
                  <div className="card-title">Pending</div>
                  <div className="card-value">{reports.pending || 0}</div>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  <FiXCircle />
                </div>
                <div className="card-content">
                  <div className="card-title">Rejected</div>
                  <div className="card-value">{reports.rejected || 0}</div>
                </div>
              </div>
            </div>

            {/* By Type */}
            {reports.byType && Object.keys(reports.byType).length > 0 && (
              <div className="report-section">
                <h3>Leave Statistics by Type</h3>
                <div className="report-table">
                  <div className="table-header">
                    <div>Leave Type</div>
                    <div>Total Days</div>
                  </div>
                  {Object.entries(reports.byType).map(([type, days]) => (
                    <div key={type} className="table-row">
                      <div className="type-badge">{type.toUpperCase()}</div>
                      <div>{days || 0} days</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By Department - Only show if admin and data exists */}
            {reports.byDepartment && Object.keys(reports.byDepartment).length > 0 && (isAdmin || isSuperAdmin) && (
              <div className="report-section">
                <h3>Leave Statistics by Department</h3>
                <div className="report-table">
                  <div className="table-header">
                    <div>Department</div>
                    <div>Requests</div>
                    <div>Total Days</div>
                  </div>
                  {Object.entries(reports.byDepartment).map(([dept, data]) => (
                    <div key={dept} className="table-row">
                      <div>{dept}</div>
                      <div>{data.count || 0}</div>
                      <div>{data.days || 0} days</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leave Requests List */}
            {reports.requests && reports.requests.length > 0 && (
              <div className="report-section">
                <h3>Leave Requests</h3>
                <div className="report-table">
                  <div className="table-header">
                    <div>Employee</div>
                    <div>Type</div>
                    <div>Start Date</div>
                    <div>End Date</div>
                    <div>Days</div>
                    <div>Status</div>
                    <div>Approved By</div>
                  </div>
                  {reports.requests.map((request) => (
                    <div key={request._id} className="table-row">
                      <div>
                        <div className="employee-name">{request.employee?.user?.name || 'N/A'}</div>
                        <div className="employee-id">{request.employee?.employeeId || 'N/A'}</div>
                      </div>
                      <div className="type-badge">{request.type?.toUpperCase() || 'N/A'}</div>
                      <div>{formatDate(request.startDate)}</div>
                      <div>{formatDate(request.endDate)}</div>
                      <div>{request.days || 0}</div>
                      <div>
                        <span className={`status-badge status-${request.status || 'pending'}`}>
                          {request.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </div>
                      <div>{request.approvedBy?.name || '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <FiFileText size={48} />
            <h3>No Reports Available</h3>
            <p>No leave reports found for the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeReports;

