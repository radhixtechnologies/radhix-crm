import { useEffect, useState } from 'react';
import { salesService } from '../../services/salesService';
import Loader from '../../components/common/Loader';

const SalesPipeline = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { salesService.getDeals().then((response) => setDeals(response.data?.data || [])).catch(() => setDeals([])).finally(() => setLoading(false)); }, []);
  if (loading) return <Loader />;
  return <div className="invoice-list-page fade-in"><div className="timesheets-page-header"><div className="title-text"><h1 className="page-title">Sales Pipeline</h1><p className="page-subtitle">Track deals across the sales process</p></div></div><div className="salary-structure-preview">{deals.length === 0 ? <p>No deals found.</p> : deals.map((deal) => <div className="preview-row" key={deal._id}><span>{deal.title || deal.name || 'Untitled deal'}</span><strong>{deal.stage || 'New'}</strong></div>)}</div></div>;
};

export default SalesPipeline;
