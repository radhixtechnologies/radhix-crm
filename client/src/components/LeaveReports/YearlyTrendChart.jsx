import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Yearly Trend Chart Component
 * Displays yearly leave usage trends
 */
const YearlyTrendChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">Yearly Leave Trend</h3>
        <div className="chart-empty">
          <p>No yearly trend data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 className="chart-title">Yearly Leave Trend (5 Years)</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke="#3B82F6" 
            strokeWidth={2}
            name="Total Requests"
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="approved" 
            stroke="#10B981" 
            strokeWidth={2}
            name="Approved"
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="totalDays" 
            stroke="#F59E0B" 
            strokeWidth={2}
            name="Total Days"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default YearlyTrendChart;

