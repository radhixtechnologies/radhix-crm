import React, { useState } from 'react';
import { FiUpload, FiFileText, FiX, FiCheckCircle, FiAlertCircle, FiPlus, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { financeService, resolveServerOrigin } from '../../services/financeService';
import './ImportInvoicePdfModal.css';

const DEFAULT_FORM = {
  invoiceNumber: '',
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  poNumber: '',
  poDate: '',
  vendorCode: '',
  project: '',
  status: 'draft',
  originalFilename: '',
  billedTo: { name: '', address: '', state: '', stateCode: '', gstin: '', pan: '' },
  shippedTo: { name: '', address: '', state: '', stateCode: '', gstin: '' },
  items: [{ name: '', description: '', hsnSac: '', quantity: 1, unit: 'NOS', rate: 0, taxRate: 0, amount: 0 }],
  shipping: 0,
  subtotal: 0,
  tax: 0,
  total: 0,
  gstDetails: {
    copyLabel: 'Original for Recipient',
    cgstRate: 0,
    cgstAmount: 0,
    sgstRate: 0,
    sgstAmount: 0,
    igstRate: 0,
    igstAmount: 0,
    roundOff: 0,
    reverseCharge: 'N. A.',
    ackNo: '',
    ackDate: '',
    irnNo: '',
    grNo: '',
    ewayBillNo: '',
    transport: '',
    vehicleNo: '',
  },
  terms: '',
};

const ImportInvoicePdfModal = ({ isOpen, onClose, onImported }) => {
  const [step, setStep] = useState('upload'); // 'upload' | 'review'
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [matchedClient, setMatchedClient] = useState(null);
  const [sellerPreview, setSellerPreview] = useState(null);
  const [sameAsBilled, setSameAsBilled] = useState(true);
  const [form, setForm] = useState(DEFAULT_FORM);

  if (!isOpen) return null;

  const resetModal = () => {
    setStep('upload');
    setParsing(false);
    setSaving(false);
    setError('');
    setWarning('');
    setMatchedClient(null);
    setSellerPreview(null);
    setSameAsBilled(true);
    setForm(DEFAULT_FORM);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const recalcTotals = (nextForm) => {
    const itemsSubtotal = (nextForm.items || []).reduce(
      (sum, it) => sum + (Number(it.amount) || (Number(it.quantity) || 0) * (Number(it.rate) || 0)),
      0
    );
    const shipping = Number(nextForm.shipping) || 0;
    const gd = nextForm.gstDetails || {};
    const taxable = itemsSubtotal + shipping;

    const cgstAmt = Number(gd.cgstAmount) || Number(((taxable * (Number(gd.cgstRate) || 0)) / 100).toFixed(2));
    const sgstAmt = Number(gd.sgstAmount) || Number(((taxable * (Number(gd.sgstRate) || 0)) / 100).toFixed(2));
    const igstAmt = Number(gd.igstAmount) || Number(((taxable * (Number(gd.igstRate) || 0)) / 100).toFixed(2));
    const roundOff = Number(gd.roundOff) || 0;
    const tax = Number((cgstAmt + sgstAmt + igstAmt).toFixed(2));
    const total = Number((taxable + tax + roundOff).toFixed(2));

    return { ...nextForm, subtotal: itemsSubtotal, tax, total };
  };

  const handleFileSelected = async (file) => {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      setError('Please select a valid PDF (.pdf) invoice file.');
      return;
    }

    setError('');
    setWarning('');
    setParsing(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await financeService.parseInvoicePDF(fd);
      if (res.data?.success && res.data?.data) {
        const { parsed, matchedClient: mc, sellerPreview: sp } = res.data.data;
        setMatchedClient(mc);
        setSellerPreview(sp);

        if (!parsed.hasSelectableText) {
          setWarning('This PDF appears to be an image scan (limited selectable text). Please verify or fill the extracted fields below.');
        }

        const billed = { ...DEFAULT_FORM.billedTo, ...(parsed.billedTo || {}) };
        const shipped = { ...DEFAULT_FORM.shippedTo, ...(parsed.shippedTo || {}) };
        const isSame = !shipped.name || (shipped.name === billed.name && shipped.address === billed.address);
        setSameAsBilled(isSame);

        setForm({
          ...DEFAULT_FORM,
          ...parsed,
          billedTo: billed,
          shippedTo: shipped,
          items: Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : DEFAULT_FORM.items,
          gstDetails: { ...DEFAULT_FORM.gstDetails, ...(parsed.gstDetails || {}) },
        });
        setStep('review');
      } else {
        setError(res.data?.message || 'Failed to parse PDF invoice.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error uploading PDF.');
    } finally {
      setParsing(false);
    }
  };

  const updateBilledTo = (field, value) => {
    setForm((prev) => {
      const nextBilled = { ...prev.billedTo, [field]: value };
      return {
        ...prev,
        billedTo: nextBilled,
        shippedTo: sameAsBilled ? { ...prev.shippedTo, ...nextBilled } : prev.shippedTo,
      };
    });
  };

  const updateItem = (idx, field, value) => {
    setForm((prev) => {
      const items = [...prev.items];
      const item = { ...items[idx] };
      if (field === 'quantity' || field === 'rate' || field === 'amount') {
        item[field] = value === '' ? '' : Number(value);
        if (field === 'quantity' || field === 'rate') {
          item.amount = Number(((Number(item.quantity) || 0) * (Number(item.rate) || 0)).toFixed(2));
        }
      } else {
        item[field] = value;
        if (field === 'description' && !item.name) item.name = String(value).slice(0, 80);
      }
      items[idx] = item;
      return recalcTotals({ ...prev, items });
    });
  };

  const updateGstRate = (rateField, amtField, rawVal) => {
    const rate = Number(rawVal) || 0;
    setForm((prev) => {
      const taxable = (Number(prev.subtotal) || 0) + (Number(prev.shipping) || 0);
      const amt = Number(((taxable * rate) / 100).toFixed(2));
      return recalcTotals({
        ...prev,
        gstDetails: { ...prev.gstDetails, [rateField]: rate, [amtField]: amt },
      });
    });
  };

  const updateGstAmount = (amtField, rawVal) => {
    const amt = Number(rawVal) || 0;
    setForm((prev) => recalcTotals({
      ...prev,
      gstDetails: { ...prev.gstDetails, [amtField]: amt },
    }));
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!form.billedTo?.name?.trim()) {
      setError('Customer (Billed to) name is required.');
      return;
    }
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...form,
        client: matchedClient?._id || undefined,
        shippedTo: sameAsBilled ? { ...form.billedTo } : form.shippedTo,
      };
      const res = await financeService.importInvoicePDF(payload);
      if (res.data?.success) {
        const createdInvoice = res.data.data;
        const pdfUrl = res.data.pdfUrl || createdInvoice?.pdfUrl;
        if (pdfUrl) {
          const origin = resolveServerOrigin();
          const fullUrl = pdfUrl.startsWith('http') ? pdfUrl : `${origin}${pdfUrl.startsWith('/') ? pdfUrl : `/${pdfUrl}`}`;
          window.open(fullUrl, '_blank');
        }
        resetModal();
        onImported?.(createdInvoice);
      } else {
        setError(res.data?.message || 'Failed to import invoice.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error saving imported invoice.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pdf-imp-backdrop" onClick={handleClose}>
      <div className="pdf-imp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-imp-header">
          <div>
            <h3><FiFileText /> Import Invoice PDF &amp; Convert to GST Tax Invoice</h3>
            <p>Upload any PDF invoice to extract fields and generate your standardized GST Tax Invoice format</p>
          </div>
          <button type="button" className="pdf-imp-close" onClick={handleClose}><FiX /></button>
        </div>

        <div className="pdf-imp-body">
          {error && (
            <div className="pdf-imp-alert error"><FiAlertCircle /> <span>{error}</span></div>
          )}
          {warning && (
            <div className="pdf-imp-alert warn"><FiAlertCircle /> <span>{warning}</span></div>
          )}

          {step === 'upload' && (
            <div
              className="pdf-imp-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileSelected(e.dataTransfer.files[0]);
              }}
            >
              <FiUpload size={40} className="pdf-imp-upload-icon" />
              <h4>{parsing ? 'Reading PDF Invoice...' : 'Drop Invoice PDF Here or Click to Browse'}</h4>
              <p>Extracts Invoice #, Billed To, Shipped To, HSN/SAC items, CGST/SGST/IGST, IRN &amp; totals automatically</p>
              <label className="btn btn-primary" style={{ marginTop: 12, cursor: parsing ? 'wait' : 'pointer' }}>
                {parsing ? 'Parsing PDF...' : 'Select PDF File'}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  style={{ display: 'none' }}
                  disabled={parsing}
                  onChange={(e) => handleFileSelected(e.target.files?.[0])}
                />
              </label>
            </div>
          )}

          {step === 'review' && (
            <form onSubmit={handleImportSubmit} className="pdf-imp-form">
              {sellerPreview && (
                <div className="pdf-imp-seller-banner">
                  <div>
                    <FiCheckCircle color="#059669" /> Seller Header: <strong>{sellerPreview.legalName}</strong>
                    {sellerPreview.gstin ? ` (GST: ${sellerPreview.gstin})` : ' — Set GST/PAN/Bank in Settings > Branding'}
                  </div>
                  {matchedClient ? (
                    <span className="pdf-imp-badge">Matched CRM Client: {matchedClient.company || matchedClient.name}</span>
                  ) : (
                    <span className="pdf-imp-badge new">Will Auto-Create New CRM Client</span>
                  )}
                </div>
              )}

              {/* Meta Section */}
              <div className="pdf-imp-grid-4">
                <div>
                  <label>Invoice No. *</label>
                  <input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="Auto-generate if empty" />
                </div>
                <div>
                  <label>Invoice Date *</label>
                  <input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} required />
                </div>
                <div>
                  <label>Due Date *</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
                </div>
                <div>
                  <label>Project Details</label>
                  <input value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} placeholder="Project / Ref" />
                </div>
                <div>
                  <label>P.O. No.</label>
                  <input value={form.poNumber} onChange={(e) => setForm({ ...form, poNumber: e.target.value })} />
                </div>
                <div>
                  <label>P.O. Date</label>
                  <input type="date" value={form.poDate} onChange={(e) => setForm({ ...form, poDate: e.target.value })} />
                </div>
                <div>
                  <label>Vendor Code</label>
                  <input value={form.vendorCode} onChange={(e) => setForm({ ...form, vendorCode: e.target.value })} />
                </div>
                <div>
                  <label>Copy Label</label>
                  <select value={form.gstDetails.copyLabel} onChange={(e) => setForm({ ...form, gstDetails: { ...form.gstDetails, copyLabel: e.target.value } })}>
                    <option value="Original for Recipient">Original for Recipient</option>
                    <option value="Duplicate for Transporter">Duplicate for Transporter</option>
                    <option value="Triplicate for Supplier">Triplicate for Supplier</option>
                  </select>
                </div>
              </div>

              {/* Parties */}
              <div className="pdf-imp-parties">
                <div className="pdf-imp-card">
                  <h4>Details of Customer (Billed to)</h4>
                  <label>Customer / Company Name *</label>
                  <input value={form.billedTo.name} onChange={(e) => updateBilledTo('name', e.target.value)} required />
                  <label>Billing Address</label>
                  <textarea rows={2} value={form.billedTo.address} onChange={(e) => updateBilledTo('address', e.target.value)} />
                  <div className="pdf-imp-grid-2">
                    <div>
                      <label>State</label>
                      <input value={form.billedTo.state} onChange={(e) => updateBilledTo('state', e.target.value)} />
                    </div>
                    <div>
                      <label>State Code</label>
                      <input value={form.billedTo.stateCode} onChange={(e) => updateBilledTo('stateCode', e.target.value)} />
                    </div>
                    <div>
                      <label>GST No.</label>
                      <input value={form.billedTo.gstin} onChange={(e) => updateBilledTo('gstin', e.target.value.toUpperCase())} />
                    </div>
                    <div>
                      <label>PAN No.</label>
                      <input value={form.billedTo.pan} onChange={(e) => updateBilledTo('pan', e.target.value.toUpperCase())} />
                    </div>
                  </div>
                </div>

                <div className="pdf-imp-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>Details of Consignee (Shipped to)</h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, margin: 0, cursor: 'pointer' }}>
                      <input type="checkbox" checked={sameAsBilled} onChange={(e) => setSameAsBilled(e.target.checked)} />
                      Same as Billed To
                    </label>
                  </div>
                  <label>Consignee Name</label>
                  <input
                    disabled={sameAsBilled}
                    value={sameAsBilled ? form.billedTo.name : form.shippedTo.name}
                    onChange={(e) => setForm({ ...form, shippedTo: { ...form.shippedTo, name: e.target.value } })}
                  />
                  <label>Shipping Address</label>
                  <textarea
                    rows={2}
                    disabled={sameAsBilled}
                    value={sameAsBilled ? form.billedTo.address : form.shippedTo.address}
                    onChange={(e) => setForm({ ...form, shippedTo: { ...form.shippedTo, address: e.target.value } })}
                  />
                  <div className="pdf-imp-grid-2">
                    <div>
                      <label>State</label>
                      <input
                        disabled={sameAsBilled}
                        value={sameAsBilled ? form.billedTo.state : form.shippedTo.state}
                        onChange={(e) => setForm({ ...form, shippedTo: { ...form.shippedTo, state: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label>State Code</label>
                      <input
                        disabled={sameAsBilled}
                        value={sameAsBilled ? form.billedTo.stateCode : form.shippedTo.stateCode}
                        onChange={(e) => setForm({ ...form, shippedTo: { ...form.shippedTo, stateCode: e.target.value } })}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label>GST No.</label>
                      <input
                        disabled={sameAsBilled}
                        value={sameAsBilled ? form.billedTo.gstin : form.shippedTo.gstin}
                        onChange={(e) => setForm({ ...form, shippedTo: { ...form.shippedTo, gstin: e.target.value.toUpperCase() } })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="pdf-imp-items-head">
                <h4>Goods / Services Items</h4>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => setForm((p) => ({
                    ...p,
                    items: [...p.items, { name: '', description: '', hsnSac: '', quantity: 1, unit: 'NOS', rate: 0, taxRate: 0, amount: 0 }],
                  }))}
                >
                  <FiPlus /> Add Row
                </button>
              </div>
              <div className="pdf-imp-table-wrap">
                <table className="pdf-imp-table">
                  <thead>
                    <tr>
                      <th>Description of Goods / Services</th>
                      <th style={{ width: 92 }}>HSN/SAC</th>
                      <th style={{ width: 72 }}>Qty</th>
                      <th style={{ width: 72 }}>Unit</th>
                      <th style={{ width: 108 }}>Rate (Rs.)</th>
                      <th style={{ width: 112 }}>Amount (Rs.)</th>
                      <th style={{ width: 38 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            value={item.description || item.name}
                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                            placeholder="Description of goods/service"
                            required
                          />
                        </td>
                        <td><input value={item.hsnSac || ''} onChange={(e) => updateItem(idx, 'hsnSac', e.target.value)} /></td>
                        <td><input type="number" step="0.01" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} /></td>
                        <td><input value={item.unit || 'NOS'} onChange={(e) => updateItem(idx, 'unit', e.target.value)} /></td>
                        <td><input type="number" step="0.01" value={item.rate} onChange={(e) => updateItem(idx, 'rate', e.target.value)} /></td>
                        <td><input type="number" step="0.01" value={item.amount} onChange={(e) => updateItem(idx, 'amount', e.target.value)} /></td>
                        <td>
                          <button
                            type="button"
                            className="pdf-imp-del-row"
                            onClick={() => setForm((p) => recalcTotals({
                              ...p,
                              items: p.items.length > 1 ? p.items.filter((_, i) => i !== idx) : p.items,
                            }))}
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tax, E-Invoice & Transport */}
              <div className="pdf-imp-parties" style={{ marginTop: 14 }}>
                <div className="pdf-imp-card">
                  <h4>E-Invoice &amp; Transport Details</h4>
                  <div className="pdf-imp-grid-2">
                    <div>
                      <label>ACK No.</label>
                      <input value={form.gstDetails.ackNo} onChange={(e) => setForm({ ...form, gstDetails: { ...form.gstDetails, ackNo: e.target.value } })} />
                    </div>
                    <div>
                      <label>ACK Date</label>
                      <input value={form.gstDetails.ackDate} onChange={(e) => setForm({ ...form, gstDetails: { ...form.gstDetails, ackDate: e.target.value } })} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label>IRN No.</label>
                      <input value={form.gstDetails.irnNo} onChange={(e) => setForm({ ...form, gstDetails: { ...form.gstDetails, irnNo: e.target.value } })} />
                    </div>
                    <div>
                      <label>GR No.</label>
                      <input value={form.gstDetails.grNo} onChange={(e) => setForm({ ...form, gstDetails: { ...form.gstDetails, grNo: e.target.value } })} />
                    </div>
                    <div>
                      <label>E-Way Form No.</label>
                      <input value={form.gstDetails.ewayBillNo} onChange={(e) => setForm({ ...form, gstDetails: { ...form.gstDetails, ewayBillNo: e.target.value } })} />
                    </div>
                    <div>
                      <label>Transport</label>
                      <input value={form.gstDetails.transport} onChange={(e) => setForm({ ...form, gstDetails: { ...form.gstDetails, transport: e.target.value } })} />
                    </div>
                    <div>
                      <label>Vehicle No.</label>
                      <input value={form.gstDetails.vehicleNo} onChange={(e) => setForm({ ...form, gstDetails: { ...form.gstDetails, vehicleNo: e.target.value } })} />
                    </div>
                  </div>
                </div>

                <div className="pdf-imp-card">
                  <h4>GST &amp; Grand Total Summary</h4>
                  <div className="pdf-imp-grid-2">
                    <div>
                      <label>Freight / Cartage (Rs.)</label>
                      <input type="number" step="0.01" value={form.shipping} onChange={(e) => setForm((p) => recalcTotals({ ...p, shipping: Number(e.target.value) || 0 }))} />
                    </div>
                    <div>
                      <label>Taxable Amount (Rs.)</label>
                      <input type="number" readOnly value={(Number(form.subtotal || 0) + Number(form.shipping || 0)).toFixed(2)} />
                    </div>
                    <div>
                      <label>CGST %</label>
                      <input type="number" step="0.1" value={form.gstDetails.cgstRate} onChange={(e) => updateGstRate('cgstRate', 'cgstAmount', e.target.value)} />
                    </div>
                    <div>
                      <label>CGST Amt (Rs.)</label>
                      <input type="number" step="0.01" value={form.gstDetails.cgstAmount} onChange={(e) => updateGstAmount('cgstAmount', e.target.value)} />
                    </div>
                    <div>
                      <label>SGST %</label>
                      <input type="number" step="0.1" value={form.gstDetails.sgstRate} onChange={(e) => updateGstRate('sgstRate', 'sgstAmount', e.target.value)} />
                    </div>
                    <div>
                      <label>SGST Amt (Rs.)</label>
                      <input type="number" step="0.01" value={form.gstDetails.sgstAmount} onChange={(e) => updateGstAmount('sgstAmount', e.target.value)} />
                    </div>
                    <div>
                      <label>IGST %</label>
                      <input type="number" step="0.1" value={form.gstDetails.igstRate} onChange={(e) => updateGstRate('igstRate', 'igstAmount', e.target.value)} />
                    </div>
                    <div>
                      <label>IGST Amt (Rs.)</label>
                      <input type="number" step="0.01" value={form.gstDetails.igstAmount} onChange={(e) => updateGstAmount('igstAmount', e.target.value)} />
                    </div>
                    <div>
                      <label>Round off (Rs.)</label>
                      <input type="number" step="0.01" value={form.gstDetails.roundOff} onChange={(e) => updateGstAmount('roundOff', e.target.value)} />
                    </div>
                    <div>
                      <label>Grand Total (Rs.)</label>
                      <input type="number" step="0.01" style={{ fontWeight: 700 }} value={form.total} onChange={(e) => setForm({ ...form, total: Number(e.target.value) || 0 })} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pdf-imp-footer">
                <button type="button" className="btn btn-outline" onClick={() => setStep('upload')} disabled={saving}>
                  Upload Different PDF
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Generating Tax Invoice...' : <><FiExternalLink /> Import &amp; Generate Tax Invoice PDF</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportInvoicePdfModal;
