const nodemailer = require('nodemailer');

/**
 * Create NodeMailer transporter with Hostinger SMTP configuration
 * Uses exact Hostinger SMTP settings: smtp.hostinger.com:465 with SSL
 */
const createTransporter = () => {
  // Hostinger SMTP credentials - use environment variables or defaults
  const emailHost = process.env.EMAIL_HOST || 'smtp.hostinger.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');
  const emailUser = process.env.EMAIL_USER || 'info@zynextro.com';
  const emailPass = process.env.EMAIL_PASS || 'Auks@99india';

  // Ensure credentials are provided
  if (!emailUser || !emailPass) {
    console.warn('Email configuration not found. Email functionality will be disabled.');
    return null;
  }

  // Log configuration for debugging (without password)
  console.log('=== SMTP Configuration ===');
  console.log('Host:', emailHost);
  console.log('Port:', emailPort);
  console.log('Secure:', emailPort === 465);
  console.log('User:', emailUser);
  console.log('=====================================');

  const emailConfig = {
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465, // true for 465, false for 587
    auth: {
      user: emailUser.trim(),
      pass: emailPass.trim(),
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000,     // 60 seconds
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development',
  };

  try {
    const transporter = nodemailer.createTransport(emailConfig);
    console.log('✓ SMTP Transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('✗ Failed to create email transporter:', error);
    throw error;
  }
};

/**
 * Generic Send Email Function
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} options.text - Plain text body (optional)
 * @param {Array} options.attachments - Attachments (optional)
 */
exports.sendEmail = async (options) => {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const emailUser = process.env.EMAIL_USER || 'info@zynextro.com';
  const companyName = process.env.COMPANY_NAME || 'Zynextro CRM';

  const mailOptions = {
    from: `"${companyName}" <${emailUser}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: options.attachments || [],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Email sent successfully to ${options.to}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Service] Error sending email:', error);
    throw error;
  }
};

/**
 * Send Invoice Email
 */
exports.sendInvoiceEmail = async (invoice, client, pdfPath = null) => {
  console.log('[Email Service] sendInvoiceEmail called');
  console.log('[Email Service] Invoice:', invoice.invoiceNumber);
  console.log('[Email Service] Client:', client ? (client.name || client.email || 'Unknown') : 'Not provided');
  console.log('[Email Service] PDF Path:', pdfPath || 'No PDF');

  const transporter = createTransporter();
  if (!transporter) {
    console.error('[Email Service] Email transporter not available');
    throw new Error('Email service not configured. Please check EMAIL_USER and EMAIL_PASS environment variables.');
  }

  // Validate client
  if (!client) {
    throw new Error('Client information is required to send invoice email');
  }

  // Get client email - handle both object and string
  const clientEmail = typeof client === 'string' ? client : (client.email || null);
  const clientName = typeof client === 'object' ? (client.name || 'Client') : 'Client';

  if (!clientEmail) {
    throw new Error('Client email is required to send invoice email');
  }

  console.log(`[Email Service] Sending email to: ${clientEmail}`);

  const attachments = [];
  if (pdfPath) {
    const fs = require('fs');
    if (fs.existsSync(pdfPath)) {
      attachments.push({
        filename: `invoice_${invoice.invoiceNumber || 'invoice'}.pdf`,
        path: pdfPath,
      });
      console.log(`[Email Service] PDF attachment added: ${pdfPath}`);
    } else {
      console.warn(`[Email Service] PDF file not found: ${pdfPath}, sending email without attachment`);
    }
  }

  const emailUser = process.env.EMAIL_USER || 'info@zynextro.com';
  const invoiceNumber = invoice.invoiceNumber || 'N/A';
  const issueDate = invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A';
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A';
  const total = invoice.total ? invoice.total.toFixed(2) : '0.00';
  const status = invoice.status || 'pending';
  const notes = invoice.notes || invoice.customerNotes || '';

  const mailOptions = {
    from: `"Zynextro CRM" <${emailUser}>`,
    to: clientEmail,
    subject: `Invoice ${invoiceNumber} - Payment Due`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Invoice ${invoiceNumber}</h2>
        <p>Dear ${clientName},</p>
        <p>We hope this message finds you well. This is a reminder that the following invoice is due for payment:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p><strong>Issue Date:</strong> ${issueDate}</p>
          <p><strong>Due Date:</strong> ${dueDate}</p>
          <p><strong>Amount:</strong> $${total}</p>
          <p><strong>Status:</strong> ${status}</p>
        </div>

        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}

        <p>Please find the invoice attached for your records.</p>
        <p>If you have already made the payment, please ignore this email.</p>
        
        <p>Thank you for your business!</p>
        <p>Best regards,<br>Zynextro Team</p>
      </div>
    `,
    attachments,
  };

  try {
    console.log('[Email Service] Attempting to send email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email Service] Email sent successfully. Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Service] Error sending invoice email:', error);
    console.error('[Email Service] Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Send Proposal Email
 */
exports.sendProposalEmail = async (proposal, recipient, pdfPath = null) => {
  console.log('[Email Service] sendProposalEmail called');
  console.log('[Email Service] Proposal:', proposal.proposalNumber);
  console.log('[Email Service] Recipient:', recipient ? (recipient.name || recipient.firstName || recipient.email || 'Unknown') : 'Not provided');

  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  // Validate recipient
  if (!recipient) {
    throw new Error('Recipient information is required to send proposal email');
  }

  const recipientEmail = typeof recipient === 'string' ? recipient : (recipient.email || null);
  const recipientName = typeof recipient === 'object' ? (recipient.name || recipient.firstName || 'Client') : 'Client';

  if (!recipientEmail) {
    throw new Error('Recipient email is required');
  }

  const attachments = [];
  if (pdfPath) {
    const fs = require('fs');
    if (fs.existsSync(pdfPath)) {
      attachments.push({
        filename: `proposal_${proposal.proposalNumber || 'draft'}.pdf`,
        path: pdfPath,
      });
    }
  }

  const emailUser = process.env.EMAIL_USER || 'info@zynextro.com';
  const proposalNumber = proposal.proposalNumber || 'N/A';

  // Safe date formatting
  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A';

  const issueDate = formatDate(proposal.issueDate);
  const expiryDate = formatDate(proposal.expiryDate || proposal.validUntil);
  const total = (typeof proposal.total === 'number') ? proposal.total.toFixed(2) : (parseFloat(proposal.total) || 0).toFixed(2);
  const status = proposal.status || 'draft';
  const title = proposal.title || 'Proposal';

  const mailOptions = {
    from: `"Zynextro CRM" <${emailUser}>`,
    to: recipientEmail,
    subject: `Proposal ${proposalNumber}: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Proposal ${proposalNumber}</h2>
        <p>Dear ${recipientName},</p>
        <p>Please find attached the proposal for <strong>${title}</strong>.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Proposal Number:</strong> ${proposalNumber}</p>
          <p><strong>Issue Date:</strong> ${issueDate}</p>
          <p><strong>Valid Until:</strong> ${expiryDate}</p>
          <p><strong>Total Value:</strong> $${total}</p>
        </div>

        <p>We look forward to your feedback.</p>
        
        <p>Best regards,<br>Zynextro Team</p>
      </div>
    `,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email Service] Proposal email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Service] Error sending proposal email:', error);
    throw error;
  }
};

/**
 * Send Quotation Email
 */
exports.sendQuotationEmail = async (quotation, recipient, pdfPath = null) => {
  console.log('[Email Service] sendQuotationEmail called');
  console.log('[Email Service] Quotation:', quotation.quotationNumber);
  console.log('[Email Service] Recipient:', recipient ? (recipient.name || recipient.firstName || recipient.email || 'Unknown') : 'Not provided');

  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  // Validate recipient
  if (!recipient) {
    throw new Error('Recipient information is required to send quotation email');
  }

  const recipientEmail = typeof recipient === 'string' ? recipient : (recipient.email || null);
  const recipientName = typeof recipient === 'object' ? (recipient.name || recipient.firstName || 'Client') : 'Client';

  if (!recipientEmail) {
    throw new Error('Recipient email is required');
  }

  const attachments = [];
  if (pdfPath) {
    try {
      const fs = require('fs');
      if (fs.existsSync(pdfPath)) {
        attachments.push({
          filename: `quotation_${quotation.quotationNumber || 'draft'}.pdf`,
          path: pdfPath,
        });
      }
    } catch (err) {
      console.error('Error attaching PDF:', err);
    }
  }

  const emailUser = process.env.EMAIL_USER || 'info@zynextro.com';
  const quotationNumber = quotation.quotationNumber || 'N/A';
  const title = quotation.quotationName || 'Quotation';
  const validUntil = quotation.priceValidUntil ? new Date(quotation.priceValidUntil).toLocaleDateString() : 'N/A';
  const total = (quotation.grandTotal || 0).toFixed(2);
  const currency = quotation.currencySymbol || '₹';

  const mailOptions = {
    from: `"Zynextro CRM" <${emailUser}>`,
    to: recipientEmail,
    subject: `Quotation ${quotationNumber}: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Quotation ${quotationNumber}</h2>
        <p>Dear ${recipientName},</p>
        <p>Please find attached the quotation for <strong>${title}</strong>.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Quotation Number:</strong> ${quotationNumber}</p>
          <p><strong>Date:</strong> ${new Date(quotation.quotationDate).toLocaleDateString()}</p>
          <p><strong>Valid Until:</strong> ${validUntil}</p>
          <p><strong>Total Amount:</strong> ${currency}${total}</p>
        </div>

        <p>If you have any questions or would like to proceed, please let us know.</p>
        
        <p>Best regards,<br>Zynextro Team</p>
      </div>
    `,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email Service] Quotation email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Check if it's a specific SMTP error (like 535 Auth failed)
    if (error.responseCode === 535 || error.code === 'EAUTH') {
      throw new Error('SMTP Authentication Failed. Please check email configuration.');
    }
    console.error('[Email Service] Error sending quotation email:', error);
    throw error;
  }
};

/**
 * Send Payment Reminder Email
 */
exports.sendPaymentReminder = async (invoice, client, reminderType = 'due_date') => {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const isOverdue = new Date(invoice.dueDate) < new Date();
  const daysOverdue = isOverdue
    ? Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))
    : 0;

  let subject = '';
  let message = '';

  if (reminderType === 'overdue' || isOverdue) {
    subject = `URGENT: Overdue Invoice ${invoice.invoiceNumber} - ${daysOverdue} Days Past Due`;
    message = `
      <p>We notice that invoice <strong>${invoice.invoiceNumber}</strong> is now <strong>${daysOverdue} days overdue</strong>.</p>
      <p>We kindly request immediate payment to avoid any service interruptions.</p>
    `;
  } else {
    subject = `Reminder: Invoice ${invoice.invoiceNumber} Payment Due Soon`;
    const daysUntilDue = Math.floor((new Date(invoice.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    message = `
      <p>This is a friendly reminder that invoice <strong>${invoice.invoiceNumber}</strong> will be due in <strong>${daysUntilDue} days</strong>.</p>
    `;
  }

  const mailOptions = {
    from: `"Zynextro CRM" <${process.env.EMAIL_USER}>`,
    to: client.email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${isOverdue ? '#d32f2f' : '#333'};">Payment Reminder</h2>
        <p>Dear ${client.name},</p>
        ${message}
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p><strong>Amount Due:</strong> $${invoice.total.toFixed(2)}</p>
        </div>

        <p>Please make the payment at your earliest convenience. If you have any questions or concerns, please don't hesitate to contact us.</p>
        
        <p>Thank you!</p>
        <p>Best regards,<br>Zynextro Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    throw error;
  }
};

/**
 * Send Password Reset Email
 */
exports.sendPasswordResetEmail = async (email, name, resetUrl) => {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  // Clean reset URL (remove any whitespace or extra characters)
  const cleanResetUrl = resetUrl.trim();

  const mailOptions = {
    from: 'Zynextro CRM <info@zynextro.com>',
    to: email,
    subject: 'Password Reset Request - Zynextro CRM',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 20px 0; text-align: center;">
              <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px 30px; text-align: center; background-color: #4CAF50; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Password Reset Request</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">Dear ${name || 'User'},</p>
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">You have requested to reset your password for your Zynextro CRM account.</p>
                    <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.6;">Please click on the button below to reset your password:</p>
        
                    <table role="presentation" style="width: 100%; margin: 30px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${cleanResetUrl}" 
                             style="display: inline-block; background-color: #4CAF50; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Reset Password
          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 30px 0 10px 0; color: #666666; font-size: 14px; line-height: 1.6;">Or copy and paste this link into your browser:</p>
                    <p style="margin: 0 0 30px 0; word-break: break-all; color: #4CAF50; font-size: 14px; line-height: 1.6;">${cleanResetUrl}</p>
                    
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                        <strong>Important:</strong> This link will expire in 10 minutes. If you did not request this password reset, please ignore this email and your password will remain unchanged.
                      </p>
        </div>
        
                    <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">If you have any questions or concerns, please contact our support team.</p>
                    
                    <p style="margin: 30px 0 0 0; color: #333333; font-size: 14px; line-height: 1.6;">Thank you!</p>
                    <p style="margin: 10px 0 0 0; color: #333333; font-size: 14px; line-height: 1.6;">Best regards,<br><strong>Zynextro Team</strong></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 30px; text-align: center; background-color: #f5f5f5; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; color: #999999; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    // Verify SMTP connection before sending (helps catch auth errors early)
    console.log('Verifying SMTP connection to Hostinger...');
    await transporter.verify();
    console.log('✓ SMTP connection verified successfully');

    // Send the password reset email
    console.log(`Sending password reset email to: ${email}`);
    const info = await transporter.sendMail(mailOptions);

    console.log('✓ Password reset email sent successfully!');
    console.log('Email Details:', {
      messageId: info.messageId,
      to: email,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Comprehensive error logging with all SMTP error details
    console.error('\n========== SMTP ERROR DETAILS ==========');
    console.error('Error Code:', error.code);
    console.error('Error Command:', error.command);
    console.error('Error Response:', error.response);
    console.error('Error Response Code:', error.responseCode);
    console.error('Error Message:', error.message);

    // Log full error object for debugging
    if (error.code) {
      console.error('Full Error Object:', {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        message: error.message,
      });
    }
    console.error('========================================\n');

    // Handle authentication errors (535, EAUTH, etc.)
    if (
      error.code === 'EAUTH' ||
      error.command === 'AUTH' ||
      (error.response && (error.response.includes('535') || error.response.includes('Authentication failed'))) ||
      error.message.includes('535') ||
      error.message.includes('Authentication failed')
    ) {
      console.error('❌ SMTP AUTHENTICATION ERROR DETECTED');
      console.error('Error Details:', {
        code: error.code,
        response: error.response,
        command: error.command,
        responseCode: error.responseCode,
      });

      console.error('\n--- Troubleshooting Steps ---');
      console.error('1. Verify email address: info@zynextro.com');
      console.error('2. Verify password is correct (case-sensitive, no spaces)');
      console.error('3. Check Hostinger email account is active');
      console.error('4. Ensure SMTP is enabled in Hostinger control panel');
      console.error('5. Try resetting email password in Hostinger');
      console.error('6. If 2FA is enabled, use Hostinger SMTP App Password');
      console.error('7. Verify .env file has correct EMAIL_USER and EMAIL_PASS\n');

      const authError = new Error(
        `Email authentication failed (535). SMTP Response: ${error.response || error.message}. ` +
        `Please verify Hostinger email credentials (info@zynextro.com). ` +
        `If authentication still fails, generate a Hostinger SMTP App Password and use it instead of the regular password.`
      );
      authError.code = 'EAUTH';
      authError.response = error.response;
      authError.responseCode = error.responseCode;
      throw authError;
    }

    // Handle connection errors
    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      console.error('❌ SMTP CONNECTION ERROR');
      console.error('Error Details:', {
        code: error.code,
        message: error.message,
      });

      const connectionError = new Error(
        `Failed to connect to Hostinger SMTP server (smtp.hostinger.com:465). ` +
        `Error: ${error.message}. ` +
        `Please check your network connection, firewall settings, and ensure port 465 is not blocked.`
      );
      connectionError.code = error.code;
      throw connectionError;
    }

    // Handle certificate/TLS errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      console.error('❌ SMTP TLS/SSL CONNECTION ERROR');
      const tlsError = new Error(
        `TLS/SSL connection error with Hostinger SMTP. ` +
        `Error: ${error.message}. ` +
        `Please verify SMTP settings and network connectivity.`
      );
      tlsError.code = error.code;
      throw tlsError;
    }

    // Generic error handling
    const genericError = new Error(
      `Failed to send password reset email. Error: ${error.message || 'Unknown error'}. ` +
      `SMTP Response: ${error.response || 'No response'}. ` +
      `Please check server logs for details.`
    );
    genericError.code = error.code;
    genericError.response = error.response;
    throw genericError;
  }
};

/**
 * Send Salary Slip Email
 */
exports.sendSalarySlipEmail = async (salarySlip, employee, pdfPath = null) => {
  console.log('[Email Service] sendSalarySlipEmail called');
  console.log('[Email Service] Salary Slip:', salarySlip._id);
  console.log('[Email Service] Employee:', employee ? (employee.user?.name || employee.employeeId || 'Unknown') : 'Not provided');
  console.log('[Email Service] PDF Path:', pdfPath || 'No PDF');

  const transporter = createTransporter();
  if (!transporter) {
    console.error('[Email Service] Email transporter not available');
    throw new Error('Email service not configured. Please check EMAIL_USER and EMAIL_PASS environment variables.');
  }

  // Validate employee
  if (!employee) {
    throw new Error('Employee information is required to send salary slip email');
  }

  // Get employee email
  const employeeEmail = employee.user?.email || null;
  const employeeName = employee.user?.name || employee.employeeId || 'Employee';

  if (!employeeEmail) {
    throw new Error('Employee email is required to send salary slip email');
  }

  console.log(`[Email Service] Sending salary slip email to: ${employeeEmail}`);

  const attachments = [];
  if (pdfPath) {
    const fs = require('fs');
    const path = require('path');
    const fullPath = path.isAbsolute(pdfPath) ? pdfPath : path.join(__dirname, '../..', pdfPath);
    if (fs.existsSync(fullPath)) {
      attachments.push({
        filename: `salary_slip_${employee.employeeId}_${salarySlip.year}_${String(salarySlip.month).padStart(2, '0')}.pdf`,
        path: fullPath,
      });
      console.log(`[Email Service] PDF attachment added: ${fullPath}`);
    } else {
      console.warn(`[Email Service] PDF file not found: ${fullPath}, sending email without attachment`);
    }
  }

  const emailUser = process.env.EMAIL_USER || 'info@zynextro.com';
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[salarySlip.month - 1] || `Month ${salarySlip.month}`;
  const paymentDateStr = salarySlip.paymentDate
    ? new Date(salarySlip.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'To be announced';

  const mailOptions = {
    from: `"${process.env.COMPANY_NAME || 'CRM System'}" <${emailUser}>`,
    to: employeeEmail,
    subject: `Salary Slip - ${monthName} ${salarySlip.year}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .summary { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .summary-row:last-child { border-bottom: none; font-weight: bold; font-size: 18px; color: #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Salary Slip - ${monthName} ${salarySlip.year}</h1>
          </div>
          <div class="content">
            <p>Dear ${employeeName},</p>
            <p>Your salary slip for <strong>${monthName} ${salarySlip.year}</strong> has been generated and is attached to this email.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #667eea;">Employee Information</h3>
              <p><strong>Employee ID:</strong> ${employee.employeeId}</p>
              <p><strong>Name:</strong> ${employeeName}</p>
              <p><strong>Department:</strong> ${employee.department || 'N/A'}</p>
              <p><strong>Designation:</strong> ${employee.designation || 'N/A'}</p>
            </div>

            <div class="summary">
              <h3 style="margin-top: 0; color: #667eea;">Salary Summary</h3>
              <div class="summary-row">
                <span>Basic Salary:</span>
                <span>₹${salarySlip.earnings.basic.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>HRA:</span>
                <span>₹${salarySlip.earnings.hra.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Allowances:</span>
                <span>₹${salarySlip.earnings.allowances.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Bonus:</span>
                <span>₹${salarySlip.earnings.bonus.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Total Earnings:</span>
                <span>₹${salarySlip.earnings.totalEarnings.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Total Deductions:</span>
                <span>₹${salarySlip.deductions.totalDeductions.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Net Salary:</span>
                <span>₹${salarySlip.netSalary.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Payment Date:</span>
                <span>${paymentDateStr}</span>
              </div>
            </div>

            <p>Please find your detailed salary slip attached as a PDF document.</p>
            <p>If you have any questions or concerns, please contact the HR department.</p>
            
            <div class="footer">
              <p>This is an automated email. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Company'}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Salary slip email sent successfully to ${employeeEmail}:`, info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      to: employeeEmail,
    };
  } catch (error) {
    console.error('[Email Service] Error sending salary slip email:', error);
    throw error;
  }
};

/**
 * Send Offer Letter Email
 */
exports.sendOfferEmail = async (offer, token) => {
  console.log('[Email Service] sendOfferEmail called');
  console.log(`[Email Service] Sending offer to: ${offer.candidateEmail}`);

  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const candidateEmail = offer.candidateEmail;
  const candidateName = offer.candidateName;

  if (!candidateEmail) {
    throw new Error('Candidate email is required to send offer email');
  }

  // Construct public link
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const acceptLink = `${frontendUrl}/offers/public/${token}`;

  // Attachments
  const attachments = [];
  // Verify PDF attachment
  // The controller stores either the PDF URL string or an object in generatedPDF.url
  // based on how generateOfferLetterPDF returns it.
  // We need to handle getting the file path correctly.

  if (offer.generatedPDF && offer.generatedPDF.url) {
    try {
      const fs = require('fs');
      const path = require('path');

      // If url is like "/uploads/offer-letters/filename.pdf"
      // We need to resolve it relative to server root
      let pdfPath = offer.generatedPDF.url;

      // If it's an object (from pdfGenerator return), extract url property
      if (typeof pdfPath === 'object' && pdfPath.url) {
        pdfPath = pdfPath.url;
      }

      // Check if it's already an absolute path or relative
      let fullPath;
      if (path.isAbsolute(pdfPath)) {
        fullPath = pdfPath;
      } else {
        // Assuming running from server/utils, go up to root
        fullPath = path.join(__dirname, '../..', pdfPath);
      }

      if (fs.existsSync(fullPath)) {
        attachments.push({
          filename: `Offer_Letter_${candidateName.replace(/\s+/g, '_')}.pdf`,
          path: fullPath
        });
        console.log(`[Email Service] Attached PDF: ${fullPath}`);
      } else {
        console.warn(`[Email Service] PDF file not found at: ${fullPath}`);
      }
    } catch (err) {
      console.error('[Email Service] Error attaching PDF:', err);
    }
  }

  const emailUser = process.env.EMAIL_USER || 'info@zynextro.com';

  const mailOptions = {
    from: `"Zynextro HR" <${emailUser}>`,
    to: candidateEmail,
    subject: `Offer of Employment - ${offer.designation || 'Zynextro'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
             <h1 style="color: white; margin: 0;">Congratulations!</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
            <p>Dear <strong>${candidateName}</strong>,</p>
            
            <p>We are pleased to offer you the position of <strong>${offer.designation}</strong> at Zynextro Technology Consulting.</p>
            
            <p>We were impressed by your skills and experience, and we believe you will be a valuable asset to our team.</p>
            
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563eb;">
                <p style="margin: 0 0 10px 0;"><strong>Position:</strong> ${offer.designation}</p>
                <p style="margin: 0 0 10px 0;"><strong>Joining Date:</strong> ${new Date(offer.joiningDate).toLocaleDateString()}</p>
                <p style="margin: 0;"><strong>Offer Valid Until:</strong> ${new Date(offer.validUntil).toLocaleDateString()}</p>
            </div>

            <p>Please review the detailed offer letter attached to this email.</p>
            
            <p>To accept or decline this offer, please click the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View & Respond to Offer</a>
            </div>
            
            <p style="font-size: 13px; color: #6b7280; text-align: center;">Or copy this link: <br><a href="${acceptLink}" style="color: #2563eb;">${acceptLink}</a></p>

            <p>If you have any questions, please feel free to reach out to us.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>HR Team</strong><br>Zynextro Technology Consulting</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
            <p>This email contains confidential information intended only for the recipient.</p>
        </div>
      </div>
    `,
    attachments
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Offer email sent successfully to ${candidateEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Service] Error sending offer email:', error);
    throw error;
  }
};

/**
 * Send Exit Documents Email
 */
exports.sendExitDocumentsEmail = async (employee, exitRequest, attachments = []) => {
  console.log('[Email Service] sendExitDocumentsEmail called');

  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const employeeEmail = employee.user?.email || employee.email;
  const employeeName = employee.user?.name || employee.name || 'Employee';
  const exitType = exitRequest.type || 'resignation';

  if (!employeeEmail) {
    throw new Error('Employee email is required to send exit documents');
  }

  console.log(`[Email Service] Sending exit documents to: ${employeeEmail}`);

  const emailUser = process.env.EMAIL_USER || 'info@zynextro.com';
  const companyName = process.env.COMPANY_NAME || 'Zynextro CRM';

  // Build document list for email
  const documentTypes = [];
  if (exitType === 'termination') {
    documentTypes.push('Termination Letter');
  }
  documentTypes.push('Experience Letter', 'Relieving Letter');

  const documentList = documentTypes.map(doc => `<li>${doc}</li>`).join('');

  // Construct Subject Line
  let subjectDocs = '';
  if (exitType === 'termination') {
    subjectDocs = 'Termination, Relieving & Experience Letters';
  } else {
    subjectDocs = 'Relieving & Experience Letters';
  }

  const mailOptions = {
    from: `"${companyName}" <${emailUser}>`,
    to: employeeEmail,
    subject: `Exit Documents - ${subjectDocs}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .document-list { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .document-list ul { margin: 10px 0; padding-left: 20px; }
          .document-list li { margin: 8px 0; color: #059669; font-weight: 500; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Exit Documents</h1>
          </div>
          <div class="content">
            <p>Dear ${employeeName},</p>
            <p>We are writing to confirm that your exit process has been successfully completed.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #667eea;">Employee Information</h3>
              <p><strong>Employee ID:</strong> ${employee.employeeId}</p>
              <p><strong>Last Working Day:</strong> ${new Date(exitRequest.lastWorkingDate).toLocaleDateString()}</p>
              <p><strong>Exit Type:</strong> ${exitType === 'termination' ? 'Termination' : 'Resignation'}</p>
            </div>

            <div class="document-list">
              <h3 style="margin-top: 0; color: #667eea;">Attached Documents</h3>
              <p>The following documents are attached to this email:</p>
              <ul>
                ${documentList}
              </ul>
            </div>

            <p>Please keep these documents safe for your records. They may be required for future employment verification.</p>
            <p>We wish you the very best in your future endeavors.</p>
            
            <div class="footer">
              <p>Best regards,<br><strong>${companyName} HR Team</strong></p>
              <p style="margin-top: 20px;">This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: attachments
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email Service] Exit documents email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Service] Error sending exit documents email:', error);
    throw error;
  }
};
