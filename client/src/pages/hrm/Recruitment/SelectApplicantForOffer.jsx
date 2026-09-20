import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiBriefcase, FiCalendar, FiArrowRight } from 'react-icons/fi';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import '../../../styles/hrm/recruitment.css';

const SelectApplicantForOffer = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [applicants, setApplicants] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchApplicants();
    }, []);

    const fetchApplicants = async () => {
        try {
            setLoading(true);
            // Fetch applicants who are in interview or later stages (eligible for offers)
            const response = await hrmService.getApplicants({
                atsStage: 'interview,offer,hired'
            });
            if (response.data.success) {
                setApplicants(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching applicants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectApplicant = (applicantId) => {
        navigate(`/hrm/recruitment/applicants/${applicantId}/create-offer`);
    };

    const filteredApplicants = applicants.filter(applicant => {
        const searchLower = searchTerm.toLowerCase();
        return (
            applicant.applicantName?.toLowerCase().includes(searchLower) ||
            applicant.email?.toLowerCase().includes(searchLower) ||
            applicant.jobPosting?.title?.toLowerCase().includes(searchLower)
        );
    });

    if (loading) return <Loader />;

    return (
        <div className="select-applicant-page" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px' }}>

            {/* Header */}
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <div style={{ marginBottom: '16px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                        Select Applicant for Offer
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>
                        Choose an applicant to create an offer letter
                    </p>
                </div>

                {/* Search */}
                <div style={{ maxWidth: '500px' }}>
                    <input
                        type="text"
                        placeholder="Search by name, email, or position..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '14px'
                        }}
                    />
                </div>
            </div>

            {/* Applicants Grid */}
            {filteredApplicants.length === 0 ? (
                <div style={{
                    background: '#fff',
                    padding: '60px 24px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0'
                }}>
                    <FiUser size={48} style={{ opacity: 0.3, marginBottom: '16px', color: '#94a3b8' }} />
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                        No applicants found
                    </p>
                    <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                        Try adjusting your search or check the applicants list
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '20px'
                }}>
                    {filteredApplicants.map((applicant) => (
                        <div
                            key={applicant._id}
                            onClick={() => handleSelectApplicant(applicant._id)}
                            style={{
                                background: '#fff',
                                padding: '24px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.borderColor = '#3b82f6';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
                            {/* Applicant Info */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontSize: '20px',
                                        fontWeight: '600'
                                    }}>
                                        {applicant.applicantName?.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: '#0f172a',
                                            marginBottom: '4px'
                                        }}>
                                            {applicant.applicantName}
                                        </h3>
                                        <div style={{
                                            fontSize: '13px',
                                            color: '#64748b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <FiMail size={14} />
                                            {applicant.email}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Job Details */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '14px',
                                    color: '#334155'
                                }}>
                                    <FiBriefcase size={16} style={{ color: '#64748b' }} />
                                    <span style={{ fontWeight: '500' }}>
                                        {applicant.jobPosting?.title || 'N/A'}
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '14px',
                                    color: '#64748b'
                                }}>
                                    <FiCalendar size={16} />
                                    Applied: {new Date(applicant.appliedAt).toLocaleDateString()}
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <span style={{
                                    background: applicant.status === 'offer' ? '#d1fae5' : '#dbeafe',
                                    color: applicant.status === 'offer' ? '#065f46' : '#1e40af',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}>
                                    {applicant.status?.toUpperCase() || 'PENDING'}
                                </span>
                                <FiArrowRight size={20} style={{ color: '#3b82f6' }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Back Button */}
            <div style={{ marginTop: '32px' }}>
                <button
                    onClick={() => navigate('/hrm/recruitment/offers')}
                    className="btn btn-secondary"
                >
                    ← Back to Offers
                </button>
            </div>
        </div>
    );
};

export default SelectApplicantForOffer;
