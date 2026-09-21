import api from './api';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://radhix-crm.onrender.com/api' : 'http://localhost:5000/api');

export const payrollService = {
  // Generate salary slip
  generateSalarySlip: (data) => api.post('/payroll/generate-salary-slip', data),
  
  // Get salary slips with optional employeeId filter
  getSalarySlips: (params) => api.get('/payroll/salary-slips', { params }),
  
  // Get single salary slip
  getSalarySlip: (id) => api.get(`/payroll/salary-slip/${id}`),
  
  // Delete salary slip
  deleteSalarySlip: (id) => api.delete(`/payroll/salary-slip/${id}`),
  
  // Get salary calculation data (for auto-fill)
  getSalaryCalculation: (employeeId, month, year) => 
    api.get(`/payroll/salary-slips/calculate/${employeeId}/${month}/${year}`),
  
  // Update salary slip status
  updateSalarySlipStatus: (id, status) => 
    api.put(`/payroll/salary-slip/${id}/status`, { status }),
  
  // Send salary slip email
  sendSalarySlipEmail: (id) => api.post(`/payroll/salary-slip/${id}/send-email`),
  
  // Download salary slip PDF
  downloadSalarySlip: (pdfUrl) => {
    window.open(`${API_URL}${pdfUrl}`, '_blank');
  },
  
  // Get employees for payroll (still uses finance endpoint as it's shared)
  getPayrollEmployees: () => api.get('/finance/payroll/employees'),
};

