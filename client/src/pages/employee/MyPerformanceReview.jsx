import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiFileText, FiCheckCircle, FiClock, FiUser, FiTrendingUp, FiPlus, FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import RatingInput from '../../components/Performance/RatingInput';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/format';
import '../../styles/performance.css';
import '../../styles/finance/expenses.css';

/**
 * My Performance Review Page - Employee View
 * Allows employees to view and submit self-reviews
 */
const MyPerformanceReview = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [employeeId, setEmployeeId] = useState(null);
  const [showSelfReviewModal, setShowSelfReviewModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const buttonRef = useRef(null);
  const [selfReviewForm, setSelfReviewForm] = useState({
    strengths: '',
    weaknesses: '',
    achievements: '',
    rating: 0,
  });

  useEffect(() => {
    fetchEmployee();
    fetchCycles();
  }, []);

  useEffect(() => {
    if (employeeId) {
      fetchReviews();
    }
  }, [employeeId]);

  // Apply filters
  useEffect(() => {
    let filtered = reviews;

    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.appraisalCycle?.name?.toLowerCase().includes(searchLower) ||
        r.appraisalCycle?.type?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredReviews(filtered);
  }, [filters, reviews]);

  const fetchEmployee = async () => {
    try {
      const userId = user?._id || user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      // First try to fetch employee specifically for this user
      let response = await employeeService.getEmployees({ user: userId });
      let emp = null;

      if (response.data.success && response.data.data.length > 0) {
        emp = response.data.data[0];
      } else {
        // Fallback: If querying by user fails, fetch a larger list
        response = await employeeService.getEmployees({ limit: 500 });
        if (response.data.success && response.data.data.length > 0) {
          const userIdString = userId.toString();
          emp = response.data.data.find(e => {
            const empUserId = e.user?._id || e.user?.id;
            return empUserId?.toString() === userIdString;
          });
        }
      }

      if (emp) {
        setEmployeeId(emp._id);
        // Loading is left to be toggled by fetchReviews, which will trigger since employeeId changed
      } else {
        console.warn('Could not find corresponding employee record for this user:', userId);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      setLoading(false);
    }
  };

  const fetchCycles = async () => {
    try {
      console.log('Fetching cycles...');
      const response = await employeeService.getCycles();
      console.log('Cycles response:', response.data);

      if (response.data.success) {
        const activeCycles = response.data.data.filter(c => c.status === 'active');
        console.log('Active cycles found:', activeCycles);
        setCycles(activeCycles);
        if (activeCycles.length > 0) {
          setSelectedCycle(activeCycles[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching cycles:', error);
    }
  };

  const fetchReviews = async () => {
    if (!employeeId) return;

    try {
      setLoading(true);
      const response = await employeeService.getReviews(employeeId);
      if (response.data.success) {
        setReviews(response.data.data);
        setFilteredReviews(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelfReviewSubmit = async (e) => {
    e.preventDefault();

    if (!selfReviewForm.rating || selfReviewForm.rating === 0) {
      alert('Please provide a rating');
      return;
    }

    try {
      const response = await employeeService.submitSelfReview({
        appraisalCycleId: selectedCycle || null,
        ...selfReviewForm,
      });

      if (response.data.success) {
        alert('Self-review submitted successfully!');
        setShowSelfReviewModal(false);
        setSelfReviewForm({
          strengths: '',
          weaknesses: '',
          achievements: '',
          rating: 0,
        });
        fetchReviews();
      }
    } catch (error) {
      console.error('Error submitting self-review:', error);
      alert(error.response?.data?.message || 'Error submitting self-review');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-secondary', text: 'Pending', icon: FiClock },
      self_submitted: { class: 'badge-info', text: 'Self-Review Submitted', icon: FiFileText },
      manager_submitted: { class: 'badge-success', text: 'Completed', icon: FiCheckCircle },
      completed: { class: 'badge-success', text: 'Completed', icon: FiCheckCircle },
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="expense-list-page">
      {/* Header Row */}
      <div className="expenses-page-header">
        <div className="header-title-group">
          <h1 className="page-title">My Performance Review</h1>
          <p className="page-subtitle">
            {filteredReviews.length} {filteredReviews.length === 1 ? 'review' : 'reviews'}
          </p>
        </div>
        <div className="header-actions">
          {cycles.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={() => setShowSelfReviewModal(true)}
            >
              <FiPlus />
              Submit Self-Review
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
            {(filters.status) && (
              <span style={{
                background: '#3b82f6',
                color: 'white',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 700
              }}>
                1
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
        {/* Total Reviews */}
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
              {reviews.length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Total Reviews
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
              {reviews.filter(r => r.status === 'pending').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Pending
            </div>
          </div>
        </div>

        {/* Self-Review Submitted */}
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
            <FiUser />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {reviews.filter(r => r.status === 'self_submitted').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Self-Review Submitted
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
              {reviews.filter(r => r.status === 'completed' || r.status === 'manager_submitted').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Completed
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
            placeholder="Search reviews..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
                placeholder="Search reviews..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
              {(filters.status) && (
                <span style={{
                  background: '#3b82f6',
                  color: 'white',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 700
                }}>
                  1
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
                <div style={{ position: 'relative', width: '200px' }}>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
                    <option value="pending">Pending</option>
                    <option value="self_submitted">Self-Review Submitted</option>
                    <option value="manager_submitted">Manager Submitted</option>
                    <option value="completed">Completed</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', height: '38px' }}>
                <button
                  onClick={() => setFilters({ ...filters, status: '' })}
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
                  onClick={() => setShowFilters(false)}
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
                  Done
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Visual Divider */}
      <div style={{ height: '1px', background: '#e5e7eb', margin: '0' }}></div>

      {loading ? (
        <Loader />
      ) : (
        <div className="reviews-grid">
          {filteredReviews.length > 0 ? (
            filteredReviews.map(review => {
              const badge = getStatusBadge(review.status);
              const BadgeIcon = badge.icon;

              return (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <div>
                      <h3 className="review-title">
                        {review.appraisalCycle?.name || 'Performance Review'}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                        {review.appraisalCycle?.type?.replace('_', '-') || 'General Review'}
                      </p>
                    </div>
                    <span className={`badge ${badge.class}`}>
                      <BadgeIcon size={14} style={{ marginRight: '4px' }} />
                      {badge.text}
                    </span>
                  </div>

                  {/* Self Review Section */}
                  {review.selfReview?.submittedAt && (
                    <div className="review-section">
                      <h4 className="review-section-title">
                        <FiUser size={16} style={{ marginRight: '8px' }} />
                        Self-Review
                      </h4>
                      {review.selfReview.strengths && (
                        <div>
                          <strong>Strengths:</strong>
                          <div className="review-content">{review.selfReview.strengths}</div>
                        </div>
                      )}
                      {review.selfReview.weaknesses && (
                        <div style={{ marginTop: '12px' }}>
                          <strong>Weaknesses:</strong>
                          <div className="review-content">{review.selfReview.weaknesses}</div>
                        </div>
                      )}
                      {review.selfReview.achievements && (
                        <div style={{ marginTop: '12px' }}>
                          <strong>Achievements:</strong>
                          <div className="review-content">{review.selfReview.achievements}</div>
                        </div>
                      )}
                      {review.selfReview.rating && (
                        <div className="review-rating" style={{ marginTop: '12px' }}>
                          <strong>Self Rating:</strong>
                          <RatingInput value={review.selfReview.rating} disabled />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manager Review Section */}
                  {review.managerReview?.submittedAt && (
                    <div className="review-section" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                      <h4 className="review-section-title">
                        <FiTrendingUp size={16} style={{ marginRight: '8px' }} />
                        Manager Review
                      </h4>
                      {review.managerReview.strengths && (
                        <div>
                          <strong>Strengths:</strong>
                          <div className="review-content">{review.managerReview.strengths}</div>
                        </div>
                      )}
                      {review.managerReview.weaknesses && (
                        <div style={{ marginTop: '12px' }}>
                          <strong>Weaknesses:</strong>
                          <div className="review-content">{review.managerReview.weaknesses}</div>
                        </div>
                      )}
                      {review.managerReview.achievements && (
                        <div style={{ marginTop: '12px' }}>
                          <strong>Achievements:</strong>
                          <div className="review-content">{review.managerReview.achievements}</div>
                        </div>
                      )}
                      {review.managerReview.rating && (
                        <div className="review-rating" style={{ marginTop: '12px' }}>
                          <strong>Manager Rating:</strong>
                          <RatingInput value={review.managerReview.rating} disabled />
                        </div>
                      )}
                      {review.finalRating && (
                        <div style={{ marginTop: '16px', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                          <strong>Final Rating: {review.finalRating}/5</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {review.status === 'pending' && !review.selfReview?.submittedAt && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                        Self-review not submitted yet
                      </p>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setSelectedCycle(review.appraisalCycle?._id || '');
                          setShowSelfReviewModal(true);
                        }}
                        style={{ marginTop: '8px' }}
                      >
                        Submit Now
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-secondary col-span-full">
              {cycles.length > 0
                ? 'No performance reviews found. Submit a self-review to get started.'
                : 'No active appraisal cycles available.'}
            </div>
          )}
        </div>
      )}

      {/* Self-Review Modal */}
      {showSelfReviewModal && (
        <Modal
          isOpen={showSelfReviewModal}
          onClose={() => {
            setShowSelfReviewModal(false);
            setSelfReviewForm({
              strengths: '',
              weaknesses: '',
              achievements: '',
              rating: 0,
            });
          }}
          title="Submit Self-Review"
        >
          <form onSubmit={handleSelfReviewSubmit}>
            {cycles.length > 0 && (
              <div className="form-group">
                <label className="form-label">Appraisal Cycle</label>
                <select
                  className="form-select"
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  required
                >
                  <option value="">Select Cycle</option>
                  {cycles.map(cycle => (
                    <option key={cycle._id} value={cycle._id}>
                      {cycle.name} ({cycle.type.replace('_', '-')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Rating *</label>
              <RatingInput
                value={selfReviewForm.rating}
                onChange={(rating) => setSelfReviewForm(prev => ({ ...prev, rating }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Strengths</label>
              <textarea
                className="form-textarea"
                value={selfReviewForm.strengths}
                onChange={(e) => setSelfReviewForm(prev => ({ ...prev, strengths: e.target.value }))}
                rows={4}
                placeholder="Describe your strengths..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Weaknesses</label>
              <textarea
                className="form-textarea"
                value={selfReviewForm.weaknesses}
                onChange={(e) => setSelfReviewForm(prev => ({ ...prev, weaknesses: e.target.value }))}
                rows={4}
                placeholder="Describe areas for improvement..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Achievements</label>
              <textarea
                className="form-textarea"
                value={selfReviewForm.achievements}
                onChange={(e) => setSelfReviewForm(prev => ({ ...prev, achievements: e.target.value }))}
                rows={4}
                placeholder="List your key achievements..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowSelfReviewModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit Review
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MyPerformanceReview;
