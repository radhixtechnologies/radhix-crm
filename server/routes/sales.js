const express = require('express');
const router = express.Router();
const { protect, checkModuleAccess } = require('../middlewares/auth');

// Lead controllers
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  assignLead,
  addNote,
  changeStatus,
  addCommunication,
  convertLead,
} = require('../controllers/sales/leadController');

// Lead Import controllers
const {
  downloadLeadTemplate,
  previewLeads,
  importLeads,
} = require('../controllers/sales/leadImportController');


// Client controllers
const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  addContact,
  addNote: addClientNote,
} = require('../controllers/sales/clientController');

// Deal controllers
const {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
  changeStage,
  addNote: addDealNote,
} = require('../controllers/sales/dealController');

// Proposal controllers
const {
  getProposals,
  getProposal,
  createProposal,
  updateProposal,
  downloadProposal,
  emailProposal,
  convertToInvoice,
  deleteProposal,
} = require('../controllers/sales/proposalController');

// Quotation controllers
const {
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  sendQuotation,
  deleteQuotation,
  generatePDF,
} = require('../controllers/sales/quotationController');

// Follow-up controllers
const {
  getFollowUps,
  getFollowUp,
  scheduleFollowUp,
  updateFollowUp,
  deleteFollowUp,
} = require('../controllers/sales/followupController');

// Dashboard controllers
const {
  getDashboardStats
} = require('../controllers/sales/dashboardController');

// Multer configuration for file uploads
const multer = require('multer');
const upload = multer({ dest: 'uploads/temp/' });

// Protect all routes - require authentication
router.use(protect);
// NOTE: Module access check removed from global - applied per route group below

// Lead Import routes - Must come BEFORE /leads/:id to avoid route conflicts
router.get('/leads/import/template', checkModuleAccess('sales'), downloadLeadTemplate);
router.post('/leads/import/preview', checkModuleAccess('sales'), upload.single('file'), previewLeads);
router.post('/leads/import', checkModuleAccess('sales'), upload.single('file'), importLeads);

// Lead routes - Accessible only to Sales module users
router.route('/leads')
  .get(checkModuleAccess('sales'), getLeads)
  .post(checkModuleAccess('sales'), createLead);

router.route('/leads/:id')
  .get(checkModuleAccess('sales'), getLead)
  .put(checkModuleAccess('sales'), updateLead)
  .delete(checkModuleAccess('sales'), deleteLead);

router.put('/leads/:id/assign', checkModuleAccess('sales'), assignLead);
router.post('/leads/:id/notes', checkModuleAccess('sales'), addNote);
router.put('/leads/:id/status', checkModuleAccess('sales'), changeStatus);
router.post('/leads/:id/communication', checkModuleAccess('sales'), addCommunication);
router.post('/leads/:id/convert', checkModuleAccess('sales'), convertLead);


// Client routes - Admin only
router.route('/clients')
  .get(checkModuleAccess('sales'), getClients)
  .post(checkModuleAccess('sales'), createClient);

router.route('/clients/:id')
  .get(checkModuleAccess('sales'), getClient)
  .put(checkModuleAccess('sales'), updateClient)
  .delete(checkModuleAccess('sales'), deleteClient);

router.post('/clients/:id/contacts', checkModuleAccess('sales'), addContact);
router.post('/clients/:id/notes', checkModuleAccess('sales'), addClientNote);

// Deal routes - Admin only
router.route('/deals')
  .get(checkModuleAccess('sales'), getDeals)
  .post(checkModuleAccess('sales'), createDeal);

router.route('/deals/:id')
  .get(checkModuleAccess('sales'), getDeal)
  .put(checkModuleAccess('sales'), updateDeal)
  .delete(checkModuleAccess('sales'), deleteDeal);


router.put('/deals/:id/stage', checkModuleAccess('sales'), changeStage);
router.patch('/deals/:id/stage', checkModuleAccess('sales'), changeStage);
router.post('/deals/:id/notes', checkModuleAccess('sales'), addDealNote);

// Proposal routes - Admin only
router.route('/proposals')
  .get(checkModuleAccess('sales'), getProposals)
  .post(checkModuleAccess('sales'), createProposal);

router.route('/proposals/:id')
  .get(checkModuleAccess('sales'), getProposal)
  .put(checkModuleAccess('sales'), updateProposal);

router.post('/proposals/:id/generate-pdf', checkModuleAccess('sales'), downloadProposal);
router.post('/proposals/:id/email', checkModuleAccess('sales'), emailProposal);
router.post('/proposals/:id/convert-to-invoice', checkModuleAccess('sales'), convertToInvoice);

// Quotation routes
router.route('/quotations')
  .get(checkModuleAccess('sales'), getQuotations)
  .post(checkModuleAccess('sales'), createQuotation);

router.route('/quotations/:id')
  .get(checkModuleAccess('sales'), getQuotation)
  .put(checkModuleAccess('sales'), updateQuotation)
  .delete(checkModuleAccess('sales'), deleteQuotation);

router.post('/quotations/:id/send', checkModuleAccess('sales'), sendQuotation);
router.post('/quotations/:id/generate-pdf', checkModuleAccess('sales'), generatePDF);

// Follow-up routes - Admin only
router.route('/followups')
  .get(checkModuleAccess('sales'), getFollowUps)
  .post(checkModuleAccess('sales'), scheduleFollowUp);

router.route('/followups/:id')
  .get(checkModuleAccess('sales'), getFollowUp)
  .put(checkModuleAccess('sales'), updateFollowUp)
  .delete(checkModuleAccess('sales'), deleteFollowUp);

// Dashboard Routes
router.get('/dashboard/stats', checkModuleAccess('sales'), getDashboardStats);

module.exports = router;
