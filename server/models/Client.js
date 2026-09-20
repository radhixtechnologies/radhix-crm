const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: '',
  },
  company: {
    type: String,
    required: true,
  },
  industry: {
    type: String,
    default: '',
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'prospect'],
    default: 'active',
  },
  totalRevenue: {
    type: Number,
    default: 0,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  contacts: [
    {
      name: String,
      email: String,
      phone: String,
      designation: String,
      isPrimary: {
        type: Boolean,
        default: false,
      },
    },
  ],
  notes: [
    {
      content: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  documents: [
    {
      name: String,
      url: String,
      type: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],
  linkedDeals: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ═══════════════════════════════════════════════════════
// CASCADE DELETE PROTECTION
// ═══════════════════════════════════════════════════════
clientSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    const Deal = require('./Deal');
    
    // Check for active deals (not won or lost)
    const activeDeals = await Deal.countDocuments({
      client: this._id,
      status: 'open'
    });

    if (activeDeals > 0) {
      const error = new Error(
        `Cannot delete client "${this.name}". There are ${activeDeals} active deal(s) associated with this client. Please close or reassign the deals first.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Also check for any deals in general (won/lost/open)
    const totalDeals = await Deal.countDocuments({ client: this._id });
    
    if (totalDeals > 0) {
      console.log(`⚠️ Warning: Deleting client with ${totalDeals} historical deal(s)`);
      // Allow deletion but log warning for audit purposes
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Client', clientSchema);

