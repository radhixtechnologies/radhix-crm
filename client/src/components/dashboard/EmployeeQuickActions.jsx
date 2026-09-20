import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuickActions } from '../../context/QuickActionsContext';
import {
  FiCalendar,
  FiClock,
  FiEdit,
  FiBriefcase,
  FiTrendingUp,
  FiX,
  FiZap,
} from 'react-icons/fi';
import '../../styles/dashboard/quick-actions.css';

const EmployeeQuickActions = () => {
  const navigate = useNavigate();
  const { user, hasModuleAccess } = useAuth();
  const { toggleQuickActions, closeQuickActions } = useQuickActions();

  const handleAction = (onClick) => {
    onClick();
    closeQuickActions();
  };

  const allActions = [
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
      id: 'sales-workspace',
      label: 'Sales Workspace',
      icon: FiTrendingUp,
      onClick: () => navigate('/sales'),
      color: '#3b82f6',
      module: 'sales',
    },
    {
      id: 'marketing-hub',
      label: 'Marketing Hub',
      icon: FiZap,
      onClick: () => navigate('/marketing'),
      color: '#ec4899',
      module: 'marketing',
    },
    {
      id: 'update-profile',
      label: 'Update Profile',
      icon: FiEdit,
      onClick: () => {
        // Navigate to employee profile if available
        navigate('/employees');
      },
      color: '#f59e0b',
    },
    {
      id: 'add-skills',
      label: 'Add Skills',
      icon: FiBriefcase,
      onClick: () => {
        // Navigate to employee profile with skills tab
        navigate('/employees');
      },
      color: '#8b5cf6',
    },
  ];

  const actions = allActions.filter(action => {
    if (!action.module) return true;
    return hasModuleAccess(action.module);
  });

  return (
    <div className="quick-actions">
      <div className="quick-actions-header">
        <button
          className="quick-actions-toggle-header-btn"
          onClick={toggleQuickActions}
          aria-label="Close Quick Actions"
          title="Close Quick Actions"
        >
          <FiZap />
          <span>Quick Links</span>
          <FiX className="close-icon" />
        </button>
      </div>
      <div className="quick-actions-grid">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              className={`quick-action-btn ${action.module ? 'special-action' : ''}`}
              onClick={() => handleAction(action.onClick)}
              style={{ '--action-color': action.color }}
            >
              <div className="quick-action-icon">
                <Icon size={22} />
              </div>
              <span className="quick-action-label">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeQuickActions;


