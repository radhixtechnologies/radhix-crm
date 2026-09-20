import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit, FiTrash2, FiMail, FiPhone, FiCalendar, FiDollarSign } from 'react-icons/fi';
import StatusBadge from './StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';
import Modal from '../common/Modal';
import '../../styles/employee/employees.css';

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const LeadTable = ({ leads, onDelete, pagination, onPageChange }) => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, lead: null });

  const handleDelete = (lead) => {
    setDeleteModal({ open: true, lead });
  };

  const confirmDelete = async () => {
    if (deleteModal.lead) {
      await onDelete(deleteModal.lead._id);
      setDeleteModal({ open: false, lead: null });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#3b82f6';
      case 'contacted': return '#f59e0b';
      case 'qualified': return '#8b5cf6';
      case 'converted': return '#10b981';
      case 'lost': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSourceColor = (source) => {
    switch (source) {
      case 'website': return '#3b82f6';
      case 'referral': return '#10b981';
      case 'social-media': return '#8b5cf6';
      case 'campaign': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="table-container-responsive">
      <table className="table">
        <thead>
          <tr>
            <th>Lead Name</th>
            <th>Company</th>
            <th>Contact Info</th>
            <th>Source</th>
            <th>Status</th>
            <th>Value</th>
            <th>Owner</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.length > 0 ? (
            leads.map((lead) => (
              <tr key={lead._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="employee-avatar-table">
                      {lead.avatar ? (
                        <img
                          src={lead.avatar}
                          alt={lead.name || 'Lead'}
                        />
                      ) : (
                        <span>{getInitials(lead.name)}</span>
                      )}
                    </div>
                    <span style={{ fontWeight: '500' }}>{lead.name || 'N/A'}</span>
                  </div>
                </td>
                <td>{lead.company || 'N/A'}</td>
                <td>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {lead.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <FiPhone size={12} />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                    {lead.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FiMail size={12} />
                        <span>{lead.email}</span>
                      </div>
                    )}
                    {!lead.phone && !lead.email && 'N/A'}
                  </div>
                </td>
                <td>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: getSourceColor(lead.source) + '20',
                      color: getSourceColor(lead.source),
                      border: `1px solid ${getSourceColor(lead.source)}40`,
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}
                  >
                    {lead.source || 'N/A'}
                  </span>
                  {lead.source === 'campaign' && lead.campaign && (
                    <div style={{ fontSize: '10px', marginTop: '4px', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }} title={lead.campaign.name || ''}>
                      {lead.campaign.name}
                    </div>
                  )}
                </td>
                <td>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: getStatusColor(lead.status) + '20',
                      color: getStatusColor(lead.status),
                      border: `1px solid ${getStatusColor(lead.status)}40`,
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}
                  >
                    {lead.status || 'N/A'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiDollarSign size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                      {formatCurrency(lead.value || 0)}
                    </span>
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: '13px' }}>
                    {lead.assignedTo?.user?.name || 'Unassigned'}
                  </span>
                </td>
                <td>
                  {lead.createdAt ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <FiCalendar size={14} />
                      {formatDate(lead.createdAt)}
                    </div>
                  ) : 'N/A'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => navigate(`/sales/leads/${lead._id}`)}
                      title="View"
                    >
                      <FiEye />
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => navigate(`/sales/leads/${lead._id}/edit`)}
                      title="Edit"
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca' }}
                      onClick={() => handleDelete(lead)}
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
              <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No leads found
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

      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, lead: null })} title="Delete Lead">
        <p>Are you sure you want to delete this lead?</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteModal({ open: false, lead: null })}>
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

export default LeadTable;
