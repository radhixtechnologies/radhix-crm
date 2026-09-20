import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiDownload, FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiRefreshCw, FiUsers, FiDollarSign, FiCheckCircle, FiCreditCard } from 'react-icons/fi';
import { financeService } from '../../services/financeService';
import Loader from '../../components/common/Loader';
import { formatCurrency } from '../../utils/format';
import '../../styles/finance/invoice-form-modern.css';
import '../../styles/finance/payments-modern.css';

const PayrollList = () => {
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  // Buffered Filter State
  const [filterInputs, setFilterInputs] = useState({
    month: '',
    year: '',
    employee: ''
  });

  // Active API Filters
  const [activeFilters, setActiveFilters] = useState({
    month: '',
    year: '',
    employee: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const buttonRef = useRef(null);

  // Search query state (visual primarily, or used for employee filtering)
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPayrolls();
  }, [activeFilters]);

  // Handle outside click for filters
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const res = await financeService.getPayrolls(activeFilters);
      if (res.data.success) {
        setPayrolls(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id) => {
    try {
      await financeService.generatePayrollPDF(id);
      financeService.downloadPayslip(id);
    } catch (error) {
      alert('Failed to generate payslip');
    }
  };

  const handleApplyFilters = () => {
    setActiveFilters({ ...filterInputs });
    setShowFilters(false);
  };

  const clearFilters = () => {
    const reset = { month: '', year: '', employee: '' };
    setFilterInputs(reset);
    setActiveFilters(reset);
    setSearchQuery('');
  };

  const getActiveCount = () => {
    let count = 0;
    if (filterInputs.month) count++;
    if (filterInputs.year) count++;
    if (filterInputs.employee) count++;
    return count;
  };

  if (loading) return <Loader />;

  return (
    <div className="invoice-list-page fade-in">
      <div className="timesheets-page-header">
        <div className="title-text">
          <h1 className="page-title">Payroll</h1>
          <p className="page-subtitle">Manage employee payrolls • {payrolls.length} total</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => fetchPayrolls()} disabled={loading}>
            <FiRefreshCw className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/finance/payroll/generate')}>
            <FiPlus /> Generate Payroll
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
        {/* Total Payrolls */}
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
              {payrolls.length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Total Payrolls
            </div>
          </div>
        </div>

        {/* Total Gross Salary */}
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
              {formatCurrency(payrolls.reduce((sum, p) => sum + (p.salaryStructure?.grossSalary || 0), 0))}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Gross Salary
            </div>
          </div>
        </div>

        {/* Total Net Salary */}
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
            <FiCreditCard />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {formatCurrency(payrolls.reduce((sum, p) => sum + (p.salaryStructure?.netSalary || 0), 0))}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Net Salary
            </div>
          </div>
        </div>

        {/* Paid */}
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
            <FiCheckCircle />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {payrolls.filter(p => p.status === 'paid').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Paid
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
              placeholder="Search payrolls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {showFilters && (
          <div className="filter-panel-overlay fade-in" ref={filterRef}>
            <div className="filter-panel-row">
              <div className="filter-group">
                <label className="filter-group-label">Month</label>
                <div className="filter-select-wrapper">
                  <select
                    className="filter-input"
                    value={filterInputs.month}
                    onChange={(e) => setFilterInputs({ ...filterInputs, month: e.target.value })}
                  >
                    <option value="">All Months</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                  <FiChevronDown className="select-icon" />
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-group-label">Year</label>
                <div className="filter-select-wrapper">
                  <select
                    className="filter-input"
                    value={filterInputs.year}
                    onChange={(e) => setFilterInputs({ ...filterInputs, year: e.target.value })}
                  >
                    <option value="">All Years</option>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <FiChevronDown className="select-icon" />
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-group-label">Employee ID</label>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Employee ID"
                  value={filterInputs.employee}
                  onChange={(e) => setFilterInputs({ ...filterInputs, employee: e.target.value })}
                />
              </div>

              <div className="filter-panel-actions">
                <button className="btn btn-text" onClick={clearFilters}>
                  Clear All
                </button>
                <button className="btn btn-primary" onClick={handleApplyFilters}>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? <Loader /> : (
        <div className="table-container-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Month/Year</th>
                <th>Gross Salary</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.length > 0 ? (
                payrolls.map((payroll) => (
                  <tr key={payroll._id}>
                    <td>{payroll.employee?.user?.name || 'N/A'}</td>
                    <td>{String(payroll.month).padStart(2, '0')}/{payroll.year}</td>
                    <td>{formatCurrency(payroll.salaryStructure.grossSalary)}</td>
                    <td>{formatCurrency(payroll.salaryStructure.totalDeductions)}</td>
                    <td>{formatCurrency(payroll.salaryStructure.netSalary)}</td>
                    <td>
                      <span className={`badge badge-${payroll.status === 'paid' ? 'success' : 'warning'}`}>
                        {payroll.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon" onClick={() => handleDownload(payroll._id)} title="Download Payslip">
                        <FiDownload />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center empty-state">No payroll records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PayrollList;

