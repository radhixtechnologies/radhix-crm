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
        status: 'pending',
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
            // For employees, assignedTo will be automatically set to themselves by backend
            // For employees, assignedTo will be automatically set to themselves by backend
            const submitData = { ...formData };

            // Start of fix for 400 Bad Request
            // If user is employee (and not admin), they MUST include assignedTo as their own employee ID for validation
            if (isEmployee && !isAdmin && !isSuperAdmin) {
                // We need to fetch the employee ID first if we don't have it
                // Ideally this should be in context, but we can fetch it here or let backend handle it
                // Actually backend logic says: if (!assignedTo) ... assignedToId = employee._id
                // BUT the error is "Assigned to employee is required"
                // This means backend validation requires 'assignedTo' field even if logic tries to fill it
                // Let's explicitly pass a placeholder or let backend fix handle it
                // THE REAL FIX: The backend controller checks `if (!assignedToId)` AFTER logic
                // BUT `const { assignedTo, ...taskData } = req.body` extracts it.
                // If we send nothing, assignedTo is undefined.
                // Backend logic: let assignedToId = assignedTo; if (employee) assignedToId = employee.id
                // So it SHOULD work.

                // Let's try sending the user's ID as a placeholder if legitimate employee lookup fails?
                // Or better, let's look at TaskDrawer.jsx handleSubmit again to see if we deleted it

                // The issue is likely in `TaskDrawer.jsx` where we explicitly delete `assignedTo`
                // delete submitData.assignedTo;  <-- This might be causing issues if backend validation is strict before logic

                // Let's NOT delete it, but ensure it's empty string or handled
                // Actually, let's assign "self" or similar if we want to be explicit, 
                // but checking the backend code:
                // const { assignedTo, ...taskData } = req.body;
                // let assignedToId = assignedTo;
                // ...
                // if (!assignedTo) { const employee = ...; assignedToId = employee._id }

                // Wait, if we send `assignedTo: ""` (empty string) from the form state intialization?
                // The form init is `assignedTo: ''`.
                // `const { assignedTo } ...` -> assignedTo is `""` (falsy)
                // Logic `if (!assignedTo)` should trigger.

                // However, `req.body` might not have `assignedTo` at all if we delete it.
                // If we delete it, `assignedTo` is `undefined`. `if (!undefined)` is true.

                // Why did it fail? "Assigned to employee is required" comes from `if (!assignedToId)`.
                // This implies `assignedToId` remained undefined/null.
                // This implies `Employee.findOne({ user: req.user._id })` returned null.

                // So the user (Employee) record was not found for the logged in user.
                // Or `req.user.role` is not 'employee'.

                // Let's assume the user is an employee.
                // We should try to find the employee record in frontend and send it to be safe?
                // OR fixing the backend to be more robust.

                // Strategy: Let's fetch the current employee ID in `TaskDrawer` and send it.
                // This avoids reliance on backend lookup which might be failing.

                try {
                    const response = await employeeService.getEmployees(); // This gets all or filtered, might be heavy?
                    // Better: use the profile endpoint or search by user ID
                    // Actually, let's just let the backend handle it but maybe `assignedTo` needs to be explicitly "self" or something?
                    // No, let's try to fetch the employee details locally properly.

                    // Optimization: We can just not delete it, and set it to a special flag or the user's ID if we have it.
                    // But we don't have employee ID easily here without fetching.
                } catch (e) { }
            }
            // End analysis.

            // REAL FIX:
            // The backend controller logic:
            // if (req.user.role === 'employee') { ... assignedToId = employee._id }
            // So if we are employee, we don't need to send assignedTo.

            // IF THE ERROR IS 400 "Assigned to employee is required", it means `assignedToId` is null.
            // This means `Employee.findOne` failed.
            // This usually happens if the "User" and "Employee" records are not linked or corrupted.

            // HOWEVER, looking at `TaskDrawer.jsx`, we have:
            // if (isEmployee && !isAdmin && !isSuperAdmin) { delete submitData.assignedTo; }

            // If I delete it, it is undefined.

            // Let's look at your request again. You are getting 400.
            // Let's try sending "me" or handling it better.

            // Wait, I see we are deleting it.
            // Let's NOT delete it.
            // If we send `assignedTo: ''`, it is falsy.

            // Let's try to remove the `delete` block.
            // But `assignedTo` is required validation in schema probably? No, handled in controller.

            // Let's look at `createTask` in `taskController.js`:
            // const { assignedTo, ...taskData } = req.body;
            // ...
            // if (req.user.role === 'employee') { ... }

            // If I am an employee, it looks up.

            // Maybe `req.user.role` is NOT 'employee'?
            // Maybe it is 'admin' but `isEmployee` is true in frontend context?

            // Use AuthContext `user` object to check role.

            if (user?.role?.slug === 'employee' || user?.role === 'employee') {
                // We don't need to do anything, backend handles it.
                // But if backend fails, it means it can't find employee record.
                // Let's try to help it by passing the ID if we can.
            }

            // Let's try removing the `delete` statement first. It might be that the backend expects the key to exist even if empty?
            // No, destructuring handles missing keys as undefined.

            // Let's try to fetch the employee ID and pass it explicitly.
            if (isEmployee && !isAdmin && !isSuperAdmin) {
                // Try to get employee ID from list (we are not fetching list for employees in useEffect though)
                // We need to fetch it.
                const empRes = await employeeService.getEmployees();
                const myEmp = empRes.data.data.find(e => e.user?._id === user._id || e.user === user._id);
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
                status: 'pending',
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
            status: 'pending',
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
