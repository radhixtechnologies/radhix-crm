import { useState, useEffect } from 'react';
import { FiPhone, FiMail, FiCalendar, FiCheckSquare, FiFileText, FiPlus, FiClock, FiUser } from 'react-icons/fi';
import { activityService } from '../../services/activityService';
import { formatDate } from '../../utils/format';
import Modal from '../common/Modal'; // Assuming Modal component exists, if not I'll just use a simplediv overlay or create one
import '../../styles/activities.css';

// Simple Modal Component if no common one exists
const SimpleModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

const ActivityTimeline = ({ entityType, entityId }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('note'); // Default type

    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        type: 'note',
        scheduledAt: '', // Date string
        duration: 30,
        outcome: ''
    });

    useEffect(() => {
        if (entityId) {
            fetchActivities();
        }
    }, [entityId, entityType]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const res = await activityService.getActivities({
                relatedToEntity: entityType,
                relatedToId: entityId,
                limit: 50
            });
            if (res.data.success) {
                setActivities(res.data.data.activities || []);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await activityService.createActivity({
                ...formData,
                relatedTo: {
                    entityType,
                    entityId
                }
            });
            setIsModalOpen(false);
            setFormData({ subject: '', description: '', type: 'note', scheduledAt: '', duration: 30, outcome: '' }); // Reset
            fetchActivities();
        } catch (error) {
            console.error("Error creating activity", error);
            alert("Failed to create activity");
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'call': return <FiPhone />;
            case 'email': return <FiMail />;
            case 'meeting': return <FiCalendar />;
            case 'task': return <FiCheckSquare />;
            default: return <FiFileText />;
        }
    };

    return (
        <div className="activity-section">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Activity Timeline</h3>
                <button className="btn btn-sm btn-outline-primary flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
                    <FiPlus /> Add Activity
                </button>
            </div>

            {loading ? (
                <div className="text-center py-4 text-secondary">Loading timeline...</div>
            ) : activities.length === 0 ? (
                <div className="text-center py-8 text-secondary bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    No activities recorded yet.
                </div>
            ) : (
                <div className="activity-timeline">
                    {activities.map(activity => (
                        <div key={activity._id} className="activity-card">
                            <div className={`activity-icon ${activity.type}`}>
                                {getIcon(activity.type)}
                            </div>
                            <div className="activity-header">
                                <span className="activity-title">{activity.subject}</span>
                                <span className="activity-time text-xs text-secondary">{formatDate(activity.createdAt)}</span>
                            </div>
                            <p className="activity-description">{activity.description}</p>
                            <div className="activity-footer">
                                <span className="flex items-center gap-1">
                                    <FiUser size={12} /> {activity.assignedTo?.user?.name || 'Unknown'}
                                </span>
                                <span className={`activity-status-badge status-${activity.status}`}>
                                    {activity.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Activity Modal */}
            <SimpleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Log Activity"
            >
                <form onSubmit={handleSubmit}>
                    <div className="activity-type-selector">
                        {['note', 'call', 'meeting', 'task', 'email'].map(type => (
                            <div
                                key={type}
                                className={`type-btn ${formData.type === type ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, type })}
                            >
                                {getIcon(type)} <span className="capitalize">{type}</span>
                            </div>
                        ))}
                    </div>

                    <div className="form-group mb-3">
                        <label className="block text-sm font-medium mb-1">Subject</label>
                        <input
                            type="text"
                            className="form-input w-full"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group mb-3">
                        <label className="block text-sm font-medium mb-1">Description/Notes</label>
                        <textarea
                            className="form-textarea w-full"
                            rows="3"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    {(formData.type === 'meeting' || formData.type === 'call' || formData.type === 'task') && (
                        <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Date & Time</label>
                                <input
                                    type="datetime-local"
                                    className="form-input w-full"
                                    value={formData.scheduledAt}
                                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Duration (min)</label>
                                <input
                                    type="number"
                                    className="form-input w-full"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Activity</button>
                    </div>
                </form>
            </SimpleModal>
        </div>
    );
};

export default ActivityTimeline;
