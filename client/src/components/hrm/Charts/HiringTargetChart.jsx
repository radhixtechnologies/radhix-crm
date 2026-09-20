import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Engineering', target: 10, hired: 7 },
    { name: 'Sales', target: 8, hired: 5 },
    { name: 'Marketing', target: 5, hired: 3 },
    { name: 'HR', target: 2, hired: 2 },
    { name: 'Product', target: 4, hired: 1 },
];

const HiringTargetChart = () => {
    return (
        <div className="hrm-card" style={{ height: '380px' }}>
            <div className="hrm-card-header">
                <h3 className="hrm-card-title">Hiring Targets vs Reality</h3>
            </div>
            <div className="hrm-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="target" fill="#e2e8f0" name="Target" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="hired" fill="#3b82f6" name="Hired" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default HiringTargetChart;
