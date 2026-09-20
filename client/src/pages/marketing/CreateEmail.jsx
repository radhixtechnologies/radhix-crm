import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiSave, FiSend, FiArrowLeft, FiUser, FiMail, FiTarget, FiLayers, FiUsers, FiUpload } from 'react-icons/fi';
import { marketingService } from '../../services/marketingService';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import '../../styles/marketing/create-email.css';

const CreateEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const [segments, setSegments] = useState([]);

    // Get prefilled data from navigation state
    const prefilledData = location.state?.prefilled || {};

    // Default form data
    const [formData, setFormData] = useState({
        subject: prefilledData.subject || '',
        fromName: prefilledData.fromName || user?.name || 'Sales Team',
        fromEmail: user?.email || 'sales@radhix.com',
        body: prefilledData.body || '',
        campaign: '',
        recipientType: prefilledData.recipientType || 'all',
        segment: '',
        status: 'draft',
        customEmailsStr: prefilledData.customEmailsStr || ''
    });

    useEffect(() => {
        fetchDependencies();
    }, []);

    const fetchDependencies = async () => {
        try {
            setLoading(true);
            const [campaignsRes, segmentsRes] = await Promise.all([
                marketingService.getCampaigns({ status: 'active' }),
                marketingService.getSegments({ isActive: true })
            ]);

            if (campaignsRes.data.success) {
                setCampaigns(campaignsRes.data.data.campaigns || []);
            }
            if (segmentsRes.data?.success) {
                setSegments(segmentsRes.data.data.segments || []);
            }
        } catch (error) {
            console.error('Error fetching dependencies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            // Extract emails using regex
            const emails = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g);

            if (emails && emails.length > 0) {
                const uniqueEmails = [...new Set(emails)];
                setFormData(prev => ({
                    ...prev,
                    customEmailsStr: (prev.customEmailsStr ? prev.customEmailsStr + ',\n' : '') + uniqueEmails.join(',\n')
                }));
                alert(`Successfully imported ${uniqueEmails.length} emails from file.`);
            } else {
                alert('No valid email addresses found in the file.');
            }
        };
        reader.readAsText(file);
    };

    const handleSubmit = async (action) => {
        if (!formData.subject || !formData.body) {
            alert('Subject and Content are required');
            return;
        }

        try {
            setLoading(true);
            const dataToSubmit = {
                ...formData,
                status: action === 'send' ? 'sending' : 'draft',
                segments: formData.recipientType === 'segment' && formData.segment ? [formData.segment] : [],
                customEmails: formData.recipientType === 'manual' && formData.customEmailsStr
                    ? formData.customEmailsStr.split(/[,\n]/).map(e => e.trim()).filter(e => e)
                    : []
            };

            if (!dataToSubmit.campaign) delete dataToSubmit.campaign;

            const res = await marketingService.createEmail(dataToSubmit);

            if (res.data.success) {
                const emailId = res.data.data._id;

                if (action === 'send') {
                    // Trigger the send endpoint
                    await marketingService.sendEmail(emailId);
                    alert('Email campaign created and sending started!');
                } else {
                    alert('Email draft saved successfully');
                }

                navigate('/marketing/emails');
            }
        } catch (error) {
            console.error('Error creating email:', error);
            alert(error.response?.data?.error?.message || 'Failed to create email');
        } finally {
            setLoading(false);
        }
    };

    if (loading && campaigns.length === 0) return <Loader />;

    return (
        <div className="create-email-page">
            {/* Header */}
            <div className="email-page-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/marketing/emails')}>
                        <FiArrowLeft /> Back
                    </button>
                    <h1 className="page-title">New Email Campaign</h1>
                </div>
                <div className="action-buttons">
                    <button
                        className="btn-secondary"
                        onClick={() => handleSubmit('draft')}
                        disabled={loading}
                    >
                        <FiSave /> Save Draft
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => handleSubmit('send')}
                        disabled={loading}
                    >
                        <FiSend /> Send Campaign
                    </button>
                </div>
            </div>

            <div className="layout-grid">
                {/* Left Column: Form Inputs */}
                <div className="left-col">
                    {/* Section 1: Campaign Links */}
                    <div className="form-card">
                        <div className="card-header">
                            <div className="card-icon"><FiTarget /></div>
                            <h2 className="card-title">Campaign & Audience</h2>
                        </div>

                        <div className="row-2">
                            <div className="form-group">
                                <label className="label">Associate Campaign</label>
                                <div className="input-wrapper">
                                    <FiTarget className="input-icon" />
                                    <select
                                        name="campaign"
                                        value={formData.campaign}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="">Select Campaign</option>
                                        {campaigns.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="label">Recipients Group</label>
                                <div className="input-wrapper">
                                    <FiUsers className="input-icon" />
                                    <select
                                        name="recipientType"
                                        value={formData.recipientType}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="all">All Targets (Leads & Contacts)</option>
                                        <option value="leads">All Leads Only</option>
                                        <option value="contacts">All Client Contacts</option>
                                        <option value="segment">Specific Segment</option>
                                        <option value="manual">Manual Entry (Custom Emails)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {formData.recipientType === 'segment' && (
                            <div className="form-group slide-down">
                                <label className="label">Select Segment</label>
                                <div className="input-wrapper">
                                    <FiLayers className="input-icon" />
                                    <select
                                        name="segment"
                                        value={formData.segment}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="">Choose a segment...</option>
                                        {segments.map(s => (
                                            <option key={s._id} value={s._id}>{s.name} ({s.contactCount || 0} contacts)</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {formData.recipientType === 'manual' && (
                            <div className="form-group slide-down">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label className="label" style={{ marginBottom: 0 }}>Custom Recipients</label>
                                    <label className="btn-text" style={{ cursor: 'pointer', fontSize: '12px', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                                        <FiUpload /> Import from CSV/Text
                                        <input type="file" accept=".csv,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
                                    </label>
                                </div>
                                <div className="input-wrapper">
                                    <FiUsers className="input-icon" />
                                    <textarea
                                        name="customEmailsStr"
                                        value={formData.customEmailsStr || ''}
                                        onChange={handleChange}
                                        className="form-input"
                                        style={{ height: '100px', paddingTop: '10px', lineHeight: '1.5' }}
                                        placeholder="Enter email addresses or upload a file..."
                                    />
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                                    Supported formats: CSV, Text file. Emails will be automatically extracted.
                                </div>
                            </div>
                        )}

                        <div className="row-2">
                            <div className="form-group">
                                <label className="label">From Name</label>
                                <div className="input-wrapper">
                                    <FiUser className="input-icon" />
                                    <input
                                        type="text"
                                        name="fromName"
                                        value={formData.fromName}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="label">From Email</label>
                                <div className="input-wrapper">
                                    <FiMail className="input-icon" />
                                    <input
                                        type="email"
                                        name="fromEmail"
                                        value={formData.fromEmail}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Content */}
                    <div className="form-card">
                        <div className="card-header">
                            <div className="card-icon"><FiMail /></div>
                            <h2 className="card-title">Email Content</h2>
                        </div>

                        <div className="form-group">
                            <label className="label">Subject Line</label>
                            <div className="input-wrapper">
                                <FiMail className="input-icon" />
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    placeholder="Enter a compelling subject..."
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Email Body (HTML Supported)</label>
                            <textarea
                                name="body"
                                value={formData.body}
                                onChange={handleChange}
                                placeholder="Write your email content here..."
                                className="form-textarea"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Right Column: Live Preview */}
                <div className="right-col sticky-actions">
                    <div className="form-card preview-container" style={{ padding: 0, overflow: 'hidden', border: 'none', background: 'transparent', boxShadow: 'none' }}>
                        <div className="mock-window">
                            <div className="mock-header">
                                <div className="window-dots">
                                    <div className="dot red"></div>
                                    <div className="dot yellow"></div>
                                    <div className="dot green"></div>
                                </div>
                                <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>Live Preview</div>
                            </div>
                            <div className="mock-content">
                                <div className="preview-field">
                                    <div className="preview-label">From</div>
                                    <div className="preview-value">{formData.fromName} &lt;{formData.fromEmail}&gt;</div>
                                </div>
                                <div className="preview-field">
                                    <div className="preview-label">To</div>
                                    <div className="preview-value">
                                        {formData.recipientType === 'all' ? 'Everyone in Database' :
                                            formData.recipientType === 'segment' ? 'Segment Members' :
                                                formData.recipientType === 'leads' ? 'All Leads' :
                                                    formData.recipientType === 'manual' ? 'Custom List' : 'All Contacts'}
                                    </div>
                                </div>
                                <div className="preview-field">
                                    <div className="preview-label">Subject</div>
                                    <div className="preview-value" style={{ color: formData.subject ? '#111827' : '#d1d5db' }}>
                                        {formData.subject || '(No Subject)'}
                                    </div>
                                </div>
                                <div className="preview-body-content">
                                    {formData.body ? (
                                        <div dangerouslySetInnerHTML={{ __html: formData.body.replace(/\n/g, '<br/>') }} />
                                    ) : (
                                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Start typing your email content to see how it looks...</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-card" style={{ marginTop: '24px' }}>
                        <div className="card-header" style={{ marginBottom: '12px', paddingBottom: '12px' }}>
                            <h2 className="card-title" style={{ fontSize: '14px' }}>Campaign Summary</h2>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Status</span>
                            <span className="summary-value badge-draft">Draft</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Total Recipients</span>
                            <span className="summary-value">
                                {formData.recipientType === 'all' ? 'All' :
                                    formData.recipientType === 'manual' ? (formData.customEmailsStr ? formData.customEmailsStr.split(/[,\n]/).filter(e => e.trim()).length : 0) :
                                        'Calculating...'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateEmail;
