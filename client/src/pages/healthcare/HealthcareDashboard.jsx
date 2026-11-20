import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiActivity, FiArrowUpRight, FiCalendar, FiCheck, FiClock, FiEdit2,
  FiHeart, FiPlus, FiSearch, FiTrash2, FiUser, FiUsers, FiX,
} from 'react-icons/fi';
import { employeeService } from '../../services/employeeService';
import { healthcareService } from '../../services/healthcareService';
import Loader from '../../components/common/Loader';
import './HealthcareDashboard.css';

const appointmentStatuses = ['scheduled', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'];
const appointmentTypes = ['consultation', 'follow_up', 'diagnostic', 'procedure', 'other'];
const titleCase = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
const formatTime = (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not scheduled';
const dateForInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const emptyPatient = { name: '', patientCode: '', phone: '', email: '', dateOfBirth: '', gender: '', emergencyContactName: '', emergencyContactPhone: '', assignedProvider: '', administrativeNotes: '', status: 'active' };
const emptyAppointment = { patient: '', provider: '', scheduledAt: '', durationMinutes: '30', appointmentType: 'consultation', reason: '', administrativeNotes: '', status: 'scheduled' };

const HealthcareDashboard = () => {
  const location = useLocation();
  const section = location.pathname.split('/')[2] || 'overview';
  const [summary, setSummary] = useState(null);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [patientModal, setPatientModal] = useState(null);
  const [appointmentModal, setAppointmentModal] = useState(null);
  const [patientForm, setPatientForm] = useState(emptyPatient);
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointment);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const jobs = [];
      if (section === 'overview') {
        jobs.push(healthcareService.getSummary().then((response) => setSummary(response.data.data)));
      }
      if (['overview', 'patients', 'appointments'].includes(section)) {
        jobs.push(healthcareService.getPatients({ status: section === 'overview' ? 'active' : '', search: section === 'patients' ? search.trim() : '' })
          .then((response) => setPatients(response.data.data || [])));
      }
      if (section === 'appointments') {
        jobs.push(healthcareService.getAppointments({
          status: statusFilter || '',
        }).then((response) => setAppointments(response.data.data || [])));
      }
      if (['patients', 'appointments'].includes(section)) {
        jobs.push(employeeService.getEmployees({ limit: 200, status: 'active' })
          .then((response) => setEmployees(response.data?.data || [])));
      }
      await Promise.all(jobs);
    } catch (requestError) {
      console.error('Unable to load clinic workspace:', requestError);
      setError(requestError.response?.data?.message || 'Could not load the clinic workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [section, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, search]);

  const activePatients = useMemo(() => patients.filter((patient) => patient.status === 'active'), [patients]);
  const visibleAppointments = useMemo(() => appointments.filter((appointment) => (
    !search.trim() || appointment.patient?.name?.toLowerCase().includes(search.trim().toLowerCase())
  )), [appointments, search]);
  const pageTitle = { overview: 'Clinic Overview', patients: 'Patient Directory', appointments: 'Appointments' }[section] || 'Clinic Overview';
  const stats = summary || { patients: 0, appointmentsToday: 0, upcoming: 0, completed: 0, recentAppointments: [] };

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const openPatient = (patient = null) => {
    setPatientForm(patient ? {
      ...emptyPatient,
      ...patient,
      assignedProvider: patient.assignedProvider?._id || '',
      dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().slice(0, 10) : '',
    } : emptyPatient);
    setPatientModal(patient || {});
  };

  const savePatient = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...patientForm,
        patientCode: patientForm.patientCode.trim() || undefined,
        dateOfBirth: patientForm.dateOfBirth || null,
        assignedProvider: patientForm.assignedProvider || null,
      };
      if (patientModal?._id) await healthcareService.updatePatient(patientModal._id, payload);
      else await healthcareService.createPatient(payload);
      setPatientModal(null);
      flash(patientModal?._id ? 'Patient profile updated.' : 'Patient added to the directory.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save the patient profile.');
    } finally {
      setSaving(false);
    }
  };

  const removePatient = async (patient) => {
    if (!window.confirm(`Delete ${patient.name}'s record? Records with appointment history must be marked inactive instead.`)) return;
    try {
      await healthcareService.deletePatient(patient._id);
      flash('Patient record deleted.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not delete this patient record.');
    }
  };

  const openAppointment = (appointment = null) => {
    setAppointmentForm(appointment ? {
      ...emptyAppointment,
      ...appointment,
      patient: appointment.patient?._id || '',
      provider: appointment.provider?._id || '',
      scheduledAt: dateForInput(appointment.scheduledAt),
      durationMinutes: String(appointment.durationMinutes || 30),
    } : emptyAppointment);
    setAppointmentModal(appointment || {});
  };

  const saveAppointment = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...appointmentForm,
        scheduledAt: new Date(appointmentForm.scheduledAt).toISOString(),
        durationMinutes: Number(appointmentForm.durationMinutes || 30),
        provider: appointmentForm.provider || null,
      };
      if (appointmentModal?._id) await healthcareService.updateAppointment(appointmentModal._id, payload);
      else await healthcareService.createAppointment(payload);
      setAppointmentModal(null);
      flash(appointmentModal?._id ? 'Appointment updated.' : 'Appointment scheduled.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save this appointment.');
    } finally {
      setSaving(false);
    }
  };

  const updateAppointmentStatus = async (appointment, status) => {
    try {
      await healthcareService.updateAppointment(appointment._id, { status });
      flash('Appointment status updated.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update appointment status.');
    }
  };

  const removeAppointment = async (appointment) => {
    if (!window.confirm(`Delete the appointment for ${appointment.patient?.name || 'this patient'}?`)) return;
    try {
      await healthcareService.deleteAppointment(appointment._id);
      flash('Appointment deleted.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not delete this appointment.');
    }
  };

  return (
    <main className="hc-page">
      <header className="hc-header">
        <div>
          <span className="hc-eyebrow"><FiHeart /> HEALTHCARE & CLINIC OPERATIONS</span>
          <h1>{pageTitle}</h1>
          <p>Coordinate patient relationships and clinic appointments in one calm, organized workspace.</p>
        </div>
        <div className="hc-actions">
          {section !== 'appointments' && <button className="hc-button hc-button--primary" onClick={() => openPatient()}><FiPlus /> Add patient</button>}
          {section !== 'patients' && <button className="hc-button hc-button--outline" onClick={() => openAppointment()}><FiCalendar /> Schedule visit</button>}
        </div>
      </header>

      <nav className="hc-tabs" aria-label="Healthcare sections">
        {[
          { key: 'overview', label: 'Clinic Overview', path: '/healthcare', icon: FiActivity },
          { key: 'patients', label: 'Patients', path: '/healthcare/patients', icon: FiUsers },
          { key: 'appointments', label: 'Appointments', path: '/healthcare/appointments', icon: FiCalendar },
        ].map(({ key, label, path, icon }) => (
          <Link key={key} to={path} className={`hc-tab ${section === key ? 'is-active' : ''}`}>{createElement(icon)} {label}</Link>
        ))}
      </nav>

      {notice && <div className="hc-alert hc-alert--success" role="status"><FiCheck /> {notice}</div>}
      {error && <div className="hc-alert hc-alert--error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><FiX /></button></div>}

      {loading ? <div className="hc-loading"><Loader /></div> : (
        <>
          {section === 'overview' && (
            <section className="hc-overview">
              <div className="hc-hero">
                <span className="hc-hero__orb hc-hero__orb--one" /><span className="hc-hero__orb hc-hero__orb--two" />
                <div className="hc-hero__copy">
                  <span className="hc-hero__kicker">BETTER CARE STARTS WITH BETTER COORDINATION</span>
                  <h2>Make every patient visit feel well looked after.</h2>
                  <p>Keep contact records, appointment schedules, and front-desk follow-ups easy to manage across your clinic.</p>
                  <div className="hc-hero__actions"><button className="hc-button hc-button--light" onClick={() => openAppointment()}><FiCalendar /> Schedule appointment</button><Link className="hc-button hc-button--ghost" to="/healthcare/patients"><FiUsers /> Patient directory</Link></div>
                </div>
                <div className="hc-hero__art" aria-hidden="true"><div className="hc-cross"><i /><b /></div><div className="hc-heartbeat"><span /><span /><span /><span /><span /><span /><span /></div><small>CARE · COORDINATION · CONNECTION</small></div>
              </div>

              <div className="hc-stats">
                <Stat icon={FiUsers} tone="blue" label="Active patients" value={stats.patients} note="In your patient directory" />
                <Stat icon={FiCalendar} tone="green" label="Visits today" value={stats.appointmentsToday} note="Excluding cancellations" />
                <Stat icon={FiClock} tone="amber" label="Upcoming appointments" value={stats.upcoming} note="Scheduled or confirmed" />
                <Stat icon={FiCheck} tone="violet" label="Completed visits" value={stats.completed} note="All-time clinic activity" />
              </div>

              <section className="hc-panel">
                <div className="hc-panel__heading"><div><span className="hc-kicker">TODAY AT THE CLINIC</span><h2>Appointment schedule</h2><p>Today’s upcoming visits and patient check-ins.</p></div><Link to="/healthcare/appointments" className="hc-inline-link">View schedule <FiArrowUpRight /></Link></div>
                {stats.recentAppointments?.length ? <div className="hc-appointment-list">{stats.recentAppointments.map((appointment) => <AppointmentRow key={appointment._id} appointment={appointment} onEdit={() => openAppointment(appointment)} />)}</div> : <EmptyState icon={FiCalendar} title="Your schedule is clear" description="When a visit is booked for today, it will appear here." action="Schedule a visit" onClick={() => openAppointment()} />}
              </section>

              <section className="hc-panel hc-patient-panel">
                <div className="hc-panel__heading"><div><span className="hc-kicker">PATIENT RELATIONSHIPS</span><h2>Recently updated patients</h2></div><Link to="/healthcare/patients" className="hc-inline-link">Patient directory <FiArrowUpRight /></Link></div>
                {activePatients.length ? <div className="hc-patient-preview">{activePatients.slice(0, 4).map((patient) => <PatientCard key={patient._id} patient={patient} onEdit={() => openPatient(patient)} compact />)}</div> : <EmptyState icon={FiUsers} title="Start your patient directory" description="Create a patient profile to coordinate contact details and appointments." action="Add first patient" onClick={() => openPatient()} />}
              </section>
              <p className="hc-privacy-note">This workspace is for patient contact and appointment administration. Do not enter diagnoses, prescriptions, or clinical records here.</p>
            </section>
          )}

          {section === 'patients' && (
            <>
              <div className="hc-toolbar">
                <label className="hc-search"><FiSearch /><input type="search" placeholder="Search name, patient ID, phone, or email" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
                <span className="hc-count">{patients.length} patient records</span>
              </div>
              {patients.length ? <div className="hc-patient-grid">{patients.map((patient) => <PatientCard key={patient._id} patient={patient} onEdit={() => openPatient(patient)} onDelete={() => removePatient(patient)} />)}</div> : <section className="hc-panel"><EmptyState icon={FiUsers} title="No patient profiles found" description="Add a patient profile or adjust your search to see matching records." action="Add patient" onClick={() => openPatient()} /></section>}
              <p className="hc-privacy-note">Store contact and scheduling details only. Keep clinical documentation in your approved clinical records system.</p>
            </>
          )}

          {section === 'appointments' && (
            <section className="hc-panel">
              <div className="hc-toolbar hc-toolbar--inside">
                <label className="hc-search"><FiSearch /><input type="search" placeholder="Search is available by patient directory" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
                <select className="hc-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter appointments by status">
                  <option value="">All statuses</option>{appointmentStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
                </select>
                <span className="hc-count">{appointments.length} appointments</span>
              </div>
              {visibleAppointments.length ? <div className="hc-appointment-list">{visibleAppointments.map((appointment) => <AppointmentRow key={appointment._id} appointment={appointment} onEdit={() => openAppointment(appointment)} onDelete={() => removeAppointment(appointment)} onStatus={(status) => updateAppointmentStatus(appointment, status)} />)}</div> : <EmptyState icon={FiCalendar} title="No appointments in this view" description="Schedule a patient visit or choose a different status or search." action="Schedule appointment" onClick={() => openAppointment()} />}
            </section>
          )}
        </>
      )}

      {patientModal !== null && <Dialog title={patientModal?._id ? 'Update patient profile' : 'Add patient profile'} onClose={() => setPatientModal(null)}>
        <form className="hc-form" onSubmit={savePatient}>
          <div className="hc-form-notice"><FiHeart /> Patient contact and administrative information only. Avoid clinical notes.</div>
          <div className="hc-form-grid">
            <Field label="Patient name" required><input required maxLength="160" value={patientForm.name} onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })} /></Field>
            <Field label="Patient ID"><input maxLength="40" value={patientForm.patientCode} onChange={(e) => setPatientForm({ ...patientForm, patientCode: e.target.value })} placeholder="Optional unique ID" /></Field>
            <Field label="Phone" required><input required value={patientForm.phone} onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })} /></Field>
            <Field label="Email"><input type="email" value={patientForm.email} onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })} /></Field>
            <Field label="Date of birth"><input type="date" value={patientForm.dateOfBirth} onChange={(e) => setPatientForm({ ...patientForm, dateOfBirth: e.target.value })} /></Field>
            <Field label="Gender (optional)"><select value={patientForm.gender} onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}><option value="">Not provided</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option><option value="prefer_not_to_say">Prefer not to say</option></select></Field>
            <Field label="Assigned provider / staff"><select value={patientForm.assignedProvider} onChange={(e) => setPatientForm({ ...patientForm, assignedProvider: e.target.value })}><option value="">Unassigned</option>{employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.user?.name || employee.employeeId}{employee.designation ? ` · ${employee.designation}` : ''}</option>)}</select></Field>
            <Field label="Profile status"><select value={patientForm.status} onChange={(e) => setPatientForm({ ...patientForm, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
            <Field label="Emergency contact name"><input value={patientForm.emergencyContactName} onChange={(e) => setPatientForm({ ...patientForm, emergencyContactName: e.target.value })} /></Field>
            <Field label="Emergency contact phone"><input value={patientForm.emergencyContactPhone} onChange={(e) => setPatientForm({ ...patientForm, emergencyContactPhone: e.target.value })} /></Field>
            <Field label="Administrative notes" wide><textarea rows="3" maxLength="2000" value={patientForm.administrativeNotes} onChange={(e) => setPatientForm({ ...patientForm, administrativeNotes: e.target.value })} placeholder="Contact preferences or front-desk coordination only" /></Field>
          </div>
          <FormActions onCancel={() => setPatientModal(null)} saving={saving} label={patientModal?._id ? 'Save patient' : 'Add patient'} />
        </form>
      </Dialog>}

      {appointmentModal !== null && <Dialog title={appointmentModal?._id ? 'Update appointment' : 'Schedule an appointment'} onClose={() => setAppointmentModal(null)}>
        <form className="hc-form" onSubmit={saveAppointment}>
          <div className="hc-form-notice"><FiCalendar /> Manage appointment logistics only. Clinical notes are not stored in this module.</div>
          <div className="hc-form-grid">
            <Field label="Patient" required wide><select required value={appointmentForm.patient} onChange={(e) => setAppointmentForm({ ...appointmentForm, patient: e.target.value })}><option value="">Select a patient</option>{patients.filter((patient) => patient.status === 'active').map((patient) => <option key={patient._id} value={patient._id}>{patient.name}{patient.patientCode ? ` · ${patient.patientCode}` : ''} — {patient.phone}</option>)}</select></Field>
            <Field label="Date & time" required><input required type="datetime-local" value={appointmentForm.scheduledAt} onChange={(e) => setAppointmentForm({ ...appointmentForm, scheduledAt: e.target.value })} /></Field>
            <Field label="Duration"><select value={appointmentForm.durationMinutes} onChange={(e) => setAppointmentForm({ ...appointmentForm, durationMinutes: e.target.value })}>{[15, 30, 45, 60, 90, 120].map((minutes) => <option value={minutes} key={minutes}>{minutes} minutes</option>)}</select></Field>
            <Field label="Appointment type"><select value={appointmentForm.appointmentType} onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentType: e.target.value })}>{appointmentTypes.map((type) => <option key={type} value={type}>{titleCase(type)}</option>)}</select></Field>
            <Field label="Provider / staff"><select value={appointmentForm.provider} onChange={(e) => setAppointmentForm({ ...appointmentForm, provider: e.target.value })}><option value="">Not assigned</option>{employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.user?.name || employee.employeeId}{employee.designation ? ` · ${employee.designation}` : ''}</option>)}</select></Field>
            <Field label="Status"><select value={appointmentForm.status} onChange={(e) => setAppointmentForm({ ...appointmentForm, status: e.target.value })}>{appointmentStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></Field>
            <Field label="Visit purpose (administrative)" wide><input maxLength="500" value={appointmentForm.reason} onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })} placeholder="e.g. Routine consultation, follow-up booking" /></Field>
            <Field label="Administrative notes" wide><textarea rows="3" maxLength="2000" value={appointmentForm.administrativeNotes} onChange={(e) => setAppointmentForm({ ...appointmentForm, administrativeNotes: e.target.value })} placeholder="Front-desk and scheduling notes only" /></Field>
          </div>
          <FormActions onCancel={() => setAppointmentModal(null)} saving={saving} label={appointmentModal?._id ? 'Save appointment' : 'Schedule appointment'} />
        </form>
      </Dialog>}
    </main>
  );
};

const Stat = ({ icon, tone, label, value, note }) => (
  <article className="hc-stat"><div className={`hc-stat__icon hc-stat__icon--${tone}`}>{createElement(icon)}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>
);

const PatientCard = ({ patient, onEdit, onDelete, compact = false }) => (
  <article className={`hc-patient-card ${compact ? 'hc-patient-card--compact' : ''}`}>
    <div className="hc-patient-card__top"><div className="hc-patient-avatar"><FiUser /></div><span className={`hc-status hc-status--${patient.status}`}>{titleCase(patient.status)}</span></div>
    <h3>{patient.name}</h3><div className="hc-patient-code">{patient.patientCode || 'Patient ID not assigned'}</div>
    <a href={`tel:${patient.phone}`} className="hc-patient-contact">{patient.phone}</a>{patient.email && <a href={`mailto:${patient.email}`} className="hc-patient-contact">{patient.email}</a>}
    <div className="hc-patient-provider"><FiHeart /> {patient.assignedProvider?.user?.name || 'No provider assigned'}</div>
    {!compact && <div className="hc-patient-card__footer"><span>{patient.dateOfBirth ? `DOB ${new Date(patient.dateOfBirth).toLocaleDateString('en-IN')}` : 'DOB not provided'}</span><div><button className="hc-icon-action" onClick={onEdit} aria-label={`Edit ${patient.name}`}><FiEdit2 /></button>{onDelete && <button className="hc-icon-action hc-icon-action--danger" onClick={onDelete} aria-label={`Delete ${patient.name}`}><FiTrash2 /></button>}</div></div>}
    {compact && <button className="hc-inline-link" onClick={onEdit}>Edit profile <FiArrowUpRight /></button>}
  </article>
);

const AppointmentRow = ({ appointment, onEdit, onDelete, onStatus }) => (
  <article className="hc-appointment-row">
    <div className="hc-appointment-time"><FiCalendar /><span>{formatTime(appointment.scheduledAt)}</span></div>
    <div className="hc-appointment-patient"><strong>{appointment.patient?.name || 'Patient record unavailable'}</strong><span>{appointment.patient?.phone || 'No phone'} · {titleCase(appointment.appointmentType)}</span>{appointment.reason && <small>{appointment.reason}</small>}</div>
    <div className="hc-appointment-provider"><span>Provider / staff</span><strong>{appointment.provider?.user?.name || 'Unassigned'}</strong></div>
    {onStatus ? <select className={`hc-status-select hc-status-select--${appointment.status}`} value={appointment.status} onChange={(event) => onStatus(event.target.value)} aria-label={`Update appointment status for ${appointment.patient?.name || 'patient'}`}>{appointmentStatuses.map((status) => <option value={status} key={status}>{titleCase(status)}</option>)}</select> : <span className={`hc-status hc-status--${appointment.status}`}>{titleCase(appointment.status)}</span>}
    {onEdit && <button className="hc-icon-action" onClick={onEdit} aria-label="Edit appointment"><FiEdit2 /></button>}
    {onDelete && <button className="hc-icon-action hc-icon-action--danger" onClick={onDelete} aria-label="Delete appointment"><FiTrash2 /></button>}
  </article>
);

const EmptyState = ({ icon, title, description, action, onClick }) => (
  <div className="hc-empty"><span>{createElement(icon)}</span><h3>{title}</h3><p>{description}</p>{action && <button className="hc-button hc-button--primary" onClick={onClick}><FiPlus /> {action}</button>}</div>
);

const Dialog = ({ title, onClose, children }) => (
  <div className="hc-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="hc-dialog" role="dialog" aria-modal="true" aria-labelledby="healthcare-dialog-title">
      <header><h2 id="healthcare-dialog-title">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog"><FiX /></button></header>{children}
    </section>
  </div>
);

const Field = ({ label, required, wide, children }) => <label className={`hc-field ${wide ? 'hc-field--wide' : ''}`}><span>{label}{required && <b> *</b>}</span>{children}</label>;
const FormActions = ({ onCancel, saving, label }) => <div className="hc-form-actions"><button type="button" className="hc-button hc-button--neutral" onClick={onCancel} disabled={saving}>Cancel</button><button type="submit" className="hc-button hc-button--primary" disabled={saving}>{saving ? 'Saving...' : label}</button></div>;

export default HealthcareDashboard;
