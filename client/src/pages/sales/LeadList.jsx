import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiFilter, FiGrid, FiList, FiDownload, FiX, FiChevronDown, FiChevronUp, FiUsers, FiCheckCircle, FiTarget, FiTrendingUp } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import { marketingService } from '../../services/marketingService';
import LeadTable from '../../components/Sales/LeadTable';
import LeadKanban from '../../components/Sales/LeadKanban';
import ImportLeadsModal from '../../components/Sales/ImportLeadsModal';
import Loader from '../../components/common/Loader';
import '../../styles/employee/timesheets.css';

const LeadList = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  // Split state for Search (Instant/Debounced) vs Filters (Manual Apply)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // UI State for inputs
  const [filterInputs, setFilterInputs] = useState({
    sortBy: 'newest',
    status: '',
    source: '',
    campaign: '',
    owner: '',
    dateFrom: '',
    dateTo: ''
  });

  // API State for active filters
  const [activeFilters, setActiveFilters] = useState({
    sortBy: 'newest',
    status: '',
    source: '',
    campaign: '',
    owner: '',
    dateFrom: '',
    dateTo: ''
  });

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [campaigns, setCampaigns] = useState([]);
  const [owners, setOwners] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMyLeadsOnly, setShowMyLeadsOnly] = useState(false); // Can be merged into filters, but keeping logic

  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const buttonRef = useRef(null);

  // Initial load
  useEffect(() => {
    fetchLeads(true);
    fetchCampaigns();
    fetchOwners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch when Debounced Search OR Active Filters change (NOT inputs)
  useEffect(() => {
    if (!initialLoading) {
      fetchLeads(false);
    }
  }, [debouncedSearch, activeFilters, pagination.page, showMyLeadsOnly]);

  const fetchCampaigns = async () => {
    try {
      const res = await marketingService.getCampaigns();
      if (res.data.success) {
        // Handle both possible response structures
        const campaignsData = res.data.data?.campaigns || res.data.data || [];
        setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]); // Set empty array on error
    }
  };

  const fetchOwners = async () => {
    try {
      setOwners([{ _id: '1', name: 'John Doe' }, { _id: '2', name: 'Jane Smith' }]);
    } catch (error) { console.error(error); }
  };

  const fetchLeads = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setInitialLoading(true);
      else setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        ...activeFilters,
        myLeads: showMyLeadsOnly
      };

      const res = await salesService.getLeads(params);
      if (res.data.success) {
        setLeads(res.data.data || []);
        setPagination({ ...pagination, total: res.data.total || 0, pages: res.data.pages || 0 });
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      // Mock Data
      setLeads([
        { _id: '1', name: 'Alice Johnson', email: 'alice@example.com', phone: '123-456-7890', company: 'Tech Corp', status: 'new', source: 'website', qualificationScore: 85, value: 5000, assignedTo: { user: { name: 'John Doe' } } },
        { _id: '2', name: 'Bob Smith', email: 'bob@example.com', phone: '987-654-3210', company: 'Design Co', status: 'contacted', source: 'referral', qualificationScore: 60, value: 3000, assignedTo: { user: { name: 'Jane Smith' } } }
      ]);
    } finally {
      if (isInitialLoad) setInitialLoading(false);
      else setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setActiveFilters(filterInputs);
    setPagination({ ...pagination, page: 1 }); // Reset page
  };

  const handleClearFilters = () => {
    const resetState = { sortBy: 'newest', status: '', source: '', campaign: '', owner: '', dateFrom: '', dateTo: '' };
    setFilterInputs(resetState);
    setActiveFilters(resetState);
    setSearchQuery('');
  };

  const getActiveCount = () => {
    // Count non-empty values excluding default sortBy
    let count = 0;
    if (showMyLeadsOnly) count++;
    if (filterInputs.status) count++;
    if (filterInputs.source) count++;
    if (filterInputs.campaign) count++;
    if (filterInputs.owner) count++;
    if (filterInputs.dateFrom) count++;
    return count;
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      await salesService.deleteLead(id);
      fetchLeads();
    }
  };

  const handleBulkAction = (action) => {
    console.log(action, selectedLeads);
  };

  return (
    <div className="timesheets-list-page">
      {/* Header Row */}
      <div className="timesheets-page-header">
        <div className="header-title-group">
          <div className="title-text">
            <h1 className="page-title">Leads</h1>
            <p className="page-subtitle">Manage and track your pipeline</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => setShowImportModal(true)}>
            <FiDownload /> Import
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/sales/leads/new')}>
            <FiPlus /> Add Lead
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

        {/* New Leads */}
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

        {/* Qualified */}
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
            <FiTrendingUp />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {leads.filter(l => l.status === 'qualified').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Qualified
            </div>
          </div>
        </div>

        {/* Converted */}
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
              {leads.filter(l => l.status === 'converted').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Converted
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

              {/* My Leads Toggle */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Show</label>
                <div
                  className="toggle-wrapper"
                  onClick={() => setShowMyLeadsOnly(!showMyLeadsOnly)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '0 12px',
                    height: '38px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s',
                    minWidth: '140px'
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>My Leads</span>
                  <div className="unique-toggle-switch" style={{ marginLeft: 'auto' }}>
                    <input type="checkbox" checked={showMyLeadsOnly} readOnly />
                    <span className="unique-slider"></span>
                  </div>
                </div>
              </div>

              {/* Sort By */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sort By</label>
                <div style={{ position: 'relative', width: '140px' }}>
                  <select
                    value={filterInputs.sortBy}
                    onChange={(e) => setFilterInputs({ ...filterInputs, sortBy: e.target.value })}
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
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="value-high">Value: High-Low</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                <div style={{ position: 'relative', width: '130px' }}>
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
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Source */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Source</label>
                <div style={{ position: 'relative', width: '130px' }}>
                  <select
                    value={filterInputs.source}
                    onChange={(e) => setFilterInputs({ ...filterInputs, source: e.target.value })}
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
                    <option value="">All Sources</option>
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social-media">Social</option>
                    <option value="campaign">Campaign</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Campaign */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Campaign</label>
                <div style={{ position: 'relative', width: '150px' }}>
                  <select
                    value={filterInputs.campaign}
                    onChange={(e) => setFilterInputs({ ...filterInputs, campaign: e.target.value })}
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
                    <option value="">All Campaigns</option>
                    {Array.isArray(campaigns) && campaigns.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Owner */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Owner</label>
                <div style={{ position: 'relative', width: '150px' }}>
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
                    {owners.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Range</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="date"
                    value={filterInputs.dateFrom}
                    onChange={(e) => setFilterInputs({ ...filterInputs, dateFrom: e.target.value })}
                    style={{
                      width: '130px',
                      height: '38px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px', // Rounded inputs
                      padding: '0 12px',
                      fontSize: '13px',
                      color: '#374151',
                      outline: 'none',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  />
                  <span style={{ color: '#9ca3af', fontWeight: 500 }}>→</span>
                  <input
                    type="date"
                    value={filterInputs.dateTo}
                    onChange={(e) => setFilterInputs({ ...filterInputs, dateTo: e.target.value })}
                    style={{
                      width: '130px',
                      height: '38px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: '#374151',
                      outline: 'none',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  />
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
      <div>
        {selectedLeads.length > 0 && (
          <div className="bulk-selection-bar">
            <span>{selectedLeads.length} selected</span>
            <div className="bulk-actions">
              <button className="btn-xs border">Assign</button>
              <button className="btn-xs border">Status</button>
              <button className="btn-xs danger" onClick={() => handleBulkAction('delete')}>Delete</button>
            </div>
          </div>
        )}

        {initialLoading ? <Loader /> : (
          <div className="table-container-responsive">
            <LeadTable
              leads={leads}
              selectedLeads={selectedLeads}
              onSelectLeads={setSelectedLeads}
              onDelete={handleDelete}
              pagination={pagination}
              onPageChange={(p) => setPagination({ ...pagination, page: p })}
              loading={loading}
            />
          </div>
        )}
      </div>

      <ImportLeadsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={() => {
          fetchLeads(false);
          setShowImportModal(false);
        }}
      />
    </div>
  );
};

export default LeadList;
