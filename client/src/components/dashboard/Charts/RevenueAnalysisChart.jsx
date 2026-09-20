import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
import { useDarkMode } from '../../../utils/useDarkMode';

function RevenueAnalysisChart({ data = [] }) {
  const isDark = useDarkMode();

  const gridColor = isDark ? 'var(--chart-grid)' : '#E5E7EB';
  const axisColor = isDark ? 'var(--chart-axis)' : '#64748B';
  const tooltipBg = isDark ? 'var(--card-bg-2)' : '#FFFFFF';
  const tooltipBorder = isDark ? 'var(--border-light)' : '#E5E7EB';
  const chartBg = isDark ? 'transparent' : '#FFFFFF';
  const emptyTextColor = isDark ? 'var(--text-muted)' : '#94A3B8';

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: emptyTextColor }}>
        No revenue data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 30 }} style={{ background: chartBg }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="month" stroke={axisColor} tickMargin={8} />
        <YAxis stroke={axisColor} tickMargin={8} />
        <Tooltip
          contentStyle={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '12px',
            boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.3)' : '0 10px 30px rgba(15, 23, 42, 0.08)',
            color: isDark ? 'var(--text-secondary)' : '#111827'
          }}
        />
        <Legend wrapperStyle={{ color: isDark ? 'var(--text-secondary)' : '#111827' }} />
        <Area type="monotone" dataKey="profit" stroke="#0EA5E9" fill="url(#revenueGradient)" name="Profit" />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#22C55E"
          strokeWidth={2.5}
          dot={{ r: 4, strokeWidth: 1, stroke: '#22C55E', fill: '#22C55E' }}
          activeDot={{ r: 6 }}
          name="Revenue"
        />
        <Line
          type="monotone"
          dataKey="expense"
          stroke="#F97316"
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 1, stroke: '#F97316', fill: '#F97316' }}
          activeDot={{ r: 5 }}
          name="Expense"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default RevenueAnalysisChart;
