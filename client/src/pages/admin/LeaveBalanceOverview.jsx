import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiBarChart2, FiUsers, FiAlertCircle, FiDownload, FiRefreshCw, FiCalendar, FiTrendingUp, FiEdit } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import SummaryBox from '../../components/LeaveBalance/SummaryBox';
import EditLeaveBalanceModal from '../../components/LeaveBalance/EditLeaveBalanceModal';
import '../../styles/forms.css';

/**
 * Admin Leave Balance Overview Page
 * Displays department-wise leave balance, low balance employees, and summary statistics
 */
const LeaveBalanceOverview = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBalance, setEditingBalance] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, [selectedYear, selectedDepartment]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const params = { year: selectedYear };
      if (selectedDepartment) {
        params.department = selectedDepartment;
      }
      const response = await employeeService.getLeaveBalanceSummary(params);
      if (response.data.success) {
        setSummaryData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching leave balance summary:', error);
      if (error.response?.status === 403) {
        alert('You do not have access to view leave balance summary');
      }
    } finally {
      setLoading(false);
    }
  };

  const departments = ['IT', 'HR', 'Finance', 'Sales', 'Management', 'Operations', 'Engineering', 'Marketing', 'Customer Support'];

  const handleEditBalance = (balance) => {
    setEditingBalance(balance);
    setEditingEmployee(balance.employee);
    setEditModalOpen(true);
  };

  const handleSaveBalance = async (updateData) => {
    if (!editingBalance || !editingEmployee) return;
    
    try {
      await employeeService.updateLeaveBalance(editingEmployee._id, updateData);
      alert('Leave balance updated successfully!');
      fetchSummary(); // Refresh data
    } catch (error) {
      throw error; // Let modal handle the error
    }
  };

  const handleYearlyReset = async () => {
    if (!window.confirm(`This will reset leave balances for year ${selectedYear + 1}. Continue?`)) {
      return;
    }

    try {
      // Reset for all employees
      const employees = summaryData?.leaveBalances?.map(b => b.employee) || [];
      for (const employee of employees) {
        if (employee?._id) {
          await employeeService.resetLeaveBalance(employee._id, { year: selectedYear + 1 });
        }
      }
      alert(`Leave balances reset successfully for year ${selectedYear + 1}!`);
      fetchSummary();
    } catch (error) {
      alert(error.response?.data?.message || 'Error resetting leave balances');
    }
  };

  if (loading) return <Loader />;

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

  if (!summaryData) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Leave Balance Overview</h1>
          <p className="page-subtitle">No data available</p>
        </div>
      </div>
    );
  }

  const { summary, year, leaveBalances } = summaryData;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">Leave Balance Overview</h1>
            <p className="page-subtitle">Department-wise leave balance and analytics</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ minWidth: '120px' }}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              className="form-select"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <button className="btn btn-secondary" onClick={fetchSummary}>
              <FiRefreshCw /> Refresh
            </button>
            <button className="btn btn-primary" onClick={handleYearlyReset}>
              <FiRefreshCw /> Reset for Next Year
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Summary Statistics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <SummaryBox
            title="Total Employees"
            value={summary.totalEmployees}
            subtitle="with leave balance"
            icon={FiUsers}
            color="var(--primary)"
            gradient={true}
          />
          <SummaryBox
            title="Total Allocated"
            value={Object.values(summary.totalLeavesAllocated).reduce((a, b) => a + b, 0)}
            subtitle="days across all types"
            icon={FiCalendar}
            color="var(--info)"
          />
          <SummaryBox
            title="Total Used"
            value={Object.values(summary.totalLeavesUsed).reduce((a, b) => a + b, 0)}
            subtitle={`${summary.totalEmployees > 0 ? Math.round((Object.values(summary.totalLeavesUsed).reduce((a, b) => a + b, 0) / Object.values(summary.totalLeavesAllocated).reduce((a, b) => a + b, 0)) * 100) : 0}% utilization`}
            icon={FiTrendingUp}
            color="var(--warning)"
          />
          <SummaryBox
            title="Low Balance Alerts"
            value={summary.lowBalanceEmployees.length}
            subtitle="employees with <20% remaining"
            icon={FiAlertCircle}
            color="var(--error)"
          />
        </div>

        {/* Leave Type Breakdown */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">Leave Type Breakdown - {year}</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              {Object.keys(summary.totalLeavesAllocated).filter(type => summary.totalLeavesAllocated[type] > 0).map(type => (
                <div key={type} style={{ padding: '16px', background: 'var(--surface)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'capitalize' }}>
                    {type} Leave
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
                    {summary.totalLeavesUsed[type]} / {summary.totalLeavesAllocated[type]}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {summary.totalLeavesAvailable[type]} available
                  </div>
                  {summary.totalLeavesPending[type] > 0 && (
                    <div style={{ fontSize: '11px', color: 'var(--warning)', marginTop: '4px' }}>
                      {summary.totalLeavesPending[type]} pending
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Low Balance Employees */}
        {summary.lowBalanceEmployees.length > 0 && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h3 className="card-title">
                <FiAlertCircle style={{ color: 'var(--warning)', marginRight: '8px' }} />
                Low Balance Employees
              </h3>
            </div>
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Leave Type</th>
                    <th>Available</th>
                    <th>Total</th>
                    <th>Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.lowBalanceEmployees.map((item, index) => (
                    <tr key={index}>
                      <td>
                        {item.employee?.user?.name || item.employee?.employeeId || 'N/A'}
                      </td>
                      <td>{item.employee?.department || 'N/A'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{item.leaveType}</td>
                      <td>
                        <strong style={{ color: 'var(--error)' }}>{item.available} days</strong>
                      </td>
                      <td>{item.total} days</td>
                      <td>
                        <span className="badge badge-warning">{item.percent}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Employee Leave Balance Table */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">Employee Leave Balances</h3>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {leaveBalances.length} employees
            </span>
          </div>
          <div className="card-body" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Casual</th>
                  <th>Sick</th>
                  <th>Annual</th>
                  <th>Total Used</th>
                  <th>Total Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveBalances.length > 0 ? (
                  leaveBalances.map((balance) => (
                    <tr key={balance._id}>
                      <td>
                        {balance.employee?.user?.name || balance.employee?.employeeId || 'N/A'}
                      </td>
                      <td>{balance.employee?.department || 'N/A'}</td>
                      <td>
                        {balance.balances?.casual?.available || 0} / {balance.balances?.casual?.total || 0}
                      </td>
                      <td>
                        {balance.balances?.sick?.available || 0} / {balance.balances?.sick?.total || 0}
                      </td>
                      <td>
                        {balance.balances?.annual?.available || 0} / {balance.balances?.annual?.total || 0}
                      </td>
                      <td>
                        <strong>
                          {(balance.balances?.casual?.used || 0) + 
                           (balance.balances?.sick?.used || 0) + 
                           (balance.balances?.annual?.used || 0)}
                        </strong>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--success)' }}>
                          {(balance.balances?.casual?.available || 0) + 
                           (balance.balances?.sick?.available || 0) + 
                           (balance.balances?.annual?.available || 0)}
                        </strong>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEditBalance(balance)}
                          title="Edit Leave Balance"
                        >
                          <FiEdit /> Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      No leave balance data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Leave Balance Modal */}
      {editModalOpen && editingBalance && editingEmployee && (
        <EditLeaveBalanceModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingBalance(null);
            setEditingEmployee(null);
          }}
          employee={editingEmployee}
          leaveBalance={editingBalance}
          onSave={handleSaveBalance}
          year={selectedYear}
        />
      )}
    </div>
  );
};

export default LeaveBalanceOverview;
