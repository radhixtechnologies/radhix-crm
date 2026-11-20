import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiArrowUpRight, FiCalendar, FiCheck, FiChevronRight, FiEdit2,
  FiHome, FiMapPin, FiPlus, FiSearch, FiTrash2, FiTrendingUp, FiUsers, FiX,
} from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import { employeeService } from '../../services/employeeService';
import { getRealEstateMediaUrl, realEstateService } from '../../services/realEstateService';
import Loader from '../../components/common/Loader';
import './RealEstateDashboard.css';

const emptyProperty = {
  title: '', propertyCode: '', propertyType: 'apartment', listingType: 'sale',
  status: 'available', price: '', bedrooms: '0', bathrooms: '0', areaSqft: '',
  address: '', city: '', description: '', assignedAgent: '',
};
const statusLabels = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', converted: 'Won', lost: 'Lost' };
const money = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(Number(amount) || 0);
const dateTime = (value) => value
  ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  : 'Not scheduled';

const RealEstateDashboard = () => {
  const location = useLocation();
  const section = location.pathname.split('/')[2] || 'overview';
  const [summary, setSummary] = useState(null);
  const [properties, setProperties] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [visits, setVisits] = useState([]);
  const [offers, setOffers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [propertyModal, setPropertyModal] = useState(null);
  const [buyerModal, setBuyerModal] = useState(false);
  const [visitModal, setVisitModal] = useState(false);
  const [offerModal, setOfferModal] = useState(false);
  const [offerForm, setOfferForm] = useState({ property: '', buyer: '', offerAmount: '', notes: '' });
  const [propertyForm, setPropertyForm] = useState(emptyProperty);
  const [buyerForm, setBuyerForm] = useState({ name: '', phone: '', email: '', company: '', source: 'website', assignedTo: '' });
  const [visitForm, setVisitForm] = useState({ property: '', buyer: '', visitDate: '', notes: '', assignedAgent: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const tasks = [];
      if (section === 'overview') tasks.push(realEstateService.getSummary().then((response) => setSummary(response.data.data)));
      if (section === 'overview' || section === 'properties' || section === 'site-visits' || section === 'offers') {
        tasks.push(realEstateService.getProperties({ limit: 100 }).then((response) => setProperties(response.data.data || [])));
      }
      if (section === 'overview' || section === 'buyers' || section === 'site-visits' || section === 'offers') {
        tasks.push(salesService.getLeads({ industry: 'Real Estate', search: search.trim(), limit: 100 }).then((response) => setBuyers(response.data.data || [])));
      }
      if (section === 'overview' || section === 'site-visits') {
        tasks.push(realEstateService.getSiteVisits().then((response) => setVisits(response.data.data || [])));
      }
      if (section === 'overview' || section === 'offers') {
        tasks.push(realEstateService.getOffers().then((response) => setOffers(response.data.data || [])));
        tasks.push(realEstateService.getBookings().then((response) => setBookings(response.data.data || [])));
      }
      await Promise.all(tasks);
    } catch (fetchError) {
      console.error('Unable to load Real Estate workspace:', fetchError);
      setError(fetchError.response?.data?.message || 'Could not load Real Estate workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [section, search]);

  useEffect(() => {
    const timer = setTimeout(fetchData, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, search]);

  useEffect(() => {
    employeeService.getEmployees({ limit: 100 })
      .then((response) => setAgents(response.data?.data || []))
      .catch((agentError) => console.error('Unable to load agent list:', agentError));
  }, []);

  const stats = summary || { properties: 0, available: 0, reserved: 0, buyers: 0, visitsToday: 0, upcomingVisits: 0, inventoryValue: 0 };
  const pageTitle = { overview: 'Real Estate Overview', properties: 'Property Portfolio', buyers: 'Buyer Inquiries', 'site-visits': 'Site Visits', offers: 'Offers & Bookings' }[section] || 'Real Estate Overview';
  const filteredProperties = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return properties;
    return properties.filter((property) => [property.title, property.propertyCode, property.city, property.address]
      .some((field) => String(field || '').toLowerCase().includes(value)));
  }, [properties, search]);
  const filteredVisits = useMemo(() => visits.filter((visit) => visit.status === 'scheduled'), [visits]);

  const flashNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const openProperty = (property = null) => {
    setPropertyForm(property ? {
      ...emptyProperty,
      ...property,
      assignedAgent: property.assignedAgent?._id || '',
      price: String(property.price ?? ''),
      bedrooms: String(property.bedrooms ?? 0),
      bathrooms: String(property.bathrooms ?? 0),
      areaSqft: String(property.areaSqft ?? ''),
    } : emptyProperty);
    setPropertyModal(property || {});
  };

  const saveProperty = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...propertyForm,
        propertyCode: propertyForm.propertyCode.trim() || undefined,
        price: Number(propertyForm.price),
        bedrooms: Number(propertyForm.bedrooms || 0),
        bathrooms: Number(propertyForm.bathrooms || 0),
        areaSqft: Number(propertyForm.areaSqft || 0),
        assignedAgent: propertyForm.assignedAgent || null,
      };
      if (propertyModal?._id) await realEstateService.updateProperty(propertyModal._id, payload);
      else await realEstateService.createProperty(payload);
      setPropertyModal(null);
      flashNotice(propertyModal?._id ? 'Property listing updated.' : 'Property listing added.');
      await fetchData();
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Could not save this property.');
    } finally {
      setSaving(false);
    }
  };

  const removeProperty = async (property) => {
    if (!window.confirm(`Remove "${property.title}" from the portfolio?`)) return;
    try {
      await realEstateService.deleteProperty(property._id);
      flashNotice('Property listing removed.');
      await fetchData();
    } catch (removeError) {
      setError(removeError.response?.data?.message || 'Could not remove this property.');
    }
  };

  const saveBuyer = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await salesService.createLead({
        ...buyerForm,
        name: buyerForm.name.trim(),
        email: buyerForm.email.trim(),
        phone: buyerForm.phone.trim(),
        industry: 'Real Estate',
        status: 'new',
        assignedTo: buyerForm.assignedTo || null,
      });
      setBuyerModal(false);
      setBuyerForm({ name: '', phone: '', email: '', company: '', source: 'website', assignedTo: '' });
      flashNotice('Buyer inquiry added to CRM.');
      await fetchData();
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Could not add this buyer inquiry.');
    } finally {
      setSaving(false);
    }
  };

  const saveVisit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await realEstateService.createSiteVisit({
        ...visitForm,
        assignedAgent: visitForm.assignedAgent || null,
      });
      setVisitModal(false);
      setVisitForm({ property: '', buyer: '', visitDate: '', notes: '', assignedAgent: '' });
      flashNotice('Site visit scheduled.');
      await fetchData();
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Could not schedule this site visit.');
    } finally {
      setSaving(false);
    }
  };

  const saveOffer = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await realEstateService.createOffer({ ...offerForm, offerAmount: Number(offerForm.offerAmount) });
      setOfferModal(false);
      setOfferForm({ property: '', buyer: '', offerAmount: '', notes: '' });
      flashNotice('Buyer offer recorded.');
      await fetchData();
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Could not record this offer.');
    } finally {
      setSaving(false);
    }
  };

  const updateOffer = async (offer, status) => {
    const counterAmount = status === 'countered'
      ? Number(window.prompt('Enter the counter-offer amount (INR):', offer.counterAmount || offer.offerAmount))
      : undefined;
    if (status === 'countered' && (!counterAmount || counterAmount <= 0)) return;
    try {
      await realEstateService.updateOffer(offer._id, { status, counterAmount });
      flashNotice(status === 'accepted' ? 'Offer accepted and property reserved.' : `Offer ${status}.`);
      await fetchData();
    } catch (updateError) {
      setError(updateError.response?.data?.message || 'Could not update this offer.');
    }
  };

  const updateBooking = async (booking, status) => {
    try {
      await realEstateService.updateBooking(booking._id, { status });
      flashNotice(`Booking ${status}.`);
      await fetchData();
    } catch (updateError) {
      setError(updateError.response?.data?.message || 'Could not update this booking.');
    }
  };

  const updateVisitStatus = async (visit, status) => {
    try {
      await realEstateService.updateSiteVisit(visit._id, { status });
      flashNotice(status === 'completed' ? 'Site visit marked complete.' : 'Site visit cancelled.');
      await fetchData();
    } catch (updateError) {
      setError(updateError.response?.data?.message || 'Could not update this site visit.');
    }
  };

  const updateBuyerStatus = async (buyer, status) => {
    try {
      await salesService.changeLeadStatus(buyer._id, status);
      flashNotice('Buyer lead status updated.');
      await fetchData();
    } catch (updateError) {
      setError(updateError.response?.data?.message || 'Could not update buyer status.');
    }
  };

  const pageActions = (
    <div className="re-page-actions">
      {section === 'properties' && <button className="re-button re-button--primary" onClick={() => openProperty()}><FiPlus /> Add property</button>}
      {section === 'buyers' && <button className="re-button re-button--primary" onClick={() => setBuyerModal(true)}><FiPlus /> Add buyer lead</button>}
      {section === 'site-visits' && <button className="re-button re-button--primary" onClick={() => setVisitModal(true)}><FiCalendar /> Schedule visit</button>}
      {section === 'offers' && <button className="re-button re-button--primary" onClick={() => setOfferModal(true)}><FiPlus /> Record offer</button>}
    </div>
  );

  return (
    <main className="re-page">
      <header className="re-header">
        <div className="re-header__copy">
          <span className="re-eyebrow"><FiHome /> PROPERTY SALES WORKSPACE</span>
          <h1>{pageTitle}</h1>
          <p>Bring property listings, buyer relationships, and on-site experiences together in one clear workspace.</p>
        </div>
        {pageActions}
      </header>

      <nav className="re-tabs" aria-label="Real Estate sections">
        {[
          { key: 'overview', label: 'Overview', path: '/real-estate', icon: FiTrendingUp },
          { key: 'properties', label: 'Properties', path: '/real-estate/properties', icon: FiHome },
          { key: 'buyers', label: 'Buyer leads', path: '/real-estate/buyers', icon: FiUsers },
          { key: 'site-visits', label: 'Site visits', path: '/real-estate/site-visits', icon: FiMapPin },
          { key: 'offers', label: 'Offers & bookings', path: '/real-estate/offers', icon: FiTrendingUp },
        ].map(({ key, label, path, icon: Icon }) => (
          <Link key={key} to={path} className={`re-tab ${section === key ? 'is-active' : ''}`}>
            {createElement(Icon)} {label}
          </Link>
        ))}
      </nav>

      {notice && <div className="re-alert re-alert--success" role="status"><FiCheck /> {notice}</div>}
      {error && <div className="re-alert re-alert--error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><FiX /></button></div>}

      {loading ? <div className="re-loading"><Loader /></div> : (
        <>
          {section === 'overview' && (
            <section className="re-overview">
              <div className="re-hero">
                <div className="re-hero__content">
                  <span className="re-hero__label">YOUR PROPERTY BUSINESS, AT A GLANCE</span>
                  <h2>Make every listing a better opportunity.</h2>
                  <p>Keep inventory moving, stay close to your buyers, and make every property visit count.</p>
                  <div className="re-hero__actions">
                    <button className="re-button re-button--light" onClick={() => openProperty()}><FiPlus /> Add a property</button>
                    <button className="re-button re-button--outline" onClick={() => setBuyerModal(true)}><FiUsers /> Add buyer lead</button>
                  </div>
                </div>
                <div className="re-hero__art" aria-hidden="true">
                  <div className="re-building"><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
                  <div className="re-sun" />
                  <div className="re-art-caption"><FiMapPin /> Your next closing starts here</div>
                </div>
              </div>

              <div className="re-stats">
                <StatCard icon={FiHome} label="Total properties" value={stats.properties} note={`${stats.available} available now`} tone="blue" />
                <StatCard icon={FiUsers} label="Buyer inquiries" value={stats.buyers} note="Tracked in your CRM" tone="violet" />
                <StatCard icon={FiCalendar} label="Visits today" value={stats.visitsToday} note={`${stats.upcomingVisits} more scheduled`} tone="amber" />
                <StatCard icon={FiTrendingUp} label="Available portfolio" value={money(stats.inventoryValue)} note={`${stats.reserved} reserved listings`} tone="green" />
              </div>

              <div className="re-overview-grid">
                <section className="re-panel re-panel--wide">
                  <div className="re-panel__heading">
                    <div><span className="re-section-kicker">LISTINGS</span><h2>Featured properties</h2></div>
                    <Link className="re-text-link" to="/real-estate/properties">Explore portfolio <FiArrowUpRight /></Link>
                  </div>
                  <PropertyGrid properties={properties.slice(0, 3)} onEdit={openProperty} onDelete={removeProperty} emptyAction={() => openProperty()} />
                </section>
                <section className="re-panel">
                  <div className="re-panel__heading">
                    <div><span className="re-section-kicker">ON THE CALENDAR</span><h2>Upcoming site visits</h2></div>
                    <Link className="re-icon-link" to="/real-estate/site-visits" aria-label="View all site visits"><FiChevronRight /></Link>
                  </div>
                  <VisitList visits={filteredVisits.slice(0, 4)} emptyAction={() => setVisitModal(true)} />
                </section>
              </div>
            </section>
          )}

          {section === 'properties' && (
            <section className="re-panel re-listing-page">
              <div className="re-toolbar">
                <label className="re-search"><FiSearch /><input type="search" placeholder="Search property, location or code" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
                <span className="re-result-count">{filteredProperties.length} listings</span>
              </div>
              <PropertyGrid properties={filteredProperties} onEdit={openProperty} onDelete={removeProperty} emptyAction={() => openProperty()} />
            </section>
          )}

          {section === 'buyers' && (
            <section className="re-panel">
              <div className="re-toolbar">
                <label className="re-search"><FiSearch /><input type="search" placeholder="Search buyers and inquiries" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
                <span className="re-result-count">{buyers.length} buyer leads</span>
              </div>
              {buyers.length ? (
                <div className="re-table-wrap">
                  <table className="re-table">
                    <thead><tr><th>Buyer</th><th>Contact</th><th>Source</th><th>Assigned agent</th><th>Lead stage</th><th>Next step</th></tr></thead>
                    <tbody>{buyers.map((buyer) => (
                      <tr key={buyer._id}>
                        <td><Link className="re-buyer-name" to={`/sales/leads/${buyer._id}`}>{buyer.name || 'Unnamed buyer'}</Link><small>{buyer.company || 'Private buyer'}</small></td>
                        <td><span>{buyer.email || '—'}</span><small>{buyer.phone || 'No phone'}</small></td>
                        <td><span className="re-source">{buyer.source || 'website'}</span></td>
                        <td>{buyer.assignedTo?.user?.name || buyer.assignedTo?.employeeId || 'Unassigned'}</td>
                        <td><select className={`re-status-select re-status-select--${buyer.status}`} value={buyer.status} onChange={(event) => updateBuyerStatus(buyer, event.target.value)} aria-label={`Update ${buyer.name} lead status`}>
                          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select></td>
                        <td><Link className="re-row-action" to={`/sales/leads/${buyer._id}`}>Open lead <FiArrowUpRight /></Link></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : <EmptyState icon={FiUsers} title="No buyer inquiries yet" description="Capture a buyer enquiry and track every conversation from first contact to closing." actionLabel="Add buyer lead" onAction={() => setBuyerModal(true)} />}
            </section>
          )}

          {section === 'site-visits' && (
            <section className="re-panel">
              <div className="re-toolbar">
                <div><span className="re-section-kicker">PROPERTY EXPERIENCES</span><h2 className="re-toolbar-title">Scheduled and completed visits</h2></div>
                <button className="re-button re-button--primary" onClick={() => setVisitModal(true)}><FiPlus /> Schedule visit</button>
              </div>
              {visits.length ? (
                <div className="re-table-wrap">
                  <table className="re-table">
                    <thead><tr><th>Date & time</th><th>Property</th><th>Buyer</th><th>Agent</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>{visits.map((visit) => (
                      <tr key={visit._id}>
                        <td>{dateTime(visit.visitDate)}</td>
                        <td><strong>{visit.property?.title || 'Property removed'}</strong><small>{visit.property?.city || ''}</small></td>
                        <td>{visit.buyer?.name || 'Buyer removed'}<small>{visit.buyer?.phone || visit.buyer?.email || ''}</small></td>
                        <td>{visit.assignedAgent?.user?.name || visit.assignedAgent?.employeeId || 'Unassigned'}</td>
                        <td><span className={`re-pill re-pill--${visit.status}`}>{visit.status}</span></td>
                        <td className="re-actions-cell">{visit.status === 'scheduled' && <><button className="re-small-action re-small-action--complete" onClick={() => updateVisitStatus(visit, 'completed')} title="Mark visit completed"><FiCheck /></button><button className="re-small-action re-small-action--cancel" onClick={() => updateVisitStatus(visit, 'cancelled')} title="Cancel visit"><FiX /></button></>}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : <EmptyState icon={FiMapPin} title="No site visits scheduled" description="Arrange a guided property visit and keep the buyer, listing, and agent in sync." actionLabel="Schedule a visit" onAction={() => setVisitModal(true)} />}
            </section>
          )}

          {section === 'offers' && (
            <div className="re-deal-sections">
              <section className="re-panel">
                <div className="re-panel__heading">
                  <div><span className="re-section-kicker">NEGOTIATIONS</span><h2>Buyer offers</h2></div>
                  <button className="re-button re-button--primary" onClick={() => setOfferModal(true)}><FiPlus /> Record offer</button>
                </div>
                {offers.length ? (
                  <div className="re-table-wrap"><table className="re-table">
                    <thead><tr><th>Property</th><th>Buyer</th><th>Asking price</th><th>Offer / counter</th><th>Status</th><th>Decision</th></tr></thead>
                    <tbody>{offers.map((offer) => (
                      <tr key={offer._id}>
                        <td><strong>{offer.property?.title || 'Property removed'}</strong><small>{offer.property?.city || ''}</small></td>
                        <td>{offer.buyer?.name || 'Buyer removed'}<small>{offer.buyer?.phone || offer.buyer?.email || ''}</small></td>
                        <td>{money(offer.property?.price)}</td>
                        <td><strong>{money(offer.counterAmount || offer.offerAmount)}</strong>{offer.counterAmount && <small>Buyer offered {money(offer.offerAmount)}</small>}</td>
                        <td><span className={`re-pill re-pill--${offer.status}`}>{offer.status}</span></td>
                        <td className="re-actions-cell">{['submitted', 'countered'].includes(offer.status) && <>
                          <button className="re-small-action re-small-action--complete" onClick={() => updateOffer(offer, 'accepted')} title="Accept offer"><FiCheck /></button>
                          <button className="re-small-action" onClick={() => updateOffer(offer, 'countered')} title="Make counter-offer"><FiEdit2 /></button>
                          <button className="re-small-action re-small-action--cancel" onClick={() => updateOffer(offer, 'rejected')} title="Reject offer"><FiX /></button>
                        </>}</td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                ) : <EmptyState icon={FiTrendingUp} title="No offers yet" description="Record buyer offers and keep counter-offers, decisions, and next steps tied to the listing." actionLabel="Record first offer" onAction={() => setOfferModal(true)} />}
              </section>
              <section className="re-panel">
                <div className="re-panel__heading"><div><span className="re-section-kicker">RESERVATIONS</span><h2>Bookings</h2></div></div>
                {bookings.length ? (
                  <div className="re-table-wrap"><table className="re-table">
                    <thead><tr><th>Property</th><th>Buyer</th><th>Agreed amount</th><th>Booked on</th><th>Status</th><th>Update</th></tr></thead>
                    <tbody>{bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td><strong>{booking.property?.title || 'Property removed'}</strong><small>{booking.property?.propertyCode || ''}</small></td>
                        <td>{booking.buyer?.name || 'Buyer removed'}<small>{booking.buyer?.phone || ''}</small></td>
                        <td>{money(booking.bookingAmount)}</td>
                        <td>{new Date(booking.bookingDate).toLocaleDateString('en-IN')}</td>
                        <td><span className={`re-pill re-pill--${booking.status}`}>{booking.status}</span></td>
                        <td>{booking.status === 'reserved' && <button className="re-row-action" onClick={() => updateBooking(booking, 'confirmed')}>Confirm</button>}{booking.status === 'confirmed' && <button className="re-row-action" onClick={() => updateBooking(booking, 'completed')}>Complete</button>}{['reserved', 'confirmed'].includes(booking.status) && <button className="re-row-action re-row-action--danger" onClick={() => updateBooking(booking, 'cancelled')}>Cancel</button>}</td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                ) : <EmptyState icon={FiHome} title="No active bookings" description="When an offer is accepted, the property is reserved and its booking appears here." actionLabel="Review offers" onAction={() => setOfferModal(true)} />}
              </section>
            </div>
          )}
        </>
      )}

      {propertyModal !== null && (
        <Dialog title={propertyModal?._id ? 'Edit property listing' : 'Add a property'} onClose={() => setPropertyModal(null)}>
          <form className="re-form" onSubmit={saveProperty}>
            <div className="re-form-grid">
              <Field label="Listing title" required><input required maxLength="160" value={propertyForm.title} onChange={(e) => setPropertyForm({ ...propertyForm, title: e.target.value })} placeholder="e.g. Sunlit 3 BHK residence" /></Field>
              <Field label="Property code"><input value={propertyForm.propertyCode} onChange={(e) => setPropertyForm({ ...propertyForm, propertyCode: e.target.value })} placeholder="Auto or enter a unique code" /></Field>
              <Field label="Property type"><select value={propertyForm.propertyType} onChange={(e) => setPropertyForm({ ...propertyForm, propertyType: e.target.value })}>{['apartment', 'house', 'villa', 'plot', 'commercial', 'office', 'other'].map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</select></Field>
              <Field label="For"><select value={propertyForm.listingType} onChange={(e) => setPropertyForm({ ...propertyForm, listingType: e.target.value })}><option value="sale">Sale</option><option value="rent">Rent</option></select></Field>
              <Field label="Price (INR)" required><input required min="0" type="number" value={propertyForm.price} onChange={(e) => setPropertyForm({ ...propertyForm, price: e.target.value })} placeholder="12500000" /></Field>
              <Field label="Listing status"><select value={propertyForm.status} onChange={(e) => setPropertyForm({ ...propertyForm, status: e.target.value })}>{['available', 'reserved', 'sold', 'rented'].map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></Field>
              <Field label="Bedrooms"><input min="0" type="number" value={propertyForm.bedrooms} onChange={(e) => setPropertyForm({ ...propertyForm, bedrooms: e.target.value })} /></Field>
              <Field label="Bathrooms"><input min="0" type="number" value={propertyForm.bathrooms} onChange={(e) => setPropertyForm({ ...propertyForm, bathrooms: e.target.value })} /></Field>
              <Field label="Area (sq. ft.)"><input min="0" type="number" value={propertyForm.areaSqft} onChange={(e) => setPropertyForm({ ...propertyForm, areaSqft: e.target.value })} /></Field>
              <Field label="City" required><input required value={propertyForm.city} onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })} placeholder="City" /></Field>
              <Field label="Address" required wide><input required value={propertyForm.address} onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })} placeholder="Street, neighbourhood, landmark" /></Field>
              <Field label="Listing agent" wide><select value={propertyForm.assignedAgent} onChange={(e) => setPropertyForm({ ...propertyForm, assignedAgent: e.target.value })}><option value="">Unassigned</option>{agents.map((agent) => <option key={agent._id} value={agent._id}>{agent.user?.name || agent.employeeId}</option>)}</select></Field>
              <Field label="Description" wide><textarea rows="3" value={propertyForm.description} onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })} placeholder="Describe the home's highlights, amenities, and nearby conveniences." /></Field>
            </div>
            <FormActions onCancel={() => setPropertyModal(null)} saving={saving} label={propertyModal?._id ? 'Save changes' : 'Add listing'} />
          </form>
        </Dialog>
      )}

      {buyerModal && (
        <Dialog title="Add a buyer inquiry" onClose={() => setBuyerModal(false)}>
          <form className="re-form" onSubmit={saveBuyer}>
            <p className="re-form-intro">This buyer will be saved as a Real Estate lead in your CRM pipeline.</p>
            <div className="re-form-grid">
              <Field label="Buyer name" required><input required value={buyerForm.name} onChange={(e) => setBuyerForm({ ...buyerForm, name: e.target.value })} placeholder="Full name" /></Field>
              <Field label="Phone number" required><input required value={buyerForm.phone} onChange={(e) => setBuyerForm({ ...buyerForm, phone: e.target.value })} placeholder="+91 ..." /></Field>
              <Field label="Email"><input type="email" value={buyerForm.email} onChange={(e) => setBuyerForm({ ...buyerForm, email: e.target.value })} placeholder="buyer@example.com" /></Field>
              <Field label="Company"><input value={buyerForm.company} onChange={(e) => setBuyerForm({ ...buyerForm, company: e.target.value })} placeholder="Optional" /></Field>
              <Field label="Lead source"><select value={buyerForm.source} onChange={(e) => setBuyerForm({ ...buyerForm, source: e.target.value })}>{['website', 'referral', 'social-media', 'email', 'phone', 'campaign', 'other'].map((source) => <option value={source} key={source}>{source.replace('-', ' ')}</option>)}</select></Field>
              <Field label="Assign agent"><select value={buyerForm.assignedTo} onChange={(e) => setBuyerForm({ ...buyerForm, assignedTo: e.target.value })}><option value="">Unassigned</option>{agents.map((agent) => <option key={agent._id} value={agent._id}>{agent.user?.name || agent.employeeId}</option>)}</select></Field>
            </div>
            <FormActions onCancel={() => setBuyerModal(false)} saving={saving} label="Save buyer lead" />
          </form>
        </Dialog>
      )}

      {visitModal && (
        <Dialog title="Schedule a site visit" onClose={() => setVisitModal(false)}>
          <form className="re-form" onSubmit={saveVisit}>
            <div className="re-form-grid">
              <Field label="Property" required wide><select required value={visitForm.property} onChange={(e) => setVisitForm({ ...visitForm, property: e.target.value })}><option value="">Choose a listing</option>{properties.filter((property) => !['sold', 'rented'].includes(property.status)).map((property) => <option key={property._id} value={property._id}>{property.title} — {property.city}</option>)}</select></Field>
              <Field label="Buyer lead" required wide><select required value={visitForm.buyer} onChange={(e) => setVisitForm({ ...visitForm, buyer: e.target.value })}><option value="">Choose a buyer</option>{buyers.map((buyer) => <option key={buyer._id} value={buyer._id}>{buyer.name} · {buyer.phone || buyer.email || 'No contact'}</option>)}</select></Field>
              <Field label="Visit date & time" required><input required type="datetime-local" min={new Date().toISOString().slice(0, 16)} value={visitForm.visitDate} onChange={(e) => setVisitForm({ ...visitForm, visitDate: e.target.value })} /></Field>
              <Field label="Touring agent"><select value={visitForm.assignedAgent} onChange={(e) => setVisitForm({ ...visitForm, assignedAgent: e.target.value })}><option value="">Unassigned</option>{agents.map((agent) => <option key={agent._id} value={agent._id}>{agent.user?.name || agent.employeeId}</option>)}</select></Field>
              <Field label="Visit notes" wide><textarea rows="3" value={visitForm.notes} onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })} placeholder="Meeting point, buyer preferences, or preparation notes." /></Field>
            </div>
            <FormActions onCancel={() => setVisitModal(false)} saving={saving} label="Schedule site visit" />
          </form>
        </Dialog>
      )}

      {offerModal && (
        <Dialog title="Record a buyer offer" onClose={() => setOfferModal(false)}>
          <form className="re-form" onSubmit={saveOffer}>
            <div className="re-form-grid">
              <Field label="Available property" required wide><select required value={offerForm.property} onChange={(e) => setOfferForm({ ...offerForm, property: e.target.value })}><option value="">Choose a listing</option>{properties.filter((property) => property.status === 'available').map((property) => <option key={property._id} value={property._id}>{property.title} · {money(property.price)}</option>)}</select></Field>
              <Field label="Buyer lead" required wide><select required value={offerForm.buyer} onChange={(e) => setOfferForm({ ...offerForm, buyer: e.target.value })}><option value="">Choose a buyer</option>{buyers.map((buyer) => <option key={buyer._id} value={buyer._id}>{buyer.name} · {buyer.phone || buyer.email || 'No contact'}</option>)}</select></Field>
              <Field label="Offer amount (INR)" required wide><input required min="1" type="number" value={offerForm.offerAmount} onChange={(e) => setOfferForm({ ...offerForm, offerAmount: e.target.value })} /></Field>
              <Field label="Notes" wide><textarea rows="3" value={offerForm.notes} onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })} placeholder="Terms, contingencies, or buyer timeline." /></Field>
            </div>
            <FormActions onCancel={() => setOfferModal(false)} saving={saving} label="Save offer" />
          </form>
        </Dialog>
      )}
    </main>
  );
};

const StatCard = ({ icon: Icon, label, value, note, tone }) => (
  <article className="re-stat-card">
    <div className={`re-stat-icon re-stat-icon--${tone}`}>{createElement(Icon)}</div>
    <div className="re-stat-copy"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
  </article>
);

const PropertyGrid = ({ properties, onEdit, onDelete, emptyAction }) => properties.length ? (
  <div className="re-property-grid">{properties.map((property) => (
    <article className="re-property-card" key={property._id}>
      <Link className={`re-property-cover re-property-cover--${property.propertyType}`} to={`/real-estate/properties/${property._id}`} aria-label={`View ${property.title}`}>
        {property.photos?.[0]?.url
          ? <img className="re-property-cover-image" src={getRealEstateMediaUrl(property.photos[0].url)} alt="" />
          : <div className="re-property-illustration" aria-hidden="true"><div className="re-illustration-building"><i /><i /><i /><i /><i /><i /></div></div>}
        <span className={`re-pill re-pill--${property.status}`}>{property.status}</span>
        <span className="re-property-type">{property.propertyType}</span>
        <span className="re-cover-code">{property.propertyCode || 'LISTING'}</span>
      </Link>
      <div className="re-property-body">
        <div className="re-property-price">{money(property.price)} <span>/{property.listingType}</span></div>
        <h3><Link to={`/real-estate/properties/${property._id}`}>{property.title}</Link></h3>
        <p className="re-property-location"><FiMapPin /> {property.address}, {property.city}</p>
        <div className="re-property-features">
          {property.bedrooms > 0 && <span>{property.bedrooms} beds</span>}
          {property.bathrooms > 0 && <span>{property.bathrooms} baths</span>}
          {property.areaSqft > 0 && <span>{Number(property.areaSqft).toLocaleString()} sq. ft.</span>}
        </div>
        <div className="re-property-footer">
          <span>{property.assignedAgent?.user?.name || 'Agent unassigned'}</span>
          <div><Link to={`/real-estate/properties/${property._id}`} className="re-property-view-link">Details</Link><button onClick={() => onEdit(property)} title="Edit listing" aria-label={`Edit ${property.title}`}><FiEdit2 /></button><button className="re-delete-action" onClick={() => onDelete(property)} title="Remove listing" aria-label={`Remove ${property.title}`}><FiTrash2 /></button></div>
        </div>
      </div>
    </article>
  ))}</div>
) : <EmptyState icon={FiHome} title="Your portfolio starts here" description="Add a property to showcase listings, pricing, location details, and availability in one place." actionLabel="Add first property" onAction={emptyAction} />;

const VisitList = ({ visits, emptyAction }) => visits.length ? (
  <div className="re-visit-list">{visits.map((visit) => (
    <article className="re-visit-item" key={visit._id}>
      <div className="re-visit-date"><strong>{new Date(visit.visitDate).toLocaleDateString('en-IN', { day: '2-digit' })}</strong><span>{new Date(visit.visitDate).toLocaleDateString('en-IN', { month: 'short' })}</span></div>
      <div className="re-visit-copy"><strong>{visit.property?.title || 'Property visit'}</strong><span>{visit.buyer?.name || 'Buyer'} · {new Date(visit.visitDate).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</span></div>
      <FiChevronRight className="re-visit-arrow" />
    </article>
  ))}</div>
) : <div className="re-mini-empty"><FiCalendar /><p>No visits on the calendar yet.</p><button className="re-text-link" onClick={emptyAction}>Schedule the first <FiArrowUpRight /></button></div>;

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="re-empty-state"><div className="re-empty-icon">{createElement(Icon)}</div><h3>{title}</h3><p>{description}</p><button className="re-button re-button--primary" onClick={onAction}><FiPlus /> {actionLabel}</button></div>
);

const Dialog = ({ title, onClose, children }) => (
  <div className="re-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="re-dialog" role="dialog" aria-modal="true" aria-labelledby="re-dialog-title">
      <header><h2 id="re-dialog-title">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog"><FiX /></button></header>
      {children}
    </section>
  </div>
);

const Field = ({ label, required, wide, children }) => (
  <label className={`re-field ${wide ? 're-field--wide' : ''}`}><span>{label}{required && <b> *</b>}</span>{children}</label>
);

const FormActions = ({ onCancel, saving, label }) => (
  <div className="re-form-actions"><button type="button" className="re-button re-button--neutral" onClick={onCancel} disabled={saving}>Cancel</button><button type="submit" className="re-button re-button--primary" disabled={saving}>{saving ? 'Saving…' : label}</button></div>
);

export default RealEstateDashboard;
