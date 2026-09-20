import { FiEdit, FiTrash2, FiUser, FiCheck, FiX } from 'react-icons/fi';
import '../../styles/employee/employees.css';

const AdminTable = ({ admins, isSuperAdmin, onToggleModule, onEdit, onDelete }) => {

    // Helper to generate initials
    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="table-container-responsive">
            <table className="table">
                <thead>
                    <tr>
                        <th style={{ width: '30%' }}>Admin Name</th>
                        <th style={{ width: '25%' }}>Email</th>
                        <th className="text-center" style={{ width: '10%' }}>Employee</th>
                        <th className="text-center" style={{ width: '10%' }}>Finance</th>
                        <th className="text-center" style={{ width: '10%' }}>Sales</th>
                        <th className="text-center" style={{ width: '10%' }}>HRM</th>
                        {isSuperAdmin && <th style={{ width: '5%' }}>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {admins.length > 0 ? (
                        admins.map((admin) => (
                            <tr key={admin._id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="employee-avatar-table">
                                            <span>{getInitials(admin.name)}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>{admin.name}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {admin.role === 'super-admin' ? 'Super Admin' : 'Admin'}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{admin.email}</span>
                                </td>
                                <td className="text-center">
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={admin.modulesAccess?.employee || false}
                                            onChange={() => onToggleModule(admin._id, 'employee', admin.modulesAccess?.employee)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                            title="Toggle Employee Access"
                                        />
                                    </div>
                                </td>
                                <td className="text-center">
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={admin.modulesAccess?.finance || false}
                                            onChange={() => onToggleModule(admin._id, 'finance', admin.modulesAccess?.finance)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                            title="Toggle Finance Access"
                                        />
                                    </div>
                                </td>
                                <td className="text-center">
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={admin.modulesAccess?.sales || false}
                                            onChange={() => onToggleModule(admin._id, 'sales', admin.modulesAccess?.sales)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                            title="Toggle Sales Access"
                                        />
                                    </div>
                                </td>
                                <td className="text-center">
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={admin.modulesAccess?.hrm || false}
                                            onChange={() => onToggleModule(admin._id, 'hrm', admin.modulesAccess?.hrm)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                            title="Toggle HRM Access"
                                        />
                                    </div>
                                </td>
                                {isSuperAdmin && (
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => onEdit(admin)}
                                                title="Edit Admin"
                                            >
                                                <FiEdit />
                                            </button>
                                            <button
                                                className="btn btn-sm"
                                                style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca' }}
                                                onClick={() => onDelete(admin._id, admin.name)}
                                                title="Delete Admin"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={isSuperAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                    <FiUser size={32} style={{ opacity: 0.5 }} />
                                    <span>No admins found matching your search</span>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AdminTable;
