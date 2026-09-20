import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { contactService } from '../../services/contactService';
import ContactForm from '../../components/contacts/ContactForm';
import Loader from '../../components/common/Loader';
import '../../styles/contacts/contacts.css';

const AddContact = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [contact, setContact] = useState(null);
    const [fetching, setFetching] = useState(!!id);

    useEffect(() => {
        if (id) {
            fetchContact();
        }
    }, [id]);

    const fetchContact = async () => {
        try {
            setFetching(true);
            const res = await contactService.getContact(id);
            if (res.data.success) {
                setContact(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching contact:', error);
            alert('Failed to load contact');
            navigate('/contacts');
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (data) => {
        try {
            setLoading(true);
            if (id) {
                await contactService.updateContact(id, data);
            } else {
                await contactService.createContact(data);
            }
            navigate('/contacts');
        } catch (error) {
            console.error(`Error ${id ? 'updating' : 'creating'} contact:`, error);
            alert(error.response?.data?.message || `Failed to ${id ? 'update' : 'create'} contact`);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/contacts');
    };

    if (fetching) return <Loader />;

    return (
        <div className="contact-form-page-wrapper">
            {/* Compact Professional Header */}
            <div className="page-header-compact">
                <div className="header-left">
                    <button
                        className="btn-back"
                        onClick={() => navigate('/contacts')}
                        title="Back to Contacts"
                        type="button"
                    >
                        <FiArrowLeft size={20} style={{ strokeWidth: 2.5 }} />
                    </button>
                    <div className="header-title-section">
                        <h1 className="page-title-compact">{id ? 'Edit Contact' : 'Create Contact'}</h1>
                        <p className="page-subtitle-compact">
                            {id ? 'Update contact information' : 'Add a new contact'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="contact-form-content">
                <ContactForm contact={contact} onSubmit={handleSubmit} onCancel={handleCancel} />
            </div>
        </div>
    );
};

export default AddContact;
