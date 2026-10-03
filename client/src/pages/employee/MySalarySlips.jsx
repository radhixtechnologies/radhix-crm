import { useState, useEffect, useRef } from 'react';
import { FiDownload, FiSearch, FiCalendar, FiCheckCircle, FiClock, FiDollarSign, FiFilter, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import { financeService } from '../../services/financeService';
import Loader from '../../components/common/Loader';
import '../../styles/employee/salary-slips.css';
import '../../styles/finance/expenses.css';

const MySalarySlips = () => {
  const [salarySlips, setSalarySlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    month: '',
    year: '',
    // year: new Date().getFullYear().toString(), // Optionally default to current year
  });

  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    fetchSalarySlips();
  }, [filters]);

  const fetchSalarySlips = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
      };
      if (!params.month) delete params.month;
      if (!params.year) delete params.year;

      const res = await financeService.getSalarySlips(params);
      if (res.data.success) {
        setSalarySlips(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching salary slips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (pdfUrl) => {
    if (pdfUrl) {
      financeService.downloadSalarySlip(pdfUrl);
    } else {
      alert('PDF not available');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', class: 'badge-warning', icon: <FiClock /> },
      processed: { label: 'Processed', class: 'badge-info', icon: <FiCheckCircle /> },
      paid: { label: 'Paid', class: 'badge-success', icon: <FiDollarSign /> },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`badge ${config.class}`} title={status}>
        {config.icon} {config.label}
      </span>
    );
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthName = (month) => {
    return months[month - 1] || '';
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toFixed(2) || '0.00'}`;
  };

  return (
    <div className="expense-list-page">
      {/* Header Row */}
      <div className="expenses-page-header">
        <div className="header-title-group">
          <h1 className="page-title">My Salary Slips</h1>
          <p className="page-subtitle">View and download your salary slips</p>
        </div>
        <div className="header-actions">
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
            {(filters.month || filters.year) && (
              <span style={{
                background: '#3b82f6',
                color: 'white',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 700
              }}>
                {(filters.month ? 1 : 0) + (filters.year ? 1 : 0)}
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
        {/* Total Slips */}
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
            <FiCalendar />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {salarySlips.length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Total Slips
            </div>
          </div>
        </div>

        {/* YTD Net */}
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
            <FiDollarSign />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {formatCurrency(salarySlips.reduce((sum, s) => sum + (s.netSalary || 0), 0))}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              YTD Net Salary
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
              {salarySlips.filter(s => s.status === 'pending').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Pending
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
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
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
              {salarySlips.filter(s => s.status === 'paid').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Paid
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar Section (Mobile) */}
      <div className="search-bar-section" style={{ marginBottom: '16px', display: 'none' }}>
        <div className="toolbar-search" style={{ margin: 0, width: '100%', maxWidth: '280px' }}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search salary slips..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
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
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
              {(filters.month || filters.year) && (
                <span style={{
                  background: '#3b82f6',
                  color: 'white',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 700
                }}>
                  {(filters.month ? 1 : 0) + (filters.year ? 1 : 0)}
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

              {/* Month */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Month</label>
                <div style={{ position: 'relative', width: '180px' }}>
                  <select
                    value={filters.month}
                    onChange={(e) => setFilters({ ...filters, month: e.target.value })}
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
                    <option value="">All Months</option>
                    {months.map((month, index) => (
                      <option key={index} value={index + 1}>{month}</option>
                    ))}
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Year */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Year</label>
                <input
                  type="number"
                  placeholder="Year"
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  min="2020"
                  max="2099"
                  style={{
                    width: '120px',
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

              {/* Actions */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', height: '38px' }}>
                <button
                  onClick={() => setFilters({ ...filters, month: '', year: '' })}
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
                  onClick={() => setShowFilters(false)}
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
                  Done
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Visual Divider */}
      <div style={{ height: '1px', background: '#e5e7eb', margin: '0' }}></div>

      <div className="page-content">
        {loading ? (
          <Loader />
        ) : (
          <div className="salary-slip-cards">
            {salarySlips.length === 0 ? (
              <div className="empty-state">
                <FiCalendar size={48} />
                <h3>No Salary Slips Found</h3>
                <p>Your salary slips will appear here once they are generated</p>
              </div>
            ) : (
              salarySlips.map((slip) => (
                <div key={slip._id} className="salary-slip-card">
                  <div className="card-header">
                    <div>
                      <h3>{getMonthName(slip.month)} {slip.year}</h3>
                      <p className="card-subtitle">
                        Generated on {new Date(slip.generatedAt).toLocaleDateString()}
                      </p>
                      <div style={{ marginTop: '8px' }}>
                        {getStatusBadge(slip.status || 'pending')}
                      </div>
                    </div>
                    {slip.pdfUrl && (
                      <button
                        className="btn btn-icon btn-primary"
                        onClick={() => handleDownload(slip.pdfUrl)}
                        title="Download PDF"
                      >
                        <FiDownload /> Download
                      </button>
                    )}
                  </div>

                  <div className="card-body">
                    <div className="salary-breakdown">
                      <div className="breakdown-section earnings-section">
                        <h4>Earnings</h4>
                        <div className="breakdown-item">
                          <span>Basic Salary:</span>
                          <span>{formatCurrency(slip.earnings?.basic)}</span>
                        </div>
                        {slip.earnings?.hra > 0 && (
                          <div className="breakdown-item">
                            <span>HRA:</span>
                            <span>{formatCurrency(slip.earnings?.hra)}</span>
                          </div>
                        )}
                        {slip.earnings?.allowances > 0 && (
                          <div className="breakdown-item">
                            <span>Allowances:</span>
                            <span>{formatCurrency(slip.earnings?.allowances)}</span>
                          </div>
                        )}
                        {slip.earnings?.bonus > 0 && (
                          <div className="breakdown-item">
                            <span>Bonus:</span>
                            <span>{formatCurrency(slip.earnings?.bonus)}</span>
                          </div>
                        )}
                        {slip.earnings?.overtime > 0 && (
                          <div className="breakdown-item">
                            <span>Overtime Pay:</span>
                            <span>{formatCurrency(slip.earnings?.overtime)}</span>
                          </div>
                        )}
                        <div className="breakdown-total">
                          <span>Total Earnings:</span>
                          <span className="earnings">{formatCurrency(slip.earnings?.totalEarnings)}</span>
                        </div>
                      </div>

                      <div className="breakdown-section deductions-section">
                        <h4>Deductions</h4>
                        {slip.deductions?.pf > 0 && (
                          <div className="breakdown-item">
                            <span>PF:</span>
                            <span>{formatCurrency(slip.deductions?.pf)}</span>
                          </div>
                        )}
                        {slip.deductions?.tax > 0 && (
                          <div className="breakdown-item">
                            <span>Tax:</span>
                            <span>{formatCurrency(slip.deductions?.tax)}</span>
                          </div>
                        )}
                        {slip.deductions?.esi > 0 && (
                          <div className="breakdown-item">
                            <span>ESI:</span>
                            <span>{formatCurrency(slip.deductions?.esi)}</span>
                          </div>
                        )}
                        {slip.deductions?.loan > 0 && (
                          <div className="breakdown-item">
                            <span>Loan:</span>
                            <span>{formatCurrency(slip.deductions?.loan)}</span>
                          </div>
                        )}
                        {slip.deductions?.unpaidLeave > 0 && (
                          <div className="breakdown-item">
                            <span>Unpaid Leave:</span>
                            <span>{formatCurrency(slip.deductions?.unpaidLeave)}</span>
                          </div>
                        )}
                        {slip.deductions?.other > 0 && (
                          <div className="breakdown-item">
                            <span>Other Deductions:</span>
                            <span>{formatCurrency(slip.deductions?.other)}</span>
                          </div>
                        )}
                        <div className="breakdown-total">
                          <span>Total Deductions:</span>
                          <span className="deductions">{formatCurrency(slip.deductions?.totalDeductions)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="net-salary-box">
                      <span>Net Salary:</span>
                      <span className="net-salary">{formatCurrency(slip.netSalary)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MySalarySlips;

