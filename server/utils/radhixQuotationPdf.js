const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const PAGE = { width: 595.28, height: 841.89 };
const CONTENT = { left: 34, top: 151, bottom: 558, width: 527 };
const COLORS = {
  navy: '#102a56',
  blue: '#0879d8',
  ink: '#172b4d',
  muted: '#66758a',
  border: '#dce6ef',
  white: '#ffffff',
};
const ARIAL_REGULAR = path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts', 'arial.ttf');
const ARIAL_BOLD = path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts', 'arialbd.ttf');
const USE_ARIAL = fs.existsSync(ARIAL_REGULAR) && fs.existsSync(ARIAL_BOLD);
const FONT = USE_ARIAL ? 'Arial' : 'Helvetica';
const BOLD_FONT = USE_ARIAL ? 'Arial-Bold' : 'Helvetica-Bold';
const TABLE_COLUMNS = [
  { label: '#', width: 24, align: 'center' },
  { label: 'DESCRIPTION', width: 205, align: 'left' },
  { label: 'QTY', width: 42, align: 'right' },
  { label: 'UNIT PRICE', width: 77, align: 'right' },
  { label: 'DISC.', width: 44, align: 'right' },
  { label: 'AMOUNT', width: 121, align: 'right' },
];

const money = (value) => `Rs. ${(Number(value) || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const dateText = (value) => {
  if (!value) return 'Not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not specified';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const itemAmount = (item) => {
  const subtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  return subtotal - subtotal * (Number(item.discount) || 0) / 100;
};

function drawLetterhead(doc) {
  const letterheadPath = path.join(__dirname, 'Radhix Letterhead Rev-2_page-0001.jpg');
  doc.image(letterheadPath, 0, 0, { width: PAGE.width, height: PAGE.height });
}

function drawSectionTitle(doc, title, y) {
  doc.font(BOLD_FONT).fontSize(8).fillColor(COLORS.blue).text(title.toUpperCase(), CONTENT.left, y);
  return y + 15;
}

function drawTableHeader(doc, y) {
  doc.roundedRect(CONTENT.left, y, CONTENT.width, 23, 4).fill(COLORS.navy);
  let x = CONTENT.left + 7;
  TABLE_COLUMNS.forEach((column) => {
    doc.font(BOLD_FONT).fontSize(6.4).fillColor(COLORS.white)
      .text(column.label, x, y + 8, {
        width: column.width,
        align: column.align,
        lineBreak: false,
      });
    x += column.width;
  });
  return y + 23;
}

async function generateRadhixQuotationPDF(quotation, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: `Quotation ${quotation.quotationNumber || ''}`,
        Author: 'Radhix Technologies',
        Subject: quotation.quotationName || 'Sales quotation',
      },
    });
    if (USE_ARIAL) {
      doc.registerFont(FONT, ARIAL_REGULAR);
      doc.registerFont(BOLD_FONT, ARIAL_BOLD);
    }

    const output = fs.createWriteStream(outputPath);
    let y = CONTENT.top;

    const startPage = (continuation = false) => {
      if (continuation) doc.addPage({ size: 'A4', margin: 0 });
      drawLetterhead(doc);
      y = CONTENT.top;
      if (continuation) {
        doc.font(BOLD_FONT).fontSize(8).fillColor(COLORS.muted)
          .text(`QUOTATION ${quotation.quotationNumber || ''} - CONTINUED`, CONTENT.left, y);
        y += 18;
      }
    };

    const ensureSpace = (height) => {
      if (y + height > CONTENT.bottom) {
        startPage(true);
        return true;
      }
      return false;
    };

    const drawItemRow = (item, index) => {
      const description = String(item.description || item.name || 'Item');
      const descriptionHeight = Math.max(10, doc.heightOfString(description, {
        width: TABLE_COLUMNS[1].width - 8,
        font: FONT,
        fontSize: 7.2,
      }));
      const rowHeight = Math.max(25, Math.min(52, descriptionHeight + 12));
      if (ensureSpace(rowHeight + 6)) y = drawTableHeader(doc, y);
      if (index % 2 === 0) doc.rect(CONTENT.left, y, CONTENT.width, rowHeight).fill('#f7fbfe');
      doc.moveTo(CONTENT.left, y + rowHeight).lineTo(CONTENT.left + CONTENT.width, y + rowHeight)
        .lineWidth(0.45).strokeColor(COLORS.border).stroke();

      let x = CONTENT.left + 7;
      const values = [
        String(index + 1),
        description,
        String(Number(item.quantity) || 0),
        money(item.unitPrice),
        `${Number(item.discount) || 0}%`,
        money(itemAmount(item)),
      ];
      TABLE_COLUMNS.forEach((column, columnIndex) => {
        doc.font(columnIndex === 5 ? BOLD_FONT : FONT)
          .fontSize(columnIndex === 1 ? 7.2 : 7)
          .fillColor(COLORS.ink)
          .text(values[columnIndex], x, y + 7, {
            width: column.width,
            height: rowHeight - 8,
            align: columnIndex === 0 ? 'center' : column.align,
          });
        x += column.width;
      });
      y += rowHeight;
    };

    const drawTotal = (label, value, bold = false) => {
      ensureSpace(bold ? 22 : 16);
      doc.font(bold ? BOLD_FONT : FONT).fontSize(bold ? 9 : 7.2)
        .fillColor(bold ? COLORS.navy : COLORS.muted)
        .text(label, CONTENT.left + 310, y, { width: 105 });
      doc.font(bold ? BOLD_FONT : FONT).fontSize(bold ? 9 : 7.2)
        .fillColor(COLORS.ink)
        .text(money(value), CONTENT.left + 420, y, { width: 104, align: 'right' });
      y += bold ? 22 : 16;
    };

    const drawParagraph = (title, value) => {
      if (!value) return;
      const text = String(value);
      const height = Math.min(62, doc.heightOfString(text, {
        width: CONTENT.width - 20,
        font: FONT,
        fontSize: 7.5,
      }) + 32);
      ensureSpace(height);
      y = drawSectionTitle(doc, title, y);
      doc.font(FONT).fontSize(7.5).fillColor(COLORS.ink)
        .text(text, CONTENT.left, y, {
          width: CONTENT.width - 12,
          height: height - 16,
          lineGap: 2,
        });
      y += height - 14;
    };

    output.on('error', reject);
    doc.on('error', reject);
    output.on('finish', resolve);
    doc.pipe(output);
    startPage();

    doc.font(BOLD_FONT).fontSize(16).fillColor(COLORS.navy)
      .text('QUOTATION', CONTENT.left, y);
    const titleWidth = doc.widthOfString('QUOTATION', { font: BOLD_FONT, fontSize: 16 });
    const badgeX = CONTENT.left + titleWidth + 10;
    doc.roundedRect(badgeX, y + 1, 57, 16, 7).fill('#e8f2fb');
    doc.font(BOLD_FONT).fontSize(6).fillColor(COLORS.blue)
      .text(String(quotation.status || 'draft').toUpperCase(), badgeX, y + 6, { width: 57, align: 'center' });
    doc.font(FONT).fontSize(7).fillColor(COLORS.muted)
      .text(quotation.quotationNumber || 'DRAFT', CONTENT.left, y + 21);
    y += 42;

    const client = quotation.client || {};
    const customClient = quotation.customClientDetails || {};
    const contact = quotation.contact || {};
    const clientName = client.company || client.name || customClient.company || customClient.name || 'Client';
    const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || customClient.contactName || '';
    const clientEmail = contact.email || client.email || customClient.email || '';
    const clientPhone = contact.phone || client.phone || customClient.phone || '';

    doc.roundedRect(CONTENT.left, y, CONTENT.width, 58, 5).fill('#f5faff');
    doc.roundedRect(CONTENT.left, y, 3, 58, 2).fill(COLORS.blue);
    doc.font(BOLD_FONT).fontSize(6.5).fillColor(COLORS.blue)
      .text('PREPARED FOR', CONTENT.left + 12, y + 9);
    doc.font(BOLD_FONT).fontSize(9).fillColor(COLORS.ink)
      .text(clientName, CONTENT.left + 12, y + 21, { width: 240 });
    if (contactName) {
      doc.font(FONT).fontSize(7).fillColor(COLORS.muted)
        .text(contactName, CONTENT.left + 12, y + 35, { width: 240 });
    }
    doc.font(BOLD_FONT).fontSize(6.2).fillColor(COLORS.muted)
      .text('DATE', CONTENT.left + 315, y + 9);
    doc.font(FONT).fontSize(7).fillColor(COLORS.ink)
      .text(dateText(quotation.quotationDate || quotation.createdAt), CONTENT.left + 315, y + 21);
    doc.font(BOLD_FONT).fontSize(6.2).fillColor(COLORS.muted)
      .text('VALID UNTIL', CONTENT.left + 410, y + 9);
    doc.font(FONT).fontSize(7).fillColor(COLORS.ink)
      .text(dateText(quotation.priceValidUntil), CONTENT.left + 410, y + 21, { width: 105 });
    if (clientEmail || clientPhone) {
      doc.font(FONT).fontSize(6.4).fillColor(COLORS.muted)
        .text([clientEmail, clientPhone].filter(Boolean).join('  |  '), CONTENT.left + 12, y + 43, { width: 300 });
    }
    y += 72;

    const items = Array.isArray(quotation.items) ? quotation.items : [];
    y = drawSectionTitle(doc, 'Quotation details', y);
    y = drawTableHeader(doc, y);
    items.forEach(drawItemRow);

    if (!items.length) {
      ensureSpace(34);
      doc.font(FONT).fontSize(7.5).fillColor(COLORS.muted)
        .text('No line items were added.', CONTENT.left + 8, y + 9);
      y += 28;
    }

    ensureSpace(100);
    const subtotal = Number(quotation.subtotal) || items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      0,
    );
    const discount = Number(quotation.totalDiscount) || 0;
    const tax = Number(quotation.taxAmount) || 0;
    const total = Number(quotation.grandTotal || quotation.total) || subtotal - discount + tax;
    drawTotal('Subtotal', subtotal);
    if (discount > 0) drawTotal('Discount', -discount);
    if (tax > 0) drawTotal(`Tax (${Number(quotation.taxRate) || 0}%)`, tax);
    doc.moveTo(CONTENT.left + 310, y - 2).lineTo(CONTENT.left + CONTENT.width, y - 2)
      .lineWidth(0.8).strokeColor(COLORS.border).stroke();
    y += 5;
    drawTotal('TOTAL', total, true);
    y += 5;

    drawParagraph('Payment terms', quotation.paymentTerms);
    drawParagraph('Delivery timeline', quotation.deliveryTimeline);
    drawParagraph('Notes', quotation.notes);
    if (Array.isArray(quotation.deliverables) && quotation.deliverables.length) {
      drawParagraph(
        'Deliverables',
        quotation.deliverables.map((entry) => typeof entry === 'string' ? entry : entry.description || entry.name || '')
          .filter(Boolean)
          .join('\n'),
      );
    }
    if (Array.isArray(quotation.extraRequirements) && quotation.extraRequirements.length) {
      drawParagraph(
        'Additional requirements',
        quotation.extraRequirements.map((entry) => typeof entry === 'string' ? entry : entry.description || entry.name || '')
          .filter(Boolean)
          .join('\n'),
      );
    }

    doc.end();
  });
}

module.exports = { generateRadhixQuotationPDF };
