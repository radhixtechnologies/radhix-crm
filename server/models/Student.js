const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
  },
  email: {
    type: String,
    default: '',
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  address: {
    type: String,
    default: '',
    trim: true,
  },
  guardianName: {
    type: String,
    default: '',
    trim: true,
  },
  guardianPhone: {
    type: String,
    default: '',
    trim: true,
  },
  educationLevel: {
    type: String,
    default: '',
    trim: true,
  },
  enrolledCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Enrolled course is required'],
  },
  enrolledBatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Enrolled batch is required'],
  },
  inquiry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    default: null,
  },
  enrollmentDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['enrolled', 'active', 'completed', 'dropped'],
    default: 'enrolled',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

studentSchema.index({ enrolledCourse: 1 });
studentSchema.index({ enrolledBatch: 1 });
studentSchema.index({ inquiry: 1 }, { sparse: true });

module.exports = mongoose.model('Student', studentSchema);
