import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { FiUser, FiBriefcase, FiEye, FiEyeOff } from 'react-icons/fi';
import '../../styles/forms.css';

const EmployeeForm = ({ onSubmit, initialData = null, loading = false }) => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    userId: '',
    employeeId: '',
    department: '',
    designation: '',
    role: '',
    salary: '',
    phone: '',
    name: '',
    email: '',
    password: '',
    idDeptCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        userId: initialData.user?._id || '',
        employeeId: initialData.employeeId || '',
        department: initialData.department || '',
        designation: initialData.designation || '',
        role: initialData.user?.role?._id || initialData.user?.role || '',
        salary: initialData.salary || '',
        phone: initialData.phone || '',
        name: initialData.user?.name || '',
        email: initialData.user?.email || '',
      });
    }
    fetchUsers();
    fetchRoles();
  }, [initialData]);

  const fetchUsers = async () => {
    try {
      const response = await userService.getUsers();
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await userService.getRoles();
      if (response.data.success) {
        setRoles(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="employee-form">
      {/* Section 1: Basic Information */}
      <div className="form-section">
        <h3 className="form-section-title">
          <FiUser /> Basic Information
        </h3>
        <div className="form-grid">
          {!initialData && (
            <>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Employee name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="employee@example.com"
                />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="text"
              name="phone"
              autoComplete="off"
              className="form-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1234567890"
            />
          </div>
          {!initialData && (
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave empty to auto-generate"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '5px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <div className="form-helper">
                {formData.password ? 'Password will be used for the user account' : 'A secure password will be auto-generated if left empty'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Employment Details */}
      <div className="form-section">
        <h3 className="form-section-title">
          <FiBriefcase /> Employment Details
        </h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Department *</label>
            <select
              className="form-select"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
            >
              <option value="">Select Department</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Sales">Sales</option>
              <option value="Management">Management</option>
              <option value="Operations">Operations</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Designation *</label>
            <input
              type="text"
              className="form-input"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              required
              placeholder="e.g., Software Developer"
            />
          </div>
          {(isAdmin || isSuperAdmin) && (
            <div className="form-group">
              <label className="form-label">Role (Optional)</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="">Default based on Dept</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Employee ID</label>
            <input
              type="text"
              className="form-input"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              placeholder="ZY26/ND/DEV/0019"
            />
            <div className="form-helper">Leave blank to auto-generate</div>
          </div>
          {!initialData && (
            <div className="form-group">
              <label className="form-label">Dept Code for ID {!formData.employeeId && '*'}</label>
              <select
                className="form-select"
                value={formData.idDeptCode}
                onChange={(e) => setFormData({ ...formData, idDeptCode: e.target.value })}
                required={!formData.employeeId}
              >
                <option value="">Select Dept Code</option>
                <option value="DEV">DEV (Development)</option>
                <option value="MKT">MKT (Marketing)</option>
                <option value="DM">DM (Digital Marketing)</option>
                <option value="GD">GD (Graphic Design)</option>
                <option value="HR">HR (Human Resources)</option>
              </select>
              {!formData.employeeId && <div className="form-helper">Required for auto-ID</div>}
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Financial Details */}
      <div className="form-section">
        <h3 className="form-section-title">
          Financial Details
        </h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Annual Salary</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
                fontSize: '14px'
              }}>₹</span>
              <input
                type="number"
                className="form-input"
                style={{ paddingLeft: '28px' }}
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button type="button" className="btn btn-secondary" onClick={() => window.history.back()}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '120px' }}>
          {loading ? 'Processing...' : initialData ? 'Update Profile' : 'Create Employee'}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;

