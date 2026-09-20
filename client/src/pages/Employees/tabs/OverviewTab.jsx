import { formatDate, formatCurrency } from '../../../utils/format';

const OverviewTab = ({ employee, canEdit, onEdit }) => {
  return (
    <div className="overview-tab">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Personal Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Personal Information</h3>
            {canEdit && (
              <button className="btn btn-sm btn-secondary" onClick={onEdit}>
                Edit
              </button>
            )}
          </div>
          <div style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Name</div>
              <div style={{ fontWeight: 600 }}>{employee.user?.name}</div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Email</div>
              <div>{employee.user?.email}</div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Phone</div>
              <div>{employee.phone || 'N/A'}</div>
            </div>
            {employee.alternatePhone && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Alternate Phone</div>
                <div>{employee.alternatePhone}</div>
              </div>
            )}
            {employee.dateOfBirth && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Date of Birth</div>
                <div>{formatDate(employee.dateOfBirth)}</div>
              </div>
            )}
            {employee.gender && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Gender</div>
                <div style={{ textTransform: 'capitalize' }}>{employee.gender}</div>
              </div>
            )}
            {employee.address && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Address</div>
                <div>
                  {employee.address.street && <div>{employee.address.street}</div>}
                  {(employee.address.city || employee.address.state) && (
                    <div>{employee.address.city}{employee.address.city && employee.address.state && ', '}{employee.address.state}</div>
                  )}
                  {employee.address.zipCode && <div>{employee.address.zipCode}</div>}
                  {employee.address.country && <div>{employee.address.country}</div>}
                </div>
              </div>
            )}
            {employee.emergencyContact?.name && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Emergency Contact</div>
                <div>
                  <strong>{employee.emergencyContact.name}</strong> ({employee.emergencyContact.relation})
                  <div>{employee.emergencyContact.phone}</div>
                  {employee.emergencyContact.email && <div>{employee.emergencyContact.email}</div>}
                </div>
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Status</div>
              <span className={`badge badge-${employee.status === 'active' ? 'success' : employee.status === 'onboarding' ? 'warning' : 'secondary'}`}>
                {employee.status}
              </span>
            </div>
          </div>
        </div>

        {/* Work Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Work Information</h3>
          </div>
          <div style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Department</div>
              <div style={{ fontWeight: 600 }}>{employee.department}</div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Designation</div>
              <div>{employee.designation}</div>
            </div>
            {employee.manager && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Reporting Manager</div>
                <div>{employee.manager.employeeId} - {employee.manager.designation}</div>
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Work Location</div>
              <div style={{ textTransform: 'capitalize' }}>{employee.workLocation || 'office'}</div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Employment Type</div>
              <div style={{ textTransform: 'capitalize' }}>{employee.employmentType || 'full-time'}</div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Joining Date</div>
              <div>{formatDate(employee.joiningDate)}</div>
            </div>
            {employee.probationStatus && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Probation Status</div>
                <span className={`badge badge-${employee.probationStatus === 'completed' ? 'success' : 'warning'}`}>
                  {employee.probationStatus}
                </span>
                {employee.probationEndDate && (
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Until {formatDate(employee.probationEndDate)}</div>
                )}
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Access Level</div>
              <div style={{ textTransform: 'capitalize' }}>{employee.accessLevel || 'employee'}</div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Salary</div>
              <div style={{ fontWeight: 600 }}>{formatCurrency(employee.salary)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;

