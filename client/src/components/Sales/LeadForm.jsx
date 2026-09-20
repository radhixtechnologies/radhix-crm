
import { useState, useEffect } from 'react';
import { employeeService } from '../../services/employeeService';
import '../../styles/sales/lead-form.css';

const LeadForm = ({ lead, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    name: lead?.name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    company: lead?.company || '',
    industry: lead?.industry || '',
    companySize: lead?.companySize || '1-10',
    source: lead?.source || 'website',
    status: lead?.status || 'new',
    leadTemperature: lead?.leadTemperature || 'cold',
    value: lead?.value || 0,
    currency: lead?.currency || 'INR',
    assignedTo: lead?.assignedTo?._id || lead?.assignedTo || '',
    notes: Array.isArray(lead?.notes) ? lead.notes.map(n => n.content).join('\n') : '',
    followUpDate: lead?.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : '',
  });

  const [employees, setEmployees] = useState([]);

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
    try {
      // Prepare data for submission
      const submitData = { ...formData };

      // Convert empty string to null for assignedTo
      if (submitData.assignedTo === '') {
        submitData.assignedTo = null;
      }

      // Remove notes from submission (notes should be added via separate endpoint)
      // If there's a notes string, we'll handle it separately after lead creation
      const notesContent = submitData.notes;
      delete submitData.notes;

      // Convert empty string to null for followUpDate
      if (submitData.followUpDate === '') {
        submitData.followUpDate = null;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            className="form-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

        <div className="form-group">
          <label>Company</label>
          <input
            type="text"
            className="form-input"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Industry</label>
          <input
            type="text"
            className="form-input"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            placeholder="e.g. Technology, Healthcare"
          />
        </div>

        <div className="form-group">
          <label>Company Size</label>
          <select
            className="form-select"
            value={formData.companySize}
            onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
          >
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-500">201-500 employees</option>
            <option value="501-1000">501-1000 employees</option>
            <option value="1000+">1000+ employees</option>
          </select>
        </div>

        <div className="form-group">
          <label>Source *</label>
          <select
            className="form-select"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            required
          >
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="social-media">Social Media</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="campaign">Campaign</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Status *</label>
          <select
            className="form-select"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            required
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        <div className="form-group">
          <label>Lead Temperature *</label>
          <select
            className="form-select lead-temperature-select"
            value={formData.leadTemperature}
            onChange={(e) => setFormData({ ...formData, leadTemperature: e.target.value })}
            required
          >
            <option value="cold">🧊 Cold - Just inquiring</option>
            <option value="warm">🟡 Warm - Showing interest</option>
            <option value="hot">🔥 Hot - Ready to buy</option>
            <option value="qualified">✅ Qualified - Meets criteria</option>
          </select>
          <small className="form-hint">
            Indicates how engaged and ready the lead is
          </small>
        </div>

        <div className="form-group">
          <label>Value</label>
          <input
            type="number"
            className="form-input"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label>Currency</label>
          <select
            className="form-select"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          >
            <option value="INR">₹ INR - Indian Rupee</option>
          </select>
        </div>

        <div className="form-group">
          <label>Assigned To</label>
          <select
            className="form-select"
            value={formData.assignedTo}
            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
          >
            <option value="">Unassigned</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.user?.name || emp.employeeId}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Follow-up Date</label>
          <input
            type="date"
            className="form-input"
            value={formData.followUpDate}
            onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea
          className="form-textarea"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows="4"
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
        </button>
      </div>
    </form>
  );
};

export default LeadForm;


