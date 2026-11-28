import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiPhone, FiMail, FiMessageCircle, FiEdit, FiCheck, FiCalendar,
  FiDollarSign, FiBriefcase, FiGlobe, FiTarget,
  FiUser, FiMoreHorizontal, FiArrowLeft, FiCheckCircle, FiThermometer, FiActivity,
  FiUserCheck, FiBookOpen
} from 'react-icons/fi';
import { FaWhatsapp, FaFacebook, FaInstagram } from 'react-icons/fa';
import { salesService } from '../../services/salesService';
import StatusBadge from '../../components/Sales/StatusBadge';
import ConvertLeadModal from '../../components/Sales/ConvertLeadModal';
import ScheduleFollowUpModal from '../../components/Sales/ScheduleFollowUpModal';
import EmailComposeModal from '../../components/Sales/EmailComposeModal';
import ChatModal from '../../components/Sales/ChatModal';
import WhatsAppModal from '../../components/common/WhatsAppModal';
import LogCallModal from '../../components/Sales/LogCallModal';
import AiCallTriggerModal from '../../components/Sales/AiCallTriggerModal';
import AiCallHistoryPanel from '../../components/Sales/AiCallHistoryPanel';
import { FiCpu } from 'react-icons/fi';
import CompleteFollowUpModal from '../../components/Sales/CompleteFollowUpModal';
import LeadRemarkWorkspace, { LeadFollowUpStrip } from '../../components/Sales/LeadRemarkWorkspace';
import AiLeadCopilot from '../../components/Sales/AiLeadCopilot';
import ActivitySection from '../../components/activities/ActivitySection';
import EnrollStudentModal from '../../components/institute/EnrollStudentModal';
import Loader from '../../components/common/Loader';
import { formatCurrency, formatDate } from '../../utils/format';
import '../../styles/sales/lead-details.css';
import '../../styles/sales/followups.css';


const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showLogCallModal, setShowLogCallModal] = useState(false);
  const [showAiCallModal, setShowAiCallModal] = useState(false);
  const [aiCallRefreshKey, setAiCallRefreshKey] = useState(0);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState('activities');
  const [followUpHistory, setFollowUpHistory] = useState([]);
  const [followUpHistoryLoading, setFollowUpHistoryLoading] = useState(false);
  const [followUpHistoryError, setFollowUpHistoryError] = useState('');
  const [completeFollowUpModal, setCompleteFollowUpModal] = useState({ open: false, followup: null });

  const showSuccessToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    fetchLead();
    fetchFollowUpHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const res = await salesService.getLead(id);
      if (res.data.success) {
        setLead(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowUpHistory = async () => {
    try {
      setFollowUpHistoryLoading(true);
      setFollowUpHistoryError('');
      const response = await salesService.getFollowUps({ type: 'lead', relatedId: id, limit: 100 });
      const normalized = response.data;
      const history = Array.isArray(normalized.data) ? normalized.data : [];
      setFollowUpHistory(history.sort((left, right) => {
        const leftDate = new Date(left.completedAt || left.scheduledDate).getTime();
        const rightDate = new Date(right.completedAt || right.scheduledDate).getTime();
        return rightDate - leftDate;
      }));
    } catch (error) {
      console.error('Error fetching lead follow-up history:', error);
      setFollowUpHistoryError(error.response?.data?.message || 'Unable to load follow-up history.');
    } finally {
      setFollowUpHistoryLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await salesService.changeLeadStatus(id, status);
      setLead({ ...lead, status });
      setToastMessage(`Status updated to ${status}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch {
      alert('Failed to update status');
    }
  };

  const handleConvertLead = async (conversionData) => {
    try {
      const res = await salesService.convertLead(id, conversionData);
      if (res.data.success) {
        setToastMessage('Lead converted successfully!');
        setShowToast(true);
        setShowConvertModal(false);

        // Refresh lead data
        await fetchLead();

        // Optionally redirect to the created deal or contact
        setTimeout(() => {
          if (res.data.data.deal) {
            navigate(`/sales/deals/${res.data.data.deal._id}`);
          }
        }, 2000);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to convert lead');
    }
  };

  const handleInitiateCall = async () => {
    if (!lead.phone) {
      setToastMessage('⚠️ No phone number available for this lead');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(lead.phone)) {
      setToastMessage('⚠️ Invalid phone number format');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      setIsInitiatingCall(true);

      // Initiate call via backend API
      // In production, this would integrate with telephony service (Twilio, RingCentral, etc.)
      const response = await salesService.addCommunication(id, {
        type: 'call',
        direction: 'outbound',
        phoneNumber: lead.phone,
        status: 'initiated',
        timestamp: new Date(),
        notes: `Call initiated to ${lead.phone}`
      });

      if (response.data.success) {
        setToastMessage(`📞 Calling ${lead.name} at ${lead.phone}...`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);

        // Refresh lead data to show updated activity
        await fetchLead();
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      setToastMessage('❌ Failed to initiate call. Please try again.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsInitiatingCall(false);
    }
  };


  const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : '??';

  if (loading) return <div className="loading-container"><Loader /></div>;
  if (!lead) return <div className="error-state">Lead not found</div>;


  return (
    <div className="lead-details-page">
      {/* Toast Notification */}
      {showToast && (
        <div className="toast-success">
          <FiCheck /> {toastMessage}
        </div>
      )}

      {/* Convert Lead Modal */}
      {showConvertModal && (
        <ConvertLeadModal
          lead={lead}
          onClose={() => setShowConvertModal(false)}
          onConvert={handleConvertLead}
        />
      )}

      {/* WhatsApp Quick Chat Modal */}
      {showWhatsAppModal && (
        <WhatsAppModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          recipientName={lead.name}
          recipientPhone={lead.phone}
          defaultTemplateId={lead.followUpDate ? 'callback_confirmation' : 'general_followup'}
          contextVariables={{
            property: lead.requirements || 'Property',
            amount: lead.value ? String(lead.value) : '10,000',
            date: lead.followUpDate ? formatDate(lead.followUpDate) : undefined,
            time: lead.followUpTime || undefined,
          }}
          onSent={async ({ message }) => {
            try {
              const res = await salesService.addCommunication(id, {
                type: 'whatsapp',
                outcome: 'whatsapp_sent',
                notes: `WhatsApp sent: ${message}`,
              });
              if (res.data?.success) {
                setLead(res.data.data);
                showSuccessToast('WhatsApp message logged to remark trail!');
              }
            } catch (err) {
              console.warn('Failed to log WhatsApp to lead:', err);
            }
          }}
        />
      )}

      {/* Enroll Student Modal for Institute inquiries */}
      {showEnrollModal && (
        <EnrollStudentModal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          inquiry={lead}
          onSuccess={(data) => {
            setToastMessage(`Student ${data?.student?.name} enrolled successfully with ID ${data?.student?.studentId}!`);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 4000);
            fetchLead();
          }}
        />
      )}

      {/* COMPACT PROFESSIONAL HEADER - OPTIMIZED */}
      <header className="details-header-compact">
        {/* TOP ROW: Info & Meta */}
        <div className="header-top-row">
          <div className="header-left-section">
            <button
              className="back-nav-button"
              onClick={() => navigate('/sales/leads')}
              title="Back to Leads"
              aria-label="Back to leads list"
            >
              <FiArrowLeft />
            </button>
            <div className="header-avatar-md">
              {getInitials(lead.name)}
            </div>
            <div className="header-info">
              <div className="title-row">
                <h1 className="lead-name">{lead.name}</h1>
                <StatusBadge status={lead.status} type="lead" />
              </div>
              <div className="meta-row">
                <span className="meta-detail-text">{lead.company || 'No Company'}</span>
                <span className="meta-separator">•</span>
                <span className="meta-detail-text">{lead.source}</span>
                <span className="meta-separator">•</span>
                <span className="meta-detail-text text-muted">Created {formatDate(lead.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Actions */}
        <div className="header-actions-row">
          <div className="quick-actions">
            <button
              className="btn-icon-action"
              title={isInitiatingCall ? "Initiating call..." : (lead.phone ? `Call ${lead.phone}` : "No phone number available")}
              aria-label="Call lead"
              onClick={handleInitiateCall}
              disabled={!lead.phone || isInitiatingCall}
              style={{
                opacity: (lead.phone && !isInitiatingCall) ? 1 : 0.5,
                cursor: (lead.phone && !isInitiatingCall) ? 'pointer' : 'not-allowed',
                position: 'relative'
              }}
            >
              {isInitiatingCall ? (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  borderTopColor: '#10b981',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite'
                }} />
              ) : (
                <FiPhone size={16} />
              )}
            </button>
            <button
              className="btn-icon-action"
              title={lead.phone ? `Chat on WhatsApp (${lead.phone})` : "No phone number available"}
              aria-label="WhatsApp lead"
              onClick={() => setShowWhatsAppModal(true)}
              disabled={!lead.phone}
              style={{
                opacity: lead.phone ? 1 : 0.5,
                cursor: lead.phone ? 'pointer' : 'not-allowed',
                color: '#25d366',
              }}
            >
              <FaWhatsapp size={17} />
            </button>
            <button
              className="btn-icon-action"
              title={lead.email ? "Email lead" : "No email address available"}
              aria-label="Email lead"
              onClick={() => setShowEmailModal(true)}
              disabled={!lead.email}
              style={{ opacity: lead.email ? 1 : 0.5, cursor: lead.email ? 'pointer' : 'not-allowed' }}
            >
              <FiMail size={16} />
            </button>
            <button
              className="btn-icon-action"
              title="Open chat conversation"
              aria-label="Chat with lead"
              onClick={() => setShowChatModal(true)}
            >
              <FiMessageCircle size={16} />
            </button>
            <button className="btn-icon-action" title="More" aria-label="More actions"><FiMoreHorizontal size={16} /></button>
          </div>

          <div className="primary-actions">
            {/* Institute Inquiry Enrollment Actions */}
            {lead.isInstituteInquiry && !lead.convertedToStudent && lead.status !== 'lost' && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowEnrollModal(true)}
                title="Enroll as student and setup course & fee plan"
              >
                <FiUserCheck size={14} className="mr-1" /> Enroll Student
              </button>
            )}

            {lead.isInstituteInquiry && lead.convertedToStudent && (
              <button
                className="btn btn-success btn-sm"
                onClick={() => navigate(`/institute/students/${lead.convertedToStudent?._id || lead.convertedToStudent}`)}
                title="View Enrolled Student Profile"
              >
                <FiUserCheck size={14} className="mr-1" /> Enrolled Student {lead.convertedToStudent?.studentId ? `(${lead.convertedToStudent.studentId})` : ''}
              </button>
            )}

            {/* Standard Sales Lead Convert to Deal button */}
            {!lead.isInstituteInquiry && ((lead.status === 'qualified' || lead.leadTemperature === 'qualified' || lead.leadTemperature === 'hot' || (lead.qualificationScore && lead.qualificationScore >= 60)) && lead.status !== 'converted') && (
              <button
                className="btn btn-success btn-sm"
                onClick={() => setShowConvertModal(true)}
                title={lead.status === 'qualified' ? 'Convert this qualified lead' : `Convert (Score: ${lead.qualificationScore}/100)`}
                aria-label="Convert lead to deal"
              >
                <FiCheckCircle size={14} className="mr-1" /> Convert
              </button>
            )}
            {/* Show read-only badge if converted for sales leads */}
            {!lead.isInstituteInquiry && lead.status === 'converted' && (
              <span className="badge-converted" role="status" aria-label="Lead converted to deal">
                <FiCheckCircle size={12} /> Converted
              </span>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAiCallModal(true)}
              aria-label="Start AI voice call"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', border: 'none' }}
            >
              <FiCpu size={14} className="mr-1" /> AI Call
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowFollowUpModal(true)} aria-label="Schedule follow-up">
              <FiCalendar size={14} className="mr-1" /> Follow-up
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowLogCallModal(true)} aria-label="Log call interaction">
              <FiPhone size={14} className="mr-1" /> Log Call
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/sales/leads/${id}/edit`)} aria-label="Edit lead">
              <FiEdit size={14} className="mr-1" /> Edit
            </button>
          </div>
        </div>
      </header>


      {/* METRICS ROW */}
      <section className="metrics-row">
        <div className="metric-card">
          <div className="metric-icon-box blue">
            <FiDollarSign size={16} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Deal Value</span>
            <div className="metric-value">{formatCurrency(lead.value || 0, lead.currency)}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className={`metric-icon-box temperature-${lead.leadTemperature || 'cold'}`}>
            <FiThermometer size={16} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Lead Temperature</span>
            <div className="metric-value temperature-display">
              <span className={`temperature-badge temp-${lead.leadTemperature || 'cold'}`}>
                {lead.leadTemperature === 'cold' && '🧊 Cold'}
                {lead.leadTemperature === 'warm' && '🟡 Warm'}
                {lead.leadTemperature === 'hot' && '🔥 Hot'}
                {lead.leadTemperature === 'qualified' && '✅ Qualified'}
                {!lead.leadTemperature && '🧊 Cold'}
              </span>
            </div>
            <div className="temperature-description">
              {lead.leadTemperature === 'cold' && 'Just inquiring'}
              {lead.leadTemperature === 'warm' && 'Showing interest'}
              {lead.leadTemperature === 'hot' && 'Ready to buy'}
              {lead.leadTemperature === 'qualified' && 'Meets criteria'}
              {!lead.leadTemperature && 'Just inquiring'}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box orange">
            <FiActivity size={16} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Score</span>
            <div className="metric-value">{lead.qualificationScore || 0}/100</div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${lead.qualificationScore || 0}%`,
                  background: lead.qualificationScore > 60 ? 'var(--success)' : 'var(--warning)'
                }}
                role="progressbar"
                aria-valuenow={lead.qualificationScore || 0}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label={`Qualification score: ${lead.qualificationScore || 0} out of 100`}
              ></div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box green">
            <FiUser size={16} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Owner</span>
            <div className="metric-value">{lead.assignedTo?.user?.name || lead.assignedTo?.employeeId || 'Unassigned'}</div>
          </div>
        </div>
      </section>

      <LeadFollowUpStrip
        lead={lead}
        onLeadUpdated={(updated) => (updated ? setLead(updated) : fetchLead())}
        onShowToast={showSuccessToast}
      />

      {/* MAIN GRID */}
      <main className="details-grid">

        {/* LEFT COLUMN */}
        <div className="left-column">
          {/* AI Intelligence & Smart Follow-up Copilot */}
          <AiLeadCopilot lead={lead} />

          {/* Remark & Next Follow-up Workspace */}
          <LeadRemarkWorkspace
            lead={lead}
            onLeadUpdated={(updated) => (updated ? setLead(updated) : fetchLead())}
            onFollowUpChanged={fetchFollowUpHistory}
            onShowToast={showSuccessToast}
          />

          {/* Institute Inquiry Details Card */}
          {lead.isInstituteInquiry && (
            <div className="card details-card compact-card" style={{ borderLeft: '4px solid #4f46e5' }}>
              <div className="card-header-sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiBookOpen size={16} color="#4f46e5" /> Academic Course & Batch Details
                </h3>
                {lead.convertedToStudent && (
                  <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                    Enrolled ({lead.convertedToStudent?.studentId || 'Active'})
                  </span>
                )}
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Course Interested</span>
                    <strong style={{ color: '#0f172a' }}>{lead.course?.name || lead.courseInterested || '—'}</strong>
                    {lead.course?.code && <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>Code: {lead.course.code} (Base: ₹{lead.course.baseFee})</span>}
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Preferred Batch</span>
                    <strong style={{ color: '#0f172a' }}>{lead.batch?.name || lead.preferredBatch || '—'}</strong>
                    {lead.batch?.schedule && <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>{lead.batch.schedule}</span>}
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Education Level</span>
                    <strong style={{ color: '#0f172a' }}>{lead.educationLevel || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Scheduled Follow-up</span>
                    <strong style={{ color: lead.followUpDate && new Date(lead.followUpDate) < new Date() ? '#dc2626' : '#0f172a' }}>
                      {lead.followUpDate ? formatDate(lead.followUpDate) : 'Not scheduled'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="card details-card compact-card">
            <div className="card-header-sm">
              <h3>Contact Information</h3>
            </div>
            <div className="card-body">
              <div className="contact-list-horizontal">
                <a href={`mailto:${lead.email}`} className="contact-item-horizontal" aria-label={`Email ${lead.email}`}>
                  <div className="contact-icon-box blue">
                    <FiMail size={18} />
                  </div>
                  <div className="contact-info">
                    <span className="contact-label">Email</span>
                    <span className="contact-value">{lead.email}</span>
                  </div>
                </a>

                <div className="contact-item-horizontal">
                  <div className="contact-icon-box green">
                    <FiPhone size={18} />
                  </div>
                  <div className="contact-info">
                    <span className="contact-label">Phone</span>
                    <span className={`contact-value ${!lead.phone ? 'empty' : ''}`}>{lead.phone || 'Not added'}</span>
                  </div>
                </div>

                <div className="contact-item-horizontal">
                  <div className="contact-icon-box orange">
                    <FiBriefcase size={18} />
                  </div>
                  <div className="contact-info">
                    <span className="contact-label">Company</span>
                    <span className={`contact-value ${!lead.company ? 'empty' : ''}`}>{lead.company || 'Not added'}</span>
                  </div>
                </div>

                {lead.website ? (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className="contact-item-horizontal" aria-label={`Visit website ${lead.website}`}>
                    <div className="contact-icon-box purple">
                      <FiGlobe size={18} />
                    </div>
                    <div className="contact-info">
                      <span className="contact-label">Website</span>
                      <span className="contact-value">{lead.website}</span>
                    </div>
                  </a>
                ) : (
                  <div className="contact-item-horizontal">
                    <div className="contact-icon-box purple">
                      <FiGlobe size={18} />
                    </div>
                    <div className="contact-info">
                      <span className="contact-label">Website</span>
                      <span className="contact-value empty">Not added</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Timeline & Notes */}
          <div className="card details-card">
            <div className="card-header-sm card-header-with-tabs">
              <div className="header-tabs">
                <button
                  className={`header-tab-btn ${activeActivityTab === 'activities' ? 'active' : ''}`}
                  onClick={() => setActiveActivityTab('activities')}
                >
                  Activity Timeline
                </button>
                <button
                  className={`header-tab-btn ${activeActivityTab === 'notes' ? 'active' : ''}`}
                  onClick={() => setActiveActivityTab('notes')}
                >
                  Notes
                </button>
                <button
                  className={`header-tab-btn ${activeActivityTab === 'followups' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveActivityTab('followups');
                    fetchFollowUpHistory();
                  }}
                >
                  Follow-up History
                </button>
              </div>
            </div>
            <div className="card-body">
              {activeActivityTab === 'followups' ? (
                followUpHistoryLoading ? (
                  <p>Loading follow-up history...</p>
                ) : followUpHistoryError ? (
                  <p role="alert">{followUpHistoryError}</p>
                ) : followUpHistory.length === 0 ? (
                  <p>No follow-ups have been recorded for this lead yet.</p>
                ) : (
                  <div className="follow-up-history">
                    {followUpHistory.map((item) => {
                      const handlerName = item.assignedTo?.user?.name || item.assignedTo?.employeeId || 'Unassigned';
                      const isOpenTask = ['pending', 'overdue'].includes(item.status);
                      return (
                        <article key={item._id} className="follow-up-history-item">
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <strong>{item.title}</strong>
                              <span style={{ fontSize: '11.5px', padding: '2px 8px', borderRadius: '999px', background: '#eef2ff', color: '#4338ca', fontWeight: 600 }}>
                                {handlerName}
                              </span>
                            </div>
                            <p>
                              {formatDate(item.scheduledDate)}{item.scheduledTime ? ` at ${item.scheduledTime}` : ''} · {item.typeOfFollowUp || 'call'}
                            </p>
                            {(item.outcome || item.description) && (
                              <p style={{ color: '#334155', marginTop: '6px' }}>
                                {item.outcome || item.description}
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <span className={`status-badge status-${item.status}`}>{item.status}</span>
                            {isOpenTask && (
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={() => setCompleteFollowUpModal({ open: true, followup: item })}
                              >
                                <FiCheck size={12} /> Complete
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )
              ) : (
                <ActivitySection
                  relatedTo={{ entityType: 'Lead', entityId: id }}
                  activeTab={activeActivityTab}
                  leadNotes={lead?.notes || []}
                />
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="right-column">

          {/* Pipeline Stage - Compact */}
          <div className="card details-card">
            <div className="card-header-compact">
              <h3>Pipeline Stage</h3>
            </div>
            <div className="card-body-compact">
              <select
                className={`status-dropdown-compact status-${lead.status}`}
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Change lead status"
              >
                <option value="new">New Lead</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Won (Converted)</option>
                <option value="lost">Lost</option>
              </select>

              <div className="info-list-compact">
                <div className="info-item-compact">
                  <span className="info-label">Assigned</span>
                  <div className="info-value-with-avatar">
                    <div className="mini-avatar">{getInitials(lead.assignedTo?.user?.name)}</div>
                    <span>{lead.assignedTo?.user?.name || lead.assignedTo?.employeeId || 'Unassigned'}</span>
                  </div>
                </div>
                <div className="info-item-compact">
                  <span className="info-label">Source</span>
                  <span className="info-value badge-minimal">{lead.source}</span>
                </div>
                <div className="info-item-compact">
                  <span className="info-label">Campaign</span>
                  {lead.campaign ? (
                    <Link
                      to={`/marketing/campaigns/${lead.campaign._id}`}
                      className="info-value campaign-link"
                      title="View campaign details"
                    >
                      <FiTarget size={12} /> {lead.campaign.name}
                    </Link>
                  ) : (
                    <span className="info-value empty">None</span>
                  )}
                </div>
                <div className="info-item-compact">
                  <span className="info-label">Next Call</span>
                  <span className="info-value text-warning">
                    {lead.followUpDate
                      ? `${formatDate(lead.followUpDate)}${lead.followUpTime ? ` • ${lead.followUpTime}` : ''}`
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Meta Instant Forms / Ads Attribution Card */}
          {(lead.source === 'meta' || lead.metaAttribution || lead.metaLeadId) && (
            <div className="card details-card meta-attribution-card" style={{
              background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(8, 102, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #e0f2fe', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaFacebook size={18} color="#0866ff" />
                  <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#1e3a8a' }}>Meta Ads Attribution</h3>
                </div>
                <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                  {lead.metaAttribution?.platform || 'Facebook / IG'}
                </span>
              </div>
              <div className="info-list-compact" style={{ gap: '8px' }}>
                {lead.metaAttribution?.adName && (
                  <div className="info-item-compact">
                    <span className="info-label">Ad Name</span>
                    <span className="info-value" style={{ fontWeight: 600, color: '#0f172a' }}>{lead.metaAttribution.adName}</span>
                  </div>
                )}
                {lead.metaAttribution?.adsetName && (
                  <div className="info-item-compact">
                    <span className="info-label">AdSet</span>
                    <span className="info-value">{lead.metaAttribution.adsetName}</span>
                  </div>
                )}
                {lead.metaAttribution?.campaignId && (
                  <div className="info-item-compact">
                    <span className="info-label">Campaign ID</span>
                    <span className="info-value" style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>{lead.metaAttribution.campaignId}</span>
                  </div>
                )}
                {lead.metaAttribution?.formId && (
                  <div className="info-item-compact">
                    <span className="info-label">Lead Form ID</span>
                    <span className="info-value" style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>{lead.metaAttribution.formId}</span>
                  </div>
                )}
                {lead.metaLeadId && (
                  <div className="info-item-compact">
                    <span className="info-label">Meta Lead ID</span>
                    <span className="info-value" style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#64748b' }}>{lead.metaLeadId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* System Info - Compact */}
          <div className="card details-card">
            <div className="card-header-compact">
              <h3>System Info</h3>
            </div>
            <div className="card-body-compact">
              <div className="info-list-compact">
                <div className="info-item-compact">
                  <span className="info-label">Created</span>
                  <span className="info-value">{formatDate(lead.createdAt)}</span>
                </div>
                <div className="info-item-compact">
                  <span className="info-label">Updated</span>
                  <span className="info-value">{formatDate(lead.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>

      <AiCallHistoryPanel
        leadId={id}
        refreshKey={aiCallRefreshKey}
        onCallUpdated={async () => {
          await Promise.all([fetchLead(), fetchFollowUpHistory()]);
          showSuccessToast('AI call synced to Remark Trail & Follow-ups!');
        }}
      />

      {/* Schedule Follow-up Modal */}
      <ScheduleFollowUpModal
        isOpen={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        prefilledData={{ type: 'lead', relatedId: id }}
        onSuccess={async () => {
          setShowFollowUpModal(false);
          await Promise.all([fetchLead(), fetchFollowUpHistory()]);
          showSuccessToast('Follow-up scheduled successfully!');
        }}
      />

      {/* Complete Follow-up Modal */}
      <CompleteFollowUpModal
        isOpen={completeFollowUpModal.open}
        onClose={() => setCompleteFollowUpModal({ open: false, followup: null })}
        followup={completeFollowUpModal.followup}
        onSuccess={async () => {
          setCompleteFollowUpModal({ open: false, followup: null });
          await Promise.all([fetchLead(), fetchFollowUpHistory()]);
          showSuccessToast('Follow-up completed and remark logged!');
        }}
      />

      {/* Email Compose Modal */}
      <EmailComposeModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        lead={lead}
        onEmailQueued={fetchLead}
      />

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        lead={lead}
      />

      {/* Quick Log Call Interaction Modal */}
      <LogCallModal
        isOpen={showLogCallModal}
        onClose={() => setShowLogCallModal(false)}
        lead={lead}
        onCallLogged={async () => {
          await Promise.all([fetchLead(), fetchFollowUpHistory()]);
          showSuccessToast('Phone call logged & synced to remarks!');
        }}
      />

      {/* AI Voice Agent Calling Modal */}
      <AiCallTriggerModal
        isOpen={showAiCallModal}
        onClose={() => setShowAiCallModal(false)}
        lead={lead}
        onCallCompleted={async () => {
          setAiCallRefreshKey((k) => k + 1);
          await Promise.all([fetchLead(), fetchFollowUpHistory()]);
        }}
      />
    </div>
  );
};

export default LeadDetails;
