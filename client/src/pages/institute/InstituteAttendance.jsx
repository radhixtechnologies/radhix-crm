import { useState, useEffect, useCallback } from 'react';
import {
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
  FiLayers,
  FiSave,
  FiUsers,
  FiCheck,
  FiX,
} from 'react-icons/fi';
import { instituteService } from '../../services/instituteService';
import Loader from '../../components/common/Loader';
import './InstituteCommon.css';

const InstituteAttendance = () => {
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'history'
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  // Roster state
  const [rosterData, setRosterData] = useState(null);
  const [records, setRecords] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // History state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load batches
  useEffect(() => {
    instituteService.getBatches({ status: 'active' })
      .then((res) => {
        const list = res.data?.data || [];
        setBatches(list);
        if (list.length > 0) {
          setSelectedBatchId((prev) => prev || list[0]._id);
        }
      })
      .catch((err) => console.error('Error fetching batches:', err));
  }, []);

  // Fetch roster when batch or date changes
  const fetchRoster = useCallback(async () => {
    if (!selectedBatchId) return;
    setLoadingRoster(true);
    setError('');
    try {
      const res = await instituteService.getBatchRoster(selectedBatchId, selectedDate);
      const data = res.data?.data || null;
      setRosterData(data);

      if (data && Array.isArray(data.roster)) {
        setRecords(
          data.roster.map((r) => ({
            student: r.student?._id,
            status: r.status || 'present',
            remarks: r.remarks || '',
          }))
        );
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Error fetching batch roster:', err);
      setError(err.response?.data?.message || 'Could not load batch attendance roster.');
    } finally {
      setLoadingRoster(false);
    }
  }, [selectedBatchId, selectedDate]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await instituteService.getAttendanceHistory({ batchId: selectedBatchId });
      setHistory(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching attendance history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedBatchId]);

  useEffect(() => {
    if (activeTab === 'roster') {
      fetchRoster();
    } else {
      fetchHistory();
    }
  }, [activeTab, fetchRoster, fetchHistory]);

  const updateStudentStatus = (studentId, status) => {
    setRecords((prev) =>
      prev.map((r) => (String(r.student) === String(studentId) ? { ...r, status } : r))
    );
  };

  const updateStudentRemarks = (studentId, remarks) => {
    setRecords((prev) =>
      prev.map((r) => (String(r.student) === String(studentId) ? { ...r, remarks } : r))
    );
  };

  const markAll = (status) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleSaveAttendance = async () => {
    if (!selectedBatchId || records.length === 0) return;
    setSavingAttendance(true);
    setError('');

    try {
      const res = await instituteService.saveBatchAttendance({
        batchId: selectedBatchId,
        date: selectedDate,
        records,
      });
      setSuccessMsg(res.data?.message || 'Attendance saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      await fetchRoster();
    } catch (err) {
      console.error('Save attendance error:', err);
      setError(err.response?.data?.message || 'Could not save attendance.');
    } finally {
      setSavingAttendance(false);
    }
  };

  return (
    <div className="institute-page">
      <header className="institute-header">
        <div>
          <span className="institute-eyebrow"><FiCalendar /> STUDENT ATTENDANCE</span>
          <h1>Daily Batch Attendance</h1>
          <p>Mark daily attendance rosters, track class presence, and avoid duplicate records.</p>
        </div>
      </header>

      {successMsg && <div className="institute-alert institute-alert--success">{successMsg}</div>}
      {error && <div className="institute-alert institute-alert--danger">{error}</div>}

      {/* Tabs */}
      <div className="institute-tabs">
        <button
          className={`institute-tab-btn ${activeTab === 'roster' ? 'active' : ''}`}
          onClick={() => setActiveTab('roster')}
        >
          <FiCalendar /> Mark Daily Roster
        </button>
        <button
          className={`institute-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FiClock /> Attendance History
        </button>
      </div>

      {/* Selection toolbar */}
      <div className="institute-toolbar">
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
          <FiLayers color="#4f46e5" /> Batch:
          <select
            className="institute-select"
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
          >
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name} ({b.course?.name || 'General'})
              </option>
            ))}
          </select>
        </label>

        {activeTab === 'roster' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
            <FiCalendar color="#4f46e5" /> Date:
            <input
              type="date"
              className="institute-select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </label>
        )}
      </div>

      {activeTab === 'roster' ? (
        /* ROSTER VIEW */
        <div>
          {rosterData?.batch && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#0f172a' }}>
                  {rosterData.batch.name} &bull; <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 400 }}>{rosterData.batch.course?.name}</span>
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  <strong>Schedule:</strong> {rosterData.batch.schedule} &bull; <strong>Enrolled:</strong> {rosterData.roster?.length || 0} students
                </div>
              </div>

              <div>
                {rosterData.isAlreadyMarked ? (
                  <span className="institute-badge institute-badge--success">
                    <FiCheckCircle /> Recorded on this date
                  </span>
                ) : (
                  <span className="institute-badge institute-badge--warning">
                    <FiAlertCircle /> Pending submission
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Bulk actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="institute-btn-secondary institute-btn-sm"
                onClick={() => markAll('present')}
              >
                <FiCheck color="#059669" /> All Present
              </button>
              <button
                type="button"
                className="institute-btn-secondary institute-btn-sm"
                onClick={() => markAll('absent')}
              >
                <FiX color="#dc2626" /> All Absent
              </button>
            </div>

            <button
              type="button"
              className="institute-btn-primary"
              onClick={handleSaveAttendance}
              disabled={savingAttendance || !rosterData?.roster?.length}
            >
              <FiSave /> {savingAttendance ? 'Saving…' : 'Save Batch Attendance'}
            </button>
          </div>

          {/* Roster Table */}
          <div className="institute-table-card">
            {loadingRoster ? (
              <Loader />
            ) : !rosterData?.roster || rosterData.roster.length === 0 ? (
              <div className="institute-empty-state">
                <FiUsers />
                <h3>No Students Enrolled in this Batch</h3>
                <p>Add students to this batch from the Admissions page to record attendance.</p>
              </div>
            ) : (
              <div className="institute-table-scroll">
                <table className="institute-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Phone</th>
                      <th style={{ width: '320px' }}>Attendance Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rosterData.roster.map((item) => {
                      const student = item.student;
                      const record = records.find((r) => String(r.student) === String(student?._id)) || { status: 'present', remarks: '' };

                      return (
                        <tr key={student?._id}>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f46e5' }}>
                              {student?.studentId}
                            </span>
                          </td>
                          <td>
                            <strong>{student?.name}</strong>
                          </td>
                          <td>{student?.phone || '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => updateStudentStatus(student._id, 'present')}
                                style={{
                                  padding: '5px 12px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  borderRadius: '6px',
                                  border: '1px solid',
                                  cursor: 'pointer',
                                  borderColor: record.status === 'present' ? '#059669' : '#cbd5e1',
                                  background: record.status === 'present' ? '#ecfdf5' : '#fff',
                                  color: record.status === 'present' ? '#065f46' : '#64748b',
                                }}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStudentStatus(student._id, 'absent')}
                                style={{
                                  padding: '5px 12px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  borderRadius: '6px',
                                  border: '1px solid',
                                  cursor: 'pointer',
                                  borderColor: record.status === 'absent' ? '#dc2626' : '#cbd5e1',
                                  background: record.status === 'absent' ? '#fef2f2' : '#fff',
                                  color: record.status === 'absent' ? '#991b1b' : '#64748b',
                                }}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStudentStatus(student._id, 'late')}
                                style={{
                                  padding: '5px 12px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  borderRadius: '6px',
                                  border: '1px solid',
                                  cursor: 'pointer',
                                  borderColor: record.status === 'late' ? '#d97706' : '#cbd5e1',
                                  background: record.status === 'late' ? '#fffbeb' : '#fff',
                                  color: record.status === 'late' ? '#92400e' : '#64748b',
                                }}
                              >
                                Late
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStudentStatus(student._id, 'excused')}
                                style={{
                                  padding: '5px 12px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  borderRadius: '6px',
                                  border: '1px solid',
                                  cursor: 'pointer',
                                  borderColor: record.status === 'excused' ? '#4f46e5' : '#cbd5e1',
                                  background: record.status === 'excused' ? '#eef2ff' : '#fff',
                                  color: record.status === 'excused' ? '#3730a3' : '#64748b',
                                }}
                              >
                                Excused
                              </button>
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="Optional remarks..."
                              value={record.remarks}
                              onChange={(e) => updateStudentRemarks(student._id, e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* HISTORY VIEW */
        <div className="institute-table-card">
          {loadingHistory ? (
            <Loader />
          ) : history.length === 0 ? (
            <div className="institute-empty-state">
              <FiClock />
              <h3>No Attendance Records Found</h3>
              <p>Attendance records for this batch will show up here after being recorded.</p>
            </div>
          ) : (
            <div className="institute-table-scroll">
              <table className="institute-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Batch</th>
                    <th>Total Students</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Attendance Rate</th>
                    <th>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h._id}>
                      <td><strong>{new Date(h.date).toLocaleDateString()}</strong></td>
                      <td>{h.batch?.name}</td>
                      <td>{h.totalStudents}</td>
                      <td><span style={{ color: '#059669', fontWeight: 600 }}>{h.present}</span></td>
                      <td><span style={{ color: '#dc2626', fontWeight: 600 }}>{h.absent}</span></td>
                      <td><span style={{ color: '#d97706', fontWeight: 600 }}>{h.late}</span></td>
                      <td>
                        <span className={`institute-badge ${h.attendanceRate >= 75 ? 'institute-badge--success' : 'institute-badge--warning'}`}>
                          {h.attendanceRate}%
                        </span>
                      </td>
                      <td>{h.markedBy?.name || 'Staff'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InstituteAttendance;
