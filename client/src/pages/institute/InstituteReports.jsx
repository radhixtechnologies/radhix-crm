import { useState, useEffect, useCallback } from 'react';
import {
  FiBarChart2,
  FiTrendingUp,
  FiDollarSign,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiBookOpen,
  FiLayers,
  FiCalendar,
} from 'react-icons/fi';
import { instituteService } from '../../services/instituteService';
import Loader from '../../components/common/Loader';
import './InstituteCommon.css';

const InstituteReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await instituteService.getOverviewReports({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setData(res.data?.data || null);
    } catch (err) {
      console.error('Error fetching institute reports:', err);
      setError(err.response?.data?.message || 'Failed to load institute analytics and reports.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="institute-page">
      <header className="institute-header">
        <div>
          <span className="institute-eyebrow"><FiBarChart2 /> ANALYTICS & INSIGHTS</span>
          <h1>Institute Reports</h1>
          <p>Admissions funnel, conversion metrics, follow-up health, batch occupancy, and fee collection summaries.</p>
        </div>
      </header>

      {error && <div className="institute-alert institute-alert--danger">{error}</div>}

      {/* Date Filter Toolbar */}
      <div className="institute-toolbar">
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
          <FiCalendar color="#4f46e5" /> From:
          <input
            type="date"
            className="institute-select"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
          To:
          <input
            type="date"
            className="institute-select"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        {(startDate || endDate) && (
          <button
            type="button"
            className="institute-btn-secondary institute-btn-sm"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
          >
            Clear Date Filters
          </button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : !data ? (
        <div className="institute-empty-state">
          <FiBarChart2 />
          <h3>No Data Available</h3>
          <p>Start recording inquiries and enrolling students to view analytics.</p>
        </div>
      ) : (
        <div>
          {/* Top KPI Cards */}
          <div className="institute-stats-grid">
            <div className="institute-stat-card">
              <div className="institute-stat-icon institute-stat-icon--indigo">
                <FiUsers />
              </div>
              <div className="institute-stat-content">
                <h4>Total Inquiries</h4>
                <div className="stat-value">{data.totalInquiries}</div>
              </div>
            </div>

            <div className="institute-stat-card">
              <div className="institute-stat-icon institute-stat-icon--emerald">
                <FiCheckCircle />
              </div>
              <div className="institute-stat-content">
                <h4>Enrolled Students</h4>
                <div className="stat-value" style={{ color: '#059669' }}>
                  {data.totalStudents} ({data.activeStudents} active)
                </div>
              </div>
            </div>

            <div className="institute-stat-card">
              <div className="institute-stat-icon institute-stat-icon--cyan">
                <FiTrendingUp />
              </div>
              <div className="institute-stat-content">
                <h4>Conversion Rate</h4>
                <div className="stat-value" style={{ color: '#0891b2' }}>
                  {data.conversionRate}%
                </div>
              </div>
            </div>

            <div className="institute-stat-card">
              <div className="institute-stat-icon institute-stat-icon--amber">
                <FiDollarSign />
              </div>
              <div className="institute-stat-content">
                <h4>Fee Collection Rate</h4>
                <div className="stat-value" style={{ color: '#d97706' }}>
                  {data.feeStats?.collectionRate || 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Grid of Analytical Breakdown Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Admissions Funnel */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiUsers color="#4f46e5" /> Admissions Funnel Stages
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>1. New Inquiry</span>
                    <strong>{data.stageBreakdown?.new || 0}</strong>
                  </div>
                  <div style={{ background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${data.totalInquiries > 0 ? ((data.stageBreakdown?.new || 0) / data.totalInquiries) * 100 : 0}%`, background: '#94a3b8', height: '100%' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>2. Contacted</span>
                    <strong>{data.stageBreakdown?.contacted || 0}</strong>
                  </div>
                  <div style={{ background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${data.totalInquiries > 0 ? ((data.stageBreakdown?.contacted || 0) / data.totalInquiries) * 100 : 0}%`, background: '#38bdf8', height: '100%' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>3. Counselling / Qualified</span>
                    <strong>{data.stageBreakdown?.qualified || 0}</strong>
                  </div>
                  <div style={{ background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${data.totalInquiries > 0 ? ((data.stageBreakdown?.qualified || 0) / data.totalInquiries) * 100 : 0}%`, background: '#818cf8', height: '100%' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>4. Admitted / Enrolled</span>
                    <strong style={{ color: '#059669' }}>{data.stageBreakdown?.converted || 0}</strong>
                  </div>
                  <div style={{ background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${data.totalInquiries > 0 ? ((data.stageBreakdown?.converted || 0) / data.totalInquiries) * 100 : 0}%`, background: '#10b981', height: '100%' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>5. Not Proceeding / Lost</span>
                    <strong style={{ color: '#94a3b8' }}>{data.stageBreakdown?.lost || 0}</strong>
                  </div>
                  <div style={{ background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${data.totalInquiries > 0 ? ((data.stageBreakdown?.lost || 0) / data.totalInquiries) * 100 : 0}%`, background: '#cbd5e1', height: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Follow-up Pipeline Health */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiClock color="#4f46e5" /> Follow-up Activity & Health
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600 }}>Overdue Follow-ups</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                    {data.followUpStats?.overdue || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: '#b91c1c' }}>Needs urgent counselor call</div>
                </div>

                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}>Due Today</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                    {data.followUpStats?.dueToday || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: '#b45309' }}>Scheduled for today</div>
                </div>

                <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#3730a3', fontWeight: 600 }}>Total Pending</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#4f46e5', marginTop: '4px' }}>
                    {data.followUpStats?.pending || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: '#4338ca' }}>In queue</div>
                </div>

                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#065f46', fontWeight: 600 }}>Completed</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                    {data.followUpStats?.completed || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: '#047857' }}>Successfully handled</div>
                </div>
              </div>
            </div>

            {/* Fee Collection & Outstanding Ledger */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiDollarSign color="#4f46e5" /> Financial Revenue & Receivables
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Total Tuition Billed:</span>
                  <strong>₹{data.feeStats?.totalBilled?.toLocaleString() || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#059669' }}>Total Fees Collected:</span>
                  <strong style={{ color: '#059669' }}>₹{data.feeStats?.totalCollected?.toLocaleString() || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#dc2626' }}>Total Outstanding Due:</span>
                  <strong style={{ color: '#dc2626' }}>₹{data.feeStats?.totalOutstanding?.toLocaleString() || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Student Fee Status Breakdown:</span>
                  <span>
                    <strong style={{ color: '#059669' }}>{data.feeStats?.paidCount || 0} Paid</strong> &bull;{' '}
                    <strong style={{ color: '#d97706' }}>{data.feeStats?.partialCount || 0} Partial</strong> &bull;{' '}
                    <strong style={{ color: '#dc2626' }}>{data.feeStats?.unpaidCount || 0} Unpaid</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tables: Course Popularity & Batch Occupancy */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            {/* Courses Popularity */}
            <div className="institute-table-card">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiBookOpen color="#4f46e5" /> Course Admissions & Inquiries
                </h3>
              </div>
              <div className="institute-table-scroll">
                <table className="institute-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Code</th>
                      <th>Base Fee</th>
                      <th>Inquiries</th>
                      <th>Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.courseStats?.map((c) => (
                      <tr key={c._id}>
                        <td><strong>{c.name}</strong></td>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.code}</span></td>
                        <td>₹{c.baseFee?.toLocaleString()}</td>
                        <td>{c.inquiries}</td>
                        <td><strong style={{ color: '#059669' }}>{c.enrolledCount}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Batch Occupancy */}
            <div className="institute-table-card">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiLayers color="#4f46e5" /> Batch Capacity & Occupancy
                </h3>
              </div>
              <div className="institute-table-scroll">
                <table className="institute-table">
                  <thead>
                    <tr>
                      <th>Batch</th>
                      <th>Course</th>
                      <th>Enrolled / Capacity</th>
                      <th>Occupancy</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.batchStats?.map((b) => (
                      <tr key={b._id}>
                        <td><strong>{b.name}</strong></td>
                        <td>{b.courseName}</td>
                        <td>{b.enrolledCount} / {b.capacity}</td>
                        <td>
                          <span className={`institute-badge ${b.occupancyRate >= 80 ? 'institute-badge--warning' : 'institute-badge--success'}`}>
                            {b.occupancyRate}%
                          </span>
                        </td>
                        <td>
                          <span className="institute-badge institute-badge--neutral">
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstituteReports;
