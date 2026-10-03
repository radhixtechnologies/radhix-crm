import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { FiSearch, FiAward, FiUsers, FiCheckCircle, FiTrendingUp, FiFilter, FiChevronDown, FiChevronUp, FiExternalLink, FiPlus, FiXCircle, FiBook } from 'react-icons/fi';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import Modal from '../../../components/common/Modal';
import MySkills from './MySkills';
import '../../../styles/hrm/skills.css';

const SkillMatrix = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // If user is not admin/super_admin, render MySkills directly
  if (user && user.role !== 'admin' && user.role !== 'super_admin') {
    return <MySkills />;
  }

  const [matrix, setMatrix] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  // Modal State
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Split state for Search (Instant/Debounced) vs Filters (Manual Apply)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // UI State for inputs
  const [filterInputs, setFilterInputs] = useState({
    skillName: '',
    category: '',
    proficiency: '',
    verified: ''
  });

  // API State for active filters
  const [activeFilters, setActiveFilters] = useState({
    skillName: '',
    category: '',
    proficiency: '',
    verified: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const buttonRef = useRef(null);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setInitialLoading(true);
      else setLoading(true);
      setAccessDenied(false);

      const params = {
        search: debouncedSearch,
        ...activeFilters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const res = await hrmService.getSkillMatrix(params);
      setMatrix(res.data.data || {});

    } catch (e) {
      if (e?.response?.status === 403) {
        setAccessDenied(true);
      } else {
        setError(e?.response?.data?.message || e.message);
      }
    } finally {
      if (isInitialLoad) setInitialLoading(false);
      else setLoading(false);
    }
  }, [debouncedSearch, activeFilters]);

  // Initial load
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      fetchData(true);
    }
  }, [user, fetchData]);

  // Fetch when Debounced Search OR Active Filters change
  useEffect(() => {
    if (!initialLoading && user && (user.role === 'admin' || user.role === 'super_admin')) {
      fetchData(false);
    }
  }, [debouncedSearch, activeFilters, fetchData, initialLoading, user]);

  const handleApplyFilters = () => {
    setActiveFilters(filterInputs);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const resetState = { skillName: '', category: '', proficiency: '', verified: '' };
    setFilterInputs(resetState);
    setActiveFilters(resetState);
    setSearchQuery('');
  };

  const getActiveCount = () => {
    let count = 0;
    if (filterInputs.skillName) count++;
    if (filterInputs.category) count++;
    if (filterInputs.proficiency) count++;
    if (filterInputs.verified) count++;
    return count;
  };

  // Helper Functions
  const getProficiencyColor = (level) => {
    if (level >= 8) return '#10b981'; // Expert - green
    if (level >= 6) return '#3b82f6'; // Advanced - blue
    if (level >= 4) return '#f59e0b'; // Intermediate - orange
    return '#6b7280'; // Beginner - gray
  };

  const handleViewDetails = (skill) => {
    setSelectedSkill(skill);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSkill(null);
  };

  // Process data for the grid
  const skills = [];

  Object.keys(matrix).forEach(skillName => {
    const entries = matrix[skillName];
    if (Array.isArray(entries) && entries.length > 0) {
      // Calculate aggregated stats
      const totalUsers = entries.length;
      const avgProficiency = Math.round(entries.reduce((acc, curr) => acc + (curr.proficiencyLevel || 0), 0) / totalUsers * 10) / 10;
      const verifiedCount = entries.filter(e => e.verified).length;
      /* 
         Assuming the first entry has basic skill info if available, 
         or just taking department as a proxy for category if backend doesn't provide category directly.
         Ideally, the backend should provide the skill category. 
         Here we fallback to 'General' or department if we must.
      */
      const category = entries[0].employee?.department || 'General';

      skills.push({
        name: skillName,
        count: totalUsers,
        avgProficiency,
        verifiedCount,
        category,
        users: entries
      });
    }
  });

  // Calculate stats
  const stats = {
    total: skills.length,
    employees: skills.reduce((acc, skill) => acc + skill.count, 0),
    verified: skills.reduce((acc, skill) => acc + skill.verifiedCount, 0),
    avgProficiency: skills.length > 0
      ? Math.round(skills.reduce((acc, skill) => acc + skill.avgProficiency, 0) / skills.length * 10) / 10
      : 0
  };

  if (accessDenied) return <MySkills />;
  if (initialLoading) return <Loader />;

  return (
    <div className="employee-list-page">
      {/* Header Row */}
      <div className="employee-page-header">
        <div className="header-title-group">
          <h1 className="page-title">Skill Matrix</h1>
          <p className="page-subtitle">Overview of organizational skills and competency levels</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/hrm/skills/add')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FiPlus /> Add New Skill
          </button>

          <button
            ref={buttonRef}
            className="btn filter-btn-mobile"
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '8px',
              minWidth: '100px',
              justifyContent: 'center',
              background: showFilters ? '#eff6ff' : 'white',
              border: showFilters ? '1px solid #3b82f6' : '1px solid #d1d5db',
              color: showFilters ? '#2563eb' : '#374151',
              transition: 'all 0.2s'
            }}
          >
            <FiFilter style={{ color: showFilters ? '#2563eb' : '#6b7280' }} />
            <span style={{ fontWeight: 500 }}>Filters</span>
            {showFilters ? <FiChevronUp /> : <FiChevronDown />}
            {(getActiveCount() > 0) && (
              <span style={{
                background: '#3b82f6',
                color: 'white',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 700
              }}>
                {getActiveCount()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiAward style={{ color: 'white', width: '20px', height: '20px' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{stats.total}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Skills</div>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiUsers style={{ color: 'white', width: '20px', height: '20px' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{stats.employees}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Employees</div>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiCheckCircle style={{ color: 'white', width: '20px', height: '20px' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{stats.verified}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Verified Skills</div>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiTrendingUp style={{ color: 'white', width: '20px', height: '20px' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{stats.avgProficiency}/10</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Avg Proficiency</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar Section (Mobile) */}
      <div className="search-bar-section" style={{ marginBottom: '16px', display: 'none' }}>
        <div className="toolbar-search" style={{ margin: 0, width: '100%', maxWidth: '280px' }}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Toolbar Container - Relative for Filter Panel positioning */}
      <div style={{ position: 'relative', zIndex: 50 }}>
        {/* 1. Main Toolbar Row (Desktop) */}
        <div className="toolbar-desktop">
          {/* Left: Search & Filter Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="toolbar-search" style={{ margin: 0, width: '280px' }}>
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              ref={buttonRef}
              className="btn btn-secondary filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '100px',
                justifyContent: 'center',
                background: showFilters ? '#eff6ff' : 'white',
                border: showFilters ? '1px solid #3b82f6' : '1px solid #d1d5db',
                color: showFilters ? '#2563eb' : '#374151',
                transition: 'all 0.2s',
                height: '40px', // Match input height
                padding: '0 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              <FiFilter style={{ color: showFilters ? '#2563eb' : '#6b7280' }} />
              <span>Filters</span>
              {showFilters ? <FiChevronUp /> : <FiChevronDown />}
              {(getActiveCount() > 0) && (
                <span style={{
                  background: '#3b82f6',
                  color: 'white',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 700
                }}>
                  {getActiveCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 2. Filter Panel (Absolute Overlay) */}
        {showFilters && (
          <div className="filter-panel-overlay fade-in" ref={filterRef} style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            width: '100%',
            background: '#f9fafb',
            padding: '24px',
            marginTop: '8px',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <div className="filter-options-container" style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', width: '100%', flexWrap: 'wrap' }}>

              {/* Filter: Category */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</label>
                <div style={{ position: 'relative', width: '180px' }}>
                  <select
                    value={filterInputs.category}
                    onChange={(e) => setFilterInputs({ ...filterInputs, category: e.target.value })}
                    style={{
                      appearance: 'none',
                      width: '100%',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '0 32px 0 12px',
                      fontSize: '13px',
                      color: '#374151',
                      height: '38px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">All Categories</option>
                    <option value="technical">Technical</option>
                    <option value="soft-skills">Soft Skills</option>
                    <option value="language">Language</option>
                    <option value="domain">Domain</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Filter: Proficiency */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Proficiency</label>
                <div style={{ position: 'relative', width: '180px' }}>
                  <select
                    value={filterInputs.proficiency}
                    onChange={(e) => setFilterInputs({ ...filterInputs, proficiency: e.target.value })}
                    style={{
                      appearance: 'none',
                      width: '100%',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '0 32px 0 12px',
                      fontSize: '13px',
                      color: '#374151',
                      height: '38px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">All Levels</option>
                    <option value="beginner">Beginner (1-3)</option>
                    <option value="intermediate">Intermediate (4-6)</option>
                    <option value="advanced">Advanced (7-9)</option>
                    <option value="expert">Expert (10)</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Filter: Verification */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verification</label>
                <div style={{ position: 'relative', width: '160px' }}>
                  <select
                    value={filterInputs.verified}
                    onChange={(e) => setFilterInputs({ ...filterInputs, verified: e.target.value })}
                    style={{
                      appearance: 'none',
                      width: '100%',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '0 32px 0 12px',
                      fontSize: '13px',
                      color: '#374151',
                      height: '38px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">All</option>
                    <option value="verified">Verified Only</option>
                    <option value="unverified">Unverified Only</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', height: '38px' }}>
                <button
                  onClick={handleClearFilters}
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#6b7280',
                    background: 'transparent',
                    border: '1px solid transparent',
                    cursor: 'pointer',
                    padding: '0 12px',
                    borderRadius: '6px',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#111827';
                    e.currentTarget.style.background = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Clear All
                </button>
                <button
                  onClick={handleApplyFilters}
                  style={{
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  Apply
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        {loading && <div style={{ padding: '20px', textAlign: 'center' }}><Loader /></div>}

        {skills.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <FiAward size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No skills found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Check back later or try different filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {skills.map((skill, index) => (
              <div key={index} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }}>

                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', margin: 0, flex: 1 }}>{skill.name}</h3>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '500',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap'
                  }}>
                    {skill.category || 'Skill'}
                  </span>
                </div>

                {/* Description */}
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
                  Overview of {skill.name} proficiency across {skill.count} employees.
                </p>

                {/* Meta Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <FiBook size={14} style={{ color: '#94a3b8' }} />
                    <span>Avg. Level: <strong>{skill.avgProficiency}/10</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <FiUsers size={14} style={{ color: '#94a3b8' }} />
                    <span><strong>{skill.count}</strong> employees</span>
                  </div>

                  {/* Proficiency Bar */}
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', width: '100%', marginTop: '4px' }}>
                    <div style={{
                      width: `${(skill.avgProficiency || 0) * 10}%`,
                      background: getProficiencyColor(skill.avgProficiency || 0),
                      height: '100%'
                    }} />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleViewDetails(skill)}
                    style={{ flex: 1 }}
                  >
                    View Details
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{ flex: 1, color: 'white', background: '#2563eb', border: '1px solid #2563eb' }}
                    onClick={() => navigate(`/hrm/skills/${skill._id || 'details'}`)}
                  >
                    Edit
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
      {/* Skill Details Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedSkill ? `${selectedSkill.name} - Employee List` : 'Skill Details'}>
        {selectedSkill && (
          <div className="skill-employees-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
              <div style={{ flex: 2 }}>Employee</div>
              <div style={{ flex: 1 }}>Proficiency</div>
              <div style={{ flex: 1, textAlign: 'center' }}>Verified</div>
              <div style={{ width: '80px' }}></div>
            </div>

            {selectedSkill.users.map((entry, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #f3f4f6'
              }}>
                <div style={{ flex: 2 }}>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{entry.employee?.user?.name || 'Unknown'}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{entry.employee?.department || 'N/A'}</div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, color: getProficiencyColor(entry.proficiencyLevel) }}>{entry.proficiencyLevel}</span>
                    <div style={{ height: '4px', background: '#e5e7eb', width: '50px', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(entry.proficiencyLevel || 0) * 10}%`, background: getProficiencyColor(entry.proficiencyLevel) }}></div>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  {entry.verified ? (
                    <FiCheckCircle color="#10b981" />
                  ) : (
                    <FiXCircle color="#e5e7eb" />
                  )}
                </div>

                <div style={{ width: '80px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-sm"
                    onClick={() => navigate(`/hrm/employees/${entry.employee?._id}`)}
                    style={{
                      background: 'white',
                      border: '1px solid #d1d5db',
                      color: '#374151',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px'
                    }}
                  >
                    Profile <FiExternalLink />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default SkillMatrix;
