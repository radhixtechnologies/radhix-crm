import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit, FiTrash2, FiCheck, FiPhone, FiClock, FiMessageSquare, FiExternalLink } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import dayjs from 'dayjs';
import { salesService } from '../../services/salesService';
import ReminderBadge from './ReminderBadge';
import EditFollowUpModal from './EditFollowUpModal';
import CompleteFollowUpModal from './CompleteFollowUpModal';
import WhatsAppModal from '../common/WhatsAppModal';
import Modal from '../common/Modal';
import '../../styles/sales/followups.css';

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const getDueLabel = (scheduledDate, scheduledTime, status) => {
  if (!scheduledDate) return { text: 'Not Set', tone: 'neutral', dateText: '-' };
  const dateStr = dayjs(scheduledDate).format('YYYY-MM-DD');
  const todayStr = dayjs().format('YYYY-MM-DD');
  const tomorrowStr = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const formatted = dayjs(scheduledDate).format('DD MMM YYYY');
  const timePart = scheduledTime ? ` at ${scheduledTime}` : '';

  if (status === 'completed') {
    return { text: 'Completed', tone: 'success', dateText: `${formatted}${timePart}` };
  }
  if (status === 'cancelled') {
    return { text: 'Cancelled', tone: 'neutral', dateText: `${formatted}${timePart}` };
  }
  if (dateStr < todayStr || status === 'overdue') {
    const diffDays = Math.max(1, dayjs(todayStr).diff(dayjs(dateStr), 'day'));
    return { text: `Overdue ${diffDays}d`, tone: 'danger', dateText: `${formatted}${timePart}` };
  }
  if (dateStr === todayStr) {
    return { text: 'Due Today', tone: 'warning', dateText: `Today${timePart}` };
  }
  if (dateStr === tomorrowStr) {
    return { text: 'Tomorrow', tone: 'info', dateText: `Tomorrow${timePart}` };
  }
  return { text: 'Scheduled', tone: 'info', dateText: `${formatted}${timePart}` };
};

const FollowupTable = ({
  followups,
  pagination,
  onPageChange,
  selectedFollowups = [],
  onSelectFollowups,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, followup: null });
  const [editModal, setEditModal] = useState({ open: false, followup: null });
  const [completeModal, setCompleteModal] = useState({ open: false, followup: null });
  const [waModal, setWaModal] = useState({ open: false, name: '', phone: '', leadId: '', date: '', time: '' });

  const allVisibleSelected = followups.length > 0 && followups.every((f) => selectedFollowups.includes(f._id));
  const someVisibleSelected = followups.some((f) => selectedFollowups.includes(f._id)) && !allVisibleSelected;

  const handleSelectAll = (e) => {
    if (!onSelectFollowups) return;
    if (e.target.checked) {
      const newIds = Array.from(new Set([...selectedFollowups, ...followups.map((f) => f._id)]));
      onSelectFollowups(newIds);
    } else {
      const visibleIds = new Set(followups.map((f) => f._id));
      onSelectFollowups(selectedFollowups.filter((id) => !visibleIds.has(id)));
    }
  };

  const handleToggleSelect = (id, e) => {
    if (e) e.stopPropagation();
    if (!onSelectFollowups) return;
    if (selectedFollowups.includes(id)) {
      onSelectFollowups(selectedFollowups.filter((item) => item !== id));
    } else {
      onSelectFollowups([...selectedFollowups, id]);
    }
  };

  const getOwnerName = (followup) => {
    const assignedTo = followup?.assignedTo;
    return assignedTo?.user?.name || assignedTo?.employeeId || 'Unassigned';
  };

  const getEntityUrl = (followup) => {
    const relId = followup?.relatedId?._id || followup?.relatedId;
    if (!relId || typeof relId !== 'string') return null;
    if (followup.type === 'lead') return `/sales/leads/${relId}`;
    if (followup.type === 'client') return `/sales/clients/${relId}`;
    if (followup.type === 'deal') return `/sales/deals/${relId}`;
    return null;
  };

  const confirmDelete = async () => {
    if (!deleteModal.followup) return;
    try {
      await salesService.deleteFollowUp(deleteModal.followup._id);
      setDeleteModal({ open: false, followup: null });
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('Error deleting follow-up:', error);
      alert(error.response?.data?.message || 'Failed to delete follow-up');
    }
  };

  return (
    <div className="followup-table-container">
      <div style={{ overflowX: 'auto' }}>
        <table className="followup-table">
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
              <th>Client / Lead</th>
              <th>Follow-up &amp; Latest Remark</th>
              <th>Handling Employee</th>
              <th>Next Call Due</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {followups.length > 0 ? (
              followups.map((followup) => {
                const related = followup.relatedId && typeof followup.relatedId === 'object' ? followup.relatedId : null;
                const entityName = related?.name || related?.title || 'Unlinked Record';
                const entityCompany = related?.company || '';
                const entityPhone = related?.phone || '';
                const entityUrl = getEntityUrl(followup);
                const ownerName = getOwnerName(followup);
                const dueInfo = getDueLabel(followup.scheduledDate, followup.scheduledTime, followup.status);
                const latestRemarkText =
                  followup.outcome ||
                  related?.lastRemark?.content ||
                  followup.description ||
                  '';

                return (
                  <tr
                    key={followup._id}
                    style={{
                      backgroundColor: selectedFollowups.includes(followup._id) ? '#eff6ff' : undefined,
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ width: '40px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedFollowups.includes(followup._id)}
                        onChange={(e) => handleToggleSelect(followup._id, e)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#3b82f6' }}
                      />
                    </td>

                    {/* Client / Lead */}
                    <td style={{ minWidth: '210px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {entityUrl ? (
                            <button
                              type="button"
                              onClick={() => navigate(entityUrl)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                padding: 0,
                                font: 'inherit',
                                fontWeight: 700,
                                color: '#1d4ed8',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                textAlign: 'left',
                              }}
                              title="Open full client remarks & history"
                            >
                              {entityName} <FiExternalLink size={11} />
                            </button>
                          ) : (
                            <strong style={{ color: '#0f172a' }}>{entityName}</strong>
                          )}
                          <span className="type-badge">{followup.type}</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                          {entityPhone && (
                            <a
                              href={`tel:${entityPhone}`}
                              style={{ color: '#059669', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                            >
                              <FiPhone size={11} /> {entityPhone}
                            </a>
                          )}
                          {entityCompany && <span>{entityCompany}</span>}
                        </div>
                      </div>
                    </td>

                    {/* Title & Latest Remark */}
                    <td style={{ minWidth: '250px', maxWidth: '340px' }}>
                      <div className="title-cell" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span>{followup.title}</span>
                        {followup.typeOfFollowUp && (
                          <span style={{ fontSize: '10.5px', padding: '1px 7px', borderRadius: '999px', background: '#eef2ff', color: '#4338ca', fontWeight: 600, textTransform: 'capitalize' }}>
                            {followup.typeOfFollowUp}
                          </span>
                        )}
                      </div>
                      {latestRemarkText && (
                        <div
                          style={{
                            marginTop: '4px',
                            fontSize: '12px',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '5px',
                            lineHeight: 1.4,
                          }}
                          title={latestRemarkText}
                        >
                          <FiMessageSquare size={12} style={{ marginTop: '3px', flexShrink: 0, color: '#64748b' }} />
                          <span style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {latestRemarkText}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Handling Employee */}
                    <td style={{ minWidth: '165px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(ownerName)}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>{ownerName}</span>
                          {followup.assignedTo?.department && (
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{followup.assignedTo.department}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Next Call Due */}
                    <td style={{ minWidth: '155px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '13px' }}>
                          <FiClock size={12} style={{ color: '#64748b' }} /> {dueInfo.dateText}
                        </span>
                        <span
                          style={{
                            alignSelf: 'flex-start',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background:
                              dueInfo.tone === 'danger' ? '#fef2f2'
                                : dueInfo.tone === 'warning' ? '#fffbeb'
                                  : dueInfo.tone === 'success' ? '#ecfdf5'
                                    : '#eff6ff',
                            color:
                              dueInfo.tone === 'danger' ? '#dc2626'
                                : dueInfo.tone === 'warning' ? '#d97706'
                                  : dueInfo.tone === 'success' ? '#059669'
                                    : '#2563eb',
                          }}
                        >
                          {dueInfo.text}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <ReminderBadge status={followup.status} />
                    </td>

                    {/* Actions */}
                    <td className="actions">
                      <button
                        className="btn-icon"
                        onClick={() => setWaModal({
                          open: true,
                          name: entityName,
                          phone: entityPhone,
                          leadId: followup.type === 'lead' ? (related?._id || followup.relatedId || '') : '',
                          date: followup.scheduledDate ? dayjs(followup.scheduledDate).format('DD MMM YYYY') : '',
                          time: followup.scheduledTime || '',
                        })}
                        title={entityPhone ? 'Send WhatsApp Follow-up' : 'No phone number'}
                        disabled={!entityPhone}
                        style={{ color: entityPhone ? '#25d366' : '#cbd5e1' }}
                      >
                        <FaWhatsapp />
                      </button>
                      {['pending', 'overdue'].includes(followup.status) && (
                        <button
                          className="btn-icon"
                          onClick={() => setCompleteModal({ open: true, followup })}
                          title="Complete & Log Client Remark / Next Call"
                          style={{ color: '#059669' }}
                        >
                          <FiCheck />
                        </button>
                      )}
                      <button className="btn-icon" onClick={() => setEditModal({ open: true, followup })} title="Edit">
                        <FiEdit />
                      </button>
                      <button className="btn-icon" onClick={() => setDeleteModal({ open: true, followup })} title="Delete">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center empty-state">
                  No follow-ups found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="pagination">
          <button className="btn btn-secondary" disabled={pagination.page === 1} onClick={() => onPageChange(pagination.page - 1)}>
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.pages}</span>
          <button className="btn btn-secondary" disabled={pagination.page === pagination.pages} onClick={() => onPageChange(pagination.page + 1)}>
            Next
          </button>
        </div>
      )}

      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, followup: null })} title="Delete Follow-up">
        <p>Are you sure you want to delete this follow-up?</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setDeleteModal({ open: false, followup: null })}>
            Cancel
          </button>
          <button className="btn btn-error" onClick={confirmDelete}>
            Delete
          </button>
        </div>
      </Modal>

      <EditFollowUpModal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, followup: null })}
        followup={editModal.followup}
        onSuccess={async () => {
          setEditModal({ open: false, followup: null });
          if (onRefresh) await onRefresh();
        }}
      />

      <CompleteFollowUpModal
        isOpen={completeModal.open}
        onClose={() => setCompleteModal({ open: false, followup: null })}
        followup={completeModal.followup}
        onSuccess={async () => {
          setCompleteModal({ open: false, followup: null });
          if (onRefresh) await onRefresh();
        }}
      />

      {waModal.open && (
        <WhatsAppModal
          isOpen={waModal.open}
          onClose={() => setWaModal({ open: false, name: '', phone: '', leadId: '', date: '', time: '' })}
          recipientName={waModal.name}
          recipientPhone={waModal.phone}
          defaultTemplateId={waModal.date ? 'callback_confirmation' : 'general_followup'}
          contextVariables={{
            date: waModal.date || undefined,
            time: waModal.time || undefined,
          }}
          onSent={async ({ message }) => {
            if (waModal.leadId) {
              try {
                await salesService.addCommunication(waModal.leadId, {
                  type: 'whatsapp',
                  outcome: 'whatsapp_sent',
                  notes: `WhatsApp sent: ${message}`,
                });
                if (onRefresh) await onRefresh();
              } catch (err) {
                console.warn('Failed to log WhatsApp to lead:', err);
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default FollowupTable;
