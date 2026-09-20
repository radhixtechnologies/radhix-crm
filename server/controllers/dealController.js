const Deal = require('../models/Deal');
const DealActivity = require('../models/DealActivity');

// Get all deals with filters
exports.getDeals = async (req, res) => {
    try {
        const { stage, status, assignedTo, source, search, minValue, maxValue, page = 1, limit = 100 } = req.query;

        // Build filter query
        const filter = { isDeleted: false };

        if (stage) filter.stage = stage;
        if (status) filter.status = status;
        if (source) filter.source = source;
        if (assignedTo) filter.assignedTo = assignedTo;
        if (minValue || maxValue) {
            filter.value = {};
            if (minValue) filter.value.$gte = Number(minValue);
            if (maxValue) filter.value.$lte = Number(maxValue);
        }

        // Search by title or client name
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        // Role-based access control
        const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;
        
        if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
            roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
            roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
            filter.assignedTo = req.user._id;
        }

        const deals = await Deal.find(filter)
            .populate('client', 'name email')
            .populate('contact', 'name email')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await Deal.countDocuments(filter);

        res.json({
            success: true,
            data: deals,
            total,
            pages: Math.ceil(total / limit),
            currentPage: Number(page)
        });
    } catch (error) {
        console.error('Error fetching deals:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get single deal by ID
exports.getDealById = async (req, res) => {
    try {
        const deal = await Deal.findById(req.params.id)
            .populate('client', 'name email phone company')
            .populate('contact', 'name email phone')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name');

        if (!deal || deal.isDeleted) {
            return res.status(404).json({ success: false, message: 'Deal not found' });
        }

        // Role-based access check
        const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;
        const isEmployee = roleSlug === 'employee' || roleSlug === 'sales_employee' || 
                           roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
                           roleSlug === 'operations_employee' || roleSlug === 'management_employee';
        
        if (isEmployee && deal.assignedTo?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({ success: true, data: deal });
    } catch (error) {
        console.error('Error fetching deal:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Create new deal
exports.createDeal = async (req, res) => {
    try {
        const dealData = {
            ...req.body,
            createdBy: req.user._id,
            assignedTo: req.body.assignedTo || req.user._id
        };

        const deal = await Deal.create(dealData);

        // Log activity
        await DealActivity.create({
            deal: deal._id,
            type: 'created',
            description: `Deal created by ${req.user.name}`,
            createdBy: req.user._id
        });

        const populatedDeal = await Deal.findById(deal._id)
            .populate('client', 'name email')
            .populate('assignedTo', 'name email');

        res.status(201).json({ success: true, data: populatedDeal });
    } catch (error) {
        console.error('Error creating deal:', error);
        res.status(400).json({ success: false, message: 'Failed to create deal', error: error.message });
    }
};

// Update deal
exports.updateDeal = async (req, res) => {
    try {
        const deal = await Deal.findById(req.params.id);

        if (!deal || deal.isDeleted) {
            return res.status(404).json({ success: false, message: 'Deal not found' });
        }

        // Role-based access check
        const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;
        const isEmployee = roleSlug === 'employee' || roleSlug === 'sales_employee' || 
                           roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
                           roleSlug === 'operations_employee' || roleSlug === 'management_employee';
        
        if (isEmployee && deal.assignedTo?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const updatedDeal = await Deal.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('client', 'name email')
            .populate('assignedTo', 'name email');

        // Log activity
        await DealActivity.create({
            deal: deal._id,
            type: 'updated',
            description: `Deal updated by ${req.user.name}`,
            createdBy: req.user._id
        });

        res.json({ success: true, data: updatedDeal });
    } catch (error) {
        console.error('Error updating deal:', error);
        res.status(400).json({ success: false, message: 'Failed to update deal', error: error.message });
    }
};

// Delete deal (soft delete)
exports.deleteDeal = async (req, res) => {
    try {
        const deal = await Deal.findById(req.params.id);

        if (!deal || deal.isDeleted) {
            return res.status(404).json({ success: false, message: 'Deal not found' });
        }

        // Only admin/super admin can delete
        const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;
        const isEmployee = roleSlug === 'employee' || roleSlug === 'sales_employee' || 
                           roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
                           roleSlug === 'operations_employee' || roleSlug === 'management_employee';

        if (isEmployee) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        deal.isDeleted = true;
        await deal.save();

        res.json({ success: true, message: 'Deal deleted successfully' });
    } catch (error) {
        console.error('Error deleting deal:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Change deal stage (activity-driven validation)
exports.changeDealStage = async (req, res) => {
    try {
        const { stage, lostReason, lostNotes } = req.body;
        const deal = await Deal.findById(req.params.id);

        if (!deal || deal.isDeleted) {
            return res.status(404).json({ success: false, message: 'Deal not found' });
        }

        const oldStage = deal.stage;
        const Activity = require('../models/Activity');

        // ═══════════════════════════════════════════════════════
        // ACTIVITY-DRIVEN VALIDATION
        // ═══════════════════════════════════════════════════════

        // Get all activities for this deal
        const dealActivities = await Activity.find({
            'relatedTo.entityType': 'Deal',
            'relatedTo.entityId': deal._id
        });

        const completedActivities = dealActivities.filter(a => a.status === 'completed');
        const upcomingActivities = dealActivities.filter(a =>
            a.status !== 'completed' && new Date(a.dueDate) > new Date()
        );

        // RULE 1: Moving forward requires at least one upcoming activity
        const stageOrder = ['qualified', 'proposal-sent', 'negotiation', 'won', 'lost'];
        const oldIndex = stageOrder.indexOf(oldStage);
        const newIndex = stageOrder.indexOf(stage);
        const isMovingForward = newIndex > oldIndex;

        if (isMovingForward && upcomingActivities.length === 0 && stage !== 'won' && stage !== 'lost') {
            return res.status(400).json({
                success: false,
                message: '⚠️ Please schedule a follow-up activity before moving the deal forward.',
                requiresActivity: true
            });
        }

        // RULE 2: Stage-specific validations
        switch (stage) {
            case 'proposal-sent':
                // Requires at least one completed activity (discussion happened)
                if (completedActivities.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: '❌ Cannot move to "Proposal Sent" without completing at least one activity (call/meeting for requirement discussion).',
                        hint: 'Complete a Call or Meeting activity first'
                    });
                }
                break;

            case 'negotiation':
                // Requires proposal to have been sent (previous stage)
                if (oldStage !== 'proposal-sent' && oldStage !== 'negotiation') {
                    return res.status(400).json({
                        success: false,
                        message: '❌ Cannot move to "Negotiation" without sending a proposal first.',
                        hint: 'Move to "Proposal Sent" stage first'
                    });
                }
                break;

            case 'won':
                // Requires at least one completed Meeting or Call
                const completedMeetingsOrCalls = completedActivities.filter(a =>
                    a.type === 'meeting' || a.type === 'call'
                );

                if (completedMeetingsOrCalls.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: '❌ Cannot mark deal as WON without at least one completed Meeting or Call.',
                        hint: 'Complete a Meeting or Call activity to confirm client agreement'
                    });
                }

                // Auto-set closure fields
                deal.probability = 100;
                deal.status = 'won';
                deal.wonDate = new Date();
                deal.closedDate = new Date();
                break;

            case 'lost':
                // Requires loss reason
                if (!lostReason) {
                    return res.status(400).json({
                        success: false,
                        message: '❌ Loss reason is required to mark deal as LOST.',
                        requiresLossReason: true
                    });
                }

                // Set loss fields
                deal.lostReason = lostReason;
                deal.lostNotes = lostNotes || '';
                deal.probability = 0;
                deal.status = 'lost';
                deal.lostDate = new Date();
                deal.closedDate = new Date();
                break;
        }

        // Update stage
        deal.stage = stage;

        // Update probability based on stage (if not won/lost)
        if (stage !== 'won' && stage !== 'lost') {
            const stageProbabilities = {
                'new-lead': 10,
                'contacted': 20,
                'qualified': 40,
                'proposal-sent': 60,
                'negotiation': 80
            };
            deal.probability = stageProbabilities[stage] || deal.probability;
        }

        await deal.save();

        // Log activity
        const DealActivity = require('../models/DealActivity');
        await DealActivity.create({
            deal: deal._id,
            type: 'stage_change',
            description: `Stage changed from ${oldStage} to ${stage}`,
            oldValue: oldStage,
            newValue: stage,
            createdBy: req.user._id
        });

        res.json({
            success: true,
            data: deal,
            message: `Deal moved to ${stage} successfully`
        });
    } catch (error) {
        console.error('Error changing deal stage:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to change stage',
            error: error.message
        });
    }
};

// Change deal status (won/lost)
exports.changeDealStatus = async (req, res) => {
    try {
        const { status, lostReason, lostNotes } = req.body;
        const deal = await Deal.findById(req.params.id);

        if (!deal || deal.isDeleted) {
            return res.status(404).json({ success: false, message: 'Deal not found' });
        }

        const oldStatus = deal.status;
        deal.status = status;

        if (status === 'won') {
            deal.wonDate = new Date();
            deal.stage = 'won';
        } else if (status === 'lost') {
            deal.lostDate = new Date();
            deal.lostReason = lostReason;
            deal.lostNotes = lostNotes;
            deal.stage = 'lost';
        }

        await deal.save();

        // Log activity
        await DealActivity.create({
            deal: deal._id,
            type: 'status_change',
            description: `Status changed from ${oldStatus} to ${status}`,
            oldValue: oldStatus,
            newValue: status,
            createdBy: req.user._id
        });

        res.json({ success: true, data: deal });
    } catch (error) {
        console.error('Error changing deal status:', error);
        res.status(400).json({ success: false, message: 'Failed to change status', error: error.message });
    }
};
