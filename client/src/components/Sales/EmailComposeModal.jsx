import { useState } from 'react';
import { FiMail, FiX, FiPaperclip, FiSend } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import '../../styles/sales/email-compose-modal.css';

const EmailComposeModal = ({ isOpen, onClose, lead }) => {
    const navigate = useNavigate();
    const [emailData, setEmailData] = useState({
        to: lead?.email || '',
        subject: '',
        body: '',
        cc: '',
        bcc: ''
    });
    const [showAdvanced, setShowAdvanced] = useState(false);

    if (!isOpen) return null;

    const handleSendEmail = () => {
        if (!lead.email) {
            alert('No email address available for this lead');
            return;
        }

        // Navigate to the email creation page with pre-filled data
        navigate('/marketing/emails/create', {
            state: {
                prefilled: {
                    recipientType: 'manual',
                    customEmailsStr: lead.email,
                    subject: emailData.subject,
                    body: emailData.body,
                    fromName: 'Sales Team',
                    relatedLead: lead._id,
                    relatedLeadName: lead.name
                }
            }
        });

        onClose();
    };

    const handleQuickSend = () => {
        if (!emailData.subject.trim() || !emailData.body.trim()) {
            alert('Please fill in subject and message');
            return;
        }

        // For now, redirect to email module
        // In production, you could implement a quick-send API endpoint
        handleSendEmail();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content email-compose-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-left">
                        <div className="modal-icon-box email">
                            <FiMail size={20} />
                        </div>
                        <div>
                            <h2 className="modal-title">Compose Email</h2>
                            <p className="modal-subtitle">Send email to {lead.name}</p>
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="email-form">
                        <div className="form-group">
                            <label>To</label>
                            <input
                                type="email"
                                className="form-input"
                                value={emailData.to}
                                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                                placeholder="recipient@example.com"
                                disabled={!!lead.email}
                            />
                            {!lead.email && (
                                <p className="field-warning">⚠️ No email address available for this lead</p>
                            )}
                        </div>

                        {showAdvanced && (
                            <>
                                <div className="form-group">
                                    <label>CC</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={emailData.cc}
                                        onChange={(e) => setEmailData({ ...emailData, cc: e.target.value })}
                                        placeholder="cc@example.com"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>BCC</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={emailData.bcc}
                                        onChange={(e) => setEmailData({ ...emailData, bcc: e.target.value })}
                                        placeholder="bcc@example.com"
                                    />
                                </div>
                            </>
                        )}

                        <button
                            className="btn-text-link"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            {showAdvanced ? 'Hide' : 'Show'} CC/BCC
                        </button>

                        <div className="form-group">
                            <label>Subject *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={emailData.subject}
                                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                                placeholder="Enter email subject"
                            />
                        </div>

                        <div className="form-group">
                            <label>Message *</label>
                            <textarea
                                className="form-textarea"
                                rows="8"
                                value={emailData.body}
                                onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                                placeholder={`Hi ${lead.name},\n\nThank you for your interest in our services...`}
                            />
                        </div>

                        <div className="email-actions-bar">
                            <button className="btn-icon-text" disabled>
                                <FiPaperclip size={16} />
                                Attach File
                            </button>
                            <span className="text-muted">Templates coming soon</span>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleQuickSend}
                        disabled={!lead.email || !emailData.subject.trim() || !emailData.body.trim()}
                    >
                        <FiSend size={16} />
                        Send Email
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailComposeModal;
