import { formatDate } from '../../utils/format';
import { FiDownload, FiTrash2 } from 'react-icons/fi';
import '../../styles/employees.css';

const DocumentCard = ({ document, canEdit, onDelete }) => {
  return (
    <div className="document-card">
      <div className="document-card-header">
        <h4>{document.name}</h4>
        <span className={`badge badge-secondary`} style={{ textTransform: 'capitalize' }}>
          {document.type?.replace('-', ' ')}
        </span>
      </div>
      <div className="document-card-body">
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Uploaded: {formatDate(document.uploadedAt)}
        </div>
      </div>
      <div className="document-card-actions">
        {document.url && (
          <a href={document.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">
            <FiDownload /> Download
          </a>
        )}
        {canEdit && (
          <button className="btn btn-sm btn-danger" onClick={onDelete}>
            <FiTrash2 />
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;

