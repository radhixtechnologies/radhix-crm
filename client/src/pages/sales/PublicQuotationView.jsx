import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiEdit3, FiShield, FiCreditCard } from 'react-icons/fi';
import { growthService } from '../../services/growthService';
import UpiPaymentQR from '../../components/common/UpiPaymentQR';
import './PublicQuotationView.css';

const PublicQuotationView = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quotation, setQuotation] = useState(null);
  const [company, setCompany] = useState(null);

  const [signedByName, setSignedByName] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const res = await growthService.getPublicQuotation(token);
      if (res.data?.success) {
        setQuotation(res.data.data.quotation);
        setCompany(res.data.data.company);
      } else {
        setError('Quotation not found.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'This quotation link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [token]);

  const getPointerPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) * canvas.width) / rect.width,
      y: ((clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const startDraw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPointerPos(e);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    drawingRef.current = true;
    setHasDrawnSignature(true);
  };

  const moveDraw = (e) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPointerPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    drawingRef.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  const handleRespond = async (action) => {
    if (action === 'accepted' && !signedByName.trim()) {
      alert('Please enter your full name to digitally sign and approve this quotation.');
      return;
    }
    try {
      setSubmitting(true);
      const signatureDataUrl =
        action === 'accepted' && hasDrawnSignature && canvasRef.current
          ? canvasRef.current.toDataURL('image/png')
          : '';
      const res = await growthService.respondPublicQuotation(token, {
        action,
        signedByName: signedByName.trim(),
        signatureDataUrl,
        feedback: feedback.trim(),
      });
      if (res.data?.success) {
        setStatusMessage(res.data.message);
        await fetchQuotation();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="public-quote-shell">
        <div className="public-quote-card" style={{ padding: '48px', textAlign: 'center', color: '#475569' }}>
          Loading Quotation Portal...
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="public-quote-shell">
        <div className="public-quote-card" style={{ padding: '48px', textAlign: 'center', color: '#b91c1c' }}>
          <h2>Quotation Unavailable</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const companyDisplayName = company?.branding?.companyDisplayName || company?.name || 'Radhix Technologies';
  const amountTotal = Number(quotation.grandTotal ?? quotation.total ?? 0);
  const clientName = quotation.client?.name || quotation.customClientDetails?.name || 'Valued Client';
  const clientEmail = quotation.client?.email || quotation.customClientDetails?.email || '';
  const clientPhone = quotation.client?.phone || quotation.customClientDetails?.phone || '';

  return (
    <div className="public-quote-shell">
      <div className="public-quote-card">
        <div className="public-quote-banner">
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#93c5fd', fontWeight: 700 }}>
              Official Quotation & Approval Portal
            </div>
            <h1 style={{ margin: '6px 0 4px', fontSize: '24px' }}>{companyDisplayName}</h1>
            <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
              {quotation.quotationName} • #{quotation.quotationNumber}
              {company?.gstin ? ` • GSTIN: ${company.gstin}` : ''}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '6px 14px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '12.5px',
                textTransform: 'uppercase',
                background:
                  quotation.status === 'accepted'
                    ? '#10b981'
                    : quotation.status === 'rejected'
                      ? '#ef4444'
                      : '#3b82f6',
                color: '#ffffff',
              }}
            >
              {quotation.status}
            </span>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '8px' }}>
              ₹{amountTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="public-quote-body">
          {statusMessage && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: '#dcfce7',
                color: '#166534',
                border: '1px solid #86efac',
                marginBottom: '18px',
                fontWeight: 600,
                fontSize: '13.5px',
              }}
            >
              {statusMessage}
            </div>
          )}

          <div className="public-quote-meta">
            <div>
              <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Prepared For</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{clientName}</div>
              {clientEmail && <div style={{ fontSize: '12.5px', color: '#475569' }}>{clientEmail}</div>}
              {clientPhone && <div style={{ fontSize: '12.5px', color: '#475569' }}>{clientPhone}</div>}
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Quotation Date</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                {quotation.quotationDate ? new Date(quotation.quotationDate).toLocaleDateString('en-IN') : 'Today'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Valid Until</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                {quotation.priceValidUntil ? new Date(quotation.priceValidUntil).toLocaleDateString('en-IN') : '15 Days'}
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="public-quote-table">
              <thead>
                <tr>
                  <th>Item / Service</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Discount</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(quotation.items || []).map((item, idx) => {
                  const lineGross = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                  const lineNet = lineGross - (lineGross * (Number(item.discount) || 0)) / 100;
                  return (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.name || item.description || `Item ${idx + 1}`}</div>
                        {item.description && item.name && (
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{item.description}</div>
                        )}
                      </td>
                      <td>{item.quantity || 1}</td>
                      <td>₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}</td>
                      <td>{item.discount ? `${item.discount}%` : '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{lineNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="public-quote-totals">
            <div className="public-quote-total-row">
              <span>Subtotal</span>
              <strong>₹{Number(quotation.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            {Number(quotation.totalDiscount) > 0 && (
              <div className="public-quote-total-row">
                <span>Discount</span>
                <span>- ₹{Number(quotation.totalDiscount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="public-quote-total-row">
              <span>GST ({quotation.taxRate || 0}%)</span>
              <span>₹{Number(quotation.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="public-quote-total-row grand">
              <span>Grand Total</span>
              <span>₹{amountTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {(quotation.paymentTerms || quotation.notes) && (
            <div style={{ marginTop: '20px', fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              {quotation.paymentTerms && (
                <div>
                  <strong>Payment Terms:</strong> {quotation.paymentTerms}
                </div>
              )}
              {quotation.notes && (
                <div>
                  <strong>Notes:</strong> {quotation.notes}
                </div>
              )}
            </div>
          )}

          {quotation.status === 'accepted' ? (
            <div
              className="public-quote-sign-box"
              style={{ background: '#f0fdf4', borderColor: '#86efac' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 700, fontSize: '16px' }}>
                <FiCheckCircle /> Approved & Digitally Signed
              </div>
              <div style={{ fontSize: '13.5px', color: '#1e293b', marginTop: '8px' }}>
                Signed by <strong>{quotation.clientSignature?.signedByName || 'Authorized Client'}</strong> on{' '}
                {quotation.clientSignature?.signedAt
                  ? new Date(quotation.clientSignature.signedAt).toLocaleString('en-IN')
                  : new Date().toLocaleString('en-IN')}
              </div>
              {quotation.clientSignature?.signatureDataUrl && (
                <img
                  src={quotation.clientSignature.signatureDataUrl}
                  alt="Client Signature"
                  style={{
                    marginTop: '10px',
                    maxHeight: '90px',
                    background: '#fff',
                    padding: '6px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                  }}
                />
              )}
            </div>
          ) : (
            <div className="public-quote-sign-box">
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiEdit3 color="#2563eb" /> Approve & Sign Quotation Online
              </h3>
              <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#64748b' }}>
                Enter your full name and draw your signature below to accept, or leave feedback to request edits.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                    Authorized Signatory Full Name *
                  </label>
                  <input
                    type="text"
                    value={signedByName}
                    onChange={(e) => setSignedByName(e.target.value)}
                    placeholder="Enter your name"
                    style={{ width: '100%', maxWidth: '480px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '480px', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Draw Digital Signature (Optional)</label>
                    <button
                      type="button"
                      onClick={clearSignature}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Clear Signature
                    </button>
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={150}
                    className="public-sign-canvas"
                    onMouseDown={startDraw}
                    onMouseMove={moveDraw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={moveDraw}
                    onTouchEnd={endDraw}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                    Comments / Revision Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Any remarks or requested revisions..."
                    style={{ width: '100%', maxWidth: '480px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleRespond('accepted')}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      color: '#fff',
                      border: 'none',
                      padding: '11px 22px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                    }}
                  >
                    <FiCheckCircle /> {submitting ? 'Submitting...' : 'Approve & Sign Quotation'}
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleRespond('rejected')}
                    style={{
                      background: '#ffffff',
                      color: '#b45309',
                      border: '1px solid #f59e0b',
                      padding: '11px 18px',
                      borderRadius: '10px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                    }}
                  >
                    <FiXCircle /> Request Revision
                  </button>
                </div>
              </div>
            </div>
          )}

          {(company?.upiId || company?.bankDetails?.accountNumber) && (
            <div className="public-payment-split">
              {company?.upiId && (
                <UpiPaymentQR
                  upiId={company.upiId}
                  payeeName={company.upiName || companyDisplayName}
                  amount={amountTotal}
                  invoiceNumber={quotation.quotationNumber}
                />
              )}

              {company?.bankDetails?.accountNumber && (
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '20px',
                    background: '#f8fafc',
                    height: 'fit-content',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px', marginBottom: '12px', color: '#0f172a' }}>
                    <FiCreditCard color="#2563eb" /> Bank Transfer Details (NEFT / IMPS / RTGS)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', color: '#334155' }}>
                    <div><strong>Account Name:</strong> {companyDisplayName}</div>
                    <div><strong>Bank Name:</strong> {company.bankDetails.bankName}</div>
                    <div><strong>Account No:</strong> {company.bankDetails.accountNumber}</div>
                    <div><strong>IFSC Code:</strong> {company.bankDetails.ifscCode}</div>
                    {company.bankDetails.branch && <div><strong>Branch:</strong> {company.bankDetails.branch}</div>}
                  </div>
                  <div style={{ marginTop: '14px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiShield /> Quote Ref: #{quotation.quotationNumber}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicQuotationView;
