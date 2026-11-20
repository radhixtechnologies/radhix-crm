import { useState } from 'react';
import { FiAward, FiTrendingUp, FiTarget, FiZap } from 'react-icons/fi';
import { triggerConfetti } from '../../utils/confetti';
import { formatCurrency } from '../../utils/format';
import './SalesLeaderboardPodium.css';

const DEFAULT_LEADERS = [
  {
    rank: 1,
    name: 'Vikram Aditya',
    role: 'Enterprise AE',
    avatar: '',
    dealsClosed: 18,
    revenue: 1450000,
    targetAchievement: 128,
  },
  {
    rank: 2,
    name: 'Ananya Sharma',
    role: 'Senior Sales Lead',
    avatar: '',
    dealsClosed: 14,
    revenue: 980000,
    targetAchievement: 105,
  },
  {
    rank: 3,
    name: 'Rohan Verma',
    role: 'Account Executive',
    avatar: '',
    dealsClosed: 11,
    revenue: 720000,
    targetAchievement: 92,
  },
  {
    rank: 4,
    name: 'Priya Nair',
    role: 'BDR Specialist',
    dealsClosed: 9,
    revenue: 540000,
    targetAchievement: 86,
  },
  {
    rank: 5,
    name: 'Sameer Khan',
    role: 'Inside Sales Rep',
    dealsClosed: 7,
    revenue: 410000,
    targetAchievement: 78,
  },
];

const SalesLeaderboardPodium = ({ leaders = DEFAULT_LEADERS, teamTarget = 4000000 }) => {
  const [timeframe, setTimeframe] = useState('monthly'); // 'monthly' | 'quarterly'

  const totalClosed = leaders.reduce((sum, l) => sum + l.revenue, 0);
  const targetPercent = Math.min(100, Math.round((totalClosed / teamTarget) * 100));

  const top1 = leaders.find(l => l.rank === 1) || leaders[0];
  const top2 = leaders.find(l => l.rank === 2) || leaders[1];
  const top3 = leaders.find(l => l.rank === 3) || leaders[2];
  const runnersUp = leaders.filter(l => l.rank > 3);

  const handleCelebrate = () => {
    triggerConfetti({ particleCount: 150 });
  };

  return (
    <div className="leaderboard-podium-card card">
      {/* Header */}
      <div className="lb-header">
        <div className="lb-title-group">
          <div className="lb-header-icon">
            <FiAward />
          </div>
          <div>
            <h3>Sales Champions &amp; Gamification Leaderboard</h3>
            <p>Live revenue performance, quota velocity, and top closer rankings</p>
          </div>
        </div>

        <div className="lb-header-actions">
          <div className="lb-time-pills">
            <button
              className={`time-pill ${timeframe === 'monthly' ? 'active' : ''}`}
              onClick={() => setTimeframe('monthly')}
            >
              This Month
            </button>
            <button
              className={`time-pill ${timeframe === 'quarterly' ? 'active' : ''}`}
              onClick={() => setTimeframe('quarterly')}
            >
              This Quarter
            </button>
          </div>
          <button className="btn-celebrate-cheer" onClick={handleCelebrate} title="Blast celebratory confetti!">
            🎉 Celebrate
          </button>
        </div>
      </div>

      <div className="lb-grid-layout">
        {/* LEFT: 3D-STYLE PODIUM DISPLAY */}
        <div className="lb-podium-section">
          <div className="podium-container">
            {/* Rank 2 (Silver) */}
            {top2 && (
              <div className="podium-pillar-col rank-2">
                <div className="podium-avatar-wrapper silver">
                  <span className="medal-badge">🥈</span>
                  <div className="avatar-disc">
                    {top2.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div className="podium-name">{top2.name}</div>
                <div className="podium-metric">{formatCurrency(top2.revenue, 'INR')}</div>
                <div className="podium-deals">{top2.dealsClosed} deals</div>
                <div className="podium-pillar pillar-2">
                  <span className="pillar-rank-num">2</span>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold) - Elevated in Center */}
            {top1 && (
              <div className="podium-pillar-col rank-1">
                <div className="crown-icon">👑</div>
                <div className="podium-avatar-wrapper gold">
                  <span className="medal-badge">🥇</span>
                  <div className="avatar-disc">
                    {top1.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div className="podium-name winner">{top1.name}</div>
                <div className="podium-metric gold-text">{formatCurrency(top1.revenue, 'INR')}</div>
                <div className="podium-deals gold-deals">{top1.dealsClosed} deals • {top1.targetAchievement}%</div>
                <div className="podium-pillar pillar-1">
                  <span className="pillar-rank-num">1</span>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {top3 && (
              <div className="podium-pillar-col rank-3">
                <div className="podium-avatar-wrapper bronze">
                  <span className="medal-badge">🥉</span>
                  <div className="avatar-disc">
                    {top3.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div className="podium-name">{top3.name}</div>
                <div className="podium-metric">{formatCurrency(top3.revenue, 'INR')}</div>
                <div className="podium-deals">{top3.dealsClosed} deals</div>
                <div className="podium-pillar pillar-3">
                  <span className="pillar-rank-num">3</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: TEAM TARGET RING + RUNNERS UP */}
        <div className="lb-metrics-section">
          {/* Circular Target Progress */}
          <div className="team-quota-box">
            <div className="quota-ring-wrapper">
              <svg viewBox="0 0 100 100" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  strokeWidth="3.5"
                  stroke="#e2e8f0"
                  fill="none"
                />
                <path
                  className="circle-fill"
                  strokeDasharray={`${targetPercent}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  strokeWidth="3.5"
                  stroke="var(--primary-color, #6366f1)"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="quota-percent-center">
                <strong>{targetPercent}%</strong>
                <small>Quota</small>
              </div>
            </div>

            <div className="quota-details">
              <div className="quota-label">
                <FiTarget /> Team Monthly Target
              </div>
              <div className="quota-val-row">
                <span className="current-achieved">{formatCurrency(totalClosed, 'INR')}</span>
                <span className="target-goal">/ {formatCurrency(teamTarget, 'INR')}</span>
              </div>
              <div className="quota-status-msg">
                <FiZap color="#10b981" /> Team is pacing <strong>14% ahead</strong> of target
              </div>
            </div>
          </div>

          {/* Runners-up List */}
          <div className="runners-up-card">
            <h5>Top Contenders</h5>
            <div className="runners-list">
              {runnersUp.map((rep) => (
                <div key={rep.rank} className="runner-row">
                  <div className="runner-left">
                    <span className="runner-rank">#{rep.rank}</span>
                    <div className="runner-avatar-sm">
                      {rep.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="runner-name">{rep.name}</div>
                      <div className="runner-sub">{rep.dealsClosed} deals</div>
                    </div>
                  </div>
                  <div className="runner-right">
                    <strong>{formatCurrency(rep.revenue, 'INR')}</strong>
                    <span className="runner-target-badge">{rep.targetAchievement}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesLeaderboardPodium;

