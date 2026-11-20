import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowRight,
  FiCheckCircle,
  FiSearch,
  FiLayers,
  FiZap,
  FiShield,
  FiGlobe,
  FiCheck,
} from 'react-icons/fi';
import { useIndustrySuite } from '../../context/IndustrySuiteContext';
import { INDUSTRY_SUITES } from '../../constants/industrySuites';
import './IndustryHub.css';

const IndustryHub = () => {
  const { activeSuiteId, setSuite, isAllSuites } = useIndustrySuite();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  const filteredSuites = useMemo(() => {
    let list = INDUSTRY_SUITES;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.badge.toLowerCase().includes(q) ||
          s.tagline.toLowerCase().includes(q) ||
          s.highlights.some((h) => h.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search]);

  const handleLaunch = (suiteId, path) => {
    setSuite(suiteId, false);
    navigate(path);
  };

  const handleSetActive = (suiteId) => {
    setSuite(suiteId, false);
  };

  return (
    <div className="industry-hub-container animate-fade-in">
      {/* HERO BANNER */}
      <div className="industry-hub-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <FiZap />
            <span>Multi-Tenant Business Cloud</span>
          </div>
          <h1 className="hero-title">
            Industry Solutions & Business Verticals
          </h1>
          <p className="hero-subtitle">
            Radhix CRM powers 11 specialized business suites out-of-the-box. Select your primary vertical
            to personalize your daily dashboard, sales pipelines, and module access.
          </p>

          <div className="hero-search-wrapper">
            <FiSearch className="hero-search-icon" />
            <input
              type="text"
              placeholder="Search by industry (e.g. Real Estate, Coaching, Clinic, Restaurant, Salon, Gym)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Current Active Mode Banner */}
        <div className="active-mode-card">
          <div className="active-mode-header">
            <span className="mode-indicator-dot"></span>
            <span className="mode-label">Active Workspace</span>
          </div>
          <div className="active-mode-title">
            {isAllSuites ? (
              <>
                <span className="mode-emoji">🌐</span>
                <span>All Suites (Enterprise)</span>
              </>
            ) : (
              <>
                <span className="mode-emoji">
                  {INDUSTRY_SUITES.find((s) => s.id === activeSuiteId)?.emoji || '💼'}
                </span>
                <span>
                  {INDUSTRY_SUITES.find((s) => s.id === activeSuiteId)?.name || 'Custom'}
                </span>
              </>
            )}
          </div>
          <p className="active-mode-desc">
            {isAllSuites
              ? 'All 11 industry suites and core CRM/HRM modules are currently unlocked.'
              : 'Your workspace and sidebar are streamlined to focus on this vertical.'}
          </p>
          {!isAllSuites && (
            <button
              type="button"
              className="reset-mode-btn"
              onClick={() => setSuite('all', false)}
            >
              <FiGlobe />
              <span>Switch to All-in-One Enterprise Mode</span>
            </button>
          )}
        </div>
      </div>

      {/* METRICS STRIP */}
      <div className="hub-metrics-strip">
        <div className="metric-pill">
          <span className="metric-number">11</span>
          <span className="metric-text">Specialized Industry Suites</span>
        </div>
        <div className="metric-divider"></div>
        <div className="metric-pill">
          <span className="metric-number">100%</span>
          <span className="metric-text">Integrated with Core HRM & Finance</span>
        </div>
        <div className="metric-divider"></div>
        <div className="metric-pill">
          <span className="metric-number">SaaS</span>
          <span className="metric-text">Multi-Tenant Tenant Switching</span>
        </div>
        <div className="metric-divider"></div>
        <div className="metric-pill">
          <span className="metric-number">Enterprise</span>
          <span className="metric-text">Role-Based Granular Permissions</span>
        </div>
      </div>

      {/* INDUSTRY SUITES GRID */}
      <div className="hub-suites-grid">
        {filteredSuites.map((suite) => {
          const isActive = activeSuiteId === suite.id;
          const IconComponent = suite.icon;

          return (
            <div
              key={suite.id}
              className={`hub-suite-card ${isActive ? 'is-active-card' : ''}`}
            >
              {isActive && (
                <div className="active-ribbon">
                  <FiCheck /> Active Vertical
                </div>
              )}

              <div className="suite-card-header">
                <div
                  className="suite-card-icon"
                  style={{ backgroundColor: suite.bgLight, color: suite.color }}
                >
                  <span className="suite-card-emoji">{suite.emoji}</span>
                </div>
                <div className="suite-card-title-group">
                  <span
                    className="suite-card-badge"
                    style={{ color: suite.color, borderColor: `${suite.color}40` }}
                  >
                    {suite.badge}
                  </span>
                  <h3 className="suite-card-title">{suite.name}</h3>
                </div>
              </div>

              <p className="suite-card-tagline">{suite.tagline}</p>

              <div className="suite-features-list">
                <div className="features-header">Core Capabilities:</div>
                {suite.highlights.slice(0, 4).map((highlight, index) => (
                  <div key={index} className="feature-item">
                    <FiCheckCircle
                      className="feature-check"
                      style={{ color: suite.color }}
                    />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>

              <div className="suite-card-actions">
                <button
                  type="button"
                  className="btn-launch"
                  style={{ backgroundColor: suite.color }}
                  onClick={() => handleLaunch(suite.id, suite.defaultPath)}
                >
                  <span>Launch Workspace</span>
                  <FiArrowRight />
                </button>

                <button
                  type="button"
                  className={`btn-set-active ${isActive ? 'active' : ''}`}
                  onClick={() => handleSetActive(suite.id)}
                  title="Make this your primary active vertical"
                >
                  {isActive ? 'Current Vertical' : 'Set as Active'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSuites.length === 0 && (
        <div className="hub-empty-results">
          <FiLayers className="empty-icon" />
          <h3>No matching industry found</h3>
          <p>Try searching with another keyword like &quot;Realty&quot;, &quot;Gym&quot;, or &quot;Medical&quot;.</p>
          <button
            type="button"
            className="btn-clear-search"
            onClick={() => setSearch('')}
          >
            Clear Search Filter
          </button>
        </div>
      )}
    </div>
  );
};

export default IndustryHub;

