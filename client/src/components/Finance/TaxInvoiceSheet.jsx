import React from 'react';
import './TaxInvoiceSheet.css';

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigitWords = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`);
const threeDigitWords = (n) => {
  const h = Math.floor(n / 100);
  const rem = n % 100;
  return [h > 0 ? `${ONES[h]} Hundred` : '', rem > 0 ? twoDigitWords(rem) : ''].filter(Boolean).join(' ');
};

const numberToIndianWords = (amount) => {
  const num = Number(amount) || 0;
  if (num <= 0) return 'Zero Only';
  const whole = Math.floor(num);
  const paise = Math.round((num - whole) * 100);
  const crore = Math.floor(whole / 10000000);
  const lakh = Math.floor((whole % 10000000) / 100000);
  const thousand = Math.floor((whole % 100000) / 1000);
  const rest = whole % 1000;
  const parts = [];
  if (crore > 0) parts.push(`${threeDigitWords(crore)} Crore`);
  if (lakh > 0) parts.push(`${twoDigitWords(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${twoDigitWords(thousand)} Thousand`);
  if (rest > 0) parts.push(threeDigitWords(rest));
  const main = parts.join(' ') || 'Zero';
  return paise > 0 ? `${main} and ${twoDigitWords(paise)} Paise Only` : `${main} Only`;
};

const formatMoney = (v) =>
  (Number(v) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (val) => {
  if (!val) return '';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const TaxInvoiceSheet = ({ invoice, sellerDetails = {}, qrDataUrl = '' }) => {
  if (!invoice) return null;

  const gd = invoice.gstDetails || {};
  const client = invoice.client || {};

  const seller = {
    legalName: sellerDetails.legalName || 'RADHIX TECHNOLOGIES PVT. LTD.',
    addressLine1: sellerDetails.addressLine1 || '',
    addressLine2: sellerDetails.addressLine2 || '',
    phone: sellerDetails.phone || '',
    email: sellerDetails.email || '',
    website: sellerDetails.website || '',
    gstin: sellerDetails.gstin || '',
    pan: sellerDetails.pan || '',
    cin: sellerDetails.cin || '',
    stateCode: sellerDetails.stateCode || '',
    logo: sellerDetails.logo || '/radhix-logo.png',
    signatureUrl: sellerDetails.signatureUrl || '',
    signatoryName: sellerDetails.signatoryName || '',
    upiId: sellerDetails.upiId || '',
    upiName: sellerDetails.upiName || '',
    declarationText:
      sellerDetails.declarationText ||
      'Certified that Particulars given above are true & correct under GST Act 2017 and amount indicated represent the price actually charged and that there is no flow of additional consideration directly or indirectly from buyer.',
    footerTerms:
      sellerDetails.footerTerms ||
      '1. Interest @24% P.A. will be charged extra if not paid within due date.\n2. Goods/Services once sold will not be accepted back.',
    jurisdiction: sellerDetails.jurisdiction || 'NEW DELHI',
    bank: sellerDetails.bank || {},
  };

  const clientAddr = [
    client.address?.street,
    [client.address?.city, client.address?.state, client.address?.zipCode].filter(Boolean).join(', '),
    client.address?.country,
  ].filter(Boolean).join('\n');

  const billedTo = {
    name: invoice.billedTo?.name || client.company || client.name || 'Valued Customer',
    address: invoice.billedTo?.address || clientAddr,
    state: invoice.billedTo?.state || client.address?.state || '',
    stateCode: invoice.billedTo?.stateCode || client.stateCode || (invoice.billedTo?.gstin || client.gstin || '').slice(0, 2),
    gstin: invoice.billedTo?.gstin || client.gstin || '',
    pan: invoice.billedTo?.pan || client.pan || ((invoice.billedTo?.gstin || client.gstin || '').length >= 12 ? (invoice.billedTo?.gstin || client.gstin).slice(2, 12) : ''),
  };

  const shippedTo = {
    name: invoice.shippedTo?.name || billedTo.name,
    address: invoice.shippedTo?.address || billedTo.address,
    state: invoice.shippedTo?.state || billedTo.state,
    stateCode: invoice.shippedTo?.stateCode || billedTo.stateCode,
    gstin: invoice.shippedTo?.gstin || billedTo.gstin,
  };

  const items = Array.isArray(invoice.items) && invoice.items.length > 0 ? invoice.items : [];
  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const shipping = Number(invoice.shipping) || 0;
  const subtotal = Number(invoice.subtotal) || items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const taxableAmount = Math.max(0, subtotal - (Number(invoice.discount) || 0) + shipping + (Number(invoice.additionalCharges) || 0));

  let cgstRate = Number(gd.cgstRate) || 0;
  let cgstAmount = Number(gd.cgstAmount) || 0;
  let sgstRate = Number(gd.sgstRate) || 0;
  let sgstAmount = Number(gd.sgstAmount) || 0;
  let igstRate = Number(gd.igstRate) || 0;
  let igstAmount = Number(gd.igstAmount) || 0;
  const roundOff = Number(gd.roundOff) || 0;

  if ((Number(invoice.tax) || 0) > 0 && cgstAmount === 0 && sgstAmount === 0 && igstAmount === 0) {
    const isInterState = Boolean(seller.stateCode && billedTo.stateCode && seller.stateCode !== billedTo.stateCode);
    if (isInterState) {
      igstRate = Number(invoice.taxRate) || 0;
      igstAmount = Number(invoice.tax) || 0;
    } else {
      cgstRate = (Number(invoice.taxRate) || 0) / 2;
      sgstRate = (Number(invoice.taxRate) || 0) / 2;
      cgstAmount = Number(((Number(invoice.tax) || 0) / 2).toFixed(2));
      sgstAmount = Number(((Number(invoice.tax) || 0) - cgstAmount).toFixed(2));
    }
  }

  const grandTotal = Number(invoice.total) || Number((taxableAmount + cgstAmount + sgstAmount + igstAmount + roundOff).toFixed(2));
  const termsLines = (invoice.terms || seller.footerTerms || '').split('\n').filter(Boolean);

  return (
    <div className="tax-invoice-sheet-wrapper">
      {/* Top Meta Strip outside border */}
      <div className="tax-inv-top-strip">
        <div className="tax-inv-top-left">
          <div><strong>GST No. :</strong> {seller.gstin || 'N/A'}</div>
          <div><strong>PAN No :</strong> {seller.pan || 'N/A'}</div>
        </div>
        <div className="tax-inv-top-center">
          <div className="tax-inv-heading">TAX INVOICE</div>
          <div className="tax-inv-subheading">(Invoice Under GST Rule-7,Section-31)</div>
        </div>
        <div className="tax-inv-top-right">
          <span>{gd.copyLabel || 'Original for Recipient'}</span>
        </div>
      </div>

      {/* Main Rounded Sheet */}
      <div className="tax-inv-outer-box">
        {/* Seller Header */}
        <div className="tax-inv-seller-header">
          <div className="tax-inv-logo-wrap">
            <img src={seller.logo || '/radhix-logo.png'} alt={seller.legalName} onError={(e) => { e.currentTarget.src = '/radhix-logo.png'; }} />
          </div>
          <div className="tax-inv-seller-info">
            <h2>{seller.legalName}</h2>
            {seller.addressLine1 && <div className="tax-inv-addr-line">{seller.addressLine1.toUpperCase()}</div>}
            {seller.addressLine2 && <div className="tax-inv-addr-line">{seller.addressLine2.toUpperCase()}</div>}
            <div className="tax-inv-contact-line">
              {seller.phone && <span>Ph. No. {seller.phone}</span>}
              {seller.email && <span>Email : {seller.email}</span>}
              {seller.website && <span>Web : {seller.website}</span>}
            </div>
            {seller.cin && <div className="tax-inv-cin-line">CIN : {seller.cin}</div>}
          </div>
        </div>

        {/* 2-Column Parties & Invoice Metadata */}
        <div className="tax-inv-parties-grid">
          <div className="tax-inv-parties-left">
            <div className="tax-inv-party-block">
              <div className="tax-inv-party-heading">Details of Customer (Billed to)</div>
              <div className="tax-inv-party-name">{billedTo.name.toUpperCase()}</div>
              <div className="tax-inv-party-addr">{billedTo.address || 'N/A'}</div>
              <div className="tax-inv-party-meta-row">
                <span><strong>State :</strong> {(billedTo.state || 'N/A').toUpperCase()}</span>
                <span><strong>State Code :</strong> {billedTo.stateCode || 'N/A'}</span>
              </div>
              <div className="tax-inv-party-meta-row">
                <span><strong>GST No. :</strong> {billedTo.gstin || 'N/A'}</span>
                <span><strong>PAN No. :</strong> {billedTo.pan || 'N/A'}</span>
              </div>
            </div>

            <div className="tax-inv-party-block tax-inv-shipped-block">
              <div className="tax-inv-party-heading">Details of Consignee (Shipped to)</div>
              <div className="tax-inv-party-name">{(shippedTo.name || billedTo.name).toUpperCase()}</div>
              <div className="tax-inv-party-addr">{shippedTo.address || billedTo.address || 'Same as Billed To'}</div>
              <div className="tax-inv-party-meta-row">
                <span><strong>State :</strong> {(shippedTo.state || billedTo.state || 'N/A').toUpperCase()}</span>
                <span><strong>State Code :</strong> {shippedTo.stateCode || billedTo.stateCode || 'N/A'}</span>
              </div>
              <div className="tax-inv-party-meta-row">
                <span><strong>GST No. :</strong> {shippedTo.gstin || billedTo.gstin || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="tax-inv-parties-right">
            <table className="tax-inv-meta-table">
              <tbody>
                <tr>
                  <td className="meta-lbl">INVOICE NO.</td>
                  <td className="meta-val"><strong>{invoice.invoiceNumber}</strong></td>
                  <td className="meta-date-lbl">Date</td>
                  <td className="meta-date-val"><strong>{formatDate(invoice.issueDate)}</strong></td>
                </tr>
                <tr>
                  <td className="meta-lbl">P. O. No.</td>
                  <td className="meta-val" colSpan={3}>{invoice.poNumber || ''}</td>
                </tr>
                <tr>
                  <td className="meta-lbl">P. O. Date</td>
                  <td className="meta-val" colSpan={3}>{formatDate(invoice.poDate)}</td>
                </tr>
                <tr>
                  <td className="meta-lbl">Vendor Code</td>
                  <td className="meta-val" colSpan={3}>{invoice.vendorCode || ''}</td>
                </tr>
                <tr>
                  <td className="meta-lbl">Project Details</td>
                  <td className="meta-val" colSpan={3}>{invoice.project || '0'}</td>
                </tr>
              </tbody>
            </table>

            <div className="tax-inv-irn-qr-box">
              <div className="tax-inv-irn-text">
                <div><strong>ACK No. :</strong></div>
                <div className="irn-val">{gd.ackNo || (invoice.dueDate ? `Due Date: ${formatDate(invoice.dueDate)}` : '-')}</div>
                <div style={{ marginTop: 8 }}><strong>ACK Date :</strong> {gd.ackDate || formatDate(invoice.issueDate)}</div>
                <div style={{ marginTop: 8 }}><strong>IRN NO. :</strong></div>
                <div className="irn-hash">{gd.irnNo || (seller.upiId ? `UPI Payee: ${seller.upiId}` : `Ref: ${invoice.invoiceNumber}`)}</div>
              </div>
              <div className="tax-inv-qr-img">
                {qrDataUrl && <img src={qrDataUrl} alt="Invoice QR" />}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="tax-inv-items-table">
          <thead>
            <tr>
              <th style={{ width: '48px' }}>S.NO.</th>
              <th>DESCRIPTION OF GOODS</th>
              <th style={{ width: '82px' }}>HSN / SAC Code</th>
              <th style={{ width: '64px' }}>Qty</th>
              <th style={{ width: '54px' }}>Unit</th>
              <th style={{ width: '96px' }}>RATE ( in Rs.)</th>
              <th style={{ width: '108px' }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const desc = [item.name, item.description]
                .filter((part, i, arr) => part && !(i === 1 && part === arr[0]))
                .join(' - ') || `Item ${idx + 1}`;
              const qty = Number(item.quantity) || 0;
              const rate = Number(item.rate) || 0;
              const amount = item.amount !== undefined && item.amount !== null ? Number(item.amount) : qty * rate;
              return (
                <tr key={idx}>
                  <td className="text-center">{idx + 1}</td>
                  <td><strong>{desc}</strong></td>
                  <td className="text-center">{item.hsnSac || ''}</td>
                  <td className="text-right">{qty.toFixed(2)}</td>
                  <td className="text-center">{(item.unit || 'NOS').toUpperCase()}</td>
                  <td className="text-right">{rate.toFixed(2)}</td>
                  <td className="text-right">{amount.toFixed(2)}</td>
                </tr>
              );
            })}
            <tr className="tax-inv-filler-row">
              <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="tax-inv-items-total-row">
              <td colSpan={2} className="no-left-border"></td>
              <td className="text-right">TOTAL:</td>
              <td className="text-right">{totalQty.toFixed(2)}</td>
              <td></td>
              <td></td>
              <td className="text-right"><strong>{formatMoney(invoice.subtotal || taxableAmount)}</strong></td>
            </tr>
          </tfoot>
        </table>

        {/* Bank / Logistics + Tax Summary Split */}
        <div className="tax-inv-bottom-split">
          <div className="tax-inv-logistics-bank">
            <div className="tax-inv-row-strip tax-inv-blank-strip"></div>
            <div className="tax-inv-row-strip tax-inv-two-col">
              <span>GR No. : {gd.grNo || ''}</span>
              <span>E-Way Form No. : {gd.ewayBillNo || ''}</span>
            </div>
            <div className="tax-inv-bank-block">
              {seller.bank?.bankName || seller.bank?.accountNumber ? (
                <>
                  <div><strong>Bank : {seller.bank.bankName || 'N/A'}</strong></div>
                  <div><strong>Branch : {seller.bank.branch || 'N/A'}</strong></div>
                  <div className="tax-inv-two-col">
                    <span><strong>A/c No : {seller.bank.accountNumber || 'N/A'}</strong></span>
                    <span><strong>IFSC Code : {seller.bank.ifscCode || 'N/A'}</strong></span>
                  </div>
                </>
              ) : (
                <div><strong>UPI Payment : {seller.upiId || 'Configure Bank Details in Settings > Branding'}</strong></div>
              )}
            </div>
            <div className="tax-inv-row-strip">
              <strong>Tax Payable on Reverse Charges : {gd.reverseCharge || 'N. A.'}</strong>
            </div>
            <div className="tax-inv-row-strip tax-inv-two-col">
              <span>Transport : {gd.transport || ''}</span>
              <span>Vehicle No. : {gd.vehicleNo || ''}</span>
            </div>
          </div>

          <div className="tax-inv-tax-summary">
            <div className="tax-sum-row"><span>Freight / Cartage</span><span>{formatMoney(shipping)}</span></div>
            <div className="tax-sum-row"><span>Taxable Amount</span><span>{formatMoney(taxableAmount)}</span></div>
            <div className="tax-sum-row"><span>CGST @ {cgstRate.toFixed(1)} %</span><span>{formatMoney(cgstAmount)}</span></div>
            <div className="tax-sum-row"><span>SGST @ {sgstRate.toFixed(1)} %</span><span>{formatMoney(sgstAmount)}</span></div>
            <div className="tax-sum-row"><span>IGST @ {igstRate.toFixed(1)} %</span><span>{formatMoney(igstAmount)}</span></div>
            <div className="tax-sum-row"><span>Round off</span><span>{formatMoney(roundOff)}</span></div>
            <div className="tax-sum-row grand"><span><strong>Grand Total (Rs.)</strong></span><span><strong>{formatMoney(grandTotal)}</strong></span></div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="tax-inv-words-strip">
          <span>Total Invoice Value (in words) Rs. : </span>
          <strong>{numberToIndianWords(grandTotal)}</strong>
        </div>

        {/* Declaration, Terms & Signatory */}
        <div className="tax-inv-footer-grid">
          <div className="tax-inv-decl-terms">
            <p className="tax-inv-decl"><strong>Declaration :</strong> {seller.declarationText}</p>
            <div className="tax-inv-terms-title">TERMS &amp; CONDITIONS :</div>
            <div className="tax-inv-terms-body">
              {termsLines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
          <div className="tax-inv-signatory-box">
            <div className="tax-inv-for-company">For {seller.legalName}</div>
            <div className="tax-inv-sign-mid">
              {seller.signatoryName && <div className="tax-inv-sign-name">{seller.signatoryName.toUpperCase()}</div>}
              {seller.signatureUrl && (
                <img src={seller.signatureUrl} alt="Authorized Signatory" className="tax-inv-sign-img" />
              )}
            </div>
            <div className="tax-inv-sign-label">Authorised Signatory</div>
          </div>
        </div>
      </div>

      {/* Jurisdiction line */}
      <div className="tax-inv-jurisdiction">
        All Disputes subject to {seller.jurisdiction} Jurisdiction only
      </div>
    </div>
  );
};

export default TaxInvoiceSheet;
