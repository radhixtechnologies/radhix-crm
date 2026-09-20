import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit, FiTrash2, FiMail, FiPhone, FiCalendar } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/format';
import Modal from '../common/Modal';
import '../../styles/employee/employees.css';

const ClientTable = ({ clients, onDelete, pagination, onPageChange }) => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, client: null });

  const handleDelete = (client) => {
    setDeleteModal({ open: true, client });
  };

  const confirmDelete = async () => {
    if (deleteModal.client) {
      await onDelete(deleteModal.client._id);
      setDeleteModal({ open: false, client: null });
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#ef4444';
      case 'prospect': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="table-container-responsive">
      <table className="table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Company</th>
            <th>Contact Info</th>
            <th>Status</th>
            <th>Revenue</th>
            <th>Created Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.length > 0 ? (
            clients.map((client) => (
              <tr key={client._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="employee-avatar-table">
                      {client.avatar ? (
                        <img
                          src={client.avatar}
                          alt={client.name || 'Client'}
                        />
                      ) : (
                        <span>{getInitials(client.name)}</span>
                      )}
                    </div>
                    <span>{client.name || 'N/A'}</span>
                  </div>
                </td>
                <td>{client.company || 'N/A'}</td>
                <td>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {client.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <FiPhone size={12} />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FiMail size={12} />
                        <span>{client.email}</span>
                      </div>
                    )}
                    {!client.phone && !client.email && 'N/A'}
                  </div>
                </td>
                <td>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: getStatusColor(client.status) + '20',
                      color: getStatusColor(client.status),
                      border: `1px solid ${getStatusColor(client.status)}40`,
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}
                  >
                    {client.status || 'N/A'}
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                    {formatCurrency(client.totalRevenue || 0)}
                  </span>
                </td>
                <td>
                  {client.createdAt ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <FiCalendar size={14} />
                      {formatDate(client.createdAt)}
                    </div>
                  ) : 'N/A'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => navigate(`/sales/clients/${client._id}`)}
                      title="View"
                    >
                      <FiEye />
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => navigate(`/sales/clients/${client._id}/edit`)}
                      title="Edit"
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca' }}
                      onClick={() => handleDelete(client)}
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
                No clients found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {pagination && pagination.pages > 1 && (
        <div className="pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '20px', borderTop: '1px solid var(--border)' }}>
          <button
            className="btn btn-sm btn-secondary"
            disabled={pagination.page === 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            Previous
          </button>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            className="btn btn-sm btn-secondary"
            disabled={pagination.page === pagination.pages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      )}

      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, client: null })} title="Delete Client">
        <p>Are you sure you want to delete this client?</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteModal({ open: false, client: null })}>
            Cancel
          </button>
          <button className="btn" style={{ background: '#ef4444', color: 'white' }} onClick={confirmDelete}>
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ClientTable;
