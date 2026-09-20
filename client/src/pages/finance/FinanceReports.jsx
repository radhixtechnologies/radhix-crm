import { useState, useEffect, useRef } from 'react';
import { financeService } from '../../services/financeService';
import Loader from '../../components/common/Loader';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiFilter, FiChevronDown, FiChevronUp, FiRefreshCw, FiDollarSign, FiArrowUpRight, FiArrowDownRight, FiFileText } from 'react-icons/fi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { formatCurrency } from '../../utils/format';
import '../../styles/finance/finance-reports-modern.css';

const FinanceReports = () => {
    const [loading, setLoading] = useState(true);

    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef(null);
    const buttonRef = useRef(null);

    // UI State for inputs
    const [filterInputs, setFilterInputs] = useState({
        reportType: 'income-expense', // income-expense, expenses, invoices
        dateFrom: '',
        dateTo: ''
    });

    const [activeFilters, setActiveFilters] = useState({
        reportType: 'income-expense',
        dateFrom: '',
        dateTo: ''
    });

    const [incomeExpenseData, setIncomeExpenseData] = useState([]);
    const [expenseData, setExpenseData] = useState([]);
    const [invoiceData, setInvoiceData] = useState([]);

    useEffect(() => {
        fetchReports();
    }, [activeFilters]);

    // Handle outside click for filters
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                filterRef.current &&
                !filterRef.current.contains(event.target) &&
                !buttonRef.current.contains(event.target)
            ) {
                setShowFilters(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const [summaryRes, expenseStatsRes, invoicesRes] = await Promise.all([
                financeService.getFinancialSummary(activeFilters).catch(err => ({ data: { success: false } })),
                financeService.getExpenseStats(activeFilters).catch(err => ({ data: { success: false } })),
                financeService.getInvoices({ ...activeFilters, limit: 1000 }).catch(err => ({ data: { success: false } })) // Fetch more for reporting
            ]);

            // 1. Income vs Expense Data
            if (summaryRes.data?.success) {
                const trend = summaryRes.data.data.incomeExpenseTrend || [];
                setIncomeExpenseData(trend.map(item => ({
                    name: item.month,
                    income: item.income,
                    expense: item.expense
                })));
            }

            // 2. Expense Breakdown Data
            if (expenseStatsRes.data?.success) {
                setExpenseData(expenseStatsRes.data.data.categoryWise || []);
            }

            // 3. Invoice Status Data (Processed from invoices)
            if (invoicesRes.data?.success) {
                const invoices = invoicesRes.data.data || [];
                const statusCounts = invoices.reduce((acc, inv) => {
                    const status = inv.status || 'unknown';
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, {});

                const processedInvoiceData = Object.keys(statusCounts).map(status => ({
                    name: status.charAt(0).toUpperCase() + status.slice(1),
                    value: statusCounts[status]
                }));
                setInvoiceData(processedInvoiceData);
            }

        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        setActiveFilters({ ...filterInputs });
        setShowFilters(false);
    };

    const handleClearFilters = () => {
        const resetState = { reportType: 'income-expense', dateFrom: '', dateTo: '' };
        setFilterInputs(resetState);
        setActiveFilters(resetState);
    };

    const getActiveCount = () => {
        let count = 0;
        if (filterInputs.dateFrom) count++;
        if (filterInputs.dateTo) count++;
        return count;
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
        <div className="reports-page">
            <div className="reports-container">
                {/* Header Row */}
                <div className="reports-header">
                    <div className="reports-header-content">
                        <h1>Finance Reports</h1>
                        <p>Detailed financial analysis and insights</p>
                    </div>

                    <div className="reports-header-actions">
                        {/* Refresh Button */}
                        <button className="report-btn report-btn-white" onClick={fetchReports}>
                            <FiRefreshCw /> Refresh
                        </button>

                        {/* Filter Toggle */}
                        <button
                            ref={buttonRef}
                            className={`report-btn ${showFilters ? 'report-btn-primary' : 'report-btn-white'}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <FiFilter />
                            <span>Filters</span>
                            {showFilters ? <FiChevronUp /> : <FiChevronDown />}
                            {(getActiveCount() > 0) && (
                                <span className="report-count-badge">
                                    {getActiveCount()}
                                </span>
                            )}
                        </button>

                        {/* Filter Panel (Dropdown) */}
                        {showFilters && (
                            <div className="filter-panel" ref={filterRef}>
                                {/* Report Type Selector */}
                                <div className="filter-group">
                                    <label className="filter-label">Report Type</label>
                                    <div className="filter-select_wrapper">
                                        <select
                                            className="filter-select"
                                            value={filterInputs.reportType}
                                            onChange={(e) => setFilterInputs({ ...filterInputs, reportType: e.target.value })}
                                        >
                                            <option value="income-expense">Income vs Expense</option>
                                            <option value="expenses">Expense Breakdown</option>
                                            <option value="invoices">Invoice Status Analysis</option>
                                        </select>
                                        <FiChevronDown style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: '#64748b',
                                            pointerEvents: 'none',
                                            fontSize: '16px'
                                        }} />
                                    </div>
                                </div>

                                {/* Date Range Filters */}
                                <div className="filter-group">
                                    <label className="filter-label">Date Range</label>
                                    <div className="filter-date-row">
                                        <input
                                            type="date"
                                            className="filter-date-input"
                                            value={filterInputs.dateFrom}
                                            onChange={(e) => setFilterInputs({ ...filterInputs, dateFrom: e.target.value })}
                                        />
                                        <span style={{ color: '#94a3b8' }}>→</span>
                                        <input
                                            type="date"
                                            className="filter-date-input"
                                            value={filterInputs.dateTo}
                                            onChange={(e) => setFilterInputs({ ...filterInputs, dateTo: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="filter-actions">
                                    <button
                                        className="filter-btn-reset"
                                        onClick={handleClearFilters}
                                    >
                                        Reset
                                    </button>
                                    <button
                                        className="filter-btn-apply"
                                        onClick={handleApplyFilters}
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                }}>
                    {/* Total Income */}
                    <div style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '20px'
                        }}>
                            <FiArrowUpRight />
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                                {formatCurrency(incomeExpenseData.reduce((sum, d) => sum + (d.income || 0), 0))}
                            </div>
                            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                                Total Income
                            </div>
                        </div>
                    </div>

                    {/* Total Expenses */}
                    <div style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '20px'
                        }}>
                            <FiArrowDownRight />
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                                {formatCurrency(incomeExpenseData.reduce((sum, d) => sum + (d.expense || 0), 0))}
                            </div>
                            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                                Total Expenses
                            </div>
                        </div>
                    </div>

                    {/* Total Invoices */}
                    <div style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '20px'
                        }}>
                            <FiFileText />
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                                {invoiceData.reduce((sum, d) => sum + (d.value || 0), 0)}
                            </div>
                            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                                Total Invoices
                            </div>
                        </div>
                    </div>

                    {/* Net Balance */}
                    <div style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '20px'
                        }}>
                            <FiDollarSign />
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                                {formatCurrency(incomeExpenseData.reduce((sum, d) => sum + (d.income || 0), 0) - incomeExpenseData.reduce((sum, d) => sum + (d.expense || 0), 0))}
                            </div>
                            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                                Net Balance
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="report-content">
                    {loading ? <div style={{ padding: '60px', textAlign: 'center' }}><Loader /></div> : (
                        <>
                            {/* Income vs Expense Chart */}
                            {activeFilters.reportType === 'income-expense' && (
                                <div className="report-card">
                                    <div className="report-card-header">
                                        <h3 className="report-card-title">Income vs Expense Trend</h3>
                                    </div>
                                    <div className="chart-container">
                                        {incomeExpenseData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={incomeExpenseData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: '#f1f5f9' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                                        formatter={(value) => formatCurrency(value)}
                                                    />
                                                    <Legend
                                                        wrapperStyle={{ paddingTop: '20px' }}
                                                    />
                                                    <Bar dataKey="income" fill="#10B981" name="Income" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                                    <Bar dataKey="expense" fill="#EF4444" name="Expense" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="report-empty">
                                                <FiBarChart2 size={48} />
                                                <p>No financial data available for the selected period</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Expense Breakdown */}
                            {activeFilters.reportType === 'expenses' && (
                                <div className="report-card">
                                    <div className="report-card-header">
                                        <h3 className="report-card-title">Expense Category Breakdown</h3>
                                    </div>
                                    <div className="chart-container">
                                        {expenseData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={expenseData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                        outerRadius={140}
                                                        innerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="total"
                                                        nameKey="category"
                                                        paddingAngle={2}
                                                    >
                                                        {expenseData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={2} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                                        formatter={(value) => formatCurrency(value)}
                                                    />
                                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="report-empty">
                                                <FiPieChart size={48} />
                                                <p>No expense data available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Invoice Status */}
                            {activeFilters.reportType === 'invoices' && (
                                <div className="report-card">
                                    <div className="report-card-header">
                                        <h3 className="report-card-title">Invoice Status Analysis</h3>
                                    </div>
                                    <div className="chart-container">
                                        {invoiceData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={invoiceData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={true}
                                                        label={({ name, value }) => `${name}: ${value}`}
                                                        outerRadius={140}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                        nameKey="name"
                                                    >
                                                        {invoiceData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="report-empty">
                                                <FiTrendingUp size={48} />
                                                <p>No invoice data available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinanceReports;
