import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiPlus,
  FiSearch,
  FiBookOpen,
  FiEye,
  FiDollarSign,
  FiPhone,
  FiMail,
  FiLayers,
} from 'react-icons/fi';
import { instituteService } from '../../services/instituteService';
import Loader from '../../components/common/Loader';
import EnrollStudentModal from '../../components/institute/EnrollStudentModal';
import './InstituteCommon.css';

const InstituteStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Load course options
  useEffect(() => {
    instituteService.getCourses({ isActive: 'true' })
      .then((res) => setCourses(res.data?.data || []))
      .catch((err) => console.error(err));
  }, []);

  // Load batches when course filter changes
  useEffect(() => {
    if (!courseFilter) {
      instituteService.getBatches()
        .then((res) => setBatches(res.data?.data || []))
        .catch((err) => console.error(err));
      return;
    }
    instituteService.getBatches({ course: courseFilter })
      .then((res) => setBatches(res.data?.data || []))
      .catch((err) => console.error(err));
  }, [courseFilter]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await instituteService.getStudents({
        search: search.trim(),
        course: courseFilter,
        batch: batchFilter,
        status: statusFilter,
        limit: 100,
      });
      setStudents(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.response?.data?.message || 'Could not load student roster.');
    } finally {
      setLoading(false);
    }
  }, [search, courseFilter, batchFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchStudents, 250);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  return (
    <div className="institute-page">
      <header className="institute-header">
        <div>
          <span className="institute-eyebrow"><FiUsers /> STUDENT ROSTER</span>
          <h1>Enrolled Students</h1>
          <p>Directory of registered students, active course cohorts, and enrollment records.</p>
        </div>
        <div className="institute-header__actions">
          <button className="institute-btn-secondary" onClick={() => navigate('/institute/admissions')}>
            <FiBookOpen /> Admissions Inquiries
          </button>
          <button className="institute-btn-primary" onClick={() => setIsEnrollModalOpen(true)}>
            <FiPlus /> Enroll Student
          </button>
        </div>
      </header>

      {successMsg && <div className="institute-alert institute-alert--success">{successMsg}</div>}
      {error && <div className="institute-alert institute-alert--danger">{error}</div>}

      {/* Toolbar */}
      <div className="institute-toolbar">
        <div className="institute-search-box">
          <FiSearch />
          <input
            type="search"
            placeholder="Search by student name, ID, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

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

        <select
          className="institute-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="enrolled">Enrolled</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="dropped">Dropped</option>
        </select>

        <span style={{ marginLeft: 'auto', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
          {total} {total === 1 ? 'student' : 'students'}
        </span>
      </div>

      {/* Table */}
      <div className="institute-table-card">
        {loading ? (
          <Loader />
        ) : students.length === 0 ? (
          <div className="institute-empty-state">
            <FiUsers />
            <h3>No Students Enrolled Yet</h3>
            <p>Enroll prospective students directly or qualify inquiries from the admissions pipeline.</p>
            <button className="institute-btn-primary" onClick={() => setIsEnrollModalOpen(true)}>
              <FiPlus /> Enroll First Student
            </button>
          </div>
        ) : (
          <div className="institute-table-scroll">
            <table className="institute-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Enrolled Course</th>
                  <th>Batch & Schedule</th>
                  <th>Enrollment Date</th>
                  <th>Fee Status</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const fee = student.fee;
                  return (
                    <tr key={student._id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '3px 8px', borderRadius: '4px' }}>
                          {student.studentId}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => navigate(`/institute/students/${student._id}`)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#1e293b',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          {student.name}
                        </button>
                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '8px', marginTop: '2px' }}>
                          {student.phone && <span><FiPhone size={10} /> {student.phone}</span>}
                          {student.email && <span><FiMail size={10} /> {student.email}</span>}
                        </div>
                      </td>
                      <td>
                        <strong>{student.enrolledCourse?.name || '—'}</strong>
                        {student.enrolledCourse?.code && (
                          <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                            {student.enrolledCourse.code}
                          </span>
                        )}
                      </td>
                      <td>
                        <span>{student.enrolledBatch?.name || '—'}</span>
                        {student.enrolledBatch?.schedule && (
                          <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                            {student.enrolledBatch.schedule}
                          </span>
                        )}
                      </td>
                      <td>{student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : '—'}</td>
                      <td>
                        {fee ? (
                          <span
                            className={`institute-badge ${
                              fee.status === 'paid'
                                ? 'institute-badge--success'
                                : fee.status === 'partial'
                                ? 'institute-badge--warning'
                                : 'institute-badge--danger'
                            }`}
                          >
                            <FiDollarSign size={10} /> {fee.status} (Due: ₹{fee.dueAmount})
                          </span>
                        ) : (
                          <span className="institute-badge institute-badge--neutral">No fee plan</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`institute-badge ${
                            student.status === 'active' || student.status === 'enrolled'
                              ? 'institute-badge--success'
                              : student.status === 'completed'
                              ? 'institute-badge--info'
                              : 'institute-badge--neutral'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="institute-btn-secondary institute-btn-sm"
                          onClick={() => navigate(`/institute/students/${student._id}`)}
                        >
                          <FiEye /> View Profile
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

      {/* Direct Enroll Modal */}
      {isEnrollModalOpen && (
        <EnrollStudentModal
          isOpen={isEnrollModalOpen}
          onClose={() => setIsEnrollModalOpen(false)}
          inquiry={null}
          onSuccess={(data) => {
            setSuccessMsg(`Student ${data?.student?.name} (${data?.student?.studentId}) enrolled successfully!`);
            setTimeout(() => setSuccessMsg(''), 5000);
            fetchStudents();
          }}
        />
      )}
    </div>
  );
};

export default InstituteStudents;
