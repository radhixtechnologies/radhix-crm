const Skill = require('../../models/Skill');
const SkillLibrary = require('../../models/SkillLibrary');
const SkillGap = require('../../models/SkillGap');
const SkillRequest = require('../../models/SkillRequest');
const SkillAuditLog = require('../../models/SkillAuditLog');
const Employee = require('../../models/Employee');

// @desc    Get skill heatmap (Department vs Skill matrix)
// @route   GET /api/hrm/skills/analytics/heatmap
// @access  Private (Super Admin only)
exports.getSkillHeatmap = async (req, res) => {
    try {
        const { department, skillCategory } = req.query;

        // Get all skills with employee details
        let query = { approvalStatus: 'approved' };
        if (skillCategory) {
            const skillsInCategory = await SkillLibrary.find({ category: skillCategory });
            query.skill = { $in: skillsInCategory.map(s => s._id) };
        }

        const skills = await Skill.find(query)
            .populate('employee', 'department designation')
            .populate('skill', 'skillName category')
            .lean();

        // Group by department and skill
        const heatmap = {};

        skills.forEach(skill => {
            const dept = skill.employee?.department || 'Unassigned';
            const skillName = skill.skill?.skillName || 'Unknown';

            if (!heatmap[dept]) {
                heatmap[dept] = {};
            }

            if (!heatmap[dept][skillName]) {
                heatmap[dept][skillName] = {
                    count: 0,
                    avgLevel: 0,
                    totalLevel: 0,
                    levels: [],
                };
            }

            heatmap[dept][skillName].count++;
            heatmap[dept][skillName].totalLevel += skill.currentLevel || skill.proficiencyLevel;
            heatmap[dept][skillName].levels.push(skill.currentLevel || skill.proficiencyLevel);
        });

        // Calculate averages
        Object.keys(heatmap).forEach(dept => {
            Object.keys(heatmap[dept]).forEach(skillName => {
                const data = heatmap[dept][skillName];
                data.avgLevel = Math.round(data.totalLevel / data.count);
                delete data.totalLevel; // Remove intermediate calculation
            });
        });

        res.status(200).json({
            success: true,
            data: heatmap,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get skill trends over time
// @route   GET /api/hrm/skills/analytics/trends
// @access  Private (Super Admin only)
exports.getSkillTrends = async (req, res) => {
    try {
        const { startDate, endDate, skillId } = req.query;

        const query = {
            action: { $in: ['created', 'level_changed', 'request_approved'] },
        };

        if (startDate) {
            query.timestamp = { $gte: new Date(startDate) };
        }
        if (endDate) {
            query.timestamp = { ...query.timestamp, $lte: new Date(endDate) };
        }
        if (skillId) {
            query.skill = skillId;
        }

        const auditLogs = await SkillAuditLog.find(query)
            .populate('skill', 'skillName category')
            .sort({ timestamp: 1 })
            .lean();

        // Group by month
        const trends = {};

        auditLogs.forEach(log => {
            const month = new Date(log.timestamp).toISOString().slice(0, 7); // YYYY-MM
            const skillName = log.skillName || 'Unknown';

            if (!trends[month]) {
                trends[month] = {
                    skillsAdded: 0,
                    skillsUpdated: 0,
                    requestsApproved: 0,
                    bySkill: {},
                };
            }

            if (log.action === 'created') {
                trends[month].skillsAdded++;
            } else if (log.action === 'level_changed') {
                trends[month].skillsUpdated++;
            } else if (log.action === 'request_approved') {
                trends[month].requestsApproved++;
            }

            if (!trends[month].bySkill[skillName]) {
                trends[month].bySkill[skillName] = 0;
            }
            trends[month].bySkill[skillName]++;
        });

        res.status(200).json({
            success: true,
            data: trends,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get compliance dashboard
// @route   GET /api/hrm/skills/analytics/compliance
// @access  Private (Super Admin only)
exports.getComplianceDashboard = async (req, res) => {
    try {
        // Get skills with certifications
        const skillsWithCerts = await Skill.find({
            'certifications.0': { $exists: true },
        })
            .populate('employee', 'employeeId user department')
            .populate({
                path: 'employee',
                populate: {
                    path: 'user',
                    select: 'name email',
                },
            })
            .lean();

        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const compliance = {
            total: skillsWithCerts.length,
            active: 0,
            expiringSoon: 0,
            expired: 0,
            byDepartment: {},
            expiringCertifications: [],
            expiredCertifications: [],
        };

        skillsWithCerts.forEach(skill => {
            skill.certifications.forEach(cert => {
                const expiryDate = new Date(cert.expiryDate);
                const dept = skill.employee?.department || 'Unassigned';

                if (!compliance.byDepartment[dept]) {
                    compliance.byDepartment[dept] = {
                        total: 0,
                        active: 0,
                        expiringSoon: 0,
                        expired: 0,
                    };
                }

                compliance.byDepartment[dept].total++;

                if (expiryDate < now) {
                    compliance.expired++;
                    compliance.byDepartment[dept].expired++;
                    compliance.expiredCertifications.push({
                        employee: skill.employee,
                        skillName: skill.skillName,
                        certification: cert,
                    });
                } else if (expiryDate < thirtyDaysFromNow) {
                    compliance.expiringSoon++;
                    compliance.byDepartment[dept].expiringSoon++;
                    compliance.expiringCertifications.push({
                        employee: skill.employee,
                        skillName: skill.skillName,
                        certification: cert,
                        daysUntilExpiry: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)),
                    });
                } else {
                    compliance.active++;
                    compliance.byDepartment[dept].active++;
                }
            });
        });

        // Sort expiring certifications by days until expiry
        compliance.expiringCertifications.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

        res.status(200).json({
            success: true,
            data: compliance,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get training ROI metrics
// @route   GET /api/hrm/skills/analytics/roi
// @access  Private (Super Admin only)
exports.getTrainingROI = async (req, res) => {
    try {
        // Get skills that were updated after training
        const skillsFromTraining = await Skill.find({
            skillSource: 'training',
            'evidenceDetails.trainingRef': { $exists: true },
        })
            .populate('evidenceDetails.trainingRef', 'title cost duration')
            .populate('employee', 'department')
            .lean();

        const roi = {
            totalSkillsFromTraining: skillsFromTraining.length,
            avgLevelIncrease: 0,
            byDepartment: {},
            byTraining: {},
        };

        let totalLevelIncrease = 0;

        skillsFromTraining.forEach(skill => {
            const levelIncrease = (skill.currentLevel || skill.proficiencyLevel) - (skill.previousLevel || 0);
            totalLevelIncrease += levelIncrease;

            const dept = skill.employee?.department || 'Unassigned';
            if (!roi.byDepartment[dept]) {
                roi.byDepartment[dept] = {
                    count: 0,
                    avgIncrease: 0,
                    totalIncrease: 0,
                };
            }

            roi.byDepartment[dept].count++;
            roi.byDepartment[dept].totalIncrease += levelIncrease;
        });

        // Calculate averages
        roi.avgLevelIncrease = skillsFromTraining.length > 0
            ? (totalLevelIncrease / skillsFromTraining.length).toFixed(2)
            : 0;

        Object.keys(roi.byDepartment).forEach(dept => {
            const data = roi.byDepartment[dept];
            data.avgIncrease = (data.totalIncrease / data.count).toFixed(2);
            delete data.totalIncrease;
        });

        res.status(200).json({
            success: true,
            data: roi,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get skill gap statistics
// @route   GET /api/hrm/skills/analytics/gaps
// @access  Private (Super Admin only)
exports.getGapStatistics = async (req, res) => {
    try {
        const gaps = await SkillGap.find()
            .populate('employee', 'department designation')
            .populate('skill', 'skillName category')
            .lean();

        const stats = {
            total: gaps.length,
            byStatus: {},
            byPriority: {},
            byDepartment: {},
            avgGapSize: 0,
            criticalGaps: 0,
        };

        let totalGapSize = 0;

        gaps.forEach(gap => {
            // By status
            stats.byStatus[gap.status] = (stats.byStatus[gap.status] || 0) + 1;

            // By priority
            stats.byPriority[gap.priority] = (stats.byPriority[gap.priority] || 0) + 1;

            // By department
            const dept = gap.employee?.department || 'Unassigned';
            stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;

            // Gap size
            totalGapSize += gap.gap;

            // Critical gaps (gap >= 4)
            if (gap.gap >= 4) {
                stats.criticalGaps++;
            }
        });

        stats.avgGapSize = gaps.length > 0
            ? (totalGapSize / gaps.length).toFixed(2)
            : 0;

        res.status(200).json({
            success: true,
            data: stats,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = exports;
