const SkillConfiguration = require('../../models/SkillConfiguration');
const SkillAuditLog = require('../../models/SkillAuditLog');
const logActivity = require('../../utils/activityLogger');

// @desc    Get active skill configuration
// @route   GET /api/hrm/skills/configuration
// @access  Private (Admin/Super Admin)
exports.getConfiguration = async (req, res) => {
    try {
        const config = await SkillConfiguration.getActiveConfig();

        res.status(200).json({
            success: true,
            data: config,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update skill configuration
// @route   PUT /api/hrm/skills/configuration
// @access  Private (Super Admin only)
exports.updateConfiguration = async (req, res) => {
    try {
        const updates = req.body;

        // Get current config for audit trail
        const oldConfig = await SkillConfiguration.getActiveConfig();
        const oldData = oldConfig.toObject();

        // Update configuration
        const config = await SkillConfiguration.updateConfig(updates, req.user._id);

        // Log configuration change
        await SkillAuditLog.create({
            employee: null, // System-level change
            skill: null,
            skillName: 'System Configuration',
            action: 'configuration_updated',
            performedBy: req.user._id,
            performedByRole: req.user.role,
            previousData: oldData,
            newData: config.toObject(),
            reason: 'Configuration updated by Super Admin',
            severity: 'warning',
        });

        // Log activity
        await logActivity(req.user._id, 'skill_config_updated',
            'Updated skill system configuration');

        res.status(200).json({
            success: true,
            data: config,
            message: 'Configuration updated successfully',
        });
    } catch (error) {
        console.error('Error updating configuration:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Reset configuration to defaults
// @route   POST /api/hrm/skills/configuration/reset
// @access  Private (Super Admin only)
exports.resetToDefaults = async (req, res) => {
    try {
        // Get current config
        const currentConfig = await SkillConfiguration.findOne({ isActive: true });

        if (currentConfig) {
            // Deactivate current config
            currentConfig.isActive = false;
            await currentConfig.save();
        }

        // Create new default config
        const defaultConfig = await SkillConfiguration.getActiveConfig();

        // Log reset
        await SkillAuditLog.create({
            employee: null,
            skill: null,
            skillName: 'System Configuration',
            action: 'configuration_reset',
            performedBy: req.user._id,
            performedByRole: req.user.role,
            reason: 'Configuration reset to defaults',
            severity: 'warning',
        });

        // Log activity
        await logActivity(req.user._id, 'skill_config_reset',
            'Reset skill configuration to defaults');

        res.status(200).json({
            success: true,
            data: defaultConfig,
            message: 'Configuration reset to defaults',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get proficiency level definitions
// @route   GET /api/hrm/skills/proficiency-levels
// @access  Private
exports.getProficiencyLevels = async (req, res) => {
    try {
        const config = await SkillConfiguration.getActiveConfig();

        res.status(200).json({
            success: true,
            data: config.proficiencyLevels,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = exports;
