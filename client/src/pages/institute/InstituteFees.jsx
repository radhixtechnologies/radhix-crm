import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiSearch,
  FiEye,
  FiPlus,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import { instituteService } from '../../services/instituteService';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import './InstituteCommon.css';

const InstituteFees = () => {
  const navigate = useNavigate();
  const [fees, setFees] = useState([]);
  const [stats, setStats] = useState({
    totalPayable: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
    overdueCount: 0,
  });
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Payment modal
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'upi',
    transactionReference: '',
    notes: '',
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Load courses & batches
  useEffect(() => {
    instituteService.getCourses({ isActive: 'true' })
      .then((res) => setCourses(res.data?.data || []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    instituteService.getBatches({ course: courseFilter })
      .then((res) => setBatches(res.data?.data || []))
      .catch((err) => console.error(err));
  }, [courseFilter]);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await instituteService.getFees({
        search: search.trim(),
        status: statusFilter,
        course: courseFilter,
        batch: batchFilter,
        limit: 100,
      });
      setFees(res.data?.data || []);
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching fee records:', err);
      setError(err.response?.data?.message || 'Failed to load fee ledger.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, courseFilter, batchFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchFees, 250);
    return () => clearTimeout(timer);
  }, [fetchFees]);

  const handleOpenPayment = (fee) => {
    setSelectedFee(fee);
    setPaymentForm({
      amount: fee.dueAmount || '',
      paymentMethod: 'upi',
      transactionReference: '',
      notes: '',
    });
    setPaymentError('');
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedFee) return;
    setSavingPayment(true);
    setPaymentError('');

    try {
      await instituteService.recordPayment(selectedFee._id, paymentForm);
      setSuccessMsg(`Payment of ₹${paymentForm.amount} recorded successfully for ${selectedFee.student?.name}!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      setSelectedFee(null);
      await fetchFees();
    } catch (err) {
      console.error('Record payment error:', err);
      setPaymentError(err.response?.data?.message || 'Could not record payment.');
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <div className="institute-page">
      <header className="institute-header">
        <div>
          <span className="institute-eyebrow"><FiDollarSign /> FINANCIAL LEDGER</span>
          <h1>Fee Collections & Dues</h1>
          <p>Track student tuition fee schedules, installment milestones, and payment receipts.</p>
        </div>
      </header>

      {successMsg && <div className="institute-alert institute-alert--success">{successMsg}</div>}
      {error && <div className="institute-alert institute-alert--danger">{error}</div>}

      {/* Financial Pulse Stats */}
      <div className="institute-stats-grid">
        <div className="institute-stat-card">
          <div className="institute-stat-icon institute-stat-icon--indigo">
            <FiDollarSign />
          </div>
          <div className="institute-stat-content">
            <h4>Total Payable Billed</h4>
            <div className="stat-value">₹{stats.totalPayable?.toLocaleString()}</div>
          </div>
        </div>

        <div className="institute-stat-card">
          <div className="institute-stat-icon institute-stat-icon--emerald">
            <FiCheckCircle />
          </div>
          <div className="institute-stat-content">
            <h4>Total Collected</h4>
            <div className="stat-value" style={{ color: '#059669' }}>
              ₹{stats.totalCollected?.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="institute-stat-card">
          <div className="institute-stat-icon institute-stat-icon--rose">
            <FiAlertCircle />
          </div>
          <div className="institute-stat-content">
            <h4>Outstanding Dues</h4>
            <div className="stat-value" style={{ color: '#dc2626' }}>
              ₹{stats.totalOutstanding?.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="institute-stat-card">
          <div className="institute-stat-icon institute-stat-icon--amber">
            <FiTrendingUp />
          </div>
          <div className="institute-stat-content">
            <h4>Collection Progress</h4>
            <div className="stat-value" style={{ color: '#d97706' }}>
              {stats.totalPayable > 0 ? Math.round((stats.totalCollected / stats.totalPayable) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="institute-toolbar">
        <div className="institute-search-box">
          <FiSearch />
          <input
            type="search"
            placeholder="Search by student name, ID, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="institute-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Payment Statuses</option>
          <option value="paid">Paid ({stats.paidCount})</option>
          <option value="partial">Partial ({stats.partialCount})</option>
          <option value="unpaid">Unpaid ({stats.unpaidCount})</option>
          <option value="overdue">Overdue ({stats.overdueCount})</option>
        </select>

        <select
          className="institute-select"
          value={courseFilter}
          onChange={(e) => {
            setCourseFilter(e.target.value);
            setBatchFilter('');
          }}
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <select
          className="institute-select"
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
        >
          <option value="">All Batches</option>
          {batches.map((b) => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="institute-table-card">
        {loading ? (
          <Loader />
        ) : fees.length === 0 ? (
          <div className="institute-empty-state">
            <FiDollarSign />
            <h3>No Fee Records Found</h3>
            <p>Fee plans are automatically established whenever a student is enrolled.</p>
          </div>
        ) : (
          <div className="institute-table-scroll">
            <table className="institute-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course & Batch</th>
                  <th>Payable Fee</th>
                  <th>Paid Amount</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                  <th>Installments</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => {
                  const student = fee.student;
                  return (
                    <tr key={fee._id}>
                      <td>
                        <strong>{student?.name || 'Unknown Student'}</strong>
                        <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#4f46e5' }}>
                          {student?.studentId}
                        </div>
                      </td>
                      <td>
                        <strong>{fee.course?.name || '—'}</strong>
                        {fee.batch?.name && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Batch: {fee.batch.name}
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>₹{fee.finalPayable?.toLocaleString()}</strong>
                        {fee.discount > 0 && (
                          <div style={{ fontSize: '11px', color: '#059669' }}>
                            Discount: -₹{fee.discount}
                          </div>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: '#059669' }}>₹{fee.paidAmount?.toLocaleString()}</strong>
                      </td>
                      <td>
                        <strong style={{ color: fee.dueAmount > 0 ? '#dc2626' : '#1e293b' }}>
                          ₹{fee.dueAmount?.toLocaleString()}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`institute-badge ${
                            fee.status === 'paid'
                              ? 'institute-badge--success'
                              : fee.status === 'partial'
                              ? 'institute-badge--warning'
                              : 'institute-badge--danger'
                          }`}
                        >
                          {fee.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {fee.installments?.filter((i) => i.status === 'paid').length} of {fee.installments?.length || 1} paid
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {fee.dueAmount > 0 && (
                          <button
                            type="button"
                            className="institute-btn-success institute-btn-sm"
                            style={{ marginRight: '6px' }}
                            onClick={() => handleOpenPayment(fee)}
                          >
                            <FiDollarSign /> Collect Fee
                          </button>
                        )}
                        <button
                          type="button"
                          className="institute-btn-secondary institute-btn-sm"
                          onClick={() => navigate(`/institute/students/${student?._id}`)}
                        >
                          <FiEye /> View Ledger
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECORD PAYMENT MODAL */}
      {selectedFee && (
        <Modal
          isOpen={!!selectedFee}
          onClose={() => setSelectedFee(null)}
          title={`Collect Fee: ${selectedFee.student?.name} (${selectedFee.student?.studentId})`}
          size="sm"
        >
          <form className="institute-form" onSubmit={handleRecordPayment}>
            {paymentError && <div className="institute-alert institute-alert--danger">{paymentError}</div>}

            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div>Course: <strong>{selectedFee.course?.name}</strong></div>
              <div>Outstanding Due: <strong style={{ color: '#dc2626' }}>₹{selectedFee.dueAmount}</strong></div>
            </div>

            <label>
              Amount to Collect (₹) *
              <input
                type="number"
                min="1"
                max={selectedFee.dueAmount}
                required
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              />
            </label>

            <label>
              Payment Mode *
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              >
                <option value="upi">UPI / QR Transfer</option>
                <option value="cash">Cash</option>
                <option value="card">Card (POS / Payment Gateway)</option>
                <option value="bank_transfer">Direct Bank Transfer (NEFT/RTGS)</option>
                <option value="cheque">Cheque</option>
              </select>
            </label>

            <label>
              Reference / Transaction ID
              <input
                value={paymentForm.transactionReference}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                placeholder="UPI ref / Cheque #..."
              />
            </label>

            <label>
              Receipt Notes
              <textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Installment payment..."
              />
            </label>

            <div className="institute-form-actions">
              <button
                type="button"
                className="institute-btn-secondary"
                onClick={() => setSelectedFee(null)}
                disabled={savingPayment}
              >
                Cancel
              </button>
              <button type="submit" className="institute-btn-success" disabled={savingPayment}>
                {savingPayment ? 'Processing…' : 'Record & Issue Receipt'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default InstituteFees;
