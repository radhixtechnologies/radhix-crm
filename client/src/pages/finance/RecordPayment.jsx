import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import axios from 'axios';
import Loader from '../../components/common/Loader';
import '../../styles/finance/invoice-form-modern.css';
import '../../styles/finance/record-payment-modern.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const RecordPayment = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedInvoiceId = searchParams.get('invoice');

    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        invoice: preselectedInvoiceId || '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Bank Transfer',
        referenceNumber: '',
        transactionId: '',
        notes: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchUnpaidInvoices();
    }, []);

    useEffect(() => {
        if (formData.invoice) {
            const invoice = invoices.find(inv => inv._id === formData.invoice);
            setSelectedInvoice(invoice);
            if (invoice && !formData.amount) {
                setFormData(prev => ({ ...prev, amount: invoice.balanceDue }));
            }
        }
    }, [formData.invoice, invoices]);

    const fetchUnpaidInvoices = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/finance/invoices`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Handle different response structures
            let invoicesData = [];
            if (Array.isArray(response.data)) {
                invoicesData = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                invoicesData = response.data.data;
            } else if (response.data.invoices && Array.isArray(response.data.invoices)) {
                invoicesData = response.data.invoices;
            }

            // Filter for unpaid or partially paid invoices with positive balance
            const unpaidInvoices = invoicesData.filter(inv => {
                const balanceDue = inv.balanceDue || (inv.total - (inv.amountPaid || 0));
                return (
                    (inv.status === 'sent' ||
                        inv.status === 'pending' ||
                        inv.status === 'overdue' ||
                        inv.status === 'partially-paid') &&
                    balanceDue > 0
                );
            });

            setInvoices(unpaidInvoices);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.invoice) {
            newErrors.invoice = 'Please select an invoice';
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Please enter a valid amount';
        } else if (selectedInvoice && parseFloat(formData.amount) > selectedInvoice.balanceDue) {
            newErrors.amount = `Amount cannot exceed balance due (${formatCurrency(selectedInvoice.balanceDue)})`;
        }

        if (!formData.paymentDate) {
            newErrors.paymentDate = 'Please select a payment date';
        }

        if (!formData.paymentMethod) {
            newErrors.paymentMethod = 'Please select a payment method';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/finance/payments`,
                {
                    ...formData,
                    amount: parseFloat(formData.amount)
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            alert('Payment recorded successfully!');
            navigate(`/finance/payments/${response.data.payment._id}`);
        } catch (error) {
            console.error('Error recording payment:', error);
            alert('Failed to record payment: ' + (error.response?.data?.message || error.message));
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const paymentMethods = [
        'Bank Transfer',
        'Credit Card',
        'Debit Card',
        'Cash',
        'Cheque',
        'UPI',
        'PayPal',
        'Razorpay',
        'Stripe',
        'Other'
    ];

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="invoice-form-page animate-fade-in">
            <header className="details-header-compact">
                <div className="header-top-row">
                    <div className="header-left-section">
                        <button className="back-nav-button" onClick={() => navigate('/finance/payments')} title="Back to Payments">
                            <FiArrowLeft />
                        </button>
                        <div className="header-info">
                            <h1 className="page-title-modern">Record Payment</h1>
                            <p className="page-subtitle-modern">
                                Record a payment received from a customer
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="invoice-form-content">

                <form onSubmit={handleSubmit} className="payment-form">
                    {/* Invoice Selection */}
                    <div className="form-section">
                        <h3>Invoice Information</h3>

                        <div className="form-group">
                            <label htmlFor="invoice">
                                Select Invoice <span className="required">*</span>
                            </label>
                            <select
                                id="invoice"
                                name="invoice"
                                value={formData.invoice}
                                onChange={handleChange}
                                className={errors.invoice ? 'error' : ''}
                                autoComplete="off"
                                required
                            >
                                <option value="">-- Select an invoice --</option>
                                {invoices.map(invoice => (
                                    <option key={invoice._id} value={invoice._id}>
                                        {invoice.invoiceNumber} - {invoice.client?.companyName || 'N/A'} -
                                        Balance: {formatCurrency(invoice.balanceDue)}
                                    </option>
                                ))}
                            </select>
                            {errors.invoice && <span className="error-message">{errors.invoice}</span>}
                        </div>

                        {selectedInvoice && (
                            <div className="invoice-details">
                                <div className="detail-row">
                                    <span className="label">Invoice Number:</span>
                                    <span className="value">{selectedInvoice.invoiceNumber}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Customer:</span>
                                    <span className="value">{selectedInvoice.client?.companyName || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Invoice Total:</span>
                                    <span className="value">{formatCurrency(selectedInvoice.total)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Amount Paid:</span>
                                    <span className="value">{formatCurrency(selectedInvoice.amountPaid)}</span>
                                </div>
                                <div className="detail-row highlight">
                                    <span className="label">Balance Due:</span>
                                    <span className="value">{formatCurrency(selectedInvoice.balanceDue)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment Details */}
                    <div className="form-section">
                        <h3>Payment Details</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="amount">
                                    Payment Amount <span className="required">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="amount"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    placeholder="Enter amount"
                                    step="0.01"
                                    min="0"
                                    className={errors.amount ? 'error' : ''}
                                    required
                                />
                                {errors.amount && <span className="error-message">{errors.amount}</span>}
                                {selectedInvoice && formData.amount && (
                                    <span className="help-text">
                                        Remaining balance after payment: {formatCurrency(selectedInvoice.balanceDue - parseFloat(formData.amount || 0))}
                                    </span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="paymentDate">
                                    Payment Date <span className="required">*</span>
                                </label>
                                <input
                                    type="date"
                                    id="paymentDate"
                                    name="paymentDate"
                                    value={formData.paymentDate}
                                    onChange={handleChange}
                                    className={errors.paymentDate ? 'error' : ''}
                                    required
                                />
                                {errors.paymentDate && <span className="error-message">{errors.paymentDate}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="paymentMethod">
                                Payment Method <span className="required">*</span>
                            </label>
                            <select
                                id="paymentMethod"
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleChange}
                                className={errors.paymentMethod ? 'error' : ''}
                                required
                            >
                                {paymentMethods.map(method => (
                                    <option key={method} value={method}>{method}</option>
                                ))}
                            </select>
                            {errors.paymentMethod && <span className="error-message">{errors.paymentMethod}</span>}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="referenceNumber">Reference Number</label>
                                <input
                                    type="text"
                                    id="referenceNumber"
                                    name="referenceNumber"
                                    value={formData.referenceNumber}
                                    onChange={handleChange}
                                    placeholder="e.g., Cheque number, Receipt number"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="transactionId">Transaction ID</label>
                                <input
                                    type="text"
                                    id="transactionId"
                                    name="transactionId"
                                    value={formData.transactionId}
                                    onChange={handleChange}
                                    placeholder="e.g., Bank transaction ID"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="notes">Notes</label>
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Add any additional notes about this payment..."
                                rows="4"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate('/finance/payments')}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? 'Recording Payment...' : 'Record Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordPayment;
