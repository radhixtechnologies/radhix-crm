const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const Lead = require('../../models/Lead');
const { asyncHandler } = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const logActivity = require('../../utils/activityLogger'); // Ensure this utility exists

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Helper to normalized Enums
const VALID_SOURCES = ['website', 'referral', 'social-media', 'email', 'phone', 'campaign', 'other'];
const VALID_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];

const normalizeSource = (source) => {
    if (!source) return 'website';
    const s = source.toLowerCase().replace(' ', '-');
    return VALID_SOURCES.includes(s) ? s : 'other';
};

const normalizeStatus = (status) => {
    if (!status) return 'new';
    const s = status.toLowerCase();
    return VALID_STATUSES.includes(s) ? s : 'new';
};

// Helper to normalize headers
const normalizeHeader = (header) => {
    if (!header) return '';
    const h = header.toLowerCase().trim();
    if (h.includes('name')) return 'name';
    if (h.includes('mail')) return 'email'; // matches email, e-mail, mail
    if (h.includes('phone') || h.includes('mobile') || h.includes('contact')) return 'phone';
    if (h.includes('company') || h.includes('organization')) return 'company';
    if (h.includes('source')) return 'source';
    if (h.includes('status')) return 'status';
    if (h.includes('value') || h.includes('amount') || h.includes('revenue')) return 'value';
    return h;
};

/**
 * Parse file (Excel or CSV) using ExcelJS
 */
const parseFile = async (filePath, fileExtension) => {
    let rows = [];
    const workbook = new ExcelJS.Workbook();

    // Strategy 1: Attempt standard ExcelJS parse
    try {
        if (fileExtension === '.csv') {
            await workbook.csv.readFile(filePath);
        } else {
            await workbook.xlsx.readFile(filePath);
        }

        const worksheet = workbook.getWorksheet(1);
        if (worksheet) {
            // Get headers from first row
            const headers = {};
            const firstRow = worksheet.getRow(1);

            // Note: For CSVs, sometimes cellCount is 0 if empty, but we'll check rows later too.
            if (firstRow.cellCount > 0) {
                firstRow.eachCell((cell, colNumber) => {
                    const rawHeader = cell.value?.toString().toLowerCase().trim();
                    headers[colNumber] = normalizeHeader(rawHeader);
                });

                console.log('Detected Headers:', headers);

                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; // Skip header

                    const rowData = {};
                    let hasData = false;

                    row.eachCell((cell, colNumber) => {
                        const header = headers[colNumber];
                        if (header) {
                            let value = cell.value;
                            if (typeof value === 'object' && value !== null) {
                                if (value.text) value = value.text;
                                else if (value.result) value = value.result;
                                else if (value.hyperlink) value = value.text; // common in exports
                            }
                            if (typeof value === 'string') value = value.trim();

                            rowData[header] = value;
                            if (value !== null && value !== undefined && value !== '') hasData = true;
                        }
                    });

                    if (hasData) {
                        rows.push({ rowNumber, data: rowData });
                    }
                });
            }
        }
    } catch (err) {
        console.warn('ExcelJS parse failed, trying fallback:', err.message);
    }

    // Strategy 2: Manual CSV Fallback 
    // If ExcelJS found nothing or very few rows (possible parsing error), and it's a CSV
    if (fileExtension === '.csv' && rows.length === 0) {
        console.log('Using manual CSV fallback parser...');
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            // Split by newline, handling various EOL
            // Only keep lines that have some non-whitespace content
            const lines = fileContent.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);

            if (lines.length > 0) {
                // simple delimiter detection strategy: count delimiters in first line
                const firstLine = lines[0];
                let delimiter = ',';
                if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = ';';
                if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = '\t';
                // Pipe?
                if ((firstLine.match(/\|/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = '|';

                console.log('Fallback detected delimiter:', delimiter);

                const headers = lines[0].split(delimiter).map((h, i) => ({ index: i, key: normalizeHeader(h) }));

                // Parse remaining lines
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];
                    // Basic split (not robust for quotes, but better than nothing)
                    const values = line.split(delimiter);

                    const rowData = {};
                    let hasData = false;

                    headers.forEach(header => {
                        if (header.key && values[header.index] !== undefined) {
                            let val = values[header.index].trim();
                            // strip quotes if present
                            val = val.replace(/^"|"$/g, '');

                            rowData[header.key] = val;
                            if (val) hasData = true;
                        }
                    });

                    if (hasData) {
                        rows.push({
                            rowNumber: i + 1,
                            data: rowData
                        });
                    }
                }
            }
        } catch (fallbackErr) {
            console.error('Manual fallback failed:', fallbackErr);
        }
    }

    console.log(`Final Parse Count: ${rows.length} rows`);
    return rows;
};

/**
 * Validate row data
 */
const validateRow = (rowData) => {
    const errors = [];

    // Loose check: If 'name' is missing, maybe it mapped to something else? 
    // But we normalized headers, so it should be 'name'.
    if (!rowData.name) errors.push('Name is required');

    if (rowData.email && !isValidEmail(rowData.email)) {
        errors.push('Invalid email format');
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
    const worksheet = workbook.addWorksheet('Leads');

    worksheet.columns = [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Company', key: 'company', width: 20 },
        { header: 'Source', key: 'source', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Value', key: 'value', width: 10 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
    };

    // Example Rows - Adding 2 examples to show multiple rows work
    worksheet.addRow({
        name: 'Example Lead',
        email: 'lead@example.com',
        phone: '1234567890',
        company: 'Acme Corp',
        source: 'Website',
        status: 'New',
        value: 5000
    });
    worksheet.addRow({
        name: 'Another Lead',
        email: 'lead2@example.com',
        phone: '0987654321',
        company: 'Globex',
        source: 'Referral',
        status: 'New',
        value: 10000
    });

    const fileName = `leads_template.xlsx`;
    const uploadsDir = path.join(__dirname, '../../../uploads/exports');

    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, fileName);
});

/**
 * @desc    Preview Leads Import (Validation Only)
 * @route   POST /api/sales/leads/import/preview
 * @access  Private
 */
exports.previewLeads = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError('No file uploaded', 400);
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    try {
        const rows = await parseFile(filePath, fileExtension);

        // Validate each row for preview
        const preview = rows.map(({ rowNumber, data }) => {
            const validation = validateRow(data);
            return {
                rowNumber,
                data,
                isValid: validation.isValid,
                errors: validation.errors,
            };
        });

        // Cleanup
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.status(200).json({
            success: true,
            data: {
                preview,
                totalRows: preview.length,
                validRows: preview.filter(p => p.isValid).length,
                invalidRows: preview.filter(p => !p.isValid).length,
                headers: Object.keys(rows[0]?.data || {}),
            },
        });

    } catch (error) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
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
        throw new AppError('No file uploaded', 400);
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    try {
        const rows = await parseFile(filePath, fileExtension);
        const results = { success: [], failed: [], total: rows.length };

        console.log(`Starting import for ${rows.length} rows...`);

        for (const { rowNumber, data: rowData } of rows) {
            const validation = validateRow(rowData);

            if (!validation.isValid) {
                results.failed.push({
                    row: rowNumber,
                    data: rowData,
                    errors: validation.errors,
                    reason: 'Validation Error'
                });
                continue; // Do NOT stop, processing next row
            }

            try {
                // Prepare Lead Data
                const leadData = {
                    name: rowData.name,
                    email: rowData.email,
                    phone: rowData.phone,
                    company: rowData.company,
                    source: normalizeSource(rowData.source),
                    status: normalizeStatus(rowData.status),
                    value: rowData.value ? parseFloat(rowData.value) : 0,
                    assignedTo: req.user._id, // Default to uploader
                };

                // Helper to check duplicates
                if (leadData.email) {
                    const existing = await Lead.findOne({ email: leadData.email });
                    if (existing) {
                        throw new Error('Duplicate Email');
                    }
                }

                const lead = await Lead.create(leadData);

                results.success.push({
                    row: rowNumber,
                    id: lead._id,
                    name: lead.name,
                });

            } catch (error) {
                // Log the specific failure for this row, but do NOT stop the loop
                const isDuplicate = error.message.includes('Duplicate') || error.message.includes('exists');
                results.failed.push({
                    row: rowNumber,
                    data: rowData,
                    errors: [error.message],
                    reason: isDuplicate ? 'Duplicate Email' : 'Error'
                });
            }
        }

        // Cleanup
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        const msg = `${results.total} rows found → ${results.success.length} imported → ${results.failed.length} skipped${results.failed.length > 0 ? ' (duplicate email/invalid)' : ''}`;

        res.status(200).json({
            success: true,
            message: msg,
            data: results
        });

    } catch (error) {
        // Only main execution errors catch here (e.g. file read failure)
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw new AppError(`Import process failed: ${error.message}`, 500);
    }
});
