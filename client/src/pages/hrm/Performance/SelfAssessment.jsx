import { useEffect, useState } from 'react';
import { hrmService } from '../../../services/hrmService';
import '../../../styles/hrm/performance.css';

const SelfAssessment = ({ reviewId }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ strengths: '', weaknesses: '', achievements: '', rating: 3 });

  const submit = async () => {
    try {
      setSaving(true);
      await hrmService.submitSelfAssessment(reviewId, { selfReview: form });
      alert('Self assessment submitted');
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Self Assessment</h1>
      </div>
      {error && <div className="error-text">{error}</div>}
      <div className="form-grid">
        <div className="full">
          <label>Strengths</label>
          <textarea value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} />
        </div>
        <div className="full">
          <label>Weaknesses</label>
          <textarea value={form.weaknesses} onChange={(e) => setForm({ ...form, weaknesses: e.target.value })} />
        </div>
        <div className="full">
          <label>Achievements</label>
          <textarea value={form.achievements} onChange={(e) => setForm({ ...form, achievements: e.target.value })} />
        </div>
        <div>
          <label>Rating</label>
          <input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
        </div>
      </div>
      <button onClick={submit} disabled={saving}>{saving ? 'Submitting...' : 'Submit'}</button>
    </div>
  );
};

export default SelfAssessment;


