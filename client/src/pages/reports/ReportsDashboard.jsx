import { useState, useEffect, useRef } from 'react';
import { reportService } from '../../services/reportService';
import Loader from '../../components/common/Loader';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiCalendar, FiFilter, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { formatCurrency } from '../../utils/format';
import '../../styles/employee/timesheets.css';

const ReportsDashboard = () => {
    const [loading, setLoading] = useState(true);

    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef(null);
    const buttonRef = useRef(null);

    // UI State for inputs
    const [filterInputs, setFilterInputs] = useState({
        reportType: 'sales', // sales, leads, marketing
        dateFrom: '',
        dateTo: ''
    });

    const [activeFilters, setActiveFilters] = useState({
        reportType: 'sales',
        dateFrom: '',
        dateTo: ''
    });

    const [salesData, setSalesData] = useState([]);
    const [leadData, setLeadData] = useState([]);
    const [marketingData, setMarketingData] = useState([]);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            console.log('📊 Fetching reports data...');

            const [salesRes, leadsRes, marketingRes] = await Promise.all([
                reportService.getSalesPerformance().catch(err => {
                    console.error('❌ Sales Performance Error:', err.response?.data || err.message);
                    return { data: { success: false } };
                }),
                reportService.getLeadConversion().catch(err => {
                    console.error('❌ Lead Conversion Error:', err.response?.data || err.message);
                    return { data: { success: false } };
                }),
                reportService.getMarketingROI().catch(err => {
                    console.error('❌ Marketing ROI Error:', err.response?.data || err.message);
                    return { data: { success: false } };
                })
            ]);

            console.log('📈 Sales Response:', salesRes.data);
            console.log('🎯 Leads Response:', leadsRes.data);
            console.log('📢 Marketing Response:', marketingRes.data);

            if (salesRes.data?.success) {
                console.log('✅ Sales data loaded:', salesRes.data.data.length, 'items');
                setSalesData(salesRes.data.data);
            } else {
                console.log('⚠️ No sales data available');
            }

            if (leadsRes.data?.success) {
                console.log('✅ Lead data loaded:', leadsRes.data.data.length, 'items');
                setLeadData(leadsRes.data.data);
            } else {
                console.log('⚠️ No lead data available');
            }

            if (marketingRes.data?.success) {
                console.log('✅ Marketing data loaded:', marketingRes.data.data.length, 'items');
                setMarketingData(marketingRes.data.data);
            } else {
                console.log('⚠️ No marketing data available');
            }

        } catch (error) {
            console.error("❌ Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        setActiveFilters(filterInputs);
        // Note: Actual filtering would happen here if API supported it, 
        // or we could filter the existing data arrays client-side.
        // For now, we just update the UI state to match the pattern.
    };

    const handleClearFilters = () => {
        const resetState = { reportType: 'sales', dateFrom: '', dateTo: '' };
        setFilterInputs(resetState);
        setActiveFilters(resetState);
    };

    const getActiveCount = () => {
        let count = 0;
        if (filterInputs.dateFrom) count++;
        if (filterInputs.dateTo) count++;
        return count;
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="timesheets-list-page">
            {/* Header Row */}
            <div className="timesheets-page-header">
                <div className="header-title-group">
                    <h1 className="page-title">Reports & Analytics</h1>
                    <p className="page-subtitle">Unified insights across Sales, Marketing, and Leads</p>
                </div>
                <div className="header-actions">
                    <button
                        ref={buttonRef}
                        className="btn filter-btn-mobile"
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            display: 'none',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: '100px',
                            justifyContent: 'center',
                            background: showFilters ? '#eff6ff' : 'white',
                            border: showFilters ? '1px solid #3b82f6' : '1px solid #d1d5db',
                            color: showFilters ? '#2563eb' : '#374151',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FiFilter style={{ color: showFilters ? '#2563eb' : '#6b7280' }} />
                        <span style={{ fontWeight: 500 }}>Filters</span>
                        {showFilters ? <FiChevronUp /> : <FiChevronDown />}
                        {(getActiveCount() > 0) && (
                            <span style={{
                                background: '#3b82f6',
                                color: 'white',
                                padding: '1px 6px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: 700
                            }}>
                                {getActiveCount()}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Toolbar Container - Relative for Filter Panel positioning */}
            <div style={{ position: 'relative', zIndex: 50 }}>
                {/* 1. Main Toolbar Row (Desktop) */}
                <div className="toolbar-desktop" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {/* Right: Filter Toggle */}
                    <button
                        ref={buttonRef}
                        className="btn"
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: '100px',
                            justifyContent: 'center',
                            background: showFilters ? '#eff6ff' : 'white',
                            border: showFilters ? '1px solid #3b82f6' : '1px solid #d1d5db',
                            color: showFilters ? '#2563eb' : '#374151',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FiFilter style={{ color: showFilters ? '#2563eb' : '#6b7280' }} />
                        <span style={{ fontWeight: 500 }}>Filters</span>
                        {showFilters ? <FiChevronUp /> : <FiChevronDown />}
                        {(getActiveCount() > 0) && (
                            <span style={{
                                background: '#3b82f6',
                                color: 'white',
                                padding: '1px 6px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: 700
                            }}>
                                {getActiveCount()}
                            </span>
                        )}
                    </button>
                </div>

                {/* 2. Filter Panel (Absolute Overlay) */}
                {showFilters && (
                    <div className="filter-panel-overlay fade-in" ref={filterRef} style={{
                        position: 'absolute',
                        top: '100%',
                        right: '0',
                        width: '320px',
                        background: '#f9fafb',
                        padding: '24px',
                        marginTop: '8px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        zIndex: 2000,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

                            {/* Report Type Selector */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Report Type</label>
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <select
                                        value={filterInputs.reportType}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, reportType: e.target.value })}
                                        style={{
                                            appearance: 'none',
                                            width: '100%',
                                            background: 'white',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            padding: '0 32px 0 12px',
                                            fontSize: '13px',
                                            color: '#374151',
                                            height: '38px',
                                            cursor: 'pointer',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value="sales">Sales Performance</option>
                                        <option value="leads">Lead Conversion</option>
                                        <option value="marketing">Marketing ROI</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Date Range Filters */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Range</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0 12px', height: '38px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <input
                                        type="date"
                                        value={filterInputs.dateFrom}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, dateFrom: e.target.value })}
                                        style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#374151', background: 'transparent' }}
                                    />
                                    <span style={{ color: '#9ca3af' }}>→</span>
                                    <input
                                        type="date"
                                        value={filterInputs.dateTo}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, dateTo: e.target.value })}
                                        style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#374151', background: 'transparent' }}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', height: '38px', marginTop: '8px' }}>
                                <button
                                    onClick={handleClearFilters}
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: '#6b7280',
                                        background: 'transparent',
                                        border: '1px solid transparent',
                                        cursor: 'pointer',
                                        padding: '0 12px',
                                        borderRadius: '6px',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'color 0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#111827';
                                        e.currentTarget.style.background = '#f3f4f6';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#6b7280';
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => { handleApplyFilters(); setShowFilters(false); }}
                                    style={{
                                        background: '#2563eb', // Primary Blue
                                        color: 'white',
                                        border: 'none',
                                        padding: '0 20px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        borderRadius: '6px',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Apply
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </div>

            {/* Visual Divider */}
            <div style={{ height: '1px', background: '#e5e7eb', margin: '0' }}></div>

            {/* Content - EXACT ORIGINAL CONTENT preserved inside the new wrapper */}
            <div className="timesheets-content-wrapper">
                {loading ? <div style={{ padding: '20px', textAlign: 'center' }}><Loader /></div> : (
                    <>
                        {/* Use activeFilters.reportType to switch views, effectively replacing tabs */}
                        {(activeFilters.reportType === 'sales' || (!activeFilters.reportType && filterInputs.reportType === 'sales')) && (
                            <div className="card">
                                <h3>Sales Performance by Deal Value</h3>
                                <div style={{ height: 400, marginTop: '20px' }}>
                                    {salesData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={salesData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                                <Legend />
                                                <Bar dataKey="revenue" fill="#8884d8" name="Revenue Generated" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '100%',
                                            padding: '40px',
                                            textAlign: 'center',
                                            color: '#6b7280'
                                        }}>
                                            <FiBarChart2 style={{ fontSize: '64px', color: '#d1d5db', marginBottom: '16px' }} />
                                            <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                                No Sales Data Available
                                            </h4>
                                            <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '400px', lineHeight: '1.6' }}>
                                                Sales performance data will appear here once you have closed deals.
                                                Create deals and mark them as "Closed Won" to see performance metrics.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {salesData.length > 0 && (
                                    <div style={{ marginTop: '20px' }}>
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Employee</th>
                                                    <th>Deals Won</th>
                                                    <th>Total Revenue</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {salesData.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{item.name}</td>
                                                        <td>{item.dealsWon}</td>
                                                        <td>{formatCurrency(item.revenue)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeFilters.reportType === 'leads' && (
                            <div className="card">
                                <h3>Lead Source Distribution</h3>
                                <div style={{ height: 400, marginTop: '20px' }}>
                                    {leadData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={leadData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={150}
                                                    fill="#8884d8"
                                                    dataKey="totalCount"
                                                    nameKey="_id"
                                                >
                                                    {leadData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '100%',
                                            padding: '40px',
                                            textAlign: 'center',
                                            color: '#6b7280'
                                        }}>
                                            <FiPieChart style={{ fontSize: '64px', color: '#d1d5db', marginBottom: '16px' }} />
                                            <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                                No Lead Data Available
                                            </h4>
                                            <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '400px', lineHeight: '1.6' }}>
                                                Lead conversion data will appear here once you have leads in your system.
                                                Add leads from different sources to see conversion metrics.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeFilters.reportType === 'marketing' && (
                            <div className="card">
                                <h3>Campaign ROI Analysis</h3>
                                <div style={{ height: 400, marginTop: '20px' }}>
                                    {marketingData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={marketingData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="budget" fill="#82ca9d" name="Budget" />
                                                <Bar dataKey="actualSpend" fill="#8884d8" name="Actual Spend" />
                                                <Bar dataKey="roi" fill="#ffc658" name="ROI %" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '100%',
                                            padding: '40px',
                                            textAlign: 'center',
                                            color: '#6b7280'
                                        }}>
                                            <FiTrendingUp style={{ fontSize: '64px', color: '#d1d5db', marginBottom: '16px' }} />
                                            <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                                No Campaign Data Available
                                            </h4>
                                            <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '400px', lineHeight: '1.6' }}>
                                                Marketing campaign ROI data will appear here once you create campaigns.
                                                Create marketing campaigns to track budget, spend, and ROI metrics.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportsDashboard;
