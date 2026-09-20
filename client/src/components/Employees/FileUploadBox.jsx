import { useState } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';
import '../../styles/forms.css';

const FileUploadBox = ({ onFileSelect, accept = "*/*", maxSize = 5242880 }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > maxSize) {
      setError(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    setFile(selectedFile);
    setError('');
    if (onFileSelect) {
      onFileSelect(selectedFile);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setError('');
  };

  return (
    <div className="file-upload-box">
      {!file ? (
        <label className="file-upload-label">
          <FiUpload />
          <span>Click to upload or drag and drop</span>
          <input
            type="file"
            onChange={handleFileChange}
            accept={accept}
            style={{ display: 'none' }}
          />
        </label>
      ) : (
        <div className="file-upload-preview">
          <span>{file.name}</span>
          <button type="button" className="btn btn-sm btn-danger" onClick={handleRemove}>
            <FiX />
          </button>
        </div>
      )}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
};

export default FileUploadBox;

