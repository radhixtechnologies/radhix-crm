import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCheckCircle,
  FiActivity,
  FiBell,
  FiSearch,
  FiArrowRight,
} from 'react-icons/fi';
import { approvalService } from '../../services/approvalService';
import { dailyUpdateService } from '../../services/dailyUpdateService';
import { announcementService } from '../../services/announcementService';
import './ExecutivePulse.css';

const ExecutivePulse = () => {
  const navigate = useNavigate();
  const [approvalsCount, setApprovalsCount] = useState(0);
  const [standupTracker, setStandupTracker] = useState(null);
  const [latestNotice, setLatestNotice] = useState(null);

  useEffect(() => {
    // 1. Fetch pending approvals count
    approvalService.getPendingApprovals('all')
      .then((res) => {
        if (res.data?.success) {
          setApprovalsCount(res.data.data.counts?.total || 0);
        }
      })
      .catch(() => {});

    // 2. Fetch daily standup submission tracker
    dailyUpdateService.getSubmissionTracker()
      .then((res) => {
        if (res.data?.success) {
          setStandupTracker(res.data.data);
        }
      })
      .catch(() => {});

    // 3. Fetch latest announcement
    announcementService.getAnnouncements({ limit: 1 })
      .then((res) => {
        if (res.data?.success && res.data.data.length > 0) {
          setLatestNotice(res.data.data[0]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="executive-pulse-card">
      <div className="executive-pulse-header">
        <div className="executive-pulse-title-area">
          <div className="pulse-indicator" />
          <div className="executive-pulse-title">Executive Pulse • Today&apos;s Operations Digest</div>
          <span className="executive-pulse-badge">Live Operations</span>
        </div>

        <button
          className="pulse-item-link"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
        >
          <FiSearch /> Spotlight Search (Ctrl + K)
        </button>
      </div>

      <div className="executive-pulse-grid">
        {/* Approvals Action Digest */}
        <div className="pulse-digest-item" onClick={() => navigate('/approvals')}>
          <div className="pulse-item-top">
            <FiCheckCircle className="pulse-item-icon" />
            {approvalsCount > 0 ? (
              <span className="pulse-item-badge">{approvalsCount} Action Required</span>
            ) : (
              <span style={{ fontSize: '0.72rem', color: '#86efac', fontWeight: 600 }}>All Clear</span>
            )}
          </div>
          <div>
            <div className="pulse-item-label">Pending Approvals</div>
            <div className="pulse-item-val">{approvalsCount} Requests</div>
          </div>
          <div className="pulse-item-link">
            Clear inbox <FiArrowRight />
          </div>
        </div>

        {/* Daily Standup & Blockers Digest */}
        <div className="pulse-digest-item" onClick={() => navigate('/employees/daily-updates')}>
          <div className="pulse-item-top">
            <FiActivity className="pulse-item-icon" />
            {standupTracker?.blockersCount > 0 && (
              <span className="pulse-item-badge">{standupTracker.blockersCount} Blockers</span>
            )}
          </div>
          <div>
            <div className="pulse-item-label">Today&apos;s Standups</div>
            <div className="pulse-item-val">
              {standupTracker ? `${standupTracker.submittedCount}/${standupTracker.totalActiveEmployees} Submitted` : 'Active'}
            </div>
          </div>
          <div className="pulse-item-link">
            View team standups <FiArrowRight />
          </div>
        </div>

        {/* Notice Board Digest */}
        <div className="pulse-digest-item" onClick={() => navigate('/company/announcements')}>
          <div className="pulse-item-top">
            <FiBell className="pulse-item-icon" />
            <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 600 }}>Notice Board</span>
          </div>
          <div>
            <div className="pulse-item-label">Latest Notice</div>
            <div
              className="pulse-item-val"
              style={{ fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {latestNotice ? latestNotice.title : 'No active notices'}
            </div>
          </div>
          <div className="pulse-item-link">
            Open Townhall <FiArrowRight />
          </div>
        </div>

        {/* Universal Quick Action Trigger */}
        <div
          className="pulse-digest-item"
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
        >
          <div className="pulse-item-top">
            <FiSearch className="pulse-item-icon" />
            <kbd style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.15)', padding: '0.15rem 0.35rem', borderRadius: '4px' }}>
              Ctrl + K
            </kbd>
          </div>
          <div>
            <div className="pulse-item-label">Spotlight Command Bar</div>
            <div className="pulse-item-val" style={{ fontSize: '0.95rem' }}>
              Universal Search
            </div>
          </div>
          <div className="pulse-item-link">
            Launch search <FiArrowRight />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutivePulse;
