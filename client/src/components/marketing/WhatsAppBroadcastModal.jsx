import { useState, useEffect } from 'react';
import { FaWhatsapp, FaCheckCircle, FaTimesCircle, FaPaperPlane, FaExternalLinkAlt } from 'react-icons/fa';
import { whatsappService } from '../../services/whatsappService';
import { WHATSAPP_TEMPLATES, fillTemplate, openWhatsApp } from '../../utils/whatsapp';
import Modal from '../common/Modal';

const WhatsAppBroadcastModal = ({
  isOpen,
  onClose,
  selectedItems = [], // Array of { _id, name, phone, company }
  onSuccess
}) => {
  const [templates, setTemplates] = useState(WHATSAPP_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState(WHATSAPP_TEMPLATES[0]?.id || '');
  const [campaignName, setCampaignName] = useState('');
  const [messageBody, setMessageBody] = useState(WHATSAPP_TEMPLATES[0]?.template || '');
  const [category, setCategory] = useState('Marketing');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCampaignName(`WhatsApp Broadcast - ${new Date().toLocaleDateString('en-IN')}`);
      setSendResult(null);
      
      // Load any server-side custom templates
      whatsappService.getTemplates()
        .then(res => {
          if (res.data?.success && res.data.data?.length > 0) {
            setTemplates(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleTemplateChange = (tmplId) => {
    setSelectedTemplateId(tmplId);
    const tmpl = templates.find(t => (t.id || t._id) === tmplId);
    if (tmpl) {
      setMessageBody(tmpl.template || tmpl.body || '');
      if (tmpl.category) setCategory(tmpl.category);
    }
  };

  const insertVariable = (varName) => {
    setMessageBody(prev => `${prev} {${varName}}`);
  };

  // Sample preview for first selected item
  const sampleItem = selectedItems[0] || { name: 'Rahul Sharma', phone: '+91 98765 43210', company: 'Radhix Technologies' };
  const previewText = fillTemplate(messageBody, {
    name: sampleItem.name || 'Rahul',
    company: sampleItem.company || 'Radhix Technologies',
    phone: sampleItem.phone || '+91 98765 43210',
    senderName: 'Sales Team'
  });

  const handleSendBroadcast = async () => {
    if (!messageBody.trim()) {
      alert('Please enter a message to broadcast.');
      return;
    }

    try {
      setSending(true);
      const leadIds = selectedItems.map(i => i._id);
      const res = await whatsappService.sendBroadcast({
        name: campaignName,
        messageBody,
        category,
        targetType: 'selected_leads',
        leadIds
      });

      if (res.data?.success) {
        setSendResult({
          type: 'success',
          message: res.data.message || `Successfully sent to ${res.data.data?.sent || leadIds.length} recipients!`
        });
        if (onSuccess) onSuccess();
      } else {
        setSendResult({
          type: 'error',
          message: res.data?.message || 'Failed to dispatch broadcast'
        });
      }
    } catch (err) {
      console.error('Error sending WhatsApp broadcast:', err);
      setSendResult({
        type: 'error',
        message: err.response?.data?.message || 'Failed to send broadcast messages'
      });
    } finally {
      setSending(false);
    }
  };

  const handleOpenIndividualWeb = (item) => {
    const text = fillTemplate(messageBody, {
      name: item.name || 'Client',
      company: item.company || 'Radhix Technologies',
      senderName: 'Sales Team'
    });
    openWhatsApp(item.phone, text);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: '#25D366',
            color: 'white',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            <FaWhatsapp />
          </div>
          <span>WhatsApp Broadcast ({selectedItems.length} Recipients)</span>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '78vh', overflowY: 'auto', paddingRight: '4px' }}>
        
        {/* Campaign Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '12px'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Campaign Title
            </label>
            <input
              type="text"
              className="form-control"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Diwali Offer Blast"
              style={{ width: '100%', height: '38px', borderRadius: '6px', border: '1px solid #d1d5db', padding: '0 12px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Category
            </label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', height: '38px', borderRadius: '6px', border: '1px solid #d1d5db', padding: '0 12px' }}
            >
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Welcome">Welcome</option>
              <option value="Reminder">Reminder</option>
              <option value="Festival">Festival</option>
              <option value="Utility">Utility</option>
            </select>
          </div>
        </div>

        {/* Template Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Choose Pre-approved Template
          </label>
          <select
            className="form-select"
            value={selectedTemplateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            style={{ width: '100%', height: '38px', borderRadius: '6px', border: '1px solid #d1d5db', padding: '0 12px' }}
          >
            {templates.map(t => (
              <option key={t.id || t._id} value={t.id || t._id}>
                [{t.category || 'General'}] {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Variable Chips */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Insert Dynamic Placeholders:
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: '+ Name', key: 'name' },
              { label: '+ Company', key: 'company' },
              { label: '+ Phone', key: 'phone' },
              { label: '+ Sales Rep', key: 'senderName' }
            ].map(chip => (
              <button
                key={chip.key}
                type="button"
                onClick={() => insertVariable(chip.key)}
                style={{
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#1f2937',
                  cursor: 'pointer'
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message Editor */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            WhatsApp Message Body
          </label>
          <textarea
            rows="4"
            className="form-control"
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Type your WhatsApp message..."
            style={{ width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '10px 12px', fontSize: '13px', lineHeight: '1.5' }}
          />
        </div>

        {/* WhatsApp Mobile Preview */}
        <div style={{
          background: '#ECE5DD',
          borderRadius: '10px',
          padding: '16px',
          border: '1px solid #d1d5db'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
            WhatsApp Chat Preview:
          </div>
          <div style={{
            background: '#DCF8C6',
            padding: '12px 14px',
            borderRadius: '10px 10px 0px 10px',
            maxWidth: '90%',
            marginLeft: 'auto',
            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
            fontSize: '13px',
            color: '#111827',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.4'
          }}>
            {previewText}
            <div style={{ textAlign: 'right', fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
            </div>
          </div>
        </div>

        {/* Result Feedback Banner */}
        {sendResult && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: sendResult.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: sendResult.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
            color: sendResult.type === 'success' ? '#166534' : '#991b1b',
            fontSize: '13px'
          }}>
            {sendResult.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
            <span>{sendResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
          {selectedItems.length === 1 ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleOpenIndividualWeb(selectedItems[0])}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <FaExternalLinkAlt /> Open in WhatsApp Web
            </button>
          ) : (
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Recipients queued: <strong>{selectedItems.length} leads</strong>
            </span>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={sending}
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSendBroadcast}
              disabled={sending || selectedItems.length === 0}
              style={{
                background: '#25D366',
                borderColor: '#25D366',
                color: 'white',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '160px',
                justifyContent: 'center'
              }}
            >
              {sending ? (
                'Broadcasting...'
              ) : (
                <>
                  <FaPaperPlane /> Broadcast to {selectedItems.length}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default WhatsAppBroadcastModal;
