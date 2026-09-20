import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDarkMode } from '../../../utils/useDarkMode';

const RevenueBarChart = ({
  data = [],
  name1 = "Income",
  name2 = "Expenses",
  dataKey1 = "online",
  dataKey2 = "offline",
  xKey = "day"
}) => {
  const isDark = useDarkMode();

  const gridColor = isDark ? 'var(--chart-grid)' : '#E5E7EB';
  const axisColor = isDark ? 'var(--chart-axis)' : '#6B7280';
  const tooltipBg = isDark ? 'var(--card-bg-2)' : '#FFFFFF';
  const tooltipBorder = isDark ? 'var(--border-light)' : '#E5E7EB';
  const chartBg = isDark ? 'transparent' : '#FFFFFF';
  const textColor = isDark ? 'var(--text-secondary)' : '#111827';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 30 }} style={{ background: chartBg }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey={xKey} stroke={axisColor} />
        <YAxis stroke={axisColor} />
        <Tooltip
          contentStyle={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '8px',
            color: textColor
          }}
        />
        <Legend wrapperStyle={{ color: textColor }} />
        <Bar dataKey={dataKey1} fill={isDark ? 'var(--chart-bar-1)' : '#3B82F6'} name={name1} radius={[8, 8, 0, 0]} />
        <Bar dataKey={dataKey2} fill={isDark ? 'var(--chart-bar-2)' : '#10B981'} name={name2} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RevenueBarChart;