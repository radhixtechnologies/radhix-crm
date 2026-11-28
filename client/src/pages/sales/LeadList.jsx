import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiFilter, FiGrid, FiList, FiDownload, FiUpload, FiX, FiChevronDown, FiChevronUp, FiUsers, FiCheckCircle, FiTarget, FiTrendingUp, FiCpu } from 'react-icons/fi';
import { FaFacebook, FaWhatsapp } from 'react-icons/fa';
import { salesService, normalizeSalesListResponse } from '../../services/salesService';
import { marketingService } from '../../services/marketingService';
import { aiCallingService } from '../../services/aiCallingService';
import LeadTable from '../../components/Sales/LeadTable';
import LeadKanban from '../../components/Sales/LeadKanban';
import ImportLeadsModal from '../../components/Sales/ImportLeadsModal';
import MetaAdsModal from '../../components/Sales/MetaAdsModal';
import WhatsAppBroadcastModal from '../../components/marketing/WhatsAppBroadcastModal';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import '../../styles/employee/timesheets.css';

const LeadList = () => {
  const navigate = useNavigate();
  const { user, roleSlug, isAdmin } = useAuth();
  const isSalesRep = roleSlug === 'sales_employee' ||
    (roleSlug === 'employee' && user?.department?.toLowerCase() === 'sales');
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
    followUpBucket: '',
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
    followUpBucket: '',
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
  const [leadSummary, setLeadSummary] = useState({ total: 0, new: 0, qualified: 0, converted: 0 });
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showMyLeadsOnly, setShowMyLeadsOnly] = useState(isSalesRep);
  const [bulkEmployeeId, setBulkEmployeeId] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState(null);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showWhatsAppBroadcastModal, setShowWhatsAppBroadcastModal] = useState(false);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const res = await salesService.exportLeadsCsv();
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Leads_Export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export leads. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (isSalesRep) setShowMyLeadsOnly(true);
  }, [isSalesRep]);

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
  }, [debouncedSearch, activeFilters, pagination.page, pagination.limit, showMyLeadsOnly]);

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
    if (!isAdmin && roleSlug !== 'super_admin' && roleSlug !== 'admin' && !roleSlug?.endsWith('_manager')) return;
    try {
      const response = await salesService.getLeadOwners();
      setOwners(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching Sales owners:', error);
      setOwners([]);
    }
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
        myLeads: showMyLeadsOnly,
        instituteInquiry: false
      };

      const res = await salesService.getLeads(params);
      const normalized = normalizeSalesListResponse(res);
      if (normalized.success) {
        setLeads(normalized.data || []);
        if (res.data?.summary) {
          setLeadSummary(res.data.summary);
        } else {
          setLeadSummary({
            total: normalized.total,
            new: normalized.total,
            qualified: 0,
            converted: 0,
          });
        }
        setPagination(prev => ({
          ...prev,
          page: normalized.page,
          limit: normalized.limit || prev.limit,
          total: normalized.total,
          pages: normalized.pages,
        }));
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
      setPagination(prev => ({ ...prev, total: 0, pages: 0 }));
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
    const resetState = { sortBy: 'newest', status: '', source: '', campaign: '', owner: '', followUpBucket: '', dateFrom: '', dateTo: '' };
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
    if (filterInputs.followUpBucket) count++;
    if (filterInputs.dateFrom) count++;
    return count;
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      await salesService.deleteLead(id);
      fetchLeads();
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkEmployeeId) {
      alert('Please select an employee to assign leads to.');
      return;
    }
    if (selectedLeads.length === 0) return;

    try {
      setBulkProcessing(true);
      const res = await salesService.bulkAssignLeads(selectedLeads, bulkEmployeeId);
      if (res.data?.success) {
        setBulkFeedback({ type: 'success', message: res.data.message || `Assigned ${selectedLeads.length} leads successfully!` });
        setSelectedLeads([]);
        setBulkEmployeeId('');
        setShowBulkAssignModal(false);
        fetchLeads(false);
        setTimeout(() => setBulkFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Bulk assign error:', err);
      alert(err.response?.data?.message || 'Failed to assign selected leads');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (!newStatus) return;
    if (selectedLeads.length === 0) return;

    try {
      setBulkProcessing(true);
      const res = await salesService.bulkUpdateStatus(selectedLeads, newStatus);
      if (res.data?.success) {
        setBulkFeedback({ type: 'success', message: res.data.message || `Updated status for ${selectedLeads.length} leads!` });
        setSelectedLeads([]);
        fetchLeads(false);
        setTimeout(() => setBulkFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Bulk status error:', err);
      alert(err.response?.data?.message || 'Failed to update status for selected leads');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedLeads.length} selected leads?`)) return;

    try {
      setBulkProcessing(true);
      const res = await salesService.bulkDeleteLeads(selectedLeads);
      if (res.data?.success) {
        setBulkFeedback({ type: 'success', message: `Deleted ${selectedLeads.length} leads successfully!` });
        setSelectedLeads([]);
        fetchLeads(false);
        setTimeout(() => setBulkFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete selected leads');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkAiCall = async () => {
    if (selectedLeads.length === 0) return;
    try {
      setBulkProcessing(true);
      const cfgRes = await aiCallingService.getConfig();
      const cfg = cfgRes.data?.data;
      const isLiveReady = Boolean(cfg?.enabled && cfg?.provider !== 'simulator' && cfg?.hasApiKey && cfg?.agentId);
      const confirmMsg = isLiveReady
        ? `Start live AI Voice Calls via ${cfg.provider.toUpperCase()} for ${selectedLeads.length} selected lead(s)?`
        : `Live AI provider is not configured yet. Run ${selectedLeads.length} lead(s) in CRM Test Simulator mode?`;
      if (!window.confirm(confirmMsg)) return;

      const res = await aiCallingService.bulkTriggerCalls({
        leadIds: selectedLeads,
        simulate: !isLiveReady,
      });
      if (res.data) {
        setBulkFeedback({
          type: res.data.initiatedCount > 0 ? 'success' : 'error',
          message: res.data.message || `Initiated AI calls for ${res.data.initiatedCount} lead(s). Check AI Calling Console for live logs.`,
        });
        setSelectedLeads([]);
        setTimeout(() => setBulkFeedback(null), 6000);
      }
    } catch (err) {
      console.error('Bulk AI call error:', err);
      alert(err.response?.data?.message || 'Failed to initiate bulk AI calls');
    } finally {
      setBulkProcessing(false);
    }
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
          <button
            className="btn btn-outline"
            onClick={() => setShowMetaModal(true)}
            title="Meta Ads Integration (Facebook & Instagram Lead Forms)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: '#1877f2',
              color: '#1877f2',
              backgroundColor: '#f0f6ff',
              fontWeight: 600,
            }}
          >
            <FaFacebook style={{ fontSize: '15px' }} /> Meta Ads Sync
          </button>
          <button className="btn btn-outline" onClick={() => setShowImportModal(true)} title="Import leads from Excel or CSV">
            <FiUpload /> Import
          </button>
          <button className="btn btn-outline" onClick={handleExportCsv} disabled={exporting} title="Export all leads to CSV">
            <FiDownload /> {exporting ? 'Exporting...' : 'Export'}
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
              {leadSummary.total || pagination.total || leads.length}
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
              {leadSummary.new ?? leads.filter(l => l.status === 'new').length}
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
              {leadSummary.qualified ?? leads.filter(l => l.status === 'qualified').length}
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
              {leadSummary.converted ?? leads.filter(l => l.status === 'converted').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Converted
            </div>
          </div>
        </div>
      </div>

      {/* Search & Follow-up Quick Filters Row */}
      <div
        className="search-bar-section"
        style={{
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div className="toolbar-search" style={{ margin: 0, width: '100%', maxWidth: '280px' }}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { value: '', label: 'All Leads', activeBg: '#1e293b', activeColor: '#ffffff' },
            { value: 'today', label: 'Call Today', activeBg: '#d97706', activeColor: '#ffffff' },
            { value: 'overdue', label: 'Overdue Call', activeBg: '#dc2626', activeColor: '#ffffff' },
            { value: 'upcoming', label: 'Upcoming Call', activeBg: '#2563eb', activeColor: '#ffffff' },
          ].map((pill) => {
            const isActive = activeFilters.followUpBucket === pill.value;
            return (
              <button
                key={pill.value || 'all'}
                type="button"
                onClick={() => {
                  const nextFilter = { ...filterInputs, followUpBucket: pill.value };
                  setFilterInputs(nextFilter);
                  setActiveFilters({ ...activeFilters, followUpBucket: pill.value });
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: isActive ? `1px solid ${pill.activeBg}` : '1px solid #d1d5db',
                  background: isActive ? pill.activeBg : '#ffffff',
                  color: isActive ? pill.activeColor : '#374151',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {pill.label}
              </button>
            );
          })}
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
              {!isSalesRep && <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
              </div>}

              {/* Sort By */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sort By</label>
                <div style={{ position: 'relative', width: '170px' }}>
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
                    <option value="followup-soon">Next Follow-up Soon</option>
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
                    <option value="meta">Meta (Facebook / Instagram)</option>
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social-media">Social Media</option>
                    <option value="campaign">Campaign</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone Call</option>
                    <option value="other">Other</option>
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
              {isAdmin && <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                    {owners.map(o => <option key={o._id} value={o._id}>{o.user?.name || o.employeeId}</option>)}
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>}

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
        {/* Feedback Alert */}
        {bulkFeedback && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: '8px',
            background: bulkFeedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${bulkFeedback.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: bulkFeedback.type === 'success' ? '#065f46' : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
            fontWeight: 500
          }}>
            <span>✓ {bulkFeedback.message}</span>
            <button
              onClick={() => setBulkFeedback(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              <FiX />
            </button>
          </div>
        )}

        {/* Bulk Selection Bar */}
        {selectedLeads.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '10px',
            marginBottom: '16px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                background: '#3b82f6',
                color: 'white',
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700
              }}>
                {selectedLeads.length} Selected
              </span>
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                Manage or route chosen leads to team
              </span>
              <button
                onClick={() => setSelectedLeads([])}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '12px',
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                Deselect All
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-sm"
                onClick={() => setShowWhatsAppBroadcastModal(true)}
                disabled={bulkProcessing}
                style={{
                  background: '#25D366',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FaWhatsapp size={15} /> WhatsApp Broadcast ({selectedLeads.length})
              </button>

              <button
                className="btn btn-sm"
                onClick={handleBulkAiCall}
                disabled={bulkProcessing}
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FiCpu size={14} /> AI Call ({selectedLeads.length})
              </button>

              <button
                className="btn btn-sm"
                onClick={() => setShowBulkAssignModal(true)}
                disabled={bulkProcessing}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FiUsers /> Assign to Sales Rep
              </button>

              <select
                onChange={(e) => {
                  if (e.target.value) handleBulkStatusChange(e.target.value);
                }}
                disabled={bulkProcessing}
                defaultValue=""
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: '#334155',
                  color: 'white',
                  border: '1px solid #475569',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <option value="" disabled>Change Status...</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>

              {isAdmin && (
                <button
                  className="btn btn-sm"
                  onClick={handleBulkDelete}
                  disabled={bulkProcessing}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                >
                  Delete ({selectedLeads.length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bulk Assign Modal */}
        <Modal
          isOpen={showBulkAssignModal}
          onClose={() => setShowBulkAssignModal(false)}
          title={`Assign ${selectedLeads.length} Lead(s) to Sales Representative`}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px' }}>
              Select a team member. Once assigned, these leads will strictly appear in their <strong>"My Leads"</strong> panel and will not be visible to other sales reps.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Select Sales Representative:
              </label>
              <select
                value={bulkEmployeeId}
                onChange={(e) => setBulkEmployeeId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: 'white'
                }}
              >
                <option value="">-- Choose Employee (e.g. Prasant) --</option>
                {owners.map((owner) => (
                  <option key={owner._id} value={owner._id}>
                    {owner.user?.name || owner.employeeId} ({owner.designation || 'Sales'}) - {owner.user?.email || owner.employeeId}
                  </option>
                ))}
              </select>
              {owners.length === 0 && (
                <span style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                  No active sales employees found. Please check HRM &gt; Employees and ensure Department is set to "Sales".
                </span>
              )}
            </div>

            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '13px',
              color: '#1e40af',
              marginBottom: '20px'
            }}>
              <strong>🔒 Role-based Data Privacy:</strong> When you assign these {selectedLeads.length} leads, the employee receives an instant in-app notification and only they can make calls, schedule follow-ups, or edit these records.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowBulkAssignModal(false)}
                disabled={bulkProcessing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleBulkAssign}
                disabled={!bulkEmployeeId || bulkProcessing}
                style={{ minWidth: '140px' }}
              >
                {bulkProcessing ? 'Assigning...' : `Assign ${selectedLeads.length} Leads`}
              </button>
            </div>
          </div>
        </Modal>

        {initialLoading ? <Loader /> : (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ fontSize: '13px', color: '#4b5563' }}>
                Showing <strong>{leads.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</strong> - <strong>{Math.min(pagination.page * pagination.limit, pagination.total || leads.length)}</strong> of <strong>{pagination.total || leads.length}</strong> leads
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#4b5563' }}>
                  <span>Rows per page:</span>
                  <select
                    value={pagination.limit}
                    onChange={(e) => setPagination(prev => ({ ...prev, page: 1, limit: Number(e.target.value) }))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      background: 'white',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                  </select>
                </div>
                {pagination.pages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      Prev
                    </button>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      className="btn btn-sm btn-secondary"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="table-container-responsive">
              <LeadTable
                leads={leads}
                selectedLeads={selectedLeads}
                onSelectLeads={setSelectedLeads}
                onDelete={handleDelete}
                canDelete={isAdmin}
                pagination={pagination}
                onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
                loading={loading}
              />
            </div>
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

      <MetaAdsModal
        isOpen={showMetaModal}
        onClose={() => setShowMetaModal(false)}
        onLeadCreated={() => fetchLeads(false)}
      />

      <WhatsAppBroadcastModal
        isOpen={showWhatsAppBroadcastModal}
        onClose={() => setShowWhatsAppBroadcastModal(false)}
        selectedItems={leads.filter(l => selectedLeads.includes(l._id))}
        onSuccess={() => {
          fetchLeads(false);
          setSelectedLeads([]);
        }}
      />
    </div>
  );
};

export default LeadList;
