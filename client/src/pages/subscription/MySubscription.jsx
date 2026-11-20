import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiCheck,
  FiZap,
  FiShield,
  FiUsers,
  FiTrendingUp,
  FiClock,
  FiCreditCard,
  FiAlertCircle,
  FiLayers,
  FiCheckCircle,
  FiPlus,
  FiCopy,
  FiSend,
  FiKey,
  FiSearch,
  FiFilter,
  FiHome,
  FiBookOpen,
  FiHeart,
  FiBriefcase,
  FiActivity,
  FiCalendar,
  FiEye,
  FiLogIn,
  FiSettings,
  FiExternalLink,
  FiDollarSign,
  FiFileText,
  FiPhone,
  FiMail,
  FiGlobe,
  FiX,
  FiMapPin,
  FiAward,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { subscriptionService } from '../../services/subscriptionService';
import { triggerConfetti } from '../../utils/confetti';
import Loader from '../../components/common/Loader';
import './MySubscription.css';

const INDUSTRY_OPTIONS = [
  { id: 'real-estate', label: '🏢 Real Estate & Properties' },
  { id: 'institute', label: '🎓 Institute & Coaching Admissions' },
  { id: 'healthcare', label: '🏥 Healthcare, Clinic & Hospital' },
  { id: 'it-agency', label: '💻 IT Services & Software Agency' },
  { id: 'retail', label: '🛒 Retail & E-Commerce' },
  { id: 'gym', label: '🏋️ Gym & Fitness Center' },
  { id: 'salon', label: '💇 Salon & Spa Management' },
  { id: 'automotive', label: '🚗 Automotive & Garage Workshop' },
  { id: 'construction', label: '🏗️ Construction & Infrastructure' },
  { id: 'manufacturing', label: '🏭 Manufacturing & Factory' },
  { id: 'restaurant', label: '🍽️ Restaurant & Food Services' },
  { id: 'travel', label: '✈️ Travel & Tourism Agency' },
  { id: 'general', label: '🌐 General Business CRM' },
];

const MySubscription = () => {
  const { isSuperAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'tenants' : 'plans'); // 'tenants' | 'plans'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState([]);
  const [subData, setSubData] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // SuperAdmin Search & Filter
  const [tenantSearch, setTenantSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');

  // Modal State for Onboarding New Business
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newTenantCreds, setNewTenantCreds] = useState(null);
  const [copied, setCopied] = useState(false);

  // New Tenant Form
  // 360° Drawer / Modal state
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [tenantDetails, setTenantDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsTab, setDetailsTab] = useState('overview'); // 'overview' | 'subscription' | 'profile' | 'team'

  // Edit Subscription in 360° modal
  const [editSubForm, setEditSubForm] = useState({
    planSlug: 'pro',
    status: 'active',
    extendDays: '',
    expiryDate: '',
    allowedSuites: [],
  });

  // Edit Profile in 360° modal
  const [editProfileForm, setEditProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    industry: '',
    upiId: '',
    upiName: '',
    gstin: '',
  });

  // Reset Password Modal state
  const [resetPwdTenant, setResetPwdTenant] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('Welcome@2026');
  const [resetSuccessCreds, setResetSuccessCreds] = useState(null);

  const [onboardForm, setOnboardForm] = useState({
    companyName: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    password: 'Welcome@2026',
    industry: 'real-estate',
    planSlug: 'pro',
    durationMonths: '12',
  });

  // Company settings form
  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    phone: '',
    upiId: '',
    upiName: '',
    gstin: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const tasks = [
        subscriptionService.getPlans(),
        subscriptionService.getMySubscription(),
      ];

      if (isSuperAdmin) {
        tasks.push(subscriptionService.getAllTenants());
      }

      const [plansRes, mySubRes, tenantsRes] = await Promise.all(tasks);

      if (plansRes.data?.data) {
        setPlans(plansRes.data.data);
      }

      if (mySubRes.data?.data) {
        const d = mySubRes.data.data;
        setSubData(d);
        if (d.subscription?.billingCycle) {
          setBillingCycle(d.subscription.billingCycle);
        }
        if (d.company) {
          setCompanyForm({
            name: d.company.name || '',
            email: d.company.email || '',
            phone: d.company.phone || '',
            upiId: d.company.upiId || '',
            upiName: d.company.upiName || '',
            gstin: d.company.gstin || '',
          });
        }
      }

      if (tenantsRes?.data?.data) {
        setTenants(tenantsRes.data.data);
      }
    } catch (err) {
      console.error('Error loading subscription info:', err);
      setError(err.response?.data?.message || 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpgrade = async (planSlug) => {
    if (subData?.subscription?.planSlug === planSlug) return;
    setSaving(true);
    setError('');
    try {
      const res = await subscriptionService.changePlan({ planSlug, billingCycle });
      setNotice(res.data?.message || 'Subscription updated successfully!');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change subscription plan');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await subscriptionService.updateCompanySettings(companyForm);
      setNotice(res.data?.message || 'Company settings saved successfully');
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save company settings');
    } finally {
      setSaving(false);
    }
  };

  // SuperAdmin: Onboard New Business
  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await subscriptionService.createTenant(onboardForm);
      if (res.data?.success) {
        triggerConfetti();
        setNewTenantCreds(res.data.data?.credentials);
        setNotice('Business account and admin login successfully created!');
        // Refresh tenants list
        const refreshed = await subscriptionService.getAllTenants();
        if (refreshed.data?.data) {
          setTenants(refreshed.data.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create business account');
    } finally {
      setSaving(false);
    }
  };

  // SuperAdmin: Extend Subscription Days
  const handleExtendDays = async (companyId, days) => {
    setSaving(true);
    setError('');
    try {
      await subscriptionService.updateTenantSubscription(companyId, { extendDays: days });
      setNotice(`Subscription successfully extended by ${days} days!`);
      const refreshed = await subscriptionService.getAllTenants();
      if (refreshed.data?.data) {
        setTenants(refreshed.data.data);
      }
      setTimeout(() => setNotice(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to extend subscription');
    } finally {
      setSaving(false);
    }
  };

  // Open 360° Details
  const handleOpenTenantDetails = async (tenantId, defaultTab = 'overview') => {
    setSelectedTenantId(tenantId);
    setDetailsTab(defaultTab);
    setLoadingDetails(true);
    try {
      const res = await subscriptionService.getTenantDetails(tenantId);
      if (res.data?.data) {
        const d = res.data.data;
        setTenantDetails(d);
        setEditSubForm({
          planSlug: d.company?.subscription?.planSlug || 'starter',
          status: d.company?.subscription?.status || 'active',
          extendDays: '',
          expiryDate: d.company?.subscription?.currentPeriodEnd ? new Date(d.company.subscription.currentPeriodEnd).toISOString().slice(0, 10) : '',
          allowedSuites: d.company?.subscription?.allowedSuites || [d.company?.industry || 'real-estate'],
        });
        setEditProfileForm({
          name: d.company?.name || '',
          email: d.company?.email || '',
          phone: d.company?.phone || '',
          industry: d.company?.industry || '',
          upiId: d.company?.upiId || '',
          upiName: d.company?.upiName || '',
          gstin: d.company?.gstin || '',
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load business details');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Impersonate Tenant
  const handleImpersonate = async (tenantId) => {
    try {
      setSaving(true);
      const res = await subscriptionService.impersonateTenant(tenantId);
      if (res.data?.success) {
        // Backup current Super Admin session
        const currentBackup = {
          token: localStorage.getItem('token'),
          sessionId: localStorage.getItem('sessionId'),
          user: user,
        };
        localStorage.setItem('radhix_impersonation_backup', JSON.stringify(currentBackup));

        // Save tenant user session
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('sessionId', res.data.sessionId);
        localStorage.setItem('user', JSON.stringify(res.data.data));

        // Lock suite to tenant's industry
        const ind = res.data.data?.company?.industry || 'real-estate';
        localStorage.setItem('radhix_active_industry_suite', ind);

        triggerConfetti();
        setNotice(`Logging in as ${res.data.data?.company?.name || 'Tenant'}...`);

        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login as tenant');
    } finally {
      setSaving(false);
    }
  };

  // Save Subscription Updates from 360° modal
  const handleSaveSubscriptionChanges = async (e) => {
    e.preventDefault();
    if (!selectedTenantId) return;
    setSaving(true);
    try {
      const payload = {
        planSlug: editSubForm.planSlug,
        status: editSubForm.status,
        allowedSuites: editSubForm.allowedSuites,
      };
      if (editSubForm.extendDays) payload.extendDays = editSubForm.extendDays;
      if (editSubForm.expiryDate) payload.expiryDate = editSubForm.expiryDate;

      await subscriptionService.updateTenantSubscription(selectedTenantId, payload);
      setNotice('Subscription details updated successfully!');
      triggerConfetti();
      await handleOpenTenantDetails(selectedTenantId, 'subscription');
      const refreshed = await subscriptionService.getAllTenants();
      if (refreshed.data?.data) setTenants(refreshed.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update subscription');
    } finally {
      setSaving(false);
    }
  };

  // Save Profile Updates from 360° modal
  const handleSaveProfileChanges = async (e) => {
    e.preventDefault();
    if (!selectedTenantId) return;
    setSaving(true);
    try {
      await subscriptionService.updateTenantCompanyProfile(selectedTenantId, editProfileForm);
      setNotice('Business profile & UPI details updated successfully!');
      triggerConfetti();
      await handleOpenTenantDetails(selectedTenantId, 'profile');
      const refreshed = await subscriptionService.getAllTenants();
      if (refreshed.data?.data) setTenants(refreshed.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update company profile');
    } finally {
      setSaving(false);
    }
  };

  // Submit Password Reset
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetPwdTenant?._id) return;
    setSaving(true);
    try {
      const res = await subscriptionService.resetTenantPassword(resetPwdTenant._id, { newPassword: newPasswordVal });
      if (res.data?.success) {
        setResetSuccessCreds(res.data.credentials);
        triggerConfetti();
        setNotice('Password reset successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  // Filtered Tenants List
  const filteredTenants = useMemo(() => {
    const q = tenantSearch.trim().toLowerCase();
    return tenants.filter((t) => {
      const matchesIndustry = industryFilter === 'all' || t.industry === industryFilter;
      const matchesSearch =
        !q ||
        t.name?.toLowerCase().includes(q) ||
        t.owner?.name?.toLowerCase().includes(q) ||
        t.owner?.email?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q);
      return matchesIndustry && matchesSearch;
    });
  }, [tenants, tenantSearch, industryFilter]);

  const copyCredentialsText = () => {
    if (!newTenantCreds) return;
    const text = `🎉 Welcome to Radhix CRM!\n\nYour business account has been activated:\n🏢 Company: ${newTenantCreds.companyName}\n🌐 Login URL: ${window.location.origin}/login\n📧 Email: ${newTenantCreds.email}\n🔑 Password: ${newTenantCreds.password}\n\nPlease login and set up your team.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="sub-loading-container">
        <Loader />
        <p>Loading subscription details & usage quotas...</p>
      </div>
    );
  }

  const currentPlanSlug = subData?.subscription?.planSlug || 'starter';
  const usage = subData?.usage || {};
  const status = subData?.subscription?.status || 'trial';

  return (
    <div className="subscription-container animate-fade-in">
      {notice && (
        <div className="sub-alert success">
          <FiCheckCircle />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')}>✕</button>
        </div>
      )}

      {error && (
        <div className="sub-alert error">
          <FiAlertCircle />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* SUPERADMIN NAVIGATION TABS */}
      {isSuperAdmin && (
        <div className="superadmin-sub-tabs">
          <button
            type="button"
            className={`sa-tab-btn ${activeTab === 'tenants' ? 'active' : ''}`}
            onClick={() => setActiveTab('tenants')}
          >
            <FiShield style={{ marginRight: '6px' }} />
            🏢 SaaS Client Businesses ({tenants.length})
          </button>
          <button
            type="button"
            className={`sa-tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            <FiZap style={{ marginRight: '6px' }} />
            💎 Plans, Pricing & My Quotas
          </button>
        </div>
      )}

      {/* TAB 1: SUPERADMIN TENANTS ONBOARDING MANAGER */}
      {isSuperAdmin && activeTab === 'tenants' && (
        <div className="saas-tenants-manager">
          <div className="tenants-header-panel">
            <div className="th-info">
              <h2>SaaS Business Accounts & Provisioning Hub</h2>
              <p>
                Onboard new business clients, generate admin login credentials, and manage active
                client subscriptions.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary onboard-btn"
              onClick={() => {
                setNewTenantCreds(null);
                setShowOnboardModal(true);
              }}
            >
              <FiPlus /> Onboard New Business
            </button>
          </div>

          {/* Tenants Metric Pulse */}
          <div className="tenants-metrics-grid">
            <div className="tm-card">
              <span className="tm-label">Total Onboarded Clients</span>
              <div className="tm-value">{tenants.length}</div>
              <span className="tm-subtitle">Multi-tenant organizations</span>
            </div>
            <div className="tm-card">
              <span className="tm-label">Active Subscriptions</span>
              <div className="tm-value active-count">
                {tenants.filter((t) => t.subscription?.status === 'active').length}
              </div>
              <span className="tm-subtitle">Paying SaaS accounts</span>
            </div>
            <div className="tm-card">
              <span className="tm-label">Free Trials Running</span>
              <div className="tm-value trial-count">
                {tenants.filter((t) => t.subscription?.status === 'trial').length}
              </div>
              <span className="tm-subtitle">14-day evaluation accounts</span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="tenants-filter-bar">
            <div className="filter-search-box">
              <FiSearch />
              <input
                type="text"
                placeholder="Search by company name, owner name, or email..."
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value)}
              />
            </div>
            <div className="industry-dropdown-wrapper">
              <FiFilter className="filter-icon" />
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
              >
                <option value="all">All Industry Suites</option>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="tenants-table-wrapper">
            <table className="ep-table tenants-table">
              <thead>
                <tr>
                  <th>Business / Company</th>
                  <th>Owner &amp; Login</th>
                  <th>Industry Suite</th>
                  <th>Subscription Tier</th>
                  <th>Validity / Renews</th>
                  <th>Status</th>
                  <th>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No business accounts found matching your filters. Click &quot;Onboard New Business&quot; to create one!
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((t) => {
                    const sub = t.subscription || {};
                    const end = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'N/A';
                    return (
                      <tr key={t._id} className="tenant-table-row">
                        <td
                          className="clickable-cell"
                          onClick={() => handleOpenTenantDetails(t._id, 'overview')}
                          title="Click to view 360° Business Profile & Usage"
                        >
                          <div className="tenant-name-badge">
                            <span className="tenant-logo-mini">
                              {t.branding?.logo ? (
                                <img src={t.branding.logo} alt={t.name} />
                              ) : (
                                t.name.slice(0, 2).toUpperCase()
                              )}
                            </span>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</div>
                              <div style={{ fontSize: '11.5px', color: '#64748b' }}>Phone: {t.phone || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td
                          className="clickable-cell"
                          onClick={() => handleOpenTenantDetails(t._id, 'overview')}
                          title="Click to view 360° Business Profile & Usage"
                        >
                          <div style={{ fontWeight: 600 }}>{t.owner?.name || 'Owner'}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>{t.owner?.email || t.email}</div>
                        </td>
                        <td>
                          <span className="industry-chip">
                            {t.industry?.replace(/-/g, ' ').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={`plan-chip ${sub.planSlug || 'starter'}`}>
                            {sub.planSlug?.toUpperCase() || 'STARTER'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '12.5px', fontWeight: 500 }}>{end}</div>
                          <div style={{ fontSize: '10.5px', color: '#64748b' }}>{sub.billingCycle || 'monthly'}</div>
                        </td>
                        <td>
                          <span className={`ep-status-badge status-${sub.status === 'active' ? 'active' : 'pending'}`}>
                            {sub.status || 'Active'}
                          </span>
                        </td>
                        <td>
                          <div className="tenant-actions-cell">
                            <button
                              type="button"
                              className="btn-action-view"
                              title="View full 360° Business Profile, Usage & Analytics"
                              onClick={() => handleOpenTenantDetails(t._id, 'overview')}
                            >
                              <FiEye /> View 360°
                            </button>
                            <button
                              type="button"
                              className="btn-action-impersonate"
                              title="Login as this tenant to verify & manage their account"
                              onClick={() => handleImpersonate(t._id)}
                            >
                              <FiLogIn /> Login As
                            </button>
                            <button
                              type="button"
                              className="btn-action-manage"
                              title="Manage subscription, change plan or validity"
                              onClick={() => handleOpenTenantDetails(t._id, 'subscription')}
                            >
                              <FiSettings />
                            </button>
                            <button
                              type="button"
                              className="btn-action-key"
                              title="Reset admin login password"
                              onClick={() => {
                                setResetPwdTenant(t);
                                setNewPasswordVal('Welcome@2026');
                                setResetSuccessCreds(null);
                              }}
                            >
                              <FiKey />
                            </button>
                            <button
                              type="button"
                              className="btn-extend"
                              title="Extend subscription by 30 days"
                              onClick={() => handleExtendDays(t._id, 30)}
                            >
                              +30d
                            </button>
                            <button
                              type="button"
                              className="btn-extend-year"
                              title="Extend subscription by 1 Year (365 days)"
                              onClick={() => handleExtendDays(t._id, 365)}
                            >
                              +1yr
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PLANS & RESOURCE USAGE (Original / Customer View) */}
      {(!isSuperAdmin || activeTab === 'plans') && (
        <>
          {/* TOP SUMMARY BANNER */}
          <div className="sub-header-banner">
            <div className="banner-left">
              <div className="badge-row">
                <span className={`status-pill ${status}`}>
                  <span className="dot" />
                  {status === 'trial' ? `Free Trial (${usage.daysRemaining} days left)` : status.toUpperCase()}
                </span>
                <span className="current-plan-badge">
                  Active: {subData?.plan?.name || 'Professional'}
                </span>
              </div>
              <h1>SaaS Subscription & Resource Quotas</h1>
              <p>
                Scale team members, active leads, and unlock industry suites for{' '}
                <strong>{subData?.company?.name || 'Your Company'}</strong>.
              </p>
            </div>

            <div className="billing-cycle-toggle">
              <span className={billingCycle === 'monthly' ? 'active' : ''}>Monthly</span>
              <button
                type="button"
                className={`toggle-switch ${billingCycle === 'yearly' ? 'on' : ''}`}
                onClick={() => setBillingCycle((prev) => (prev === 'monthly' ? 'yearly' : 'monthly'))}
                title="Toggle Monthly or Annual Billing"
              >
                <span className="switch-handle" />
              </button>
              <span className={billingCycle === 'yearly' ? 'active' : ''}>
                Yearly <span className="discount-tag">Save ~20%</span>
              </span>
            </div>
          </div>

          {/* RESOURCE USAGE METERS */}
          <div className="usage-grid">
            <div className="usage-card">
              <div className="usage-header">
                <div className="usage-icon-box users">
                  <FiUsers />
                </div>
                <div>
                  <span className="usage-title">Team Members</span>
                  <h3>
                    {usage.employees?.current || 0} / {usage.employees?.limit || 25}
                  </h3>
                </div>
              </div>
              <div className="progress-bar-bg">
                <div
                  className={`progress-fill ${usage.employees?.percentage > 85 ? 'danger' : ''}`}
                  style={{ width: `${usage.employees?.percentage || 0}%` }}
                />
              </div>
              <div className="usage-footer">
                <span>{usage.employees?.percentage || 0}% of quota utilized</span>
                <span>{Math.max(0, (usage.employees?.limit || 25) - (usage.employees?.current || 0))} seats left</span>
              </div>
            </div>

            <div className="usage-card">
              <div className="usage-header">
                <div className="usage-icon-box leads">
                  <FiTrendingUp />
                </div>
                <div>
                  <span className="usage-title">Active Leads & Contacts</span>
                  <h3>
                    {usage.leads?.current || 0} / {usage.leads?.limit || 10000}
                  </h3>
                </div>
              </div>
              <div className="progress-bar-bg">
                <div
                  className={`progress-fill ${usage.leads?.percentage > 85 ? 'danger' : ''}`}
                  style={{ width: `${usage.leads?.percentage || 0}%` }}
                />
              </div>
              <div className="usage-footer">
                <span>{usage.leads?.percentage || 0}% of quota utilized</span>
                <span>Capacity for growth</span>
              </div>
            </div>

            <div className="usage-card">
              <div className="usage-header">
                <div className="usage-icon-box clock">
                  <FiClock />
                </div>
                <div>
                  <span className="usage-title">Billing Renewal</span>
                  <h3>{usage.daysRemaining || 0} Days</h3>
                </div>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-fill clock"
                  style={{ width: `${Math.min(100, ((usage.daysRemaining || 0) / 30) * 100)}%` }}
                />
              </div>
              <div className="usage-footer">
                <span>Renews: {new Date(subData?.subscription?.currentPeriodEnd || Date.now()).toLocaleDateString()}</span>
                <span>Auto-renew active</span>
              </div>
            </div>

            <div className="usage-card">
              <div className="usage-header">
                <div className="usage-icon-box" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                  <FiMapPin />
                </div>
                <div>
                  <span className="usage-title">Branch Hubs</span>
                  <h3>
                    {currentPlanSlug === 'enterprise' ? 'Unlimited' : `${usage.branches?.current || 1} / ${usage.branches?.limit || 1}`}
                  </h3>
                </div>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-fill"
                  style={{
                    width: `${currentPlanSlug === 'enterprise' ? 100 : Math.min(100, usage.branches?.percentage || 33)}%`,
                    background: '#4f46e5',
                  }}
                />
              </div>
              <div className="usage-footer">
                <span>{currentPlanSlug === 'enterprise' ? 'All hubs unlocked' : `${usage.branches?.percentage || 0}% quota used`}</span>
                <span>
                  <a href="/branches" style={{ color: '#4f46e5', fontWeight: 700, textDecoration: 'none' }}>
                    Open Hub →
                  </a>
                </span>
              </div>
            </div>
          </div>

          {/* VIP ACCOUNT MANAGER & 99.9% SLA BANNER */}
          {currentPlanSlug === 'enterprise' ? (
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
              borderRadius: '16px',
              padding: '24px 28px',
              color: '#ffffff',
              marginBottom: '32px',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
              border: '1px solid #312e81',
            }}>
              <div style={{ maxWidth: '620px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    letterSpacing: '0.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}>
                    <FiAward /> DEDICATED ACCOUNT MANAGER &amp; 99.9% SLA ACTIVE
                  </span>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#a5b4fc',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '12px',
                  }}>
                    Priority VIP Queue
                  </span>
                </div>
                <h2 style={{ fontSize: '19px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                  Your Enterprise VIP Concierge
                </h2>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#c7d2fe', lineHeight: 1.5 }}>
                  Your Enterprise scale account has direct access to a designated Customer Success Director with emergency phone/WhatsApp support and guaranteed 99.9% uptime SLA.
                </p>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '16px 22px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #4338ca)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 700,
                }}>
                  RS
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>Rohan Sharma</div>
                  <div style={{ fontSize: '12px', color: '#a5b4fc' }}>Enterprise Account Lead</div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                    <a
                      href="https://wa.me/919876543210?text=Hello%20Rohan,%20I%20am%20contacting%20you%20from%20my%20Radhix%20Enterprise%20CRM%20account"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#4ade80', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}
                    >
                      💬 WhatsApp
                    </a>
                    <a
                      href="tel:+919876543210"
                      style={{ color: '#93c5fd', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
                    >
                      <FiPhone /> Call Direct
                    </a>
                    <a
                      href="mailto:vip-desk@radhix.com"
                      style={{ color: '#fbcfe8', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
                    >
                      <FiMail /> vip-desk@radhix.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '18px 24px',
              marginBottom: '32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <FiAward />
                </div>
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                    {currentPlanSlug === 'pro' ? '⚡ 2-Hour Priority SLA Active' : 'Standard Community Support'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Switch to Enterprise Scale to receive a Dedicated Account Manager, 99.9% uptime SLA, and custom domain whitelabeling.
                  </div>
                </div>
              </div>
              {currentPlanSlug !== 'enterprise' && (
                <button
                  type="button"
                  onClick={() => handleUpgrade('enterprise')}
                  disabled={saving}
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Unlock Enterprise Benefits →
                </button>
              )}
            </div>
          )}

          {/* PLANS SELECTION SECTION */}
          <div className="plans-section-title">
            <FiZap />
            <h2>Select or Upgrade Your Business Tier</h2>
            <p>Instant activation. Switch plans anytime without data loss.</p>
          </div>

          <div className="pricing-cards-grid">
            {plans.map((p) => {
              const isCurrent = currentPlanSlug === p.slug;
              const price = billingCycle === 'yearly' ? p.priceYearly : p.priceMonthly;
              const billingSuffix = billingCycle === 'yearly' ? '/year' : '/month';

              return (
                <div
                  key={p.slug}
                  className={`plan-card ${p.isPopular ? 'popular' : ''} ${isCurrent ? 'current' : ''}`}
                >
                  {p.isPopular && <div className="popular-badge">RECOMMENDED FOR SAAS</div>}
                  {isCurrent && <div className="current-ribbon"><FiCheck /> CURRENT PLAN</div>}

                  <div className="plan-header">
                    <h3>{p.name}</h3>
                    <p className="plan-tagline">{p.tagline}</p>
                    <div className="plan-price-row">
                      <span className="currency">₹</span>
                      <span className="amount">{price.toLocaleString()}</span>
                      <span className="period">{billingSuffix}</span>
                    </div>
                  </div>

                  <div className="plan-features">
                    <div className="features-kicker">INCLUDED CAPABILITIES:</div>
                    {p.features?.map((f, idx) => (
                      <div key={idx} className="feature-row">
                        <FiCheck className="feat-check" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className={`plan-action-btn ${isCurrent ? 'is-current' : 'can-upgrade'}`}
                    disabled={isCurrent || saving}
                    onClick={() => handleUpgrade(p.slug)}
                  >
                    {isCurrent ? 'Current Plan' : saving ? 'Updating...' : `Switch to ${p.name}`}
                  </button>
                </div>
              );
            })}
          </div>

          {/* COMPANY INVOICE & UPI SETTINGS */}
          <div className="company-billing-settings">
            <div className="settings-header">
              <FiCreditCard className="settings-icon" />
              <div>
                <h3>Invoice Branding & UPI Payment QR Configuration</h3>
                <p>
                  Configure your business UPI ID to display live QR codes on invoices, fee receipts,
                  and booking vouchers for instant payment collection.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveCompany} className="billing-form">
              <div className="form-row two-col">
                <div className="form-group">
                  <label>Organization / Trading Name</label>
                  <input
                    type="text"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Billing Email</label>
                  <input
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row three-col">
                <div className="form-group highlight-upi">
                  <label>Merchant UPI ID (For Scan & Pay QR Code)</label>
                  <input
                    type="text"
                    placeholder="e.g. radhixtechnologies@okaxis or 9876543210@paytm"
                    value={companyForm.upiId}
                    onChange={(e) => setCompanyForm({ ...companyForm, upiId: e.target.value })}
                  />
                  <small>Invoices will automatically generate dynamic UPI QR codes with bill amount.</small>
                </div>
                <div className="form-group">
                  <label>UPI Payee Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Radhix Technologies"
                    value={companyForm.upiName}
                    onChange={(e) => setCompanyForm({ ...companyForm, upiName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>GSTIN / Tax Registration Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    value={companyForm.gstin}
                    onChange={(e) => setCompanyForm({ ...companyForm, gstin: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save-settings" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Invoice & UPI Settings'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* MODAL: ONBOARD NEW BUSINESS CLIENT */}
      {showOnboardModal && (
        <div className="onboard-modal-overlay" onClick={() => setShowOnboardModal(false)}>
          <div className="onboard-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="onboard-modal-header">
              <div>
                <h3>➕ Onboard New Business Client</h3>
                <p>Create dedicated company database, Admin login, and assign subscription plan.</p>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowOnboardModal(false)}
              >
                ✕
              </button>
            </div>

            {newTenantCreds ? (
              <div className="onboard-success-view">
                <div className="success-icon-badge">🎉</div>
                <h4>Business Successfully Onboarded!</h4>
                <p>Login credentials have been generated. You can now send them to the client:</p>

                <div className="credentials-box">
                  <div className="cred-row">
                    <span className="c-label">🏢 Company:</span>
                    <span className="c-value">{newTenantCreds.companyName}</span>
                  </div>
                  <div className="cred-row">
                    <span className="c-label">🌐 Login URL:</span>
                    <span className="c-value highlight">{window.location.origin}/login</span>
                  </div>
                  <div className="cred-row">
                    <span className="c-label">📧 Admin Email:</span>
                    <span className="c-value">{newTenantCreds.email}</span>
                  </div>
                  <div className="cred-row">
                    <span className="c-label">🔑 Initial Password:</span>
                    <span className="c-value password">{newTenantCreds.password}</span>
                  </div>
                </div>

                <div className="cred-actions">
                  <button type="button" className="btn btn-secondary" onClick={copyCredentialsText}>
                    <FiCopy /> {copied ? 'Copied to Clipboard!' : 'Copy Login Details'}
                  </button>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Hello! Your ${newTenantCreds.companyName} CRM portal is ready.\n\n🌐 Login URL: ${window.location.origin}/login\n📧 Email: ${newTenantCreds.email}\n🔑 Password: ${newTenantCreds.password}\n\nPlease login and start managing your leads and team.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-success"
                  >
                    <FiSend /> Send on WhatsApp
                  </a>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setShowOnboardModal(false);
                      setNewTenantCreds(null);
                    }}
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOnboardSubmit} className="onboard-form">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Company / Organization Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Realty Developers"
                      value={onboardForm.companyName}
                      onChange={(e) => setOnboardForm({ ...onboardForm, companyName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Industry Suite *</label>
                    <select
                      value={onboardForm.industry}
                      onChange={(e) => setOnboardForm({ ...onboardForm, industry: e.target.value })}
                      required
                    >
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Business Owner Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={onboardForm.ownerName}
                      onChange={(e) => setOnboardForm({ ...onboardForm, ownerName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Business Owner Email (Login ID) *</label>
                    <input
                      type="email"
                      placeholder="e.g. rajesh@apexrealty.com"
                      value={onboardForm.ownerEmail}
                      onChange={(e) => setOnboardForm({ ...onboardForm, ownerEmail: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Phone / WhatsApp Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={onboardForm.ownerPhone}
                      onChange={(e) => setOnboardForm({ ...onboardForm, ownerPhone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Initial Password</label>
                    <input
                      type="text"
                      value={onboardForm.password}
                      onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })}
                      required
                    />
                    <small>Client can change this password after their first login.</small>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Subscription Plan Tier</label>
                    <select
                      value={onboardForm.planSlug}
                      onChange={(e) => setOnboardForm({ ...onboardForm, planSlug: e.target.value })}
                    >
                      <option value="starter">Starter Plan (Up to 5 Users)</option>
                      <option value="pro">Professional Suite (Up to 25 Users)</option>
                      <option value="enterprise">Enterprise Tier (Unlimited)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Subscription Validity</label>
                    <select
                      value={onboardForm.durationMonths}
                      onChange={(e) => setOnboardForm({ ...onboardForm, durationMonths: e.target.value })}
                    >
                      <option value="1">1 Month</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">1 Year (12 Months)</option>
                      <option value="24">2 Years (24 Months)</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions-bar">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowOnboardModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Creating Account...' : 'Create Account & Generate Login'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* 360° BUSINESS PROFILE & OVERVIEW DRAWER */}
      {selectedTenantId && (
        <div className="drawer-backdrop" onClick={() => setSelectedTenantId(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="drawer-header">
              <div className="drawer-title-area">
                <div className="drawer-logo-box">
                  {tenantDetails?.company?.branding?.logo ? (
                    <img src={tenantDetails.company.branding.logo} alt={tenantDetails.company.name} />
                  ) : (
                    tenantDetails?.company?.name?.slice(0, 2).toUpperCase() || 'CO'
                  )}
                </div>
                <div className="drawer-company-info">
                  <h2>{tenantDetails?.company?.name || 'Loading Business...'}</h2>
                  <div className="drawer-badges">
                    <span className="badge-ind">
                      {tenantDetails?.company?.industry?.replace(/-/g, ' ').toUpperCase() || 'GENERAL'}
                    </span>
                    <span className="badge-plan">
                      {tenantDetails?.company?.subscription?.planSlug?.toUpperCase() || 'PRO'}
                    </span>
                    <span className="badge-status-active">
                      {tenantDetails?.company?.subscription?.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="drawer-actions-right">
                <button
                  type="button"
                  className="btn-drawer-impersonate"
                  title="Switch session and login as this business owner"
                  onClick={() => handleImpersonate(selectedTenantId)}
                >
                  <FiLogIn /> Login As Tenant
                </button>
                <button
                  type="button"
                  className="btn-drawer-close"
                  onClick={() => setSelectedTenantId(null)}
                  title="Close Drawer"
                >
                  <FiX />
                </button>
              </div>
            </div>

            {/* Drawer Tabs Nav */}
            <div className="drawer-tabs-nav">
              <button
                type="button"
                className={`drawer-tab-btn ${detailsTab === 'overview' ? 'active' : ''}`}
                onClick={() => setDetailsTab('overview')}
              >
                <FiActivity /> 360° Live Metrics
              </button>
              <button
                type="button"
                className={`drawer-tab-btn ${detailsTab === 'subscription' ? 'active' : ''}`}
                onClick={() => setDetailsTab('subscription')}
              >
                <FiCreditCard /> Subscription &amp; Quotas
              </button>
              <button
                type="button"
                className={`drawer-tab-btn ${detailsTab === 'profile' ? 'active' : ''}`}
                onClick={() => setDetailsTab('profile')}
              >
                <FiBriefcase /> Company &amp; UPI Info
              </button>
              <button
                type="button"
                className={`drawer-tab-btn ${detailsTab === 'team' ? 'active' : ''}`}
                onClick={() => setDetailsTab('team')}
              >
                <FiUsers /> Team &amp; Accounts ({tenantDetails?.users?.length || 0})
              </button>
            </div>

            {/* Drawer Body */}
            <div className="drawer-body">
              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                  <Loader />
                  <p style={{ marginTop: 12 }}>Fetching live 360° business analytics &amp; usage...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW & LIVE METRICS */}
                  {detailsTab === 'overview' && (
                    <div>
                      {/* Subscription Health Banner */}
                      <div className="health-countdown-box">
                        <div className="health-left">
                          <h4>Subscription Validity Status</h4>
                          <div className="health-days">
                            {tenantDetails?.daysRemaining || 0} Days Remaining
                          </div>
                          <p>
                            Renews / Expires on:{' '}
                            <strong>
                              {tenantDetails?.company?.subscription?.currentPeriodEnd
                                ? new Date(tenantDetails.company.subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'Active'}
                            </strong>{' '}
                            ({tenantDetails?.company?.subscription?.billingCycle || 'yearly'} cycle)
                          </p>
                        </div>
                        <div className="health-actions">
                          <button
                            type="button"
                            className="btn-quick-ext"
                            onClick={() => handleExtendDays(selectedTenantId, 30)}
                          >
                            +30 Days
                          </button>
                          <button
                            type="button"
                            className="btn-quick-ext"
                            onClick={() => handleExtendDays(selectedTenantId, 90)}
                          >
                            +90 Days
                          </button>
                          <button
                            type="button"
                            className="btn-quick-ext"
                            onClick={() => handleExtendDays(selectedTenantId, 365)}
                          >
                            +1 Year
                          </button>
                        </div>
                      </div>

                      {/* 4 Core Metrics Cards */}
                      <div className="metrics-360-grid">
                        <div className="metric-card-360">
                          <div className="metric-icon-wrap staff">
                            <FiUsers />
                          </div>
                          <div className="metric-info">
                            <div className="m-title">Team Members</div>
                            <h3>{tenantDetails?.metrics?.employeesCount || 0}</h3>
                            <div className="m-sub">Active registered staff</div>
                          </div>
                        </div>

                        <div className="metric-card-360">
                          <div className="metric-icon-wrap leads">
                            <FiTrendingUp />
                          </div>
                          <div className="metric-info">
                            <div className="m-title">Active Leads</div>
                            <h3>{tenantDetails?.metrics?.leadsCount || 0}</h3>
                            <div className="m-sub">In sales funnel</div>
                          </div>
                        </div>

                        <div className="metric-card-360">
                          <div className="metric-icon-wrap deals">
                            <FiDollarSign />
                          </div>
                          <div className="metric-info">
                            <div className="m-title">Deals &amp; Pipeline</div>
                            <h3>
                              ₹{(tenantDetails?.metrics?.totalDealValue || 0).toLocaleString()}
                            </h3>
                            <div className="m-sub">
                              {tenantDetails?.metrics?.dealsCount || 0} Deals ({tenantDetails?.metrics?.wonDealsCount || 0} Won)
                            </div>
                          </div>
                        </div>

                        <div className="metric-card-360">
                          <div className="metric-icon-wrap revenue">
                            <FiCreditCard />
                          </div>
                          <div className="metric-info">
                            <div className="m-title">Paid Revenue</div>
                            <h3>
                              ₹{(tenantDetails?.metrics?.totalRevenue || 0).toLocaleString()}
                            </h3>
                            <div className="m-sub">
                              {tenantDetails?.metrics?.invoicesCount || 0} Invoices ({tenantDetails?.metrics?.pendingInvoicesCount || 0} Pending)
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Industry Specific Spotlight Card */}
                      {tenantDetails?.company?.industry === 'real-estate' && (
                        <div className="spotlight-card">
                          <div className="spotlight-header">
                            <h4>🏢 Real Estate Portfolio Overview</h4>
                            <span className="badge-ind">Industry Highlights</span>
                          </div>
                          <div className="spotlight-chips-grid">
                            <div className="spotlight-item">
                              <div className="s-label">Properties Listed</div>
                              <div className="s-value">
                                {tenantDetails?.metrics?.propertiesCount || 0}
                              </div>
                            </div>
                            <div className="spotlight-item">
                              <div className="s-label">Site Visits Scheduled</div>
                              <div className="s-value">
                                {tenantDetails?.metrics?.siteVisitsCount || 0}
                              </div>
                            </div>
                            <div className="spotlight-item">
                              <div className="s-label">Bookings Confirmed</div>
                              <div className="s-value">
                                {tenantDetails?.metrics?.bookingsCount || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {tenantDetails?.company?.industry === 'institute' && (
                        <div className="spotlight-card">
                          <div className="spotlight-header">
                            <h4>🎓 Education &amp; Admissions Overview</h4>
                            <span className="badge-ind">Industry Highlights</span>
                          </div>
                          <div className="spotlight-chips-grid">
                            <div className="spotlight-item">
                              <div className="s-label">Students Enrolled</div>
                              <div className="s-value">
                                {tenantDetails?.metrics?.studentsCount || 0}
                              </div>
                            </div>
                            <div className="spotlight-item">
                              <div className="s-label">Courses Offered</div>
                              <div className="s-value">
                                {tenantDetails?.metrics?.coursesCount || 0}
                              </div>
                            </div>
                            <div className="spotlight-item">
                              <div className="s-label">Active Batches</div>
                              <div className="s-value">
                                {tenantDetails?.metrics?.batchesCount || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {tenantDetails?.company?.industry === 'healthcare' && (
                        <div className="spotlight-card">
                          <div className="spotlight-header">
                            <h4>🏥 Clinic &amp; Patients Overview</h4>
                            <span className="badge-ind">Industry Highlights</span>
                          </div>
                          <div className="spotlight-chips-grid">
                            <div className="spotlight-item">
                              <div className="s-label">Registered Patients</div>
                              <div className="s-value">
                                {tenantDetails?.metrics?.patientsCount || 0}
                              </div>
                            </div>
                            <div className="spotlight-item">
                              <div className="s-label">Appointments</div>
                              <div className="s-value">
                                {tenantDetails?.metrics?.appointmentsCount || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Owner Details Box */}
                      <div className="owner-card-box">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                          <h4 style={{ margin: 0 }}>Business Owner &amp; Key Contact</h4>
                          <button
                            type="button"
                            className="btn-action-key"
                            style={{ width: 'auto', padding: '4px 10px', fontSize: 11.5 }}
                            onClick={() => {
                              setResetPwdTenant(tenantDetails.company);
                              setNewPasswordVal('Welcome@2026');
                              setResetSuccessCreds(null);
                            }}
                          >
                            <FiKey /> Reset Password
                          </button>
                        </div>
                        <div className="owner-details-grid">
                          <div className="owner-detail-item">
                            <div className="o-label">Owner Name</div>
                            <div className="o-val">{tenantDetails?.owner?.name || 'N/A'}</div>
                          </div>
                          <div className="owner-detail-item">
                            <div className="o-label">Primary Login Email</div>
                            <div className="o-val">{tenantDetails?.owner?.email || 'N/A'}</div>
                          </div>
                          <div className="owner-detail-item">
                            <div className="o-label">Phone / WhatsApp</div>
                            <div className="o-val">{tenantDetails?.company?.phone || 'N/A'}</div>
                          </div>
                          <div className="owner-detail-item">
                            <div className="o-label">Onboarding Date</div>
                            <div className="o-val">
                              {tenantDetails?.company?.createdAt
                                ? new Date(tenantDetails.company.createdAt).toLocaleDateString()
                                : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SUBSCRIPTION & QUOTAS MANAGEMENT */}
                  {detailsTab === 'subscription' && (
                    <form onSubmit={handleSaveSubscriptionChanges} className="ep-form">
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>Subscription Tier / Plan</label>
                          <select
                            value={editSubForm.planSlug}
                            onChange={(e) => setEditSubForm({ ...editSubForm, planSlug: e.target.value })}
                          >
                            <option value="starter">Starter Plan (₹999/mo)</option>
                            <option value="pro">Professional Suite (₹2,999/mo)</option>
                            <option value="enterprise">Enterprise Cloud (₹7,999/mo)</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Account Status</label>
                          <select
                            value={editSubForm.status}
                            onChange={(e) => setEditSubForm({ ...editSubForm, status: e.target.value })}
                          >
                            <option value="active">Active (Full Access)</option>
                            <option value="trial">Free Trial (14 Days)</option>
                            <option value="suspended">Suspended (Access Paused)</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>Extend Subscription Validity</label>
                          <select
                            value={editSubForm.extendDays}
                            onChange={(e) => setEditSubForm({ ...editSubForm, extendDays: e.target.value })}
                          >
                            <option value="">-- Quick Extend Days --</option>
                            <option value="30">+30 Days (1 Month)</option>
                            <option value="90">+90 Days (1 Quarter)</option>
                            <option value="180">+180 Days (Half Year)</option>
                            <option value="365">+365 Days (1 Full Year)</option>
                            <option value="730">+730 Days (2 Years)</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Or Set Specific Expiry Date</label>
                          <input
                            type="date"
                            value={editSubForm.expiryDate}
                            onChange={(e) => setEditSubForm({ ...editSubForm, expiryDate: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="modal-actions-bar">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setSelectedTenantId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={saving}
                        >
                          <FiCheck /> {saving ? 'Saving Changes...' : 'Save Subscription Changes'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* TAB 3: BUSINESS PROFILE & UPI INFO */}
                  {detailsTab === 'profile' && (
                    <form onSubmit={handleSaveProfileChanges} className="ep-form">
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>Company Legal / Trade Name</label>
                          <input
                            type="text"
                            value={editProfileForm.name}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Industry Vertical Suite</label>
                          <select
                            value={editProfileForm.industry}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, industry: e.target.value })}
                          >
                            {INDUSTRY_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>Company Contact Email</label>
                          <input
                            type="email"
                            value={editProfileForm.email}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Contact Phone / WhatsApp</label>
                          <input
                            type="tel"
                            value={editProfileForm.phone}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>Merchant UPI ID (For Auto QR Invoices)</label>
                          <input
                            type="text"
                            placeholder="e.g. merchant@upi or yourname@okhdfcbank"
                            value={editProfileForm.upiId}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, upiId: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label>UPI Beneficiary Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Apex Real Estate Pvt Ltd"
                            value={editProfileForm.upiName}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, upiName: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>GSTIN Tax Number (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 07AAAAA0000A1Z5"
                          value={editProfileForm.gstin}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, gstin: e.target.value })}
                        />
                      </div>

                      <div className="modal-actions-bar">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setSelectedTenantId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={saving}
                        >
                          <FiCheck /> {saving ? 'Saving Profile...' : 'Save Business Profile'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* TAB 4: TEAM & USER ACCOUNTS */}
                  {detailsTab === 'team' && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h4 style={{ margin: 0 }}>Registered User Logins for {tenantDetails?.company?.name}</h4>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          Total: {tenantDetails?.users?.length || 0} users
                        </span>
                      </div>
                      <table className="users-subtable">
                        <thead>
                          <tr>
                            <th>User Name</th>
                            <th>Email Address</th>
                            <th>System Role</th>
                            <th>Account Status</th>
                            <th>Created Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tenantDetails?.users?.map((u) => (
                            <tr key={u._id}>
                              <td style={{ fontWeight: 600 }}>{u.name}</td>
                              <td>{u.email}</td>
                              <td>
                                <span className="badge-ind">
                                  {typeof u.role === 'object' ? u.role?.name || u.role?.slug : u.role}
                                </span>
                              </td>
                              <td>
                                <span className={`ep-status-badge status-${u.isActive ? 'active' : 'pending'}`}>
                                  {u.isActive ? 'Active' : 'Deactivated'}
                                </span>
                              </td>
                              <td style={{ fontSize: 11.5, color: '#64748b' }}>
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPwdTenant && (
        <div className="onboard-modal-overlay" onClick={() => setResetPwdTenant(null)}>
          <div className="onboard-modal-box" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="onboard-modal-header">
              <div>
                <h3>🔑 Reset Admin Password</h3>
                <p>Company: <strong>{resetPwdTenant.name}</strong> ({resetPwdTenant.owner?.email || resetPwdTenant.email})</p>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setResetPwdTenant(null)}
              >
                <FiX />
              </button>
            </div>

            {resetSuccessCreds ? (
              <div className="onboard-success-view">
                <div className="success-icon-badge">✅</div>
                <h4>Password Reset Successfully!</h4>
                <p>New credentials are now active. Share them with the business owner:</p>

                <div className="credentials-box">
                  <div className="cred-row">
                    <span className="c-label">Login Email:</span>
                    <span className="c-value highlight">{resetSuccessCreds.email}</span>
                  </div>
                  <div className="cred-row">
                    <span className="c-label">New Password:</span>
                    <span className="c-value password">{resetSuccessCreds.password}</span>
                  </div>
                </div>

                <div className="cred-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      navigator.clipboard.writeText(`Login Email: ${resetSuccessCreds.email}\nPassword: ${resetSuccessCreds.password}`);
                      setNotice('Credentials copied to clipboard!');
                      setTimeout(() => setNotice(''), 3000);
                    }}
                  >
                    <FiCopy /> Copy Credentials
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setResetPwdTenant(null)}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="ep-form">
                <div className="form-group">
                  <label>Enter New Password for Admin</label>
                  <input
                    type="text"
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    required
                    minLength={6}
                  />
                  <small style={{ color: '#64748b', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                    Tip: Use at least 8 characters. Business owner will be able to login immediately with this.
                  </small>
                </div>

                <div className="modal-actions-bar">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setResetPwdTenant(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    <FiKey /> {saving ? 'Resetting...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MySubscription;
