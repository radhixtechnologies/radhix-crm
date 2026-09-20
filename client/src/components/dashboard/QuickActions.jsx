import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuickActions } from '../../context/QuickActionsContext';
import {
  FiUserPlus,
  FiShield,
  FiBriefcase,
  FiFileText,
  FiDollarSign,
  FiEdit3,
  FiDollarSign as FiPayroll,
  FiPlus,
  FiTrendingUp,
  FiX,
  FiZap,
} from 'react-icons/fi';
import '../../styles/dashboard/quick-actions.css';

const QuickActions = () => {
  const navigate = useNavigate();
  const { toggleQuickActions, closeQuickActions } = useQuickActions();
  const { hasModuleAccess, isSuperAdmin } = useAuth();

  const handleAction = (onClick) => {
    onClick();
    closeQuickActions();
  };

  const allActions = [
    {
      id: 'create-employee',
      label: 'Create Employee',
      icon: FiUserPlus,
      onClick: () => navigate('/employees/add'),
      color: '#6366f1',
      module: 'hrm',
    },
    {
      id: 'create-admin',
      label: 'Create Admin',
      icon: FiShield,
      onClick: () => navigate('/settings'),
      color: '#10b981',
      module: 'settings',
      adminOnly: true,
    },
    {
      id: 'create-invoice',
      label: 'Create Invoice',
      icon: FiFileText,
      onClick: () => navigate('/finance/invoices/new'),
      color: '#ef4444',
      module: 'finance',
    },
    {
      id: 'add-expense',
      label: 'Add Expense',
      icon: FiDollarSign,
      onClick: () => navigate('/finance/expenses/new'),
      color: '#8b5cf6',
      module: 'finance',
    },
    {
      id: 'add-job-opening',
      label: 'Add Job Opening',
      icon: FiBriefcase,
      onClick: () => navigate('/hrm/recruitment/jobs/new'),
      color: '#f59e0b',
      module: 'hrm',
    },
    {
      id: 'add-lead',
      label: 'Add Lead',
      icon: FiPlus,
      onClick: () => navigate('/sales/leads/new'),
      color: '#06b6d4',
      module: 'sales',
    },
    {
      id: 'add-campaign',
      label: 'New Campaign',
      icon: FiZap,
      onClick: () => navigate('/marketing/campaigns'),
      color: '#ec4899',
      module: 'marketing',
    },
    {
      id: 'generate-salary-slip',
      label: 'Generate Salary Slip',
      icon: FiPayroll,
      onClick: () => navigate('/finance/payroll'),
      color: '#84cc16',
      module: 'finance',
    },
  ];

  const actions = allActions.filter(action => {
    if (isSuperAdmin) return true;
    if (action.adminOnly && !isSuperAdmin) return false;
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
              className="quick-action-btn"
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

export default QuickActions;

