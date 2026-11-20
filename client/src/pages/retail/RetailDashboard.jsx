import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiActivity, FiArrowUpRight, FiCheck, FiEdit2, FiPackage, FiPlus,
  FiSearch, FiShoppingBag, FiShoppingCart, FiTruck, FiX,
} from 'react-icons/fi';
import { retailService } from '../../services/retailService';
import Loader from '../../components/common/Loader';
import './RetailDashboard.css';

const statuses = ['processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'];
const titleCase = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
const emptyProduct = { name: '', sku: '', category: '', description: '', stockQuantity: '0', reorderLevel: '0', costPrice: '0', salePrice: '0', status: 'active' };
const emptyOrder = { orderNumber: '', customerName: '', customerPhone: '', customerEmail: '', shippingAddress: '', paymentMethod: 'cash', paymentStatus: 'unpaid', notes: '', items: [] };
const navigation = [
  ['overview', 'Overview', '/retail', FiActivity],
  ['products', 'Products & Stock', '/retail/products', FiPackage],
  ['orders', 'Sales & Orders', '/retail/orders', FiShoppingBag],
];

const RetailDashboard = () => {
  const location = useLocation();
  const section = location.pathname.split('/')[2] || 'overview';
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const requests = [];
      if (section === 'overview') requests.push(retailService.getSummary().then((r) => setSummary(r.data.data)));
      if (['overview', 'products', 'orders'].includes(section)) {
        requests.push(retailService.getProducts({ status: section === 'products' ? '' : 'active', search: section === 'products' ? search.trim() : '' })
          .then((r) => setProducts(r.data.data || [])));
      }
      if (['overview', 'orders'].includes(section)) {
        requests.push(retailService.getOrders({ status: section === 'orders' ? statusFilter : '', search: section === 'orders' ? search.trim() : '' })
          .then((r) => setOrders(r.data.data || [])));
      }
      await Promise.all(requests);
    } catch (requestError) {
      console.error('Unable to load retail workspace:', requestError);
      setError(requestError.response?.data?.message || 'Could not load retail operations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [section, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, search]);
  useEffect(() => setStatusFilter(''), [section]);

  const stats = summary || { products: 0, lowStock: 0, openOrders: 0, salesToday: 0, ordersToday: 0, recentOrders: [] };
  const activeProducts = useMemo(() => products.filter((product) => product.status === 'active'), [products]);
  const total = (form.items || []).reduce((sum, line) => {
    const product = activeProducts.find((item) => item._id === line.product);
    return sum + Number(line.quantity || 0) * Number(product?.salePrice || 0);
  }, 0);
  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };
  const openProduct = (record = null) => {
    setForm(record
      ? { ...emptyProduct, ...record, stockQuantity: String(record.stockQuantity), reorderLevel: String(record.reorderLevel), costPrice: String(record.costPrice), salePrice: String(record.salePrice) }
      : { ...emptyProduct });
    setModal({ type: 'product', record });
  };
  const openOrder = () => {
    setForm({ ...emptyOrder, items: activeProducts.length ? [{ product: activeProducts[0]._id, quantity: 1 }] : [] });
    setModal({ type: 'order', record: null });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (modal.type === 'product') {
        const data = { ...form, stockQuantity: Number(form.stockQuantity), reorderLevel: Number(form.reorderLevel), costPrice: Number(form.costPrice), salePrice: Number(form.salePrice) };
        if (modal.record?._id) await retailService.updateProduct(modal.record._id, data);
        else await retailService.createProduct(data);
        flash(modal.record ? 'Product updated.' : 'Product added to catalog.');
      } else {
        await retailService.createOrder({ ...form, items: form.items.map((line) => ({ product: line.product, quantity: Number(line.quantity) })) });
        flash('Order placed and stock reserved.');
      }
      setModal(null);
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save this record.');
    } finally {
      setSaving(false);
    }
  };

  const updateOrder = async (order, updates) => {
    if (['cancelled', 'returned'].includes(updates.status) && !window.confirm(`${updates.status === 'returned' ? 'Mark this order returned and refund payment' : 'Cancel this order'}? Reserved stock will be restocked.`)) return;
    try {
      await retailService.updateOrder(order._id, updates);
      flash(updates.status === 'returned' ? 'Order returned; stock restocked and payment marked refunded.' : 'Order updated.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update this order.');
    }
  };

  const updateStock = async (product) => {
    const input = window.prompt(`Enter quantity to add to ${product.name}`, '1');
    if (input === null) return;
    const quantity = Number(input);
    if (!Number.isInteger(quantity) || quantity < 1) {
      setError('Stock adjustment must be a positive whole number.');
      return;
    }
    try {
      await retailService.adjustStock(product._id, { direction: 'in', quantity });
      flash('Stock updated.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update stock.');
    }
  };

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const changeLine = (index, key, value) => setForm((current) => ({ ...current, items: current.items.map((line, i) => i === index ? { ...line, [key]: value } : line) }));
  const addLine = () => setForm((current) => ({ ...current, items: [...current.items, { product: activeProducts[0]?._id || '', quantity: 1 }] }));
  const removeLine = (index) => setForm((current) => ({ ...current, items: current.items.filter((_, i) => i !== index) }));
  const pageTitle = { overview: 'Retail Overview', products: 'Products & Stock', orders: 'Sales & Orders' }[section] || 'Retail Overview';

  return <main className="retail-page">
    <header className="retail-header">
      <div><span className="retail-eyebrow"><FiShoppingCart /> RETAIL & E-COMMERCE</span><h1>{pageTitle}</h1><p>Manage your catalog, stock levels, customer orders and delivery progress.</p></div>
      <div className="retail-header__actions">
        {section === 'products' && <button className="retail-button retail-button--primary" onClick={() => openProduct()}><FiPlus /> Add product</button>}
        {section === 'orders' && <button className="retail-button retail-button--primary" onClick={openOrder}><FiPlus /> Create order</button>}
      </div>
    </header>
    <nav className="retail-tabs" aria-label="Retail sections">{navigation.map(([key, label, path, icon]) => <Link key={key} to={path} className={`retail-tab ${section === key ? 'is-active' : ''}`}>{createElement(icon)} {label}</Link>)}</nav>
    {notice && <div className="retail-alert retail-alert--success" role="status"><FiCheck /> {notice}</div>}
    {error && <div className="retail-alert retail-alert--error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><FiX /></button></div>}
    {loading ? <div className="retail-loading"><Loader /></div> : <>
      {section === 'overview' && <section className="retail-overview">
        <div className="retail-hero"><div><span>DISCOVER · SHOP · DELIVER</span><h2>Turn every order into a great experience.</h2><p>Keep your product catalog, available stock and order fulfilment moving together.</p><div><Link to="/retail/products" className="retail-button retail-button--light"><FiPackage /> Browse catalog</Link><Link to="/retail/orders" className="retail-button retail-button--ghost"><FiTruck /> Track orders</Link></div></div><span className="retail-hero__icon"><FiShoppingBag /></span></div>
        <div className="retail-stats"><Stat icon={FiPackage} tone="blue" label="Active products" value={stats.products} note="In your retail catalog" /><Stat icon={FiShoppingBag} tone="green" label="Open orders" value={stats.openOrders} note={`${stats.ordersToday} orders today`} /><Stat icon={FiTruck} tone="amber" label="Low stock alerts" value={stats.lowStock} note="Products at reorder level" /><Stat icon={FiActivity} tone="violet" label="Today's sales" value={money(stats.salesToday)} note="Excludes cancelled/returned" /></div>
        <div className="retail-overview-grid"><section className="retail-panel"><PanelHeading title="Orders to fulfil" kicker="ORDER QUEUE" link="/retail/orders" />{orders.length ? orders.slice(0, 6).map((order) => <OrderRow key={order._id} order={order} onStatus={(status) => updateOrder(order, { status })} />) : <Empty icon={FiShoppingBag} title="No open orders" text="Orders you create will show up here for fulfilment." action="Create order" click={openOrder} />}</section><section className="retail-panel"><PanelHeading title="Stock watch" kicker="INVENTORY ALERTS" link="/retail/products" />{products.filter((product) => product.stockQuantity <= product.reorderLevel).slice(0, 6).map((product) => <div className="retail-stock-row" key={product._id}><span><FiPackage /></span><strong>{product.name}</strong><b>{product.stockQuantity} left</b></div>)}{!products.some((product) => product.stockQuantity <= product.reorderLevel) && <Empty icon={FiCheck} title="Stock levels look good" text="Products at or below their reorder level appear here." />}</section></div>
      </section>}
      {section === 'products' && <section className="retail-panel"><div className="retail-toolbar"><Search value={search} onChange={setSearch} placeholder="Search products, SKU or category" /><span className="retail-count">{products.length} products</span></div>{products.length ? <div className="retail-table-wrap"><table className="retail-table"><thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Reorder at</th><th>Sale price</th><th>Status</th><th /></tr></thead><tbody>{products.map((product) => <tr key={product._id}><td><strong>{product.name}</strong><small>{product.category}</small></td><td>{product.sku}</td><td className={product.stockQuantity <= product.reorderLevel ? 'retail-low-stock' : ''}>{product.stockQuantity}</td><td>{product.reorderLevel}</td><td>{money(product.salePrice)}</td><td><Badge value={product.status} /></td><td><button className="retail-icon-button" onClick={() => openProduct(product)} aria-label={`Edit ${product.name}`}><FiEdit2 /></button><button className="retail-stock-button" onClick={() => updateStock(product)}>Restock</button></td></tr>)}</tbody></table></div> : <Empty icon={FiPackage} title="Add your first product" text="Create a catalog item with an SKU, sale price and stock quantity." action="Add product" click={() => openProduct()} />}</section>}
      {section === 'orders' && <section className="retail-panel"><div className="retail-toolbar"><Search value={search} onChange={setSearch} placeholder="Search order number or customer" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter order status"><option value="">All order statuses</option>{statuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select><span className="retail-count">{orders.length} orders</span></div>{orders.length ? <div className="retail-order-list">{orders.map((order) => <OrderRow key={order._id} order={order} onStatus={(status) => updateOrder(order, { status })} onPayment={(paymentStatus) => updateOrder(order, { paymentStatus })} />)}</div> : <Empty icon={FiShoppingBag} title="No orders found" text="Create an order from available products to start tracking fulfilment." action="Create order" click={openOrder} />}</section>}
    </>}
    {modal && <Dialog title={`${modal.record ? 'Edit' : 'Add'} ${modal.type}`} onClose={() => setModal(null)}><form className="retail-form" onSubmit={submit}>
      {modal.type === 'product' && <div className="retail-form-grid"><Field label="Product name" required><input required value={form.name} onChange={(e) => setField('name', e.target.value)} /></Field><Field label="SKU" required><input required value={form.sku} onChange={(e) => setField('sku', e.target.value)} /></Field><Field label="Category"><input value={form.category} onChange={(e) => setField('category', e.target.value)} /></Field><Field label="Sale price (INR)" required><input required min="0" type="number" value={form.salePrice} onChange={(e) => setField('salePrice', e.target.value)} /></Field><Field label="Stock quantity"><input min="0" type="number" value={form.stockQuantity} onChange={(e) => setField('stockQuantity', e.target.value)} /></Field><Field label="Reorder level"><input min="0" type="number" value={form.reorderLevel} onChange={(e) => setField('reorderLevel', e.target.value)} /></Field><Field label="Cost price"><input min="0" type="number" value={form.costPrice} onChange={(e) => setField('costPrice', e.target.value)} /></Field><Field label="Status"><select value={form.status} onChange={(e) => setField('status', e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field><Field label="Description" wide><textarea value={form.description} onChange={(e) => setField('description', e.target.value)} /></Field></div>}
      {modal.type === 'order' && <div className="retail-form-grid"><Field label="Customer name" required><input required value={form.customerName} onChange={(e) => setField('customerName', e.target.value)} /></Field><Field label="Phone"><input value={form.customerPhone} onChange={(e) => setField('customerPhone', e.target.value)} /></Field><Field label="Email"><input type="email" value={form.customerEmail} onChange={(e) => setField('customerEmail', e.target.value)} /></Field><Field label="Payment method"><select value={form.paymentMethod} onChange={(e) => setField('paymentMethod', e.target.value)}>{['cash', 'card', 'upi', 'online', 'other'].map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></Field><Field label="Payment status"><select value={form.paymentStatus} onChange={(e) => setField('paymentStatus', e.target.value)}><option value="unpaid">Unpaid</option><option value="paid">Paid</option></select></Field><Field label="Shipping address" wide><textarea value={form.shippingAddress} onChange={(e) => setField('shippingAddress', e.target.value)} /></Field><div className="retail-lines retail-field--wide"><div><strong>Order items</strong><button type="button" className="retail-link" disabled={!activeProducts.length} onClick={addLine}><FiPlus /> Add item</button></div>{!activeProducts.length && <small>Add active products before taking an order.</small>}{form.items.map((line, index) => <div className="retail-line" key={index}><select required value={line.product} onChange={(e) => changeLine(index, 'product', e.target.value)}><option value="">Select product</option>{activeProducts.map((product) => <option key={product._id} value={product._id}>{product.name} · {money(product.salePrice)} · stock {product.stockQuantity}</option>)}</select><input aria-label="Quantity" required min="1" max={activeProducts.find((product) => product._id === line.product)?.stockQuantity || 1} type="number" value={line.quantity} onChange={(e) => changeLine(index, 'quantity', e.target.value)} /><button type="button" className="retail-icon-button" disabled={form.items.length < 2} onClick={() => removeLine(index)} aria-label="Remove item"><FiX /></button></div>)}<strong className="retail-total">Order total: {money(total)}</strong></div><Field label="Order note" wide><textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} /></Field></div>}
      <div className="retail-form-actions"><button type="button" className="retail-button retail-button--neutral" onClick={() => setModal(null)} disabled={saving}>Cancel</button><button type="submit" className="retail-button retail-button--primary" disabled={saving || (modal.type === 'order' && (!activeProducts.length || !form.items.length))}>{saving ? 'Saving…' : modal.type === 'order' ? 'Place order' : 'Save product'}</button></div>
    </form></Dialog>}
  </main>;
};

const Stat = ({ icon, tone, label, value, note }) => <article className="retail-stat"><span className={`retail-stat__icon retail-stat__icon--${tone}`}>{createElement(icon)}</span><div><small>{label}</small><strong>{value}</strong><small>{note}</small></div></article>;
const PanelHeading = ({ title, kicker, link }) => <div className="retail-panel-heading"><div><span className="retail-kicker">{kicker}</span><h2>{title}</h2></div>{link && <Link className="retail-link" to={link}>View all <FiArrowUpRight /></Link>}</div>;
const OrderRow = ({ order, onStatus, onPayment }) => <article className="retail-order-row"><span className="retail-order-icon"><FiShoppingBag /></span><div className="retail-order-main"><strong>{order.orderNumber || order.customerName}</strong><span>{order.customerName} · {order.items?.map((item) => `${item.quantity}× ${item.name}`).join(', ')}</span><small>{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {titleCase(order.paymentMethod)}</small></div><strong className="retail-order-total">{money(order.totalAmount)}</strong>{onPayment && <select className="retail-select" value={order.paymentStatus} onChange={(e) => onPayment(e.target.value)} aria-label="Payment status"><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="refunded">Refunded</option></select>}<select className={`retail-select retail-select--${order.status}`} value={order.status} onChange={(e) => onStatus(e.target.value)} aria-label={`Update order ${order.orderNumber || order.customerName}`}>{statuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></article>;
const Badge = ({ value }) => <span className={`retail-badge retail-badge--${value}`}>{titleCase(value)}</span>;
const Search = ({ value, onChange, placeholder }) => <label className="retail-search"><FiSearch /><input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>;
const Field = ({ label, required, wide, children }) => <label className={`retail-field ${wide ? 'retail-field--wide' : ''}`}><span>{label}{required && ' *'}</span>{children}</label>;
const Empty = ({ icon, title, text, action, click }) => <div className="retail-empty"><span>{createElement(icon)}</span><h3>{title}</h3><p>{text}</p>{action && <button className="retail-button retail-button--primary" onClick={click}><FiPlus /> {action}</button>}</div>;
const Dialog = ({ title, onClose, children }) => <div className="retail-dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="retail-dialog" role="dialog" aria-modal="true" aria-labelledby="retail-dialog-title"><header><h2 id="retail-dialog-title">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog"><FiX /></button></header>{children}</section></div>;

export default RetailDashboard;
