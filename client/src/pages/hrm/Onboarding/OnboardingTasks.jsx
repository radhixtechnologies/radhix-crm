import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiCheck, FiClock, FiAlertCircle } from 'react-icons/fi';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import { formatDate } from '../../../utils/format';
import '../../../styles/hrm/onboarding.css';

const OnboardingTasks = () => {
  const { employeeId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [employeeId]);

  const fetchTasks = async () => {
    try {
      const res = await hrmService.getOnboardingTasks(employeeId);
      if (res.data.success) {
        setTasks(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await hrmService.updateOnboardingTask(taskId, { status: 'completed' });
      fetchTasks();
    } catch (error) {
      alert('Failed to update task');
    }
  };

  if (loading) return <Loader />;

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="onboarding-tasks-page fade-in">
      <div className="page-header">
        <h1 className="page-title">Onboarding Tasks</h1>
        <div className="progress-indicator">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span>{completedTasks} / {totalTasks} completed ({progress}%)</span>
        </div>
      </div>

      <div className="page-content">
        <div className="tasks-list">
          {tasks.map((task) => (
            <div key={task._id} className={`task-card task-${task.status}`}>
              <div className="task-header">
                <h3>{task.title}</h3>
                <span className={`task-status task-status-${task.status}`}>
                  {task.status}
                </span>
              </div>
              <div className="task-body">
                <p>{task.description}</p>
                <div className="task-meta">
                  <span><strong>Type:</strong> {task.taskType}</span>
                  <span><strong>Priority:</strong> {task.priority}</span>
                  {task.dueDate && (
                    <span><strong>Due:</strong> {formatDate(task.dueDate)}</span>
                  )}
                </div>
              </div>
              {task.status !== 'completed' && (
                <div className="task-actions">
                  <button
                    className="btn btn-success"
                    onClick={() => handleCompleteTask(task._id)}
                  >
                    <FiCheck /> Mark Complete
                  </button>
                </div>
              )}
              {task.completedAt && (
                <div className="task-completed">
                  Completed on {formatDate(task.completedAt)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingTasks;

