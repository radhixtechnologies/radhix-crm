import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { financeService } from '../../services/financeService';

const SalaryStructureForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ employee: '', basicSalary: '', allowances: '', deductions: '' });
  const [error, setError] = useState('');
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => { event.preventDefault(); setError(''); try { await financeService.createSalaryStructure({ ...form, basicSalary: Number(form.basicSalary), allowances: Number(form.allowances || 0), deductions: Number(form.deductions || 0) }); navigate('/finance/salary-structures'); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to save salary structure.'); } };
  return <div className="generate-payroll-page fade-in"><div className="timesheets-page-header"><div className="title-text"><h1 className="page-title">Salary Structure</h1><p className="page-subtitle">Create a salary structure</p></div></div><form className="salary-structure-preview" onSubmit={submit}>{error && <div className="alert alert-warning">{error}</div>}<label>Employee<input name="employee" value={form.employee} onChange={update} required /></label><label>Basic salary<input name="basicSalary" type="number" min="0" value={form.basicSalary} onChange={update} required /></label><label>Allowances<input name="allowances" type="number" min="0" value={form.allowances} onChange={update} /></label><label>Deductions<input name="deductions" type="number" min="0" value={form.deductions} onChange={update} /></label><div className="modal-actions"><button className="btn btn-outline" type="button" onClick={() => navigate('/finance/salary-structures')}>Cancel</button><button className="btn btn-primary" type="submit">Save Structure</button></div></form></div>;
};

export default SalaryStructureForm;
