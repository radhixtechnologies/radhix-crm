import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { financeService } from '../../services/financeService';
import Loader from '../../components/common/Loader';

const SalaryStructureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [structure, setStructure] = useState(null);
  useEffect(() => { financeService.getSalaryStructure(id).then((response) => setStructure(response.data?.data)).catch(() => setStructure(null)); }, [id]);
  if (!structure) return <Loader />;
  return <div className="generate-payroll-page fade-in"><div className="timesheets-page-header"><div className="title-text"><h1 className="page-title">Salary Structure</h1><p className="page-subtitle">{structure.employee?.name || structure.employeeName || 'Employee'}</p></div><button className="btn btn-outline" onClick={() => navigate('/finance/salary-structures')}>Back</button></div><div className="salary-structure-preview"><div className="preview-row"><span>Basic salary</span><strong>{structure.basicSalary ?? 0}</strong></div><div className="preview-row"><span>Allowances</span><strong>{structure.allowances ?? 0}</strong></div><div className="preview-row"><span>Deductions</span><strong>{structure.deductions ?? 0}</strong></div></div></div>;
};

export default SalaryStructureDetail;
