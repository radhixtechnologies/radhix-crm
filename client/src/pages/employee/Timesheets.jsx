import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiPlus, FiEdit, FiTrash2, FiCalendar, FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiX, FiDownload, FiClock, FiCheckCircle } from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/format';
import dayjs from 'dayjs';
import '../../styles/employee/timesheets.css';

const Timesheets = ({ hrmMode = false }) => {
  const { user, isAdmin, isSuperAdmin, isEmployee } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [employees, setEmployees] = useState([]);

  // Determine if we are in "My" view
  // hrmMode forces "All" view for admins. 
  // If not in hrmMode (My Workspace), every user sees only their own.
  const isMyView = !hrmMode;

  // Split state for Search (Instant/Debounced) vs Filters (Manual Apply)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // UI State for inputs
  const [filterInputs, setFilterInputs] = useState({
    employeeId: '',
    dateFrom: dayjs().startOf('month').format('YYYY-MM-DD'),
    dateTo: dayjs().endOf('month').format('YYYY-MM-DD')
  });

  // API State for active filters
  const [activeFilters, setActiveFilters] = useState({
    employeeId: '',
    dateFrom: dayjs().startOf('month').format('YYYY-MM-DD'),
    dateTo: dayjs().endOf('month').format('YYYY-MM-DD')
  });

  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const buttonRef = useRef(null);

  const [formData, setFormData] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    workDescription: '',
    hours: 0,
  });

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial load
  useEffect(() => {
    fetchTimesheets(true);
    if (isAdmin || isSuperAdmin) {
      fetchEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hrmMode]);

  // Fetch when Debounced Search OR Active Filters change
  useEffect(() => {
    if (!initialLoading) {
      fetchTimesheets(false);
    }
  }, [debouncedSearch, activeFilters]);

  const fetchTimesheets = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setInitialLoading(true);
      else setLoading(true);

      const params = {
        search: debouncedSearch,
        startDate: activeFilters.dateFrom,
        endDate: activeFilters.dateTo
      };

      // Add view=my if in "My" view
      if (isMyView) {
        params.view = 'my';
      }

      // Only Admin can filter by employee in HRM mode
      if (activeFilters.employeeId && (isAdmin || isSuperAdmin)) {
        params.employeeId = activeFilters.employeeId;
      }

      const response = await employeeService.getTimesheets(params);
      if (response?.data?.success) {
        setTimesheets(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      // alert(error.response?.data?.message || 'Error fetching timesheets');
    } finally {
      if (isInitialLoad) setInitialLoading(false);
      else setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getEmployees({});
      if (response?.data?.success) {
        setEmployees(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleApplyFilters = () => {
    setActiveFilters(filterInputs);
  };

  const handleClearFilters = () => {
    const resetState = {
      employeeId: '',
      dateFrom: dayjs().startOf('month').format('YYYY-MM-DD'),
      dateTo: dayjs().endOf('month').format('YYYY-MM-DD')
    };
    setFilterInputs(resetState);
    setActiveFilters(resetState);
    setSearchQuery('');
  };

  const getActiveCount = () => {
    let count = 0;
    if (filterInputs.employeeId) count++;
    if (filterInputs.dateFrom !== dayjs().startOf('month').format('YYYY-MM-DD')) count++;
    if (filterInputs.dateTo !== dayjs().endOf('month').format('YYYY-MM-DD')) count++;
    return count;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (selectedTimesheet) {
        await employeeService.updateTimesheet(selectedTimesheet._id, formData);
        alert('Timesheet updated successfully!');
      } else {
        await employeeService.createTimesheet(formData);
        alert('Timesheet created successfully!');
      }

      setShowModal(false);
      setSelectedTimesheet(null);
      setFormData({
        date: dayjs().format('YYYY-MM-DD'),
        workDescription: '',
        hours: 0,
      });
      fetchTimesheets();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving timesheet');
    }
  };

  const handleEdit = (timesheet) => {
    setSelectedTimesheet(timesheet);
    setFormData({
      date: dayjs(timesheet.date).format('YYYY-MM-DD'),
      workDescription: timesheet.workDescription || '',
      hours: timesheet.hours || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timesheet?')) return;

    try {
      await employeeService.deleteTimesheet(id);
      alert('Timesheet deleted successfully!');
      fetchTimesheets();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting timesheet');
    }
  };

  const canEditTimesheet = (timesheet) => {
    if (!timesheet || !user) return false;
    const creatorId = timesheet.createdBy?._id || timesheet.createdBy?.id || timesheet.createdBy;
    const userId = user._id || user.id;
    return creatorId?.toString() === userId?.toString();
  };

  const canDeleteTimesheet = (timesheet) => {
    if (!timesheet || !user) return false;
    const creatorId = timesheet.createdBy?._id || timesheet.createdBy?.id || timesheet.createdBy;
    const userId = user._id || user.id;
    return creatorId?.toString() === userId?.toString();
  };

  // Get page title and description
  const getPageInfo = () => {
    if (hrmMode) {
      return {
        title: 'Employee Timesheets',
        description: 'Monitor and manage organization-wide timesheets',
      };
    }
    return {
      title: 'My Timesheets',
      description: 'Manage your daily work hours and descriptions',
    };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="timesheets-list-page">
      {/* Header Row */}
      <div className="timesheets-page-header">
        <div className="header-title-group">
          <h1 className="page-title">{pageInfo.title}</h1>
          <p className="page-subtitle">{pageInfo.description}</p>
        </div>
        <div className="header-actions">
          {(isAdmin || isSuperAdmin) && (
            <button className="btn btn-outline" onClick={() => { }}>
              <FiDownload /> Import
            </button>
          )}

          {(isEmployee || isAdmin || isSuperAdmin) && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedTimesheet(null);
                setFormData({
                  date: dayjs().format('YYYY-MM-DD'),
                  workDescription: '',
                  hours: 0,
                });
                setShowModal(true);
              }}
            >
              <FiPlus /> Add Timesheet
            </button>
          )}

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
        {/* Total Entries */}
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
            <FiCalendar />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {timesheets.length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Total Entries
            </div>
          </div>
        </div>

        {/* Total Hours */}
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
            <FiClock />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {timesheets.reduce((sum, t) => sum + (t.hours || 0), 0).toFixed(1)}h
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Total Hours
            </div>
          </div>
        </div>

        {/* Average Hours */}
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
            <FiCheckCircle />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {timesheets.length > 0 ? (timesheets.reduce((sum, t) => sum + (t.hours || 0), 0) / timesheets.length).toFixed(1) : 0}h
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Avg Hours/Entry
            </div>
          </div>
        </div>

        {/* This Week */}
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
            <FiCalendar />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {timesheets.filter(t => dayjs(t.date).isAfter(dayjs().subtract(7, 'days'))).reduce((sum, t) => sum + (t.hours || 0), 0).toFixed(1)}h
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              This Week
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
            placeholder="Search timesheets..."
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
                placeholder="Search timesheets..."
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

              {/* Employee (Admin Only) */}
              {isAdmin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee</label>
                  <div style={{ position: 'relative', width: '220px' }}>
                    <select
                      value={filterInputs.employeeId}
                      onChange={(e) => setFilterInputs({ ...filterInputs, employeeId: e.target.value })}
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
                      <option value="">All Employees</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.employeeId} - {emp.user?.name || 'N/A'}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                  </div>
                </div>
              )}

              {/* Date Range */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Range</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="date"
                    value={filterInputs.dateFrom}
                    onChange={(e) => setFilterInputs({ ...filterInputs, dateFrom: e.target.value })}
                    style={{
                      width: '130px',
                      height: '38px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: '#374151',
                      outline: 'none',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  />
                  <span style={{ color: '#9ca3af', fontWeight: 500 }}>→</span>
                  <input
                    type="date"
                    value={filterInputs.dateTo}
                    onChange={(e) => setFilterInputs({ ...filterInputs, dateTo: e.target.value })}
                    style={{
                      width: '130px',
                      height: '38px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: '#374151',
                      outline: 'none',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  />
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

      {/* Visual Divider */}
      <div style={{ height: '1px', background: '#e5e7eb', margin: '0' }}></div>

      {/* Content */}
      <div className="timesheets-content-wrapper">
        {initialLoading ? <Loader /> : (
          <div className="table-container-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  {(isAdmin || isSuperAdmin) && <th>{isAdmin ? 'Employee' : 'Admin (Employee ID)'}</th>}
                  {(isAdmin || isSuperAdmin) && <th>Created By</th>}
                  <th>Work Description</th>
                  <th>Hours</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={(isAdmin || isSuperAdmin) ? 6 : 4} style={{ textAlign: 'center', padding: '40px' }}>
                      <Loader />
                    </td>
                  </tr>
                )}
                {!loading && timesheets.length > 0 ? (
                  timesheets.map((timesheet) => (
                    <tr key={timesheet._id}>
                      <td>{formatDate(timesheet.date)}</td>
                      {(isAdmin || isSuperAdmin) && (
                        <td>
                          {timesheet.employee?.employeeId || 'N/A'}
                          {timesheet.employee?.user && (
                            <small style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11px' }}>
                              {timesheet.employee.user.name || 'N/A'}
                            </small>
                          )}
                        </td>
                      )}
                      {(isAdmin || isSuperAdmin) && (
                        <td>
                          {timesheet.createdBy?.name || 'N/A'}
                          {timesheet.createdBy && (
                            <small style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11px' }}>
                              {timesheet.createdBy.email || 'N/A'}
                            </small>
                          )}
                        </td>
                      )}
                      <td>{timesheet.workDescription || 'N/A'}</td>
                      <td>{timesheet.hours || 0} hrs</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {canEditTimesheet(timesheet) && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleEdit(timesheet)}
                              title="Edit"
                            >
                              <FiEdit />
                            </button>
                          )}
                          {canDeleteTimesheet(timesheet) && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(timesheet._id)}
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          )}
                          {!canEditTimesheet(timesheet) && !canDeleteTimesheet(timesheet) && (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>View only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : !loading && (
                  <tr>
                    <td colSpan={(isAdmin || isSuperAdmin) ? 6 : 4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      No timesheets found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedTimesheet(null);
          setFormData({
            date: dayjs().format('YYYY-MM-DD'),
            workDescription: '',
            hours: 0,
          });
        }}
        title={selectedTimesheet ? 'Edit Timesheet' : 'Add Timesheet'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              type="date"
              className="form-input"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Work Description *</label>
            <textarea
              className="form-input"
              value={formData.workDescription}
              onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
              rows={4}
              required
              placeholder="Describe the work performed..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hours *</label>
            <input
              type="number"
              className="form-input"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })}
              min="0"
              max="24"
              step="0.25"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowModal(false);
                setSelectedTimesheet(null);
                setFormData({
                  date: dayjs().format('YYYY-MM-DD'),
                  workDescription: '',
                  hours: 0,
                });
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedTimesheet ? 'Update' : 'Create'} Timesheet
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Timesheets;
