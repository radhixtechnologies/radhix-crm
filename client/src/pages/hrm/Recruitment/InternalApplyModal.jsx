import { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import { FiUpload, FiUser, FiMail, FiBriefcase, FiHash } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';

const InternalApplyModal = ({ job, isOpen, onClose, onApply, loading }) => {
    const { user } = useAuth();
    const [coverLetter, setCoverLetter] = useState('');
    const [resume, setResume] = useState(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setCoverLetter('');
            setResume(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('coverLetter', coverLetter);
        // Note: The backend controller needs to be updated to handle file upload if we want to send actual files
        // Current implementation expects 'resumeUrl' string.
        // For now, we will handle the data structure in the parent component or service.
        // If we want real file upload, we need to inspect if hrmService handles multipart/form-data.

        onApply({
            coverLetter,
            resumeFile: resume
        });
    };

    if (!isOpen || !job) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Apply for ${job.title}`}>
            <div className="internal-apply-form">
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Applicant Information
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="info-field">
                            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Name</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>
                                <FiUser /> {user.name}
                            </div>
                        </div>

                        <div className="info-field">
                            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Email</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>
                                <FiMail /> {user.email}
                            </div>
                        </div>

                        <div className="info-field">
                            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Employee ID</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>
                                <FiHash /> {user._id?.substring(0, 8).toUpperCase() || 'N/A'}
                            </div>
                        </div>

                        <div className="info-field">
                            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Current Role</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>
                                <FiBriefcase /> {user.role === 'admin' ? 'Administrator' : 'Employee'}
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Cover Letter / Notes</label>
                        <textarea
                            className="form-control"
                            rows="4"
                            placeholder="Why are you a good fit for this internal role?"
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontFamily: 'inherit'
                            }}
                        ></textarea>
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Resume (Optional)</label>
                        <div style={{
                            border: '1px dashed #cbd5e1',
                            borderRadius: '6px',
                            padding: '20px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: '#fff'
                        }}
                            onClick={() => document.getElementById('resume-upload').click()}
                        >
                            <input
                                type="file"
                                id="resume-upload"
                                style={{ display: 'none' }}
                                onChange={(e) => setResume(e.target.files[0])}
                                accept=".pdf,.doc,.docx"
                            />
                            <FiUpload size={24} style={{ color: '#64748b', marginBottom: '8px' }} />
                            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                                {resume ? resume.name : 'Click to upload resume (PDF, DOC)'}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{
                                padding: '8px 24px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#2563eb',
                                color: '#fff',
                                fontWeight: '500',
                                cursor: 'pointer',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default InternalApplyModal;
