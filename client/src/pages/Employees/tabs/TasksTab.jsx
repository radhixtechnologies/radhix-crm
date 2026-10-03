import { useState, useEffect } from 'react';
import { employeeService } from '../../../services/employeeService';
import { formatDate } from '../../../utils/format';
import TaskBoard from '../../../components/Employees/TaskBoard';
import '../../../styles/forms.css';

const TasksTab = ({ employeeId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      fetchTasks();
    }
  }, [employeeId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getTasks();
      if (response.data.success) {
        const empTasks = response.data.data.filter(t => t.assignedTo?._id === employeeId);
        setTasks(empTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading tasks...</div>;
  }

  return (
    <div className="tasks-tab">
      <div className="card">
        <h3 className="card-title">Assigned Tasks</h3>
        {tasks.length > 0 ? (
          <TaskBoard tasks={tasks} />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No tasks assigned
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksTab;

