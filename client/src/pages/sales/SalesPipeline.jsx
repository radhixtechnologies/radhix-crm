import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { salesService, normalizeSalesListResponse } from '../../services/salesService';
import Loader from '../../components/common/Loader';
import PipelineColumn from '../../components/Sales/PipelineColumn';
import '../../styles/sales/pipeline.css';

const STAGES = [
  { id: 'new-deal', name: 'New Deal', color: '#6366f1' },
  { id: 'proposal', name: 'Proposal', color: '#0ea5e9' },
  { id: 'quotation', name: 'Quotation', color: '#8b5cf6' },
  { id: 'negotiation', name: 'Negotiation', color: '#f59e0b' },
  { id: 'closed-won', name: 'Closed Won', color: '#10b981' },
  { id: 'closed-lost', name: 'Closed Lost', color: '#ef4444' },
];

const SalesPipeline = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPipeline = useCallback(async () => {
    try {
      const response = await salesService.getDeals({ page: 1, limit: 500 });
      setDeals(normalizeSalesListResponse(response).data || []);
    } catch (error) {
      console.error('Error fetching pipeline:', error);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const filteredDeals = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return deals;
    return deals.filter((deal) =>
      [deal.title, deal.name, deal.client?.name].some((v) => v && v.toLowerCase().includes(term))
    );
  }, [deals, search]);

  const handleDrop = async (stageId, dealId) => {
    const deal = deals.find((d) => d._id === dealId);
    if (!deal || deal.stage === stageId) return;

    const previous = deals;
    setDeals(deals.map((d) => (d._id === dealId ? { ...d, stage: stageId } : d)));
    try {
      await salesService.changeDealStage(dealId, stageId);
      fetchPipeline();
    } catch (error) {
      console.error('Error changing deal stage:', error);
      setDeals(previous);
      alert(error.response?.data?.message || 'Could not move the deal. Please try again.');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="sales-pipeline-page fade-in">
      <div className="page-header-compact">
        <div className="header-left">
          <div className="header-title-section">
            <h1 className="page-title-compact">Sales Pipeline</h1>
            <p className="page-subtitle-compact">{deals.length} deals · drag a card to change its stage</p>
          </div>
        </div>
        <div className="header-center">
          <div className="search-bar-compact">
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search deals or clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="pipeline-container">
        {STAGES.map((stage) => (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            deals={filteredDeals.filter((d) => (d.stage || 'new-deal') === stage.id)}
            onDrop={(e, dealId) => handleDrop(stage.id, dealId)}
            onDealClick={(id) => navigate(`/sales/deals/${id}`)}
          />
        ))}
      </div>
    </div>
  );
};

export default SalesPipeline;