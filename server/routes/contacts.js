const express = require('express');
const router = express.Router();
const {
    getAllContacts,
    getContactById,
    createContact,
    updateContact,
    deleteContact,
    convertLeadToContact,
    addCommunication,
    addNote,
    getContactTimeline,
} = require('../controllers/contactController');
const { protect, authorize } = require('../middlewares/auth');

// Protect all routes
router.use(protect);

// Contact CRUD routes
router.route('/')
    .get(getAllContacts)
    .post(createContact);

router.route('/:id')
    .get(getContactById)
    .put(updateContact)
    .delete(authorize('admin', 'super_admin'), deleteContact);

// Lead conversion
router.post('/convert-lead/:leadId', convertLeadToContact);

// Communication and notes
router.post('/:id/communication', addCommunication);
router.post('/:id/notes', addNote);

// Timeline
router.get('/:id/timeline', getContactTimeline);

module.exports = router;
