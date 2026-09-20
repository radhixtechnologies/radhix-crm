import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { financeService } from '../../services/financeService';
import Loader from '../../components/common/Loader';
import '../../styles/finance/salary-structure.css';

const initialForm = {
  employee: '',
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  basicSalary: '',
  allowances: '',
  deductions: '',
};

const GeneratePayroll = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await financeService.getPayrollEmployees();
        setEmployees(response.data?.data || response.data?.employees || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load employees.');
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      await financeService.generatePayroll({
        ...form,
        month: Number(form.month),
        year: Number(form.year),
        basicSalary: Number(form.basicSalary),
        allowances: Number(form.allowances || 0),
        deductions: Number(form.deductions || 0),
      });
      navigate('/finance/payroll');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to generate payroll.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="generate-payroll-page fade-in">
      <div className="timesheets-page-header">
        <div className="title-text">
          <h1 className="page-title">Generate Payroll</h1>
          <p className="page-subtitle">Create a payroll record for an employee</p>
        </div>
        <button className="btn btn-outline" type="button" onClick={() => navigate('/finance/payroll')}>
          <FiArrowLeft /> Back to Payroll
        </button>
      </div>

      <form className="payroll-form" onSubmit={handleSubmit}>
        <div className="salary-structure-preview">
          {error && <div className="alert alert-warning">{error}</div>}

          <label>
            Employee
            <select name="employee" value={form.employee} onChange={handleChange} required>
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee._id || employee.id} value={employee._id || employee.id}>
                  {employee.name || employee.fullName || employee.email}
                </option>
              ))}
            </select>
          </label>

          <div className="employee-info-box">
            <label>
              Month
              <input name="month" type="number" min="1" max="12" value={form.month} onChange={handleChange} required />
            </label>
            <label>
              Year
              <input name="year" type="number" min="2000" value={form.year} onChange={handleChange} required />
            </label>
            <label>
              Basic salary
              <input name="basicSalary" type="number" min="0" step="0.01" value={form.basicSalary} onChange={handleChange} required />
            </label>
            <label>
              Allowances
              <input name="allowances" type="number" min="0" step="0.01" value={form.allowances} onChange={handleChange} />
            </label>
            <label>
              Deductions
              <input name="deductions" type="number" min="0" step="0.01" value={form.deductions} onChange={handleChange} />
            </label>
          </div>

          <div className="modal-actions">
            <button className="btn btn-outline" type="button" onClick={() => navigate('/finance/payroll')}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              <FiSave /> {saving ? 'Generating...' : 'Generate Payroll'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GeneratePayroll;
