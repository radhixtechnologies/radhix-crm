const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

/**
 * Export Invoices to Excel
 */
exports.exportInvoicesToExcel = async (invoices) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Invoices');

  // Define columns
  worksheet.columns = [
    { header: 'Invoice Number', key: 'invoiceNumber', width: 15 },
    { header: 'Client Name', key: 'clientName', width: 25 },
    { header: 'Company', key: 'company', width: 25 },
    { header: 'Issue Date', key: 'issueDate', width: 12 },
    { header: 'Due Date', key: 'dueDate', width: 12 },
    { header: 'Subtotal', key: 'subtotal', width: 12 },
    { header: 'Tax', key: 'tax', width: 12 },
    { header: 'Discount', key: 'discount', width: 12 },
    { header: 'Total', key: 'total', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Payment Date', key: 'paymentDate', width: 12 },
  ];

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data
  invoices.forEach((invoice) => {
    worksheet.addRow({
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.client?.name || 'N/A',
      company: invoice.client?.company || 'N/A',
      issueDate: new Date(invoice.issueDate).toLocaleDateString(),
      dueDate: new Date(invoice.dueDate).toLocaleDateString(),
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      discount: invoice.discount,
      total: invoice.total,
      status: invoice.status,
      paymentDate: invoice.paymentDate ? new Date(invoice.paymentDate).toLocaleDateString() : 'N/A',
    });
  });

  // Format currency columns
  const currencyColumns = ['subtotal', 'tax', 'discount', 'total'];
  currencyColumns.forEach((col) => {
    worksheet.getColumn(col).numFmt = '$#,##0.00';
  });

  const fileName = `invoices_export_${Date.now()}.xlsx`;
      const uploadsDir = path.join(__dirname, '../../uploads/exports');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, fileName);
  await workbook.xlsx.writeFile(filePath);

  return {
    filePath,
    fileName,
    url: `/uploads/exports/${fileName}`,
  };
};

/**
 * Export Expenses to Excel
 */
exports.exportExpensesToExcel = async (expenses) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Expenses');

  worksheet.columns = [
    { header: 'Title', key: 'title', width: 25 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Vendor', key: 'vendor', width: 20 },
    { header: 'Amount', key: 'amount', width: 12 },
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Description', key: 'description', width: 30 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  expenses.forEach((expense) => {
    worksheet.addRow({
      title: expense.title,
      category: expense.category,
      vendor: expense.vendor || 'N/A',
      amount: expense.amount,
      date: new Date(expense.date).toLocaleDateString(),
      status: expense.status,
      description: expense.description || '',
    });
  });

  worksheet.getColumn('amount').numFmt = '$#,##0.00';

  const fileName = `expenses_export_${Date.now()}.xlsx`;
      const uploadsDir = path.join(__dirname, '../../uploads/exports');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, fileName);
  await workbook.xlsx.writeFile(filePath);

  return {
    filePath,
    fileName,
    url: `/uploads/exports/${fileName}`,
  };
};

/**
 * Export Payroll to Excel
 */
exports.exportPayrollToExcel = async (payrolls) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Payroll');

  worksheet.columns = [
    { header: 'Employee ID', key: 'employeeId', width: 15 },
    { header: 'Employee Name', key: 'employeeName', width: 25 },
    { header: 'Month/Year', key: 'monthYear', width: 15 },
    { header: 'Basic', key: 'basic', width: 12 },
    { header: 'HRA', key: 'hra', width: 12 },
    { header: 'Allowances', key: 'allowances', width: 12 },
    { header: 'Gross Salary', key: 'grossSalary', width: 12 },
    { header: 'PF', key: 'pf', width: 12 },
    { header: 'ESI', key: 'esi', width: 12 },
    { header: 'TDS', key: 'tds', width: 12 },
    { header: 'Total Deductions', key: 'totalDeductions', width: 15 },
    { header: 'Net Salary', key: 'netSalary', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  payrolls.forEach((payroll) => {
    worksheet.addRow({
      employeeId: payroll.employee?.employeeId || 'N/A',
      employeeName: payroll.employee?.user?.name || 'N/A',
      monthYear: `${String(payroll.month).padStart(2, '0')}/${payroll.year}`,
      basic: payroll.salaryStructure.basic,
      hra: payroll.salaryStructure.hra,
      allowances: payroll.salaryStructure.allowances,
      grossSalary: payroll.salaryStructure.grossSalary,
      pf: payroll.salaryStructure.pf,
      esi: payroll.salaryStructure.esi,
      tds: payroll.salaryStructure.tds,
      totalDeductions: payroll.salaryStructure.totalDeductions,
      netSalary: payroll.salaryStructure.netSalary,
      status: payroll.status,
    });
  });

  const currencyColumns = ['basic', 'hra', 'allowances', 'grossSalary', 'pf', 'esi', 'tds', 'totalDeductions', 'netSalary'];
  currencyColumns.forEach((col) => {
    worksheet.getColumn(col).numFmt = '$#,##0.00';
  });

  const fileName = `payroll_export_${Date.now()}.xlsx`;
      const uploadsDir = path.join(__dirname, '../../uploads/exports');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, fileName);
  await workbook.xlsx.writeFile(filePath);

  return {
    filePath,
    fileName,
    url: `/uploads/exports/${fileName}`,
  };
};

