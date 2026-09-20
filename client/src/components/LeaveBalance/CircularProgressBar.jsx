import React from 'react';

/**
 * Circular Progress Bar Component
 * Displays a circular progress indicator for leave balance
 */
const CircularProgressBar = ({ 
  percentage, 
  size = 80, 
  strokeWidth = 6, 
  color = 'var(--primary)',
  label,
  showLabel = true 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Determine color based on percentage
  let progressColor = color;
  if (percentage <= 0) {
    progressColor = 'var(--error)';
  } else if (percentage < 20) {
    progressColor = 'var(--warning)';
  } else if (percentage < 50) {
    progressColor = 'var(--info)';
  } else {
    progressColor = 'var(--success)';
  }

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ 
            transition: 'stroke-dashoffset 0.5s ease',
            transition: 'stroke 0.3s ease'
          }}
        />
      </svg>
      {/* Center label */}
      {showLabel && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            fontSize: size * 0.25, 
            fontWeight: 700, 
            color: progressColor,
            lineHeight: 1 
          }}>
            {Math.round(percentage)}%
          </div>
          {label && (
            <div style={{ 
              fontSize: size * 0.12, 
              color: 'var(--text-secondary)',
              marginTop: '2px'
            }}>
              {label}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CircularProgressBar;
