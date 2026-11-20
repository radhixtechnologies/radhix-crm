const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  category: {
    type: String,
    enum: ['material', 'labor', 'equipment', 'subcontractor', 'other'],
    default: 'material',
  },
  unit: { type: String, required: true, trim: true, maxlength: 30 },
  quantity: { type: Number, required: true, min: 0 },
  unitCost: { type: Number, required: true, min: 0 },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'ConstructionVendor', default: null },
  status: { type: String, enum: ['planned', 'ordered', 'received', 'paid'], default: 'planned' },
  notes: { type: String, default: '', trim: true, maxlength: 1000 },
}, { timestamps: true });

const constructionProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  projectCode: { type: String, trim: true, uppercase: true, unique: true, sparse: true },
  projectType: { type: String, enum: ['residential', 'commercial', 'renovation', 'interior', 'infrastructure', 'other'], default: 'residential' },
  status: { type: String, enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'], default: 'planning', index: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  location: { type: String, required: true, trim: true, maxlength: 300 },
  description: { type: String, default: '', trim: true, maxlength: 4000 },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
  projectManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  startDate: { type: Date, default: null },
  dueDate: { type: Date, default: null },
  budget: { type: Number, default: 0, min: 0 },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  billItems: [billItemSchema],
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

constructionProjectSchema.index({ status: 1, dueDate: 1 });
constructionProjectSchema.index({ name: 'text', projectCode: 'text', location: 'text' });

module.exports = mongoose.model('ConstructionProject', constructionProjectSchema);
