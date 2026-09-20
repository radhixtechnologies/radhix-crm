import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiTarget, FiPlus, FiCalendar } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import GoalCard from '../../components/Performance/GoalCard';
import Modal from '../../components/common/Modal';
import '../../styles/performance.css';

/**
 * My Goals Page - Employee View
 * Displays employee's performance goals
 */
const MyGoals = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [employeeId, setEmployeeId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchEmployee();
  }, []);

  useEffect(() => {
    if (employeeId) {
      fetchGoals();
    }
  }, [employeeId, statusFilter]);

  const fetchEmployee = async () => {
    try {
      const response = await employeeService.getEmployees();
      if (response.data.success && response.data.data.length > 0) {
        const userId = user?._id || user?.id;
        const userIdString = userId?.toString();
        
        const emp = response.data.data.find(e => {
          const empUserId = e.user?._id || e.user?.id;
          const empUserIdString = empUserId?.toString();
          return empUserIdString === userIdString;
        });
        
        if (emp) {
          setEmployeeId(emp._id);
        }
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
    }
  };

  const fetchGoals = async () => {
    if (!employeeId) return;

    try {
      setLoading(true);
      const response = await employeeService.getGoals(employeeId);
      if (response.data.success) {
        let filteredGoals = response.data.data;
        if (statusFilter) {
          filteredGoals = filteredGoals.filter(g => g.status === statusFilter);
        }
        setGoals(filteredGoals);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredGoals = (status) => {
    if (!status) return goals;
    return goals.filter(g => g.status === status);
  };

  const getStatusCounts = () => {
    return {
      all: goals.length,
      not_started: goals.filter(g => g.status === 'not_started').length,
      in_progress: goals.filter(g => g.status === 'in_progress').length,
      completed: goals.filter(g => g.status === 'completed').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) return <Loader />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">My Goals</h1>
            <p className="page-subtitle">Track your performance goals and progress</p>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Status Filter */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('')}
          >
            All ({statusCounts.all})
          </button>
          <button
            className={`btn ${statusFilter === 'not_started' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('not_started')}
          >
            Not Started ({statusCounts.not_started})
          </button>
          <button
            className={`btn ${statusFilter === 'in_progress' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('in_progress')}
          >
            In Progress ({statusCounts.in_progress})
          </button>
          <button
            className={`btn ${statusFilter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('completed')}
          >
            Completed ({statusCounts.completed})
          </button>
        </div>

        {/* Goals Grid */}
        {getFilteredGoals(statusFilter).length > 0 ? (
          <div className="goals-grid">
            {getFilteredGoals(statusFilter).map(goal => (
              <GoalCard key={goal._id} goal={goal} showActions={false} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FiTarget className="empty-state-icon" />
            <h3 className="empty-state-title">No Goals Found</h3>
            <p className="empty-state-text">
              {statusFilter
                ? `No ${statusFilter.replace('_', ' ')} goals found.`
                : 'You don\'t have any performance goals yet. Contact your manager to set up goals.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGoals;

