import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit, FiTrash2, FiMail, FiPhone, FiCalendar, FiDollarSign, FiMessageSquare, FiClock } from 'react-icons/fi';
import dayjs from 'dayjs';
import StatusBadge from './StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';
import Modal from '../common/Modal';
import '../../styles/employee/employees.css';

const getLeadFollowUpBadge = (dateVal, timeVal, status) => {
  if (!dateVal) return null;
  if (['converted', 'lost'].includes(status)) return null;
  const dateStr = dayjs(dateVal).format('YYYY-MM-DD');
  const todayStr = dayjs().format('YYYY-MM-DD');
  const timeSuffix = timeVal ? ` • ${timeVal}` : '';
  if (dateStr < todayStr) {
    return { text: `Overdue (${dayjs(dateVal).format('DD MMM')}${timeSuffix})`, bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
  }
  if (dateStr === todayStr) {
    return { text: `Today${timeSuffix}`, bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
  }
  return { text: `${dayjs(dateVal).format('DD MMM')}${timeSuffix}`, bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
};

const getLatestRemarkInfo = (lead) => {
  if (lead?.lastRemark?.content) {
    return {
      text: lead.lastRemark.content,
      author: lead.lastRemark.addedBy?.name || lead.lastRemark.addedByName || '',
      count: Array.isArray(lead.notes) ? lead.notes.length : 1,
    };
  }
  const notes = Array.isArray(lead?.notes) ? lead.notes : [];
  if (notes.length === 0) return null;
  const latest = notes[notes.length - 1];
  return {
    text: latest.content || '',
    author: latest.addedBy?.name || latest.addedByEmployeeName || '',
    count: notes.length,
  };
};

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const LeadTable = ({
  leads,
  onDelete,
  canDelete = true,
  pagination,
  onPageChange,
  selectedLeads = [],
  onSelectLeads,
}) => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, lead: null });

  const allVisibleSelected = leads.length > 0 && leads.every((l) => selectedLeads.includes(l._id));
  const someVisibleSelected = leads.some((l) => selectedLeads.includes(l._id)) && !allVisibleSelected;

  const handleSelectAll = (e) => {
    if (!onSelectLeads) return;
    if (e.target.checked) {
      const newIds = Array.from(new Set([...selectedLeads, ...leads.map((l) => l._id)]));
      onSelectLeads(newIds);
    } else {
      const visibleIds = new Set(leads.map((l) => l._id));
      onSelectLeads(selectedLeads.filter((id) => !visibleIds.has(id)));
    }
  };

  const handleToggleSelect = (leadId, e) => {
    if (e) e.stopPropagation();
    if (!onSelectLeads) return;
    if (selectedLeads.includes(leadId)) {
      onSelectLeads(selectedLeads.filter((id) => id !== leadId));
    } else {
      onSelectLeads([...selectedLeads, leadId]);
    }
  };

  const getOwnerName = (lead) => {
    const assignedTo = lead?.assignedTo;
    return assignedTo?.user?.name || assignedTo?.employeeId || 'Unassigned';
  };

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
      case 'meta': return '#0866ff';
      default: return '#6b7280';
    }
  };

  return (
    <div className="table-container-responsive">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: '40px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={allVisibleSelected}
                ref={(el) => { if (el) el.indeterminate = someVisibleSelected; }}
                onChange={handleSelectAll}
                title="Select all on this page"
                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#3b82f6' }}
              />
            </th>
            <th>Lead Name</th>
            <th>Company</th>
            <th>Contact Info</th>
            <th>Source</th>
            <th>Status</th>
            <th>Value</th>
            <th>Owner</th>
            <th>Follow-up &amp; Latest Remark</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.length > 0 ? (
            leads.map((lead) => {
              const followUpBadge = getLeadFollowUpBadge(lead.followUpDate, lead.followUpTime, lead.status);
              const remarkInfo = getLatestRemarkInfo(lead);
              return (
              <tr
                key={lead._id}
                style={{
                  backgroundColor: selectedLeads.includes(lead._id) ? '#eff6ff' : undefined,
                  transition: 'background-color 0.15s ease'
                }}
              >
                <td style={{ width: '40px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedLeads.includes(lead._id)}
                    onChange={(e) => handleToggleSelect(lead._id, e)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#3b82f6' }}
                  />
                </td>
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
                    <button
                      type="button"
                      onClick={() => navigate(`/sales/leads/${lead._id}`)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        font: 'inherit',
                        fontWeight: '600',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {lead.name || 'N/A'}
                    </button>
                  </div>
                </td>
                <td>{lead.company || 'N/A'}</td>
                <td>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {lead.phone && !['true', 'false', 'null', 'undefined'].includes(String(lead.phone).toLowerCase()) && (
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
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}
                  >
                    {lead.source === 'meta' ? 'Meta Ads' : (lead.source || 'N/A')}
                  </span>
                  {lead.source === 'meta' && (lead.metaAttribution?.adName || lead.metaAttribution?.platform) && (
                    <div style={{ fontSize: '10.5px', marginTop: '4px', color: '#0866ff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }} title={lead.metaAttribution.adName || lead.metaAttribution.platform}>
                      {lead.metaAttribution.adName || lead.metaAttribution.platform}
                    </div>
                  )}
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
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {getOwnerName(lead)}
                  </span>
                </td>
                <td style={{ minWidth: '210px', maxWidth: '280px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {followUpBadge ? (
                      <span
                        style={{
                          alignSelf: 'flex-start',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: followUpBadge.bg,
                          color: followUpBadge.color,
                          border: `1px solid ${followUpBadge.border}`,
                        }}
                      >
                        <FiClock size={10} /> {followUpBadge.text}
                      </span>
                    ) : (
                      <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>No callback set</span>
                    )}
                    {remarkInfo?.text && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '4px',
                        }}
                        title={`${remarkInfo.text}${remarkInfo.author ? ` — by ${remarkInfo.author}` : ''}`}
                      >
                        <FiMessageSquare size={11} style={{ marginTop: '3px', flexShrink: 0, color: '#64748b' }} />
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '230px',
                          }}
                        >
                          {remarkInfo.text}
                        </span>
                      </div>
                    )}
                  </div>
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
                      title="Open Lead, Remarks & Next Follow-up"
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
                    {canDelete && <button
                      className="btn btn-sm"
                      style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca' }}
                      onClick={() => handleDelete(lead)}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>}
                  </div>
                </td>
              </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
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
