import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiClock, FiEye, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { formatDate } from '../../utils/format';
import '../../styles/employee/employees.css';

const TicketTable = ({ tickets }) => {
    const navigate = useNavigate();

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return '#ef4444'; // Red
            case 'urgent': return '#f97316'; // Orange
            case 'high': return '#f59e0b'; // Amber
            case 'medium': return '#3b82f6'; // Blue
            case 'low': return '#10b981'; // Green
            default: return '#6b7280';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return '#3b82f6';
            case 'open': return '#6366f1';
            case 'in-progress': return '#f59e0b';
            case 'resolved': return '#10b981';
            case 'closed': return '#6b7280';
            default: return '#6b7280';
        }
    };

    return (
        <div className="table-container-responsive">
            <table className="table">
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Ticket ID</th>
                        <th>Customer</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tickets.length > 0 ? (
                        tickets.map(ticket => (
                            <tr key={ticket._id}>
                                <td>
                                    <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                                        {ticket.subject}
                                    </div>
                                </td>
                                <td>
                                    <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>#{ticket.ticketNumber}</span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FiMessageSquare size={14} style={{ color: 'var(--text-muted)' }} />
                                        <span style={{ fontSize: '13px' }}>
                                            {ticket.contact?.firstName} {ticket.contact?.lastName}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '22px' }}>
                                        {ticket.contact?.company || 'Unknown Company'}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getPriorityColor(ticket.priority) }}></div>
                                        <span style={{ textTransform: 'capitalize' }}>{ticket.priority}</span>
                                    </div>
                                </td>
                                <td>
                                    <span
                                        className="badge"
                                        style={{
                                            backgroundColor: getStatusColor(ticket.status) + '20',
                                            color: getStatusColor(ticket.status),
                                            border: `1px solid ${getStatusColor(ticket.status)}40`,
                                        }}
                                    >
                                        {ticket.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                        <FiClock size={14} />
                                        {formatDate(ticket.createdAt)}
                                    </div>
                                </td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => navigate(`/support/tickets/${ticket._id}`)}
                                        title="View Details"
                                    >
                                        <FiEye /> View
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                No tickets found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TicketTable;
