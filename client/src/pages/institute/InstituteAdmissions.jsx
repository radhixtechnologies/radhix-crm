import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBookOpen, FiPlus, FiSearch, FiUsers, FiUserCheck, FiCalendar, FiClock, FiAlertCircle } from 'react-icons/fi';
import { salesService, normalizeSalesListResponse } from '../../services/salesService';
import { instituteService } from '../../services/instituteService';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import EnrollStudentModal from '../../components/institute/EnrollStudentModal';
import './InstituteAdmissions.css';

const statusLabels = {
  new: 'New inquiry',
  contacted: 'Contacted',
  qualified: 'Counselling',
  converted: 'Admitted',
  lost: 'Not proceeding',
};

const InstituteAdmissions = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Course & Batch options for Inquiry Form
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);

  // New Inquiry Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    courseId: '',
    batchId: '',
    courseInterested: '',
    preferredBatch: '',
    educationLevel: '',
    followUpDate: '',
    source: 'website',
  });

  // Enroll Student Modal
  const [enrollModalInquiry, setEnrollModalInquiry] = useState(null);

  // Quick Schedule Follow-up Modal
  const [followupModalInquiry, setFollowupModalInquiry] = useState(null);
  const [followupForm, setFollowupForm] = useState({
    scheduledDate: '',
    scheduledTime: '10:00',
    typeOfFollowUp: 'call',
    description: '',
  });
  const [savingFollowup, setSavingFollowup] = useState(false);

  // Load active courses for dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await instituteService.getCourses({ isActive: 'true' });
        setCourses(res.data?.data || []);
      } catch (err) {
        console.error('Error fetching courses:', err);
      }
    };
    fetchCourses();
  }, []);

  // When selected course in inquiry form changes, load available batches
  useEffect(() => {
    if (!form.courseId) {
      setBatches([]);
      return;
    }
    const fetchBatches = async () => {
      try {
        const res = await instituteService.getBatches({ course: form.courseId });
        setBatches(res.data?.data || []);
      } catch (err) {
        console.error('Error fetching batches:', err);
      }
    };
    fetchBatches();
  }, [form.courseId]);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await salesService.getLeads({
        instituteInquiry: true,
        search: search.trim(),
        status,
        page: 1,
        limit: 100,
      });
      const result = normalizeSalesListResponse(response);
      setInquiries(result.data);
      setTotal(result.total);
    } catch (fetchError) {
      console.error('Error fetching institute inquiries:', fetchError);
      setError(fetchError.response?.data?.message || 'Could not load admissions inquiries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(fetchInquiries, 250);
    return () => clearTimeout(timer);
  }, [fetchInquiries]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    if (name === 'courseId') {
      const selectedCourse = courses.find((c) => String(c._id) === String(value));
      setForm((current) => ({
        ...current,
        courseId: value,
        courseInterested: selectedCourse ? selectedCourse.name : '',
        batchId: '',
        preferredBatch: '',
      }));
    } else if (name === 'batchId') {
      const selectedBatch = batches.find((b) => String(b._id) === String(value));
      setForm((current) => ({
        ...current,
        batchId: value,
        preferredBatch: selectedBatch ? selectedBatch.name : '',
      }));
    } else {
      setForm((current) => ({ ...current, [name]: value }));
    }
  };

  const handleCreateInquiry = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await salesService.createLead({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        courseInterested: form.courseInterested.trim(),
        preferredBatch: form.preferredBatch.trim(),
        course: form.courseId || null,
        batch: form.batchId || null,
        educationLevel: form.educationLevel.trim(),
        company: '',
        industry: 'Education',
        isInstituteInquiry: true,
        status: 'new',
        followUpDate: form.followUpDate || null,
        source: form.source,
      });

      setForm({
        name: '',
        phone: '',
        email: '',
        courseId: '',
        batchId: '',
        courseInterested: '',
        preferredBatch: '',
        educationLevel: '',
        followUpDate: '',
        source: 'website',
      });
      setIsModalOpen(false);
      setSuccessMsg('Inquiry created successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      await fetchInquiries();
    } catch (createError) {
      console.error('Error creating institute inquiry:', createError);
      setFormError(createError.response?.data?.message || 'Could not save this inquiry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (inquiry, nextStatus) => {
    try {
      await salesService.changeLeadStatus(inquiry._id, nextStatus);
      await fetchInquiries();
    } catch (updateError) {
      console.error('Error updating inquiry status:', updateError);
      setError(updateError.response?.data?.message || 'Could not update the inquiry status.');
    }
  };

  const handleScheduleFollowup = async (e) => {
    e.preventDefault();
    if (!followupModalInquiry) return;
    setSavingFollowup(true);
    try {
      await instituteService.scheduleFollowUp({
        inquiryId: followupModalInquiry._id,
        scheduledDate: followupForm.scheduledDate,
        scheduledTime: followupForm.scheduledTime,
        typeOfFollowUp: followupForm.typeOfFollowUp,
        description: followupForm.description,
      });
      setFollowupModalInquiry(null);
      setSuccessMsg('Follow-up scheduled successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      await fetchInquiries();
    } catch (err) {
      console.error('Error scheduling follow-up:', err);
      setError(err.response?.data?.message || 'Failed to schedule follow-up.');
    } finally {
      setSavingFollowup(false);
    }
  };

  const isDateOverdue = (dateStr) => {
    if (!dateStr) return false;
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return target < today;
  };

  const isDateToday = (dateStr) => {
    if (!dateStr) return false;
    const target = new Date(dateStr);
    const today = new Date();
    return (
      target.getFullYear() === today.getFullYear() &&
      target.getMonth() === today.getMonth() &&
      target.getDate() === today.getDate()
    );
  };

  return (
    <main className="institute-admissions">
      <header className="institute-admissions__header">
        <div>
          <span className="institute-admissions__eyebrow"><FiBookOpen /> EDUCATION WORKSPACE</span>
          <h1>Admissions</h1>
          <p>Track course inquiries from first contact through counseling to student enrollment.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="institute-admissions__secondary" onClick={() => navigate('/institute/courses')}>
            <FiBookOpen /> Manage Courses & Batches
          </button>
          <button className="institute-admissions__primary" onClick={() => setIsModalOpen(true)}>
            <FiPlus /> New inquiry
          </button>
        </div>
      </header>

      {successMsg && (
        <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {error && <div className="institute-admissions__error" role="alert">{error}</div>}

      <section className="institute-admissions__toolbar" aria-label="Filter inquiries">
        <label className="institute-admissions__search">
          <FiSearch aria-hidden="true" />
          <input
            type="search"
            placeholder="Search student, phone, email or course"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select aria-label="Filter by admission stage" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All stages</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <span className="institute-admissions__count"><FiUsers /> {total} {total === 1 ? 'inquiry' : 'inquiries'}</span>
      </section>

      <section className="institute-admissions__table-wrap" aria-label="Admission inquiries">
        {loading ? <Loader /> : inquiries.length === 0 ? (
          <div className="institute-admissions__empty">
            <FiBookOpen />
            <h2>No admission inquiries yet</h2>
            <p>Add a prospective student to start tracking admissions.</p>
            <button className="institute-admissions__primary" onClick={() => setIsModalOpen(true)}>
              <FiPlus /> Add first inquiry
            </button>
          </div>
        ) : (
          <div className="institute-admissions__table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Prospective student</th>
                  <th>Course</th>
                  <th>Batch</th>
                  <th>Follow-up</th>
                  <th>Stage</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => {
                  const studentId = inquiry.convertedToStudent?.studentId || (typeof inquiry.convertedToStudent === 'object' ? inquiry.convertedToStudent?._id : null);
                  const isEnrolled = !!inquiry.convertedToStudent;
                  const overdue = inquiry.followUpDate && !isEnrolled && inquiry.status !== 'lost' && isDateOverdue(inquiry.followUpDate);
                  const dueToday = inquiry.followUpDate && !isEnrolled && inquiry.status !== 'lost' && isDateToday(inquiry.followUpDate);

                  return (
                    <tr key={inquiry._id}>
                      <td>
                        <button className="institute-admissions__student" onClick={() => navigate(`/sales/leads/${inquiry._id}`)}>
                          {inquiry.name}
                        </button>
                        <span className="institute-admissions__contact">{inquiry.phone || inquiry.email || 'No contact details'}</span>
                      </td>
                      <td>
                        <strong>{inquiry.course?.name || inquiry.courseInterested || '—'}</strong>
                        {inquiry.course?.code && <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>Code: {inquiry.course.code}</span>}
                      </td>
                      <td>
                        {inquiry.batch?.name || inquiry.preferredBatch || '—'}
                        {inquiry.batch?.schedule && <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>{inquiry.batch.schedule}</span>}
                      </td>
                      <td>
                        {inquiry.followUpDate ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{new Date(inquiry.followUpDate).toLocaleDateString()}</span>
                            {overdue && (
                              <span style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                                Overdue
                              </span>
                            )}
                            {dueToday && (
                              <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                                Due Today
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setFollowupModalInquiry(inquiry);
                              setFollowupForm({
                                scheduledDate: new Date().toISOString().slice(0, 10),
                                scheduledTime: '10:00',
                                typeOfFollowUp: 'call',
                                description: `Follow-up with ${inquiry.name}`,
                              });
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '12px', padding: 0, textDecoration: 'underline' }}
                          >
                            + Schedule
                          </button>
                        )}
                      </td>
                      <td>
                        <select
                          className={`institute-admissions__stage institute-admissions__stage--${inquiry.status}`}
                          aria-label={`Admission stage for ${inquiry.name}`}
                          value={inquiry.status}
                          onChange={(event) => handleStatusChange(inquiry, event.target.value)}
                        >
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {isEnrolled ? (
                          <button
                            type="button"
                            className="institute-btn-secondary institute-btn-sm"
                            style={{ color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5', fontWeight: 600 }}
                            onClick={() => navigate(`/institute/students/${inquiry.convertedToStudent?._id || inquiry.convertedToStudent}`)}
                          >
                            <FiUserCheck /> Enrolled {studentId ? `(${studentId})` : ''}
                          </button>
                        ) : inquiry.status === 'lost' ? (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Archived</span>
                        ) : (
                          <button
                            type="button"
                            className="institute-btn-primary institute-btn-sm"
                            onClick={() => setEnrollModalInquiry(inquiry)}
                            title="Enroll student and setup fee record"
                          >
                            <FiUserCheck /> Enroll student
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {total > inquiries.length && (
              <p className="institute-admissions__limit">
                Showing the first {inquiries.length} inquiries. Use search or stage filters to narrow the list.
              </p>
            )}
          </div>
        )}
      </section>

      {/* New Inquiry Modal with dynamic Course & Batch selects */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New admission inquiry" size="md">
        <form className="institute-admissions__form" onSubmit={handleCreateInquiry}>
          <label>
            Student name *
            <input name="name" value={form.name} onChange={updateForm} required maxLength={120} />
          </label>
          <div className="institute-admissions__form-row">
            <label>
              Phone *
              <input name="phone" type="tel" value={form.phone} onChange={updateForm} required maxLength={30} />
            </label>
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={updateForm} maxLength={254} />
            </label>
          </div>
          <div className="institute-admissions__form-row">
            <label>
              Course interested
              <select name="courseId" value={form.courseId} onChange={updateForm}>
                <option value="">-- Select Active Course --</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} ({c.code}) - ₹{c.baseFee}</option>
                ))}
              </select>
            </label>
            <label>
              Preferred batch
              <select name="batchId" value={form.batchId} onChange={updateForm} disabled={!form.courseId}>
                <option value="">-- Select Batch --</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name} ({b.schedule || 'Regular'})</option>
                ))}
              </select>
            </label>
          </div>
          <div className="institute-admissions__form-row">
            <label>
              Current education level
              <input name="educationLevel" value={form.educationLevel} onChange={updateForm} placeholder="e.g. 12th, B.Tech, Graduate" maxLength={120} />
            </label>
            <label>
              Follow-up date
              <input name="followUpDate" type="date" value={form.followUpDate} onChange={updateForm} />
            </label>
          </div>
          <label>
            Inquiry source
            <select name="source" value={form.source} onChange={updateForm}>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="social-media">Social media</option>
              <option value="phone">Phone</option>
              <option value="email">Email</option>
              <option value="other">Other</option>
            </select>
          </label>
          {formError && <div className="institute-admissions__error" role="alert">{formError}</div>}
          <div className="institute-admissions__form-actions">
            <button type="button" className="institute-admissions__secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="institute-admissions__primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save inquiry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enroll Student Modal */}
      {enrollModalInquiry && (
        <EnrollStudentModal
          isOpen={!!enrollModalInquiry}
          onClose={() => setEnrollModalInquiry(null)}
          inquiry={enrollModalInquiry}
          onSuccess={(data) => {
            setSuccessMsg(`Student ${data?.student?.name} enrolled successfully with ID ${data?.student?.studentId}!`);
            setTimeout(() => setSuccessMsg(''), 5000);
            fetchInquiries();
          }}
        />
      )}

      {/* Schedule Follow-up Modal */}
      {followupModalInquiry && (
        <Modal
          isOpen={!!followupModalInquiry}
          onClose={() => setFollowupModalInquiry(null)}
          title={`Schedule Follow-up: ${followupModalInquiry.name}`}
          size="sm"
        >
          <form className="institute-form" onSubmit={handleScheduleFollowup}>
            <div className="institute-form-row">
              <label>
                Follow-up Date *
                <input
                  type="date"
                  required
                  value={followupForm.scheduledDate}
                  onChange={(e) => setFollowupForm((p) => ({ ...p, scheduledDate: e.target.value }))}
                />
              </label>
              <label>
                Time
                <input
                  type="time"
                  value={followupForm.scheduledTime}
                  onChange={(e) => setFollowupForm((p) => ({ ...p, scheduledTime: e.target.value }))}
                />
              </label>
            </div>
            <label>
              Type of Follow-up
              <select
                value={followupForm.typeOfFollowUp}
                onChange={(e) => setFollowupForm((p) => ({ ...p, typeOfFollowUp: e.target.value }))}
              >
                <option value="call">Phone Call</option>
                <option value="meeting">Counselling / Meeting</option>
                <option value="email">Email</option>
                <option value="task">Task / Note</option>
              </select>
            </label>
            <label>
              Notes / Objective
              <textarea
                value={followupForm.description}
                onChange={(e) => setFollowupForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Discuss course curriculum, fee structure, batch timings..."
              />
            </label>
            <div className="institute-form-actions">
              <button type="button" className="institute-btn-secondary" onClick={() => setFollowupModalInquiry(null)} disabled={savingFollowup}>
                Cancel
              </button>
              <button type="submit" className="institute-btn-primary" disabled={savingFollowup}>
                {savingFollowup ? 'Scheduling…' : 'Save Follow-up'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
};

export default InstituteAdmissions;
