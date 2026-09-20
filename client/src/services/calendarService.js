import api from './api';

const getEvents = async (startDate, endDate) => {
    const params = { startDate, endDate };
    return await api.get('/calendar', { params });
};

const createEvent = async (eventData) => {
    return await api.post('/calendar', eventData);
};

const updateEvent = async (id, eventData) => {
    return await api.put(`/calendar/${id}`, eventData);
};

const deleteEvent = async (id) => {
    return await api.delete(`/calendar/${id}`);
};

export const calendarService = {
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent
};

