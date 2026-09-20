import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { marketingService } from '../../services/marketingService';
import { employeeService } from '../../services/employeeService';
import Loader from '../../components/common/Loader';
import '../../styles/marketing/campaigns.css';
import '../../styles/forms.css';
import '../../styles/sales/lead-form.css';

const AddCampaign = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!!id);
    const [employees, setEmployees] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'email',
        status: 'draft',
        startDate: '',
        endDate: '',
        budget: 0,
        currency: 'INR',
        owner: '',
        targetAudience: {
            industry: '',
            location: '',
            companySize: '',
            leadTemperature: '',
            leadSource: '',
            engagementLevel: '',
            purchaseHistory: '',
            customCriteria: ''
        }
    });

    useEffect(() => {
        fetchEmployees();
        if (id) {
            fetchCampaign();
        }
    }, [id]);

    const fetchEmployees = async () => {
        try {
            const res = await employeeService.getEmployees();
            if (res.data.success) {
                setEmployees(res.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };


    const fetchCampaign = async () => {
        try {
            setFetching(true);
            const res = await marketingService.getCampaign(id);
            if (res.data.success) {
                const campaign = res.data.data;
                setFormData({
                    ...campaign,
                    startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
                    endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
                    budget: campaign.budget || 0,
                    currency: campaign.currency || 'INR',
                    owner: campaign.owner?._id || campaign.owner || '',
                    targetAudience: {
                        industry: campaign.targetAudience?.industry?.join(', ') || '',
                        location: campaign.targetAudience?.location?.join(', ') || '',
                        companySize: campaign.targetAudience?.companySize?.join(', ') || '',
                        leadTemperature: campaign.targetAudience?.leadTemperature?.join(', ') || '',
                        leadSource: campaign.targetAudience?.leadSource?.join(', ') || '',
                        engagementLevel: campaign.targetAudience?.engagementLevel?.join(', ') || '',
                        purchaseHistory: campaign.targetAudience?.purchaseHistory?.join(', ') || '',
                        customCriteria: campaign.targetAudience?.customCriteria || ''
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching campaign:', error);
            alert('Failed to load campaign');
            navigate('/marketing/campaigns');
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);

            // Process target audience array fields
            const payload = {
                ...formData,
                targetAudience: {
                    ...formData.targetAudience,
                    industry: formData.targetAudience.industry.split(',').map(s => s.trim()).filter(Boolean),
                    location: formData.targetAudience.location.split(',').map(s => s.trim()).filter(Boolean),
                    companySize: formData.targetAudience.companySize.split(',').map(s => s.trim()).filter(Boolean),
                    leadTemperature: formData.targetAudience.leadTemperature.split(',').map(s => s.trim()).filter(Boolean),
                    leadSource: formData.targetAudience.leadSource.split(',').map(s => s.trim()).filter(Boolean),
                    engagementLevel: formData.targetAudience.engagementLevel.split(',').map(s => s.trim()).filter(Boolean),
                    purchaseHistory: formData.targetAudience.purchaseHistory.split(',').map(s => s.trim()).filter(Boolean),
                },
            };

            if (id) {
                await marketingService.updateCampaign(id, payload);
            } else {
                await marketingService.createCampaign(payload);
            }
            navigate('/marketing');
        } catch (error) {
            console.error(`Error ${id ? 'updating' : 'creating'} campaign:`, error);
            alert(`Failed to ${id ? 'update' : 'create'} campaign`);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <Loader />;

    return (
        <div className="lead-form-page-wrapper">
            {/* Compact Professional Header */}
            <div className="page-header-compact">
                <div className="header-left">
                    <button
                        className="btn-back"
                        onClick={() => navigate('/marketing/campaigns')}
                        title="Back to Campaigns"
                        type="button"
                    >
                        <FiArrowLeft size={20} style={{ strokeWidth: 2.5 }} />
                    </button>
                    <div className="header-title-section">
                        <h1 className="page-title-compact">{id ? 'Edit Campaign' : 'Create Campaign'}</h1>
                        <p className="page-subtitle-compact">
                            {id ? 'Update campaign details' : 'Launch a new marketing campaign'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="lead-form-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <form className="lead-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Campaign Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group full-width">
                            <label>Description</label>
                            <textarea
                                className="form-textarea"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="4"
                            />
                        </div>

                        <div className="form-group">
                            <label>Type *</label>
                            <select
                                className="form-select"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                required
                            >
                                <option value="email">Email</option>
                                <option value="sms">SMS</option>
                                <option value="social-media">Social Media</option>
                                <option value="webinar">Webinar</option>
                                <option value="event">Event</option>
                                <option value="paid-ads">Paid Ads</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select
                                className="form-select"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="draft">Draft</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Start Date *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>End Date *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Budget</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select
                                    className="form-select"
                                    style={{ width: '110px', minWidth: '110px' }}
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                >
                                    {['INR'].map(curr => (
                                        <option key={curr} value={curr}>{curr}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.budget}
                                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                    min="0"
                                    placeholder="Amount"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Owner *</label>
                            <select
                                className="form-select"
                                value={formData.owner}
                                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                                required
                            >
                                <option value="">Select Owner</option>
                                {employees.map(emp => (
                                    <option key={emp._id} value={emp._id}>
                                        {emp.user?.name || emp.employeeId} - {emp.designation}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '24px 0 16px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                        Target Audience & Segmentation
                    </h3>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Industry <small className="text-muted">(comma separated)</small></label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.targetAudience.industry}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    targetAudience: { ...formData.targetAudience, industry: e.target.value }
                                })}
                                placeholder="e.g. Technology, Healthcare"
                            />
                        </div>

                        <div className="form-group">
                            <label>Location <small className="text-muted">(comma separated)</small></label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.targetAudience.location}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    targetAudience: { ...formData.targetAudience, location: e.target.value }
                                })}
                                placeholder="e.g. New York, London"
                            />
                        </div>

                        <div className="form-group">
                            <label>Company Size <small className="text-muted">(comma separated)</small></label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.targetAudience.companySize}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    targetAudience: { ...formData.targetAudience, companySize: e.target.value }
                                })}
                                placeholder="e.g. SMB, Enterprise"
                            />
                        </div>

                        <div className="form-group">
                            <label>Lead Temperature <small className="text-muted">(comma separated)</small></label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.targetAudience.leadTemperature}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    targetAudience: { ...formData.targetAudience, leadTemperature: e.target.value }
                                })}
                                placeholder="e.g. Hot, Warm"
                            />
                        </div>

                        <div className="form-group">
                            <label>Lead Source <small className="text-muted">(comma separated)</small></label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.targetAudience.leadSource}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    targetAudience: { ...formData.targetAudience, leadSource: e.target.value }
                                })}
                                placeholder="e.g. Website, LinkedIn"
                            />
                        </div>

                        <div className="form-group">
                            <label>Engagement Level <small className="text-muted">(comma separated)</small></label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.targetAudience.engagementLevel}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    targetAudience: { ...formData.targetAudience, engagementLevel: e.target.value }
                                })}
                                placeholder="e.g. High, Medium"
                            />
                        </div>

                        <div className="form-group full-width">
                            <label>Purchase History <small className="text-muted">(comma separated)</small></label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.targetAudience.purchaseHistory}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    targetAudience: { ...formData.targetAudience, purchaseHistory: e.target.value }
                                })}
                                placeholder="e.g. Previous Buyer, First Time"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/marketing/campaigns')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : id ? 'Update Campaign' : 'Create Campaign'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCampaign;
