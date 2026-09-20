/**
 * Date Range Filter Component
 * Simple date range picker with start and end dates
 */
const DateRangeFilter = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  startLabel = 'Start Date',
  endLabel = 'End Date',
  style = {}
}) => {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', ...style }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {startLabel}
        </label>
        <input
          type="date"
          className="form-input"
          value={startDate || ''}
          onChange={(e) => onStartDateChange(e.target.value)}
          style={{ minWidth: '140px', width: '140px' }}
        />
      </div>
      <span style={{ marginTop: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>to</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {endLabel}
        </label>
        <input
          type="date"
          className="form-input"
          value={endDate || ''}
          onChange={(e) => onEndDateChange(e.target.value)}
          style={{ minWidth: '140px', width: '140px' }}
          min={startDate || ''}
        />
      </div>
    </div>
  );
};

export default DateRangeFilter;

