import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { financeService } from '../../services/financeService';
import { employeeService } from '../../services/employeeService';
import Loader from '../../components/common/Loader';
import '../../styles/finance/salary-structure.css';

const SalaryStructureForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employee: '', basicSalary: '', allowances: '', deductions: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [employeesResponse, structureResponse] = await Promise.all([
          employeeService.getEmployees(),
          id ? financeService.getSalaryStructure(id) : Promise.resolve(null),
        ]);
        setEmployees(employeesResponse.data?.data || []);

        if (structureResponse) {
          const structure = structureResponse.data?.data;
          if (!structure) throw new Error('Salary structure not found.');
          setForm({
            employee: structure.employee?._id || structure.employee || '',
            basicSalary: structure.basic ?? '',
            allowances: structure.allowances ?? '',
            deductions: structure.deductions ?? '',
          });
        }
      } catch (requestError) {
        setError(requestError.response?.data?.message || requestError.message || 'Unable to load salary structure.');
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [id]);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    const basic = Number(form.basicSalary);
    const allowances = Number(form.allowances || 0);
    const deductions = Number(form.deductions || 0);
    const payload = {
      employee: form.employee,
      basic,
      allowances,
      deductions,
      grossSalary: basic + allowances,
      annualCTC: (basic + allowances) * 12,
    };

    try {
      if (id) await financeService.updateSalaryStructure(id, payload);
      else await financeService.createSalaryStructure(payload);
      navigate('/finance/salary-structures');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save salary structure.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="generate-payroll-page fade-in">
      <div className="timesheets-page-header">
        <div className="title-text">
          <h1 className="page-title">{id ? 'Edit Salary Structure' : 'Create Salary Structure'}</h1>
          <p className="page-subtitle">Set employee salary, allowances, and deductions</p>
        </div>
      </div>
      <form className="salary-structure-preview" onSubmit={submit}>
        {error && <div className="alert alert-warning">{error}</div>}
        <label>
          Employee
          <select name="employee" value={form.employee} onChange={update} required>
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.user?.name || employee.employeeId || employee._id}
              </option>
            ))}
          </select>
        </label>
        <label>Basic salary<input name="basicSalary" type="number" min="0" step="0.01" value={form.basicSalary} onChange={update} required /></label>
        <label>Allowances<input name="allowances" type="number" min="0" step="0.01" value={form.allowances} onChange={update} /></label>
        <label>Deductions<input name="deductions" type="number" min="0" step="0.01" value={form.deductions} onChange={update} /></label>
        <div className="modal-actions">
          <button className="btn btn-outline" type="button" onClick={() => navigate('/finance/salary-structures')}>Cancel</button>
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Structure'}</button>
        </div>
      </form>
    </div>
  );
};

export default SalaryStructureForm;
