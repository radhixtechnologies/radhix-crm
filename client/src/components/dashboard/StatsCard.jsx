import { FiUsers, FiDollarSign, FiTrendingUp, FiBriefcase, FiCalendar, FiClock } from 'react-icons/fi';
import '../../styles/dashboard/stats-card.css';

const StatsCard = ({ title, value, subtitle, icon, color = '#6366f1', onClick }) => {
  const IconComponent = icon || FiUsers;

  return (
    <div
      className="stat-card hover-lift"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
        }
      }}
    >
      <div className="stat-card-header">
        <div>
          <div className="stat-title">{title}</div>
          <div className="stat-value">{value}</div>
          {subtitle && (
            <div className="stat-change">
              <span>{subtitle}</span>
            </div>
          )}
        </div>
        <div className="stat-icon" style={{ backgroundColor: `${color}20`, color }}>
          <IconComponent size={32} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;

