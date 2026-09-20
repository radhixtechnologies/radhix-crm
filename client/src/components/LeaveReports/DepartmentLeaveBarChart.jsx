import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Department Leave Bar Chart Component
 * Displays department-wise leave usage
 */
const DepartmentLeaveBarChart = ({ data }) => {
  const chartData = data?.departments || [];

  return (
    <div className="chart-container">
      <h3 className="chart-title">Department-Wise Leave Usage</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#3B82F6" name="Total Requests" />
            <Bar dataKey="approved" fill="#10B981" name="Approved" />
            <Bar dataKey="totalDays" fill="#F59E0B" name="Total Days" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty">
          <p>No department data available</p>
        </div>
      )}
    </div>
  );
};

export default DepartmentLeaveBarChart;

