import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QuotationForm from '../../components/Sales/QuotationForm';
import { salesService } from '../../services/salesService';
import Loader from '../../components/common/Loader';

const CreateQuotation = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // For edit mode
    const [quotation, setQuotation] = useState(null);
    const [loading, setLoading] = useState(!!id); // Load if ID exists

    useEffect(() => {
        if (id) {
            fetchQuotation();
        }
    }, [id]);

    const fetchQuotation = async () => {
        try {
            setLoading(true);
            const res = await salesService.getQuotation(id);
            if (res.data.success) {
                setQuotation(res.data.data);
            } else {
                alert('Failed to fetch quotation');
                navigate('/sales/proposals?tab=quotations'); // Redirect to list
            }
        } catch (error) {
            console.error('Error fetching quotation:', error);
            alert('Error loading quotation');
            navigate('/sales/proposals?tab=quotations');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data) => {
        try {
            if (id) {
                // Update
                const res = await salesService.updateQuotation(id, data);
                if (res.data.success) {
                    alert('Quotation updated successfully');
                    navigate('/sales/proposals?tab=quotations'); // Go back to unified list
                }
            } else {
                // Create
                const res = await salesService.createQuotation(data);
                if (res.data.success) {
                    alert('Quotation created successfully');
                    navigate('/sales/proposals?tab=quotations');
                }
            }
        } catch (error) {
            console.error('Error saving quotation:', error);
            alert(error.response?.data?.message || 'Failed to save quotation');
        }
    };

    if (loading) return <div className="page-container"><Loader /></div>;

    return (
        <div className="page-container">
            <QuotationForm
                quotation={quotation}
                onSubmit={handleSubmit}
                onCancel={() => navigate('/sales/proposals?tab=quotations')}
            />
        </div>
    );
};

export default CreateQuotation;
