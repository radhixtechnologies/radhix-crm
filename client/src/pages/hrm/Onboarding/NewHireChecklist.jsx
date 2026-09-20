import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiCheck, FiClock, FiUser, FiMail } from 'react-icons/fi';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import { formatDate } from '../../../utils/format';
import '../../../styles/hrm/onboarding.css';

const NewHireChecklist = () => {
  const { employeeId } = useParams();
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChecklist();
  }, [employeeId]);

  const fetchChecklist = async () => {
    try {
      const res = await hrmService.getNewHireChecklist(employeeId);
      if (res.data.success) {
        setChecklist(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!checklist) return <div>Checklist not found</div>;

  const { employee, tasks, progress } = checklist;

  return (
    <div className="new-hire-checklist-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Hire Checklist</h1>
          <p className="page-subtitle">
            {employee.user?.name || employee.employeeId} • {employee.department}
          </p>
        </div>
        <div className="progress-summary">
          <div className="progress-circle">
            <div className="progress-value">{progress.completed}</div>
            <div className="progress-total">/ {progress.total}</div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="employee-info-card">
          <h3>Employee Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <FiUser /> <strong>Employee ID:</strong> {employee.employeeId}
            </div>
            <div className="info-item">
              <FiMail /> <strong>Email:</strong> {employee.user?.email || 'N/A'}
            </div>
            <div className="info-item">
              <strong>Department:</strong> {employee.department}
            </div>
            <div className="info-item">
              <strong>Designation:</strong> {employee.designation}
            </div>
            <div className="info-item">
              <strong>Joining Date:</strong> {formatDate(employee.joiningDate)}
            </div>
            <div className="info-item">
              <strong>Status:</strong> <span className={`status-badge status-${employee.status}`}>{employee.status}</span>
            </div>
          </div>
        </div>

        <div className="checklist-section">
          <h3>Onboarding Tasks</h3>
          <div className="tasks-checklist">
            {tasks.map((task) => (
              <div key={task._id} className={`checklist-item ${task.status === 'completed' ? 'completed' : ''}`}>
                <div className="checklist-item-content">
                  <div className="checklist-icon">
                    {task.status === 'completed' ? (
                      <FiCheck className="icon-check" />
                    ) : (
                      <FiClock className="icon-pending" />
                    )}
                  </div>
                  <div className="checklist-details">
                    <h4>{task.title}</h4>
                    <p>{task.description}</p>
                    <div className="checklist-meta">
                      <span className={`priority-badge priority-${task.priority}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="due-date">Due: {formatDate(task.dueDate)}</span>
                      )}
                      {task.assignedTo && (
                        <span>Assigned to: {task.assignedTo.name}</span>
                      )}
                    </div>
                  </div>
                  {task.status === 'completed' && task.completedAt && (
                    <div className="completed-info">
                      Completed on {formatDate(task.completedAt)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewHireChecklist;

