import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiPlus, FiDownload, FiSearch, FiCalendar, FiMail, FiCheckCircle, FiClock, FiDollarSign, FiTrash2, FiUsers, FiTrendingUp, FiCreditCard } from 'react-icons/fi';
import { financeService } from '../../services/financeService';
import Loader from '../../components/common/Loader';
import '../../styles/finance/salary-slip.css';
import '../../styles/finance/expenses.css';

const SalarySlipList = () => {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin, user } = useAuth();

  // Debug: Check role values
  useEffect(() => {
    console.log('SalarySlipList - User role:', user?.role, 'isAdmin:', isAdmin, 'isSuperAdmin:', isSuperAdmin);
  }, [user, isAdmin, isSuperAdmin]);
  const [salarySlips, setSalarySlips] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    month: '',
    year: '',
    employeeId: '',
    status: '',
  });

  // Initial load
  useEffect(() => {
    fetchSalarySlips(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug: Check role values on mount
  useEffect(() => {
    console.log('SalarySlipList mounted - User role:', user?.role, 'isAdmin:', isAdmin, 'isSuperAdmin:', isSuperAdmin);
  }, []);

  // Debounce search and filter changes
  useEffect(() => {
    if (initialLoading) return; // Skip if initial load hasn't completed

    const timeout = setTimeout(() => {
      fetchSalarySlips(false);
    }, filters.search ? 500 : 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchSalarySlips = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }
      const params = {
        ...filters,
      };
      if (!params.month) delete params.month;
      if (!params.year) delete params.year;
      if (!params.employeeId) delete params.employeeId;

      const res = await financeService.getSalarySlips(params);
      if (res.data.success) {
        setSalarySlips(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching salary slips:', error);
    } finally {
      if (isInitialLoad) {
        setInitialLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleDownload = (pdfUrl) => {
    if (pdfUrl) {
      financeService.downloadSalarySlip(pdfUrl);
    } else {
      alert('PDF not available');
    }
  };

  const handleSendEmail = async (id) => {
    if (!window.confirm('Send salary slip email to employee?')) {
      return;
    }

    try {
      setLoading(true);
      const res = await financeService.sendSalarySlipEmail(id);
      if (res.data.success) {
        alert('Salary slip email sent successfully!');
        fetchSalarySlips(false);
      } else {
        alert(res.data.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending salary slip email:', error);
      alert(error.response?.data?.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    const statusLabels = {
      pending: 'Pending',
      processed: 'Processed',
      paid: 'Paid',
    };

    if (!window.confirm(`Mark salary slip as ${statusLabels[newStatus]}?`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await financeService.updateSalarySlipStatus(id, newStatus);
      if (res.data.success) {
        alert(`Salary slip status updated to ${statusLabels[newStatus]} successfully!`);
        fetchSalarySlips(false);
      } else {
        alert(res.data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating salary slip status:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
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
          <h1 className="page-title">Salary Slips</h1>
          <p className="page-subtitle">
            {isAdmin && 'View and manage employee salary slips. Generate salary slips for employees only.'}
            {isSuperAdmin && 'View and manage admin salary slips. Generate salary slips for admins only.'}
          </p>
        </div>
        <div className="header-actions">
          {(isAdmin || isSuperAdmin) && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                console.log('Generate Salary Slip button clicked, navigating to /finance/salary-slips/generate');
                navigate('/finance/salary-slips/generate');
              }}
            >
              <FiPlus /> Generate Salary Slip
            </button>
          )}
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
            <FiUsers />
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

        {/* Total Earnings */}
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
              {formatCurrency(salarySlips.reduce((sum, s) => sum + (s.earnings?.totalEarnings || 0), 0))}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Total Earnings
            </div>
          </div>
        </div>

        {/* Net Salary */}
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
              {formatCurrency(salarySlips.reduce((sum, s) => sum + (s.netSalary || 0), 0))}
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
              {salarySlips.filter(s => s.status === 'paid').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Paid
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Toolbar */}
      <div className="expenses-toolbar-horizontal">
        <div className="toolbar-search">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by employee name or ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            disabled={loading}
          />
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-select">
          <select
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            disabled={loading}
          >
            <option value="">All Months</option>
            {months.map((month, index) => (
              <option key={index} value={index + 1}>{month}</option>
            ))}
          </select>
        </div>

        <div className="toolbar-select">
          <input
            type="number"
            placeholder="Year"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            min="2020"
            max="2099"
            disabled={loading}
            style={{
              height: "40px",
              padding: "0 12px",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "13px",
              minWidth: "120px"
            }}
          />
        </div>
      </div>

      {initialLoading ? (
        <Loader />
      ) : (
        <div className="page-content">
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
            {!loading && (
              <div className="salary-slip-table-container">
                {salarySlips.length === 0 ? (
                  <div className="empty-state">
                    <FiCalendar size={48} />
                    <h3>No Salary Slips Found</h3>
                    <p>Generate a new salary slip to get started</p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        console.log('Generate Salary Slip button clicked (empty state), navigating to /finance/salary-slips/generate');
                        navigate('/finance/salary-slips/generate');
                      }}
                    >
                      <FiPlus /> Generate Salary Slip
                    </button>
                  </div>
                ) : (
                  <table className="salary-slip-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Employee ID</th>
                        <th>Month</th>
                        <th>Year</th>
                        <th>Total Earnings</th>
                        <th>Total Deductions</th>
                        <th>Net Salary</th>
                        <th>Payment Date</th>
                        <th>Status</th>
                        <th>Generated Date</th>
                        <th>Email Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salarySlips.map((slip) => (
                        <tr key={slip._id}>
                          <td>{slip.employee?.user?.name || 'N/A'}</td>
                          <td>{slip.employee?.employeeId || 'N/A'}</td>
                          <td>{getMonthName(slip.month)}</td>
                          <td>{slip.year}</td>
                          <td className="earnings">{formatCurrency(slip.earnings?.totalEarnings)}</td>
                          <td className="deductions">{formatCurrency(slip.deductions?.totalDeductions)}</td>
                          <td className="net-salary">{formatCurrency(slip.netSalary)}</td>
                          <td>
                            {slip.paymentDate
                              ? new Date(slip.paymentDate).toLocaleDateString()
                              : <span className="text-muted">Not set</span>
                            }
                          </td>
                          <td>
                            {getStatusBadge(slip.status || 'pending')}
                            {(isAdmin || isSuperAdmin) && (
                              <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {slip.status !== 'pending' && (
                                  <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => handleStatusUpdate(slip._id, 'pending')}
                                    title="Mark as Pending"
                                    style={{ fontSize: '11px', padding: '4px 8px' }}
                                  >
                                    Pending
                                  </button>
                                )}
                                {slip.status !== 'processed' && (
                                  <button
                                    className="btn btn-sm btn-info"
                                    onClick={() => handleStatusUpdate(slip._id, 'processed')}
                                    title="Mark as Processed"
                                    style={{ fontSize: '11px', padding: '4px 8px' }}
                                  >
                                    Processed
                                  </button>
                                )}
                                {slip.status !== 'paid' && (
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleStatusUpdate(slip._id, 'paid')}
                                    title="Mark as Paid"
                                    style={{ fontSize: '11px', padding: '4px 8px' }}
                                  >
                                    Paid
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td>{new Date(slip.generatedAt).toLocaleDateString()}</td>
                          <td>
                            {slip.emailSent ? (
                              <span className="badge badge-success" title={`Sent on ${new Date(slip.emailSentAt).toLocaleString()}`}>
                                Sent
                              </span>
                            ) : (
                              <span className="badge badge-warning">Not Sent</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {slip.pdfUrl ? (
                                <>
                                  <button
                                    className="btn btn-icon btn-primary"
                                    onClick={() => handleDownload(slip.pdfUrl)}
                                    title="Download PDF"
                                  >
                                    <FiDownload />
                                  </button>
                                  {!slip.emailSent && (isAdmin || isSuperAdmin) && (
                                    <button
                                      className="btn btn-icon btn-success"
                                      onClick={() => handleSendEmail(slip._id)}
                                      title="Send Email"
                                    >
                                      <FiMail />
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span className="text-muted">No PDF</span>
                              )}
                              {(isAdmin || isSuperAdmin) && (
                                <button
                                  className="btn btn-icon btn-error"
                                  onClick={async () => {
                                    if (window.confirm('Are you sure you want to delete this salary slip?')) {
                                      try {
                                        setLoading(true);
                                        await financeService.deleteSalarySlip(slip._id);
                                        alert('Salary slip deleted successfully');
                                        fetchSalarySlips(false);
                                      } catch (error) {
                                        console.error('Error deleting salary slip:', error);
                                        alert(error.response?.data?.message || 'Failed to delete salary slip');
                                      } finally {
                                        setLoading(false);
                                      }
                                    }
                                  }}
                                  title="Delete"
                                >
                                  <FiTrash2 />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalarySlipList;

