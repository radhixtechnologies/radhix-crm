import '../../styles/dashboard/charts.css';

const BarChart = ({ data, title, xKey = 'month', yKey = 'count', colors = ['#6366f1', '#10b981'], height = 200 }) => {
  // Early return if no data or invalid data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        No data available for {title || 'chart'}
      </div>
    );
  }

  // Safe data mapper: ensure all values are numeric and valid
  const safeData = data.map(d => {
    if (!d || typeof d !== 'object') {
      return { [xKey]: 'Invalid', [yKey]: 0 };
    }

    const safeItem = { ...d };
    
    // Ensure xKey exists (for label)
    if (!safeItem[xKey]) {
      safeItem[xKey] = '';
    }

    // Get all keys except xKey for values
    const valueKeys = Object.keys(safeItem).filter(k => k !== xKey);
    
    // Ensure all value keys are numeric
    valueKeys.forEach(key => {
      const value = safeItem[key];
      // Convert to number, default to 0 if invalid
      safeItem[key] = Number(value) || 0;
      // Ensure it's not NaN or Infinity
      if (isNaN(safeItem[key]) || !isFinite(safeItem[key])) {
        safeItem[key] = 0;
      }
    });

    // If using yKey, ensure it's numeric
    if (yKey && safeItem[yKey] !== undefined) {
      safeItem[yKey] = Number(safeItem[yKey]) || 0;
      if (isNaN(safeItem[yKey]) || !isFinite(safeItem[yKey])) {
        safeItem[yKey] = 0;
      }
    }

    return safeItem;
  }).filter(d => d !== null && d !== undefined); // Remove any null/undefined items

  // Don't render if safeData is empty after filtering
  if (!safeData || safeData.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        No valid data available for {title || 'chart'}
      </div>
    );
  }

  // Check if data has multiple series (e.g., income/expense)
  const keys = Object.keys(safeData[0]).filter(k => k !== xKey);
  const hasMultipleSeries = keys.length > 1;
  
  // Calculate max value with safe numeric conversion
  const maxValue = hasMultipleSeries
    ? Math.max(...safeData.map(d => 
        Math.max(...keys.map(k => {
          const val = Number(d[k]) || 0;
          return isNaN(val) || !isFinite(val) ? 0 : val;
        }))
      ))
    : Math.max(...safeData.map(d => {
        const val = Number(d[yKey]) || 0;
        return isNaN(val) || !isFinite(val) ? 0 : val;
      }));

  // Ensure maxValue is at least 1 to avoid division by zero
  const safeMaxValue = (Number(maxValue) > 0 && isFinite(maxValue)) ? Number(maxValue) : 1;

  // Ensure height is valid
  const safeHeight = Number(height) || 200;
  const validHeight = isNaN(safeHeight) || !isFinite(safeHeight) || safeHeight < 100 ? 200 : safeHeight;

  const width = 100;
  const chartHeight = Math.max(validHeight - 80, 100); // Ensure minimum height
  
  // Safe calculations with validation
  const dataLength = safeData.length;
  const groupWidth = dataLength > 0 ? Number(width) / Number(dataLength) : 0;
  const safeGroupWidth = (isNaN(groupWidth) || !isFinite(groupWidth)) ? 0 : groupWidth;
  
  const barWidth = dataLength > 0 
    ? (hasMultipleSeries 
        ? (Number(safeGroupWidth) / Math.max(Number(keys.length) || 1, 1)) * 0.7 
        : Number(safeGroupWidth) * 0.6)
    : 0;
  const safeBarWidth = (isNaN(barWidth) || !isFinite(barWidth) || barWidth <= 0) ? 1 : barWidth;

  // Helper function to ensure a value is a safe number
  const safeNumber = (value, defaultValue = 0) => {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) {
      return defaultValue;
    }
    return num;
  };

  return (
    <div style={{ padding: '20px' }}>
      {title && <h4 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>{title}</h4>}
      <svg 
        width="100%" 
        height={validHeight} 
        viewBox={`0 0 ${safeNumber(width + 20, 120)} ${safeNumber(chartHeight + 80, 180)}`} 
        style={{ overflow: 'visible' }}
      >
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = (safeNumber(chartHeight) / 4) * i;
          const safeY = safeNumber(y, 0);
          return (
            <line
              key={i}
              x1="0"
              y1={safeY}
              x2={safeNumber(width, 100)}
              y2={safeY}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}
        
        {/* Bars */}
        {safeData.map((d, index) => {
          const safeIndex = safeNumber(index, 0);
          const groupX = dataLength > 0 
            ? (safeIndex / dataLength) * safeNumber(width, 100) + (safeNumber(safeGroupWidth) / 2)
            : 0;
          const safeGroupX = safeNumber(groupX, 0);
          
          if (hasMultipleSeries) {
            // Multiple series (grouped bars)
            return keys.map((key, keyIndex) => {
              const value = safeNumber(d[key], 0);
              const barHeight = (value / safeMaxValue) * safeNumber(chartHeight);
              const barY = safeNumber(chartHeight) - safeNumber(barHeight);
              const barX = safeGroupX - (safeBarWidth * safeNumber(keys.length)) / 2 + (safeNumber(keyIndex) * safeBarWidth);
              const color = colors[safeNumber(keyIndex) % colors.length] || colors[0];
              
              // Ensure all values are safe numbers
              const safeBarHeight = Math.max(0, safeNumber(barHeight));
              const safeBarY = Math.max(0, Math.min(safeNumber(chartHeight), safeNumber(barY)));
              const safeBarX = safeNumber(barX, 0);
              const safeBarWidthValue = safeNumber(safeBarWidth * 0.9, 1);
              
              return (
                <g key={`${safeIndex}-${safeNumber(keyIndex)}`}>
                  <rect
                    x={safeBarX}
                    y={safeBarY}
                    width={safeBarWidthValue}
                    height={safeBarHeight}
                    fill={color}
                    rx="2"
                  />
                </g>
              );
            });
          } else {
            // Single series
            const value = safeNumber(d[yKey], 0);
            const barHeight = (value / safeMaxValue) * safeNumber(chartHeight);
            const barY = safeNumber(chartHeight) - safeNumber(barHeight);
            const barX = safeGroupX - safeBarWidth / 2;
            
            // Ensure all values are safe numbers
            const safeBarHeight = Math.max(0, safeNumber(barHeight));
            const safeBarY = Math.max(0, Math.min(safeNumber(chartHeight), safeNumber(barY)));
            const safeBarX = safeNumber(barX, 0);
            const safeBarWidthValue = safeNumber(safeBarWidth, 1);
            
            return (
              <g key={safeIndex}>
                <rect
                  x={safeBarX}
                  y={safeBarY}
                  width={safeBarWidthValue}
                  height={safeBarHeight}
                  fill={colors[0] || '#6366f1'}
                  rx="2"
                />
              </g>
            );
          }
        })}
        
        {/* Labels */}
        {safeData.map((d, index) => {
          const safeIndex = safeNumber(index, 0);
          const x = dataLength > 0 
            ? (safeIndex / dataLength) * safeNumber(width, 100) + (safeNumber(safeGroupWidth) / 2)
            : 0;
          const safeX = safeNumber(x, 0);
          const safeY = safeNumber(chartHeight) + 25;
          const label = d[xKey] || '';
          
          return (
            <text
              key={safeIndex}
              x={safeX}
              y={safeY}
              textAnchor="middle"
              fontSize="10"
              fill="#666"
            >
              {String(label)}
            </text>
          );
        })}
      </svg>
      
      {/* Legend for multiple series */}
      {hasMultipleSeries && keys.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px', fontSize: '11px' }}>
          {keys.map((key, index) => {
            const safeIndex = safeNumber(index, 0);
            const color = colors[safeIndex % colors.length] || colors[0];
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: color, borderRadius: '2px' }}></div>
                <span style={{ color: '#666', textTransform: 'capitalize' }}>{String(key)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BarChart;
