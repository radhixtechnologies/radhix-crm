import api from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const financeService = {
  // Client services (for invoice creation) - returns ALL clients without pagination
  getClients: (params) => {
    // Remove pagination params to ensure we get all clients
    const { page, limit, ...otherParams } = params || {};
    return api.get('/finance/clients', { params: otherParams });
  },

  // Invoice services
  getInvoices: (params) => api.get('/finance/invoices', { params }),
  getInvoice: (id) => api.get(`/finance/invoices/${id}`),
  createInvoice: (data) => api.post('/finance/invoices', data),
  createInvoiceFromDeal: (dealId) => api.post(`/finance/invoices/from-deal/${dealId}`),
  updateInvoice: (id, data) => api.put(`/finance/invoices/${id}`, data),
  deleteInvoice: (id) => api.delete(`/finance/invoices/${id}`),
  generateInvoicePDF: (id) => api.post(`/finance/invoices/${id}/generate-pdf`),
  sendInvoiceEmail: (id) => api.post(`/finance/invoices/${id}/send-email`),
  updateInvoiceStatus: (id, status) => api.put(`/finance/invoices/${id}/status`, { status }),

  // Expense services
  getExpenses: (params) => api.get('/finance/expenses', { params }),
  getExpense: (id) => api.get(`/finance/expenses/${id}`),
  createExpense: (data) => api.post('/finance/expenses', data),
  updateExpense: (id, data) => api.put(`/finance/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/finance/expenses/${id}`),

  // Payroll services
  getPayrolls: (params) => api.get('/finance/payroll', { params }),
  getPayroll: (id) => api.get(`/finance/payroll/${id}`),
  generatePayroll: (data) => api.post('/finance/payroll', data),
  updatePayroll: (id, data) => api.put(`/finance/payroll/${id}`, data),
  generatePayrollPDF: (id) => api.post(`/finance/payroll/${id}/generate-pdf`),
  downloadPayslip: (id) => {
    const token = localStorage.getItem('token');
    window.open(`${API_URL}/finance/payroll/${id}/download?token=${token}`, '_blank');
  },

  // Report services
  exportInvoices: (params) => {
    const queryString = new URLSearchParams(params).toString();
    window.open(`${API_URL}/finance/reports/invoices?${queryString}`, '_blank');
  },
  exportExpenses: (params) => {
    const queryString = new URLSearchParams(params).toString();
    window.open(`${API_URL}/finance/reports/expenses?${queryString}`, '_blank');
  },
  exportPayroll: (params) => {
    const queryString = new URLSearchParams(params).toString();
    window.open(`${API_URL}/finance/reports/payroll?${queryString}`, '_blank');
  },
  getFinancialSummary: (params) => api.get('/finance/reports/summary', { params }),
  getExpenseStats: (params) => api.get('/finance/reports/expense-stats', { params }),

  // Reminder services
  getReminders: (params) => api.get('/finance/reminders', { params }),
  createReminder: (data) => api.post('/finance/reminders', data),
  sendReminder: (id) => api.post(`/finance/reminders/${id}/send`),
  deleteReminder: (id) => api.delete(`/finance/reminders/${id}`),

  // Payroll employees service
  getPayrollEmployees: () => api.get('/finance/payroll/employees'),

  // Salary Slip services
  getSalarySlips: (params) => api.get('/finance/salary-slips', { params }),
  getSalarySlip: (id) => api.get(`/finance/salary-slips/${id}`),
  getSalarySlipCalculation: (employeeId, month, year) => api.get(`/finance/salary-slips/calculate/${employeeId}/${month}/${year}`),
  createSalarySlip: (data) => api.post('/finance/salary-slips', data),
  deleteSalarySlip: (id) => api.delete(`/finance/salary-slips/${id}`),
  updateSalarySlipStatus: (id, status) => api.put(`/finance/salary-slips/${id}/status`, { status }),
  sendSalarySlipEmail: (id) => api.post(`/finance/salary-slips/${id}/send-email`),
  downloadSalarySlip: (pdfUrl) => {
    const token = localStorage.getItem('token');
    window.open(`${API_URL}${pdfUrl}?token=${token}`, '_blank');
  },

  // Salary Structure services
  getSalaryStructures: (params) => api.get('/finance/salary-structures', { params }),
  getSalaryStructure: (id) => api.get(`/finance/salary-structures/${id}`),
  getSalaryStructureByEmployee: (employeeId) => api.get(`/finance/salary-structures/employee/${employeeId}`),
  createSalaryStructure: (data) => api.post('/finance/salary-structures', data),
  updateSalaryStructure: (id, data) => api.put(`/finance/salary-structures/${id}`, data),
  deleteSalaryStructure: (id) => api.delete(`/finance/salary-structures/${id}`),

  // Tax services
  getTaxes: (params) => api.get('/finance/taxes', { params }),
  getTax: (id) => api.get(`/finance/taxes/${id}`),
  createTax: (data) => api.post('/finance/taxes', data),
  updateTax: (id, data) => api.put(`/finance/taxes/${id}`, data),
  deleteTax: (id) => api.delete(`/finance/taxes/${id}`),
};
