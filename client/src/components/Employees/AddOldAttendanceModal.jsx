import { useState, useEffect, useMemo } from 'react';
import { FiCalendar, FiClock, FiCheck, FiAlertCircle, FiSearch } from 'react-icons/fi';
import dayjs from 'dayjs';
import Modal from '../common/Modal';
import { employeeService } from '../../services/employeeService';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'Late' },
  { value: 'wfh', label: 'Work From Home (WFH)' },
  { value: 'half-day', label: 'Half Day' },
  { value: 'absent', label: 'Absent' },
  { value: 'leave', label: 'On Leave' },
];

const NO_TIME_STATUSES = new Set(['absent', 'leave']);

const AddOldAttendanceModal = ({
  isOpen,
  onClose,
  onSuccess,
  defaultEmployeeId = '',
  employeesList = null,
}) => {
  const todayStr = dayjs().format('YYYY-MM-DD');
  const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    employeeId: defaultEmployeeId || '',
    date: yesterdayStr,
    status: 'present',
    checkInTime: '09:30',
    checkOutTime: '18:30',
    notes: '',
    overwrite: false,
  });

  useEffect(() => {
    if (!isOpen) return;

    setError('');
    setEmpSearch('');
    setForm({
      employeeId: defaultEmployeeId || '',
      date: yesterdayStr,
      status: 'present',
      checkInTime: '09:30',
      checkOutTime: '18:30',
      notes: '',
      overwrite: false,
    });

    if (Array.isArray(employeesList) && employeesList.length > 0) {
      setEmployees(employeesList);
      return;
    }

    let cancelled = false;
    const loadEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const res = await employeeService.getEmployees({ limit: 500 });
        if (!cancelled && res.data?.success) {
          setEmployees(res.data.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load employees list.');
        }
      } finally {
        if (!cancelled) setLoadingEmployees(false);
      }
    };
    loadEmployees();

    return () => {
      cancelled = true;
    };
  }, [isOpen, defaultEmployeeId, employeesList, yesterdayStr]);

  const filteredEmployees = useMemo(() => {
    const sorted = [...employees].sort((a, b) =>
      (a.user?.name || a.employeeId || '').localeCompare(b.user?.name || b.employeeId || '')
    );
    const term = empSearch.trim().toLowerCase();
    if (!term) return sorted;
    return sorted.filter((emp) => {
      const name = (emp.user?.name || '').toLowerCase();
      const id = (emp.employeeId || '').toLowerCase();
      const dept = (emp.department || '').toLowerCase();
      return name.includes(term) || id.includes(term) || dept.includes(term) || emp._id === form.employeeId;
    });
  }, [employees, empSearch, form.employeeId]);

  const requiresTimes = !NO_TIME_STATUSES.has(form.status);

  const previewDuration = useMemo(() => {
    if (!requiresTimes || !form.date || !form.checkInTime || !form.checkOutTime) return null;
    const start = new Date(`${form.date}T${form.checkInTime}:00`);
    const end = new Date(`${form.date}T${form.checkOutTime}:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;
    const mins = Math.round((end - start) / 60000);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  }, [requiresTimes, form.date, form.checkInTime, form.checkOutTime]);

  const handleStatusChange = (nextStatus) => {
    setForm((prev) => ({
      ...prev,
      status: nextStatus,
      checkOutTime: nextStatus === 'half-day' && prev.checkOutTime === '18:30'
        ? '13:30'
        : nextStatus !== 'half-day' && prev.checkOutTime === '13:30'
          ? '18:30'
          : prev.checkOutTime,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.employeeId) {
      setError('Please select an employee.');
      return;
    }
    if (!form.date) {
      setError('Please select a date.');
      return;
    }
    if (form.date > todayStr) {
      setError('Future dates are not allowed. Choose today or an earlier date.');
      return;
    }

    let checkInIso = null;
    let checkOutIso = null;
    if (requiresTimes) {
      if (!form.checkInTime) {
        setError('Check-in time is required.');
        return;
      }
      const start = new Date(`${form.date}T${form.checkInTime}:00`);
      if (isNaN(start.getTime())) {
        setError('Invalid check-in time.');
        return;
      }
      checkInIso = start.toISOString();

      if (form.checkOutTime) {
        const end = new Date(`${form.date}T${form.checkOutTime}:00`);
        if (isNaN(end.getTime()) || end <= start) {
          setError('Check-out time must be later than check-in time.');
          return;
        }
        checkOutIso = end.toISOString();
      }
    }

    try {
      setSaving(true);
      const payload = {
        employeeId: form.employeeId,
        date: form.date,
        status: form.status,
        checkIn: checkInIso,
        checkOut: checkOutIso,
        checkInTime: requiresTimes ? form.checkInTime : undefined,
        checkOutTime: requiresTimes && form.checkOutTime ? form.checkOutTime : undefined,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
        notes: form.notes.trim(),
        overwrite: form.overwrite,
      };

      const res = await employeeService.markManualAttendance(payload);
      if (res.data?.success) {
        if (onSuccess) {
          await onSuccess(res.data.data, form.date);
        }
        onClose();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not save attendance record. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Old Attendance" size="md">
      <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              marginBottom: '16px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '13px',
            }}
          >
            <FiAlertCircle style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Employee Picker */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">
            Employee <span style={{ color: '#ef4444' }}>*</span>
          </label>
          {!defaultEmployeeId && employees.length > 6 && (
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <FiSearch
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  fontSize: '14px',
                }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Filter employee by name, ID or department..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                style={{ paddingLeft: '36px', fontSize: '13px' }}
              />
            </div>
          )}
          <select
            className="form-select"
            value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            disabled={Boolean(defaultEmployeeId) || loadingEmployees}
            required
          >
            <option value="">
              {loadingEmployees ? 'Loading employees...' : 'Select an employee'}
            </option>
            {filteredEmployees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.user?.name || 'Unnamed'} ({emp.employeeId || 'No ID'})
                {emp.department ? ` — ${emp.department}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Date & Status */}
        <div className="form-grid" style={{ gap: '16px', marginBottom: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiCalendar /> Attendance Date <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              className="form-input"
              value={form.date}
              max={todayStr}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Status <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              className="form-select"
              value={form.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              required
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Check-In & Check-Out Times */}
        {requiresTimes && (
          <div style={{ marginBottom: '16px' }}>
            <div className="form-grid" style={{ gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiClock /> Check-In Time <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="time"
                  className="form-input"
                  value={form.checkInTime}
                  onChange={(e) => setForm({ ...form, checkInTime: e.target.value })}
                  required={requiresTimes}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiClock /> Check-Out Time
                </label>
                <input
                  type="time"
                  className="form-input"
                  value={form.checkOutTime}
                  onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })}
                />
              </div>
            </div>
            {previewDuration && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#4f46e5', fontWeight: 500 }}>
                Calculated Duration: {previewDuration}
              </div>
            )}
          </div>
        )}

        {/* Notes / Reason */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Notes / Reason</label>
          <textarea
            className="form-textarea"
            rows={2}
            style={{ minHeight: '68px' }}
            placeholder="e.g., Missed punch-in, client site visit, manual correction..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        {/* Overwrite option */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#374151',
            cursor: 'pointer',
            marginBottom: '20px',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={form.overwrite}
            onChange={(e) => setForm({ ...form, overwrite: e.target.checked })}
          />
          <span>Update existing record if attendance already exists for this date</span>
        </label>

        {/* Footer Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            paddingTop: '14px',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FiCheck /> {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddOldAttendanceModal;
