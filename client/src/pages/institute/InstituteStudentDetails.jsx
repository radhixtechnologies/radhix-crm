import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiUser,
  FiBookOpen,
  FiDollarSign,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiPhone,
  FiMail,
  FiMapPin,
  FiFileText,
  FiPlus,
  FiAlertCircle,
  FiPrinter,
} from 'react-icons/fi';
import { instituteService } from '../../services/instituteService';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import './InstituteCommon.css';

const InstituteStudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Payment Recording Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'upi',
    transactionReference: '',
    notes: '',
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // View Receipt Modal
  const [viewingReceipt, setViewingReceipt] = useState(null);

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await instituteService.getStudent(id);
      setStudent(res.data?.data || null);
    } catch (err) {
      console.error('Error fetching student details:', err);
      setError(err.response?.data?.message || 'Could not load student profile.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!student?.fee?._id) return;
    setSavingPayment(true);
    setPaymentError('');

    try {
      const res = await instituteService.recordPayment(student.fee._id, paymentForm);
      setSuccessMsg(`Payment of ₹${paymentForm.amount} recorded successfully!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      setIsPaymentModalOpen(false);
      setPaymentForm({
        amount: '',
        paymentMethod: 'upi',
        transactionReference: '',
        notes: '',
      });
      // Show receipt
      if (res.data?.receipt) {
        setViewingReceipt(res.data.receipt);
      }
      await fetchStudent();
    } catch (err) {
      console.error('Record payment error:', err);
      setPaymentError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setSavingPayment(false);
    }
  };

  if (loading) return <div className="institute-page"><Loader /></div>;
  if (!student) return <div className="institute-page"><div className="institute-alert institute-alert--danger">Student not found</div></div>;

  const fee = student.fee;
  const attendance = student.attendanceStats || { totalClasses: 0, present: 0, absent: 0, late: 0, rate: 100 };

  return (
    <div className="institute-page">
      <div style={{ marginBottom: '16px' }}>
        <button
          type="button"
          className="institute-btn-secondary institute-btn-sm"
          onClick={() => navigate('/institute/students')}
        >
          <FiArrowLeft /> Back to Students
        </button>
      </div>

      <header className="institute-header">
        <div>
          <span className="institute-eyebrow"><FiUser /> ENROLLMENT PROFILE</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1>{student.name}</h1>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, background: '#eef2ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '6px', fontSize: '14px' }}>
              {student.studentId}
            </span>
            <span className={`institute-badge ${student.status === 'enrolled' || student.status === 'active' ? 'institute-badge--success' : 'institute-badge--neutral'}`}>
              {student.status}
            </span>
          </div>
          <p>Enrolled on {new Date(student.enrollmentDate).toLocaleDateString()}</p>
        </div>

        <div className="institute-header__actions">
          {fee && fee.dueAmount > 0 && (
            <button className="institute-btn-success" onClick={() => setIsPaymentModalOpen(true)}>
              <FiDollarSign /> Record Fee Payment
            </button>
          )}
        </div>
      </header>

      {successMsg && <div className="institute-alert institute-alert--success">{successMsg}</div>}
      {error && <div className="institute-alert institute-alert--danger">{error}</div>}

      {/* Grid: Overview Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Student Contact Info */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiUser color="#4f46e5" /> Personal & Contact Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Phone:</span>
              <strong>{student.phone || '—'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Email:</span>
              <strong>{student.email || '—'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Education:</span>
              <strong>{student.educationLevel || '—'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Guardian:</span>
              <strong>{student.guardianName ? `${student.guardianName} (${student.guardianPhone || 'No Phone'})` : '—'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Address:</span>
              <span style={{ textAlign: 'right', maxWidth: '180px' }}>{student.address || '—'}</span>
            </div>
            {student.inquiry && (
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '6px' }}>
                <span style={{ color: '#64748b' }}>Originating Inquiry:</span>{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  onClick={() => navigate(`/sales/leads/${student.inquiry._id}`)}
                >
                  View Inquiry ({student.inquiry.source || 'Admissions'})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Academic Course & Batch */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiBookOpen color="#4f46e5" /> Course & Batch Assignment
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Course:</span>
              <strong>{student.enrolledCourse?.name} ({student.enrolledCourse?.code})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Duration:</span>
              <span>{student.enrolledCourse?.duration}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Batch:</span>
              <strong>{student.enrolledBatch?.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Schedule:</span>
              <span>{student.enrolledBatch?.schedule}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Instructor:</span>
              <span>{student.enrolledBatch?.instructor || 'TBD'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Batch Dates:</span>
              <span>
                {student.enrolledBatch?.startDate ? new Date(student.enrolledBatch.startDate).toLocaleDateString() : '—'} &rarr;{' '}
                {student.enrolledBatch?.endDate ? new Date(student.enrolledBatch.endDate).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiCalendar color="#4f46e5" /> Attendance Summary
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: attendance.rate >= 75 ? '#10b981' : '#f59e0b' }}>
              {attendance.rate}%
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Overall Attendance Rate across {attendance.totalClasses} conducted sessions
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
            <div style={{ background: '#f8fafc', padding: '8px 4px', borderRadius: '6px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>{attendance.present}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Present</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '8px 4px', borderRadius: '6px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>{attendance.absent}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Absent</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '8px 4px', borderRadius: '6px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#d97706' }}>{attendance.late}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Late</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '8px 4px', borderRadius: '6px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#4f46e5' }}>{attendance.excused}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Excused</div>
            </div>
          </div>
        </div>
      </div>

      {/* Financials & Installments Section */}
      <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700 }}>Fee Record & Installments</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Detailed schedule of installments, amounts paid, and generated receipts.</p>
          </div>
          {fee && fee.dueAmount > 0 && (
            <button className="institute-btn-success" onClick={() => setIsPaymentModalOpen(true)}>
              <FiDollarSign /> Record Payment
            </button>
          )}
        </div>

        {/* Financial KPI metrics */}
        {fee && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Total Fee</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>₹{fee.totalFee}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Discount</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>-₹{fee.discount}</div>
            </div>
            <div style={{ background: '#eef2ff', padding: '12px', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
              <div style={{ fontSize: '11px', color: '#3730a3', textTransform: 'uppercase' }}>Final Payable</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#4f46e5' }}>₹{fee.finalPayable}</div>
            </div>
            <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '11px', color: '#065f46', textTransform: 'uppercase' }}>Paid Amount</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>₹{fee.paidAmount}</div>
            </div>
            <div style={{ background: fee.dueAmount > 0 ? '#fef2f2' : '#f8fafc', padding: '12px', borderRadius: '8px', border: fee.dueAmount > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: fee.dueAmount > 0 ? '#991b1b' : '#64748b', textTransform: 'uppercase' }}>Balance Due</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: fee.dueAmount > 0 ? '#dc2626' : '#0f172a' }}>₹{fee.dueAmount}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Status</div>
              <div>
                <span className={`institute-badge ${fee.status === 'paid' ? 'institute-badge--success' : fee.status === 'partial' ? 'institute-badge--warning' : 'institute-badge--danger'}`}>
                  {fee.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Installments Table */}
        <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: '#334155' }}>Installment Schedule</h4>
        <div className="institute-table-scroll" style={{ marginBottom: '24px' }}>
          <table className="institute-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Paid Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {fee?.installments?.map((inst) => (
                <tr key={inst._id}>
                  <td><strong>Installment #{inst.installmentNumber}</strong></td>
                  <td>{new Date(inst.dueDate).toLocaleDateString()}</td>
                  <td><strong>₹{inst.amount}</strong></td>
                  <td>₹{inst.paidAmount}</td>
                  <td>
                    <span className={`institute-badge ${inst.status === 'paid' ? 'institute-badge--success' : inst.status === 'partial' ? 'institute-badge--warning' : 'institute-badge--danger'}`}>
                      {inst.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Receipts History */}
        <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: '#334155' }}>Payment Receipts History</h4>
        <div className="institute-table-scroll">
          <table className="institute-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Date Paid</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {(!fee?.receipts || fee.receipts.length === 0) ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                    No payment receipts recorded yet.
                  </td>
                </tr>
              ) : (
                fee.receipts.map((rec) => (
                  <tr key={rec._id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#4f46e5' }}>
                        {rec.receiptNumber}
                      </span>
                    </td>
                    <td>{new Date(rec.paidAt).toLocaleDateString()}</td>
                    <td><strong style={{ color: '#059669' }}>₹{rec.amount}</strong></td>
                    <td><span className="institute-badge institute-badge--neutral">{rec.paymentMethod.toUpperCase()}</span></td>
                    <td>{rec.transactionReference || '—'}</td>
                    <td>{rec.notes || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="institute-btn-secondary institute-btn-sm"
                        onClick={() => setViewingReceipt(rec)}
                      >
                        <FiPrinter /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title={`Record Fee Payment for ${student.name}`}
          size="sm"
        >
          <form className="institute-form" onSubmit={handleRecordPayment}>
            {paymentError && <div className="institute-alert institute-alert--danger">{paymentError}</div>}

            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              Current Outstanding Balance: <strong style={{ color: '#dc2626' }}>₹{fee?.dueAmount}</strong>
            </div>

            <label>
              Payment Amount (₹) *
              <input
                type="number"
                min="1"
                max={fee?.dueAmount}
                required
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder={`Up to ${fee?.dueAmount}`}
              />
            </label>

            <label>
              Payment Method *
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              >
                <option value="upi">UPI / QR Transfer</option>
                <option value="cash">Cash Payment</option>
                <option value="card">Card (POS / Payment Gateway)</option>
                <option value="bank_transfer">Direct Bank Transfer (NEFT/IMPS)</option>
                <option value="cheque">Cheque</option>
              </select>
            </label>

            <label>
              Transaction Reference / Cheque #
              <input
                value={paymentForm.transactionReference}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                placeholder="e.g. UTR198273645 / Chq 00412"
              />
            </label>

            <label>
              Receipt Notes
              <textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="e.g. 2nd Installment payment received"
              />
            </label>

            <div className="institute-form-actions">
              <button
                type="button"
                className="institute-btn-secondary"
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={savingPayment}
              >
                Cancel
              </button>
              <button type="submit" className="institute-btn-success" disabled={savingPayment}>
                {savingPayment ? 'Recording…' : 'Confirm & Generate Receipt'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW RECEIPT MODAL */}
      {viewingReceipt && (
        <Modal
          isOpen={!!viewingReceipt}
          onClose={() => setViewingReceipt(null)}
          title="Payment Acknowledgment Receipt"
          size="md"
        >
          <div style={{ padding: '16px', background: '#fafafa', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
              <h2 style={{ margin: '0 0 4px', fontSize: '18px', color: '#1e293b' }}>RADHIX INSTITUTE</h2>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Fee Payment Acknowledgment</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '16px' }}>
              <div>
                <span style={{ color: '#64748b' }}>Receipt Number:</span><br />
                <strong style={{ fontFamily: 'monospace', color: '#4f46e5' }}>{viewingReceipt.receiptNumber}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Date of Payment:</span><br />
                <strong>{new Date(viewingReceipt.paidAt).toLocaleDateString()}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Student Name:</span><br />
                <strong>{student.name} ({student.studentId})</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Course:</span><br />
                <strong>{student.enrolledCourse?.name}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Payment Mode:</span><br />
                <strong style={{ textTransform: 'uppercase' }}>{viewingReceipt.paymentMethod}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Reference ID:</span><br />
                <strong>{viewingReceipt.transactionReference || 'N/A'}</strong>
              </div>
            </div>

            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px', borderRadius: '6px', textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#065f46', textTransform: 'uppercase' }}>Amount Received</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669' }}>₹{viewingReceipt.amount}</div>
            </div>

            {viewingReceipt.notes && (
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                <strong>Remarks:</strong> {viewingReceipt.notes}
              </div>
            )}

            <div style={{ textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '11px', color: '#94a3b8' }}>
              This is a computer-generated fee receipt from Radhix CRM Institute Module.
            </div>
          </div>

          <div className="institute-form-actions" style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="institute-btn-secondary"
              onClick={() => window.print()}
            >
              <FiPrinter /> Print Receipt
            </button>
            <button
              type="button"
              className="institute-btn-primary"
              onClick={() => setViewingReceipt(null)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InstituteStudentDetails;
