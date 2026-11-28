import { useState, useEffect, useRef } from 'react';
import { FiBell, FiCheck, FiX, FiTrash2, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import './NotificationBell.css';

const playSubtleChime = () => {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
    } catch {
        // Ignore audio context block before user interaction
    }
};

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('crm_notif_sound') !== 'off');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const prevUnreadRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await notificationService.getNotifications({ limit: 10 });
            if (response.data.success) {
                const nextUnread = response.data.data.unreadCount || 0;
                const list = response.data.data.notifications || [];
                if (prevUnreadRef.current !== null && nextUnread > prevUnreadRef.current && soundEnabled) {
                    playSubtleChime();
                    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted' && list[0]) {
                        try {
                            new window.Notification(list[0].title || 'CRM Alert', { body: list[0].message || '' });
                        } catch {
                            // Ignore browser notification restrictions
                        }
                    }
                }
                prevUnreadRef.current = nextUnread;
                setNotifications(list);
                setUnreadCount(nextUnread);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            setLoading(true);
            await notificationService.markAllAsRead();
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await notificationService.deleteNotification(id);
            fetchNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        // Mark as read
        if (!notification.isRead) {
            handleMarkAsRead(notification._id);
        }

        // Navigate to action URL if available
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
            setIsOpen(false);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'reminder':
                return '⏰';
            case 'success':
                return '✅';
            case 'warning':
                return '⚠️';
            case 'error':
                return '❌';
            default:
                return '📢';
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diffMs = now - notifDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return notifDate.toLocaleDateString();
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button
                className="notification-bell-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <FiBell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    const next = !soundEnabled;
                                    setSoundEnabled(next);
                                    localStorage.setItem('crm_notif_sound', next ? 'on' : 'off');
                                    if (next && typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
                                        window.Notification.requestPermission().catch(() => {});
                                    }
                                    if (next) playSubtleChime();
                                }}
                                title={soundEnabled ? 'Mute notification chimes' : 'Enable notification chimes'}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: soundEnabled ? '#2563eb' : '#94a3b8',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '4px',
                                }}
                            >
                                {soundEnabled ? <FiVolume2 size={15} /> : <FiVolumeX size={15} />}
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    className="mark-all-read-btn"
                                    onClick={handleMarkAllAsRead}
                                    disabled={loading}
                                >
                                    <FiCheck size={14} />
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="notification-empty">
                                <FiBell size={48} />
                                <p>No notifications</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification._id}
                                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-icon">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-title">{notification.title}</div>
                                        <div className="notification-message">{notification.message}</div>
                                        <div className="notification-time">{formatTime(notification.createdAt)}</div>
                                    </div>
                                    <button
                                        className="notification-delete-btn"
                                        onClick={(e) => handleDelete(notification._id, e)}
                                        aria-label="Delete notification"
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="notification-footer">
                            <button
                                className="view-all-btn"
                                onClick={() => {
                                    navigate('/notifications');
                                    setIsOpen(false);
                                }}
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
