import { useState } from 'react';
import { FiX, FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import DepartmentFilter from './DepartmentFilter';
import DateRangeFilter from './DateRangeFilter';
import RangeSlider from './RangeSlider';

/**
 * Advanced Filter Drawer Component
 * Enterprise-level filter panel with multiple filter types
 */
const FilterDrawer = ({
  isOpen,
  onClose,
  filters = {},
  onFilterChange,
  filterConfig = {},
  style = {},
}) => {
  const {
    departments = ['IT', 'HR', 'Finance', 'Sales', 'Management', 'Operations'],
    showDepartment = true,
    showDateRange = true,
    showRangeSliders = true,
    showStatusFilter = true,
    showPriorityFilter = false,
    showSkillsFilter = false,
    showLocationFilter = false,
    showManagerFilter = false,
    customFilters = [],
  } = filterConfig;

  const [expandedSections, setExpandedSections] = useState({
    department: true,
    dates: true,
    ranges: false,
    other: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleFilterUpdate = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const handleClearAll = () => {
    const clearedFilters = {};
    Object.keys(filters).forEach(key => {
      clearedFilters[key] = Array.isArray(filters[key]) ? [] : '';
    });
    onFilterChange(clearedFilters);
  };

  const activeFilterCount = Object.values(filters).filter(
    v => (Array.isArray(v) && v.length > 0) || (!Array.isArray(v) && v !== '' && v !== null && v !== undefined)
  ).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '400px',
          maxWidth: '90vw',
          background: 'var(--background, #fff)',
          boxShadow: '-4px 0 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ...style,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid var(--border, #e0e0e0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FiFilter size={20} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Advanced Filters</h3>
            {activeFilterCount > 0 && (
              <span
                style={{
                  background: 'var(--primary, #1976d2)',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearAll}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '12px' }}
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
          }}
        >
          {/* Department Filter */}
          {showDepartment && (
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  cursor: 'pointer',
                }}
                onClick={() => toggleSection('department')}
              >
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Department</h4>
                {expandedSections.department ? (
                  <FiChevronUp size={16} />
                ) : (
                  <FiChevronDown size={16} />
                )}
              </div>
              {expandedSections.department && (
                <DepartmentFilter
                  value={filters.department || []}
                  onChange={(value) => handleFilterUpdate('department', value)}
                  departments={departments}
                />
              )}
            </div>
          )}

          {/* Date Range Filter */}
          {showDateRange && (
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  cursor: 'pointer',
                }}
                onClick={() => toggleSection('dates')}
              >
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Date Range</h4>
                {expandedSections.dates ? (
                  <FiChevronUp size={16} />
                ) : (
                  <FiChevronDown size={16} />
                )}
              </div>
              {expandedSections.dates && (
                <DateRangeFilter
                  startDate={filters.startDate || filters.joiningDateStart || ''}
                  endDate={filters.endDate || filters.joiningDateEnd || ''}
                  onStartDateChange={(value) => {
                    if (filterConfig.dateField === 'joiningDate') {
                      handleFilterUpdate('joiningDateStart', value);
                    } else {
                      handleFilterUpdate('startDate', value);
                    }
                  }}
                  onEndDateChange={(value) => {
                    if (filterConfig.dateField === 'joiningDate') {
                      handleFilterUpdate('joiningDateEnd', value);
                    } else {
                      handleFilterUpdate('endDate', value);
                    }
                  }}
                />
              )}
            </div>
          )}

          {/* Range Sliders */}
          {showRangeSliders && (
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  cursor: 'pointer',
                }}
                onClick={() => toggleSection('ranges')}
              >
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Ranges</h4>
                {expandedSections.ranges ? (
                  <FiChevronUp size={16} />
                ) : (
                  <FiChevronDown size={16} />
                )}
              </div>
              {expandedSections.ranges && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {filterConfig.salaryRange && (
                    <RangeSlider
                      label="Salary Range"
                      min={filterConfig.salaryRange.min || 0}
                      max={filterConfig.salaryRange.max || 200000}
                      value={[
                        filters.salaryMin || filterConfig.salaryRange.min || 0,
                        filters.salaryMax || filterConfig.salaryRange.max || 200000,
                      ]}
                      onChange={([min, max]) => {
                        handleFilterUpdate('salaryMin', min);
                        handleFilterUpdate('salaryMax', max);
                      }}
                      formatValue={(val) => `$${val.toLocaleString()}`}
                      step={1000}
                    />
                  )}
                  {filterConfig.experienceRange && (
                    <RangeSlider
                      label="Experience (Years)"
                      min={filterConfig.experienceRange.min || 0}
                      max={filterConfig.experienceRange.max || 20}
                      value={[
                        filters.experienceMin || filterConfig.experienceRange.min || 0,
                        filters.experienceMax || filterConfig.experienceRange.max || 20,
                      ]}
                      onChange={([min, max]) => {
                        handleFilterUpdate('experienceMin', min);
                        handleFilterUpdate('experienceMax', max);
                      }}
                      formatValue={(val) => `${val} yrs`}
                      step={0.5}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status Filter */}
          {showStatusFilter && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>
                Status
              </label>
              <select
                className="form-select"
                value={filters.status || ''}
                onChange={(e) => handleFilterUpdate('status', e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">All Status</option>
                {filterConfig.statusOptions?.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Priority Filter */}
          {showPriorityFilter && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>
                Priority
              </label>
              <select
                className="form-select"
                value={filters.priority || ''}
                onChange={(e) => handleFilterUpdate('priority', e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">All Priorities</option>
                {filterConfig.priorityOptions?.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Filters */}
          {customFilters.map((filter, index) => (
            <div key={index} style={{ marginBottom: '24px' }}>
              {filter.component && filter.component(filters, handleFilterUpdate)}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border, #e0e0e0)',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}
        >
          <button className="btn btn-secondary" onClick={handleClearAll}>
            Clear All
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterDrawer;

