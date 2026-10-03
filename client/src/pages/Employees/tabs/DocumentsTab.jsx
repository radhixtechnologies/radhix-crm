import { useState } from 'react';
import { employeeService } from '../../../services/employeeService';
import { formatDate } from '../../../utils/format';
import { FiPlus, FiDownload, FiTrash2 } from 'react-icons/fi';
import Modal from '../../../components/common/Modal';
import DocumentCard from '../../../components/Employees/DocumentCard';
import FileUploadBox from '../../../components/Employees/FileUploadBox';
import '../../../styles/forms.css';

const DocumentsTab = ({ employee, canEdit, onRefresh }) => {
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentForm, setDocumentForm] = useState({ name: '', url: '', type: 'other' });

  const handleAddDocument = async () => {
    try {
      await employeeService.addDocument(employee._id, documentForm);
      setShowDocumentModal(false);
      setDocumentForm({ name: '', url: '', type: 'other' });
      onRefresh();
      alert('Document added successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding document');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await employeeService.deleteDocument(employee._id, docId);
      onRefresh();
      alert('Document deleted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting document');
    }
  };

  return (
    <div className="documents-tab">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">Documents</h3>
          {canEdit && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowDocumentModal(true)}>
              <FiPlus /> Add Document
            </button>
          )}
        </div>
        {employee.documents && employee.documents.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '20px' }}>
            {employee.documents.map((doc) => (
              <DocumentCard
                key={doc._id}
                document={doc}
                canEdit={canEdit}
                onDelete={() => handleDeleteDocument(doc._id)}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No documents found
          </div>
        )}
      </div>

      <Modal isOpen={showDocumentModal} onClose={() => setShowDocumentModal(false)} title="Add Document">
        <form onSubmit={(e) => { e.preventDefault(); handleAddDocument(); }}>
          <div className="form-group">
            <label className="form-label">Document Name *</label>
            <input
              type="text"
              className="form-input"
              value={documentForm.name}
              onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
              required
              placeholder="e.g., Resume.pdf"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Document Type *</label>
            <select
              className="form-select"
              value={documentForm.type}
              onChange={(e) => setDocumentForm({ ...documentForm, type: e.target.value })}
              required
            >
              <option value="resume">Resume</option>
              <option value="id-proof">ID Proof</option>
              <option value="certificate">Certificate</option>
              <option value="contract">Employment Contract</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Document URL *</label>
            <input
              type="url"
              className="form-input"
              value={documentForm.url}
              onChange={(e) => setDocumentForm({ ...documentForm, url: e.target.value })}
              required
              placeholder="https://example.com/document.pdf"
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowDocumentModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Document
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DocumentsTab;

