import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiPhone,
  FiMail,
  FiShield,
  FiZap,
  FiAward,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { supportService } from '../../services/supportService';
import TicketTable from '../../components/Support/TicketTable';
import Loader from '../../components/common/Loader';
import '../../styles/employee/timesheets.css';

const TicketList = () => {
    const navigate = useNavigate();
    const { user, isSuperAdmin } = useAuth();
    const planSlug = user?.company?.subscription?.planSlug || 'pro';
    const [tickets, setTickets] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const initialFetch = useRef(true);

    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef(null);
    const buttonRef = useRef(null);

    // Split state for Search (Instant/Debounced) vs Filters (Manual Apply)
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // UI State for inputs
    const [filterInputs, setFilterInputs] = useState({
        status: '',
        priority: ''
    });

    // API State for active filters
    const [activeFilters, setActiveFilters] = useState({
        status: '',
        priority: ''
    });

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchTickets = useCallback(async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) setInitialLoading(true);
            else setLoading(true);

            // Combine active filters with search
            const params = {
                search: debouncedSearch,
                ...activeFilters,
                page: pagination.page,
                limit: pagination.limit,
            };

            const res = await supportService.getTickets(params);
            if (res.data.success) {
                setTickets(res.data.data?.tickets || []);
                const pageData = res.data.data?.pagination;
                setPagination(current => ({
                    ...current,
                    total: pageData?.totalItems || 0,
                    pages: pageData?.totalPages || 0,
                }));
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            if (isInitialLoad) setInitialLoading(false);
            else setLoading(false);
        }
    }, [debouncedSearch, activeFilters, pagination.limit, pagination.page]);

    useEffect(() => {
        const isInitialLoad = initialFetch.current;
        initialFetch.current = false;
        fetchTickets(isInitialLoad);
    }, [fetchTickets]);

    const fetchMetrics = useCallback(async () => {
        try {
            const res = await supportService.getMetrics();
            if (res.data?.success) setMetrics(res.data.data);
        } catch (error) {
            console.error('Error fetching ticket metrics:', error);
        }
    }, []);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    const handleApplyFilters = () => {
        setActiveFilters(filterInputs);
        setPagination(current => ({ ...current, page: 1 }));
    };

    const handleClearFilters = () => {
        const resetState = { status: '', priority: '' };
        setFilterInputs(resetState);
        setActiveFilters(resetState);
        setSearchQuery('');
        setPagination(current => ({ ...current, page: 1 }));
    };

    const getActiveCount = () => {
        let count = 0;
        if (filterInputs.status) count++;
        if (filterInputs.priority) count++;
        return count;
    };

    if (initialLoading) return <Loader />;

    return (
        <div className="timesheets-list-page">
            {/* Header Row */}
            <div className="timesheets-page-header">
                <div className="header-title-group">
                    <h1 className="page-title">Support Tickets</h1>
                    <p className="page-subtitle">Manage customer inquiries and issues</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => navigate('/support/tickets/new')}>
                        <FiPlus /> New Ticket
                    </button>
                    <button
                        ref={buttonRef}
                        className="btn filter-btn-mobile"
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            display: 'none',
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

            {/* Search Bar Section (Mobile) */}
            <div className="search-bar-section" style={{ marginBottom: '16px', display: 'none' }}>
                <div className="toolbar-search" style={{ margin: 0, width: '100%', maxWidth: '280px' }}>
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by subject or ticket ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* SLA & Tier-Aware Support Concierge Card */}
            {(planSlug === 'enterprise' || isSuperAdmin) ? (
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                borderRadius: '16px',
                padding: '22px 28px',
                color: '#ffffff',
                marginBottom: '24px',
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
                border: '1px solid #312e81',
              }}>
                <div style={{ maxWidth: '600px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '20px',
                      letterSpacing: '0.5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}>
                      <FiAward /> DEDICATED VIP ACCOUNT MANAGER &amp; 99.9% UPTIME SLA
                    </span>
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#a5b4fc',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '12px',
                    }}>
                      &lt;15 min SLA Response
                    </span>
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                    Enterprise Concierge &amp; Priority Technical Desk
                  </h2>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#c7d2fe', lineHeight: 1.45 }}>
                    Your Enterprise subscription includes an assigned Customer Success Director, 99.9% infrastructure SLA assurance, and real-time emergency resolution.
                  </p>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '14px 20px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #4338ca)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 700,
                  }}>
                    RS
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Rohan Sharma</div>
                    <div style={{ fontSize: '11.5px', color: '#a5b4fc' }}>Dedicated Enterprise Account Director</div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                      <a
                        href="https://wa.me/919876543210?text=Hello%20Rohan,%20I%20am%20contacting%20you%20from%20my%20Radhix%20Enterprise%20CRM%20account"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#4ade80', fontSize: '12px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        💬 WhatsApp VIP
                      </a>
                      <a
                        href="tel:+919876543210"
                        style={{ color: '#93c5fd', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <FiPhone /> Call Direct
                      </a>
                      <a
                        href="mailto:vip-desk@radhix.com"
                        style={{ color: '#fbcfe8', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <FiMail /> vip-desk@radhix.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : planSlug === 'pro' ? (
              <div style={{
                background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                border: '1px solid #c7d2fe',
                borderRadius: '14px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    <FiZap />
                  </div>
                  <div>
                    <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#1e1b4b' }}>
                      ⚡ Priority 2-Hour Response SLA Active
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#4338ca' }}>
                      Your tickets receive priority handling from our dedicated engineering support team.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/subscription')}
                  style={{
                    background: '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Upgrade to Enterprise for Dedicated Account Manager &rarr;
                </button>
              </div>
            ) : (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#94a3b8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    <FiShield />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                      Community &amp; Email Support (24h turnaround)
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                      Upgrade your plan to unlock 2-hour priority SLA or a Dedicated VIP Account Manager.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/subscription')}
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View Subscription Plans &rarr;
                </button>
              </div>
            )}

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                {/* Total Tickets */}
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
                        <FiMessageSquare />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {metrics?.totalTickets ?? pagination.total}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Tickets
                        </div>
                    </div>
                </div>

                {/* New/Open */}
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
                        <FiAlertCircle />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {metrics?.newTickets ?? tickets.filter(t => t.status === 'new' || t.status === 'open').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            New/Open
                        </div>
                    </div>
                </div>

                {/* In Progress */}
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
                        <FiClock />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {metrics?.inProgressTickets ?? tickets.filter(t => t.status === 'in-progress').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            In Progress
                        </div>
                    </div>
                </div>

                {/* Resolved */}
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
                            {metrics?.resolvedTickets ?? tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Resolved
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar Container - Relative for Filter Panel positioning */}
            <div style={{ position: 'relative', zIndex: 50 }}>
                {/* 1. Main Toolbar Row (Desktop) */}
                <div className="toolbar-desktop">
                    {/* Left: Search & Filter Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="toolbar-search" style={{ margin: 0, width: '280px' }}>
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by subject or ticket ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <button
                            ref={buttonRef}
                            className="btn"
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

                            {/* Status */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                                <div style={{ position: 'relative', width: '180px' }}>
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
                                        <option value="new">New</option>
                                        <option value="open">Open</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Priority */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority</label>
                                <div style={{ position: 'relative', width: '180px' }}>
                                    <select
                                        value={filterInputs.priority}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, priority: e.target.value })}
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
                                        <option value="">All Priorities</option>
                                        <option value="critical">Critical</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
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
            {/* Content */}
            <div>
                {loading && <div style={{ padding: '20px', textAlign: 'center' }}><Loader /></div>}

                <TicketTable tickets={tickets} />
                {pagination.pages > 1 && (
                    <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '16px' }}>
                        <button className="btn" disabled={pagination.page <= 1} onClick={() => setPagination(current => ({ ...current, page: current.page - 1 }))}>Previous</button>
                        <span>Page {pagination.page} of {pagination.pages} ({pagination.total} tickets)</span>
                        <button className="btn" disabled={pagination.page >= pagination.pages} onClick={() => setPagination(current => ({ ...current, page: current.page + 1 }))}>Next</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketList;
