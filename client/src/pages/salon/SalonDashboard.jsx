import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiActivity, FiArrowUpRight, FiCalendar, FiCheck, FiClock, FiEdit2,
  FiHeart, FiPackage, FiPlus, FiSearch, FiScissors, FiUser, FiUsers, FiX,
} from 'react-icons/fi';
import { salonService } from '../../services/salonService';
import Loader from '../../components/common/Loader';
import './SalonDashboard.css';

const appointmentStatuses = ['booked', 'confirmed', 'checked_in', 'in_service', 'completed', 'cancelled', 'no_show'];
const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
const titleCase = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
const formatDate = (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not scheduled';
const dateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const emptyService = { name: '', category: '', description: '', durationMinutes: '30', price: '', active: true };
const emptyStaff = { name: '', phone: '', email: '', specialties: '', workingDays: [...weekdays.slice(0, 6)], shiftStart: '09:00', shiftEnd: '18:00', status: 'active' };
const emptyClient = { name: '', phone: '', email: '', membership: 'none', membershipExpiresAt: '', notes: '' };
const emptyProduct = { name: '', category: '', quantity: '0', reorderLevel: '0', unit: '', unitCost: '0', supplier: '', status: 'active' };
const emptyAppointment = { client: '', staff: '', service: '', scheduledAt: '', notes: '' };
const links = [
  ['overview', 'Overview', '/salon', FiActivity],
  ['appointments', 'Appointments', '/salon/appointments', FiCalendar],
  ['services', 'Services & Pricing', '/salon/services', FiScissors],
  ['team', 'Staff & Schedules', '/salon/team', FiUsers],
  ['clients', 'Clients & Memberships', '/salon/clients', FiHeart],
  ['inventory', 'Product Stock', '/salon/inventory', FiPackage],
];

const SalonDashboard = () => {
  const location = useLocation();
  const section = location.pathname.split('/')[2] || 'overview';
  const [summary, setSummary] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const jobs = [];
      if (section === 'overview') jobs.push(salonService.getSummary().then((r) => setSummary(r.data.data)));
      if (['overview', 'appointments'].includes(section)) {
        const day = new Date();
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        jobs.push(salonService.getAppointments(section === 'overview'
          ? { from: start.toISOString(), to: end.toISOString() }
          : { status: statusFilter, search: search.trim() }).then((r) => setAppointments(r.data.data || [])));
      }
      if (['services', 'appointments'].includes(section)) jobs.push(salonService.getServices({ ...(section === 'appointments' ? { active: 'true' } : {}), search: section === 'services' ? search.trim() : '' }).then((r) => setServices(r.data.data || [])));
      if (['team', 'appointments'].includes(section)) jobs.push(salonService.getStaff({ ...(section === 'appointments' ? { status: 'active' } : {}), search: section === 'team' ? search.trim() : '' }).then((r) => setStaff(r.data.data || [])));
      if (['clients', 'appointments'].includes(section)) jobs.push(salonService.getClients({ search: section === 'clients' ? search.trim() : '' }).then((r) => setClients(r.data.data || [])));
      if (section === 'inventory') jobs.push(salonService.getProducts({ search: search.trim() }).then((r) => setProducts(r.data.data || [])));
      if (section === 'overview') jobs.push(salonService.getProducts({}).then((r) => setProducts(r.data.data || [])));
      await Promise.all(jobs);
    } catch (requestError) {
      console.error('Unable to load salon workspace:', requestError);
      setError(requestError.response?.data?.message || 'Could not load the salon workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [section, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, search]);
  useEffect(() => setStatusFilter(''), [section]);

  const pageTitle = { overview: 'Salon Overview', appointments: 'Appointments', services: 'Services & Pricing', team: 'Staff & Schedules', clients: 'Clients & Memberships', inventory: 'Product Stock' }[section] || 'Salon Overview';
  const stats = summary || { appointmentsToday: 0, upcoming: 0, clients: 0, activeStaff: 0, activeServices: 0, lowStock: 0, salesToday: 0, completedToday: 0, recentAppointments: [] };
  const availableServices = useMemo(() => services.filter((item) => item.active), [services]);
  const openModal = (type, record = null) => {
    const templates = { service: emptyService, staff: emptyStaff, client: emptyClient, product: emptyProduct, appointment: emptyAppointment };
    let values = record ? { ...templates[type], ...record } : { ...templates[type] };
    if (type === 'staff' && record) values.specialties = (record.specialties || []).join(', ');
    if (type === 'client' && record) values.membershipExpiresAt = record.membershipExpiresAt ? new Date(record.membershipExpiresAt).toISOString().slice(0, 10) : '';
    if (type === 'appointment' && record) values = { ...values, client: record.client?._id || '', staff: record.staff?._id || '', service: record.service?._id || '', scheduledAt: dateInput(record.scheduledAt) };
    if (type === 'product' && record) values = { ...values, quantity: String(record.quantity), reorderLevel: String(record.reorderLevel), unitCost: String(record.unitCost) };
    setForm(values);
    setModal({ type, record });
  };

  const save = async (event) => {
    event.preventDefault();
    if (modal.type === 'appointment' && (!services.length || !staff.length || !clients.length)) {
      setError('Add at least one service, active team member, and client before booking an appointment.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { type, record } = modal;
      const id = record?._id;
      if (type === 'service') {
        const data = { ...form, durationMinutes: Number(form.durationMinutes), price: Number(form.price) };
        if (id) await salonService.updateService(id, data); else await salonService.createService(data);
      } else if (type === 'staff') {
        const data = { ...form, specialties: form.specialties.split(',').map((item) => item.trim()).filter(Boolean) };
        if (id) await salonService.updateStaff(id, data); else await salonService.createStaff(data);
      } else if (type === 'client') {
        const data = { ...form, membershipExpiresAt: form.membershipExpiresAt || null };
        if (id) await salonService.updateClient(id, data); else await salonService.createClient(data);
      } else if (type === 'product') {
        const data = { ...form, quantity: Number(form.quantity), reorderLevel: Number(form.reorderLevel), unitCost: Number(form.unitCost) };
        if (id) await salonService.updateProduct(id, data); else await salonService.createProduct(data);
      } else if (type === 'appointment') {
        const data = { ...form, scheduledAt: new Date(form.scheduledAt).toISOString() };
        if (id) await salonService.updateAppointment(id, data); else await salonService.createAppointment(data);
      }
      setModal(null);
      setNotice(`${titleCase(type)} ${id ? 'updated' : 'created'} successfully.`);
      window.setTimeout(() => setNotice(''), 3500);
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save this record.');
    } finally {
      setSaving(false);
    }
  };

  const updateAppointment = async (appointment, updates) => {
    try {
      await salonService.updateAppointment(appointment._id, updates);
      setNotice('Appointment updated.');
      window.setTimeout(() => setNotice(''), 3500);
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update appointment.');
    }
  };

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const visibleAppointments = appointments.filter((item) => !search || `${item.client?.name || ''} ${item.serviceName} ${item.staff?.name || ''}`.toLowerCase().includes(search.toLowerCase()));
  const lowStock = products.filter((item) => item.status === 'active' && item.quantity <= item.reorderLevel);

  return <main className="salon-page">
    <header className="salon-header">
      <div><span className="salon-eyebrow"><FiScissors /> SALON & SPA OPERATIONS</span><h1>{pageTitle}</h1><p>Manage appointments, your service team, client memberships and product stock in one place.</p></div>
      <div className="salon-header__actions">
        {section === 'appointments' && <button className="salon-button salon-button--primary" onClick={() => openModal('appointment')}><FiPlus /> Book appointment</button>}
        {section === 'services' && <button className="salon-button salon-button--primary" onClick={() => openModal('service')}><FiPlus /> Add service</button>}
        {section === 'team' && <button className="salon-button salon-button--primary" onClick={() => openModal('staff')}><FiPlus /> Add team member</button>}
        {section === 'clients' && <button className="salon-button salon-button--primary" onClick={() => openModal('client')}><FiPlus /> Add client</button>}
        {section === 'inventory' && <button className="salon-button salon-button--primary" onClick={() => openModal('product')}><FiPlus /> Add product</button>}
      </div>
    </header>
    <nav className="salon-tabs" aria-label="Salon sections">{links.map(([key, label, path, icon]) => <Link key={key} to={path} className={`salon-tab ${section === key ? 'is-active' : ''}`}>{createElement(icon)} {label}</Link>)}</nav>
    {notice && <div className="salon-alert salon-alert--success" role="status"><FiCheck /> {notice}</div>}
    {error && <div className="salon-alert salon-alert--error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><FiX /></button></div>}
    {loading ? <div className="salon-loading"><Loader /></div> : <>
      {section === 'overview' && <section className="salon-overview">
        <div className="salon-hero"><div><span>CARE · CONFIDENCE · WELLNESS</span><h2>Make every visit feel personal.</h2><p>Keep your schedule flowing and give your team one clear view of today’s guests.</p><div><Link className="salon-button salon-button--light" to="/salon/appointments"><FiCalendar /> View appointments</Link><Link className="salon-button salon-button--ghost" to="/salon/clients"><FiHeart /> Client memberships</Link></div></div><div className="salon-hero__art" aria-hidden="true"><FiScissors /></div></div>
        <div className="salon-stats">
          <Stat icon={FiCalendar} tone="rose" label="Appointments today" value={stats.appointmentsToday} note={`${stats.upcoming} upcoming bookings`} />
          <Stat icon={FiUsers} tone="violet" label="Active clients" value={stats.clients} note="Client profiles & memberships" />
          <Stat icon={FiScissors} tone="amber" label="Services available" value={stats.activeServices} note={`${stats.activeStaff} active team members`} />
          <Stat icon={FiPackage} tone="green" label="Products low in stock" value={stats.lowStock} note="Check product stock levels" />
        </div>
        <div className="salon-overview-grid">
          <section className="salon-panel"><PanelHeading kicker="TODAY'S DIARY" title="Appointments" link="/salon/appointments" linkLabel="Open schedule" />{stats.recentAppointments.length ? stats.recentAppointments.slice(0, 6).map((item) => <AppointmentRow key={item._id} appointment={item} onStatus={(status) => updateAppointment(item, { status })} />) : <Empty icon={FiCalendar} title="No appointments scheduled" text="Add a booking to start filling today’s diary." action="Book appointment" click={() => openModal('appointment')} />}</section>
          <section className="salon-panel"><PanelHeading kicker="SERVICE HEALTH" title="Today's performance" /><div className="salon-revenue"><span>Completed services</span><strong>{stats.completedToday}</strong></div><div className="salon-revenue"><span>Service revenue</span><strong>{money(stats.salesToday)}</strong></div><div className="salon-stock-watch"><span className="salon-kicker">PRODUCT ALERTS</span>{lowStock.slice(0, 4).map((item) => <div key={item._id}><span>{item.name}</span><b>{item.quantity} {item.unit}</b></div>)}{!lowStock.length && <small>All tracked product levels look good.</small>}</div></section>
        </div>
      </section>}
      {section === 'appointments' && <section className="salon-panel"><div className="salon-toolbar"><Search value={search} onChange={setSearch} placeholder="Search client, service or staff" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter appointments"><option value="">All statuses</option>{appointmentStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select><span className="salon-count">{visibleAppointments.length} appointments</span></div>{visibleAppointments.length ? visibleAppointments.map((item) => <AppointmentRow key={item._id} appointment={item} onEdit={() => openModal('appointment', item)} onStatus={(status) => updateAppointment(item, { status })} onPayment={(paymentStatus) => updateAppointment(item, { paymentStatus })} />) : <Empty icon={FiCalendar} title="No appointments found" text="Try changing the filters or book your next client visit." action="Book appointment" click={() => openModal('appointment')} />}</section>}
      {section === 'services' && <section className="salon-panel"><div className="salon-toolbar"><Search value={search} onChange={setSearch} placeholder="Search services or category" /><span className="salon-count">{services.length} services</span></div>{services.length ? <div className="salon-card-grid">{services.map((item) => <article className="salon-card" key={item._id}><div className="salon-card__top"><span>{item.category}</span><Badge value={item.active ? 'active' : 'inactive'} /></div><h3>{item.name}</h3><p>{item.description || 'Professional salon service.'}</p><div className="salon-card__meta"><strong>{money(item.price)}</strong><span><FiClock /> {item.durationMinutes} min</span></div><CardActions onEdit={() => openModal('service', item)} onToggle={() => salonService.updateService(item._id, { active: !item.active }).then(fetchData).catch((e) => setError(e.response?.data?.message || 'Could not update service.'))} active={item.active} /></article>)}</div> : <Empty icon={FiScissors} title="Build your service menu" text="Add services with categories, prices and appointment durations." action="Add service" click={() => openModal('service')} />}</section>}
      {section === 'team' && <section className="salon-panel"><div className="salon-toolbar"><Search value={search} onChange={setSearch} placeholder="Search team members" /><span className="salon-count">{staff.length} team members</span></div>{staff.length ? <div className="salon-card-grid">{staff.map((person) => <article className="salon-card" key={person._id}><div className="salon-card__top"><span>TEAM MEMBER</span><Badge value={person.status} /></div><h3>{person.name}</h3><p>{person.specialties?.join(' · ') || 'Salon professional'} · {person.phone}</p><div className="salon-card__meta"><span>{person.shiftStart}–{person.shiftEnd}</span><span>{person.workingDays?.length ? person.workingDays.map((day) => day.slice(0, 3)).join(', ') : 'Flexible days'}</span></div><CardActions onEdit={() => openModal('staff', person)} onToggle={() => salonService.updateStaff(person._id, { status: person.status === 'active' ? 'inactive' : 'active' }).then(fetchData).catch((e) => setError(e.response?.data?.message || 'Could not update staff status.'))} active={person.status === 'active'} /></article>)}</div> : <Empty icon={FiUsers} title="Add your salon team" text="Set staff specialties and working hours to schedule appointments." action="Add team member" click={() => openModal('staff')} />}</section>}
      {section === 'clients' && <section className="salon-panel"><div className="salon-toolbar"><Search value={search} onChange={setSearch} placeholder="Search clients by name or phone" /><span className="salon-count">{clients.length} clients</span></div>{clients.length ? <div className="salon-table-wrap"><table className="salon-table"><thead><tr><th>Client</th><th>Phone</th><th>Membership</th><th>Visits</th><th>Lifetime spend</th><th /></tr></thead><tbody>{clients.map((client) => <tr key={client._id}><td><strong>{client.name}</strong><small>{client.email || 'No email'}</small></td><td>{client.phone}</td><td><Badge value={client.membership} /><small>{client.membershipExpiresAt ? `Until ${new Date(client.membershipExpiresAt).toLocaleDateString('en-IN')}` : 'No expiry set'}</small></td><td>{client.visitCount}</td><td>{money(client.lifetimeSpend)}</td><td><button className="salon-icon-button" onClick={() => openModal('client', client)} aria-label={`Edit ${client.name}`}><FiEdit2 /></button></td></tr>)}</tbody></table></div> : <Empty icon={FiHeart} title="Start building client relationships" text="Track visits and memberships in one convenient place." action="Add client" click={() => openModal('client')} />}</section>}
      {section === 'inventory' && <section className="salon-panel"><div className="salon-toolbar"><Search value={search} onChange={setSearch} placeholder="Search products or suppliers" /><span className="salon-count">{products.length} products</span></div>{products.length ? <div className="salon-table-wrap"><table className="salon-table"><thead><tr><th>Product</th><th>Stock</th><th>Reorder level</th><th>Unit cost</th><th>Supplier</th><th>Status</th><th /></tr></thead><tbody>{products.map((product) => <tr key={product._id}><td><strong>{product.name}</strong><small>{product.category}</small></td><td className={product.quantity <= product.reorderLevel ? 'salon-low-stock' : ''}>{product.quantity} {product.unit}</td><td>{product.reorderLevel} {product.unit}</td><td>{money(product.unitCost)}</td><td>{product.supplier || '—'}</td><td><Badge value={product.status} /></td><td><button className="salon-icon-button" onClick={() => openModal('product', product)} aria-label={`Edit ${product.name}`}><FiEdit2 /></button></td></tr>)}</tbody></table></div> : <Empty icon={FiPackage} title="No salon products tracked" text="Add retail products and consumables with their stock and reorder levels." action="Add product" click={() => openModal('product')} />}</section>}
    </>}

    {modal && <Dialog title={`${modal.record ? 'Edit' : 'Add'} ${titleCase(modal.type)}`} onClose={() => setModal(null)}><form onSubmit={save} className="salon-form">
      {modal.type === 'service' && <div className="salon-form-grid"><Field label="Service name" required><input required value={form.name} onChange={(e) => setField('name', e.target.value)} /></Field><Field label="Category" required><input required value={form.category} onChange={(e) => setField('category', e.target.value)} placeholder="Hair, nails, massage" /></Field><Field label="Price (INR)" required><input required min="0" type="number" value={form.price} onChange={(e) => setField('price', e.target.value)} /></Field><Field label="Duration (minutes)" required><input required min="5" type="number" value={form.durationMinutes} onChange={(e) => setField('durationMinutes', e.target.value)} /></Field><Field label="Description" wide><textarea value={form.description} onChange={(e) => setField('description', e.target.value)} /></Field>{modal.record && <Field label="Availability"><select value={String(form.active)} onChange={(e) => setField('active', e.target.value === 'true')}><option value="true">Active</option><option value="false">Inactive</option></select></Field>}</div>}
      {modal.type === 'staff' && <div className="salon-form-grid"><Field label="Name" required><input required value={form.name} onChange={(e) => setField('name', e.target.value)} /></Field><Field label="Phone" required><input required value={form.phone} onChange={(e) => setField('phone', e.target.value)} /></Field><Field label="Email"><input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} /></Field><Field label="Specialties"><input value={form.specialties} onChange={(e) => setField('specialties', e.target.value)} placeholder="Hair, color, styling" /></Field><Field label="Shift start"><input type="time" value={form.shiftStart} onChange={(e) => setField('shiftStart', e.target.value)} /></Field><Field label="Shift end"><input type="time" value={form.shiftEnd} onChange={(e) => setField('shiftEnd', e.target.value)} /></Field><div className="salon-field salon-field--wide"><span>Working days</span><div className="salon-days">{weekdays.map((day) => <label key={day}><input type="checkbox" checked={form.workingDays.includes(day)} onChange={(e) => setField('workingDays', e.target.checked ? [...form.workingDays, day] : form.workingDays.filter((d) => d !== day))} />{titleCase(day.slice(0, 3))}</label>)}</div></div>{modal.record && <Field label="Status"><select value={form.status} onChange={(e) => setField('status', e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>}</div>}
      {modal.type === 'client' && <div className="salon-form-grid"><Field label="Client name" required><input required value={form.name} onChange={(e) => setField('name', e.target.value)} /></Field><Field label="Phone (unique)" required><input required value={form.phone} onChange={(e) => setField('phone', e.target.value)} /></Field><Field label="Email"><input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} /></Field><Field label="Membership tier"><select value={form.membership} onChange={(e) => setField('membership', e.target.value)}>{['none', 'silver', 'gold', 'platinum'].map((tier) => <option key={tier} value={tier}>{titleCase(tier)}</option>)}</select></Field><Field label="Membership expiry"><input type="date" value={form.membershipExpiresAt} onChange={(e) => setField('membershipExpiresAt', e.target.value)} /></Field><Field label="Notes" wide><textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} /></Field></div>}
      {modal.type === 'product' && <div className="salon-form-grid"><Field label="Product name" required><input required value={form.name} onChange={(e) => setField('name', e.target.value)} /></Field><Field label="Category"><input value={form.category} onChange={(e) => setField('category', e.target.value)} /></Field><Field label="Quantity" required><input required min="0" step="any" type="number" value={form.quantity} onChange={(e) => setField('quantity', e.target.value)} /></Field><Field label="Unit" required><input required value={form.unit} onChange={(e) => setField('unit', e.target.value)} placeholder="piece, ml, bottle" /></Field><Field label="Reorder level"><input min="0" step="any" type="number" value={form.reorderLevel} onChange={(e) => setField('reorderLevel', e.target.value)} /></Field><Field label="Unit cost (INR)"><input min="0" step="any" type="number" value={form.unitCost} onChange={(e) => setField('unitCost', e.target.value)} /></Field><Field label="Supplier"><input value={form.supplier} onChange={(e) => setField('supplier', e.target.value)} /></Field>{modal.record && <Field label="Status"><select value={form.status} onChange={(e) => setField('status', e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>}</div>}
      {modal.type === 'appointment' && <div className="salon-form-grid"><Field label="Client" required><select required value={form.client} onChange={(e) => setField('client', e.target.value)}><option value="">Select client</option>{clients.map((client) => <option key={client._id} value={client._id}>{client.name} · {client.phone}</option>)}</select></Field><Field label="Service" required><select required value={form.service} onChange={(e) => setField('service', e.target.value)}><option value="">Select service</option>{availableServices.map((item) => <option key={item._id} value={item._id}>{item.name} · {money(item.price)} · {item.durationMinutes} min</option>)}</select></Field><Field label="Staff member" required><select required value={form.staff} onChange={(e) => setField('staff', e.target.value)}><option value="">Select staff member</option>{staff.map((person) => <option key={person._id} value={person._id}>{person.name}</option>)}</select></Field><Field label="Appointment time" required><input required type="datetime-local" min={dateInput(new Date())} value={form.scheduledAt} onChange={(e) => setField('scheduledAt', e.target.value)} /></Field><Field label="Notes" wide><textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} /></Field>{modal.record && <Field label="Status"><select value={form.status || modal.record.status} onChange={(e) => setField('status', e.target.value)}>{appointmentStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></Field>}</div>}
      <div className="salon-form-actions"><button type="button" className="salon-button salon-button--neutral" onClick={() => setModal(null)} disabled={saving}>Cancel</button><button type="submit" className="salon-button salon-button--primary" disabled={saving}>{saving ? 'Saving…' : `${modal.record ? 'Save' : 'Create'} ${modal.type}`}</button></div>
    </form></Dialog>}
  </main>;
};

const Stat = ({ icon, tone, label, value, note }) => <article className="salon-stat"><span className={`salon-stat__icon salon-stat__icon--${tone}`}>{createElement(icon)}</span><div><small>{label}</small><strong>{value}</strong><small>{note}</small></div></article>;
const PanelHeading = ({ kicker, title, link, linkLabel }) => <div className="salon-panel-heading"><div><span className="salon-kicker">{kicker || 'SALON OPERATIONS'}</span><h2>{title}</h2></div>{link && <Link className="salon-link" to={link}>{linkLabel} <FiArrowUpRight /></Link>}</div>;
const AppointmentRow = ({ appointment, onStatus, onEdit, onPayment }) => <article className="salon-appointment-row"><span className="salon-appointment-icon"><FiCalendar /></span><div className="salon-appointment-main"><strong>{appointment.client?.name || 'Client'}</strong><span>{appointment.serviceName} · {appointment.staff?.name || 'Staff unassigned'}</span><small>{formatDate(appointment.scheduledAt)} · {money(appointment.price)}</small></div>{onPayment && <select className="salon-select" value={appointment.paymentStatus} onChange={(e) => onPayment(e.target.value)} aria-label="Update payment"><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="refunded">Refunded</option></select>}<select className={`salon-select salon-select--${appointment.status}`} value={appointment.status} onChange={(e) => onStatus(e.target.value)} aria-label={`Update ${appointment.client?.name || 'client'} appointment`}>{appointmentStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select>{onEdit && <button className="salon-icon-button" onClick={onEdit} aria-label="Edit appointment"><FiEdit2 /></button>}</article>;
const Badge = ({ value }) => <span className={`salon-badge salon-badge--${value}`}>{titleCase(value)}</span>;
const CardActions = ({ onEdit, onToggle, active }) => <div className="salon-card-actions"><button className="salon-icon-button" onClick={onEdit} aria-label="Edit"><FiEdit2 /></button><button className="salon-button salon-button--small" onClick={onToggle}>{active ? 'Deactivate' : 'Activate'}</button></div>;
const Search = ({ value, onChange, placeholder }) => <label className="salon-search"><FiSearch /><input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>;
const Empty = ({ icon, title, text, action, click }) => <div className="salon-empty"><span>{createElement(icon)}</span><h3>{title}</h3><p>{text}</p>{action && <button className="salon-button salon-button--primary" onClick={click}><FiPlus /> {action}</button>}</div>;
const Field = ({ label, required, wide, children }) => <label className={`salon-field ${wide ? 'salon-field--wide' : ''}`}><span>{label}{required && ' *'}</span>{children}</label>;
const Dialog = ({ title, onClose, children }) => <div className="salon-dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="salon-dialog" role="dialog" aria-modal="true" aria-labelledby="salon-dialog-title"><header><h2 id="salon-dialog-title">{title}</h2><button onClick={onClose} type="button" aria-label="Close dialog"><FiX /></button></header>{children}</section></div>;

export default SalonDashboard;
