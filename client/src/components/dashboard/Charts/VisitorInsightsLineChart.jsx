import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDarkMode } from '../../../utils/useDarkMode';

const VisitorInsightsLineChart = ({ data = [] }) => {
  const isDark = useDarkMode();

  const gridColor = isDark ? 'var(--chart-grid)' : '#E5E7EB';
  const axisColor = isDark ? 'var(--chart-axis)' : '#6B7280';
  const tooltipBg = isDark ? 'var(--card-bg-2)' : '#FFFFFF';
  const tooltipBorder = isDark ? 'var(--border-light)' : '#E5E7EB';
  const chartBg = isDark ? 'transparent' : '#FFFFFF';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 30 }} style={{ background: chartBg }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="month" stroke={axisColor} />
        <YAxis stroke={axisColor} />
        <Tooltip
          contentStyle={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '8px',
            color: isDark ? 'var(--text-secondary)' : '#111827'
          }}
        />
        <Legend wrapperStyle={{ color: isDark ? 'var(--text-secondary)' : '#111827' }} />
        <Line
          type="monotone"
          dataKey="loyal"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={{ fill: '#3B82F6', r: 4 }}
          name="Loyal"
        />
        <Line
          type="monotone"
          dataKey="new"
          stroke="#10B981"
          strokeWidth={2}
          dot={{ fill: '#10B981', r: 4 }}
          name="New"
        />
        <Line
          type="monotone"
          dataKey="lost"
          stroke="#EF4444"
          strokeWidth={2}
          dot={{ fill: '#EF4444', r: 4 }}
          name="Unique"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default VisitorInsightsLineChart;

