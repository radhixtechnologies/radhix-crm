import { FiTrendingUp, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import '../../styles/leaveReports.css';

/**
 * Leave Summary Card Component
 * Displays a summary statistic card
 */
const LeaveSummaryCard = ({ title, value, subtitle, icon, color = 'primary', trend }) => {
  const IconComponent = icon || FiTrendingUp;
  
  const colorClasses = {
    primary: 'summary-card-primary',
    success: 'summary-card-success',
    warning: 'summary-card-warning',
    error: 'summary-card-error',
    info: 'summary-card-info',
  };

  return (
    <div className={`summary-card ${colorClasses[color] || colorClasses.primary}`}>
      <div className="summary-card-content">
        <div className="summary-card-icon">
          <IconComponent size={24} />
        </div>
        <div className="summary-card-text">
          <h3 className="summary-card-title">{title}</h3>
          <p className="summary-card-value">{value}</p>
          {subtitle && <p className="summary-card-subtitle">{subtitle}</p>}
          {trend && (
            <div className="summary-card-trend">
              <FiTrendingUp size={14} />
              <span>{trend}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveSummaryCard;

