import '../../styles/dashboard/charts.css';

const LineChart = ({ data, title, xKey = 'month', yKey = 'count', color = '#6366f1', height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        No data available for {title}
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d[yKey] || 0));
  const minValue = Math.min(...data.map(d => d[yKey] || 0));
  const range = maxValue - minValue || 1;
  const width = 100;
  const chartHeight = height - 60;

  const points = data.map((d, index) => {
    const x = (index / (data.length - 1 || 1)) * width;
    const y = chartHeight - ((d[yKey] || 0) - minValue) / range * chartHeight;
    return { x, y, label: d[xKey], value: d[yKey] || 0 };
  });

  const pathData = points.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    return `L ${p.x} ${p.y}`;
  }).join(' ');

  return (
    <div style={{ padding: '20px' }}>
      {title && <h4 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>{title}</h4>}
      <svg width="100%" height={height} viewBox={`0 0 ${width + 20} ${chartHeight + 60}`} style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = (chartHeight / 4) * i;
          return (
            <line
              key={i}
              x1="0"
              y1={y}
              x2={width}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        
        {/* Points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill={color}
            />
            {/* Labels */}
            <text
              x={point.x}
              y={chartHeight + 20}
              textAnchor="middle"
              fontSize="10"
              fill="#666"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default LineChart;

