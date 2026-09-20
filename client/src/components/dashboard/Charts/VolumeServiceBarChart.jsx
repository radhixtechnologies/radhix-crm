import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDarkMode } from '../../../utils/useDarkMode';

const VolumeServiceBarChart = ({ data = [] }) => {
  const isDark = useDarkMode();

  const gridColor = isDark ? 'var(--chart-grid)' : '#E5E7EB';
  const axisColor = isDark ? 'var(--chart-axis)' : '#6B7280';
  const tooltipBg = isDark ? 'var(--card-bg-2)' : '#FFFFFF';
  const tooltipBorder = isDark ? 'var(--border-light)' : '#E5E7EB';
  const chartBg = isDark ? 'transparent' : '#FFFFFF';

  const chartData = data.length > 0 ? data : [
    { category: 'Q1', volume: 4500, service: 3200 },
    { category: 'Q2', volume: 5200, service: 3800 },
    { category: 'Q3', volume: 4800, service: 3500 },
    { category: 'Q4', volume: 6100, service: 4200 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }} style={{ background: chartBg }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="category" stroke={axisColor} />
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
        <Bar dataKey="volume" fill="#10B981" name="Volume" radius={[8, 8, 0, 0]} />
        <Bar dataKey="service" fill="#3B82F6" name="Service" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default VolumeServiceBarChart;

