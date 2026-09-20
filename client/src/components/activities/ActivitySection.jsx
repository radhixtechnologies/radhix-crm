import { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiCheckCircle, FiPhone, FiMail, FiUsers, FiFileText, FiPlus, FiEdit2, FiRefreshCw, FiUserCheck, FiArrowRight } from 'react-icons/fi';
import { activityService } from '../../services/activityService';
import ActivityForm from './ActivityForm';
import './ActivitySection.css';

const ActivitySection = ({ relatedTo, activeTab = 'activities', leadNotes = [], refreshTrigger = 0 }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState('upcoming'); // upcoming, past, all

    useEffect(() => {
        fetchActivities();
    }, [relatedTo, filter, refreshTrigger]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const params = {
                relatedToEntity: relatedTo.entityType,
                relatedToId: relatedTo.entityId,
                limit: 50
            };

            const response = await activityService.getActivities(params);
            let allActivities = response.data.data.activities || [];

            // Filter based on selected view
            const now = new Date();
            if (filter === 'upcoming') {
                allActivities = allActivities.filter(a =>
                    a.scheduledAt && new Date(a.scheduledAt) >= now &&
                    ['scheduled', 'in-progress'].includes(a.status)
                );
            } else if (filter === 'past') {
                allActivities = allActivities.filter(a =>
                    a.status === 'completed' ||
                    (a.scheduledAt && new Date(a.scheduledAt) < now) ||
                    ['field-change', 'status-change', 'assignment'].includes(a.type)
                );
            }

            setActivities(allActivities);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (activityId) => {
        try {
            await activityService.updateActivity(activityId, {
                status: 'completed',
                completedAt: new Date()
            });
            fetchActivities();
        } catch (error) {
            console.error('Error completing activity:', error);
        }
    };

    const getActivityIcon = (type) => {
        const icons = {
            call: FiPhone,
            email: FiMail,
            meeting: FiUsers,
            task: FiCheckCircle,
            note: FiFileText,
            'field-change': FiEdit2,
            'status-change': FiRefreshCw,
            'assignment': FiUserCheck
        };
        return icons[type] || FiCalendar;
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (d.toDateString() === today.toDateString()) {
            return `Today at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        } else if (d.toDateString() === tomorrow.toDateString()) {
            return `Tomorrow at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        } else {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
    };

    const getUserName = (activity) => {
        if (activity.createdBy && typeof activity.createdBy === 'object') {
            return activity.createdBy.name || activity.createdBy.email || 'User';
        }
        if (activity.assignedTo && typeof activity.assignedTo === 'object') {
            if (activity.assignedTo.user && typeof activity.assignedTo.user === 'object') {
                return activity.assignedTo.user.name || activity.assignedTo.user.email || 'User';
            }
        }
        return 'System';
    };

    // Filter activities to get notes
    const activityNotes = activities.filter(a => a.type === 'note');
    const nonNoteActivities = activities.filter(a => a.type !== 'note');

    // Combine activity notes with lead notes
    const allNotes = [...activityNotes, ...leadNotes.map(note => ({
        _id: note._id || Math.random().toString(),
        type: 'note',
        subject: 'Lead Note',
        description: note.content,
        createdBy: note.addedBy,
        createdAt: note.addedAt
    }))];

    return (
        <div className="activity-section">
            {activeTab === 'activities' && (
                <div className="activity-header">
                    <button className="btn-schedule" onClick={() => setShowForm(true)}>
                        <FiPlus /> Schedule Activity
                    </button>
                </div>
            )}

            {activeTab === 'activities' && (
                <div className="activity-filters">
                    <button
                        className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setFilter('upcoming')}
                    >
                        Upcoming
                    </button>
                    <button
                        className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
                        onClick={() => setFilter('past')}
                    >
                        Past
                    </button>
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                </div>
            )}

            <div className="activity-list">
                {loading ? (
                    <div className="activity-loading">Loading {activeTab}...</div>
                ) : activeTab === 'activities' ? (
                    nonNoteActivities.length === 0 ? (
                        <div className="activity-empty">
                            <FiCalendar size={48} />
                            <p>No {filter} activities</p>
                            <button className="btn-schedule-empty" onClick={() => setShowForm(true)}>
                                Schedule First Activity
                            </button>
                        </div>
                    ) : (
                        nonNoteActivities.map(activity => {
                            const Icon = getActivityIcon(activity.type);
                            const isOverdue = activity.scheduledAt && new Date(activity.scheduledAt) < new Date() && activity.status === 'scheduled';

                            return (
                                <div key={activity._id} className={`activity-item ${activity.status} ${isOverdue ? 'overdue' : ''}`}>
                                    <div className="activity-icon">
                                        <Icon />
                                    </div>
                                    <div className="activity-content">
                                        <div className="activity-title">{activity.subject}</div>
                                        <div className="activity-meta">
                                            <span className="activity-type">{activity.type}</span>
                                            {(activity.scheduledAt || activity.completedAt || activity.createdAt) && (
                                                <>
                                                    <span className="activity-separator">•</span>
                                                    <FiClock size={12} />
                                                    <span className="activity-time">
                                                        {formatDate(activity.completedAt || activity.scheduledAt || activity.createdAt)}
                                                    </span>
                                                </>
                                            )}
                                            <span className="activity-separator">•</span>
                                            <span className="activity-user">by {getUserName(activity)}</span>
                                            {activity.priority && activity.priority !== 'medium' && (
                                                <>
                                                    <span className="activity-separator">•</span>
                                                    <span className={`activity-priority priority-${activity.priority}`}>
                                                        {activity.priority}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {activity.description && (
                                            <div className="activity-description">{activity.description}</div>
                                        )}
                                        {activity.changeDetails && (
                                            <div className="activity-change-details">
                                                <span className="change-old-value">{activity.changeDetails.oldValue}</span>
                                                <FiArrowRight size={14} className="change-arrow" />
                                                <span className="change-new-value">{activity.changeDetails.newValue}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="activity-actions">
                                        {activity.status === 'scheduled' && (
                                            <button
                                                className="btn-complete"
                                                onClick={() => handleComplete(activity._id)}
                                                title="Mark as complete"
                                            >
                                                <FiCheckCircle />
                                            </button>
                                        )}
                                        {activity.status === 'completed' && (
                                            <span className="status-badge completed">
                                                <FiCheckCircle size={14} /> Completed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )
                ) : (
                    // Notes Tab
                    allNotes.length === 0 ? (
                        <div className="activity-empty">
                            <FiFileText size={48} />
                            <p>No notes yet</p>
                            <p className="empty-subtitle">Add notes to keep track of important information</p>
                        </div>
                    ) : (
                        allNotes.map(note => (
                            <div key={note._id} className="note-item">
                                <div className="note-icon">
                                    <FiFileText />
                                </div>
                                <div className="note-content">
                                    <div className="note-text">{note.description || note.subject}</div>
                                    <div className="note-meta">
                                        <span className="note-user">{getUserName(note)}</span>
                                        <span className="activity-separator">•</span>
                                        <span className="note-date">{formatDate(note.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>

            <ActivityForm
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                onActivityCreated={() => {
                    setShowForm(false);
                    fetchActivities();
                }}
                relatedTo={relatedTo}
            />
        </div>
    );
};

export default ActivitySection;
