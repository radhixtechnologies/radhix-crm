import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit2, FiTrash2, FiMoreHorizontal, FiUsers, FiPlus, FiDownload } from 'react-icons/fi';
import { useState } from 'react';

const ContactTable = ({
    contacts,
    onDelete,
    pagination,
    onPageChange,
    selectedContacts = [],
    onSelectContacts
}) => {
    const navigate = useNavigate();

    const allVisibleSelected = contacts.length > 0 && contacts.every(c => selectedContacts.includes(c._id));
    const someVisibleSelected = contacts.some(c => selectedContacts.includes(c._id)) && !allVisibleSelected;

    const handleSelectAll = (e) => {
        if (!onSelectContacts) return;
        if (e.target.checked) {
            const newIds = Array.from(new Set([...selectedContacts, ...contacts.map(c => c._id)]));
            onSelectContacts(newIds);
        } else {
            const visibleIds = new Set(contacts.map(c => c._id));
            onSelectContacts(selectedContacts.filter(id => !visibleIds.has(id)));
        }
    };

    const handleToggleSelect = (id, e) => {
        if (e) e.stopPropagation();
        if (!onSelectContacts) return;
        if (selectedContacts.includes(id)) {
            onSelectContacts(selectedContacts.filter(item => item !== id));
        } else {
            onSelectContacts([...selectedContacts, id]);
        }
    };

    return (
        <>
            <div className="table-responsive">
                <table className="premium-table">
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
                            <th>Name</th>
                            <th>Company</th>
                            <th>Status</th>
                            <th>Owner</th>
                            <th style={{ width: '60px', textAlign: 'center' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.length > 0 ? (
                            contacts.map((contact) => (
                                <tr
                                    key={contact._id}
                                    style={{
                                        backgroundColor: selectedContacts.includes(contact._id) ? '#eff6ff' : undefined,
                                        transition: 'background-color 0.15s ease'
                                    }}
                                >
                                    <td style={{ width: '40px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedContacts.includes(contact._id)}
                                            onChange={(e) => handleToggleSelect(contact._id, e)}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#3b82f6' }}
                                        />
                                    </td>
                                    <td>
                                        <div className="cell-user">
                                            <div className="avatar-initials">
                                                {contact.firstName ? contact.firstName[0].toUpperCase() : ''}
                                                {contact.lastName ? contact.lastName[0].toUpperCase() : ''}
                                            </div>
                                            <div className="user-details">
                                                <div className="user-name">{contact.firstName} {contact.lastName}</div>
                                                <div className="user-email">{contact.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="cell-company">
                                        {contact.company || '—'}
                                    </td>
                                    <td>
                                        <span className={`pill pill-${contact.status?.toLowerCase() || 'default'}`}>
                                            {contact.status}
                                        </span>
                                    </td>
                                    <td>
                                        {contact.assignedTo?.user?.name ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div
                                                    className="owner-avatar"
                                                    title={contact.assignedTo.user.name}
                                                >
                                                    {contact.assignedTo.user.name[0].toUpperCase()}
                                                </div>
                                                <span className="owner-name-text" style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
                                                    {contact.assignedTo.user.name}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="owner-unassigned">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="cell-actions">
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                className="kebab-btn"
                                                title="More actions"
                                                onClick={() => navigate(`/contacts/${contact._id}`)}
                                            >
                                                <FiMoreHorizontal size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7">
                                    <div className="empty-state-premium">
                                        <div className="empty-icon-ring">
                                            <FiUsers size={24} />
                                        </div>
                                        <h3 className="empty-title">No contacts yet</h3>
                                        <p className="empty-desc">Get started by creating a new contact or importing your existing database.</p>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button className="btn-primary" onClick={() => navigate('/contacts/new')}>
                                                <FiPlus /> Add Contact
                                            </button>
                                            <button className="btn-secondary">
                                                <FiDownload /> Import CSV
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination (Minimalist) */}
            {pagination && pagination.pages > 1 && (
                <div className="pagination-wrapper">
                    <button
                        className="pagination-btn"
                        disabled={pagination.page === 1}
                        onClick={() => onPageChange(pagination.page - 1)}
                    >
                        Previous
                    </button>
                    <span className="pagination-info">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                        className="pagination-btn"
                        disabled={pagination.page === pagination.pages}
                        onClick={() => onPageChange(pagination.page + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </>
    );
};
export default ContactTable;
