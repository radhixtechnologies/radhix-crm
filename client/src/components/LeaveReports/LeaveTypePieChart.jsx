import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

/**
 * Leave Type Pie Chart Component
 * Displays leave distribution by type
 */
const LeaveTypePieChart = ({ data }) => {
  const COLORS = {
    casual: '#3B82F6', // Blue
    sick: '#10B981', // Green
    annual: '#F59E0B', // Amber
    maternity: '#EC4899', // Pink
    paternity: '#8B5CF6', // Purple
    unpaid: '#6B7280', // Gray
  };

  const chartData = [
    { name: 'Casual', value: data?.casual?.days || 0, color: COLORS.casual },
    { name: 'Sick', value: data?.sick?.days || 0, color: COLORS.sick },
    { name: 'Annual', value: data?.annual?.days || 0, color: COLORS.annual },
    { name: 'Maternity', value: data?.maternity?.days || 0, color: COLORS.maternity },
    { name: 'Paternity', value: data?.paternity?.days || 0, color: COLORS.paternity },
    { name: 'Unpaid', value: data?.unpaid?.days || 0, color: COLORS.unpaid },
  ].filter(item => item.value > 0);

  const totalDays = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="chart-container">
      <h3 className="chart-title">Leave Distribution by Type</h3>
      {totalDays > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) => `${name}: ${value} days (${(percent * 100).toFixed(1)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} days`, 'Leave Days']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty">
          <p>No leave data available</p>
        </div>
      )}
    </div>
  );
};

export default LeaveTypePieChart;

