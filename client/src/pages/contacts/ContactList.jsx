
import { useState, useEffect } from 'react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiX, FiFilter, FiChevronUp, FiChevronDown, FiUsers, FiCheckCircle, FiTarget, FiXCircle } from 'react-icons/fi';
import { contactService } from '../../services/contactService';
import ContactTable from '../../components/contacts/ContactTable';
import Loader from '../../components/common/Loader';
import '../../styles/contacts/contacts.css';

const ContactList = () => {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);

    // Filters state
    const [filters, setFilters] = useState({
        status: '',
        lifecycleStage: '',
        search: '',
        owner: ''
    });

    // Buffered Filter State
    const [filterInputs, setFilterInputs] = useState({
        status: '',
        lifecycleStage: '',
        search: '',
        owner: ''
    });

    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef(null);
    const buttonRef = useRef(null);

    // Quick Stats / Tab state
    const [activeTab, setActiveTab] = useState('all'); // all, active, lead, inactive

    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

    // Initial load
    useEffect(() => {
        fetchContacts(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle Tab Change
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setPagination({ ...pagination, page: 1 });

        const newFilters = { ...filters, status: '', lifecycleStage: '' };

        if (tabId === 'active') newFilters.status = 'active';
        if (tabId === 'lead') newFilters.lifecycleStage = 'lead';
        if (tabId === 'inactive') newFilters.status = 'inactive';

        setFilters(newFilters);
    };

    // Debounce search and filter changes
    useEffect(() => {
        if (initialLoading) return;

        const timeout = setTimeout(() => {
            fetchContacts(false);
        }, filters.search ? 500 : 300);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, filters]);

    const fetchContacts = async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) {
                setInitialLoading(true);
            } else {
                setLoading(true);
            }
            const params = { page: pagination.page, limit: pagination.limit, ...filters };
            const res = await contactService.getContacts(params);
            if (res.data.success) {
                setContacts(res.data.data.contacts || []);
                // API documentation says res.data.data.pagination
                setPagination({
                    ...pagination,
                    total: res.data.data.pagination.totalItems || 0,
                    pages: res.data.data.pagination.totalPages || 0
                });
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            if (isInitialLoad) {
                setInitialLoading(false);
            } else {
                setLoading(false);
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            try {
                await contactService.deleteContact(id);
                fetchContacts();
            } catch (error) {
                alert('Failed to delete contact');
            }
        }
    };

    const clearFilters = () => {
        setFilters({ status: '', lifecycleStage: '', search: '', owner: '' });
        setActiveTab('all');
    };

    const removeFilter = (key) => {
        setFilters({ ...filters, [key]: '' });
        if (key === 'status' || key === 'lifecycleStage') setActiveTab('all');
    };

    const handleApplyFilters = () => {
        setFilters({ ...filters, ...filterInputs });
        setShowFilters(false);
        setPagination({ ...pagination, page: 1 });
    };

    const hasFilters = filters.status || filters.lifecycleStage || filters.search;

    const getActiveCount = () => {
        let count = 0;
        if (filterInputs.status) count++;
        if (filterInputs.lifecycleStage) count++;
        if (filterInputs.owner) count++;
        return count;
    };

    return (
        <div className="timesheets-list-page">
            {/* Header Row */}
            <div className="timesheets-page-header">
                <div className="header-title-group">
                    <div className="title-text">
                        <h1 className="page-title">Contacts</h1>
                        <p className="page-subtitle">
                            {pagination.total} {pagination.total === 1 ? 'contact' : 'contacts'}
                        </p>
                    </div>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/contacts/new')}
                    >
                        <FiPlus size={16} />
                        Add Contact
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
                {/* Total Contacts */}
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
                            {pagination.total}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Contacts
                        </div>
                    </div>
                </div>

                {/* Active */}
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
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiCheckCircle />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {contacts.filter(c => c.status === 'active').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Active
                        </div>
                    </div>
                </div>

                {/* Leads */}
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
                        <FiTarget />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {contacts.filter(c => c.lifecycleStage === 'lead').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Leads
                        </div>
                    </div>
                </div>

                {/* Inactive */}
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
                            {contacts.filter(c => c.status === 'inactive').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Inactive
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
                        placeholder="Search contacts..."
                        value={filterInputs.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
            </div>

            {/* Toolbar Container - Relative for Filter Panel positioning */}
            <div style={{ position: 'relative', zIndex: 50 }}>

                {/* 2. Filter Panel (Absolute Overlay) */}
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

                            {/* Status Filter */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                                <div style={{ position: 'relative', width: '160px' }}>
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
                                        <option value="">All Statuses</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="churned">Churned</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Lifecycle Stage Filter */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lifecycle Stage</label>
                                <div style={{ position: 'relative', width: '180px' }}>
                                    <select
                                        value={filterInputs.lifecycleStage}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, lifecycleStage: e.target.value })}
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
                                        <option value="">All Stages</option>
                                        <option value="lead">Lead</option>
                                        <option value="marketing-qualified">MQL</option>
                                        <option value="sales-qualified">SQL</option>
                                        <option value="customer">Customer</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Owner Filter */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Owner</label>
                                <div style={{ position: 'relative', width: '160px' }}>
                                    <select
                                        value={filterInputs.owner}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, owner: e.target.value })}
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
                                        <option value="">All Owners</option>
                                        <option value="me">My Contacts</option>
                                        <option value="unassigned">Unassigned</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', height: '38px' }}>
                                <button
                                    onClick={clearFilters}
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
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={handleApplyFilters}
                                    style={{
                                        background: '#2563eb', // Primary Blue
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

            {/* Content */}
            <div>
                {/* Tabs */}
                <div className="contacts-tabs">
                    {['all', 'active', 'lead', 'inactive'].map((tab) => (
                        <button
                            key={tab}
                            className={`tab-item ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => handleTabChange(tab)}
                        >
                            {tab === 'all' ? 'All Contacts' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Table Section */}
                {initialLoading ? (
                    <div className="loading-container">
                        <Loader />
                    </div>
                ) : (
                    <div className="contacts-table-section">
                        {loading && (
                            <div className="table-loading-overlay">
                                <Loader />
                            </div>
                        )}
                        <ContactTable
                            contacts={contacts}
                            onDelete={handleDelete}
                            pagination={pagination}
                            onPageChange={(page) => setPagination({ ...pagination, page })}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactList;
