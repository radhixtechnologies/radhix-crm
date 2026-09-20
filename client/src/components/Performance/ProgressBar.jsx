import '../../styles/performance.css';

/**
 * Progress Bar Component
 * Reusable progress bar
 */
const ProgressBar = ({ progress, color, showLabel = true, height = 8 }) => {
  const getProgressColor = (progress) => {
    if (color) return color;
    if (progress >= 100) return 'var(--success)';
    if (progress >= 75) return 'var(--info)';
    if (progress >= 50) return 'var(--warning)';
    return 'var(--error)';
  };

  return (
    <div className="progress-bar-container">
      {showLabel && (
        <div className="progress-bar-label">
          <span>{progress}%</span>
        </div>
      )}
      <div className="progress-bar" style={{ height: `${height}px` }}>
        <div
          className="progress-fill"
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor: getProgressColor(progress),
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

