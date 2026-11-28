import { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiSearch, FiCalendar, FiClock, FiCheckCircle,
  FiAlertCircle, FiUsers, FiTrendingUp, FiUser
} from 'react-icons/fi';
import { salesService, normalizeSalesListResponse } from '../../services/salesService';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import FollowupTable from '../../components/Sales/FollowupTable';
import ScheduleFollowUpModal from '../../components/Sales/ScheduleFollowUpModal';
import Loader from '../../components/common/Loader';
import '../../styles/sales/followups.css';

const FollowupList = () => {
  const { roleSlug, isAdmin, isSuperAdmin } = useAuth();
  const canViewTeamTracker =
    isAdmin ||
    isSuperAdmin ||
    roleSlug === 'sales_manager' ||
    roleSlug?.endsWith('_admin') ||
    roleSlug?.endsWith('_manager');

  const [followups, setFollowups] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
    bucket: '',
    assignedTo: '',
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 0 });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedFollowups, setSelectedFollowups] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    dueToday: 0,
    upcoming: 0,
    owners: 0,
    byEmployee: [],
  });
  const [errorMessage, setErrorMessage] = useState('');

  const fetchSummary = useCallback(async () => {
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.assignedTo) params.assignedTo = filters.assignedTo;
      const response = await salesService.getFollowUpsSummary(params);
      if (response.data?.success) setSummaryStats(response.data.data);
    } catch (error) {
      console.error('Error fetching follow-up summary:', error);
      setErrorMessage(error.response?.data?.message || 'Unable to load follow-up summary.');
    }
  }, [filters.type, filters.assignedTo]);

  const fetchFollowUps = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setInitialLoading(true);
      else setLoading(true);

      const params = { page: pagination.page, limit: pagination.limit, ...filters };
      const res = await salesService.getFollowUps(params);
      const normalized = normalizeSalesListResponse(res);
      if (normalized.success) {
        setErrorMessage('');
        setFollowups(normalized.data || []);
        setPagination((prev) => ({
          ...prev,
          page: normalized.page,
          limit: normalized.limit,
          total: normalized.total,
          pages: normalized.pages,
        }));
      }
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      setErrorMessage(error.response?.data?.message || 'Unable to load follow-ups. Please try again.');
    } finally {
      if (isInitialLoad) setInitialLoading(false);
      else setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchFollowUps(true);
    if (canViewTeamTracker) {
      employeeService.getEmployees({ limit: 200 })
        .then((res) => {
          if (res.data?.success) setEmployees(res.data.data || []);
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (initialLoading) return;
    const timeout = setTimeout(() => {
      fetchFollowUps(false);
    }, filters.search ? 450 : 200);
    return () => clearTimeout(timeout);
  }, [pagination.page, filters, initialLoading, fetchFollowUps]);

  const handleRefreshAll = async () => {
    await Promise.all([fetchFollowUps(false), fetchSummary()]);
  };

  const handleBulkComplete = async () => {
    if (selectedFollowups.length === 0) return;
    try {
      setBulkProcessing(true);
      await Promise.all(selectedFollowups.map((id) => salesService.updateFollowUp(id, { status: 'completed' })));
      setSelectedFollowups([]);
      await handleRefreshAll();
    } catch (err) {
      console.error('Error completing followups:', err);
      alert('Failed to complete some follow-ups');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFollowups.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedFollowups.length} selected follow-up(s)?`)) return;
    try {
      setBulkProcessing(true);
      await Promise.all(selectedFollowups.map((id) => salesService.deleteFollowUp(id)));
      setSelectedFollowups([]);
      await handleRefreshAll();
    } catch (err) {
      console.error('Error deleting followups:', err);
      alert('Failed to delete some follow-ups');
    } finally {
      setBulkProcessing(false);
    }
  };

  const applyFilterPatch = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  return (
    <div className="followup-list-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Follow-ups &amp; Reminders</h1>
          <p className="page-subtitle">Track which employee is following up with each client, remarks, and next callback schedule</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowScheduleModal(true)}>
          <FiPlus /> Schedule Follow-up
        </button>
      </div>

      {/* Pulse Panel */}
      <div className="followup-pulse-panel">
        <div className="pulse-copy">
          <span className="pulse-kicker">Sales Follow-up Command Center</span>
          <h2>
            {summaryStats.overdue
              ? `${summaryStats.overdue} follow-up(s) need attention`
              : summaryStats.dueToday
                ? `${summaryStats.dueToday} follow-up(s) due today`
                : 'Follow-up momentum is on track'}
          </h2>
        </div>
        <div className="pulse-meta">
          <div className="pulse-meta-item" style={{ cursor: 'pointer' }} onClick={() => applyFilterPatch({ bucket: 'today', status: '' })}>
            <FiClock />
            <span>{summaryStats.dueToday} due today</span>
          </div>
          <div className="pulse-meta-item">
            <FiTrendingUp />
            <span>{summaryStats.dueToday + summaryStats.upcoming} due this week</span>
          </div>
          <div className="pulse-meta-item">
            <FiUsers />
            <span>{summaryStats.owners} employees active</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '20px',
      }}>
        <div
          onClick={() => applyFilterPatch({ status: '', bucket: '' })}
          style={{
            background: 'white',
            border: !filters.status && !filters.bucket ? '1.5px solid #3b82f6' : '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px',
          }}>
            <FiCalendar />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>{summaryStats.total}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Total Follow-ups</div>
          </div>
        </div>

        <div
          onClick={() => applyFilterPatch({ status: 'pending', bucket: '' })}
          style={{
            background: 'white',
            border: filters.status === 'pending' ? '1.5px solid #d97706' : '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px',
          }}>
            <FiClock />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>{summaryStats.pending}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Pending</div>
          </div>
        </div>

        <div
          onClick={() => applyFilterPatch({ status: 'completed', bucket: '' })}
          style={{
            background: 'white',
            border: filters.status === 'completed' ? '1.5px solid #16a34a' : '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px',
          }}>
            <FiCheckCircle />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>{summaryStats.completed}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Completed</div>
          </div>
        </div>

        <div
          onClick={() => applyFilterPatch({ bucket: 'overdue', status: '' })}
          style={{
            background: 'white',
            border: filters.bucket === 'overdue' ? '1.5px solid #dc2626' : '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px',
          }}>
            <FiAlertCircle />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>{summaryStats.overdue}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Overdue</div>
          </div>
        </div>
      </div>

      {/* Team / Employee Workload Strip */}
      {canViewTeamTracker && Array.isArray(summaryStats.byEmployee) && summaryStats.byEmployee.length > 0 && (
        <div className="employee-tracker-bar">
          <div className="employee-tracker-head">
            <span className="employee-tracker-title">
              <FiUser size={14} /> Employee Follow-up Tracker
            </span>
            {filters.assignedTo && (
              <button
                type="button"
                className="tracker-reset-btn"
                onClick={() => applyFilterPatch({ assignedTo: '' })}
              >
                Show All Employees
              </button>
            )}
          </div>
          <div className="employee-tracker-pills">
            {summaryStats.byEmployee.map((emp) => {
              const isActive = filters.assignedTo === emp.employeeId;
              return (
                <button
                  type="button"
                  key={emp.employeeId}
                  onClick={() => applyFilterPatch({ assignedTo: isActive ? '' : emp.employeeId })}
                  className={`employee-tracker-pill ${isActive ? 'is-active' : ''}`}
                >
                  <strong>{emp.name}</strong>
                  <span className="tracker-counts">
                    {emp.overdue > 0 && <em className="tc-overdue">{emp.overdue} late</em>}
                    {emp.dueToday > 0 && <em className="tc-today">{emp.dueToday} today</em>}
                    <em className="tc-pending">{emp.pending} open</em>
                    <em className="tc-done">{emp.completed} done</em>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-bar">
          <FiSearch />
          <input
            type="text"
            placeholder="Search client name, phone, company, or remark..."
            value={filters.search}
            onChange={(e) => applyFilterPatch({ search: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
            disabled={loading}
          />
        </div>

        {canViewTeamTracker && (
          <select
            className="form-select"
            value={filters.assignedTo}
            onChange={(e) => applyFilterPatch({ assignedTo: e.target.value })}
            disabled={loading}
            aria-label="Filter by employee"
          >
            <option value="">All Employees</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.user?.name || emp.employeeId}
              </option>
            ))}
          </select>
        )}

        <select
          className="form-select"
          value={filters.status}
          onChange={(e) => applyFilterPatch({ status: e.target.value })}
          disabled={loading}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="overdue">Overdue</option>
        </select>

        <select
          className="form-select"
          value={filters.type}
          onChange={(e) => applyFilterPatch({ type: e.target.value })}
          disabled={loading}
        >
          <option value="">All Types</option>
          <option value="lead">Lead</option>
          <option value="client">Client</option>
          <option value="deal">Deal</option>
        </select>

        <select
          className="form-select"
          value={filters.bucket}
          onChange={(e) => applyFilterPatch({ bucket: e.target.value })}
          disabled={loading}
          aria-label="Filter by due date"
        >
          <option value="">All Dates</option>
          <option value="today">Due Today</option>
          <option value="overdue">Overdue</option>
          <option value="upcoming">Upcoming</option>
        </select>
      </div>

      {errorMessage && <div className="alert alert-error" role="alert">{errorMessage}</div>}

      {/* Bulk Selection Bar */}
      {selectedFollowups.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '10px',
          marginBottom: '16px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ background: '#3b82f6', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
              {selectedFollowups.length} Selected
            </span>
            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Manage selected follow-up records</span>
            <button
              onClick={() => setSelectedFollowups([])}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Deselect All
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-sm"
              onClick={handleBulkComplete}
              disabled={bulkProcessing}
              style={{ background: '#10b981', color: 'white', border: 'none', fontWeight: 600, fontSize: '13px' }}
            >
              Mark Completed ({selectedFollowups.length})
            </button>
            <button
              className="btn btn-sm"
              onClick={handleBulkDelete}
              disabled={bulkProcessing}
              style={{ background: '#ef4444', color: 'white', border: 'none', fontWeight: 600, fontSize: '13px' }}
            >
              Delete ({selectedFollowups.length})
            </button>
          </div>
        </div>
      )}

      {initialLoading ? (
        <Loader />
      ) : (
        <div className="page-content">
          <div style={{ position: 'relative' }}>
            {loading && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 10, borderRadius: '8px', minHeight: '200px',
              }}>
                <Loader />
              </div>
            )}
            <FollowupTable
              followups={followups}
              selectedFollowups={selectedFollowups}
              onSelectFollowups={setSelectedFollowups}
              pagination={pagination}
              onPageChange={(page) => setPagination({ ...pagination, page })}
              onRefresh={handleRefreshAll}
            />
          </div>
        </div>
      )}

      <ScheduleFollowUpModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSuccess={async () => {
          setShowScheduleModal(false);
          await handleRefreshAll();
        }}
      />
    </div>
  );
};

export default FollowupList;
