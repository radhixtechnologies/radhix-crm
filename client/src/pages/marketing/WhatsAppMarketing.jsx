import { useState, useEffect } from 'react';
import {
  FaWhatsapp,
  FaPaperPlane,
  FaPlus,
  FaCheckCircle,
  FaClock,
  FaUsers,
  FaRobot,
  FaBook,
  FaServer,
  FaSync
} from 'react-icons/fa';
import { whatsappService } from '../../services/whatsappService';
import { WHATSAPP_TEMPLATES, openWhatsApp, fillTemplate } from '../../utils/whatsapp';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import WhatsAppBroadcastModal from '../../components/marketing/WhatsAppBroadcastModal';
import '../../styles/employee/timesheets.css';

const WhatsAppMarketing = () => {
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns', 'templates', 'quickSend', 'metaApi'
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState(WHATSAPP_TEMPLATES);
  const [summary, setSummary] = useState({
    totalCampaigns: 0,
    totalSent: 0,
    totalFailed: 0,
    activeCampaigns: 0
  });
  const [apiStatus, setApiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Quick Direct Send State
  const [directPhone, setDirectPhone] = useState('');
  const [directMessage, setDirectMessage] = useState('');
  const [directSending, setDirectSending] = useState(false);
  const [directFeedback, setDirectFeedback] = useState(null);

  // Create Template Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', category: 'Sales', body: '' });

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [campRes, tmplRes, statusRes] = await Promise.all([
        whatsappService.getCampaigns().catch(() => ({ data: { data: [], summary: {} } })),
        whatsappService.getTemplates().catch(() => ({ data: { data: WHATSAPP_TEMPLATES } })),
        whatsappService.getStatus().catch(() => ({ data: { data: {} } }))
      ]);

      if (campRes.data?.success) {
        setCampaigns(campRes.data.data || []);
        if (campRes.data.summary) {
          setSummary(campRes.data.summary);
        }
      }

      if (tmplRes.data?.success && tmplRes.data.data?.length > 0) {
        setTemplates(tmplRes.data.data);
      }

      if (statusRes.data?.success) {
        setApiStatus(statusRes.data.data);
      }
    } catch (err) {
      console.error('Error loading WhatsApp marketing data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.name || !newTemplate.body) {
      alert('Please fill name and body for the template');
      return;
    }

    try {
      const res = await whatsappService.createTemplate(newTemplate);
      if (res.data?.success) {
        setTemplates(prev => [res.data.data, ...prev]);
        setShowTemplateModal(false);
        setNewTemplate({ name: '', category: 'Sales', body: '' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save template');
    }
  };

  const handleSendDirect = async (e) => {
    e.preventDefault();
    if (!directPhone || !directMessage) {
      alert('Please provide both phone number and message');
      return;
    }

    try {
      setDirectSending(true);
      setDirectFeedback(null);
      const res = await whatsappService.sendSingle({
        phone: directPhone,
        message: directMessage
      });

      if (res.data?.success) {
        setDirectFeedback({ type: 'success', message: 'WhatsApp message dispatched successfully!' });
        setDirectMessage('');
      } else {
        setDirectFeedback({ type: 'error', message: res.data?.message || 'Failed to dispatch' });
      }
    } catch (err) {
      setDirectFeedback({ type: 'error', message: err.response?.data?.message || 'Error sending message' });
    } finally {
      setDirectSending(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="timesheets-list-page fade-in">
      {/* Page Header */}
      <div className="timesheets-page-header">
        <div className="header-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: '#25D366',
              color: 'white',
              borderRadius: '12px',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 4px 10px rgba(37, 211, 102, 0.3)'
            }}>
              <FaWhatsapp />
            </div>
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>WhatsApp Marketing & Automation</h1>
              <p className="page-subtitle" style={{ margin: '2px 0 0' }}>
                Meta Cloud API Broadcasts, Instant Lead Welcome & Automated Follow-ups
              </p>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => { setRefreshing(true); fetchData(); }}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FaSync className={refreshing ? 'fa-spin' : ''} /> Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowTemplateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FaPlus /> New Template
          </button>
          <button
            className="btn"
            onClick={() => setShowBroadcastModal(true)}
            style={{
              background: '#25D366',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FaPaperPlane /> Quick Broadcast
          </button>
        </div>
      </div>

      {/* Pulse / Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Total Sent */}
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
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '22px'
          }}>
            <FaWhatsapp />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {summary.totalSent}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Messages Delivered
            </div>
          </div>
        </div>

        {/* Total Campaigns */}
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
            <FaPaperPlane />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {summary.totalCampaigns}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Broadcast Campaigns
            </div>
          </div>
        </div>

        {/* Active Templates */}
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
            <FaBook />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {templates.length}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Active Templates
            </div>
          </div>
        </div>

        {/* Meta Cloud API Status */}
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
            background: apiStatus?.connected ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px'
          }}>
            <FaRobot />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
              {apiStatus?.connected ? 'Meta Cloud API Live' : 'Smart Auto Gateway'}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
              Instant Auto-Welcome Active
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '20px'
      }}>
        {[
          { id: 'campaigns', label: 'Broadcast Campaigns', icon: FaPaperPlane },
          { id: 'templates', label: 'Templates Library', icon: FaBook },
          { id: 'quickSend', label: 'Direct Quick Chat', icon: FaWhatsapp },
          { id: 'metaApi', label: 'Meta API & Automation Info', icon: FaServer }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === tab.id ? '#128C7E' : '#6b7280',
              borderBottom: activeTab === tab.id ? '2px solid #25D366' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Broadcast Campaigns List */}
      {activeTab === 'campaigns' && (
        <div className="table-container-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Category</th>
                <th>Target</th>
                <th>Recipients</th>
                <th>Delivered</th>
                <th>Date Sent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length > 0 ? (
                campaigns.map(camp => (
                  <tr key={camp._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{camp.name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {camp.messageBody}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#f3f4f6', color: '#374151', padding: '4px 10px', borderRadius: '6px' }}>
                        {camp.category || 'Marketing'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', textTransform: 'capitalize' }}>
                        {(camp.targetType || 'Leads').replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <strong>{camp.totalRecipients || 0}</strong>
                    </td>
                    <td>
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>
                        {camp.sentCount || 0}
                      </span>
                      {camp.failedCount > 0 && (
                        <span style={{ color: '#dc2626', fontSize: '12px', marginLeft: '6px' }}>
                          ({camp.failedCount} failed)
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>
                        {new Date(camp.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: camp.status === 'completed' ? '#dcfce7' : '#fef3c7',
                        color: camp.status === 'completed' ? '#166534' : '#b45309',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        textTransform: 'capitalize',
                        fontWeight: 600
                      }}>
                        {camp.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '50px 20px', color: '#6b7280' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px', color: '#25D366' }}>
                      <FaWhatsapp />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>No Broadcast Campaigns Yet</h3>
                    <p style={{ fontSize: '13px', margin: '0 0 16px' }}>Select leads from the Sales Leads page and click "WhatsApp Broadcast" to launch your first blast.</p>
                    <button
                      className="btn"
                      onClick={() => setShowBroadcastModal(true)}
                      style={{ background: '#25D366', color: 'white', fontWeight: 600 }}
                    >
                      <FaPaperPlane style={{ marginRight: '6px' }} /> Launch Quick Broadcast
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Templates Library */}
      {activeTab === 'templates' && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px'
          }}>
            {templates.map((tmpl, idx) => (
              <div key={tmpl.id || tmpl._id || idx} style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{
                      background: '#ecfdf5',
                      color: '#065f46',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      {tmpl.category || 'Sales'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                      {tmpl.isSystem ? 'Standard Template' : 'Custom'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>
                    {tmpl.name}
                  </h3>

                  <div style={{
                    background: '#f9fafb',
                    border: '1px solid #f3f4f6',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13px',
                    color: '#374151',
                    lineHeight: '1.5',
                    marginBottom: '14px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {tmpl.template || tmpl.body}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {(tmpl.variables || ['name', 'company']).map(v => (
                      <span key={v} style={{ fontSize: '11px', color: '#6b7280', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                        {`{${v}}`}
                      </span>
                    ))}
                  </div>
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      setDirectMessage(tmpl.template || tmpl.body);
                      setActiveTab('quickSend');
                    }}
                    style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontWeight: 600 }}
                  >
                    Use in Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Direct Quick Chat */}
      {activeTab === 'quickSend' && (
        <div style={{ maxWidth: '650px', background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
            Instant Direct WhatsApp Message
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
            Send an instant WhatsApp message to any customer, prospect or team member.
          </p>

          <form onSubmit={handleSendDirect}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Recipient Mobile Number (with country code):
              </label>
              <input
                type="text"
                className="form-control"
                value={directPhone}
                onChange={(e) => setDirectPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #d1d5db', padding: '0 12px' }}
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Message Content:
              </label>
              <textarea
                rows="5"
                className="form-control"
                value={directMessage}
                onChange={(e) => setDirectMessage(e.target.value)}
                placeholder="Type your WhatsApp message..."
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #d1d5db', padding: '12px', fontSize: '13px', lineHeight: '1.5' }}
                required
              />
            </div>

            {directFeedback && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                background: directFeedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: directFeedback.type === 'success' ? '#166534' : '#991b1b',
                fontSize: '13px'
              }}>
                {directFeedback.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={directSending}
                className="btn"
                style={{ background: '#25D366', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FaPaperPlane /> {directSending ? 'Sending...' : 'Send WhatsApp Message'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => openWhatsApp(directPhone, directMessage)}
                disabled={!directPhone}
              >
                Open in WhatsApp Web
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: Meta API & Automation Info */}
      {activeTab === 'metaApi' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
            Meta WhatsApp Cloud API Configuration
          </h2>
          <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>
            Aapka portal official <strong>Meta WhatsApp Business Cloud API</strong> aur <strong>Smart Click-to-Chat</strong> dono systems ko support karta hai.
          </p>

          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '16px 20px',
            marginTop: '16px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 8px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaCheckCircle /> Webhook & Meta App Status
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#15803d', fontSize: '13px', lineHeight: '1.8' }}>
              <li><strong>Meta App ID:</strong> 2113492049536612</li>
              <li><strong>Verified Webhook URL:</strong> <code>https://api.radhix.com/api/webhooks/meta</code></li>
              <li><strong>Instant Auto-Welcome:</strong> Meta Ads se naye lead aane par automatically WhatsApp message trigger hota hai.</li>
            </ul>
          </div>

          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginTop: '24px', marginBottom: '10px' }}>
            Live Direct Sending Activate Karne Ke Liye (Optional):
          </h3>
          <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
            Meta Developers Portal me WhatsApp product add karein aur Hostinger ke environment variables me yeh do keys daal dein:
          </p>
          <pre style={{
            background: '#1e293b',
            color: '#38bdf8',
            padding: '14px',
            borderRadius: '8px',
            fontSize: '13px',
            overflowX: 'auto'
          }}>
{`WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
WHATSAPP_TOKEN=your_meta_system_user_access_token`}
          </pre>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
            Jab tak yeh keys empty rahengi, CRM automatically Smart Queue & Click-to-Chat mode use karega taaki aap bina rukaawat ke customer ko WhatsApp bhej sakein!
          </p>
        </div>
      )}

      {/* Create Template Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Create New WhatsApp Template"
      >
        <form onSubmit={handleCreateTemplate}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Template Name:
            </label>
            <input
              type="text"
              className="form-control"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              placeholder="e.g. Festival Special Discount"
              style={{ width: '100%', height: '38px', borderRadius: '6px', border: '1px solid #d1d5db', padding: '0 12px' }}
              required
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Category:
            </label>
            <select
              className="form-select"
              value={newTemplate.category}
              onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
              style={{ width: '100%', height: '38px', borderRadius: '6px', border: '1px solid #d1d5db', padding: '0 12px' }}
            >
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Welcome">Welcome</option>
              <option value="Reminder">Reminder</option>
              <option value="Festival">Festival</option>
              <option value="Finance">Finance</option>
            </select>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Message Body (use tags like {'{name}'}, {'{company}'}):
            </label>
            <textarea
              rows="4"
              className="form-control"
              value={newTemplate.body}
              onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
              placeholder="Hello {name}, greetings from {company}..."
              style={{ width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '10px 12px', fontSize: '13px' }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowTemplateModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: '#25D366', borderColor: '#25D366', color: 'white', fontWeight: 600 }}
            >
              Save Template
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Broadcast Modal */}
      <WhatsAppBroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        selectedItems={[]}
        onSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
};

export default WhatsAppMarketing;
