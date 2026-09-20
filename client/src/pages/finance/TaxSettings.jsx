import { useEffect, useState } from 'react';
import { financeService } from '../../services/financeService';
import Loader from '../../components/common/Loader';

const TaxSettings = () => {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { financeService.getTaxes().then((response) => setTaxes(response.data?.data || [])).catch(() => setTaxes([])).finally(() => setLoading(false)); }, []);
  if (loading) return <Loader />;
  return <div className="invoice-list-page fade-in"><div className="timesheets-page-header"><div className="title-text"><h1 className="page-title">Tax Settings</h1><p className="page-subtitle">Manage configured tax rates</p></div></div><div className="salary-structure-preview">{taxes.length === 0 ? <p>No tax settings found.</p> : taxes.map((tax) => <div className="preview-row" key={tax._id}><span>{tax.name || 'Tax'}</span><strong>{tax.rate ?? tax.percentage ?? 0}%</strong></div>)}</div></div>;
};

export default TaxSettings;
