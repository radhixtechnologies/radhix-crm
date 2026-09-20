import { formatDate } from '../../utils/format';
import '../../styles/employees.css';

const EmployeeCard = ({ employee, onClick }) => {
  return (
    <div className="employee-card" onClick={onClick}>
      <div className="employee-card-header">
        <h3>{employee.user?.name || 'N/A'}</h3>
        <span className={`badge badge-${employee.status === 'active' ? 'success' : 'secondary'}`}>
          {employee.status}
        </span>
      </div>
      <div className="employee-card-body">
        <div className="employee-card-field">
          <span className="label">Employee ID:</span>
          <span className="value">{employee.employeeId}</span>
        </div>
        <div className="employee-card-field">
          <span className="label">Department:</span>
          <span className="value">{employee.department}</span>
        </div>
        <div className="employee-card-field">
          <span className="label">Designation:</span>
          <span className="value">{employee.designation}</span>
        </div>
        {employee.joiningDate && (
          <div className="employee-card-field">
            <span className="label">Joined:</span>
            <span className="value">{formatDate(employee.joiningDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeCard;

