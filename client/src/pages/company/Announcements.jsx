import { useState, useEffect, useCallback } from 'react';
import {
  FiBell,
  FiPlus,
  FiHeart,
  FiMessageSquare,
  FiTrash2,
  FiBookmark,
  FiSearch,
} from 'react-icons/fi';
import { announcementService } from '../../services/announcementService';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/format';
import './Announcements.css';

const categories = [
  { id: 'all', label: 'All Notices' },
  { id: 'urgent', label: '🚨 Urgent' },
  { id: 'celebration', label: '🎉 Celebrations' },
  { id: 'holiday', label: '🌴 Holidays' },
  { id: 'event', label: '📅 Events' },
  { id: 'policy', label: '📜 Policies' },
  { id: 'general', label: '📢 General' },
];

const Announcements = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const canBroadcast = isAdmin || isSuperAdmin || user?.role?.slug === 'hr_manager';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');

  // Expand comments map: { [announcementId]: boolean }
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  // Broadcast Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'normal',
    pinned: false,
    department: 'All',
  });

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (search.trim()) params.search = search.trim();

      const res = await announcementService.getAnnouncements(params);
      if (res.data?.success) {
        setAnnouncements(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError(err.response?.data?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Handle Like
  const handleLike = async (id) => {
    try {
      const res = await announcementService.toggleLike(id);
      if (res.data?.success) {
        setAnnouncements((prev) =>
          prev.map((a) =>
            a._id === id
              ? { ...a, hasLiked: res.data.liked, likesCount: res.data.likesCount }
              : a
          )
        );
      }
    } catch (err) {
      console.error('Like toggle error:', err);
    }
  };

  // Toggle comments expand
  const toggleComments = (id) => {
    setExpandedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Handle comment input
  const handleCommentChange = (id, val) => {
    setCommentInputs((prev) => ({ ...prev, [id]: val }));
  };

  // Post comment
  const handlePostComment = async (id) => {
    const text = commentInputs[id] || '';
    if (!text.trim()) return;

    try {
      const res = await announcementService.addComment(id, text.trim());
      if (res.data?.success) {
        setAnnouncements((prev) =>
          prev.map((a) =>
            a._id === id
              ? { ...a, comments: res.data.data, commentsCount: res.data.data.length }
              : a
          )
        );
        setCommentInputs((prev) => ({ ...prev, [id]: '' }));
      }
    } catch (err) {
      console.error('Post comment error:', err);
      alert(err.response?.data?.message || 'Failed to post comment');
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await announcementService.deleteAnnouncement(id);
      if (res.data?.success) {
        setAnnouncements((prev) => prev.filter((a) => a._id !== id));
        setSuccessMsg('Announcement deleted successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete announcement');
    }
  };

  // Submit Broadcast Form
  const handleSubmitBroadcast = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;

    try {
      setSaving(true);
      const res = await announcementService.createAnnouncement(form);
      if (res.data?.success) {
        setSuccessMsg('Notice broadcasted to team successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
        setModalOpen(false);
        setForm({
          title: '',
          content: '',
          category: 'general',
          priority: 'normal',
          pinned: false,
          department: 'All',
        });
        fetchAnnouncements();
      }
    } catch (err) {
      console.error('Broadcast error:', err);
      alert(err.response?.data?.message || 'Failed to broadcast announcement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="announcements-page">
      {/* Header */}
      <div className="announcements-header">
        <div>
          <h1 className="announcements-title">Company Notice Board &amp; Townhall</h1>
          <p className="announcements-desc">
            Official announcements, company celebrations, policies &amp; holiday broadcasts.
          </p>
        </div>

        {canBroadcast && (
          <button className="btn-broadcast" onClick={() => setModalOpen(true)}>
            <FiPlus /> Broadcast Notice
          </button>
        )}
      </div>

      {/* Success / Error notification */}
      {successMsg && (
        <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: '8px' }}>
          ✓ {successMsg}
        </div>
      )}
      {error && (
        <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px' }}>
          ✕ {error}
        </div>
      )}

      {/* Category Filter Chips & Search Bar */}
      <div className="announcements-filters">
        <div className="announcements-categories">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`cat-chip ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 0.75rem', width: '220px' }}>
          <FiSearch color="#64748b" />
          <input
            type="text"
            placeholder="Search notices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Announcements Stream */}
      {loading ? (
        <Loader message="Loading notice board..." />
      ) : announcements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '12px' }}>
          <FiBell style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '0.75rem' }} />
          <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary, #0f172a)' }}>No announcements yet</div>
          <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.88rem' }}>Check back later or broadcast a new notice to the entire team.</p>
        </div>
      ) : (
        <div className="announcements-feed">
          {announcements.map((item) => {
            const authorName = item.author?.name || 'Company Admin';
            const initials = authorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
            const isCommentsOpen = !!expandedComments[item._id];

            return (
              <div
                key={item._id}
                className={`announcement-card ${item.pinned ? 'pinned' : ''}`}
              >
                <div className="announcement-top">
                  <div className="announcement-author-info">
                    <div className="announcement-author-avatar">{initials}</div>
                    <div>
                      <div className="announcement-author-name">{authorName}</div>
                      <div className="announcement-meta">
                        <span>{formatDate(item.createdAt)}</span>
                        {item.department && item.department !== 'All' && (
                          <span>• {item.department}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="announcement-badges">
                    {item.pinned && (
                      <span className="badge-pin">
                        <FiBookmark /> Pinned
                      </span>
                    )}
                    <span className={`badge-category ${item.category}`}>
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="announcement-title">{item.title}</div>
                <div className="announcement-body">{item.content}</div>

                {/* Footer Actions: Like, Comment, Delete */}
                <div className="announcement-actions">
                  <button
                    className={`action-btn-like ${item.hasLiked ? 'liked' : ''}`}
                    onClick={() => handleLike(item._id)}
                  >
                    <FiHeart style={{ fill: item.hasLiked ? '#ef4444' : 'none' }} />
                    <span>{item.likesCount || 0} {item.likesCount === 1 ? 'Like' : 'Likes'}</span>
                  </button>

                  <button
                    className="action-btn-comment"
                    onClick={() => toggleComments(item._id)}
                  >
                    <FiMessageSquare />
                    <span>{item.commentsCount || 0} Comments</span>
                  </button>

                  {(canBroadcast || String(item.author?._id || item.author) === String(user?._id)) && (
                    <button
                      className="btn-delete-announcement"
                      title="Delete notice"
                      onClick={() => handleDelete(item._id)}
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>

                {/* Expandable Comments Section */}
                {isCommentsOpen && (
                  <div className="comments-section">
                    {(item.comments || []).map((c, idx) => (
                      <div key={c._id || idx} className="comment-item">
                        <span className="comment-user">{c.user?.name || 'Colleague'}:</span>
                        <span className="comment-text">{c.comment}</span>
                      </div>
                    ))}

                    <div className="comment-form">
                      <input
                        type="text"
                        className="comment-input"
                        placeholder="Write a warm reaction or comment..."
                        value={commentInputs[item._id] || ''}
                        onChange={(e) => handleCommentChange(item._id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handlePostComment(item._id);
                          }
                        }}
                      />
                      <button
                        className="btn-post-comment"
                        onClick={() => handlePostComment(item._id)}
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Broadcast Announcement to Team"
        >
          <form onSubmit={handleSubmitBroadcast}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Notice Title *
              </label>
              <input
                type="text"
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                placeholder="e.g. Diwali Holiday Announcement or Q4 Company Kickoff"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Category
                </label>
                <select
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#fff' }}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="general">📢 General Notice</option>
                  <option value="urgent">🚨 Urgent Alert</option>
                  <option value="celebration">🎉 Celebration / Welcome</option>
                  <option value="holiday">🌴 Holiday Announcement</option>
                  <option value="event">📅 Company Event</option>
                  <option value="policy">📜 HR Policy Update</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Priority
                </label>
                <select
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#fff' }}
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Content &amp; Details *
              </label>
              <textarea
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', minHeight: '120px' }}
                placeholder="Write the full announcement details here..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
              />
            </div>

            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input
                type="checkbox"
                id="pinNotice"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />
              <label htmlFor="pinNotice" style={{ fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer' }}>
                Pin this notice to top of the board
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                disabled={saving}
              >
                {saving ? 'Broadcasting...' : 'Publish Notice'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Announcements;
