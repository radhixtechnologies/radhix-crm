import React from 'react';
import {
    FiUserPlus,
    FiBriefcase,
    FiCalendar,
    FiStar,
    FiDollarSign
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
    const navigate = useNavigate();

    const actions = [
        { label: 'Create Employee', icon: <FiUserPlus />, path: '/employees/add', color: '#6366f1' },
        { label: 'Add Job Opening', icon: <FiBriefcase />, path: '/hrm/recruitment/jobs/new', color: '#f59e0b' },
        { label: 'Schedule Interview', icon: <FiCalendar />, path: '/hrm/recruitment/schedule', color: '#10b981' },
        { label: 'Start Appraisal', icon: <FiStar />, path: '/hrm/performance/new', color: '#8b5cf6' },
        { label: 'Generate Salary Slip', icon: <FiDollarSign />, path: '/finance/salary-slips/generate', color: '#ef4444' },
    ];

    return (
        <div className="hrm-quick-actions-panel">
            <div className="hrm-card-header">
                <h3 className="hrm-card-title">Quick Actions</h3>
            </div>

            {/* Reuse global quick actions styling by wrapping in this class */}
            <div className="dashboard-quick-actions-sidebar hrm-quick-actions-override">
                <div className="quick-actions-grid">
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            className="quick-action-btn"
                            onClick={() => navigate(action.path)}
                            style={{ '--action-color': action.color }}
                        >
                            <div className="quick-action-icon">
                                {action.icon}
                            </div>
                            <span className="quick-action-label">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuickActions;
