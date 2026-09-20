import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import '../../styles/sales/update-deal.css';

const UpdateDeal = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [deal, setDeal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [products, setProducts] = useState([{
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        total: 0
    }]);
    const [expectedCloseDate, setExpectedCloseDate] = useState('');
    const [additionalNotes, setAdditionalNotes] = useState('');

    useEffect(() => {
        fetchDeal();
    }, [id]);

    const fetchDeal = async () => {
        try {
            setLoading(true);
            const response = await salesService.getDeal(id);
            setDeal(response.data.data);

            // Set default close date (30 days from now)
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 30);
            setExpectedCloseDate(defaultDate.toISOString().split('T')[0]);
        } catch (error) {
            console.error('Error fetching deal:', error);
        } finally {
            setLoading(false);
        }
    };

    const addProduct = () => {
        setProducts([...products, {
            name: '',
            description: '',
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            total: 0
        }]);
    };

    const removeProduct = (index) => {
        const newProducts = products.filter((_, i) => i !== index);
        setProducts(newProducts.length > 0 ? newProducts : [{
            name: '',
            description: '',
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            total: 0
        }]);
    };

    const updateProduct = (index, field, value) => {
        const newProducts = [...products];
        newProducts[index][field] = value;

        // Auto-calculate total
        if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
            const quantity = parseFloat(newProducts[index].quantity) || 0;
            const unitPrice = parseFloat(newProducts[index].unitPrice) || 0;
            const discount = parseFloat(newProducts[index].discount) || 0;
            const subtotal = quantity * unitPrice;
            const discountAmount = (subtotal * discount) / 100;
            newProducts[index].total = subtotal - discountAmount;
        }

        setProducts(newProducts);
    };

    const calculateTotals = () => {
        const subtotal = products.reduce((sum, p) => sum + (parseFloat(p.quantity || 0) * parseFloat(p.unitPrice || 0)), 0);
        const totalDiscount = products.reduce((sum, p) => {
            const itemSubtotal = parseFloat(p.quantity || 0) * parseFloat(p.unitPrice || 0);
            return sum + ((itemSubtotal * parseFloat(p.discount || 0)) / 100);
        }, 0);
        const total = subtotal - totalDiscount;

        return { subtotal, totalDiscount, total };
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const { total } = calculateTotals();

            // Filter out empty products
            const validProducts = products.filter(p => p.name && p.unitPrice > 0);

            const updateData = {
                products: validProducts,
                value: total,
                expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
                notes: additionalNotes ? [...(deal.notes || []), {
                    content: additionalNotes,
                    addedBy: null, // Will be set by backend
                    addedAt: new Date()
                }] : deal.notes
            };

            await salesService.updateDeal(id, updateData);

            // Redirect to deal details
            navigate(`/sales/deals/${id}`);
        } catch (error) {
            console.error('Error updating deal:', error);
            alert('Failed to update deal. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading-container">Loading deal...</div>;
    }

    if (!deal) {
        return <div className="error-container">Deal not found</div>;
    }

    const { subtotal, totalDiscount, total } = calculateTotals();

    return (
        <div className="update-deal-page">
            <div className="page-header">
                <button className="btn-back" onClick={() => navigate(-1)}>
                    <FiArrowLeft size={20} />
                </button>
                <div className="header-content">
                    <h1>Complete Deal Setup</h1>
                    <p className="header-subtitle">Add products and pricing for {deal.name}</p>
                </div>
            </div>

            <div className="update-deal-container">
                {/* Read-only Lead Information */}
                <div className="card info-card">
                    <div className="card-header">
                        <h3>Lead Information (Read-Only)</h3>
                    </div>
                    <div className="card-body">
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Contact Name</span>
                                <span className="info-value">{deal.contactName || deal.name}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Email</span>
                                <span className="info-value">{deal.email}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Phone</span>
                                <span className="info-value">{deal.phone || 'Not provided'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Company</span>
                                <span className="info-value">{deal.company || 'Not provided'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Section */}
                <div className="card products-card">
                    <div className="card-header">
                        <h3>Products / Services *</h3>
                        <button className="btn-add-product" onClick={addProduct}>
                            <FiPlus /> Add Product
                        </button>
                    </div>
                    <div className="card-body">
                        <div className="products-list">
                            {products.map((product, index) => (
                                <div key={index} className="product-item">
                                    <div className="product-header">
                                        <span className="product-number">Product {index + 1}</span>
                                        {products.length > 1 && (
                                            <button
                                                className="btn-remove-product"
                                                onClick={() => removeProduct(index)}
                                            >
                                                <FiTrash2 /> Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="product-fields">
                                        <div className="form-group full-width">
                                            <label>Product/Service Name *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Software License, Consulting Service"
                                                value={product.name}
                                                onChange={(e) => updateProduct(index, 'name', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="form-group full-width">
                                            <label>Description</label>
                                            <textarea
                                                placeholder="Brief description of the product/service"
                                                value={product.description}
                                                onChange={(e) => updateProduct(index, 'description', e.target.value)}
                                                rows="2"
                                            />
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Quantity *</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={product.quantity}
                                                    onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Unit Price (₹) *</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={product.unitPrice}
                                                    onChange={(e) => updateProduct(index, 'unitPrice', e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Discount (%)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    value={product.discount}
                                                    onChange={(e) => updateProduct(index, 'discount', e.target.value)}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Total (₹)</label>
                                                <input
                                                    type="text"
                                                    value={`₹${product.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                    readOnly
                                                    className="readonly-input"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Deal Summary */}
                <div className="card summary-card">
                    <div className="card-header">
                        <h3>Deal Summary</h3>
                    </div>
                    <div className="card-body">
                        <div className="summary-rows">
                            <div className="summary-row">
                                <span className="summary-label">Subtotal</span>
                                <span className="summary-value">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-label">Total Discount</span>
                                <span className="summary-value discount">-₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="summary-row total-row">
                                <span className="summary-label">Total Deal Value</span>
                                <span className="summary-value total">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Expected Close Date *</label>
                            <input
                                type="date"
                                value={expectedCloseDate}
                                onChange={(e) => setExpectedCloseDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Additional Notes</label>
                            <textarea
                                placeholder="Any additional information about this deal..."
                                value={additionalNotes}
                                onChange={(e) => setAdditionalNotes(e.target.value)}
                                rows="3"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button
                        className="btn-cancel"
                        onClick={() => navigate(-1)}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-save"
                        onClick={handleSave}
                        disabled={saving || products.every(p => !p.name || p.unitPrice <= 0)}
                    >
                        <FiSave /> {saving ? 'Saving...' : 'Save & View Deal'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateDeal;
