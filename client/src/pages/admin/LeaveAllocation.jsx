import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiUsers, FiCalendar, FiPlus, FiRefreshCw, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import '../../styles/forms.css';

/**
 * Admin Leave Allocation Page
 * Allows admins to allocate leave to employees or departments
 */
const LeaveAllocation = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [allocationMode, setAllocationMode] = useState('employee'); // 'employee' or 'department'
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Leave allocation form data
  const [formData, setFormData] = useState({
    casual: '',
    sick: '',
    annual: '',
    maternity: '',
    paternity: '',
    unpaid: '',
    carryForwardCasual: '',
    carryForwardAnnual: '',
    year: new Date().getFullYear(),
  });

  const departments = ['IT', 'HR', 'Finance', 'Sales', 'Management', 'Operations', 'Engineering', 'Marketing', 'Customer Support'];

  useEffect(() => {
    fetchEmployees();
    fetchCurrentAllocations();
  }, [selectedYear]);

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

  const fetchCurrentAllocations = async () => {
    try {
      setLoading(true);
      // Fetch leave balances for current year to show in table
      const balances = [];
      for (const emp of employees) {
        try {
          const response = await employeeService.getLeaveBalance(emp._id, { year: selectedYear });
          if (response.data.success && response.data.data) {
            balances.push(response.data.data);
          }
        } catch (error) {
          // Skip if balance doesn't exist
        }
      }
      setAllocations(balances);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employees.length > 0) {
      fetchCurrentAllocations();
    }
  }, [selectedYear, employees.length]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : parseFloat(value) || 0,
    }));
  };

  const handleAllocateLeave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const payload = {
        year: formData.year || selectedYear,
      };

      // Add leave types if provided
      if (formData.casual !== '') payload.casual = parseFloat(formData.casual);
      if (formData.sick !== '') payload.sick = parseFloat(formData.sick);
      if (formData.annual !== '') payload.annual = parseFloat(formData.annual);
      if (formData.maternity !== '') payload.maternity = parseFloat(formData.maternity);
      if (formData.paternity !== '') payload.paternity = parseFloat(formData.paternity);
      if (formData.unpaid !== '') payload.unpaid = parseFloat(formData.unpaid);

      // Add carry forward if provided
      if (formData.carryForwardCasual !== '' || formData.carryForwardAnnual !== '') {
        payload.carryForward = {
          casual: parseFloat(formData.carryForwardCasual) || 0,
          annual: parseFloat(formData.carryForwardAnnual) || 0,
        };
      }

      let response;
      if (allocationMode === 'employee') {
        if (!selectedEmployee) {
          setErrorMessage('Please select an employee');
          setLoading(false);
          return;
        }
        response = await employeeService.allocateLeaveToEmployee(selectedEmployee, payload);
      } else {
        if (!selectedDepartment) {
          setErrorMessage('Please select a department');
          setLoading(false);
          return;
        }
        response = await employeeService.allocateLeaveToDepartment(selectedDepartment, payload);
      }

      if (response.data.success) {
        setSuccessMessage(response.data.message || 'Leave allocated successfully!');
        // Reset form
        setFormData({
          casual: '',
          sick: '',
          annual: '',
          maternity: '',
          paternity: '',
          unpaid: '',
          carryForwardCasual: '',
          carryForwardAnnual: '',
          year: new Date().getFullYear(),
        });
        setSelectedEmployee('');
        setSelectedDepartment('');
        
        // Refresh allocations
        setTimeout(() => {
          fetchCurrentAllocations();
          setSuccessMessage('');
        }, 2000);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Error allocating leave');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleResetYearlyLeaves = async () => {
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const payload = {
        year: selectedYear,
        defaultAllocation: {
          casual: 12,
          sick: 10,
          annual: 15,
          maternity: 0,
          paternity: 0,
          unpaid: 0,
        },
        carryForwardPolicy: {
          allowCarryForward: true,
          allowCasualCarryForward: false,
          maxCarryForwardDays: 5,
        },
      };

      const response = await employeeService.resetYearlyLeaves(payload);
      if (response.data.success) {
        setSuccessMessage(response.data.message || 'Leave balances reset successfully!');
        setShowResetModal(false);
        setTimeout(() => {
          fetchCurrentAllocations();
          setSuccessMessage('');
        }, 2000);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Error resetting leaves');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoading(false);
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

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">Leave Allocation</h1>
            <p className="page-subtitle">Allocate leave days to employees or departments</p>
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
            <button
              className="btn btn-secondary"
              onClick={() => setShowResetModal(true)}
            >
              <FiRefreshCw /> Reset Yearly Leaves
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiCheckCircle /> {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiAlertCircle /> {errorMessage}
          </div>
        )}

        {/* Allocation Form */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">Allocate Leave</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleAllocateLeave}>
              {/* Mode Selection */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Allocation Mode</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="allocationMode"
                      value="employee"
                      checked={allocationMode === 'employee'}
                      onChange={(e) => setAllocationMode(e.target.value)}
                    />
                    <FiUsers /> Employee
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="allocationMode"
                      value="department"
                      checked={allocationMode === 'department'}
                      onChange={(e) => setAllocationMode(e.target.value)}
                    />
                    <FiUsers /> Department
                  </label>
                </div>
              </div>

              {/* Employee/Department Selector */}
              {allocationMode === 'employee' ? (
                <div className="form-group">
                  <label className="form-label">Select Employee *</label>
                  <select
                    className="form-select"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    required
                  >
                    <option value="">Select an employee</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.employeeId} - {emp.user?.name || 'N/A'} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Select Department *</label>
                  <select
                    className="form-select"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    required
                  >
                    <option value="">Select a department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Year Input */}
              <div className="form-group">
                <label className="form-label">Year *</label>
                <input
                  type="number"
                  className="form-input"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="2000"
                  max="2100"
                  required
                />
              </div>

              {/* Leave Type Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Casual Leave (CL)</label>
                  <input
                    type="number"
                    className="form-input"
                    name="casual"
                    value={formData.casual}
                    onChange={handleInputChange}
                    min="0"
                    step="0.5"
                    placeholder="Days"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sick Leave (SL)</label>
                  <input
                    type="number"
                    className="form-input"
                    name="sick"
                    value={formData.sick}
                    onChange={handleInputChange}
                    min="0"
                    step="0.5"
                    placeholder="Days"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Annual Leave (AL)</label>
                  <input
                    type="number"
                    className="form-input"
                    name="annual"
                    value={formData.annual}
                    onChange={handleInputChange}
                    min="0"
                    step="0.5"
                    placeholder="Days"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Maternity Leave (ML)</label>
                  <input
                    type="number"
                    className="form-input"
                    name="maternity"
                    value={formData.maternity}
                    onChange={handleInputChange}
                    min="0"
                    step="0.5"
                    placeholder="Days"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Paternity Leave (PL)</label>
                  <input
                    type="number"
                    className="form-input"
                    name="paternity"
                    value={formData.paternity}
                    onChange={handleInputChange}
                    min="0"
                    step="0.5"
                    placeholder="Days"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unpaid Leave (UL)</label>
                  <input
                    type="number"
                    className="form-input"
                    name="unpaid"
                    value={formData.unpaid}
                    onChange={handleInputChange}
                    min="0"
                    step="0.5"
                    placeholder="Days"
                  />
                </div>
              </div>

              {/* Carry Forward */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '16px', fontSize: '16px' }}>Carry Forward (Optional)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Casual Leave Carry Forward</label>
                    <input
                      type="number"
                      className="form-input"
                      name="carryForwardCasual"
                      value={formData.carryForwardCasual}
                      onChange={handleInputChange}
                      min="0"
                      step="0.5"
                      placeholder="Days"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Annual Leave Carry Forward</label>
                    <input
                      type="number"
                      className="form-input"
                      name="carryForwardAnnual"
                      value={formData.carryForwardAnnual}
                      onChange={handleInputChange}
                      min="0"
                      step="0.5"
                      placeholder="Days"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                <FiPlus /> {loading ? 'Allocating...' : 'Allocate Leave'}
              </button>
            </form>
          </div>
        </div>

        {/* Current Allocations Table */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">Current Leave Allocations - {selectedYear}</h3>
            <button className="btn btn-secondary btn-sm" onClick={fetchCurrentAllocations}>
              <FiRefreshCw /> Refresh
            </button>
          </div>
          <div className="card-body" style={{ overflowX: 'auto' }}>
            {loading ? (
              <Loader />
            ) : allocations.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Casual</th>
                    <th>Sick</th>
                    <th>Annual</th>
                    <th>Maternity</th>
                    <th>Paternity</th>
                    <th>Unpaid</th>
                    <th>Total Used</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((allocation) => (
                    <tr key={allocation._id}>
                      <td>
                        {allocation.employee?.employeeId || 'N/A'} - {allocation.employee?.user?.name || 'N/A'}
                      </td>
                      <td>{allocation.employee?.department || 'N/A'}</td>
                      <td>
                        {allocation.casual || allocation.balances?.casual?.total || 0}
                        {allocation.carryForward?.casual > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--info)', marginLeft: '4px' }}>
                            (CF: +{allocation.carryForward.casual})
                          </span>
                        )}
                      </td>
                      <td>{allocation.sick || allocation.balances?.sick?.total || 0}</td>
                      <td>
                        {allocation.annual || allocation.balances?.annual?.total || 0}
                        {allocation.carryForward?.annual > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--info)', marginLeft: '4px' }}>
                            (CF: +{allocation.carryForward.annual})
                          </span>
                        )}
                      </td>
                      <td>{allocation.maternity || allocation.balances?.maternity?.total || 0}</td>
                      <td>{allocation.paternity || allocation.balances?.paternity?.total || 0}</td>
                      <td>{allocation.unpaid || allocation.balances?.unpaid?.total || 0}</td>
                      <td>
                        <strong>
                          {(allocation.used?.casual || 0) +
                           (allocation.used?.sick || 0) +
                           (allocation.used?.annual || 0) +
                           (allocation.used?.maternity || 0) +
                           (allocation.used?.paternity || 0)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <FiCalendar size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>No leave allocations found for {selectedYear}</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  Use the form above to allocate leaves to employees or departments.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reset Yearly Leaves Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Reset Yearly Leaves</h3>
              <button className="modal-close" onClick={() => setShowResetModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>This will reset leave balances for <strong>{selectedYear}</strong> for all active employees.</p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '12px' }}>
                Default allocations will be:
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  <li>Casual: 12 days</li>
                  <li>Sick: 10 days</li>
                  <li>Annual: 15 days</li>
                </ul>
                Unused annual leaves (up to 5 days) will be carried forward automatically.
              </p>
              <p style={{ fontSize: '14px', color: 'var(--warning)', marginTop: '12px', fontWeight: 500 }}>
                ⚠️ This action cannot be undone. Make sure you have backed up the data if needed.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowResetModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleResetYearlyLeaves} disabled={loading}>
                {loading ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveAllocation;
