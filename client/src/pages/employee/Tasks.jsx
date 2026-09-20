import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiPlus, FiCheck, FiX, FiClock, FiFilter, FiSend, FiCheckCircle, FiXCircle, FiSearch, FiChevronDown, FiChevronUp, FiDownload, FiFileText } from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import TaskDrawer from '../../components/common/TaskDrawer';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/format';
import dayjs from 'dayjs';
import '../../styles/employee/tasks.css';

const Tasks = () => {
  const { user, isAdmin, isSuperAdmin, isEmployee } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all', 'my-tasks', 'pending-approvals'

  // Split state for Search (Instant/Debounced) vs Filters (Manual Apply)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // UI State for inputs
  const [filterInputs, setFilterInputs] = useState({
    status: '',
    priority: '',
    department: ''
  });

  // API State for active filters
  const [activeFilters, setActiveFilters] = useState({
    status: '',
    priority: '',
    department: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const buttonRef = useRef(null);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial load
  useEffect(() => {
    fetchTasks(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch when Debounced Search OR Active Filters OR View Mode change
  useEffect(() => {
    if (!initialLoading) {
      fetchTasks(false);
    }
  }, [debouncedSearch, activeFilters, viewMode]);

  const fetchTasks = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setInitialLoading(true);
      else setLoading(true);

      const params = {
        search: debouncedSearch,
        ...activeFilters
      };

      // Set view mode based on user role
      if (viewMode === 'my-tasks') {
        params.view = 'my-tasks';
      } else if (viewMode === 'pending-approvals') {
        params.approvalStatus = 'pending';
      }

      const response = await employeeService.getTasks(params);
      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert(error.response?.data?.message || 'Error fetching tasks');
    } finally {
      if (isInitialLoad) setInitialLoading(false);
      else setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setActiveFilters(filterInputs);
  };

  const handleClearFilters = () => {
    const resetState = { status: '', priority: '', department: '' };
    setFilterInputs(resetState);
    setActiveFilters(resetState);
    setSearchQuery('');
  };

  const getActiveCount = () => {
    let count = 0;
    if (filterInputs.status) count++;
    if (filterInputs.priority) count++;
    if (filterInputs.department) count++;
    return count;
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await employeeService.updateTask(taskId, { status: newStatus });
      fetchTasks();
      alert(`Task marked as ${newStatus}!`);
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating task');
    }
  };

  const handleSubmitForApproval = async (taskId) => {
    try {
      await employeeService.submitTask(taskId);
      fetchTasks();
      alert('Task submitted for approval successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting task');
    }
  };

  const handleApprove = async (taskId) => {
    try {
      await employeeService.approveTask(taskId);
      fetchTasks();
      alert('Task approved successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error approving task');
    }
  };

  const handleReject = async () => {
    if (!selectedTask) return;
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      await employeeService.rejectTask(selectedTask._id, rejectionReason);
      setShowRejectModal(false);
      setSelectedTask(null);
      setRejectionReason('');
      fetchTasks();
      alert('Task rejected successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error rejecting task');
    }
  };

  const openRejectModal = (task) => {
    setSelectedTask(task);
    setShowRejectModal(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'info';
      case 'cancelled': return 'error';
      case 'created': return 'secondary';
      case 'submitted_for_approval': return 'warning';
      case 'approved_by_admin': return 'success';
      case 'approved_by_superadmin': return 'success';
      case 'rejected_by_admin': return 'error';
      case 'rejected_by_superadmin': return 'error';
      default: return 'warning';
    }
  };

  const formatStatus = (status) => {
    const statusMap = {
      'created': 'Created',
      'submitted_for_approval': 'Submitted for Approval',
      'approved_by_admin': 'Approved by Admin',
      'approved_by_superadmin': 'Approved by Super Admin',
      'rejected_by_admin': 'Rejected by Admin',
      'rejected_by_superadmin': 'Rejected by Super Admin',
      'pending': 'Pending',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
    };
    return statusMap[status] || status;
  };

  const canEditTask = (task) => {
    if (task.createdBy?._id === user?._id || task.createdBy?._id === user?.id) {
      return ['created', 'rejected_by_admin', 'rejected_by_superadmin'].includes(task.status);
    }
    return false;
  };

  const canSubmitTask = (task) => {
    if (task.createdBy?._id === user?._id || task.createdBy?._id === user?.id) {
      return task.status === 'created';
    }
    return false;
  };

  const canApproveTask = (task) => {
    if (isAdmin && task.roleOfCreator === 'employee' && task.status === 'submitted_for_approval') {
      return true;
    }
    if (isSuperAdmin && task.roleOfCreator === 'admin' && task.status === 'submitted_for_approval') {
      return true;
    }
    return false;
  };

  const canRejectTask = (task) => {
    return canApproveTask(task);
  };

  const isOverdue = (dueDate) => {
    return dayjs(dueDate).isBefore(dayjs(), 'day') && dueDate;
  };

  return (
    <div className="tasks-list-page">
      {/* Header Row */}
      <div className="tasks-page-header">
        <div className="header-title-group">
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Manage task assignments and progress</p>
        </div>
        <div className="header-actions">
          {/* View Mode Toggle - Only for Admin/Super Admin */}
          {(isAdmin || isSuperAdmin) && (
            <div style={{ display: 'flex', gap: '8px', marginRight: '8px' }}>
              <button
                className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('all')}
                style={{ minWidth: '100px' }}
              >
                All Tasks
              </button>
              <button
                className={`btn ${viewMode === 'my-tasks' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('my-tasks')}
                style={{ minWidth: '100px' }}
              >
                My Tasks
              </button>
              <button
                className={`btn ${viewMode === 'pending-approvals' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('pending-approvals')}
                style={{ minWidth: '140px' }}
              >
                Pending Approvals
              </button>
            </div>
          )}

          {/* Import Button - Only for Admin/Super Admin */}
          {(isAdmin || isSuperAdmin) && (
            <button className="btn btn-outline" onClick={() => { }}>
              <FiDownload /> Import
            </button>
          )}

          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FiPlus /> Create Task
          </button>

          <button
            ref={buttonRef}
            className="btn filter-btn-mobile"
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '8px',
              minWidth: '100px',
              justifyContent: 'center',
              background: showFilters ? '#eff6ff' : 'white',
              border: showFilters ? '1px solid #3b82f6' : '1px solid #d1d5db',
              color: showFilters ? '#2563eb' : '#374151',
              transition: 'all 0.2s'
            }}
          >
            <FiFilter style={{ color: showFilters ? '#2563eb' : '#6b7280' }} />
            <span style={{ fontWeight: 500 }}>Filters</span>
            {showFilters ? <FiChevronUp /> : <FiChevronDown />}
            {(getActiveCount() > 0) && (
              <span style={{
                background: '#3b82f6',
                color: 'white',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 700
              }}>
                {getActiveCount()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Total Tasks */}
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px'
          }}>
            <FiFileText />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {tasks.length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Total Tasks
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px'
          }}>
            <FiClock />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {tasks.filter(t => t.status === 'in-progress').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              In Progress
            </div>
          </div>
        </div>

        {/* Completed */}
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px'
          }}>
            <FiCheckCircle />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Completed
            </div>
          </div>
        </div>

        {/* Pending Approval */}
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px'
          }}>
            <FiSend />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {tasks.filter(t => t.status === 'submitted_for_approval').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Pending Approval
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar Section (Mobile) */}
      <div className="search-bar-section" style={{ marginBottom: '16px', display: 'none' }}>
        <div className="toolbar-search" style={{ margin: 0, width: '100%', maxWidth: '280px' }}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Toolbar Container - Relative for Filter Panel positioning */}
      <div style={{ position: 'relative', zIndex: 50 }}>
        {/* 1. Main Toolbar Row (Desktop) */}
        <div className="toolbar-desktop">

          {/* Left: Search & Filter Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="toolbar-search" style={{ margin: 0, width: '280px' }}>
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              ref={buttonRef}
              className="btn"
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '100px',
                justifyContent: 'center',
                background: showFilters ? '#eff6ff' : 'white',
                border: showFilters ? '1px solid #3b82f6' : '1px solid #d1d5db',
                color: showFilters ? '#2563eb' : '#374151',
                transition: 'all 0.2s'
              }}
            >
              <FiFilter style={{ color: showFilters ? '#2563eb' : '#6b7280' }} />
              <span style={{ fontWeight: 500 }}>Filters</span>
              {showFilters ? <FiChevronUp /> : <FiChevronDown />}
              {(getActiveCount() > 0) && (
                <span style={{
                  background: '#3b82f6',
                  color: 'white',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 700
                }}>
                  {getActiveCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 2. Filter Panel (Absolute Overlay) */}
        {showFilters && (
          <div className="filter-panel-overlay fade-in" ref={filterRef} style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            width: '100%',
            background: '#f9fafb',
            padding: '24px',
            marginTop: '8px',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', width: '100%', flexWrap: 'wrap' }}>

              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                <div style={{ position: 'relative', width: '180px' }}>
                  <select
                    value={filterInputs.status}
                    onChange={(e) => setFilterInputs({ ...filterInputs, status: e.target.value })}
                    style={{
                      appearance: 'none',
                      width: '100%',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '0 32px 0 12px',
                      fontSize: '13px',
                      color: '#374151',
                      height: '38px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      outline: 'none'
                    }}
                  >
                    <option value="">All Statuses</option>
                    <option value="created">Created</option>
                    <option value="submitted_for_approval">Submitted for Approval</option>
                    <option value="approved_by_admin">Approved by Admin</option>
                    <option value="approved_by_superadmin">Approved by Super Admin</option>
                    <option value="rejected_by_admin">Rejected by Admin</option>
                    <option value="rejected_by_superadmin">Rejected by Super Admin</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Priority */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority</label>
                <div style={{ position: 'relative', width: '160px' }}>
                  <select
                    value={filterInputs.priority}
                    onChange={(e) => setFilterInputs({ ...filterInputs, priority: e.target.value })}
                    style={{
                      appearance: 'none',
                      width: '100%',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '0 32px 0 12px',
                      fontSize: '13px',
                      color: '#374151',
                      height: '38px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      outline: 'none'
                    }}
                  >
                    <option value="">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Department */}
              {(isAdmin || isSuperAdmin) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</label>
                  <div style={{ position: 'relative', width: '180px' }}>
                    <select
                      value={filterInputs.department}
                      onChange={(e) => setFilterInputs({ ...filterInputs, department: e.target.value })}
                      style={{
                        appearance: 'none',
                        width: '100%',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '0 32px 0 12px',
                        fontSize: '13px',
                        color: '#374151',
                        height: '38px',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        outline: 'none'
                      }}
                    >
                      <option value="">All Departments</option>
                      <option value="IT">IT</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                      <option value="Sales">Sales</option>
                      <option value="Management">Management</option>
                      <option value="Operations">Operations</option>
                    </select>
                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', height: '38px' }}>
                <button
                  onClick={handleClearFilters}
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#6b7280',
                    background: 'transparent',
                    border: '1px solid transparent',
                    cursor: 'pointer',
                    padding: '0 12px',
                    borderRadius: '6px',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#111827';
                    e.currentTarget.style.background = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Clear All
                </button>
                <button
                  onClick={() => { handleApplyFilters(); setShowFilters(false); }}
                  style={{
                    background: '#2563eb', // Primary Blue
                    color: 'white',
                    border: 'none',
                    padding: '0 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  Apply
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Visual Divider */}
      <div style={{ height: '1px', background: '#e5e7eb', margin: '0' }}></div>

      {/* Content */}
      <div className="tasks-content-wrapper">
        {initialLoading ? <Loader /> : (
          <div className="table-container-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  {(isAdmin || isSuperAdmin) && <th>Created By</th>}
                  <th>Assigned To</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={(isAdmin || isSuperAdmin) ? "7" : "6"} style={{ textAlign: 'center', padding: '40px' }}>
                      <Loader />
                    </td>
                  </tr>
                )}
                {!loading && tasks.length > 0 ? (
                  tasks.map((task) => (
                    <tr key={task._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{task.title}</div>
                        {task.description && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {task.description.substring(0, 50)}
                            {task.description.length > 50 && '...'}
                          </div>
                        )}
                      </td>
                      {(isAdmin || isSuperAdmin) && (
                        <td>
                          {task.createdBy?.name || 'N/A'}
                          {task.roleOfCreator && (
                            <small style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11px' }}>
                              ({task.roleOfCreator})
                            </small>
                          )}
                        </td>
                      )}
                      <td>{task.assignedTo?.employeeId || 'N/A'}</td>
                      <td>
                        <span className={`badge badge-${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiClock style={{ fontSize: '14px', color: isOverdue(task.dueDate) ? 'var(--error)' : 'var(--text-secondary)' }} />
                          <span style={{ color: isOverdue(task.dueDate) && task.status !== 'completed' ? 'var(--error)' : 'inherit' }}>
                            {formatDate(task.dueDate)}
                          </span>
                          {isOverdue(task.dueDate) && task.status !== 'completed' && (
                            <span className="badge badge-error" style={{ marginLeft: '8px' }}>Overdue</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${getStatusColor(task.status)}`}>
                          {formatStatus(task.status)}
                        </span>
                        {task.rejectionReason && (
                          <div style={{ fontSize: '11px', color: 'var(--error)', marginTop: '4px' }}>
                            Reason: {task.rejectionReason}
                          </div>
                        )}
                        {task.approvedBy && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Approved by: {task.approvedBy?.name || 'N/A'}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {canSubmitTask(task) && (
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => handleSubmitForApproval(task._id)}
                              title="Submit for Approval"
                            >
                              <FiSend /> Submit
                            </button>
                          )}

                          {canApproveTask(task) && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprove(task._id)}
                              title="Approve Task"
                            >
                              <FiCheckCircle /> Approve
                            </button>
                          )}

                          {canRejectTask(task) && (
                            <button
                              className="btn btn-sm btn-error"
                              onClick={() => openRejectModal(task)}
                              title="Reject Task"
                            >
                              <FiXCircle /> Reject
                            </button>
                          )}

                          {canEditTask(task) && (
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => {
                                alert('Edit functionality coming soon');
                              }}
                              title="Edit Task"
                            >
                              Edit
                            </button>
                          )}

                          {['approved_by_admin', 'approved_by_superadmin'].includes(task.status) && (
                            <>
                              {task.status !== 'in-progress' && task.status !== 'completed' && (
                                <button
                                  className="btn btn-sm btn-info"
                                  onClick={() => handleUpdateStatus(task._id, 'in-progress')}
                                >
                                  Start
                                </button>
                              )}
                              {task.status === 'in-progress' && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleUpdateStatus(task._id, 'completed')}
                                >
                                  <FiCheck /> Complete
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : !loading && (
                  <tr>
                    <td colSpan={(isAdmin || isSuperAdmin) ? "7" : "6"} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      No tasks found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Task Drawer */}
      <TaskDrawer
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onTaskCreated={fetchTasks}
      />

      {/* Reject Task Modal */}
      <Modal isOpen={showRejectModal} onClose={() => {
        setShowRejectModal(false);
        setSelectedTask(null);
        setRejectionReason('');
      }} title="Reject Task">
        {selectedTask && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <strong>Task:</strong> {selectedTask.title}
            </div>
            <div className="form-group">
              <label className="form-label">Rejection Reason *</label>
              <textarea
                className="form-textarea"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this task"
                rows={4}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedTask(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error"
                onClick={handleReject}
              >
                <FiXCircle /> Reject Task
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Tasks;
