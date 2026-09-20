import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiMapPin, FiClock, FiCheckCircle } from 'react-icons/fi';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import { useAuth } from '../../../context/AuthContext';
import InternalApplyModal from './InternalApplyModal'; // Import Modal
import '../../../styles/employee/employees.css';

const InternalJobs = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(null); // ID of job being applied to

    const [appliedJobIds, setAppliedJobIds] = useState(new Set());

    // Modal state
    const [selectedJob, setSelectedJob] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        department: '',
        type: ''
    });

    useEffect(() => {
        fetchInternalJobs();
        fetchUserApplications();
    }, []);

    const fetchUserApplications = async () => {
        try {
            const res = await hrmService.getCandidateApplications();
            if (res.data.success) {
                const ids = new Set(res.data.data.map(app => app.jobId));
                setAppliedJobIds(ids);
            }
        } catch (error) {
            console.error('Error fetching user applications:', error);
        }
    };

    const fetchInternalJobs = async () => {
        try {
            setLoading(true);
            // Fetch published internal jobs using the dedicated endpoint for employees
            const res = await hrmService.getInternalJobPostings();
            if (res.data.success) {
                setJobs(res.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching internal jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const openApplyModal = (job) => {
        setSelectedJob(job);
        setIsModalOpen(true);
    };

    const handleApplySubmit = async (formData) => {
        if (!user || !selectedJob) return;

        try {
            setApplying(selectedJob._id);

            // Prepare application data as FormData for file upload
            const data = new FormData();
            data.append('coverLetter', formData.coverLetter || 'Internal Application via Employee Portal');

            if (formData.resumeFile) {
                data.append('resume', formData.resumeFile);
            }

            await hrmService.applyForJobInternal(selectedJob._id, data);

            alert('Application submitted successfully! Your application has been tagged as Internal.');

            // Update local state to reflect application
            setAppliedJobIds(prev => new Set(prev).add(selectedJob._id));
            setIsModalOpen(false);

        } catch (error) {
            console.error('Error applying for job:', error);
            alert(error.response?.data?.message || 'Failed to submit application');
        } finally {
            setApplying(null);
        }
    };

    // Filter Logic
    const departments = [...new Set(jobs.map(job => job.department).filter(Boolean))];
    const types = [...new Set(jobs.map(job => job.type).filter(Boolean))];

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.department.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = !filters.department || job.department === filters.department;
        const matchesType = !filters.type || job.type === filters.type;
        return matchesSearch && matchesDept && matchesType;
    });

    if (loading) return <Loader />;

    return (
        <div className="employee-list-page">
            <div className="employee-page-header">
                <div className="header-title-group">
                    <h1 className="page-title">Internal Job Openings</h1>
                    <p className="page-subtitle">Explore and apply for open positions within the company</p>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="employee-toolbar-horizontal" style={{ marginBottom: '24px' }}>
                <div className="toolbar-search">
                    <div style={{ position: 'relative', width: '100%' }}>
                        <input
                            type="text"
                            placeholder="Search by title or department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', paddingLeft: '32px', height: '40px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                        <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                    </div>
                </div>

                <div className="toolbar-separator"></div>

                <div className="toolbar-select">
                    <select
                        value={filters.department}
                        onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                        style={{ height: '40px', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0 32px 0 12px' }}
                    >
                        <option value="">All Departments</option>
                        {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                </div>

                <div className="toolbar-select">
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                        style={{ height: '40px', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0 32px 0 12px' }}
                    >
                        <option value="">All Types</option>
                        {types.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
            </div>

            <div className="employee-content-wrapper" style={{ background: 'transparent', boxShadow: 'none' }}>
                {filteredJobs.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <FiBriefcase size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                        <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>
                            {jobs.length === 0 ? 'No internal openings currently' : 'No jobs found matching filters'}
                        </h3>
                        <p style={{ color: 'var(--text-muted)' }}>
                            {jobs.length === 0 ? 'Check back later for new opportunities.' : 'Try adjusting your search criteria.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                        {filteredJobs.map((job) => {
                            const isApplied = appliedJobIds.has(job._id);
                            return (
                                <div key={job._id} className="job-card" style={{
                                    background: 'white',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    cursor: 'default'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>{job.title}</h3>
                                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>{job.role || job.department}</p>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', marginTop: '4px' }}>
                                                <FiCheckCircle size={10} />
                                                <span>Internal Opportunity</span>
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            background: '#eff6ff',
                                            color: '#2563eb'
                                        }}>
                                            {job.type}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <FiBriefcase size={14} />
                                            <span>{job.department}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <FiMapPin size={14} />
                                            <span>{job.location || 'Remote'}</span>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', flex: 1 }}>
                                        {job.description?.substring(0, 150)}...
                                    </div>

                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                                        {user?.role === 'employee' ? (
                                            <button
                                                className={`btn ${isApplied ? 'btn-secondary' : 'btn-primary'}`}
                                                onClick={() => !isApplied && openApplyModal(job)}
                                                disabled={applying === job._id || isApplied}
                                                style={{ width: '100%', cursor: isApplied ? 'not-allowed' : 'pointer', opacity: isApplied ? 0.7 : 1 }}
                                            >
                                                {applying === job._id ? 'Submitting...' : (isApplied ? 'Applied' : 'Apply Now')}
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-secondary"
                                                disabled
                                                style={{ width: '100%', cursor: 'not-allowed', opacity: 0.7, fontSize: '13px' }}
                                                title="Only employees can apply for internal jobs"
                                            >
                                                Employee Access Only
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Application Modal */}
            <InternalApplyModal
                isOpen={isModalOpen}
                job={selectedJob}
                onClose={() => setIsModalOpen(false)}
                onApply={handleApplySubmit}
                loading={applying === selectedJob?._id}
            />
        </div>
    );
};

export default InternalJobs;
