const mongoose = require('mongoose');

const fnfSettlementSchema = new mongoose.Schema({
    exitRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExitRequest',
        required: true,
        unique: true,
        index: true
    },

    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
        index: true
    },

    // Employment Details
    lastWorkingDay: {
        type: Date,
        required: true
    },
    workingDaysInMonth: {
        type: Number,
        required: true
    },
    workedDays: {
        type: Number,
        required: true
    },

    // Salary Components
    basicSalary: {
        type: Number,
        required: true,
        default: 0
    },
    hra: {
        type: Number,
        default: 0
    },
    allowances: {
        type: Number,
        default: 0
    },
    grossSalary: {
        type: Number,
        required: true,
        default: 0
    },

    // Credits
    salaryForWorkedDays: {
        type: Number,
        default: 0
    },

    leaveEncashment: {
        earnedLeaves: { type: Number, default: 0 },
        casualLeaves: { type: Number, default: 0 },
        sickLeaves: { type: Number, default: 0 },
        totalDays: { type: Number, default: 0 },
        perDayRate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 }
    },

    bonus: {
        type: Number,
        default: 0
    },
    gratuity: {
        type: Number,
        default: 0
    },
    otherCredits: [{
        description: String,
        amount: Number
    }],
    totalCredits: {
        type: Number,
        default: 0
    },

    // Deductions
    noticePeriodShortfall: {
        requiredDays: { type: Number, default: 0 },
        servedDays: { type: Number, default: 0 },
        shortfallDays: { type: Number, default: 0 },
        perDayRate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 }
    },

    assetDamageCharges: {
        type: Number,
        default: 0
    },

    advanceRecovery: {
        type: Number,
        default: 0
    },

    loanRecovery: {
        type: Number,
        default: 0
    },

    taxDeductions: {
        incomeTax: { type: Number, default: 0 },
        professionalTax: { type: Number, default: 0 }
    },

    otherDeductions: [{
        description: String,
        amount: Number
    }],
    totalDeductions: {
        type: Number,
        default: 0
    },

    // Final Amount
    netPayable: {
        type: Number,
        default: 0
    },

    // Processing Status
    status: {
        type: String,
        enum: ['draft', 'calculated', 'approved', 'processed', 'paid', 'rejected'],
        default: 'draft',
        index: true
    },

    // Approval Workflow
    calculatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    calculatedAt: Date,

    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvalDate: Date,
    approvalComments: String,

    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectionDate: Date,
    rejectionReason: String,

    // Payment Details
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processedDate: Date,
    paymentDate: Date,
    paymentMode: {
        type: String,
        enum: ['bank_transfer', 'cheque', 'cash', 'other']
    },
    paymentReference: String,

    // Metadata
    notes: String,
    attachments: [{
        filename: String,
        url: String,
        uploadedAt: Date
    }]
}, {
    timestamps: true
});

// Indexes
fnfSettlementSchema.index({ employee: 1 });
fnfSettlementSchema.index({ status: 1 });
fnfSettlementSchema.index({ paymentDate: 1 });

// Method to calculate total credits
fnfSettlementSchema.methods.calculateTotalCredits = function () {
    let total = 0;
    total += this.salaryForWorkedDays || 0;
    total += this.leaveEncashment.amount || 0;
    total += this.bonus || 0;
    total += this.gratuity || 0;

    if (this.otherCredits && this.otherCredits.length > 0) {
        total += this.otherCredits.reduce((sum, credit) => sum + (credit.amount || 0), 0);
    }

    this.totalCredits = total;
    return total;
};

// Method to calculate total deductions
fnfSettlementSchema.methods.calculateTotalDeductions = function () {
    let total = 0;
    total += this.noticePeriodShortfall.amount || 0;
    total += this.assetDamageCharges || 0;
    total += this.advanceRecovery || 0;
    total += this.loanRecovery || 0;
    total += this.taxDeductions.incomeTax || 0;
    total += this.taxDeductions.professionalTax || 0;

    if (this.otherDeductions && this.otherDeductions.length > 0) {
        total += this.otherDeductions.reduce((sum, deduction) => sum + (deduction.amount || 0), 0);
    }

    this.totalDeductions = total;
    return total;
};

// Method to calculate net payable
fnfSettlementSchema.methods.calculateNetPayable = function () {
    this.calculateTotalCredits();
    this.calculateTotalDeductions();
    this.netPayable = this.totalCredits - this.totalDeductions;
    return this.netPayable;
};

// Method to calculate salary for worked days
fnfSettlementSchema.methods.calculateSalaryForWorkedDays = function () {
    if (!this.workingDaysInMonth || !this.workedDays || !this.grossSalary) {
        return 0;
    }
    this.salaryForWorkedDays = (this.grossSalary / this.workingDaysInMonth) * this.workedDays;
    return this.salaryForWorkedDays;
};

module.exports = mongoose.model('FnFSettlement', fnfSettlementSchema);
