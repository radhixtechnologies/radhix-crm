import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiTrendingUp, FiCalendar, FiBarChart2, FiFileText } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import LeaveSummaryCard from '../../components/LeaveReports/LeaveSummaryCard';
import LeaveTypePieChart from '../../components/LeaveReports/LeaveTypePieChart';
import MonthlyLeaveBarChart from '../../components/LeaveReports/MonthlyLeaveBarChart';
import LeaveTable from '../../components/LeaveReports/LeaveTable';
import LeaveFilters from '../../components/LeaveReports/LeaveFilters';
import LeaveExportButtons from '../../components/LeaveReports/LeaveExportButtons';
import '../../styles/leaveReports.css';

/**
 * Employee Leave Report Page
 * Displays personal leave report for employees
 */
const LeaveReport = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchEmployee();
  }, []);

  useEffect(() => {
    if (employeeId) {
      fetchReport();
    }
  }, [employeeId, filters]);

  const fetchEmployee = async () => {
    try {
      const response = await employeeService.getEmployees();
      if (response.data.success && response.data.data.length > 0) {
        const userId = user?._id || user?.id;
        const userIdString = userId?.toString();
        
        const emp = response.data.data.find(e => {
          const empUserId = e.user?._id || e.user?.id;
          const empUserIdString = empUserId?.toString();
          return empUserIdString === userIdString;
        });
        
        if (emp) {
          setEmployeeId(emp._id);
        }
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
    }
  };

  const fetchReport = async () => {
    if (!employeeId) return;

    try {
      setLoading(true);
      const params = {};
      if (filters.year) params.year = filters.year;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await employeeService.getPersonalLeaveReport(employeeId, params);
      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching leave report:', error);
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

  if (loading) return <Loader />;

  if (!employeeId || !reportData) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Leave Report</h1>
          <p className="page-subtitle">Your personal leave report</p>
        </div>
        <div className="page-content">
          <p>Loading report data...</p>
        </div>
      </div>
    );
  }

  const { summary, monthly, leaves } = reportData;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">Leave Report</h1>
            <p className="page-subtitle">Your personal leave statistics and history</p>
          </div>
          {leaves && leaves.length > 0 && (
            <LeaveExportButtons data={leaves} filename={`leave-report-${reportData.employee?.employeeId || 'employee'}`} />
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <LeaveFilters
          onFilterChange={handleFilterChange}
          departments={[]}
        />

        {/* Summary Cards */}
        <div className="reports-grid">
          <LeaveSummaryCard
            title="Total Leaves"
            value={summary?.total || 0}
            subtitle={`${summary?.approved || 0} approved`}
            icon={FiBarChart2}
            color="primary"
          />
          <LeaveSummaryCard
            title="Approved Leaves"
            value={summary?.approved || 0}
            subtitle={`${summary?.totalDays || 0} days`}
            icon={FiTrendingUp}
            color="success"
          />
          <LeaveSummaryCard
            title="Pending Leaves"
            value={summary?.pending || 0}
            subtitle="Awaiting approval"
            icon={FiCalendar}
            color="warning"
          />
          <LeaveSummaryCard
            title="Rejected Leaves"
            value={summary?.rejected || 0}
            subtitle="Not approved"
            icon={FiFileText}
            color="error"
          />
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <LeaveTypePieChart data={summary?.byType} />
          <MonthlyLeaveBarChart data={{ monthly }} />
        </div>

        {/* Type Breakdown */}
        <div className="report-section">
          <h2 className="report-section-title">Leave Type Breakdown</h2>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {Object.keys(summary?.byType || {}).map(type => {
                const typeData = summary.byType[type];
                if (typeData.total === 0) return null;
                return (
                  <div key={type} style={{ padding: '16px', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', textTransform: 'capitalize' }}>{type}</h4>
                    <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{typeData.days}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                      {typeData.approved} approved ({typeData.total} total)
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Leave History Table */}
        <div className="report-section">
          <h2 className="report-section-title">Leave History</h2>
          <LeaveTable leaves={leaves} showEmployee={false} />
        </div>
      </div>
    </div>
  );
};

export default LeaveReport;

