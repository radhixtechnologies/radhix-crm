const express = require('express');
const router = express.Router();
const {
    getAllTickets,
    getTicketById,
    createTicket,
    updateTicket,
    deleteTicket,
    addMessage,
    getTicketMetrics
} = require('../controllers/ticketController');
const { protect, authorize, checkModuleAccess } = require('../middlewares/auth');

// Protect all routes
router.use(protect);

// Routes
router.route('/')
    .get(checkModuleAccess('support'), getAllTickets)
    .post(checkModuleAccess('support'), createTicket);

router.get('/metrics/overview', checkModuleAccess('support'), getTicketMetrics);

router.route('/:id')
    .get(checkModuleAccess('support'), getTicketById)
    .put(checkModuleAccess('support'), updateTicket)
    .delete(checkModuleAccess('support'), deleteTicket);

router.post('/:id/messages', checkModuleAccess('support'), addMessage);

module.exports = router;
