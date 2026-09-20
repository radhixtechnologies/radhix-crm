const Campaign = require('../models/Campaign');
const Contact = require('../models/Contact');
const Lead = require('../models/Lead');
const Employee = require('../models/Employee');
const Segment = require('../models/Segment');
const { resolveSegment } = require('./segmentController');

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Private
exports.getAllCampaigns = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status,
            type,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query;

        const query = {};

        // Search
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by type
        if (type) {
            query.type = type;
        }

        // Pagination
        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const campaigns = await Campaign.find(query)
            .populate('owner', 'user employeeId')
            .populate('owner.user', 'name email')
            .populate('segment', 'name type cachedCounts')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const totalItems = await Campaign.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                campaigns,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: parseInt(limit),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error fetching campaigns',
                details: error.message,
            },
        });
    }
};

// @desc    Get campaign by ID
// @route   GET /api/campaigns/:id
// @access  Private
exports.getCampaignById = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id)
            .populate('owner', 'user employeeId')
            .populate('teamMembers', 'user designation')
            .populate('segment', 'name type rules cachedCounts')
            .populate({
                path: 'leads',
                select: 'name email phone status company leadTemperature createdAt value',
                options: { sort: { createdAt: -1 }, limit: 50 } // Show recent 50 leads
            });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Campaign not found',
                },
            });
        }

        res.status(200).json({
            success: true,
            data: campaign,
        });
    } catch (error) {
        console.error('Error fetching campaign:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error fetching campaign',
                details: error.message,
            },
        });
    }
};

// @desc    Create new campaign
// @route   POST /api/campaigns
// @access  Private
exports.createCampaign = async (req, res) => {
    try {
        const campaignData = {
            ...req.body,
            createdBy: req.user._id,
        };

        // Validate segment exists
        if (!campaignData.segment) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Campaign must have a target segment'
                }
            });
        }

        const campaign = await Campaign.create(campaignData);

        // Update segment's usedInCampaigns array
        await Segment.findByIdAndUpdate(
            campaign.segment,
            { $addToSet: { usedInCampaigns: campaign._id } }
        );

        // Resolve segment to populate campaign leads
        const resolved = await resolveSegment(campaign.segment);
        campaign.leads = [...resolved.leads.map(l => l._id), ...resolved.contacts.map(c => c._id)];
        campaign.metrics.totalLeads = resolved.totalMembers;
        await campaign.save();

        res.status(201).json({
            success: true,
            message: 'Campaign created successfully',
            data: campaign,
        });
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Error creating campaign',
                details: error.message,
            },
        });
    }
};

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Private
exports.updateCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Campaign not found',
                },
            });
        }

        res.status(200).json({
            success: true,
            message: 'Campaign updated successfully',
            data: campaign,
        });
    } catch (error) {
        console.error('Error updating campaign:', error);
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Error updating campaign',
                details: error.message,
            },
        });
    }
};

// @desc    Update campaign status
// @route   PATCH /api/campaigns/:id/status
// @access  Private
exports.updateCampaignStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const campaign = await Campaign.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Campaign not found',
                },
            });
        }

        res.status(200).json({
            success: true,
            message: 'Campaign status updated',
            data: campaign,
        });
    } catch (error) {
        console.error('Error updating campaign status:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error updating campaign status',
            },
        });
    }
};

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private (Admin only)
exports.deleteCampaign = async (req, res) => {
    try {
        // Only admins can delete campaigns
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Not authorized to delete campaigns',
                },
            });
        }

        const campaign = await Campaign.findById(req.params.id);

        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Campaign not found',
                },
            });
        }

        await campaign.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Campaign deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error deleting campaign',
                details: error.message,
            },
        });
    }
};

// @desc    Get campaign metrics
// @route   GET /api/campaigns/:id/metrics
// @access  Private
exports.getCampaignMetrics = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);

        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Campaign not found',
                },
            });
        }

        // Calculate real-time metrics (optional: usually these are updated by background jobs or events)
        // For now, return stored metrics plus some derived data
        const metrics = {
            ...campaign.metrics,
            roi: campaign.roi,
            conversionRate: campaign.conversionRate,
            costPerLead: campaign.costPerLead,
            budgetUtilization: (campaign.actualSpend / campaign.budget) * 100,
            daysRunning: Math.ceil((new Date() - new Date(campaign.startDate)) / (1000 * 60 * 60 * 24)),
        };

        res.status(200).json({
            success: true,
            data: metrics,
        });
    } catch (error) {
        console.error('Error fetching campaign metrics:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error fetching campaign metrics',
            },
        });
    }
};

// @desc    Get detailed campaign analytics
// @route   GET /api/campaigns/:id/analytics
// @access  Private
exports.getCampaignAnalytics = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id)
            .populate('owner', 'user')
            .populate('teamMembers', 'user')
            .populate('leads', 'name email status source');

        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Campaign not found',
                },
            });
        }

        // Calculate advanced analytics
        const analytics = {
            overview: {
                name: campaign.name,
                type: campaign.type,
                status: campaign.status,
                duration: {
                    start: campaign.startDate,
                    end: campaign.endDate,
                    daysRunning: Math.ceil((new Date() - new Date(campaign.startDate)) / (1000 * 60 * 60 * 24)),
                    daysRemaining: Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24)),
                },
            },
            financial: {
                budget: campaign.budget,
                actualSpend: campaign.actualSpend,
                budgetUtilization: campaign.budget > 0 ? (campaign.actualSpend / campaign.budget) * 100 : 0,
                budgetRemaining: campaign.budget - campaign.actualSpend,
                roi: campaign.roi,
                revenue: campaign.metrics?.revenue || 0,
                costPerLead: campaign.costPerLead,
            },
            performance: {
                totalLeads: campaign.metrics?.totalLeads || 0,
                qualifiedLeads: campaign.metrics?.qualifiedLeads || 0,
                convertedLeads: campaign.metrics?.convertedLeads || 0,
                conversionRate: campaign.conversionRate,
                qualificationRate: campaign.metrics?.totalLeads > 0
                    ? (campaign.metrics?.qualifiedLeads / campaign.metrics?.totalLeads) * 100
                    : 0,
            },
            engagement: {
                emailsSent: campaign.metrics?.emailsSent || 0,
                emailsOpened: campaign.metrics?.emailsOpened || 0,
                emailsClicked: campaign.metrics?.emailsClicked || 0,
                openRate: campaign.metrics?.emailsSent > 0
                    ? (campaign.metrics?.emailsOpened / campaign.metrics?.emailsSent) * 100
                    : 0,
                clickRate: campaign.metrics?.emailsSent > 0
                    ? (campaign.metrics?.emailsClicked / campaign.metrics?.emailsSent) * 100
                    : 0,
                websiteVisits: campaign.metrics?.websiteVisits || 0,
                formSubmissions: campaign.metrics?.formSubmissions || 0,
            },
            team: {
                owner: campaign.owner,
                teamMembers: campaign.teamMembers,
            },
        };

        res.status(200).json({
            success: true,
            data: analytics,
        });
    } catch (error) {
        console.error('Error fetching campaign analytics:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error fetching campaign analytics',
                details: error.message,
            },
        });
    }
};

// @desc    Duplicate campaign
// @route   POST /api/campaigns/:id/duplicate
// @access  Private
exports.duplicateCampaign = async (req, res) => {
    try {
        const originalCampaign = await Campaign.findById(req.params.id);

        if (!originalCampaign) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Campaign not found',
                },
            });
        }

        // Create a copy of the campaign
        const campaignData = originalCampaign.toObject();
        delete campaignData._id;
        delete campaignData.createdAt;
        delete campaignData.updatedAt;
        delete campaignData.leads; // Don't copy leads

        // Reset metrics
        campaignData.metrics = {
            totalLeads: 0,
            qualifiedLeads: 0,
            convertedLeads: 0,
            emailsSent: 0,
            emailsOpened: 0,
            emailsClicked: 0,
            smsSent: 0,
            smsDelivered: 0,
            websiteVisits: 0,
            formSubmissions: 0,
            revenue: 0,
        };
        campaignData.actualSpend = 0;
        campaignData.roi = 0;
        campaignData.conversionRate = 0;
        campaignData.costPerLead = 0;

        // Update name and status
        campaignData.name = `${originalCampaign.name} (Copy)`;
        campaignData.status = 'draft';
        campaignData.createdBy = req.user._id;

        const newCampaign = await Campaign.create(campaignData);

        res.status(201).json({
            success: true,
            message: 'Campaign duplicated successfully',
            data: newCampaign,
        });
    } catch (error) {
        console.error('Error duplicating campaign:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error duplicating campaign',
                details: error.message,
            },
        });
    }
};
