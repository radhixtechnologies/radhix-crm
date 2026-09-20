import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hrmService } from '../../services/hrmService';
import { employeeService } from '../../services/employeeService';
import { FiFileText, FiCheckCircle, FiClock, FiUser, FiTrendingUp, FiEdit2 } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import RatingInput from '../../components/Performance/RatingInput';
import Modal from '../../components/common/Modal';
import '../../styles/performance.css';

/**
 * All Reviews Page - Admin View
 * View and manage all performance reviews
 */
const AllReviews = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showManagerReviewModal, setShowManagerReviewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [managerReviewForm, setManagerReviewForm] = useState({
    strengths: '',
    improvementAreas: '',
    recommendations: '',
    overallRating: 0,
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  useEffect(() => {
    fetchEmployees();
    fetchReviews();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, employeeFilter]);

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

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use hrmService to get the actual HRM module reviews
      const response = await hrmService.getReviews({});
      if (response.data.success) {
        setReviews(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load reviews');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.response?.data?.message || 'Error loading reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManagerReview = (review) => {
    setSelectedReview(review);
    setManagerReviewForm({
      strengths: review.managerAssessment?.strengths || '',
      improvementAreas: review.managerAssessment?.improvementAreas || '',
      recommendations: review.managerAssessment?.recommendations || '',
      overallRating: review.managerAssessment?.overallRating || 0,
    });
    setShowManagerReviewModal(true);
  };

  const handleManagerReviewSubmit = async (e) => {
    e.preventDefault();

    if (!managerReviewForm.overallRating || managerReviewForm.overallRating === 0) {
      alert('Please provide a rating');
      return;
    }

    try {
      const response = await hrmService.submitManagerAssessment(
        selectedReview._id,
        managerReviewForm
      );

      if (response.data.success) {
        alert('Manager review submitted successfully!');
        setShowManagerReviewModal(false);
        fetchReviews();
      }
    } catch (error) {
      console.error('Error submitting manager review:', error);
      alert(error.response?.data?.message || 'Error submitting manager review');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'draft': { class: 'badge-secondary', text: 'Draft', icon: FiClock },
      'self-assessment-pending': { class: 'badge-warning', text: 'Pending Self-Review', icon: FiClock },
      'self-assessment-submitted': { class: 'badge-info', text: 'Self-Review Submitted', icon: FiFileText },
      'manager-review': { class: 'badge-info', text: 'Manager Review', icon: FiTrendingUp },
      'hr-review': { class: 'badge-info', text: 'HR Review', icon: FiCheckCircle },
      'completed': { class: 'badge-success', text: 'Completed', icon: FiCheckCircle },
      'archived': { class: 'badge-secondary', text: 'Archived', icon: FiClock },
    };
    return badges[status] || badges.draft;
  };

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Access Denied</h1>
          <p className="page-subtitle">You do not have permission to view this page</p>
        </div>
      </div>
    );
  }

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">All Performance Reviews</h1>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger, #ef4444)', background: 'var(--surface)', borderRadius: 'var(--radius)', margin: '24px' }}>
          <p style={{ fontSize: '16px', fontWeight: 600 }}>⚠️ {error}</p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={fetchReviews}>Retry</button>
        </div>
      </div>
    );
  }

  const filteredReviews = reviews.filter(review => {
    // Guard: skip reviews with missing employee data
    if (!review.employee) return false;
    if (employeeFilter && (review.employee._id || review.employee.id || '').toString() !== employeeFilter) return false;
    if (statusFilter && review.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Performance Reviews</h1>
          <p className="page-subtitle">View and manage performance reviews for all employees</p>
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ minWidth: '200px' }}
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
          >
            <option value="">All Employees</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.employeeId} - {emp.user?.name}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ minWidth: '150px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="self-assessment-pending">Pending Self-Review</option>
            <option value="self-assessment-submitted">Self-Review Submitted</option>
            <option value="manager-review">Manager Reviewing</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Reviews Grid */}
        {filteredReviews.length > 0 ? (
          <div className="reviews-grid">
            {filteredReviews.map(review => {
              const badge = getStatusBadge(review.status);
              const BadgeIcon = badge.icon;

              return (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <div>
                      <h3 className="review-title">
                        {review.employee?.user?.name || 'N/A'} - {review.reviewCycle?.cycleName || review.reviewCycle?.type || 'Performance Review'}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                        {review.employee?.employeeId} ({review.employee?.department})
                      </p>
                    </div>
                    <span className={`badge ${badge.class}`}>
                      <BadgeIcon size={14} style={{ marginRight: '4px' }} />
                      {badge.text}
                    </span>
                  </div>

                  {/* Self Assessment Section */}
                  {review.selfAssessment?.submittedAt && (
                    <div className="review-section">
                      <h4 className="review-section-title">
                        <FiUser size={16} style={{ marginRight: '8px' }} />
                        Self-Assessment
                      </h4>
                      {review.selfAssessment.achievements && (
                        <div>
                          <strong>Achievements:</strong>
                          <div className="review-content">{review.selfAssessment.achievements}</div>
                        </div>
                      )}
                      {review.selfAssessment.challenges && (
                        <div style={{ marginTop: '12px' }}>
                          <strong>Challenges:</strong>
                          <div className="review-content">{review.selfAssessment.challenges}</div>
                        </div>
                      )}
                      {review.selfAssessment.overallRating && (
                        <div className="review-rating" style={{ marginTop: '12px' }}>
                          <strong>Self Rating:</strong>
                          <RatingInput value={review.selfAssessment.overallRating} disabled />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manager Assessment Section */}
                  {review.managerAssessment?.submittedAt && (
                    <div className="review-section" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                      <h4 className="review-section-title">
                        <FiTrendingUp size={16} style={{ marginRight: '8px' }} />
                        Manager Assessment
                      </h4>
                      {review.managerAssessment.strengths && (
                        <div>
                          <strong>Strengths:</strong>
                          <div className="review-content">{review.managerAssessment.strengths}</div>
                        </div>
                      )}
                      {review.managerAssessment.improvementAreas && (
                        <div style={{ marginTop: '12px' }}>
                          <strong>Areas for Improvement:</strong>
                          <div className="review-content">{review.managerAssessment.improvementAreas}</div>
                        </div>
                      )}
                      {review.managerAssessment.overallRating && (
                        <div className="review-rating" style={{ marginTop: '12px' }}>
                          <strong>Manager Rating:</strong>
                          <RatingInput value={review.managerAssessment.overallRating} disabled />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions: Show for any review that hasn't been completed yet */}
                  {review.status !== 'completed' && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                      {review.status === 'self-assessment-pending' && (
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                          ℹ️ Employee has not submitted their self-assessment yet.
                        </p>
                      )}
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleManagerReview(review)}
                      >
                        <FiEdit2 /> {review.managerAssessment?.overallRating ? 'Edit Manager Assessment' : 'Add Manager Assessment'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <FiFileText className="empty-state-icon" />
            <h3 className="empty-state-title">No Reviews Found</h3>
            <p className="empty-state-text">
              {statusFilter || employeeFilter
                ? 'No reviews match the selected filters.'
                : 'No performance reviews have been submitted yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Manager Review Modal */}
      {showManagerReviewModal && selectedReview && (
        <Modal
          isOpen={showManagerReviewModal}
          onClose={() => setShowManagerReviewModal(false)}
          title={`Manager Review - ${selectedReview.employee?.user?.name || 'Employee'}`}
        >
          <form onSubmit={handleManagerReviewSubmit}>
             <div className="form-group">
               <label className="form-label">Overall Rating *</label>
               <RatingInput
                 value={managerReviewForm.overallRating}
                 onChange={(rating) => setManagerReviewForm(prev => ({ ...prev, overallRating: rating }))}
               />
             </div>
 
             <div className="form-group">
               <label className="form-label">Strengths</label>
               <textarea
                 className="form-textarea"
                 value={managerReviewForm.strengths}
                 onChange={(e) => setManagerReviewForm(prev => ({ ...prev, strengths: e.target.value }))}
                 rows={3}
                 placeholder="Describe employee's strengths..."
               />
             </div>
 
             <div className="form-group">
               <label className="form-label">Areas for Improvement</label>
               <textarea
                 className="form-textarea"
                 value={managerReviewForm.improvementAreas}
                 onChange={(e) => setManagerReviewForm(prev => ({ ...prev, improvementAreas: e.target.value }))}
                 rows={3}
                 placeholder="Describe areas for improvement..."
               />
             </div>
 
             <div className="form-group">
               <label className="form-label">Recommendations</label>
               <textarea
                 className="form-textarea"
                 value={managerReviewForm.recommendations}
                 onChange={(e) => setManagerReviewForm(prev => ({ ...prev, recommendations: e.target.value }))}
                 rows={3}
                 placeholder="Promotion suggestions, training needs, etc."
               />
             </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowManagerReviewModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit Manager Review
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AllReviews;

