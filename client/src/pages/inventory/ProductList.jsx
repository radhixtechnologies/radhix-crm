import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiPackage, FiTrendingUp, FiTrendingDown, FiAlertTriangle, FiCheckCircle, FiDollarSign } from 'react-icons/fi';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import './ProductList.css';

const ProductList = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [stockModal, setStockModal] = useState({ open: false, product: null, type: '' });
    const [stockQuantity, setStockQuantity] = useState('');
    const [stockNotes, setStockNotes] = useState('');
    const [deleteModal, setDeleteModal] = useState({ open: false, product: null });

    const categories = ['electronics', 'hardware', 'software', 'service', 'office_supplies', 'other'];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/inventory/products');
            if (res.data.success) {
                setProducts(res.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            alert('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.product) return;

        try {
            await api.delete(`/inventory/products/${deleteModal.product._id}`);
            setDeleteModal({ open: false, product: null });
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert(error.response?.data?.message || 'Failed to delete product');
        }
    };

    const handleStockAction = async () => {
        if (!stockQuantity || stockQuantity <= 0) {
            alert('Please enter a valid quantity');
            return;
        }

        try {
            const endpoint = stockModal.type === 'in' ? 'stock-in' : 'stock-out';
            const res = await api.post(`/inventory/products/${stockModal.product._id}/${endpoint}`, {
                quantity: parseInt(stockQuantity),
                notes: stockNotes
            });

            if (res.data.success) {
                alert(res.data.message);
                setStockModal({ open: false, product: null, type: '' });
                setStockQuantity('');
                setStockNotes('');
                fetchProducts();
            }
        } catch (error) {
            console.error('Error updating stock:', error);
            alert(error.response?.data?.message || 'Failed to update stock');
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const isLowStock = (product) => product.stockQuantity <= product.minStockLevel;

    if (loading) return <Loader />;

    return (
        <div className="product-list-page">
            <div className="page-header">
                <div>
                    <h1>Inventory Management</h1>
                    <p>Manage your products and stock levels</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/inventory/products/new')}>
                    <FiPlus /> Add Product
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                {/* Total Products */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiPackage />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {products.length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Products
                        </div>
                    </div>
                </div>

                {/* In Stock */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiCheckCircle />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {products.filter(p => p.stockQuantity > p.minStockLevel).length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            In Stock
                        </div>
                    </div>
                </div>

                {/* Low Stock */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiAlertTriangle />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {products.filter(p => p.stockQuantity <= p.minStockLevel).length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Low Stock
                        </div>
                    </div>
                </div>

                {/* Total Value */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiDollarSign />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            ${products.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Value
                        </div>
                    </div>
                </div>
            </div>

            <div className="filters-section">
                <div className="search-box">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search products by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="category-filter"
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>
                            {cat.replace('_', ' ').toUpperCase()}
                        </option>
                    ))}
                </select>
            </div>

            {filteredProducts.length === 0 ? (
                <div className="empty-state">
                    <FiPackage size={48} />
                    <h3>No Products Found</h3>
                    <p>Add your first product to get started</p>
                    <button className="btn-primary" onClick={() => navigate('/inventory/products/new')}>
                        <FiPlus /> Add Product
                    </button>
                </div>
            ) : (
                <div className="products-table-container">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => (
                                <tr key={product._id} className={isLowStock(product) ? 'low-stock-row' : ''}>
                                    <td className="sku-cell">{product.sku}</td>
                                    <td className="product-name">
                                        {product.name}
                                        {isLowStock(product) && (
                                            <span className="low-stock-badge">
                                                <FiAlertTriangle size={14} /> Low Stock
                                            </span>
                                        )}
                                    </td>
                                    <td className="category-cell">
                                        <span className="category-badge">{product.category.replace('_', ' ')}</span>
                                    </td>
                                    <td className="price-cell">${product.price.toFixed(2)}</td>
                                    <td className="stock-cell">
                                        <span className={`stock-quantity ${isLowStock(product) ? 'low' : ''}`}>
                                            {product.stockQuantity} {product.unit}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${product.status}`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            className="btn-icon btn-stock-in"
                                            onClick={() => setStockModal({ open: true, product, type: 'in' })}
                                            title="Stock In"
                                        >
                                            <FiTrendingUp />
                                        </button>
                                        <button
                                            className="btn-icon btn-stock-out"
                                            onClick={() => setStockModal({ open: true, product, type: 'out' })}
                                            title="Stock Out"
                                        >
                                            <FiTrendingDown />
                                        </button>
                                        <button
                                            className="btn-icon btn-edit"
                                            onClick={() => navigate(`/inventory/products/${product._id}/edit`)}
                                            title="Edit"
                                        >
                                            <FiEdit />
                                        </button>
                                        <button
                                            className="btn-icon btn-delete"
                                            onClick={() => setDeleteModal({ open: true, product })}
                                            title="Delete"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Stock In/Out Modal */}
            <Modal
                isOpen={stockModal.open}
                onClose={() => {
                    setStockModal({ open: false, product: null, type: '' });
                    setStockQuantity('');
                    setStockNotes('');
                }}
                title={`Stock ${stockModal.type === 'in' ? 'In' : 'Out'} - ${stockModal.product?.name}`}
            >
                <div className="stock-modal-content">
                    <p className="current-stock">
                        Current Stock: <strong>{stockModal.product?.stockQuantity} {stockModal.product?.unit}</strong>
                    </p>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Quantity *</label>
                            <input
                                type="number"
                                min="1"
                                value={stockQuantity}
                                onChange={(e) => setStockQuantity(e.target.value)}
                                placeholder="Enter quantity"
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>Notes (Optional)</label>
                            <textarea
                                value={stockNotes}
                                onChange={(e) => setStockNotes(e.target.value)}
                                placeholder="Add notes about this stock movement..."
                                rows="3"
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                setStockModal({ open: false, product: null, type: '' });
                                setStockQuantity('');
                                setStockNotes('');
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            className={`btn-primary ${stockModal.type === 'out' ? 'btn-danger' : ''}`}
                            onClick={handleStockAction}
                        >
                            {stockModal.type === 'in' ? 'Add Stock' : 'Remove Stock'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, product: null })}
                title="Delete Product"
            >
                <p>Are you sure you want to delete <strong>{deleteModal.product?.name}</strong>?</p>
                <p className="warning-text">This action cannot be undone.</p>
                <div className="modal-actions">
                    <button className="btn-secondary" onClick={() => setDeleteModal({ open: false, product: null })}>
                        Cancel
                    </button>
                    <button className="btn-error" onClick={handleDelete}>
                        Delete
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default ProductList;
