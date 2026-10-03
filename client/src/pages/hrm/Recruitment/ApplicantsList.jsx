import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiSearch, FiFileText, FiFilter, FiUserPlus, FiShare2, FiChevronDown, FiX, FiCheckCircle } from 'react-icons/fi';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import { formatDate } from '../../../utils/format';
import '../../../styles/hrm/recruitment.css';

const ApplicantsList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    jobId: jobId || '',
    status: '',
    atsStage: '',
    applicantType: '',
    search: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchApplicants();
    }, filters.search ? 500 : 300);
    return () => clearTimeout(timeout);
  }, [pagination.page, filters]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: pagination.limit };
      if (filters.jobId) params.jobId = filters.jobId;
      if (filters.status) params.status = filters.status;
      if (filters.atsStage) params.atsStage = filters.atsStage;
      if (filters.applicantType) params.applicantType = filters.applicantType;
      if (filters.search) params.search = filters.search;

      const res = await hrmService.getApplicants(params);
      if (res.data.success) {
        setApplicants(res.data.data || []);
        setPagination({
          ...pagination,
          total: res.data.total || 0,
          pages: res.data.pages || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicantId, status) => {
    try {
      await hrmService.updateApplicantStatus(applicantId, { status });
      // Optimistic update
      setApplicants(prev => prev.map(app =>
        app._id === applicantId ? { ...app, status } : app
      ));
    } catch (error) {
      alert('Failed to update status');
      fetchApplicants();
    }
  };

  const hasActiveFilters = filters.status || filters.atsStage || filters.applicantType;

  return (
    <div className="applicants-list-page" style={{ background: '#f8fafc', minHeight: '100vh' }}>

      {/* 1. Compact Header */}
      <div className="compact-page-header">
        <div>
          <h1 className="compact-title">
            Applicants
            <span className="applicant-count-badge">{pagination.total} Total</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-warning"
            onClick={async () => {
              if (!window.confirm('This will fix corrupted interview history data. Continue?')) return;
              try {
                const res = await hrmService.fixInterviewHistory();
                if (res.data.success) {
                  alert(`✓ Fixed ${res.data.data.totalFixed} records successfully!`);
                  fetchApplicants();
                } else {
                  alert('Failed to fix records');
                }
              } catch (error) {
                console.error('Migration error:', error);
                alert('Error: ' + (error.response?.data?.message || error.message));
              }
            }}
            title="Fix corrupted interview history data (admin only)"
          >
            🔧 Fix Database
          </button>
          <button className="btn btn-secondary" onClick={() => {/* Share logic */ }}>
            <FiShare2 /> Share Job
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/hrm/recruitment/add-applicant')}>
            <FiUserPlus /> Add Applicant
          </button>
        </div>
      </div>

      {/* 2. Sticky Action Bar */}
      <div className="sticky-action-bar">
        <div className="action-bar-left">
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="compact-search"
              placeholder="Search by name, email, or phone..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>

        <div className="action-bar-right">
          <div className="filter-btn-group">
            <button
              className={`filter-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter /> Filters
              {hasActiveFilters && <span style={{ background: '#2563eb', width: '6px', height: '6px', borderRadius: '50%' }}></span>}
            </button>

            {hasActiveFilters && (
              <button
                className="filter-btn"
                onClick={() => setFilters({ ...filters, status: '', atsStage: '', applicantType: '' })}
                style={{ color: '#ef4444', borderColor: '#fecaca' }}
              >
                <FiX /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdown */}
        {showFilters && (
          <div className="filter-panel-overlay fade-in" ref={filterRef} style={{
            position: 'absolute', top: '100%', right: '32px', width: '300px',
            background: 'white', padding: '20px', marginTop: '12px',
            border: '1px solid #e2e8f0', borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 100
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>STATUS</label>
                <select
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="applied">Applied</option>
                  <option value="screening">Screening</option>
                  <option value="interview">Interview</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>ATS STAGE</label>
                <select
                  className="form-select"
                  value={filters.atsStage}
                  onChange={(e) => setFilters({ ...filters, atsStage: e.target.value })}
                >
                  <option value="">All Stages</option>
                  <option value="applied">Applied</option>
                  <option value="screening">Screening</option>
                  <option value="interview">Interview</option>
                  <option value="technical_round">Technical Round</option>
                  <option value="hr_round">HR Round</option>
                  <option value="offer">Offer</option>
                  <option value="hired">Hired</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>TYPE</label>
                <select
                  className="form-select"
                  value={filters.applicantType}
                  onChange={(e) => setFilters({ ...filters, applicantType: e.target.value })}
                >
                  <option value="">All Types</option>
                  <option value="external">External</option>
                  <option value="internal">Internal</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Applicants Table */}
      <div className="applicants-table-wrapper">
        {loading ? (
          <div style={{ padding: '60px' }}><Loader /></div>
        ) : applicants.length > 0 ? (
          <table className="applicants-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>CANDIDATE</th>
                <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>JOB POSITION</th>
                <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>APPLIED DATE</th>
                <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>STATUS</th>
                <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>ATS STAGE</th>
                <th style={{ textAlign: 'right', padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((applicant) => (
                <tr key={applicant._id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: applicant.applicantType === 'internal' ? '#dcfce7' : '#e0e7ff', color: applicant.applicantType === 'internal' ? '#166534' : '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' }}>
                        {applicant.applicantName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>{applicant.applicantName}</span>
                          {applicant.applicantType === 'internal' && <FiCheckCircle size={12} color="#16a34a" />}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '13px' }}>{applicant.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: '500', color: '#334155', fontSize: '14px' }}>
                    {applicant.jobPosting?.title || 'General Application'}
                  </td>
                  <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '13px' }}>
                    {formatDate(applicant.createdAt)}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span className={`status-badge status-${applicant.status}`}>
                      {applicant.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span className={`ats-badge stage-${applicant.atsStage || 'applied'}`}>
                      {applicant.atsStage?.replace('_', ' ') || 'Applied'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-icon"
                        onClick={() => navigate(`/hrm/recruitment/applicants/${applicant._id}`)}
                        title="View Details"
                      >
                        <FiFileText />
                      </button>
                      <select
                        className="status-select"
                        value={applicant.status}
                        onChange={(e) => handleStatusChange(applicant._id, e.target.value)}
                        style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="applied">Applied</option>
                        <option value="screening">Screening</option>
                        <option value="interview">Interview</option>
                        <option value="selected">Selected</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state-modern">
            <div style={{ marginBottom: '16px', background: '#f1f5f9', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FiUserPlus size={32} color="#94a3b8" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>No applicants found</h3>
            <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
              {filters.search || hasActiveFilters ? 'Try adjusting your search or filters to find what you are looking for.' : 'Share your job postings to attract candidates or add them manually.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setFilters({ status: '', atsStage: '', applicantType: '', search: '' })}>
                Clear Filters
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/hrm/recruitment/add-job')}>
                View Jobs
              </button>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ padding: '24px 32px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Showing page {pagination.page} of {pagination.pages}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicantsList;
