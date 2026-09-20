import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { formatCurrency } from '../../utils/format';
import '../../styles/employee/employees.css';

const ProductTable = ({ products, onDelete }) => {
    const navigate = useNavigate();

    const getStatusColor = (status) => {
        return status === 'active' ? '#10b981' : '#ef4444';
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="table-container-responsive">
            <table className="table">
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.length > 0 ? (
                        products.map(product => (
                            <tr key={product._id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="employee-avatar-table" style={{ borderRadius: '8px', backgroundColor: '#e2e8f0', color: '#64748b' }}>
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} style={{ borderRadius: '8px' }} />
                                            ) : (
                                                <span>{getInitials(product.name)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{product.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                {product.description?.substring(0, 30)}...
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{product.sku}</span>
                                </td>
                                <td>
                                    <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd' }}>
                                        {product.category}
                                    </span>
                                </td>
                                <td>
                                    <span style={{ fontWeight: '600' }}>{formatCurrency(product.price)}</span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{
                                            color: product.stockQuantity <= product.minStockLevel ? '#ef4444' : 'inherit',
                                            fontWeight: product.stockQuantity <= product.minStockLevel ? '600' : '400'
                                        }}>
                                            {product.stockQuantity} {product.unit}
                                        </span>
                                        {product.stockQuantity <= product.minStockLevel && (
                                            <FiAlertTriangle color="#ef4444" size={14} title="Low Stock" />
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span
                                        className="badge"
                                        style={{
                                            backgroundColor: getStatusColor(product.status) + '20',
                                            color: getStatusColor(product.status),
                                            border: `1px solid ${getStatusColor(product.status)}40`,
                                        }}
                                    >
                                        {product.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => navigate(`/inventory/products/${product._id}/edit`)}
                                            title="Edit"
                                        >
                                            <FiEdit2 />
                                        </button>
                                        <button
                                            className="btn btn-sm"
                                            style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca' }}
                                            onClick={() => onDelete(product._id)}
                                            title="Delete"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                No products found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ProductTable;
