import { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiCalendar, FiClock, FiCheckCircle, FiAlertCircle, FiUsers, FiTrendingUp } from 'react-icons/fi';
import { salesService, normalizeSalesListResponse } from '../../services/salesService';
import FollowupTable from '../../components/Sales/FollowupTable';
import ScheduleFollowUpModal from '../../components/Sales/ScheduleFollowUpModal';
import Loader from '../../components/common/Loader';
import '../../styles/sales/followups.css';

const FollowupList = () => {
  const [followups, setFollowups] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', type: '', search: '', bucket: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    total: 0, pending: 0, completed: 0, overdue: 0, dueToday: 0, upcoming: 0, owners: 0,
  });
  const [errorMessage, setErrorMessage] = useState('');

  // Initial load
  useEffect(() => {
    fetchFollowUps(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await salesService.getFollowUpsSummary(filters.type ? { type: filters.type } : {});
        if (response.data.success) setSummaryStats(response.data.data);
      } catch (error) {
        console.error('Error fetching follow-up summary:', error);
        setErrorMessage(error.response?.data?.message || 'Unable to load follow-up summary.');
      }
    };
    fetchSummary();
  }, [filters.type]);

  // Debounce search and filter changes
  useEffect(() => {
    if (initialLoading) return; // Skip if initial load hasn't completed

    const timeout = setTimeout(() => {
      fetchFollowUps(false);
    }, filters.search ? 500 : 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, filters]);

  const fetchFollowUps = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }
      const params = { page: pagination.page, limit: pagination.limit, ...filters };
      const res = await salesService.getFollowUps(params);
      const normalized = normalizeSalesListResponse(res);
      if (normalized.success) {
        setErrorMessage('');
        setFollowups(normalized.data || []);
        setPagination(prev => ({
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
      if (isInitialLoad) {
        setInitialLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  return (
    <div className="followup-list-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Follow-ups & Reminders</h1>
          <p className="page-subtitle">Manage scheduled follow-ups and reminders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowScheduleModal(true)}>
          <FiPlus /> Schedule Follow-up
        </button>
      </div>

      {/* Stats Cards */}
      <div className="followup-pulse-panel">
        <div className="pulse-copy">
          <span className="pulse-kicker">Sales Pulse</span>
          <h2>{summaryStats.overdue ? `${summaryStats.overdue} follow-up(s) need attention` : summaryStats.dueToday ? `${summaryStats.dueToday} follow-up(s) due today` : 'Follow-up momentum is on track'}</h2>
        </div>
        <div className="pulse-meta">
          <div className="pulse-meta-item">
            <FiTrendingUp />
            <span>{summaryStats.dueToday + summaryStats.upcoming} due this week</span>
          </div>
          <div className="pulse-meta-item">
            <FiUsers />
            <span>{summaryStats.owners} owners active</span>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Total Follow-ups */}
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
              {summaryStats.total}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Total Follow-ups
            </div>
          </div>
        </div>

        {/* Pending */}
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
              {summaryStats.pending}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Pending
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
              {summaryStats.completed}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Completed
            </div>
          </div>
        </div>

        {/* Overdue */}
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
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px'
          }}>
            <FiAlertCircle />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {summaryStats.overdue}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Overdue
            </div>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <FiSearch />
          <input
            type="text"
            placeholder="Search follow-ups..."
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setPagination((current) => ({ ...current, page: 1 }));
            }}
            onKeyDown={(e) => {
              // Prevent form submission on Enter key
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            disabled={loading}
          />
        </div>
        <select
          className="form-select"
          value={filters.status}
          onChange={(e) => {
            setFilters({ ...filters, status: e.target.value });
            setPagination((current) => ({ ...current, page: 1 }));
          }}
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
          onChange={(e) => {
            setFilters({ ...filters, type: e.target.value });
            setPagination((current) => ({ ...current, page: 1 }));
          }}
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
          onChange={(e) => {
            setFilters({ ...filters, bucket: e.target.value });
            setPagination((current) => ({ ...current, page: 1 }));
          }}
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

      {initialLoading ? (
        <Loader />
      ) : (
        <div className="page-content">
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
            <FollowupTable followups={followups} pagination={pagination} onPageChange={(page) => setPagination({ ...pagination, page })} />
          </div>
        </div>
      )}

      {/* Schedule Follow-up Modal */}
      <ScheduleFollowUpModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSuccess={() => {
          setShowScheduleModal(false);
          fetchFollowUps(false);
          salesService.getFollowUpsSummary(filters.type ? { type: filters.type } : {})
            .then((response) => {
              if (response.data.success) setSummaryStats(response.data.data);
            })
            .catch((error) => {
              console.error('Error refreshing follow-up summary:', error);
              setErrorMessage(error.response?.data?.message || 'Unable to refresh follow-up summary.');
            });
        }}
      />
    </div>
  );
};

export default FollowupList;
















