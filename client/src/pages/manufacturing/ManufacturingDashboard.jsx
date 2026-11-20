import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiActivity, FiArrowDown, FiArrowUp, FiArrowUpRight, FiBox, FiBriefcase,
  FiCheck, FiEdit2, FiPackage, FiPlus, FiSearch, FiTrash2, FiTruck, FiUsers, FiX,
} from 'react-icons/fi';
import { manufacturingService } from '../../services/manufacturingService';
import Loader from '../../components/common/Loader';
import './ManufacturingDashboard.css';

const orderStatuses = ['draft', 'placed', 'processing', 'shipped', 'delivered', 'cancelled'];
const titleCase = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
const money = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);
const dateLabel = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set';
const emptyProduct = { name: '', sku: '', category: '', description: '', unit: 'piece', stockQuantity: '0', reorderLevel: '0', costPrice: '0', salePrice: '0', status: 'active' };
const emptySupplier = { name: '', company: '', category: '', phone: '', email: '', address: '', notes: '', status: 'active' };
const emptyLine = { product: '', quantity: '1', unitPrice: '' };
const emptyOrder = { orderNumber: '', type: 'sales', partnerName: '', partnerPhone: '', partnerEmail: '', supplier: '', status: 'draft', expectedDate: '', amountPaid: '0', notes: '', items: [{ ...emptyLine }] };

const ManufacturingDashboard = () => {
  const location = useLocation();
  const section = location.pathname.split('/')[2] || 'overview';
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [productModal, setProductModal] = useState(null);
  const [supplierModal, setSupplierModal] = useState(null);
  const [orderModal, setOrderModal] = useState(null);
  const [stockModal, setStockModal] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [orderForm, setOrderForm] = useState(emptyOrder);
  const [stockForm, setStockForm] = useState({ direction: 'in', quantity: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const requests = [];
      if (section === 'overview') requests.push(manufacturingService.getSummary().then((response) => setSummary(response.data.data)));
      if (['overview', 'products', 'orders'].includes(section)) {
        requests.push(manufacturingService.getProducts({ status: section === 'products' ? '' : 'active', search: section === 'products' ? search.trim() : '' })
          .then((response) => setProducts(response.data.data || [])));
      }
      if (['overview', 'suppliers', 'orders'].includes(section)) {
        requests.push(manufacturingService.getSuppliers({ status: section === 'suppliers' ? '' : 'active', search: section === 'suppliers' ? search.trim() : '' })
          .then((response) => setSuppliers(response.data.data || [])));
      }
      if (['overview', 'orders'].includes(section)) {
        requests.push(manufacturingService.getOrders({
          type: typeFilter || '',
          status: statusFilter || '',
          search: section === 'orders' ? search.trim() : '',
        }).then((response) => setOrders(response.data.data || [])));
      }
      await Promise.all(requests);
    } catch (requestError) {
      console.error('Unable to load manufacturing workspace:', requestError);
      setError(requestError.response?.data?.message || 'Could not load manufacturing operations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [section, search, typeFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, search]);

  const pageTitle = { overview: 'Manufacturing Overview', products: 'Products & Stock', orders: 'Orders & Delivery', suppliers: 'Supplier Network' }[section] || 'Manufacturing Overview';
  const stats = summary || { products: 0, suppliers: 0, openOrders: 0, lowStockProducts: 0, salesValue: 0, purchaseValue: 0, recentOrders: [] };
  const activeProducts = useMemo(() => products.filter((product) => product.status === 'active'), [products]);
  const orderTotal = useMemo(() => orderForm.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0), [orderForm.items]);

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const openProduct = (product = null) => {
    setProductForm(product ? { ...emptyProduct, ...product, stockQuantity: String(product.stockQuantity), reorderLevel: String(product.reorderLevel), costPrice: String(product.costPrice), salePrice: String(product.salePrice) } : emptyProduct);
    setProductModal(product || {});
  };
  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...productForm, stockQuantity: Number(productForm.stockQuantity), reorderLevel: Number(productForm.reorderLevel), costPrice: Number(productForm.costPrice), salePrice: Number(productForm.salePrice) };
      if (productModal?._id) await manufacturingService.updateProduct(productModal._id, payload);
      else await manufacturingService.createProduct(payload);
      setProductModal(null);
      flash(productModal?._id ? 'Product updated.' : 'Product added to catalog.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save product.');
    } finally {
      setSaving(false);
    }
  };
  const adjustStock = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await manufacturingService.adjustStock(stockModal._id, { ...stockForm, quantity: Number(stockForm.quantity) });
      setStockModal(null);
      flash('Stock level adjusted.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not adjust stock.');
    } finally {
      setSaving(false);
    }
  };
  const deactivateProduct = async (product) => {
    if (!window.confirm(`Mark ${product.name} inactive? Historical orders will be retained.`)) return;
    try {
      await manufacturingService.deleteProduct(product._id);
      flash('Product marked inactive.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update product status.');
    }
  };

  const openSupplier = (supplier = null) => {
    setSupplierForm(supplier ? { ...emptySupplier, ...supplier } : emptySupplier);
    setSupplierModal(supplier || {});
  };
  const saveSupplier = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (supplierModal?._id) await manufacturingService.updateSupplier(supplierModal._id, supplierForm);
      else await manufacturingService.createSupplier(supplierForm);
      setSupplierModal(null);
      flash(supplierModal?._id ? 'Supplier profile updated.' : 'Supplier added.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save supplier.');
    } finally {
      setSaving(false);
    }
  };
  const deactivateSupplier = async (supplier) => {
    if (!window.confirm(`Mark ${supplier.name} inactive?`)) return;
    try {
      await manufacturingService.updateSupplier(supplier._id, { status: 'inactive' });
      flash('Supplier marked inactive.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update supplier status.');
    }
  };

  const openOrder = (order = null, type = 'sales') => {
    if (!order) {
      setOrderForm({ ...emptyOrder, type, items: [{ ...emptyLine }] });
    } else {
      setOrderForm({
        ...emptyOrder, ...order,
        supplier: order.supplier?._id || '',
        expectedDate: order.expectedDate ? new Date(order.expectedDate).toISOString().slice(0, 10) : '',
        amountPaid: String(order.amountPaid || 0),
        items: order.items.map((item) => ({ product: item.product?._id || item.product || '', quantity: String(item.quantity), unitPrice: String(item.unitPrice) })),
      });
    }
    setOrderModal(order || {});
  };
  const saveOrder = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...orderForm,
        orderNumber: orderForm.orderNumber.trim() || undefined,
        supplier: orderForm.type === 'purchase' ? orderForm.supplier : null,
        expectedDate: orderForm.expectedDate || null,
        amountPaid: Number(orderForm.amountPaid || 0),
        items: orderForm.items.map((item) => ({
          product: item.product,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };
      if (orderModal?._id) await manufacturingService.updateOrder(orderModal._id, payload);
      else await manufacturingService.createOrder(payload);
      setOrderModal(null);
      flash(orderModal?._id ? 'Order updated.' : 'Order created.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save order.');
    } finally {
      setSaving(false);
    }
  };
  const updateOrder = async (order, updates) => {
    try {
      await manufacturingService.updateOrder(order._id, updates);
      flash('Order updated.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update order.');
    }
  };
  const deleteOrder = async (order) => {
    if (!window.confirm(`Delete order ${order.orderNumber || ''} for ${order.partnerName}?`)) return;
    try {
      await manufacturingService.deleteOrder(order._id);
      flash('Order deleted.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not delete this order.');
    }
  };

  const selectOrderProduct = (index, productId) => {
    const product = activeProducts.find((entry) => entry._id === productId);
    setOrderForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index
        ? { ...item, product: productId, unitPrice: String(current.type === 'purchase' ? product?.costPrice || 0 : product?.salePrice || 0) }
        : item),
    }));
  };
  const updateOrderLine = (index, field, value) => setOrderForm((current) => ({
    ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
  }));

  return (
    <main className="mfg-page">
      <header className="mfg-header">
        <div><span className="mfg-eyebrow"><FiBox /> MANUFACTURING & DISTRIBUTION OPERATIONS</span><h1>{pageTitle}</h1><p>Connect your product catalog, stock levels, supplier purchases, and customer deliveries.</p></div>
        <div className="mfg-header__actions">
          {section === 'products' && <button className="mfg-button mfg-button--primary" onClick={() => openProduct()}><FiPlus /> Add product</button>}
          {section === 'orders' && <><button className="mfg-button mfg-button--outline" onClick={() => openOrder(null, 'purchase')}><FiArrowDown /> Purchase order</button><button className="mfg-button mfg-button--primary" onClick={() => openOrder(null, 'sales')}><FiPlus /> Sales order</button></>}
          {section === 'suppliers' && <button className="mfg-button mfg-button--primary" onClick={() => openSupplier()}><FiPlus /> Add supplier</button>}
        </div>
      </header>
      <nav className="mfg-tabs" aria-label="Manufacturing sections">
        {[
          { key: 'overview', label: 'Overview', path: '/manufacturing', icon: FiActivity },
          { key: 'products', label: 'Products & Stock', path: '/manufacturing/products', icon: FiPackage },
          { key: 'orders', label: 'Orders & Delivery', path: '/manufacturing/orders', icon: FiBriefcase },
          { key: 'suppliers', label: 'Suppliers', path: '/manufacturing/suppliers', icon: FiUsers },
        ].map(({ key, label, path, icon }) => <Link key={key} to={path} className={`mfg-tab ${section === key ? 'is-active' : ''}`}>{createElement(icon)} {label}</Link>)}
      </nav>
      {notice && <div className="mfg-alert mfg-alert--success" role="status"><FiCheck /> {notice}</div>}
      {error && <div className="mfg-alert mfg-alert--error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><FiX /></button></div>}
      {loading ? <div className="mfg-loading"><Loader /></div> : <>
        {section === 'overview' && <section className="mfg-overview">
          <div className="mfg-hero"><div className="mfg-hero__copy"><span>MAKE OPERATIONS MOVE IN SYNC</span><h2>From raw materials to ready-to-ship.</h2><p>See product availability, manage purchase and sales orders, and keep suppliers aligned with delivery dates.</p><div><Link to="/manufacturing/orders" className="mfg-button mfg-button--light"><FiBriefcase /> Manage orders</Link><Link to="/manufacturing/products" className="mfg-button mfg-button--ghost"><FiPackage /> Check stock</Link></div></div><div className="mfg-hero__art" aria-hidden="true"><div className="mfg-factory"><i /><i /><i /><span /><b /></div><small>PLAN · PRODUCE · DELIVER</small></div></div>
          <div className="mfg-stats">
            <Stat icon={FiPackage} tone="blue" label="Active products" value={stats.products} note={`${stats.lowStockProducts} at or below reorder level`} />
            <Stat icon={FiBriefcase} tone="amber" label="Open orders" value={stats.openOrders} note="Placed, processing, or shipped" />
            <Stat icon={FiUsers} tone="green" label="Active suppliers" value={stats.suppliers} note="Purchasing network" />
            <Stat icon={FiTruck} tone="violet" label="Sales order value" value={money(stats.salesValue)} note={`${money(stats.purchaseValue)} purchase orders`} />
          </div>
          <section className="mfg-panel"><div className="mfg-panel__heading"><div><span className="mfg-kicker">ORDER FLOW</span><h2>Orders in progress</h2><p>Track customer deliveries and incoming supplier purchases.</p></div><Link className="mfg-inline-link" to="/manufacturing/orders">View all orders <FiArrowUpRight /></Link></div>
            {stats.recentOrders?.length ? <div className="mfg-order-list">{stats.recentOrders.map((order) => <OrderRow key={order._id} order={order} onEdit={() => openOrder(order)} />)}</div> : <EmptyState icon={FiBriefcase} title="No open orders" description="Create a sales order or supplier purchase order to start tracking operations." action="Create order" onClick={() => openOrder()} />}
          </section>
          <section className="mfg-panel"><div className="mfg-panel__heading"><div><span className="mfg-kicker">STOCK WATCH</span><h2>Products that need attention</h2></div><Link className="mfg-inline-link" to="/manufacturing/products">Manage catalog <FiArrowUpRight /></Link></div>
            {products.filter((product) => product.stockQuantity <= product.reorderLevel).length ? <div className="mfg-stock-watch">{products.filter((product) => product.stockQuantity <= product.reorderLevel).slice(0, 5).map((product) => <StockRow key={product._id} product={product} onAdjust={() => { setStockModal(product); setStockForm({ direction: 'in', quantity: '' }); }} />)}</div> : <EmptyState icon={FiPackage} title="Stock levels look healthy" description="Products at their reorder level will appear here." />}
          </section>
        </section>}

        {section === 'products' && <section className="mfg-panel">
          <div className="mfg-toolbar mfg-toolbar--inside"><label className="mfg-search"><FiSearch /><input type="search" placeholder="Search products, SKU, or category" value={search} onChange={(event) => setSearch(event.target.value)} /></label><span className="mfg-count">{products.length} catalog items</span></div>
          {products.length ? <div className="mfg-table-wrap"><table className="mfg-table"><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Reorder at</th><th>Cost / Sale</th><th>Status</th><th /></tr></thead><tbody>{products.map((product) => <tr key={product._id}><td><strong>{product.name}</strong><small>{product.description || product.unit}</small></td><td>{product.sku}</td><td>{product.category || 'General'}</td><td><span className={product.stockQuantity <= product.reorderLevel ? 'mfg-stock-low' : ''}>{Number(product.stockQuantity).toLocaleString()} {product.unit}</span>{product.stockQuantity <= product.reorderLevel && <small className="mfg-low-note">Reorder needed</small>}</td><td>{Number(product.reorderLevel).toLocaleString()}</td><td>{money(product.costPrice)} / {money(product.salePrice)}</td><td><span className={`mfg-status mfg-status--${product.status}`}>{titleCase(product.status)}</span></td><td><button className="mfg-icon-action" onClick={() => { setStockModal(product); setStockForm({ direction: 'in', quantity: '' }); }} aria-label={`Adjust stock for ${product.name}`}><FiArrowUp /></button><button className="mfg-icon-action" onClick={() => openProduct(product)} aria-label={`Edit ${product.name}`}><FiEdit2 /></button>{product.status === 'active' && <button className="mfg-icon-action mfg-icon-action--danger" onClick={() => deactivateProduct(product)} aria-label={`Deactivate ${product.name}`}><FiX /></button>}</td></tr>)}</tbody></table></div> : <EmptyState icon={FiPackage} title="Product catalog is empty" description="Add your first product, SKU, pricing, and stock levels." action="Add product" onClick={() => openProduct()} />}
        </section>}

        {section === 'orders' && <section className="mfg-panel">
          <div className="mfg-toolbar mfg-toolbar--inside"><label className="mfg-search"><FiSearch /><input type="search" placeholder="Search order number or customer / supplier" value={search} onChange={(event) => setSearch(event.target.value)} /></label><select className="mfg-filter" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter order type"><option value="">Sales & purchase</option><option value="sales">Sales orders</option><option value="purchase">Purchase orders</option></select><select className="mfg-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter order status"><option value="">All stages</option>{orderStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select><span className="mfg-count">{orders.length} orders</span></div>
          {orders.length ? <div className="mfg-order-list">{orders.map((order) => <OrderRow key={order._id} order={order} onEdit={() => openOrder(order)} onDelete={() => deleteOrder(order)} onStatus={(status) => updateOrder(order, { status })} onPaid={(amountPaid) => updateOrder(order, { amountPaid })} />)}</div> : <EmptyState icon={FiBriefcase} title="No orders found" description="Create sales orders for customers or purchase orders for suppliers." action="Create sales order" onClick={() => openOrder()} />}
        </section>}

        {section === 'suppliers' && <section className="mfg-panel">
          <div className="mfg-toolbar mfg-toolbar--inside"><label className="mfg-search"><FiSearch /><input type="search" placeholder="Search suppliers, companies, or phone" value={search} onChange={(event) => setSearch(event.target.value)} /></label><span className="mfg-count">{suppliers.length} suppliers</span></div>
          {suppliers.length ? <div className="mfg-supplier-grid">{suppliers.map((supplier) => <SupplierCard key={supplier._id} supplier={supplier} onEdit={() => openSupplier(supplier)} onDeactivate={() => deactivateSupplier(supplier)} />)}</div> : <EmptyState icon={FiUsers} title="Build your supplier network" description="Keep material suppliers and production partners close to purchasing." action="Add supplier" onClick={() => openSupplier()} />}
        </section>}
      </>}

      {productModal !== null && <Dialog title={productModal?._id ? 'Edit catalog product' : 'Add catalog product'} onClose={() => setProductModal(null)}><form className="mfg-form" onSubmit={saveProduct}><div className="mfg-form-grid">
        <Field label="Product name" required><input required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} /></Field>
        <Field label="SKU" required><input required value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} /></Field>
        <Field label="Category"><input value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} placeholder="e.g. Components" /></Field>
        <Field label="Unit"><input value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} /></Field>
        <Field label="Initial stock"><input min="0" type="number" value={productForm.stockQuantity} onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })} /></Field>
        <Field label="Reorder level"><input min="0" type="number" value={productForm.reorderLevel} onChange={(e) => setProductForm({ ...productForm, reorderLevel: e.target.value })} /></Field>
        <Field label="Cost price (INR)"><input min="0" type="number" value={productForm.costPrice} onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })} /></Field>
        <Field label="Sale price (INR)"><input min="0" type="number" value={productForm.salePrice} onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })} /></Field>
        <Field label="Status"><select value={productForm.status} onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
        <Field label="Description" wide><textarea rows="3" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} /></Field>
      </div><FormActions onCancel={() => setProductModal(null)} saving={saving} label={productModal?._id ? 'Save product' : 'Add product'} /></form></Dialog>}

      {stockModal && <Dialog title={`Adjust stock · ${stockModal.name}`} onClose={() => setStockModal(null)}><form className="mfg-form" onSubmit={adjustStock}><p className="mfg-stock-current">Current stock: <strong>{stockModal.stockQuantity} {stockModal.unit}</strong></p><div className="mfg-form-grid"><Field label="Adjustment"><select value={stockForm.direction} onChange={(e) => setStockForm({ ...stockForm, direction: e.target.value })}><option value="in">Stock in</option><option value="out">Stock out</option></select></Field><Field label="Quantity" required><input required min="1" type="number" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} /></Field></div><FormActions onCancel={() => setStockModal(null)} saving={saving} label="Update stock" /></form></Dialog>}

      {supplierModal !== null && <Dialog title={supplierModal?._id ? 'Edit supplier profile' : 'Add supplier'} onClose={() => setSupplierModal(null)}><form className="mfg-form" onSubmit={saveSupplier}><div className="mfg-form-grid">
        <Field label="Contact name" required><input required value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} /></Field>
        <Field label="Company"><input value={supplierForm.company} onChange={(e) => setSupplierForm({ ...supplierForm, company: e.target.value })} /></Field>
        <Field label="Category"><input value={supplierForm.category} onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })} placeholder="Materials, components..." /></Field>
        <Field label="Phone" required><input required value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} /></Field>
        <Field label="Email"><input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} /></Field>
        <Field label="Status"><select value={supplierForm.status} onChange={(e) => setSupplierForm({ ...supplierForm, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
        <Field label="Address" wide><input value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} /></Field>
        <Field label="Notes" wide><textarea rows="3" value={supplierForm.notes} onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })} /></Field>
      </div><FormActions onCancel={() => setSupplierModal(null)} saving={saving} label={supplierModal?._id ? 'Save supplier' : 'Add supplier'} /></form></Dialog>}

      {orderModal !== null && <Dialog title={orderModal?._id ? 'Edit order' : `Create ${orderForm.type} order`} onClose={() => setOrderModal(null)}><form className="mfg-form" onSubmit={saveOrder}><div className="mfg-form-grid">
        <Field label="Order type"><select disabled={!!orderModal?._id} value={orderForm.type} onChange={(e) => setOrderForm({ ...orderForm, type: e.target.value, items: orderForm.items.map((line) => { const product = activeProducts.find((item) => item._id === line.product); return { ...line, unitPrice: String(e.target.value === 'purchase' ? product?.costPrice || 0 : product?.salePrice || 0) }; }) })}><option value="sales">Sales order</option><option value="purchase">Purchase order</option></select></Field>
        <Field label="Order number"><input value={orderForm.orderNumber} onChange={(e) => setOrderForm({ ...orderForm, orderNumber: e.target.value })} placeholder="Optional reference" /></Field>
        <Field label={orderForm.type === 'sales' ? 'Customer / dealer' : 'Supplier contact'} required><input required value={orderForm.partnerName} onChange={(e) => setOrderForm({ ...orderForm, partnerName: e.target.value })} /></Field>
        <Field label="Phone"><input value={orderForm.partnerPhone} onChange={(e) => setOrderForm({ ...orderForm, partnerPhone: e.target.value })} /></Field>
        {orderForm.type === 'purchase' && <Field label="Supplier record" required><select required value={orderForm.supplier} onChange={(e) => { const supplier = suppliers.find((item) => item._id === e.target.value); setOrderForm({ ...orderForm, supplier: e.target.value, partnerName: supplier?.company || supplier?.name || orderForm.partnerName, partnerPhone: supplier?.phone || orderForm.partnerPhone, partnerEmail: supplier?.email || orderForm.partnerEmail }); }}><option value="">Select supplier</option>{suppliers.filter((item) => item.status === 'active').map((item) => <option key={item._id} value={item._id}>{item.company || item.name}</option>)}</select></Field>}
        <Field label="Expected date"><input type="date" value={orderForm.expectedDate} onChange={(e) => setOrderForm({ ...orderForm, expectedDate: e.target.value })} /></Field>
        <Field label="Order stage"><select value={orderForm.status} onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}>{orderStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></Field>
        <Field label="Amount paid (INR)"><input min="0" type="number" value={orderForm.amountPaid} onChange={(e) => setOrderForm({ ...orderForm, amountPaid: e.target.value })} /></Field>
        <Field label="Notes" wide><textarea rows="2" value={orderForm.notes} onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })} /></Field>
      </div>
      <div className="mfg-lines-heading"><div><strong>Order line items</strong><span>{money(orderTotal)} total</span></div><button type="button" className="mfg-inline-link" onClick={() => setOrderForm({ ...orderForm, items: [...orderForm.items, { ...emptyLine }] })}><FiPlus /> Add line</button></div>
      <div className="mfg-order-lines">{orderForm.items.map((item, index) => <div className="mfg-order-line" key={index}><Field label="Product" required><select required value={item.product} onChange={(e) => selectOrderProduct(index, e.target.value)}><option value="">Select product</option>{activeProducts.map((product) => <option key={product._id} value={product._id}>{product.name} · {product.sku}</option>)}</select></Field><Field label="Qty" required><input required min="1" type="number" value={item.quantity} onChange={(e) => updateOrderLine(index, 'quantity', e.target.value)} /></Field><Field label="Unit price" required><input required min="0" type="number" value={item.unitPrice} onChange={(e) => updateOrderLine(index, 'unitPrice', e.target.value)} /></Field><strong>{money((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}</strong><button type="button" className="mfg-icon-action mfg-icon-action--danger" disabled={orderForm.items.length === 1} onClick={() => setOrderForm({ ...orderForm, items: orderForm.items.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Remove order line ${index + 1}`}><FiTrash2 /></button></div>)}</div>
      <FormActions onCancel={() => setOrderModal(null)} saving={saving} label={orderModal?._id ? 'Save order' : 'Create order'} /></form></Dialog>}
    </main>
  );
};

const Stat = ({ icon, tone, label, value, note }) => <article className="mfg-stat"><div className={`mfg-stat__icon mfg-stat__icon--${tone}`}>{createElement(icon)}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
const OrderRow = ({ order, onEdit, onDelete, onStatus, onPaid }) => <article className="mfg-order-row"><div className={`mfg-order-mark mfg-order-mark--${order.type}`}>{order.type === 'purchase' ? <FiArrowDown /> : <FiArrowUp />}</div><div className="mfg-order-row__main"><strong>{order.orderNumber || `${titleCase(order.type)} order`}</strong><span>{order.partnerName} · {order.items?.length || 0} line items</span><small>{dateLabel(order.expectedDate)} target · {order.items?.slice(0, 3).map((item) => item.productName).join(', ')}</small></div><div className="mfg-order-row__amount"><strong>{money(order.totalAmount)}</strong><span>{money(order.amountPaid)} received</span></div>{onStatus ? <select className={`mfg-status-select mfg-status-select--${order.status}`} value={order.status} onChange={(e) => onStatus(e.target.value)} aria-label={`Update ${order.orderNumber || order.type} status`}>{orderStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select> : <span className={`mfg-status mfg-status--${order.status}`}>{titleCase(order.status)}</span>}{onPaid && <button className="mfg-payment-chip" onClick={() => onPaid(order.totalAmount)} title="Mark paid">Pay</button>}{onEdit && <button className="mfg-icon-action" onClick={onEdit} aria-label="Edit order"><FiEdit2 /></button>}{onDelete && <button className="mfg-icon-action mfg-icon-action--danger" onClick={onDelete} aria-label="Delete order"><FiTrash2 /></button>}</article>;
const StockRow = ({ product, onAdjust }) => <article className="mfg-stock-row"><span><FiPackage /></span><div><strong>{product.name}</strong><small>{product.sku} · Reorder at {product.reorderLevel}</small></div><b>{product.stockQuantity} {product.unit}</b><button className="mfg-button mfg-button--outline" onClick={onAdjust}><FiPlus /> Stock in</button></article>;
const SupplierCard = ({ supplier, onEdit, onDeactivate }) => <article className="mfg-supplier-card"><div className="mfg-supplier-card__top"><span><FiUsers /></span><div><strong>{supplier.company || supplier.name}</strong><small>{supplier.category || 'General supplier'}</small></div></div><p>{supplier.name}</p><a href={`tel:${supplier.phone}`}>{supplier.phone}</a>{supplier.email && <a href={`mailto:${supplier.email}`}>{supplier.email}</a>}<div className="mfg-supplier-card__footer"><span className="mfg-status mfg-status--active">Active</span><div><button className="mfg-icon-action" onClick={onEdit} aria-label={`Edit ${supplier.name}`}><FiEdit2 /></button><button className="mfg-icon-action mfg-icon-action--danger" onClick={onDeactivate} aria-label={`Deactivate ${supplier.name}`}><FiX /></button></div></div></article>;
const EmptyState = ({ icon, title, description, action, onClick }) => <div className="mfg-empty"><span>{createElement(icon)}</span><h3>{title}</h3><p>{description}</p>{action && <button className="mfg-button mfg-button--primary" onClick={onClick}><FiPlus /> {action}</button>}</div>;
const Dialog = ({ title, onClose, children }) => <div className="mfg-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="mfg-dialog" role="dialog" aria-modal="true" aria-labelledby="manufacturing-dialog-title"><header><h2 id="manufacturing-dialog-title">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog"><FiX /></button></header>{children}</section></div>;
const Field = ({ label, required, wide, children }) => <label className={`mfg-field ${wide ? 'mfg-field--wide' : ''}`}><span>{label}{required && <b> *</b>}</span>{children}</label>;
const FormActions = ({ onCancel, saving, label }) => <div className="mfg-form-actions"><button type="button" className="mfg-button mfg-button--neutral" onClick={onCancel} disabled={saving}>Cancel</button><button type="submit" className="mfg-button mfg-button--primary" disabled={saving}>{saving ? 'Saving...' : label}</button></div>;

export default ManufacturingDashboard;
