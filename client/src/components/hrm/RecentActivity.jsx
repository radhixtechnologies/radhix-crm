import React from 'react';
import { useNavigate } from 'react-router-dom';

const RecentActivity = ({ logs = [] }) => {
    const navigate = useNavigate();

    // Mock data if logs are empty (for visualization)
    const displayLogs = logs.length > 0 ? logs : [
        { id: 1, time: '10:30 AM', user: 'Sarah HR', action: 'Scheduled interview', module: 'Recruitment' },
        { id: 2, time: '09:15 AM', user: 'Mike Admin', action: 'Added new job posting', module: 'Recruitment' },
        { id: 3, time: 'Yesterday', user: 'Sarah HR', action: 'Completed appraisal', module: 'Performance' },
        { id: 4, time: 'Yesterday', user: 'System', action: 'Payroll generated', module: 'Payroll' },
        { id: 5, time: '2 days ago', user: 'John Doe', action: 'Applied for leave', module: 'Leave' },
    ];

    return (
        <div className="hrm-card">
            <div className="hrm-card-header">
                <h3 className="hrm-card-title">Recent Activity</h3>
                <button
                    className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                    onClick={() => navigate('/activity-logs')}
                >
                    View All
                </button>
            </div>

            <table className="hrm-activity-table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Module</th>
                    </tr>
                </thead>
                <tbody>
                    {displayLogs.map((log) => (
                        <tr key={log.id}>
                            <td className="hrm-activity-time">
                                {log.time || new Date(log.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="hrm-activity-user">
                                {typeof log.user === 'object' ? (log.user?.name || log.user?.email || 'Unknown') : log.user}
                            </td>
                            <td>{log.action}</td>
                            <td>
                                <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                                    {log.module}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RecentActivity;
