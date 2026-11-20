import { createElement, useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiActivity, FiArrowUpRight, FiCalendar, FiCheck, FiClock, FiEdit2,
  FiPlus, FiSearch, FiTarget, FiUser, FiUsers, FiX,
} from 'react-icons/fi';
import { gymService } from '../../services/gymService';
import Loader from '../../components/common/Loader';
import './GymDashboard.css';

const plans = ['monthly', 'quarterly', 'half_yearly', 'annual', 'class_pass'];
const memberStatuses = ['active', 'expired', 'paused', 'cancelled'];
const classStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
const titleCase = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
const dateTime = (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not scheduled';
const dateForInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const dateForDateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';
const initialMember = () => ({ name: '', memberCode: '', phone: '', email: '', plan: 'monthly', membershipStart: dateForDateInput(new Date()), membershipEnd: '', membershipStatus: 'active', emergencyContact: '', notes: '' });
const initialTrainer = { name: '', phone: '', email: '', specialties: '', status: 'active' };
const initialClass = { name: '', category: '', trainer: '', startsAt: '', durationMinutes: '60', capacity: '20', notes: '' };
const links = [
  ['overview', 'Overview', '/gym', FiActivity],
  ['members', 'Members & Plans', '/gym/members', FiUsers],
  ['trainers', 'Trainers', '/gym/trainers', FiUser],
  ['classes', 'Classes & Schedule', '/gym/classes', FiCalendar],
  ['attendance', 'Check-ins', '/gym/attendance', FiCheck],
];

const GymDashboard = () => {
  const location = useLocation();
  const section = location.pathname.split('/')[2] || 'overview';
  const [summary, setSummary] = useState(null);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [checkInMember, setCheckInMember] = useState('');
  const [enrollMembers, setEnrollMembers] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const requests = [];
      if (section === 'overview') requests.push(gymService.getSummary().then((r) => setSummary(r.data.data)));
      if (['overview', 'members', 'classes', 'attendance'].includes(section)) requests.push(gymService.getMembers({ status: section === 'members' ? filter : 'active', search: section === 'members' ? search.trim() : '' }).then((r) => setMembers(r.data.data || [])));
      if (['overview', 'trainers', 'classes'].includes(section)) requests.push(gymService.getTrainers({ status: section === 'trainers' ? filter : 'active', search: section === 'trainers' ? search.trim() : '' }).then((r) => setTrainers(r.data.data || [])));
      if (['overview', 'classes'].includes(section)) requests.push(gymService.getClasses(section === 'classes' ? { status: filter, search: search.trim() } : {}).then((r) => setClasses(r.data.data || [])));
      if (section === 'attendance') requests.push(gymService.getCheckIns({ search: search.trim() }).then((r) => setCheckIns(r.data.data || [])));
      await Promise.all(requests);
    } catch (requestError) {
      console.error('Unable to load gym workspace:', requestError);
      setError(requestError.response?.data?.message || 'Could not load fitness operations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [section, search, filter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, search]);
  useEffect(() => setFilter(''), [section]);

  const stats = summary || { activeMembers: 0, expiringMembers: 0, trainers: 0, scheduledClasses: 0, checkInsToday: 0, recentClasses: [], recentCheckIns: [] };
  const title = { overview: 'Fitness Overview', members: 'Members & Plans', trainers: 'Trainer Directory', classes: 'Classes & Schedule', attendance: 'Member Check-ins' }[section] || 'Fitness Overview';
  const openModal = (type, record = null) => {
    let values;
    if (type === 'member') values = record ? { ...initialMember(), ...record, membershipStart: dateForDateInput(record.membershipStart), membershipEnd: dateForDateInput(record.membershipEnd) } : initialMember();
    else if (type === 'trainer') values = record ? { ...initialTrainer, ...record, specialties: (record.specialties || []).join(', ') } : { ...initialTrainer };
    else values = record ? { ...initialClass, ...record, trainer: record.trainer?._id || '', startsAt: dateForInput(record.startsAt) } : { ...initialClass };
    setForm(values);
    setModal({ type, record });
  };
  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { type, record } = modal;
      const id = record?._id;
      if (type === 'member') {
        const data = { ...form, membershipStart: new Date(form.membershipStart).toISOString(), membershipEnd: new Date(form.membershipEnd).toISOString(), memberCode: form.memberCode.trim() || undefined };
        if (id) await gymService.updateMember(id, data); else await gymService.createMember(data);
      } else if (type === 'trainer') {
        const data = { ...form, specialties: form.specialties.split(',').map((value) => value.trim()).filter(Boolean) };
        if (id) await gymService.updateTrainer(id, data); else await gymService.createTrainer(data);
      } else {
        const data = { ...form, startsAt: new Date(form.startsAt).toISOString(), durationMinutes: Number(form.durationMinutes), capacity: Number(form.capacity) };
        if (id) await gymService.updateClass(id, data); else await gymService.createClass(data);
      }
      setModal(null);
      flash(`${titleCase(type)} ${id ? 'updated' : 'saved'}.`);
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save this record.');
    } finally {
      setSaving(false);
    }
  };
  const checkIn = async (event) => {
    event.preventDefault();
    if (!checkInMember) return;
    try {
      await gymService.createCheckIn({ member: checkInMember });
      setCheckInMember('');
      flash('Member checked in.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not check in this member.');
    }
  };
  const checkOut = async (record) => {
    try {
      await gymService.checkOut(record._id);
      flash(`${record.member?.name || 'Member'} checked out.`);
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not check out member.');
    }
  };
  const enroll = async (fitnessClass) => {
    const member = enrollMembers[fitnessClass._id];
    if (!member) {
      setError('Choose a member to enroll.');
      return;
    }
    try {
      await gymService.enrollMember(fitnessClass._id, { member });
      setEnrollMembers((value) => ({ ...value, [fitnessClass._id]: '' }));
      flash('Member enrolled in class.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not enroll member.');
    }
  };
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const activeMembers = members.filter((member) => member.membershipStatus === 'active' && new Date(member.membershipEnd) >= new Date());
  const visibleCheckIns = checkIns.filter((record) => !search || record.member?.name?.toLowerCase().includes(search.toLowerCase()));

  return <main className="gym-page">
    <header className="gym-header">
      <div><span className="gym-eyebrow"><FiTarget /> GYM & FITNESS OPERATIONS</span><h1>{title}</h1><p>Keep members moving with simple membership, trainer, class and attendance management.</p></div>
      <div className="gym-header__actions">
        {section === 'members' && <button className="gym-button gym-button--primary" onClick={() => openModal('member')}><FiPlus /> Add member</button>}
        {section === 'trainers' && <button className="gym-button gym-button--primary" onClick={() => openModal('trainer')}><FiPlus /> Add trainer</button>}
        {section === 'classes' && <button className="gym-button gym-button--primary" onClick={() => openModal('class')}><FiPlus /> Schedule class</button>}
      </div>
    </header>
    <nav className="gym-tabs" aria-label="Gym sections">{links.map(([key, label, path, icon]) => <Link key={key} to={path} className={`gym-tab ${section === key ? 'is-active' : ''}`}>{createElement(icon)} {label}</Link>)}</nav>
    {notice && <div className="gym-alert gym-alert--success" role="status"><FiCheck /> {notice}</div>}
    {error && <div className="gym-alert gym-alert--error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><FiX /></button></div>}
    {loading ? <div className="gym-loading"><Loader /></div> : <>
      {section === 'overview' && <section className="gym-overview">
        <div className="gym-hero"><div><span>STRENGTH · CONSISTENCY · COMMUNITY</span><h2>Build momentum, one visit at a time.</h2><p>See today’s classes and check-ins, monitor memberships, and keep your fitness floor running smoothly.</p><div><Link to="/gym/attendance" className="gym-button gym-button--light"><FiCheck /> Member check-ins</Link><Link to="/gym/classes" className="gym-button gym-button--ghost"><FiCalendar /> View class schedule</Link></div></div><div className="gym-hero__art"><FiActivity /></div></div>
        <div className="gym-stats"><Stat icon={FiUsers} tone="blue" label="Active members" value={stats.activeMembers} note="With current memberships" /><Stat icon={FiCalendar} tone="green" label="Classes today" value={stats.scheduledClasses} note={`${stats.trainers} active trainers`} /><Stat icon={FiCheck} tone="amber" label="Check-ins today" value={stats.checkInsToday} note="Member attendance" /><Stat icon={FiClock} tone="violet" label="Plans expiring soon" value={stats.expiringMembers} note="Next 30 days" /></div>
        <div className="gym-overview-grid"><section className="gym-panel"><PanelHeading kicker="TODAY'S PROGRAM" title="Upcoming classes" link="/gym/classes" />{stats.recentClasses.length ? stats.recentClasses.map((item) => <ClassRow key={item._id} fitnessClass={item} />) : <Empty icon={FiCalendar} title="No classes scheduled" text="Schedule a group class and assign an active trainer." action="Schedule class" click={() => openModal('class')} />}</section><section className="gym-panel"><PanelHeading kicker="MEMBER ACTIVITY" title="Recent check-ins" link="/gym/attendance" />{stats.recentCheckIns.length ? stats.recentCheckIns.map((record) => <div className="gym-checkin-row" key={record._id}><span><FiCheck /></span><div><strong>{record.member?.name || 'Member'}</strong><small>{dateTime(record.checkedInAt)}</small></div><Badge value={record.checkedOutAt ? 'checked_out' : 'checked_in'} /></div>) : <Empty icon={FiUsers} title="No check-ins yet today" text="Check in active members when they arrive." />}</section></div>
      </section>}
      {section === 'members' && <section className="gym-panel"><div className="gym-toolbar"><Search value={search} onChange={setSearch} placeholder="Search by name, member code or phone" /><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter members"><option value="">All membership statuses</option>{memberStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select><span className="gym-count">{members.length} members</span></div>{members.length ? <div className="gym-table-wrap"><table className="gym-table"><thead><tr><th>Member</th><th>Phone</th><th>Plan</th><th>Membership ends</th><th>Status</th><th /></tr></thead><tbody>{members.map((member) => <tr key={member._id}><td><strong>{member.name}</strong><small>{member.memberCode || member.email || 'Member profile'}</small></td><td>{member.phone}</td><td>{titleCase(member.plan)}</td><td>{new Date(member.membershipEnd).toLocaleDateString('en-IN')}</td><td><Badge value={member.membershipStatus} /></td><td><button className="gym-icon-button" onClick={() => openModal('member', member)} aria-label={`Edit ${member.name}`}><FiEdit2 /></button></td></tr>)}</tbody></table></div> : <Empty icon={FiUsers} title="Start your member directory" text="Add members and keep their membership plans and expiry dates up to date." action="Add member" click={() => openModal('member')} />}</section>}
      {section === 'trainers' && <section className="gym-panel"><div className="gym-toolbar"><Search value={search} onChange={setSearch} placeholder="Search trainers" /><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter trainers"><option value="">All trainers</option><option value="active">Active</option><option value="inactive">Inactive</option></select><span className="gym-count">{trainers.length} trainers</span></div>{trainers.length ? <div className="gym-card-grid">{trainers.map((trainer) => <article className="gym-card" key={trainer._id}><div className="gym-card__top"><span>FITNESS COACH</span><Badge value={trainer.status} /></div><h3>{trainer.name}</h3><p>{trainer.specialties?.join(' · ') || 'General fitness'} · {trainer.phone}</p><div className="gym-card__actions"><button className="gym-icon-button" onClick={() => openModal('trainer', trainer)} aria-label={`Edit ${trainer.name}`}><FiEdit2 /></button><button className="gym-button gym-button--small" onClick={() => gymService.updateTrainer(trainer._id, { status: trainer.status === 'active' ? 'inactive' : 'active' }).then(fetchData).catch((e) => setError(e.response?.data?.message || 'Could not update trainer.'))}>{trainer.status === 'active' ? 'Deactivate' : 'Activate'}</button></div></article>)}</div> : <Empty icon={FiUser} title="Add your coaching team" text="Record trainer contacts and specialties to assign classes." action="Add trainer" click={() => openModal('trainer')} />}</section>}
      {section === 'classes' && <section className="gym-panel"><div className="gym-toolbar"><Search value={search} onChange={setSearch} placeholder="Search classes or trainer" /><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter classes"><option value="">All class statuses</option>{classStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select><span className="gym-count">{classes.length} classes</span></div>{classes.length ? <div className="gym-card-grid">{classes.map((item) => <article className="gym-card" key={item._id}><div className="gym-card__top"><span>{item.category}</span><Badge value={item.status} /></div><h3>{item.name}</h3><p>{item.trainer?.name || 'Trainer'} · {dateTime(item.startsAt)}</p><div className="gym-card__meta"><span>{item.durationMinutes} min</span><span>{item.enrolledMembers?.length || 0}/{item.capacity} enrolled</span></div>{item.status === 'scheduled' && <div className="gym-enroll"><select value={enrollMembers[item._id] || ''} onChange={(e) => setEnrollMembers((value) => ({ ...value, [item._id]: e.target.value }))}><option value="">Select active member</option>{activeMembers.map((member) => <option key={member._id} value={member._id}>{member.name} · {member.memberCode || member.phone}</option>)}</select><button className="gym-button gym-button--small" onClick={() => enroll(item)}>Enroll</button></div>}<div className="gym-card__actions"><button className="gym-icon-button" onClick={() => openModal('class', item)} aria-label={`Edit ${item.name}`}><FiEdit2 /></button>{item.status === 'scheduled' && <button className="gym-button gym-button--small" onClick={() => gymService.updateClass(item._id, { status: 'cancelled' }).then(fetchData).catch((e) => setError(e.response?.data?.message || 'Could not cancel class.'))}>Cancel class</button>}</div></article>)}</div> : <Empty icon={FiCalendar} title="No classes in this schedule" text="Create a class, choose a trainer and set the participant capacity." action="Schedule class" click={() => openModal('class')} />}</section>}
      {section === 'attendance' && <section className="gym-panel"><form className="gym-checkin-form" onSubmit={checkIn}><label><span>Check in an active member</span><select required value={checkInMember} onChange={(e) => setCheckInMember(e.target.value)}><option value="">Choose member</option>{activeMembers.map((member) => <option key={member._id} value={member._id}>{member.name} · {member.memberCode || member.phone}</option>)}</select></label><button className="gym-button gym-button--primary" type="submit" disabled={!checkInMember}><FiCheck /> Check in</button></form><div className="gym-toolbar"><Search value={search} onChange={setSearch} placeholder="Search today's check-ins" /><span className="gym-count">{visibleCheckIns.length} check-ins</span></div>{visibleCheckIns.length ? <div className="gym-table-wrap"><table className="gym-table"><thead><tr><th>Member</th><th>Member code</th><th>Checked in</th><th>Checked out</th><th>Status</th><th /></tr></thead><tbody>{visibleCheckIns.map((record) => <tr key={record._id}><td><strong>{record.member?.name || 'Member'}</strong></td><td>{record.member?.memberCode || '—'}</td><td>{dateTime(record.checkedInAt)}</td><td>{record.checkedOutAt ? dateTime(record.checkedOutAt) : '—'}</td><td><Badge value={record.checkedOutAt ? 'checked_out' : 'checked_in'} /></td><td>{!record.checkedOutAt && <button className="gym-button gym-button--small" onClick={() => checkOut(record)}>Check out</button>}</td></tr>)}</tbody></table></div> : <Empty icon={FiCheck} title="No check-ins found today" text="Select a member above to record their gym visit." />}</section>}
    </>}
    {modal && <Dialog title={`${modal.record ? 'Edit' : 'Add'} ${modal.type}`} onClose={() => setModal(null)}><form className="gym-form" onSubmit={save}>
      {modal.type === 'member' && <div className="gym-form-grid"><Field label="Member name" required><input required value={form.name} onChange={(e) => setField('name', e.target.value)} /></Field><Field label="Phone" required><input required value={form.phone} onChange={(e) => setField('phone', e.target.value)} /></Field><Field label="Member code"><input value={form.memberCode || ''} onChange={(e) => setField('memberCode', e.target.value)} /></Field><Field label="Email"><input type="email" value={form.email || ''} onChange={(e) => setField('email', e.target.value)} /></Field><Field label="Membership plan"><select value={form.plan} onChange={(e) => setField('plan', e.target.value)}>{plans.map((plan) => <option key={plan} value={plan}>{titleCase(plan)}</option>)}</select></Field><Field label="Membership status"><select value={form.membershipStatus} onChange={(e) => setField('membershipStatus', e.target.value)}>{memberStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></Field><Field label="Start date" required><input required type="date" value={form.membershipStart} onChange={(e) => setField('membershipStart', e.target.value)} /></Field><Field label="End date" required><input required type="date" min={form.membershipStart} value={form.membershipEnd} onChange={(e) => setField('membershipEnd', e.target.value)} /></Field><Field label="Emergency contact"><input value={form.emergencyContact || ''} onChange={(e) => setField('emergencyContact', e.target.value)} /></Field><Field label="Notes" wide><textarea value={form.notes || ''} onChange={(e) => setField('notes', e.target.value)} /></Field></div>}
      {modal.type === 'trainer' && <div className="gym-form-grid"><Field label="Trainer name" required><input required value={form.name} onChange={(e) => setField('name', e.target.value)} /></Field><Field label="Phone" required><input required value={form.phone} onChange={(e) => setField('phone', e.target.value)} /></Field><Field label="Email"><input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} /></Field><Field label="Specialties"><input value={form.specialties} onChange={(e) => setField('specialties', e.target.value)} placeholder="Strength, yoga, HIIT" /></Field><Field label="Status"><select value={form.status} onChange={(e) => setField('status', e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field></div>}
      {modal.type === 'class' && <div className="gym-form-grid"><Field label="Class name" required><input required value={form.name} onChange={(e) => setField('name', e.target.value)} /></Field><Field label="Category"><input value={form.category} onChange={(e) => setField('category', e.target.value)} placeholder="Yoga, spin, HIIT" /></Field><Field label="Trainer" required><select required value={form.trainer} onChange={(e) => setField('trainer', e.target.value)}><option value="">Choose trainer</option>{trainers.filter((trainer) => trainer.status === 'active').map((trainer) => <option key={trainer._id} value={trainer._id}>{trainer.name}</option>)}</select></Field><Field label="Start time" required><input required type="datetime-local" min={dateForInput(new Date())} value={form.startsAt} onChange={(e) => setField('startsAt', e.target.value)} /></Field><Field label="Duration (minutes)" required><input required min="10" type="number" value={form.durationMinutes} onChange={(e) => setField('durationMinutes', e.target.value)} /></Field><Field label="Capacity" required><input required min="1" type="number" value={form.capacity} onChange={(e) => setField('capacity', e.target.value)} /></Field>{modal.record && <Field label="Status"><select value={form.status || modal.record.status} onChange={(e) => setField('status', e.target.value)}>{classStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></Field>}<Field label="Notes" wide><textarea value={form.notes || ''} onChange={(e) => setField('notes', e.target.value)} /></Field></div>}
      <div className="gym-form-actions"><button type="button" className="gym-button gym-button--neutral" onClick={() => setModal(null)} disabled={saving}>Cancel</button><button type="submit" className="gym-button gym-button--primary" disabled={saving}>{saving ? 'Saving…' : `${modal.record ? 'Save' : 'Create'} ${modal.type}`}</button></div>
    </form></Dialog>}
  </main>;
};

const Stat = ({ icon, tone, label, value, note }) => <article className="gym-stat"><span className={`gym-stat__icon gym-stat__icon--${tone}`}>{createElement(icon)}</span><div><small>{label}</small><strong>{value}</strong><small>{note}</small></div></article>;
const PanelHeading = ({ kicker, title, link }) => <div className="gym-panel-heading"><div><span className="gym-kicker">{kicker}</span><h2>{title}</h2></div>{link && <Link className="gym-link" to={link}>View all <FiArrowUpRight /></Link>}</div>;
const ClassRow = ({ fitnessClass }) => <article className="gym-class-row"><span><FiCalendar /></span><div><strong>{fitnessClass.name}</strong><small>{fitnessClass.trainer?.name || 'Trainer'} · {dateTime(fitnessClass.startsAt)}</small></div><b>{fitnessClass.enrolledMembers?.length || 0}/{fitnessClass.capacity}</b></article>;
const Badge = ({ value }) => <span className={`gym-badge gym-badge--${value}`}>{titleCase(value)}</span>;
const Search = ({ value, onChange, placeholder }) => <label className="gym-search"><FiSearch /><input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>;
const Empty = ({ icon, title, text, action, click }) => <div className="gym-empty"><span>{createElement(icon)}</span><h3>{title}</h3><p>{text}</p>{action && <button className="gym-button gym-button--primary" onClick={click}><FiPlus /> {action}</button>}</div>;
const Field = ({ label, required, wide, children }) => <label className={`gym-field ${wide ? 'gym-field--wide' : ''}`}><span>{label}{required && ' *'}</span>{children}</label>;
const Dialog = ({ title, onClose, children }) => <div className="gym-dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="gym-dialog" role="dialog" aria-modal="true" aria-labelledby="gym-dialog-title"><header><h2 id="gym-dialog-title">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog"><FiX /></button></header>{children}</section></div>;

export default GymDashboard;
