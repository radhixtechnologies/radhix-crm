import { useState, useEffect } from 'react';
import { employeeService } from '../../services/employeeService';
import '../../styles/contacts/contacts.css';

const ContactForm = ({ contact, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        firstName: contact?.firstName || '',
        lastName: contact?.lastName || '',
        email: contact?.email || '',
        phone: contact?.phone || '',
        company: contact?.company || '',
        designation: contact?.designation || '',
        industry: contact?.industry || '',
        lifecycleStage: contact?.lifecycleStage || 'lead',
        status: contact?.status || 'active',
        assignedTo: contact?.assignedTo?._id || contact?.assignedTo || '',

        // Address
        street: contact?.address?.street || '',
        city: contact?.address?.city || '',
        state: contact?.address?.state || '',
        zipCode: contact?.address?.zipCode || '',
        country: contact?.address?.country || '',
    });

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Prepare data for submission
            const submitData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                company: formData.company,
                designation: formData.designation,
                industry: formData.industry,
                lifecycleStage: formData.lifecycleStage,
                status: formData.status,
                assignedTo: formData.assignedTo || null,
                address: {
                    street: formData.street,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode,
                    country: formData.country,
                }
            };

            await onSubmit(submitData);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="contact-form" onSubmit={handleSubmit}>
            <h3 className="section-title">Personal Information</h3>
            <div className="form-grid">
                <div className="form-group">
                    <label>First Name *</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Last Name *</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Email *</label>
                    <input
                        type="email"
                        className="form-input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Phone</label>
                    <input
                        type="tel"
                        name="phone"
                        autoComplete="off"
                        className="form-input"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
            </div>

            <h3 className="section-title">Professional Details</h3>
            <div className="form-grid">
                <div className="form-group">
                    <label>Company *</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Designation</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label>Industry</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label>Assigned To *</label>
                    <select
                        className="form-select"
                        value={formData.assignedTo}
                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                        required
                    >
                        <option value="">Select Employee</option>
                        {employees.map((emp) => (
                            <option key={emp._id} value={emp._id}>
                                {emp.user?.name || emp.employeeId} - {emp.designation}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <h3 className="section-title">Status & Lifecycle</h3>
            <div className="form-grid">
                <div className="form-group">
                    <label>Lifecycle Stage</label>
                    <select
                        className="form-select"
                        value={formData.lifecycleStage}
                        onChange={(e) => setFormData({ ...formData, lifecycleStage: e.target.value })}
                    >
                        <option value="lead">Lead</option>
                        <option value="marketing-qualified">Marketing Qualified</option>
                        <option value="sales-qualified">Sales Qualified</option>
                        <option value="opportunity">Opportunity</option>
                        <option value="customer">Customer</option>
                        <option value="evangelist">Evangelist</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Status</label>
                    <select
                        className="form-select"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="prospect">Prospect</option>
                        <option value="customer">Customer</option>
                        <option value="churned">Churned</option>
                    </select>
                </div>
            </div>

            <h3 className="section-title">Address</h3>
            <div className="form-grid">
                <div className="form-group full-width">
                    <label>Street</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label>City</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label>State</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label>Zip Code</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label>Country</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                </div>
            </div>

            <div className="form-actions mt-6">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
                </button>
            </div>
        </form>
    );
};

export default ContactForm;
