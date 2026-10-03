import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiMail, FiPhone, FiFileText, FiCalendar, FiCheck, FiX, FiUpload, FiEdit2, FiStar, FiUser, FiLinkedin, FiClock, FiDownload, FiMessageSquare, FiBriefcase, FiMapPin } from 'react-icons/fi';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import OfferManagement from '../../../components/hrm/OfferManagement';
import { formatDate } from '../../../utils/format';
import '../../../styles/hrm/recruitment.css';

const ApplicantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, interviews, evaluation, notes, offers
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // Form States
  const [notes, setNotes] = useState({ notes: '', internalNotes: '' });
  const [evaluation, setEvaluation] = useState({ rating: 3, strengths: '', weaknesses: '', fitScore: 5, recommendation: 'maybe' });
  const [documentForm, setDocumentForm] = useState({ name: '', type: '', url: '' });

  useEffect(() => {
    fetchApplicant();
  }, [id]);

  useEffect(() => {
    if (applicant) {
      setNotes({ notes: applicant.notes || '', internalNotes: applicant.internalNotes || '' });
      if (applicant.evaluation) {
        setEvaluation({
          rating: applicant.evaluation.rating || 3,
          strengths: applicant.evaluation.strengths || '',
          weaknesses: applicant.evaluation.weaknesses || '',
          fitScore: applicant.evaluation.fitScore || 5,
          recommendation: applicant.evaluation.recommendation || 'maybe',
        });
      }
    }
  }, [applicant]);

  const fetchApplicant = async () => {
    try {
      const res = await hrmService.getApplicant(id);
      if (res.data.success) {
        setApplicant(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching applicant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      setUpdating(true);
      await hrmService.updateApplicantStatus(id, { status });
      // Optimistic update
      setApplicant(prev => ({ ...prev, status }));
      alert('Status updated successfully');
    } catch (error) {
      alert('Failed to update status');
      fetchApplicant();
    } finally {
      setUpdating(false);
    }
  };

  const handleATSStageChange = async (atsStage) => {
    try {
      setUpdating(true);
      await hrmService.updateApplicantStatus(id, { atsStage });
      setApplicant(prev => ({ ...prev, atsStage }));
      alert('ATS stage updated successfully');
    } catch (error) {
      alert('Failed to update ATS stage');
      fetchApplicant();
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setUpdating(true);
      await hrmService.updateApplicantNotes(id, notes);
      setShowNotesModal(false);
      setApplicant(prev => ({ ...prev, ...notes }));
      alert('Notes saved successfully');
    } catch (error) {
      alert('Failed to save notes');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveEvaluation = async () => {
    try {
      setUpdating(true);
      await hrmService.updateApplicantEvaluation(id, { evaluation });
      setShowEvaluationModal(false);
      setApplicant(prev => ({ ...prev, evaluation }));
      alert('Evaluation saved successfully');
    } catch (error) {
      alert('Failed to save evaluation');
    } finally {
      setUpdating(false);
    }
  };

  const handleUploadDocument = async () => {
    try {
      setUpdating(true);
      await hrmService.uploadApplicantDocument(id, documentForm);
      setShowDocumentModal(false);
      setDocumentForm({ name: '', type: '', url: '' });
      fetchApplicant(); // easier to refetch for docs array
      alert('Document uploaded successfully');
    } catch (error) {
      alert('Failed to upload document');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Loader />;
  if (!applicant) return <div>Applicant not found</div>;

  return (
    <div className="applicant-details-page fade-in" style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', paddingBottom: '48px' }}>

      {/* 1. Rich Header */}
      <div className="compact-page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="compact-title" style={{ fontSize: '24px' }}>
            {applicant.applicantName}
            {applicant.applicantType === 'internal' && (
              <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>INTERNAL</span>
            )}
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 8px 0', fontSize: '14px' }}>
            Applied for <strong style={{ color: '#334155' }}>{applicant.jobPosting?.title || 'Unknown Role'}</strong> • {formatDate(applicant.createdAt)}
          </p>
          {applicant.jobPosting && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiBriefcase size={14} /> {applicant.jobPosting.department}</span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiMapPin size={14} /> {applicant.jobPosting.location || 'Remote'}</span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiClock size={14} /> {applicant.jobPosting.type}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => navigate(`/hrm/recruitment/applicants/${id}/schedule-interview`)}>
            <FiCalendar /> Schedule Interview
          </button>
          <button className="btn btn-secondary" onClick={() => window.location.href = `mailto:${applicant.email}`}>
            <FiMail /> Email
          </button>
          <button className="btn btn-secondary" onClick={() => window.location.href = `tel:${applicant.phone}`}>
            <FiPhone /> Call
          </button>
          {applicant.applicantProfile?.linkedin && (
            <button className="btn btn-secondary" onClick={() => window.open(applicant.applicantProfile.linkedin, '_blank')}>
              <FiLinkedin /> LinkedIn
            </button>
          )}
        </div>
      </div>

      <div className="applicant-details-grid">

        {/* 2. Left Sidebar (30%) */}
        <div className="details-sidebar">

          {/* Status Card */}
          <div className="sidebar-card">
            <div className="sidebar-card-title">ATS Status</div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Current Stage</label>
              <select
                className="form-select"
                value={applicant.atsStage || 'applied'}
                onChange={(e) => handleATSStageChange(e.target.value)}
                style={{ width: '100%', marginBottom: '12px' }}
              >
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="interview">Interview</option>
                <option value="technical_round">Technical Round</option>
                <option value="hr_round">HR Round</option>
                <option value="offer">Offer</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className={`status-badge status-${applicant.status}`} style={{ flex: 1, textAlign: 'center' }}>
                {applicant.status.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Contact Info Card */}
          <div className="sidebar-card">
            <div className="sidebar-card-title">Contact Details</div>
            <div className="info-list">
              <div className="info-list-item">
                <FiMail className="info-icon" /> <span>{applicant.email}</span>
              </div>
              <div className="info-list-item">
                <FiPhone className="info-icon" /> <span>{applicant.phone}</span>
              </div>
              {applicant.applicantProfile?.currentCompany && (
                <div className="info-list-item">
                  <FiUser className="info-icon" /> <span>{applicant.applicantProfile.currentCompany}</span>
                </div>
              )}
              {applicant.applicantProfile?.yearsOfExperience && (
                <div className="info-list-item">
                  <FiClock className="info-icon" /> <span>{applicant.applicantProfile.yearsOfExperience} years exp</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="sidebar-card">
            <div className="sidebar-card-title">Quick Actions</div>
            <button className="sidebar-action-btn" onClick={() => navigate(`/hrm/recruitment/applicants/${id}/schedule-interview`)}>
              <FiCalendar /> Schedule Interview
            </button>
            <button className="sidebar-action-btn" onClick={() => setShowNotesModal(true)}>
              <FiEdit2 /> Add Note
            </button>
            <button className="sidebar-action-btn" onClick={() => setShowEvaluationModal(true)}>
              <FiStar /> Log Evaluation
            </button>
          </div>
        </div>

        {/* 3. Main Content (70%) */}
        <div className="details-main">
          <div className="details-tabs">
            {['overview', 'interviews', 'evaluation', 'notes', 'offers'].map(tab => (
              <button
                key={tab}
                className={`details-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="details-content">

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="fade-in">
                <h3 className="section-title" style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Candidate Overview</h3>

                {applicant.coverLetter && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Cover Letter</h4>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#334155', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                      {applicant.coverLetter}
                    </p>
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Documents</h4>
                    <button className="btn btn-sm btn-secondary" onClick={() => setShowDocumentModal(true)}>
                      <FiUpload /> Upload
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                    {applicant.resume?.url && (
                      <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '6px' }}>
                          <FiFileText size={20} color="#2563eb" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>Resume</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>PDF Document</div>
                        </div>
                        <a href={applicant.resume.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                          <FiDownload />
                        </a>
                      </div>
                    )}
                    {applicant.documents?.map((doc, idx) => (
                      <div key={idx} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                          <FiFileText size={20} color="#64748b" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>{doc.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{doc.type}</div>
                        </div>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                          <FiDownload />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* INTERVIEWS TAB */}
            {activeTab === 'interviews' && (
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h3 className="section-title" style={{ fontSize: '18px', fontWeight: '700' }}>Interview Timeline</h3>
                  <button className="btn btn-primary" onClick={() => navigate(`/hrm/recruitment/applicants/${id}/schedule-interview`)}>
                    <FiCalendar /> Schedule New
                  </button>
                </div>

                {applicant.interviewHistory?.length > 0 ? (
                  <div style={{ paddingLeft: '8px' }}>
                    {applicant.interviewHistory.map((interview, idx) => (
                      <div key={idx} className="timeline-item">
                        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <strong style={{ color: '#0f172a' }}>{interview.type}</strong>
                            <span className={`status-badge`}>{interview.status}</span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '16px' }}>
                            <span><FiCalendar style={{ marginRight: '6px' }} /> {interview.date ? formatDate(interview.date) : 'Not Scheduled'}</span>
                            {interview.rating && <span>Rating: <strong>{interview.rating}/5</strong></span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <FiCalendar size={40} style={{ opacity: 0.5, marginBottom: '16px' }} />
                    <p>No interviews scheduled yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* EVALUATION TAB */}
            {activeTab === 'evaluation' && (
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h3 className="section-title" style={{ fontSize: '18px', fontWeight: '700' }}>Candidate Evaluation</h3>
                  <button className="btn btn-primary" onClick={() => setShowEvaluationModal(true)}>
                    <FiEdit2 /> Edit Evaluation
                  </button>
                </div>

                {applicant.evaluation ? (
                  <div>
                    <div className="scorecard-grid">
                      <div className="score-box">
                        <div className="score-value">{applicant.evaluation.rating || '-'}/5</div>
                        <div className="score-label">Overall Rating</div>
                      </div>
                      <div className="score-box">
                        <div className="score-value">{applicant.evaluation.fitScore || '-'}/10</div>
                        <div className="score-label">Fit Score</div>
                      </div>
                      <div className="score-box" style={{ background: applicant.evaluation.recommendation === 'strong_yes' ? '#eff6ff' : '#f8fafc' }}>
                        <div className="score-value" style={{ fontSize: '18px', textTransform: 'uppercase' }}>
                          {applicant.evaluation.recommendation?.replace('_', ' ') || 'N/A'}
                        </div>
                        <div className="score-label">Recommendation</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <h4 style={{ color: '#166534', marginTop: 0 }}>Strengths</h4>
                        <p style={{ color: '#14532d', fontSize: '14px', lineHeight: '1.6' }}>{applicant.evaluation.strengths || 'No strengths listed'}</p>
                      </div>
                      <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                        <h4 style={{ color: '#991b1b', marginTop: 0 }}>Weaknesses</h4>
                        <p style={{ color: '#7f1d1d', fontSize: '14px', lineHeight: '1.6' }}>{applicant.evaluation.weaknesses || 'No weaknesses listed'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <FiStar size={40} style={{ opacity: 0.5, marginBottom: '16px' }} />
                    <p>No evaluation recorded yet.</p>
                    <button className="btn btn-outline-primary" style={{ marginTop: '16px' }} onClick={() => setShowEvaluationModal(true)}>
                      Start Evaluation
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === 'notes' && (
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h3 className="section-title" style={{ fontSize: '18px', fontWeight: '700' }}>Team Notes</h3>
                  <button className="btn btn-primary" onClick={() => setShowNotesModal(true)}>
                    <FiMessageSquare /> Add Note
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="note-card" style={{ background: '#fffbeb', padding: '20px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                    <h4 style={{ color: '#b45309', margin: '0 0 12px 0', fontSize: '14px', textTransform: 'uppercase' }}>Internal Notes</h4>
                    <p style={{ color: '#78350f', fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{applicant.internalNotes || 'No internal notes added.'}</p>
                  </div>

                  <div className="note-card" style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ color: '#475569', margin: '0 0 12px 0', fontSize: '14px', textTransform: 'uppercase' }}>General Notes</h4>
                    <p style={{ color: '#334155', fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{applicant.notes || 'No general notes added.'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* OFFERS TAB */}
            {activeTab === 'offers' && (
              <div className="fade-in">
                <OfferManagement applicationId={id} />
              </div>
            )}

          </div>
        </div>

      </div>

      {/* MODALS - Kept logic same, updated styling slightly by class inheritance */}
      {/* Notes Modal */}
      {showNotesModal && (
        <div className="modal-overlay" onClick={() => setShowNotesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '24px' }}>Edit Notes</h2>
            <div className="form-group">
              <label>Internal Notes (Private)</label>
              <textarea
                value={notes.internalNotes}
                onChange={(e) => setNotes({ ...notes, internalNotes: e.target.value })}
                rows={4}
                placeholder="Only visible to hiring team..."
              />
            </div>
            <div className="form-group">
              <label>General Notes</label>
              <textarea
                value={notes.notes}
                onChange={(e) => setNotes({ ...notes, notes: e.target.value })}
                rows={4}
                placeholder="General comments..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowNotesModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveNotes} disabled={updating}>
                {updating ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      {showEvaluationModal && (
        <div className="modal-overlay" onClick={() => setShowEvaluationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '24px' }}>Evaluation Scorecard</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Rating (1-5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={evaluation.rating}
                  onChange={(e) => setEvaluation({ ...evaluation, rating: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Fit Score (1-10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={evaluation.fitScore}
                  onChange={(e) => setEvaluation({ ...evaluation, fitScore: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Recommendation</label>
              <select
                value={evaluation.recommendation}
                onChange={(e) => setEvaluation({ ...evaluation, recommendation: e.target.value })}
              >
                <option value="strong_yes">Strong Yes</option>
                <option value="yes">Yes</option>
                <option value="maybe">Maybe</option>
                <option value="no">No</option>
                <option value="strong_no">Strong No</option>
              </select>
            </div>
            <div className="form-group">
              <label>Key Strengths</label>
              <textarea
                value={evaluation.strengths}
                onChange={(e) => setEvaluation({ ...evaluation, strengths: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Weaknesses / Concerns</label>
              <textarea
                value={evaluation.weaknesses}
                onChange={(e) => setEvaluation({ ...evaluation, weaknesses: e.target.value })}
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowEvaluationModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEvaluation} disabled={updating}>
                {updating ? 'Saving...' : 'Save Evaluation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentModal && (
        <div className="modal-overlay" onClick={() => setShowDocumentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Upload Document</h2>
            <div className="form-group">
              <label>Document Name</label>
              <input
                type="text"
                value={documentForm.name}
                onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
                placeholder="e.g., Portfolio, Certificate"
              />
            </div>
            <div className="form-group">
              <label>Document Type</label>
              <input
                type="text"
                value={documentForm.type}
                onChange={(e) => setDocumentForm({ ...documentForm, type: e.target.value })}
                placeholder="e.g., PDF, Image"
              />
            </div>
            <div className="form-group">
              <label>Document URL</label>
              <input
                type="url"
                value={documentForm.url}
                onChange={(e) => setDocumentForm({ ...documentForm, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDocumentModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUploadDocument} disabled={updating}>
                {updating ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ApplicantDetails;
