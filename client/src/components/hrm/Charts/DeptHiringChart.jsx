import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const data = [
    { name: 'Engineering', value: 45 },
    { name: 'Sales', value: 25 },
    { name: 'Marketing', value: 20 },
    { name: 'Other', value: 10 },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#94a3b8'];

const DeptHiringChart = () => {
    return (
        <div className="hrm-card" style={{ height: '380px' }}>
            <div className="hrm-card-header">
                <h3 className="hrm-card-title">Hiring by Department</h3>
            </div>
            <div className="hrm-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DeptHiringChart;
