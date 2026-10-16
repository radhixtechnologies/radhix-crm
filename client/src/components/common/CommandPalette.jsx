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
} from 'react-icons/fi';
import { searchService } from '../../services/searchService';
import './CommandPalette.css';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const bodyRef = useRef(null);

  // Core navigation pages
  const defaultPages = [
    { id: 'page-dashboard', title: 'Dashboard', subtitle: 'Overview, analytics & KPIs', icon: FiLayers, path: '/dashboard', category: 'Pages' },
    { id: 'page-daily-updates', title: 'Daily Work Update', subtitle: 'Submit & track daily accomplishments', icon: FiActivity, path: '/employees/daily-updates', category: 'Pages' },
    { id: 'page-projects', title: 'Projects & Tasks', subtitle: 'Manage projects, milestones & assignments', icon: FiBriefcase, path: '/projects', category: 'Pages' },
    { id: 'page-approvals', title: 'Approvals Hub', subtitle: 'Central inbox for leaves, claims & standups', icon: FiCheckCircle, path: '/approvals', category: 'Pages' },
    { id: 'page-announcements', title: 'Company Notice Board', subtitle: 'Official company townhall & broadcasts', icon: FiBell, path: '/company/announcements', category: 'Pages' },
    { id: 'page-admissions', title: 'Institute Admissions', subtitle: 'Student inquiries, courses & batches', icon: FiBookOpen, path: '/institute/admissions', category: 'Pages' },
    { id: 'page-tasks', title: 'My Tasks', subtitle: 'Personal assigned tasks and todos', icon: FiCheckSquare, path: '/employees/tasks', category: 'Pages' },
    { id: 'page-attendance', title: 'My Attendance', subtitle: 'Clock-in, logs & monthly attendance', icon: FiCalendar, path: '/employees/my-attendance', category: 'Pages' },
    { id: 'page-leaves', title: 'My Leaves', subtitle: 'Apply for leave & check balance', icon: FiCalendar, path: '/employees/my-leaves', category: 'Pages' },
    { id: 'page-sales', title: 'Sales Pipeline & Leads', subtitle: 'Leads, deals, proposals & pipeline', icon: FiTrendingUp, path: '/sales', category: 'Pages' },
    { id: 'page-finance', title: 'Finance & Invoices', subtitle: 'Invoices, expenses, payroll & receipts', icon: FiFileText, path: '/finance', category: 'Pages' },
    { id: 'page-hrm', title: 'HRM Directory', subtitle: 'Employee profiles & team directory', icon: FiUsers, path: '/hrm/directory', category: 'Pages' },
    { id: 'page-settings', title: 'System Settings', subtitle: 'Company profile & preferences', icon: FiSettings, path: '/settings', category: 'Pages' },
  ];

  // Quick Action items
  const quickActions = [
    {
      id: 'act-daily-update',
      title: "Submit Today's Work Update",
      subtitle: 'Log accomplishments and roadblocks',
      icon: FiActivity,
      category: 'Quick Actions',
      perform: () => navigate('/employees/daily-updates'),
    },
    {
      id: 'act-new-project',
      title: 'Create New Project',
      subtitle: 'Start a new project with team and milestones',
      icon: FiBriefcase,
      category: 'Quick Actions',
      perform: () => navigate('/projects'),
    },
    {
      id: 'act-approvals',
      title: 'Review Pending Approvals',
      subtitle: 'Approve or reject leaves and standups',
      icon: FiCheckCircle,
      category: 'Quick Actions',
      perform: () => navigate('/approvals'),
    },
    {
      id: 'act-announcements',
      title: 'Broadcast Announcement',
      subtitle: 'Post a company notice or townhall update',
      icon: FiBell,
      category: 'Quick Actions',
      perform: () => navigate('/company/announcements'),
    },
    {
      id: 'act-theme',
      title: 'Toggle Theme (Dark / Light)',
      subtitle: 'Switch between dark and light appearance',
      icon: document.documentElement.getAttribute('data-theme') === 'dark' ? FiSun : FiMoon,
      category: 'Quick Actions',
      perform: () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
      },
    },
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
      setActiveIndex(0);
      setSearchResults(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Live entity search with debounce
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSearchResults(null);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchService.globalSearch(encodeURIComponent(query.trim()));
        if (res.data?.success) {
          setSearchResults(res.data.data);
        }
      } catch (err) {
        console.error('Command palette search error:', err);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Compute all filtered items currently displayable
  const filteredActions = quickActions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const filteredPages = defaultPages.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  // Entities from live search
  const entityItems = [];
  if (searchResults) {
    (searchResults.projects || []).forEach((proj) => {
      entityItems.push({
        id: `entity-proj-${proj._id}`,
        title: proj.name,
        subtitle: `Project • ${proj.code || 'PRJ'} • ${proj.status || 'Active'}`,
        icon: FiBriefcase,
        category: 'Projects',
        badge: proj.status,
        perform: () => navigate(`/projects/${proj._id}`),
      });
    });

    (searchResults.employees || []).forEach((emp) => {
      const name = emp.user?.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employeeId;
      entityItems.push({
        id: `entity-emp-${emp._id}`,
        title: name,
        subtitle: `Employee • ${emp.department || 'General'} • ${emp.designation || 'Staff'}`,
        icon: FiUsers,
        category: 'Employees',
        badge: emp.department,
        perform: () => navigate(`/employees/${emp._id}`),
      });
    });

    (searchResults.leads || []).forEach((lead) => {
      entityItems.push({
        id: `entity-lead-${lead._id}`,
        title: lead.name,
        subtitle: `Lead • ${lead.company || lead.email || 'Contact'}`,
        icon: FiTrendingUp,
        category: 'Leads',
        badge: lead.status,
        perform: () => navigate(`/sales/leads/${lead._id}`),
      });
    });

    (searchResults.deals || []).forEach((deal) => {
      entityItems.push({
        id: `entity-deal-${deal._id}`,
        title: deal.title || deal.name,
        subtitle: `Deal • ${deal.stage || 'Pipeline'}`,
        icon: FiTrendingUp,
        category: 'Deals',
        badge: deal.stage,
        perform: () => navigate(`/sales/deals/${deal._id}`),
      });
    });
  }

  // Flattened items list for keyboard selection
  const allDisplayItems = [
    ...filteredActions,
    ...filteredPages,
    ...entityItems,
  ];

  // Keep active index in bounds
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const executeItem = useCallback((item) => {
    if (!item) return;
    setIsOpen(false);
    if (item.perform) {
      item.perform();
    } else if (item.path) {
      navigate(item.path);
    }
  }, [navigate]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(1, allDisplayItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + allDisplayItems.length) % Math.max(1, allDisplayItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allDisplayItems[activeIndex]) {
        executeItem(allDisplayItems[activeIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cmd-palette-overlay" onClick={() => setIsOpen(false)}>
      <div
        className="cmd-palette-container"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="cmd-palette-search-wrapper">
          <FiSearch className="cmd-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-palette-input"
            placeholder="Type a command or search anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="cmd-esc-badge" onClick={() => setIsOpen(false)}>
            ESC
          </span>
        </div>

        {/* Results Body */}
        <div className="cmd-palette-body" ref={bodyRef}>
          {searching && (
            <div className="cmd-loading-state">
              <span className="cmd-spinner" />
              <span>Searching across CRM records...</span>
            </div>
          )}

          {allDisplayItems.length === 0 && !searching && (
            <div className="cmd-empty-state">
              No matching pages, actions, or records found for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Group 1: Quick Actions */}
          {filteredActions.length > 0 && (
            <>
              <div className="cmd-section-title">Quick Actions</div>
              {filteredActions.map((item) => {
                const globalIdx = allDisplayItems.findIndex((x) => x.id === item.id);
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    className={`cmd-item ${globalIdx === activeIndex ? 'active' : ''}`}
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
                    <span className="cmd-item-shortcut">Action</span>
                  </div>
                );
              })}
            </>
          )}

          {/* Group 2: Pages & Modules */}
          {filteredPages.length > 0 && (
            <>
              <div className="cmd-section-title">Pages &amp; Navigation</div>
              {filteredPages.map((item) => {
                const globalIdx = allDisplayItems.findIndex((x) => x.id === item.id);
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    className={`cmd-item ${globalIdx === activeIndex ? 'active' : ''}`}
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
            </>
          )}

          {/* Group 3: Entity Search Results */}
          {entityItems.length > 0 && (
            <>
              <div className="cmd-section-title">Search Results ({entityItems.length})</div>
              {entityItems.map((item) => {
                const globalIdx = allDisplayItems.findIndex((x) => x.id === item.id);
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    className={`cmd-item ${globalIdx === activeIndex ? 'active' : ''}`}
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
                    {item.badge && <span className="cmd-item-badge">{item.badge}</span>}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer Hints */}
        <div className="cmd-palette-footer">
          <div className="cmd-footer-hints">
            <span className="cmd-hint-pill">
              <kbd className="cmd-kbd">↑</kbd> <kbd className="cmd-kbd">↓</kbd> to navigate
            </span>
            <span className="cmd-hint-pill">
              <kbd className="cmd-kbd">↵</kbd> to select
            </span>
            <span className="cmd-hint-pill">
              <kbd className="cmd-kbd">esc</kbd> to close
            </span>
          </div>
          <span className="cmd-badge-hint">Spotlight Search</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

