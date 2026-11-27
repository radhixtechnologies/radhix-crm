const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const DEFAULT_LOGO_PATH = path.join(__dirname, 'radhix-technologies-logo.png');

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigitWords = (n) => {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`;
};

const threeDigitWords = (n) => {
  const hundreds = Math.floor(n / 100);
  const rem = n % 100;
  const parts = [];
  if (hundreds > 0) parts.push(`${ONES[hundreds]} Hundred`);
  if (rem > 0) parts.push(twoDigitWords(rem));
  return parts.join(' ');
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

  const mainText = parts.length > 0 ? parts.join(' ') : 'Zero';
  if (paise > 0) {
    return `${mainText} and ${twoDigitWords(paise)} Paise Only`;
  }
  return `${mainText} Only`;
};

const formatIndianMoney = (value, decimals = 2) => {
  const num = Number(value) || 0;
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatDateDMY = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const loadImageBuffer = async (src, fallbackPath = null) => {
  if (src) {
    if (src.startsWith('data:image/')) {
      const base64Part = src.split(',')[1];
      if (base64Part) return Buffer.from(base64Part, 'base64');
    } else if (/^https?:\/\//i.test(src)) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const resp = await fetch(src, { signal: controller.signal });
        clearTimeout(timer);
        if (resp.ok) {
          const arr = await resp.arrayBuffer();
          return Buffer.from(arr);
        }
      } catch {
        // Fallback below
      }
    } else if (fs.existsSync(src)) {
      return fs.readFileSync(src);
    }
  }
  if (fallbackPath && fs.existsSync(fallbackPath)) {
    return fs.readFileSync(fallbackPath);
  }
  return null;
};

const resolveSellerDetails = (company = {}) => {
  const b = company?.branding || {};
  const addr = company?.address || {};
  const bank = company?.bankDetails || {};

  const rawName = (b.companyDisplayName || company?.name || '').trim();
  const useDefaultBrand = !rawName || /super admin/i.test(rawName);
  const legalName = useDefaultBrand
    ? (process.env.COMPANY_NAME || 'RADHIX TECHNOLOGIES PVT. LTD.')
    : rawName.toUpperCase();

  const addressLine1 = [addr.street, addr.city].filter(Boolean).join(', ');
  const addressLine2 = [
    addr.state || company?.stateName,
    addr.postalCode ? `- ${addr.postalCode}` : '',
    addr.country && addr.country !== 'India' ? addr.country : '',
  ].filter(Boolean).join(' ').trim();

  const cityUpper = (addr.city || b.jurisdiction || 'NEW DELHI').toUpperCase();

  return {
    legalName,
    addressLine1: addressLine1 || 'Registered Office',
    addressLine2: addressLine2 || '',
    phone: company?.phone || b.supportPhone || '',
    email: company?.email || b.supportEmail || '',
    website: company?.website || '',
    gstin: company?.gstin || '',
    pan: company?.pan || (company?.gstin && company.gstin.length >= 12 ? company.gstin.slice(2, 12) : ''),
    cin: company?.cin || '',
    stateName: company?.stateName || addr.state || '',
    stateCode: company?.stateCode || (company?.gstin ? company.gstin.slice(0, 2) : ''),
    logo: b.logo || company?.logo || '',
    signatureUrl: b.signatureUrl || '',
    signatoryName: b.signatoryName || '',
    upiId: company?.upiId || '',
    upiName: company?.upiName || legalName,
    declarationText: b.declarationText || 'Certified that Particulars given above are true & correct under GST Act 2017 and amount indicated represent the price actually charged and that there is no flow of additional consideration directly or indirectly from buyer.',
    footerTerms: b.invoiceFooterTerms || '1. Interest @24% P.A. will be charged extra if not paid within due date.\n2. Goods/Services once sold will not be accepted back.',
    jurisdiction: (b.jurisdiction || cityUpper).toUpperCase(),
    bank: {
      bankName: bank.bankName || '',
      branch: bank.branch || '',
      accountNumber: bank.accountNumber || '',
      ifscCode: bank.ifscCode || '',
    },
  };
};

const formatPartyAddress = (client = {}, partySnapshot = {}) => {
  if (partySnapshot?.address) return partySnapshot.address;
  const addr = client?.address || {};
  return [
    addr.street,
    [addr.city, addr.state, addr.zipCode].filter(Boolean).join(', '),
    addr.country,
  ].filter(Boolean).join('\n');
};

const deriveTaxBreakdown = (invoice, sellerStateCode) => {
  const gd = invoice.gstDetails || {};
  const shipping = Number(invoice.shipping) || 0;
  const additional = Number(invoice.additionalCharges) || 0;
  const subtotal = Number(invoice.subtotal) || 0;
  const discount = Number(invoice.discount) || 0;
  const taxableAmount = Math.max(0, subtotal - discount + shipping + additional);

  let cgstRate = Number(gd.cgstRate) || 0;
  let cgstAmount = Number(gd.cgstAmount) || 0;
  let sgstRate = Number(gd.sgstRate) || 0;
  let sgstAmount = Number(gd.sgstAmount) || 0;
  let igstRate = Number(gd.igstRate) || 0;
  let igstAmount = Number(gd.igstAmount) || 0;
  const roundOff = Number(gd.roundOff) || 0;

  // Fallback for standard CRM invoices that only store `tax` and `taxRate`
  const storedTax = Number(invoice.tax) || 0;
  const storedTaxRate = Number(invoice.taxRate) || 0;
  if (storedTax > 0 && cgstAmount === 0 && sgstAmount === 0 && igstAmount === 0) {
    const buyerCode = invoice.billedTo?.stateCode || (invoice.billedTo?.gstin ? invoice.billedTo.gstin.slice(0, 2) : '');
    const isInterState = Boolean(sellerStateCode && buyerCode && sellerStateCode !== buyerCode);
    if (isInterState) {
      igstRate = storedTaxRate;
      igstAmount = storedTax;
    } else {
      cgstRate = storedTaxRate / 2;
      sgstRate = storedTaxRate / 2;
      cgstAmount = Number((storedTax / 2).toFixed(2));
      sgstAmount = Number((storedTax - cgstAmount).toFixed(2));
    }
  }

  const grandTotal = Number(invoice.total) || Number((taxableAmount + cgstAmount + sgstAmount + igstAmount + roundOff).toFixed(2));
  return {
    shipping,
    taxableAmount,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    roundOff,
    grandTotal,
  };
};

const buildQrPayload = (invoice, seller, totals) => {
  const gd = invoice.gstDetails || {};
  if (gd.irnNo) {
    return JSON.stringify({
      Irn: gd.irnNo,
      AckNo: gd.ackNo || '',
      AckDt: gd.ackDate || '',
      SellerGstin: seller.gstin || '',
      BuyerGstin: invoice.billedTo?.gstin || '',
      DocNo: invoice.invoiceNumber || '',
      TotInvVal: totals.grandTotal,
    });
  }
  if (seller.upiId) {
    return `upi://pay?pa=${encodeURIComponent(seller.upiId)}&pn=${encodeURIComponent(seller.upiName || seller.legalName)}&am=${totals.grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Invoice ${invoice.invoiceNumber}`)}`;
  }
  return `TAX INVOICE|${seller.legalName}|GST:${seller.gstin || 'NA'}|INV:${invoice.invoiceNumber}|DATE:${formatDateDMY(invoice.issueDate)}|AMT:${totals.grandTotal.toFixed(2)}`;
};

const generateInvoiceQrBuffer = async (invoice, seller, totals) => {
  try {
    return await QRCode.toBuffer(buildQrPayload(invoice, seller, totals), {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 140,
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch {
    return null;
  }
};

exports.generateInvoiceQrDataUrl = async (invoice, company = {}) => {
  try {
    const seller = resolveSellerDetails(company);
    const totals = deriveTaxBreakdown(invoice, seller.stateCode);
    return await QRCode.toDataURL(buildQrPayload(invoice, seller, totals), {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 140,
    });
  } catch {
    return null;
  }
};

/**
 * Generates an Indian GST Rule-7 / Section-31 Tax Invoice PDF matching the classic Tally/e-Invoice grid.
 */
exports.generateGstTaxInvoicePDF = async (invoice, client = {}, company = {}) => {
  const seller = resolveSellerDetails(company);
  const gd = invoice.gstDetails || {};
  const totals = deriveTaxBreakdown(invoice, seller.stateCode);

  const [logoBuffer, signBuffer, qrBuffer] = await Promise.all([
    loadImageBuffer(seller.logo, DEFAULT_LOGO_PATH),
    loadImageBuffer(seller.signatureUrl, null),
    generateInvoiceQrBuffer(invoice, seller, totals),
  ]);

  const billedTo = {
    name: invoice.billedTo?.name || client?.company || client?.name || 'Valued Customer',
    address: formatPartyAddress(client, invoice.billedTo),
    state: invoice.billedTo?.state || client?.address?.state || '',
    stateCode: invoice.billedTo?.stateCode || client?.stateCode || (invoice.billedTo?.gstin || client?.gstin || '').slice(0, 2),
    gstin: invoice.billedTo?.gstin || client?.gstin || '',
    pan: invoice.billedTo?.pan || client?.pan || ((invoice.billedTo?.gstin || client?.gstin || '').length >= 12 ? (invoice.billedTo?.gstin || client?.gstin).slice(2, 12) : ''),
  };

  const shippedTo = {
    name: invoice.shippedTo?.name || billedTo.name,
    address: invoice.shippedTo?.address || billedTo.address,
    state: invoice.shippedTo?.state || billedTo.state,
    stateCode: invoice.shippedTo?.stateCode || billedTo.stateCode,
    gstin: invoice.shippedTo?.gstin || billedTo.gstin,
  };

  const uploadsDir = path.join(__dirname, '../../uploads/invoices');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const safeInvNum = String(invoice.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9._-]+/g, '-');
  const fileName = `invoice_${safeInvNum}_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    stream.on('error', reject);
    doc.on('error', reject);

    const LEFT = 26;
    const WIDTH = 543;
    const RIGHT = LEFT + WIDTH;
    const LINE_COLOR = '#111827';
    doc.strokeColor(LINE_COLOR).lineWidth(0.75);

    const hLine = (y, x1 = LEFT, x2 = RIGHT) => {
      doc.moveTo(x1, y).lineTo(x2, y).strokeColor(LINE_COLOR).lineWidth(0.7).stroke();
    };
    const vLine = (x, y1, y2) => {
      doc.moveTo(x, y1).lineTo(x, y2).strokeColor(LINE_COLOR).lineWidth(0.7).stroke();
    };

    // ─── TOP STRIP (OUTSIDE BORDER) ───
    doc.fillColor('#000000').font('Helvetica').fontSize(8.5)
      .text(`GST No. :  ${seller.gstin || 'N/A'}`, LEFT, 20, { width: 175 })
      .text(`PAN No :   ${seller.pan || 'N/A'}`, LEFT, 32, { width: 175 });

    doc.font('Helvetica-Bold').fontSize(10.5)
      .text('TAX INVOICE', LEFT + 170, 19, { width: 200, align: 'center', underline: true });
    doc.font('Helvetica').fontSize(7.8)
      .text('(Invoice Under GST Rule-7,Section-31)', LEFT + 170, 32, { width: 200, align: 'center' });

    doc.font('Helvetica').fontSize(8.5)
      .text(gd.copyLabel || 'Original for Recipient', RIGHT - 150, 20, { width: 150, align: 'right', underline: true });

    // Start Y of main outer rounded container
    const BOX_TOP = 46;
    const BOX_BOTTOM = 812;
    let y = BOX_TOP;

    // ─── HEADER SECTION ───
    const headerHeight = 72;
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, LEFT + 8, y + 6, { fit: [78, 58], align: 'center', valign: 'center' });
      } catch {
        // Ignore invalid image buffers
      }
    }

    const headerTextX = LEFT + 94;
    const headerTextW = WIDTH - 102;
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#000000')
      .text(seller.legalName, headerTextX, y + 7, { width: headerTextW, align: 'center' });

    let hy = y + 26;
    doc.font('Helvetica-Bold').fontSize(8.5);
    if (seller.addressLine1) {
      doc.text(seller.addressLine1.toUpperCase(), headerTextX, hy, { width: headerTextW, align: 'center' });
      hy += 10;
    }
    if (seller.addressLine2) {
      doc.text(seller.addressLine2.toUpperCase(), headerTextX, hy, { width: headerTextW, align: 'center' });
      hy += 10;
    }

    const contactParts = [];
    if (seller.phone) contactParts.push(`Ph. No. ${seller.phone}`);
    if (seller.email) contactParts.push(`Email : ${seller.email}`);
    if (seller.website) contactParts.push(`Web : ${seller.website}`);
    if (contactParts.length > 0) {
      doc.font('Helvetica').fontSize(7.5)
        .text(contactParts.join('  '), headerTextX, hy, { width: headerTextW, align: 'center' });
      hy += 10;
    }
    if (seller.cin) {
      doc.font('Helvetica-Bold').fontSize(8.5)
        .text(`CIN : ${seller.cin}`, headerTextX, hy, { width: headerTextW, align: 'center' });
    }

    y += headerHeight;
    hLine(y);

    // ─── 2-COLUMN PARTIES & META SECTION ───
    const SPLIT_X = LEFT + 262;
    const leftW = SPLIT_X - LEFT - 12;
    const rightX = SPLIT_X;
    const rightW = RIGHT - SPLIT_X;

    // Measure Left Column (Billed To + Shipped To)
    const billAddrH = Math.min(48, Math.max(14, doc.font('Helvetica').fontSize(8).heightOfString(billedTo.address || '-', { width: leftW })));
    const shipAddrH = Math.min(44, Math.max(14, doc.font('Helvetica').fontSize(8).heightOfString(shippedTo.address || '-', { width: leftW })));
    const leftTotalH = (16 + 13 + billAddrH + 26) + (16 + 13 + shipAddrH + 24) + 10;

    // Right Column fixed meta rows (5 rows * 16 = 80) + QR block (~112) = 192
    const META_ROWS_H = 80;
    const QR_BLOCK_H = 112;
    const partiesSectionH = Math.max(leftTotalH, META_ROWS_H + QR_BLOCK_H);
    const partiesEndY = y + partiesSectionH;

    // Vertical divider
    vLine(SPLIT_X, y, partiesEndY);

    // Draw Left: Billed To
    let ly = y + 5;
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#000000')
      .text('Details of Customer (Billed to)', LEFT + 6, ly, { width: leftW, underline: true });
    ly += 14;
    doc.font('Helvetica-Bold').fontSize(9)
      .text(billedTo.name.toUpperCase(), LEFT + 6, ly, { width: leftW, lineBreak: false });
    ly += 13;
    doc.font('Helvetica').fontSize(8)
      .text(billedTo.address || 'N/A', LEFT + 6, ly, { width: leftW, height: billAddrH + 4 });
    ly += billAddrH + 4;
    doc.font('Helvetica-Bold').fontSize(8)
      .text(`State :  ${(billedTo.state || 'N/A').toUpperCase()}`, LEFT + 6, ly, { width: 155 })
      .text(`State Code :  ${billedTo.stateCode || 'N/A'}`, LEFT + 165, ly, { width: 92 });
    ly += 11;
    doc.text(`GST No. :  ${billedTo.gstin || 'N/A'}`, LEFT + 6, ly, { width: 145 })
      .text(`PAN No. :  ${billedTo.pan || 'N/A'}`, LEFT + 152, ly, { width: 105 });
    ly += 14;

    hLine(ly, LEFT, SPLIT_X);
    ly += 5;

    // Draw Left: Shipped To
    doc.font('Helvetica-Bold').fontSize(9.5)
      .text('Details of Consignee (Shipped to)', LEFT + 6, ly, { width: leftW, underline: true });
    ly += 14;
    doc.font('Helvetica-Bold').fontSize(9)
      .text((shippedTo.name || billedTo.name).toUpperCase(), LEFT + 6, ly, { width: leftW, lineBreak: false });
    ly += 13;
    doc.font('Helvetica').fontSize(8)
      .text(shippedTo.address || billedTo.address || 'Same as Billed To', LEFT + 6, ly, { width: leftW, height: shipAddrH + 4 });
    ly += shipAddrH + 4;
    doc.font('Helvetica-Bold').fontSize(8)
      .text(`State :  ${(shippedTo.state || billedTo.state || 'N/A').toUpperCase()}`, LEFT + 6, ly, { width: 155 })
      .text(`State Code :  ${shippedTo.stateCode || billedTo.stateCode || 'N/A'}`, LEFT + 165, ly, { width: 92 });
    ly += 11;
    doc.text(`GST No. :  ${shippedTo.gstin || billedTo.gstin || 'N/A'}`, LEFT + 6, ly, { width: leftW });

    // Draw Right: 5 Metadata Rows
    let ry = y;
    const ROW_H = 16;
    const LABEL_SPLIT = rightX + 82;
    const DATE_COL_X = rightX + 188;
    const DATE_VAL_X = rightX + 216;

    // Row 1: INVOICE NO. | value | Date | value
    hLine(ry + ROW_H, rightX, RIGHT);
    vLine(LABEL_SPLIT, ry, ry + META_ROWS_H);
    vLine(DATE_COL_X, ry, ry + ROW_H);
    vLine(DATE_VAL_X, ry, ry + ROW_H);

    doc.font('Helvetica-Bold').fontSize(8.2)
      .text('INVOICE NO.', rightX + 5, ry + 4, { width: 74 })
      .text(invoice.invoiceNumber || '', LABEL_SPLIT + 5, ry + 4, { width: 100, lineBreak: false })
      .text('Date', DATE_COL_X + 3, ry + 4, { width: 25 })
      .text(formatDateDMY(invoice.issueDate), DATE_VAL_X + 3, ry + 4, { width: 58, lineBreak: false });
    ry += ROW_H;

    const metaRows = [
      ['P. O. No.', invoice.poNumber || ''],
      ['P. O. Date', formatDateDMY(invoice.poDate)],
      ['Vendor Code', invoice.vendorCode || ''],
      ['Project Details', invoice.project || '0'],
    ];

    metaRows.forEach(([label, val]) => {
      hLine(ry + ROW_H, rightX, RIGHT);
      doc.font('Helvetica-Bold').fontSize(8.2)
        .text(label, rightX + 5, ry + 4, { width: 74 })
        .font('Helvetica-Bold').fontSize(8.2)
        .text(String(val), LABEL_SPLIT + 5, ry + 4, { width: rightW - 90, lineBreak: false });
      ry += ROW_H;
    });

    // Draw Right Bottom: ACK No / ACK Date / IRN No + QR Code
    const qrTextX = rightX + 6;
    const qrTextW = 168;
    doc.font('Helvetica-Bold').fontSize(8)
      .text('ACK No. :', qrTextX, ry + 6, { width: qrTextW })
      .text(gd.ackNo || (invoice.dueDate ? `Due: ${formatDateDMY(invoice.dueDate)}` : '-'), qrTextX, ry + 18, { width: qrTextW })
      .text(`ACK Date : ${gd.ackDate || formatDateDMY(invoice.issueDate)}`, qrTextX, ry + 38, { width: qrTextW })
      .text('IRN NO. :', qrTextX, ry + 56, { width: qrTextW });

    doc.font('Helvetica-Bold').fontSize(7.6)
      .text(gd.irnNo || (seller.upiId ? `UPI Payee: ${seller.upiId}` : `Ref: ${invoice.invoiceNumber}`), qrTextX, ry + 68, {
        width: qrTextW,
        height: 40,
      });

    if (qrBuffer) {
      doc.image(qrBuffer, RIGHT - 102, ry + 6, { fit: [94, 94], align: 'center', valign: 'center' });
    }

    y = partiesEndY;
    hLine(y);

    // ─── ITEMS TABLE ───
    const COLS = [
      { key: 'sno', label: 'S.NO.', w: 32, align: 'center' },
      { key: 'desc', label: 'DESCRIPTION OF GOODS', w: 234, align: 'left' },
      { key: 'hsn', label: 'HSN / SAC\nCode', w: 54, align: 'center' },
      { key: 'qty', label: 'Qty', w: 46, align: 'right' },
      { key: 'unit', label: 'Unit', w: 34, align: 'center' },
      { key: 'rate', label: 'RATE\n( in Rs.)', w: 68, align: 'right' },
      { key: 'amt', label: 'AMOUNT', w: 75, align: 'right' },
    ];
    // Pre-compute column boundaries (total = 543)
    const colStarts = [LEFT];
    COLS.forEach((c, idx) => {
      colStarts.push(colStarts[idx] + c.w);
    });

    const TABLE_HEADER_H = 26;
    const TOTALS_ROW_H = 18;
    const BOTTOM_SECTIONS_H = 228; // Totals split (108) + Words (20) + Declaration/Sign (100)
    const ITEMS_AREA_END_Y = BOX_BOTTOM - BOTTOM_SECTIONS_H;
    const itemsGridTop = y;

    // Header text
    let cx = LEFT;
    COLS.forEach((col) => {
      doc.font('Helvetica-Bold').fontSize(7.8).fillColor('#000000')
        .text(col.label, cx + 3, y + 5, { width: col.w - 6, align: 'center' });
      cx += col.w;
    });
    y += TABLE_HEADER_H;
    hLine(y);

    const items = Array.isArray(invoice.items) && invoice.items.length > 0
      ? invoice.items
      : [{ name: invoice.project || 'Services', description: '', hsnSac: '', quantity: 1, unit: 'NOS', rate: invoice.subtotal || 0, amount: invoice.subtotal || 0 }];

    let totalQty = 0;
    const maxItemY = ITEMS_AREA_END_Y - TOTALS_ROW_H - 4;

    items.forEach((item, index) => {
      const descText = [item.name, item.description]
        .filter((part, idx, arr) => part && !(idx === 1 && part === arr[0]))
        .join(' - ') || `Item ${index + 1}`;
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const amount = item.amount !== undefined && item.amount !== null ? Number(item.amount) : qty * rate;
      totalQty += qty;

      const textH = doc.font('Helvetica-Bold').fontSize(8.2).heightOfString(descText, { width: COLS[1].w - 8 });
      const rowH = Math.max(20, Math.min(46, textH + 8));

      // Draw row only if fits cleanly on main sheet; otherwise squeeze cleanly into remaining room
      if (y + rowH > maxItemY) {
        return;
      }

      doc.font('Helvetica').fontSize(8.2).fillColor('#000000')
        .text(String(index + 1), colStarts[0] + 2, y + 5, { width: COLS[0].w - 4, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(8.2)
        .text(descText, colStarts[1] + 5, y + 5, { width: COLS[1].w - 10, height: rowH - 6 });
      doc.font('Helvetica').fontSize(8.2)
        .text(item.hsnSac || '', colStarts[2] + 2, y + 5, { width: COLS[2].w - 4, align: 'center' })
        .text(qty.toFixed(2), colStarts[3] + 2, y + 5, { width: COLS[3].w - 6, align: 'right' })
        .text((item.unit || 'NOS').toUpperCase(), colStarts[4] + 2, y + 5, { width: COLS[4].w - 4, align: 'center' })
        .text(rate.toFixed(2), colStarts[5] + 2, y + 5, { width: COLS[5].w - 6, align: 'right' })
        .text(amount.toFixed(2), colStarts[6] + 2, y + 5, { width: COLS[6].w - 6, align: 'right' });

      y += rowH;
    });

    // Vertical column borders span from itemsGridTop down to ITEMS_AREA_END_Y
    for (let i = 1; i < colStarts.length - 1; i += 1) {
      vLine(colStarts[i], itemsGridTop, ITEMS_AREA_END_Y);
    }

    // ─── ITEMS TOTAL BAR ───
    const totalRowTop = ITEMS_AREA_END_Y - TOTALS_ROW_H;
    hLine(totalRowTop, colStarts[2], RIGHT);
    hLine(ITEMS_AREA_END_Y);

    doc.font('Helvetica').fontSize(8.2).fillColor('#000000')
      .text('TOTAL:', colStarts[2] + 4, totalRowTop + 5, { width: COLS[2].w - 8, align: 'right' })
      .text(totalQty.toFixed(2), colStarts[3] + 2, totalRowTop + 5, { width: COLS[3].w - 6, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(8.8)
      .text(formatIndianMoney(invoice.subtotal || totals.taxableAmount), colStarts[6] + 2, totalRowTop + 5, {
        width: COLS[6].w - 6,
        align: 'right',
      });

    // ─── TAX, LOGISTICS & BANK DETAILS SECTION ───
    y = ITEMS_AREA_END_Y;
    const TAX_BOX_H = 105;
    const TAX_SPLIT_X = colStarts[3]; // Aligns right summary box cleanly under Qty + Unit + Rate + Amount
    const TAX_AMT_X = colStarts[6];
    const taxBoxEndY = y + TAX_BOX_H;

    vLine(TAX_SPLIT_X, y, taxBoxEndY);
    vLine(TAX_AMT_X, y, taxBoxEndY);

    const TAX_ROW_H = TAX_BOX_H / 7; // 15pt each for 7 rows

    // Left Logistics & Bank Sub-rows
    hLine(y + 15, LEFT, TAX_SPLIT_X); // Top blank strip / optional ref
    doc.font('Helvetica').fontSize(8)
      .text(`GR No.   :  ${gd.grNo || ''}`, LEFT + 6, y + 19, { width: 155 })
      .text(`E-Way Form No.  :  ${gd.ewayBillNo || ''}`, LEFT + 165, y + 19, { width: 170 });
    hLine(y + 30, LEFT, TAX_SPLIT_X);

    // Bank Box
    doc.font('Helvetica-Bold').fontSize(8.5);
    if (seller.bank.bankName || seller.bank.accountNumber) {
      doc.text(`Bank : ${seller.bank.bankName || 'N/A'}`, LEFT + 6, y + 34, { width: 325 })
        .text(`Branch : ${seller.bank.branch || 'N/A'}`, LEFT + 6, y + 46, { width: 325 })
        .text(`A/c No : ${seller.bank.accountNumber || 'N/A'}`, LEFT + 6, y + 58, { width: 165 })
        .text(`IFSC Code : ${seller.bank.ifscCode || 'N/A'}`, LEFT + 175, y + 58, { width: 155 });
    } else if (seller.upiId) {
      doc.text(`UPI Payee : ${seller.upiName}`, LEFT + 6, y + 38, { width: 325 })
        .text(`UPI VPA   : ${seller.upiId}`, LEFT + 6, y + 52, { width: 325 });
    } else {
      doc.font('Helvetica').fontSize(8).text('Configure Bank / UPI in Settings > Branding', LEFT + 6, y + 45, { width: 325 });
    }

    hLine(y + 73, LEFT, TAX_SPLIT_X);
    doc.font('Helvetica-Bold').fontSize(8.5)
      .text(`Tax Payable on Reverse Charges : ${gd.reverseCharge || 'N. A.'}`, LEFT + 6, y + 77, { width: 325 });
    hLine(y + 90, LEFT, TAX_SPLIT_X);
    doc.font('Helvetica').fontSize(8)
      .text(`Transport   :   ${gd.transport || ''}`, LEFT + 6, y + 93, { width: 160 })
      .text(`Vehicle No.  :   ${gd.vehicleNo || ''}`, LEFT + 170, y + 93, { width: 160 });

    // Right 7 Tax & Grand Total Rows
    const taxRows = [
      { label: 'Freight / Cartage', val: formatIndianMoney(totals.shipping), bold: false },
      { label: 'Taxable Amount', val: formatIndianMoney(totals.taxableAmount), bold: false },
      { label: `CGST  @  ${totals.cgstRate.toFixed(1)}     %`, val: formatIndianMoney(totals.cgstAmount), bold: false },
      { label: `SGST  @  ${totals.sgstRate.toFixed(1)}     %`, val: formatIndianMoney(totals.sgstAmount), bold: false },
      { label: `IGST   @  ${totals.igstRate.toFixed(1)}     %`, val: formatIndianMoney(totals.igstAmount), bold: false },
      { label: 'Round off', val: formatIndianMoney(totals.roundOff), bold: false },
      { label: 'Grand Total (Rs.)', val: formatIndianMoney(totals.grandTotal), bold: true },
    ];

    taxRows.forEach((row, idx) => {
      const rowY = y + idx * TAX_ROW_H;
      if (idx > 0) hLine(rowY, TAX_SPLIT_X, RIGHT);
      doc.font(row.bold ? 'Helvetica-Bold' : 'Helvetica-Bold').fontSize(row.bold ? 8.8 : 8.2);
      if (row.label === 'Freight / Cartage' || row.label === 'Taxable Amount' || row.bold) {
        doc.font('Helvetica-Bold');
      } else {
        doc.font('Helvetica-Bold');
      }
      doc.text(row.label, TAX_SPLIT_X + 6, rowY + 3.5, { width: TAX_AMT_X - TAX_SPLIT_X - 10 });
      doc.font(row.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(row.bold ? 8.8 : 8.2)
        .text(row.val, TAX_AMT_X + 4, rowY + 3.5, { width: RIGHT - TAX_AMT_X - 10, align: 'right' });
    });

    y = taxBoxEndY;
    hLine(y);

    // ─── AMOUNT IN WORDS STRIP ───
    const WORDS_H = 22;
    doc.font('Helvetica').fontSize(8)
      .text('Total Invoice Value (in words) Rs. :', LEFT + 6, y + 6, { width: 138 });
    doc.font('Helvetica-Bold').fontSize(8.2)
      .text(numberToIndianWords(totals.grandTotal), LEFT + 144, y + 6, { width: WIDTH - 150 });
    y += WORDS_H;
    hLine(y);

    // ─── DECLARATION, TERMS & AUTHORISED SIGNATORY ───
    const FOOTER_SIGN_X = LEFT + 336;
    doc.font('Helvetica').fontSize(7)
      .text(`Declaration : ${seller.declarationText}`, LEFT + 6, y + 5, { width: FOOTER_SIGN_X - LEFT - 14 });

    doc.font('Helvetica-Bold').fontSize(8)
      .text('TERMS & CONDITIONS :', LEFT + 6, y + 40, { underline: true });
    const termsText = invoice.terms || seller.footerTerms;
    doc.font('Helvetica').fontSize(7.4)
      .text(termsText, LEFT + 6, y + 51, { width: FOOTER_SIGN_X - LEFT - 14, height: BOX_BOTTOM - (y + 54) });

    doc.font('Helvetica-Bold').fontSize(8.8)
      .text(`For ${seller.legalName}`, FOOTER_SIGN_X, y + 6, { width: RIGHT - FOOTER_SIGN_X - 8, align: 'right' });

    if (signBuffer) {
      try {
        doc.image(signBuffer, RIGHT - 118, y + 22, { fit: [106, 44], align: 'right', valign: 'center' });
      } catch {
        // Ignore broken image buffer
      }
    }
    if (seller.signatoryName) {
      doc.font('Helvetica').fontSize(9)
        .text(seller.signatoryName.toUpperCase(), FOOTER_SIGN_X, y + 36, { width: 112, align: 'left' });
    }

    doc.font('Helvetica-Bold').fontSize(9)
      .text('Authorised Signatory', FOOTER_SIGN_X, BOX_BOTTOM - 16, { width: RIGHT - FOOTER_SIGN_X - 8, align: 'right' });

    // Outer Rounded Border around main sheet
    doc.roundedRect(LEFT, BOX_TOP, WIDTH, BOX_BOTTOM - BOX_TOP, 8)
      .strokeColor(LINE_COLOR).lineWidth(0.85).stroke();

    // Outside footer jurisdiction notice
    doc.font('Helvetica-Bold').fontSize(8.2).fillColor('#000000')
      .text(`All Disputes subject to ${seller.jurisdiction} Jurisdiction only`, LEFT + 4, BOX_BOTTOM + 6, { width: WIDTH });

    doc.end();

    stream.on('finish', () => {
      resolve({
        filePath,
        fileName,
        url: `/uploads/invoices/${fileName}`,
      });
    });
  });
};

exports.numberToIndianWords = numberToIndianWords;
exports.resolveSellerDetails = resolveSellerDetails;
