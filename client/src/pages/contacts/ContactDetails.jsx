import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiEdit, FiPhone, FiMail, FiFileText, FiCheckSquare, FiMessageSquare, FiUser, FiBriefcase, FiMapPin } from 'react-icons/fi';
import { contactService } from '../../services/contactService';
import Loader from '../../components/common/Loader';
import ActivityTimeline from '../../components/activities/ActivityTimeline';
import '../../styles/contacts/contact-details.css';

const ContactDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contact, setContact] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContact();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchContact = async () => {
        try {
            setLoading(true);
            const res = await contactService.getContact(id);
            if (res.data.success) {
                setContact(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching contact:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;

    if (!contact) {
        return <div className="p-6">Contact not found</div>;
    }

    return (
        <div className="contact-details-page">
            {/* Top Bar */}
            <div className="contact-details-header">
                <div className="breadcrumb-nav">
                    <span className="breadcrumb-item" onClick={() => navigate('/contacts')}>
                        Contacts
                    </span>
                    <span className="breadcrumb-separator">/</span>
                    <span className="breadcrumb-item active">
                        {contact.firstName} {contact.lastName}
                    </span>
                </div>
                <button className="btn-edit" onClick={() => navigate(`/contacts/edit/${id}`)}>
                    <FiEdit size={16} />
                    <span>Edit</span>
                </button>
            </div>

            {/* Two Column Layout */}
            <div className="contact-details-layout">
                {/* Left Panel - Contact Profile */}
                <aside className="contact-profile-panel">
                    {/* Avatar & Name */}
                    <div className="profile-header">
                        <div className="profile-avatar">
                            {contact.firstName ? contact.firstName[0].toUpperCase() : ''}
                            {contact.lastName ? contact.lastName[0].toUpperCase() : ''}
                        </div>
                        <h2 className="profile-name">
                            {contact.firstName} {contact.lastName}
                        </h2>
                        <p className="profile-role">
                            {contact.designation || 'Contact'}
                            {contact.company && <span className="profile-company"> at {contact.company}</span>}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button className="action-btn" title="Call">
                            <FiPhone size={14} />
                            <span>Call</span>
                        </button>
                        <button className="action-btn" title="Email">
                            <FiMail size={14} />
                            <span>Email</span>
                        </button>
                        <button className="action-btn" title="Log Activity">
                            <FiFileText size={14} />
                            <span>Log</span>
                        </button>
                        <button className="action-btn" title="Create Task">
                            <FiCheckSquare size={14} />
                            <span>Task</span>
                        </button>
                        <button className="action-btn" title="Add Note">
                            <FiMessageSquare size={14} />
                            <span>Note</span>
                        </button>
                    </div>

                    {/* About This Contact */}
                    <div className="about-section">
                        <h3 className="section-title">About this contact</h3>

                        <div className="info-field">
                            <FiUser className="field-icon" size={16} />
                            <div className="field-content">
                                <label className="field-label">First Name</label>
                                <div className="field-value">{contact.firstName || '—'}</div>
                            </div>
                        </div>

                        <div className="info-field">
                            <FiUser className="field-icon" size={16} />
                            <div className="field-content">
                                <label className="field-label">Last Name</label>
                                <div className="field-value">{contact.lastName || '—'}</div>
                            </div>
                        </div>

                        <div className="info-field">
                            <FiMail className="field-icon" size={16} />
                            <div className="field-content">
                                <label className="field-label">Email</label>
                                <div className="field-value">{contact.email}</div>
                            </div>
                        </div>

                        <div className="info-field">
                            <FiPhone className="field-icon" size={16} />
                            <div className="field-content">
                                <label className="field-label">Phone</label>
                                <div className="field-value">{contact.phone || '—'}</div>
                            </div>
                        </div>

                        <div className="info-field">
                            <FiBriefcase className="field-icon" size={16} />
                            <div className="field-content">
                                <label className="field-label">Company</label>
                                <div className="field-value">{contact.company || '—'}</div>
                            </div>
                        </div>

                        <div className="info-field">
                            <FiMapPin className="field-icon" size={16} />
                            <div className="field-content">
                                <label className="field-label">Location</label>
                                <div className="field-value">
                                    {contact.address ? (
                                        `${contact.address.city || ''}, ${contact.address.country || ''}`
                                    ) : '—'}
                                </div>
                            </div>
                        </div>

                        <div className="info-field">
                            <FiUser className="field-icon" size={16} />
                            <div className="field-content">
                                <label className="field-label">Owner</label>
                                <div className="field-value">
                                    {contact.assignedTo?.user?.name || 'Unassigned'}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right Panel - Activity Timeline */}
                <main className="contact-activity-panel">
                    <h3 className="panel-title">Activity Timeline</h3>
                    <div className="activity-feed">
                        <ActivityTimeline entityType="Contact" entityId={id} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ContactDetails;
