import { useState, useEffect } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';
import '../../styles/leaveReports.css';

/**
 * Leave Filters Component
 * Provides filtering options for leave reports
 */
const LeaveFilters = ({ onFilterChange, departments = [], employees = [] }) => {
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    department: '',
    status: '',
    type: '',
    employeeId: '',
    startDate: '',
    endDate: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters]);

  const handleChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      year: new Date().getFullYear(),
      department: '',
      status: '',
      type: '',
      employeeId: '',
      startDate: '',
      endDate: '',
    });
  };

  const hasActiveFilters = filters.department || filters.status || filters.type || filters.employeeId || filters.startDate || filters.endDate;

  return (
    <div className="filters-container">
      <div className="filters-header">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FiFilter /> {showFilters ? 'Hide' : 'Show'} Filters
        </button>
        {hasActiveFilters && (
          <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
            <FiX /> Clear Filters
          </button>
        )}
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label>Year</label>
              <select
                value={filters.year}
                onChange={(e) => handleChange('year', e.target.value)}
                className="form-select"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {departments.length > 0 && (
              <div className="filter-group">
                <label>Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  className="form-select"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="form-select"
              >
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Leave Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="form-select"
              >
                <option value="">All Types</option>
                <option value="casual">Casual</option>
                <option value="sick">Sick</option>
                <option value="annual">Annual</option>
                <option value="maternity">Maternity</option>
                <option value="paternity">Paternity</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            {employees.length > 0 && (
              <div className="filter-group">
                <label>Employee</label>
                <select
                  value={filters.employeeId}
                  onChange={(e) => handleChange('employeeId', e.target.value)}
                  className="form-select"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.user?.name || emp.employeeId} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="filter-group">
              <label>End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveFilters;

