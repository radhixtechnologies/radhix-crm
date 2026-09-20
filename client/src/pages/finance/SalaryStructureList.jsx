import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { financeService } from '../../services/financeService';
import Loader from '../../components/common/Loader';

const SalaryStructureList = () => {
  const navigate = useNavigate();
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeService.getSalaryStructures()
      .then((response) => setStructures(response.data?.data || []))
      .catch(() => setStructures([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return <div className="invoice-list-page fade-in"><div className="timesheets-page-header"><div className="title-text"><h1 className="page-title">Salary Structures</h1><p className="page-subtitle">Manage employee salary structures</p></div><button className="btn btn-primary" onClick={() => navigate('/finance/salary-structures/new')}><FiPlus /> Add Structure</button></div><div className="salary-structure-preview">{structures.length === 0 ? <p>No salary structures found.</p> : structures.map((structure) => <button className="preview-row" key={structure._id} onClick={() => navigate(`/finance/salary-structures/${structure._id}`)}><span>{structure.employee?.name || structure.employeeName || 'Employee'}</span><strong>{structure.basicSalary ?? 0}</strong></button>)}</div></div>;
};

export default SalaryStructureList;
