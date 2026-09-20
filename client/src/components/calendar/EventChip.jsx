import React from 'react';
import { FiPhone, FiMail, FiUsers, FiCheckSquare, FiClock, FiCalendar, FiAlertCircle, FiBriefcase, FiSun } from 'react-icons/fi';
import dayjs from 'dayjs';
import './EventChip.css';

const EVENT_ICONS = {
    call: FiPhone,
    email: FiMail,
    meeting: FiUsers,
    task: FiCheckSquare,
    reminder: FiClock,
    interview: FiBriefcase,
    leave: FiSun,
    holiday: FiCalendar,
    announcement: FiAlertCircle,
};

const EventChip = ({ event }) => {
    const Icon = EVENT_ICONS[event.type] || FiCalendar;

    const getEventStyle = () => {
        const baseStyle = {
            background: event.color || getDefaultColor(event.type),
            borderLeft: event.priority === 'high' || event.priority === 'urgent'
                ? '3px solid #dc2626'
                : 'none',
        };

        // Completed events are muted
        if (event.status === 'completed') {
            baseStyle.opacity = 0.6;
            baseStyle.textDecoration = 'line-through';
        }

        // Cancelled events are grayed out
        if (event.status === 'cancelled') {
            baseStyle.background = '#9ca3af';
            baseStyle.opacity = 0.5;
        }

        return baseStyle;
    };

    const getDefaultColor = (type) => {
        const colors = {
            meeting: '#3b82f6',
            call: '#10b981',
            task: '#8b5cf6',
            leave: '#f59e0b',
            interview: '#ef4444',
            reminder: '#6b7280',
            email: '#06b6d4',
            demo: '#ec4899',
            holiday: '#14b8a6',
            announcement: '#f97316',
        };
        return colors[type] || '#6366f1';
    };

    const formatTime = (date) => {
        return dayjs(date).format('h:mm A');
    };

    return (
        <div className="event-chip" style={getEventStyle()} title={event.title}>
            <div className="event-chip-header">
                <Icon className="event-chip-icon" />
                {!event.allDay && (
                    <span className="event-chip-time">{formatTime(event.start)}</span>
                )}
                {event.priority === 'urgent' && (
                    <span className="event-chip-urgent">!</span>
                )}
            </div>
            <div className="event-chip-title">{event.title}</div>
            {event.extendedProps?.assignedTo && (
                <div className="event-chip-assigned">
                    {event.extendedProps.assignedTo}
                </div>
            )}
        </div>
    );
};

export default EventChip;
