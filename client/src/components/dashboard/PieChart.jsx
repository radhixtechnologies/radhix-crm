import '../../styles/dashboard/charts.css';

const PieChart = ({ data, title, labelKey = 'department', valueKey = 'count', colors, height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        No data available for {title}
      </div>
    );
  }

  const defaultColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
  const chartColors = colors || defaultColors;

  const total = data.reduce((sum, d) => sum + (d[valueKey] || 0), 0);
  const radius = 60;
  const centerX = 70;
  const centerY = 70;

  let currentAngle = -Math.PI / 2;

  return (
    <div style={{ padding: '20px' }}>
      {title && <h4 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>{title}</h4>}
      <svg width="100%" height={height} viewBox="0 0 140 180">
        {/* Pie slices */}
        {data.map((d, index) => {
          const value = d[valueKey] || 0;
          const percentage = value / total;
          const angle = percentage * 2 * Math.PI;
          const endAngle = currentAngle + angle;

          const x1 = centerX + radius * Math.cos(currentAngle);
          const y1 = centerY + radius * Math.sin(currentAngle);
          const x2 = centerX + radius * Math.cos(endAngle);
          const y2 = centerY + radius * Math.sin(endAngle);

          const largeArcFlag = angle > Math.PI ? 1 : 0;

          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z',
          ].join(' ');

          const result = (
            <g key={index}>
              <path
                d={pathData}
                fill={chartColors[index % chartColors.length]}
                stroke="#fff"
                strokeWidth="2"
              />
            </g>
          );

          currentAngle = endAngle;
          return result;
        })}

        {/* Labels */}
        {data.map((d, index) => (
          <text
            key={index}
            x="5"
            y={120 + index * 15}
            fontSize="11"
            fill="#333"
          >
            <tspan
              x="5"
              fill={chartColors[index % chartColors.length]}
              fontWeight="bold"
            >
              ●{' '}
            </tspan>
            <tspan>{d[labelKey]}: {d[valueKey]}</tspan>
          </text>
        ))}
      </svg>
    </div>
  );
};

export default PieChart;

