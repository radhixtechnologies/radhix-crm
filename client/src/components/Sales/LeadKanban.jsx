import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiPhone, FiBriefcase, FiUser } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/format';
import './LeadKanban.css';

const STATUSES = [
    { value: 'new', label: 'New', color: '#6366f1' },
    { value: 'contacted', label: 'Contacted', color: '#8b5cf6' },
    { value: 'qualified', label: 'Qualified', color: '#06b6d4' },
    { value: 'converted', label: 'Won', color: '#10b981' },
    { value: 'lost', label: 'Lost', color: '#ef4444' }
];

const LeadKanban = ({ leads, onUpdate, loading }) => {
    const navigate = useNavigate();
    const [draggedLead, setDraggedLead] = useState(null);

    const getLeadsByStatus = (status) => {
        return leads.filter(lead => lead.status === status);
    };

    const getTotalValue = (status) => {
        const statusLeads = getLeadsByStatus(status);
        return statusLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
    };

    const handleDragStart = (e, lead) => {
        setDraggedLead(lead);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();

        if (!draggedLead || draggedLead.status === newStatus) {
            setDraggedLead(null);
            return;
        }

        // Update lead status
        try {
            // Call API to update status
            // await salesService.changeLeadStatus(draggedLead._id, newStatus);
            console.log(`Moving lead ${draggedLead._id} to ${newStatus}`);
            onUpdate();
        } catch (error) {
            console.error('Error updating lead status:', error);
        }

        setDraggedLead(null);
    };

    const handleDragEnd = () => {
        setDraggedLead(null);
    };

    return (
        <div className="lead-kanban">
            {STATUSES.map((status) => {
                const statusLeads = getLeadsByStatus(status.value);
                const totalValue = getTotalValue(status.value);

                return (
                    <div
                        key={status.value}
                        className="kanban-column"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, status.value)}
                    >
                        {/* Column Header */}
                        <div className="column-header" style={{ borderTopColor: status.color }}>
                            <div className="column-title">
                                <span className="status-dot" style={{ backgroundColor: status.color }}></span>
                                <h3>{status.label}</h3>
                                <span className="count">{statusLeads.length}</span>
                            </div>
                            {totalValue > 0 && (
                                <div className="column-value">{formatCurrency(totalValue)}</div>
                            )}
                        </div>

                        {/* Cards */}
                        <div className="kanban-cards">
                            {statusLeads.length === 0 ? (
                                <div className="empty-column">
                                    <p>No leads</p>
                                </div>
                            ) : (
                                statusLeads.map((lead) => (
                                    <div
                                        key={lead._id}
                                        className={`lead-card ${draggedLead?._id === lead._id ? 'dragging' : ''}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, lead)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => navigate(`/sales/leads/${lead._id}`)}
                                    >
                                        {/* Card Header */}
                                        <div className="card-header">
                                            <div className="lead-avatar">
                                                {lead.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="lead-info">
                                                <h4>{lead.name}</h4>
                                                {lead.company && (
                                                    <p className="company">
                                                        <FiBriefcase />
                                                        {lead.company}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="card-body">
                                            {lead.email && (
                                                <div className="info-row">
                                                    <FiMail />
                                                    <span>{lead.email}</span>
                                                </div>
                                            )}
                                            {lead.phone && (
                                                <div className="info-row">
                                                    <FiPhone />
                                                    <span>{lead.phone}</span>
                                                </div>
                                            )}
                                            {lead.assignedTo && (
                                                <div className="info-row">
                                                    <FiUser />
                                                    <span>{lead.assignedTo.user?.name || 'Assigned'}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Footer */}
                                        <div className="card-footer">
                                            <div className="lead-meta">
                                                <span className="source-badge">{lead.source}</span>
                                                {lead.value > 0 && (
                                                    <span className="value">{formatCurrency(lead.value)}</span>
                                                )}
                                            </div>
                                            {lead.qualificationScore > 0 && (
                                                <div className="score-indicator">
                                                    <div className="score-bar">
                                                        <div
                                                            className="score-fill"
                                                            style={{
                                                                width: `${lead.qualificationScore}%`,
                                                                backgroundColor: lead.qualificationScore > 70 ? '#10b981' :
                                                                    lead.qualificationScore > 40 ? '#f59e0b' : '#ef4444'
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="score-text">{lead.qualificationScore}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            })}

            {loading && (
                <div className="kanban-loading">
                    <div className="spinner"></div>
                </div>
            )}
        </div>
    );
};

export default LeadKanban;
