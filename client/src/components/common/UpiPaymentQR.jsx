import { useState } from 'react';
import { FiCopy, FiCheck, FiShield } from 'react-icons/fi';
import { buildUpiPaymentUri, getUpiQrImageUrl } from '../../utils/upi';
import './UpiPaymentQR.css';

const UpiPaymentQR = ({
  upiId = 'radhixtechnologies@okaxis',
  payeeName = 'Radhix Technologies',
  amount = 0,
  invoiceNumber = '',
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);

  const cleanAmount = Number(amount || 0);
  const upiUri = buildUpiPaymentUri({
    upiId,
    payeeName,
    amount: cleanAmount,
    invoiceNumber,
  });

  const qrImageUrl = getUpiQrImageUrl(upiUri, compact ? 160 : 200);

  const handleCopy = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={`upi-qr-card ${compact ? 'compact' : ''}`}>
      <div className="upi-qr-header">
        <div className="upi-badge-row">
          <span className="upi-brand-tag">UPI Scan &amp; Pay</span>
          <span className="secure-tag">
            <FiShield /> Instant Credit
          </span>
        </div>
        <h4>Pay via any UPI App</h4>
        <div className="upi-amount-pill">
          <span>Amount Payable:</span>
          <strong>₹{cleanAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
        </div>
      </div>

      <div className="upi-qr-frame">
        <img
          src={qrImageUrl}
          alt={`UPI QR Code for ₹${cleanAmount}`}
          className="upi-qr-image"
          loading="lazy"
        />
        <div className="upi-apps-logos">
          <span>GPay</span>
          <span>•</span>
          <span>PhonePe</span>
          <span>•</span>
          <span>Paytm</span>
          <span>•</span>
          <span>BHIM</span>
        </div>
      </div>

      <div className="upi-id-box">
        <div className="upi-id-text">
          <span className="label">VPA / UPI ID:</span>
          <span className="value">{upiId}</span>
        </div>
        <button
          type="button"
          className="btn-copy-upi"
          onClick={handleCopy}
          title="Copy UPI ID"
        >
          {copied ? <FiCheck className="copied" /> : <FiCopy />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <p className="upi-instructions">
        Scan this QR code with any UPI app on your phone to complete payment for Invoice #{invoiceNumber || 'NEW'}.
      </p>
    </div>
  );
};

export default UpiPaymentQR;

