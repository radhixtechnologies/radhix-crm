import { useState } from 'react';
import { FiPhone, FiX, FiClock, FiUser } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import '../../styles/sales/call-modal.css';

const CallModal = ({ isOpen, onClose, lead }) => {
    const [callData, setCallData] = useState({
        duration: '',
        notes: '',
        outcome: 'completed',
        followUpRequired: false
    });
    const [loading, setLoading] = useState(false);
    const [callStatus, setCallStatus] = useState('idle'); // idle, calling, in-progress, ended

    if (!isOpen) return null;

    const handleInitiateCall = async () => {
        if (!lead.phone) {
            alert('No phone number available for this lead');
            return;
        }

        setCallStatus('calling');

        // Simulate call initiation - In production, this would integrate with a telephony API
        // like Twilio, RingCentral, or your internal VoIP system
        setTimeout(() => {
            setCallStatus('in-progress');
        }, 2000);
    };

    const handleEndCall = async () => {
        setCallStatus('ended');
    };

    const handleSaveCall = async () => {
        if (!callData.notes.trim()) {
            alert('Please add call notes before saving');
            return;
        }

        try {
            setLoading(true);

            // Log the communication
            await salesService.addCommunication(lead._id, {
                type: 'call',
                direction: 'outbound',
                duration: callData.duration || '0',
                notes: callData.notes,
                outcome: callData.outcome,
                followUpRequired: callData.followUpRequired,
                timestamp: new Date()
            });

            alert('Call logged successfully!');
            onClose();
        } catch (error) {
            console.error('Error logging call:', error);
            alert('Failed to log call. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content call-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-left">
                        <div className="modal-icon-box phone">
                            <FiPhone size={20} />
                        </div>
                        <div>
                            <h2 className="modal-title">Call {lead.name}</h2>
                            <p className="modal-subtitle">{lead.phone || 'No phone number'}</p>
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {callStatus === 'idle' && (
                        <div className="call-idle-state">
                            <div className="call-avatar">
                                <FiUser size={48} />
                            </div>
                            <h3>{lead.name}</h3>
                            <p className="call-number">{lead.phone || 'No phone available'}</p>
                            <button
                                className="btn-call-initiate"
                                onClick={handleInitiateCall}
                                disabled={!lead.phone}
                            >
                                <FiPhone size={18} />
                                Start Call
                            </button>
                            {!lead.phone && (
                                <p className="call-warning">⚠️ No phone number available for this lead</p>
                            )}
                        </div>
                    )}

                    {callStatus === 'calling' && (
                        <div className="call-calling-state">
                            <div className="call-avatar pulsing">
                                <FiPhone size={48} />
                            </div>
                            <h3>Calling...</h3>
                            <p className="call-number">{lead.phone}</p>
                            <button className="btn-call-cancel" onClick={() => setCallStatus('idle')}>
                                Cancel
                            </button>
                        </div>
                    )}

                    {callStatus === 'in-progress' && (
                        <div className="call-active-state">
                            <div className="call-avatar active">
                                <FiPhone size={48} />
                            </div>
                            <h3>Call in Progress</h3>
                            <p className="call-number">{lead.phone}</p>
                            <div className="call-timer">
                                <FiClock size={16} />
                                <span>00:00</span>
                            </div>
                            <button className="btn-call-end" onClick={handleEndCall}>
                                End Call
                            </button>
                        </div>
                    )}

                    {callStatus === 'ended' && (
                        <div className="call-ended-state">
                            <h3>Log Call Details</h3>

                            <div className="form-group">
                                <label>Call Duration (minutes)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="e.g., 5"
                                    value={callData.duration}
                                    onChange={(e) => setCallData({ ...callData, duration: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Call Outcome</label>
                                <select
                                    className="form-select"
                                    value={callData.outcome}
                                    onChange={(e) => setCallData({ ...callData, outcome: e.target.value })}
                                >
                                    <option value="completed">Completed</option>
                                    <option value="no-answer">No Answer</option>
                                    <option value="voicemail">Voicemail</option>
                                    <option value="busy">Busy</option>
                                    <option value="wrong-number">Wrong Number</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Call Notes *</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="What was discussed during the call?"
                                    rows="4"
                                    value={callData.notes}
                                    onChange={(e) => setCallData({ ...callData, notes: e.target.value })}
                                />
                            </div>

                            <div className="form-group-checkbox">
                                <input
                                    type="checkbox"
                                    id="followUpRequired"
                                    checked={callData.followUpRequired}
                                    onChange={(e) => setCallData({ ...callData, followUpRequired: e.target.checked })}
                                />
                                <label htmlFor="followUpRequired">Follow-up required</label>
                            </div>

                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={onClose}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSaveCall}
                                    disabled={loading || !callData.notes.trim()}
                                >
                                    {loading ? 'Saving...' : 'Save Call Log'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallModal;
