import { useState, useEffect, useCallback } from 'react';
import { FiBookOpen, FiPlus, FiEdit2, FiTrash2, FiSearch, FiLayers, FiCalendar, FiUsers, FiClock } from 'react-icons/fi';
import { instituteService } from '../../services/instituteService';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import './InstituteCommon.css';

const InstituteCourses = () => {
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'batches'
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Course Search & Filter
  const [courseSearch, setCourseSearch] = useState('');
  // Batch Search & Filter
  const [batchSearch, setBatchSearch] = useState('');
  const [batchCourseFilter, setBatchCourseFilter] = useState('');
  const [batchStatusFilter, setBatchStatusFilter] = useState('');

  // Course Modal
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [savingCourse, setSavingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    duration: '',
    baseFee: '',
    description: '',
    isActive: true,
  });

  // Batch Modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [savingBatch, setSavingBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({
    name: '',
    course: '',
    startDate: '',
    endDate: '',
    schedule: '',
    capacity: 30,
    instructor: '',
    status: 'upcoming',
  });

  const fetchCourses = useCallback(async () => {
    try {
      const res = await instituteService.getCourses({ search: courseSearch.trim() });
      setCourses(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.response?.data?.message || 'Failed to load courses.');
    }
  }, [courseSearch]);

  const fetchBatches = useCallback(async () => {
    try {
      const res = await instituteService.getBatches({
        search: batchSearch.trim(),
        course: batchCourseFilter,
        status: batchStatusFilter,
      });
      setBatches(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError(err.response?.data?.message || 'Failed to load batches.');
    }
  }, [batchSearch, batchCourseFilter, batchStatusFilter]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCourses(), fetchBatches()]).finally(() => setLoading(false));
  }, [fetchCourses, fetchBatches]);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // COURSE ACTIONS
  const handleOpenCourseModal = (course = null) => {
    setEditingCourse(course);
    if (course) {
      setCourseForm({
        name: course.name,
        code: course.code,
        duration: course.duration,
        baseFee: course.baseFee,
        description: course.description || '',
        isActive: course.isActive,
      });
    } else {
      setCourseForm({
        name: '',
        code: '',
        duration: '',
        baseFee: '',
        description: '',
        isActive: true,
      });
    }
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setSavingCourse(true);
    setError('');
    try {
      if (editingCourse) {
        await instituteService.updateCourse(editingCourse._id, courseForm);
        showNotification(`Course "${courseForm.name}" updated successfully.`);
      } else {
        await instituteService.createCourse(courseForm);
        showNotification(`Course "${courseForm.name}" created successfully.`);
      }
      setIsCourseModalOpen(false);
      await fetchCourses();
    } catch (err) {
      console.error('Save course error:', err);
      setError(err.response?.data?.message || 'Failed to save course.');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Are you sure you want to delete course "${course.name}"?`)) return;
    try {
      await instituteService.deleteCourse(course._id);
      showNotification(`Course "${course.name}" deleted.`);
      await fetchCourses();
    } catch (err) {
      console.error('Delete course error:', err);
      setError(err.response?.data?.message || 'Cannot delete course.');
    }
  };

  // BATCH ACTIONS
  const handleOpenBatchModal = (batch = null) => {
    setEditingBatch(batch);
    if (batch) {
      setBatchForm({
        name: batch.name,
        course: typeof batch.course === 'object' ? batch.course._id : batch.course,
        startDate: batch.startDate ? new Date(batch.startDate).toISOString().slice(0, 10) : '',
        endDate: batch.endDate ? new Date(batch.endDate).toISOString().slice(0, 10) : '',
        schedule: batch.schedule,
        capacity: batch.capacity,
        instructor: batch.instructor || '',
        status: batch.status,
      });
    } else {
      setBatchForm({
        name: '',
        course: courses[0]?._id || '',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
        schedule: 'Mon, Wed, Fri 10:00 AM - 12:00 PM',
        capacity: 30,
        instructor: '',
        status: 'upcoming',
      });
    }
    setIsBatchModalOpen(true);
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    setSavingBatch(true);
    setError('');
    try {
      if (editingBatch) {
        await instituteService.updateBatch(editingBatch._id, batchForm);
        showNotification(`Batch "${batchForm.name}" updated successfully.`);
      } else {
        await instituteService.createBatch(batchForm);
        showNotification(`Batch "${batchForm.name}" created successfully.`);
      }
      setIsBatchModalOpen(false);
      await fetchBatches();
    } catch (err) {
      console.error('Save batch error:', err);
      setError(err.response?.data?.message || 'Failed to save batch.');
    } finally {
      setSavingBatch(false);
    }
  };

  const handleDeleteBatch = async (batch) => {
    if (!window.confirm(`Are you sure you want to delete batch "${batch.name}"?`)) return;
    try {
      await instituteService.deleteBatch(batch._id);
      showNotification(`Batch "${batch.name}" deleted.`);
      await fetchBatches();
    } catch (err) {
      console.error('Delete batch error:', err);
      setError(err.response?.data?.message || 'Cannot delete batch.');
    }
  };

  return (
    <div className="institute-page">
      <header className="institute-header">
        <div>
          <span className="institute-eyebrow"><FiBookOpen /> ACADEMIC DIRECTORY</span>
          <h1>Courses & Batches</h1>
          <p>Configure course offerings, fees, batches, schedules, and capacity limits.</p>
        </div>
        <div className="institute-header__actions">
          {activeTab === 'courses' ? (
            <button className="institute-btn-primary" onClick={() => handleOpenCourseModal()}>
              <FiPlus /> New Course
            </button>
          ) : (
            <button className="institute-btn-primary" onClick={() => handleOpenBatchModal()}>
              <FiPlus /> New Batch
            </button>
          )}
        </div>
      </header>

      {successMsg && <div className="institute-alert institute-alert--success">{successMsg}</div>}
      {error && <div className="institute-alert institute-alert--danger">{error}</div>}

      {/* Tabs */}
      <div className="institute-tabs">
        <button
          className={`institute-tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <FiBookOpen /> Courses ({courses.length})
        </button>
        <button
          className={`institute-tab-btn ${activeTab === 'batches' ? 'active' : ''}`}
          onClick={() => setActiveTab('batches')}
        >
          <FiLayers /> Batches ({batches.length})
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : activeTab === 'courses' ? (
        /* COURSES TAB */
        <div>
          <div className="institute-toolbar">
            <div className="institute-search-box">
              <FiSearch />
              <input
                type="search"
                placeholder="Search courses by name or code..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="institute-table-card">
            <div className="institute-table-scroll">
              <table className="institute-table">
                <thead>
                  <tr>
                    <th>Course Name</th>
                    <th>Code</th>
                    <th>Duration</th>
                    <th>Base Fee</th>
                    <th>Batches</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.length === 0 ? (
                    <tr>
                      <td colSpan="7">
                        <div className="institute-empty-state">
                          <FiBookOpen />
                          <h3>No Courses Found</h3>
                          <p>Add your first academic or training course to start enrolling students.</p>
                          <button className="institute-btn-primary" onClick={() => handleOpenCourseModal()}>
                            <FiPlus /> Create First Course
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    courses.map((course) => (
                      <tr key={course._id}>
                        <td>
                          <strong>{course.name}</strong>
                          {course.description && (
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                              {course.description}
                            </p>
                          )}
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            {course.code}
                          </span>
                        </td>
                        <td>{course.duration}</td>
                        <td>
                          <strong>₹{course.baseFee?.toLocaleString()}</strong>
                        </td>
                        <td>
                          <span className="institute-badge institute-badge--info">
                            {course.batchCount || 0} batches ({course.activeBatchCount || 0} active)
                          </span>
                        </td>
                        <td>
                          <span className={`institute-badge ${course.isActive ? 'institute-badge--success' : 'institute-badge--neutral'}`}>
                            {course.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="institute-btn-secondary institute-btn-sm"
                            style={{ marginRight: '6px' }}
                            onClick={() => handleOpenCourseModal(course)}
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button
                            type="button"
                            className="institute-btn-danger institute-btn-sm"
                            onClick={() => handleDeleteCourse(course)}
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* BATCHES TAB */
        <div>
          <div className="institute-toolbar">
            <div className="institute-search-box">
              <FiSearch />
              <input
                type="search"
                placeholder="Search batches..."
                value={batchSearch}
                onChange={(e) => setBatchSearch(e.target.value)}
              />
            </div>
            <select
              className="institute-select"
              value={batchCourseFilter}
              onChange={(e) => setBatchCourseFilter(e.target.value)}
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <select
              className="institute-select"
              value={batchStatusFilter}
              onChange={(e) => setBatchStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="institute-table-card">
            <div className="institute-table-scroll">
              <table className="institute-table">
                <thead>
                  <tr>
                    <th>Batch Name</th>
                    <th>Course</th>
                    <th>Dates</th>
                    <th>Schedule</th>
                    <th>Capacity & Enrollment</th>
                    <th>Instructor</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan="8">
                        <div className="institute-empty-state">
                          <FiLayers />
                          <h3>No Batches Configured</h3>
                          <p>Create a batch for one of your courses to schedule student cohorts.</p>
                          <button className="institute-btn-primary" onClick={() => handleOpenBatchModal()}>
                            <FiPlus /> Create First Batch
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    batches.map((batch) => (
                      <tr key={batch._id}>
                        <td>
                          <strong>{batch.name}</strong>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#334155' }}>
                            {batch.course?.name || '—'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '12px' }}>
                            {new Date(batch.startDate).toLocaleDateString()} &rarr; {new Date(batch.endDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td>{batch.schedule}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong>{batch.enrolledCount || 0} / {batch.capacity}</strong>
                            <span
                              className={`institute-badge ${
                                batch.isFull ? 'institute-badge--danger' : 'institute-badge--success'
                              }`}
                            >
                              {batch.isFull ? 'Full' : `${batch.availableSeats} available`}
                            </span>
                          </div>
                        </td>
                        <td>{batch.instructor || '—'}</td>
                        <td>
                          <span
                            className={`institute-badge ${
                              batch.status === 'active'
                                ? 'institute-badge--success'
                                : batch.status === 'upcoming'
                                ? 'institute-badge--info'
                                : batch.status === 'completed'
                                ? 'institute-badge--neutral'
                                : 'institute-badge--danger'
                            }`}
                          >
                            {batch.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="institute-btn-secondary institute-btn-sm"
                            style={{ marginRight: '6px' }}
                            onClick={() => handleOpenBatchModal(batch)}
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button
                            type="button"
                            className="institute-btn-danger institute-btn-sm"
                            onClick={() => handleDeleteBatch(batch)}
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT COURSE MODAL */}
      <Modal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title={editingCourse ? 'Edit Course' : 'Create New Course'}
        size="md"
      >
        <form className="institute-form" onSubmit={handleSaveCourse}>
          <div className="institute-form-row">
            <label>
              Course Name *
              <input
                required
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                placeholder="e.g. Full Stack Web Development"
              />
            </label>
            <label>
              Course Code *
              <input
                required
                value={courseForm.code}
                onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g. FSWD-101"
              />
            </label>
          </div>

          <div className="institute-form-row">
            <label>
              Duration *
              <input
                required
                value={courseForm.duration}
                onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                placeholder="e.g. 3 Months / 120 Hours"
              />
            </label>
            <label>
              Base Fee (₹) *
              <input
                type="number"
                min="0"
                required
                value={courseForm.baseFee}
                onChange={(e) => setCourseForm({ ...courseForm, baseFee: e.target.value })}
                placeholder="e.g. 25000"
              />
            </label>
          </div>

          <label>
            Description / Syllabus Overview
            <textarea
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              placeholder="Key topics, certifications, eligibility..."
            />
          </label>

          <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={courseForm.isActive}
              onChange={(e) => setCourseForm({ ...courseForm, isActive: e.target.checked })}
              style={{ minHeight: 'auto' }}
            />
            Course is active and open for enrollment inquiries
          </label>

          <div className="institute-form-actions">
            <button
              type="button"
              className="institute-btn-secondary"
              onClick={() => setIsCourseModalOpen(false)}
              disabled={savingCourse}
            >
              Cancel
            </button>
            <button type="submit" className="institute-btn-primary" disabled={savingCourse}>
              {savingCourse ? 'Saving…' : editingCourse ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE / EDIT BATCH MODAL */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title={editingBatch ? 'Edit Batch' : 'Create New Batch'}
        size="md"
      >
        <form className="institute-form" onSubmit={handleSaveBatch}>
          <label>
            Select Course *
            <select
              required
              value={batchForm.course}
              onChange={(e) => setBatchForm({ ...batchForm, course: e.target.value })}
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </label>

          <div className="institute-form-row">
            <label>
              Batch Name *
              <input
                required
                value={batchForm.name}
                onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                placeholder="e.g. Morning Cohort Alpha"
              />
            </label>
            <label>
              Instructor / Teacher
              <input
                value={batchForm.instructor}
                onChange={(e) => setBatchForm({ ...batchForm, instructor: e.target.value })}
                placeholder="e.g. Dr. Rajesh Sharma"
              />
            </label>
          </div>

          <div className="institute-form-row">
            <label>
              Start Date *
              <input
                type="date"
                required
                value={batchForm.startDate}
                onChange={(e) => setBatchForm({ ...batchForm, startDate: e.target.value })}
              />
            </label>
            <label>
              End Date *
              <input
                type="date"
                required
                value={batchForm.endDate}
                onChange={(e) => setBatchForm({ ...batchForm, endDate: e.target.value })}
              />
            </label>
          </div>

          <div className="institute-form-row">
            <label>
              Weekly Schedule *
              <input
                required
                value={batchForm.schedule}
                onChange={(e) => setBatchForm({ ...batchForm, schedule: e.target.value })}
                placeholder="e.g. Mon, Wed, Fri 10:00 - 12:00"
              />
            </label>
            <label>
              Student Capacity *
              <input
                type="number"
                min="1"
                required
                value={batchForm.capacity}
                onChange={(e) => setBatchForm({ ...batchForm, capacity: e.target.value })}
              />
            </label>
          </div>

          <label>
            Batch Status
            <select
              value={batchForm.status}
              onChange={(e) => setBatchForm({ ...batchForm, status: e.target.value })}
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <div className="institute-form-actions">
            <button
              type="button"
              className="institute-btn-secondary"
              onClick={() => setIsBatchModalOpen(false)}
              disabled={savingBatch}
            >
              Cancel
            </button>
            <button type="submit" className="institute-btn-primary" disabled={savingBatch}>
              {savingBatch ? 'Saving…' : editingBatch ? 'Save Changes' : 'Create Batch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InstituteCourses;
