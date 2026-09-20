import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import Loader from '../../components/common/Loader';
import { 
  FiDownload, 
  FiUpload, 
  FiFile, 
  FiCheckCircle, 
  FiXCircle, 
  FiAlertCircle,
  FiFilter,
  FiFileText,
  FiDatabase,
  FiClock
} from 'react-icons/fi';
import '../../styles/employee/import-export.css';

const EmployeeImportExport = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [importLogs, setImportLogs] = useState([]);
  const [exporting, setExporting] = useState(false);
  
  // Export filters
  const [exportFilters, setExportFilters] = useState({
    department: 'all',
    role: 'all',
    status: 'all',
    includeSalary: false,
  });

  // Departments list
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (isAdmin || isSuperAdmin) {
      fetchDepartments();
      fetchImportLogs();
    }
  }, [isAdmin, isSuperAdmin]);

  const fetchDepartments = async () => {
    try {
      const response = await employeeService.getEmployees();
      if (response.data.success) {
        const depts = [...new Set(response.data.data.map(emp => emp.department).filter(Boolean))];
        setDepartments(depts);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchImportLogs = async () => {
    try {
      const response = await employeeService.getImportLogs();
      if (response.data.success) {
        setImportLogs(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching import logs:', error);
    }
  };

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Import/Export Employees</h1>
        </div>
        <div className="page-content">
          <div className="card">
            <p style={{ textAlign: 'center', padding: '20px' }}>
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      const response = await employeeService.downloadImportTemplate();
      
      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'employee_import_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      alert('Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.');
      e.target.value = '';
      return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.');
      e.target.value = '';
      return;
    }
    
    setImportFile(file);
    setImportResults(null);
    setPreviewData(null);

    // Auto-preview
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('import', file);
      const response = await employeeService.previewImport(file);
      
      if (response.data.success) {
        setPreviewData(response.data.data);
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      alert('Failed to preview file. Please check the file format.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      alert('Please select a file to import');
      return;
    }

    if (!window.confirm('Are you sure you want to import employees from this file? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await employeeService.importEmployees(importFile);
      
      if (response.data.success) {
        setImportResults(response.data.data);
        setImportFile(null);
        setPreviewData(null);
        fetchImportLogs();
        
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        
        alert(`Import completed! ${response.data.data.success.length} successful, ${response.data.data.failed.length} failed.`);
      }
    } catch (error) {
      console.error('Error importing employees:', error);
      alert(error.response?.data?.message || 'Failed to import employees');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const params = {
        department: exportFilters.department !== 'all' ? exportFilters.department : undefined,
        role: exportFilters.role !== 'all' ? exportFilters.role : undefined,
        status: exportFilters.status !== 'all' ? exportFilters.status : undefined,
        includeSalary: exportFilters.includeSalary ? 'true' : undefined,
      };

      let response;
      let mimeType;
      let extension;

      switch (format) {
        case 'csv':
          response = await employeeService.exportEmployeesCSV(params);
          mimeType = 'text/csv';
          extension = 'csv';
          break;
        case 'excel':
          response = await employeeService.exportEmployeesExcel(params);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          extension = 'xlsx';
          break;
        case 'pdf':
          response = await employeeService.exportEmployeesPDF(params);
          mimeType = 'application/pdf';
          extension = 'pdf';
          break;
        default:
          throw new Error('Invalid export format');
      }

      // Create blob and download
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `employees_export_${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert(`Employees exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Error exporting employees:', error);
      alert('Failed to export employees');
    } finally {
      setExporting(false);
    }
  };

  const downloadErrorFile = (errorFileUrl) => {
    if (errorFileUrl) {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      window.open(`${apiBaseUrl}${errorFileUrl}`, '_blank');
    }
  };

  return (
    <div className="fade-in employee-import-export-page">
      <div className="page-header">
        <h1 className="page-title">Import/Export Employees</h1>
        <p className="page-subtitle">Bulk import or export employee data</p>
      </div>

      <div className="page-content">
        {/* EXPORT SECTION */}
        <div className="import-export-section card">
          <div className="section-header">
            <FiDownload className="section-icon" />
            <h2 className="section-title">Export Employees</h2>
          </div>
          <div className="section-content">
            <p className="section-description">
              Export employees in CSV, Excel, or PDF format with customizable filters.
            </p>

            {/* Export Filters */}
            <div className="export-filters">
              <div className="filter-group">
                <label>Department</label>
                <select
                  value={exportFilters.department}
                  onChange={(e) => setExportFilters({ ...exportFilters, department: e.target.value })}
                  className="filter-select"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Role</label>
                <select
                  value={exportFilters.role}
                  onChange={(e) => setExportFilters({ ...exportFilters, role: e.target.value })}
                  className="filter-select"
                >
                  <option value="all">All Roles</option>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Status</label>
                <select
                  value={exportFilters.status}
                  onChange={(e) => setExportFilters({ ...exportFilters, status: e.target.value })}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="resigned">Resigned</option>
                </select>
              </div>

              <div className="filter-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={exportFilters.includeSalary}
                    onChange={(e) => setExportFilters({ ...exportFilters, includeSalary: e.target.checked })}
                  />
                  Include Salary Data
                </label>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="export-buttons">
              <button
                className="btn btn-primary"
                onClick={() => handleExport('csv')}
                disabled={exporting}
              >
                <FiFileText /> Export CSV
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleExport('excel')}
                disabled={exporting}
              >
                <FiDatabase /> Export Excel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleExport('pdf')}
                disabled={exporting}
              >
                <FiFile /> Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* IMPORT SECTION */}
        <div className="import-export-section card">
          <div className="section-header">
            <FiUpload className="section-icon" />
            <h2 className="section-title">Import Employees</h2>
          </div>
          <div className="section-content">
            <p className="section-description">
              Import employees from CSV or Excel file. Download the template first to see the required format.
            </p>
            
            <div className="import-actions">
              <button
                className="btn btn-secondary"
                onClick={handleDownloadTemplate}
                disabled={loading}
              >
                <FiFile /> Download Sample Template
              </button>
            </div>

            <div className="file-upload-area">
              <input
                type="file"
                id="import-file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="import-file" className="file-upload-label">
                {importFile ? (
                  <div className="file-selected">
                    <FiFile />
                    <span>{importFile.name}</span>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImportFile(null);
                        setPreviewData(null);
                        setImportResults(null);
                        const fileInput = document.getElementById('import-file');
                        if (fileInput) fileInput.value = '';
                      }}
                    >
                      <FiXCircle />
                    </button>
                  </div>
                ) : (
                  <>
                    <FiUpload />
                    <span>Click to select file or drag and drop</span>
                    <small>Excel (.xlsx, .xls) or CSV files, max 10MB</small>
                  </>
                )}
              </label>
            </div>

            {/* Preview Table */}
            {previewData && (
              <div className="preview-section">
                <h3 className="preview-title">
                  <FiFilter /> Preview ({previewData.validRows} valid, {previewData.invalidRows} invalid)
                </h3>
                <div className="preview-table-wrapper">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.preview.map((row, index) => (
                        <tr key={index} className={row.isValid ? 'valid-row' : 'invalid-row'}>
                          <td>{row.rowNumber}</td>
                          <td>{row.data.name || 'N/A'}</td>
                          <td>{row.data.email || 'N/A'}</td>
                          <td>{row.data.department || 'N/A'}</td>
                          <td>
                            {row.isValid ? (
                              <span className="status-badge valid">
                                <FiCheckCircle /> Valid
                              </span>
                            ) : (
                              <span className="status-badge invalid">
                                <FiXCircle /> Invalid
                              </span>
                            )}
                          </td>
                          <td>
                            {row.errors && row.errors.length > 0 ? (
                              <div className="error-list">
                                {row.errors.map((error, i) => (
                                  <span key={i} className="error-item">{error}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="no-errors">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importFile && (
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader /> Importing...
                  </>
                ) : (
                  <>
                    <FiUpload /> Import Employees
                  </>
                )}
              </button>
            )}

            {/* Import Results */}
            {importResults && (
              <div className="import-results">
                <h3 className="results-title">Import Results</h3>
                <div className="results-summary">
                  <div className="result-stat success">
                    <FiCheckCircle />
                    <span>{importResults.success.length} Successful</span>
                  </div>
                  <div className="result-stat error">
                    <FiXCircle />
                    <span>{importResults.failed.length} Failed</span>
                  </div>
                  <div className="result-stat total">
                    <FiFile />
                    <span>{importResults.total} Total</span>
                  </div>
                </div>

                {importResults.failed.length > 0 && importResults.errorFileUrl && (
                  <div className="error-file-section">
                    <button
                      className="btn btn-secondary"
                      onClick={() => downloadErrorFile(importResults.errorFileUrl)}
                    >
                      <FiDownload /> Download Error File
                    </button>
                  </div>
                )}

                {importResults.failed.length > 0 && (
                  <div className="failed-items">
                    <h4 className="failed-title">
                      <FiAlertCircle /> Failed Items
                    </h4>
                    <div className="failed-list">
                      {importResults.failed.slice(0, 10).map((item, index) => (
                        <div key={index} className="failed-item">
                          <div className="failed-row">
                            Row {item.row}: {item.name || 'N/A'} ({item.email || 'N/A'})
                          </div>
                          <div className="failed-error">
                            {Array.isArray(item.errors) ? item.errors.join('; ') : item.error || 'Unknown error'}
                          </div>
                        </div>
                      ))}
                      {importResults.failed.length > 10 && (
                        <div className="more-errors">
                          ... and {importResults.failed.length - 10} more errors. Download error file for complete list.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {importResults.success.length > 0 && (
                  <div className="success-items">
                    <h4 className="success-title">
                      <FiCheckCircle /> Successful Items
                    </h4>
                    <div className="success-list">
                      {importResults.success.slice(0, 10).map((item, index) => (
                        <div key={index} className="success-item">
                          Row {item.row}: {item.name} ({item.employeeId})
                        </div>
                      ))}
                      {importResults.success.length > 10 && (
                        <div className="more-success">
                          ... and {importResults.success.length - 10} more successful imports.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* IMPORT HISTORY */}
        <div className="import-export-section card">
          <div className="section-header">
            <FiClock className="section-icon" />
            <h2 className="section-title">Import History</h2>
          </div>
          <div className="section-content">
            {importLogs.length > 0 ? (
              <div className="import-logs-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Filename</th>
                      <th>Uploaded By</th>
                      <th>Total Rows</th>
                      <th>Imported</th>
                      <th>Failed</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importLogs.map((log) => (
                      <tr key={log._id}>
                        <td>{new Date(log.createdAt).toLocaleString()}</td>
                        <td>{log.filename}</td>
                        <td>{log.uploadedBy?.name || 'N/A'}</td>
                        <td>{log.totalRows}</td>
                        <td className="success-count">{log.importedRows}</td>
                        <td className="error-count">{log.failedRows}</td>
                        <td>
                          <span className={`status-badge ${log.status}`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-logs">No import history available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeImportExport;
