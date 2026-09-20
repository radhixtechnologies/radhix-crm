import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiTarget, FiPlus, FiEdit2 } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import GoalCard from '../../components/Performance/GoalCard';
import Modal from '../../components/common/Modal';
import '../../styles/performance.css';

/**
 * All Goals Page - Admin View
 * Manage all performance goals
 */
const AllGoals = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    title: '',
    description: '',
    deadline: '',
    progress: 0,
    status: 'not_started',
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  useEffect(() => {
    fetchEmployees();
    fetchGoals();
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [statusFilter, employeeFilter]);

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

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (employeeFilter) params.employeeId = employeeFilter;

      const response = await employeeService.getAllGoals(params);
      if (response.data.success) {
        setGoals(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      employeeId: goal.employee._id,
      title: goal.title,
      description: goal.description || '',
      deadline: new Date(goal.deadline).toISOString().split('T')[0],
      progress: goal.progress,
      status: goal.status,
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingGoal(null);
    setFormData({
      employeeId: '',
      title: '',
      description: '',
      deadline: '',
      progress: 0,
      status: 'not_started',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingGoal) {
        await employeeService.updateGoal(editingGoal._id, {
          ...formData,
          deadline: new Date(formData.deadline),
        });
        alert('Goal updated successfully!');
      } else {
        await employeeService.createGoal({
          employeeId: formData.employeeId,
          title: formData.title,
          description: formData.description,
          deadline: formData.deadline,
          progress: formData.progress,
          status: formData.status,
        });
        alert('Goal created successfully!');
      }

      setShowModal(false);
      fetchGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
      alert(error.response?.data?.message || 'Error saving goal');
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

  if (loading) return <Loader />;

  const filteredGoals = goals.filter(goal => {
    if (employeeFilter && goal.employee._id.toString() !== employeeFilter) return false;
    if (statusFilter && goal.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">All Performance Goals</h1>
            <p className="page-subtitle">Manage performance goals for all employees</p>
          </div>
          <button className="btn btn-primary" onClick={handleCreate}>
            <FiPlus /> Create Goal
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ minWidth: '200px' }}
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
          >
            <option value="">All Employees</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.employeeId} - {emp.user?.name}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ minWidth: '150px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Goals Grid */}
        {filteredGoals.length > 0 ? (
          <div className="goals-grid">
            {filteredGoals.map(goal => (
              <GoalCard
                key={goal._id}
                goal={goal}
                onEdit={handleEdit}
                showActions={true}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FiTarget className="empty-state-icon" />
            <h3 className="empty-state-title">No Goals Found</h3>
            <p className="empty-state-text">
              {statusFilter || employeeFilter
                ? 'No goals match the selected filters.'
                : 'No performance goals have been created yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingGoal ? 'Edit Goal' : 'Create Goal'}
        >
          <form onSubmit={handleSubmit}>
            {!editingGoal && (
              <div className="form-group">
                <label className="form-label">Employee *</label>
                <select
                  className="form-select"
                  value={formData.employeeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.employeeId} - {emp.user?.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder="Enter goal title"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Enter goal description"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Deadline *</label>
              <input
                type="date"
                className="form-input"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Progress (%)</label>
              <input
                type="number"
                className="form-input"
                value={formData.progress}
                onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                min="0"
                max="100"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingGoal ? 'Update' : 'Create'} Goal
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AllGoals;

