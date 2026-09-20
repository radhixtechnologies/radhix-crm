import { useNavigate } from 'react-router-dom';
import {
    FiUserPlus,
    FiShield,
    FiBriefcase,
    FiFileText,
    FiDollarSign,
    FiDollarSign as FiPayroll,
    FiPlus,
} from 'react-icons/fi';

const MobileQuickActions = ({ onActionClick }) => {
    const navigate = useNavigate();

    const handleAction = (path) => {
        navigate(path);
        if (onActionClick) {
            onActionClick(); // Close drawer after action
        }
    };

    const actions = [
        {
            id: 'create-employee',
            label: 'Create Employee',
            icon: FiUserPlus,
            onClick: () => handleAction('/employees/add'),
            color: '#6366f1',
        },
        {
            id: 'create-admin',
            label: 'Create Admin',
            icon: FiShield,
            onClick: () => handleAction('/settings'),
            color: '#10b981',
        },
        {
            id: 'create-invoice',
            label: 'Create Invoice',
            icon: FiFileText,
            onClick: () => handleAction('/finance/invoices/new'),
            color: '#ef4444',
        },
        {
            id: 'add-expense',
            label: 'Add Expense',
            icon: FiDollarSign,
            onClick: () => handleAction('/finance/expenses/new'),
            color: '#8b5cf6',
        },
        {
            id: 'add-job-opening',
            label: 'Add Job Opening',
            icon: FiBriefcase,
            onClick: () => handleAction('/hrm/recruitment/jobs/new'),
            color: '#f59e0b',
        },
        {
            id: 'add-lead',
            label: 'Add Lead',
            icon: FiPlus,
            onClick: () => handleAction('/sales/leads/new'),
            color: '#06b6d4',
        },
        {
            id: 'generate-salary-slip',
            label: 'Generate Salary Slip',
            icon: FiPayroll,
            onClick: () => handleAction('/finance/payroll'),
            color: '#84cc16',
        },
    ];

    return (
        <div className="quick-actions-grid">
            {actions.map((action) => {
                const Icon = action.icon;
                return (
                    <button
                        key={action.id}
                        className="quick-action-btn"
                        onClick={action.onClick}
                        style={{ '--action-color': action.color }}
                    >
                        <div className="quick-action-icon">
                            <Icon size={20} />
                        </div>
                        <span className="quick-action-label">{action.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default MobileQuickActions;
