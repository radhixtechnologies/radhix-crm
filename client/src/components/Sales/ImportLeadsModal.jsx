import { useState } from 'react';
import { FiX, FiDownload, FiUpload, FiCheck, FiFileText, FiAlertCircle } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import './ImportLeadsModal.css';

const ImportLeadsModal = ({ isOpen, onClose, onImportSuccess }) => {
    const [step, setStep] = useState(1); // 1: Upload, 2: Review, 3: Importing, 4: Complete
    const [file, setFile] = useState(null);
    const [summary, setSummary] = useState(null);
    const [progress, setProgress] = useState(0);
    const [importResults, setImportResults] = useState(null);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleFileChange = async (selectedFile) => {
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);

        try {
            // Call preview API to validate file
            const response = await salesService.previewLeadImport(selectedFile);

            if (response.data.success) {
                setSummary(response.data.data);
                setStep(2); // Go to Review step
            }
        } catch (err) {
            console.error('Preview error:', err);
            setError(err.response?.data?.message || 'Failed to preview file. Please check the format.');
            setFile(null);
        }
    };

    const handleImport = async () => {
        setStep(3); // Go to Importing step
        setProgress(0);
        setError(null);

        try {
            // Simulate progress while importing
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            // Call actual import API
            const response = await salesService.importLeads(file);

            clearInterval(progressInterval);
            setProgress(100);

            if (response.data.success) {
                setImportResults(response.data.data);
                setStep(4); // Go to Complete step

                // Notify parent to refresh leads list
                if (onImportSuccess) {
                    setTimeout(() => {
                        onImportSuccess();
                    }, 2000);
                }
            }
        } catch (err) {
            console.error('Import error:', err);
            setError(err.response?.data?.message || 'Failed to import leads. Please try again.');
            setStep(2); // Go back to review
        }
    };

    const cleanClose = () => {
        setStep(1);
        setFile(null);
        setSummary(null);
        setProgress(0);
        setImportResults(null);
        setError(null);
        onClose();
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await salesService.downloadLeadTemplate();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = 'leads_template.xlsx';
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Template download error:', err);
            alert('Failed to download template. Please try again.');
        }
    };

    return (
        <div className="modal-overlay" onClick={cleanClose}>
            <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-text">
                        <h2>Import Leads</h2>
                        <p className="modal-subtitle">Follow the steps to bulk import leads</p>
                    </div>
                    <button className="modal-close" onClick={cleanClose}>
                        <FiX />
                    </button>
                </div>

                <div className="modal-body">

                    {step === 1 && (
                        <div className="step-content fade-in">
                            {/* Step 1: Download Template */}
                            <div className="step-card">
                                <div className="step-icon-wrapper">
                                    <FiDownload className="step-icon" />
                                </div>
                                <div className="step-details">
                                    <h4>Step 1: Download Template</h4>
                                    <p>Start with our standardized Excel template.</p>
                                    <button className="btn-link" onClick={handleDownloadTemplate}>Download Template</button>
                                </div>
                            </div>

                            {/* Step 2: Upload */}
                            <div className="step-card active-step">
                                <div className="step-icon-wrapper">
                                    <FiUpload className="step-icon" />
                                </div>
                                <div className="step-details full-width">
                                    <h4>Step 2: Upload File</h4>
                                    <div
                                        className="file-upload-area compact"
                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const droppedFile = e.dataTransfer.files[0];
                                            if (droppedFile) {
                                                handleFileChange(droppedFile);
                                            }
                                        }}
                                    >
                                        <input
                                            type="file"
                                            accept=".csv,.xlsx,.xls"
                                            id="leadFileInput"
                                            onChange={(e) => handleFileChange(e.target.files[0])}
                                            style={{ display: 'none' }}
                                        />
                                        <label htmlFor="leadFileInput" className="file-upload-label">
                                            <span className="upload-link">Click to upload</span>
                                            <span className="upload-hint"> or drag and drop CSV, XLSX (Max 5MB)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="error-alert">
                                    <div className="alert-icon"><FiAlertCircle /></div>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="info-alert">
                                <div className="alert-icon"><FiAlertCircle /></div>
                                <span><strong>Note:</strong> Duplicate emails will be skipped automatically.</span>
                            </div>
                        </div>
                    )}

                    {step === 2 && summary && (
                        <div className="step-content review-step fade-in">
                            <h3>Step 3: Review & Confirm</h3>
                            <div className="review-card">
                                <div className="review-item">
                                    <span className="review-label">File Name</span>
                                    <div className="review-value">
                                        <FiFileText /> {file.name}
                                    </div>
                                </div>
                                <div className="review-row">
                                    <div className="review-stat">
                                        <span className="stat-value">{summary.totalRows}</span>
                                        <span className="stat-label">Total Rows</span>
                                    </div>
                                    <div className="review-stat">
                                        <span className="stat-value" style={{ color: '#10b981' }}>{summary.validRows}</span>
                                        <span className="stat-label">Valid Rows</span>
                                    </div>
                                    {summary.invalidRows > 0 && (
                                        <div className="review-stat">
                                            <span className="stat-value" style={{ color: '#ef4444' }}>{summary.invalidRows}</span>
                                            <span className="stat-label">Invalid Rows</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="error-alert">
                                    <div className="alert-icon"><FiAlertCircle /></div>
                                    <span>{error}</span>
                                </div>
                            )}

                            <p className="review-note">Ready to import? This action cannot be undone.</p>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="step-content progress-step fade-in">
                            <h3>Step 4: Importing...</h3>
                            <div className="progress-container">
                                <div className="progress-bar-track">
                                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                                <span className="progress-label">{progress}% Complete</span>
                            </div>
                            <p className="progress-subtext">Please do not close this window.</p>
                        </div>
                    )}

                    {step === 4 && importResults && (
                        <div className="step-content complete-step fade-in">
                            <div className="success-icon-wrapper">
                                <FiCheck className="success-icon" />
                            </div>
                            <h3>Import Complete!</h3>
                            <div className="results-card">
                                <div className="result-row">
                                    <span className="result-label">Total Rows:</span>
                                    <span className="result-value">{importResults.total}</span>
                                </div>
                                <div className="result-row success">
                                    <span className="result-label">Successfully Imported:</span>
                                    <span className="result-value">{importResults.success.length}</span>
                                </div>
                                {importResults.failed.length > 0 && (
                                    <div className="result-row warning">
                                        <span className="result-label">Skipped (Duplicate/Invalid):</span>
                                        <span className="result-value">{importResults.failed.length}</span>
                                    </div>
                                )}
                            </div>
                            <p className="complete-note">The lead list will refresh automatically.</p>
                        </div>
                    )}

                </div>

                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={cleanClose}>
                        {step === 4 ? 'Close' : 'Cancel'}
                    </button>
                    {step === 2 && (
                        <button className="btn btn-gradient" onClick={handleImport}>
                            Import {summary?.validRows || 0} Leads
                        </button>
                    )}
                    {step === 1 && (
                        <button className="btn btn-secondary" disabled>
                            Select File to Continue
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportLeadsModal;
