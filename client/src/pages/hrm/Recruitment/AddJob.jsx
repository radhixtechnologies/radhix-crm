import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { hrmService } from '../../../services/hrmService';
import { userService } from '../../../services/userService';
import Loader from '../../../components/common/Loader';
import '../../../styles/hrm/recruitment.css';

const AddJob = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [hiringManagers, setHiringManagers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    role: '', // Added role
    location: '',
    type: 'full-time',
    description: '',
    requirements: [],
    status: 'draft',
    closingDate: '',
    hiringManager: '',
    salaryMin: '',
    salaryMax: '',
    currency: 'INR',
    isSalaryVisible: false,
    visibility: 'internal', // Added visibility
  });

  useEffect(() => {
    fetchHiringManagers();
    if (id) {
      fetchJob();
    }
  }, [id]);

  const fetchHiringManagers = async () => {
    try {
      const res = await userService.getUsers({ role: 'admin' }); // Assuming admins or employees can be managers
      // Or fetch all employees. For now let's use admins + employees if possible, or just all users.
      // Let's assume getUsers returns a list.
      if (res.data.success) {
        setHiringManagers(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching hiring managers', error);
    }
  };

  const fetchJob = async () => {
    try {
      const res = await hrmService.getJobPosting(id);
      if (res.data.success) {
        const job = res.data.data;
        // Format date for input
        const formattedDate = job.closingDate
          ? new Date(job.closingDate).toISOString().split('T')[0]
          : '';

        setFormData({
          ...job,
          department: job.department || '', // Handle potential nulls
          location: job.location || '',
          role: job.role || '',
          visibility: job.visibility || 'internal',
          closingDate: formattedDate,
          hiringManager: job.hiringManager?._id || job.hiringManager || '',
        });
      }
    } catch (error) {
      console.error('Error fetching job details', error);
      alert('Failed to load job details');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Ensure numeric salary
      const payload = {
        ...formData,
        salaryMin: Number(formData.salaryMin),
        salaryMax: Number(formData.salaryMax)
      };

      if (id) {
        await hrmService.updateJobPosting(id, payload);
      } else {
        await hrmService.createJobPosting(payload);
      }
      navigate('/hrm/recruitment/jobs');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save job posting');
    } finally {
      setLoading(false);
    }
  };

  const handleRequirementChange = (index, value) => {
    const requirements = [...formData.requirements];
    requirements[index] = value;
    setFormData({ ...formData, requirements });
  };

  const addRequirement = () => {
    setFormData({
      ...formData,
      requirements: [...formData.requirements, ''],
    });
  };

  const removeRequirement = (index) => {
    const requirements = formData.requirements.filter((_, i) => i !== index);
    setFormData({ ...formData, requirements });
  };

  if (loading) return <Loader />;

  return (
    <div className="add-job-page fade-in">
      <div className="page-header">
        <h1 className="page-title">{id ? 'Edit Job Posting' : 'Post New Job'}</h1>
      </div>

      <div className="page-content">
        <form className="job-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Job Title *</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Department *</label>
              <select
                className="form-select"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              >
                <option value="">Select Department</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Sales">Sales</option>
                <option value="Management">Management</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div className="form-group">
              <label>Role *</label>
              <input
                type="text"
                className="form-input"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g. Senior Developer"
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
              />
            </div>

            <div className="form-group">
              <label>Employment Type *</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div className="form-group">
              <label>Visibility Settings *</label>
              <div className="radio-group" style={{ display: 'flex', gap: '20px', padding: '10px 0' }}>
                <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="visibility"
                    value="internal"
                    checked={formData.visibility === 'internal'}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  />
                  Internal Only (CRM)
                </label>
                <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="visibility"
                    value="external"
                    checked={formData.visibility === 'external'}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  />
                  External Only (Website)
                </label>
                <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="visibility"
                    value="both"
                    checked={formData.visibility === 'both'}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  />
                  Both (Internal + External)
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Status *</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="form-group">
              <label>Closing Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.closingDate}
                onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Hiring Manager</label>
              <select
                className="form-select"
                value={formData.hiringManager}
                onChange={(e) => setFormData({ ...formData, hiringManager: e.target.value })}
              >
                <option value="">Select Manager</option>
                {hiringManagers.map(user => (
                  <option key={user._id} value={user._id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Salary Range</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Min"
                  value={formData.salaryMin}
                  onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                />
                <input
                  type="number"
                  className="form-input"
                  placeholder="Max"
                  value={formData.salaryMax}
                  onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Currency</label>
              <select
                className="form-select"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="INR">INR</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '30px' }}>
              <input
                type="checkbox"
                id="salaryVisible"
                checked={formData.isSalaryVisible}
                onChange={(e) => setFormData({ ...formData, isSalaryVisible: e.target.checked })}
              />
              <label htmlFor="salaryVisible" style={{ marginBottom: 0 }}>Show Salary to Candidates</label>
            </div>
          </div>

          <div className="form-group">
            <label>Job Description *</label>
            <textarea
              className="form-textarea"
              rows="6"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Skills & Experience</label>
            {formData.requirements.map((req, index) => (
              <div key={index} className="requirement-row">
                <input
                  type="text"
                  className="form-input"
                  value={req}
                  onChange={(e) => handleRequirementChange(index, e.target.value)}
                  placeholder="Enter skill or experience"
                />
                <button
                  type="button"
                  className="btn btn-icon btn-danger"
                  onClick={() => removeRequirement(index)}
                >
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addRequirement}>
              + Add Skill
            </button>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/hrm/recruitment/jobs')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : id ? 'Update Job' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJob;

