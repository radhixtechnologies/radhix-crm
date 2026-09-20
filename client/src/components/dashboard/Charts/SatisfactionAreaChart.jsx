import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDarkMode } from '../../../utils/useDarkMode';

const SatisfactionAreaChart = ({
  data = [],
  name1 = "Last Month",
  name2 = "This Month",
  dataKey1 = "lastMonth",
  dataKey2 = "thisMonth",
  xKey = "month"
}) => {
  const isDark = useDarkMode();

  const gridColor = isDark ? 'var(--chart-grid)' : '#E5E7EB';
  const axisColor = isDark ? 'var(--chart-axis)' : '#6B7280';
  const tooltipBg = isDark ? 'var(--card-bg-2)' : '#FFFFFF';
  const tooltipBorder = isDark ? 'var(--border-light)' : '#E5E7EB';
  const chartBg = isDark ? 'transparent' : '#FFFFFF';

  return (
    <div style={{ background: chartBg, width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
          <defs>
            <linearGradient id="colorKey1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorKey2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey={xKey} stroke={axisColor} />
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
          <Area
            type="monotone"
            dataKey={dataKey1}
            stroke="#10B981"
            fillOpacity={1}
            fill="url(#colorKey1)"
            name={name1}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey={dataKey2}
            stroke="#3B82F6"
            fillOpacity={1}
            fill="url(#colorKey2)"
            name={name2}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SatisfactionAreaChart;

