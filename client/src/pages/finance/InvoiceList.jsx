import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiChevronUp,
  FiChevronDown,
  FiFileText,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';
import { financeService } from '../../services/financeService';
import InvoiceTable from '../../components/Finance/InvoiceTable';
import Loader from '../../components/common/Loader';
import '../../styles/finance/invoices.css';

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    paid: 0,
    overdue: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0
  });

  // Buffered Filter State
  const [filterInputs, setFilterInputs] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: '',
  });

  // Active API Filters
  const [activeFilters, setActiveFilters] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: '',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const buttonRef = useRef(null);

  // Initial load
  useEffect(() => {
    fetchInvoices(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search and filter changes
  // Debounce search and filter changes
  useEffect(() => {
    if (initialLoading) return; // Skip if initial load hasn't completed

    // For search, we still want instant feedback or debounce on activeFilters.search? 
    // Wait, the new pattern uses filterInputs for search input and activeFilters for fetch.
    // If we want auto-search like LeadList, we need a separate debouncedSearch state or just use activeFilters.search via effect?
    // Let's mirror LeadList: separate debouncedSearch state derived from filterInputs.search.
    // OR simplify: search triggers fetch via activeFilters/debounce.
    // Let's stick to the pattern: filterInputs.search updates state. useEffect debounces it to setDebouncedSearch (if used) OR we just simpler logical:

    const timeout = setTimeout(() => {
      // If search input changed, we might want to auto-fetch?
      // LeadList uses `debouncedSearch` state. Let's add that logic back if needed, but for now let's assume `activeFilters` drives fetch.
      // Actually, standard pattern: Search -> updates filterInputs.search -> Debounce effect -> updates activeFilters.search?
      // OR Search -> updates activeFilters.search directly (debounce wrapped).
      // Let's just use the `fetchInvoices` call directly in effect derived from simple dependency.

      // Let's assume search is part of 'activeFilters' for the API call.
      // But we want search to be typed without fetch, then fetch on debounce.
      // MIX: FilterInputs has search. Effect watches FilterInputs.search -> Debounce -> Update ActiveFilters.search?
      // SIMPLIFICATION: just fetch when activeFilters changes.
      // BUT we need to update activeFilters.search when typing stops.

      // Let's just use the existing logic but map it to activeFilters
      fetchInvoices(false);
    }, activeFilters.search ? 500 : 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, activeFilters]);

  const fetchInvoices = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...activeFilters,
      };

      const res = await financeService.getInvoices(params);
      if (res.data.success) {
        const invoiceData = res.data.data || [];
        setInvoices(invoiceData);
        setPagination({
          ...pagination,
          total: res.data.total || 0,
          pages: res.data.pages || 0,
        });

        // Calculate statistics
        const stats = {
          total: invoiceData.length,
          draft: invoiceData.filter(inv => inv.status === 'draft').length,
          sent: invoiceData.filter(inv => inv.status === 'sent').length,
          paid: invoiceData.filter(inv => inv.status === 'paid').length,
          overdue: invoiceData.filter(inv => inv.status === 'overdue').length,
          totalAmount: invoiceData.reduce((sum, inv) => sum + (inv.total || 0), 0),
          paidAmount: invoiceData.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0),
          pendingAmount: invoiceData.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0)
        };
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      if (isInitialLoad) {
        setInitialLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await financeService.deleteInvoice(id);
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice');
      }
    }
  };

  const handleSendEmail = async (id) => {
    try {
      await financeService.sendInvoiceEmail(id);
      alert('Invoice email sent successfully');
      fetchInvoices();
    } catch (error) {
      console.error('Error sending email:', error);
      alert(error.response?.data?.message || 'Failed to send email');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await financeService.updateInvoiceStatus(id, status);
      alert(`Invoice status updated to ${status.toUpperCase()}`);
      fetchInvoices();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      // Helper function to construct full PDF URL
      const getFullPdfUrl = (pdfUrl) => {
        if (!pdfUrl) return null;
        if (pdfUrl.startsWith('http')) return pdfUrl;
        // Ensure pdfUrl starts with / if it doesn't already
        const normalizedUrl = pdfUrl.startsWith('/') ? pdfUrl : '/' + pdfUrl;
        return `${apiUrl}${normalizedUrl}`;
      };

      // Check if PDF exists, if not generate it
      if (!invoice.pdfUrl) {
        console.log('[InvoiceList] PDF not found, generating...');
        const generateRes = await financeService.generateInvoicePDF(invoice._id);

        if (generateRes.data.success && generateRes.data.data.pdfUrl) {
          // Use the PDF URL from the generation response
          const pdfUrl = generateRes.data.data.pdfUrl;
          const fullUrl = getFullPdfUrl(pdfUrl);
          console.log('[InvoiceList] PDF generated, opening:', fullUrl);

          if (fullUrl) {
            window.open(fullUrl, '_blank');
            // Refetch invoice to update the list
            fetchInvoices();
          } else {
            throw new Error('Invalid PDF URL received');
          }
        } else {
          // Refetch invoice to get PDF URL
          const res = await financeService.getInvoice(invoice._id);
          if (res.data.success && res.data.data.pdfUrl) {
            const fullUrl = getFullPdfUrl(res.data.data.pdfUrl);
            console.log('[InvoiceList] PDF URL from refetch:', fullUrl);
            if (fullUrl) {
              window.open(fullUrl, '_blank');
            } else {
              throw new Error('Invalid PDF URL from refetch');
            }
          } else {
            throw new Error('Failed to get PDF URL after generation');
          }
        }
      } else {
        const fullUrl = getFullPdfUrl(invoice.pdfUrl);
        console.log('[InvoiceList] PDF exists, opening:', fullUrl);
        if (fullUrl) {
          window.open(fullUrl, '_blank');
        } else {
          throw new Error('Invalid PDF URL');
        }
      }
    } catch (error) {
      console.error('[InvoiceList] Error downloading PDF:', error);
      alert(error.response?.data?.message || error.message || 'Failed to download PDF');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };



  const clearFilters = () => {
    const resetState = { status: '', search: '', startDate: '', endDate: '' };
    setFilterInputs(resetState);
    setActiveFilters(resetState);
    setPagination({ ...pagination, page: 1 });
  };

  const handleApplyFilters = () => {
    setActiveFilters({ ...filterInputs }); // Search is already synced if we handle it right, but here we overwrite everything from inputs
    setPagination({ ...pagination, page: 1 });
    setShowFilters(false);
  };

  const getActiveCount = () => {
    let count = 0;
    if (filterInputs.status) count++;
    if (filterInputs.startDate) count++;
    return count;
  };

  // Auto-sync search from inputs to active (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveFilters(prev => ({ ...prev, search: filterInputs.search }));
    }, 500);
    return () => clearTimeout(timer);
  }, [filterInputs.search]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchInvoices(false);
  };

  return (
    <div className="timesheets-list-page fade-in">
      {/* Header Row */}
      <div className="timesheets-page-header">
        <div className="header-title-group">
          <div className="title-text">
            <h1 className="page-title">Invoices</h1>
            <p className="page-subtitle">
              Manage and track all invoices • {pagination.total} total invoices
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-outline"
            onClick={handleRefresh}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <FiRefreshCw className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/finance/invoices/new')}>
            <FiPlus /> Create Invoice
          </button>
          <button
            ref={buttonRef}
            className="btn filter-btn-mobile"
            onClick={() => setShowFilters(!showFilters)}
            disabled={loading}
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

      {/* Statistics Cards */}
      {!initialLoading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          padding: '0 24px',
          marginBottom: '24px'
        }}>
          {/* Total Invoices */}
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
                {statistics.total}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                Total Invoices
              </div>
            </div>
          </div>

          {/* Total Amount */}
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
              <FiDollarSign />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                {formatCurrency(statistics.totalAmount)}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                Total Value
              </div>
            </div>
          </div>

          {/* Paid Amount */}
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
                {formatCurrency(statistics.paidAmount)}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                Received
              </div>
            </div>
          </div>

          {/* Pending Amount */}
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
                {formatCurrency(statistics.pendingAmount)}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                Outstanding
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 50, padding: '0 24px', marginBottom: '16px' }}>
        {/* Search Bar Section */}
        <div className="search-bar-section" style={{ marginBottom: '16px' }}>
          <div className="toolbar-search" style={{ margin: 0, width: '100%', maxWidth: '320px' }}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by invoice number or client..."
              value={filterInputs.search}
              onChange={(e) => setFilterInputs({ ...filterInputs, search: e.target.value })}
              disabled={loading}
            />
          </div>
        </div>

        {showFilters && (
          <div className="filter-panel-overlay fade-in" ref={filterRef} style={{
            position: 'absolute',
            top: '100%',
            left: '24px',
            width: 'calc(100% - 48px)',
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                <div style={{ position: 'relative', width: '160px' }}>
                  <select
                    value={filterInputs.status}
                    onChange={(e) => setFilterInputs({ ...filterInputs, status: e.target.value })}
                    disabled={loading}
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
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Range</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="date"
                    value={filterInputs.startDate}
                    onChange={(e) => setFilterInputs({ ...filterInputs, startDate: e.target.value })}
                    disabled={loading}
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
                  <span style={{ color: '#9ca3af', fontWeight: 500 }}>→</span>
                  <input
                    type="date"
                    value={filterInputs.endDate}
                    onChange={(e) => setFilterInputs({ ...filterInputs, endDate: e.target.value })}
                    disabled={loading}
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

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', height: '38px' }}>
                <button
                  onClick={clearFilters}
                  disabled={loading}
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
                  disabled={loading}
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

      {/* Visual Divider */}


      {/* Content */}
      <div style={{ padding: '0 0px' }}>
        {initialLoading ? (
          <Loader />
        ) : (
          <div style={{ position: 'relative' }}>
            {loading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                borderRadius: '8px',
                minHeight: '200px'
              }}>
                <Loader />
              </div>
            )}
            <InvoiceTable
              invoices={invoices}
              onDelete={handleDelete}
              onSendEmail={handleSendEmail}
              onStatusChange={handleStatusChange}
              onDownloadPDF={handleDownloadPDF}
              loading={loading}
              onPageChange={handlePageChange}
              pagination={pagination}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;

