import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiX, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import { formatCurrency } from '../../utils/format';
import '../../styles/sales/modern-sales-form.css';

const QuotationForm = ({ quotation, onSubmit, onCancel }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [deals, setDeals] = useState([]);

    // Toggle for Custom (Manual) Client
    const [isCustomClient, setIsCustomClient] = useState(!!quotation?.customClientDetails?.name);

    const [formData, setFormData] = useState({
        quotationName: quotation?.quotationName || '',

        // Client Links
        client: quotation?.client?._id || '',
        contact: quotation?.contact?._id || '',
        deal: quotation?.deal?._id || '',

        // Custom Client Details
        customClientDetails: quotation?.customClientDetails || { name: '', email: '', phone: '', address: '' },

        quotationDate: quotation?.quotationDate ? new Date(quotation.quotationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        priceValidUntil: quotation?.priceValidUntil ? new Date(quotation.priceValidUntil).toISOString().split('T')[0] : '',
        currency: quotation?.currency || 'INR',
        status: quotation?.status || 'draft',

        deliverables: quotation?.deliverables?.length > 0 ? quotation.deliverables : [{ name: '', description: '', customTimelineText: '' }],
        extraRequirements: quotation?.extraRequirements || [],
        items: quotation?.items || [],
        customFields: quotation?.customFields || [],

        discountType: quotation?.discountType || 'none',
        discountValue: quotation?.discountValue || 0,
        taxRate: quotation?.taxRate || 18,
        taxInclusive: quotation?.taxInclusive || false,
        paymentTerms: quotation?.paymentTerms || '',
        deliveryTimeline: quotation?.deliveryTimeline || '',
        notes: quotation?.notes || ''
    });

    const [calculations, setCalculations] = useState({ subtotal: 0, totalDiscount: 0, taxAmount: 0, grandTotal: 0 });

    useEffect(() => { fetchInitialData(); }, []);
    useEffect(() => { calculateTotals(); }, [formData.items, formData.discountType, formData.discountValue, formData.taxRate, formData.taxInclusive]);
    useEffect(() => {
        if (currentStep === 3) syncDeliverablesToItems();
    }, [currentStep]);

    const syncDeliverablesToItems = () => {
        const currentItems = [...formData.items];
        let modified = false;
        formData.deliverables.forEach(del => {
            if (del.name && !currentItems.find(i => i.description === del.name)) {
                currentItems.push({ description: del.name, quantity: 1, unitPrice: 0, discount: 0 });
                modified = true;
            }
        });
        if (modified) setFormData(prev => ({ ...prev, items: currentItems }));
    };

    const fetchInitialData = async () => {
        try {
            const [clientsRes, dealsRes] = await Promise.all([salesService.getClients(), salesService.getDeals()]);
            setClients(clientsRes.data.data || []);
            setDeals(dealsRes.data.data || []);
            if (formData.client && !isCustomClient) fetchContacts(formData.client);
        } catch (error) { console.error(error); }
    };

    const fetchContacts = async (clientId) => {
        try {
            const res = await salesService.getContacts({ client: clientId });
            setContacts(Array.isArray(res.data.data) ? res.data.data : []);
        } catch (error) { setContacts([]); }
    };

    const handleClientChange = (e) => {
        const clientId = e.target.value;
        setFormData(prev => ({ ...prev, client: clientId, contact: '' }));
        if (clientId) fetchContacts(clientId); else setContacts([]);
    };

    const handleDealChange = (e) => {
        const dealId = e.target.value;
        const deal = deals.find(d => d._id === dealId);
        if (deal) {
            setFormData(prev => ({
                ...prev,
                deal: dealId,
                // Only auto-switch to DB client if not in custom mode
                client: !isCustomClient ? (deal.client?._id || prev.client) : prev.client,
                quotationName: prev.quotationName || `Quote for ${deal.name}`
            }));
            if (deal.client?._id && !isCustomClient) fetchContacts(deal.client._id);
        } else {
            setFormData(prev => ({ ...prev, deal: dealId }));
        }
    };

    const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
    const handleCustomClientChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            customClientDetails: { ...prev.customClientDetails, [field]: value }
        }));
    };

    const addDeliverable = () => setFormData(prev => ({ ...prev, deliverables: [...prev.deliverables, { name: '', description: '', customTimelineText: '' }] }));
    const updateDeliverable = (idx, field, value) => {
        const newDels = [...formData.deliverables];
        newDels[idx][field] = value;
        setFormData(prev => ({ ...prev, deliverables: newDels }));
    };
    const removeDeliverable = (idx) => setFormData(prev => ({ ...prev, deliverables: prev.deliverables.filter((_, i) => i !== idx) }));

    const addRequirement = () => setFormData(prev => ({ ...prev, extraRequirements: [...prev.extraRequirements, { name: '', description: '' }] }));
    const updateRequirement = (idx, field, value) => {
        const newReqs = [...formData.extraRequirements];
        newReqs[idx][field] = value;
        setFormData(prev => ({ ...prev, extraRequirements: newReqs }));
    };
    const removeRequirement = (idx) => setFormData(prev => ({ ...prev, extraRequirements: prev.extraRequirements.filter((_, i) => i !== idx) }));

    const addItem = () => setFormData(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, discount: 0 }] }));
    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };
    const removeItem = (index) => setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

    const addCustomField = () => setFormData(prev => ({ ...prev, customFields: [...prev.customFields, { fieldName: '', fieldValue: '' }] }));
    const updateCustomField = (idx, key, val) => {
        const newFields = [...formData.customFields];
        newFields[idx][key] = val;
        setFormData(prev => ({ ...prev, customFields: newFields }));
    };
    const removeCustomField = (idx) => setFormData(prev => ({ ...prev, customFields: prev.customFields.filter((_, i) => i !== idx) }));

    const calculateTotals = () => {
        let subtotal = 0, lineItemDiscount = 0;
        formData.items.forEach(item => {
            const total = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
            subtotal += total;
            lineItemDiscount += (total * (parseFloat(item.discount) || 0) / 100);
        });
        let totalDiscount = lineItemDiscount;
        if (formData.discountType === 'percentage') totalDiscount += (subtotal - lineItemDiscount) * (parseFloat(formData.discountValue) || 0) / 100;
        else if (formData.discountType === 'fixed') totalDiscount += parseFloat(formData.discountValue) || 0;

        const taxableAmount = Math.max(0, subtotal - totalDiscount);
        let taxAmount = 0;
        if (!formData.taxInclusive) taxAmount = taxableAmount * (parseFloat(formData.taxRate) || 0) / 100;
        else taxAmount = taxableAmount - (taxableAmount / (1 + (parseFloat(formData.taxRate) || 0) / 100));

        const grandTotal = formData.taxInclusive ? taxableAmount : (taxableAmount + taxAmount);
        setCalculations({ subtotal, totalDiscount, taxAmount, grandTotal });
    };

    const handleSubmit = async () => {
        if (!formData.quotationName) return alert('Please enter a quotation title');
        if (!isCustomClient && !formData.client) return alert('Please select a client');
        if (isCustomClient && !formData.customClientDetails.name) return alert('Please enter client name');

        setLoading(true);
        try {
            // If custom client, ensure client field is cleared or null
            const payload = { ...formData, ...calculations, total: calculations.grandTotal };
            if (isCustomClient) {
                payload.client = null;
                payload.contact = null;
            } else {
                payload.customClientDetails = null;
            }
            await onSubmit(payload);
        }
        catch (error) { alert('Error saving quotation'); }
        finally { setLoading(false); }
    };

    const steps = [{ num: 1, label: 'Basics' }, { num: 2, label: 'Scope & Timeline' }, { num: 3, label: 'Costs & Finalize' }];

    return (
        <div className="ms-container">
            <header className="ms-header">
                <div className="ms-header-content">
                    <div className="ms-title">
                        {quotation ? 'Edit Quotation' : 'Create Quotation'}
                        <select className="ms-badge" style={{ border: 'none', outline: 'none', cursor: 'pointer', marginLeft: '10px' }} value={formData.status} onChange={(e) => handleChange('status', e.target.value)}>
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
                            <div className="ms-step-circle">{currentStep > step.num ? <FiCheck size={18} /> : step.num}</div>
                            <span className="ms-step-label">{step.label}</span>
                        </div>
                    ))}
                </div>

                <div className="ms-card">
                    <div className="ms-card-content">
                        {currentStep === 1 && (
                            <div className="ms-anim-fade">
                                <div className="section-head"><h2>Basic Information</h2><p>Client details and quotation validity.</p></div>
                                <div className="ms-grid-2">
                                    <div className="ms-form-group ms-col-span-2">
                                        <label className="ms-label">Quotation Title</label>
                                        <input className="ms-input" value={formData.quotationName} onChange={(e) => handleChange('quotationName', e.target.value)} placeholder="e.g. Website Redesign" autoFocus />
                                    </div>
                                    <div className="ms-form-group">
                                        <label className="ms-label">Link Deal</label>
                                        <select className="ms-input" value={formData.deal} onChange={handleDealChange}>
                                            <option value="">Select Deal (Optional)</option>
                                            {deals.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                        </select>
                                    </div>

                                    {/* Client Selection vs Custom Client Toggle */}
                                    <div className="ms-form-group ms-col-span-2" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '8px' }}>
                                        <label className="ms-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            Client Information
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={isCustomClient} onChange={(e) => setIsCustomClient(e.target.checked)} />
                                                <span style={{ fontWeight: 'normal', color: '#2563eb' }}>New / Custom Client?</span>
                                            </div>
                                        </label>

                                        {!isCustomClient ? (
                                            <div className="ms-grid-2" style={{ marginTop: '8px', gap: '24px' }}>
                                                <div className="ms-form-group">
                                                    <label className="ms-label">Select Client</label>
                                                    <select className="ms-input" value={formData.client} onChange={handleClientChange}>
                                                        <option value="">-- Choose Client --</option>
                                                        {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="ms-form-group">
                                                    <label className="ms-label">Contact Person</label>
                                                    <select className="ms-input" value={formData.contact} onChange={(e) => handleChange('contact', e.target.value)}>
                                                        <option value="">-- Choose Contact --</option>
                                                        {Array.isArray(contacts) && contacts.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="ms-grid-2" style={{ marginTop: '8px', gap: '24px' }}>
                                                <div className="ms-form-group">
                                                    <label className="ms-label">Client Name</label>
                                                    <input className="ms-input" value={formData.customClientDetails.name} onChange={(e) => handleCustomClientChange('name', e.target.value)} placeholder="Enter Client Name" />
                                                </div>
                                                <div className="ms-form-group">
                                                    <label className="ms-label">Email (Optional)</label>
                                                    <input className="ms-input" value={formData.customClientDetails.email} onChange={(e) => handleCustomClientChange('email', e.target.value)} placeholder="client@email.com" />
                                                </div>
                                                <div className="ms-form-group ms-col-span-2">
                                                    <label className="ms-label">Address (Optional)</label>
                                                    <input className="ms-input" value={formData.customClientDetails.address} onChange={(e) => handleCustomClientChange('address', e.target.value)} placeholder="Full Address" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="ms-form-group">
                                        <label className="ms-label">Date</label>
                                        <input type="date" className="ms-input" value={formData.quotationDate} onChange={(e) => handleChange('quotationDate', e.target.value)} />
                                    </div>
                                    <div className="ms-form-group">
                                        <label className="ms-label">Valid Until</label>
                                        <input type="date" className="ms-input" value={formData.priceValidUntil} onChange={(e) => handleChange('priceValidUntil', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="ms-anim-fade">
                                <div className="section-head"><h2>Scope & Timeline</h2><p>Define the deliverables and associated timeline.</p></div>

                                <label className="ms-label" style={{ marginBottom: '8px', display: 'block' }}>Deliverables</label>
                                <table className="ms-premium-table" style={{ marginBottom: '20px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40%' }}>Deliverable Name</th>
                                            <th style={{ width: '50%' }}>Description</th>
                                            <th style={{ width: '10%' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.deliverables.map((item, idx) => (
                                            <tr key={idx}>
                                                <td data-label="Name"><input className="ms-input" value={item.name} onChange={(e) => updateDeliverable(idx, 'name', e.target.value)} placeholder="e.g. Design" /></td>
                                                <td data-label="Description"><input className="ms-input" value={item.description} onChange={(e) => updateDeliverable(idx, 'description', e.target.value)} placeholder="e.g. Figma files..." /></td>
                                                <td style={{ textAlign: 'center' }}><button className="ms-icon-btn" onClick={() => removeDeliverable(idx)}><FiTrash2 /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button className="ms-btn-ghost" onClick={addDeliverable} style={{ marginBottom: '32px' }}><FiPlus /> Add Deliverable</button>

                                <label className="ms-label" style={{ marginBottom: '8px', display: 'block' }}>Extra Requirements</label>
                                <table className="ms-premium-table" style={{ marginBottom: '20px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40%' }}>Requirement Name</th>
                                            <th style={{ width: '50%' }}>Use / Description</th>
                                            <th style={{ width: '10%' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.extraRequirements.map((item, idx) => (
                                            <tr key={idx}>
                                                <td data-label="Name"><input className="ms-input" value={item.name} onChange={(e) => updateRequirement(idx, 'name', e.target.value)} placeholder="e.g. Hosting" /></td>
                                                <td data-label="Description"><input className="ms-input" value={item.description} onChange={(e) => updateRequirement(idx, 'description', e.target.value)} placeholder="Description..." /></td>
                                                <td style={{ textAlign: 'center' }}><button className="ms-icon-btn" onClick={() => removeRequirement(idx)}><FiTrash2 /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button className="ms-btn-ghost" onClick={addRequirement} style={{ marginBottom: '32px' }}><FiPlus /> Add Requirement</button>

                                <label className="ms-label" style={{ marginBottom: '8px', display: 'block' }}>Timeline</label>
                                <table className="ms-premium-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '60%' }}>Deliverable</th>
                                            <th style={{ width: '40%' }}>Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.deliverables.map((item, idx) => (
                                            <tr key={idx}>
                                                <td data-label="Deliverable" style={{ color: '#64748b', fontSize: '14px' }}>{item.name ? <strong>{item.name}</strong> : <i>(Unnamed)</i>}</td>
                                                <td data-label="Duration"><input className="ms-input" value={item.customTimelineText} onChange={(e) => updateDeliverable(idx, 'customTimelineText', e.target.value)} placeholder="e.g. 2 Weeks" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="ms-summary-box" style={{ marginTop: '16px' }}>
                                    <div className="ms-summary-total" style={{ margin: 0, border: 0 }}>
                                        <span>Total Project Duration</span>
                                        <input className="ms-input" style={{ width: '200px', textAlign: 'right', fontWeight: '700' }} placeholder="e.g. 2 Months" value={formData.deliveryTimeline} onChange={(e) => handleChange('deliveryTimeline', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="ms-anim-fade">
                                <div className="section-head"><h2>Commercials</h2><p>Cost breakdown and terms.</p></div>
                                <label className="ms-label" style={{ marginBottom: '8px', display: 'block' }}>Cost Breakdown</label>
                                <table className="ms-premium-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40%' }}>Item / Deliverable</th>
                                            <th style={{ width: '15%' }}>Qty</th>
                                            <th style={{ width: '20%' }}>Unit Price</th>
                                            <th style={{ width: '15%' }}>Disc %</th>
                                            <th style={{ width: '10%' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td data-label="Item"><input className="ms-input" value={item.itemName} onChange={(e) => updateItem(idx, 'itemName', e.target.value)} placeholder="Item Name" /></td>
                                                <td data-label="Qty"><input type="number" className="ms-input" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} /></td>
                                                <td data-label="Price"><input type="number" className="ms-input" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} /></td>
                                                <td data-label="Disc"><input type="number" className="ms-input" value={item.discount} onChange={(e) => updateItem(idx, 'discount', e.target.value)} /></td>
                                                <td style={{ textAlign: 'center' }}><button className="ms-icon-btn" onClick={() => removeItem(idx)}><FiTrash2 /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button className="ms-btn-ghost" onClick={addItem}><FiPlus /> Add Cost Item</button>

                                <div className="ms-grid-2" style={{ marginTop: '32px' }}>
                                    <div>
                                        <div className="ms-form-group">
                                            <label className="ms-label">Discount & Taxes</label>
                                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                <select className="ms-input" style={{ width: '100px' }} value={formData.discountType} onChange={(e) => handleChange('discountType', e.target.value)}>
                                                    <option value="none">None</option><option value="percentage">%</option><option value="fixed">Fixed</option>
                                                </select>
                                                {formData.discountType !== 'none' && <input type="number" className="ms-input" style={{ width: '100px' }} value={formData.discountValue} onChange={(e) => handleChange('discountValue', e.target.value)} />}
                                            </div>
                                        </div>
                                        <div className="ms-form-group" style={{ marginTop: '12px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={formData.taxInclusive} onChange={(e) => handleChange('taxInclusive', e.target.checked)} />
                                                Price includes Tax?
                                            </label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                                <span style={{ fontSize: '14px', color: '#64748b' }}>Tax Rate (%):</span>
                                                <input type="number" className="ms-input" style={{ width: '80px' }} value={formData.taxRate} onChange={(e) => handleChange('taxRate', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ms-summary-box">
                                        <div className="ms-summary-row"><span>Subtotal</span><span>{formatCurrency(calculations.subtotal, formData.currency)}</span></div>
                                        <div className="ms-summary-row" style={{ color: '#dc2626' }}><span>Discount</span><span>- {formatCurrency(calculations.totalDiscount, formData.currency)}</span></div>
                                        <div className="ms-summary-row"><span>Tax ({formData.taxRate}%)</span><span>{formatCurrency(calculations.taxAmount, formData.currency)}</span></div>
                                        <div className="ms-summary-total"><span>Total Cost</span><span>{formatCurrency(calculations.grandTotal, formData.currency)}</span></div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                                    <label className="ms-label" style={{ marginBottom: '12px', display: 'block' }}>Additional / Custom Fields</label>
                                    {formData.customFields.map((field, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                            <input className="ms-input" style={{ width: '40%' }} placeholder="Field Name (e.g. Warranty)" value={field.fieldName} onChange={(e) => updateCustomField(idx, 'fieldName', e.target.value)} />
                                            <input className="ms-input" style={{ flex: 1 }} placeholder="Value" value={field.fieldValue} onChange={(e) => updateCustomField(idx, 'fieldValue', e.target.value)} />
                                            <button className="ms-icon-btn" onClick={() => removeCustomField(idx)}><FiTrash2 /></button>
                                        </div>
                                    ))}
                                    <button className="ms-btn-ghost" onClick={addCustomField} style={{ width: 'auto', padding: '8px 16px' }}><FiPlus /> Add Field</button>
                                </div>

                                <div className="ms-form-group" style={{ marginTop: '24px' }}>
                                    <label className="ms-label">Payment Terms</label>
                                    <textarea className="ms-textarea" value={formData.paymentTerms} onChange={(e) => handleChange('paymentTerms', e.target.value)} placeholder="e.g. 50% Advance" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer - FORCED ROW */}
                    <div className="ms-card-footer" style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <button className="ms-btn-secondary" onClick={onCancel}>Cancel</button>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {currentStep > 1 && <button className="ms-btn-secondary" onClick={() => setCurrentStep(curr => curr - 1)}><FiChevronLeft /> Back</button>}
                            {currentStep < 3 ? (
                                <button className="ms-btn-primary" onClick={() => setCurrentStep(curr => curr + 1)}>Next <FiChevronRight /></button>
                            ) : (
                                <button className="ms-btn-primary" onClick={handleSubmit} disabled={loading}><FiCheck /> {loading ? 'Saving...' : 'Create Quotation'}</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotationForm;
