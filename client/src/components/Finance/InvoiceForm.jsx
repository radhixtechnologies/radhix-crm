import { useState, useEffect, useRef } from 'react';
import { financeService } from '../../services/financeService';
import { productService } from '../../services/productService';
import { FiPlus, FiTrash2, FiCopy, FiUpload, FiX, FiEye, FiSend, FiSave } from 'react-icons/fi';
import Loader from '../common/Loader';
import '../../styles/finance/invoice-form.css';

const InvoiceForm = ({ invoice, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    client: invoice?.client?._id || invoice?.client || '',
    invoiceNumber: invoice?.invoiceNumber || '',
    issueDate: invoice?.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
    status: invoice?.status || 'draft',
    poNumber: invoice?.poNumber || '',
    project: invoice?.project || '',
    department: invoice?.department || '',
    items: invoice?.items?.map(item => ({
      name: item.name || '',
      description: item.description || '',
      quantity: item.quantity || 1,
      rate: item.rate || 0,
      taxRate: item.taxRate || 0,
      amount: item.amount || 0,
    })) || [{ name: '', description: '', quantity: 1, rate: 0, taxRate: 0, amount: 0 }],
    discount: invoice?.discount || 0,
    discountType: invoice?.discountType || 'flat',
    taxMode: invoice?.taxMode || 'exclusive',
    taxRate: invoice?.taxRate || 0,
    shipping: invoice?.shipping || 0,
    additionalCharges: invoice?.additionalCharges || 0,
    amountPaid: invoice?.amountPaid || 0,
    customerNotes: invoice?.customerNotes || '',
    terms: invoice?.terms || '',
    footerMessage: invoice?.footerMessage || '',
    notes: invoice?.notes || '',
    attachments: invoice?.attachments || [],
  });

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [fileUploads, setFileUploads] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientDropdownRef = useRef(null);
  const [calculations, setCalculations] = useState({
    subtotal: invoice?.subtotal || 0,
    discount: invoice?.discount || 0,
    tax: invoice?.tax || 0,
    shipping: invoice?.shipping || 0,
    additionalCharges: invoice?.additionalCharges || 0,
    total: invoice?.total || 0,
    balanceDue: invoice?.balanceDue || 0,
  });

  // Update form data when invoice prop changes (for edit mode)
  useEffect(() => {
    if (invoice) {
      setFormData({
        client: invoice.client?._id || invoice.client || '',
        invoiceNumber: invoice.invoiceNumber || '',
        issueDate: invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
        status: invoice.status || 'draft',
        poNumber: invoice.poNumber || '',
        project: invoice.project || '',
        department: invoice.department || '',
        items: invoice.items?.map(item => ({
          name: item.name || '',
          description: item.description || '',
          quantity: item.quantity || 1,
          rate: item.rate || 0,
          taxRate: item.taxRate || 0,
          amount: item.amount || 0,
        })) || [{ name: '', description: '', quantity: 1, rate: 0, taxRate: 0, amount: 0 }],
        discount: invoice.discount || 0,
        discountType: invoice.discountType || 'flat',
        taxMode: invoice.taxMode || 'exclusive',
        taxRate: invoice.taxRate || 0,
        shipping: invoice.shipping || 0,
        additionalCharges: invoice.additionalCharges || 0,
        amountPaid: invoice.amountPaid || 0,
        customerNotes: invoice.customerNotes || '',
        terms: invoice.terms || '',
        footerMessage: invoice.footerMessage || '',
        notes: invoice.notes || '',
        attachments: invoice.attachments || [],
      });
      setCalculations({
        subtotal: invoice.subtotal || 0,
        discount: invoice.discount || 0,
        tax: invoice.tax || 0,
        shipping: invoice.shipping || 0,
        additionalCharges: invoice.additionalCharges || 0,
        total: invoice.total || 0,
        balanceDue: invoice.balanceDue || 0,
      });
    }
  }, [invoice]);

  useEffect(() => {
    fetchClients();
    fetchProducts();
    if (!invoice) {
      generateInvoiceNumber();
    }
  }, []);


  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.taxRate, formData.discount, formData.discountType, formData.taxMode, formData.shipping, formData.additionalCharges, formData.amountPaid]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
        setShowClientDropdown(false);
        setClientSearch('');
      }
    };

    if (showClientDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClientDropdown]);

  const generateInvoiceNumber = async () => {
    try {
      const res = await financeService.getInvoices();
      if (res.data.success) {
        const count = res.data.data?.length || 0;
        const invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`;
        setFormData(prev => ({ ...prev, invoiceNumber }));
      }
    } catch (error) {
      console.error('Error generating invoice number:', error);
    }
  };

  const fetchClients = async () => {
    try {
      setClientsLoading(true);
      const res = await financeService.getClients({});

      if (res.data && res.data.success) {
        const clientsData = res.data.data || [];
        setClients(clientsData);
      } else {
        alert(res.data?.message || 'Failed to load clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      alert(error.response?.data?.message || 'Failed to load clients. Please check your connection and try again.');
    } finally {
      setClientsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await productService.getProducts();
      if (res.data.success) {
        setProducts(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const calculateTotals = () => {
    // Calculate item subtotal with per-item taxes
    let itemsSubtotal = 0;
    let itemsTax = 0;

    formData.items.forEach(item => {
      const itemAmount = (item.quantity || 0) * (item.rate || 0);
      itemsSubtotal += itemAmount;

      // Calculate tax per item if tax mode is exclusive
      if (formData.taxMode === 'exclusive' && item.taxRate) {
        itemsTax += itemAmount * (item.taxRate / 100);
      }
    });

    // Apply discount
    let discountAmount = 0;
    if (formData.discountType === 'percentage') {
      discountAmount = itemsSubtotal * (formData.discount / 100);
    } else {
      discountAmount = formData.discount || 0;
    }

    // Calculate tax based on mode
    let taxAmount = 0;
    if (formData.taxMode === 'exclusive') {
      // Tax calculated on items + per-item taxes
      taxAmount = itemsTax + (itemsSubtotal * (formData.taxRate / 100));
    } else if (formData.taxMode === 'inclusive') {
      // Tax is included in prices, calculate what portion is tax
      const subtotalBeforeTax = itemsSubtotal / (1 + (formData.taxRate / 100));
      taxAmount = itemsSubtotal - subtotalBeforeTax;
    }

    const subtotalAfterDiscount = itemsSubtotal - discountAmount;
    const total = subtotalAfterDiscount + taxAmount + (formData.shipping || 0) + (formData.additionalCharges || 0);
    const balanceDue = total - (formData.amountPaid || 0);

    setCalculations({
      subtotal: itemsSubtotal,
      discount: discountAmount,
      tax: taxAmount,
      shipping: formData.shipping || 0,
      additionalCharges: formData.additionalCharges || 0,
      total,
      balanceDue,
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index] };

    if (field === 'quantity' || field === 'rate' || field === 'taxRate') {
      item[field] = parseFloat(value) || 0;
    } else {
      item[field] = value;
    }

    // Recalculate item amount
    item.amount = (item.quantity || 0) * (item.rate || 0);

    newItems[index] = item;
    setFormData({ ...formData, items: newItems });
  };

  const handleProductSelect = (index, productId) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      const newItems = [...formData.items];
      newItems[index] = {
        ...newItems[index],
        name: product.name,
        description: product.description || '',
        rate: product.price || 0,
        taxRate: product.taxRate || 0,
        quantity: 1,
        amount: (product.price || 0) * 1
      };
      setFormData({ ...formData, items: newItems });
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', description: '', quantity: 1, rate: 0, taxRate: 0, amount: 0 }],
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    if (newItems.length === 0) {
      newItems.push({ name: '', description: '', quantity: 1, rate: 0, taxRate: 0, amount: 0 });
    }
    setFormData({ ...formData, items: newItems });
  };

  const duplicateItem = (index) => {
    const itemToDuplicate = { ...formData.items[index] };
    const newItems = [...formData.items];
    newItems.splice(index + 1, 0, { ...itemToDuplicate, name: `${itemToDuplicate.name} (Copy)`, amount: 0 });
    setFormData({ ...formData, items: newItems });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAttachment = {
          filename: file.name,
          url: reader.result,
          uploadedAt: new Date(),
        };
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, newAttachment],
        }));
      };
      reader.readAsDataURL(file);
    });
    setFileUploads([...fileUploads, ...files]);
  };

  const removeAttachment = (index) => {
    const newAttachments = formData.attachments.filter((_, i) => i !== index);
    setFormData({ ...formData, attachments: newAttachments });
  };

  const handleSubmit = async (action = 'save') => {
    setLoading(true);

    try {
      const data = {
        ...formData,
        subtotal: calculations.subtotal,
        discount: calculations.discount,
        tax: calculations.tax,
        shipping: calculations.shipping,
        additionalCharges: calculations.additionalCharges,
        total: calculations.total,
        balanceDue: calculations.balanceDue,
        status: action === 'draft' ? 'draft' : action === 'send' ? 'sent' : formData.status || invoice?.status || 'draft',
      };

      await onSubmit(data, action);
    } catch (error) {
      console.error('Error submitting invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    // TODO: Implement preview functionality
    alert('Preview functionality will open in a new window');
  };

  const handleGeneratePDFAndSendEmail = async () => {
    if (!formData.client) {
      alert('Please select a client first.');
      return;
    }

    if (!formData.dueDate) {
      alert('Please select a due date.');
      return;
    }

    if (!formData.items || formData.items.length === 0 || formData.items.every(item => !item.description && !item.name)) {
      alert('Please add at least one item to the invoice.');
      return;
    }

    try {
      setLoading(true);

      // Prepare invoice data
      const invoiceData = {
        client: formData.client,
        invoiceNumber: formData.invoiceNumber || '',
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        poNumber: formData.poNumber || '',
        project: formData.project || '',
        department: formData.department || '',
        items: formData.items.map(item => ({
          name: item.name || '',
          description: item.description || '',
          quantity: item.quantity || 0,
          rate: item.rate || 0,
          taxRate: item.taxRate || 0,
          amount: item.amount || 0,
        })),
        taxRate: formData.taxRate || 0,
        taxMode: formData.taxMode || 'exclusive',
        discountType: formData.discountType || 'flat',
        shipping: formData.shipping || 0,
        additionalCharges: formData.additionalCharges || 0,
        amountPaid: formData.amountPaid || 0,
        customerNotes: formData.customerNotes || '',
        terms: formData.terms || '',
        footerMessage: formData.footerMessage || '',
        notes: formData.notes || '',
        subtotal: calculations.subtotal,
        discount: calculations.discount,
        tax: calculations.tax,
        total: calculations.total,
        balanceDue: calculations.balanceDue,
        status: 'sent',
      };

      // First save the invoice if it's new
      let invoiceId = invoice?._id;

      if (!invoiceId) {
        // Create the invoice and get the ID
        const createRes = await financeService.createInvoice(invoiceData);
        if (!createRes.data.success) {
          throw new Error(createRes.data.message || 'Failed to create invoice');
        }

        invoiceId = createRes.data.data._id;
      } else {
        // Update existing invoice
        await financeService.updateInvoice(invoiceId, invoiceData);
      }

      if (!invoiceId) {
        throw new Error('Invoice ID not found');
      }

      // Generate PDF
      const pdfRes = await financeService.generateInvoicePDF(invoiceId);
      if (!pdfRes.data.success) {
        throw new Error(pdfRes.data.message || 'Failed to generate PDF');
      }

      // Send Email
      const emailRes = await financeService.sendInvoiceEmail(invoiceId);
      if (!emailRes.data.success) {
        throw new Error(emailRes.data.message || 'Failed to send email');
      }

      alert('PDF generated and email sent successfully!');

      // If this was a new invoice, navigate to invoice list
      if (!invoice?._id) {
        window.location.href = '/finance/invoices';
      } else {
        // Refresh the page to show updated invoice
        window.location.reload();
      }
    } catch (error) {
      console.error('Error generating PDF and sending email:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate PDF and send email. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invoice-form-main">
      <form className="invoice-form-modern" onSubmit={(e) => { e.preventDefault(); handleSubmit('save'); }}>
        {/* Client & Invoice Info Section */}
        <section className="form-section-modern">
          <h2 className="section-label">Client & Invoice Info</h2>
          <div className="form-card-modern">
            <div className="form-grid-modern">
              <div className="form-group-modern">
                <label>
                  Client Name *
                  {!clientsLoading && clients.length > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                      ({clients.length} selected)
                    </span>
                  )}
                </label>
                {clientsLoading ? (
                  <div className="input-modern" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Loading clients...</span>
                  </div>
                ) : (
                  <div className="client-select-wrapper" ref={clientDropdownRef}>
                    <div className="client-select-input">
                      <input
                        type="text"
                        className="input-modern"
                        value={showClientDropdown ? clientSearch : (clients.find(c => c._id === formData.client)?.name || '') || ''}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setShowClientDropdown(true);
                        }}
                        onFocus={() => {
                          setShowClientDropdown(true);
                          setClientSearch('');
                        }}
                        placeholder="Search for a client..."
                        required={!formData.client}
                        readOnly={!showClientDropdown}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    {showClientDropdown && (
                      <div className="client-dropdown shadow-lg">
                        <div className="client-search-input">
                          <input
                            type="text"
                            placeholder="Type to search..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <div className="client-dropdown-list">
                          {(() => {
                            const filteredClients = !clientSearch
                              ? clients
                              : clients.filter(client => {
                                const search = clientSearch.toLowerCase();
                                return (
                                  client.name?.toLowerCase().includes(search) ||
                                  client.email?.toLowerCase().includes(search) ||
                                  client.company?.toLowerCase().includes(search)
                                );
                              });

                            return filteredClients.map((client) => (
                              <div
                                key={client._id}
                                className={`client-dropdown-item ${formData.client === client._id ? 'selected' : ''}`}
                                onClick={() => {
                                  setFormData({ ...formData, client: client._id });
                                  setClientSearch('');
                                  setShowClientDropdown(false);
                                }}
                              >
                                <div className="client-name">{client.name}</div>
                                {client.company && <div className="client-company">{client.company}</div>}
                                {client.email && <div className="client-email">{client.email}</div>}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group-modern">
                <label>Invoice Number *</label>
                <input
                  type="text"
                  className="input-modern"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  placeholder="e.g. INV-0001"
                  required
                />
              </div>

              <div className="form-group-modern">
                <label>Issue Date *</label>
                <input
                  type="date"
                  className="input-modern"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group-modern">
                <label>Due Date *</label>
                <input
                  type="date"
                  className="input-modern"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group-modern">
                <label>Project Reference</label>
                <input
                  type="text"
                  className="input-modern"
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  placeholder="Associated Project (Optional)"
                />
              </div>

              <div className="form-group-modern">
                <label>Initial Status *</label>
                <select
                  className="input-modern"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Items Table Section */}
        <section className="form-section-modern">
          <div className="section-header-modern" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 className="section-label" style={{ margin: 0 }}>Invoice Items</h2>
            <button type="button" className="btn-modern btn-modern-secondary btn-sm" onClick={addItem}>
              <FiPlus /> <span>Add New Item</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="items-table-modern">
              <thead>
                <tr>
                  <th className="col-product">SERVICE / PRODUCT</th>
                  <th className="col-desc">DESCRIPTION</th>
                  <th className="col-qty">QTY</th>
                  <th className="col-rate">RATE</th>
                  <th className="col-tax">TAX (%)</th>
                  <th className="col-amount">AMOUNT</th>
                  <th className="col-actions"></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="col-product">
                      <select
                        className="input-modern input-table"
                        style={{ marginBottom: '8px', width: '100%', textAlign: 'left' }}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        value=""
                      >
                        <option value="" disabled>Select...</option>
                        {products.map(p => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="input-modern input-table"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        placeholder="Item name"
                        style={{ width: '100%', textAlign: 'left' }}
                      />
                    </td>
                    <td className="col-desc">
                      <textarea
                        className="input-modern"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Description..."
                        rows="3"
                        style={{ width: '100%', resize: 'vertical', minHeight: '80px', padding: '8px' }}
                      />
                    </td>
                    <td className="col-qty-cell">
                      <input
                        type="number"
                        className="input-modern input-table"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="col-rate-cell">
                      <input
                        type="number"
                        className="input-modern input-table"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="col-tax-cell">
                      <input
                        type="number"
                        className="input-modern input-table"
                        value={item.taxRate}
                        onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                        min="0"
                        step="0.01"
                        disabled={formData.taxMode === 'no_tax'}
                      />
                    </td>
                    <td className="col-amount-cell" style={{ fontWeight: '700', fontSize: '15px' }}>
                      ${item.amount.toFixed(2)}
                    </td>
                    <td className="col-actions-cell" style={{ verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-row-action"
                          onClick={() => duplicateItem(index)}
                          title="Duplicate"
                        >
                          <FiCopy />
                        </button>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            className="btn-row-action btn-danger-alt"
                            onClick={() => removeItem(index)}
                            title="Remove"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Summary and Notes Grid */}
        <section className="totals-grid-modern">
          {/* Left Side: Notes & Metadata */}
          <div className="form-section-modern">
            <h2 className="section-label">Additional Information</h2>
            <div className="form-card-modern">
              <div className="form-group-modern" style={{ marginBottom: '20px' }}>
                <label>Customer Notes</label>
                <textarea
                  className="input-modern"
                  value={formData.customerNotes}
                  onChange={(e) => setFormData({ ...formData, customerNotes: e.target.value })}
                  placeholder="Notes visible on the invoice PDF..."
                  rows="3"
                />
              </div>
              <div className="form-group-modern" style={{ marginBottom: '20px' }}>
                <label>Terms & Conditions</label>
                <textarea
                  className="input-modern"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Standard terms and conditions..."
                  rows="2"
                />
              </div>
              <div className="form-group-modern">
                <label>Internal Private Notes</label>
                <textarea
                  className="input-modern"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Internal notes (not visible to customer)..."
                  rows="2"
                  style={{ background: 'var(--surface)' }}
                />
              </div>
            </div>

            <h2 className="section-label" style={{ marginTop: '24px' }}>Attachments</h2>
            <div className="form-card-modern">
              <label className="upload-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', border: '2px dashed var(--border)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                <FiUpload /> <span>Click to upload Invoice Attachments</span>
                <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
              {formData.attachments.length > 0 && (
                <div className="attachments-list" style={{ marginTop: '12px' }}>
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="attachment-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--surface)', borderRadius: '6px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px' }}>{file.filename}</span>
                      <button type="button" onClick={() => removeAttachment(index)} style={{ border: 'none', background: 'none', color: 'var(--error)', cursor: 'pointer' }}><FiX /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Totals Summary */}
          <div className="form-section-modern">
            <h2 className="section-label">Invoice Summary</h2>
            <div className="summary-card-modern shadow-sm">
              <div className="calc-row">
                <span>Subtotal</span>
                <span>${calculations.subtotal.toFixed(2)}</span>
              </div>

              <div className="calc-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Discount</span>
                  <select
                    className="input-modern"
                    style={{ padding: '2px 8px', fontSize: '11px', height: '24px' }}
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  >
                    <option value="flat">($)</option>
                    <option value="percentage">(%)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    className="input-modern"
                    style={{ width: '80px', height: '28px', textAlign: 'right', padding: '2px 8px' }}
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                  />
                  <span style={{ color: 'var(--error)', fontWeight: '600' }}>-${calculations.discount.toFixed(2)}</span>
                </div>
              </div>

              <div className="calc-row">
                <span>Tax Rate (%)</span>
                <input
                  type="number"
                  className="input-modern"
                  style={{ width: '80px', height: '28px', textAlign: 'right', padding: '2px 8px' }}
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  disabled={formData.taxMode === 'no_tax'}
                />
              </div>

              <div className="calc-row">
                <span>Shipping / Extra</span>
                <input
                  type="number"
                  className="input-modern"
                  style={{ width: '100px', height: '28px', textAlign: 'right', padding: '2px 8px' }}
                  value={formData.shipping}
                  onChange={(e) => setFormData({ ...formData, shipping: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="calc-row grand-total">
                <span>Total Amount</span>
                <span>${calculations.total.toFixed(2)}</span>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <div className="calc-row">
                  <span style={{ fontWeight: '600' }}>Amount Paid</span>
                  <input
                    type="number"
                    className="input-modern"
                    style={{ width: '120px', height: '32px', textAlign: 'right', fontWeight: '700' }}
                    value={formData.amountPaid}
                    onChange={(e) => setFormData({ ...formData, amountPaid: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="calc-row" style={{ color: calculations.balanceDue > 0 ? 'var(--error)' : 'var(--success)', marginTop: '8px' }}>
                  <span style={{ fontWeight: '700' }}>Balance Due</span>
                  <span style={{ fontWeight: '800', fontSize: '18px' }}>${calculations.balanceDue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STICKY FOOTER ACTIONS */}
        <footer className="form-footer-modern">
          <button type="button" className="btn-modern btn-modern-secondary" onClick={onCancel}>
            <FiX /> <span className="btn-text">Cancel Changes</span>
          </button>

          <div className="footer-btn-group">
            <button type="button" className="btn-modern btn-modern-secondary" onClick={() => handleSubmit('draft')} disabled={loading}>
              <FiSave /> <span className="btn-text">Save Draft</span>
            </button>
            <button type="button" className="btn-modern btn-modern-secondary" onClick={handlePreview}>
              <FiEye /> <span className="btn-text">Preview PDF</span>
            </button>
            <button type="submit" className="btn-modern btn-modern-primary" disabled={loading}>
              <FiSend /> <span className="btn-text">{invoice?._id ? 'Update' : 'Create'} & Send</span>
            </button>
          </div>
        </footer>
      </form>
    </div >
  );
};

export default InvoiceForm;

