import { useState, useRef, useEffect } from 'react';
import { FiCheck, FiX, FiRotateCcw, FiEdit3, FiType, FiShield } from 'react-icons/fi';
import './DigitalSignatureModal.css';

const DigitalSignatureModal = ({ isOpen, onClose, proposalTitle, onSaveSignature }) => {
  const [signMode, setSignMode] = useState('draw'); // 'draw' or 'type'
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && signMode === 'draw') {
      const timer = setTimeout(() => {
        initCanvas();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, signMode]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e3a8a'; // Professional pen navy blue
    ctx.lineWidth = 2.5;
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const generateTypedSignatureImage = (name) => {
    const canvas = document.createElement('canvas');
    canvas.width = 460;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'italic 38px "Brush Script MT", "Caveat", "Segoe Script", cursive';
    ctx.fillStyle = '#1e3a8a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name || 'Digital Signer', canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!signerName.trim()) {
      alert('Please enter your full name as the authorized signer.');
      return;
    }
    if (!agreed) {
      alert('Please check the legal acceptance agreement box to proceed.');
      return;
    }

    try {
      setSubmitting(true);
      let signatureImage = '';

      if (signMode === 'draw') {
        const canvas = canvasRef.current;
        if (!hasDrawn || !canvas) {
          alert('Please draw your signature in the box before submitting.');
          setSubmitting(false);
          return;
        }
        signatureImage = canvas.toDataURL('image/png');
      } else {
        signatureImage = generateTypedSignatureImage(signerName);
      }

      await onSaveSignature({
        signatureImage,
        signedByName: signerName.trim(),
        signerDesignation: signerTitle.trim() || 'Authorized Signatory',
        signedAt: new Date(),
        isVerified: true,
      });

      onClose();
    } catch (err) {
      console.error('Error saving signature:', err);
      alert('Failed to save digital signature');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="esign-modal-overlay" onClick={onClose}>
      <div className="esign-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="esign-modal-header">
          <div className="esign-title-group">
            <div className="esign-header-icon">
              <FiShield />
            </div>
            <div>
              <h3>Legal Digital E-Signature</h3>
              <p>Sign &amp; accept: <strong>{proposalTitle || 'Commercial Proposal'}</strong></p>
            </div>
          </div>
          <button className="esign-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="esign-modal-body">
          {/* Sign Mode Toggle */}
          <div className="esign-mode-switch">
            <button
              type="button"
              className={`mode-btn ${signMode === 'draw' ? 'active' : ''}`}
              onClick={() => setSignMode('draw')}
            >
              <FiEdit3 /> Draw with Mouse / Touch
            </button>
            <button
              type="button"
              className={`mode-btn ${signMode === 'type' ? 'active' : ''}`}
              onClick={() => setSignMode('type')}
            >
              <FiType /> Type Name (Cursive)
            </button>
          </div>

          {/* SIGNATURE AREA */}
          {signMode === 'draw' ? (
            <div className="canvas-wrapper">
              <div className="canvas-header-strip">
                <span>Draw your signature inside the box:</span>
                <button type="button" className="btn-clear-canvas" onClick={clearCanvas}>
                  <FiRotateCcw size={12} /> Clear
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width={460}
                height={140}
                className="signature-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <div className="canvas-baseline"></div>
            </div>
          ) : (
            <div className="typed-preview-wrapper">
              <span className="type-hint">Handwriting Preview:</span>
              <div className="typed-cursive-preview">
                {signerName || 'Your Handwritten Signature'}
              </div>
            </div>
          )}

          {/* Signer Info Fields */}
          <div className="form-row-2" style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label>Signer Full Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Ramesh Kumar"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Designation / Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Managing Director"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
              />
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="legal-consent-box">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <span>
                I agree that this electronic signature is legally binding and acknowledges acceptance of the terms, deliverables, and financial amounts specified in this proposal.
              </span>
            </label>
          </div>

          <div className="esign-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-confirm-sign"
              disabled={submitting || !agreed}
            >
              {submitting ? 'Applying Signature...' : <><FiCheck /> Sign &amp; Accept Proposal</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DigitalSignatureModal;

