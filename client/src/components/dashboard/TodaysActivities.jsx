import { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiCheckCircle, FiAlertCircle, FiPhone, FiMail, FiUsers, FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { activityService } from '../../services/activityService';
import './TodaysActivities.css';

const TodaysActivities = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, completed: 0, overdue: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        fetchTodaysActivities();
    }, []);

    const fetchTodaysActivities = async () => {
        try {
            setLoading(true);
            const response = await activityService.getActivities({ limit: 100 });
            const allActivities = response.data.data.activities || [];

            // Filter for today and upcoming
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todaysActivities = allActivities.filter(a => {
                if (!a.scheduledAt) return false;
                const activityDate = new Date(a.scheduledAt);
                return activityDate >= today && activityDate < tomorrow;
            });

            // Calculate stats
            const now = new Date();
            const completed = todaysActivities.filter(a => a.status === 'completed').length;
            const overdue = allActivities.filter(a =>
                a.scheduledAt &&
                new Date(a.scheduledAt) < now &&
                a.status === 'scheduled'
            ).length;

            setActivities(todaysActivities.slice(0, 5)); // Show top 5
            setStats({
                total: todaysActivities.length,
                completed,
                overdue
            });
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
            fetchTodaysActivities();
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
            note: FiFileText
        };
        return icons[type] || FiCalendar;
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="todays-activities-widget">
                <div className="widget-header">
                    <h3>Today's Activities</h3>
                </div>
                <div className="widget-loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="todays-activities-widget">
            <div className="widget-header">
                <div>
                    <h3>Today's Activities</h3>
                    <p className="widget-subtitle">Your schedule for today</p>
                </div>
                <button
                    className="view-all-btn"
                    onClick={() => navigate('/calendar')}
                >
                    View Calendar
                </button>
            </div>

            <div className="activity-stats">
                <div className="stat-card">
                    <div className="stat-icon total">
                        <FiCalendar />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon completed">
                        <FiCheckCircle />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.completed}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                </div>

                {stats.overdue > 0 && (
                    <div className="stat-card">
                        <div className="stat-icon overdue">
                            <FiAlertCircle />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.overdue}</div>
                            <div className="stat-label">Overdue</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="activity-timeline">
                {activities.length === 0 ? (
                    <div className="no-activities">
                        <FiCalendar size={40} />
                        <p>No activities scheduled for today</p>
                        <button
                            className="schedule-btn"
                            onClick={() => navigate('/calendar')}
                        >
                            Schedule Activity
                        </button>
                    </div>
                ) : (
                    activities.map(activity => {
                        const Icon = getActivityIcon(activity.type);
                        const isPast = new Date(activity.scheduledAt) < new Date();

                        return (
                            <div
                                key={activity._id}
                                className={`timeline-item ${activity.status} ${isPast && activity.status === 'scheduled' ? 'overdue' : ''}`}
                            >
                                <div className="timeline-time">
                                    <FiClock size={14} />
                                    {formatTime(activity.scheduledAt)}
                                </div>
                                <div className="timeline-icon">
                                    <Icon />
                                </div>
                                <div className="timeline-content">
                                    <div className="timeline-title">{activity.subject}</div>
                                    <div className="timeline-meta">
                                        <span className="activity-type">{activity.type}</span>
                                        {activity.relatedTo?.entityType && (
                                            <>
                                                <span className="separator">•</span>
                                                <span>{activity.relatedTo.entityType}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {activity.status === 'scheduled' && (
                                    <button
                                        className="complete-btn"
                                        onClick={() => handleComplete(activity._id)}
                                        title="Mark as complete"
                                    >
                                        <FiCheckCircle />
                                    </button>
                                )}
                                {activity.status === 'completed' && (
                                    <span className="completed-badge">
                                        <FiCheckCircle size={14} />
                                    </span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {activities.length > 0 && stats.total > 5 && (
                <div className="widget-footer">
                    <button
                        className="view-more-btn"
                        onClick={() => navigate('/calendar')}
                    >
                        View all {stats.total} activities →
                    </button>
                </div>
            )}
        </div>
    );
};

export default TodaysActivities;
