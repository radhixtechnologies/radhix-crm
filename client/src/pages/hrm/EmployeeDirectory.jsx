import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiMapPin,
  FiUsers,
  FiChevronRight,
  FiPlus,
  FiEdit,
  FiEye,
  FiCalendar,
  FiChevronLeft,
  FiChevronDown,
  FiChevronUp,
  FiFilter,
  FiX,
  FiDownload,
  FiTrash2
} from 'react-icons/fi';
import { useRef } from 'react';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/format';
import '../../styles/employee/employees.css';

const EmployeeDirectory = () => {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin, hasFullModuleAccess } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // Split state for Search (Instant/Debounced) vs Filters (Manual Apply)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // UI State for inputs
  const [filterInputs, setFilterInputs] = useState({
    department: '',
    designation: '',
    status: '',
    employmentType: '',
    workLocation: '',
    sortBy: 'joiningDate-desc'
  });

  // API State for active filters
  const [activeFilters, setActiveFilters] = useState({
    department: '',
    designation: '',
    status: '',
    employmentType: '',
    workLocation: '',
    sortBy: 'joiningDate-desc'
  });

  const [departments, setDepartments] = useState(['IT', 'HR', 'Finance', 'Sales', 'Management', 'Operations']);
  const [designations, setDesignations] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [statusUpdateModal, setStatusUpdateModal] = useState({ show: false, employee: null, newStatus: '' });

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

  const fetchEmployees = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setInitialLoading(true);
      else setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      // Add search
      if (debouncedSearch && debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      // Add active filters
      if (activeFilters.department) params.department = activeFilters.department;
      if (activeFilters.designation) params.designation = activeFilters.designation;
      if (activeFilters.status) params.status = activeFilters.status;
      if (activeFilters.employmentType) params.employmentType = activeFilters.employmentType;
      if (activeFilters.workLocation) params.workLocation = activeFilters.workLocation;

      // Parse sortBy (format: "field-order")
      const [sortField, sortOrder] = activeFilters.sortBy.split('-');
      if (sortField) {
        params.sortBy = sortField === 'name' ? 'user.name' : sortField;
        params.sortOrder = sortOrder || 'desc';
      }

      const response = await employeeService.getEmployees(params);
      if (response.data?.success) {
        const empList = response.data.data || [];
        setEmployees(empList);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
          pages: response.data.pages || 0
        }));

        // Extract unique designations
        const uniqueDesignations = [...new Set(empList.map(e => e.designation).filter(Boolean))];
        setDesignations(uniqueDesignations);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      if (isInitialLoad) setInitialLoading(false);
      else setLoading(false);
    }
  }, [debouncedSearch, activeFilters, pagination.page, pagination.limit]);

  // Initial load
  useEffect(() => {
    fetchEmployees(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch when Debounced Search OR Active Filters change
  useEffect(() => {
    if (!initialLoading) {
      fetchEmployees(false);
    }
  }, [debouncedSearch, activeFilters, fetchEmployees, initialLoading]);

  const handleApplyFilters = () => {
    setActiveFilters(filterInputs);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    const resetState = {
      department: '',
      designation: '',
      status: '',
      employmentType: '',
      workLocation: '',
      sortBy: 'joiningDate-desc'
    };
    setFilterInputs(resetState);
    setActiveFilters(resetState);
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActiveCount = () => {
    let count = 0;
    if (filterInputs.department) count++;
    if (filterInputs.designation) count++;
    if (filterInputs.status) count++;
    if (filterInputs.employmentType) count++;
    if (filterInputs.workLocation) count++;
    return count;
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdateModal.employee || !statusUpdateModal.newStatus) return;

    try {
      await employeeService.updateEmployee(statusUpdateModal.employee._id, {
        status: statusUpdateModal.newStatus
      });
      setStatusUpdateModal({ show: false, employee: null, newStatus: '' });
      fetchEmployees();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update employee status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;
    try {
      await employeeService.deleteEmployee(id);
      fetchEmployees();
      alert('Employee deleted successfully');
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Error deleting employee');
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'onboarding': return '#f59e0b';
      case 'inactive': return '#6b7280';
      case 'terminated':
      case 'resigned': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Active',
      inactive: 'Inactive',
      onboarding: 'Onboarding',
      terminated: 'Terminated',
      resigned: 'Resigned',
    };
    return labels[status] || status;
  };

  if (initialLoading) return <Loader />;

  return (
    <div className="employee-list-page">
      {/* Header Row */}
      <div className="employee-page-header">
        <div className="header-title-group">
          <h1 className="page-title">Employee Directory</h1>
          <p className="page-subtitle">{pagination.total} {pagination.total === 1 ? 'employee' : 'employees'} found</p>
        </div>
        <div className="header-actions">
          <div className="view-mode-toggle">
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <FiBriefcase /> Table
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <FiUsers /> Grid
            </button>
          </div>
          {hasFullModuleAccess('hrm') && (
            <>
              <button className="btn btn-outline" onClick={() => navigate('/employees/import-export')}>
                <FiDownload /> Import
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/employees/add')}>
                <FiPlus size={16} /> Add Employee
              </button>
            </>
          )}
          <button
            ref={buttonRef}
            className="btn filter-btn-mobile"
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

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Total Employees */}
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
            <FiUsers />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {pagination.total}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Total Employees
            </div>
          </div>
        </div>

        {/* Active Employees */}
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
            <FiUser />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {employees.filter(e => e.status === 'active').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Active
            </div>
          </div>
        </div>

        {/* Inactive / On Leave */}
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
            <FiCalendar />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {employees.filter(e => e.status === 'inactive' || e.status === 'onboarding').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Inactive / Onboarding
            </div>
          </div>
        </div>

        {/* Departments */}
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
            <FiBriefcase />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {[...new Set(employees.map(e => e.department).filter(Boolean))].length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Departments
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar Container - Relative for Filter Panel positioning */}
      {/* Search Bar Section */}


      {/* Toolbar Container - Relative for Filter Panel positioning */}
      <div style={{ position: 'relative', zIndex: 50, marginBottom: '16px' }}>
        <div className="toolbar-search" style={{ margin: 0, width: '280px' }}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, or employee ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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

              {/* Sort By */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sort By</label>
                <div style={{ position: 'relative', width: '180px' }}>
                  <select
                    value={filterInputs.sortBy}
                    onChange={(e) => setFilterInputs({ ...filterInputs, sortBy: e.target.value })}
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
                    <option value="joiningDate-desc">Newest First</option>
                    <option value="joiningDate-asc">Oldest First</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="department-asc">Department (A-Z)</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Department */}
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
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Designation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Designation</label>
                <div style={{ position: 'relative', width: '180px' }}>
                  <select
                    value={filterInputs.designation}
                    onChange={(e) => setFilterInputs({ ...filterInputs, designation: e.target.value })}
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
                    <option value="">All Designations</option>
                    {designations.map(desig => (
                      <option key={desig} value={desig}>{desig}</option>
                    ))}
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                <div style={{ position: 'relative', width: '150px' }}>
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
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="terminated">Terminated</option>
                    <option value="resigned">Resigned</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Employment Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</label>
                <div style={{ position: 'relative', width: '160px' }}>
                  <select
                    value={filterInputs.employmentType}
                    onChange={(e) => setFilterInputs({ ...filterInputs, employmentType: e.target.value })}
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
                    <option value="">All Types</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="intern">Intern</option>
                    <option value="contract">Contract</option>
                    <option value="consultant">Consultant</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Work Location */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</label>
                <div style={{ position: 'relative', width: '150px' }}>
                  <select
                    value={filterInputs.workLocation}
                    onChange={(e) => setFilterInputs({ ...filterInputs, workLocation: e.target.value })}
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
                    <option value="">All Locations</option>
                    <option value="office">Office</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>


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

      {/* Content */}
      <div>
        {loading && <div style={{ padding: '20px', textAlign: 'center' }}><Loader /></div>}

        {employees.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <FiUsers size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No Employees Found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Try adjusting your filters to see more results.</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="table-container-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Role/Designation</th>
                  <th>Phone / Email</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(employee => (
                  <tr key={employee._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="employee-avatar-table">
                          {employee.avatar || employee.user?.avatar ? (
                            <img
                              src={employee.avatar || employee.user.avatar}
                              alt={employee.user?.name || 'Employee'}
                            />
                          ) : (
                            <span>{getInitials(employee.user?.name)}</span>
                          )}
                        </div>
                        <span>{employee.user?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{employee.employeeId || 'N/A'}</span>
                    </td>
                    <td>{employee.department || 'N/A'}</td>
                    <td>{employee.designation || 'N/A'}</td>
                    <td>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {employee.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <FiPhone size={12} />
                            <span>{employee.phone}</span>
                          </div>
                        )}
                        {employee.user?.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiMail size={12} />
                            <span>{employee.user.email}</span>
                          </div>
                        )}
                        {!employee.phone && !employee.user?.email && 'N/A'}
                      </div>
                    </td>
                    <td>
                      {employee.joiningDate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                          <FiCalendar size={14} />
                          {formatDate(employee.joiningDate)}
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td>
                      <select
                        className="status-select"
                        value={employee.status || 'active'}
                        onChange={(e) => {
                          if (isAdmin || isSuperAdmin) {
                            setStatusUpdateModal({
                              show: true,
                              employee,
                              newStatus: e.target.value
                            });
                          }
                        }}
                        disabled={!isAdmin && !isSuperAdmin}
                        style={{
                          backgroundColor: getStatusColor(employee.status || 'active') + '20',
                          color: getStatusColor(employee.status || 'active'),
                          border: `1px solid ${getStatusColor(employee.status || 'active')}40`,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: (isAdmin || isSuperAdmin) ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="onboarding">Onboarding</option>
                        <option value="terminated">Terminated</option>
                        <option value="resigned">Resigned</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => navigate(`/employees/${employee._id}`)}
                        >
                          View
                        </button>
                        {(isAdmin || isSuperAdmin) && (
                          <>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => navigate(`/employees/edit/${employee._id}`)}
                              title="Edit Profile"
                            >
                              <FiEdit />
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(employee._id)}
                              title="Delete Employee"
                            >
                              <FiTrash2 />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '20px', borderTop: '1px solid var(--border)' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  <FiChevronLeft /> Previous
                </button>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next <FiChevronRight />
                </button>
              </div>
            )}
          </div>
        ) : (
          // Grid View
          <div className="employee-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {employees.map(employee => (
              <div
                key={employee._id}
                className="employee-card"
                onClick={() => navigate(`/employees/${employee._id}`)}
                style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div className="employee-avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '20px' }}>
                    {employee.avatar || employee.user?.avatar ? (
                      <img src={employee.avatar || employee.user.avatar} alt={employee.user?.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <span>{getInitials(employee.user?.name)}</span>
                    )}
                  </div>
                  <div style={{ backgroundColor: getStatusColor(employee.status || 'active') + '20', color: getStatusColor(employee.status || 'active'), padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>
                    {getStatusLabel(employee.status || 'active')}
                  </div>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>{employee.user?.name || 'N/A'}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{employee.designation || 'N/A'}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '12px' }}>ID: {employee.employeeId || 'N/A'}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <FiBriefcase size={14} />
                    <span>{employee.department || 'N/A'}</span>
                  </div>
                  {employee.user?.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <FiMail size={14} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{employee.user.email}</span>
                    </div>
                  )}
                  {employee.workLocation && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <FiMapPin size={14} />
                      <span>{employee.workLocation}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/employees/${employee._id}`);
                    }}
                    style={{ flex: 1 }}
                  >
                    View <FiChevronRight />
                  </button>
                  {(isAdmin || isSuperAdmin) && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/employees/edit/${employee._id}`);
                      }}
                      title="Edit Profile"
                    >
                      <FiEdit />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {
        statusUpdateModal.show && (
          <div className="modal-overlay" onClick={() => setStatusUpdateModal({ show: false, employee: null, newStatus: '' })} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%' }}>
              <h3 style={{ marginBottom: '12px', color: 'var(--text-main)' }}>Update Employee Status</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Are you sure you want to change {statusUpdateModal.employee?.user?.name}'s status to <strong style={{ color: 'var(--text-main)' }}>{getStatusLabel(statusUpdateModal.newStatus)}</strong>?</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setStatusUpdateModal({ show: false, employee: null, newStatus: '' })}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleStatusUpdate}
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default EmployeeDirectory;
