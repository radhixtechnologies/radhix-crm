import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCalendar, FiUser, FiTrendingUp, FiBriefcase, FiDollarSign, FiArrowRight, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import { hrmService } from '../../../services/hrmService';
import { employeeService } from '../../../services/employeeService';
import Loader from '../../../components/common/Loader';
import { formatDate } from '../../../utils/format';
import '../../../styles/hrm/lifecycle.css';

const EmployeeTimeline = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    if (employeeId) {
      fetchData();
    }
  }, [employeeId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timelineRes, employeeRes] = await Promise.all([
        hrmService.getEmployeeTimeline(employeeId),
        employeeService.getEmployee(employeeId),
      ]);

      if (timelineRes.data.success) {
        setTimeline(timelineRes.data.data || []);
      }
      if (employeeRes.data.success) {
        setEmployee(employeeRes.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'joining':
        return <FiUser className="event-icon" style={{ color: '#22c55e' }} />;
      case 'promotion':
        return <FiTrendingUp className="event-icon" style={{ color: '#3b82f6' }} />;
      case 'transfer':
        return <FiArrowRight className="event-icon" style={{ color: '#8b5cf6' }} />;
      case 'compensation_update':
        return <FiDollarSign className="event-icon" style={{ color: '#10b981' }} />;
      case 'role_change':
      case 'department_change':
        return <FiBriefcase className="event-icon" style={{ color: '#f59e0b' }} />;
      case 'probation_complete':
        return <FiCheckCircle className="event-icon" style={{ color: '#22c55e' }} />;
      case 'exit':
        return <FiXCircle className="event-icon" style={{ color: '#ef4444' }} />;
      default:
        return <FiCalendar className="event-icon" style={{ color: '#6b7280' }} />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <FiCheckCircle className="status-icon" style={{ color: '#22c55e' }} />;
      case 'pending':
        return <FiClock className="status-icon" style={{ color: '#f59e0b' }} />;
      case 'rejected':
        return <FiXCircle className="status-icon" style={{ color: '#ef4444' }} />;
      default:
        return null;
    }
  };

  const getEventTitle = (event) => {
    if (event.title) return event.title;
    
    switch (event.eventType) {
      case 'joining':
        return 'Joined Organization';
      case 'promotion':
        return `Promoted to ${event.details?.newDesignation || 'New Position'}`;
      case 'transfer':
        return `Transferred to ${event.details?.newDepartment || 'New Department'}`;
      case 'compensation_update':
        return 'Compensation Updated';
      case 'role_change':
        return `Role Changed to ${event.details?.newRole || 'New Role'}`;
      case 'department_change':
        return `Department Changed to ${event.details?.newDepartment || 'New Department'}`;
      case 'probation_complete':
        return 'Probation Completed';
      case 'exit':
        return 'Exit';
      default:
        return 'Lifecycle Event';
    }
  };

  const getEventDescription = (event) => {
    if (event.description) return event.description;

    const details = event.details || {};
    
    switch (event.eventType) {
      case 'promotion':
        return `Promoted from ${details.oldDesignation || 'Previous Position'} to ${details.newDesignation || 'New Position'}`;
      case 'transfer':
        return `Transferred from ${details.fromLocation || details.oldDepartment || 'Previous Location'} to ${details.toLocation || details.newDepartment || 'New Location'}`;
      case 'compensation_update':
        return `Salary updated from ${details.oldSalary ? `$${details.oldSalary.toLocaleString()}` : 'Previous'} to ${details.newSalary ? `$${details.newSalary.toLocaleString()}` : 'New'}`;
      case 'role_change':
        return `Role changed from ${details.oldRole || 'Previous Role'} to ${details.newRole || 'New Role'}`;
      case 'department_change':
        return `Department changed from ${details.oldDepartment || 'Previous Department'} to ${details.newDepartment || 'New Department'}`;
      default:
        return '';
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="page-container">Error: {error}</div>;

  return (
    <div className="page-container lifecycle-timeline-page">
      <div className="page-header">
        <div>
          <h1>Employee Lifecycle Timeline</h1>
          {employee && (
            <p className="page-subtitle">
              {employee.user?.name || 'Employee'} - {employee.employeeId}
            </p>
          )}
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>

      {employee && (
        <div className="employee-summary-card">
          <div className="summary-item">
            <label>Department</label>
            <span>{employee.department || 'N/A'}</span>
          </div>
          <div className="summary-item">
            <label>Designation</label>
            <span>{employee.designation || 'N/A'}</span>
          </div>
          <div className="summary-item">
            <label>Joining Date</label>
            <span>{employee.joiningDate ? formatDate(employee.joiningDate) : 'N/A'}</span>
          </div>
          <div className="summary-item">
            <label>Status</label>
            <span className={`status-badge status-${employee.status || 'active'}`}>
              {employee.status || 'Active'}
            </span>
          </div>
        </div>
      )}

      {timeline.length === 0 ? (
        <div className="empty-state">
          <FiCalendar size={48} />
          <h3>No Timeline Events</h3>
          <p>This employee has no lifecycle events recorded yet.</p>
        </div>
      ) : (
        <div className="timeline-container">
          <div className="timeline-line"></div>
          {timeline.map((event, index) => (
            <div key={event._id || index} className="timeline-item">
              <div className="timeline-marker">
                {getEventIcon(event.eventType)}
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <div className="timeline-title-row">
                    <h3 className="timeline-title">{getEventTitle(event)}</h3>
                    {event.status && getStatusIcon(event.status)}
                  </div>
                  <span className="timeline-date">
                    {formatDate(event.eventDate)}
                  </span>
                </div>
                
                {getEventDescription(event) && (
                  <p className="timeline-description">{getEventDescription(event)}</p>
                )}

                {event.details && (
                  <div className="timeline-details">
                    {event.details.incrementPercentage && (
                      <div className="detail-item">
                        <strong>Increment:</strong> {event.details.incrementPercentage}%
                      </div>
                    )}
                    {event.details.effectiveDate && (
                      <div className="detail-item">
                        <strong>Effective Date:</strong> {formatDate(event.details.effectiveDate)}
                      </div>
                    )}
                    {event.details.transferReason && (
                      <div className="detail-item">
                        <strong>Reason:</strong> {event.details.transferReason}
                      </div>
                    )}
                  </div>
                )}

                {event.approvedBy && (
                  <div className="timeline-meta">
                    <span>Approved by: {event.approvedBy?.name || 'N/A'}</span>
                  </div>
                )}

                {event.initiatedBy && event.initiatedBy._id !== event.approvedBy?._id && (
                  <div className="timeline-meta">
                    <span>Initiated by: {event.initiatedBy?.name || 'N/A'}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeTimeline;














