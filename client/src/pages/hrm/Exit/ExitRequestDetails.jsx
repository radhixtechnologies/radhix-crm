import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hrmService } from '../../../services/hrmService';
import { useAuth } from '../../../context/AuthContext';
import { FiArrowLeft, FiCheckCircle, FiClock, FiFileText, FiDollarSign, FiLock, FiDownload, FiCheckSquare, FiAlertCircle } from 'react-icons/fi';
import Loader from '../../../components/common/Loader';
import { formatDate } from '../../../utils/format';
import '../../../styles/hrm/exit.css';

const ExitRequestDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [request, setRequest] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [settlement, setSettlement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details'); // details, tasks, settlement, closure
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskForm, setTaskForm] = useState({
        taskName: '',
        description: '',
        assignedTo: '',
        assignedRole: 'employee',
        category: 'handover',
        isMandatory: true,
        dueDate: ''
    });
    const [submittingTask, setSubmittingTask] = useState(false);

    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

    useEffect(() => {
        fetchExitRequest();
    }, [id]);

    const fetchExitRequest = async () => {
        try {
            setLoading(true);
            const [reqRes, tasksRes, settlementRes] = await Promise.all([
                hrmService.getExitRequest(id),
                hrmService.getExitTasks(id).catch(e => ({ data: { data: [] } })), // specific to exit ID
                hrmService.getFinalSettlement(id)
                    .then(res => ({ data: res.data }))
                    .catch(e => {
                        // 404 is expected if settlement not calculated yet
                        if (e.response && e.response.status === 404) return { data: { data: null } };
                        console.error('Settlement fetch error:', e);
                        return { data: { data: null } };
                    })
            ]);

            setRequest(reqRes.data.data);
            setTasks(tasksRes.data.data || []);
            setSettlement(settlementRes.data.data || null);
        } catch (error) {
            console.error('Error fetching exit details:', error);
            // alert('Failed to load exit request details');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!window.confirm('Are you sure you want to approve this exit request?')) return;
        try {
            await hrmService.approveExitRequest(id, {});
            fetchExitRequest();
            alert('Exit request approved');
        } catch (error) {
            alert(error.response?.data?.message || 'Approval failed');
        }
    };

    const handleGenerateDocuments = async () => {
        try {
            await hrmService.generateExitDocuments(id);
            fetchExitRequest();
            alert('Exit documents generated successfully');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to generate documents');
        }
    };

    const handleSystemExit = async () => {
        if (!window.confirm('This will deactivate the user account and revoke all access. Continue?')) return;
        try {
            await hrmService.processSystemExit(id);
            fetchExitRequest();
            alert('System exit processed successfully');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to process system exit');
        }
    };

    const handleCalculateSettlement = async () => {
        try {
            await hrmService.calculateFinalSettlement(id);
            fetchExitRequest();
            alert('Settlement calculated successfully');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to calculate settlement');
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!taskForm.taskName || !taskForm.assignedRole) {
            alert('Please fill in required fields');
            return;
        }

        try {
            setSubmittingTask(true);
            await hrmService.createExitTask(id, taskForm);
            alert('Task created successfully');
            setShowTaskModal(false);
            setTaskForm({
                taskName: '',
                description: '',
                assignedTo: '',
                assignedRole: 'employee',
                category: 'handover',
                isMandatory: true,
                dueDate: ''
            });
            fetchExitRequest();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create task');
        } finally {
            setSubmittingTask(false);
        }
    };

    const handleTaskFormChange = (field, value) => {
        setTaskForm(prev => ({ ...prev, [field]: value }));
    };


    if (loading) return <Loader />;

    if (!request) {
        return (
            <div className="empty-state">
                <FiAlertCircle size={48} />
                <p>Exit request not found</p>
                <button className="btn-secondary" onClick={() => navigate('/hrm/exit')}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const { employee, closureStatus, documentsGenerated } = request;

    return (
        <div className="exit-details-container">
            <div className="page-header">
                <button className="btn-back" onClick={() => navigate('/hrm/exit')}>
                    <FiArrowLeft /> Back
                </button>
                <div style={{ flex: 1 }}>
                    <h1>Exit Request Details</h1>
                    <p>
                        {employee?.user?.name || 'Unknown Employee'} ({employee?.employeeId})
                        <span className={`status-badge status-${request.status}`} style={{ marginLeft: '10px' }}>
                            {request.status.replace('_', ' ').toUpperCase()}
                        </span>
                    </p>
                </div>

                {isAdmin && request.status === 'submitted' && (
                    <button className="btn btn-primary" onClick={handleApprove}>
                        <FiCheckCircle /> Approve Request
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                >
                    <FiFileText /> Details
                </button>
                <button
                    className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tasks')}
                >
                    <FiCheckSquare /> Exit Tasks
                </button>
                <button
                    className={`tab ${activeTab === 'settlement' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settlement')}
                >
                    <FiDollarSign /> Settlement
                </button>
                {isAdmin && (
                    <button
                        className={`tab ${activeTab === 'closure' ? 'active' : ''}`}
                        onClick={() => setActiveTab('closure')}
                    >
                        <FiLock /> Closure & Docs
                    </button>
                )}
            </div>

            <div className="exit-content">
                {activeTab === 'details' && (
                    <div className="card fade-in">
                        <h2>Request Information</h2>
                        <div className="exit-request-details">
                            <div className="detail-row">
                                <div>
                                    <label>Exit Type</label>
                                    <span className={`badge ${request.type === 'termination' ? 'badge-danger' : 'badge-secondary'}`}>
                                        {request.type ? request.type.toUpperCase() : 'RESIGNATION'}
                                    </span>
                                </div>
                            </div>
                            <div className="detail-row">
                                <div>
                                    <label>Initiated By</label>
                                    <span>{request.initiatedBy?.name || request.submittedBy?.name || 'Unknown'}</span>
                                </div>
                            </div>
                            <div className="detail-row">
                                <div>
                                    <label>Resignation Date</label>
                                    <span>{formatDate(request.resignationDate)}</span>
                                </div>
                            </div>
                            <div className="detail-row">
                                <div>
                                    <label>Last Working Day</label>
                                    <span>{formatDate(request.lastWorkingDate)}</span>
                                </div>
                            </div>
                            <div className="detail-row">
                                <div>
                                    <label>Reason</label>
                                    <span>{request.reason?.replace('_', ' ').toUpperCase()}</span>
                                </div>
                            </div>
                        </div>

                        {request.reasonDetails && (
                            <div className="detail-section" style={{ marginTop: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500 }}>Reason Details</label>
                                <p className="text-content">{request.reasonDetails}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="card fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2>Exit Tasks (Handover & Recovery)</h2>
                            {isAdmin && (
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setShowTaskModal(true)}
                                    style={{ padding: '8px 16px', fontSize: '13px' }}
                                >
                                    + Create Task
                                </button>
                            )}
                        </div>

                        {tasks.length === 0 ? (
                            <div className="empty-state-small" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                                <FiCheckSquare size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 500 }}>No tasks assigned yet.</p>
                                {isAdmin && (
                                    <p style={{ margin: 0, fontSize: '12px' }}>Click "Create Task" to add handover, asset return, or clearance tasks.</p>
                                )}
                            </div>
                        ) : (
                            <ul className="task-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {tasks.map(task => (
                                    <li key={task._id} className={`task-item ${task.status}`} style={{
                                        padding: '16px',
                                        borderBottom: '1px solid var(--border-color)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        gap: '16px'
                                    }}>
                                        <div className="task-info" style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                <strong style={{ fontSize: '14px' }}>{task.taskName}</strong>
                                                {task.isMandatory && (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        padding: '2px 6px',
                                                        background: '#fee2e2',
                                                        color: '#991b1b',
                                                        borderRadius: '4px',
                                                        fontWeight: 600
                                                    }}>MANDATORY</span>
                                                )}
                                            </div>
                                            {task.description && (
                                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0' }}>{task.description}</p>
                                            )}
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                                <span>📋 {task.category?.replace('_', ' ').toUpperCase()}</span>
                                                <span>👤 {task.assignedRole?.toUpperCase()}</span>
                                                {task.dueDate && (
                                                    <span>📅 Due: {formatDate(task.dueDate)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`status-tag ${task.status}`} style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            whiteSpace: 'nowrap',
                                            background: task.status === 'completed' ? '#d1fae5' : task.status === 'in_progress' ? '#dbeafe' : '#f3f4f6',
                                            color: task.status === 'completed' ? '#065f46' : task.status === 'in_progress' ? '#1e40af' : '#6b7280'
                                        }}>
                                            {task.status.replace('_', ' ')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="info-box" style={{ marginTop: '16px', padding: '12px', background: '#eff6ff', borderRadius: '6px', fontSize: '13px', color: '#1e40af' }}>
                            <p style={{ margin: 0 }}>💡 Tasks usually include asset return, knowledge transfer, and IT access revocation.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'settlement' && (
                    <div className="card fade-in">
                        <h2>Final Settlement</h2>

                        {!settlement ? (
                            <div className="empty-state-small" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                                <FiDollarSign size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 500 }}>No settlement calculation found.</p>
                                {isAdmin && request.status === 'approved' && (
                                    <button className="btn btn-primary" onClick={handleCalculateSettlement} style={{ marginTop: '10px' }}>
                                        <FiDollarSign /> Calculate Settlement
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="settlement-summary">
                                {/* Net Settlement - Highlighted */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    padding: '24px',
                                    borderRadius: '12px',
                                    marginBottom: '24px',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                                }}>
                                    <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Payable Amount</div>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
                                        ₹{settlement.netSettlement?.toLocaleString('en-IN') || '0'}
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', opacity: 0.9 }}>
                                        <span className={`status-badge`} style={{
                                            padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                                            background: settlement.status === 'paid' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
                                            color: 'white'
                                        }}>{settlement.status?.toUpperCase()}</span>
                                        <span>Calculated: {formatDate(settlement.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Earnings Breakdown */}
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>💰</span> Earnings
                                    </h3>
                                    <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '16px' }}>
                                        {settlement.earnings && (
                                            <>
                                                {settlement.earnings.basicSalary > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #d1fae5' }}>
                                                        <span style={{ fontSize: '13px' }}>Basic Salary</span>
                                                        <span style={{ fontSize: '13px', fontWeight: 600 }}>₹{settlement.earnings.basicSalary.toLocaleString('en-IN')}</span>
                                                    </div>
                                                )}
                                                {settlement.earnings.allowances > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #d1fae5' }}>
                                                        <span style={{ fontSize: '13px' }}>Allowances</span>
                                                        <span style={{ fontSize: '13px', fontWeight: 600 }}>₹{settlement.earnings.allowances.toLocaleString('en-IN')}</span>
                                                    </div>
                                                )}
                                                {settlement.earnings.bonus > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #d1fae5' }}>
                                                        <span style={{ fontSize: '13px' }}>Bonus</span>
                                                        <span style={{ fontSize: '13px', fontWeight: 600 }}>₹{settlement.earnings.bonus.toLocaleString('en-IN')}</span>
                                                    </div>
                                                )}
                                                {settlement.earnings.otherEarnings > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #d1fae5' }}>
                                                        <span style={{ fontSize: '13px' }}>Other Earnings</span>
                                                        <span style={{ fontSize: '13px', fontWeight: 600 }}>₹{settlement.earnings.otherEarnings.toLocaleString('en-IN')}</span>
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0 0', marginTop: '8px' }}>
                                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>Total Earnings</span>
                                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>₹{settlement.earnings.totalEarnings?.toLocaleString('en-IN') || '0'}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Deductions Breakdown */}
                                {settlement.deductions && settlement.deductions.totalDeductions > 0 && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>📉</span> Deductions
                                        </h3>
                                        <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '16px' }}>
                                            {settlement.deductions.unpaidLeaves > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #fee2e2' }}>
                                                    <span style={{ fontSize: '13px' }}>Unpaid Leaves</span>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626' }}>-₹{settlement.deductions.unpaidLeaves.toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                            {settlement.deductions.noticePeriod > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #fee2e2' }}>
                                                    <span style={{ fontSize: '13px' }}>Notice Period Recovery</span>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626' }}>-₹{settlement.deductions.noticePeriod.toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                            {settlement.deductions.loanRecovery > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #fee2e2' }}>
                                                    <span style={{ fontSize: '13px' }}>Loan Recovery</span>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626' }}>-₹{settlement.deductions.loanRecovery.toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                            {settlement.deductions.taxDeduction > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #fee2e2' }}>
                                                    <span style={{ fontSize: '13px' }}>Tax Deduction</span>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626' }}>-₹{settlement.deductions.taxDeduction.toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                            {settlement.deductions.otherDeductions > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #fee2e2' }}>
                                                    <span style={{ fontSize: '13px' }}>Other Deductions</span>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626' }}>-₹{settlement.deductions.otherDeductions.toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0 0', marginTop: '8px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>Total Deductions</span>
                                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>-₹{settlement.deductions.totalDeductions?.toLocaleString('en-IN') || '0'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Leave Encashment */}
                                {settlement.leaveEncashment && settlement.leaveEncashment.totalAmount > 0 && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>🏖️</span> Leave Encashment
                                        </h3>
                                        <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #dbeafe' }}>
                                                <span style={{ fontSize: '13px' }}>Eligible Days</span>
                                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{settlement.leaveEncashment.eligibleDays} days</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #dbeafe' }}>
                                                <span style={{ fontSize: '13px' }}>Rate per Day</span>
                                                <span style={{ fontSize: '13px', fontWeight: 600 }}>₹{settlement.leaveEncashment.ratePerDay?.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0 0', marginTop: '8px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#2563eb' }}>Total Amount</span>
                                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#2563eb' }}>₹{settlement.leaveEncashment.totalAmount?.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Gratuity */}
                                {settlement.gratuity && settlement.gratuity.eligible && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>🎁</span> Gratuity
                                        </h3>
                                        <div style={{ background: '#faf5ff', borderRadius: '8px', padding: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e9d5ff' }}>
                                                <span style={{ fontSize: '13px' }}>Years of Service</span>
                                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{settlement.gratuity.yearsOfService} years</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0 0', marginTop: '8px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#7c3aed' }}>Gratuity Amount</span>
                                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#7c3aed' }}>₹{settlement.gratuity.amount?.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {settlement.notes && (
                                    <div style={{ marginTop: '16px', padding: '12px', background: '#fef3c7', borderRadius: '6px', fontSize: '13px', color: '#92400e' }}>
                                        <strong>Notes:</strong> {settlement.notes}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'closure' && (
                    <div className="card fade-in">
                        <h2>Closure Actions</h2>

                        <div className="action-section" style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>1. Document Generation</h3>

                            {/* Termination Letter - Only for termination exits */}
                            {request.type === 'termination' && (
                                <div className="action-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div className="status-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FiCheckCircle color={documentsGenerated?.terminationLetter ? '#10b981' : '#9ca3af'} size={20} />
                                        <span style={{ color: documentsGenerated?.terminationLetter ? '#059669' : '#6b7280' }}>
                                            Termination Letter
                                            {documentsGenerated?.terminationLetter && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#10b981' }}>✓ Generated</span>}
                                        </span>
                                    </div>
                                    {documentsGenerated?.terminationLetterPath && (
                                        <a
                                            href={`${API_ROOT}${documentsGenerated.terminationLetterPath}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                padding: '4px 12px',
                                                fontSize: '12px',
                                                background: '#667eea',
                                                color: 'white',
                                                borderRadius: '4px',
                                                textDecoration: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <FiDownload size={14} />
                                            Download
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Experience Letter */}
                            <div className="action-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div className="status-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FiCheckCircle color={documentsGenerated?.experienceLetter ? '#10b981' : '#9ca3af'} size={20} />
                                    <span style={{ color: documentsGenerated?.experienceLetter ? '#059669' : '#6b7280' }}>
                                        Experience Letter
                                        {documentsGenerated?.experienceLetter && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#10b981' }}>✓ Generated</span>}
                                    </span>
                                </div>
                                {documentsGenerated?.experienceLetterPath && (
                                    <a
                                        href={`${API_ROOT}${documentsGenerated.experienceLetterPath}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            padding: '4px 12px',
                                            fontSize: '12px',
                                            background: '#667eea',
                                            color: 'white',
                                            borderRadius: '4px',
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <FiDownload size={14} />
                                        Download
                                    </a>
                                )}
                            </div>

                            {/* Relieving Letter */}
                            <div className="action-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div className="status-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FiCheckCircle color={documentsGenerated?.relievingLetter ? '#10b981' : '#9ca3af'} size={20} />
                                    <span style={{ color: documentsGenerated?.relievingLetter ? '#059669' : '#6b7280' }}>
                                        Relieving Letter
                                        {documentsGenerated?.relievingLetter && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#10b981' }}>✓ Generated</span>}
                                    </span>
                                </div>
                                {documentsGenerated?.relievingLetterPath && (
                                    <a
                                        href={`${API_ROOT}${documentsGenerated.relievingLetterPath}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            padding: '4px 12px',
                                            fontSize: '12px',
                                            background: '#667eea',
                                            color: 'white',
                                            borderRadius: '4px',
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <FiDownload size={14} />
                                        Download
                                    </a>
                                )}
                            </div>

                            {/* Generate Button */}
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={handleGenerateDocuments}
                                style={{
                                    padding: '8px 16px',
                                    fontSize: '13px',
                                    width: '100%',
                                    background: documentsGenerated?.generatedAt ? '#f59e0b' : '#667eea', // Orange for regenerate, Blue for generate
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <FiFileText style={{ marginRight: '6px' }} />
                                {documentsGenerated?.generatedAt
                                    ? `Regenerate Documents & Resend Email`
                                    : `Generate ${request.type === 'termination' ? '3' : '2'} Documents & Send Email`}
                            </button>

                            {documentsGenerated?.generatedAt && (
                                <div style={{ marginTop: '12px', padding: '12px', background: '#d1fae5', borderRadius: '6px', fontSize: '12px', color: '#065f46' }}>
                                    <p style={{ margin: 0 }}>
                                        <strong>✓ Documents sent on:</strong> {new Date(documentsGenerated.generatedAt).toLocaleString()}
                                    </p>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>
                                        {request.type === 'termination' ? 'Termination, Experience & Relieving' : 'Experience & Relieving'} letters emailed to {employee?.user?.email || 'employee'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="action-section">
                            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>2. System Exit</h3>
                            <div className="action-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="status-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FiLock color={closureStatus?.accountDeactivated ? 'red' : 'gray'} size={20} />
                                    <span>Deactivate Account & Revoke Access</span>
                                </div>
                                <button
                                    className="btn btn-sm"
                                    onClick={handleSystemExit}
                                    disabled={!!closureStatus?.accountDeactivated}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '13px',
                                        background: closureStatus?.accountDeactivated ? '#fee2e2' : '#ef4444',
                                        color: closureStatus?.accountDeactivated ? '#991b1b' : 'white',
                                        border: 'none',
                                        cursor: closureStatus?.accountDeactivated ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {closureStatus?.accountDeactivated ? 'Processed' : 'Process System Exit'}
                                </button>
                            </div>
                            {closureStatus?.completedAt && (
                                <p className="timestamp" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Completed on: {new Date(closureStatus.completedAt).toLocaleString()}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Task Creation Modal */}
            {showTaskModal && (
                <div className="modal-overlay" onClick={() => setShowTaskModal(false)} style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '20px' }}>Create Exit Task</h2>
                            <button
                                onClick={() => setShowTaskModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    padding: '0',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >×</button>
                        </div>

                        <form onSubmit={handleCreateTask}>
                            {/* Task Name */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                                    Task Name <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={taskForm.taskName}
                                    onChange={(e) => handleTaskFormChange('taskName', e.target.value)}
                                    placeholder="e.g., Return Laptop and Accessories"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            {/* Description */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                                    Description
                                </label>
                                <textarea
                                    value={taskForm.description}
                                    onChange={(e) => handleTaskFormChange('description', e.target.value)}
                                    placeholder="Provide additional details about this task..."
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            {/* Category */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                                    Category <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <select
                                    value={taskForm.category}
                                    onChange={(e) => handleTaskFormChange('category', e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        background: 'white'
                                    }}
                                >
                                    <option value="handover">Handover</option>
                                    <option value="documentation">Documentation</option>
                                    <option value="asset_return">Asset Return</option>
                                    <option value="access_revoke">Access Revoke</option>
                                    <option value="knowledge_transfer">Knowledge Transfer</option>
                                    <option value="clearance">Clearance</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Assigned Role */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                                    Assign To <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <select
                                    value={taskForm.assignedRole}
                                    onChange={(e) => handleTaskFormChange('assignedRole', e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        background: 'white'
                                    }}
                                >
                                    <option value="employee">Employee (Exiting)</option>
                                    <option value="manager">Manager</option>
                                    <option value="hr">HR Department</option>
                                    <option value="it">IT Department</option>
                                    <option value="admin">Admin</option>
                                    <option value="finance">Finance</option>
                                </select>
                            </div>

                            {/* Priority */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={taskForm.isMandatory}
                                        onChange={(e) => handleTaskFormChange('isMandatory', e.target.checked)}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                                        Mark as Mandatory
                                    </span>
                                </label>
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 24px' }}>
                                    Mandatory tasks must be completed before exit closure
                                </p>
                            </div>

                            {/* Due Date */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={taskForm.dueDate}
                                    onChange={(e) => handleTaskFormChange('dueDate', e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowTaskModal(false)}
                                    style={{
                                        padding: '10px 20px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        background: 'white',
                                        color: '#374151',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingTask}
                                    style={{
                                        padding: '10px 20px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: submittingTask ? '#9ca3af' : '#667eea',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        cursor: submittingTask ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {submittingTask ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExitRequestDetails;
