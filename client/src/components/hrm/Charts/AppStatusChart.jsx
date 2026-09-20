import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Week 1', applied: 40, screened: 24, interview: 10, hired: 2 },
    { name: 'Week 2', applied: 30, screened: 18, interview: 8, hired: 3 },
    { name: 'Week 3', applied: 50, screened: 30, interview: 12, hired: 1 },
    { name: 'Week 4', applied: 45, screened: 28, interview: 14, hired: 4 },
];

const AppStatusChart = () => {
    return (
        <div className="hrm-card" style={{ height: '380px' }}>
            <div className="hrm-card-header">
                <h3 className="hrm-card-title">Application Status</h3>
            </div>
            <div className="hrm-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                        layout="vertical"
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={60} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                        <Legend />
                        <Bar dataKey="applied" stackId="a" fill="#e2e8f0" name="Applied" barSize={20} />
                        <Bar dataKey="screened" stackId="a" fill="#93c5fd" name="Screened" barSize={20} />
                        <Bar dataKey="interview" stackId="a" fill="#3b82f6" name="Interview" barSize={20} />
                        <Bar dataKey="hired" stackId="a" fill="#10b981" name="Hired" barSize={20} radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AppStatusChart;
