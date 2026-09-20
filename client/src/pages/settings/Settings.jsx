import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { FiPlus, FiSearch, FiUsers, FiCheckCircle, FiDollarSign, FiBriefcase } from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import AdminTable from '../../components/Settings/AdminTable';
import '../../styles/employee/employees.css'; // Uses employee styles for consistency
import '../../styles/forms.css';

const Settings = () => {
    const { user, isSuperAdmin } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        password: '',
        modulesAccess: {
            employee: false,
            finance: false,
            sales: false,
            hrm: false,
        },
    });
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        password: '',
        modulesAccess: {
            employee: false,
            finance: false,
            sales: false,
            hrm: false,
        },
    });

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchAdmins();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const params = { role: 'admin' };
            if (debouncedSearch) {
                params.search = debouncedSearch;
            }
            const response = await userService.getUsers(params);
            if (response.data.success) {
                setAdmins(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching admins:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleModuleToggle = async (adminId, module, currentValue) => {
        try {
            const admin = admins.find((a) => a._id === adminId);
            const updatedModules = {
                ...admin.modulesAccess,
                [module]: !currentValue,
            };
            await userService.updateAdminModules(adminId, { modulesAccess: updatedModules });
            // Optimistic update
            setAdmins(prev => prev.map(a =>
                a._id === adminId ? { ...a, modulesAccess: updatedModules } : a
            ));
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating module access');
            fetchAdmins(); // Revert on error
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        try {
            if (!createForm.name || !createForm.email || !createForm.password) {
                alert('Please fill in all required fields');
                return;
            }

            if (createForm.password.length < 6) {
                alert('Password must be at least 6 characters');
                return;
            }

            await userService.createAdmin(createForm);
            setShowCreateModal(false);
            setCreateForm({
                name: '',
                email: '',
                password: '',
                modulesAccess: {
                    employee: false,
                    finance: false,
                    sales: false,
                    hrm: false,
                },
            });
            fetchAdmins();
            alert('Admin created successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating admin');
        }
    };

    const handleCreateModuleToggle = (module) => {
        setCreateForm({
            ...createForm,
            modulesAccess: {
                ...createForm.modulesAccess,
                [module]: !createForm.modulesAccess[module],
            },
        });
    };

    const handleEditAdmin = (admin) => {
        setEditingAdmin(admin);
        setEditForm({
            name: admin.name,
            email: admin.email,
            password: '', // Leave empty, only update if provided
            modulesAccess: {
                employee: admin.modulesAccess?.employee || false,
                finance: admin.modulesAccess?.finance || false,
                sales: admin.modulesAccess?.sales || false,
                hrm: admin.modulesAccess?.hrm || false,
            },
        });
        setShowEditModal(true);
    };

    const handleUpdateAdmin = async (e) => {
        e.preventDefault();
        try {
            if (!editForm.name || !editForm.email) {
                alert('Please fill in all required fields');
                return;
            }

            if (editForm.password && editForm.password.length < 6) {
                alert('Password must be at least 6 characters');
                return;
            }

            const updateData = {
                name: editForm.name,
                email: editForm.email,
                modulesAccess: editForm.modulesAccess,
            };

            // Only include password if provided
            if (editForm.password) {
                updateData.password = editForm.password;
            }

            await userService.updateUser(editingAdmin._id, updateData);
            setShowEditModal(false);
            setEditingAdmin(null);
            setEditForm({
                name: '',
                email: '',
                password: '',
                modulesAccess: {
                    employee: false,
                    finance: false,
                    sales: false,
                    hrm: false,
                },
            });
            fetchAdmins();
            alert('Admin updated successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating admin');
        }
    };

    const handleEditModuleToggle = (module) => {
        setEditForm({
            ...editForm,
            modulesAccess: {
                ...editForm.modulesAccess,
                [module]: !editForm.modulesAccess[module],
            },
        });
    };

    const handleDeleteAdmin = async (adminId, adminName) => {
        if (!window.confirm(`Are you sure you want to delete admin "${adminName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await userService.deleteUser(adminId);
            fetchAdmins();
            alert('Admin deleted successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting admin');
        }
    };

    return (
        <div className="employee-list-page fade-in">
            {/* Header Row */}
            <div className="employee-page-header">
                <div className="header-title-group">
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage admin access and application configuration</p>
                </div>
                <div className="header-actions">
                    {isSuperAdmin && (
                        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                            <FiPlus /> Create Admin
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                {/* Total Admins */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiUsers />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {admins.length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Admins
                        </div>
                    </div>
                </div>

                {/* Active */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiCheckCircle />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {admins.filter(a => a.status === 'active' || !a.status).length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Active
                        </div>
                    </div>
                </div>

                {/* Finance Access */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiDollarSign />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {admins.filter(a => a.modulesAccess?.finance).length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Finance Access
                        </div>
                    </div>
                </div>

                {/* HRM Access */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiBriefcase />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {admins.filter(a => a.modulesAccess?.hrm).length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            HRM Access
                        </div>
                    </div>
                </div>
            </div>

            {/* Horizontal Toolbar */}
            <div className="employee-toolbar-horizontal">
                <div className="toolbar-search">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search admins by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="employee-content-wrapper">
                {loading ? <div style={{ padding: '20px', textAlign: 'center' }}><Loader /></div> : (
                    <AdminTable
                        admins={admins}
                        isSuperAdmin={isSuperAdmin}
                        onToggleModule={handleModuleToggle}
                        onEdit={handleEditAdmin}
                        onDelete={handleDeleteAdmin}
                    />
                )}
            </div>

            {/* Create Admin Modal */}
            {isSuperAdmin && (
                <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Admin">
                    <form onSubmit={handleCreateAdmin}>
                        <div className="form-group">
                            <label className="form-label">Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                required
                                placeholder="Admin name"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email *</label>
                            <input
                                type="email"
                                className="form-input"
                                value={createForm.email}
                                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                required
                                placeholder="admin@example.com"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password *</label>
                            <input
                                type="password"
                                className="form-input"
                                value={createForm.password}
                                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                required
                                placeholder="Minimum 6 characters"
                                minLength={6}
                            />
                            <small style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                Password must be at least 6 characters long
                            </small>
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>
                                Module Access
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {['employee', 'finance', 'sales', 'hrm'].map(module => (
                                    <label key={module} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={createForm.modulesAccess[module]}
                                            onChange={() => handleCreateModuleToggle(module)}
                                        />
                                        <span style={{ textTransform: 'capitalize' }}>{module} Module</span>
                                    </label>
                                ))}
                            </div>
                            <small style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '8px', display: 'block' }}>
                                Select which modules this admin can access. Admins will only have access to selected modules.
                            </small>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowCreateModal(false)}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Create Admin
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Edit Admin Modal */}
            {isSuperAdmin && editingAdmin && (
                <Modal isOpen={showEditModal} onClose={() => {
                    setShowEditModal(false);
                    setEditingAdmin(null);
                }} title="Edit Admin">
                    <form onSubmit={handleUpdateAdmin}>
                        <div className="form-group">
                            <label className="form-label">Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                required
                                placeholder="Admin name"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email *</label>
                            <input
                                type="email"
                                className="form-input"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                required
                                placeholder="admin@example.com"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password (Leave empty to keep current)</label>
                            <input
                                type="password"
                                className="form-input"
                                value={editForm.password}
                                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                placeholder="Enter new password (min 6 characters)"
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>
                                Module Access
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {['employee', 'finance', 'sales', 'hrm'].map(module => (
                                    <label key={module} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={editForm.modulesAccess[module]}
                                            onChange={() => handleEditModuleToggle(module)}
                                        />
                                        <span style={{ textTransform: 'capitalize' }}>{module} Module</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowEditModal(false)}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Update Admin
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Settings;
