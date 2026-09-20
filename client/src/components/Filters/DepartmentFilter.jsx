import { useState, useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

/**
 * Department Filter Component
 * Multi-select dropdown for department filtering
 */
const DepartmentFilter = ({ 
  value = [], 
  onChange, 
  departments = ['IT', 'HR', 'Finance', 'Sales', 'Management', 'Operations'],
  multiSelect = true,
  placeholder = 'All Departments',
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (dept) => {
    if (multiSelect) {
      const newValue = value.includes(dept)
        ? value.filter(d => d !== dept)
        : [...value, dept];
      onChange(newValue);
    } else {
      onChange(value.includes(dept) ? [] : [dept]);
      setIsOpen(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  const displayValue = value.length === 0 
    ? placeholder 
    : value.length === 1 
    ? value[0] 
    : `${value.length} departments`;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', ...style }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="form-select"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: '150px',
          width: '100%',
          cursor: 'pointer',
          ...style,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayValue}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {value.length > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleClear(e);
              }}
              style={{
                background: 'var(--error, #f44336)',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              ×
            </span>
          )}
          <FiChevronDown style={{ marginLeft: '4px' }} />
        </div>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: 'var(--background, #fff)',
            border: '1px solid var(--border, #e0e0e0)',
            borderRadius: 'var(--radius, 8px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          {departments.map((dept) => (
            <label
              key={dept}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 16px',
                cursor: 'pointer',
                backgroundColor: value.includes(dept)
                  ? 'var(--primary-light, #e3f2fd)'
                  : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!value.includes(dept)) {
                  e.currentTarget.style.backgroundColor = 'var(--surface, #f5f5f5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!value.includes(dept)) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <input
                type={multiSelect ? 'checkbox' : 'radio'}
                checked={value.includes(dept)}
                onChange={() => handleToggle(dept)}
                style={{ marginRight: '10px', cursor: 'pointer' }}
              />
              <span>{dept}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default DepartmentFilter;

