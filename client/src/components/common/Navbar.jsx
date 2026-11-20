import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { FiSearch, FiBell, FiUser, FiLogOut, FiMenu, FiX, FiLock, FiMessageCircle, FiGlobe, FiCreditCard, FiLayers } from 'react-icons/fi';
import { getInitials } from '../../utils/format';
import ThemeToggle from './ThemeToggle';
import NotificationDropdown from './NotificationDropdown';
import { notificationService } from '../../services/notificationService';
import GlobalSearch from './GlobalSearch';
import IndustrySuiteSwitcher from './IndustrySuiteSwitcher';
import '../../styles/dashboard.css';
import './Header.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isOpen, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  // Track viewport for responsive behavior
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const userMenuRef = useRef(null);

  const impersonationData = (() => {
    try {
      const saved = localStorage.getItem('radhix_impersonation_backup');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const handleExitImpersonate = () => {
    try {
      const backup = localStorage.getItem('radhix_impersonation_backup');
      if (backup) {
        const parsed = JSON.parse(backup);
        localStorage.setItem('token', parsed.token);
        if (parsed.sessionId) localStorage.setItem('sessionId', parsed.sessionId);
        localStorage.setItem('user', JSON.stringify(parsed.user));
        localStorage.removeItem('radhix_impersonation_backup');
        localStorage.setItem('radhix_active_industry_suite', 'all');
        window.location.href = '/subscription';
      }
    } catch (e) {
      console.error('Error exiting impersonation:', e);
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    window.addEventListener('resize', handleResize);
    // Check on mount
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Fetch unread count on mount and periodically
    const fetchUnreadCount = async () => {
      try {
        const response = await notificationService.getUnreadCount();
        if (response.data.success) {
          setUnreadCount(response.data.count);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut for spotlight command palette (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-command-palette'));
      }
      // Close mobile search on Escape
      if (e.key === 'Escape' && mobileSearchOpen) {
        setMobileSearchOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileSearchOpen]);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {isMobile && (
          <button
            className="navbar-action-btn mobile-menu-btn"
            onClick={() => toggleSidebar()}
            aria-label="Toggle menu"
          >
            {isOpen ? <FiX /> : <FiMenu />}
          </button>
        )}
        <div className="navbar-logo" onClick={() => navigate('/dashboard')}>
          <img
            src="/radhix-logo.png"
            alt="Radhix Technologies"
            style={{ height: 38, width: 'auto', display: 'block' }}
          />
        </div>
        <div className="navbar-divider"></div>
        <IndustrySuiteSwitcher />
        {impersonationData && (
          <div className="impersonation-badge-pill" title="You are currently viewing this CRM as this tenant">
            <span className="live-impersonate-dot" />
            <span className="imp-text">
              Viewing as <strong>{user?.name}</strong> ({user?.company?.name || 'Client'})
            </span>
            <button
              type="button"
              className="btn-exit-impersonate"
              onClick={handleExitImpersonate}
              title="Return to Super Admin Account"
            >
              Exit to Super Admin ✕
            </button>
          </div>
        )}
      </div>

      <div className="navbar-center">
        <GlobalSearch />
      </div>

      <div className="navbar-right">
        <div className="navbar-actions">
          {isMobile && (
            <button
              className="navbar-action-btn"
              title="Search (Ctrl + K)"
              onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            >
              <FiSearch />
            </button>
          )}
          <ThemeToggle />
          <div style={{ position: 'relative' }}>
            <button
              className="navbar-action-btn"
              title="Notifications"
              onClick={() => setNotificationOpen(!notificationOpen)}
            >
              <FiBell />
              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationDropdown
              isOpen={notificationOpen}
              onClose={() => setNotificationOpen(false)}
            />
          </div>
          {!isMobile && (
            <button className="navbar-action-btn" title="Chat">
              <FiMessageCircle />
            </button>
          )}
        </div>

        <div className="user-menu" ref={userMenuRef}>
          <div
            className="user-avatar"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              getInitials(user?.name || 'U')
            )}
          </div>

          {userMenuOpen && (
            <div className="user-dropdown animate-fade-in">
              <div
                className="user-dropdown-item user-dropdown-profile"
                onClick={() => {
                  navigate('/employees/me');
                  setUserMenuOpen(false);
                }}
              >
                <FiUser />
                <div>
                  <div style={{ fontWeight: 600 }}>{user?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {user?.email}
                  </div>
                </div>
              </div>
              <div className="user-dropdown-item" onClick={() => { navigate('/subscription'); setUserMenuOpen(false); }}>
                <FiCreditCard />
                Subscription &amp; Plans
              </div>
              <div className="user-dropdown-item" onClick={() => { navigate('/settings/branding'); setUserMenuOpen(false); }}>
                <FiLayers />
                White-Label &amp; Brand
              </div>
              <div className="user-dropdown-item" onClick={() => navigate('/change-password')}>
                <FiLock />
                Change Password
              </div>
              <div className="user-dropdown-item" onClick={async () => {
                await logout();
                navigate('/login');
              }}>
                <FiLogOut />
                Logout
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {/* Mobile Search Overlay - Portaled to body to fix z-index issues */}
      {mobileSearchOpen && createPortal(
        <div className="mobile-search-overlay" onClick={() => setMobileSearchOpen(false)}>
          <div className="mobile-search-container" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-search-header">
              <GlobalSearch />
              <button
                className="mobile-search-close"
                onClick={() => setMobileSearchOpen(false)}
                aria-label="Close search"
              >
                ✕
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </nav>
  );
};

export default Navbar;

