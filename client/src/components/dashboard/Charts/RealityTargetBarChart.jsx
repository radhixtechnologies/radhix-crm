import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDarkMode } from '../../../utils/useDarkMode';

const RealityTargetBarChart = ({ data = [] }) => {
  const isDark = useDarkMode();

  const gridColor = isDark ? 'var(--chart-grid)' : '#E5E7EB';
  const axisColor = isDark ? 'var(--chart-axis)' : '#6B7280';
  const tooltipBg = isDark ? 'var(--card-bg-2)' : '#FFFFFF';
  const tooltipBorder = isDark ? 'var(--border-light)' : '#E5E7EB';
  const chartBg = isDark ? 'transparent' : '#FFFFFF';

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={250}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 30 }} style={{ background: chartBg }}>
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
        <Bar dataKey="reality" fill="#F59E0B" name="Reality" radius={[8, 8, 0, 0]} />
        <Bar dataKey="target" fill="#3B82F6" name="Target" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RealityTargetBarChart;

