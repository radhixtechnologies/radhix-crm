import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
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
} from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = () => {
  const { user, hasModuleAccess, isAdmin, isSuperAdmin } = useAuth();
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
    if (path === '/dashboard') {
      setActiveModule('dashboard');
      return;
    }
    if (path.startsWith('/employees') && path !== '/employees') {
      if (activeModule !== 'my-workspace') setActiveModule('my-workspace');
    } else if (path.startsWith('/hrm')) {
      if (activeModule !== 'hrm') setActiveModule('hrm');
    } else if (path.startsWith('/finance')) {
      if (activeModule !== 'finance') setActiveModule('finance');
    } else if (path.startsWith('/sales') || path.startsWith('/leads') || path.startsWith('/contacts')) {
      if (activeModule !== 'sales') setActiveModule('sales');
    } else if (path.startsWith('/marketing')) {
      if (activeModule !== 'marketing') setActiveModule('marketing');
    } else if (path.startsWith('/inventory') || path.startsWith('/support')) {
      if (activeModule !== 'operations') setActiveModule('operations');
    }
  }, [location.pathname, activeModule, setActiveModule]);


  const handlePrimaryClick = (moduleKey, hasSubItems, path) => {
    const isSameModule = activeModule === moduleKey;

    if (path && (!hasSubItems || isSameModule)) {
      setActiveModule(moduleKey);
      closeSidebar();
      navigate(path);
      return;
    }

    if (hasSubItems) {
      if (isSameModule && isOpen) {
        closeSidebar();
      } else {
        setActiveModule(moduleKey);
        openSidebar();
      }

      const defaultModulePath = {
        sales: '/sales',
        hrm: '/hrm',
        finance: '/finance',
        marketing: '/marketing',
        operations: '/support',
        'my-workspace': '/employees',
        dashboard: '/dashboard',
      }[moduleKey];

      if (defaultModulePath && !isSameModule) {
        navigate(defaultModulePath);
      }
    }
  };

  // Define Groups / Modules for Primary Rail
  // This abstracts the existing complex menu structure into high-level Modules
  const primaryModules = [
    {
      key: 'dashboard',
      label: 'Home',
      icon: FiLayout,
      path: '/dashboard',
      access: true,
    },
    {
      key: 'my-workspace',
      label: 'My Workspace',
      icon: FiUser,
      access: true, // Everyone has a workspace
      subItems: [
        { path: `/employees/${user?.employeeId || 'me'}`, label: 'My Profile', icon: FiUser },
        { path: '/employees/my-attendance', label: 'My Attendance', icon: FiClock },
        { path: '/employees/my-leaves', label: 'My Leaves', icon: FiCalendar },
        { path: '/employees/tasks', label: 'My Tasks', icon: FiCheckCircle },
        { path: '/employees/timesheets', label: 'My Timesheets', icon: FiFileText },
        { path: '/employees/performance', label: 'My Performance', icon: FiTrendingUp },
        { path: '/employees/salary-slips', label: 'Salary Slips', icon: FiDollarSign },
        { path: '/employees/reimbursements', label: 'Reimbursements', icon: FiCreditCard },
      ]
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
        { path: '/hrm/recruitment/jobs', label: 'Recruitment', icon: FiUsers }, // Simplified group
        { path: '/hrm/performance', label: 'Performance', icon: FiTrendingUp },
        ...(isAdmin || isSuperAdmin ? [
          { path: '/admin/all-reviews', label: 'All Reviews', icon: FiFileText },
          { path: '/admin/appraisal-cycles', label: 'Appraisal Cycles', icon: FiCalendar }
        ] : []),
        { path: '/hrm/training', label: 'Training', icon: FiFileText },
        { path: '/hrm/skills', label: 'Skills', icon: FiCheckCircle },
        { path: '/hrm/policies', label: 'Policies', icon: FiFileText },
        { path: '/hrm/exit', label: 'Exit Mgmt', icon: FiX },
        { path: '/hrm/analytics', label: 'Analytics', icon: FiBarChart2 },
        { path: '/hrm/reports', label: 'Reports', icon: FiFileText },
      ]
    },
    {
      key: 'sales',
      label: 'Sales',
      icon: FiTrendingUp,
      access: hasModuleAccess('sales'),
      subItems: [
        { path: '/sales', label: 'Dashboard', icon: FiLayout },
        { path: '/sales/leads', label: 'Leads', icon: FiUsers },
        { path: '/sales/leads/tracking', label: 'Tracking', icon: FiTrendingUp },
        { path: '/calendar', label: 'Calendar', icon: FiCalendar },
        { path: '/sales/pipeline', label: 'Pipeline', icon: FiBarChart2 },
        { path: '/sales/deals', label: 'Deals', icon: FiDollarSign },
        { path: '/sales/clients', label: 'Clients', icon: FiBriefcase },
        { path: '/contacts', label: 'Contacts', icon: FiUsers }, // Moved contacts here
        { path: '/sales/proposals', label: 'Documents', icon: FiFileText },
      ]
    },
    {
      key: 'marketing',
      label: 'Marketing',
      icon: FiTarget,
      access: hasModuleAccess('marketing'),
      subItems: [
        { path: '/marketing', label: 'Dashboard', icon: FiLayout },
        { path: '/marketing/campaigns', label: 'Campaigns', icon: FiTarget },
        { path: '/marketing/emails', label: 'Emails', icon: FiMail },
        { path: '/marketing/segments', label: 'Segments', icon: FiUsers },
      ]
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
      ]
    },
    {
      key: 'operations',
      label: 'Operations',
      icon: FiGrid, // Package or Grid
      access: isSuperAdmin || hasModuleAccess('inventory') || hasModuleAccess('support'),
      subItems: [
        { path: '/inventory/products', label: 'Inventory', icon: FiPackage, access: isSuperAdmin || hasModuleAccess('inventory') },
        { path: '/support', label: 'Support', icon: FiCheckCircle, access: isSuperAdmin || hasModuleAccess('support') },
      ].filter(item => item.access)
    },
    {
      key: 'reports_analytics',
      label: 'Reports',
      icon: FiBarChart2,
      access: isSuperAdmin || hasModuleAccess('reports_analytics'),
      subItems: [
        { path: '/reports', label: 'Overview', icon: FiBarChart2 },
      ]
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: FiSettings,
      access: isSuperAdmin,
      path: '/settings',
    }
  ];

  // Toggle function for mobile menus
  const toggleMobileMenu = (key) => {
    setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getSecondaryTitle = () => {
    const module = primaryModules.find(m => m.key === activeModule);
    return module ? module.label : '';
  };

  const currentSubItems = primaryModules.find(m => m.key === activeModule)?.subItems || [];

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
            CRM
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
        <div className="primary-logo">
          {/* Logo placeholder or simple icon */}
          <div className="logo-icon__Box">CRM</div>
        </div>
        <nav className="primary-nav">
          {primaryModules.filter(m => m.access).map(module => (
            <div
              key={module.key}
              className={`primary-item ${activeModule === module.key ? 'active' : ''}`}
              onClick={() => handlePrimaryClick(module.key, !!module.subItems, module.path)}
              title={module.label}
            >
              <module.icon className="primary-icon" />
              <span className="primary-label">{module.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* SECONDARY PANEL */}
      <aside className={`sidebar-secondary ${isOpen ? 'open' : ''}`}>
        <div className="secondary-header">
          <h3>{getSecondaryTitle()}</h3>
          <button className="secondary-close-btn" onClick={() => toggleSidebar()}>
            {isOpen ? <FiChevronLeft /> : <FiChevronRight />}
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
