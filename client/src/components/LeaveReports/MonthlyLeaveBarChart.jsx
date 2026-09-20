import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Monthly Leave Bar Chart Component
 * Displays monthly leave usage
 */
const MonthlyLeaveBarChart = ({ data }) => {
  const chartData = data?.monthly || [];

  return (
    <div className="chart-container">
      <h3 className="chart-title">Monthly Leave Usage</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#3B82F6" name="Total Requests" />
            <Bar dataKey="approved" fill="#10B981" name="Approved" />
            <Bar dataKey="totalDays" fill="#F59E0B" name="Days Approved" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty">
          <p>No monthly data available</p>
        </div>
      )}
    </div>
  );
};

export default MonthlyLeaveBarChart;

