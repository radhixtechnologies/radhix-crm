import { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { useIndustrySuite } from '../../context/IndustrySuiteContext';
import { useBranding } from '../../context/BrandingContext';
import { INDUSTRY_SUITES, getIndustrySuiteById } from '../../constants/industrySuites';
import {
  FiLayout,
  FiUsers,
  FiUser,
  FiDollarSign,
  FiTrendingUp,
  FiBriefcase,
  FiSettings,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiFileText,
  FiChevronRight,
  FiChevronLeft,
  FiBarChart2,
  FiTarget,
  FiShoppingBag,
  FiCreditCard,
  FiPackage,
  FiMail,
  FiSearch,
  FiPercent,
  FiPieChart,
  FiX,
  FiGrid,
  FiActivity,
  FiBell,
  FiLayers,
  FiGlobe,
  FiZap,
  FiMapPin,
  FiCpu,
  FiRepeat,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
  const { user, hasModuleAccess, isAdmin, isSuperAdmin } = useAuth();
  const { activeSuiteId, currentSuite, isAllSuites, availableSuites } = useIndustrySuite();
  const { branding } = useBranding();
  const { isOpen, toggleSidebar, activeModule, setActiveModule, closeSidebar, openSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [expandedMenus, setExpandedMenus] = useState({});

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Disable body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isOpen]);

  // Determine active module based on path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') {
      setActiveModule('dashboard');
      return;
    }
    if (path === '/industry-hub') {
      if (activeModule !== 'industry_hub') setActiveModule('industry_hub');
      return;
    }
    if (path === '/subscription') {
      if (activeModule !== 'subscription') setActiveModule('subscription');
      return;
    }
    if (path === '/branches') {
      if (activeModule !== 'branches') setActiveModule('branches');
      return;
    }
    if (path === '/reports' || path.startsWith('/reports/')) {
      if (activeModule !== 'reports_analytics') setActiveModule('reports_analytics');
      return;
    }
    if (path === '/employees' || path.startsWith('/employees/')) {
      if (activeModule !== 'my-workspace') setActiveModule('my-workspace');
      return;
    }
    if (path.startsWith('/projects') || path.startsWith('/approvals') || path.startsWith('/company')) {
      if (activeModule !== 'my-workspace') setActiveModule('my-workspace');
      return;
    }
    if (path.startsWith('/hrm')) {
      if (activeModule !== 'hrm') setActiveModule('hrm');
    } else if (path.startsWith('/institute')) {
      if (activeModule !== 'institute') setActiveModule('institute');
    } else if (path.startsWith('/real-estate')) {
      if (activeModule !== 'real-estate') setActiveModule('real-estate');
    } else if (path.startsWith('/construction')) {
      if (activeModule !== 'construction') setActiveModule('construction');
    } else if (path.startsWith('/healthcare')) {
      if (activeModule !== 'healthcare') setActiveModule('healthcare');
    } else if (path.startsWith('/automotive')) {
      if (activeModule !== 'automotive') setActiveModule('automotive');
    } else if (path.startsWith('/travel')) {
      if (activeModule !== 'travel') setActiveModule('travel');
    } else if (path.startsWith('/manufacturing')) {
      if (activeModule !== 'manufacturing') setActiveModule('manufacturing');
    } else if (path.startsWith('/restaurant')) {
      if (activeModule !== 'restaurant') setActiveModule('restaurant');
    } else if (path.startsWith('/salon')) {
      if (activeModule !== 'salon') setActiveModule('salon');
    } else if (path.startsWith('/retail')) {
      if (activeModule !== 'retail') setActiveModule('retail');
    } else if (path.startsWith('/gym')) {
      if (activeModule !== 'gym') setActiveModule('gym');
    } else if (path.startsWith('/finance')) {
      if (activeModule !== 'finance') setActiveModule('finance');
    } else if (path.startsWith('/sales') || path.startsWith('/leads') || path.startsWith('/contacts')) {
      if (activeModule !== 'sales') setActiveModule('sales');
    } else if (path.startsWith('/marketing')) {
      if (activeModule !== 'marketing') setActiveModule('marketing');
    } else if (path.startsWith('/inventory') || path.startsWith('/support')) {
      if (activeModule !== 'operations') setActiveModule('operations');
    } else if (path.startsWith('/settings/branding')) {
      if (activeModule !== 'branding') setActiveModule('branding');
    } else if (path.startsWith('/settings')) {
      if (activeModule !== 'settings') setActiveModule('settings');
    } else if (path.startsWith('/automation')) {
      if (activeModule !== 'automation') setActiveModule('automation');
    }
  }, [location.pathname, activeModule, setActiveModule]);


  const handlePrimaryClick = (moduleKey, hasSubItems, path) => {
    const isSameModule = activeModule === moduleKey;

    if (hasSubItems) {
      if (isSameModule) {
        // Clicking the currently active module toggles the secondary drawer
        toggleSidebar();
      } else {
        // Clicking a different module selects it and opens the drawer
        setActiveModule(moduleKey);
        openSidebar();

        const defaultModulePath = {
          sales: '/sales',
          subscription: '/subscription',
          industry_hub: '/industry-hub',
          institute: '/institute/admissions',
          'real-estate': '/real-estate',
          construction: '/construction',
          healthcare: '/healthcare',
          automotive: '/automotive',
          travel: '/travel',
          manufacturing: '/manufacturing',
          restaurant: '/restaurant',
          salon: '/salon',
          retail: '/retail',
          gym: '/gym',
          hrm: '/hrm',
          finance: '/finance',
          marketing: '/marketing',
          operations: '/support',
          reports_analytics: '/reports',
          'my-workspace': '/employees',
          dashboard: '/dashboard',
          branding: '/settings/branding',
          automation: '/automation/workflows',
          settings: '/settings',
          branches: '/branches',
        }[moduleKey] || path;

        if (defaultModulePath && location.pathname !== defaultModulePath) {
          navigate(defaultModulePath);
        }
      }
      return;
    }

    setActiveModule(moduleKey);
    closeSidebar();
    if (path && location.pathname !== path) {
      navigate(path);
    }
  };

  // Define Groups / Modules for Primary Rail
  // Dynamically configured according to the active SaaS industry suite
  const primaryModules = useMemo(() => {
    // Determine the active industry module(s)
    let industryRailModules = [];

    if (!isAllSuites && currentSuite) {
      // User or tenant selected a specific vertical (e.g. Real Estate, Clinic, Coaching)
      industryRailModules = [
        {
          key: currentSuite.id,
          label: currentSuite.shortName,
          icon: currentSuite.icon,
          access: hasModuleAccess('sales'),
          subItems: currentSuite.subItems,
        },
      ];
    } else if (isAllSuites) {
      // In all-suites mode, check if user is currently browsing an industry
      const browsingSuite = INDUSTRY_SUITES.find((s) => s.id === activeModule);
      if (browsingSuite) {
        industryRailModules = [
          {
            key: browsingSuite.id,
            label: browsingSuite.shortName,
            icon: browsingSuite.icon,
            access: hasModuleAccess('sales'),
            subItems: browsingSuite.subItems,
          },
        ];
      }
    }

    return [
      {
        key: 'dashboard',
        label: 'Home',
        icon: FiLayout,
        path: '/dashboard',
        access: true,
        subItems: [
          { path: '/dashboard', label: 'Overview', icon: FiLayout },
          { path: '/industry-hub', label: 'Suites Hub', icon: FiLayers },
          { path: '/reports', label: 'Reports & Analytics', icon: FiBarChart2 },
          ...(isAdmin || isSuperAdmin ? [
            { path: '/subscription', label: 'Plans & Quotas', icon: FiCreditCard },
            { path: '/branches', label: 'Branch Hub', icon: FiMapPin },
            { path: '/automation/workflows', label: 'Workflow Automations', icon: FiZap },
            { path: '/settings/branding', label: 'Brand & Theme', icon: FiLayers },
          ] : []),
          ...(isSuperAdmin ? [{ path: '/settings', label: 'System Settings', icon: FiSettings }] : []),
        ],
      },
      {
        key: 'my-workspace',
        label: 'My Workspace',
        icon: FiUser,
        access: true,
        subItems: [
          { path: '/employees/me', label: 'My Profile', icon: FiUser },
          { path: '/employees/my-attendance', label: 'My Attendance', icon: FiClock },
          { path: '/employees/my-leaves', label: 'My Leaves', icon: FiCalendar },
          { path: '/employees/tasks', label: 'My Tasks', icon: FiCheckCircle },
          { path: '/projects', label: 'Projects', icon: FiBriefcase },
          { path: '/employees/daily-updates', label: 'Daily Work Update', icon: FiActivity },
          { path: '/approvals', label: 'Approvals Hub', icon: FiCheckCircle },
          { path: '/company/announcements', label: 'Notice Board', icon: FiBell },
          { path: '/employees/timesheets', label: 'My Timesheets', icon: FiFileText },
          { path: '/employees/performance', label: 'My Performance', icon: FiTrendingUp },
          { path: '/employees/salary-slips', label: 'Salary Slips', icon: FiDollarSign },
          { path: '/employees/reimbursements', label: 'Reimbursements', icon: FiCreditCard },
        ],
      },
      ...industryRailModules,
      {
        key: 'sales',
        label: 'Sales CRM',
        icon: FiTrendingUp,
        access: hasModuleAccess('sales'),
        subItems: [
          { path: '/sales', label: 'Dashboard', icon: FiLayout },
          { path: '/sales/leads', label: 'Leads', icon: FiUsers },
          { path: '/sales/leads/tracking', label: 'Tracking', icon: FiTrendingUp },
          { path: '/sales/followups', label: 'Follow-ups', icon: FiClock },
          { path: '/sales/ai-calling', label: 'AI Calling', icon: FiCpu },
          { path: '/sales/routing', label: 'Routing & Portals', icon: FiRepeat },
          { path: '/calendar', label: 'Calendar', icon: FiCalendar },
          { path: '/sales/pipeline', label: 'Pipeline', icon: FiBarChart2 },
          { path: '/sales/deals', label: 'Deals', icon: FiDollarSign },
          { path: '/sales/clients', label: 'Clients', icon: FiBriefcase },
          { path: '/contacts', label: 'Contacts', icon: FiUsers },
          { path: '/sales/form-builder', label: 'Web Forms', icon: FiGlobe },
          { path: '/sales/proposals', label: 'Documents', icon: FiFileText },
        ],
      },
      {
        key: 'hrm',
        label: 'HRM',
        icon: FiBriefcase,
        access: hasModuleAccess('hrm'),
        subItems: [
          { path: '/hrm', label: 'Dashboard', icon: FiLayout },
          { path: '/hrm/attendance', label: 'Attendance', icon: FiClock },
          { path: '/hrm/leaves', label: 'Leaves', icon: FiCalendar },
          { path: '/hrm/directory', label: 'Directory', icon: FiUsers },
          ...(isAdmin || isSuperAdmin ? [{ path: '/hrm/timesheets', label: 'Timesheets', icon: FiFileText }] : []),
          { path: '/hrm/recruitment/jobs', label: 'Recruitment', icon: FiUsers },
          { path: '/hrm/performance', label: 'Performance', icon: FiTrendingUp },
          ...(isAdmin || isSuperAdmin ? [
            { path: '/admin/all-reviews', label: 'All Reviews', icon: FiFileText },
            { path: '/admin/appraisal-cycles', label: 'Appraisal Cycles', icon: FiCalendar },
          ] : []),
          { path: '/hrm/training', label: 'Training', icon: FiFileText },
          { path: '/hrm/skills', label: 'Skills', icon: FiCheckCircle },
          { path: '/hrm/policies', label: 'Policies', icon: FiFileText },
          { path: '/hrm/exit', label: 'Exit Mgmt', icon: FiX },
          { path: '/hrm/analytics', label: 'Analytics', icon: FiBarChart2 },
          { path: '/hrm/reports', label: 'Reports', icon: FiFileText },
        ],
      },
      {
        key: 'finance',
        label: 'Finance',
        icon: FiDollarSign,
        access: hasModuleAccess('finance'),
        subItems: [
          { path: '/finance', label: 'Dashboard', icon: FiLayout },
          { path: '/finance/invoices', label: 'Invoices', icon: FiFileText },
          { path: '/finance/payments', label: 'Payments', icon: FiCreditCard },
          { path: '/finance/expenses', label: 'Expenses', icon: FiShoppingBag },
          { path: '/finance/payroll', label: 'Payroll', icon: FiCreditCard },
          { path: '/finance/salary-structures', label: 'Salary Structures', icon: FiDollarSign },
          ...(isAdmin || isSuperAdmin || user?.role?.slug === 'accountant' ? [{ path: '/finance/taxes', label: 'Tax Settings', icon: FiPercent }] : []),
          { path: '/finance/reports', label: 'Reports', icon: FiBarChart2 },
        ],
      },
      {
        key: 'marketing',
        label: 'Marketing',
        icon: FiTarget,
        access: hasModuleAccess('marketing'),
        subItems: [
          { path: '/marketing', label: 'Dashboard', icon: FiLayout },
          { path: '/marketing/campaigns', label: 'Campaigns', icon: FiTarget },
          { path: '/marketing/whatsapp', label: 'WhatsApp', icon: FaWhatsapp },
          { path: '/marketing/emails', label: 'Emails', icon: FiMail },
          { path: '/marketing/segments', label: 'Segments', icon: FiUsers },
        ],
      },
      {
        key: 'operations',
        label: 'Operations',
        icon: FiGrid,
        access: isSuperAdmin || hasModuleAccess('inventory') || hasModuleAccess('support'),
        subItems: [
          { path: '/inventory/products', label: 'Inventory', icon: FiPackage, access: isSuperAdmin || hasModuleAccess('inventory') },
          { path: '/support', label: 'Support', icon: FiCheckCircle, access: isSuperAdmin || hasModuleAccess('support') },
        ].filter((item) => item.access),
      },
      {
        key: 'reports_analytics',
        label: 'Reports',
        icon: FiBarChart2,
        access: isSuperAdmin || hasModuleAccess('reports_analytics'),
        subItems: [
          { path: '/reports', label: 'Overview', icon: FiBarChart2 },
        ],
      },
      {
        key: 'industry_hub',
        label: isAllSuites ? 'Suites Hub' : 'Switch Suite',
        icon: FiLayers,
        access: isSuperAdmin || (Boolean(availableSuites) && availableSuites.length > 1),
        subItems: [
          ...(isSuperAdmin ? [{ path: '/industry-hub', label: 'All 11 Suites Hub', icon: FiLayers }] : []),
          ...(availableSuites || []).map((s) => ({
            path: s.defaultPath,
            label: s.shortName,
            icon: s.icon,
          })),
        ],
      },
      {
        key: 'subscription',
        label: 'Plans & Quotas',
        icon: FiCreditCard,
        access: isAdmin || isSuperAdmin,
        path: '/subscription',
        subItems: [
          { path: '/subscription', label: 'Subscription Plan', icon: FiCreditCard },
        ],
      },
      {
        key: 'branches',
        label: 'Branch Hub',
        icon: FiMapPin,
        access: isAdmin || isSuperAdmin,
        path: '/branches',
        subItems: [
          { path: '/branches', label: 'Branch Directory', icon: FiMapPin },
        ],
      },
      {
        key: 'branding',
        label: 'Brand & Theme',
        icon: FiLayers,
        access: isAdmin || isSuperAdmin,
        path: '/settings/branding',
        subItems: [
          { path: '/settings/branding', label: 'White-Label Branding', icon: FiLayers },
        ],
      },
      {
        key: 'automation',
        label: 'Automations',
        icon: FiZap,
        access: isAdmin || isSuperAdmin,
        path: '/automation/workflows',
        subItems: [
          { path: '/automation/workflows', label: 'Workflow Rules', icon: FiZap },
        ],
      },
      {
        key: 'settings',
        label: 'Settings',
        icon: FiSettings,
        access: isSuperAdmin,
        path: '/settings',
        subItems: [
          { path: '/settings', label: 'System Settings', icon: FiSettings },
        ],
      },
    ];
  }, [isAllSuites, currentSuite, activeModule, hasModuleAccess, isAdmin, isSuperAdmin, user]);

  // Toggle function for mobile menus
  const toggleMobileMenu = (key) => {
    setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getSecondaryTitle = () => {
    const module = primaryModules.find(m => m.key === activeModule) || primaryModules[0];
    return module ? module.label : '';
  };

  const currentSubItems = primaryModules.find(m => m.key === activeModule)?.subItems || primaryModules[0]?.subItems || [];

  // Mobile Menu Render Item
  const renderMobileItem = (module) => {
    const hasSubItems = module.subItems && module.subItems.length > 0;
    const isExpanded = expandedMenus[module.key];

    if (hasSubItems) {
      return (
        <div key={module.key} className="mobile-nav-group">
          <div
            className={`mobile-nav-item parent ${activeModule === module.key ? 'active' : ''}`}
            onClick={() => toggleMobileMenu(module.key)}
          >
            <div className="mobile-nav-content">
              <module.icon className="mobile-icon" />
              <span>{module.label}</span>
            </div>
            <span className={`mobile-expand-icon ${isExpanded ? 'rotated' : ''}`}>
              <FiChevronRight />
            </span>
          </div>
          <div className={`mobile-subitems ${isExpanded ? 'expanded' : ''}`}>
            {module.subItems.map((sub, idx) => (
              <NavLink
                key={idx}
                to={sub.path}
                className={({ isActive }) => `mobile-subitem ${isActive ? 'active' : ''}`}
                onClick={closeSidebar} // Close drawer on navigation
              >
                {sub.icon && <sub.icon className="sub-icon" />}
                <span>{sub.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      );
    } else {
      return (
        <NavLink
          key={module.key}
          to={module.path}
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          onClick={closeSidebar}
        >
          <div className="mobile-nav-content">
            <module.icon className="mobile-icon" />
            <span>{module.label}</span>
          </div>
        </NavLink>
      );
    }
  };

  if (isMobile) {
    return (
      <>
        <div
          className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
          onClick={closeSidebar}
        />
        <aside className={`sidebar-mobile-drawer ${isOpen ? 'open' : ''}`}>
          <div className="mobile-logo">
            {branding?.logo ? (
              <img src={branding.logo} alt={branding.companyDisplayName || 'Logo'} style={{ height: 34, width: 'auto', objectFit: 'contain' }} />
            ) : (
              <img src="/radhix-logo.png" alt="Radhix Technologies" style={{ height: 34, width: "auto" }} />
            )}
          </div>
          <nav className="mobile-nav">
            {primaryModules.filter(m => m.access).map(module => renderMobileItem(module))}
          </nav>
        </aside>
      </>
    );
  }

  return (
    <>
      <div className={`sidebar-overlay ${isOpen && isMobile ? 'active' : ''}`} onClick={closeSidebar} />

      {/* PRIMARY RAIL */}
      <aside className="sidebar-primary">
        <div
          className="primary-logo"
          onClick={() => {
            navigate('/dashboard');
            setActiveModule('dashboard');
          }}
          style={{ cursor: 'pointer' }}
          title="Go to Dashboard"
        >
          {branding?.logo ? (
            <img src={branding.logo} alt={branding.companyDisplayName || 'Logo'} style={{ width: 36, height: 36, objectFit: 'contain' }} />
          ) : (
            <img src="/radhix-icon.png" alt="Radhix" style={{ width: 36, height: 36, objectFit: "contain" }} />
          )}
        </div>
        <nav className="primary-nav">
          {primaryModules.filter(m => m.access).map(module => (
            <div
              key={module.key}
              className={`primary-item ${activeModule === module.key ? 'active' : ''}`}
              onClick={() => handlePrimaryClick(module.key, !!(module.subItems && module.subItems.length > 0), module.path)}
              title={module.label}
            >
              <module.icon className="primary-icon" />
              <span className="primary-label">{module.label}</span>
            </div>
          ))}
        </nav>
        <div className="primary-footer">
          <button
            type="button"
            className="rail-toggle-btn"
            onClick={() => toggleSidebar()}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={isOpen ? "Collapse sidebar (Ctrl+B)" : "Expand sidebar (Ctrl+B)"}
          >
            {isOpen ? <FiChevronLeft /> : <FiChevronRight />}
          </button>
        </div>
      </aside>

      {/* SECONDARY PANEL */}
      <aside className={`sidebar-secondary ${isOpen && currentSubItems.length > 0 ? 'open' : ''}`}>
        <div className="secondary-header">
          <h3>{getSecondaryTitle()}</h3>
          <button
            type="button"
            className="secondary-close-btn"
            onClick={() => closeSidebar()}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <FiChevronLeft />
          </button>
        </div>
        <div className="secondary-content">
          {currentSubItems.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.path}
              className={({ isActive }) => `secondary-item ${isActive ? 'active' : ''}`}
              end
            >
              {item.icon && <item.icon className="secondary-icon" />}
              <span>{item.label}</span>
            </NavLink>
          ))}
          {currentSubItems.length === 0 && (
            <div className="secondary-empty">
              No options available
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
