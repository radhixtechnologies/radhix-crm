import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import './AddProduct.css';

const AddProduct = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        category: 'other',
        unit: 'pcs',
        price: '',
        costPrice: '',
        stockQuantity: '',
        minStockLevel: '5',
        taxRate: '0',
        status: 'active'
    });

    const categories = [
        { value: 'electronics', label: 'Electronics' },
        { value: 'hardware', label: 'Hardware' },
        { value: 'software', label: 'Software' },
        { value: 'service', label: 'Service' },
        { value: 'office_supplies', label: 'Office Supplies' },
        { value: 'other', label: 'Other' }
    ];

    useEffect(() => {
        if (isEdit) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        try {
            const res = await api.get(`/inventory/products/${id}`);
            if (res.data.success) {
                setFormData(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            alert('Failed to fetch product details');
            navigate('/inventory/products');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.sku || !formData.price) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            setSaving(true);

            if (isEdit) {
                await api.put(`/inventory/products/${id}`, formData);
                alert('Product updated successfully');
            } else {
                await api.post('/inventory/products', formData);
                alert('Product created successfully');
            }

            navigate('/inventory/products');
        } catch (error) {
            console.error('Error saving product:', error);
            alert(error.response?.data?.message || 'Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="add-product-page">
            <form onSubmit={handleSubmit} className="product-form-layout">
                {/* Header Actions */}
                <div className="page-header">
                    <div className="header-title">
                        <button type="button" className="btn-back" onClick={() => navigate('/inventory/products')}>
                            <FiArrowLeft />
                        </button>
                        <h1>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
                    </div>
                    <div className="header-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate('/inventory/products')}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={saving}
                        >
                            <FiSave /> {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Save Product')}
                        </button>
                    </div>
                </div>

                <div className="form-grid">
                    {/* Left Column - Main Info */}
                    <div className="form-column main-column">
                        {/* General Info Card */}
                        <div className="card">
                            <h2>General Information</h2>
                            <div className="form-row">
                                <div className="form-group">
                                <label>Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Wireless Headphones"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Enter full product description..."
                                    rows="5"
                                />
                            </div>
                            </div>
                        </div>

                        {/* Pricing Card */}
                        <div className="card">
                            <h2>Pricing</h2>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Selling Price</label>
                                    <div className="input-prefix">
                                        <span>$</span>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Cost Price</label>
                                    <div className="input-prefix">
                                        <span>$</span>
                                        <input
                                            type="number"
                                            name="costPrice"
                                            value={formData.costPrice}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        name="taxRate"
                                        value={formData.taxRate}
                                        onChange={handleChange}
                                        placeholder="0"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Inventory Card */}
                        <div className="card">
                            <h2>Inventory</h2>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>SKU</label>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleChange}
                                        placeholder="PROD-001"
                                        required
                                        disabled={isEdit}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Unit</label>
                                    <input
                                        type="text"
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        placeholder="pcs"
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Current Stock</label>
                                    <input
                                        type="number"
                                        name="stockQuantity"
                                        value={formData.stockQuantity}
                                        onChange={handleChange}
                                        placeholder="0"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Low Stock Alert Level</label>
                                    <input
                                        type="number"
                                        name="minStockLevel"
                                        value={formData.minStockLevel}
                                        onChange={handleChange}
                                        placeholder="5"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Organization & Status */}
                    <div className="form-column side-column">
                        {/* Status Card */}
                        <div className="card">
                            <h2>Status</h2>
                            <div className="form-group">
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className={`status-select ${formData.status}`}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                        </div>

                        {/* Organization Card */}
                        <div className="card">
                            <h2>Organization</h2>
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    {categories.map(cat => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddProduct;
