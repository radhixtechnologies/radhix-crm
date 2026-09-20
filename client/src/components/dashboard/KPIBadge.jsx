import React from 'react';

/**
 * KPIBadge component for displaying key performance indicators
 * Extracted from SuperAdminDashboard for reusability across all dashboards
 */
const KPIBadge = ({ icon, label, value, color }) => {
    const colors = {
        blue: '#3b82f6',
        green: '#10b981',
        yellow: '#f59e0b',
        purple: '#8b5cf6',
        orange: '#f97316',
        indigo: '#6366f1',
        red: '#ef4444',
    };

    return (
        <div className="kpi-badge-container" style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: colors[color] || colors.blue,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px'
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>{value}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            </div>
        </div>
    );
};

export default KPIBadge;
