const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, checkModuleAccess } = require('../middlewares/auth');
const controller = require('../controllers/realEstateController');

const router = express.Router();
const uploadDirectory = path.join(__dirname, '..', '..', 'uploads', 'real-estate');
fs.mkdirSync(uploadDirectory, { recursive: true });
const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${require('crypto').randomBytes(12).toString('hex')}${extension}`);
  },
});
const imageUpload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, callback) => {
    const allowed = new Map([
      ['image/jpeg', ['.jpg', '.jpeg']],
      ['image/png', ['.png']],
      ['image/webp', ['.webp']],
    ]);
    const extensions = allowed.get(file.mimetype);
    if (!extensions || !extensions.includes(path.extname(file.originalname).toLowerCase())) {
      return callback(new Error('Property photos must be JPG, PNG, or WebP images.'));
    }
    callback(null, true);
  },
});
const documentUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const allowed = new Map([
      ['application/pdf', ['.pdf']],
      ['application/msword', ['.doc']],
      ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', ['.docx']],
      ['application/vnd.ms-excel', ['.xls']],
      ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ['.xlsx']],
      ['image/jpeg', ['.jpg', '.jpeg']],
      ['image/png', ['.png']],
    ]);
    const extensions = allowed.get(file.mimetype);
    if (!extensions || !extensions.includes(path.extname(file.originalname).toLowerCase())) {
      return callback(new Error('Upload a PDF, Word, Excel, JPG, or PNG document.'));
    }
    callback(null, true);
  },
});
const handleUpload = (middleware) => (req, res, next) => {
  middleware(req, res, (error) => {
    if (error) {
      const status = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ success: false, message: error.message });
    }
    next();
  });
};
router.use(protect, checkModuleAccess('sales'));

router.get('/summary', controller.getSummary);
router.route('/properties')
  .get(controller.getProperties)
  .post(controller.createProperty);
router.get('/properties/:id', controller.getProperty);
router.post('/properties/:id/photos', handleUpload(imageUpload.array('photos', 10)), controller.addPropertyPhotos);
router.delete('/properties/:id/photos/:photoId', controller.deletePropertyPhoto);
router.post('/properties/:id/documents', handleUpload(documentUpload.single('document')), controller.addPropertyDocument);
router.delete('/properties/:id/documents/:documentId', controller.deletePropertyDocument);
router.route('/properties/:id')
  .put(controller.updateProperty)
  .delete(controller.deleteProperty);
router.route('/site-visits')
  .get(controller.getSiteVisits)
  .post(controller.createSiteVisit);
router.route('/site-visits/:id')
  .put(controller.updateSiteVisit)
  .delete(controller.deleteSiteVisit);
router.route('/offers')
  .get(controller.getOffers)
  .post(controller.createOffer);
router.put('/offers/:id', controller.updateOffer);
router.get('/bookings', controller.getBookings);
router.put('/bookings/:id', controller.updateBooking);

module.exports = router;
