import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiUsers, FiTarget, FiPhone, FiXCircle } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import '../../styles/employee/timesheets.css';

const LeadTracking = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef(null);
    const buttonRef = useRef(null);

    const [filterInputs, setFilterInputs] = useState({
        temperature: 'all',
        status: 'all'
    });

    const [activeFilters, setActiveFilters] = useState({
        temperature: 'all',
        status: 'all'
    });

    const stages = [
        { id: 'new', label: 'New', color: '#3b82f6' },
        { id: 'contacted', label: 'Contacted', color: '#8b5cf6' },
        { id: 'qualified', label: 'Qualified', color: '#10b981' },
        { id: 'lost', label: 'Lost', color: '#ef4444' }
    ];

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const res = await salesService.getLeads();
            if (res.data.success) {
                setLeads(res.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (leadId, newStatus) => {
        try {
            await salesService.changeLeadStatus(leadId, newStatus);
            setLeads(leads.map(lead =>
                lead._id === leadId ? { ...lead, status: newStatus } : lead
            ));
        } catch (error) {
            console.error('Error updating lead status:', error);
            alert('Failed to update lead status');
        }
    };

    const handleApplyFilters = () => {
        setActiveFilters(filterInputs);
    };

    const handleClearFilters = () => {
        const resetState = { temperature: 'all', status: 'all' };
        setFilterInputs(resetState);
        setActiveFilters(resetState);
        setSearchTerm('');
    };

    const getActiveCount = () => {
        let count = 0;
        if (filterInputs.temperature !== 'all') count++;
        if (filterInputs.status !== 'all') count++;
        return count;
    };

    const getLeadsByStage = (stageId) => {
        return leads.filter(lead => {
            const matchesStage = lead.status === stageId;
            const matchesSearch = searchTerm === '' ||
                lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesTemperature = activeFilters.temperature === 'all' || lead.leadTemperature === activeFilters.temperature;
            const matchesStatus = activeFilters.status === 'all' || lead.status === activeFilters.status;

            return matchesStage && matchesSearch && matchesTemperature && matchesStatus;
        });
    };

    const getTempEmoji = (temp) => {
        const emojis = {
            'cold': '🧊',
            'warm': '🟡',
            'hot': '🔥',
            'qualified': '✅'
        };
        return emojis[temp] || '🧊';
    };

    const getCurrencySymbol = (currency) => {
        const symbols = {
            'INR': '₹',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'AUD': 'A$',
            'CAD': 'C$'
        };
        return symbols[currency] || '₹';
    };

    const handleDragStart = (e, leadId) => {
        e.dataTransfer.setData('leadId', leadId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, newStatus) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData('leadId');
        handleStatusChange(leadId, newStatus);
    };

    return (
        <div className="timesheets-list-page">
            {/* Header */}
            <div className="timesheets-page-header">
                <div className="header-title-group">
                    <div className="title-text">
                        <h1 className="page-title">Lead Tracking</h1>
                        <p className="page-subtitle">Manage leads through their journey</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => navigate('/sales/leads/new')}>
                        <FiPlus /> New Lead
                    </button>
                    <button
                        ref={buttonRef}
                        className="btn filter-btn-mobile"
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: '100px',
                            justifyContent: 'center',
                            background: showFilters ? '#eff6ff' : 'white',
                            border: showFilters ? '1px solid #3b82f6' : '1px solid #d1d5db',
                            color: showFilters ? '#2563eb' : '#374151',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FiFilter style={{ color: showFilters ? '#2563eb' : '#6b7280' }} />
                        <span style={{ fontWeight: 500 }}>Filters</span>
                        {showFilters ? <FiChevronUp /> : <FiChevronDown />}
                        {(getActiveCount() > 0) && (
                            <span style={{
                                background: '#3b82f6',
                                color: 'white',
                                padding: '1px 6px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: 700
                            }}>
                                {getActiveCount()}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                {/* Total Leads */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiUsers />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {leads.length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Leads
                        </div>
                    </div>
                </div>

                {/* New */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiTarget />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {leads.filter(l => l.status === 'new').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            New
                        </div>
                    </div>
                </div>

                {/* Contacted */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiPhone />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {leads.filter(l => l.status === 'contacted').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Contacted
                        </div>
                    </div>
                </div>

                {/* Lost */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiXCircle />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {leads.filter(l => l.status === 'lost').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Lost
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar Section */}
            <div className="search-bar-section" style={{ marginBottom: '16px' }}>
                <div className="toolbar-search" style={{ margin: 0, width: '100%', maxWidth: '280px' }}>
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search leads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter Panel */}
            <div style={{ position: 'relative', zIndex: 50 }}>
                {showFilters && (
                    <div className="filter-panel-overlay fade-in" ref={filterRef} style={{
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        width: '100%',
                        background: '#f9fafb',
                        padding: '24px',
                        marginTop: '8px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        zIndex: 2000,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', width: '100%', flexWrap: 'wrap' }}>

                            {/* Temperature Filter */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Temperature</label>
                                <div style={{ position: 'relative', width: '140px' }}>
                                    <select
                                        value={filterInputs.temperature}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, temperature: e.target.value })}
                                        style={{
                                            appearance: 'none',
                                            width: '100%',
                                            background: 'white',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            padding: '0 32px 0 12px',
                                            fontSize: '13px',
                                            color: '#374151',
                                            height: '38px',
                                            cursor: 'pointer',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value="all">All</option>
                                        <option value="cold">🧊 Cold</option>
                                        <option value="warm">🟡 Warm</option>
                                        <option value="hot">🔥 Hot</option>
                                        <option value="qualified">✅ Qualified</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                                <div style={{ position: 'relative', width: '140px' }}>
                                    <select
                                        value={filterInputs.status}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, status: e.target.value })}
                                        style={{
                                            appearance: 'none',
                                            width: '100%',
                                            background: 'white',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            padding: '0 32px 0 12px',
                                            fontSize: '13px',
                                            color: '#374151',
                                            height: '38px',
                                            cursor: 'pointer',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="qualified">Qualified</option>
                                        <option value="lost">Lost</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', height: '38px' }}>
                                <button
                                    onClick={handleClearFilters}
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: '#6b7280',
                                        background: 'transparent',
                                        border: '1px solid transparent',
                                        cursor: 'pointer',
                                        padding: '0 12px',
                                        borderRadius: '6px',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'color 0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#111827';
                                        e.currentTarget.style.background = '#f3f4f6';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#6b7280';
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={() => { handleApplyFilters(); setShowFilters(false); }}
                                    style={{
                                        background: '#2563eb',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0 20px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        borderRadius: '6px',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Apply
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </div>

            {/* Kanban Board */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    Loading leads...
                </div>
            ) : (
                <div style={{ overflowX: 'auto', padding: '0 0 24px 0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(280px, 1fr))', gap: '20px', minWidth: 'fit-content' }}>
                        {stages.map(stage => {
                            const stageLeads = getLeadsByStage(stage.id);
                            return (
                                <div
                                    key={stage.id}
                                    style={{
                                        background: 'white',
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        minHeight: '600px'
                                    }}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, stage.id)}
                                >
                                    <div style={{
                                        padding: '16px',
                                        borderBottom: '1px solid #e5e7eb',
                                        borderTop: `3px solid ${stage.color}`,
                                        borderTopLeftRadius: '12px',
                                        borderTopRightRadius: '12px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            fontSize: '15px',
                                            fontWeight: 600,
                                            color: '#111827'
                                        }}>
                                            <span>{stage.label}</span>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                minWidth: '24px',
                                                height: '24px',
                                                padding: '0 8px',
                                                background: '#f3f4f6',
                                                color: '#6b7280',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                borderRadius: '12px'
                                            }}>{stageLeads.length}</span>
                                        </div>
                                    </div>

                                    <div style={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        padding: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        {stageLeads.length === 0 ? (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '40px 20px',
                                                textAlign: 'center',
                                                color: '#9ca3af',
                                                fontSize: '13px'
                                            }}>
                                                No {stage.label.toLowerCase()} leads
                                            </div>
                                        ) : (
                                            stageLeads.map(lead => (
                                                <div
                                                    key={lead._id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, lead._id)}
                                                    onClick={() => navigate(`/sales/leads/${lead._id}`)}
                                                    style={{
                                                        background: 'white',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '10px',
                                                        padding: '14px',
                                                        cursor: 'grab',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.borderColor = '#667eea';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.boxShadow = 'none';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '16px', flexShrink: 0 }}>
                                                            {getTempEmoji(lead.leadTemperature)}
                                                        </span>
                                                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.4, flex: 1 }}>
                                                            {lead.name}
                                                        </h4>
                                                    </div>

                                                    {lead.company && (
                                                        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {lead.company}
                                                        </p>
                                                    )}

                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '8px',
                                                        paddingTop: '10px',
                                                        borderTop: '1px solid #f3f4f6',
                                                        fontSize: '12px',
                                                        color: '#6b7280'
                                                    }}>
                                                        <span style={{ fontWeight: 600, color: '#667eea' }}>
                                                            {getCurrencySymbol(lead.currency)}{lead.value?.toLocaleString() || 0}
                                                        </span>
                                                        {lead.assignedTo && (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                {lead.assignedTo.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadTracking;
