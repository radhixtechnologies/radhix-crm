import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import { hrmService } from '../../services/hrmService';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import EmployeeForm from '../../components/Employees/EmployeeForm';
import { formatDate, formatCurrency } from '../../utils/format';
import {
  FiUser, FiBriefcase, FiMapPin, FiMail, FiPhone, FiCalendar,
  FiFileText, FiClock, FiCheckCircle, FiDollarSign, FiPackage,
  FiEdit, FiTrash2, FiDownload, FiLayers
} from 'react-icons/fi';
import '../../styles/employee/employee-profile.css';

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Data States
  const [data, setData] = useState({
    attendance: [], leaves: [], tasks: [], assets: [],
    interviews: [], offers: [], documents: [], skills: []
  });

  // Modal States
  const [modals, setModals] = useState({ edit: false, doc: false, skill: false });
  const [forms, setForms] = useState({
    profile: {},
    doc: { name: '', url: '', type: 'other' },
    skill: { name: '', proficiency: 'intermediate' }
  });

  useEffect(() => { fetchEmployee(); }, [id]);
  useEffect(() => { if (employee) fetchRelatedData(); }, [employee]);

  const [error, setError] = useState(null);

  const fetchEmployee = async () => {
    try {
      setError(null);
      const res = await employeeService.getEmployee(id);
      if (res.data.success) {
        setEmployee(res.data.data);
        setForms(prev => ({
          ...prev, profile: {
            phone: res.data.data.phone || '',
            address: res.data.data.address || {},
          }
        }));
      }
    } catch (e) {
      console.error(e);
      if (e.response?.status === 404) {
        setError('Employee record not found. This could mean the employee has been deleted or the profile doesn\'t exist.');
      } else if (e.response?.status === 403) {
        setError('You don\'t have permission to view this employee profile.');
      } else {
        setError('Failed to load employee profile. Please try again.');
      }
    } finally { setLoading(false); }
  };

  const fetchRelatedData = async () => {
    try {
      const responses = await Promise.allSettled([
        employeeService.getAttendance(id, { startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), endDate: new Date().toISOString() }),
        employeeService.getLeaves(),
        employeeService.getTasks(),
        employeeService.getAssets({ employeeId: id })
      ]);

      const newData = { ...data };
      if (responses[0].status === 'fulfilled' && responses[0].value.data.success) newData.attendance = responses[0].value.data.data.slice(0, 5);
      if (responses[1].status === 'fulfilled' && responses[1].value.data.success) newData.leaves = responses[1].value.data.data.filter(l => l.employee?._id === id).slice(0, 5);
      if (responses[2].status === 'fulfilled' && responses[2].value.data.success) newData.tasks = responses[2].value.data.data.filter(t => t.assignedTo?._id === id).slice(0, 5);
      if (responses[3].status === 'fulfilled' && responses[3].value.data.success) newData.assets = responses[3].value.data.data;

      setData(newData);
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async (formData) => {
    try {
      setLoading(true);
      const res = await employeeService.updateEmployee(id, formData);
      if (res.data.success) {
        setEmployee(res.data.data);
        setModals(prev => ({ ...prev, edit: false }));
        alert('Profile updated successfully');
      }
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (n) => n ? n.split(' ').map(c => c[0]).join('').substring(0, 2).toUpperCase() : 'EP';

  if (loading) return <Loader />;
  if (error || !employee) return (
    <div className="employee-profile-page">
      <div className="ep-card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <div className="ep-card-body" style={{ padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
          <h2 style={{ marginBottom: '12px', color: '#374151' }}>
            {error ? 'Error Loading Profile' : 'Employee Not Found'}
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            {error || 'The employee profile you are looking for does not exist or has been removed.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn-outline-sm" onClick={() => navigate(-1)}>
              Go Back
            </button>
            <button className="btn-primary-sm" onClick={() => navigate('/employees')}>
              View All Employees
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const canEdit = isAdmin || isSuperAdmin || user?._id === employee.user?._id;

  return (
    <div className="employee-profile-page">

      {/* 1. Header Section - Compact & Aligned */}
      <header className="ep-header">
        <div className="ep-identity">
          {employee.user?.avatar ?
            <img src={employee.user.avatar} className="ep-avatar" alt="Avatar" /> :
            <div className="ep-avatar-placeholder">{getInitials(employee.user?.name)}</div>
          }
          <div className="ep-info-row">
            <div className="ep-name-row">
              <h1 className="ep-name">{employee.user?.name}</h1>
              <span className={`ep-status-badge ${employee.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                {employee.status}
              </span>
            </div>
            <div className="ep-meta-row">
              <div className="ep-meta-item"><FiBriefcase /> {employee.designation}</div>
              <div className="ep-meta-item"><FiPackage /> {employee.department}</div>
              <div className="ep-meta-item"><FiMapPin /> {employee.workLocation || 'Office'}</div>
              <div className="ep-meta-item"><FiCalendar /> Joined {formatDate(employee.joiningDate)}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {canEdit && <button className="btn-outline-sm" onClick={() => setModals({ ...modals, edit: true })}><FiEdit /> Edit</button>}
          <button className="btn-primary-sm" onClick={() => navigate(`/employees/reports?employeeId=${id}`)}>View Reports</button>
        </div>
      </header>

      {/* 2. Tabs Navigation - Primary Nav */}
      <nav className="ep-tabs-container">
        <div className="ep-tabs-list">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'documents', label: 'Documents' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'leaves', label: 'Leaves' },
            { id: 'assets', label: 'Assets' },
            { id: 'payroll', label: 'Payroll' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`ep-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
        padding: '0 24px'
      }}>
        {/* Attendance (30 days) */}
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
              {data.attendance.filter(a => a.status === 'present').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Present (30d)
            </div>
          </div>
        </div>

        {/* Leaves Taken */}
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
            <FiCalendar />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {data.leaves.filter(l => l.status === 'approved').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Leaves Taken
            </div>
          </div>
        </div>

        {/* Assets Assigned */}
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
            <FiPackage />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {data.assets.length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Assets Assigned
            </div>
          </div>
        </div>

        {/* Experience */}
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
            <FiBriefcase />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {employee.joiningDate
                ? `${Math.floor((new Date() - new Date(employee.joiningDate)) / (365.25 * 24 * 60 * 60 * 1000))}y ${Math.floor(((new Date() - new Date(employee.joiningDate)) % (365.25 * 24 * 60 * 60 * 1000)) / (30 * 24 * 60 * 60 * 1000))}m`
                : 'N/A'}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Experience
            </div>
          </div>
        </div>
      </div>

      {/* 3. Content Area */}
      <main className="ep-content-area">

        {/* OVERVIEW TAB - Two Column Balanced Grid */}
        {activeTab === 'overview' && (
          <div className="ep-grid-2">
            {/* Left Card: Personal Information */}
            <div className="ep-card">
              <div className="ep-card-header">
                <div className="ep-card-title"><FiUser /> Personal Details</div>
              </div>
              <div className="ep-card-body">
                <div className="ep-detail-row">
                  <span className="ep-label">Email</span>
                  <span className="ep-value">{employee.user?.email}</span>
                </div>
                <div className="ep-detail-row">
                  <span className="ep-label">Phone</span>
                  <span className="ep-value">{employee.phone || 'Not Set'}</span>
                </div>
                <div className="ep-detail-row">
                  <span className="ep-label">DOB</span>
                  <span className="ep-value">{formatDate(employee.dateOfBirth)}</span>
                </div>
                <div className="ep-detail-row">
                  <span className="ep-label">Gender</span>
                  <span className="ep-value text-cap">{employee.gender || '--'}</span>
                </div>
                <div className="ep-detail-row">
                  <span className="ep-label">Address</span>
                  <span className="ep-value">{employee.address ? `${employee.address.city}, ${employee.address.state}` : '--'}</span>
                </div>
                {employee.bio && <div style={{ marginTop: '16px', fontSize: '13px', color: '#666', lineHeight: '1.5' }}>{employee.bio}</div>}
              </div>
            </div>

            {/* Right Card: Work Information */}
            <div className="ep-card">
              <div className="ep-card-header">
                <div className="ep-card-title"><FiBriefcase /> Work Details</div>
              </div>
              <div className="ep-card-body">
                <div className="ep-detail-row">
                  <span className="ep-label">Employee ID</span>
                  <span className="ep-value">#{employee.employeeId}</span>
                </div>
                <div className="ep-detail-row">
                  <span className="ep-label">Department</span>
                  <span className="ep-value">{employee.department}</span>
                </div>
                <div className="ep-detail-row">
                  <span className="ep-label">Designation</span>
                  <span className="ep-value">{employee.designation}</span>
                </div>
                <div className="ep-detail-row">
                  <span className="ep-label">Manager</span>
                  <span className="ep-value">{employee.manager?.user?.name || employee.manager?.designation || 'N/A'}</span>
                </div>
                <div className="ep-detail-row">
                  <span className="ep-label">Employment Type</span>
                  <span className="ep-value text-cap">{employee.employmentType || 'Full Time'}</span>
                </div>
                <div className="ep-detail-row" style={{ borderBottom: 'none' }}>
                  <span className="ep-label">Salary</span>
                  <span className="ep-value" style={{ color: '#059669', fontWeight: '700' }}>{formatCurrency(employee.salary)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OTHER TABS - Full Width Tables */}
        {activeTab === 'documents' && (
          <div className="ep-card">
            <div className="ep-card-header">
              <div className="ep-card-title">Documents</div>
              {canEdit && <button className="btn-primary-sm" onClick={() => setModals({ ...modals, doc: true })}>+ Add New</button>}
            </div>
            <table className="ep-table">
              <thead><tr><th>Document</th><th>Type</th><th>Date</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {employee.documents?.map(doc => (
                  <tr key={doc._id}>
                    <td>{doc.name}</td>
                    <td className="text-cap">{doc.type}</td>
                    <td>{formatDate(doc.uploadedAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {doc.url && <a href={doc.url} target="_blank" className="btn-outline-sm" style={{ textDecoration: 'none' }}>Download</a>}
                    </td>
                  </tr>
                ))}
                {(!employee.documents || employee.documents.length === 0) && <tr><td colSpan="4" style={{ textAlign: 'center', color: '#999' }}>No documents</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Reusing Generic Table Logic for simplicity in this view */}
        {activeTab === 'attendance' && (
          <div className="ep-card">
            <div className="ep-card-header"><div className="ep-card-title">Recent Attendance</div></div>
            <table className="ep-table">
              <thead><tr><th>Date</th><th>In</th><th>Out</th><th>Status</th></tr></thead>
              <tbody>
                {data.attendance.map(a => (
                  <tr key={a._id}>
                    <td>{formatDate(a.date)}</td>
                    <td>{a.checkIn ? formatDate(a.checkIn, 'HH:mm') : '-'}</td>
                    <td>{a.checkOut ? formatDate(a.checkOut, 'HH:mm') : '-'}</td>
                    <td><span className={a.status === 'present' ? 'status-active' : 'status-inactive'}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {['leaves', 'assets', 'payroll'].includes(activeTab) && (
          <div className="ep-card" style={{ textAlign: 'center', padding: '40px' }}>
            <FiLayers style={{ fontSize: '32px', color: '#ccc', marginBottom: '16px' }} />
            <p style={{ color: '#666' }}>Detailed view for <strong>{activeTab}</strong> component.</p>
          </div>
        )}

      </main>

      {/* Edit Modal */}
      <Modal isOpen={modals.edit} onClose={() => setModals({ ...modals, edit: false })} title="Edit Profile">
        <EmployeeForm
          initialData={employee}
          onSubmit={handleUpdate}
          loading={loading}
        />
      </Modal>

    </div>
  );
};

export default EmployeeProfile;
