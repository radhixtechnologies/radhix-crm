import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { financeService } from '../../services/financeService';
import { payrollService } from '../../services/payrollService';
import { employeeService } from '../../services/employeeService';
import Loader from '../../components/common/Loader';
import '../../styles/finance/salary-slip.css';
import '../../styles/finance/payroll-ui.css';
import { FiUser, FiDollarSign, FiCalendar, FiClock, FiX } from 'react-icons/fi';

const GenerateSalarySlip = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin, hasFullModuleAccess } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    paymentDate: new Date().toISOString().split('T')[0],
    earnings: {
      basic: 0,
      hra: 0,
      allowances: 0,
      bonus: 0,
      overtime: 0,
    },
    deductions: {
      pf: 0,
      tax: 0,
      esi: 0,
      loan: 0,
      unpaidLeave: 0,
      other: 0,
    },
  });

  const [attendanceData, setAttendanceData] = useState({
    workingDays: 0,
    presentDays: 0,
    absentDays: 0,
    unpaidLeaveDays: 0,
    totalOvertimeHours: 0,
  });

  const [autoCalculating, setAutoCalculating] = useState(false);

  const [calculatedTotals, setCalculatedTotals] = useState({
    totalEarnings: 0,
    totalDeductions: 0,
    netSalary: 0,
  });

  useEffect(() => {
    fetchEmployees();
     
  }, [isAdmin, isSuperAdmin]);

  // Debug: Log when employees change
  useEffect(() => {
    console.log('Employees state updated:', employees.length, 'employees');
    console.log('Current user role:', user?.role, 'isAdmin:', isAdmin, 'isSuperAdmin:', isSuperAdmin);
  }, [employees, user, isAdmin, isSuperAdmin]);

  useEffect(() => {
    calculateTotals();
  }, [formData.earnings, formData.deductions]);

  useEffect(() => {
    if (formData.employeeId && formData.month && formData.year) {
      fetchSalaryCalculation();
    } else {
      // Reset form when employee/month/year changes
      setFormData(prev => ({
        ...prev,
        earnings: { basic: 0, hra: 0, allowances: 0, bonus: 0, overtime: 0 },
        deductions: { pf: 0, tax: 0, esi: 0, loan: 0, unpaidLeave: 0, other: 0 },
      }));
      setAttendanceData({
        workingDays: 0,
        presentDays: 0,
        absentDays: 0,
        unpaidLeaveDays: 0,
        totalOvertimeHours: 0,
      });
    }
  }, [formData.employeeId, formData.month, formData.year]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      // Use payroll service to get employees
      const res = await payrollService.getPayrollEmployees();
      console.log('Payroll Employees API Response:', res.data);

      if (res.data.success) {
        const employeesList = res.data.data || [];
        console.log('Total employees fetched:', employeesList.length);

        // Show ALL employees - no filtering by user role
        setEmployees(employeesList);

        if (employeesList.length === 0) {
          console.warn('No employees found in the system.');
        }
      } else {
        console.error('API returned success: false', res.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert('Failed to fetch employees. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryCalculation = async () => {
    if (!formData.employeeId || !formData.month || !formData.year) return;

    try {
      setAutoCalculating(true);
      // Use new payroll service endpoint
      const res = await payrollService.getSalaryCalculation(
        formData.employeeId,
        formData.month,
        formData.year
      );

      if (res.data.success) {
        const data = res.data.data;
        setFormData(prev => ({
          ...prev,
          earnings: {
            basic: data.earnings.basic || 0,
            hra: data.earnings.hra || 0,
            allowances: data.earnings.allowances || 0,
            bonus: data.earnings.bonus || 0,
            overtime: data.earnings.overtime || 0,
          },
          deductions: {
            pf: data.deductions.pf || 0,
            tax: data.deductions.tax || 0,
            esi: data.deductions.esi || 0,
            loan: data.deductions.loan || 0,
            unpaidLeave: data.deductions.unpaidLeave || 0,
            other: 0,
          },
        }));
        setAttendanceData(data.attendance || {});
      }
    } catch (error) {
      console.error('Error fetching salary calculation:', error);
      // Don't show error if salary structure doesn't exist yet
      if (error.response?.status !== 404) {
        alert(error.response?.data?.message || 'Failed to fetch salary calculation data');
      }
    } finally {
      setAutoCalculating(false);
    }
  };

  const calculateTotals = () => {
    const totalEarnings =
      (formData.earnings.basic || 0) +
      (formData.earnings.hra || 0) +
      (formData.earnings.allowances || 0) +
      (formData.earnings.bonus || 0) +
      (formData.earnings.overtime || 0);

    const totalDeductions =
      (formData.deductions.pf || 0) +
      (formData.deductions.tax || 0) +
      (formData.deductions.esi || 0) +
      (formData.deductions.loan || 0) +
      (formData.deductions.unpaidLeave || 0) +
      (formData.deductions.other || 0);

    const netSalary = totalEarnings - totalDeductions;

    setCalculatedTotals({ totalEarnings, totalDeductions, netSalary });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: parseFloat(value) || 0,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'month' || name === 'year' ? parseInt(value) : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.employeeId) {
      alert('Please select an employee');
      return;
    }

    try {
      setLoading(true);
      // Use new payroll service endpoint
      const res = await payrollService.generateSalarySlip(formData);

      let message = 'Salary slip generated successfully!';
      if (res.data.warning) {
        message += `\n\nWarning: ${res.data.warning}`;
      }

      alert(message);
      navigate('/finance/salary-slips');
    } catch (error) {
      console.error('Error creating salary slip:', error);
      alert(error.response?.data?.message || 'Failed to generate salary slip');
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="generate-salary-slip-page fade-in">
      <div className="page-header">
        <h1 className="page-title">Generate Salary Slip</h1>
        <p className="page-subtitle">
          {hasFullModuleAccess('finance') && 'Create a new salary slip for an employee'}
        </p>
      </div>

      <div className="page-content">
        {(loading || autoCalculating) && <Loader />}
        <form onSubmit={handleSubmit} className="salary-slip-form" style={{ opacity: (loading || autoCalculating) ? 0.5 : 1, pointerEvents: (loading || autoCalculating) ? 'none' : 'auto' }}>
          {autoCalculating && (
            <div style={{ padding: '16px', background: 'var(--info)', color: 'white', borderRadius: '8px', marginBottom: '20px' }}>
              Auto-calculating salary components...
            </div>
          )}
          <div className="form-section">
            <h3 className="section-title">Employee Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Employee *</label>
                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">
                    {loading
                      ? 'Loading employees...'
                      : employees.length === 0
                        ? 'No employees available'
                        : 'Select Employee'}
                  </option>
                  {employees.map((emp) => {
                    const hasUser = emp.linkedUser?.exists || emp.user;
                    const userRole = emp.linkedUser?.role || emp.user?.role;
                    const displayName = emp.name || emp.user?.name || 'N/A';

                    return (
                      <option key={emp._id} value={emp._id}>
                        {displayName} - {emp.employeeId}
                        {hasUser ? ` (Role: ${userRole})` : ' (No linked user)'}
                      </option>
                    );
                  })}
                </select>
                {employees.length === 0 && !loading && (
                  <div style={{ marginTop: '8px', padding: '12px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', fontSize: '13px' }}>
                    <strong>⚠️ No employees found.</strong>
                    <br />
                    <small>Make sure employees exist in the system.</small>
                  </div>
                )}
                {formData.employeeId && employees.find(emp => emp._id === formData.employeeId) && (() => {
                  const selectedEmp = employees.find(emp => emp._id === formData.employeeId);
                  const hasUser = selectedEmp.linkedUser?.exists || selectedEmp.user;
                  const userRole = selectedEmp.linkedUser?.role || selectedEmp.user?.role;
                  const showWarning = hasUser && (
                    (isAdmin && userRole !== 'employee') ||
                    (isSuperAdmin && userRole !== 'admin')
                  );

                  return (
                    <>
                      <div className="employee-details-card" style={{ marginTop: '20px' }}>
                        <div className="employee-avatar-wrapper">
                          <FiUser />
                        </div>
                        <div className="employee-info-grid">
                          <div className="info-stat">
                            <span className="stat-label">Full Name</span>
                            <span className="stat-value">{selectedEmp.name || selectedEmp.user?.name || 'N/A'}</span>
                          </div>
                          <div className="info-stat">
                            <span className="stat-label">Employee ID</span>
                            <span className="stat-value">{selectedEmp.employeeId}</span>
                          </div>
                          <div className="info-stat">
                            <span className="stat-label">Department</span>
                            <span className="stat-value">{selectedEmp.department || 'N/A'}</span>
                          </div>
                          <div className="info-stat">
                            <span className="stat-label">Designation</span>
                            <span className="stat-value">{selectedEmp.designation || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {showWarning && (
                        <div className="alert alert-warning" style={{ marginTop: '12px' }}>
                          <strong>⚠️ Warning:</strong> This employee's user account has incorrect role. Current role: <strong>{userRole}</strong>. Expected: <strong>{isAdmin ? 'employee' : 'admin'}</strong>. Salary slip generation will proceed anyway.
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="form-group">
                <label>Month *</label>
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  required
                >
                  {months.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Year *</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="2020"
                  max="2099"
                  required
                />
              </div>

              <div className="form-group">
                <label>Payment Date</label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Earnings</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Basic Salary (₹)</label>
                <input
                  type="number"
                  name="earnings.basic"
                  value={formData.earnings.basic}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>HRA (₹)</label>
                <input
                  type="number"
                  name="earnings.hra"
                  value={formData.earnings.hra}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Allowances (₹)</label>
                <input
                  type="number"
                  name="earnings.allowances"
                  value={formData.earnings.allowances}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Bonus (₹)</label>
                <input
                  type="number"
                  name="earnings.bonus"
                  value={formData.earnings.bonus}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Overtime Pay (₹)</label>
                <input
                  type="number"
                  name="earnings.overtime"
                  value={formData.earnings.overtime}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
                {attendanceData.totalOvertimeHours > 0 && (
                  <small style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {attendanceData.totalOvertimeHours.toFixed(2)} hours calculated
                  </small>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Attendance Summary</h3>
            <div className="attendance-summary-card">
              <div className="attendance-row">
                <span>Working Days:</span>
                <span>{attendanceData.workingDays || 0}</span>
              </div>
              <div className="attendance-row">
                <span>Present Days:</span>
                <span>{attendanceData.presentDays || 0}</span>
              </div>
              <div className="attendance-row">
                <span>Absent Days:</span>
                <span>{attendanceData.absentDays || 0}</span>
              </div>
              <div className="attendance-row">
                <span>Unpaid Leave Days:</span>
                <span style={{ color: 'var(--error)' }}>{attendanceData.unpaidLeaveDays || 0}</span>
              </div>
              <div className="attendance-row">
                <span>Overtime Hours:</span>
                <span style={{ color: 'var(--success)' }}>{attendanceData.totalOvertimeHours?.toFixed(2) || 0}</span>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Deductions</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>PF (₹)</label>
                <input
                  type="number"
                  name="deductions.pf"
                  value={formData.deductions.pf}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Tax / TDS (₹)</label>
                <input
                  type="number"
                  name="deductions.tax"
                  value={formData.deductions.tax}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>ESI (₹)</label>
                <input
                  type="number"
                  name="deductions.esi"
                  value={formData.deductions.esi}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Loan (₹)</label>
                <input
                  type="number"
                  name="deductions.loan"
                  value={formData.deductions.loan}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Unpaid Leave (₹)</label>
                <input
                  type="number"
                  name="deductions.unpaidLeave"
                  value={formData.deductions.unpaidLeave}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
                {attendanceData.unpaidLeaveDays > 0 && (
                  <small style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {attendanceData.unpaidLeaveDays} day(s) deducted
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Other Deductions (₹)</label>
                <input
                  type="number"
                  name="deductions.other"
                  value={formData.deductions.other}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className="summary-section" style={{ marginTop: '24px' }}>
            <h3 className="section-title">Salary Slip Summary</h3>
            <div className="payroll-summary-clean">
              <div className="summary-premium-row">
                <span className="premium-label">Total Earnings (Gross)</span>
                <span className="premium-value" style={{ color: '#10b981' }}>₹{calculatedTotals.totalEarnings.toFixed(2)}</span>
              </div>
              <div className="summary-premium-row">
                <span className="premium-label">Total Deductions</span>
                <span className="premium-value" style={{ color: '#ef4444' }}>₹{calculatedTotals.totalDeductions.toFixed(2)}</span>
              </div>
              <div className="summary-premium-row">
                <span className="premium-label">NET SALARY PAYABLE</span>
                <span className="net-salary-premium">
                  ₹{calculatedTotals.netSalary.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/finance/salary-slips')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Salary Slip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateSalarySlip;

