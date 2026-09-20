import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiTrendingUp, FiCalendar, FiBarChart2, FiUsers, FiFileText, FiAlertCircle } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import LeaveSummaryCard from '../../components/LeaveReports/LeaveSummaryCard';
import LeaveTypePieChart from '../../components/LeaveReports/LeaveTypePieChart';
import MonthlyLeaveBarChart from '../../components/LeaveReports/MonthlyLeaveBarChart';
import DepartmentLeaveBarChart from '../../components/LeaveReports/DepartmentLeaveBarChart';
import YearlyTrendChart from '../../components/LeaveReports/YearlyTrendChart';
import LeaveTable from '../../components/LeaveReports/LeaveTable';
import ComprehensiveLeaveTable from '../../components/LeaveReports/ComprehensiveLeaveTable';
import EmployeeLeaveHistory from '../../components/LeaveReports/EmployeeLeaveHistory';
import LeaveFilters from '../../components/LeaveReports/LeaveFilters';
import LeaveExportButtons from '../../components/LeaveReports/LeaveExportButtons';
import Modal from '../../components/common/Modal';
import '../../styles/leaveReports.css';

/**
 * Admin Leave Reports Page
 * Displays comprehensive leave reports for administrators
 */
const LeaveReports = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [departmentData, setDepartmentData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [allLeaves, setAllLeaves] = useState([]);
  const [yearlyTrend, setYearlyTrend] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [employeeHistory, setEmployeeHistory] = useState(null);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    department: '',
    status: '',
    type: '',
    employeeId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchDepartments();
    fetchReports();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchDepartments = async () => {
    try {
      const response = await employeeService.getEmployees();
      if (response.data.success) {
        const uniqueDepartments = [...new Set(response.data.data.map(emp => emp.department).filter(Boolean))];
        setDepartments(uniqueDepartments);
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.year) params.year = filters.year;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.department) params.department = filters.department;

      // Fetch all reports in parallel
      const [summaryRes, monthlyRes, departmentRes, employeeRes, allLeavesRes, yearlyTrendRes] = await Promise.all([
        employeeService.getLeaveSummary(params),
        employeeService.getMonthlyLeaveReport(params),
        employeeService.getDepartmentLeaveReport(params),
        employeeService.getEmployeeLeaveReport(params),
        employeeService.getAllLeaves(params),
        employeeService.getYearlyTrend({ ...params, startYear: params.year - 4, endYear: params.year }),
      ]);

      if (summaryRes.data.success) setSummaryData(summaryRes.data.data);
      if (monthlyRes.data.success) setMonthlyData(monthlyRes.data.data);
      if (departmentRes.data.success) setDepartmentData(departmentRes.data.data);
      if (employeeRes.data.success) setEmployeeData(employeeRes.data.data);
      if (allLeavesRes.data.success) setAllLeaves(allLeavesRes.data.data || []);
      if (yearlyTrendRes.data.success) setYearlyTrend(yearlyTrendRes.data.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  };

  const handleViewEmployeeHistory = async (employeeId, employeeName) => {
    try {
      setViewingEmployee({ _id: employeeId, name: employeeName, employeeId });
      const response = await employeeService.getPersonalLeaveReport(employeeId, { year: filters.year });
      if (response.data.success) {
        setEmployeeHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employee history:', error);
      alert('Failed to load employee history');
    }
  };

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Access Denied</h1>
          <p className="page-subtitle">You do not have permission to view this page</p>
        </div>
      </div>
    );
  }

  if (loading) return <Loader />;

  // Prepare data for export
  const exportData = employeeData?.employees?.map(emp => ({
    'Employee ID': emp.employeeId,
    'Name': emp.name,
    'Department': emp.department,
    'Total Leaves': emp.total,
    'Approved': emp.approved,
    'Pending': emp.pending,
    'Rejected': emp.rejected,
    'Total Days': emp.totalDays,
    'Casual Days': emp.byType.casual.days,
    'Sick Days': emp.byType.sick.days,
    'Annual Days': emp.byType.annual.days,
  })) || [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">Leave Reports</h1>
            <p className="page-subtitle">Comprehensive leave analytics and statistics</p>
          </div>
          {exportData.length > 0 && (
            <LeaveExportButtons 
              data={exportData} 
              filename="leave-reports-admin"
              leaves={allLeaves}
            />
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <LeaveFilters
          onFilterChange={handleFilterChange}
          departments={departments}
          employees={employees}
        />

        {/* Summary Cards */}
        <div className="reports-grid">
          <LeaveSummaryCard
            title="Total Leaves"
            value={summaryData?.total || 0}
            subtitle={`${summaryData?.approved || 0} approved`}
            icon={FiBarChart2}
            color="primary"
          />
          <LeaveSummaryCard
            title="Approved Leaves"
            value={summaryData?.approved || 0}
            subtitle={`${summaryData?.totalDays || 0} days`}
            icon={FiTrendingUp}
            color="success"
          />
          <LeaveSummaryCard
            title="Pending Leaves"
            value={summaryData?.pending || 0}
            subtitle="Awaiting approval"
            icon={FiCalendar}
            color="warning"
          />
          <LeaveSummaryCard
            title="Rejected Leaves"
            value={summaryData?.rejected || 0}
            subtitle="Not approved"
            icon={FiAlertCircle}
            color="error"
          />
        </div>

        {/* Charts Section */}
        <div className="report-section">
          <h2 className="report-section-title">Charts & Analytics</h2>
          
          {/* Leave Type Distribution */}
          <LeaveTypePieChart data={summaryData?.byType} />

          {/* Monthly Leave Usage */}
          <MonthlyLeaveBarChart data={monthlyData} />

          {/* Yearly Trend */}
          <YearlyTrendChart data={yearlyTrend} />

          {/* Department-Wise Leave Usage */}
          <DepartmentLeaveBarChart data={departmentData} />
        </div>

        {/* Comprehensive Leave Table */}
        <div className="report-section">
          <h2 className="report-section-title">All Leave Requests</h2>
          <ComprehensiveLeaveTable 
            leaves={allLeaves}
            loading={loading}
            onViewDetails={(leave) => {
              // Open leave details modal or navigate
              alert(`Leave Details:\nType: ${leave.type}\nStatus: ${leave.status}\nDays: ${leave.days}\nReason: ${leave.reason}`);
            }}
          />
        </div>

        {/* Employee Comparison Table */}
        <div className="report-section">
          <h2 className="report-section-title">Employee-Wise Leave Comparison</h2>
          <div className="card" style={{ padding: '24px' }}>
            {employeeData?.employees && employeeData.employees.length > 0 ? (
              <div className="table-wrapper">
                <table className="leave-table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Total</th>
                      <th>Approved</th>
                      <th>Pending</th>
                      <th>Rejected</th>
                      <th>Total Days</th>
                      <th>Casual</th>
                      <th>Sick</th>
                      <th>Annual</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeData.employees.map((emp) => (
                      <tr key={emp.employeeId}>
                        <td>{emp.employeeId}</td>
                        <td>{emp.name}</td>
                        <td>{emp.department}</td>
                        <td>{emp.total}</td>
                        <td>{emp.approved}</td>
                        <td>{emp.pending}</td>
                        <td>{emp.rejected}</td>
                        <td><strong>{emp.totalDays}</strong></td>
                        <td>{emp.byType.casual.days}</td>
                        <td>{emp.byType.sick.days}</td>
                        <td>{emp.byType.annual.days}</td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              // Find employee object
                              const employee = employees.find(e => e.employeeId === emp.employeeId);
                              if (employee) {
                                handleViewEmployeeHistory(employee._id, emp.name);
                              }
                            }}
                            title="View Detailed History"
                          >
                            <FiUsers /> History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-empty">
                <p>No employee data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Department Summary */}
        <div className="report-section">
          <h2 className="report-section-title">Department Summary</h2>
          <div className="card" style={{ padding: '24px' }}>
            {departmentData?.departments && departmentData.departments.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {departmentData.departments.map((dept) => (
                  <div key={dept.department} style={{ padding: '16px', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>{dept.department}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Requests:</span>
                        <strong>{dept.total}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Approved:</span>
                        <strong>{dept.approved}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Days:</span>
                        <strong>{dept.totalDays}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Employees:</span>
                        <strong>{dept.totalEmployees}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="table-empty">
                <p>No department data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Employee History Modal */}
      {viewingEmployee && employeeHistory && (
        <Modal
          isOpen={!!viewingEmployee}
          onClose={() => {
            setViewingEmployee(null);
            setEmployeeHistory(null);
          }}
          title={`Leave History - ${viewingEmployee.name}`}
          size="large"
        >
          <EmployeeLeaveHistory
            employee={employeeHistory.employee}
            leaves={employeeHistory.leaves}
            summary={employeeHistory.summary}
            monthly={employeeHistory.monthly}
          />
        </Modal>
      )}
    </div>
  );
};

export default LeaveReports;

