import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { hrmService } from '../../services/hrmService';
import { FiFileText, FiCheckCircle, FiXCircle, FiDollarSign, FiPackage, FiCalendar, FiAlertCircle, FiCheckSquare } from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { formatDate, formatCurrency } from '../../utils/format';
import dayjs from 'dayjs';
import '../../styles/forms.css';

const ExitProcess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [exitProcess, setExitProcess] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResignationModal, setShowResignationModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [resignationForm, setResignationForm] = useState({
    resignationDate: dayjs().format('YYYY-MM-DD'),
    lastWorkingDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    noticePeriod: 30,
    exitReason: '',
  });

  useEffect(() => {
    fetchExitProcess();
    fetchEmployee();
    fetchMyExitTasks();
  }, [id]);

  const fetchExitProcess = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getExitProcess(id);
      if (response.data.success) {
        setExitProcess(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching exit process:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployee = async () => {
    try {
      const response = await employeeService.getEmployee(id);
      if (response.data.success) {
        setEmployee(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
    }
  };

  const fetchMyExitTasks = async () => {
    try {
      const response = await hrmService.getMyExitTasks();
      if (response.data.success) {
        setTasks(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching exit tasks:', error);
    }
  };

  const handleSubmitResignation = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to submit your resignation? This action cannot be undone without admin approval.')) {
      return;
    }

    try {
      await employeeService.submitResignation(id, resignationForm);
      setShowResignationModal(false);
      setResignationForm({
        resignationDate: dayjs().format('YYYY-MM-DD'),
        lastWorkingDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
        noticePeriod: 30,
        exitReason: '',
      });
      fetchExitProcess();
      alert('Resignation submitted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting resignation');
    }
  };

  const handleUpdateChecklist = async (field, value) => {
    try {
      await employeeService.updateExitChecklist(id, {
        exitChecklist: {
          [field]: value,
        },
      });
      fetchExitProcess();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating checklist');
    }
  };

  const handleCalculateSettlement = async () => {
    try {
      const response = await employeeService.calculateSettlement(id);
      if (response.data.success) {
        setShowSettlementModal(true);
        fetchExitProcess();
        alert('Settlement calculated successfully!');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error calculating settlement');
    }
  };

  const handleCancelResignation = async () => {
    if (!window.confirm('Are you sure you want to cancel this resignation? This will reset the exit process.')) {
      return;
    }

    try {
      await employeeService.cancelResignation(id);
      setShowCancelModal(false);
      fetchExitProcess();
      alert('Resignation cancelled successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error cancelling resignation');
    }
  };

  const checklistItems = [
    { key: 'assetReturned', label: 'Assets Returned', icon: FiPackage },
    { key: 'accessRevoked', label: 'Access Revoked', icon: FiXCircle },
    { key: 'documentsSubmitted', label: 'Documents Submitted', icon: FiFileText },
    { key: 'finalSettlement', label: 'Final Settlement', icon: FiDollarSign },
    { key: 'exitInterview', label: 'Exit Interview', icon: FiCheckCircle },
  ];

  if (loading) return <Loader />;

  const hasResignation = exitProcess?.resignationDate;
  const isEmployeeView = !isAdmin && !isSuperAdmin;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Exit Process</h1>
            <p className="page-subtitle">
              {hasResignation ? 'Employee Exit Process' : 'Resignation & Exit Management'}
            </p>
          </div>
          {!hasResignation && isEmployeeView && (
            <button className="btn btn-danger" onClick={() => setShowResignationModal(true)}>
              Submit Resignation
            </button>
          )}
          {hasResignation && (isAdmin || isSuperAdmin) && (
            <button className="btn btn-secondary" onClick={() => setShowCancelModal(true)}>
              Cancel Resignation
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {!hasResignation ? (
          <div className="card">
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <FiAlertCircle style={{ fontSize: '48px', color: 'var(--warning)', marginBottom: '16px' }} />
              <h3 style={{ marginBottom: '12px' }}>No Resignation Submitted</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                {isEmployeeView
                  ? 'You have not submitted your resignation yet.'
                  : 'This employee has not submitted a resignation.'}
              </p>
              {isEmployeeView && (
                <button className="btn btn-danger" onClick={() => setShowResignationModal(true)}>
                  Submit Resignation
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Resignation Details */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 className="card-title">Resignation Details</h3>
              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Resignation Date</div>
                  <div style={{ fontWeight: 600 }}>{formatDate(exitProcess.resignationDate)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Last Working Date</div>
                  <div style={{ fontWeight: 600 }}>{formatDate(exitProcess.lastWorkingDate)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Notice Period</div>
                  <div style={{ fontWeight: 600 }}>{exitProcess.noticePeriod} days</div>
                </div>
                {exitProcess.exitReason && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Reason</div>
                    <div>{exitProcess.exitReason}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Exit Checklist */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title">Exit Checklist</h3>
                {(isAdmin || isSuperAdmin) && (
                  <button className="btn btn-sm btn-primary" onClick={handleCalculateSettlement}>
                    Calculate Settlement
                  </button>
                )}
              </div>
              <div style={{ marginTop: '20px' }}>
                {checklistItems.map((item) => {
                  const Icon = item.icon;
                  const isCompleted = exitProcess.exitChecklist?.[item.key] || false;
                  return (
                    <div
                      key={item.key}
                      style={{
                        padding: '16px',
                        marginBottom: '12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Icon style={{ fontSize: '20px', color: isCompleted ? 'var(--success)' : 'var(--text-secondary)' }} />
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{item.label}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {isCompleted ? 'Completed' : 'Pending'}
                          </div>
                        </div>
                      </div>
                      {(isAdmin || isSuperAdmin) && (
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={(e) => handleUpdateChecklist(item.key, e.target.checked)}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '14px' }}>Mark as {isCompleted ? 'Pending' : 'Completed'}</span>
                        </label>
                      )}
                      {isEmployeeView && (
                        <span className={`badge badge-${isCompleted ? 'success' : 'warning'}`}>
                          {isCompleted ? 'Completed' : 'Pending'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My Exit Tasks */}
            {tasks.length > 0 && (
              <div className="card" style={{ marginBottom: '24px' }}>
                <h3 className="card-title">My Exit Tasks</h3>
                <div style={{ marginTop: '20px' }}>
                  {tasks.map((task) => (
                    <div
                      key={task._id}
                      style={{
                        padding: '16px',
                        marginBottom: '12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        backgroundColor: task.status === 'completed' ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <FiCheckSquare style={{ fontSize: '18px', color: task.status === 'completed' ? 'var(--success)' : 'var(--text-secondary)' }} />
                            <strong style={{ fontSize: '15px' }}>{task.taskName}</strong>
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
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 8px 26px' }}>
                              {task.description}
                            </p>
                          )}
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '26px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <span>📋 {task.category?.replace('_', ' ').toUpperCase()}</span>
                            {task.dueDate && (
                              <span>📅 Due: {formatDate(task.dueDate)}</span>
                            )}
                          </div>
                        </div>
                        <span style={{
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
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px', padding: '12px', background: '#eff6ff', borderRadius: '6px', fontSize: '13px', color: '#1e40af' }}>
                  <p style={{ margin: 0 }}>💡 Please complete all mandatory tasks before your last working day.</p>
                </div>
              </div>
            )}

            {/* Assigned Assets */}
            {exitProcess.assignedAssets && exitProcess.assignedAssets.length > 0 && (
              <div className="card" style={{ marginBottom: '24px' }}>
                <h3 className="card-title">Assigned Assets (To be Returned)</h3>
                <div style={{ marginTop: '20px' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Asset ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exitProcess.assignedAssets.map((asset) => (
                        <tr key={asset._id}>
                          <td>{asset.assetId}</td>
                          <td>{asset.name}</td>
                          <td style={{ textTransform: 'capitalize' }}>{asset.type}</td>
                          <td>
                            <span className="badge badge-warning">To be Returned</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Final Settlement */}
            {exitProcess.finalSettlementAmount !== null && exitProcess.finalSettlementAmount !== undefined && (
              <div className="card">
                <h3 className="card-title">Final Settlement</h3>
                <div style={{ marginTop: '20px', padding: '20px', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Final Settlement Amount</div>
                      <div style={{ fontWeight: 600, fontSize: '24px', color: 'var(--success)' }}>
                        {formatCurrency(exitProcess.finalSettlementAmount)}
                      </div>
                    </div>
                    <FiDollarSign style={{ fontSize: '32px', color: 'var(--success)', opacity: 0.5 }} />
                  </div>
                  {(isAdmin || isSuperAdmin) && exitProcess.feedback && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>HR Feedback</div>
                      <div>{exitProcess.feedback}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Submit Resignation Modal */}
        <Modal isOpen={showResignationModal} onClose={() => setShowResignationModal(false)} title="Submit Resignation">
          <form onSubmit={handleSubmitResignation}>
            <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--warning)', color: 'white', borderRadius: 'var(--radius)', fontSize: '14px' }}>
              <FiAlertCircle style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Please ensure all your information is correct. This action will submit your resignation and cannot be undone without admin approval.
            </div>
            <div className="form-group">
              <label className="form-label">Resignation Date *</label>
              <input
                type="date"
                className="form-input"
                value={resignationForm.resignationDate}
                onChange={(e) => setResignationForm({ ...resignationForm, resignationDate: e.target.value })}
                required
                max={dayjs().format('YYYY-MM-DD')}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Working Date *</label>
              <input
                type="date"
                className="form-input"
                value={resignationForm.lastWorkingDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  const resignationDate = new Date(resignationForm.resignationDate);
                  const lastWorkingDate = new Date(newDate);
                  const days = Math.ceil((lastWorkingDate - resignationDate) / (1000 * 60 * 60 * 24));
                  setResignationForm({
                    ...resignationForm,
                    lastWorkingDate: newDate,
                    noticePeriod: days > 0 ? days : 30,
                  });
                }}
                required
                min={resignationForm.resignationDate}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Notice Period (Days)</label>
              <input
                type="number"
                className="form-input"
                value={resignationForm.noticePeriod}
                onChange={(e) => setResignationForm({ ...resignationForm, noticePeriod: parseInt(e.target.value) })}
                min="1"
                readOnly
              />
              <div className="form-helper">Automatically calculated based on dates</div>
            </div>
            <div className="form-group">
              <label className="form-label">Reason for Resignation</label>
              <textarea
                className="form-textarea"
                value={resignationForm.exitReason}
                onChange={(e) => setResignationForm({ ...resignationForm, exitReason: e.target.value })}
                placeholder="Please provide a reason for your resignation (optional)"
                rows={4}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowResignationModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-danger">
                Submit Resignation
              </button>
            </div>
          </form>
        </Modal>

        {/* Cancel Resignation Modal */}
        <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Resignation">
          <div>
            <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--warning)', color: 'white', borderRadius: 'var(--radius)', fontSize: '14px' }}>
              <FiAlertCircle style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Are you sure you want to cancel this resignation? This will reset the entire exit process.
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>
                No, Keep Resignation
              </button>
              <button type="button" className="btn btn-danger" onClick={handleCancelResignation}>
                Yes, Cancel Resignation
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ExitProcess;

