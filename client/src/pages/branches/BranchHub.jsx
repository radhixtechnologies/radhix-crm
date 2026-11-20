import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiMapPin,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiPhone,
  FiMail,
  FiClock,
  FiSearch,
  FiFilter,
  FiShield,
  FiZap,
  FiCheckCircle,
  FiX,
  FiHome,
  FiBriefcase,
  FiLayers,
  FiAward,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { branchService } from '../../services/branchService';
import Loader from '../../components/common/Loader';
import './BranchHub.css';

const BRANCH_TYPES = [
  { id: 'all', label: 'All Locations' },
  { id: 'headquarters', label: 'Headquarters' },
  { id: 'sales_branch', label: 'Sales Branch' },
  { id: 'regional_office', label: 'Regional Office' },
  { id: 'clinic_center', label: 'Clinic / Center' },
  { id: 'campus', label: 'Campus / Institute' },
  { id: 'showroom', label: 'Showroom' },
  { id: 'warehouse', label: 'Warehouse / Logistics' },
];

const BranchHub = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [branches, setBranches] = useState([]);
  const [companyList, setCompanyList] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');
  const [quota, setQuota] = useState({ current: 1, max: 999999, isEnterprise: true, planSlug: 'enterprise', isSuperAdmin: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    companyId: '',
    name: '',
    code: '',
    type: 'sales_branch',
    managerName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    },
    capacity: 25,
    operatingHours: '9:30 AM - 6:30 PM (Mon-Sat)',
    notes: '',
  });

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (isSuperAdmin && selectedCompanyId !== 'all') {
        params.companyId = selectedCompanyId;
      }
      const res = await branchService.getBranches(params);
      if (res.data?.success) {
        setBranches(res.data.data || []);
        if (res.data.companies) {
          setCompanyList(res.data.companies);
        }
        if (res.data.quota) {
          setQuota(res.data.quota);
        }
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError(err.response?.data?.message || 'Failed to load branch offices');
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, selectedCompanyId]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleOpenAddModal = () => {
    // Only regular tenants on Starter/Pro are blocked by quota
    if (!isSuperAdmin && quota.current >= quota.max && !quota.isEnterprise) {
      setError(
        `Branch Limit Reached: Your current plan (${quota.planSlug.toUpperCase()}) allows up to ${quota.max} branch(es). Please upgrade to Enterprise Scale for Unlimited Branches.`
      );
      return;
    }
    setEditingBranch(null);
    const defaultCompany = isSuperAdmin
      ? (selectedCompanyId !== 'all' ? selectedCompanyId : companyList[0]?._id || '')
      : '';

    setFormData({
      companyId: defaultCompany,
      name: '',
      code: `BR-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'sales_branch',
      managerName: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
      },
      capacity: 25,
      operatingHours: '9:30 AM - 6:30 PM (Mon-Sat)',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (branch) => {
    setEditingBranch(branch);
    setFormData({
      companyId: branch.company?._id || branch.company || '',
      name: branch.name,
      code: branch.code,
      type: branch.type || 'sales_branch',
      managerName: branch.managerName || '',
      email: branch.email || '',
      phone: branch.phone || '',
      address: {
        street: branch.address?.street || '',
        city: branch.address?.city || '',
        state: branch.address?.state || '',
        postalCode: branch.address?.postalCode || '',
        country: branch.address?.country || 'India',
      },
      capacity: branch.capacity || 25,
      operatingHours: branch.operatingHours || '9:30 AM - 6:30 PM (Mon-Sat)',
      notes: branch.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingBranch) {
        const res = await branchService.updateBranch(editingBranch._id, formData);
        setNotice(res.data?.message || 'Branch updated successfully');
      } else {
        const res = await branchService.createBranch(formData);
        setNotice(res.data?.message || 'New branch added successfully');
      }
      setShowModal(false);
      await fetchBranches();
      setTimeout(() => setNotice(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save branch');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (branch) => {
    if (branch.isHeadOffice) {
      alert('Central Headquarters cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete branch "${branch.name}" (${branch.code})?`)) {
      return;
    }
    setSaving(true);
    try {
      await branchService.deleteBranch(branch._id);
      setNotice('Branch deleted successfully');
      await fetchBranches();
      setTimeout(() => setNotice(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete branch');
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const headOffice = useMemo(() => branches.find((b) => b.isHeadOffice) || branches[0], [branches]);
  const totalCapacity = useMemo(() => branches.reduce((acc, b) => acc + (b.capacity || 0), 0), [branches]);
  const activeCount = useMemo(() => branches.filter((b) => b.isActive).length, [branches]);

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const matchSearch =
        !search ||
        b.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.code?.toLowerCase().includes(search.toLowerCase()) ||
        b.address?.city?.toLowerCase().includes(search.toLowerCase()) ||
        b.managerName?.toLowerCase().includes(search.toLowerCase()) ||
        b.company?.name?.toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === 'all' || b.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [branches, search, typeFilter]);

  if (loading) return <Loader />;

  return (
    <div className="branch-hub-page">
      {/* Notifications */}
      {notice && (
        <div className="bh-notice-toast">
          <FiCheckCircle /> <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="bh-error-toast">
          <FiShield /> <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="btn-close-toast">
            <FiX />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="bh-header">
        <div className="bh-header-left">
          <div className="bh-badge-row">
            <span className="bh-pill">
              <FiMapPin /> Multi-Branch Infrastructure
            </span>
            {isSuperAdmin ? (
              <span className="bh-plan-badge tier-enterprise" style={{ background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
                <FiAward /> SUPER ADMIN MASTER GOVERNANCE
              </span>
            ) : (
              <span className={`bh-plan-badge tier-${quota.planSlug}`}>
                {quota.planSlug.toUpperCase()} TIER
              </span>
            )}
          </div>
          <h1>Multi-Branch Hub &amp; Regional Offices</h1>
          <p>
            {isSuperAdmin
              ? 'Govern and monitor regional branches, head offices, and city hubs across all onboarded SaaS client businesses.'
              : 'Govern nationwide branches, city franchises, and operational workspaces under unified multi-tenant governance.'}
          </p>
        </div>
        <div className="bh-header-actions">
          {!isSuperAdmin && quota.current >= quota.max && !quota.isEnterprise ? (
            <button
              type="button"
              className="bh-btn-upgrade"
              onClick={() => navigate('/subscription')}
            >
              <FiZap /> Upgrade for Unlimited Branches
            </button>
          ) : (
            <button type="button" className="bh-btn-primary" onClick={handleOpenAddModal}>
              <FiPlus /> Add New Branch
            </button>
          )}
        </div>
      </div>

      {/* Plan Teaser Banner (Only shown to regular tenants on Starter tier, NEVER to Super Admin) */}
      {!isSuperAdmin && quota.planSlug === 'starter' && (
        <div className="bh-enterprise-banner">
          <div className="banner-icon-box">
            <FiLayers />
          </div>
          <div className="banner-content">
            <h3>Scale Nationally with Enterprise Multi-Branch Network</h3>
            <p>
              Your Starter plan includes 1 Central Headquarters location. Upgrade to{' '}
              <strong>Enterprise Scale</strong> to manage unlimited city hubs, assign regional
              managers, configure custom local tax structures, and get consolidated multi-branch
              P&amp;L reports.
            </p>
          </div>
          <button
            type="button"
            className="btn-unlock-enterprise"
            onClick={() => navigate('/subscription')}
          >
            Unlock Enterprise Multi-Branch Hub →
          </button>
        </div>
      )}

      {/* Top 4 Metrics Cards */}
      <div className="bh-metrics-grid">
        <div className="bh-metric-card">
          <div className="metric-icon-box primary">
            <FiMapPin />
          </div>
          <div className="metric-details">
            <span className="metric-title">Operating Branches</span>
            <div className="metric-value">{activeCount}</div>
            <span className="metric-sub">{branches.length} locations registered</span>
          </div>
        </div>

        <div className="bh-metric-card">
          <div className="metric-icon-box hq">
            <FiHome />
          </div>
          <div className="metric-details">
            <span className="metric-title">Headquarters Hub</span>
            <div className="metric-value hq-city">{headOffice?.address?.city || 'Central City'}</div>
            <span className="metric-sub">{headOffice?.name || 'Primary HQ'}</span>
          </div>
        </div>

        <div className="bh-metric-card">
          <div className="metric-icon-box capacity">
            <FiUsers />
          </div>
          <div className="metric-details">
            <span className="metric-title">Combined Staff Capacity</span>
            <div className="metric-value">{totalCapacity} Desks</div>
            <span className="metric-sub">Across all operational offices</span>
          </div>
        </div>

        <div className="bh-metric-card">
          <div className="metric-icon-box quota">
            <FiShield />
          </div>
          <div className="metric-details">
            <span className="metric-title">Branch Governance</span>
            <div className="metric-value">
              {isSuperAdmin ? 'Full Access' : quota.isEnterprise ? 'Unlimited' : `${quota.current} / ${quota.max}`}
            </div>
            <span className="metric-sub">
              {isSuperAdmin
                ? 'Super Admin Unlimited Mode'
                : quota.isEnterprise
                ? 'Enterprise Scale Unlocked'
                : `${quota.max - quota.current} branch slot remaining`}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bh-filter-bar">
        <div className="bh-search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by branch name, code, city, business or manager..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Super Admin Client Company Selector */}
        {isSuperAdmin && companyList.length > 0 && (
          <div className="bh-filter-dropdown">
            <FiBriefcase className="filter-icon" />
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              title="Filter branches by client business organization"
            >
              <option value="all">All Client Businesses ({branches.length})</option>
              {companyList.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.industry || 'general'})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="bh-filter-dropdown">
          <FiFilter className="filter-icon" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {BRANCH_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="bh-grid">
        {filteredBranches.length === 0 ? (
          <div className="bh-empty-card">
            <FiMapPin className="empty-icon" />
            <h3>No Branches Found</h3>
            <p>No operational branch locations match your search criteria.</p>
            <button type="button" className="bh-btn-primary" onClick={handleOpenAddModal}>
              <FiPlus /> Add Branch Location
            </button>
          </div>
        ) : (
          filteredBranches.map((branch) => {
            const isHQ = branch.isHeadOffice;
            const fullAddress = [
              branch.address?.street,
              branch.address?.city,
              branch.address?.state,
              branch.address?.country,
            ]
              .filter(Boolean)
              .join(', ');

            return (
              <div key={branch._id} className={`bh-card ${isHQ ? 'is-hq' : ''}`}>
                <div className="bh-card-header">
                  <div className="bh-card-type-row">
                    <span className={`branch-type-pill ${branch.type}`}>
                      {branch.type?.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {isHQ && <span className="hq-crown-pill">👑 CENTRAL HQ</span>}
                    <span className="branch-code-chip">{branch.code}</span>
                  </div>

                  <div className="bh-card-actions">
                    <button
                      type="button"
                      className="btn-card-edit"
                      title="Edit Branch Information"
                      onClick={() => handleOpenEditModal(branch)}
                    >
                      <FiEdit2 />
                    </button>
                    {!isHQ && (
                      <button
                        type="button"
                        className="btn-card-delete"
                        title="Delete Branch"
                        onClick={() => handleDelete(branch)}
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                </div>

                <div className="bh-card-title-block">
                  <h3>{branch.name}</h3>
                  {isSuperAdmin && branch.company?.name && (
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#6366f1', marginBottom: '4px' }}>
                      🏢 {branch.company.name} ({branch.company.industry?.replace(/-/g, ' ').toUpperCase()})
                    </div>
                  )}
                  <div className="bh-card-city">
                    <FiMapPin /> {branch.address?.city || 'City'}, {branch.address?.state || 'State'}
                  </div>
                </div>

                <div className="bh-card-address">{fullAddress || 'Address on file'}</div>

                <div className="bh-card-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Branch Manager</span>
                    <div className="detail-val">
                      <FiBriefcase className="detail-icon" />
                      <span>{branch.managerName || branch.manager?.name || 'General Management'}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Seating Capacity</span>
                    <div className="detail-val">
                      <FiUsers className="detail-icon" />
                      <span>{branch.capacity || 20} Team Desks</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Operating Hours</span>
                    <div className="detail-val">
                      <FiClock className="detail-icon" />
                      <span>{branch.operatingHours || '9:30 AM - 6:30 PM'}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Direct Contact</span>
                    <div className="detail-val contact-links">
                      {branch.phone && (
                        <a href={`tel:${branch.phone}`} title={branch.phone}>
                          <FiPhone /> Call
                        </a>
                      )}
                      {branch.email && (
                        <a href={`mailto:${branch.email}`} title={branch.email}>
                          <FiMail /> Email
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bh-card-footer">
                  <span className="status-indicator active">
                    <span className="status-dot" /> Operational
                  </span>
                  <span className="card-notes">
                    {branch.notes || 'Full CRM & Industry Suite Connected'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Branch Modal */}
      {showModal && (
        <div className="bh-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="bh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bh-modal-header">
              <div className="modal-title-group">
                <FiMapPin className="modal-title-icon" />
                <h3>{editingBranch ? 'Edit Branch Location' : 'Register New Operational Branch'}</h3>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setShowModal(false)}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="bh-modal-form">
              {/* If Super Admin, allow selecting which business this branch belongs to */}
              {isSuperAdmin && companyList.length > 0 && !editingBranch && (
                <div className="form-group">
                  <label>Business / Client Company *</label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    required
                  >
                    <option value="">-- Select Client Organization --</option>
                    {companyList.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.industry || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Branch / Office Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai Corporate Office"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Branch Code (Unique) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BOM-01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Location Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="sales_branch">Sales &amp; Marketing Branch</option>
                    <option value="regional_office">Regional Corporate Office</option>
                    <option value="clinic_center">Clinic / Health Center</option>
                    <option value="campus">Campus / Coaching Institute</option>
                    <option value="showroom">Showroom / Experience Center</option>
                    <option value="warehouse">Warehouse &amp; Logistics</option>
                    <option value="headquarters">Central Headquarters</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Branch Manager / Lead</label>
                  <input
                    type="text"
                    placeholder="e.g. Amit Sharma (Director)"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai"
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>State / Province</label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={formData.address.state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 402, Trade Center, BKC"
                    value={formData.address.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code / Pincode</label>
                  <input
                    type="text"
                    placeholder="e.g. 400051"
                    value={formData.address.postalCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, postalCode: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Official Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Official Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. mumbai@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Desk / Seating Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Operating Hours</label>
                  <input
                    type="text"
                    placeholder="e.g. 9:00 AM - 6:30 PM (Mon-Sat)"
                    value={formData.operatingHours}
                    onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Operational Notes</label>
                <textarea
                  rows="2"
                  placeholder="Notes regarding this branch, facility specs, parking, or key contacts..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="bh-modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Saving...' : editingBranch ? 'Update Branch' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchHub;
