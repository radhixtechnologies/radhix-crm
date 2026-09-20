import { FiX } from 'react-icons/fi';

/**
 * Filter Chip Component
 * Displays an active filter as a removable chip/pill
 */
const FilterChip = ({ label, value, onRemove, variant = 'default' }) => {
  const variantStyles = {
    default: {
      background: 'var(--primary-light, #e3f2fd)',
      color: 'var(--primary, #1976d2)',
      border: '1px solid var(--primary, #1976d2)',
    },
    success: {
      background: 'var(--success-light, #e8f5e9)',
      color: 'var(--success, #4caf50)',
      border: '1px solid var(--success, #4caf50)',
    },
    warning: {
      background: 'var(--warning-light, #fff3e0)',
      color: 'var(--warning, #ff9800)',
      border: '1px solid var(--warning, #ff9800)',
    },
    info: {
      background: 'var(--info-light, #e1f5fe)',
      color: 'var(--info, #00bcd4)',
      border: '1px solid var(--info, #00bcd4)',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: 500,
        ...style,
        cursor: 'default',
        margin: '4px',
      }}
    >
      <span>{label}:</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            marginLeft: '4px',
            display: 'flex',
            alignItems: 'center',
            color: 'inherit',
            opacity: 0.8,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
        >
          <FiX size={14} />
        </button>
      )}
    </div>
  );
};

export default FilterChip;

