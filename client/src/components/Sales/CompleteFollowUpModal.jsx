import { useState } from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import Modal from '../common/Modal';

const CompleteFollowUpModal = ({ isOpen, onClose, followup, onSuccess }) => {
    const [formData, setFormData] = useState({
        outcome: '',
        nextFollowUp: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        try {
            // Update follow-up to completed status
            await salesService.updateFollowUp(followup._id, {
                status: 'completed',
                outcome: formData.outcome,
                nextFollowUp: formData.nextFollowUp || null,
            });

            onSuccess?.();
            onClose();
            // Reset form
            setFormData({ outcome: '', nextFollowUp: '' });
        } catch (error) {
            console.error('Error completing follow-up:', error);
            alert(error.response?.data?.message || 'Failed to complete follow-up');
        } finally {
            setLoading(false);
        }
    };

    if (!followup) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Complete Follow-up">
            <form onSubmit={handleSubmit} className="followup-form">
                {/* Follow-up Info */}
                <div className="followup-info">
                    <h4>{followup.title}</h4>
                    <p className="text-muted">
                        {followup.type.charAt(0).toUpperCase() + followup.type.slice(1)} Follow-up
                    </p>
                </div>

                {/* Outcome */}
                <div className="form-group">
                    <label>Outcome / Notes</label>
                    <textarea
                        name="outcome"
                        value={formData.outcome}
                        onChange={handleChange}
                        placeholder="What was the result of this follow-up? Any notes or next steps..."
                        rows="4"
                    />
                    <small className="form-hint">
                        Capture key points from the interaction
                    </small>
                </div>

                {/* Next Follow-up Date */}
                <div className="form-group">
                    <label>Schedule Next Follow-up (Optional)</label>
                    <input
                        type="date"
                        name="nextFollowUp"
                        value={formData.nextFollowUp}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                    />
                    <small className="form-hint">
                        If another follow-up is needed, set the date here
                    </small>
                </div>

                {/* Actions */}
                <div className="modal-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-success"
                        disabled={loading}
                    >
                        <FiCheckCircle className="mr-1" />
                        {loading ? 'Completing...' : 'Mark as Complete'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CompleteFollowUpModal;
