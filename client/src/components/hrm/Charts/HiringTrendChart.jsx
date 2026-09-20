import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Jan', hired: 4 },
    { name: 'Feb', hired: 3 },
    { name: 'Mar', hired: 7 },
    { name: 'Apr', hired: 5 },
    { name: 'May', hired: 8 },
    { name: 'Jun', hired: 10 },
];

const HiringTrendChart = () => {
    return (
        <div className="hrm-card" style={{ height: '380px' }}>
            <div className="hrm-card-header">
                <h3 className="hrm-card-title">Hiring Trends (6 Months)</h3>
            </div>
            <div className="hrm-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 10,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Area type="monotone" dataKey="hired" stroke="#3b82f6" fill="#eff6ff" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default HiringTrendChart;
