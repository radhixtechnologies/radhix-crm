import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiChevronDown,
  FiCheck,
  FiSearch,
  FiGrid,
  FiExternalLink,
  FiLayers,
} from 'react-icons/fi';
import { useIndustrySuite } from '../../context/IndustrySuiteContext';
import { useAuth } from '../../context/AuthContext';
import './IndustrySuiteSwitcher.css';

const IndustrySuiteSwitcher = () => {
  const { activeSuiteId, currentSuite, availableSuites, setSuite, isAllSuites, isSingleSuiteTenant } = useIndustrySuite();
  const { isSuperAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const filteredSuites = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return availableSuites;
    return availableSuites.filter(
      (suite) =>
        suite.name.toLowerCase().includes(query) ||
        suite.shortName.toLowerCase().includes(query) ||
        suite.badge.toLowerCase().includes(query) ||
        suite.tagline.toLowerCase().includes(query)
    );
  }, [availableSuites, searchQuery]);

  const handleSelectSuite = (suiteId) => {
    setSuite(suiteId, true);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleButtonClick = () => {
    if (isSingleSuiteTenant) {
      // Single suite tenant: navigate directly to their suite
      if (currentSuite?.defaultPath) {
        navigate(currentSuite.defaultPath);
      }
    } else {
      setIsOpen((prev) => !prev);
    }
  };

  const activeLabel = isAllSuites
    ? 'All Business Suites'
    : currentSuite?.shortName
    ? `${currentSuite.shortName} Suite`
    : 'Select Suite';

  const activeSubtitle = isSingleSuiteTenant
    ? 'Licensed Suite'
    : 'Business Suite';

  const activeEmoji = isAllSuites ? '🌐' : currentSuite?.emoji || '💼';

  return (
    <div className="industry-switcher-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`industry-switcher-btn ${isOpen ? 'open' : ''} ${!isAllSuites ? 'has-active' : ''}`}
        onClick={handleButtonClick}
        title={isSingleSuiteTenant ? `Open ${activeLabel}` : 'Switch Business Vertical'}
        aria-expanded={isOpen}
      >
        <span className="switcher-emoji">{activeEmoji}</span>
        <div className="switcher-text-block">
          <span className="switcher-subtitle">{activeSubtitle}</span>
          <span className="switcher-title">{activeLabel}</span>
        </div>
        {!isSingleSuiteTenant && (
          <FiChevronDown className={`switcher-arrow ${isOpen ? 'rotated' : ''}`} />
        )}
      </button>

      {isOpen && !isSingleSuiteTenant && (
        <div className="industry-switcher-dropdown animate-fade-in">
          <div className="switcher-dropdown-header">
            <div className="switcher-header-title">
              <FiLayers className="header-icon" />
              <div>
                <h4>Switch Business Vertical</h4>
                <p>Select your active industry to customize workspace menus</p>
              </div>
            </div>

            <div className="switcher-search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search industry suites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="switcher-suites-list">
            {/* All-in-One Multi-Business Mode - only for SuperAdmin */}
            {isSuperAdmin && (
              <div
                className={`switcher-suite-item ${isAllSuites ? 'active' : ''}`}
                onClick={() => handleSelectSuite('all')}
              >
                <div className="suite-item-icon-box enterprise">
                  <span className="suite-emoji">🌐</span>
                </div>
                <div className="suite-item-details">
                  <div className="suite-item-title-row">
                    <span className="suite-name">All Business Suites (Enterprise)</span>
                    <span className="suite-badge enterprise">SuperAdmin View</span>
                  </div>
                  <p className="suite-tagline">
                    Full cross-tenant view with all 11 business verticals accessible
                  </p>
                </div>
                {isAllSuites && <FiCheck className="suite-check-icon" />}
              </div>
            )}

            <div className="switcher-divider-label">
              {isSuperAdmin ? 'Specialized Industry Suites' : 'Your Subscribed Suites'}
            </div>

            {filteredSuites.map((suite) => {
              const isCurrent = activeSuiteId === suite.id;
              return (
                <div
                  key={suite.id}
                  className={`switcher-suite-item ${isCurrent ? 'active' : ''}`}
                  onClick={() => handleSelectSuite(suite.id)}
                >
                  <div
                    className="suite-item-icon-box"
                    style={{ backgroundColor: suite.bgLight, color: suite.color }}
                  >
                    <span className="suite-emoji">{suite.emoji}</span>
                  </div>
                  <div className="suite-item-details">
                    <div className="suite-item-title-row">
                      <span className="suite-name">{suite.name}</span>
                      <span
                        className="suite-badge"
                        style={{ color: suite.color, borderColor: `${suite.color}40` }}
                      >
                        {suite.badge}
                      </span>
                    </div>
                    <p className="suite-tagline">{suite.tagline}</p>
                  </div>
                  {isCurrent && <FiCheck className="suite-check-icon" />}
                </div>
              );
            })}

            {filteredSuites.length === 0 && (
              <div className="switcher-empty">
                <p>No industry suite found matching &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </div>

          {isSuperAdmin && (
            <div className="switcher-dropdown-footer">
              <button
                type="button"
                className="hub-launch-link"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/industry-hub');
                }}
              >
                <FiGrid />
                <span>Explore All 11 Suites in Industry Hub</span>
                <FiExternalLink />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IndustrySuiteSwitcher;
