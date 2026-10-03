import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiCheck, FiSend, FiClock } from 'react-icons/fi';
import { hrmService } from '../../services/hrmService';
import { formatDate, formatCurrency } from '../../utils/format';

const OfferManagement = ({ applicationId, onClose, onUpdate }) => {
    const navigate = useNavigate();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        salaryDetails: {
            basic: '',
            hra: '',
            allowances: '',
            variable: '',
            annualCTC: '',
        },
        joiningDate: '',
        validUntil: '',
    });

    useEffect(() => {
        fetchOffers();
    }, [applicationId]);

    const fetchOffers = async () => {
        try {
            const res = await hrmService.getOffers({ applicationId });
            if (res.data.success) {
                setOffers(res.data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const calculateCTC = (details) => {
        const basic = Number(details.basic) || 0;
        const hra = Number(details.hra) || 0;
        const allowances = Number(details.allowances) || 0;
        const variable = Number(details.variable) || 0;
        // Assuming Monthly * 12 + Variable
        // Or just inputs are annual? Let's assume Annual Inputs for simplicity as per requirement "Draft salary structure"
        return basic + hra + allowances + variable;
    };

    const handleInputChange = (field, value) => {
        const newDetails = { ...formData.salaryDetails, [field]: value };
        const ctc = calculateCTC(newDetails);
        setFormData({
            ...formData,
            salaryDetails: { ...newDetails, annualCTC: ctc }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await hrmService.createOffer({
                applicationId,
                ...formData
            });
            setShowForm(false);
            fetchOffers();
            alert('Offer drafted successfully');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create offer');
        }
    };

    const handleAction = async (offerId, action) => { // submit, send, decide(approve)
        try {
            if (action === 'submit') await hrmService.submitOffer(offerId);
            if (action === 'send') await hrmService.sendOffer(offerId);
            if (action === 'approve') await hrmService.decideOffer(offerId, { decision: 'approve' });
            fetchOffers();
            alert(`Action ${action} successful`);
        } catch (error) {
            alert(error.response?.data?.message || 'Action failed');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="offer-management">
            <div className="section-header">
                <h3>Offer Letters</h3>
                {!showForm && <button className="btn btn-primary" onClick={() => navigate('/hrm/recruitment/offers/new')}>+ Draft New Offer</button>}
            </div>

            {showForm && (
                <div className="offer-form-card fade-in">
                    <h4>Draft Offer Details</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Basic Salary (Annual)</label>
                                <input type="number" required value={formData.salaryDetails.basic} onChange={e => handleInputChange('basic', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>HRA (Annual)</label>
                                <input type="number" required value={formData.salaryDetails.hra} onChange={e => handleInputChange('hra', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Allowances (Annual)</label>
                                <input type="number" value={formData.salaryDetails.allowances} onChange={e => handleInputChange('allowances', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Variable Pay</label>
                                <input type="number" value={formData.salaryDetails.variable} onChange={e => handleInputChange('variable', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Projected Annual CTC</label>
                                <input type="number" disabled value={formData.salaryDetails.annualCTC} />
                            </div>
                            <div className="form-group">
                                <label>Joining Date</label>
                                <input type="date" required value={formData.joiningDate} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Offer Valid Until</label>
                                <input type="date" required value={formData.validUntil} onChange={e => setFormData({ ...formData, validUntil: e.target.value })} />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Create Draft</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="offers-list">
                {offers.map(offer => (
                    <div key={offer._id} className={`offer-card status-${offer.status}`}>
                        <div className="offer-header">
                            <div className="offer-title">
                                <strong>Offer #{offer._id.slice(-4)}</strong>
                                <span className={`status-badge status-${offer.status}`}>{offer.status.replace('_', ' ')}</span>
                            </div>
                            <div className="offer-date">{formatDate(offer.createdAt)}</div>
                        </div>
                        <div className="offer-details">
                            <div><strong>CTC:</strong> {formatCurrency(offer.salaryDetails.annualCTC)}</div>
                            <div><strong>Join Date:</strong> {formatDate(offer.joiningDate)}</div>
                            {offer.approver && <div><strong>Approver:</strong> {offer.approver.name || '...'}</div>}
                        </div>

                        <div className="offer-actions">
                            {offer.status === 'draft' && (
                                <button className="btn btn-sm btn-primary" onClick={() => handleAction(offer._id, 'submit')}>Submit for Approval</button>
                            )}
                            {offer.status === 'pending_approval' && (
                                <button className="btn btn-sm btn-success" onClick={() => handleAction(offer._id, 'approve')}>Approve</button>
                                // Assuming current user is approver (filtered in backend)
                            )}
                            {offer.status === 'approved' && (
                                <button className="btn btn-sm btn-primary" onClick={() => handleAction(offer._id, 'send')}>Send to Candidate</button>
                            )}
                        </div>
                    </div>
                ))}
                {offers.length === 0 && !showForm && <div className="no-data">No offers created yet.</div>}
            </div>
        </div>
    );
};

export default OfferManagement;
