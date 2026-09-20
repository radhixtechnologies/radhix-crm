const SkillGap = require('../../models/SkillGap');
const Skill = require('../../models/Skill');
const Employee = require('../../models/Employee');
const SkillLibrary = require('../../models/SkillLibrary');
const logActivity = require('../../utils/activityLogger');

// @desc    Analyze skill gaps for an employee
// @route   POST /api/hrm/skill-gaps/analyze/:employeeId
// @access  Private (Admin only)
exports.analyzeSkillGaps = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.employeeId);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        // Get required skills for employee's role and department
        const requiredSkills = await SkillLibrary.find({
            isActive: true,
            'requiredLevelsByRole': {
                $elemMatch: {
                    $or: [
                        { role: employee.designation, department: employee.department },
                        { role: employee.designation, department: 'All' },
                        { department: employee.department },
                    ],
                },
            },
        }).lean();

        // Get employee's current skills
        const currentSkills = await Skill.find({ employee: employee._id }).lean();
        const currentSkillsMap = {};
        currentSkills.forEach(skill => {
            currentSkillsMap[skill.skillName] = skill.currentLevel || skill.proficiencyLevel;
        });

        const gaps = [];

        // Identify gaps
        for (const reqSkill of requiredSkills) {
            // Find the required level for this employee's role/department
            const roleRequirement = reqSkill.requiredLevelsByRole.find(r =>
                (r.role === employee.designation && (r.department === employee.department || r.department === 'All')) ||
                (r.department === employee.department)
            );

            if (roleRequirement) {
                const currentLevel = currentSkillsMap[reqSkill.skillName] || 0;
                const gap = roleRequirement.requiredLevel - currentLevel;

                if (gap > 0) {
                    // Check if gap already exists
                    const existingGap = await SkillGap.findOne({
                        employee: employee._id,
                        skill: reqSkill._id,
                        status: { $ne: 'completed' },
                    });

                    if (!existingGap) {
                        const newGap = await SkillGap.create({
                            employee: employee._id,
                            skill: reqSkill._id,
                            skillName: reqSkill.skillName,
                            currentLevel,
                            requiredLevel: roleRequirement.requiredLevel,
                            gap,
                            priority: roleRequirement.priority,
                            identifiedBy: req.user._id,
                            actionPlan: {
                                recommendedTrainings: reqSkill.relatedTrainings || [],
                            },
                        });
                        gaps.push(newGap);
                    }
                }
            }
        }

        await logActivity(req.user._id, 'analyzed_skill_gaps', `Analyzed skill gaps for employee: ${employee.employeeId}`);

        res.status(200).json({
            success: true,
            count: gaps.length,
            data: gaps,
            message: `Identified ${gaps.length} skill gaps`,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get all skill gaps
// @route   GET /api/hrm/skill-gaps
// @access  Private
exports.getSkillGaps = async (req, res) => {
    try {
        const { employeeId, status, priority, department } = req.query;
        const query = {};

        if (employeeId) query.employee = employeeId;
        if (status) query.status = status;
        if (priority) query.priority = priority;

        let gaps = await SkillGap.find(query)
            .populate('employee', 'employeeId user department designation')
            .populate({
                path: 'employee',
                populate: {
                    path: 'user',
                    select: 'name email',
                },
            })
            .populate('skill', 'skillName category description')
            .populate('identifiedBy', 'name email')
            .populate('actionPlan.recommendedTrainings', 'title description duration')
            .populate('actionPlan.assignedMentor', 'employeeId user')
            .sort({ priority: 1, gap: -1 })
            .lean();

        // Filter by department if provided
        if (department) {
            gaps = gaps.filter(g => g.employee?.department === department);
        }

        res.status(200).json({
            success: true,
            count: gaps.length,
            data: gaps,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single skill gap
// @route   GET /api/hrm/skill-gaps/:id
// @access  Private
exports.getSkillGap = async (req, res) => {
    try {
        const gap = await SkillGap.findById(req.params.id)
            .populate('employee', 'employeeId user department designation')
            .populate({
                path: 'employee',
                populate: {
                    path: 'user',
                    select: 'name email',
                },
            })
            .populate('skill', 'skillName category description certificationDetails')
            .populate('identifiedBy', 'name email')
            .populate('completedBy', 'name email')
            .populate('actionPlan.recommendedTrainings', 'title description duration')
            .populate('actionPlan.assignedMentor', 'employeeId user');

        if (!gap) {
            return res.status(404).json({
                success: false,
                message: 'Skill gap not found',
            });
        }

        res.status(200).json({
            success: true,
            data: gap,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update skill gap action plan
// @route   PUT /api/hrm/skill-gaps/:id
// @access  Private (Admin only)
exports.updateSkillGap = async (req, res) => {
    try {
        const gap = await SkillGap.findById(req.params.id);

        if (!gap) {
            return res.status(404).json({
                success: false,
                message: 'Skill gap not found',
            });
        }

        const updated = await SkillGap.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        await logActivity(req.user._id, 'updated_skill_gap', `Updated skill gap for: ${gap.skillName}`);

        res.status(200).json({
            success: true,
            data: updated,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Close skill gap
// @route   PUT /api/hrm/skill-gaps/:id/close
// @access  Private (Admin only)
exports.closeSkillGap = async (req, res) => {
    try {
        const gap = await SkillGap.findById(req.params.id);

        if (!gap) {
            return res.status(404).json({
                success: false,
                message: 'Skill gap not found',
            });
        }

        gap.status = 'completed';
        gap.completedDate = Date.now();
        gap.completedBy = req.user._id;
        gap.progress = 100;

        await gap.save();

        // Update the employee's skill level
        const employeeSkill = await Skill.findOne({
            employee: gap.employee,
            skillName: gap.skillName,
        });

        if (employeeSkill) {
            employeeSkill.currentLevel = gap.requiredLevel;
            employeeSkill.gap = 0;
            await employeeSkill.save();
        }

        await logActivity(req.user._id, 'closed_skill_gap', `Closed skill gap: ${gap.skillName}`);

        res.status(200).json({
            success: true,
            data: gap,
            message: 'Skill gap closed successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get skill gaps by department
// @route   GET /api/hrm/skill-gaps/department/:dept
// @access  Private (Admin only)
exports.getSkillGapsByDepartment = async (req, res) => {
    try {
        const { dept } = req.params;

        const gaps = await SkillGap.find()
            .populate('employee', 'employeeId user department designation')
            .populate({
                path: 'employee',
                populate: {
                    path: 'user',
                    select: 'name email',
                },
            })
            .populate('skill', 'skillName category')
            .lean();

        // Filter by department
        const departmentGaps = gaps.filter(g => g.employee?.department === dept);

        // Group by skill
        const gapsBySkill = {};
        departmentGaps.forEach(gap => {
            if (!gapsBySkill[gap.skillName]) {
                gapsBySkill[gap.skillName] = {
                    skillName: gap.skillName,
                    category: gap.skill?.category,
                    totalEmployees: 0,
                    averageGap: 0,
                    criticalCount: 0,
                    gaps: [],
                };
            }
            gapsBySkill[gap.skillName].gaps.push(gap);
            gapsBySkill[gap.skillName].totalEmployees++;
            if (gap.priority === 'critical') {
                gapsBySkill[gap.skillName].criticalCount++;
            }
        });

        // Calculate average gaps
        Object.keys(gapsBySkill).forEach(skillName => {
            const totalGap = gapsBySkill[skillName].gaps.reduce((sum, g) => sum + g.gap, 0);
            gapsBySkill[skillName].averageGap = (totalGap / gapsBySkill[skillName].totalEmployees).toFixed(2);
        });

        res.status(200).json({
            success: true,
            department: dept,
            totalGaps: departmentGaps.length,
            data: gapsBySkill,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get skill gap summary report
// @route   GET /api/hrm/skill-gaps/reports/summary
// @access  Private (Admin only)
exports.getSkillGapSummary = async (req, res) => {
    try {
        const allGaps = await SkillGap.find()
            .populate('employee', 'department')
            .lean();

        const summary = {
            totalGaps: allGaps.length,
            byStatus: {
                identified: allGaps.filter(g => g.status === 'identified').length,
                inProgress: allGaps.filter(g => g.status === 'in-progress').length,
                completed: allGaps.filter(g => g.status === 'completed').length,
                overdue: allGaps.filter(g => g.status === 'overdue').length,
            },
            byPriority: {
                critical: allGaps.filter(g => g.priority === 'critical').length,
                high: allGaps.filter(g => g.priority === 'high').length,
                medium: allGaps.filter(g => g.priority === 'medium').length,
                low: allGaps.filter(g => g.priority === 'low').length,
            },
            byDepartment: {},
            averageGap: 0,
            averageProgress: 0,
        };

        // Calculate department-wise gaps
        allGaps.forEach(gap => {
            const dept = gap.employee?.department || 'Unknown';
            if (!summary.byDepartment[dept]) {
                summary.byDepartment[dept] = 0;
            }
            summary.byDepartment[dept]++;
        });

        // Calculate averages
        if (allGaps.length > 0) {
            const totalGap = allGaps.reduce((sum, g) => sum + g.gap, 0);
            const totalProgress = allGaps.reduce((sum, g) => sum + g.progress, 0);
            summary.averageGap = (totalGap / allGaps.length).toFixed(2);
            summary.averageProgress = (totalProgress / allGaps.length).toFixed(2);
        }

        res.status(200).json({
            success: true,
            data: summary,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = exports;
