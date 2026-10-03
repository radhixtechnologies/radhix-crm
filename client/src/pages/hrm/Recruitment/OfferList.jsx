import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEye, FiEdit2, FiSend, FiCheck, FiX, FiClock, FiFileText } from 'react-icons/fi';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import '../../../styles/hrm/recruitment.css';

import { useAuth } from '../../../context/AuthContext';

const OfferList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [offers, setOffers] = useState([]);
    const [unauthorized, setUnauthorized] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        department: '',
        search: ''
    });

    useEffect(() => {
        if (user) {
            fetchOffers();
        }
    }, [filters, user]);

    const fetchOffers = async () => {
        try {
            setLoading(true);
            setUnauthorized(false);

            let response;

            // Determine which endpoint to call based on role
            // HR/Admin roles or users with HRM module access get ALL offers
            // Note: modulesAccess is an object { hrm: true, ... }, so check property, not includes
            if (['super_admin', 'admin'].includes(user?.role) || user?.modulesAccess?.hrm) {
                const params = {};
                if (filters.status) params.status = filters.status;
                if (filters.department) params.department = filters.department;
                response = await hrmService.getOffers(params);
            } else {
                // Regular employees get only THEIR offers
                response = await hrmService.getMyOffers();
            }

            if (response.data.success) {
                let data = response.data.data;

                // Client-side search filter
                if (filters.search) {
                    const searchLower = filters.search.toLowerCase();
                    data = data.filter(offer =>
                        offer.candidateName.toLowerCase().includes(searchLower) ||
                        offer.candidateEmail.toLowerCase().includes(searchLower) ||
                        offer.designation?.toLowerCase().includes(searchLower)
                    );
                }

                setOffers(data);
            }
        } catch (error) {
            console.error('Error fetching offers:', error);
            if (error.response && error.response.status === 403) {
                setUnauthorized(true);
            }
        } finally {
            setLoading(false);
        }
    };

    if (unauthorized) {
        return (
            <div className="offer-list-page" style={{
                backgroundColor: '#f8fafc',
                minHeight: '100vh',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center', background: 'white', padding: '48px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ background: '#fee2e2', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <FiX size={32} color="#dc2626" />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>Access Restricted</h2>
                    <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: '400px', lineHeight: '1.6' }}>
                        This page is for HR Administrators only. To view your own offer letters, please visit your profile.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/hrm/directory')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                        Go to My Profile
                    </button>
                </div>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { bg: '#f3f4f6', color: '#6b7280', label: 'Draft' },
            pending_approval: { bg: '#fef3c7', color: '#92400e', label: 'Pending Approval' },
            approved: { bg: '#d1fae5', color: '#065f46', label: 'Approved' },
            rejected_by_approver: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
            sent: { bg: '#dbeafe', color: '#1e40af', label: 'Sent' },
            accepted: { bg: '#d1fae5', color: '#065f46', label: 'Accepted' },
            rejected_by_candidate: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected by Candidate' },
            expired: { bg: '#f3f4f6', color: '#6b7280', label: 'Expired' },
            withdrawn: { bg: '#f3f4f6', color: '#6b7280', label: 'Withdrawn' }
        };

        const config = statusConfig[status] || statusConfig.draft;

        return (
            <span style={{
                background: config.bg,
                color: config.color,
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
            }}>
                {config.label}
            </span>
        );
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'draft':
                return <FiEdit2 size={16} />;
            case 'pending_approval':
                return <FiClock size={16} />;
            case 'approved':
                return <FiCheck size={16} />;
            case 'sent':
                return <FiSend size={16} />;
            case 'accepted':
                return <FiCheck size={16} />;
            case 'rejected_by_approver':
            case 'rejected_by_candidate':
                return <FiX size={16} />;
            default:
                return <FiFileText size={16} />;
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatCurrency = (amount, currency = 'INR') => {
        return `${currency} ${Number(amount || 0).toLocaleString()}`;
    };

    if (loading) return <Loader />;

    return (
        <div className="offer-list-page" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px' }}>

            {/* Header */}
            <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                        Offer Letters
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>
                        Manage and track all offer letters
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/hrm/recruitment/offers/new')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <FiPlus /> Create New Offer
                </button>
            </div>

            {/* Filters */}
            <div style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px'
            }}>
                <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                        Search
                    </label>
                    <input
                        type="text"
                        placeholder="Search by name, email, or position..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        style={{ width: '100%', padding: '10px 16px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                        Status
                    </label>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        style={{ width: '100%', padding: '10px 16px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="pending_approval">Pending Approval</option>
                        <option value="approved">Approved</option>
                        <option value="sent">Sent</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected_by_approver">Rejected by Approver</option>
                        <option value="rejected_by_candidate">Rejected by Candidate</option>
                        <option value="expired">Expired</option>
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                        Department
                    </label>
                    <input
                        type="text"
                        placeholder="Filter by department..."
                        value={filters.department}
                        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                        style={{ width: '100%', padding: '10px 16px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                    />
                </div>
            </div>

            {/* Offers Table */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {offers.length === 0 ? (
                    <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
                        <FiFileText size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                        <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No offers found</p>
                        <p style={{ fontSize: '14px' }}>Create your first offer letter from an application</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                                    Candidate
                                </th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                                    Position
                                </th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                                    Department
                                </th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                                    CTC
                                </th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                                    Joining Date
                                </th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                                    Status
                                </th>
                                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {offers.map((offer) => (
                                <tr
                                    key={offer._id}
                                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                                    onClick={() => navigate(`/hrm/recruitment/offers/${offer._id}/edit`)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                                            {offer.candidateName}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                                            {offer.candidateEmail}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ color: '#334155', fontWeight: '500' }}>
                                            {offer.designation || 'N/A'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ color: '#64748b' }}>
                                            {offer.department || 'N/A'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ fontWeight: '600', color: '#0f172a' }}>
                                            {formatCurrency(offer.salaryDetails?.annualCTC, offer.salaryDetails?.currency)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ color: '#64748b' }}>
                                            {formatDate(offer.joiningDate)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {getStatusIcon(offer.status)}
                                            {getStatusBadge(offer.status)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }} onClick={(e) => e.stopPropagation()}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => navigate(`/hrm/recruitment/offers/${offer._id}/edit`)}
                                                className="btn btn-sm btn-secondary"
                                                style={{ padding: '6px 12px' }}
                                            >
                                                <FiEye size={14} /> View
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Summary Stats */}
            {offers.length > 0 && (
                <div style={{
                    marginTop: '24px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '16px'
                }}>
                    {[
                        { label: 'Total Offers', count: offers.length, color: '#3b82f6' },
                        { label: 'Pending Approval', count: offers.filter(o => o.status === 'pending_approval').length, color: '#f59e0b' },
                        { label: 'Sent', count: offers.filter(o => o.status === 'sent').length, color: '#3b82f6' },
                        { label: 'Accepted', count: offers.filter(o => o.status === 'accepted').length, color: '#10b981' },
                        { label: 'Rejected', count: offers.filter(o => ['rejected_by_approver', 'rejected_by_candidate'].includes(o.status)).length, color: '#ef4444' }
                    ].map((stat, index) => (
                        <div key={index} style={{
                            background: '#fff',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            borderLeft: `4px solid ${stat.color}`
                        }}>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                                {stat.label}
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>
                                {stat.count}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OfferList;
