import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit2, FiTrash2, FiMoreHorizontal, FiUsers, FiPlus, FiDownload } from 'react-icons/fi';
import { useState } from 'react';

const ContactTable = ({ contacts, onDelete, pagination, onPageChange }) => {
    const navigate = useNavigate();

    return (
        <>
            <div className="table-responsive">
                <table className="premium-table">
                    <thead>
                        <tr>
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
                                <tr key={contact._id}>
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
