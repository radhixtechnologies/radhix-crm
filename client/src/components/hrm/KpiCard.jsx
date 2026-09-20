import React from 'react';

/**
 * @param {Object} props
 * @param {string} props.label
 * @param {string|number} props.value
 * @param {React.ReactNode} props.icon
 * @param {string} props.color - 'blue', 'purple', 'teal', 'rose', 'green', 'orange'
 */
const KpiCard = ({ label, value, icon, color = 'blue' }) => {
    return (
        <div className={`hrm-kpi-card ${color}`}>
            <div className="hrm-kpi-header">
                <div className="hrm-kpi-icon-wrapper">
                    {icon}
                </div>
            </div>
            <div>
                <div className="hrm-kpi-value">{value}</div>
                <div className="hrm-kpi-label">{label}</div>
            </div>
        </div>
    );
};

export default KpiCard;
