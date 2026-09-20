import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit, FiTrash2, FiCheck } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import { formatDate } from '../../utils/format';
import ReminderBadge from './ReminderBadge';
import EditFollowUpModal from './EditFollowUpModal';
import CompleteFollowUpModal from './CompleteFollowUpModal';
import Modal from '../common/Modal';
import '../../styles/sales/followups.css';

const FollowupTable = ({ followups, pagination, onPageChange }) => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, followup: null });
  const [editModal, setEditModal] = useState({ open: false, followup: null });
  const [completeModal, setCompleteModal] = useState({ open: false, followup: null });

  const handleDelete = (followup) => {
    setDeleteModal({ open: true, followup });
  };

  const confirmDelete = async () => {
    if (deleteModal.followup) {
      try {
        await salesService.deleteFollowUp(deleteModal.followup._id);
        setDeleteModal({ open: false, followup: null });
        window.location.reload();
      } catch (error) {
        console.error('Error deleting follow-up:', error);
        alert(error.response?.data?.message || 'Failed to delete follow-up');
      }
    }
  };

  const handleEdit = (followup) => {
    setEditModal({ open: true, followup });
  };

  const handleComplete = (followup) => {
    setCompleteModal({ open: true, followup });
  };

  return (
    <div className="followup-table-container">
      <table className="followup-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Related To</th>
            <th>Scheduled Date</th>
            <th>Assigned To</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {followups.length > 0 ? (
            followups.map((followup) => (
              <tr key={followup._id}>
                <td className="title-cell">{followup.title}</td>
                <td>
                  <span className="type-badge">{followup.type}</span>
                </td>
                <td>
                  {followup.type === 'lead' && (followup.relatedId?.name || 'N/A')}
                  {followup.type === 'client' && (followup.relatedId?.name || 'N/A')}
                  {followup.type === 'deal' && (followup.relatedId?.title || 'N/A')}
                </td>
                <td>{formatDate(followup.scheduledDate)} {followup.scheduledTime && `at ${followup.scheduledTime}`}</td>
                <td>{followup.assignedTo?.user?.name || 'N/A'}</td>
                <td>
                  <ReminderBadge status={followup.status} />
                </td>
                <td className="actions">
                  {followup.status === 'pending' && (
                    <button className="btn-icon" onClick={() => handleComplete(followup)} title="Mark Complete">
                      <FiCheck />
                    </button>
                  )}
                  <button className="btn-icon" onClick={() => handleEdit(followup)} title="Edit">
                    <FiEdit />
                  </button>
                  <button className="btn-icon" onClick={() => handleDelete(followup)} title="Delete">
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center empty-state">
                No follow-ups found
              </td>
            </tr>
          )}
        </tbody>
      </table>

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

      {/* Edit Follow-up Modal */}
      <EditFollowUpModal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, followup: null })}
        followup={editModal.followup}
        onSuccess={() => {
          setEditModal({ open: false, followup: null });
          window.location.reload();
        }}
      />

      {/* Complete Follow-up Modal */}
      <CompleteFollowUpModal
        isOpen={completeModal.open}
        onClose={() => setCompleteModal({ open: false, followup: null })}
        followup={completeModal.followup}
        onSuccess={() => {
          setCompleteModal({ open: false, followup: null });
          window.location.reload();
        }}
      />
    </div>
  );
};

export default FollowupTable;


