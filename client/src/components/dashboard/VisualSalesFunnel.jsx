import { useState } from 'react';
import {
  FiFilter,
  FiTrendingUp,
  FiClock,
  FiArrowDown,
  FiDollarSign,
  FiCheckCircle,
} from 'react-icons/fi';
import { formatCurrency } from '../../utils/format';
import './VisualSalesFunnel.css';

const DEFAULT_STAGES = [
  {
    id: 'stage-1',
    name: '1. Lead Inquiries (Top of Funnel)',
    count: 480,
    value: 14500000,
    conversionRate: 100,
    dropRate: 0,
    avgDays: '0.5 Days',
    colorGradient: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
    widthPercent: 100,
  },
  {
    id: 'stage-2',
    name: '2. Contacted & Engaged',
    count: 384,
    value: 11600000,
    conversionRate: 80,
    dropRate: 20,
    avgDays: '1.4 Days',
    colorGradient: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)',
    widthPercent: 82,
  },
  {
    id: 'stage-3',
    name: '3. Qualified Opportunities',
    count: 220,
    value: 7800000,
    conversionRate: 46,
    dropRate: 34,
    avgDays: '3.1 Days',
    colorGradient: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)',
    widthPercent: 62,
  },
  {
    id: 'stage-4',
    name: '4. Proposal & Quotation Presented',
    count: 118,
    value: 4800000,
    conversionRate: 25,
    dropRate: 21,
    avgDays: '4.6 Days',
    colorGradient: 'linear-gradient(90deg, #0d9488 0%, #14b8a6 100%)',
    widthPercent: 44,
  },
  {
    id: 'stage-5',
    name: '5. Deals Closed - Won Revenue',
    count: 72,
    value: 3250000,
    conversionRate: 15,
    dropRate: 10,
    avgDays: '12.8 Days Total',
    colorGradient: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
    widthPercent: 28,
  },
];

const VisualSalesFunnel = ({ stages = DEFAULT_STAGES }) => {
  const [selectedStage, setSelectedStage] = useState(null);
  const [viewFilter, setViewFilter] = useState('all');

  const totalWonValue = stages[stages.length - 1]?.value || 0;
  const overallWinRate = stages[stages.length - 1]?.conversionRate || 15;

  return (
    <div className="sales-funnel-card card">
      {/* Header */}
      <div className="funnel-header">
        <div className="funnel-title-group">
          <div className="funnel-icon-box">
            <FiFilter />
          </div>
          <div>
            <h3>Interactive Sales Pipeline Funnel</h3>
            <p>Stage conversion velocity, drop-off analytics &amp; revenue forecast</p>
          </div>
        </div>

        <div className="funnel-header-kpis">
          <div className="funnel-kpi-pill">
            <FiCheckCircle color="#10b981" />
            <span>Overall Win Rate: <strong>{overallWinRate}%</strong></span>
          </div>
          <div className="funnel-kpi-pill">
            <FiDollarSign color="#6366f1" />
            <span>Booked Revenue: <strong>{formatCurrency(totalWonValue, 'INR')}</strong></span>
          </div>
          <div className="funnel-kpi-pill">
            <FiClock color="#f59e0b" />
            <span>Avg Cycle: <strong>12.8 Days</strong></span>
          </div>
        </div>
      </div>

      {/* 3D TAPERED FUNNEL VISUALIZATION */}
      <div className="funnel-stages-container">
        {stages.map((stg, idx) => {
          const isSelected = selectedStage?.id === stg.id;
          return (
            <div
              key={stg.id}
              className={`funnel-stage-row ${isSelected ? 'active' : ''}`}
              onMouseEnter={() => setSelectedStage(stg)}
              onMouseLeave={() => setSelectedStage(null)}
            >
              {/* Tapered Funnel Bar */}
              <div className="funnel-bar-track">
                <div
                  className="funnel-bar-fill"
                  style={{
                    width: `${stg.widthPercent}%`,
                    background: stg.colorGradient,
                  }}
                >
                  <div className="bar-glow-highlight"></div>
                  <div className="bar-content">
                    <span className="stage-name-text">{stg.name}</span>
                    <span className="stage-count-badge">{stg.count} Deals</span>
                  </div>
                </div>
              </div>

              {/* Stage Metrics Info */}
              <div className="stage-meta-strip">
                <div className="meta-val-box">
                  <span className="meta-num">{formatCurrency(stg.value, 'INR')}</span>
                  <span className="meta-label">Pipeline Value</span>
                </div>

                <div className="meta-val-box">
                  <span className="meta-num conversion">{stg.conversionRate}%</span>
                  <span className="meta-label">Conversion Rate</span>
                </div>

                {stg.dropRate > 0 && (
                  <div className="meta-val-box drop">
                    <span className="meta-num drop-text">
                      <FiArrowDown size={12} /> {stg.dropRate}%
                    </span>
                    <span className="meta-label">Stage Drop-off</span>
                  </div>
                )}

                <div className="meta-val-box">
                  <span className="meta-num"><FiClock size={12} /> {stg.avgDays}</span>
                  <span className="meta-label">Velocity</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Funnel Footnote & Insights */}
      <div className="funnel-insights-bar">
        <div className="insight-item">
          <FiTrendingUp color="#10b981" />
          <span><strong>Fastest Stage:</strong> Lead Engagement (1.4 days average)</span>
        </div>
        <div className="insight-item">
          <FiFilter color="#f59e0b" />
          <span><strong>Largest Opportunity:</strong> 34% drop-off at Qualification stage (Needs follow-up speed)</span>
        </div>
      </div>
    </div>
  );
};

export default VisualSalesFunnel;

