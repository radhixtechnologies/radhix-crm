import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiActivity, FiArrowUpRight, FiBriefcase, FiCalendar, FiCheck, FiChevronRight,
  FiClock, FiDollarSign, FiEdit2, FiFileText, FiHardDrive, FiMapPin, FiPlus,
  FiSearch, FiTrash2, FiTool, FiUsers, FiX,
} from 'react-icons/fi';
import { constructionService } from '../../services/constructionService';
import { employeeService } from '../../services/employeeService';
import { salesService } from '../../services/salesService';
import Loader from '../../components/common/Loader';
import './ConstructionDashboard.css';

const projectStatuses = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
const billStatuses = ['planned', 'ordered', 'received', 'paid'];
const projectTypes = ['residential', 'commercial', 'renovation', 'interior', 'infrastructure', 'other'];
const categories = ['material', 'labor', 'equipment', 'subcontractor', 'other'];
const vendorCategories = ['materials', 'labor', 'equipment', 'electrical', 'plumbing', 'interior', 'other'];
const money = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);
const titleCase = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
const dateLabel = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set';

const emptyProject = { name: '', projectCode: '', projectType: 'residential', status: 'planning', priority: 'medium', location: '', description: '', client: '', projectManager: '', startDate: '', dueDate: '', budget: '', progress: '0' };
const emptyItem = { name: '', category: 'material', unit: 'piece', quantity: '', unitCost: '', vendor: '', notes: '' };
const emptyVendor = { name: '', company: '', category: 'materials', phone: '', email: '', address: '', notes: '', status: 'active' };

const ConstructionDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const section = location.pathname.split('/')[2] || 'overview';
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [projectModal, setProjectModal] = useState(null);
  const [itemModal, setItemModal] = useState(null);
  const [vendorModal, setVendorModal] = useState(null);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [vendorForm, setVendorForm] = useState(emptyVendor);
  const [selectedProject, setSelectedProject] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const jobs = [];
      if (section === 'overview') jobs.push(constructionService.getSummary().then((response) => setSummary(response.data.data)));
      if (['overview', 'projects', 'estimates'].includes(section)) {
        jobs.push(constructionService.getProjects({ search: search.trim() }).then((response) => setProjects(response.data.data || [])));
      }
      if (['overview', 'vendors', 'estimates'].includes(section)) {
        jobs.push(constructionService.getVendors({ status: 'active' }).then((response) => setVendors(response.data.data || [])));
      }
      if (['overview', 'projects'].includes(section)) {
        jobs.push(salesService.getLeads({ search: '', limit: 100 }).then((response) => setClients(response.data.data || [])));
        jobs.push(employeeService.getEmployees({ limit: 100, status: 'active' }).then((response) => setEmployees(response.data?.data || [])));
      }
      await Promise.all(jobs);
    } catch (requestError) {
      console.error('Unable to load construction workspace:', requestError);
      setError(requestError.response?.data?.message || 'Could not load the construction workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [section, search]);

  useEffect(() => {
    const timer = setTimeout(fetchData, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, search]);

  const stats = summary || { projects: 0, active: 0, delayed: 0, budget: 0, committed: 0, vendors: 0, openEstimates: 0, averageProgress: 0 };
  const pageTitle = { overview: 'Construction Overview', projects: 'Projects & Sites', estimates: 'Estimates & BOQ', vendors: 'Vendor Network' }[section] || 'Construction Overview';
  const selected = projects.find((project) => project._id === selectedProject) || projects[0];
  const estimateItems = useMemo(() => projects.flatMap((project) => (project.billItems || []).map((item) => ({ ...item, projectName: project.name, projectId: project._id }))), [projects]);
  const filteredVendors = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return vendors;
    return vendors.filter((vendor) => [vendor.name, vendor.company, vendor.category, vendor.phone].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [vendors, search]);

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const openProject = (project = null) => {
    setProjectForm(project ? {
      ...emptyProject,
      ...project,
      client: project.client?._id || '',
      projectManager: project.projectManager?._id || '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : '',
      dueDate: project.dueDate ? new Date(project.dueDate).toISOString().slice(0, 10) : '',
      budget: String(project.budget || ''),
      progress: String(project.progress || 0),
    } : emptyProject);
    setProjectModal(project || {});
  };

  const saveProject = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...projectForm,
        projectCode: projectForm.projectCode.trim() || undefined,
        client: projectForm.client || null,
        projectManager: projectForm.projectManager || null,
        budget: Number(projectForm.budget || 0),
        progress: Number(projectForm.progress || 0),
        startDate: projectForm.startDate || null,
        dueDate: projectForm.dueDate || null,
      };
      if (projectModal?._id) await constructionService.updateProject(projectModal._id, payload);
      else await constructionService.createProject(payload);
      setProjectModal(null);
      flash(projectModal?._id ? 'Project details updated.' : 'Construction project created.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save the construction project.');
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (project) => {
    if (!window.confirm(`Delete "${project.name}" and its estimate?`)) return;
    try {
      await constructionService.deleteProject(project._id);
      flash('Project deleted.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not delete this project.');
    }
  };

  const openItem = (project = selected) => {
    setSelectedProject(project?._id || '');
    setItemForm(emptyItem);
    setItemModal({});
  };

  const saveItem = async (event) => {
    event.preventDefault();
    if (!selectedProject) {
      setError('Create or select a construction project first.');
      return;
    }
    setSaving(true);
    try {
      await constructionService.addEstimateItem(selectedProject, {
        ...itemForm,
        quantity: Number(itemForm.quantity),
        unitCost: Number(itemForm.unitCost),
        vendor: itemForm.vendor || null,
      });
      setItemModal(null);
      flash('BOQ / estimate item added.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not add this estimate item.');
    } finally {
      setSaving(false);
    }
  };

  const updateItemStatus = async (item, status) => {
    try {
      await constructionService.updateEstimateItem(item.projectId, item._id, { status });
      flash('Procurement status updated.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update the estimate item.');
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Remove "${item.name}" from the BOQ?`)) return;
    try {
      await constructionService.deleteEstimateItem(item.projectId, item._id);
      flash('Estimate item removed.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not remove this item.');
    }
  };

  const openVendor = (vendor = null) => {
    setVendorForm(vendor ? { ...emptyVendor, ...vendor } : emptyVendor);
    setVendorModal(vendor || {});
  };

  const saveVendor = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (vendorModal?._id) await constructionService.updateVendor(vendorModal._id, vendorForm);
      else await constructionService.createVendor(vendorForm);
      setVendorModal(null);
      flash(vendorModal?._id ? 'Vendor profile updated.' : 'Vendor added to network.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save this vendor.');
    } finally {
      setSaving(false);
    }
  };

  const deactivateVendor = async (vendor) => {
    if (!window.confirm(`Mark ${vendor.name} inactive?`)) return;
    try {
      await constructionService.updateVendor(vendor._id, { status: 'inactive' });
      flash('Vendor marked inactive.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update vendor status.');
    }
  };

  const actions = (
    <div className="con-actions">
      {section === 'projects' && <button className="con-button con-button--primary" onClick={() => openProject()}><FiPlus /> New project</button>}
      {section === 'estimates' && <button className="con-button con-button--primary" onClick={() => openItem()}><FiPlus /> Add BOQ item</button>}
      {section === 'vendors' && <button className="con-button con-button--primary" onClick={() => openVendor()}><FiPlus /> Add vendor</button>}
    </div>
  );

  return (
    <main className="con-page">
      <header className="con-header">
        <div>
          <span className="con-eyebrow"><FiTool /> CONSTRUCTION & INTERIOR OPERATIONS</span>
          <h1>{pageTitle}</h1>
          <p>Plan the work, control project costs, and keep every site partner moving in the same direction.</p>
        </div>
        {actions}
      </header>

      <nav className="con-tabs" aria-label="Construction sections">
        {[
          { key: 'overview', label: 'Overview', path: '/construction', icon: FiActivity },
          { key: 'projects', label: 'Projects & sites', path: '/construction/projects', icon: FiBriefcase },
          { key: 'estimates', label: 'Estimates & BOQ', path: '/construction/estimates', icon: FiFileText },
          { key: 'vendors', label: 'Vendors', path: '/construction/vendors', icon: FiUsers },
        ].map(({ key, label, path, icon }) => (
          <Link key={key} to={path} className={`con-tab ${section === key ? 'is-active' : ''}`}>{createElement(icon)} {label}</Link>
        ))}
      </nav>

      {notice && <div className="con-alert con-alert--success" role="status"><FiCheck /> {notice}</div>}
      {error && <div className="con-alert con-alert--error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><FiX /></button></div>}

      {loading ? <div className="con-loading"><Loader /></div> : (
        <>
          {section === 'overview' && (
            <section className="con-overview">
              <div className="con-hero">
                <div>
                  <span className="con-hero__kicker">BUILT ON A CLEARER PLAN</span>
                  <h2>From first site visit to final handover.</h2>
                  <p>Bring project schedules, cost estimates, material procurement, and trusted vendors into one dependable workspace.</p>
                  <div className="con-hero__actions">
                    <button className="con-button con-button--light" onClick={() => openProject()}><FiPlus /> Create project</button>
                    <button className="con-button con-button--outline" onClick={() => openItem()}><FiFileText /> Build an estimate</button>
                  </div>
                </div>
                <div className="con-blueprint" aria-hidden="true"><div className="con-blueprint__building"><span /><span /><span /><span /><span /><span /><span /><span /><i /></div><div className="con-blueprint__label">SITE PLAN · 01</div></div>
              </div>

              <div className="con-stats">
                <Stat icon={FiBriefcase} tone="indigo" label="Active projects" value={stats.active} note={`${stats.projects} across your portfolio`} />
                <Stat icon={FiClock} tone="amber" label="Sites needing attention" value={stats.delayed} note="Past planned completion" />
                <Stat icon={FiDollarSign} tone="green" label="Total project budget" value={money(stats.budget)} note={`${money(stats.committed)} committed costs`} />
                <Stat icon={FiUsers} tone="blue" label="Active vendors" value={stats.vendors} note={`${stats.openEstimates} projects have BOQ`} />
              </div>

              <div className="con-overview-grid">
                <section className="con-panel">
                  <div className="con-panel__heading"><div><span className="con-kicker">FIELD PROGRESS</span><h2>Projects in motion</h2></div><Link to="/construction/projects" className="con-inline-link">All projects <FiArrowUpRight /></Link></div>
                  {projects.filter((project) => ['active', 'planning'].includes(project.status)).length ? (
                    <div className="con-project-list">{projects.filter((project) => ['active', 'planning'].includes(project.status)).slice(0, 5).map((project) => <ProjectRow key={project._id} project={project} onOpen={() => { setSelectedProject(project._id); navigate('/construction/projects'); }} />)}</div>
                  ) : <EmptyState icon={FiBriefcase} title="No sites on the board yet" description="Start with a project, location, and delivery target." action="Create project" onClick={() => openProject()} />}
                </section>

                <section className="con-panel con-cost-panel">
                  <div className="con-panel__heading"><div><span className="con-kicker">COST CONTROL</span><h2>Budget snapshot</h2></div><FiDollarSign className="con-heading-icon" /></div>
                  <div className="con-budget-total">{money(stats.budget)}</div>
                  <div className="con-budget-label">Total approved project budget</div>
                  <div className="con-budget-track"><span style={{ width: `${stats.budget ? Math.min(100, Math.round((stats.committed / stats.budget) * 100)) : 0}%` }} /></div>
                  <div className="con-budget-meta"><span>{money(stats.committed)} committed</span><strong>{stats.budget ? `${Math.round((stats.committed / stats.budget) * 100)}%` : '0%'}</strong></div>
                  <Link to="/construction/estimates" className="con-cost-link">Review estimates <FiChevronRight /></Link>
                </section>
              </div>

              <section className="con-panel con-quick-panel">
                <div className="con-panel__heading"><div><span className="con-kicker">GET STARTED</span><h2>Keep your next step simple</h2></div></div>
                <div className="con-quick-grid">
                  <QuickAction icon={FiMapPin} title="Set up a site" description="Record the project location, owner, schedule, and budget." onClick={() => openProject()} />
                  <QuickAction icon={FiFileText} title="Prepare a BOQ" description="Estimate quantities, unit costs, and procurement needs." onClick={() => openItem()} />
                  <QuickAction icon={FiUsers} title="Add a trade partner" description="Keep supplier and contractor contacts together." onClick={() => openVendor()} />
                </div>
              </section>
            </section>
          )}

          {section === 'projects' && (
            <>
              <div className="con-toolbar">
                <label className="con-search"><FiSearch /><input type="search" placeholder="Search projects, codes, or locations" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
                <span className="con-count">{projects.length} projects</span>
              </div>
              {projects.length ? (
                <div className="con-project-grid">{projects.map((project) => <ProjectCard key={project._id} project={project} onEdit={() => openProject(project)} onDelete={() => deleteProject(project)} onEstimate={() => openItem(project)} onStatus={async (status) => {
                  try { await constructionService.updateProject(project._id, { status }); flash('Project stage updated.'); await fetchData(); }
                  catch (requestError) { setError(requestError.response?.data?.message || 'Could not update project stage.'); }
                }} />)}</div>
              ) : <section className="con-panel"><EmptyState icon={FiBriefcase} title="Start your project portfolio" description="Add a new build, renovation, commercial fit-out, or interior project." action="Create first project" onClick={() => openProject()} /></section>}
            </>
          )}

          {section === 'estimates' && (
            <section className="con-panel">
              <div className="con-panel__heading con-estimate-heading">
                <div><span className="con-kicker">BILL OF QUANTITIES</span><h2>Material, labour & cost plan</h2><p>Track quantities, vendor assignments, and ordering progress per project.</p></div>
                <div className="con-estimate-picker"><label htmlFor="estimate-project">Project</label><select id="estimate-project" value={selected?._id || ''} onChange={(event) => setSelectedProject(event.target.value)}><option value="">All project items</option>{projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}</select><button className="con-button con-button--primary" onClick={() => openItem(selected)}><FiPlus /> Add item</button></div>
              </div>
              <div className="con-estimate-summary">
                <div><span>Line items</span><strong>{estimateItems.length}</strong></div>
                <div><span>Estimated total</span><strong>{money(estimateItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0))}</strong></div>
                <div><span>Ordered / received / paid</span><strong>{estimateItems.filter((item) => item.status !== 'planned').length}</strong></div>
              </div>
              {(() => {
                const shown = selectedProject ? estimateItems.filter((item) => item.projectId === selectedProject) : estimateItems;
                return shown.length ? (
                  <div className="con-table-wrap"><table className="con-table">
                    <thead><tr><th>Work / material</th><th>Project</th><th>Category</th><th>Quantity</th><th>Unit cost</th><th>Line total</th><th>Vendor</th><th>Procurement</th><th /></tr></thead>
                    <tbody>{shown.map((item) => <tr key={`${item.projectId}-${item._id}`}>
                      <td><strong>{item.name}</strong>{item.notes && <small>{item.notes}</small>}</td>
                      <td>{item.projectName}</td><td>{titleCase(item.category)}</td><td>{Number(item.quantity).toLocaleString()} {item.unit}</td>
                      <td>{money(item.unitCost)}</td><td><strong>{money(item.quantity * item.unitCost)}</strong></td>
                      <td>{item.vendor?.name || 'Unassigned'}</td>
                      <td><select className={`con-status-select con-status-select--${item.status}`} value={item.status} onChange={(event) => updateItemStatus(item, event.target.value)} aria-label={`Update procurement status for ${item.name}`}>{billStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></td>
                      <td><button className="con-icon-action con-icon-action--danger" onClick={() => deleteItem(item)} title="Remove estimate item" aria-label={`Remove ${item.name}`}><FiTrash2 /></button></td>
                    </tr>)}</tbody>
                  </table></div>
                ) : <EmptyState icon={FiFileText} title="No estimate items yet" description="Choose a project, then add the materials, labour, or work packages required." action="Add first item" onClick={() => openItem(selected)} />;
              })()}
            </section>
          )}

          {section === 'vendors' && (
            <section className="con-panel">
              <div className="con-toolbar con-toolbar--inside">
                <label className="con-search"><FiSearch /><input type="search" placeholder="Search vendor, company, trade, or phone" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
                <span className="con-count">{filteredVendors.length} trade partners</span>
              </div>
              {filteredVendors.length ? <div className="con-vendor-grid">{filteredVendors.map((vendor) => <VendorCard key={vendor._id} vendor={vendor} onEdit={() => openVendor(vendor)} onDeactivate={() => deactivateVendor(vendor)} />)}</div> : <EmptyState icon={FiUsers} title="Build your trusted vendor network" description="Keep supplier, contractor, equipment, and specialist contacts close to every project." action="Add first vendor" onClick={() => openVendor()} />}
            </section>
          )}
        </>
      )}

      {projectModal !== null && <Dialog title={projectModal?._id ? 'Update construction project' : 'Create a construction project'} onClose={() => setProjectModal(null)}>
        <form className="con-form" onSubmit={saveProject}>
          <div className="con-form-grid">
            <Field label="Project / site name" required><input required maxLength="160" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} placeholder="e.g. Greenview Residences" /></Field>
            <Field label="Project code"><input value={projectForm.projectCode} onChange={(e) => setProjectForm({ ...projectForm, projectCode: e.target.value })} placeholder="Optional unique code" /></Field>
            <Field label="Project type"><select value={projectForm.projectType} onChange={(e) => setProjectForm({ ...projectForm, projectType: e.target.value })}>{projectTypes.map((type) => <option key={type} value={type}>{titleCase(type)}</option>)}</select></Field>
            <Field label="Stage"><select value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}>{projectStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></Field>
            <Field label="Site location" required wide><input required value={projectForm.location} onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })} placeholder="Area, city, or site address" /></Field>
            <Field label="Client lead"><select value={projectForm.client} onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })}><option value="">No linked client</option>{clients.map((client) => <option key={client._id} value={client._id}>{client.name}</option>)}</select></Field>
            <Field label="Project manager"><select value={projectForm.projectManager} onChange={(e) => setProjectForm({ ...projectForm, projectManager: e.target.value })}><option value="">Unassigned</option>{employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.user?.name || employee.employeeId}</option>)}</select></Field>
            <Field label="Start date"><input type="date" value={projectForm.startDate} onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })} /></Field>
            <Field label="Target handover"><input type="date" value={projectForm.dueDate} onChange={(e) => setProjectForm({ ...projectForm, dueDate: e.target.value })} /></Field>
            <Field label="Approved budget (INR)"><input min="0" type="number" value={projectForm.budget} onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })} placeholder="0" /></Field>
            <Field label="Progress (%)"><input min="0" max="100" type="number" value={projectForm.progress} onChange={(e) => setProjectForm({ ...projectForm, progress: e.target.value })} /></Field>
            <Field label="Description" wide><textarea rows="3" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="Scope, key milestones, or handover notes" /></Field>
          </div>
          <FormActions onCancel={() => setProjectModal(null)} saving={saving} label={projectModal?._id ? 'Save project' : 'Create project'} />
        </form>
      </Dialog>}

      {itemModal !== null && <Dialog title="Add estimate / BOQ item" onClose={() => setItemModal(null)}>
        <form className="con-form" onSubmit={saveItem}>
          <div className="con-form-grid">
            <Field label="Project" required wide><select required value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}><option value="">Choose project</option>{projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}</select></Field>
            <Field label="Material or work package" required><input required value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="e.g. M25 ready-mix concrete" /></Field>
            <Field label="Category"><select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}>{categories.map((category) => <option key={category} value={category}>{titleCase(category)}</option>)}</select></Field>
            <Field label="Quantity" required><input required min="0.01" step="any" type="number" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} /></Field>
            <Field label="Unit"><input required value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} placeholder="bag, sq. ft., hour" /></Field>
            <Field label="Unit cost (INR)" required><input required min="0" step="any" type="number" value={itemForm.unitCost} onChange={(e) => setItemForm({ ...itemForm, unitCost: e.target.value })} /></Field>
            <Field label="Preferred vendor"><select value={itemForm.vendor} onChange={(e) => setItemForm({ ...itemForm, vendor: e.target.value })}><option value="">Not assigned</option>{vendors.map((vendor) => <option key={vendor._id} value={vendor._id}>{vendor.name}{vendor.company ? ` · ${vendor.company}` : ''}</option>)}</select></Field>
            <Field label="Notes" wide><textarea rows="3" value={itemForm.notes} onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })} placeholder="Specification or procurement note" /></Field>
          </div>
          <FormActions onCancel={() => setItemModal(null)} saving={saving} label="Add BOQ item" />
        </form>
      </Dialog>}

      {vendorModal !== null && <Dialog title={vendorModal?._id ? 'Edit vendor profile' : 'Add trade partner'} onClose={() => setVendorModal(null)}>
        <form className="con-form" onSubmit={saveVendor}>
          <div className="con-form-grid">
            <Field label="Contact name" required><input required value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} placeholder="Contact person" /></Field>
            <Field label="Company"><input value={vendorForm.company} onChange={(e) => setVendorForm({ ...vendorForm, company: e.target.value })} placeholder="Business name" /></Field>
            <Field label="Trade / category"><select value={vendorForm.category} onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}>{vendorCategories.map((category) => <option key={category} value={category}>{titleCase(category)}</option>)}</select></Field>
            <Field label="Phone number" required><input required value={vendorForm.phone} onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })} placeholder="+91 ..." /></Field>
            <Field label="Email"><input type="email" value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} placeholder="vendor@example.com" /></Field>
            <Field label="Status"><select value={vendorForm.status} onChange={(e) => setVendorForm({ ...vendorForm, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
            <Field label="Address" wide><input value={vendorForm.address} onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })} placeholder="Business address" /></Field>
            <Field label="Notes" wide><textarea rows="3" value={vendorForm.notes} onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })} placeholder="Specialities, payment terms, or service area" /></Field>
          </div>
          <FormActions onCancel={() => setVendorModal(null)} saving={saving} label={vendorModal?._id ? 'Save vendor' : 'Add vendor'} />
        </form>
      </Dialog>}
    </main>
  );
};

const Stat = ({ icon, tone, label, value, note }) => (
  <article className="con-stat"><div className={`con-stat__icon con-stat__icon--${tone}`}>{createElement(icon)}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>
);

const ProjectRow = ({ project, onOpen }) => (
  <article className="con-project-row">
    <div className="con-project-mark"><FiHardDrive /></div>
    <div className="con-project-row__main"><strong>{project.name}</strong><span><FiMapPin /> {project.location}</span><div className="con-progress"><i style={{ width: `${project.progress || 0}%` }} /></div></div>
    <div className="con-project-row__meta"><span className={`con-status con-status--${project.status}`}>{titleCase(project.status)}</span><small>{project.progress || 0}% complete</small></div>
    <button className="con-icon-action" onClick={onOpen} aria-label={`Open ${project.name}`}><FiChevronRight /></button>
  </article>
);

const ProjectCard = ({ project, onEdit, onDelete, onEstimate, onStatus }) => {
  const estimate = project.estimateTotal || 0;
  const dueDate = project.dueDate && new Date(project.dueDate);
  const isDelayed = project.status === 'active' && dueDate && dueDate < new Date();
  return (
    <article className="con-project-card">
      <div className="con-project-card__top"><span className={`con-status con-status--${project.status}`}>{titleCase(project.status)}</span><span className={`con-priority con-priority--${project.priority}`}>{project.priority}</span></div>
      <div className="con-project-card__identity"><div className="con-project-card__icon"><FiHardDrive /></div><div><h2>{project.name}</h2><span>{project.projectCode || titleCase(project.projectType)}</span></div></div>
      <p className="con-project-card__location"><FiMapPin /> {project.location}</p>
      {project.description && <p className="con-project-card__description">{project.description}</p>}
      <div className="con-project-card__progress"><div><span>Site progress</span><strong>{project.progress || 0}%</strong></div><div className="con-progress"><i style={{ width: `${project.progress || 0}%` }} /></div></div>
      <div className="con-project-card__metrics"><div><span>Project budget</span><strong>{money(project.budget)}</strong></div><div><span>Estimate total</span><strong>{money(estimate)}</strong></div></div>
      <div className="con-project-card__facts"><span><FiCalendar /> {dateLabel(project.dueDate)} target</span><span><FiUsers /> {project.projectManager?.user?.name || project.client?.name || 'No owner assigned'}</span></div>
      {isDelayed && <div className="con-delay-note"><FiClock /> Target date has passed</div>}
      <div className="con-project-card__footer"><select value={project.status} onChange={(event) => onStatus(event.target.value)} aria-label={`Update ${project.name} stage`}>{projectStatuses.map((status) => <option value={status} key={status}>{titleCase(status)}</option>)}</select><button className="con-inline-link" onClick={onEstimate}><FiFileText /> BOQ</button><button className="con-icon-action" onClick={onEdit} aria-label={`Edit ${project.name}`}><FiEdit2 /></button><button className="con-icon-action con-icon-action--danger" onClick={onDelete} aria-label={`Delete ${project.name}`}><FiTrash2 /></button></div>
    </article>
  );
};

const VendorCard = ({ vendor, onEdit, onDeactivate }) => (
  <article className="con-vendor-card">
    <div className="con-vendor-card__top"><div className="con-vendor-avatar"><FiUsers /></div><span className="con-vendor-trade">{titleCase(vendor.category)}</span></div>
    <h3>{vendor.company || vendor.name}</h3><p>{vendor.company ? vendor.name : titleCase(vendor.category)}</p>
    <a href={`tel:${vendor.phone}`} className="con-vendor-contact">{vendor.phone}</a>{vendor.email && <a href={`mailto:${vendor.email}`} className="con-vendor-contact">{vendor.email}</a>}
    {vendor.address && <span className="con-vendor-address"><FiMapPin /> {vendor.address}</span>}
    <div className="con-vendor-card__footer"><span className="con-status con-status--active">Active partner</span><div><button className="con-icon-action" onClick={onEdit} aria-label={`Edit ${vendor.name}`}><FiEdit2 /></button><button className="con-icon-action con-icon-action--danger" onClick={onDeactivate} aria-label={`Deactivate ${vendor.name}`}><FiX /></button></div></div>
  </article>
);

const QuickAction = ({ icon, title, description, onClick }) => (
  <button className="con-quick-action" onClick={onClick}><span>{createElement(icon)}</span><div><strong>{title}</strong><small>{description}</small></div><FiArrowUpRight /></button>
);

const EmptyState = ({ icon, title, description, action, onClick }) => (
  <div className="con-empty"><span>{createElement(icon)}</span><h3>{title}</h3><p>{description}</p>{action && <button className="con-button con-button--primary" onClick={onClick}><FiPlus /> {action}</button>}</div>
);

const Dialog = ({ title, onClose, children }) => (
  <div className="con-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="con-dialog" role="dialog" aria-modal="true" aria-labelledby="construction-dialog-title">
      <header><h2 id="construction-dialog-title">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog"><FiX /></button></header>{children}
    </section>
  </div>
);

const Field = ({ label, required, wide, children }) => <label className={`con-field ${wide ? 'con-field--wide' : ''}`}><span>{label}{required && <b> *</b>}</span>{children}</label>;
const FormActions = ({ onCancel, saving, label }) => <div className="con-form-actions"><button type="button" className="con-button con-button--neutral" onClick={onCancel} disabled={saving}>Cancel</button><button type="submit" className="con-button con-button--primary" disabled={saving}>{saving ? 'Saving…' : label}</button></div>;

export default ConstructionDashboard;
