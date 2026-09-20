import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiVideo, FiPhone } from 'react-icons/fi';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import '../../../styles/hrm/recruitment.css';

const InterviewScheduling = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: 'technical_round',
    scheduledDate: '',
    scheduledTime: '',
    location: '',
    meetingLink: '',
    interviewers: [{ name: '', email: '', role: '' }],
  });

  useEffect(() => {
    fetchApplicant();
  }, [id]);

  const fetchApplicant = async () => {
    try {
      const res = await hrmService.getApplicant(id);
      if (res.data.success) {
        setApplicant(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching applicant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await hrmService.scheduleInterview(id, {
        type: formData.type,
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        location: formData.location,
        meetingLink: formData.meetingLink,
        interviewers: formData.interviewers,
      });
      alert('Interview scheduled successfully');
      navigate(`/hrm/recruitment/applicants/${id}`);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to schedule interview');
    } finally {
      setSaving(false);
    }
  };

  const addInterviewer = () => {
    setFormData({
      ...formData,
      interviewers: [...formData.interviewers, { name: '', email: '', role: '' }],
    });
  };

  const updateInterviewer = (index, field, value) => {
    const interviewers = [...formData.interviewers];
    interviewers[index][field] = value;
    setFormData({ ...formData, interviewers });
  };

  const removeInterviewer = (index) => {
    const interviewers = formData.interviewers.filter((_, i) => i !== index);
    setFormData({ ...formData, interviewers });
  };

  if (loading) return <Loader />;
  if (!applicant) return <div>Applicant not found</div>;

  return (
    <div className="interview-scheduling-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Schedule Interview</h1>
          <p className="page-subtitle">{applicant.applicantName} - {applicant.jobPosting?.title || 'N/A'}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(`/hrm/recruitment/applicants/${id}`)}>
          Back to Profile
        </button>
      </div>

      <div className="page-content">
        <form className="interview-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Interview Type *</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="phone">Phone</option>
                <option value="video">Video</option>
                <option value="in-person">In-Person</option>
                <option value="technical_round">Technical Round</option>
                <option value="hr_round">HR Round</option>
                <option value="final">Final</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label>Time *</label>
              <input
                type="time"
                className="form-input"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                className="form-input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Office address or room number"
              />
            </div>

            {(formData.type === 'video' || formData.type === 'technical_round') && (
              <div className="form-group">
                <label>Meeting Link</label>
                <input
                  type="url"
                  className="form-input"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  placeholder="Zoom, Teams, Google Meet URL"
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Interviewers *</label>
            {formData.interviewers.map((interviewer, index) => (
              <div key={index} className="interviewer-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Name"
                  value={interviewer.name}
                  onChange={(e) => updateInterviewer(index, 'name', e.target.value)}
                  required
                />
                <input
                  type="email"
                  className="form-input"
                  placeholder="Email"
                  value={interviewer.email}
                  onChange={(e) => updateInterviewer(index, 'email', e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Role"
                  value={interviewer.role}
                  onChange={(e) => updateInterviewer(index, 'role', e.target.value)}
                />
                {formData.interviewers.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-icon btn-danger"
                    onClick={() => removeInterviewer(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addInterviewer}>
              + Add Interviewer
            </button>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate(`/hrm/recruitment/applicants/${id}`)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewScheduling;

