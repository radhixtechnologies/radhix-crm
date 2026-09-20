const SkillLibrary = require('../../models/SkillLibrary');
const logActivity = require('../../utils/activityLogger');

// @desc    Get all skills from library
// @route   GET /api/hrm/skill-library
// @access  Private
exports.getSkillLibrary = async (req, res) => {
    try {
        const { category, isActive, search } = req.query;
        const query = {};

        if (category) query.category = category;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        if (search) {
            query.$or = [
                { skillName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }

        const skills = await SkillLibrary.find(query)
            .populate('relatedTrainings', 'title description duration')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .sort({ skillName: 1 })
            .lean();

        res.status(200).json({
            success: true,
            count: skills.length,
            data: skills,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single skill from library
// @route   GET /api/hrm/skill-library/:id
// @access  Private
exports.getSkillLibraryItem = async (req, res) => {
    try {
        const skill = await SkillLibrary.findById(req.params.id)
            .populate('relatedTrainings', 'title description duration')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        if (!skill) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found in library',
            });
        }

        res.status(200).json({
            success: true,
            data: skill,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create skill in library
// @route   POST /api/hrm/skill-library
// @access  Private (Admin only)
exports.createSkillLibraryItem = async (req, res) => {
    try {
        const skillData = {
            ...req.body,
            createdBy: req.user._id,
        };

        const skill = await SkillLibrary.create(skillData);

        await logActivity(req.user._id, 'created_skill_library_item', `Added skill to library: ${skill.skillName}`);

        res.status(201).json({
            success: true,
            data: skill,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Skill already exists in library',
            });
        }
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update skill in library
// @route   PUT /api/hrm/skill-library/:id
// @access  Private (Admin only)
exports.updateSkillLibraryItem = async (req, res) => {
    try {
        const skill = await SkillLibrary.findById(req.params.id);

        if (!skill) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found in library',
            });
        }

        const updated = await SkillLibrary.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                updatedBy: req.user._id,
            },
            { new: true, runValidators: true }
        );

        await logActivity(req.user._id, 'updated_skill_library_item', `Updated skill in library: ${skill.skillName}`);

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

// @desc    Delete skill from library (soft delete)
// @route   DELETE /api/hrm/skill-library/:id
// @access  Private (Admin only)
exports.deleteSkillLibraryItem = async (req, res) => {
    try {
        const skill = await SkillLibrary.findById(req.params.id);

        if (!skill) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found in library',
            });
        }

        // Soft delete by setting isActive to false
        skill.isActive = false;
        skill.updatedBy = req.user._id;
        await skill.save();

        await logActivity(req.user._id, 'deleted_skill_library_item', `Deactivated skill in library: ${skill.skillName}`);

        res.status(200).json({
            success: true,
            message: 'Skill deactivated successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get required skills for a role
// @route   GET /api/hrm/skill-library/by-role/:role
// @access  Private
exports.getSkillsByRole = async (req, res) => {
    try {
        const { role } = req.params;
        const { department } = req.query;

        const query = {
            isActive: true,
            'requiredLevelsByRole': {
                $elemMatch: {
                    role: role,
                },
            },
        };

        if (department) {
            query['requiredLevelsByRole.$elemMatch.department'] = department;
        }

        const skills = await SkillLibrary.find(query)
            .populate('relatedTrainings', 'title description')
            .lean();

        res.status(200).json({
            success: true,
            count: skills.length,
            data: skills,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Link training to skill
// @route   POST /api/hrm/skill-library/:id/link-training
// @access  Private (Admin only)
exports.linkTrainingToSkill = async (req, res) => {
    try {
        const { trainingId } = req.body;

        const skill = await SkillLibrary.findById(req.params.id);

        if (!skill) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found in library',
            });
        }

        // Add training if not already linked
        if (!skill.relatedTrainings.includes(trainingId)) {
            skill.relatedTrainings.push(trainingId);
            skill.updatedBy = req.user._id;
            await skill.save();
        }

        await logActivity(req.user._id, 'linked_training_to_skill', `Linked training to skill: ${skill.skillName}`);

        res.status(200).json({
            success: true,
            data: skill,
            message: 'Training linked successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = exports;
