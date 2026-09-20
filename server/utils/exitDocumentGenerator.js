const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper to ensure directory exists
const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

/**
 * Generate a professional exit document (Experience, Relieving, Termination)
 * @param {Object} data - Document data
 * @param {string} type - 'experience', 'relieving', 'termination'
 */
exports.generateExitDocumentPDF = async (data, type) => {
    return new Promise((resolve, reject) => {
        try {
            const {
                employeeName,
                employeeId,
                department,
                designation,
                joiningDate,
                lastWorkingDate,
                companyName,
                companyAddress,
                docTitle,
                contentBody,    // Array of strings (paragraphs)
                signatoryName,
                signatoryDesignation,
                referenceNumber
            } = data;

            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const timestamp = Date.now();
            // type should be capitalized for filename for better look
            const typeCap = type.charAt(0).toUpperCase() + type.slice(1);
            const fileName = `${typeCap}_Letter_${employeeId}_${timestamp}.pdf`;

            // Define path (root/uploads/exit-documents)
            // Accessing from server/utils, so go up to root then uploads
            const uploadsRoot = path.resolve(__dirname, '..', '..', 'uploads');
            const docsDir = path.join(uploadsRoot, 'exit-documents');
            ensureDir(docsDir);

            const filePath = path.join(docsDir, fileName);
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // --- STYLING CONSTANTS ---
            const colors = {
                primary: '#1e3a8a', // Dark Blue
                text: '#1f2937',    // Dark Gray
                lightText: '#6b7280', // Light Gray
                line: '#e5e7eb',    // Light border
                boxBg: '#f9fafb',   // Very light gray
                boxBorder: '#d1d5db' // Gray border
            };

            // --- HEADER ---
            // Company Name
            doc.font('Helvetica-Bold').fontSize(22).fillColor(colors.primary).text(companyName, { align: 'center' });
            doc.moveDown(0.2);

            // Company Address (Placeholder if empty)
            // If address is provided, split it? Assuming string.
            const address = companyAddress || 'Human Resources Department';
            doc.font('Helvetica').fontSize(10).fillColor(colors.lightText).text(address, { align: 'center' });

            doc.moveDown(1);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(colors.line).lineWidth(1).stroke();
            doc.moveDown(2);

            // --- METADATA ---
            doc.font('Helvetica').fontSize(10).fillColor(colors.text);

            // Date (Right aligned)
            const dateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
            doc.text(`Date: ${dateStr}`, { align: 'right' });

            // Reference Number (Left aligned - handled by ensuring we write at specific Y if needed or just left)
            if (referenceNumber) {
                doc.moveUp(); // Go back up
                doc.text(`Ref: ${referenceNumber}`, { align: 'left' });
            }
            doc.moveDown(2);

            // --- TITLE ---
            doc.font('Helvetica-Bold').fontSize(16).fillColor(colors.text).text(docTitle.toUpperCase(), { align: 'center', underline: true });
            doc.moveDown(2);

            // --- SALUTATION ---
            doc.font('Helvetica').fontSize(11).text('TO WHOM IT MAY CONCERN', { align: 'left' });
            doc.moveDown(1.5);

            // --- CONTENT BODY ---
            doc.font('Helvetica').fontSize(11).lineGap(5);

            if (Array.isArray(contentBody)) {
                contentBody.forEach(paragraph => {
                    doc.text(paragraph, { align: 'justify' });
                    doc.moveDown(1);
                });
            } else if (typeof contentBody === 'string') {
                doc.text(contentBody, { align: 'justify' });
                doc.moveDown(1);
            }

            // --- EMPLOYEE DETAILS BOX ---
            // We will draw a box with details
            const startY = doc.y;
            const boxLeft = 70;
            const boxWidth = 455;
            const padding = 15;
            const lineHeight = 20;

            const details = [
                { label: 'Employee Name', value: employeeName },
                { label: 'Employee ID', value: employeeId },
                { label: 'Designation', value: designation },
                { label: 'Department', value: department },
                { label: 'Date of Joining', value: joiningDate },
                { label: 'Date of Leaving', value: lastWorkingDate },
            ];

            // Calculate box height
            const boxHeight = (details.length * lineHeight) + (padding * 2);

            // Check if we need new page
            if (startY + boxHeight > 700) {
                doc.addPage();
            }

            const currentY = doc.y; // Update Y in case of new page

            // Draw Box
            doc.rect(boxLeft, currentY, boxWidth, boxHeight)
                .fillAndStroke(colors.boxBg, colors.boxBorder);

            doc.fillColor(colors.text); // Reset text color

            // Write details
            let textY = currentY + padding;
            const labelX = boxLeft + padding;
            const sepX = boxLeft + 190;
            const valueX = boxLeft + 200;

            details.forEach(item => {
                doc.font('Helvetica-Bold').text(item.label, labelX, textY);
                doc.font('Helvetica').text(':', sepX, textY);
                doc.font('Helvetica').text(item.value, valueX, textY);
                textY += lineHeight;
            });

            doc.y = currentY + boxHeight + 30; // Move cursor below box

            // --- CLOSING REMARKS ---
            // Optional closing if not in body
            // doc.text('We wish you all the best for your future endeavors.', { align: 'left' });
            // doc.moveDown(3);

            // --- SIGNATORY ---
            // Check for page break
            if (doc.y + 100 > doc.page.height - 50) {
                doc.addPage();
            }

            doc.font('Helvetica-Bold').text('For ' + companyName, { align: 'left' });
            doc.moveDown(4); // Space for signature

            doc.text('Authorized Signatory', { align: 'left' });

            if (signatoryName) {
                doc.font('Helvetica').text(signatoryName, { align: 'left' });
            }

            if (signatoryDesignation) {
                doc.font('Helvetica').text(signatoryDesignation, { align: 'left' });
            }

            // --- FOOTER ---
            const pageHeight = doc.page.height;
            doc.fontSize(8).fillColor(colors.lightText);

            // Draw line above footer
            doc.moveTo(50, pageHeight - 60).lineTo(545, pageHeight - 60).strokeColor(colors.line).stroke();

            doc.text('This is a system-generated document and is valid without a physical signature.', 50, pageHeight - 45, { align: 'center' });
            // Can add unique ID/Barcode here if needed for "audit-safe"
            const docId = `ID: ${path.basename(fileName, '.pdf')}`;
            doc.text(docId, 50, pageHeight - 35, { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                resolve({
                    filename: fileName,
                    path: filePath,
                    url: `/uploads/exit-documents/${fileName}`
                });
            });

            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};
