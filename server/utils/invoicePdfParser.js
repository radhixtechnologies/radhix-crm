let pdfjsPromise = null;
const getPdfJs = async () => {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsPromise;
};

const groupItemsIntoLines = (items) => {
  const sorted = [...items].sort((a, b) => {
    const dy = b.y - a.y;
    return Math.abs(dy) > 3.5 ? dy : a.x - b.x;
  });

  const rows = [];
  for (const item of sorted) {
    const lastRow = rows[rows.length - 1];
    if (lastRow && Math.abs(lastRow.y - item.y) <= 3.5) {
      lastRow.chunks.push(item);
    } else {
      rows.push({ y: item.y, chunks: [item] });
    }
  }

  return rows
    .map((row) => {
      row.chunks.sort((a, b) => a.x - b.x);
      let line = '';
      let prevEnd = null;
      for (const chunk of row.chunks) {
        if (prevEnd !== null && chunk.x - prevEnd > 2.5 && !line.endsWith(' ') && !chunk.str.startsWith(' ')) {
          line += ' ';
        }
        line += chunk.str;
        prevEnd = chunk.x + (chunk.w || 0);
      }
      return line.trim();
    })
    .filter(Boolean)
    .join('\n');
};

const extractPdfLayoutText = async (buffer) => {
  const pdfjs = await getPdfJs();
  const data = Uint8Array.from(buffer);
  const loadingTask = pdfjs.getDocument({ data, useWorkerFetch: false, isEvalSupported: false, verbosity: 0 });
  const pdf = await loadingTask.promise;

  const fullPages = [];
  const leftPages = [];
  const rightPages = [];

  for (let p = 1; p <= pdf.numPages; p += 1) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1.0 });
    const midX = (viewport.width || 595) * 0.48;
    const textContent = await page.getTextContent();
    const mapped = (textContent.items || [])
      .filter((it) => it.str && it.str.trim() !== '')
      .map((it) => ({
        str: it.str,
        x: it.transform?.[4] || 0,
        y: it.transform?.[5] || 0,
        w: it.width || 0,
      }));

    fullPages.push(groupItemsIntoLines(mapped));
    leftPages.push(groupItemsIntoLines(mapped.filter((m) => m.x < midX)));
    rightPages.push(groupItemsIntoLines(mapped.filter((m) => m.x >= midX)));
  }

  await pdf.destroy();
  return {
    fullText: fullPages.join('\n'),
    leftText: leftPages.join('\n'),
    rightText: rightPages.join('\n'),
  };
};

const GSTIN_REGEX = /\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]\b/i;
const PAN_REGEX = /\b[A-Z]{5}\d{4}[A-Z]\b/;
const UNIT_TOKENS = ['NOS', 'PCS', 'SET', 'HRS', 'HR', 'DAY', 'DAYS', 'KG', 'MTR', 'EA', 'UNIT', 'BOX', 'LOT', 'PKT', 'JOB'];

const parseNumber = (raw) => {
  if (raw === undefined || raw === null) return 0;
  const cleaned = String(raw).replace(/[₹Rs,\s]/gi, '').replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
};

const normalizeDateInput = (raw) => {
  if (!raw) return '';
  const text = String(raw).trim();
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmy = text.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
  if (dmy) {
    let [, d, m, y] = dmy;
    if (y.length === 2) y = `20${y}`;
    const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    if (!Number.isNaN(new Date(iso).getTime())) return iso;
  }
  const ymd = text.match(/(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})/);
  if (ymd) return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return '';
};

const extractBetween = (text, startPatterns, stopPatterns) => {
  let startIdx = -1;
  let matchLen = 0;
  for (const pat of startPatterns) {
    const m = pat.exec(text);
    if (m && (startIdx === -1 || m.index < startIdx)) {
      startIdx = m.index;
      matchLen = m[0].length;
    }
  }
  if (startIdx === -1) return '';

  const rest = text.slice(startIdx + matchLen);
  let endIdx = rest.length;
  for (const stop of stopPatterns) {
    const m = stop.exec(rest);
    if (m && m.index < endIdx) {
      endIdx = m.index;
    }
  }
  return rest.slice(0, endIdx).trim();
};

const parsePartyBlock = (blockText) => {
  if (!blockText) {
    return { name: '', address: '', state: '', stateCode: '', gstin: '', pan: '' };
  }

  const lines = blockText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let state = '';
  let stateCode = '';
  let gstin = '';
  let pan = '';
  const addressLines = [];

  for (const line of lines) {
    const gstMatch = line.match(/\b(\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d][Z][A-Z\d])\b/i);
    if (gstMatch && !gstin) gstin = gstMatch[1].toUpperCase();

    const panMatch = line.match(/\b([A-Z]{5}\d{4}[A-Z])\b/);
    if (panMatch && !pan && (!gstin || !gstin.includes(panMatch[1]))) pan = panMatch[1].toUpperCase();

    const stateCodeMatch = line.match(/State\s*Code\s*[:\-]?\s*(\d{1,2})/i);
    if (stateCodeMatch) stateCode = stateCodeMatch[1].padStart(2, '0');

    const stateMatch = line.match(/State\s*[:\-]\s*([A-Za-z\s&.-]+?)(?=\s+State\s*Code|\s+GST|$)/i);
    if (stateMatch && !state) state = stateMatch[1].trim();

    if (/^(State|GST\s*No|PAN\s*No|INVOICE\s*NO|P\.?\s*O\.?\s*No|Vendor\s*Code|ACK|IRN)/i.test(line)) {
      continue;
    }
    addressLines.push(line);
  }

  const name = addressLines.shift() || '';
  if (!pan && gstin.length >= 12) pan = gstin.slice(2, 12);
  if (!stateCode && gstin.length >= 2) stateCode = gstin.slice(0, 2);

  return {
    name,
    address: addressLines.join('\n'),
    state,
    stateCode,
    gstin,
    pan,
  };
};

const extractLineItems = (text) => {
  const section = extractBetween(
    text,
    [
      /DESCRIPTION\s+OF\s+GOODS[\s\S]{0,120}?AMOUNT/i,
      /PARTICULARS[\s\S]{0,120}?AMOUNT/i,
      /(?:ITEM|DESCRIPTION)[\s\S]{0,100}?(?:RATE|PRICE)[\s\S]{0,60}?AMOUNT/i,
    ],
    [
      /\n\s*TOTAL\s*:/i,
      /Taxable\s*Amount/i,
      /Freight\s*\/?\s*Cartage/i,
      /Sub\s*-?\s*Total/i,
      /Grand\s*Total/i,
    ]
  );

  const lines = (section || text)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^(S\.?NO|HSN|Qty|Unit|RATE|AMOUNT|DESCRIPTION)/i.test(l));

  const items = [];
  const unitAlt = UNIT_TOKENS.join('|');

  // Pattern 1: Spaced GST table line -> SNo Desc [HSN] Qty [Unit] Rate Amount
  const spacedGstRe = new RegExp(
    `^(\\d{1,3})\\s+(.+?)\\s+(\\d{4,8})\\s+(\\d+(?:\\.\\d+)?)\\s+(${unitAlt})\\s+([\\d,]+(?:\\.\\d{1,2})?)\\s+([\\d,]+(?:\\.\\d{1,2})?)$`,
    'i'
  );
  // Pattern 2: Compact concatenated line produced by some PDF generators
  const compactGstRe = new RegExp(
    `^(\\d{1,3})([^\\d].+?)(\\d{4,8})(\\d+(?:\\.\\d{1,2}))(${unitAlt})([\\d,]+\\.\\d{2})([\\d,]+\\.\\d{2})$`,
    'i'
  );
  // Pattern 3: Generic invoice line -> [SNo] Desc Qty Rate Amount
  const genericItemRe = /^(?:(\d{1,3})\s+)?(.+?)\s+(\d+(?:\.\d+)?)\s+(?:Rs\.?|INR|₹|\$)?\s*([\d,]+\.\d{2})\s+(?:Rs\.?|INR|₹|\$)?\s*([\d,]+\.\d{2})$/i;

  for (const line of lines) {
    let m = line.match(spacedGstRe) || line.match(compactGstRe);
    if (m) {
      const description = m[2].trim();
      const qty = parseNumber(m[4]) || 1;
      const rate = parseNumber(m[6]);
      const amount = parseNumber(m[7]) || qty * rate;
      items.push({
        name: description.slice(0, 80),
        description,
        hsnSac: m[3].trim(),
        quantity: qty,
        unit: m[5].toUpperCase(),
        rate,
        taxRate: 0,
        amount,
      });
      continue;
    }

    m = line.match(genericItemRe);
    if (m && !/total|subtotal|cgst|sgst|igst|freight|round\s*off|taxable/i.test(line)) {
      const description = m[2].trim();
      const qty = parseNumber(m[3]) || 1;
      const rate = parseNumber(m[4]);
      const amount = parseNumber(m[5]) || qty * rate;
      items.push({
        name: description.slice(0, 80),
        description,
        hsnSac: '',
        quantity: qty,
        unit: 'NOS',
        rate,
        taxRate: 0,
        amount,
      });
    }
  }

  // Fallback for multi-line Tally rows where columns split across separate lines inside section
  if (items.length === 0 && section) {
    const hsnMatch = section.match(/\b(99\d{4}|\d{6,8})\b/);
    const unitMatch = section.match(new RegExp(`\\b(${unitAlt})\\b`, 'i'));
    const moneyTokens = section.match(/[\d,]+\.\d{2}/g) || [];
    const descLines = lines.filter(
      (l) => !/^\d+(\.\d+)?$/.test(l) && !new RegExp(`^(${unitAlt})$`, 'i').test(l) && l.length > 4
    );
    if (descLines.length > 0 && moneyTokens.length >= 1) {
      const cleanedDesc = descLines.join(' ').replace(/^\d+\s+/, '').trim();
      const nums = moneyTokens.map(parseNumber).filter((n) => n > 0);
      const amount = nums[nums.length - 1] || 0;
      const rate = nums.length >= 2 ? nums[nums.length - 2] : amount;
      const qty = nums.length >= 3 && nums[0] < 10000 ? nums[0] : (rate > 0 && amount >= rate ? Number((amount / rate).toFixed(2)) : 1);
      items.push({
        name: cleanedDesc.slice(0, 80),
        description: cleanedDesc,
        hsnSac: hsnMatch ? hsnMatch[1] : '',
        quantity: qty || 1,
        unit: unitMatch ? unitMatch[1].toUpperCase() : 'NOS',
        rate: rate || amount,
        taxRate: 0,
        amount,
      });
    }
  }

  return items;
};

/**
 * Extracts structured GST Tax Invoice data from an uploaded PDF buffer.
 */
exports.parseInvoicePdfBuffer = async (buffer, originalFilename = '') => {
  const { fullText, leftText } = await extractPdfLayoutText(buffer);
  const trimmedText = (fullText || '').replace(/\r\n/g, '\n').trim();

  const invoiceNoMatch =
    trimmedText.match(/INVOICE\s*NO\.?\s*[:\-]?\s*([A-Z0-9\/._-]{2,})/i) ||
    trimmedText.match(/Invoice\s*(?:Number|#)\s*[:\-]?\s*([A-Z0-9\/._-]{2,})/i);
  const invoiceDateMatch =
    trimmedText.match(/(?:INVOICE\s*NO\.?[^\n]*?\s+)?Date\s*[:\-]?\s*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}|\d{4}-\d{2}-\d{2})/i) ||
    trimmedText.match(/Issue\s*Date\s*[:\-]?\s*([^\n]+)/i);
  const dueDateMatch = trimmedText.match(/Due\s*Date\s*[:\-]?\s*([^\n]+)/i);
  const poNoMatch = trimmedText.match(/P\.?\s*O\.?\s*No\.?\s*[:\-]?\s*([A-Z0-9\/._-]+)/i);
  const poDateMatch = trimmedText.match(/P\.?\s*O\.?\s*Date\s*[:\-]?\s*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})/i);
  const vendorCodeMatch = trimmedText.match(/Vendor\s*Code\s*[:\-]?\s*([A-Z0-9\/._-]+)/i);
  const projectMatch = trimmedText.match(/Project\s*Details\s*[:\-]?\s*([^\n]+)/i);
  const ackNoMatch = trimmedText.match(/ACK\s*No\.?\s*[:\-]?\s*(\d{6,})/i);
  const ackDateMatch = trimmedText.match(/ACK\s*Date\s*[:\-]?\s*([^\n]+)/i);
  const irnMatch = trimmedText.match(/IRN\s*(?:NO\.?)?\s*[:\-]?\s*([a-f0-9][a-f0-9\r\n ]{31,90})/i);
  const rawIrnHex = (irnMatch?.[1] || '').replace(/[^a-f0-9]/gi, '');
  const irnNo = (rawIrnHex.length >= 64 ? rawIrnHex.slice(0, 64) : rawIrnHex).toLowerCase();
  const grNoMatch = trimmedText.match(/GR\s*No\.?\s*[:\-]?\s*([A-Z0-9\/._-]+)/i);
  const ewayMatch = trimmedText.match(/E-?Way\s*(?:Form|Bill)?\s*No\.?\s*[:\-]?\s*([A-Z0-9\/._-]+)/i);
  const reverseChargeMatch = trimmedText.match(/Tax\s*Payable\s*on\s*Reverse\s*Charges\s*[:\-]?\s*([^\n]+)/i);
  const transportMatch = trimmedText.match(/Transport\s*[:\-]\s*([^\nVehicle]+)/i);
  const vehicleMatch = trimmedText.match(/Vehicle\s*No\.?\s*[:\-]?\s*([A-Z0-9\s-]+)/i);

  // Customer (Billed to) & Consignee (Shipped to) blocks
  const extractPartiesFromText = (sourceText) => {
    const bBlock = extractBetween(
      sourceText,
      [/Details\s+of\s+Customer\s*(?:\(Billed\s*to\))?/i, /Bill(?:ed)?\s*To\s*[:\-]?/i],
      [/Details\s+of\s+Consignee/i, /Ship(?:ped)?\s*To/i, /S\.?\s*NO\./i, /INVOICE\s*NO\./i]
    );
    const sBlock = extractBetween(
      sourceText,
      [/Details\s+of\s+Consignee\s*(?:\(Shipped\s*to\))?/i, /Ship(?:ped)?\s*To\s*[:\-]?/i],
      [/S\.?\s*NO\./i, /DESCRIPTION\s+OF\s+GOODS/i, /INVOICE\s*NO\./i]
    );
    return { b: parsePartyBlock(bBlock), s: parsePartyBlock(sBlock) };
  };

  const leftParties = extractPartiesFromText(leftText);
  const fullParties = extractPartiesFromText(trimmedText);
  const billedTo = leftParties.b.name ? leftParties.b : fullParties.b;
  const shippedTo = leftParties.s.name ? leftParties.s : fullParties.s;

  // Financial figures
  const freightMatch = trimmedText.match(/(?:Freight\s*\/?\s*Cartage|Shipping)\s*[:\-]?\s*([\d,]+\.\d{2})/i);
  const taxableMatch = trimmedText.match(/Taxable\s*Amount\s*[:\-]?\s*([\d,]+\.\d{2})/i);
  const cgstMatch = trimmedText.match(/CGST\s*@?\s*([\d.]+)\s*%?\s*([\d,]+\.\d{2})/i);
  const sgstMatch = trimmedText.match(/SGST\s*@?\s*([\d.]+)\s*%?\s*([\d,]+\.\d{2})/i);
  const igstMatch = trimmedText.match(/IGST\s*@?\s*([\d.]+)\s*%?\s*([\d,]+\.\d{2})/i);
  const roundOffMatch = trimmedText.match(/Round\s*off\s*[:\-]?\s*(-?[\d,]+\.\d{2})/i);
  const grandTotalMatch =
    trimmedText.match(/Grand\s*Total\s*(?:\(Rs\.?\))?\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([\d,]+\.\d{2})/i) ||
    trimmedText.match(/Total\s*Amount\s*[:\-]?\s*(?:Rs\.?|₹|\$)?\s*([\d,]+\.\d{2})/i);

  const items = extractLineItems(trimmedText);
  const itemsSubtotal = items.reduce((s, item) => s + (Number(item.amount) || 0), 0);
  const shipping = freightMatch ? parseNumber(freightMatch[1]) : 0;
  const cgstRate = cgstMatch ? parseNumber(cgstMatch[1]) : 0;
  const cgstAmount = cgstMatch ? parseNumber(cgstMatch[2]) : 0;
  const sgstRate = sgstMatch ? parseNumber(sgstMatch[1]) : 0;
  const sgstAmount = sgstMatch ? parseNumber(sgstMatch[2]) : 0;
  const igstRate = igstMatch ? parseNumber(igstMatch[1]) : 0;
  const igstAmount = igstMatch ? parseNumber(igstMatch[2]) : 0;
  const roundOff = roundOffMatch ? parseNumber(roundOffMatch[1]) : 0;

  const subtotal = itemsSubtotal > 0 ? itemsSubtotal : (taxableMatch ? parseNumber(taxableMatch[1]) : 0);
  const tax = Number((cgstAmount + sgstAmount + igstAmount).toFixed(2));
  const taxRate = Number((cgstRate + sgstRate + igstRate).toFixed(2));
  const computedTotal = Number((subtotal + shipping + tax + roundOff).toFixed(2));
  const grandTotal = grandTotalMatch ? parseNumber(grandTotalMatch[1]) : computedTotal;

  // Ensure at least 1 line item exists when only total/taxable is detected
  if (items.length === 0 && (subtotal > 0 || grandTotal > 0)) {
    const baseAmt = subtotal || grandTotal;
    items.push({
      name: projectMatch?.[1]?.trim() || 'Imported Invoice Item',
      description: projectMatch?.[1]?.trim() || 'Imported from PDF invoice',
      hsnSac: '',
      quantity: 1,
      unit: 'NOS',
      rate: baseAmt,
      taxRate,
      amount: baseAmt,
    });
  }

  const issueDate = normalizeDateInput(invoiceDateMatch?.[1]) || new Date().toISOString().split('T')[0];
  const dueDateObj = new Date(issueDate);
  dueDateObj.setDate(dueDateObj.getDate() + 15);
  const dueDate = normalizeDateInput(dueDateMatch?.[1]) || dueDateObj.toISOString().split('T')[0];

  const hasText = trimmedText.length >= 20;

  return {
    hasSelectableText: hasText,
    originalFilename,
    invoiceNumber: invoiceNoMatch?.[1]?.trim() || '',
    issueDate,
    dueDate,
    poNumber: poNoMatch?.[1]?.trim() || '',
    poDate: normalizeDateInput(poDateMatch?.[1]) || '',
    vendorCode: vendorCodeMatch?.[1]?.trim() || '',
    project: projectMatch?.[1]?.trim() || '',
    billedTo,
    shippedTo: {
      name: shippedTo.name || billedTo.name,
      address: shippedTo.address || billedTo.address,
      state: shippedTo.state || billedTo.state,
      stateCode: shippedTo.stateCode || billedTo.stateCode,
      gstin: shippedTo.gstin || billedTo.gstin,
    },
    items,
    shipping,
    subtotal: items.reduce((s, it) => s + (Number(it.amount) || 0), 0) || subtotal,
    tax,
    taxRate,
    total: grandTotal || computedTotal,
    gstDetails: {
      copyLabel: 'Original for Recipient',
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      roundOff,
      reverseCharge: reverseChargeMatch?.[1]?.trim() || 'N. A.',
      ackNo: ackNoMatch?.[1]?.trim() || '',
      ackDate: ackDateMatch?.[1]?.trim() || '',
      irnNo,
      grNo: grNoMatch?.[1]?.trim() || '',
      ewayBillNo: ewayMatch?.[1]?.trim() || '',
      transport: transportMatch?.[1]?.trim() || '',
      vehicleNo: vehicleMatch?.[1]?.trim() || '',
    },
    rawTextPreview: trimmedText.slice(0, 1500),
  };
};
