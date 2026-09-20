import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import ProposalForm from '../../components/Sales/ProposalForm';
import Loader from '../../components/common/Loader';
import '../../styles/sales/proposal.css';
import '../../styles/sales/lead-form.css';

const AddProposal = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const dealId = searchParams.get('dealId');

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(!!id || !!dealId);

  useEffect(() => {
    if (id) {
      fetchProposal();
    } else if (dealId) {
      fetchDealForProposal();
    }
  }, [id, dealId]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const res = await salesService.getProposal(id);
      if (res.data.success) {
        setProposal(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDealForProposal = async () => {
    try {
      setLoading(true);
      const res = await salesService.getDeal(dealId);
      if (res.data.success) {
        const deal = res.data.data;
        // Pre-fill proposal data from Deal
        setProposal({
          deal: deal, // Pass full object or structure expected by form
          client: deal.client,
          contact: deal.contact, // Auto-populate contact from deal
          title: `Proposal for ${deal.title}`,
          // We can't pre-fill items easily unless we want to map deal value to a single line item
          items: [{
            description: deal.title,
            quantity: 1,
            rate: deal.value || 0,
            amount: deal.value || 0
          }],
          notes: deal.description || ''
        });
      }
    } catch (error) {
      console.error('Error fetching deal details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      if (id) {
        await salesService.updateProposal(id, data);
      } else {
        await salesService.createProposal(data);
      }
      navigate('/sales/proposals');
    } catch {
      alert('Failed to save proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/sales/proposals');
  };

  if (loading) return <Loader />;

  return (
    <div className="lead-form-page-wrapper">
      {/* Compact Professional Header */}
      <div className="page-header-compact">
        <div className="header-left">
          <button
            className="btn-back"
            onClick={() => navigate('/sales/proposals')}
            title="Back to Proposals"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="header-title-section">
            <h1 className="page-title-compact">{id ? 'Edit Proposal' : 'Create Proposal'}</h1>
            <p className="page-subtitle-compact">
              {id ? 'Update proposal information' : 'Create a new proposal or quotation'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="lead-form-content">
        <ProposalForm proposal={proposal} onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
};

export default AddProposal;


















