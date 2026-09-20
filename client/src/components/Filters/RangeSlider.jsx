import { useState, useEffect } from 'react';

/**
 * Range Slider Component
 * Dual-handle slider for min-max range selection (salary, experience, hours, etc.)
 */
const RangeSlider = ({ 
  min = 0, 
  max = 100, 
  value = [min, max], 
  onChange, 
  label,
  formatValue = (val) => val,
  step = 1,
  style = {}
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleMinChange = (e) => {
    const newMin = Math.min(parseFloat(e.target.value), localValue[1]);
    const newValue = [newMin, localValue[1]];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleMaxChange = (e) => {
    const newMax = Math.max(parseFloat(e.target.value), localValue[0]);
    const newValue = [localValue[0], newMax];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const minPercent = ((localValue[0] - min) / (max - min)) * 100;
  const maxPercent = ((localValue[1] - min) / (max - min)) * 100;

  return (
    <div style={{ width: '100%', ...style }}>
      {label && (
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', padding: '20px 0' }}>
        {/* Track */}
        <div
          style={{
            position: 'absolute',
            height: '4px',
            width: '100%',
            background: 'var(--border, #e0e0e0)',
            borderRadius: '2px',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          {/* Active range */}
          <div
            style={{
              position: 'absolute',
              height: '4px',
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
              background: 'var(--primary, #1976d2)',
              borderRadius: '2px',
            }}
          />
        </div>

        {/* Min slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[0]}
          onChange={handleMinChange}
          style={{
            position: 'absolute',
            width: '100%',
            height: '4px',
            top: '50%',
            transform: 'translateY(-50%)',
            appearance: 'none',
            background: 'transparent',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* Max slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[1]}
          onChange={handleMaxChange}
          style={{
            position: 'absolute',
            width: '100%',
            height: '4px',
            top: '50%',
            transform: 'translateY(-50%)',
            appearance: 'none',
            background: 'transparent',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      </div>

      {/* Value display */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <span>{formatValue(localValue[0])}</span>
        <span>{formatValue(localValue[1])}</span>
      </div>
    </div>
  );
};

export default RangeSlider;

