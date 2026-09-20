import { useNavigate } from 'react-router-dom';
import {
  FiCalendar,
  FiClock,
  FiEdit,
  FiBriefcase,
} from 'react-icons/fi';
import '../../styles/dashboard/dashboard-quick-actions.css';

const DashboardQuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'apply-leave',
      label: 'Apply Leave',
      icon: FiCalendar,
      onClick: () => navigate('/employees/leaves'),
      color: '#6366f1',
    },
    {
      id: 'fill-timesheet',
      label: 'Fill Timesheet',
      icon: FiClock,
      onClick: () => navigate('/employees/timesheets'),
      color: '#10b981',
    },
    {
      id: 'update-profile',
      label: 'Update Profile',
      icon: FiEdit,
      onClick: () => navigate('/employees'),
      color: '#f59e0b',
    },
    {
      id: 'add-skills',
      label: 'Add Skills',
      icon: FiBriefcase,
      onClick: () => navigate('/employees'),
      color: '#8b5cf6',
    },
  ];

  return (
    <div className="dashboard-quick-actions">
      <h3 className="dashboard-quick-actions-title">Quick Actions</h3>
      <div className="dashboard-quick-actions-list">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              className="dashboard-quick-action-btn"
              onClick={action.onClick}
              style={{ '--action-color': action.color }}
            >
              <div className="dashboard-quick-action-icon">
                <Icon size={18} />
              </div>
              <span className="dashboard-quick-action-label">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardQuickActions;




