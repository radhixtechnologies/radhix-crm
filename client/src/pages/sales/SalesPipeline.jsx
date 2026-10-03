import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiDollarSign, FiRefreshCw, FiSearch, FiTrendingUp } from 'react-icons/fi';
import { salesService, normalizeSalesListResponse } from '../../services/salesService';
import PipelineColumn from '../../components/Sales/PipelineColumn';
import Loader from '../../components/common/Loader';
import { formatCurrency } from '../../utils/format';
import '../../styles/sales/pipeline.css';

const stages = [
  { id: 'new-deal', name: 'New deal', color: '#2563eb' },
  { id: 'proposal', name: 'Proposal', color: '#7c3aed' },
  { id: 'quotation', name: 'Quotation', color: '#0891b2' },
  { id: 'negotiation', name: 'Negotiation', color: '#d97706' },
  { id: 'closed-won', name: 'Closed won', color: '#059669' },
  { id: 'closed-lost', name: 'Closed lost', color: '#dc2626' },
];

const SalesPipeline = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchPipeline = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await salesService.getDeals({ page: 1, limit: 100 });
      const normalized = normalizeSalesListResponse(response);
      setDeals(normalized.data || []);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load the sales pipeline.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchPipeline();
  }, [fetchPipeline]);

  const filteredDeals = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return deals;

    return deals.filter((deal) => [
      deal.title,
      deal.name,
      deal.company,
      deal.client?.name,
      deal.contactName,
    ].some((value) => String(value || '').toLowerCase().includes(query)));
  }, [deals, search]);

  const openDeals = deals.filter((deal) => !['closed-won', 'closed-lost'].includes(deal.stage));
  const pipelineValue = openDeals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);
  const weightedForecast = openDeals.reduce((sum, deal) => (
    sum + (Number(deal.value) || 0) * (Number(deal.probability) || 0) / 100
  ), 0);
  const wonDeals = deals.filter((deal) => deal.stage === 'closed-won').length;

  const handleMoveDeal = async (dealId, nextStage) => {
    const deal = deals.find((item) => item._id === dealId);
    if (!deal || deal.stage === nextStage) return;

    const previousStage = deal.stage;
    setDeals((current) => current.map((item) => (
      item._id === dealId ? { ...item, stage: nextStage } : item
    )));
    setError('');

    try {
      await salesService.changeDealStage(dealId, nextStage);
    } catch (requestError) {
      setDeals((current) => current.map((item) => (
        item._id === dealId ? { ...item, stage: previousStage } : item
      )));
      setError(requestError.response?.data?.message || 'Could not move this deal. Please try again.');
    }
  };

  if (loading) return <Loader />;

  return (
    <main className="sales-pipeline-page fade-in">
      <header className="pipeline-page-header">
        <div>
          <p className="pipeline-eyebrow">SALES WORKSPACE</p>
          <h1 className="pipeline-page-title">Sales pipeline</h1>
          <p className="pipeline-page-subtitle">Track every opportunity from first conversation to close.</p>
        </div>
        <div className="pipeline-header-actions">
          <label className="pipeline-search">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search deals or clients"
              aria-label="Search deals or clients"
            />
          </label>
          <button
            type="button"
            className="pipeline-refresh-button"
            onClick={() => void fetchPipeline(true)}
            disabled={refreshing}
            aria-label="Refresh pipeline"
            title="Refresh pipeline"
          >
            <FiRefreshCw className={refreshing ? 'is-spinning' : ''} />
          </button>
          <button type="button" className="pipeline-view-button" onClick={() => navigate('/sales/deals')}>
            View deals
          </button>
        </div>
      </header>

      <section className="pipeline-summary" aria-label="Pipeline summary">
        <article className="pipeline-summary-item">
          <span className="pipeline-summary-icon pipeline-summary-icon-blue"><FiBriefcase /></span>
          <span className="pipeline-summary-copy"><span>Open opportunities</span><strong>{openDeals.length}</strong></span>
        </article>
        <article className="pipeline-summary-item">
          <span className="pipeline-summary-icon pipeline-summary-icon-teal"><FiDollarSign /></span>
          <span className="pipeline-summary-copy"><span>Pipeline value</span><strong>{formatCurrency(pipelineValue)}</strong></span>
        </article>
        <article className="pipeline-summary-item">
          <span className="pipeline-summary-icon pipeline-summary-icon-amber"><FiTrendingUp /></span>
          <span className="pipeline-summary-copy"><span>Weighted forecast</span><strong>{formatCurrency(weightedForecast)}</strong></span>
        </article>
        <article className="pipeline-summary-item">
          <span className="pipeline-summary-icon pipeline-summary-icon-green"><FiBriefcase /></span>
          <span className="pipeline-summary-copy"><span>Deals won</span><strong>{wonDeals}</strong></span>
        </article>
      </section>

      {error ? (
        <div className="pipeline-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void fetchPipeline(true)}>Retry</button>
        </div>
      ) : null}

      {deals.length === 0 && !error ? (
        <section className="pipeline-empty-state">
          <span className="pipeline-empty-icon"><FiBriefcase /></span>
          <h2>No deals in your pipeline yet</h2>
          <p>Create a deal to start tracking its progress through the sales stages.</p>
          <button type="button" className="pipeline-view-button" onClick={() => navigate('/sales/deals')}>
            Open deals
          </button>
        </section>
      ) : (
        <>
          <div className="pipeline-board-heading">
            <h2>Deal stages</h2>
            <span>{filteredDeals.length} {filteredDeals.length === 1 ? 'deal' : 'deals'}</span>
          </div>
          {filteredDeals.length === 0 ? (
            <div className="pipeline-no-results">No deals match “{search}”.</div>
          ) : (
            <div className="pipeline-container" aria-label="Sales pipeline deal stages">
              {stages.map((stage) => (
                <PipelineColumn
                  key={stage.id}
                  stage={stage}
                  deals={filteredDeals.filter((deal) => deal.stage === stage.id)}
                  onDrop={(_event, dealId) => void handleMoveDeal(dealId, stage.id)}
                  onDealClick={(dealId) => navigate(`/sales/deals/${dealId}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default SalesPipeline;
