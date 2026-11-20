import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiBriefcase,
  FiCheckSquare,
  FiCalendar,
  FiActivity,
  FiFileText,
  FiSettings,
  FiUsers,
  FiLayers,
  FiCheckCircle,
  FiBell,
  FiBookOpen,
  FiMoon,
  FiSun,
  FiTrendingUp,
  FiAward,
  FiPlusCircle,
  FiZap,
  FiHome,
  FiHeart,
  FiSliders,
  FiCornerDownLeft,
  FiCommand,
} from 'react-icons/fi';
import { searchService } from '../../services/searchService';
import { triggerConfetti } from '../../utils/confetti';
import './CommandPalette.css';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'actions' | 'suites' | 'pages' | 'records'
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const bodyRef = useRef(null);
  const itemRefs = useRef([]);

  // Industry Suites
  const industrySuites = [
    {
      id: 'suite-institute',
      title: '🎓 Institute & Education Admissions Suite',
      subtitle: 'Student leads, course inquiries, batches & admissions pipeline',
      icon: FiBookOpen,
      category: 'Industry Suites',
      perform: () => navigate('/institute/admissions'),
    },
    {
      id: 'suite-realestate',
      title: '🏢 Real Estate & Property Management Suite',
      subtitle: 'Site visits, property listings, buyer leads & broker networks',
      icon: FiHome,
      category: 'Industry Suites',
      perform: () => navigate('/real-estate/properties'),
    },
    {
      id: 'suite-healthcare',
      title: '🏥 Healthcare, Clinic & Hospital CRM',
      subtitle: 'Patient registration, doctor consultations, appointments & OPD',
      icon: FiHeart,
      category: 'Industry Suites',
      perform: () => navigate('/healthcare/patients'),
    },
    {
      id: 'suite-it-agency',
      title: '💻 IT Services & Software Agency CRM',
      subtitle: 'Client retainers, agile sprints, project tasks & milestone tracking',
      icon: FiBriefcase,
      category: 'Industry Suites',
      perform: () => navigate('/projects'),
    },
    {
      id: 'suite-sales',
      title: '📊 Enterprise Sales & Revenue Suite',
      subtitle: 'Gamified deals, 3D visual funnel, proposals, e-signatures & podium',
      icon: FiTrendingUp,
      category: 'Industry Suites',
      perform: () => navigate('/sales'),
    },
  ];

  // Quick Action items
  const quickActions = [
    {
      id: 'act-celebrate',
      title: '🎉 Celebrate Team Win (Confetti Burst)',
      subtitle: 'Trigger a celebratory 60fps golden confetti explosion',
      icon: FiAward,
      category: 'Quick Actions',
      badge: 'Delight',
      perform: () => {
        triggerConfetti();
      },
    },
    {
      id: 'act-funnel',
      title: '🎯 Visual 3D Funnel & Conversion Velocity',
      subtitle: 'Inspect lead-to-won stages, stage drop-offs & cycle duration',
      icon: FiZap,
      category: 'Quick Actions',
      badge: 'Analytics',
      perform: () => navigate('/sales'),
    },
    {
      id: 'act-leaderboard',
      title: '🏆 Sales Gamification & Leaderboard Podium',
      subtitle: 'View top 3 sales podium, quotas and achievement badges',
      icon: FiAward,
      category: 'Quick Actions',
      badge: 'Gamify',
      perform: () => navigate('/sales'),
    },
    {
      id: 'act-daily-update',
      title: "⚡ Submit Today's Daily Work Update",
      subtitle: 'Log daily accomplishments, in-progress tasks and blockers',
      icon: FiActivity,
      category: 'Quick Actions',
      perform: () => navigate('/employees/daily-updates'),
    },
    {
      id: 'act-new-lead',
      title: '➕ Log New Lead / Opportunity',
      subtitle: 'Capture prospect details, source and estimated deal value',
      icon: FiPlusCircle,
      category: 'Quick Actions',
      perform: () => navigate('/sales/leads/new'),
    },
    {
      id: 'act-new-deal',
      title: '💼 Create New Deal in Pipeline',
      subtitle: 'Add deal to Kanban board with expected revenue & closing date',
      icon: FiTrendingUp,
      category: 'Quick Actions',
      perform: () => navigate('/sales/deals'),
    },
    {
      id: 'act-new-proposal',
      title: '📄 Draft Proposal / Quotation',
      subtitle: 'Create digital quote with discount tables and e-signature terms',
      icon: FiFileText,
      category: 'Quick Actions',
      perform: () => navigate('/sales/proposals/new'),
    },
    {
      id: 'act-new-project',
      title: '🚀 Create New Project',
      subtitle: 'Start a new project with team, client, and milestones',
      icon: FiBriefcase,
      category: 'Quick Actions',
      perform: () => navigate('/projects'),
    },
    {
      id: 'act-approvals',
      title: '✅ Review Approvals Hub',
      subtitle: 'Central inbox for leaves, expense claims and work standups',
      icon: FiCheckCircle,
      category: 'Quick Actions',
      perform: () => navigate('/approvals'),
    },
    {
      id: 'act-announcements',
      title: '📢 Broadcast Company Announcement',
      subtitle: 'Post an official notice or company-wide broadcast',
      icon: FiBell,
      category: 'Quick Actions',
      perform: () => navigate('/company/announcements'),
    },
    {
      id: 'act-theme',
      title: '🌓 Toggle Theme (Dark / Light Mode)',
      subtitle: 'Switch application color palette for daylight or night focus',
      icon: document.documentElement.getAttribute('data-theme') === 'dark' ? FiSun : FiMoon,
      category: 'Quick Actions',
      badge: 'Theme',
      perform: () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
      },
    },
  ];

  // Core navigation pages
  const defaultPages = [
    { id: 'page-dashboard', title: 'Dashboard Overview', subtitle: 'Executive dashboard, revenue trends & active KPIs', icon: FiLayers, path: '/dashboard', category: 'Pages' },
    { id: 'page-daily-updates', title: 'Daily Work Updates', subtitle: 'Team daily accomplishments and sprint check-ins', icon: FiActivity, path: '/employees/daily-updates', category: 'Pages' },
    { id: 'page-projects', title: 'Projects & Tasks Board', subtitle: 'Manage projects, milestones, sprints & assignments', icon: FiBriefcase, path: '/projects', category: 'Pages' },
    { id: 'page-sales', title: 'Sales Pipeline & Funnel', subtitle: 'Deals Kanban, leads tracking, proposals & contracts', icon: FiTrendingUp, path: '/sales', category: 'Pages' },
    { id: 'page-finance', title: 'Finance & Invoices Hub', subtitle: 'Invoices, expenses, payroll & client statements', icon: FiFileText, path: '/finance', category: 'Pages' },
    { id: 'page-hrm', title: 'HRM & Employee Directory', subtitle: 'Team profiles, departments, hierarchy & contact info', icon: FiUsers, path: '/hrm/directory', category: 'Pages' },
    { id: 'page-approvals', title: 'Approvals Hub', subtitle: 'Central approval inbox for managers and admins', icon: FiCheckCircle, path: '/approvals', category: 'Pages' },
    { id: 'page-admissions', title: 'Institute Admissions', subtitle: 'Student counseling, enrollments & batches', icon: FiBookOpen, path: '/institute/admissions', category: 'Pages' },
    { id: 'page-tasks', title: 'My Assigned Tasks', subtitle: 'Personal work items, deadlines and checklist', icon: FiCheckSquare, path: '/employees/tasks', category: 'Pages' },
    { id: 'page-attendance', title: 'My Attendance & Logs', subtitle: 'Clock-in, biometric logs & monthly attendance report', icon: FiCalendar, path: '/employees/my-attendance', category: 'Pages' },
    { id: 'page-leaves', title: 'My Leaves & Holidays', subtitle: 'Apply for leave, view approvals and holiday calendar', icon: FiCalendar, path: '/employees/my-leaves', category: 'Pages' },
    { id: 'page-announcements', title: 'Company Notice Board', subtitle: 'Townhall broadcasts and executive bulletins', icon: FiBell, path: '/company/announcements', category: 'Pages' },
    { id: 'page-settings', title: 'System & Org Settings', subtitle: 'Company profile, branding, roles and permissions', icon: FiSettings, path: '/settings', category: 'Pages' },
  ];

  // Toggle open/close listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedFilter('all');
      setActiveIndex(0);
      setSearchResults(null);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Debounced search across API when query length >= 2
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSearchResults(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchService.globalSearch(query.trim());
        if (res?.data?.success && res.data.data) {
          setSearchResults(res.data.data);
        } else {
          setSearchResults(null);
        }
      } catch (err) {
        console.error('Command palette search failed:', err);
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Filter actions based on query and selected filter
  const qLower = query.toLowerCase().trim();

  const filteredSuites = industrySuites.filter(
    (item) =>
      (selectedFilter === 'all' || selectedFilter === 'suites') &&
      (!qLower ||
        item.title.toLowerCase().includes(qLower) ||
        item.subtitle.toLowerCase().includes(qLower) ||
        'industry suite crm'.includes(qLower))
  );

  const filteredActions = quickActions.filter(
    (item) =>
      (selectedFilter === 'all' || selectedFilter === 'actions') &&
      (!qLower ||
        item.title.toLowerCase().includes(qLower) ||
        item.subtitle.toLowerCase().includes(qLower) ||
        'action quick create new'.includes(qLower))
  );

  const filteredPages = defaultPages.filter(
    (item) =>
      (selectedFilter === 'all' || selectedFilter === 'pages') &&
      (!qLower ||
        item.title.toLowerCase().includes(qLower) ||
        item.subtitle.toLowerCase().includes(qLower) ||
        item.path.toLowerCase().includes(qLower))
  );

  // Parse backend search results
  const entityItems = [];
  if (searchResults && (selectedFilter === 'all' || selectedFilter === 'records')) {
    if (searchResults.leads?.length) {
      searchResults.leads.slice(0, 4).forEach((lead) => {
        entityItems.push({
          id: `lead-${lead._id}`,
          title: lead.name,
          subtitle: `Lead • ${lead.company || 'No Company'} • ${lead.status || 'Active'}`,
          icon: FiUsers,
          category: 'Leads',
          badge: lead.status || 'Lead',
          path: `/sales/leads/${lead._id}`,
        });
      });
    }
    if (searchResults.deals?.length) {
      searchResults.deals.slice(0, 4).forEach((deal) => {
        entityItems.push({
          id: `deal-${deal._id}`,
          title: deal.title,
          subtitle: `Deal • Stage: ${deal.stage || 'Pipeline'} • Value: ₹${(deal.value || 0).toLocaleString()}`,
          icon: FiTrendingUp,
          category: 'Deals',
          badge: deal.stage || 'Deal',
          path: `/sales/deals/${deal._id}`,
        });
      });
    }
    if (searchResults.employees?.length) {
      searchResults.employees.slice(0, 4).forEach((emp) => {
        entityItems.push({
          id: `emp-${emp._id}`,
          title: emp.name,
          subtitle: `Team • ${emp.designation || 'Staff'} • ${emp.email || ''}`,
          icon: FiUsers,
          category: 'Employees',
          badge: 'Team',
          path: `/employees/${emp._id}`,
        });
      });
    }
    if (searchResults.invoices?.length) {
      searchResults.invoices.slice(0, 4).forEach((inv) => {
        entityItems.push({
          id: `inv-${inv._id}`,
          title: `Invoice #${inv.invoiceNumber || inv._id.slice(-6)}`,
          subtitle: `Finance • ${inv.client?.name || 'Client'} • ₹${(inv.total || 0).toLocaleString()}`,
          icon: FiFileText,
          category: 'Invoices',
          badge: inv.status || 'Invoice',
          path: `/finance/invoices/${inv._id}`,
        });
      });
    }
  }

  // Combined flat list for keyboard arrow navigation
  const allDisplayItems = [
    ...filteredActions,
    ...filteredSuites,
    ...filteredPages,
    ...entityItems,
  ];

  // Keep active index within bounds
  useEffect(() => {
    if (activeIndex >= allDisplayItems.length) {
      setActiveIndex(Math.max(0, allDisplayItems.length - 1));
    }
  }, [allDisplayItems.length, activeIndex]);

  // Execute selected item
  const executeItem = useCallback(
    (item) => {
      setIsOpen(false);
      if (item.perform) {
        item.perform();
      } else if (item.path) {
        navigate(item.path);
      }
    },
    [navigate]
  );

  // Keyboard navigation within list
  const handleKeyDownInBox = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % (allDisplayItems.length || 1));
      scrollActiveIntoView(activeIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + (allDisplayItems.length || 1)) % (allDisplayItems.length || 1));
      scrollActiveIntoView(activeIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allDisplayItems[activeIndex]) {
        executeItem(allDisplayItems[activeIndex]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const filterKeys = ['all', 'actions', 'suites', 'pages', 'records'];
      const nextIdx = (filterKeys.indexOf(selectedFilter) + 1) % filterKeys.length;
      setSelectedFilter(filterKeys[nextIdx]);
      setActiveIndex(0);
    }
  };

  const scrollActiveIntoView = (index) => {
    setTimeout(() => {
      const activeEl = itemRefs.current[index];
      if (activeEl && bodyRef.current) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 10);
  };

  if (!isOpen) return null;

  return (
    <div className="cmd-palette-overlay" onClick={() => setIsOpen(false)}>
      <div
        className="cmd-palette-container"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDownInBox}
      >
        {/* Top Header & Search Input */}
        <div className="cmd-palette-search-wrapper">
          <FiSearch className="cmd-search-icon" />
          <input
            ref={inputRef}
            className="cmd-palette-input"
            type="text"
            placeholder="Type a command, search records, or jump to industry suite..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
          />
          <div className="cmd-header-badges">
            <span className="cmd-brand-tag">
              <FiCommand style={{ fontSize: '11px', marginRight: '4px' }} />
              Spotlight
            </span>
            <span className="cmd-esc-badge" onClick={() => setIsOpen(false)} title="Close palette">
              ESC
            </span>
          </div>
        </div>

        {/* Filter Scope Pills Bar */}
        <div className="cmd-scope-bar">
          {[
            { id: 'all', label: 'All Commands' },
            { id: 'actions', label: '⚡ Quick Actions' },
            { id: 'suites', label: '🏢 Industry Suites' },
            { id: 'pages', label: '🧭 Navigation' },
            { id: 'records', label: '🔍 Live Records' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              className={`cmd-scope-pill ${selectedFilter === pill.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedFilter(pill.id);
                setActiveIndex(0);
                inputRef.current?.focus();
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Results Body */}
        <div className="cmd-palette-body" ref={bodyRef}>
          {searching && (
            <div className="cmd-loading-state">
              <span className="cmd-spinner" />
              <span>Searching real-time CRM database...</span>
            </div>
          )}

          {allDisplayItems.length === 0 && !searching && (
            <div className="cmd-empty-state">
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                No commands or records matched &ldquo;{query}&rdquo;
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary, #64748b)' }}>
                Try searching for &quot;leads&quot;, &quot;deal&quot;, &quot;suite&quot;, &quot;celebrate&quot;, or &quot;theme&quot;
              </div>
            </div>
          )}

          {/* Group: Quick Actions */}
          {filteredActions.length > 0 && (
            <div className="cmd-group-section">
              <div className="cmd-section-title">
                <span>⚡ Quick Actions</span>
                <span className="cmd-count-chip">{filteredActions.length}</span>
              </div>
              {filteredActions.map((item) => {
                const globalIdx = allDisplayItems.findIndex((x) => x.id === item.id);
                const IconComponent = item.icon;
                const isSelected = globalIdx === activeIndex;
                return (
                  <div
                    key={item.id}
                    ref={(el) => (itemRefs.current[globalIdx] = el)}
                    className={`cmd-item ${isSelected ? 'active' : ''}`}
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => setActiveIndex(globalIdx)}
                  >
                    <div className="cmd-item-icon action-icon">
                      <IconComponent />
                    </div>
                    <div className="cmd-item-content">
                      <div className="cmd-item-title">{item.title}</div>
                      <div className="cmd-item-subtitle">{item.subtitle}</div>
                    </div>
                    {item.badge && <span className="cmd-item-badge accent">{item.badge}</span>}
                    <span className="cmd-item-shortcut">
                      <FiCornerDownLeft style={{ fontSize: '11px' }} />
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Group: Industry Suites */}
          {filteredSuites.length > 0 && (
            <div className="cmd-group-section">
              <div className="cmd-section-title">
                <span>🏢 Industry Suites Switcher</span>
                <span className="cmd-count-chip">{filteredSuites.length}</span>
              </div>
              {filteredSuites.map((item) => {
                const globalIdx = allDisplayItems.findIndex((x) => x.id === item.id);
                const IconComponent = item.icon;
                const isSelected = globalIdx === activeIndex;
                return (
                  <div
                    key={item.id}
                    ref={(el) => (itemRefs.current[globalIdx] = el)}
                    className={`cmd-item ${isSelected ? 'active' : ''}`}
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => setActiveIndex(globalIdx)}
                  >
                    <div className="cmd-item-icon suite-icon">
                      <IconComponent />
                    </div>
                    <div className="cmd-item-content">
                      <div className="cmd-item-title">{item.title}</div>
                      <div className="cmd-item-subtitle">{item.subtitle}</div>
                    </div>
                    <span className="cmd-item-badge suite">Suite</span>
                    <span className="cmd-item-shortcut">
                      <FiCornerDownLeft style={{ fontSize: '11px' }} />
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Group: Pages & Navigation */}
          {filteredPages.length > 0 && (
            <div className="cmd-group-section">
              <div className="cmd-section-title">
                <span>🧭 Navigation &amp; Modules</span>
                <span className="cmd-count-chip">{filteredPages.length}</span>
              </div>
              {filteredPages.map((item) => {
                const globalIdx = allDisplayItems.findIndex((x) => x.id === item.id);
                const IconComponent = item.icon;
                const isSelected = globalIdx === activeIndex;
                return (
                  <div
                    key={item.id}
                    ref={(el) => (itemRefs.current[globalIdx] = el)}
                    className={`cmd-item ${isSelected ? 'active' : ''}`}
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => setActiveIndex(globalIdx)}
                  >
                    <div className="cmd-item-icon">
                      <IconComponent />
                    </div>
                    <div className="cmd-item-content">
                      <div className="cmd-item-title">{item.title}</div>
                      <div className="cmd-item-subtitle">{item.subtitle}</div>
                    </div>
                    <span className="cmd-item-shortcut">Jump</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Group: Entity Search Results */}
          {entityItems.length > 0 && (
            <div className="cmd-group-section">
              <div className="cmd-section-title">
                <span>🔍 Live Database Records</span>
                <span className="cmd-count-chip">{entityItems.length}</span>
              </div>
              {entityItems.map((item) => {
                const globalIdx = allDisplayItems.findIndex((x) => x.id === item.id);
                const IconComponent = item.icon;
                const isSelected = globalIdx === activeIndex;
                return (
                  <div
                    key={item.id}
                    ref={(el) => (itemRefs.current[globalIdx] = el)}
                    className={`cmd-item ${isSelected ? 'active' : ''}`}
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => setActiveIndex(globalIdx)}
                  >
                    <div className="cmd-item-icon record-icon">
                      <IconComponent />
                    </div>
                    <div className="cmd-item-content">
                      <div className="cmd-item-title">{item.title}</div>
                      <div className="cmd-item-subtitle">{item.subtitle}</div>
                    </div>
                    {item.badge && <span className="cmd-item-badge">{item.badge}</span>}
                    <span className="cmd-item-shortcut">Open</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Hotkey Hints */}
        <div className="cmd-palette-footer">
          <div className="cmd-footer-hints">
            <span className="cmd-hint-pill">
              <kbd className="cmd-kbd">↑</kbd> <kbd className="cmd-kbd">↓</kbd> navigate
            </span>
            <span className="cmd-hint-pill">
              <kbd className="cmd-kbd">↵</kbd> select
            </span>
            <span className="cmd-hint-pill">
              <kbd className="cmd-kbd">Tab</kbd> switch filter
            </span>
            <span className="cmd-hint-pill">
              <kbd className="cmd-kbd">esc</kbd> close
            </span>
          </div>
          <span className="cmd-badge-hint">
            {allDisplayItems.length} {allDisplayItems.length === 1 ? 'command' : 'commands'} available
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
