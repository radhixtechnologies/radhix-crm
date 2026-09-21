const SkillRequest = require('../../models/SkillRequest');
const Skill = require('../../models/Skill');
const SkillLibrary = require('../../models/SkillLibrary');
const SkillAuditLog = require('../../models/SkillAuditLog');
const Employee = require('../../models/Employee');
const SkillConfiguration = require('../../models/SkillConfiguration');
const User = require('../../models/User');
const { createNotification } = require('../../utils/notification');
const logActivity = require('../../utils/activityLogger');

// @desc    Create skill request (Employee)
// @route   POST /api/hrm/skill-requests
// @access  Private
exports.createSkillRequest = async (req, res) => {
    try {
        const { skill, skillName, category, requestType, requestedLevel, requestReason, evidence, priority } = req.body;

        // Get employee record
        const employee = await Employee.findOne({ user: req.user._id });
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee record not found',
            });
        }

        // Determine Skill ID (Lookup or Create)
        let skillId = skill;
        let skillLibraryItem;

        if (skillId) {
            skillLibraryItem = await SkillLibrary.findById(skillId);
        } else if (skillName) {
            const trimmedName = skillName.trim();
            // Try to find by name (case insensitive)
            skillLibraryItem = await SkillLibrary.findOne({
                skillName: { $regex: new RegExp('^' + trimmedName + '$', 'i') }
            });

            // If not found, create new library item (auto-growth)
            if (!skillLibraryItem) {
                try {
                    // Default to 'other' if category is invalid or missing
                    const validCategories = ['technical', 'soft-skills', 'managerial', 'compliance', 'tool-platform', 'language', 'certification', 'domain', 'other'];
                    const safeCategory = validCategories.includes(category) ? category : 'other';

                    skillLibraryItem = await SkillLibrary.create({
                        skillName: trimmedName,
                        category: safeCategory,
                        description: `Auto-created from skill request by ${req.user.name || 'employee'}`,
                        isActive: true,
                        createdBy: req.user._id
                    });
                } catch (err) {
                    // Check for duplicate key error (race condition or check failed)
                    if (err.code === 11000) {
                        skillLibraryItem = await SkillLibrary.findOne({
                            skillName: { $regex: new RegExp('^' + trimmedName + '$', 'i') }
                        });
                    } else {
                        throw err;
                    }
                }
            }

            if (skillLibraryItem) {
                skillId = skillLibraryItem._id;
            }
        }

        if (!skillLibraryItem) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found and could not be created',
            });
        }

        // Get current skill level if updating
        let currentLevel = 0;
        if (requestType === 'update') {
            const existingSkill = await Skill.findOne({
                employee: employee._id,
                skill: skillId,
            });
            if (existingSkill) {
                currentLevel = existingSkill.currentLevel || existingSkill.proficiencyLevel;
            }
        }

        // Map priority
        const priorityMap = {
            'critical': 'urgent',
            'important': 'high',
            'nice-to-have': 'medium'
        };
        const safePriority = priorityMap[priority] || priority || 'medium';

        // Get configuration for auto-approval check
        const config = await SkillConfiguration.getActiveConfig();
        let autoApproved = false;
        let status = 'pending';

        // Auto-approve ALL requests as per user requirement
        autoApproved = true;
        status = 'approved';

        /* 
        // Previous approval logic (disabled)
        if (req.user.role === 'admin' || req.user.role === 'super_admin') {
            autoApproved = true;
            status = 'approved';
        }
        else if (config.approvalWorkflow.autoApproveEnabled &&
            requestedLevel <= config.approvalWorkflow.autoApproveBelowLevel) {
            autoApproved = true;
            status = 'approved';
        }
        */

        // Create skill request
        const skillRequest = await SkillRequest.create({
            employee: employee._id,
            skill: skillId, // Use the resolved skillId
            skillName: skillLibraryItem.skillName,
            requestType,
            currentLevel,
            requestedLevel,
            requestReason,
            evidence: evidence || [],
            status,
            priority: safePriority,
            autoApproved,
        });

        // If auto-approved, create/update the skill immediately set approvedBy to self
        if (autoApproved) {
            // For admin auto-approval, set approved level same as requested
            skillRequest.approvedLevel = requestedLevel;
            skillRequest.reviewNotes = 'Auto-approved by system (Admin privilege)';
            await skillRequest.save(); // Save the approved level and notes

            await this.approveAndCreateSkill(skillRequest, req.user._id);
        }

        // Log audit trail
        await SkillAuditLog.logAction({
            employee: employee._id,
            skill: skillId, // Use resolved skillId
            skillName: skillLibraryItem.skillName,
            action: 'request_created',
            performedBy: req.user._id,
            performedByRole: req.user.role,
            newData: { requestedLevel, requestType, status },
            reason: requestReason,
            relatedRequest: skillRequest._id,
        });

        // Log activity
        await logActivity(
            req.user._id,
            'create',
            'hrm',
            'SkillRequest',
            skillRequest._id,
            `Created ${requestType} request for skill: ${skillLibraryItem.skillName}`
        );

        const reviewers = await User.find({ role: { $in: ['admin', 'super_admin'] }, isActive: true }).select('_id');
        await Promise.all(reviewers.map((reviewer) => createNotification(reviewer._id, 'info', 'New skill request', `${req.user.name || 'An employee'} requested ${skillLibraryItem.skillName}`, `/hrm/skill-requests/${skillRequest._id}`)));

        res.status(201).json({
            success: true,
            data: skillRequest,
            message: autoApproved ? 'Skill request auto-approved' : 'Skill request submitted successfully',
        });
    } catch (error) {
        console.error('Error creating skill request:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get my skill requests (Employee)
// @route   GET /api/hrm/skill-requests/my
// @access  Private
exports.getMySkillRequests = async (req, res) => {
    try {
        const employee = await Employee.findOne({ user: req.user._id });
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee record not found',
            });
        }

        const { status, requestType } = req.query;
        const query = { employee: employee._id };

        if (status) query.status = status;
        if (requestType) query.requestType = requestType;

        const requests = await SkillRequest.find(query)
            .populate('skill', 'skillName category description')
            .populate('reviewedBy', 'name email')
            .sort({ requestDate: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get all skill requests (Admin)
// @route   GET /api/hrm/skill-requests
// @access  Private (Admin only)
exports.getAllSkillRequests = async (req, res) => {
    try {
        const { status, priority, employeeId, department, skillId } = req.query;
        const query = {};

        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (employeeId) query.employee = employeeId;
        if (skillId) query.skill = skillId;

        let requests = await SkillRequest.find(query)
            .populate('employee', 'employeeId user department designation')
            .populate({
                path: 'employee',
                populate: {
                    path: 'user',
                    select: 'name email',
                },
            })
            .populate('skill', 'skillName category description')
            .populate('reviewedBy', 'name email')
            .sort({ priority: -1, requestDate: -1 })
            .lean();

        // Filter by department if provided
        if (department) {
            requests = requests.filter(r => r.employee?.department === department);
        }

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single skill request
// @route   GET /api/hrm/skill-requests/:id
// @access  Private
exports.getSkillRequest = async (req, res) => {
    try {
        const request = await SkillRequest.findById(req.params.id)
            .populate('employee', 'employeeId user department designation')
            .populate({
                path: 'employee',
                populate: {
                    path: 'user',
                    select: 'name email',
                },
            })
            .populate('skill', 'skillName category description requiredLevelsByRole')
            .populate('reviewedBy', 'name email')
            .populate('evidence.verifiedBy', 'name email');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Skill request not found',
            });
        }

        // Check access - employees can only view their own requests
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            const employee = await Employee.findOne({ user: req.user._id });
            if (!employee || request.employee._id.toString() !== employee._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                });
            }
        }

        res.status(200).json({
            success: true,
            data: request,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Review skill request (Admin)
// @route   PUT /api/hrm/skill-requests/:id/review
// @access  Private (Admin only)
exports.reviewSkillRequest = async (req, res) => {
    try {
        const { status, reviewNotes, approvedLevel } = req.body;

        const request = await SkillRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Skill request not found',
            });
        }

        // Update request
        request.status = status;
        request.reviewNotes = reviewNotes;
        request.reviewedBy = req.user._id;
        request.reviewDate = Date.now();

        if (status === 'approved') {
            request.approvedLevel = approvedLevel || request.requestedLevel;
            await request.save();

            // Create or update the skill
            await this.approveAndCreateSkill(request, req.user._id);

            // Log approval
            await SkillAuditLog.logAction({
                employee: request.employee,
                skill: request.skill,
                skillName: request.skillName,
                action: 'request_approved',
                performedBy: req.user._id,
                performedByRole: req.user.role,
                previousData: { level: request.currentLevel },
                newData: { level: request.approvedLevel },
                reason: reviewNotes,
                relatedRequest: request._id,
            });
        } else if (status === 'rejected') {
            await request.save();

            // Log rejection
            await SkillAuditLog.logAction({
                employee: request.employee,
                skill: request.skill,
                skillName: request.skillName,
                action: 'request_rejected',
                performedBy: req.user._id,
                performedByRole: req.user.role,
                reason: reviewNotes,
                relatedRequest: request._id,
            });
        } else {
            await request.save();
        }

        // Log activity
        await logActivity(
            req.user._id,
            'update',
            'hrm',
            'SkillRequest',
            request._id,
            `${status} skill request: ${request.skillName}`
        );

        const employee = await Employee.findById(request.employee).populate('user', '_id');
        await createNotification(employee?.user?._id, status === 'approved' ? 'success' : 'warning', `Skill request ${status}`, `Your request for ${request.skillName} was ${status}.`, `/hrm/skill-requests/${request._id}`);

        res.status(200).json({
            success: true,
            data: request,
            message: `Skill request ${status} successfully`,
        });
    } catch (error) {
        console.error('Error reviewing skill request:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Helper function to create/update skill after approval
exports.approveAndCreateSkill = async (request, approverId) => {
    try {
        const skillData = {
            employee: request.employee,
            skill: request.skill,
            skillName: request.skillName,
            proficiencyLevel: request.approvedLevel || request.requestedLevel,
            currentLevel: request.approvedLevel || request.requestedLevel,
            approvalStatus: 'approved',
            approvedBy: approverId,
            approvalDate: Date.now(),
            relatedRequest: request._id,
        };

        if (request.requestType === 'add') {
            // Create new skill with verified=true
            skillData.verified = true;
            skillData.verifiedBy = approverId;
            skillData.verifiedAt = Date.now();
            await Skill.create(skillData);
        } else if (request.requestType === 'update') {
            // Update existing skill
            const existingSkill = await Skill.findOne({
                employee: request.employee,
                skill: request.skill,
            });

            if (existingSkill) {
                existingSkill.previousLevel = existingSkill.currentLevel;
                existingSkill.currentLevel = request.approvedLevel || request.requestedLevel;
                existingSkill.proficiencyLevel = request.approvedLevel || request.requestedLevel;
                existingSkill.approvedBy = approverId;
                existingSkill.approvalDate = Date.now();

                // Auto-verify updates too
                existingSkill.verified = true;
                existingSkill.verifiedBy = approverId;
                existingSkill.verifiedAt = Date.now();

                existingSkill.relatedRequest = request._id;
                await existingSkill.save();
            }
        }
    } catch (error) {
        console.error('Error creating/updating skill:', error);
        throw error;
    }
};

// @desc    Add evidence to skill request
// @route   POST /api/hrm/skill-requests/:id/evidence
// @access  Private
exports.addEvidence = async (req, res) => {
    try {
        const { type, title, description, fileUrl, issuedBy, issuedDate, expiryDate } = req.body;

        const request = await SkillRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Skill request not found',
            });
        }

        // Check access
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            const employee = await Employee.findOne({ user: req.user._id });
            if (!employee || request.employee.toString() !== employee._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                });
            }
        }

        // Add evidence
        request.evidence.push({
            type,
            title,
            description,
            fileUrl,
            issuedBy,
            issuedDate,
            expiryDate,
            verificationStatus: 'pending',
        });

        await request.save();

        // Log audit trail
        await SkillAuditLog.logAction({
            employee: request.employee,
            skill: request.skill,
            skillName: request.skillName,
            action: 'evidence_added',
            performedBy: req.user._id,
            performedByRole: req.user.role,
            newData: { evidenceType: type, evidenceTitle: title },
            relatedRequest: request._id,
        });

        res.status(200).json({
            success: true,
            data: request,
            message: 'Evidence added successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Verify evidence (Admin)
// @route   PUT /api/hrm/skill-requests/:id/verify-evidence
// @access  Private (Admin only)
exports.verifyEvidence = async (req, res) => {
    try {
        const { evidenceIndex, verificationStatus, verificationNotes } = req.body;

        const request = await SkillRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Skill request not found',
            });
        }

        if (!request.evidence[evidenceIndex]) {
            return res.status(404).json({
                success: false,
                message: 'Evidence not found',
            });
        }

        // Update evidence verification
        request.evidence[evidenceIndex].verificationStatus = verificationStatus;
        request.evidence[evidenceIndex].verifiedBy = req.user._id;
        request.evidence[evidenceIndex].verificationDate = Date.now();
        request.evidence[evidenceIndex].verificationNotes = verificationNotes;

        await request.save();

        // Log audit trail
        await SkillAuditLog.logAction({
            employee: request.employee,
            skill: request.skill,
            skillName: request.skillName,
            action: verificationStatus === 'verified' ? 'evidence_verified' : 'evidence_rejected',
            performedBy: req.user._id,
            performedByRole: req.user.role,
            newData: { verificationStatus, verificationNotes },
            relatedRequest: request._id,
        });

        res.status(200).json({
            success: true,
            data: request,
            message: 'Evidence verification updated',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get pending request count (Admin)
// @route   GET /api/hrm/skill-requests/pending-count
// @access  Private (Admin only)
exports.getPendingCount = async (req, res) => {
    try {
        const count = await SkillRequest.countDocuments({ status: 'pending' });

        res.status(200).json({
            success: true,
            data: { count },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Withdraw skill request (Employee)
// @route   PUT /api/hrm/skill-requests/:id/withdraw
// @access  Private
exports.withdrawRequest = async (req, res) => {
    try {
        const request = await SkillRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Skill request not found',
            });
        }

        // Check access
        const employee = await Employee.findOne({ user: req.user._id });
        if (!employee || request.employee.toString() !== employee._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        // Can only withdraw pending or under_review requests
        if (request.status !== 'pending' && request.status !== 'under_review') {
            return res.status(400).json({
                success: false,
                message: 'Cannot withdraw request with current status',
            });
        }

        request.status = 'withdrawn';
        await request.save();

        // Log audit trail
        await SkillAuditLog.logAction({
            employee: request.employee,
            skill: request.skill,
            skillName: request.skillName,
            action: 'request_withdrawn',
            performedBy: req.user._id,
            performedByRole: req.user.role,
            relatedRequest: request._id,
        });

        res.status(200).json({
            success: true,
            data: request,
            message: 'Request withdrawn successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = exports;

