import '../../styles/dashboard/charts.css';

const FunnelChart = ({ data, title, stageKey = 'stage', valueKey = 'value', color = '#6366f1', height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        No data available for {title}
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d[valueKey] || 0));
  const funnelWidth = 200;
  const stageHeight = (height - 80) / data.length;

  return (
    <div style={{ padding: '20px' }}>
      {title && <h4 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>{title}</h4>}
      <svg width="100%" height={height} viewBox="0 0 250 320">
        {data.map((d, index) => {
          const value = d[valueKey] || 0;
          const width = (value / maxValue) * funnelWidth;
          const startX = (funnelWidth - width) / 2;
          const y = index * stageHeight;
          
          const nextValue = data[index + 1]?.[valueKey] || 0;
          const nextWidth = (nextValue / maxValue) * funnelWidth;
          const nextStartX = (funnelWidth - nextWidth) / 2;

          return (
            <g key={index}>
              {/* Funnel segment */}
              <polygon
                points={`${startX},${y} ${startX + width},${y} ${nextStartX + nextWidth},${y + stageHeight} ${nextStartX},${y + stageHeight}`}
                fill={color}
                fillOpacity={0.7 - index * 0.1}
                stroke="#fff"
                strokeWidth="2"
              />
              
              {/* Stage label and value */}
              <text
                x="105"
                y={y + stageHeight / 2 + 5}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="#333"
              >
                {d[stageKey]}: {value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default FunnelChart;

