import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiActivity, FiArrowUpRight, FiBox, FiCalendar, FiCheck, FiClock,
  FiCoffee, FiEdit2, FiPackage, FiPlus, FiSearch, FiTrash2, FiUsers, FiX,
} from 'react-icons/fi';
import { restaurantService } from '../../services/restaurantService';
import Loader from '../../components/common/Loader';
import './RestaurantDashboard.css';

const orderStatuses = ['placed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
const reservationStatuses = ['booked', 'seated', 'completed', 'cancelled', 'no_show'];
const titleCase = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
const dateTime = (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not scheduled';
const dateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const emptyMenu = { name: '', category: '', description: '', price: '', preparationMinutes: '15', dietary: 'standard', available: true };
const emptyTable = { name: '', capacity: '2', area: '' };
const emptyCustomer = { name: '', phone: '', email: '' };
const emptyReservation = { customer: '', guestName: '', phone: '', table: '', partySize: '2', reservationAt: '', notes: '' };
const emptyOrder = { customer: '', guestName: '', orderType: 'dine_in', table: '', items: [], notes: '' };
const emptyIngredient = { name: '', unit: '', quantity: '0', reorderLevel: '0', unitCost: '0', supplier: '' };

const RestaurantDashboard = () => {
  const location = useLocation();
  const section = location.pathname.split('/')[2] || 'overview';
  const [summary, setSummary] = useState(null);
  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const requests = [];
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setHours(23, 59, 59, 999);
      if (section === 'overview') requests.push(restaurantService.getSummary().then((r) => setSummary(r.data.data)));
      if (['overview', 'menu', 'orders'].includes(section)) requests.push(restaurantService.getMenu({ search: section === 'menu' ? search.trim() : '', ...(section === 'orders' ? { available: 'true' } : {}) }).then((r) => setMenu(r.data.data || [])));
      if (['overview', 'reservations', 'orders'].includes(section)) requests.push(restaurantService.getTables().then((r) => setTables(r.data.data || [])));
      if (['overview', 'reservations', 'orders', 'loyalty'].includes(section)) requests.push(restaurantService.getCustomers({ search: section === 'loyalty' ? search.trim() : '' }).then((r) => setCustomers(r.data.data || [])));
      if (['overview', 'reservations'].includes(section)) {
        const reservationQuery = section === 'overview'
          ? { from: todayStart.toISOString(), to: todayEnd.toISOString() }
          : { status: statusFilter || '' };
        requests.push(restaurantService.getReservations(reservationQuery).then((r) => setReservations(r.data.data || [])));
      }
      if (['overview', 'orders'].includes(section)) requests.push(restaurantService.getOrders({ status: section === 'orders' ? statusFilter || '' : '', search: section === 'orders' ? search.trim() : '' }).then((r) => setOrders(r.data.data || [])));
      if (['overview', 'inventory'].includes(section)) requests.push(restaurantService.getIngredients({ search: section === 'inventory' ? search.trim() : '' }).then((r) => setIngredients(r.data.data || [])));
      await Promise.all(requests);
    } catch (requestError) {
      console.error('Unable to load restaurant workspace:', requestError);
      setError(requestError.response?.data?.message || 'Could not load restaurant operations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [section, search, statusFilter]);

  useEffect(() => {
    setStatusFilter('');
  }, [section]);

  useEffect(() => {
    const timer = setTimeout(fetchData, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, search]);

  const stats = summary || { menuItems: 0, reservationsToday: 0, activeOrders: 0, availableTables: 0, lowStock: 0, customers: 0, salesToday: 0, orderCountToday: 0, recentOrders: [] };
  const title = { overview: 'Restaurant Overview', menu: 'Menu Management', orders: 'Orders & Kitchen', reservations: 'Table Reservations', inventory: 'Ingredient Stock', loyalty: 'Loyalty Customers' }[section] || 'Restaurant Overview';
  const availableMenu = useMemo(() => menu.filter((item) => item.available), [menu]);
  const orderTotal = useMemo(() => (form.items || []).reduce((sum, line) => {
    const item = availableMenu.find((entry) => entry._id === line.menuItem);
    return sum + (item?.price || 0) * (Number(line.quantity) || 0);
  }, 0), [form.items, availableMenu]);

  const flash = (text) => {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 3500);
  };
  const openModal = (type, record = null) => {
    const defaults = { menu: emptyMenu, table: emptyTable, customer: emptyCustomer, reservation: emptyReservation, order: emptyOrder, ingredient: emptyIngredient };
    let values = record ? { ...defaults[type], ...record } : { ...defaults[type] };
    if (type === 'reservation' && record) values = { ...values, customer: record.customer?._id || '', table: record.table?._id || '', reservationAt: dateInput(record.reservationAt), partySize: String(record.partySize) };
    if (type === 'order' && record) values = { ...values, customer: record.customer?._id || '', table: record.table?._id || '' };
    if (type === 'order' && !record) values.items = availableMenu.length ? [{ menuItem: availableMenu[0]._id, quantity: 1 }] : [];
    if (type === 'table' && record) values.capacity = String(record.capacity);
    if (type === 'menu' && record) values.price = String(record.price);
    if (type === 'ingredient' && record) values = { ...values, quantity: String(record.quantity), reorderLevel: String(record.reorderLevel), unitCost: String(record.unitCost) };
    setForm(values);
    setModal({ type, record: record || null });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { type, record } = modal;
      const id = record?._id;
      if (type === 'menu') {
        const data = { ...form, price: Number(form.price), preparationMinutes: Number(form.preparationMinutes) };
        if (id) await restaurantService.updateMenuItem(id, data); else await restaurantService.createMenuItem(data);
      } else if (type === 'table') {
        const data = { ...form, capacity: Number(form.capacity) };
        if (id) await restaurantService.updateTable(id, data); else await restaurantService.createTable(data);
      } else if (type === 'customer') {
        if (id) await restaurantService.updateCustomer(id, form); else await restaurantService.createCustomer(form);
      } else if (type === 'reservation') {
        const data = { ...form, partySize: Number(form.partySize), customer: form.customer || null, table: form.table || null, reservationAt: new Date(form.reservationAt).toISOString() };
        if (id) await restaurantService.updateReservation(id, data); else await restaurantService.createReservation(data);
      } else if (type === 'order') {
        const data = { ...form, customer: form.customer || null, table: form.orderType === 'dine_in' ? form.table : null };
        if (id) await restaurantService.updateOrder(id, data); else await restaurantService.createOrder(data);
      } else if (type === 'ingredient') {
        const data = { ...form, quantity: Number(form.quantity), reorderLevel: Number(form.reorderLevel), unitCost: Number(form.unitCost) };
        if (id) await restaurantService.updateIngredient(id, data); else await restaurantService.createIngredient(data);
      }
      setModal(null);
      flash(`${type === 'menu' ? 'Menu item' : titleCase(type)} ${id ? 'updated' : 'saved'}.`);
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save this record.');
    } finally {
      setSaving(false);
    }
  };

  const removeMenuItem = async (item) => {
    if (!window.confirm(`Mark "${item.name}" unavailable? Existing orders remain unchanged.`)) return;
    try {
      await restaurantService.deleteMenuItem(item._id);
      flash('Menu item marked unavailable.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update menu item.');
    }
  };

  const updateOrder = async (order, updates) => {
    try {
      await restaurantService.updateOrder(order._id, updates);
      flash('Order status updated.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update order status.');
    }
  };
  const updateReservation = async (reservation, status) => {
    try {
      await restaurantService.updateReservation(reservation._id, { status });
      flash('Reservation status updated.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update reservation.');
    }
  };
  const updateIngredient = async (ingredient, quantity) => {
    const next = Number(quantity);
    if (!Number.isFinite(next) || next < 0) return;
    try {
      await restaurantService.updateIngredient(ingredient._id, { quantity: next });
      flash('Ingredient stock updated.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update ingredient stock.');
    }
  };

  return (
    <main className="rest-page">
      <header className="rest-header">
        <div><span className="rest-eyebrow"><FiCoffee /> RESTAURANT & FOOD SERVICE OPERATIONS</span><h1>{title}</h1><p>Coordinate the guest experience from reservations and kitchen orders to menu and ingredient stock.</p></div>
        <div className="rest-header__actions">
          {section === 'menu' && <button className="rest-button rest-button--primary" onClick={() => openModal('menu')}><FiPlus /> Add menu item</button>}
          {section === 'orders' && <button className="rest-button rest-button--primary" onClick={() => openModal('order')}><FiPlus /> New order</button>}
          {section === 'reservations' && <button className="rest-button rest-button--primary" onClick={() => openModal('reservation')}><FiPlus /> New reservation</button>}
          {section === 'inventory' && <button className="rest-button rest-button--primary" onClick={() => openModal('ingredient')}><FiPlus /> Add ingredient</button>}
          {section === 'loyalty' && <button className="rest-button rest-button--primary" onClick={() => openModal('customer')}><FiPlus /> Add customer</button>}
        </div>
      </header>

      <nav className="rest-tabs" aria-label="Restaurant sections">
        {[
          ['overview', 'Overview', '/restaurant', FiActivity],
          ['menu', 'Menu', '/restaurant/menu', FiCoffee],
          ['orders', 'Orders & Kitchen', '/restaurant/orders', FiPackage],
          ['reservations', 'Reservations', '/restaurant/reservations', FiCalendar],
          ['inventory', 'Ingredient Stock', '/restaurant/inventory', FiBox],
          ['loyalty', 'Loyalty', '/restaurant/loyalty', FiUsers],
        ].map(([key, label, path, icon]) => <Link key={key} to={path} className={`rest-tab ${section === key ? 'is-active' : ''}`}>{createElement(icon)} {label}</Link>)}
      </nav>

      {notice && <div className="rest-alert rest-alert--success" role="status"><FiCheck /> {notice}</div>}
      {error && <div className="rest-alert rest-alert--error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><FiX /></button></div>}
      {loading ? <div className="rest-loading"><Loader /></div> : <>
        {section === 'overview' && <section className="rest-overview">
          <div className="rest-hero"><div className="rest-hero__copy"><span>GOOD FOOD · GREAT SERVICE · SMOOTH OPERATIONS</span><h2>Keep every part of service in sync.</h2><p>Give your team a clear view of today’s guests, kitchen queue, menu, and ingredient levels.</p><div><Link className="rest-button rest-button--light" to="/restaurant/orders"><FiPackage /> Open kitchen orders</Link><Link className="rest-button rest-button--ghost" to="/restaurant/reservations"><FiCalendar /> Manage reservations</Link></div></div><div className="rest-hero__art" aria-hidden="true"><div className="rest-plate"><span /><i /><b /></div><div className="rest-hero__caption">PREP · SERVE · DELIGHT</div></div></div>
          <div className="rest-stats">
            <Stat icon={FiPackage} tone="blue" label="Active kitchen orders" value={stats.activeOrders} note={`${stats.orderCountToday} orders today`} />
            <Stat icon={FiCalendar} tone="green" label="Reservations today" value={stats.reservationsToday} note={`${stats.availableTables} tables available`} />
            <Stat icon={FiCoffee} tone="amber" label="Available menu items" value={stats.menuItems} note="Ready to serve" />
            <Stat icon={FiUsers} tone="violet" label="Loyalty customers" value={stats.customers} note={`${stats.lowStock} ingredients low`} />
          </div>
          <section className="rest-panel"><div className="rest-panel__heading"><div><span className="rest-kicker">KITCHEN QUEUE</span><h2>Orders being prepared</h2><p>Update the team as each order moves from prep to table.</p></div><Link to="/restaurant/orders" className="rest-inline-link">View kitchen <FiArrowUpRight /></Link></div>
            {stats.recentOrders?.length ? <div className="rest-order-list">{stats.recentOrders.map((order) => <OrderRow key={order._id} order={order} onStatus={(status) => updateOrder(order, { status })} />)}</div> : <EmptyState icon={FiPackage} title="Kitchen is clear" description="New dine-in, takeaway, or delivery orders will appear here." />}
          </section>
          <div className="rest-overview-grid">
            <section className="rest-panel"><div className="rest-panel__heading"><div><span className="rest-kicker">TODAY'S TABLES</span><h2>Reservations</h2></div><Link to="/restaurant/reservations" className="rest-inline-link">Schedule <FiArrowUpRight /></Link></div>{reservations.length ? reservations.slice(0, 5).map((item) => <ReservationRow key={item._id} reservation={item} onStatus={(status) => updateReservation(item, status)} />) : <EmptyState icon={FiCalendar} title="No reservations loaded" description="Keep track of upcoming guests and table plans." action="Add reservation" onClick={() => openModal('reservation')} />}</section>
            <section className="rest-panel"><div className="rest-panel__heading"><div><span className="rest-kicker">STOCK WATCH</span><h2>Ingredient alerts</h2></div><Link to="/restaurant/inventory" className="rest-inline-link">Inventory <FiArrowUpRight /></Link></div>{ingredients.filter((item) => item.quantity <= item.reorderLevel).slice(0, 5).length ? ingredients.filter((item) => item.quantity <= item.reorderLevel).slice(0, 5).map((item) => <IngredientRow key={item._id} ingredient={item} onAdjust={() => openModal('ingredient', item)} />) : <EmptyState icon={FiBox} title="No low-stock alerts" description="Ingredients at or below their reorder level will show here." />}</section>
          </div>
          <div className="rest-today"><span>Today's sales</span><strong>{money(stats.salesToday)}</strong><small>from {stats.orderCountToday} non-cancelled orders</small></div>
        </section>}

        {section === 'menu' && <section className="rest-panel">
          <div className="rest-toolbar"><label className="rest-search"><FiSearch /><input type="search" placeholder="Search menu items or category" value={search} onChange={(e) => setSearch(e.target.value)} /></label><span className="rest-count">{menu.length} menu items</span></div>
          {menu.length ? <div className="rest-menu-grid">{menu.map((item) => <article className="rest-menu-card" key={item._id}><div className="rest-menu-card__top"><span>{titleCase(item.category)}</span><span className={`rest-status rest-status--${item.available ? 'available' : 'inactive'}`}>{item.available ? 'Available' : 'Unavailable'}</span></div><h3>{item.name}</h3><p>{item.description || 'A guest favorite from the kitchen.'}</p><div className="rest-menu-card__meta"><strong>{money(item.price)}</strong><span><FiClock /> {item.preparationMinutes} min</span><span>{titleCase(item.dietary)}</span></div><div className="rest-menu-card__actions"><button className="rest-icon-action" onClick={() => openModal('menu', item)} aria-label={`Edit ${item.name}`}><FiEdit2 /></button>{item.available && <button className="rest-icon-action rest-icon-action--danger" onClick={() => removeMenuItem(item)} aria-label={`Mark ${item.name} unavailable`}><FiX /></button>}</div></article>)}</div> : <EmptyState icon={FiCoffee} title="Menu is waiting for its first dish" description="Add an item with a category, price, preparation time, and dietary label." action="Add menu item" onClick={() => openModal('menu')} />}
        </section>}

        {section === 'orders' && <section className="rest-panel">
          <div className="rest-toolbar"><label className="rest-search"><FiSearch /><input type="search" placeholder="Search order number or guest" value={search} onChange={(e) => setSearch(e.target.value)} /></label><select className="rest-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter orders">{['', ...orderStatuses].map((status) => <option key={status || 'all'} value={status}>{status ? titleCase(status) : 'All kitchen stages'}</option>)}</select><span className="rest-count">{orders.length} orders</span></div>
          {orders.length ? <div className="rest-order-list">{orders.map((order) => <OrderRow key={order._id} order={order} onStatus={(status) => updateOrder(order, { status })} onPayment={(paymentStatus) => updateOrder(order, { paymentStatus })} />)}</div> : <EmptyState icon={FiPackage} title="No kitchen orders found" description="Create an order from your available menu items." action="Create order" onClick={() => openModal('order')} />}
        </section>}

        {section === 'reservations' && <section className="rest-panel">
          <div className="rest-toolbar"><label className="rest-search"><FiSearch /><input type="search" placeholder="Search reservations by guest name" value={search} onChange={(e) => setSearch(e.target.value)} /></label><select className="rest-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter reservations">{['', ...reservationStatuses].map((status) => <option key={status || 'all'} value={status}>{status ? titleCase(status) : 'All reservation statuses'}</option>)}</select><span className="rest-count">{reservations.length} reservations</span></div>
          {reservations.filter((r) => !search || r.guestName.toLowerCase().includes(search.toLowerCase())).length ? reservations.filter((r) => !search || r.guestName.toLowerCase().includes(search.toLowerCase())).map((reservation) => <ReservationRow key={reservation._id} reservation={reservation} onEdit={() => openModal('reservation', reservation)} onStatus={(status) => updateReservation(reservation, status)} />) : <EmptyState icon={FiCalendar} title="No reservations in this view" description="Book a table and plan for your next guests." action="New reservation" onClick={() => openModal('reservation')} />}
          <div className="rest-table-section"><div className="rest-panel__heading"><div><span className="rest-kicker">FLOOR PLAN</span><h2>Tables & seating</h2></div><button className="rest-inline-link" onClick={() => openModal('table')}><FiPlus /> Add table</button></div><div className="rest-table-grid">{tables.map((table) => <article className={`rest-table-card rest-table-card--${table.status}`} key={table._id}><strong>{table.name}</strong><span>{table.capacity} seats · {table.area || 'Main dining'}</span><select aria-label={`Update ${table.name} status`} value={table.status} onChange={(e) => restaurantService.updateTable(table._id, { status: e.target.value }).then(fetchData).catch((err) => setError(err.response?.data?.message || 'Could not update table status.'))}><option value="available">Available</option><option value="occupied">Occupied</option><option value="inactive">Inactive</option></select></article>)}</div></div>
        </section>}

        {section === 'inventory' && <section className="rest-panel">
          <div className="rest-toolbar"><label className="rest-search"><FiSearch /><input type="search" placeholder="Search ingredient or supplier" value={search} onChange={(e) => setSearch(e.target.value)} /></label><span className="rest-count">{ingredients.length} ingredients</span></div>
          {ingredients.length ? <div className="rest-table-wrap"><table className="rest-table"><thead><tr><th>Ingredient</th><th>Stock</th><th>Reorder at</th><th>Unit cost</th><th>Supplier</th><th>Status</th><th /></tr></thead><tbody>{ingredients.map((item) => <tr key={item._id}><td><strong>{item.name}</strong><small>{item.unit}</small></td><td><span className={item.quantity <= item.reorderLevel ? 'rest-low-stock' : ''}>{item.quantity} {item.unit}</span></td><td>{item.reorderLevel} {item.unit}</td><td>{money(item.unitCost)}</td><td>{item.supplier || '—'}</td><td><span className={`rest-status rest-status--${item.status}`}>{titleCase(item.status)}</span></td><td><button className="rest-icon-action" onClick={() => openModal('ingredient', item)} aria-label={`Edit ${item.name}`}><FiEdit2 /></button><button className="rest-stock-button" onClick={() => { const next = window.prompt(`Enter new stock quantity for ${item.name}`, String(item.quantity)); if (next !== null) updateIngredient(item, next); }}>Adjust</button></td></tr>)}</tbody></table></div> : <EmptyState icon={FiBox} title="No ingredients tracked yet" description="Add kitchen staples with quantities and reorder levels." action="Add ingredient" onClick={() => openModal('ingredient')} />}
        </section>}

        {section === 'loyalty' && <section className="rest-panel">
          <div className="rest-toolbar"><label className="rest-search"><FiSearch /><input type="search" placeholder="Search loyalty customers by name or phone" value={search} onChange={(e) => setSearch(e.target.value)} /></label><span className="rest-count">{customers.length} customers</span></div>
          {customers.length ? <div className="rest-table-wrap"><table className="rest-table"><thead><tr><th>Customer</th><th>Phone</th><th>Visits</th><th>Points</th><th>Lifetime spend</th><th /></tr></thead><tbody>{customers.map((customer) => <tr key={customer._id}><td><strong>{customer.name}</strong><small>{customer.email || 'No email'}</small></td><td>{customer.phone}</td><td>{customer.visitCount}</td><td><span className="rest-points">{customer.loyaltyPoints} pts</span></td><td>{money(customer.lifetimeSpend)}</td><td><button className="rest-icon-action" onClick={() => openModal('customer', customer)} aria-label={`Edit ${customer.name}`}><FiEdit2 /></button></td></tr>)}</tbody></table></div> : <EmptyState icon={FiUsers} title="Grow your regular guest community" description="Add customers to track visits and loyalty points earned on completed orders." action="Add customer" onClick={() => openModal('customer')} />}
          <p className="rest-footnote">Loyalty points are awarded automatically when a linked customer order is completed (1 point per ₹100).</p>
        </section>}
      </>}

      {modal && <Dialog title={modalTitle(modal)} onClose={() => setModal(null)}><form className="rest-form" onSubmit={submit}>
        {modal.type === 'menu' && <div className="rest-form-grid">
          <Field label="Item name" required><input required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Category" required><input required value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Starters, mains, drinks" /></Field><Field label="Price (INR)" required><input required min="0" type="number" value={form.price || ''} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field><Field label="Prep time (minutes)"><input min="1" type="number" value={form.preparationMinutes || 15} onChange={(e) => setForm({ ...form, preparationMinutes: e.target.value })} /></Field><Field label="Dietary"><select value={form.dietary || 'standard'} onChange={(e) => setForm({ ...form, dietary: e.target.value })}>{['standard', 'vegetarian', 'vegan', 'gluten_free'].map((x) => <option key={x} value={x}>{titleCase(x)}</option>)}</select></Field><Field label="Availability"><select value={String(form.available !== false)} onChange={(e) => setForm({ ...form, available: e.target.value === 'true' })}><option value="true">Available</option><option value="false">Unavailable</option></select></Field><Field label="Description" wide><textarea rows="3" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        </div>}
        {modal.type === 'table' && <div className="rest-form-grid"><Field label="Table name / number" required><input required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Seats" required><input required min="1" max="50" type="number" value={form.capacity || ''} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field><Field label="Dining area"><input value={form.area || ''} onChange={(e) => setForm({ ...form, area: e.target.value })} /></Field></div>}
        {modal.type === 'customer' && <div className="rest-form-grid"><Field label="Customer name" required><input required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Phone (unique)" required><input required value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field><Field label="Email"><input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field></div>}
        {modal.type === 'reservation' && <div className="rest-form-grid"><Field label="Guest name" required><input required value={form.guestName || ''} onChange={(e) => setForm({ ...form, guestName: e.target.value })} /></Field><Field label="Phone" required><input required value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field><Field label="Loyalty customer"><select value={form.customer || ''} onChange={(e) => { const customer = customers.find((c) => c._id === e.target.value); setForm({ ...form, customer: e.target.value, guestName: customer?.name || form.guestName, phone: customer?.phone || form.phone }); }}><option value="">Guest / new customer</option>{customers.map((c) => <option key={c._id} value={c._id}>{c.name} · {c.phone}</option>)}</select></Field><Field label="Party size" required><input required min="1" max="50" type="number" value={form.partySize || 2} onChange={(e) => setForm({ ...form, partySize: e.target.value })} /></Field><Field label="Date & time" required><input required type="datetime-local" value={form.reservationAt || ''} onChange={(e) => setForm({ ...form, reservationAt: e.target.value })} /></Field><Field label="Table"><select value={form.table || ''} onChange={(e) => setForm({ ...form, table: e.target.value })}><option value="">Assign later</option>{tables.filter((t) => t.status !== 'inactive').map((t) => <option key={t._id} value={t._id}>{t.name} · {t.capacity} seats</option>)}</select></Field><Field label="Notes" wide><textarea rows="2" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>}
        {modal.type === 'order' && <div className="rest-form-grid"><Field label="Order type"><select value={form.orderType} onChange={(e) => setForm({ ...form, orderType: e.target.value, table: '' })}><option value="dine_in">Dine-in</option><option value="takeaway">Takeaway</option><option value="delivery">Delivery</option></select></Field><Field label="Loyalty customer"><select value={form.customer || ''} onChange={(e) => { const customer = customers.find((c) => c._id === e.target.value); setForm({ ...form, customer: e.target.value, guestName: customer?.name || form.guestName }); }}><option value="">Guest order</option>{customers.map((c) => <option key={c._id} value={c._id}>{c.name} · {c.phone}</option>)}</select></Field>{!form.customer && <Field label="Guest name" required><input required value={form.guestName || ''} onChange={(e) => setForm({ ...form, guestName: e.target.value })} /></Field>}{form.orderType === 'dine_in' && <Field label="Table" required><select required value={form.table || ''} onChange={(e) => setForm({ ...form, table: e.target.value })}><option value="">Select table</option>{tables.filter((t) => t.status === 'available').map((t) => <option key={t._id} value={t._id}>{t.name} · {t.capacity} seats</option>)}</select></Field>}<div className="rest-order-items rest-field--wide"><div><strong>Menu items</strong><button type="button" className="rest-inline-link" disabled={!availableMenu.length} onClick={() => setForm({ ...form, items: [...(form.items || []), { menuItem: availableMenu[0]._id, quantity: 1 }] })}><FiPlus /> Add item</button></div>{!availableMenu.length && <p className="rest-footnote">Add an available menu item before creating an order.</p>}{(form.items || []).map((line, index) => <div className="rest-order-line" key={`${index}`}><select required value={line.menuItem} onChange={(e) => setForm({ ...form, items: form.items.map((item, i) => i === index ? { ...item, menuItem: e.target.value } : item) })}><option value="">Choose menu item</option>{availableMenu.map((item) => <option key={item._id} value={item._id}>{item.name} · {money(item.price)}</option>)}</select><input aria-label="Quantity" min="1" type="number" value={line.quantity} onChange={(e) => setForm({ ...form, items: form.items.map((item, i) => i === index ? { ...item, quantity: e.target.value } : item) })} /><button type="button" className="rest-icon-action rest-icon-action--danger" disabled={form.items.length < 2} onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}><FiTrash2 /></button></div>)}<strong className="rest-order-total">Total: {money(orderTotal)}</strong></div><Field label="Kitchen note" wide><textarea rows="2" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>}
        {modal.type === 'ingredient' && <div className="rest-form-grid"><Field label="Ingredient" required><input required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Unit" required><input required value={form.unit || ''} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg, litre, piece" /></Field><Field label="Quantity on hand"><input min="0" type="number" step="any" value={form.quantity ?? 0} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field><Field label="Reorder level"><input min="0" type="number" step="any" value={form.reorderLevel ?? 0} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} /></Field><Field label="Unit cost (INR)"><input min="0" type="number" step="any" value={form.unitCost ?? 0} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} /></Field><Field label="Supplier"><input value={form.supplier || ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></Field></div>}
        <FormActions onCancel={() => setModal(null)} saving={saving} label={`${modal.record ? 'Save' : 'Create'} ${modal.type}`} />
      </form></Dialog>}
    </main>
  );
};

const Stat = ({ icon, tone, label, value, note }) => <article className="rest-stat"><div className={`rest-stat__icon rest-stat__icon--${tone}`}>{createElement(icon)}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
const OrderRow = ({ order, onStatus, onPayment }) => <article className="rest-order-row"><span className="rest-order-icon"><FiCoffee /></span><div className="rest-order-row__main"><strong>{order.orderNumber || order.guestName || order.customer?.name || 'Guest order'}</strong><span>{titleCase(order.orderType)} · {order.items?.map((item) => `${item.quantity}× ${item.name}`).join(', ')}</span><small>{order.table?.name || 'No table'} · {dateTime(order.createdAt)}</small></div><strong className="rest-order-amount">{money(order.totalAmount)}</strong>{onPayment && <select className="rest-filter" aria-label="Payment status" value={order.paymentStatus} onChange={(e) => onPayment(e.target.value)}><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="refunded">Refunded</option></select>}<select className={`rest-status-select rest-status-select--${order.status}`} aria-label="Update kitchen status" value={order.status} onChange={(e) => onStatus(e.target.value)}>{orderStatuses.map((s) => <option value={s} key={s}>{titleCase(s)}</option>)}</select></article>;
const ReservationRow = ({ reservation, onEdit, onStatus }) => <article className="rest-reservation-row"><span><FiCalendar /></span><div><strong>{reservation.guestName}</strong><small>{reservation.partySize} guests · {reservation.table?.name || 'Table unassigned'} · {reservation.phone}</small></div><time>{dateTime(reservation.reservationAt)}</time><select className={`rest-status-select rest-status-select--${reservation.status}`} value={reservation.status} onChange={(e) => onStatus(e.target.value)} aria-label={`Update reservation for ${reservation.guestName}`}>{reservationStatuses.map((s) => <option value={s} key={s}>{titleCase(s)}</option>)}</select>{onEdit && <button className="rest-icon-action" onClick={onEdit} aria-label="Edit reservation"><FiEdit2 /></button>}</article>;
const IngredientRow = ({ ingredient, onAdjust }) => <article className="rest-ingredient-row"><span><FiBox /></span><div><strong>{ingredient.name}</strong><small>Reorder at {ingredient.reorderLevel} {ingredient.unit}</small></div><b>{ingredient.quantity} {ingredient.unit}</b><button className="rest-inline-link" onClick={onAdjust}>Update</button></article>;
const EmptyState = ({ icon, title, description, action, onClick }) => <div className="rest-empty"><span>{createElement(icon)}</span><h3>{title}</h3><p>{description}</p>{action && <button className="rest-button rest-button--primary" onClick={onClick}><FiPlus /> {action}</button>}</div>;
const Dialog = ({ title, onClose, children }) => <div className="rest-dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="rest-dialog" role="dialog" aria-modal="true" aria-labelledby="restaurant-dialog-title"><header><h2 id="restaurant-dialog-title">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog"><FiX /></button></header>{children}</section></div>;
const Field = ({ label, required, wide, children }) => <label className={`rest-field ${wide ? 'rest-field--wide' : ''}`}><span>{label}{required && <b> *</b>}</span>{children}</label>;
const FormActions = ({ onCancel, saving, label }) => <div className="rest-form-actions"><button type="button" className="rest-button rest-button--neutral" onClick={onCancel} disabled={saving}>Cancel</button><button type="submit" className="rest-button rest-button--primary" disabled={saving}>{saving ? 'Saving...' : label}</button></div>;
const modalTitle = ({ type, record }) => `${record ? 'Edit' : 'Add'} ${type === 'menu' ? 'menu item' : type}`;

export default RestaurantDashboard;
