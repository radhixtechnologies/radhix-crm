import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit, FiTrash2, FiCalendar, FiDollarSign, FiUser } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/format';
import '../../styles/employee/employees.css';

const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const PipelineTable = ({ deals, onDelete }) => {
    const navigate = useNavigate();

    const getStageColor = (stageId) => {
        switch (stageId) {
            case 'new-lead': return '#6366f1';
            case 'contacted': return '#3b82f6';
            case 'qualified': return '#8b5cf6';
            case 'proposal-sent': return '#f59e0b';
            case 'negotiation': return '#ec4899';
            case 'won': return '#10b981';
            case 'lost': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStageLabel = (stageId) => {
        const stage = [
            { id: 'new-lead', name: 'New Lead' },
            { id: 'contacted', name: 'Contacted' },
            { id: 'qualified', name: 'Qualified' },
            { id: 'proposal-sent', name: 'Proposal Sent' },
            { id: 'negotiation', name: 'Negotiation' },
            { id: 'won', name: 'Won' },
            { id: 'lost', name: 'Lost' },
        ].find(s => s.id === stageId);
        return stage ? stage.name : stageId;
    };

    return (
        <div className="table-container-responsive">
            <table className="table">
                <thead>
                    <tr>
                        <th>Deal Name</th>
                        <th>Client</th>
                        <th>Stage</th>
                        <th>Value</th>
                        <th>Expected Close Date</th>
                        <th>Owner</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {deals.length > 0 ? (
                        deals.map((deal) => (
                            <tr key={deal._id}>
                                <td>
                                    <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>
                                        {deal.title}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div className="employee-avatar-table" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                                            <span>{getInitials(deal.client?.name)}</span>
                                        </div>
                                        <span>{deal.client?.name || 'N/A'}</span>
                                    </div>
                                </td>
                                <td>
                                    <span
                                        className="badge"
                                        style={{
                                            backgroundColor: getStageColor(deal.stage) + '20',
                                            color: getStageColor(deal.stage),
                                            border: `1px solid ${getStageColor(deal.stage)}40`,
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                        }}
                                    >
                                        {getStageLabel(deal.stage)}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FiDollarSign size={14} style={{ color: 'var(--text-muted)' }} />
                                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                            {formatCurrency(deal.value || 0)}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    {deal.expectedCloseDate ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                            <FiCalendar size={14} />
                                            {formatDate(deal.expectedCloseDate)}
                                        </div>
                                    ) : (
                                        <span className="text-muted">-</span>
                                    )}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FiUser size={14} style={{ color: 'var(--text-muted)' }} />
                                        <span style={{ fontSize: '13px' }}>
                                            {deal.assignedTo?.name || 'Unassigned'}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => navigate(`/sales/deals/${deal._id}`)}
                                            title="View"
                                        >
                                            <FiEye />
                                        </button>
                                        {/* Add Edit/Delete if needed, similar to LeadTable */}
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                No deals found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PipelineTable;
