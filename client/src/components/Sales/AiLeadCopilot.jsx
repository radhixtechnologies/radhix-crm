import { useState } from 'react';
import {
  FiZap,
  FiCheckCircle,
  FiCopy,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiMessageCircle,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { calculateLeadScore, generateAiFollowUpPitches } from '../../utils/aiCopilot';
import { openWhatsApp } from '../../utils/whatsapp';
import './AiLeadCopilot.css';

const AiLeadCopilot = ({ lead }) => {
  const [copiedId, setCopiedId] = useState(null);
  const [showPitches, setShowPitches] = useState(false);

  if (!lead) return null;

  const scoreData = calculateLeadScore(lead);
  const pitches = generateAiFollowUpPitches(lead);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendWhatsApp = (text) => {
    if (!lead.phone) {
      alert('Lead phone number is missing');
      return;
    }
    openWhatsApp(lead.phone, text);
  };

  return (
    <div className="ai-copilot-card">
      <div className="copilot-header">
        <div className="copilot-title-group">
          <div className="ai-sparkle-icon">
            <FiZap />
          </div>
          <div>
            <h4>AI Lead Intelligence &amp; Score</h4>
            <p>Algorithmic intent analysis &amp; smart conversion advice</p>
          </div>
        </div>
        <span
          className="score-tier-pill"
          style={{ borderColor: scoreData.color, color: scoreData.color }}
        >
          {scoreData.emoji} {scoreData.label}
        </span>
      </div>

      <div className="copilot-body">
        {/* Score Meter & Advice */}
        <div className="score-summary-row">
          <div className="score-gauge" style={{ borderColor: scoreData.color }}>
            <span className="score-number" style={{ color: scoreData.color }}>
              {scoreData.score}
            </span>
            <span className="score-total">/ 100</span>
          </div>

          <div className="advice-block">
            <span className="advice-kicker">AI RECOMMENDATION:</span>
            <p className="advice-text">{scoreData.aiAdvice}</p>
          </div>
        </div>

        {/* Signals */}
        <div className="signals-list">
          {scoreData.positiveSignals.map((signal, idx) => (
            <div key={idx} className="signal-item positive">
              <FiCheckCircle className="signal-icon" />
              <span>{signal}</span>
            </div>
          ))}
        </div>

        {/* AI Pitch Generator Toggle */}
        <div className="pitch-generator-section">
          <button
            type="button"
            className="btn-toggle-pitches"
            onClick={() => setShowPitches((prev) => !prev)}
          >
            <FiZap />
            <span>Generate 1-Click AI Follow-up Drafts</span>
            {showPitches ? <FiChevronUp /> : <FiChevronDown />}
          </button>

          {showPitches && (
            <div className="pitches-list animate-fade-in">
              {pitches.map((pitch) => (
                <div key={pitch.id} className="pitch-card">
                  <div className="pitch-card-top">
                    <span className="pitch-title">{pitch.title}</span>
                    <span className="pitch-badge">{pitch.badge}</span>
                  </div>
                  <p className="pitch-text">{pitch.text}</p>
                  <div className="pitch-actions">
                    <button
                      type="button"
                      className="btn-copy-pitch"
                      onClick={() => handleCopy(pitch.id, pitch.text)}
                    >
                      {copiedId === pitch.id ? <FiCheck /> : <FiCopy />}
                      <span>{copiedId === pitch.id ? 'Copied' : 'Copy Pitch'}</span>
                    </button>
                    {lead.phone && (
                      <button
                        type="button"
                        className="btn-wa-pitch"
                        onClick={() => handleSendWhatsApp(pitch.text)}
                        title="Send via WhatsApp"
                      >
                        <FaWhatsapp />
                        <span>Send WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiLeadCopilot;

