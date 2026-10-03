import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiPlus, FiEdit, FiTrash2, FiHardDrive, FiUser, FiTool, FiCheck, FiX } from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { formatDate, formatCurrency } from '../../utils/format';
import dayjs from 'dayjs';
import '../../styles/forms.css';

const Assets = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [assetForm, setAssetForm] = useState({
    assetId: '',
    name: '',
    type: 'laptop',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: '',
    warrantyExpiry: '',
    specifications: '',
    notes: '',
  });
  const [assignForm, setAssignForm] = useState({
    employeeId: '',
  });
  const [maintenanceForm, setMaintenanceForm] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    description: '',
    cost: '',
    performedBy: '',
    nextMaintenance: '',
  });
  const [statusForm, setStatusForm] = useState({
    status: 'available',
  });

  useEffect(() => {
    fetchAssets();
    if ((isAdmin || isSuperAdmin)) {
      fetchEmployees();
    }
  }, [statusFilter, typeFilter]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const response = await employeeService.getAssets(params);
      if (response.data.success) {
        setAssets(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getEmployees();
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...assetForm,
        purchaseDate: assetForm.purchaseDate || null,
        purchasePrice: assetForm.purchasePrice ? parseFloat(assetForm.purchasePrice) : null,
        warrantyExpiry: assetForm.warrantyExpiry || null,
        specifications: assetForm.specifications ? JSON.parse(assetForm.specifications) : {},
      };
      await employeeService.createAsset(data);
      setShowAssetModal(false);
      setAssetForm({
        assetId: '',
        name: '',
        type: 'laptop',
        brand: '',
        model: '',
        serialNumber: '',
        purchaseDate: '',
        purchasePrice: '',
        warrantyExpiry: '',
        specifications: '',
        notes: '',
      });
      fetchAssets();
      alert('Asset created successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating asset');
    }
  };

  const handleAssignAsset = async (e) => {
    e.preventDefault();
    try {
      await employeeService.assignAsset(selectedAsset._id, assignForm);
      setShowAssignModal(false);
      setAssignForm({ employeeId: '' });
      setSelectedAsset(null);
      fetchAssets();
      alert('Asset assigned successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error assigning asset');
    }
  };

  const handleReturnAsset = async (id) => {
    if (!window.confirm('Are you sure you want to return this asset?')) return;
    try {
      await employeeService.returnAsset(id);
      fetchAssets();
      alert('Asset returned successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error returning asset');
    }
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...maintenanceForm,
        cost: maintenanceForm.cost ? parseFloat(maintenanceForm.cost) : 0,
        nextMaintenance: maintenanceForm.nextMaintenance || null,
      };
      await employeeService.addMaintenance(selectedAsset._id, data);
      setShowMaintenanceModal(false);
      setMaintenanceForm({
        date: dayjs().format('YYYY-MM-DD'),
        description: '',
        cost: '',
        performedBy: '',
        nextMaintenance: '',
      });
      setSelectedAsset(null);
      fetchAssets();
      alert('Maintenance record added successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding maintenance');
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await employeeService.updateAssetStatus(selectedAsset._id, statusForm);
      setShowStatusModal(false);
      setStatusForm({ status: 'available' });
      setSelectedAsset(null);
      fetchAssets();
      alert('Asset status updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating status');
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset? This action cannot be undone.')) return;
    try {
      await employeeService.deleteAsset(id);
      fetchAssets();
      alert('Asset deleted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting asset');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'success',
      assigned: 'info',
      maintenance: 'warning',
      retired: 'secondary',
      lost: 'error',
    };
    return colors[status] || 'secondary';
  };

  if (loading) return <Loader />;

  const canManage = isAdmin || isSuperAdmin;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Assets</h1>
            <p className="page-subtitle">
              {canManage ? 'Manage company assets' : 'View your assigned assets'}
            </p>
          </div>
          {canManage && (
            <button className="btn btn-primary" onClick={() => setShowAssetModal(true)}>
              <FiPlus /> Add Asset
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {canManage && (
          <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
              <option value="lost">Lost</option>
            </select>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="">All Types</option>
              <option value="laptop">Laptop</option>
              <option value="desktop">Desktop</option>
              <option value="monitor">Monitor</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
              <option value="accessory">Accessory</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Brand/Model</th>
                <th>Status</th>
                {canManage && <th>Assigned To</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.length > 0 ? (
                assets.map((asset) => (
                  <tr key={asset._id}>
                    <td style={{ fontWeight: 600 }}>{asset.assetId}</td>
                    <td>{asset.name}</td>
                    <td style={{ textTransform: 'capitalize' }}>{asset.type}</td>
                    <td>
                      {asset.brand && asset.model ? `${asset.brand} ${asset.model}` : asset.brand || asset.model || '-'}
                    </td>
                    <td>
                      <span className={`badge badge-${getStatusColor(asset.currentStatus)}`}>
                        {asset.currentStatus}
                      </span>
                    </td>
                    {canManage && (
                      <td>
                        {asset.assignedTo ? (
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {asset.assignedTo.user?.name || 'Unknown'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {asset.assignedTo.employeeId} - {asset.assignedTo.designation}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              Assigned: {formatDate(asset.assignedDate)}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>Not assigned</span>
                        )}
                      </td>
                    )}
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {canManage && asset.currentStatus === 'available' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              setSelectedAsset(asset);
                              setShowAssignModal(true);
                            }}
                            title="Assign Asset"
                          >
                            <FiUser /> Assign
                          </button>
                        )}
                        {canManage && asset.currentStatus === 'assigned' && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleReturnAsset(asset._id)}
                            title="Return Asset"
                          >
                            <FiX /> Return
                          </button>
                        )}
                        {canManage && (
                          <>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setShowMaintenanceModal(true);
                              }}
                              title="Add Maintenance"
                            >
                              <FiTool /> Maintenance
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setStatusForm({ status: asset.currentStatus });
                                setShowStatusModal(true);
                              }}
                              title="Update Status"
                            >
                              <FiEdit /> Status
                            </button>
                            {asset.currentStatus !== 'assigned' && (
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteAsset(asset._id)}
                                title="Delete Asset"
                              >
                                <FiTrash2 />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canManage ? 7 : 6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    {canManage ? 'No assets found' : 'No assets assigned to you'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Create/Edit Asset Modal */}
        <Modal isOpen={showAssetModal} onClose={() => setShowAssetModal(false)} title="Add Asset">
          <form onSubmit={handleCreateAsset}>
            <div className="form-group">
              <label className="form-label">Asset ID *</label>
              <input
                type="text"
                className="form-input"
                value={assetForm.assetId}
                onChange={(e) => setAssetForm({ ...assetForm, assetId: e.target.value })}
                required
                placeholder="e.g., LAP-001"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                type="text"
                className="form-input"
                value={assetForm.name}
                onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                required
                placeholder="e.g., MacBook Pro 16"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Type *</label>
              <select
                className="form-select"
                value={assetForm.type}
                onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })}
                required
              >
                <option value="laptop">Laptop</option>
                <option value="desktop">Desktop</option>
                <option value="monitor">Monitor</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
                <option value="accessory">Accessory</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Brand</label>
                <input
                  type="text"
                  className="form-input"
                  value={assetForm.brand}
                  onChange={(e) => setAssetForm({ ...assetForm, brand: e.target.value })}
                  placeholder="e.g., Apple"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Model</label>
                <input
                  type="text"
                  className="form-input"
                  value={assetForm.model}
                  onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })}
                  placeholder="e.g., M1 Pro"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input
                type="text"
                className="form-input"
                value={assetForm.serialNumber}
                onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                placeholder="Serial number"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Purchase Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={assetForm.purchaseDate}
                  onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Purchase Price</label>
                <input
                  type="number"
                  className="form-input"
                  value={assetForm.purchasePrice}
                  onChange={(e) => setAssetForm({ ...assetForm, purchasePrice: e.target.value })}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Warranty Expiry</label>
              <input
                type="date"
                className="form-input"
                value={assetForm.warrantyExpiry}
                onChange={(e) => setAssetForm({ ...assetForm, warrantyExpiry: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Specifications (JSON)</label>
              <textarea
                className="form-textarea"
                value={assetForm.specifications}
                onChange={(e) => setAssetForm({ ...assetForm, specifications: e.target.value })}
                placeholder='{"cpu": "M1 Pro", "ram": "16GB", "storage": "512GB"}'
                rows={3}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                value={assetForm.notes}
                onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAssetModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create Asset
              </button>
            </div>
          </form>
        </Modal>

        {/* Assign Asset Modal */}
        <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Asset">
          {selectedAsset && (
            <form onSubmit={handleAssignAsset}>
              <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                <div><strong>Asset:</strong> {selectedAsset.name} ({selectedAsset.assetId})</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Type: {selectedAsset.type}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Assign To *</label>
                <select
                  className="form-select"
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm({ employeeId: e.target.value })}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.user?.name} ({emp.employeeId}) - {emp.designation}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Assign Asset
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* Add Maintenance Modal */}
        <Modal isOpen={showMaintenanceModal} onClose={() => setShowMaintenanceModal(false)} title="Add Maintenance Record">
          {selectedAsset && (
            <form onSubmit={handleAddMaintenance}>
              <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                <div><strong>Asset:</strong> {selectedAsset.name} ({selectedAsset.assetId})</div>
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={maintenanceForm.date}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })}
                  required
                  max={dayjs().format('YYYY-MM-DD')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className="form-textarea"
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  required
                  placeholder="Describe the maintenance performed"
                  rows={4}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Cost</label>
                  <input
                    type="number"
                    className="form-input"
                    value={maintenanceForm.cost}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Performed By</label>
                  <input
                    type="text"
                    className="form-input"
                    value={maintenanceForm.performedBy}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, performedBy: e.target.value })}
                    placeholder="Service provider name"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Next Maintenance Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={maintenanceForm.nextMaintenance}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, nextMaintenance: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMaintenanceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Maintenance
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* Update Status Modal */}
        <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Asset Status">
          {selectedAsset && (
            <form onSubmit={handleUpdateStatus}>
              <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                <div><strong>Asset:</strong> {selectedAsset.name} ({selectedAsset.assetId})</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Current Status: <span className={`badge badge-${getStatusColor(selectedAsset.currentStatus)}`}>
                    {selectedAsset.currentStatus}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">New Status *</label>
                <select
                  className="form-select"
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ status: e.target.value })}
                  required
                >
                  <option value="available">Available</option>
                  <option value="assigned">Assigned</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Status
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Assets;

