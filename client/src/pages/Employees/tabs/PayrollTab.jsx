import { formatCurrency } from '../../../utils/format';
import '../../../styles/payroll.css';

const PayrollTab = ({ employee }) => {
  return (
    <div className="payroll-tab">
      <div className="card">
        <h3 className="card-title">Payroll Information</h3>
        {employee.salaryStructure ? (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <h4 style={{ marginBottom: '16px' }}>Earnings</h4>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Basic Salary</span>
                    <strong>{formatCurrency(employee.salaryStructure.basic || 0)}</strong>
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>HRA</span>
                    <strong>{formatCurrency(employee.salaryStructure.hra || 0)}</strong>
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Allowances</span>
                    <strong>{formatCurrency(employee.salaryStructure.allowances || 0)}</strong>
                  </div>
                </div>
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>Gross Salary</span>
                    <span>{formatCurrency((employee.salaryStructure.basic || 0) + (employee.salaryStructure.hra || 0) + (employee.salaryStructure.allowances || 0))}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 style={{ marginBottom: '16px' }}>Deductions</h4>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>PF (Provident Fund)</span>
                    <strong>{formatCurrency(employee.salaryStructure.pf || 0)}</strong>
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ESI</span>
                    <strong>{formatCurrency(employee.salaryStructure.esi || 0)}</strong>
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>TDS</span>
                    <strong>{formatCurrency(employee.salaryStructure.tds || 0)}</strong>
                  </div>
                </div>
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>Total Deductions</span>
                    <span>{formatCurrency((employee.salaryStructure.pf || 0) + (employee.salaryStructure.esi || 0) + (employee.salaryStructure.tds || 0))}</span>
                  </div>
                </div>
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--primary-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '18px' }}>
                    <span>Net Salary</span>
                    <span>{formatCurrency(employee.salaryStructure.netSalary || employee.salary)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Salary structure not configured yet
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollTab;

