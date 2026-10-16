import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { instituteService } from '../../services/instituteService';
import '../../pages/institute/InstituteCommon.css';

const EnrollStudentModal = ({ isOpen, onClose, inquiry, onSuccess }) => {
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    guardianName: '',
    guardianPhone: '',
    educationLevel: '',
    courseId: '',
    batchId: '',
    totalFee: 0,
    discount: 0,
    initialPayment: 0,
    paymentMethod: 'upi',
    installmentPlan: '1', // '1', '2', '3'
  });

  // Load courses
  useEffect(() => {
    if (!isOpen) return;

    const loadCourses = async () => {
      setLoadingMeta(true);
      setError('');
      try {
        const res = await instituteService.getCourses({ isActive: 'true' });
        const list = res.data?.data || [];
        setCourses(list);

        // Pre-fill from inquiry if provided
        if (inquiry) {
          let matchedCourseId = '';
          if (inquiry.course) {
            matchedCourseId = typeof inquiry.course === 'object' ? inquiry.course._id : inquiry.course;
          } else if (inquiry.courseInterested) {
            const match = list.find((c) => c.name.toLowerCase() === inquiry.courseInterested.toLowerCase());
            if (match) matchedCourseId = match._id;
          }

          const defaultCourse = list.find((c) => String(c._id) === String(matchedCourseId)) || list[0];
          const initialFee = defaultCourse?.baseFee || 0;

          setForm((prev) => ({
            ...prev,
            name: inquiry.name || '',
            phone: inquiry.phone || '',
            email: inquiry.email || '',
            educationLevel: inquiry.educationLevel || '',
            courseId: defaultCourse?._id || '',
            totalFee: initialFee,
            discount: 0,
            initialPayment: 0,
          }));
        } else if (list.length > 0) {
          setForm((prev) => ({
            ...prev,
            courseId: list[0]._id,
            totalFee: list[0].baseFee || 0,
          }));
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please check connection.');
      } finally {
        setLoadingMeta(false);
      }
    };

    loadCourses();
  }, [isOpen, inquiry]);

  // Load batches when course changes
  useEffect(() => {
    if (!form.courseId) {
      setBatches([]);
      return;
    }

    const loadBatches = async () => {
      try {
        const res = await instituteService.getBatches({ course: form.courseId });
        const batchList = res.data?.data || [];
        setBatches(batchList);

        // Auto select first available batch or match inquiry batch
        if (inquiry?.batch) {
          const matchedBatchId = typeof inquiry.batch === 'object' ? inquiry.batch._id : inquiry.batch;
          if (batchList.some((b) => String(b._id) === String(matchedBatchId))) {
            setForm((prev) => ({ ...prev, batchId: matchedBatchId }));
            return;
          }
        }
        if (inquiry?.preferredBatch) {
          const matched = batchList.find((b) => b.name.toLowerCase() === inquiry.preferredBatch.toLowerCase());
          if (matched) {
            setForm((prev) => ({ ...prev, batchId: matched._id }));
            return;
          }
        }

        const openBatch = batchList.find((b) => !b.isFull && ['upcoming', 'active'].includes(b.status));
        if (openBatch) {
          setForm((prev) => ({ ...prev, batchId: openBatch._id }));
        } else if (batchList.length > 0) {
          setForm((prev) => ({ ...prev, batchId: batchList[0]._id }));
        } else {
          setForm((prev) => ({ ...prev, batchId: '' }));
        }
      } catch (err) {
        console.error('Error fetching batches:', err);
      }
    };

    loadBatches();
  }, [form.courseId, inquiry]);

  const handleCourseChange = (e) => {
    const selectedCourseId = e.target.value;
    const selectedCourse = courses.find((c) => String(c._id) === String(selectedCourseId));
    setForm((prev) => ({
      ...prev,
      courseId: selectedCourseId,
      totalFee: selectedCourse?.baseFee || 0,
      discount: 0,
      initialPayment: 0,
      batchId: '',
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const finalPayable = Math.max(0, Number(form.totalFee || 0) - Number(form.discount || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.batchId) {
      setError('Please select an active batch.');
      return;
    }

    const selectedBatch = batches.find((b) => String(b._id) === String(form.batchId));
    if (selectedBatch && selectedBatch.isFull) {
      setError(`Batch "${selectedBatch.name}" is already full (${selectedBatch.capacity}/${selectedBatch.capacity} seats). Please select another batch.`);
      return;
    }

    const initialPay = Number(form.initialPayment || 0);
    if (initialPay > finalPayable) {
      setError(`Initial payment (₹${initialPay}) cannot exceed total payable fee (₹${finalPayable}).`);
      return;
    }

    // Build installment schedule
    const numInstallments = parseInt(form.installmentPlan, 10) || 1;
    const installments = [];
    const amountPerInstallment = Math.round(finalPayable / numInstallments);
    const startDate = selectedBatch?.startDate ? new Date(selectedBatch.startDate) : new Date();

    for (let i = 0; i < numInstallments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      const isLast = i === numInstallments - 1;
      const amount = isLast ? finalPayable - amountPerInstallment * (numInstallments - 1) : amountPerInstallment;
      installments.push({
        installmentNumber: i + 1,
        dueDate,
        amount,
      });
    }

    setSaving(true);
    try {
      const payload = {
        inquiryId: inquiry?._id || undefined,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        guardianName: form.guardianName.trim(),
        guardianPhone: form.guardianPhone.trim(),
        educationLevel: form.educationLevel.trim(),
        courseId: form.courseId,
        batchId: form.batchId,
        totalFee: Number(form.totalFee),
        discount: Number(form.discount || 0),
        initialPayment: initialPay,
        paymentMethod: form.paymentMethod,
        installments,
      };

      const res = await instituteService.enrollStudent(payload);
      if (res.data?.success) {
        onSuccess(res.data.data);
        onClose();
      } else {
        setError(res.data?.message || 'Enrollment failed.');
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      setError(err.response?.data?.message || 'Could not complete enrollment. Please check inputs.');
    } finally {
      setSaving(false);
    }
  };

  const selectedBatch = batches.find((b) => String(b._id) === String(form.batchId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={inquiry ? `Enroll Student from Inquiry: ${inquiry.name}` : 'Enroll New Student'}
      size="lg"
    >
      <form className="institute-form" onSubmit={handleSubmit}>
        {error && (
          <div className="institute-alert institute-alert--danger" role="alert">
            {error}
          </div>
        )}

        <div className="institute-form-row">
          <label>
            Student Name *
            <input name="name" value={form.name} onChange={handleChange} required maxLength={120} />
          </label>
          <label>
            Phone Number *
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} required maxLength={30} />
          </label>
        </div>

        <div className="institute-form-row">
          <label>
            Email Address
            <input name="email" type="email" value={form.email} onChange={handleChange} maxLength={254} />
          </label>
          <label>
            Current Education Level
            <input name="educationLevel" value={form.educationLevel} onChange={handleChange} placeholder="e.g. B.Tech, 12th Standard" maxLength={120} />
          </label>
        </div>

        <div className="institute-form-row">
          <label>
            Guardian / Parent Name
            <input name="guardianName" value={form.guardianName} onChange={handleChange} maxLength={120} />
          </label>
          <label>
            Guardian Contact Phone
            <input name="guardianPhone" type="tel" value={form.guardianPhone} onChange={handleChange} maxLength={30} />
          </label>
        </div>

        <label>
          Residential Address
          <input name="address" value={form.address} onChange={handleChange} placeholder="Street, City, Postal Code" maxLength={200} />
        </label>

        {/* Course and Batch selection */}
        <div className="institute-form-row" style={{ marginTop: '8px' }}>
          <label>
            Select Course *
            <select name="courseId" value={form.courseId} onChange={handleCourseChange} required disabled={loadingMeta}>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.code}) — ₹{c.baseFee}
                </option>
              ))}
            </select>
          </label>
          <label>
            Select Batch *
            <select name="batchId" value={form.batchId} onChange={handleChange} required disabled={batches.length === 0}>
              {batches.length === 0 ? (
                <option value="">No batches available for this course</option>
              ) : (
                batches.map((b) => (
                  <option key={b._id} value={b._id} disabled={b.isFull}>
                    {b.name} ({b.availableSeats} of {b.capacity} seats left){b.isFull ? ' - FULL' : ''}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>

        {selectedBatch && (
          <div style={{ fontSize: '12px', color: '#475569', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong>Batch Schedule:</strong> {selectedBatch.schedule || 'Regular'} &bull;{' '}
            <strong>Dates:</strong> {new Date(selectedBatch.startDate).toLocaleDateString()} to {new Date(selectedBatch.endDate).toLocaleDateString()} &bull;{' '}
            <strong>Instructor:</strong> {selectedBatch.instructor || 'TBD'}
          </div>
        )}

        {/* Fee & Installment Plan */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '4px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0f172a' }}>Fee Plan & Initial Payment</h4>
          <div className="institute-form-row">
            <label>
              Course Fee (₹) *
              <input name="totalFee" type="number" min="0" value={form.totalFee} onChange={handleChange} required />
            </label>
            <label>
              Scholarship / Discount (₹)
              <input name="discount" type="number" min="0" max={form.totalFee} value={form.discount} onChange={handleChange} />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eef2ff', padding: '10px 16px', borderRadius: '8px', margin: '12px 0' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#3730a3' }}>Final Payable Fee:</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#4f46e5' }}>₹{finalPayable}</span>
          </div>

          <div className="institute-form-row">
            <label>
              Installment Plan
              <select name="installmentPlan" value={form.installmentPlan} onChange={handleChange}>
                <option value="1">1 Single Payment (₹{finalPayable})</option>
                <option value="2">2 Monthly Installments (₹{Math.round(finalPayable / 2)} / month)</option>
                <option value="3">3 Monthly Installments (₹{Math.round(finalPayable / 3)} / month)</option>
              </select>
            </label>
            <label>
              Initial Payment Now (₹)
              <input
                name="initialPayment"
                type="number"
                min="0"
                max={finalPayable}
                value={form.initialPayment}
                onChange={handleChange}
                placeholder="0"
              />
            </label>
          </div>

          {Number(form.initialPayment) > 0 && (
            <div className="institute-form-row">
              <label>
                Payment Method
                <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
                  <option value="upi">UPI / QR Code</option>
                  <option value="cash">Cash</option>
                  <option value="card">Debit / Credit Card</option>
                  <option value="bank_transfer">Bank Transfer / NEFT</option>
                  <option value="cheque">Cheque</option>
                </select>
              </label>
            </div>
          )}
        </div>

        <div className="institute-form-actions">
          <button type="button" className="institute-btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="institute-btn-primary" disabled={saving || !form.batchId}>
            {saving ? 'Enrolling Student…' : 'Confirm Enrollment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EnrollStudentModal;
