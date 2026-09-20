import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiX, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import '../../styles/sales/modern-sales-form.css';

const ProposalForm = ({ proposal, onSubmit, onCancel }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [deals, setDeals] = useState([]);

    const [formData, setFormData] = useState({
        title: proposal?.title || '',
        client: proposal?.client?._id || '',
        contactPersons: proposal?.contactPersons?.map(c => c._id) || [],
        deal: proposal?.deal?._id || '',
        proposalDate: proposal?.proposalDate ? new Date(proposal.proposalDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        validUntil: proposal?.validUntil ? new Date(proposal.validUntil).toISOString().split('T')[0] : '',
        scopeOfWork: proposal?.scopeOfWork || '',
        deliverables: proposal?.deliverables || [],
        assumptions: proposal?.assumptions || '',
        paymentTerms: proposal?.paymentTerms || '',
        executionTimeline: proposal?.executionTimeline || '',
        estimatedValue: proposal?.estimatedValue || '',
        currency: proposal?.currency || 'INR',
        status: proposal?.status || 'draft',
        notes: proposal?.notes || ''
    });

    useEffect(() => { fetchInitialData(); }, []);

    const fetchInitialData = async () => {
        try {
            const [clientsRes, dealsRes, contactsRes] = await Promise.all([
                salesService.getClients(),
                salesService.getDeals(),
                salesService.getContacts({ limit: 100 }) // Fetch all contacts
            ]);
            setClients(clientsRes.data.data || []);
            setDeals(dealsRes.data.data || []);
            // Parse contacts from response
            const contactsList = contactsRes.data.data?.contacts || contactsRes.data.contacts || [];
            setContacts(Array.isArray(contactsList) ? contactsList : []);
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    const handleClientChange = (e) => {
        const clientId = e.target.value;
        setFormData(prev => ({ ...prev, client: clientId, contactPersons: [] }));
        // Note: Contacts are not filtered by client since Contact model doesn't have client field
    };

    const handleDealChange = (e) => {
        const dealId = e.target.value;
        const selectedDeal = deals.find(d => d._id === dealId);
        if (selectedDeal) {
            setFormData(prev => ({ ...prev, deal: dealId, client: selectedDeal.client?._id || prev.client, title: prev.title || `Proposal for ${selectedDeal.name}` }));
        } else {
            setFormData(prev => ({ ...prev, deal: dealId }));
        }
    };

    const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
    const addDeliverable = () => setFormData(prev => ({ ...prev, deliverables: [...prev.deliverables, { title: '', description: '', dueDate: '' }] }));
    const updateDeliverable = (index, field, value) => {
        const newDeliverables = [...formData.deliverables];
        newDeliverables[index][field] = value;
        setFormData(prev => ({ ...prev, deliverables: newDeliverables }));
    };
    const removeDeliverable = (index) => setFormData(prev => ({ ...prev, deliverables: prev.deliverables.filter((_, i) => i !== index) }));

    const handleSubmit = async () => {
        setLoading(true);
        try { await onSubmit(formData); }
        catch (error) { alert('Error saving proposal'); }
        finally { setLoading(false); }
    };

    const steps = [{ num: 1, label: 'Basics' }, { num: 2, label: 'Scope & Work' }, { num: 3, label: 'Commercials' }];

    return (
        <div className="ms-container">
            <header className="ms-header">
                <div className="ms-header-content">
                    <div className="ms-title">
                        {proposal ? 'Edit Proposal' : 'New Proposal'}
                        <select
                            className="ms-badge"
                            style={{ border: 'none', outline: 'none', cursor: 'pointer', marginLeft: '10px' }}
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                        >
                            {['draft', 'sent', 'accepted', 'rejected'].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <button onClick={onCancel} className="ms-close-btn"><FiX size={24} /></button>
                </div>
            </header>

            <div className="ms-wizard-wrapper">
                <div className="ms-stepper">
                    {steps.map(step => (
                        <div key={step.num} className={`ms-step-item ${currentStep === step.num ? 'active' : ''} ${currentStep > step.num ? 'completed' : ''}`} onClick={() => setCurrentStep(step.num)}>
                            <div className="ms-step-circle">{currentStep > step.num ? <FiCheck /> : step.num}</div>
                            <span className="ms-step-label">{step.label}</span>
                        </div>
                    ))}
                </div>

                <div className="ms-card">
                    <div className="ms-card-content">
                        {currentStep === 1 && (
                            <div className="ms-anim-fade">
                                <div className="section-head"><h2>Proposal Details</h2><p>Basic information about the proposal and client.</p></div>
                                <div className="ms-grid-2">
                                    <div className="ms-form-group ms-col-span-2">
                                        <label className="ms-label">Proposal Title</label>
                                        <input className="ms-input" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} autoFocus />
                                    </div>
                                    <div className="ms-form-group">
                                        <label className="ms-label">Client</label>
                                        <select className="ms-input" value={formData.client} onChange={handleClientChange}>
                                            <option value="">Select Client</option>
                                            {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="ms-form-group">
                                        <label className="ms-label">Contact Person <span style={{ color: '#999', fontWeight: 400 }}>(Optional)</span></label>
                                        <select className="ms-input" value={formData.contactPersons[0] || ''} onChange={(e) => handleChange('contactPersons', [e.target.value])}>
                                            <option value="">Select Contact</option>
                                            {Array.isArray(contacts) && contacts.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}
                                        </select>
                                    </div>
                                    <div className="ms-form-group">
                                        <label className="ms-label">Deal</label>
                                        <select className="ms-input" value={formData.deal} onChange={handleDealChange}>
                                            <option value="">Select Deal</option>
                                            {deals.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="ms-form-group">
                                        <label className="ms-label">Date</label>
                                        <input type="date" className="ms-input" value={formData.proposalDate} onChange={(e) => handleChange('proposalDate', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="ms-anim-fade">
                                <div className="section-head"><h2>Scope of Work</h2><p>Define the deliverables and project scope.</p></div>
                                <div className="ms-form-group">
                                    <label className="ms-label">Executive Summary / Scope</label>
                                    <textarea className="ms-textarea" rows="4" value={formData.scopeOfWork} onChange={(e) => handleChange('scopeOfWork', e.target.value)} placeholder="Describe the overall scope and objectives of this proposal..." />
                                </div>

                                <div style={{ marginTop: '32px' }}>
                                    <label className="ms-label" style={{ marginBottom: '12px', display: 'block' }}>Deliverables</label>
                                    <table className="ms-premium-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '40%' }}>Deliverable Name</th>
                                                <th style={{ width: '50%' }}>Description</th>
                                                <th style={{ width: '10%', textAlign: 'center' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.deliverables.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td data-label="Name">
                                                        <input
                                                            className="ms-input"
                                                            value={item.title}
                                                            onChange={(e) => updateDeliverable(idx, 'title', e.target.value)}
                                                            placeholder="e.g. Website Design"
                                                        />
                                                    </td>
                                                    <td data-label="Description">
                                                        <input
                                                            className="ms-input"
                                                            value={item.description}
                                                            onChange={(e) => updateDeliverable(idx, 'description', e.target.value)}
                                                            placeholder="Brief description of the deliverable"
                                                        />
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button
                                                            type="button"
                                                            className="ms-icon-btn"
                                                            onClick={() => removeDeliverable(idx)}
                                                            title="Remove deliverable"
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {formData.deliverables.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: '#999' }}>
                                                        No deliverables added yet. Click "Add Deliverable" to get started.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                    <button type="button" className="ms-btn-ghost" onClick={addDeliverable} style={{ marginTop: '12px' }}>
                                        <FiPlus /> Add Deliverable
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="ms-anim-fade">
                                <div className="section-head"><h2>Commercial Terms</h2><p>Payment schedule and timeline details.</p></div>

                                {/* Estimated Value - Highlighted Section */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #f8f9ff 0%, #fff 100%)',
                                    border: '2px solid #5e35b1',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    marginBottom: '24px'
                                }}>
                                    <label className="ms-label" style={{ marginBottom: '12px', fontSize: '15px', fontWeight: 600 }}>
                                        Estimated Value
                                    </label>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <select
                                            className="ms-input"
                                            style={{
                                                width: '120px',
                                                fontSize: '16px',
                                                fontWeight: 600,
                                                background: 'white'
                                            }}
                                            value={formData.currency}
                                            onChange={(e) => handleChange('currency', e.target.value)}
                                        >
                                            <option>INR</option>
                                        </select>
                                        <input
                                            type="number"
                                            className="ms-input"
                                            style={{
                                                flex: 1,
                                                fontSize: '18px',
                                                fontWeight: 600,
                                                background: 'white'
                                            }}
                                            value={formData.estimatedValue}
                                            onChange={(e) => handleChange('estimatedValue', e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Other Commercial Terms */}
                                <div className="ms-grid-2">
                                    <div className="ms-form-group">
                                        <label className="ms-label">Execution Timeline</label>
                                        <input
                                            className="ms-input"
                                            value={formData.executionTimeline}
                                            onChange={(e) => handleChange('executionTimeline', e.target.value)}
                                            placeholder="e.g. 4-6 Weeks"
                                        />
                                    </div>
                                    <div className="ms-form-group">
                                        <label className="ms-label">Valid Until</label>
                                        <input
                                            type="date"
                                            className="ms-input"
                                            value={formData.validUntil}
                                            onChange={(e) => handleChange('validUntil', e.target.value)}
                                        />
                                    </div>
                                    <div className="ms-form-group ms-col-span-2">
                                        <label className="ms-label">Payment Terms</label>
                                        <textarea
                                            className="ms-textarea"
                                            rows="4"
                                            value={formData.paymentTerms}
                                            onChange={(e) => handleChange('paymentTerms', e.target.value)}
                                            placeholder="e.g. 50% upfront, 50% on completion"
                                        />
                                    </div>
                                    <div className="ms-form-group ms-col-span-2">
                                        <label className="ms-label">Assumptions <span style={{ color: '#999', fontWeight: 400 }}>(Optional)</span></label>
                                        <textarea
                                            className="ms-textarea"
                                            rows="3"
                                            value={formData.assumptions}
                                            onChange={(e) => handleChange('assumptions', e.target.value)}
                                            placeholder="Any assumptions or conditions for this proposal..."
                                        />
                                    </div>
                                    <div className="ms-form-group ms-col-span-2">
                                        <label className="ms-label">Internal Notes <span style={{ color: '#999', fontWeight: 400 }}>(Optional)</span></label>
                                        <textarea
                                            className="ms-textarea"
                                            rows="2"
                                            value={formData.notes}
                                            onChange={(e) => handleChange('notes', e.target.value)}
                                            placeholder="Internal notes (not visible to client)..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer inside Card */}
                    <div className="ms-card-footer">
                        <button className="ms-btn-secondary" onClick={onCancel}>Cancel</button>
                        <div>
                            {currentStep > 1 && <button className="ms-btn-secondary" onClick={() => setCurrentStep(c => c - 1)}><FiChevronLeft /> Back</button>}
                            {currentStep < 3 ? (
                                <button className="ms-btn-primary" onClick={() => setCurrentStep(c => c + 1)}>Next <FiChevronRight /></button>
                            ) : (
                                <button className="ms-btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : 'Create Proposal'}</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProposalForm;
