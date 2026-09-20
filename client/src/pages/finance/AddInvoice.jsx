import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { financeService } from '../../services/financeService';
import InvoiceForm from '../../components/Finance/InvoiceForm';
import Loader from '../../components/common/Loader';
import '../../styles/finance/invoice-form-modern.css';

const AddInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      fetchInvoice();
    } else if (location.state?.deal) {
      // Pre-fill from deal data
      const deal = location.state.deal;
      const prefilledData = {
        client: deal.client?._id || deal.client || '',
        items: deal.products?.map(p => ({
          name: p.name,
          description: p.description || '',
          quantity: p.quantity || 1,
          rate: p.unitPrice || 0,
          amount: p.total || 0,
          taxRate: 0
        })) || [],
        project: deal.name || deal.title || '',
        notes: `Generated from Deal: ${deal.name || deal.title}`
      };
      setInvoice(prefilledData);
    }
  }, [id, location.state]);

  const fetchInvoice = async () => {
    try {
      setInitialLoading(true);
      const res = await financeService.getInvoice(id);
      if (res.data.success) {
        setInvoice(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      alert('Failed to load invoice');
      navigate('/finance/invoices');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (data, action = 'save') => {
    try {
      setLoading(true);
      if (isEditMode) {
        await financeService.updateInvoice(id, data);
      } else {
        await financeService.createInvoice(data);
      }
      navigate('/finance/invoices');
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} invoice:`, error);
      alert(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} invoice`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/finance/invoices');
  };

  if (initialLoading) return <Loader />;

  return (
    <div className="invoice-form-page animate-fade-in">
      <header className="details-header-compact">
        <div className="header-top-row">
          <div className="header-left-section">
            <button className="back-nav-button" onClick={handleCancel} title="Back to Invoices">
              <FiArrowLeft />
            </button>
            <div className="header-info">
              <h1 className="page-title-modern">{isEditMode ? 'Edit Invoice' : 'Create New Invoice'}</h1>
              <p className="page-subtitle-modern">
                {isEditMode ? `Updating ${invoice?.invoiceNumber || 'Invoice'}` : 'Fill in the details to generate a new invoice'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="invoice-form-content">
        <InvoiceForm invoice={invoice} onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
};

export default AddInvoice;

