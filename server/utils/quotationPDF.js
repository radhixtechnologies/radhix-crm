const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate professional enterprise-grade quotation PDF
 * Clean, modern design inspired by Zoho CRM and HubSpot
 * @param {Object} quotation - Quotation data
 * @param {Object} company - Company details
 * @param {String} outputPath - Path to save PDF
 */
const generateQuotationPDF = async (quotation, company, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            // Create PDF document with professional settings
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                bufferPages: true,
                info: {
                    Title: `Quotation ${quotation.quotationNumber}`,
                    Author: company.name || 'Your Company',
                    Subject: `Quotation for ${quotation.deal ? quotation.deal.title : quotation.quotationName}`,
                    Keywords: 'quotation, sales, crm'
                }
            });

            // Pipe to file
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // Professional color palette - Calm and minimal
            const colors = {
                primary: '#1a56db',          // Soft professional blue
                primaryLight: '#eff6ff',     // Very light blue
                text: '#111827',             // Almost black
                textSecondary: '#6b7280',    // Medium gray
                textLight: '#9ca3af',        // Light gray
                border: '#e5e7eb',           // Light border
                borderDark: '#d1d5db',       // Medium border
                background: '#f9fafb',       // Off-white background
                success: '#059669',          // Green
                warning: '#fef3c7',          // Light yellow
                warningBorder: '#f59e0b',    // Orange
                warningText: '#92400e',      // Dark orange
                white: '#ffffff'
            };

            // Typography
            const fonts = {
                regular: 'Helvetica',
                bold: 'Helvetica-Bold',
                oblique: 'Helvetica-Oblique'
            };

            let yPos = 50;

            // ═══════════════════════════════════════════════════════
            // 1️⃣ HEADER SECTION - Clean & Minimal
            // ═══════════════════════════════════════════════════════

            // Company Logo/Name (Left)
            doc.fontSize(20)
                .font(fonts.bold)
                .fillColor(colors.primary)
                .text(company.name || 'Your Company', 50, yPos);

            yPos += 25;

            if (company.tagline) {
                doc.fontSize(9)
                    .font(fonts.oblique)
                    .fillColor(colors.textSecondary)
                    .text(company.tagline, 50, yPos);
                yPos += 15;
            }

            // QUOTATION Title (Right) - Bold and prominent
            doc.fontSize(24)
                .font(fonts.bold)
                .fillColor(colors.text)
                .text('QUOTATION', 350, 50, { align: 'right', width: 195 });

            // Quotation Details (Right) - Clean and aligned
            const detailsY = 80;
            doc.fontSize(9)
                .font(fonts.regular)
                .fillColor(colors.textLight);

            doc.text('Quotation No:', 350, detailsY)
                .font(fonts.bold)
                .fillColor(colors.text)
                .text(quotation.quotationNumber, 440, detailsY, { align: 'right' });

            doc.font(fonts.regular)
                .fillColor(colors.textLight)
                .text('Date:', 350, detailsY + 15)
                .font(fonts.bold)
                .fillColor(colors.text)
                .text(new Date(quotation.quotationDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }), 440, detailsY + 15, { align: 'right' });

            doc.font(fonts.regular)
                .fillColor(colors.textLight)
                .text('Valid Until:', 350, detailsY + 30)
                .font(fonts.bold)
                .fillColor(colors.primary)
                .text(new Date(quotation.priceValidUntil).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }), 440, detailsY + 30, { align: 'right' });

            doc.font(fonts.regular)
                .fillColor(colors.textLight)
                .text('Currency:', 350, detailsY + 45)
                .font(fonts.bold)
                .fillColor(colors.text)
                .text(quotation.currency, 440, detailsY + 45, { align: 'right' });

            // Subtle divider line
            yPos = 145;
            doc.moveTo(50, yPos)
                .lineTo(545, yPos)
                .strokeColor(colors.border)
                .lineWidth(1)
                .stroke();

            yPos += 20;

            // ═══════════════════════════════════════════════════════
            // 2️⃣ SENDER & CLIENT INFORMATION - Two Column Layout
            // ═══════════════════════════════════════════════════════

            // Background box with subtle color
            doc.rect(50, yPos, 495, 110)
                .fillAndStroke(colors.primaryLight, colors.border);

            yPos += 15;

            // Left Column: FROM (Your Company)
            doc.fontSize(9)
                .font(fonts.bold)
                .fillColor(colors.primary)
                .text('FROM', 60, yPos);

            yPos += 18;

            doc.fontSize(11)
                .font(fonts.bold)
                .fillColor(colors.text)
                .text(company.name || 'Your Company', 60, yPos);

            yPos += 15;

            doc.fontSize(9)
                .font(fonts.regular)
                .fillColor(colors.textSecondary)
                .text(company.address || 'Company Address', 60, yPos, { width: 220, lineGap: 1 });

            yPos += 30;

            doc.fontSize(8)
                .fillColor(colors.textLight)
                .text('Email:', 60, yPos)
                .fillColor(colors.text)
                .text(company.email || 'email@company.com', 95, yPos);

            yPos += 12;

            doc.fillColor(colors.textLight)
                .text('Phone:', 60, yPos)
                .fillColor(colors.text)
                .text(company.phone || '+91-XXXXXXXXXX', 95, yPos);

            if (company.gst) {
                yPos += 12;
                doc.fillColor(colors.textLight)
                    .text('GSTIN:', 60, yPos)
                    .fillColor(colors.text)
                    .text(company.gst, 95, yPos);
            }

            // Right Column: TO (Client)
            yPos = 180;

            doc.fontSize(9)
                .font(fonts.bold)
                .fillColor(colors.primary)
                .text('TO', 310, yPos);

            yPos += 18;

            // Safely resolve Client details
            const clientName = quotation.client
                ? (quotation.client.company || quotation.client.name)
                : (quotation.customClientDetails?.name || 'Client');

            doc.fontSize(11)
                .font(fonts.bold)
                .fillColor(colors.text)
                .text(clientName, 310, yPos, { width: 225 });

            yPos += 15;

            // Contact person details
            let contactName = '';
            let contactEmail = '';
            let contactPhone = '';

            if (quotation.contact) {
                contactName = `${quotation.contact.firstName || ''} ${quotation.contact.lastName || ''}`.trim();
                contactEmail = quotation.contact.email || '';
                contactPhone = quotation.contact.phone || '';
            } else if (quotation.customClientDetails) {
                if (quotation.customClientDetails.name !== clientName) {
                    contactName = quotation.customClientDetails.name || '';
                }
                contactEmail = quotation.customClientDetails.email || '';
                contactPhone = quotation.customClientDetails.phone || '';
            }

            doc.fontSize(9)
                .font(fonts.regular)
                .fillColor(colors.textSecondary);

            if (contactName) {
                doc.text(contactName, 310, yPos);
                yPos += 12;
            }

            yPos += 18;

            if (contactEmail) {
                doc.fontSize(8)
                    .fillColor(colors.textLight)
                    .text('Email:', 310, yPos)
                    .fillColor(colors.text)
                    .text(contactEmail, 345, yPos, { width: 190 });
                yPos += 12;
            }

            if (contactPhone) {
                doc.fillColor(colors.textLight)
                    .text('Phone:', 310, yPos)
                    .fillColor(colors.text)
                    .text(contactPhone, 345, yPos);
            }

            yPos = 295;

            // ═══════════════════════════════════════════════════════
            // 3️⃣ DEAL INFORMATION STRIP - Slim horizontal bar
            // ═══════════════════════════════════════════════════════

            doc.rect(50, yPos, 495, 25)
                .fillAndStroke(colors.background, colors.borderDark);

            yPos += 8;

            doc.fontSize(8)
                .font(fonts.regular)
                .fillColor(colors.textLight);

            const dealTitle = quotation.deal ? quotation.deal.title : quotation.quotationName;
            const preparedBy = quotation.createdBy ? quotation.createdBy.name : 'Sales Team';
            const status = quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1);

            doc.text(`Deal: ${dealTitle}`, 60, yPos, { width: 200 });
            doc.text(`Prepared By: ${preparedBy}`, 270, yPos, { width: 150 });
            doc.text(`Status: ${status}`, 430, yPos, { width: 105, align: 'right' });

            yPos += 30;

            // ═══════════════════════════════════════════════════════
            // 4️⃣ ITEMS / SERVICES TABLE - Clean & Professional
            // ═══════════════════════════════════════════════════════

            // Table Header
            const tableTop = yPos;
            doc.rect(50, tableTop, 495, 22)
                .fillAndStroke(colors.background, colors.borderDark);

            doc.fontSize(9)
                .font(fonts.bold)
                .fillColor(colors.text);

            // Column headers with proper alignment
            doc.text('#', 55, tableTop + 7, { width: 20 });
            doc.text('Item / Service', 80, tableTop + 7, { width: 150 });
            doc.text('Description', 235, tableTop + 7, { width: 120 });
            doc.text('Qty', 360, tableTop + 7, { width: 35, align: 'right' });
            doc.text('Unit Price', 400, tableTop + 7, { width: 65, align: 'right' });
            doc.text('Amount', 470, tableTop + 7, { width: 70, align: 'right' });

            yPos = tableTop + 27;

            // Table Rows - Clean spacing
            doc.fontSize(9)
                .font(fonts.regular)
                .fillColor(colors.text);

            quotation.items.forEach((item, index) => {
                // Check if new page needed
                if (yPos > 700) {
                    doc.addPage();
                    yPos = 50;
                }

                // Alternate row background
                if (index % 2 === 1) {
                    doc.rect(50, yPos - 3, 495, 28)
                        .fill(colors.primaryLight);
                }

                // Row number
                doc.fontSize(8)
                    .font(fonts.regular)
                    .fillColor(colors.textSecondary)
                    .text((index + 1).toString(), 55, yPos, { width: 20 });

                // Item name
                doc.fontSize(9)
                    .font(fonts.bold)
                    .fillColor(colors.text)
                    .text(item.itemName || 'Item', 80, yPos, { width: 150, lineBreak: false });

                // Description
                doc.fontSize(8)
                    .font(fonts.regular)
                    .fillColor(colors.textSecondary)
                    .text(item.description || '-', 235, yPos, { width: 120, lineBreak: false });

                // Quantity
                doc.fontSize(9)
                    .font(fonts.regular)
                    .fillColor(colors.text)
                    .text(item.quantity.toString(), 360, yPos, { width: 35, align: 'right' });

                // Unit Price
                doc.text(`${quotation.currencySymbol}${item.unitPrice.toLocaleString('en-IN')}`, 400, yPos, {
                    width: 65,
                    align: 'right'
                });

                // Amount
                doc.font(fonts.bold)
                    .text(`${quotation.currencySymbol}${item.lineTotal.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}`, 470, yPos, { width: 70, align: 'right' });

                yPos += 28;

                // Subtle row separator
                doc.moveTo(50, yPos - 1)
                    .lineTo(545, yPos - 1)
                    .strokeColor(colors.border)
                    .lineWidth(0.5)
                    .stroke();
            });

            yPos += 15;

            // ═══════════════════════════════════════════════════════
            // 5️⃣ PRICING SUMMARY - Right-aligned boxed section
            // ═══════════════════════════════════════════════════════

            const summaryX = 345;
            const summaryWidth = 200;

            // Summary box
            doc.rect(summaryX, yPos, summaryWidth, 95)
                .strokeColor(colors.borderDark)
                .lineWidth(1)
                .stroke();

            yPos += 12;

            doc.fontSize(9)
                .font(fonts.regular)
                .fillColor(colors.textSecondary);

            // Subtotal
            doc.text('Subtotal:', summaryX + 12, yPos);
            doc.font(fonts.regular)
                .fillColor(colors.text)
                .text(`${quotation.currencySymbol}${quotation.subtotal.toLocaleString('en-IN', {
                    minimumFractionDigits: 2
                })}`, summaryX + 12, yPos, {
                    width: summaryWidth - 24,
                    align: 'right'
                });
            yPos += 18;

            // Discount
            doc.font(fonts.regular)
                .fillColor(colors.textSecondary)
                .text('Discount:', summaryX + 12, yPos);
            doc.fillColor(colors.text)
                .text(`-${quotation.currencySymbol}${quotation.totalDiscount.toLocaleString('en-IN', {
                    minimumFractionDigits: 2
                })}`, summaryX + 12, yPos, {
                    width: summaryWidth - 24,
                    align: 'right'
                });
            yPos += 18;

            // Tax
            doc.fillColor(colors.textSecondary)
                .text('Tax:', summaryX + 12, yPos);
            doc.fillColor(colors.text)
                .text(`+${quotation.currencySymbol}${(quotation.totalTaxAmount || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2
                })}`, summaryX + 12, yPos, {
                    width: summaryWidth - 24,
                    align: 'right'
                });
            yPos += 22;

            // Grand Total (highlighted)
            doc.rect(summaryX, yPos - 3, summaryWidth, 28)
                .fillAndStroke(colors.primary, colors.primary);

            doc.fontSize(11)
                .font(fonts.bold)
                .fillColor(colors.white)
                .text('GRAND TOTAL:', summaryX + 12, yPos + 3);

            doc.fontSize(12)
                .text(`${quotation.currencySymbol}${quotation.grandTotal.toLocaleString('en-IN', {
                    minimumFractionDigits: 2
                })}`, summaryX + 12, yPos + 3, {
                    width: summaryWidth - 24,
                    align: 'right'
                });

            yPos += 45;

            // ═══════════════════════════════════════════════════════
            // 6️⃣ SCOPE OF WORK (Optional)
            // ═══════════════════════════════════════════════════════

            if (quotation.scopeOfWork) {
                yPos += 15;

                if (yPos > 650) {
                    doc.addPage();
                    yPos = 50;
                }

                doc.fontSize(11)
                    .font(fonts.bold)
                    .fillColor(colors.text)
                    .text('SCOPE OF WORK', 50, yPos);

                yPos += 18;

                doc.fontSize(9)
                    .font(fonts.regular)
                    .fillColor(colors.textSecondary)
                    .text(quotation.scopeOfWork, 50, yPos, {
                        width: 495,
                        align: 'justify',
                        lineGap: 3
                    });

                yPos += doc.heightOfString(quotation.scopeOfWork, { width: 495, lineGap: 3 }) + 20;
            }

            // ═══════════════════════════════════════════════════════
            // 7️⃣ COMMERCIAL TERMS - Neatly structured list
            // ═══════════════════════════════════════════════════════

            if (yPos > 650) {
                doc.addPage();
                yPos = 50;
            }

            doc.fontSize(11)
                .font(fonts.bold)
                .fillColor(colors.text)
                .text('COMMERCIAL TERMS', 50, yPos);

            yPos += 18;

            doc.fontSize(9)
                .font(fonts.regular)
                .fillColor(colors.textSecondary);

            const terms = [];
            if (quotation.paymentTerms) terms.push({ label: 'Payment Terms', value: quotation.paymentTerms });
            if (quotation.deliveryTimeline) terms.push({ label: 'Delivery Timeline', value: quotation.deliveryTimeline });
            if (quotation.warranty) terms.push({ label: 'Warranty/Support', value: quotation.warranty });
            terms.push({
                label: 'Validity',
                value: `Valid until ${new Date(quotation.priceValidUntil).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                })}`
            });

            terms.forEach(term => {
                doc.fillColor(colors.textLight)
                    .text('•', 50, yPos)
                    .fillColor(colors.text)
                    .font(fonts.bold)
                    .text(`${term.label}: `, 60, yPos, { continued: true })
                    .font(fonts.regular)
                    .fillColor(colors.textSecondary)
                    .text(term.value, { width: 480, lineGap: 2 });
                yPos += 16;
            });

            yPos += 10;

            // ═══════════════════════════════════════════════════════
            // 8️⃣ IMPORTANT DECLARATION - Highlighted info box
            // ═══════════════════════════════════════════════════════

            if (yPos > 680) {
                doc.addPage();
                yPos = 50;
            }

            // Declaration box
            doc.rect(50, yPos, 495, 55)
                .fillAndStroke(colors.warning, colors.warningBorder);

            yPos += 12;

            doc.fontSize(10)
                .font(fonts.bold)
                .fillColor(colors.warningText)
                .text('⚠ IMPORTANT DECLARATION', 60, yPos);

            yPos += 16;

            doc.fontSize(8)
                .font(fonts.regular)
                .fillColor(colors.warningText)
                .text('This quotation is not an invoice and does not require payment. Payment will be requested only after deal confirmation and invoice generation.',
                    60, yPos, { width: 475, align: 'justify', lineGap: 2 });

            yPos += 45;

            // ═══════════════════════════════════════════════════════
            // 9️⃣ FOOTER & SIGNATURE - Authorized signatory section
            // ═══════════════════════════════════════════════════════

            if (yPos > 680) {
                doc.addPage();
                yPos = 50;
            }

            yPos += 20;

            doc.fontSize(9)
                .font(fonts.regular)
                .fillColor(colors.textSecondary)
                .text(`For ${company.name}`, 50, yPos);

            yPos += 45;

            // Signature line
            doc.moveTo(50, yPos)
                .lineTo(180, yPos)
                .strokeColor(colors.borderDark)
                .lineWidth(1)
                .stroke();

            yPos += 8;

            doc.fontSize(8)
                .font(fonts.regular)
                .fillColor(colors.textLight)
                .text('Authorized Signatory', 50, yPos);

            yPos += 10;

            doc.fontSize(7)
                .fillColor(colors.textLight)
                .text(`Date: ${new Date().toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                })}`, 50, yPos);

            // ═══════════════════════════════════════════════════════
            // 🔟 PAGE FOOTER - System-generated note & page numbers
            // ═══════════════════════════════════════════════════════

            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);

                // Footer separator line
                doc.moveTo(50, 770)
                    .lineTo(545, 770)
                    .strokeColor(colors.border)
                    .lineWidth(0.5)
                    .stroke();

                doc.fontSize(7)
                    .font(fonts.regular)
                    .fillColor(colors.textLight)
                    .text('This is a system-generated quotation.', 50, 780, {
                        align: 'center',
                        width: 495
                    });

                doc.fontSize(7)
                    .text(`Page ${i + 1} of ${pages.count}`, 50, 792, {
                        align: 'center',
                        width: 495
                    });
            }

            // Finalize PDF
            doc.end();

            stream.on('finish', () => {
                resolve({
                    success: true,
                    filePath: outputPath,
                    url: `/uploads/quotations/${path.basename(outputPath)}`
                });
            });

            stream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateQuotationPDF };
