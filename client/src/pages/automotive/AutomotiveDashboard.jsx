import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiActivity, FiArrowUpRight, FiCalendar, FiCheck, FiClock, FiEdit2,
  FiPackage, FiPlus, FiSearch, FiTool, FiTrash2, FiTruck, FiUser, FiUsers, FiX,
} from 'react-icons/fi';
import { employeeService } from '../../services/employeeService';
import { automotiveService } from '../../services/automotiveService';
import Loader from '../../components/common/Loader';
import './AutomotiveDashboard.css';

const jobStatuses = ['booked', 'checked_in', 'in_progress', 'waiting_parts', 'ready', 'completed', 'cancelled'];
const serviceTypes = ['maintenance', 'repair', 'diagnostics', 'inspection', 'bodywork', 'other'];
const partCategories = ['engine', 'brakes', 'electrical', 'fluids', 'filters', 'tyres', 'body', 'other'];
const vehicleStatuses = ['active', 'in_service', 'inactive'];
const titleCase = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
const formatDate = (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not scheduled';
const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const emptyCustomer = { name: '', phone: '', email: '', address: '', notes: '', status: 'active' };
const emptyVehicle = { customer: '', registrationNumber: '', make: '', model: '', year: '', vin: '', fuelType: 'petrol', odometerKm: '', status: 'active', notes: '' };
const emptyJob = { customer: '', vehicle: '', jobNumber: '', serviceType: 'maintenance', description: '', status: 'booked', scheduledAt: '', odometerKm: '', laborCost: '', partsCost: '', assignedTechnician: '', notes: '' };
const emptyPart = { name: '', sku: '', category: 'other', quantity: '', reorderLevel: '', unitCost: '', supplier: '', status: 'active' };

const AutomotiveDashboard = () => {
  const location = useLocation();
  const section = location.pathname.split('/')[2] || 'overview';
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [parts, setParts] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerModal, setCustomerModal] = useState(null);
  const [vehicleModal, setVehicleModal] = useState(null);
  const [jobModal, setJobModal] = useState(null);
  const [partModal, setPartModal] = useState(null);
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [partForm, setPartForm] = useState(emptyPart);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const jobsToLoad = [];
      if (section === 'overview') jobsToLoad.push(automotiveService.getSummary().then((response) => setSummary(response.data.data)));
      if (['overview', 'vehicles'].includes(section)) {
        jobsToLoad.push(automotiveService.getCustomers({ status: 'active', search: section === 'vehicles' ? search.trim() : '' })
          .then((response) => setCustomers(response.data.data || [])));
      }
      if (['overview', 'vehicles'].includes(section)) {
        jobsToLoad.push(automotiveService.getVehicles({ search: section === 'vehicles' ? search.trim() : '' })
          .then((response) => setVehicles(response.data.data || [])));
      }
      if (['overview', 'jobs'].includes(section)) {
        jobsToLoad.push(automotiveService.getJobs({ status: section === 'jobs' ? statusFilter : '', search: section === 'jobs' ? search.trim() : '' })
          .then((response) => setJobs(response.data.data || [])));
      }
      if (section === 'parts') {
        jobsToLoad.push(automotiveService.getParts({ search: search.trim() }).then((response) => setParts(response.data.data || [])));
      }
      if (['jobs', 'vehicles'].includes(section)) {
        jobsToLoad.push(employeeService.getEmployees({ limit: 200, status: 'active' })
          .then((response) => setTechnicians(response.data?.data || [])));
      }
      if (section === 'jobs') {
        jobsToLoad.push(automotiveService.getCustomers({ status: 'active' }).then((response) => setCustomers(response.data.data || [])));
        jobsToLoad.push(automotiveService.getVehicles({}).then((response) => setVehicles(response.data.data || [])));
      }
      await Promise.all(jobsToLoad);
    } catch (requestError) {
      console.error('Unable to load automotive workspace:', requestError);
      setError(requestError.response?.data?.message || 'Could not load the automotive workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [section, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, search]);

  const pageTitle = { overview: 'Service Overview', vehicles: 'Customers & Vehicles', jobs: 'Service Jobs', parts: 'Parts Inventory' }[section] || 'Service Overview';
  const stats = summary || { customers: 0, vehicles: 0, jobsToday: 0, openJobs: 0, lowStockParts: 0, recentJobs: [] };
  const filteredCustomers = useMemo(() => {
    if (section !== 'vehicles' || !search.trim()) return customers;
    const term = search.trim().toLowerCase();
    return customers.filter((customer) => [customer.name, customer.phone, customer.email].some((item) => String(item || '').toLowerCase().includes(term)));
  }, [customers, section, search]);

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const saveRecord = async (event, modal, form, service, setModal, message) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (modal?._id) await service.update(modal._id, form);
      else await service.create(form);
      setModal(null);
      flash(message);
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save this record.');
    } finally {
      setSaving(false);
    }
  };

  const openCustomer = (customer = null) => {
    setCustomerForm(customer ? { ...emptyCustomer, ...customer } : emptyCustomer);
    setCustomerModal(customer || {});
  };
  const openVehicle = (vehicle = null) => {
    setVehicleForm(vehicle ? { ...emptyVehicle, ...vehicle, customer: vehicle.customer?._id || '', year: String(vehicle.year || ''), odometerKm: String(vehicle.odometerKm || '') } : emptyVehicle);
    setVehicleModal(vehicle || {});
  };
  const openJob = (job = null) => {
    setJobForm(job ? {
      ...emptyJob, ...job, customer: job.customer?._id || '', vehicle: job.vehicle?._id || '',
      assignedTechnician: job.assignedTechnician?._id || '', scheduledAt: toDateInput(job.scheduledAt),
      odometerKm: String(job.odometerKm || ''), laborCost: String(job.laborCost || ''), partsCost: String(job.partsCost || ''),
    } : emptyJob);
    setJobModal(job || {});
  };
  const openPart = (part = null) => {
    setPartForm(part ? { ...emptyPart, ...part, quantity: String(part.quantity), reorderLevel: String(part.reorderLevel), unitCost: String(part.unitCost) } : emptyPart);
    setPartModal(part || {});
  };

  const customerService = {
    create: (data) => automotiveService.createCustomer(data),
    update: (id, data) => automotiveService.updateCustomer(id, data),
  };
  const vehicleService = {
    create: (data) => automotiveService.createVehicle(data),
    update: (id, data) => automotiveService.updateVehicle(id, data),
  };
  const jobService = {
    create: (data) => automotiveService.createJob(data),
    update: (id, data) => automotiveService.updateJob(id, data),
  };
  const partService = {
    create: (data) => automotiveService.createPart(data),
    update: (id, data) => automotiveService.updatePart(id, data),
  };

  const submitCustomer = (event) => saveRecord(event, customerModal, customerForm, customerService, setCustomerModal, customerModal?._id ? 'Customer profile updated.' : 'Customer added.');
  const submitVehicle = (event) => saveRecord(event, vehicleModal, {
    ...vehicleForm, year: vehicleForm.year ? Number(vehicleForm.year) : null,
    odometerKm: Number(vehicleForm.odometerKm || 0),
  }, vehicleService, setVehicleModal, vehicleModal?._id ? 'Vehicle profile updated.' : 'Vehicle added.');
  const submitJob = (event) => saveRecord(event, jobModal, {
    ...jobForm, scheduledAt: jobForm.scheduledAt ? new Date(jobForm.scheduledAt).toISOString() : '',
    odometerKm: Number(jobForm.odometerKm || 0), laborCost: Number(jobForm.laborCost || 0),
    partsCost: Number(jobForm.partsCost || 0), assignedTechnician: jobForm.assignedTechnician || null,
  }, jobService, setJobModal, jobModal?._id ? 'Service job updated.' : 'Service job created.');
  const submitPart = (event) => saveRecord(event, partModal, {
    ...partForm, quantity: Number(partForm.quantity || 0), reorderLevel: Number(partForm.reorderLevel || 0), unitCost: Number(partForm.unitCost || 0),
  }, partService, setPartModal, partModal?._id ? 'Part inventory updated.' : 'Part added to inventory.');

  const removeRecord = async (label, id, remove, confirmText) => {
    if (!window.confirm(confirmText)) return;
    try {
      await remove(id);
      flash(`${label} deleted.`);
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Could not delete this ${label.toLowerCase()}.`);
    }
  };

  const updateJobStatus = async (job, status) => {
    try {
      await automotiveService.updateJob(job._id, { status });
      flash('Service job status updated.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update service job.');
    }
  };

  return (
    <main className="auto-page">
      <header className="auto-header">
        <div><span className="auto-eyebrow"><FiTruck /> AUTOMOTIVE SERVICE OPERATIONS</span><h1>{pageTitle}</h1><p>Keep customer vehicles, workshop jobs, and parts inventory running smoothly.</p></div>
        <div className="auto-header__actions">
          {section === 'vehicles' && <><button className="auto-button auto-button--outline" onClick={() => openCustomer()}><FiUser /> Add customer</button><button className="auto-button auto-button--primary" onClick={() => openVehicle()}><FiPlus /> Add vehicle</button></>}
          {section === 'jobs' && <button className="auto-button auto-button--primary" onClick={() => openJob()}><FiPlus /> Book service</button>}
          {section === 'parts' && <button className="auto-button auto-button--primary" onClick={() => openPart()}><FiPlus /> Add part</button>}
        </div>
      </header>

      <nav className="auto-tabs" aria-label="Automotive sections">
        {[
          { key: 'overview', label: 'Overview', path: '/automotive', icon: FiActivity },
          { key: 'vehicles', label: 'Customers & Vehicles', path: '/automotive/vehicles', icon: FiTruck },
          { key: 'jobs', label: 'Service Jobs', path: '/automotive/jobs', icon: FiTool },
          { key: 'parts', label: 'Parts Inventory', path: '/automotive/parts', icon: FiPackage },
        ].map(({ key, label, path, icon }) => <Link key={key} to={path} className={`auto-tab ${section === key ? 'is-active' : ''}`}>{createElement(icon)} {label}</Link>)}
      </nav>

      {notice && <div className="auto-alert auto-alert--success" role="status"><FiCheck /> {notice}</div>}
      {error && <div className="auto-alert auto-alert--error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><FiX /></button></div>}
      {loading ? <div className="auto-loading"><Loader /></div> : <>
        {section === 'overview' && <section className="auto-overview">
          <div className="auto-hero"><div className="auto-hero__copy"><span>THE WORKSHOP, AT A GLANCE</span><h2>Great service is built on every detail.</h2><p>From the first booking to the final handover, bring your customer, vehicle, and workshop workflow together.</p><div><Link className="auto-button auto-button--light" to="/automotive/jobs"><FiCalendar /> Manage service jobs</Link><Link className="auto-button auto-button--ghost" to="/automotive/vehicles"><FiTruck /> Open vehicle desk</Link></div></div><div className="auto-hero__art" aria-hidden="true"><div className="auto-hero__wheel" /><div className="auto-hero__road" /><span>WORKSHOP · 01</span></div></div>
          <div className="auto-stats">
            <Stat icon={FiUsers} tone="blue" label="Active customers" value={stats.customers} note="Customer directory" />
            <Stat icon={FiTruck} tone="green" label="Vehicles serviced" value={stats.vehicles} note="Active & in-service" />
            <Stat icon={FiCalendar} tone="amber" label="Jobs booked today" value={stats.jobsToday} note="Excluding cancellations" />
            <Stat icon={FiClock} tone="violet" label="Open service jobs" value={stats.openJobs} note={`${stats.lowStockParts} parts at reorder level`} />
          </div>
          <section className="auto-panel"><div className="auto-panel__heading"><div><span className="auto-kicker">WORKSHOP QUEUE</span><h2>Jobs to keep moving</h2><p>Upcoming and active work orders across the shop.</p></div><Link className="auto-inline-link" to="/automotive/jobs">View all jobs <FiArrowUpRight /></Link></div>
            {stats.recentJobs?.length ? <div className="auto-job-list">{stats.recentJobs.map((job) => <JobRow key={job._id} job={job} onEdit={() => openJob(job)} />)}</div> : <EmptyState icon={FiTool} title="No open service jobs" description="Create a job card to start coordinating a workshop visit." action="Book service" onClick={() => openJob()} />}
          </section>
          <div className="auto-shortcuts">{[
            { icon: FiUser, title: 'Add a customer', description: 'Keep vehicle owners and contact details organized.', to: '/automotive/vehicles', action: () => openCustomer() },
            { icon: FiTruck, title: 'Register a vehicle', description: 'Link a vehicle to its owner and service history.', to: '/automotive/vehicles', action: () => openVehicle() },
            { icon: FiPackage, title: 'Check parts stock', description: 'See stock levels and items at reorder point.', to: '/automotive/parts' },
          ].map(({ icon, title, description, to, action }) => <Link key={title} to={to} className="auto-shortcut" onClick={action}><span>{createElement(icon)}</span><div><strong>{title}</strong><small>{description}</small></div><FiArrowUpRight /></Link>)}</div>
        </section>}

        {section === 'vehicles' && <>
          <div className="auto-toolbar"><label className="auto-search"><FiSearch /><input type="search" placeholder="Search customers, registration, make, or model" value={search} onChange={(event) => setSearch(event.target.value)} /></label><span className="auto-count">{filteredCustomers.length} customers · {vehicles.length} vehicles</span></div>
          <section className="auto-panel"><div className="auto-panel__heading"><div><span className="auto-kicker">CUSTOMER DIRECTORY</span><h2>Vehicle owners</h2></div><button className="auto-inline-link" onClick={() => openCustomer()}><FiPlus /> Add customer</button></div>
            {filteredCustomers.length ? <div className="auto-customer-grid">{filteredCustomers.map((customer) => <CustomerCard key={customer._id} customer={customer} onEdit={() => openCustomer(customer)} onDelete={() => removeRecord('Customer', customer._id, automotiveService.deleteCustomer, `Delete ${customer.name}?`)} />)}</div> : <EmptyState icon={FiUsers} title="No customers found" description="Add a customer profile to begin registering vehicles." action="Add customer" onClick={() => openCustomer()} />}
          </section>
          <section className="auto-panel"><div className="auto-panel__heading"><div><span className="auto-kicker">VEHICLE REGISTER</span><h2>Customer vehicles</h2></div><button className="auto-inline-link" onClick={() => openVehicle()}><FiPlus /> Add vehicle</button></div>
            {vehicles.length ? <div className="auto-table-wrap"><table className="auto-table"><thead><tr><th>Vehicle</th><th>Registration</th><th>Customer</th><th>Odometer</th><th>Status</th><th /></tr></thead><tbody>{vehicles.map((vehicle) => <tr key={vehicle._id}><td><strong>{vehicle.make} {vehicle.model}</strong><small>{vehicle.year || 'Year not set'} · {titleCase(vehicle.fuelType)}</small></td><td>{vehicle.registrationNumber}</td><td>{vehicle.customer?.name || 'Customer unavailable'}<small>{vehicle.customer?.phone || ''}</small></td><td>{Number(vehicle.odometerKm || 0).toLocaleString()} km</td><td><span className={`auto-status auto-status--${vehicle.status}`}>{titleCase(vehicle.status)}</span></td><td><button className="auto-icon-action" onClick={() => openVehicle(vehicle)} aria-label={`Edit ${vehicle.registrationNumber}`}><FiEdit2 /></button><button className="auto-icon-action auto-icon-action--danger" onClick={() => removeRecord('Vehicle', vehicle._id, automotiveService.deleteVehicle, `Delete vehicle ${vehicle.registrationNumber}?`)} aria-label={`Delete ${vehicle.registrationNumber}`}><FiTrash2 /></button></td></tr>)}</tbody></table></div> : <EmptyState icon={FiTruck} title="No vehicles registered yet" description="Register a customer vehicle to start maintaining its service record." action="Add vehicle" onClick={() => openVehicle()} />}
          </section>
        </>}

        {section === 'jobs' && <section className="auto-panel">
          <div className="auto-toolbar auto-toolbar--inside"><label className="auto-search"><FiSearch /><input type="search" placeholder="Search job number, customer, or registration" value={search} onChange={(event) => setSearch(event.target.value)} /></label><select className="auto-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter jobs by status"><option value="">All stages</option>{jobStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select><span className="auto-count">{jobs.length} jobs</span></div>
          {jobs.length ? <div className="auto-job-list">{jobs.map((job) => <JobRow key={job._id} job={job} onEdit={() => openJob(job)} onDelete={() => removeRecord('Service job', job._id, automotiveService.deleteJob, `Delete job ${job.jobNumber || ''}?`)} onStatus={(status) => updateJobStatus(job, status)} />)}</div> : <EmptyState icon={FiTool} title="No service jobs found" description="Book a service visit and create a job card for the workshop." action="Book service" onClick={() => openJob()} />}
        </section>}

        {section === 'parts' && <section className="auto-panel">
          <div className="auto-toolbar auto-toolbar--inside"><label className="auto-search"><FiSearch /><input type="search" placeholder="Search part name, SKU, or supplier" value={search} onChange={(event) => setSearch(event.target.value)} /></label><span className="auto-count">{parts.length} inventory items</span></div>
          {parts.length ? <div className="auto-table-wrap"><table className="auto-table"><thead><tr><th>Part</th><th>Category</th><th>In stock</th><th>Reorder at</th><th>Unit cost</th><th>Supplier</th><th /></tr></thead><tbody>{parts.map((part) => <tr key={part._id}><td><strong>{part.name}</strong><small>{part.sku || 'SKU not set'}</small></td><td>{titleCase(part.category)}</td><td><span className={part.quantity <= part.reorderLevel ? 'auto-stock-low' : ''}>{Number(part.quantity).toLocaleString()}</span>{part.quantity <= part.reorderLevel && <small className="auto-low-note">Reorder needed</small>}</td><td>{Number(part.reorderLevel).toLocaleString()}</td><td>{money(part.unitCost)}</td><td>{part.supplier || '—'}</td><td><button className="auto-icon-action" onClick={() => openPart(part)} aria-label={`Edit ${part.name}`}><FiEdit2 /></button><button className="auto-icon-action auto-icon-action--danger" onClick={() => removeRecord('Part', part._id, automotiveService.deletePart, `Delete ${part.name} from inventory?`)} aria-label={`Delete ${part.name}`}><FiTrash2 /></button></td></tr>)}</tbody></table></div> : <EmptyState icon={FiPackage} title="Parts inventory is empty" description="Add common workshop parts and define a reorder level to monitor stock." action="Add a part" onClick={() => openPart()} />}
        </section>}
      </>}

      {customerModal !== null && <Dialog title={customerModal?._id ? 'Edit customer' : 'Add customer'} onClose={() => setCustomerModal(null)}><form className="auto-form" onSubmit={submitCustomer}><div className="auto-form-grid">
        <Field label="Customer name" required><input required value={customerForm.name} onChange={(event) => setCustomerForm({ ...customerForm, name: event.target.value })} /></Field>
        <Field label="Phone number" required><input required value={customerForm.phone} onChange={(event) => setCustomerForm({ ...customerForm, phone: event.target.value })} /></Field>
        <Field label="Email"><input type="email" value={customerForm.email} onChange={(event) => setCustomerForm({ ...customerForm, email: event.target.value })} /></Field>
        <Field label="Status"><select value={customerForm.status} onChange={(event) => setCustomerForm({ ...customerForm, status: event.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
        <Field label="Address" wide><input value={customerForm.address} onChange={(event) => setCustomerForm({ ...customerForm, address: event.target.value })} /></Field>
        <Field label="Notes" wide><textarea rows="3" value={customerForm.notes} onChange={(event) => setCustomerForm({ ...customerForm, notes: event.target.value })} /></Field>
      </div><FormActions onCancel={() => setCustomerModal(null)} saving={saving} label={customerModal?._id ? 'Save customer' : 'Add customer'} /></form></Dialog>}

      {vehicleModal !== null && <Dialog title={vehicleModal?._id ? 'Edit vehicle profile' : 'Register vehicle'} onClose={() => setVehicleModal(null)}><form className="auto-form" onSubmit={submitVehicle}><div className="auto-form-grid">
        <Field label="Owner" required wide><select required value={vehicleForm.customer} onChange={(event) => setVehicleForm({ ...vehicleForm, customer: event.target.value })}><option value="">Select customer</option>{customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name} · {customer.phone}</option>)}</select></Field>
        <Field label="Registration number" required><input required value={vehicleForm.registrationNumber} onChange={(event) => setVehicleForm({ ...vehicleForm, registrationNumber: event.target.value })} placeholder="e.g. MH 02 AB 1234" /></Field>
        <Field label="Make" required><input required value={vehicleForm.make} onChange={(event) => setVehicleForm({ ...vehicleForm, make: event.target.value })} placeholder="Manufacturer" /></Field>
        <Field label="Model" required><input required value={vehicleForm.model} onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })} /></Field>
        <Field label="Model year"><input min="1900" max="2100" type="number" value={vehicleForm.year} onChange={(event) => setVehicleForm({ ...vehicleForm, year: event.target.value })} /></Field>
        <Field label="Fuel type"><select value={vehicleForm.fuelType} onChange={(event) => setVehicleForm({ ...vehicleForm, fuelType: event.target.value })}>{['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'other'].map((type) => <option value={type} key={type}>{titleCase(type)}</option>)}</select></Field>
        <Field label="Odometer (km)"><input min="0" type="number" value={vehicleForm.odometerKm} onChange={(event) => setVehicleForm({ ...vehicleForm, odometerKm: event.target.value })} /></Field>
        <Field label="VIN / chassis number"><input value={vehicleForm.vin} onChange={(event) => setVehicleForm({ ...vehicleForm, vin: event.target.value })} /></Field>
        <Field label="Vehicle status"><select value={vehicleForm.status} onChange={(event) => setVehicleForm({ ...vehicleForm, status: event.target.value })}>{vehicleStatuses.map((status) => <option value={status} key={status}>{titleCase(status)}</option>)}</select></Field>
        <Field label="Notes" wide><textarea rows="3" value={vehicleForm.notes} onChange={(event) => setVehicleForm({ ...vehicleForm, notes: event.target.value })} /></Field>
      </div><FormActions onCancel={() => setVehicleModal(null)} saving={saving} label={vehicleModal?._id ? 'Save vehicle' : 'Register vehicle'} /></form></Dialog>}

      {jobModal !== null && <Dialog title={jobModal?._id ? 'Update service job' : 'Book workshop service'} onClose={() => setJobModal(null)}><form className="auto-form" onSubmit={submitJob}><div className="auto-form-grid">
        <Field label="Customer" required><select required value={jobForm.customer} onChange={(event) => setJobForm({ ...jobForm, customer: event.target.value, vehicle: '' })}><option value="">Select customer</option>{customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name} · {customer.phone}</option>)}</select></Field>
        <Field label="Vehicle" required><select required value={jobForm.vehicle} onChange={(event) => setJobForm({ ...jobForm, vehicle: event.target.value })}><option value="">Select vehicle</option>{vehicles.filter((vehicle) => vehicle.customer?._id === jobForm.customer).map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicle.registrationNumber} · {vehicle.make} {vehicle.model}</option>)}</select></Field>
        <Field label="Job number"><input value={jobForm.jobNumber} onChange={(event) => setJobForm({ ...jobForm, jobNumber: event.target.value })} placeholder="Optional work-order ID" /></Field>
        <Field label="Service type"><select value={jobForm.serviceType} onChange={(event) => setJobForm({ ...jobForm, serviceType: event.target.value })}>{serviceTypes.map((type) => <option value={type} key={type}>{titleCase(type)}</option>)}</select></Field>
        <Field label="Appointment date & time" required><input required type="datetime-local" value={jobForm.scheduledAt} onChange={(event) => setJobForm({ ...jobForm, scheduledAt: event.target.value })} /></Field>
        <Field label="Job stage"><select value={jobForm.status} onChange={(event) => setJobForm({ ...jobForm, status: event.target.value })}>{jobStatuses.map((status) => <option value={status} key={status}>{titleCase(status)}</option>)}</select></Field>
        <Field label="Technician"><select value={jobForm.assignedTechnician} onChange={(event) => setJobForm({ ...jobForm, assignedTechnician: event.target.value })}><option value="">Unassigned</option>{technicians.map((employee) => <option key={employee._id} value={employee._id}>{employee.user?.name || employee.employeeId}</option>)}</select></Field>
        <Field label="Odometer (km)"><input min="0" type="number" value={jobForm.odometerKm} onChange={(event) => setJobForm({ ...jobForm, odometerKm: event.target.value })} /></Field>
        <Field label="Labor estimate (INR)"><input min="0" type="number" value={jobForm.laborCost} onChange={(event) => setJobForm({ ...jobForm, laborCost: event.target.value })} /></Field>
        <Field label="Parts estimate (INR)"><input min="0" type="number" value={jobForm.partsCost} onChange={(event) => setJobForm({ ...jobForm, partsCost: event.target.value })} /></Field>
        <Field label="Work requested" required wide><textarea required rows="3" value={jobForm.description} onChange={(event) => setJobForm({ ...jobForm, description: event.target.value })} placeholder="Customer-reported concern or requested service" /></Field>
        <Field label="Workshop notes" wide><textarea rows="3" value={jobForm.notes} onChange={(event) => setJobForm({ ...jobForm, notes: event.target.value })} /></Field>
      </div><FormActions onCancel={() => setJobModal(null)} saving={saving} label={jobModal?._id ? 'Save service job' : 'Create job card'} /></form></Dialog>}

      {partModal !== null && <Dialog title={partModal?._id ? 'Edit inventory part' : 'Add inventory part'} onClose={() => setPartModal(null)}><form className="auto-form" onSubmit={submitPart}><div className="auto-form-grid">
        <Field label="Part name" required><input required value={partForm.name} onChange={(event) => setPartForm({ ...partForm, name: event.target.value })} /></Field>
        <Field label="SKU"><input value={partForm.sku} onChange={(event) => setPartForm({ ...partForm, sku: event.target.value })} /></Field>
        <Field label="Category"><select value={partForm.category} onChange={(event) => setPartForm({ ...partForm, category: event.target.value })}>{partCategories.map((category) => <option value={category} key={category}>{titleCase(category)}</option>)}</select></Field>
        <Field label="Supplier"><input value={partForm.supplier} onChange={(event) => setPartForm({ ...partForm, supplier: event.target.value })} /></Field>
        <Field label="Quantity on hand"><input min="0" type="number" value={partForm.quantity} onChange={(event) => setPartForm({ ...partForm, quantity: event.target.value })} /></Field>
        <Field label="Reorder level"><input min="0" type="number" value={partForm.reorderLevel} onChange={(event) => setPartForm({ ...partForm, reorderLevel: event.target.value })} /></Field>
        <Field label="Unit cost (INR)"><input min="0" type="number" value={partForm.unitCost} onChange={(event) => setPartForm({ ...partForm, unitCost: event.target.value })} /></Field>
        <Field label="Status"><select value={partForm.status} onChange={(event) => setPartForm({ ...partForm, status: event.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
      </div><FormActions onCancel={() => setPartModal(null)} saving={saving} label={partModal?._id ? 'Save part' : 'Add part'} /></form></Dialog>}
    </main>
  );
};

const Stat = ({ icon, tone, label, value, note }) => <article className="auto-stat"><div className={`auto-stat__icon auto-stat__icon--${tone}`}>{createElement(icon)}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;

const CustomerCard = ({ customer, onEdit, onDelete }) => <article className="auto-customer-card"><div className="auto-customer-card__top"><span><FiUser /></span><strong>{customer.name}</strong><div><button className="auto-icon-action" onClick={onEdit} aria-label={`Edit ${customer.name}`}><FiEdit2 /></button><button className="auto-icon-action auto-icon-action--danger" onClick={onDelete} aria-label={`Delete ${customer.name}`}><FiTrash2 /></button></div></div><a href={`tel:${customer.phone}`}>{customer.phone}</a>{customer.email && <a href={`mailto:${customer.email}`}>{customer.email}</a>}<small>{customer.address || 'Address not provided'}</small></article>;

const JobRow = ({ job, onEdit, onDelete, onStatus }) => <article className="auto-job-row"><div className="auto-job-row__icon"><FiTool /></div><div className="auto-job-row__main"><strong>{job.jobNumber || `${job.vehicle?.registrationNumber || 'Service'} · ${titleCase(job.serviceType)}`}</strong><span>{job.customer?.name || 'Customer'} · {job.vehicle?.make || ''} {job.vehicle?.model || ''} {job.vehicle?.registrationNumber ? `(${job.vehicle.registrationNumber})` : ''}</span><small>{formatDate(job.scheduledAt)} · {job.description}</small></div><div className="auto-job-row__meta"><strong>{money((job.laborCost || 0) + (job.partsCost || 0))}</strong><span>{job.assignedTechnician?.user?.name || 'Technician unassigned'}</span></div>{onStatus ? <select className={`auto-status-select auto-status-select--${job.status}`} value={job.status} onChange={(event) => onStatus(event.target.value)} aria-label="Update service job status">{jobStatuses.map((status) => <option value={status} key={status}>{titleCase(status)}</option>)}</select> : <span className={`auto-status auto-status--${job.status}`}>{titleCase(job.status)}</span>}{onEdit && <button className="auto-icon-action" onClick={onEdit} aria-label="Edit service job"><FiEdit2 /></button>}{onDelete && <button className="auto-icon-action auto-icon-action--danger" onClick={onDelete} aria-label="Delete service job"><FiTrash2 /></button>}</article>;

const EmptyState = ({ icon, title, description, action, onClick }) => <div className="auto-empty"><span>{createElement(icon)}</span><h3>{title}</h3><p>{description}</p>{action && <button className="auto-button auto-button--primary" onClick={onClick}><FiPlus /> {action}</button>}</div>;
const Dialog = ({ title, onClose, children }) => <div className="auto-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="auto-dialog" role="dialog" aria-modal="true" aria-labelledby="automotive-dialog-title"><header><h2 id="automotive-dialog-title">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog"><FiX /></button></header>{children}</section></div>;
const Field = ({ label, required, wide, children }) => <label className={`auto-field ${wide ? 'auto-field--wide' : ''}`}><span>{label}{required && <b> *</b>}</span>{children}</label>;
const FormActions = ({ onCancel, saving, label }) => <div className="auto-form-actions"><button type="button" className="auto-button auto-button--neutral" onClick={onCancel} disabled={saving}>Cancel</button><button type="submit" className="auto-button auto-button--primary" disabled={saving}>{saving ? 'Saving...' : label}</button></div>;

export default AutomotiveDashboard;
