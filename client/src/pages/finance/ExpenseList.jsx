import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiFilter, FiX, FiChevronDown, FiChevronUp, FiRefreshCw, FiDollarSign, FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi';
import { financeService } from '../../services/financeService';
import ExpenseTable from '../../components/Finance/ExpenseTable';
import Loader from '../../components/common/Loader';
import '../../styles/finance/invoice-form-modern.css';
import '../../styles/finance/expenses-modern.css';

const ExpenseList = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // Split state for Search (Instant/Debounced) vs Filters (Manual Apply)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // UI State for inputs
  const [filterInputs, setFilterInputs] = useState({
    category: '',
    status: '',
    vendor: '',
    dateFrom: '',
    dateTo: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const buttonRef = useRef(null);

  // API State for active filters
  const [activeFilters, setActiveFilters] = useState({
    category: '',
    status: '',
    vendor: '',
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

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  // Initial load
  useEffect(() => {
    fetchExpenses(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch when Debounced Search OR Active Filters change (NOT inputs)
  useEffect(() => {
    if (!initialLoading) {
      fetchExpenses(false);
    }
  }, [debouncedSearch, activeFilters, pagination.page]);

  const fetchExpenses = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setInitialLoading(true);
      else setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        ...activeFilters
      };

      const res = await financeService.getExpenses(params);
      if (res.data.success) {
        setExpenses(res.data.data || []);
        setPagination({ ...pagination, total: res.data.total || 0, pages: res.data.pages || 0 });
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
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
    const resetState = { category: '', status: '', vendor: '', dateFrom: '', dateTo: '' };
    setFilterInputs(resetState);
    setActiveFilters(resetState);
    setSearchQuery('');
  };

  const getActiveCount = () => {
    // Count non-empty values
    let count = 0;
    if (filterInputs.category) count++;
    if (filterInputs.status) count++;
    if (filterInputs.vendor) count++;
    if (filterInputs.dateFrom) count++;
    return count;
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await financeService.deleteExpense(id);
        fetchExpenses();
      } catch (error) {
        alert('Failed to delete expense');
      }
    }
  };

  return (
    <div className="invoice-list-page">
      {/* Header Row */}
      <div className="timesheets-page-header">
        <div className="title-text">
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Manage and track all company expenses • {pagination.total} total</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => fetchExpenses(false)} disabled={loading}>
            <FiRefreshCw className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/finance/expenses/new')}>
            <FiPlus /> Add Expense
          </button>
          <button
            ref={buttonRef}
            className="btn btn-outline"
            onClick={() => setShowFilters(!showFilters)}
            style={{
              background: showFilters ? '#eff6ff' : 'white',
              borderColor: showFilters ? '#3b82f6' : 'var(--border)',
              color: showFilters ? '#2563eb' : 'var(--text-primary)',
              minWidth: '110px'
            }}
          >
            <FiFilter /> Filters {showFilters ? <FiChevronUp /> : <FiChevronDown />}
            {(getActiveCount() > 0) && (
              <span style={{
                background: '#3b82f6',
                color: 'white',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 700,
                marginLeft: '4px'
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
        padding: '0 24px',
        marginBottom: '24px'
      }}>
        {/* Total Expenses */}
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
              {expenses.length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Total Expenses
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
              ₹{expenses.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Total Amount
            </div>
          </div>
        </div>

        {/* Approved */}
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
              {expenses.filter(e => e.status === 'approved' || e.status === 'paid').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Approved
            </div>
          </div>
        </div>

        {/* Pending */}
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
              {expenses.filter(e => e.status === 'pending').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Pending
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ position: 'relative', zIndex: 50, padding: '0 24px', marginBottom: '16px' }}>
        {/* Search Bar */}
        <div className="search-bar-section" style={{ marginBottom: '16px' }}>
          <div className="toolbar-search" style={{ margin: 0, width: '100%', maxWidth: '320px' }}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {showFilters && (
          <div className="filter-panel-overlay fade-in" ref={filterRef}>
            <div className="filter-panel-row">
              <div className="filter-group">
                <label className="filter-group-label">Status</label>
                <div className="filter-select-wrapper">
                  <select
                    className="filter-input"
                    value={filterInputs.status}
                    onChange={(e) => setFilterInputs({ ...filterInputs, status: e.target.value })}
                  >
                    <option value="">All Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <FiChevronDown className="select-icon" />
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-group-label">Category</label>
                <div className="filter-select-wrapper">
                  <select
                    className="filter-input"
                    value={filterInputs.category}
                    onChange={(e) => setFilterInputs({ ...filterInputs, category: e.target.value })}
                  >
                    <option value="">All Categories</option>
                    <option value="hosting">Hosting</option>
                    <option value="domain">Domain</option>
                    <option value="travel">Travel</option>
                    <option value="tools">Tools & Software</option>
                    <option value="training">Training</option>
                    <option value="hardware">Hardware</option>
                    <option value="internet">Internet</option>
                    <option value="server">Server Charges</option>
                    <option value="marketing">Marketing</option>
                    <option value="office">Office Supplies</option>
                    <option value="other">Misc</option>
                  </select>
                  <FiChevronDown className="select-icon" />
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-group-label">Vendor</label>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Vendor Name"
                  value={filterInputs.vendor}
                  onChange={(e) => setFilterInputs({ ...filterInputs, vendor: e.target.value })}
                />
              </div>

              <div className="filter-group">
                <label className="filter-group-label">Date Range</label>
                <div className="filter-date-inputs">
                  <input
                    type="date"
                    className="filter-input date-input"
                    value={filterInputs.dateFrom}
                    onChange={(e) => setFilterInputs({ ...filterInputs, dateFrom: e.target.value })}
                  />
                  <span className="date-separator">→</span>
                  <input
                    type="date"
                    className="filter-input date-input"
                    value={filterInputs.dateTo}
                    onChange={(e) => setFilterInputs({ ...filterInputs, dateTo: e.target.value })}
                  />
                </div>
              </div>

              <div className="filter-panel-actions">
                <button className="btn btn-text" onClick={handleClearFilters}>
                  Clear All
                </button>
                <button className="btn btn-primary" onClick={() => { handleApplyFilters(); setShowFilters(false); }}>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {initialLoading ? <Loader /> : (
        <div className="table-container-responsive">
          <ExpenseTable
            expenses={expenses}
            onDelete={handleDelete}
            pagination={pagination}
            onPageChange={(p) => setPagination({ ...pagination, page: p })}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
