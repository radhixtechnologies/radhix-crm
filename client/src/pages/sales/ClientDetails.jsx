import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FiPhone, FiMail, FiEdit, FiCalendar, FiPlus,
    FiUser, FiBriefcase, FiGlobe, FiTrash2,
    FiArrowLeft, FiMoreHorizontal, FiDollarSign, FiClock, FiCheckCircle
} from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import ScheduleFollowUpModal from '../../components/Sales/ScheduleFollowUpModal';
import Loader from '../../components/common/Loader';
import { formatCurrency, formatDate } from '../../utils/format';
import '../../styles/sales/lead-details.css';

const ClientDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [addingNote, setAddingNote] = useState(false);

    useEffect(() => {
        fetchClient();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchClient = async () => {
        try {
            setLoading(true);
            const res = await salesService.getClient(id);
            if (res.data.success) {
                setClient(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching client:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!noteContent.trim()) return;
        try {
            setAddingNote(true);
            await salesService.addClientNote(id, noteContent);
            setNoteContent('');
            fetchClient(); // Refresh to show new note
        } catch {
            alert('Failed to add note');
        } finally {
            setAddingNote(false);
        }
    };

    const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : '??';

    if (loading) return <div className="loading-container"><Loader /></div>;
    if (!client) return <div className="error-state">Client not found</div>;

    return (
        <div className="lead-details-page">

            {/* HEADER SECTION */}
            <header className="details-header-compact">
                <div className="header-top-row">
                    <div className="header-left-section">
                        <button
                            className="back-nav-button"
                            onClick={() => navigate('/sales/clients')}
                            title="Back to Clients"
                        >
                            <FiArrowLeft />
                        </button>
                        <div className="header-avatar-md">
                            {getInitials(client.name)}
                        </div>
                        <div className="header-info">
                            <div className="title-row">
                                <h1 className="lead-name">{client.name}</h1>
                            </div>
                            <div className="meta-row">
                                <span className="meta-detail-text">{client.company || 'No Company'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="header-actions-row" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowFollowUpModal(true)}>
                            <FiCalendar size={14} className="mr-1" /> Schedule Follow-up
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/sales/clients/${id}/edit`)}>
                            <FiEdit size={14} className="mr-1" /> Edit
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN LAYOUT: 2 Columns */}
            <main className="details-grid">

                {/* LEFT COLUMN (~65%) */}
                <div className="left-column">

                    {/* CONTACT PERSONS */}
                    <div className="card details-card">
                        <div className="card-header-sm card-header-with-tabs">
                            <h3>Contact Persons</h3>
                            <button className="btn btn-primary btn-sm" title="Add Contact">
                                <FiPlus size={14} /> Add Contact
                            </button>
                        </div>
                        <div className="card-body">
                            {client.contacts && client.contacts.length > 0 ? (
                                <div className="info-list-compact">
                                    {client.contacts.map((contact, idx) => (
                                        <div key={idx} className="info-item-compact">
                                            <div className="info-item-left">
                                                <div className="mini-avatar">{getInitials(contact.name)}</div>
                                                <span className="contact-value" style={{ fontWeight: 600 }}>{contact.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                {contact.email && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <FiMail size={12} /> {contact.email}
                                                    </span>
                                                )}
                                                {contact.phone && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <FiPhone size={12} /> {contact.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                                    No contact persons added yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* NOTES SECTION */}
                    <div className="card details-card">
                        <div className="card-header-sm">
                            <h3>Notes</h3>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <textarea
                                    className="form-textarea"
                                    rows="3"
                                    placeholder="Add a note..."
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    style={{ width: '100%', resize: 'vertical', minHeight: '80px' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={handleAddNote}
                                        disabled={addingNote || !noteContent.trim()}
                                    >
                                        {addingNote ? 'Adding...' : 'Add Note'}
                                    </button>
                                </div>

                                <div className="notes-list" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {client.notes && client.notes.length > 0 ? (
                                        client.notes.map((note, idx) => (
                                            <div key={idx} style={{ background: 'var(--surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{note.content}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                                                    {formatDate(note.createdAt)} by {note.createdBy?.name || 'User'}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-state-notes" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>
                                            <p>No notes yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* LINKED DEALS */}
                    <div className="card details-card">
                        <div className="card-header-sm">
                            <h3>Linked Deals</h3>
                        </div>
                        <div className="card-body">
                            {client.deals && client.deals.length > 0 ? (
                                <div className="info-list-compact">
                                    {client.deals.map((deal) => (
                                        <div key={deal._id} className="info-item-compact clickable" onClick={() => navigate(`/sales/deals/${deal._id}`)}>
                                            <div className="info-item-left" style={{ flex: 1 }}>
                                                <span className="contact-value" style={{ fontWeight: 600 }}>{deal.name || deal.title}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    {formatCurrency(deal.value, deal.currency)}
                                                </span>
                                                <span
                                                    className="badge-minimal"
                                                    style={{
                                                        fontSize: '10px',
                                                        textTransform: 'uppercase',
                                                        background: deal.stage === 'closed-won' ? '#dcfce7' : '#f3f4f6',
                                                        color: deal.stage === 'closed-won' ? '#166534' : '#4b5563'
                                                    }}
                                                >
                                                    {deal.stage?.replace('-', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                                    No linked deals found.
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN (~35%) */}
                <div className="right-column">

                    {/* CONTACT INFORMATION */}
                    <div className="card details-card">
                        <div className="card-header-sm">
                            <h3>Contact Information</h3>
                        </div>
                        <div className="card-body">
                            <div className="info-list-compact">
                                <div className="info-item-compact">
                                    <div className="info-item-left">
                                        <FiMail className="info-icon" size={14} />
                                        <span className="contact-label">Email</span>
                                    </div>
                                    <span className="contact-value">{client.email || 'N/A'}</span>
                                </div>

                                <div className="info-item-compact">
                                    <div className="info-item-left">
                                        <FiPhone className="info-icon" size={14} />
                                        <span className="contact-label">Phone</span>
                                    </div>
                                    <span className="contact-value">{client.phone || 'N/A'}</span>
                                </div>

                                <div className="info-item-compact">
                                    <div className="info-item-left">
                                        <FiBriefcase className="info-icon" size={14} />
                                        <span className="contact-label">Company</span>
                                    </div>
                                    <span className="contact-value">{client.company || 'N/A'}</span>
                                </div>

                                <div className="info-item-compact">
                                    <div className="info-item-left">
                                        <FiGlobe className="info-icon" size={14} />
                                        <span className="contact-label">Industry</span>
                                    </div>
                                    <span className="contact-value">{client.industry || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CLIENT DETAILS */}
                    <div className="card details-card">
                        <div className="card-header-sm">
                            <h3>Client Details</h3>
                        </div>
                        <div className="card-body">
                            <div className="info-list-compact">
                                <div className="info-item-compact">
                                    <span className="info-label">Status</span>
                                    <span
                                        className="badge-minimal"
                                        style={{
                                            color: client.status === 'active' ? 'var(--success)' : 'var(--text-secondary)',
                                            borderColor: client.status === 'active' ? 'var(--success)' : 'var(--border)'
                                        }}
                                    >
                                        {client.status || 'Active'}
                                    </span>
                                </div>

                                <div className="info-item-compact">
                                    <span className="info-label">Total Revenue</span>
                                    <span className="info-value" style={{ fontWeight: 700 }}>{formatCurrency(client.totalRevenue || 0)}</span>
                                </div>

                                <div className="info-item-compact">
                                    <span className="info-label">Assigned To</span>
                                    <div className="info-value-with-avatar">
                                        <div className="mini-avatar">{getInitials(client.assignedTo?.name || 'Unassigned')}</div>
                                        <span>{client.assignedTo?.name || 'Unassigned'}</span>
                                    </div>
                                </div>

                                <div className="info-item-compact">
                                    <span className="info-label">Created</span>
                                    <span className="info-value">{formatDate(client.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </main>

            {/* Schedule Follow-up Modal */}
            <ScheduleFollowUpModal
                isOpen={showFollowUpModal}
                onClose={() => setShowFollowUpModal(false)}
                prefilledData={{ type: 'client', relatedId: id }}
                onSuccess={() => {
                    setShowFollowUpModal(false);
                    alert('Follow-up scheduled successfully!');
                }}
            />
        </div>
    );
};

export default ClientDetails;
