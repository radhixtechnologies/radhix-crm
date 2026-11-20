import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiActivity, FiArrowUpRight, FiBriefcase, FiCalendar, FiCheck, FiClock, FiEdit2,
  FiMap, FiPlus, FiSearch, FiTrash2, FiUsers, FiX,
} from 'react-icons/fi';
import { travelService } from '../../services/travelService';
import Loader from '../../components/common/Loader';
import './TravelDashboard.css';

const bookingStatuses = ['inquiry', 'quoted', 'confirmed', 'cancelled', 'completed'];
const paymentStatuses = ['unpaid', 'partial', 'paid', 'refunded'];
const packageCategories = ['domestic', 'international', 'adventure', 'pilgrimage', 'business', 'staycation', 'other'];
const titleCase = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
const money = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);
const dateLabel = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Dates flexible';
const emptyPackage = { name: '', packageCode: '', destination: '', category: 'domestic', durationDays: '1', pricePerPerson: '', inclusions: '', description: '', status: 'active' };
const emptyBooking = { bookingCode: '', customerName: '', phone: '', email: '', package: '', destination: '', travelers: '1', travelStartDate: '', travelEndDate: '', status: 'inquiry', totalAmount: '', amountPaid: '0', notes: '' };

const TravelDashboard = () => {
  const location = useLocation();
  const section = location.pathname.split('/')[2] || 'overview';
  const [summary, setSummary] = useState(null);
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [packageModal, setPackageModal] = useState(null);
  const [bookingModal, setBookingModal] = useState(null);
  const [packageForm, setPackageForm] = useState(emptyPackage);
  const [bookingForm, setBookingForm] = useState(emptyBooking);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const requests = [];
      if (section === 'overview') {
        requests.push(travelService.getSummary().then((response) => setSummary(response.data.data)));
      }
      if (['overview', 'packages'].includes(section)) {
        requests.push(travelService.getPackages({ status: section === 'packages' ? '' : 'active', search: section === 'packages' ? search.trim() : '' })
          .then((response) => setPackages(response.data.data || [])));
      }
      if (['overview', 'bookings'].includes(section)) {
        requests.push(travelService.getBookings({
          search: section === 'bookings' ? search.trim() : '',
          status: statusFilter || '',
          paymentStatus: paymentFilter || '',
        }).then((response) => setBookings(response.data.data || [])));
      }
      if (section === 'bookings') {
        requests.push(travelService.getPackages({ status: 'active' }).then((response) => setPackages(response.data.data || [])));
      }
      await Promise.all(requests);
    } catch (requestError) {
      console.error('Unable to load travel workspace:', requestError);
      setError(requestError.response?.data?.message || 'Could not load the travel workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [section, search, statusFilter, paymentFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, search]);

  const stats = summary || { activePackages: 0, enquiries: 0, confirmedBookings: 0, upcomingTrips: 0, revenue: 0, recentBookings: [] };
  const pageTitle = { overview: 'Travel Overview', packages: 'Tours & Packages', bookings: 'Enquiries & Bookings' }[section] || 'Travel Overview';
  const activePackages = useMemo(() => packages.filter((item) => item.status === 'active'), [packages]);

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const openPackage = (travelPackage = null) => {
    setPackageForm(travelPackage ? {
      ...emptyPackage, ...travelPackage,
      durationDays: String(travelPackage.durationDays || 1),
      pricePerPerson: String(travelPackage.pricePerPerson || 0),
    } : emptyPackage);
    setPackageModal(travelPackage || {});
  };

  const savePackage = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...packageForm,
        packageCode: packageForm.packageCode.trim() || undefined,
        durationDays: Number(packageForm.durationDays),
        pricePerPerson: Number(packageForm.pricePerPerson),
      };
      if (packageModal?._id) await travelService.updatePackage(packageModal._id, payload);
      else await travelService.createPackage(payload);
      setPackageModal(null);
      flash(packageModal?._id ? 'Travel package updated.' : 'Travel package created.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save the travel package.');
    } finally {
      setSaving(false);
    }
  };

  const openBooking = (booking = null) => {
    setBookingForm(booking ? {
      ...emptyBooking, ...booking, package: booking.package?._id || '',
      travelers: String(booking.travelers || 1), totalAmount: String(booking.totalAmount || 0),
      amountPaid: String(booking.amountPaid || 0),
      travelStartDate: booking.travelStartDate ? new Date(booking.travelStartDate).toISOString().slice(0, 10) : '',
      travelEndDate: booking.travelEndDate ? new Date(booking.travelEndDate).toISOString().slice(0, 10) : '',
    } : emptyBooking);
    setBookingModal(booking || {});
  };

  const saveBooking = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...bookingForm,
        bookingCode: bookingForm.bookingCode.trim() || undefined,
        package: bookingForm.package || null,
        travelers: Number(bookingForm.travelers || 1),
        totalAmount: Number(bookingForm.totalAmount || 0),
        amountPaid: Number(bookingForm.amountPaid || 0),
        travelStartDate: bookingForm.travelStartDate || null,
        travelEndDate: bookingForm.travelEndDate || null,
      };
      if (bookingModal?._id) await travelService.updateBooking(bookingModal._id, payload);
      else await travelService.createBooking(payload);
      setBookingModal(null);
      flash(bookingModal?._id ? 'Booking updated.' : 'Enquiry / booking saved.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save this enquiry or booking.');
    } finally {
      setSaving(false);
    }
  };

  const updateBooking = async (booking, changes) => {
    try {
      await travelService.updateBooking(booking._id, changes);
      flash('Booking status updated.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update this booking.');
    }
  };

  const removeBooking = async (booking) => {
    if (!window.confirm(`Delete the ${booking.status} record for ${booking.customerName}?`)) return;
    try {
      await travelService.deleteBooking(booking._id);
      flash('Booking record deleted.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not delete this booking.');
    }
  };

  const deactivatePackage = async (travelPackage) => {
    if (!window.confirm(`Mark "${travelPackage.name}" inactive? Existing booking history will be retained.`)) return;
    try {
      await travelService.updatePackage(travelPackage._id, { status: 'inactive' });
      flash('Package marked inactive.');
      await fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update package status.');
    }
  };

  const applyPackage = (id) => {
    const selected = activePackages.find((item) => item._id === id);
    setBookingForm({
      ...bookingForm,
      package: id,
      destination: selected?.destination || bookingForm.destination,
      totalAmount: selected ? String(selected.pricePerPerson * (Number(bookingForm.travelers) || 1)) : bookingForm.totalAmount,
    });
  };

  const changeTravelers = (value) => {
    const selected = activePackages.find((item) => item._id === bookingForm.package);
    setBookingForm({
      ...bookingForm,
      travelers: value,
      totalAmount: selected ? String(selected.pricePerPerson * (Number(value) || 1)) : bookingForm.totalAmount,
    });
  };

  return (
    <main className="travel-page">
      <header className="travel-header">
        <div><span className="travel-eyebrow"><FiMap /> TRAVEL & HOSPITALITY OPERATIONS</span><h1>{pageTitle}</h1><p>Organize trip enquiries, curated packages, reservations, and payment progress in one place.</p></div>
        <div className="travel-header__actions">
          {section === 'packages' && <button className="travel-button travel-button--primary" onClick={() => openPackage()}><FiPlus /> Create package</button>}
          {section !== 'packages' && <button className="travel-button travel-button--primary" onClick={() => openBooking()}><FiPlus /> New enquiry</button>}
        </div>
      </header>

      <nav className="travel-tabs" aria-label="Travel sections">
        {[
          { key: 'overview', label: 'Overview', path: '/travel', icon: FiActivity },
          { key: 'packages', label: 'Tours & Packages', path: '/travel/packages', icon: FiMap },
          { key: 'bookings', label: 'Enquiries & Bookings', path: '/travel/bookings', icon: FiCalendar },
        ].map(({ key, label, path, icon }) => <Link key={key} to={path} className={`travel-tab ${section === key ? 'is-active' : ''}`}>{createElement(icon)} {label}</Link>)}
      </nav>

      {notice && <div className="travel-alert travel-alert--success" role="status"><FiCheck /> {notice}</div>}
      {error && <div className="travel-alert travel-alert--error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><FiX /></button></div>}

      {loading ? <div className="travel-loading"><Loader /></div> : <>
        {section === 'overview' && <section className="travel-overview">
          <div className="travel-hero"><div className="travel-hero__copy"><span>PLAN LESS ADMIN · CREATE MORE JOURNEYS</span><h2>Make every trip a smoother experience.</h2><p>Manage travel enquiries, package choices, guest bookings, and payment progress from the first conversation to departure.</p><div><button className="travel-button travel-button--light" onClick={() => openBooking()}><FiPlus /> Capture an enquiry</button><Link to="/travel/packages" className="travel-button travel-button--ghost"><FiMap /> Explore packages</Link></div></div><div className="travel-hero__art" aria-hidden="true"><div className="travel-sun" /><div className="travel-mountain travel-mountain--back" /><div className="travel-mountain travel-mountain--front" /><span>YOUR NEXT JOURNEY STARTS HERE</span></div></div>
          <div className="travel-stats">
            <Stat icon={FiMap} tone="blue" label="Active packages" value={stats.activePackages} note="Ready for enquiries" />
            <Stat icon={FiUsers} tone="amber" label="Open enquiries" value={stats.enquiries} note="Awaiting confirmation" />
            <Stat icon={FiCalendar} tone="green" label="Confirmed bookings" value={stats.confirmedBookings} note="Guest trips confirmed" />
            <Stat icon={FiBriefcase} tone="violet" label="Upcoming trips" value={stats.upcomingTrips} note={`${money(stats.revenue)} collected`} />
          </div>
          <section className="travel-panel"><div className="travel-panel__heading"><div><span className="travel-kicker">TRIP PIPELINE</span><h2>Latest enquiries & bookings</h2><p>Keep each traveler’s request moving toward a confirmed trip.</p></div><Link to="/travel/bookings" className="travel-inline-link">Open pipeline <FiArrowUpRight /></Link></div>
            {stats.recentBookings?.length ? <div className="travel-booking-list">{stats.recentBookings.map((booking) => <BookingRow key={booking._id} booking={booking} onEdit={() => openBooking(booking)} />)}</div> : <EmptyState icon={FiCalendar} title="No trips in the pipeline yet" description="Capture a traveler enquiry to start building a booking." action="Add first enquiry" onClick={() => openBooking()} />}
          </section>
          <section className="travel-panel"><div className="travel-panel__heading"><div><span className="travel-kicker">FEATURED EXPERIENCES</span><h2>Packages ready to share</h2></div><Link to="/travel/packages" className="travel-inline-link">All packages <FiArrowUpRight /></Link></div>
            {activePackages.length ? <div className="travel-package-grid">{activePackages.slice(0, 3).map((item) => <PackageCard key={item._id} travelPackage={item} onEdit={() => openPackage(item)} onBook={() => { openBooking(); setBookingForm({ ...emptyBooking, package: item._id, destination: item.destination, totalAmount: String(item.pricePerPerson) }); }} />)}</div> : <EmptyState icon={FiMap} title="Create your first trip package" description="Set destinations, duration, inclusions, and per-traveler pricing." action="Create package" onClick={() => openPackage()} />}
          </section>
        </section>}

        {section === 'packages' && <>
          <div className="travel-toolbar"><label className="travel-search"><FiSearch /><input type="search" placeholder="Search package, package code, or destination" value={search} onChange={(event) => setSearch(event.target.value)} /></label><span className="travel-count">{packages.length} packages</span></div>
          {packages.length ? <div className="travel-package-grid">{packages.map((item) => <PackageCard key={item._id} travelPackage={item} onEdit={() => openPackage(item)} onDeactivate={() => deactivatePackage(item)} onBook={() => { openBooking(); setBookingForm({ ...emptyBooking, package: item._id, destination: item.destination, totalAmount: String(item.pricePerPerson) }); }} />)}</div> : <section className="travel-panel"><EmptyState icon={FiMap} title="No packages found" description="Add a tour package or adjust the search." action="Create package" onClick={() => openPackage()} /></section>}
        </>}

        {section === 'bookings' && <section className="travel-panel">
          <div className="travel-toolbar travel-toolbar--inside"><label className="travel-search"><FiSearch /><input type="search" placeholder="Search traveler, booking code, or destination" value={search} onChange={(event) => setSearch(event.target.value)} /></label><select className="travel-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter bookings by status"><option value="">All stages</option>{bookingStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select><select className="travel-filter" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} aria-label="Filter by payment status"><option value="">All payments</option>{paymentStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select><span className="travel-count">{bookings.length} records</span></div>
          {bookings.length ? <div className="travel-booking-list">{bookings.map((booking) => <BookingRow key={booking._id} booking={booking} onEdit={() => openBooking(booking)} onDelete={() => removeBooking(booking)} onStatus={(status) => updateBooking(booking, { status })} onPayment={(paymentStatus) => updateBooking(booking, { paymentStatus })} />)}</div> : <EmptyState icon={FiCalendar} title="No enquiries or bookings found" description="Add a traveler enquiry and track it through quote, confirmation, and payment." action="Create enquiry" onClick={() => openBooking()} />}
        </section>}
      </>}

      {packageModal !== null && <Dialog title={packageModal?._id ? 'Edit travel package' : 'Create travel package'} onClose={() => setPackageModal(null)}><form className="travel-form" onSubmit={savePackage}><div className="travel-form-grid">
        <Field label="Package name" required><input required maxLength="160" value={packageForm.name} onChange={(event) => setPackageForm({ ...packageForm, name: event.target.value })} placeholder="e.g. Kerala backwaters escape" /></Field>
        <Field label="Package code"><input value={packageForm.packageCode} onChange={(event) => setPackageForm({ ...packageForm, packageCode: event.target.value })} placeholder="Optional unique code" /></Field>
        <Field label="Destination" required><input required value={packageForm.destination} onChange={(event) => setPackageForm({ ...packageForm, destination: event.target.value })} /></Field>
        <Field label="Category"><select value={packageForm.category} onChange={(event) => setPackageForm({ ...packageForm, category: event.target.value })}>{packageCategories.map((category) => <option key={category} value={category}>{titleCase(category)}</option>)}</select></Field>
        <Field label="Duration (days)" required><input required min="1" max="365" type="number" value={packageForm.durationDays} onChange={(event) => setPackageForm({ ...packageForm, durationDays: event.target.value })} /></Field>
        <Field label="Price per traveler (INR)" required><input required min="0" type="number" value={packageForm.pricePerPerson} onChange={(event) => setPackageForm({ ...packageForm, pricePerPerson: event.target.value })} /></Field>
        <Field label="Package status"><select value={packageForm.status} onChange={(event) => setPackageForm({ ...packageForm, status: event.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
        <Field label="Inclusions" wide><textarea rows="3" maxLength="3000" value={packageForm.inclusions} onChange={(event) => setPackageForm({ ...packageForm, inclusions: event.target.value })} placeholder="Stay, meals, transfers, tickets..." /></Field>
        <Field label="Description" wide><textarea rows="3" maxLength="4000" value={packageForm.description} onChange={(event) => setPackageForm({ ...packageForm, description: event.target.value })} /></Field>
      </div><FormActions onCancel={() => setPackageModal(null)} saving={saving} label={packageModal?._id ? 'Save package' : 'Create package'} /></form></Dialog>}

      {bookingModal !== null && <Dialog title={bookingModal?._id ? 'Update travel enquiry / booking' : 'New travel enquiry'} onClose={() => setBookingModal(null)}><form className="travel-form" onSubmit={saveBooking}><div className="travel-form-grid">
        <Field label="Traveler / customer name" required><input required value={bookingForm.customerName} onChange={(event) => setBookingForm({ ...bookingForm, customerName: event.target.value })} /></Field>
        <Field label="Phone number" required><input required value={bookingForm.phone} onChange={(event) => setBookingForm({ ...bookingForm, phone: event.target.value })} /></Field>
        <Field label="Email"><input type="email" value={bookingForm.email} onChange={(event) => setBookingForm({ ...bookingForm, email: event.target.value })} /></Field>
        <Field label="Booking code"><input value={bookingForm.bookingCode} onChange={(event) => setBookingForm({ ...bookingForm, bookingCode: event.target.value })} placeholder="Optional reference" /></Field>
        <Field label="Travel package"><select value={bookingForm.package} onChange={(event) => applyPackage(event.target.value)}><option value="">Custom trip / no package</option>{activePackages.map((item) => <option key={item._id} value={item._id}>{item.name} · {item.destination}</option>)}</select></Field>
        <Field label="Destination" required><input required value={bookingForm.destination} onChange={(event) => setBookingForm({ ...bookingForm, destination: event.target.value })} /></Field>
        <Field label="Travelers"><input min="1" max="1000" type="number" value={bookingForm.travelers} onChange={(event) => changeTravelers(event.target.value)} /></Field>
        <Field label="Booking stage"><select value={bookingForm.status} onChange={(event) => setBookingForm({ ...bookingForm, status: event.target.value })}>{bookingStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></Field>
        <Field label="Travel start date"><input type="date" value={bookingForm.travelStartDate} onChange={(event) => setBookingForm({ ...bookingForm, travelStartDate: event.target.value })} /></Field>
        <Field label="Travel end date"><input type="date" value={bookingForm.travelEndDate} onChange={(event) => setBookingForm({ ...bookingForm, travelEndDate: event.target.value })} /></Field>
        <Field label="Booking total (INR)"><input min="0" type="number" value={bookingForm.totalAmount} onChange={(event) => setBookingForm({ ...bookingForm, totalAmount: event.target.value })} /></Field>
        <Field label="Amount received (INR)"><input min="0" type="number" value={bookingForm.amountPaid} onChange={(event) => setBookingForm({ ...bookingForm, amountPaid: event.target.value })} /></Field>
        <Field label="Notes" wide><textarea rows="3" maxLength="3000" value={bookingForm.notes} onChange={(event) => setBookingForm({ ...bookingForm, notes: event.target.value })} placeholder="Traveler requests or follow-up details" /></Field>
      </div><FormActions onCancel={() => setBookingModal(null)} saving={saving} label={bookingModal?._id ? 'Save booking' : 'Save enquiry'} /></form></Dialog>}
    </main>
  );
};

const Stat = ({ icon, tone, label, value, note }) => <article className="travel-stat"><div className={`travel-stat__icon travel-stat__icon--${tone}`}>{createElement(icon)}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
const PackageCard = ({ travelPackage, onEdit, onDeactivate, onBook }) => <article className="travel-package-card"><div className="travel-package-card__image"><span>{titleCase(travelPackage.category)}</span><FiMap /></div><div className="travel-package-card__body"><div className="travel-package-card__top"><span className="travel-package-destination">{travelPackage.destination}</span><span className={`travel-status travel-status--${travelPackage.status}`}>{titleCase(travelPackage.status)}</span></div><h3>{travelPackage.name}</h3><p>{travelPackage.description || 'A curated travel experience for your guests.'}</p><div className="travel-package-facts"><span><FiClock /> {travelPackage.durationDays} days</span><strong>{money(travelPackage.pricePerPerson)} <small>/ traveler</small></strong></div>{travelPackage.inclusions && <small className="travel-inclusions">{travelPackage.inclusions}</small>}<div className="travel-package-actions">{onBook && <button className="travel-button travel-button--primary" onClick={onBook}>Create booking</button>}{onEdit && <button className="travel-icon-action" onClick={onEdit} aria-label={`Edit ${travelPackage.name}`}><FiEdit2 /></button>}{onDeactivate && travelPackage.status === 'active' && <button className="travel-icon-action travel-icon-action--danger" onClick={onDeactivate} aria-label={`Deactivate ${travelPackage.name}`}><FiX /></button>}</div></div></article>;
const BookingRow = ({ booking, onEdit, onDelete, onStatus, onPayment }) => <article className="travel-booking-row"><div className="travel-booking-row__icon"><FiCalendar /></div><div className="travel-booking-row__main"><strong>{booking.customerName}</strong><span>{booking.package?.name || 'Custom trip'} · {booking.destination}</span><small>{booking.bookingCode || 'Enquiry'} · {booking.travelers} traveler{booking.travelers === 1 ? '' : 's'} · {dateLabel(booking.travelStartDate)}</small></div><div className="travel-booking-row__amount"><strong>{money(booking.totalAmount)}</strong><span>{money(booking.amountPaid)} received</span></div>{onStatus ? <select className={`travel-status-select travel-status-select--${booking.status}`} value={booking.status} onChange={(event) => onStatus(event.target.value)} aria-label={`Update booking status for ${booking.customerName}`}>{bookingStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select> : <span className={`travel-status travel-status--${booking.status}`}>{titleCase(booking.status)}</span>}{onPayment && <select className={`travel-payment-select travel-payment-select--${booking.paymentStatus}`} value={booking.paymentStatus} onChange={(event) => onPayment(event.target.value)} aria-label={`Update payment status for ${booking.customerName}`}>{paymentStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select>}{onEdit && <button className="travel-icon-action" onClick={onEdit} aria-label={`Edit ${booking.customerName} booking`}><FiEdit2 /></button>}{onDelete && <button className="travel-icon-action travel-icon-action--danger" onClick={onDelete} aria-label={`Delete booking for ${booking.customerName}`}><FiTrash2 /></button>}</article>;
const EmptyState = ({ icon, title, description, action, onClick }) => <div className="travel-empty"><span>{createElement(icon)}</span><h3>{title}</h3><p>{description}</p>{action && <button className="travel-button travel-button--primary" onClick={onClick}><FiPlus /> {action}</button>}</div>;
const Dialog = ({ title, onClose, children }) => <div className="travel-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="travel-dialog" role="dialog" aria-modal="true" aria-labelledby="travel-dialog-title"><header><h2 id="travel-dialog-title">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog"><FiX /></button></header>{children}</section></div>;
const Field = ({ label, required, wide, children }) => <label className={`travel-field ${wide ? 'travel-field--wide' : ''}`}><span>{label}{required && <b> *</b>}</span>{children}</label>;
const FormActions = ({ onCancel, saving, label }) => <div className="travel-form-actions"><button type="button" className="travel-button travel-button--neutral" onClick={onCancel} disabled={saving}>Cancel</button><button type="submit" className="travel-button travel-button--primary" disabled={saving}>{saving ? 'Saving...' : label}</button></div>;

export default TravelDashboard;
