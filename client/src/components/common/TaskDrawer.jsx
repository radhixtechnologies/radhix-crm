import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import dayjs from 'dayjs';
import './TaskDrawer.css';

/**
 * Task Creation Drawer Component
 * Clean and simple task creation form with role-based access
 */
const normalizeTaskStatus = (value) => {
    const map = {
        pending: 'pending',
        created: 'created',
        completed: 'completed',
        'in-progress': 'in-progress',
        in_progress: 'in_progress',
    };
    return map[value] || 'created';
};

const TaskDrawer = ({ isOpen, onClose, onTaskCreated }) => {
    const { user, isAdmin, isSuperAdmin, isEmployee } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'medium',
        dueDate: '',
        status: 'created',
    });

    useEffect(() => {
        if (isOpen && (isAdmin || isSuperAdmin)) {
            fetchEmployees();
        }
    }, [isOpen, isAdmin, isSuperAdmin]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitData = { ...formData, status: normalizeTaskStatus(formData.status) };

            if (isEmployee && !isAdmin && !isSuperAdmin) {
                const employeeResponse = await employeeService.getEmployees();
                const employees = employeeResponse.data?.data || [];
                const myEmp = employees.find(employee => employee.user?._id === user._id || employee.user === user._id);
                if (myEmp) {
                    submitData.assignedTo = myEmp._id;
                }
            }

            await employeeService.createTask(submitData);

            // Reset form
            setFormData({
                title: '',
                description: '',
                assignedTo: '',
                priority: 'medium',
                dueDate: '',
                status: 'created',
            });

            // Notify parent component
            if (onTaskCreated) {
                onTaskCreated();
            }

            // Close drawer
            onClose();
        } catch (error) {
            console.error('Error creating task:', error);
            alert(error.response?.data?.message || 'Error creating task');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        // Reset form on close
        setFormData({
            title: '',
            description: '',
            assignedTo: '',
            priority: 'medium',
            dueDate: '',
            status: 'created',
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div className="task-drawer-overlay" onClick={handleClose} />

            {/* Drawer */}
            <div className="task-drawer">
                {/* Header */}
                <div className="task-drawer-header">
                    <h3>Create New Task</h3>
                    <button
                        type="button"
                        className="task-drawer-close"
                        onClick={handleClose}
                        aria-label="Close"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="task-drawer-form">
                    <div className="task-drawer-content">
                        {/* Task Title */}
                        <div className="task-form-group">
                            <label className="task-form-label">
                                Task Title <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                className="task-form-input"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Enter task title"
                                required
                                autoFocus
                            />
                        </div>

                        {/* Description */}
                        <div className="task-form-group">
                            <label className="task-form-label">Description</label>
                            <textarea
                                className="task-form-textarea"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Add task description (optional)"
                                rows={4}
                            />
                        </div>

                        {/* Assign To - Only for Admin/Super Admin */}
                        {(isAdmin || isSuperAdmin) ? (
                            <div className="task-form-group">
                                <label className="task-form-label">
                                    Assign To <span className="required">*</span>
                                </label>
                                <select
                                    className="task-form-select"
                                    value={formData.assignedTo}
                                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                    required
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map((emp) => (
                                        <option key={emp._id} value={emp._id}>
                                            {emp.employeeId} - {emp.user?.name || 'N/A'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="task-form-group">
                                <label className="task-form-label">Assign To</label>
                                <div className="task-form-readonly">
                                    <input
                                        type="text"
                                        className="task-form-input"
                                        value="Myself"
                                        disabled
                                    />
                                    <small className="task-form-hint">
                                        Tasks you create will be automatically assigned to you
                                    </small>
                                </div>
                            </div>
                        )}

                        {/* Priority */}
                        <div className="task-form-group">
                            <label className="task-form-label">
                                Priority <span className="required">*</span>
                            </label>
                            <select
                                className="task-form-select"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                required
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        {/* Due Date */}
                        <div className="task-form-group">
                            <label className="task-form-label">
                                Due Date <span className="required">*</span>
                            </label>
                            <input
                                type="date"
                                className="task-form-input"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                min={dayjs().format('YYYY-MM-DD')}
                                required
                            />
                        </div>

                        {/* Status */}
                        <div className="task-form-group">
                            <label className="task-form-label">
                                Status <span className="required">*</span>
                            </label>
                            <select
                                className="task-form-select"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                required
                            >
                                <option value="created">Created</option>
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="task-drawer-footer">
                        <button
                            type="button"
                            className="task-btn task-btn-secondary"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="task-btn task-btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default TaskDrawer;
