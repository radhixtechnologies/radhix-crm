import { useState, useEffect } from 'react';
import {
  FiX,
  FiSend,
  FiFileText,
  FiUser,
  FiPhone,
  FiCheck,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { WHATSAPP_TEMPLATES, fillTemplate, openWhatsApp } from '../../utils/whatsapp';
import { useAuth } from '../../context/AuthContext';
import './WhatsAppModal.css';

const WhatsAppModal = ({
  isOpen,
  onClose,
  recipientName = '',
  recipientPhone = '',
  defaultTemplateId = 'general_followup',
  contextVariables = {},
}) => {
  const { user } = useAuth();
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplateId);
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState(recipientPhone);

  useEffect(() => {
    setPhone(recipientPhone);
  }, [recipientPhone]);

  useEffect(() => {
    if (!isOpen) return;

    const currentTemplate =
      WHATSAPP_TEMPLATES.find((t) => t.id === selectedTemplateId) || WHATSAPP_TEMPLATES[0];

    const vars = {
      name: recipientName || 'Customer',
      senderName: user?.name || 'Representative',
      company: 'Radhix Technologies',
      time: 'today afternoon',
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      amount: '5,000',
      property: 'Prestige Heights',
      agentName: user?.name || 'Property Advisor',
      batch: 'Morning Fast-Track',
      vehicle: 'Car',
      guests: '2',
      ...contextVariables,
    };

    setMessage(fillTemplate(currentTemplate.template, vars));
  }, [isOpen, selectedTemplateId, recipientName, user?.name, contextVariables]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!phone) return;
    openWhatsApp(phone, message);
    onClose();
  };

  return (
    <div className="wa-modal-overlay" onClick={onClose}>
      <div className="wa-modal-container animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="wa-modal-header">
          <div className="wa-header-brand">
            <div className="wa-icon-circle">
              <FaWhatsapp />
            </div>
            <div>
              <h3>Quick WhatsApp Chat</h3>
              <p>Send an instant message or notification directly to client</p>
            </div>
          </div>
          <button type="button" className="wa-close-btn" onClick={onClose} aria-label="Close modal">
            <FiX />
          </button>
        </div>

        <div className="wa-modal-body">
          {/* Recipient details */}
          <div className="wa-recipient-pill">
            <div className="wa-pill-item">
              <FiUser className="wa-pill-icon" />
              <span>{recipientName || 'Client / Lead'}</span>
            </div>
            <div className="wa-pill-divider" />
            <div className="wa-pill-item">
              <FiPhone className="wa-pill-icon" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile number with country code"
                className="wa-phone-input"
              />
            </div>
          </div>

          {/* Template Selector */}
          <div className="wa-field-group">
            <label>
              <FiFileText /> Choose Message Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="wa-template-select"
            >
              {WHATSAPP_TEMPLATES.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  [{tmpl.category}] {tmpl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Message Textarea */}
          <div className="wa-field-group">
            <div className="wa-label-row">
              <label>Message Content (Customizable)</label>
              <span className="wa-char-count">{message.length} chars</span>
            </div>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="wa-textarea"
            />
          </div>
        </div>

        <div className="wa-modal-footer">
          <button type="button" className="wa-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="wa-submit-btn"
            onClick={handleSend}
            disabled={!phone?.trim()}
          >
            <FaWhatsapp />
            <span>Launch WhatsApp Web / App</span>
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppModal;

