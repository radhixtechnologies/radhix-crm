import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiTrendingUp, FiClock, FiInfo } from 'react-icons/fi';
import CircularProgressBar from './CircularProgressBar';

/**
 * Leave Balance Card Component
 * Displays leave balance information for a specific leave type
 */
const LeaveBalanceCard = ({ leaveType, balance, year }) => {
  const usagePercent = balance.total > 0 ? Math.round((balance.used / balance.total) * 100) : 0;
  const availablePercent = balance.total > 0 ? Math.round((balance.available / balance.total) * 100) : 0;
  const isLow = balance.available < balance.total * 0.2 && balance.total > 0;
  const isEmpty = balance.available === 0 && balance.total > 0;

  const getLeaveTypeColor = (type) => {
    const colors = {
      casual: 'info',
      sick: 'warning',
      annual: 'success',
      maternity: 'error',
      paternity: 'error',
      unpaid: 'secondary',
    };
    return colors[type] || 'secondary';
  };

  const getLeaveTypeName = (type) => {
    const names = {
      casual: 'Casual Leave (CL)',
      sick: 'Sick Leave (SL)',
      annual: 'Annual Leave (AL)',
      maternity: 'Maternity Leave (ML)',
      paternity: 'Paternity Leave (PL)',
      unpaid: 'Unpaid Leave (UL)',
    };
    return names[type] || type;
  };

  return (
    <div 
      className="card" 
      style={{ 
        padding: '24px', 
        background: isEmpty ? 'var(--error-light)' : isLow ? 'var(--warning-light)' : 'var(--surface)',
        border: isEmpty ? '2px solid var(--error)' : isLow ? '2px solid var(--warning)' : '1px solid var(--border)',
        borderRadius: '12px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Warning Indicator */}
      {(isEmpty || isLow) && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: isEmpty ? 'var(--error)' : 'var(--warning)',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          zIndex: 1
        }}>
          <FiAlertCircle size={14} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
        <div>
          <h4 style={{ margin: 0, textTransform: 'capitalize', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
            {getLeaveTypeName(leaveType)}
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {year} Allocation
          </span>
        </div>
        <span className={`badge badge-${getLeaveTypeColor(leaveType)}`} style={{ fontSize: '13px', padding: '6px 12px' }}>
          {balance.total} days
        </span>
      </div>

      {/* Circular Progress Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
        <CircularProgressBar 
          percentage={availablePercent} 
          size={80}
          label="Available"
        />
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiCheckCircle size={14} style={{ color: 'var(--success)' }} />
              Available
            </span>
            <strong style={{ fontSize: '18px', color: isEmpty ? 'var(--error)' : 'var(--success)', fontWeight: 600 }}>
              {balance.available} days
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiTrendingUp size={14} style={{ color: 'var(--info)' }} />
              Used
            </span>
            <span style={{ fontSize: '16px', fontWeight: 500 }}>{balance.used} days</span>
          </div>
          {balance.pending > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiClock size={14} style={{ color: 'var(--warning)' }} />
                Pending
              </span>
              <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--warning)' }}>{balance.pending} days</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Progress Bar */}
      {balance.total > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ 
            width: '100%', 
            height: '10px', 
            background: 'var(--border)', 
            borderRadius: '6px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div 
              style={{ 
                width: `${usagePercent}%`, 
                height: '100%', 
                background: isEmpty ? 'var(--error)' : isLow ? 'var(--warning)' : 'var(--primary)',
                transition: 'width 0.5s ease',
                borderRadius: '6px'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            <span>{usagePercent}% utilized</span>
            <span>{balance.total - balance.used - balance.pending} days remaining</span>
          </div>
        </div>
      )}

      {/* Low Balance Alert */}
      {isLow && !isEmpty && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'var(--warning-light)',
          borderRadius: '8px',
          border: '1px solid var(--warning)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: 'var(--warning-text)'
        }}>
          <FiAlertCircle />
          <span>Low balance warning: Less than 20% remaining</span>
        </div>
      )}

      {isEmpty && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'var(--error-light)',
          borderRadius: '8px',
          border: '1px solid var(--error)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: 'var(--error-text)'
        }}>
          <FiAlertCircle />
          <span>No available balance remaining</span>
        </div>
      )}
    </div>
  );
};

export default LeaveBalanceCard;
