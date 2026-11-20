import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiArrowLeft, FiArrowUpRight, FiFileText, FiHome, FiMapPin, FiPlus, FiTrash2, FiUpload,
} from 'react-icons/fi';
import { getRealEstateMediaUrl, realEstateService } from '../../services/realEstateService';
import Loader from '../../components/common/Loader';
import './RealEstateDashboard.css';

const formatPrice = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(Number(amount) || 0);

const RealEstatePropertyDetail = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchProperty = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await realEstateService.getProperty(id);
      setProperty(response.data.data);
    } catch (fetchError) {
      console.error('Unable to load property details:', fetchError);
      setError(fetchError.response?.data?.message || 'Could not load this property.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProperty(); }, [fetchProperty]);

  const uploadPhotos = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    if (files.length + (property.photos?.length || 0) > 20) {
      setError('A property can have up to 20 photos.');
      return;
    }
    setUploading(true);
    try {
      await realEstateService.uploadPropertyPhotos(id, files);
      setNotice(`${files.length} photo${files.length === 1 ? '' : 's'} uploaded.`);
      await fetchProperty();
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || 'Could not upload property photos.');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photo) => {
    if (!window.confirm('Remove this property photo?')) return;
    try {
      await realEstateService.deletePropertyPhoto(id, photo._id);
      setNotice('Photo removed.');
      await fetchProperty();
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Could not remove this photo.');
    }
  };

  const uploadDocument = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      await realEstateService.uploadPropertyDocument(id, file, file.name);
      setNotice('Property document uploaded.');
      await fetchProperty();
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || 'Could not upload the document.');
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (document) => {
    if (!window.confirm(`Remove "${document.name}"?`)) return;
    try {
      await realEstateService.deletePropertyDocument(id, document._id);
      setNotice('Document removed.');
      await fetchProperty();
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Could not remove this document.');
    }
  };

  if (loading) return <main className="re-page"><div className="re-loading"><Loader /></div></main>;
  if (error && !property) {
    return <main className="re-page"><div className="re-alert re-alert--error" role="alert">{error}</div><Link className="re-button re-button--neutral" to="/real-estate/properties"><FiArrowLeft /> Back to properties</Link></main>;
  }
  if (!property) return null;

  return (
    <main className="re-page">
      <header className="re-header re-detail-header">
        <div className="re-header__copy">
          <Link className="re-back-link" to="/real-estate/properties"><FiArrowLeft /> Property portfolio</Link>
          <span className="re-eyebrow"><FiHome /> {property.propertyCode || property.propertyType}</span>
          <h1>{property.title}</h1>
          <p><FiMapPin /> {property.address}, {property.city}</p>
        </div>
        <div className="re-detail-price"><span>{property.status}</span><strong>{formatPrice(property.price)}</strong><small>For {property.listingType}</small></div>
      </header>

      {notice && <div className="re-alert re-alert--success" role="status">{notice}</div>}
      {error && <div className="re-alert re-alert--error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}

      <section className="re-detail-layout">
        <div className="re-detail-main">
          <section className="re-panel">
            <div className="re-panel__heading">
              <div><span className="re-section-kicker">PROPERTY GALLERY</span><h2>Photos & first impressions</h2></div>
              <label className={`re-button re-button--primary re-upload-button ${uploading ? 'is-disabled' : ''}`}>
                <FiUpload /> {uploading ? 'Uploading…' : 'Upload photos'}
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} onChange={uploadPhotos} />
              </label>
            </div>
            {property.photos?.length ? (
              <div className="re-gallery">
                {property.photos.map((photo, index) => (
                  <figure key={photo._id || photo.filename}>
                    <img src={getRealEstateMediaUrl(photo.url)} alt={`${property.title} photo ${index + 1}`} />
                    <button onClick={() => deletePhoto(photo)} title="Remove photo" aria-label={`Remove photo ${index + 1}`}><FiTrash2 /></button>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="re-gallery-empty"><FiHome /><strong>Show buyers what makes it special</strong><span>Upload up to 20 JPG, PNG, or WebP photos.</span></div>
            )}
          </section>

          <section className="re-panel">
            <div className="re-panel__heading"><div><span className="re-section-kicker">PROPERTY STORY</span><h2>About this listing</h2></div></div>
            <p className="re-description">{property.description || 'Add a thoughtful description of the property, its highlights, and the neighbourhood.'}</p>
            <div className="re-detail-facts">
              <Fact label="Property type" value={property.propertyType} />
              <Fact label="Listing status" value={property.status} />
              <Fact label="Bedrooms" value={property.bedrooms || '—'} />
              <Fact label="Bathrooms" value={property.bathrooms || '—'} />
              <Fact label="Area" value={property.areaSqft ? `${Number(property.areaSqft).toLocaleString()} sq. ft.` : '—'} />
              <Fact label="Listing agent" value={property.assignedAgent?.user?.name || 'Unassigned'} />
            </div>
          </section>

          <section className="re-panel">
            <div className="re-panel__heading">
              <div><span className="re-section-kicker">DUE DILIGENCE</span><h2>Property documents</h2></div>
              <label className={`re-button re-button--neutral re-upload-button ${uploading ? 'is-disabled' : ''}`}>
                <FiPlus /> Add document
                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" disabled={uploading} onChange={uploadDocument} />
              </label>
            </div>
            {property.documents?.length ? (
              <div className="re-doc-list">
                {property.documents.map((document) => (
                  <article key={document._id || document.filename}>
                    <span className="re-doc-icon"><FiFileText /></span>
                    <div><strong>{document.name}</strong><small>Added {new Date(document.uploadedAt).toLocaleDateString('en-IN')}</small></div>
                    <a href={getRealEstateMediaUrl(document.url)} target="_blank" rel="noreferrer" aria-label={`Open ${document.name}`}><FiArrowUpRight /></a>
                    <button onClick={() => deleteDocument(document)} aria-label={`Remove ${document.name}`}><FiTrash2 /></button>
                  </article>
                ))}
              </div>
            ) : <div className="re-doc-empty">Store ownership papers, floor plans, agreements, and other listing documents here.</div>}
          </section>
        </div>

        <aside className="re-detail-side">
          <section className="re-panel">
            <span className="re-section-kicker">ACTIVITY</span>
            <h2 className="re-side-title">Buyer interest</h2>
            <div className="re-side-metric"><strong>{property.offerCount || 0}</strong><span>offers received</span></div>
            <div className="re-side-metric"><strong>{property.visits?.length || 0}</strong><span>site visits on record</span></div>
            <Link className="re-button re-button--primary re-side-button" to="/real-estate/offers">View offers & bookings <FiArrowUpRight /></Link>
          </section>
          <section className="re-panel">
            <span className="re-section-kicker">SITE VISITS</span>
            <h2 className="re-side-title">Recent interest</h2>
            {property.visits?.length ? property.visits.slice(0, 5).map((visit) => (
              <div className="re-detail-visit" key={visit._id}>
                <strong>{visit.buyer?.name || 'Buyer'}</strong>
                <span>{new Date(visit.visitDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                <small>{visit.status}</small>
              </div>
            )) : <p className="re-doc-empty">No visits recorded for this listing yet.</p>}
            <Link className="re-text-link" to="/real-estate/site-visits">Open visit calendar <FiArrowUpRight /></Link>
          </section>
        </aside>
      </section>
    </main>
  );
};

const Fact = ({ label, value }) => <div><span>{label}</span><strong>{value}</strong></div>;

export default RealEstatePropertyDetail;
