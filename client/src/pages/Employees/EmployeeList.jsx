import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiUsers, FiCheckCircle, FiXCircle, FiBriefcase } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import EmployeeTable from '../../components/Employees/EmployeeTable';
import { formatDate } from '../../utils/format';
import '../../styles/employees.css';
import '../../styles/tables.css';
import '../../styles/sales/leads.css';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  // UI State for filter inputs
  const [filterInputs, setFilterInputs] = useState({
    department: '',
    status: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // API State for active filters
  const [activeFilters, setActiveFilters] = useState({
    department: '',
    status: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [search, setSearch] = useState('');
  const { isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchEmployees = useCallback(async (searchValue = search, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }
      const params = {};
      if (searchValue && searchValue.trim()) {
        params.search = searchValue.trim();
      }
      if (activeFilters.department) {
        params.department = activeFilters.department;
      }
      if (activeFilters.status) {
        params.status = activeFilters.status;
      }
      // Add sorting parameters
      if (activeFilters.sortBy) {
        params.sortBy = activeFilters.sortBy === 'name' ? 'user.name' : activeFilters.sortBy;
        params.sortOrder = activeFilters.sortOrder;
      }
      console.log('Fetching employees with params:', params);
      const response = await employeeService.getEmployees(params);
      if (response.data.success) {
        setEmployees(response.data.data);
        // Apply client-side filters if needed (search is handled server-side but can also be done client-side)
        applyFiltersAndSort(response.data.data);
      } else {
        console.error('Failed to fetch employees:', response.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.status === 403) {
        alert('You do not have access to the Employee module');
      } else if (error.response?.status === 400) {
        console.error('Bad Request - Check server logs for details');
      }
    } finally {
      if (isInitialLoad) {
        setInitialLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [activeFilters.department, activeFilters.status, activeFilters.sortBy, activeFilters.sortOrder, search]);

  // Initial load - fetch on mount
  useEffect(() => {
    fetchEmployees('', true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch employees when filters, sorting, or search changes (but not on initial mount)
  useEffect(() => {
    // Skip initial mount - already handled above
    if (initialLoading) return;

    const timeout = setTimeout(() => {
      fetchEmployees(search, false);
    }, search ? 500 : 300); // Longer debounce for search
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentFilter, statusFilter, sortBy, sortOrder, search]);

  const applyFiltersAndSort = (data) => {
    let filtered = [...data];

    // Note: Search is now fully handled by the API, so we don't need to filter again
    // The API already filters by employeeId, designation, user.name, and user.email

    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (activeFilters.sortBy) {
        case 'name':
          aValue = a.user?.name || '';
          bValue = b.user?.name || '';
          break;
        case 'employeeId':
          aValue = a.employeeId || '';
          bValue = b.employeeId || '';
          break;
        case 'department':
          aValue = a.department || '';
          bValue = b.department || '';
          break;
        case 'designation':
          aValue = a.designation || '';
          bValue = b.designation || '';
          break;
        case 'joiningDate':
          aValue = new Date(a.joiningDate || 0);
          bValue = new Date(b.joiningDate || 0);
          break;
        default:
          aValue = a.user?.name || '';
          bValue = b.user?.name || '';
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return activeFilters.sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return activeFilters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    setFilteredEmployees(filtered);
  };

  useEffect(() => {
    applyFiltersAndSort(employees);
  }, [search, activeFilters.department, activeFilters.status, activeFilters.sortBy, activeFilters.sortOrder, employees]);

  const handleApplyFilters = () => {
    setActiveFilters(filterInputs);
  };

  const handleClearFilters = () => {
    const resetState = { department: '', status: '', sortBy: 'name', sortOrder: 'asc' };
    setFilterInputs(resetState);
    setActiveFilters(resetState);
    setSearch('');
  };

  const getActiveCount = () => {
    let count = 0;
    if (filterInputs.department) count++;
    if (filterInputs.status) count++;
    return count;
  };

  // Debounce search to avoid too many API calls - now handled in fetchEmployees dependency

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      setLoading(true);
      await employeeService.deleteEmployee(id);
      await fetchEmployees();
    } catch (error) {
      alert('Error deleting employee');
    } finally {
      setLoading(false);
    }
  };

  // Show full page loader only on initial load
  if (initialLoading) return <Loader />;

  return (
    <div className="leaves-list-page">
      {/* Header Row */}
      <div className="leaves-page-header">
        <div className="header-title-group">
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage your team members</p>
        </div>
        <div className="header-actions">
          {(isAdmin || isSuperAdmin) && (
            <button className="btn btn-primary" onClick={() => navigate('/employees/add')}>
              <FiPlus /> Add Employee
            </button>
          )}
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
              {employees.length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Total Employees
            </div>
          </div>
        </div>

        {/* Active */}
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
              {employees.filter(e => e.status === 'active').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Active
            </div>
          </div>
        </div>

        {/* Inactive/Terminated */}
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
            <FiXCircle />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {employees.filter(e => e.status === 'inactive' || e.status === 'terminated').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Inactive / Terminated
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

      {/* Horizontal Toolbar */}
      <div className="leaves-toolbar-horizontal">
        <div className="toolbar-search">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            disabled={loading}
          />
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-select">
          <select
            value={filterInputs.department}
            onChange={(e) => setFilterInputs({ ...filterInputs, department: e.target.value })}
            disabled={loading}
          >
            <option value="">All Departments</option>
            <option value="IT">IT</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Sales">Sales</option>
            <option value="Management">Management</option>
            <option value="Operations">Operations</option>
          </select>
        </div>

        <div className="toolbar-select">
          <select
            value={filterInputs.status}
            onChange={(e) => setFilterInputs({ ...filterInputs, status: e.target.value })}
            disabled={loading}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        <div className="toolbar-select">
          <select
            value={`${filterInputs.sortBy}-${filterInputs.sortOrder}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split('-');
              setFilterInputs({ ...filterInputs, sortBy: sort, sortOrder: order });
            }}
            disabled={loading}
          >
            <option value="name-asc">Sort by Name (A-Z)</option>
            <option value="name-desc">Sort by Name (Z-A)</option>
            <option value="employeeId-asc">Sort by ID (A-Z)</option>
            <option value="department-asc">Sort by Department (A-Z)</option>
            <option value="designation-asc">Sort by Designation (A-Z)</option>
            <option value="joiningDate-desc">Sort by Joining Date (Newest)</option>
            <option value="joiningDate-asc">Sort by Joining Date (Oldest)</option>
          </select>
        </div>

        <div className="toolbar-actions">
          <button className="btn-text-red" onClick={handleClearFilters}>Clear</button>
          <button className="btn btn-primary btn-sm" onClick={handleApplyFilters}>
            Apply {getActiveCount() > 0 && `(${getActiveCount()})`}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="leaves-content-wrapper">
        <div style={{ position: 'relative' }}>
          {loading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              borderRadius: '8px',
              minHeight: '200px'
            }}>
              <Loader />
            </div>
          )}
          <EmployeeTable
            employees={filteredEmployees}
            onView={(id) => navigate(`/employees/${id}`)}
            onEdit={(emp) => navigate(`/employees/${emp._id}/edit`)}
            onDelete={handleDelete}
            canEdit={isAdmin || isSuperAdmin}
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;

