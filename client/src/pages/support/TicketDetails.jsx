import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supportService } from '../../services/supportService';
import Loader from '../../components/common/Loader';
import { FiUser, FiClock, FiSend, FiPaperclip, FiArrowLeft } from 'react-icons/fi';
import { formatDate } from '../../utils/format';
import './TicketDetails.css';

const TicketDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [isInternal, setIsInternal] = useState(false);

    useEffect(() => {
        fetchTicket();
    }, [id]);

    const fetchTicket = async () => {
        try {
            setLoading(true);
            const res = await supportService.getTicket(id);
            if (res.data.success) {
                setTicket(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching ticket:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        try {
            setSending(true);
            const res = await supportService.addMessage(id, {
                content: replyText,
                isInternal
            });
            if (res.data.success) {
                setReplyText('');
                fetchTicket();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await supportService.updateTicket(id, { status: newStatus });
            fetchTicket();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    if (loading) return <Loader />;
    if (!ticket) return <div>Ticket not found</div>;

    return (
        <div className="ticket-details-page fade-in">
            {/* COMPACT HEADER */}
            <header className="details-header-compact">
                <div className="header-top-row">
                    <div className="header-left-section">
                        <button className="back-nav-button" onClick={() => navigate('/support')}>
                            <FiArrowLeft />
                        </button>
                        <div className="header-info">
                            <div className="title-row">
                                <h1 className="ticket-title-text">
                                    {ticket.subject}
                                    <span className="ticket-id-tag">#{ticket.ticketNumber}</span>
                                </h1>
                                <span className={`status-badge status-${ticket.status}`}>{ticket.status}</span>
                            </div>
                            <div className="meta-row">
                                <span className="flex items-center gap-1"><FiUser size={14} /> {ticket.contact?.firstName} {ticket.contact?.lastName}</span>
                                <span className="meta-separator">•</span>
                                <span className="flex items-center gap-1"><FiClock size={14} /> {formatDate(ticket.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* DETAILS GRID */}
            <main className="details-grid">
                {/* LEFT COLUMN - Main Content */}
                <div className="left-column">
                    <div className="details-card">
                        <div className="card-header-sm">
                            <h3>Description</h3>
                        </div>
                        <div className="card-body">
                            <p className="description-content">{ticket.description}</p>
                        </div>
                    </div>

                    <div className="details-card">
                        <div className="card-header-sm">
                            <h3>Conversation</h3>
                        </div>
                        <div className="card-body">
                            <div className="conversation-list">
                                {ticket.messages && ticket.messages.map((msg, index) => {
                                    const isCustomer = msg.sentBy?.name === (ticket.contact?.firstName + " " + ticket.contact?.lastName)
                                        || msg.sentBy?.name === ticket.contact?.firstName;

                                    let msgClass = 'msg-outbound';
                                    if (msg.isInternal) msgClass = 'msg-internal';
                                    else if (isCustomer) msgClass = 'msg-inbound';

                                    return (
                                        <div key={index} className={`message-wrapper ${msgClass}`}>
                                            <div className="message-avatar">
                                                {msg.sentBy?.name ? msg.sentBy.name[0] : 'U'}
                                            </div>
                                            <div className="message-content">
                                                <div className="message-meta">
                                                    <span className="sender-name">
                                                        {msg.sentBy?.name || 'Unknown'}
                                                    </span>
                                                    {msg.isInternal && <span className="internal-badge-text">Internal</span>}
                                                    <span className="message-time">{formatDate(msg.sentAt)}</span>
                                                </div>
                                                <div className="message-bubble">
                                                    {msg.content}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!ticket.messages || ticket.messages.length === 0) && (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                        No messages yet.
                                    </div>
                                )}
                            </div>

                            <form className="reply-section" onSubmit={handleSendMessage}>
                                <div className="reply-tabs">
                                    <button
                                        type="button"
                                        className={`reply-tab ${!isInternal ? 'active-public' : ''}`}
                                        onClick={() => setIsInternal(false)}
                                    >
                                        Reply to Customer
                                    </button>
                                    <button
                                        type="button"
                                        className={`reply-tab ${isInternal ? 'active-internal' : ''}`}
                                        onClick={() => setIsInternal(true)}
                                    >
                                        Internal Note
                                    </button>
                                </div>
                                <textarea
                                    className="reply-input"
                                    placeholder={isInternal ? "Internal note..." : "Reply to customer..."}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />
                                <div className="reply-actions">
                                    <button type="button" className="btn btn-secondary">
                                        <FiPaperclip /> Attach
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={sending || !replyText.trim()}>
                                        {sending ? 'Sending...' : <span className="flex items-center gap-2"><FiSend /> Send Reply</span>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - Sidebar */}
                <div className="right-column">
                    <div className="details-card">
                        <div className="card-header-sm">
                            <h3>Ticket Info</h3>
                        </div>
                        <div className="card-body">
                            <div className="info-list">
                                <div className="info-list-item">
                                    <span className="info-list-label">Priority</span>
                                    <span className={`info-list-value capitalize ${ticket.priority === 'urgent' ? 'text-red-600' : ''}`}>
                                        {ticket.priority}
                                    </span>
                                </div>
                                <div className="info-list-item">
                                    <span className="info-list-label">Type</span>
                                    <span className="info-list-value capitalize">{ticket.type}</span>
                                </div>
                                <div className="info-list-item">
                                    <span className="info-list-label">Category</span>
                                    <span className="info-list-value capitalize">{ticket.category}</span>
                                </div>
                                <div className="info-list-item">
                                    <span className="info-list-label">Assigned To</span>
                                    <span className="info-list-value">{ticket.assignedTo?.user?.name || 'Unassigned'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="details-card">
                        <div className="card-header-sm">
                            <h3>Customer</h3>
                        </div>
                        <div className="card-body">
                            <div className="info-list">
                                <div className="info-list-item">
                                    <span className="info-list-label">Name</span>
                                    <span className="info-list-value">{ticket.contact?.firstName} {ticket.contact?.lastName}</span>
                                </div>
                                <div className="info-list-item">
                                    <span className="info-list-label">Email</span>
                                    <span className="info-list-value text-sm">{ticket.contact?.email}</span>
                                </div>
                                <div className="info-list-item">
                                    <span className="info-list-label">Company</span>
                                    <span className="info-list-value">{ticket.contact?.company}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="details-card">
                        <div className="card-header-sm">
                            <h3>Actions</h3>
                        </div>
                        <div className="card-body">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Change Status</label>
                            <select
                                className="form-select w-full"
                                value={ticket.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            >
                                <option value="new">New</option>
                                <option value="open">Open</option>
                                <option value="in-progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TicketDetails;
