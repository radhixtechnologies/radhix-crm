import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { supportService } from '../../services/supportService';
import { contactService } from '../../services/contactService';
import Loader from '../../components/common/Loader';
import './AddTicket.css';

const AddTicket = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [contacts, setContacts] = useState([]);

    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        contact: '',
        priority: 'medium',
        category: 'general',
        type: 'question'
    });

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const res = await contactService.getContacts({ limit: 100 });
            if (res.data.success) {
                setContacts(res.data.data.contacts || []);
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.contact) {
            alert('Please select a customer/contact for this ticket');
            return;
        }

        setLoading(true);
        try {
            await supportService.createTicket(formData);
            navigate('/support');
        } catch (error) {
            console.error('❌ Error creating ticket:', error);

            const errorMessage = error.response?.data?.error?.details
                || error.response?.data?.error?.message
                || error.response?.data?.message
                || 'Failed to create ticket. Please check all required fields.';

            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-ticket-page">
            <form onSubmit={handleSubmit} className="product-form-layout">
                {/* Header Actions */}
                <div className="page-header">
                    <div className="header-title">
                        <button type="button" className="btn-back" onClick={() => navigate('/support')}>
                            <FiArrowLeft />
                        </button>
                        <h1>Create New Ticket</h1>
                    </div>
                    <div className="header-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate('/support')}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            <FiSave /> {loading ? 'Creating...' : 'Create Ticket'}
                        </button>
                    </div>
                </div>

                <div className="form-grid">
                    {/* Left Column - Main Info */}
                    <div className="form-column main-column">
                        {/* Ticket Details Card */}
                        <div className="card">
                            <h2>Ticket Details</h2>
                            <div className="form-group">
                                <label>Subject *</label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Brief summary of the issue"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detailed explanation of the problem..."
                                    rows="6"
                                    required
                                />
                            </div>
                        </div>

                        {/* Customer Info Card */}
                        <div className="card">
                            <h2>Customer Information</h2>
                            <div className="form-group">
                                <label>Contact *</label>
                                <select
                                    value={formData.contact}
                                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                    required
                                >
                                    <option value="">Select Customer</option>
                                    {contacts.map(c => (
                                        <option key={c._id} value={c._id}>
                                            {c.firstName} {c.lastName} ({c.company})
                                        </option>
                                    ))}
                                </select>
                                {contacts.length === 0 && (
                                    <small style={{ color: '#f59e0b', marginTop: '4px' }}>
                                        No contacts available. Please create a contact first.
                                    </small>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Meta Info */}
                    <div className="form-column side-column">
                        {/* Classification Card */}
                        <div className="card">
                            <h2>Classification</h2>

                            <div className="form-group">
                                <label>Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="general">General</option>
                                    <option value="technical">Technical</option>
                                    <option value="billing">Billing</option>
                                    <option value="product">Product</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="question">Question</option>
                                    <option value="bug">Bug</option>
                                    <option value="feature-request">Feature Request</option>
                                    <option value="complaint">Complaint</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddTicket;
