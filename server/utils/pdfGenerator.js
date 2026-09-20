const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure all required upload directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const requiredDirs = ['invoices', 'payslips', 'salary-slips', 'offer-letters', 'proposals', 'quotations', 'clients'];
requiredDirs.forEach(dir => {
  const dirPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

/**
 * Generate Invoice PDF - Professional Template for Software Development Company
 */
exports.generateInvoicePDF = async (invoice, client, createdBy) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const fileName = `invoice_${invoice.invoiceNumber}_${Date.now()}.pdf`;
      // Use root-level uploads folder: server/utils -> ../uploads/invoices
      const uploadsDir = path.join(__dirname, '../../uploads/invoices');

      console.log(`[PDF Generator] Generating invoice PDF: ${fileName}`);
      console.log(`[PDF Generator] __dirname: ${__dirname}`);
      console.log(`[PDF Generator] Uploads directory: ${uploadsDir}`);
      console.log(`[PDF Generator] Directory exists: ${fs.existsSync(uploadsDir)}`);

      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        console.log(`[PDF Generator] Creating directory: ${uploadsDir}`);
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, fileName);
      console.log(`[PDF Generator] Full file path: ${filePath}`);

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Color scheme for professional look
      const primaryColor = '#2563eb'; // Blue
      const darkColor = '#1e40af';
      const lightGray = '#f3f4f6';
      const textGray = '#6b7280';
      const borderGray = '#e5e7eb';

      // Header with colored background
      doc
        .rect(0, 0, 595, 120)
        .fill(primaryColor);

      // Company logo/name area
      doc
        .fillColor('#ffffff')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('ZYnextro', 50, 30)
        .fontSize(12)
        .font('Helvetica')
        .text('Technology Consulting', 50, 60)
        .fontSize(10)
        .text('Software Development & IT Solutions', 50, 80);

      // Invoice title
      doc
        .fontSize(32)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .text('INVOICE', 350, 40, { align: 'right' });

      // Invoice details box (white on colored background)
      doc
        .fillColor('#ffffff')
        .fontSize(10)
        .font('Helvetica')
        .text(`Invoice #: ${invoice.invoiceNumber}`, 350, 70, { align: 'right' })
        .text(`Date: ${new Date(invoice.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 350, 85, { align: 'right' })
        .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 350, 100, { align: 'right' });

      // Reset color
      doc.fillColor('#000000');

      // Company information section
      let yPos = 150;
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(darkColor)
        .text('FROM', 50, yPos)
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text('Zynextro Technology Consulting', 50, yPos + 20)
        .text('Software Development & IT Solutions', 50, yPos + 35)
        .text('Email: info@zynextro.com', 50, yPos + 50)
        .text('Phone: +1 (555) 123-4567', 50, yPos + 65)
        .text('Website: www.zynextro.com', 50, yPos + 80);

      // Client information section
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(darkColor)
        .text('BILL TO', 350, yPos)
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(client.name || 'N/A', 350, yPos + 20);

      if (client.company) {
        doc.text(client.company, 350, yPos + 35);
      }

      let clientYPos = yPos + 50;
      if (client.address) {
        if (client.address.street) {
          doc.text(client.address.street, 350, clientYPos);
          clientYPos += 15;
        }
        const addressParts = [];
        if (client.address.city) addressParts.push(client.address.city);
        if (client.address.state) addressParts.push(client.address.state);
        if (client.address.zipCode) addressParts.push(client.address.zipCode);
        if (addressParts.length > 0) {
          doc.text(addressParts.join(', '), 350, clientYPos);
          clientYPos += 15;
        }
        if (client.address.country) {
          doc.text(client.address.country, 350, clientYPos);
          clientYPos += 15;
        }
      }

      if (client.email) {
        doc.text(`Email: ${client.email}`, 350, clientYPos);
        clientYPos += 15;
      }
      if (client.phone) {
        doc.text(`Phone: ${client.phone}`, 350, clientYPos);
      }

      // Project/PO Number section if available
      yPos = 280;
      if (invoice.project || invoice.poNumber) {
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor(textGray);

        if (invoice.project) {
          doc.text(`Project: ${invoice.project}`, 50, yPos);
        }
        if (invoice.poNumber) {
          doc.text(`PO Number: ${invoice.poNumber}`, invoice.project ? 250 : 50, yPos);
        }
        yPos += 25;
      }

      // Items table header with background
      doc
        .rect(50, yPos, 495, 25)
        .fill(lightGray);

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(darkColor)
        .text('Item', 60, yPos + 8)
        .text('Description', 150, yPos + 8)
        .text('Qty', 380, yPos + 8)
        .text('Rate', 420, yPos + 8)
        .text('Amount', 480, yPos + 8);

      yPos += 30;

      // Invoice items
      invoice.items.forEach((item, index) => {
        const itemYPos = yPos + (index * 35);

        // Alternate row background for better readability
        if (index % 2 === 0) {
          doc
            .rect(50, itemYPos - 5, 495, 30)
            .fill('#fafafa');
        }

        // Item name
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text(item.name || `Item ${index + 1}`, 60, itemYPos);

        // Description
        if (item.description) {
          doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor(textGray)
            .text(item.description, 150, itemYPos, { width: 220, ellipsis: true });
        }

        // Quantity
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#000000')
          .text((item.quantity || 0).toString(), 380, itemYPos);

        // Rate
        doc
          .text(`$${(item.rate || 0).toFixed(2)}`, 420, itemYPos);

        // Amount
        doc
          .font('Helvetica-Bold')
          .text(`$${(item.amount || 0).toFixed(2)}`, 480, itemYPos);

        // Tax rate if applicable
        if (item.taxRate && item.taxRate > 0) {
          doc
            .fontSize(7)
            .font('Helvetica')
            .fillColor(textGray)
            .text(`Tax: ${item.taxRate}%`, 60, itemYPos + 12);
        }
      });

      yPos += (invoice.items.length * 35) + 20;

      // Totals section
      const totalsX = 380;
      const totalsWidth = 165;

      // Subtotal
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#000000')
        .text('Subtotal:', totalsX, yPos)
        .text(`$${invoice.subtotal.toFixed(2)}`, totalsX + 100, yPos, { align: 'right' });
      yPos += 18;

      // Discount
      if (invoice.discount > 0) {
        doc
          .text('Discount:', totalsX, yPos)
          .fillColor('#dc2626')
          .text(`-$${invoice.discount.toFixed(2)}`, totalsX + 100, yPos, { align: 'right' });
        doc.fillColor('#000000');
        yPos += 18;
      }

      // Shipping
      if (invoice.shipping > 0) {
        doc
          .text('Shipping:', totalsX, yPos)
          .text(`$${invoice.shipping.toFixed(2)}`, totalsX + 100, yPos, { align: 'right' });
        yPos += 18;
      }

      // Additional Charges
      if (invoice.additionalCharges > 0) {
        doc
          .text('Additional Charges:', totalsX, yPos)
          .text(`$${invoice.additionalCharges.toFixed(2)}`, totalsX + 100, yPos, { align: 'right' });
        yPos += 18;
      }

      // Tax
      if (invoice.tax > 0) {
        doc
          .text(`Tax (${invoice.taxRate || 0}%):`, totalsX, yPos)
          .text(`$${invoice.tax.toFixed(2)}`, totalsX + 100, yPos, { align: 'right' });
        yPos += 18;
      }

      // Divider line
      doc
        .moveTo(totalsX, yPos)
        .lineTo(totalsX + totalsWidth, yPos)
        .stroke(borderGray);
      yPos += 10;

      // Total (highlighted)
      doc
        .rect(totalsX - 5, yPos - 5, totalsWidth + 10, 30)
        .fill(lightGray);

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(darkColor)
        .text('Total Amount:', totalsX, yPos + 5)
        .fontSize(14)
        .text(`$${invoice.total.toFixed(2)}`, totalsX + 100, yPos + 3, { align: 'right' });

      // Payment information
      yPos += 50;
      if (invoice.amountPaid > 0 || invoice.balanceDue > 0) {
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor(darkColor)
          .text('Payment Information', 50, yPos);
        yPos += 15;

        if (invoice.amountPaid > 0) {
          doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#000000')
            .text(`Amount Paid: $${invoice.amountPaid.toFixed(2)}`, 50, yPos);
          yPos += 15;
        }

        if (invoice.balanceDue > 0) {
          doc
            .font('Helvetica-Bold')
            .fillColor('#dc2626')
            .text(`Balance Due: $${invoice.balanceDue.toFixed(2)}`, 50, yPos);
          yPos += 15;
        } else if (invoice.amountPaid >= invoice.total) {
          doc
            .font('Helvetica-Bold')
            .fillColor('#16a34a')
            .text('PAID IN FULL', 50, yPos);
          yPos += 15;
        }
      }

      // Terms and Notes section
      const notesYPos = Math.max(yPos + 20, 600);

      if (invoice.terms) {
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor(darkColor)
          .text('Payment Terms', 50, notesYPos)
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#000000')
          .text(invoice.terms, 50, notesYPos + 15, { width: 240 });
      }

      if (invoice.customerNotes || invoice.notes) {
        const notesX = invoice.terms ? 320 : 50;
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor(darkColor)
          .text('Notes', notesX, notesYPos)
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#000000')
          .text(invoice.customerNotes || invoice.notes || '', notesX, notesYPos + 15, { width: 220 });
      }

      // Footer with company information
      const pageHeight = doc.page.height;
      doc
        .moveTo(50, pageHeight - 80)
        .lineTo(545, pageHeight - 80)
        .stroke(borderGray);

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(textGray)
        .text('Thank you for your business!', 50, pageHeight - 70, { align: 'center' })
        .text('For any questions regarding this invoice, please contact us at info@zynextro.com', 50, pageHeight - 55, { align: 'center', width: 495 })
        .text('This is a computer-generated invoice and does not require a signature.', 50, pageHeight - 40, { align: 'center' });

      // Status badge
      if (invoice.status) {
        const statusColors = {
          'paid': '#16a34a',
          'pending': '#f59e0b',
          'overdue': '#dc2626',
          'sent': '#2563eb',
          'draft': textGray,
          'cancelled': '#6b7280'
        };
        const statusColor = statusColors[invoice.status.toLowerCase()] || textGray;

        doc
          .rect(450, pageHeight - 30, 95, 20)
          .fill(statusColor);

        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor('#ffffff')
          .text(invoice.status.toUpperCase(), 450, pageHeight - 25, { width: 95, align: 'center' });
      }

      doc.end();

      stream.on('finish', () => {
        // Wait a bit for file system to sync, then verify file was created
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const publicUrl = `/uploads/invoices/${fileName}`;

            console.log(`[PDF Generator] ==========================================`);
            console.log(`[PDF Generator] Invoice PDF created successfully!`);
            console.log(`[PDF Generator] File name: ${fileName}`);
            console.log(`[PDF Generator] Full path: ${filePath}`);
            console.log(`[PDF Generator] File size: ${stats.size} bytes`);
            console.log(`[PDF Generator] Public URL: ${publicUrl}`);
            console.log(`[PDF Generator] Accessible at: http://localhost:5000${publicUrl}`);
            console.log(`[PDF Generator] ==========================================`);

            resolve({
              filePath,
              fileName,
              url: publicUrl,
            });
          } else {
            console.error(`[PDF Generator] ERROR: PDF file was not created!`);
            console.error(`[PDF Generator] Expected path: ${filePath}`);
            console.error(`[PDF Generator] Directory exists: ${fs.existsSync(uploadsDir)}`);
            reject(new Error(`PDF file was not created at ${filePath}`));
          }
        }, 200); // Small delay to ensure file is fully written
      });

      stream.on('error', (error) => {
        console.error(`[PDF Generator] Stream error:`, error);
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Payroll/Salary Slip PDF
 */
exports.generatePayrollPDF = async (payroll, employee) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      console.log(`[PDF Generator] Raw Employee ID: ${employee.employeeId} (Type: ${typeof employee.employeeId})`);
      const safeEmployeeId = String(employee.employeeId).replace(/[^a-zA-Z0-9]/g, '_');
      console.log(`[PDF Generator] Safe Employee ID: ${safeEmployeeId}`);
      const fileName = `payslip_${safeEmployeeId}_${payroll.year}_${String(payroll.month).padStart(2, '0')}.pdf`;
      const uploadsDir = path.join(__dirname, '../../uploads/payslips');

      console.log(`[PDF Generator] Final Filename: ${fileName}`);
      console.log(`[PDF Generator] __dirname: ${__dirname}`);
      console.log(`[PDF Generator] Uploads directory: ${uploadsDir}`);

      if (!fs.existsSync(uploadsDir)) {
        console.log(`[PDF Generator] Creating directory: ${uploadsDir}`);
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, fileName);
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('SALARY SLIP', { align: 'center' })
        .moveDown();

      // Employee info
      doc
        .fontSize(12)
        .font('Helvetica')
        .text(`Employee ID: ${employee.employeeId}`, 50, 120)
        .text(`Name: ${employee.user?.name || 'N/A'}`, 50, 140)
        .text(`Department: ${employee.department || 'N/A'}`, 50, 160)
        .text(`Designation: ${employee.designation || 'N/A'}`, 50, 180)
        .text(`Month: ${new Date(payroll.year, payroll.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, 350, 120)
        .text(`Working Days: ${payroll.workingDays}`, 350, 140)
        .text(`Present Days: ${payroll.presentDays}`, 350, 160)
        .moveDown(2);

      let yPos = 250;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('EARNINGS', 50, yPos)
        .text('AMOUNT', 400, yPos);

      yPos += 20;
      doc
        .moveTo(50, yPos)
        .lineTo(550, yPos)
        .stroke();

      yPos += 15;
      doc
        .font('Helvetica')
        .text('Basic Salary', 50, yPos)
        .text(`$${payroll.salaryStructure.basic.toFixed(2)}`, 400, yPos);

      yPos += 20;
      doc
        .text('HRA', 50, yPos)
        .text(`$${payroll.salaryStructure.hra.toFixed(2)}`, 400, yPos);

      yPos += 20;
      doc
        .text('Allowances', 50, yPos)
        .text(`$${payroll.salaryStructure.allowances.toFixed(2)}`, 400, yPos);

      if (payroll.overtime.amount > 0) {
        yPos += 20;
        doc
          .text(`Overtime (${payroll.overtime.hours} hrs)`, 50, yPos)
          .text(`$${payroll.overtime.amount.toFixed(2)}`, 400, yPos);
      }

      if (payroll.bonuses > 0) {
        yPos += 20;
        doc
          .text('Bonuses', 50, yPos)
          .text(`$${payroll.bonuses.toFixed(2)}`, 400, yPos);
      }

      yPos += 25;
      doc
        .font('Helvetica-Bold')
        .text('Gross Salary', 50, yPos)
        .text(`$${payroll.salaryStructure.grossSalary.toFixed(2)}`, 400, yPos);

      yPos += 30;
      doc
        .font('Helvetica-Bold')
        .text('DEDUCTIONS', 50, yPos)
        .text('AMOUNT', 400, yPos);

      yPos += 20;
      doc
        .moveTo(50, yPos)
        .lineTo(550, yPos)
        .stroke();

      yPos += 15;
      doc
        .font('Helvetica')
        .text('PF', 50, yPos)
        .text(`$${payroll.salaryStructure.pf.toFixed(2)}`, 400, yPos);

      yPos += 20;
      doc
        .text('ESI', 50, yPos)
        .text(`$${payroll.salaryStructure.esi.toFixed(2)}`, 400, yPos);

      yPos += 20;
      doc
        .text('TDS', 50, yPos)
        .text(`$${payroll.salaryStructure.tds.toFixed(2)}`, 400, yPos);

      if (payroll.salaryStructure.otherDeductions > 0) {
        yPos += 20;
        doc
          .text('Other Deductions', 50, yPos)
          .text(`$${payroll.salaryStructure.otherDeductions.toFixed(2)}`, 400, yPos);
      }

      yPos += 25;
      doc
        .font('Helvetica-Bold')
        .text('Total Deductions', 50, yPos)
        .text(`$${payroll.salaryStructure.totalDeductions.toFixed(2)}`, 400, yPos);

      yPos += 30;
      doc
        .moveTo(50, yPos)
        .lineTo(550, yPos)
        .stroke();

      yPos += 15;
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Net Salary', 50, yPos)
        .text(`$${payroll.salaryStructure.netSalary.toFixed(2)}`, 400, yPos);

      // Footer
      doc
        .fontSize(8)
        .font('Helvetica')
        .text('This is a computer-generated document and does not require a signature.', 50, 700, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        // Wait a bit for file system to sync
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            console.log(`[PDF Generator] Payslip created successfully: ${filePath}`);
            resolve({
              filePath,
              fileName,
              url: `/uploads/payslips/${fileName}`,
            });
          } else {
            console.error(`[PDF Generator] ERROR: Payslip file was not created at ${filePath}`);
            reject(new Error(`Payslip file was not created at ${filePath}`));
          }
        }, 200);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Salary Slip PDF (New Salary Slip Module)
 */
exports.generateSalarySlipPDF = async (salarySlip, employee) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      console.log(`[PDF Generator] Raw Salary Slip Employee ID: ${employee.employeeId} (Type: ${typeof employee.employeeId})`);
      const safeEmployeeId = String(employee.employeeId).replace(/[^a-zA-Z0-9]/g, '_');
      console.log(`[PDF Generator] Safe Salary Slip Employee ID: ${safeEmployeeId}`);
      const fileName = `salary_slip_${safeEmployeeId}_${salarySlip.year}_${String(salarySlip.month).padStart(2, '0')}.pdf`;
      const uploadsDir = path.join(__dirname, '../../uploads/salary-slips');

      console.log(`[PDF Generator] Final Salary Slip Filename: ${fileName}`);
      console.log(`[PDF Generator] Uploads directory: ${uploadsDir}`);

      if (!fs.existsSync(uploadsDir)) {
        console.log(`[PDF Generator] Creating directory: ${uploadsDir}`);
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, fileName);
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const paymentDateStr = salarySlip.paymentDate
        ? new Date(salarySlip.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'To be announced';

      // Company Information (Header)
      const companyName = process.env.COMPANY_NAME || 'Zynextro Technology Consulting';
      const companyAddress = process.env.COMPANY_ADDRESS || '123 Business Street, City, State 12345';

      // Try to load company logo if exists
      const logoPath = path.join(__dirname, '../../uploads/company-logo.png');
      let hasLogo = fs.existsSync(logoPath);

      let headerYPos = 50;

      // Header Section with Company Logo and Info
      if (hasLogo) {
        try {
          // Add logo (max 80px height)
          doc.image(logoPath, 50, headerYPos, { width: 80, height: 80 });
          headerYPos = 50; // Logo starts at top
        } catch (logoError) {
          console.warn('Error loading company logo:', logoError.message);
          hasLogo = false;
        }
      }

      // Company name and address (centered, or offset if logo exists)
      const textStartX = hasLogo ? 150 : 50;
      const textWidth = hasLogo ? 400 : 500;

      doc
        .fillColor('#1e40af')
        .fontSize(hasLogo ? 18 : 20)
        .font('Helvetica-Bold')
        .text(companyName, textStartX, headerYPos + (hasLogo ? 10 : 0), { width: textWidth, align: hasLogo ? 'left' : 'center' })
        .fillColor('#4b5563')
        .fontSize(10)
        .font('Helvetica')
        .text(companyAddress, textStartX, headerYPos + (hasLogo ? 35 : 25), { width: textWidth, align: hasLogo ? 'left' : 'center' });

      // Salary Slip Title (centered)
      doc
        .fillColor('#000000')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(`Salary Slip – ${monthNames[salarySlip.month - 1]} ${salarySlip.year}`, { align: 'center' })
        .moveDown(1.5);

      // Draw header line
      doc
        .moveTo(50, 150)
        .lineTo(550, 150)
        .lineWidth(2)
        .strokeColor('#1e40af')
        .stroke()
        .lineWidth(1)
        .strokeColor('#000000');

      let yPos = 170;

      // Employee Details Section
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Employee Details', 50, yPos);

      yPos += 25;
      doc
        .fontSize(11)
        .font('Helvetica')
        .text(`Name: ${employee.user?.name || 'N/A'}`, 50, yPos)
        .text(`Employee ID: ${employee.employeeId}`, 300, yPos);

      yPos += 20;
      doc
        .text(`Department: ${employee.department || 'N/A'}`, 50, yPos)
        .text(`Designation: ${employee.designation || 'N/A'}`, 300, yPos);

      yPos += 30;

      // Earnings Table
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('EARNINGS', 50, yPos);

      yPos += 20;
      doc
        .moveTo(50, yPos)
        .lineTo(550, yPos)
        .stroke();

      yPos += 15;
      doc.font('Helvetica').fontSize(11);

      // Always show basic salary
      doc.text('Basic Salary', 50, yPos).text(`₹${(salarySlip.earnings.basic || 0).toFixed(2)}`, 450, yPos);
      yPos += 20;

      if (salarySlip.earnings.hra > 0) {
        doc.text('HRA', 50, yPos).text(`₹${salarySlip.earnings.hra.toFixed(2)}`, 450, yPos);
        yPos += 20;
      }

      if (salarySlip.earnings.allowances > 0) {
        doc.text('Allowances', 50, yPos).text(`₹${salarySlip.earnings.allowances.toFixed(2)}`, 450, yPos);
        yPos += 20;
      }

      if (salarySlip.earnings.bonus > 0) {
        doc.text('Bonus', 50, yPos).text(`₹${salarySlip.earnings.bonus.toFixed(2)}`, 450, yPos);
        yPos += 20;
      }

      if (salarySlip.earnings.overtime > 0) {
        doc.text('Overtime Pay', 50, yPos).text(`₹${salarySlip.earnings.overtime.toFixed(2)}`, 450, yPos);
        yPos += 20;
      }

      yPos += 10;
      doc
        .moveTo(50, yPos)
        .lineTo(550, yPos)
        .stroke();

      yPos += 15;
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('Gross Salary', 50, yPos)
        .text(`₹${salarySlip.earnings.totalEarnings.toFixed(2)}`, 450, yPos);

      yPos += 30;

      // Deductions Table
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('DEDUCTIONS', 50, yPos);

      yPos += 20;
      doc
        .moveTo(50, yPos)
        .lineTo(550, yPos)
        .stroke();

      yPos += 15;
      doc.font('Helvetica').fontSize(11);

      if (salarySlip.deductions.unpaidLeave > 0) {
        doc.text('Unpaid Leave Deduction', 50, yPos).text(`₹${salarySlip.deductions.unpaidLeave.toFixed(2)}`, 450, yPos);
        yPos += 20;
      }

      if (salarySlip.deductions.tax > 0) {
        doc.text('Tax (TDS)', 50, yPos).text(`₹${salarySlip.deductions.tax.toFixed(2)}`, 450, yPos);
        yPos += 20;
      }

      if (salarySlip.deductions.pf > 0) {
        doc.text('PF (Provident Fund)', 50, yPos).text(`₹${salarySlip.deductions.pf.toFixed(2)}`, 450, yPos);
        yPos += 20;
      }

      if (salarySlip.deductions.esi > 0) {
        doc.text('ESI', 50, yPos).text(`₹${salarySlip.deductions.esi.toFixed(2)}`, 450, yPos);
        yPos += 20;
      }

      if (salarySlip.deductions.loan > 0) {
        doc.text('Loan', 50, yPos).text(`₹${salarySlip.deductions.loan.toFixed(2)}`, 450, yPos);
        yPos += 20;
      }

      if (salarySlip.deductions.other > 0) {
        doc.text('Other Deductions', 50, yPos).text(`₹${salarySlip.deductions.other.toFixed(2)}`, 450, yPos);
        yPos += 20;
      }

      yPos += 10;
      doc
        .moveTo(50, yPos)
        .lineTo(550, yPos)
        .stroke();

      yPos += 15;
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('Total Deductions', 50, yPos)
        .text(`₹${salarySlip.deductions.totalDeductions.toFixed(2)}`, 450, yPos);

      yPos += 30;
      doc
        .moveTo(50, yPos)
        .lineTo(550, yPos)
        .lineWidth(2)
        .stroke();

      yPos += 20;
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('Net Salary (Final Amount Credited)', 50, yPos)
        .text(`₹${salarySlip.netSalary.toFixed(2)}`, 450, yPos)
        .fillColor('#000000');

      yPos += 30;
      doc
        .fontSize(11)
        .font('Helvetica')
        .text(`Payment Date: ${paymentDateStr}`, 50, yPos);

      // Footer Section
      yPos = 700;
      doc
        .fontSize(9)
        .font('Helvetica')
        .text('HR/Admin Signature', 50, yPos)
        .text('_________________', 50, yPos + 15);

      doc
        .fontSize(8)
        .text('This is a computer-generated document and does not require a physical signature.', 50, yPos + 40, { align: 'center', width: 500 })
        .text(`Generated on: ${new Date(salarySlip.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, yPos + 55, { align: 'center', width: 500 });

      doc.end();

      stream.on('finish', () => {
        resolve({
          filePath,
          fileName,
          url: `/uploads/salary-slips/${fileName}`,
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

/**
 * Generate Offer Letter PDF
 */
exports.generateOfferLetterPDF = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      let applicant, position, salary, startDate, reportingManager, offerDetails;

      // Handle Mongoose Document input (from Controller)
      // Check for document properties like candidateName
      if (data.candidateName || (data.salaryDetails && data._id)) {
        const nameParts = (data.candidateName || '').split(' ');
        applicant = {
          _id: data.application?._id || data._id,
          firstName: nameParts[0] || 'Candidate',
          lastName: nameParts.slice(1).join(' ') || '',
          email: data.candidateEmail,
          phone: data.candidatePhone,
          jobPosting: data.jobPosting
        };
        position = data.designation;
        salary = data.salaryDetails?.annualCTC;
        startDate = data.joiningDate;
        reportingManager = 'Hiring Manager';

        offerDetails = [];
        if (data.additionalTerms) {
          offerDetails.push({ label: 'Additional Terms', value: data.additionalTerms });
        }
      } else {
        // Handle legacy object input
        ({ applicant, position, salary, startDate, reportingManager, offerDetails } = data);
      }

      if (!applicant) applicant = { firstName: 'Candidate', _id: 'unknown' };

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const fileName = `offer_letter_${applicant._id || 'doc'}_${Date.now()}.pdf`;
      const uploadsDir = path.join(__dirname, '../../uploads/offer-letters');

      // Ensure directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, fileName);
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      let yPos = 50;

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('OFFER LETTER', { align: 'center' })
        .moveDown(2);

      // Date
      doc
        .fontSize(11)
        .font('Helvetica')
        .text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'right' })
        .moveDown(2);

      // Applicant info
      yPos = 150;
      doc
        .fontSize(11)
        .font('Helvetica')
        .text(`${applicant.firstName} ${applicant.lastName}`, 50, yPos)
        .text(applicant.email || '', 50, yPos + 15)
        .text(applicant.phone || '', 50, yPos + 30);

      // Company info
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Zynextro Technology Consulting', 350, yPos)
        .fontSize(10)
        .font('Helvetica')
        .text('123 Business Street', 350, yPos + 15)
        .text('City, State 12345', 350, yPos + 30)
        .text('Email: info@zynextro.com', 350, yPos + 45);

      yPos = 250;
      doc.moveDown(3);

      // Subject
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Subject: Offer of Employment', 50, yPos)
        .moveDown(2);

      yPos += 40;

      // Body
      doc
        .fontSize(11)
        .font('Helvetica')
        .text(`Dear ${applicant.firstName},`, 50, yPos)
        .moveDown();

      yPos += 30;
      doc
        .text(`We are pleased to offer you the position of ${position || applicant.jobPosting?.title || 'Position'} at Zynextro Technology Consulting.`, 50, yPos, { width: 500 })
        .moveDown();

      yPos += 30;
      doc
        .text('Details of your offer are as follows:', 50, yPos)
        .moveDown(2);

      yPos += 30;
      const details = [
        { label: 'Position:', value: position || applicant.jobPosting?.title || 'N/A' },
        { label: 'Salary:', value: salary ? `$${salary.toLocaleString()}` : 'As per company policy' },
        { label: 'Start Date:', value: startDate ? new Date(startDate).toLocaleDateString() : 'To be discussed' },
        { label: 'Reporting Manager:', value: reportingManager || 'To be assigned' },
      ];

      details.forEach((detail, index) => {
        doc
          .font('Helvetica-Bold')
          .text(detail.label, 70, yPos + (index * 20))
          .font('Helvetica')
          .text(detail.value, 200, yPos + (index * 20));
      });

      yPos += details.length * 20 + 30;

      // Additional offer details
      if (offerDetails && Array.isArray(offerDetails) && offerDetails.length > 0) {
        doc.moveDown();
        offerDetails.forEach((detail, index) => {
          const label = detail.label || detail.key || '';
          const value = detail.value || '';
          doc
            .font('Helvetica-Bold')
            .text(label + ':', 70, yPos + (index * 20))
            .font('Helvetica')
            .text(value, 200, yPos + (index * 20));
        });
        yPos += offerDetails.length * 20 + 20;
      }

      // Closing
      doc.moveDown(2);
      doc
        .text('We look forward to welcoming you to our team. Please confirm your acceptance of this offer.', 50, yPos, { width: 500 })
        .moveDown(2);

      yPos += 60;
      doc
        .text('Sincerely,', 50, yPos)
        .moveDown(2)
        .text('HR Department', 50, yPos + 30)
        .text('Zynextro Technology Consulting', 50, yPos + 45);

      // Footer
      const pageHeight = doc.page.height;
      doc
        .fontSize(8)
        .font('Helvetica')
        .text('This is a system-generated document. Please contact HR for any queries.', 50, pageHeight - 50, { width: 500, align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve({
          filePath,
          fileName,
          url: `/uploads/offer-letters/${fileName}`,
        });
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};