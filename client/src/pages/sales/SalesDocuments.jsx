import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiPlus, FiSearch, FiFilter, FiChevronUp, FiChevronDown, FiFileText, FiClipboard, FiCheckCircle, FiClock } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import ProposalTable from '../../components/Sales/ProposalTable';
import QuotationTable from '../../components/Sales/QuotationTable';
import Loader from '../../components/common/Loader';
import '../../styles/employee/timesheets.css';

const SalesDocuments = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabParam === 'quotations' ? 'quotations' : 'proposals'); // 'proposals' or 'quotations'

    // Data State
    const [documents, setDocuments] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [, setLoading] = useState(false);

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterInputs, setFilterInputs] = useState({ status: '' });
    const [activeFilters, setActiveFilters] = useState({ status: '' });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch Data
    const fetchDocuments = useCallback(async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) setInitialLoading(true);
            else setLoading(true);

            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: debouncedSearch,
                ...activeFilters
            };

            // Clean params
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            let res;
            if (activeTab === 'proposals') {
                res = await salesService.getProposals(params);
            } else {
                res = await salesService.getQuotations(params);
            }

            if (res.data.success) {
                setDocuments(res.data.data || []);
                setPagination({ ...pagination, total: res.data.total || 0, pages: res.data.pages || 0 });
            }
        } catch (error) {
            console.error(`Error fetching ${activeTab}:`, error);
            // Fallback for demo if API fails
            setDocuments([]);
        } finally {
            if (isInitialLoad) setInitialLoading(false);
            else setLoading(false);
        }
    }, [activeTab, debouncedSearch, activeFilters, pagination.page, pagination.limit]);

    // Initial Load & Tab Change
    useEffect(() => {
        // Reset pagination and filters on tab change
        setPagination(prev => ({ ...prev, page: 1 }));
        setSearchQuery('');
        setDebouncedSearch('');
        setFilterInputs({ status: '' });
        setActiveFilters({ status: '' });

        // Trigger fetch
        fetchDocuments(true);
    }, [activeTab]);

    // Fetch on updates
    useEffect(() => {
        if (!initialLoading) {
            fetchDocuments(false);
        }
    }, [debouncedSearch, activeFilters, pagination.page, fetchDocuments]);

    const getActiveCount = () => {
        let count = 0;
        if (filterInputs.status) count++;
        return count;
    };

    return (
        <div className="timesheets-list-page">
            {/* Header */}
            <div className="timesheets-page-header">
                <div className="header-title-group">
                    <h1 className="page-title">Sales Documents</h1>
                    <p className="page-subtitle">Manage proposals and client quotations</p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate(activeTab === 'proposals' ? '/sales/proposals/new' : '/sales/quotations/new')}
                    >
                        <FiPlus /> Create {activeTab === 'proposals' ? 'Proposal' : 'Quotation'}
                    </button>

                    <button
                        className="btn filter-btn-mobile"
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px', minWidth: '100px',
                            justifyContent: 'center',
                            background: showFilters ? '#eff6ff' : 'white',
                            border: showFilters ? '1px solid #3b82f6' : '1px solid #d1d5db',
                            color: showFilters ? '#2563eb' : '#374151',
                        }}
                    >
                        <FiFilter style={{ color: showFilters ? '#2563eb' : '#6b7280' }} />
                        <span style={{ fontWeight: 500 }}>Filters</span>
                        {showFilters ? <FiChevronUp /> : <FiChevronDown />}
                        {(getActiveCount() > 0) && (
                            <span style={{
                                background: '#3b82f6', color: 'white', padding: '1px 6px',
                                borderRadius: '10px', fontSize: '10px', fontWeight: 700
                            }}>{getActiveCount()}</span>
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
                {/* Total Documents */}
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
                        <FiFileText />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {documents.length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            {activeTab === 'proposals' ? 'Total Proposals' : 'Total Quotations'}
                        </div>
                    </div>
                </div>

                {/* Draft */}
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
                            {documents.filter(d => d.status === 'draft').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Draft
                        </div>
                    </div>
                </div>

                {/* Sent */}
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
                        <FiClipboard />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {documents.filter(d => d.status === 'sent').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Sent
                        </div>
                    </div>
                </div>

                {/* Accepted */}
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
                            {documents.filter(d => d.status === 'accepted').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Accepted
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div>
                {/* Tabs */}
                <div style={{ padding: '0 0 20px 0', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '32px' }}>
                        <button
                            onClick={() => setActiveTab('proposals')}
                            style={{
                                padding: '0 0 12px 0',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'proposals' ? '2px solid #2563eb' : '2px solid transparent',
                                fontWeight: activeTab === 'proposals' ? 600 : 500,
                                color: activeTab === 'proposals' ? '#2563eb' : '#6b7280',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            <FiFileText /> Proposals
                        </button>
                        <button
                            onClick={() => setActiveTab('quotations')}
                            style={{
                                padding: '0 0 12px 0',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'quotations' ? '2px solid #2563eb' : '2px solid transparent',
                                fontWeight: activeTab === 'quotations' ? 600 : 500,
                                color: activeTab === 'quotations' ? '#2563eb' : '#6b7280',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            <FiClipboard /> Quotations
                        </button>
                    </div>
                </div>
                {initialLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}><Loader /></div>
                ) : (
                    activeTab === 'proposals' ? (
                        <ProposalTable
                            proposals={documents}
                            pagination={pagination}
                            onPageChange={(p) => setPagination({ ...pagination, page: p })}
                        />
                    ) : (
                        <QuotationTable
                            quotations={documents}
                            pagination={pagination}
                            onPageChange={(p) => setPagination({ ...pagination, page: p })}
                        />
                    )
                )}
            </div>
        </div>
    );
};

export default SalesDocuments;
