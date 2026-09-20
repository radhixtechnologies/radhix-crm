const mongoose = require('mongoose');

const exitInterviewSchema = new mongoose.Schema({
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

    // Interview Details
    interviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    interviewDate: {
        type: Date,
        required: true
    },
    interviewMode: {
        type: String,
        enum: ['in_person', 'virtual', 'phone', 'written'],
        default: 'in_person'
    },

    // Overall Ratings
    overallExperience: {
        type: Number,
        min: 1,
        max: 5
    },
    reasonForLeaving: {
        type: String,
        enum: [
            'better_opportunity',
            'higher_compensation',
            'career_growth',
            'relocation',
            'personal_reasons',
            'health_issues',
            'further_studies',
            'work_life_balance',
            'company_culture',
            'management_issues',
            'retirement',
            'other'
        ],
        required: true
    },
    wouldRecommend: {
        type: Boolean
    },
    wouldRejoin: {
        type: Boolean
    },

    // Detailed Feedback
    feedback: {
        workEnvironment: {
            rating: { type: Number, min: 1, max: 5 },
            comments: String
        },
        management: {
            rating: { type: Number, min: 1, max: 5 },
            comments: String
        },
        careerGrowth: {
            rating: { type: Number, min: 1, max: 5 },
            comments: String
        },
        compensation: {
            rating: { type: Number, min: 1, max: 5 },
            comments: String
        },
        workLifeBalance: {
            rating: { type: Number, min: 1, max: 5 },
            comments: String
        },
        teamCollaboration: {
            rating: { type: Number, min: 1, max: 5 },
            comments: String
        },
        learningOpportunities: {
            rating: { type: Number, min: 1, max: 5 },
            comments: String
        },
        toolsAndResources: {
            rating: { type: Number, min: 1, max: 5 },
            comments: String
        }
    },

    // Open-ended Questions
    suggestions: {
        type: String,
        maxlength: 2000
    },
    highlights: {
        type: String,
        maxlength: 2000
    },
    concerns: {
        type: String,
        maxlength: 2000
    },
    whatCouldBeImproved: {
        type: String,
        maxlength: 2000
    },

    // Confidentiality
    isConfidential: {
        type: Boolean,
        default: true
    },

    // Additional Data
    nextDestination: {
        company: String,
        role: String,
        industry: String
    },

    interviewerNotes: {
        type: String,
        maxlength: 2000
    }
}, {
    timestamps: true
});

// Indexes
exitInterviewSchema.index({ employee: 1 });
exitInterviewSchema.index({ interviewDate: -1 });
exitInterviewSchema.index({ reasonForLeaving: 1 });

// Method to calculate average rating
exitInterviewSchema.methods.getAverageRating = function () {
    const ratings = [];
    if (this.feedback.workEnvironment?.rating) ratings.push(this.feedback.workEnvironment.rating);
    if (this.feedback.management?.rating) ratings.push(this.feedback.management.rating);
    if (this.feedback.careerGrowth?.rating) ratings.push(this.feedback.careerGrowth.rating);
    if (this.feedback.compensation?.rating) ratings.push(this.feedback.compensation.rating);
    if (this.feedback.workLifeBalance?.rating) ratings.push(this.feedback.workLifeBalance.rating);
    if (this.feedback.teamCollaboration?.rating) ratings.push(this.feedback.teamCollaboration.rating);

    if (ratings.length === 0) return null;
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
};

module.exports = mongoose.model('ExitInterview', exitInterviewSchema);
