import React from 'react';
import { FiCheckCircle, FiTrendingUp, FiClock, FiCalendar, FiInfo } from 'react-icons/fi';

/**
 * Summary Box Component
 * Displays summary statistics for leave balance
 */
const SummaryBox = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon = FiInfo, 
  color = 'var(--primary)',
  background = 'var(--surface)',
  gradient = false
}) => {
  const boxStyle = gradient 
    ? {
        padding: '20px',
        background: `linear-gradient(135deg, ${color} 0%, var(--primary-dark, ${color}) 100%)`,
        color: 'white',
        borderRadius: '12px'
      }
    : {
        padding: '20px',
        background,
        border: '1px solid var(--border)',
        borderRadius: '12px'
      };

  const iconColor = gradient ? 'white' : color;
  const textColor = gradient ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)';
  const valueColor = gradient ? 'white' : color;

  return (
    <div className="card" style={boxStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', color: textColor, opacity: gradient ? 0.9 : 1 }}>
          {title}
        </span>
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div style={{ fontSize: '32px', fontWeight: 700, color: valueColor, lineHeight: 1 }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '12px', color: textColor, marginTop: '4px', opacity: gradient ? 0.8 : 1 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default SummaryBox;
