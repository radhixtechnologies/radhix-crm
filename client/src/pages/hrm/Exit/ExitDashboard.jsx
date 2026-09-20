import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrmService } from '../../../services/hrmService';
import '../../../styles/hrm/exit.css';

const ExitDashboard = () => {
    const navigate = useNavigate();
    const [exitRequests, setExitRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        department: '',
        fromDate: '',
        toDate: ''
    });

    useEffect(() => {
        fetchExitRequests();
    }, [filters]);

    const fetchExitRequests = async () => {
        try {
            setLoading(true);
            const response = await hrmService.getAllExitRequests(filters);
            setExitRequests(response.data.data || []);
        } catch (error) {
            console.error('Error fetching exit requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const getStatusLabel = (status) => {
        const labels = {
            submitted: 'Submitted',
            manager_approved: 'Manager Approved',
            manager_rejected: 'Manager Rejected',
            hr_approved: 'HR Approved',
            hr_rejected: 'HR Rejected',
            exit_initiated: 'Exit Initiated',
            in_progress: 'In Progress',
            completed: 'Completed',
            cancelled: 'Cancelled'
        };
        return labels[status] || status;
    };

    const calculateProgress = (request) => {
        let completed = 0;
        const total = 4; // Tasks, Assets, Interview, FnF

        if (request.allTasksCompleted) completed++;
        if (request.allAssetsReturned) completed++;
        if (request.exitInterviewCompleted) completed++;
        if (request.fnfProcessed) completed++;

        return Math.round((completed / total) * 100);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="exit-dashboard-container">
            <div className="dashboard-header">
                <div className="page-header">
                    <h1>Exit Management</h1>
                    <p>Manage employee resignations and offboarding</p>
                </div>
                <div className="dashboard-actions">
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/hrm/exit/submit')}
                    >
                        <i className="fas fa-plus"></i> Submit Resignation
                    </button>
                </div>
            </div>

            <div className="exit-filters">
                <div className="filter-group">
                    <label>Status</label>
                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                    >
                        <option value="">All Statuses</option>
                        <option value="submitted">Submitted</option>
                        <option value="manager_approved">Manager Approved</option>
                        <option value="hr_approved">HR Approved</option>
                        <option value="exit_initiated">Exit Initiated</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>From Date</label>
                    <input
                        type="date"
                        name="fromDate"
                        value={filters.fromDate}
                        onChange={handleFilterChange}
                    />
                </div>

                <div className="filter-group">
                    <label>To Date</label>
                    <input
                        type="date"
                        name="toDate"
                        value={filters.toDate}
                        onChange={handleFilterChange}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i> Loading exit requests...
                </div>
            ) : exitRequests.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-inbox"></i>
                    <p>No exit requests found</p>
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/hrm/exit/submit')}
                    >
                        Submit Resignation
                    </button>
                </div>
            ) : (
                <div className="exit-grid">
                    {exitRequests.map(request => (
                        <div
                            key={request._id}
                            className="exit-card"
                            onClick={() => navigate(`/hrm/exit/${request._id}`)}
                        >
                            <div className="exit-card-header">
                                <div className="employee-info">
                                    <h3>
                                        {request.employee?.firstName} {request.employee?.lastName}
                                    </h3>
                                    <p>{request.employee?.employeeId} • {request.employee?.designation}</p>
                                </div>
                                <span className={`status-badge status-${request.status}`}>
                                    {getStatusLabel(request.status)}
                                </span>
                            </div>

                            <div className="exit-card-body">
                                <div className="exit-meta">
                                    <div className="meta-row">
                                        <i className="fas fa-calendar"></i>
                                        <span>Resignation Date: <strong>{formatDate(request.resignationDate)}</strong></span>
                                    </div>
                                    <div className="meta-row">
                                        <i className="fas fa-calendar-check"></i>
                                        <span>Last Working Day: <strong>{formatDate(request.actualLastWorkingDay || request.proposedLastWorkingDay)}</strong></span>
                                    </div>
                                    <div className="meta-row">
                                        <i className="fas fa-info-circle"></i>
                                        <span>Reason: <strong>{request.exitReason?.replace('_', ' ')}</strong></span>
                                    </div>
                                    <div className="meta-row">
                                        <i className="fas fa-clock"></i>
                                        <span>Notice Period: <strong>{request.noticePeriodDays} days</strong></span>
                                    </div>
                                </div>

                                {request.status === 'in_progress' && (
                                    <div className="exit-progress">
                                        <div className="progress-label">
                                            <span>Exit Progress</span>
                                            <span>{calculateProgress(request)}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${calculateProgress(request)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExitDashboard;
