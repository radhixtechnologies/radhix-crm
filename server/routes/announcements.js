const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const announcementController = require('../controllers/announcementController');

router.use(protect);

router.get('/', announcementController.getAnnouncements);
router.post('/', announcementController.createAnnouncement);
router.post('/:id/like', announcementController.toggleLike);
router.post('/:id/comments', announcementController.addComment);
router.delete('/:id', announcementController.deleteAnnouncement);

module.exports = router;

