const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const Lead = require('../../models/Lead');
const Employee = require('../../models/Employee');
const Company = require('../../models/Company');
const SubscriptionPlan = require('../../models/SubscriptionPlan');
const { getTenantCompanyId } = require('../../utils/tenantHelper');
const { asyncHandler } = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(String(email).trim());
};

const VALID_SOURCES = ['website', 'referral', 'social-media', 'email', 'phone', 'campaign', 'meta', 'other'];
const VALID_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];

const normalizeSource = (source, hasMetaInfo = false) => {
    if (hasMetaInfo) return 'meta';
    if (!source) return 'website';
    const s = String(source).toLowerCase().trim().replace(/\s+/g, '-');
    if (s.includes('meta') || s.includes('facebook') || s.includes('instagram') || s === 'fb' || s === 'ig') return 'meta';
    return VALID_SOURCES.includes(s) ? s : 'other';
};

const normalizeStatus = (status) => {
    if (!status) return 'new';
    const s = String(status).toLowerCase().trim();
    return VALID_STATUSES.includes(s) ? s : 'new';
};

/**
 * Clean phone number from Meta prefixes (e.g. "p:+919876543210")
 */
const cleanPhone = (phone) => {
    if (!phone) return '';
    let p = String(phone).trim();
    p = p.replace(/^p:\s*/i, '');
    p = p.replace(/["']/g, '').trim();
    return p;
};

/**
 * Intelligently maps an arbitrary row object from CSV/Excel into a standardized Lead object
 */
const mapRowToLead = (rawRow) => {
    const data = {};
    let firstName = '';
    let lastName = '';
    let directName = '';
    let companyName = '';
    let email = '';
    let phone = '';
    let source = '';
    let status = '';
    let value = 0;
    let notes = '';
    let industry = '';
    let adName = '';
    let campaignName = '';
    let formName = '';
    let platform = '';
    let metaLeadId = '';

    for (const [rawKey, rawVal] of Object.entries(rawRow)) {
        if (rawVal === undefined || rawVal === null) continue;
        const key = rawKey.toLowerCase().replace(/[^a-z0-9_]/g, '_').trim();
        const val = typeof rawVal === 'string' ? rawVal.trim() : String(rawVal).trim();
        if (!val) continue;

        // Meta specific attribution
        if (key === 'ad_name' || key === 'adname') adName = val;
        else if (key === 'campaign_name' || key === 'campaignname') campaignName = val;
        else if (key === 'form_name' || key === 'formname') formName = val;
        else if (key === 'platform') platform = val;
        else if (key === 'id' && /^\d{10,}$/.test(val)) metaLeadId = val;

        // Company
        else if (key === 'company' || key === 'company_name' || key === 'business_name' || key === 'organization' || key === 'org_name') {
            companyName = val;
        }

        // Person Name (guarded against ad_name, campaign_name, company_name)
        else if (key === 'full_name' || key === 'fullname' || key === 'name' || key === 'lead_name' || key === 'client_name' || key === 'contact_name' || key === 'prospect_name' || key === 'student_name') {
            directName = val;
        } else if (key === 'first_name' || key === 'firstname' || key === 'fname') {
            firstName = val;
        } else if (key === 'last_name' || key === 'lastname' || key === 'lname') {
            lastName = val;
        }

        // Email
        else if (key === 'email' || key === 'e_mail' || key === 'email_address' || key === 'mail') {
            email = val.toLowerCase();
        }

        // Phone
        else if (key.includes('phone') || key.includes('mobile') || key.includes('contact') || key.includes('whatsapp') || key === 'tel') {
            phone = cleanPhone(val);
        }

        // Source
        else if (key === 'source' || key === 'lead_source' || key === 'channel') {
            source = val;
        }

        // Status
        else if (key === 'status' || key === 'lead_status' || key === 'stage') {
            status = val;
        }

        // Value
        else if (key === 'value' || key === 'budget' || key === 'amount' || key === 'revenue' || key === 'price') {
            const num = parseFloat(val.replace(/[^0-9.]/g, ''));
            if (!isNaN(num)) value = num;
        }

        // Industry
        else if (key === 'industry' || key === 'sector') {
            industry = val;
        }

        // Notes / Query
        else if (key === 'notes' || key === 'note' || key === 'message' || key === 'comments' || key === 'query' || key === 'inquiry') {
            notes = val;
        }
    }

    // Name resolution
    let finalName = directName;
    if (!finalName && (firstName || lastName)) {
        finalName = `${firstName} ${lastName}`.trim();
    }
    if (!finalName) {
        if (companyName) finalName = companyName;
        else if (phone) finalName = `Lead (${phone})`;
        else if (email) finalName = email.split('@')[0];
        else finalName = 'Unnamed Lead';
    }

    const hasMeta = Boolean(adName || campaignName || formName || metaLeadId || (platform && (platform.includes('fb') || platform.includes('ig'))));

    return {
        name: finalName,
        email: email || '',
        phone: phone || '',
        company: companyName || '',
        source: normalizeSource(source, hasMeta),
        status: normalizeStatus(status),
        value: value || 0,
        industry: industry || '',
        notes: notes || '',
        metaLeadId: metaLeadId || undefined,
        metaAttribution: hasMeta ? {
            adName,
            adsetName: campaignName,
            formId: formName,
            platform: platform || (hasMeta ? 'fb' : undefined),
        } : undefined,
    };
};

/**
 * Robust Spreadsheet / CSV Parser using SheetJS with Fallback
 */
const parseSpreadsheetFile = (filePath) => {
    // Strategy 1: SheetJS (XLSX) - handles CSV, XLSX, XLS with any encoding
    try {
        const workbook = XLSX.readFile(filePath, { raw: false, cellDates: true, defval: '' });
        if (workbook && workbook.SheetNames && workbook.SheetNames.length > 0) {
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            if (Array.isArray(rawRows) && rawRows.length > 0) {
                return rawRows.map((row, index) => ({
                    rowNumber: index + 2, // 1-indexed row number excluding header
                    data: mapRowToLead(row),
                    raw: row
                }));
            }
        }
    } catch (xlsxErr) {
        console.warn('SheetJS read failed, attempting fallback parser:', xlsxErr.message);
    }

    // Strategy 2: Raw Line Parser Fallback (for standard text/CSV)
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length > 1) {
            const firstLine = lines[0];
            let delimiter = ',';
            if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = ';';
            if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = '\t';

            const headers = lines[0].split(delimiter).map(h => h.replace(/^["']|["']$/g, '').trim());
            const parsedRows = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                const cells = line.split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
                const rawObj = {};
                headers.forEach((h, idx) => {
                    if (h && cells[idx] !== undefined) rawObj[h] = cells[idx];
                });

                parsedRows.push({
                    rowNumber: i + 1,
                    data: mapRowToLead(rawObj),
                    raw: rawObj
                });
            }
            return parsedRows;
        }
    } catch (lineErr) {
        console.error('Line fallback parser failed:', lineErr.message);
    }

    return [];
};

/**
 * Validate parsed lead row
 */
const validateRow = (leadData) => {
    const errors = [];
    if (!leadData.name || leadData.name.trim() === '') {
        errors.push('Name is required');
    }

    if (leadData.email && !isValidEmail(leadData.email)) {
        errors.push('Invalid email format');
    }

    // Must have at least phone or email or valid contact
    if (!leadData.phone && !leadData.email) {
        errors.push('Provide at least Phone or Email for contact');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * @desc    Download sample import template for Leads
 * @route   GET /api/sales/leads/import/template
 * @access  Private
 */
exports.downloadLeadTemplate = asyncHandler(async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads Template');

    worksheet.columns = [
        { header: 'Full Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone Number', key: 'phone', width: 20 },
        { header: 'Company Name', key: 'company', width: 25 },
        { header: 'Lead Source', key: 'source', width: 16 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Budget / Value', key: 'value', width: 15 },
        { header: 'Notes', key: 'notes', width: 35 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8F0FE' },
    };

    worksheet.addRow({
        name: 'Aarav Sharma',
        email: 'aarav.sharma@example.com',
        phone: '+91 98765 43210',
        company: 'Apex Global Technologies',
        source: 'meta',
        status: 'new',
        value: 75000,
        notes: 'Interested in enterprise subscription & demo.',
    });

    worksheet.addRow({
        name: 'Pooja Verma',
        email: 'pooja.verma@example.com',
        phone: '+91 98111 22334',
        company: 'Verma Healthcare',
        source: 'website',
        status: 'qualified',
        value: 120000,
        notes: 'Inquired from website contact form.',
    });

    const uploadsDir = path.join(__dirname, '../../../uploads/exports');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, 'leads_template.xlsx');
    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, 'leads_template.xlsx');
});

/**
 * @desc    Preview Leads Import (Validation Only)
 * @route   POST /api/sales/leads/import/preview
 * @access  Private
 */
exports.previewLeads = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError('No file uploaded. Please select an Excel or CSV file.', 400);
    }

    const filePath = req.file.path;

    try {
        const rows = parseSpreadsheetFile(filePath);

        if (!rows || rows.length === 0) {
            throw new AppError('The uploaded file is empty or could not be read. Please upload a valid CSV or Excel file.', 400);
        }

        const preview = rows.map(({ rowNumber, data }) => {
            const validation = validateRow(data);
            return {
                rowNumber,
                data,
                isValid: validation.isValid,
                errors: validation.errors,
            };
        });

        // Cleanup temp file safely
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (_) {}
        }

        res.status(200).json({
            success: true,
            data: {
                preview: preview.slice(0, 50), // Send first 50 rows for preview UI
                totalRows: preview.length,
                validRows: preview.filter(p => p.isValid).length,
                invalidRows: preview.filter(p => !p.isValid).length,
                headers: Object.keys(rows[0]?.data || {}),
            },
        });
    } catch (error) {
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (_) {}
        }
        if (error instanceof AppError) throw error;
        throw new AppError(`Preview failed: ${error.message}`, 500);
    }
});

/**
 * @desc    Import Leads from Excel/CSV
 * @route   POST /api/sales/leads/import
 * @access  Private
 */
exports.importLeads = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError('No file uploaded. Please select an Excel or CSV file.', 400);
    }

    const filePath = req.file.path;

    try {
        const rows = parseSpreadsheetFile(filePath);

        if (!rows || rows.length === 0) {
            throw new AppError('The file contains no readable data rows.', 400);
        }

        // Multi-tenant company resolution
        const leadCompanyId = await getTenantCompanyId(req.user);

        // Quota verification
        if (leadCompanyId) {
            const company = await Company.findById(leadCompanyId).populate('subscription.plan');
            if (company) {
                const plan = company.subscription?.plan || await SubscriptionPlan.findOne({ slug: company.subscription?.planSlug || 'starter' });
                const maxLeads = plan?.limits?.maxLeads ?? (company.subscription?.planSlug === 'starter' ? 1000 : 10000);
                const currentCount = await Lead.countDocuments({ tenantCompany: leadCompanyId, isDeleted: { $ne: true } });

                if (currentCount >= maxLeads) {
                    throw new AppError(`Subscription Lead Limit Reached: Your current plan (${plan?.name || 'Starter'}) allows up to ${maxLeads.toLocaleString()} active leads. Please upgrade to import more leads.`, 403);
                }
            }
        }

        // Resolving sales rep / uploader employee
        let assignedTo = undefined;
        const uploaderEmployee = await Employee.findOne({ user: req.user._id, deletedAt: null });
        if (uploaderEmployee) {
            assignedTo = uploaderEmployee._id;
        }

        const results = { success: [], failed: [], total: rows.length };

        for (const { rowNumber, data: leadData } of rows) {
            const validation = validateRow(leadData);

            if (!validation.isValid) {
                results.failed.push({
                    row: rowNumber,
                    name: leadData.name || 'Unnamed',
                    errors: validation.errors,
                    reason: validation.errors.join(', ')
                });
                continue;
            }

            try {
                // Tenant-scoped duplicate checking
                let isDuplicate = false;
                if (leadData.email && leadData.email.trim()) {
                    isDuplicate = await Lead.exists({
                        tenantCompany: leadCompanyId || null,
                        email: leadData.email.toLowerCase().trim(),
                        isDeleted: { $ne: true }
                    });
                }
                if (!isDuplicate && leadData.phone && leadData.phone.trim()) {
                    isDuplicate = await Lead.exists({
                        tenantCompany: leadCompanyId || null,
                        phone: leadData.phone.trim(),
                        isDeleted: { $ne: true }
                    });
                }

                if (isDuplicate) {
                    results.failed.push({
                        row: rowNumber,
                        name: leadData.name,
                        errors: ['Duplicate lead (Email or Phone already exists in CRM)'],
                        reason: 'Duplicate Lead'
                    });
                    continue;
                }

                // Construct full lead document
                const payload = {
                    name: leadData.name,
                    email: leadData.email || '',
                    phone: leadData.phone || '',
                    company: leadData.company || '',
                    source: leadData.source || 'website',
                    status: leadData.status || 'new',
                    value: leadData.value || 0,
                    industry: leadData.industry || '',
                    tenantCompany: leadCompanyId || null,
                    createdBy: req.user._id,
                    ...(assignedTo ? { assignedTo } : {}),
                    ...(leadData.metaLeadId ? { metaLeadId: leadData.metaLeadId } : {}),
                    ...(leadData.metaAttribution ? { metaAttribution: leadData.metaAttribution } : {}),
                };

                if (leadData.notes) {
                    payload.notes = [{
                        content: leadData.notes,
                        addedBy: req.user._id,
                        addedAt: new Date(),
                    }];
                }

                const created = await Lead.create(payload);

                results.success.push({
                    row: rowNumber,
                    id: created._id,
                    name: created.name,
                });

            } catch (createErr) {
                results.failed.push({
                    row: rowNumber,
                    name: leadData.name,
                    errors: [createErr.message],
                    reason: 'Database Insert Error'
                });
            }
        }

        // Cleanup temp file safely
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (_) {}
        }

        const msg = `${results.total} rows parsed → ${results.success.length} successfully imported → ${results.failed.length} skipped${results.failed.length > 0 ? ' (duplicate or invalid)' : ''}`;

        res.status(200).json({
            success: true,
            message: msg,
            data: results
        });

    } catch (error) {
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (_) {}
        }
        if (error instanceof AppError) throw error;
        throw new AppError(`Import process failed: ${error.message}`, 500);
    }
});

/**
 * Export Leads to CSV
 */
exports.exportLeads = asyncHandler(async (req, res) => {
    const leadCompanyId = await getTenantCompanyId(req.user);
    const filter = { isDeleted: { $ne: true } };
    if (leadCompanyId) filter.tenantCompany = leadCompanyId;

    const leads = await Lead.find(filter)
        .populate('assignedTo', 'name email employeeId')
        .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads Export');

    worksheet.columns = [
        { header: 'Lead ID', key: 'id', width: 24 },
        { header: 'Full Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Phone', key: 'phone', width: 18 },
        { header: 'Company / Organization', key: 'company', width: 25 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Lead Temperature', key: 'temperature', width: 15 },
        { header: 'Lead Score', key: 'score', width: 12 },
        { header: 'Lead Value (INR)', key: 'value', width: 18 },
        { header: 'Lead Source', key: 'source', width: 18 },
        { header: 'Assigned To', key: 'assignedTo', width: 22 },
        { header: 'Created Date', key: 'createdAt', width: 20 },
    ];

    leads.forEach((l) => {
        worksheet.addRow({
            id: l._id.toString(),
            name: l.name || '',
            email: l.email || '',
            phone: l.phone || '',
            company: l.company || '',
            status: l.status || 'new',
            temperature: l.leadTemperature || 'cold',
            score: l.qualificationScore || 0,
            value: l.value || 0,
            source: l.source || 'website',
            assignedTo: l.assignedTo?.name || l.assignedTo?.employeeId || 'Unassigned',
            createdAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN') : '',
        });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Leads_Export_${Date.now()}.csv`);

    await workbook.csv.write(res);
    res.end();
});
