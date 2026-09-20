const Skill = require('../../models/Skill');
const Employee = require('../../models/Employee');
const SkillLibrary = require('../../models/SkillLibrary');
const logActivity = require('../../utils/activityLogger');

// @desc    Get skills for an employee
// @route   GET /api/hrm/skills
// @access  Private
exports.getSkills = async (req, res) => {
  try {
    const { employeeId, category, skillStatus, priority } = req.query;
    const query = {};

    if (employeeId) {
      query.employee = employeeId;
    } else if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      // Employees can only see their own skills
      const employee = await Employee.findOne({ user: req.user._id });
      if (employee) {
        query.employee = employee._id;
      } else {
        // If no employee record, return empty results
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        });
      }
    }

    if (category) query.category = category;
    if (skillStatus) query.skillStatus = skillStatus;
    if (priority) query.priority = priority;

    const skills = await Skill.find(query)
      .populate('employee', 'employeeId user department designation')
      .populate({
        path: 'employee',
        populate: {
          path: 'user',
          select: 'name email',
        },
      })
      .populate('verifiedBy', 'name email')
      .populate('assessedBy', 'name email')
      .populate('trainingRecommendations', 'title description')
      .populate('evidenceDetails.trainingRef', 'title completionDate')
      .sort({ createdAt: -1 })
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

// @desc    Get my skills (Employee - own skills only)
// @route   GET /api/hrm/skills/my
// @access  Private (Employee)
exports.getMySkills = async (req, res) => {
  try {
    // Get employee record
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'No employee record found',
      });
    }

    const { category, skillStatus, priority } = req.query;
    const query = { employee: employee._id };

    if (category) query.category = category;
    if (skillStatus) query.skillStatus = skillStatus;
    if (priority) query.priority = priority;

    const skills = await Skill.find(query)

      .populate('verifiedBy', 'name email')
      .populate('trainingRecommendations', 'title description')
      .populate('evidenceDetails.trainingRef', 'title completionDate')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate statistics
    const stats = {
      total: skills.length,
      byCategory: {},
      byProficiency: {},
      withGaps: 0,
      avgProficiency: 0,
    };

    let totalProficiency = 0;

    skills.forEach(skill => {
      // By category
      const cat = skill.category || 'other';
      stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;

      // By proficiency
      const prof = skill.proficiency || 'intermediate';
      stats.byProficiency[prof] = (stats.byProficiency[prof] || 0) + 1;

      // With gaps
      if (skill.gap && skill.gap > 0) {
        stats.withGaps++;
      }

      // Total proficiency
      totalProficiency += skill.proficiencyLevel || 5;
    });

    stats.avgProficiency = skills.length > 0
      ? (totalProficiency / skills.length).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      count: skills.length,
      data: skills,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single skill
// @route   GET /api/hrm/skills/:id
// @access  Private
exports.getSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('employee', 'employeeId user department designation')
      .populate({
        path: 'employee',
        populate: {
          path: 'user',
          select: 'name email',
        },
      })
      .populate('verifiedBy', 'name email')
      .populate('assessedBy', 'name email')
      .populate('trainingRecommendations', 'title description duration')
      .populate('improvementPlan.assignedMentor', 'employeeId user');

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
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

// @desc    Add/Update skill
// @route   POST /api/hrm/skills
// @access  Private
exports.createSkill = async (req, res) => {
  try {
    let employeeId = req.body.employee;

    // If employee is adding their own skill
    if (!employeeId && req.user.role === 'employee') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (!employee) {
        return res.status(403).json({
          success: false,
          message: 'Employee record not found',
        });
      }
      employeeId = employee._id;
    }

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required',
      });
    }

    // Check if skill already exists for this employee
    const existingSkill = await Skill.findOne({
      employee: employeeId,
      skillName: req.body.skillName,
    });

    if (existingSkill) {
      // Update existing skill
      const updated = await Skill.findByIdAndUpdate(
        existingSkill._id,
        req.body,
        { new: true, runValidators: true }
      );

      await logActivity(req.user._id, 'updated_skill', `Updated skill: ${req.body.skillName}`);

      return res.status(200).json({
        success: true,
        data: updated,
      });
    }

    // Create new skill
    const skill = await Skill.create({
      ...req.body,
      employee: employeeId,
    });

    await logActivity(req.user._id, 'created_skill', `Added skill: ${req.body.skillName}`);

    res.status(201).json({
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

// @desc    Update skill
// @route   PUT /api/hrm/skills/:id
// @access  Private
exports.updateSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
      });
    }

    const updated = await Skill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    await logActivity(req.user._id, 'updated_skill', `Updated skill: ${skill.skillName}`);

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

// @desc    Delete skill
// @route   DELETE /api/hrm/skills/:id
// @access  Private
exports.deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
      });
    }

    await Skill.findByIdAndDelete(req.params.id);

    await logActivity(req.user._id, 'deleted_skill', `Deleted skill: ${skill.skillName}`);

    res.status(200).json({
      success: true,
      message: 'Skill deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify skill
// @route   PUT /api/hrm/skills/:id/verify
// @access  Private (Admin only)
exports.verifySkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
      });
    }

    skill.verified = true;
    skill.verifiedBy = req.user._id;
    skill.verifiedAt = Date.now();

    await skill.save();

    await logActivity(req.user._id, 'verified_skill', `Verified skill: ${skill.skillName}`);

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

// @desc    Assess skill (Manager/HR assessment)
// @route   POST /api/hrm/skills/:id/assess
// @access  Private (Admin only)
exports.assessSkill = async (req, res) => {
  try {
    const { currentLevel, proficiency, notes } = req.body;

    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
      });
    }

    skill.currentLevel = currentLevel || skill.currentLevel;
    skill.proficiency = proficiency || skill.proficiency;
    skill.lastAssessedDate = Date.now();
    skill.assessedBy = req.user._id;

    if (notes && skill.improvementPlan) {
      skill.improvementPlan.notes = notes;
    }

    await skill.save();

    await logActivity(req.user._id, 'assessed_skill', `Assessed skill: ${skill.skillName} for employee`);

    res.status(200).json({
      success: true,
      data: skill,
      message: 'Skill assessed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add skill evidence
// @route   POST /api/hrm/skills/:id/evidence
// @access  Private
exports.addSkillEvidence = async (req, res) => {
  try {
    const { evidenceType, evidenceDetails } = req.body;

    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
      });
    }

    skill.evidenceType = evidenceType;
    skill.evidenceDetails = {
      ...skill.evidenceDetails,
      ...evidenceDetails,
    };

    await skill.save();

    await logActivity(req.user._id, 'added_skill_evidence', `Added evidence for skill: ${skill.skillName}`);

    res.status(200).json({
      success: true,
      data: skill,
      message: 'Evidence added successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get certifications expiring soon
// @route   GET /api/hrm/skills/certifications/expiring
// @access  Private
exports.getCertificationsExpiring = async (req, res) => {
  try {
    const { days = 30, department } = req.query;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const query = {
      'certifications.expiryDate': {
        $gte: new Date(),
        $lte: futureDate,
      },
    };

    let skills = await Skill.find(query)
      .populate('employee', 'employeeId user department designation')
      .populate({
        path: 'employee',
        populate: {
          path: 'user',
          select: 'name email',
        },
      })
      .lean();

    // Filter by department if provided
    if (department) {
      skills = skills.filter(s => s.employee?.department === department);
    }

    // Extract certifications that are expiring
    const expiringCerts = [];
    skills.forEach(skill => {
      skill.certifications.forEach(cert => {
        if (cert.expiryDate && cert.expiryDate >= new Date() && cert.expiryDate <= futureDate) {
          expiringCerts.push({
            employee: skill.employee,
            skillName: skill.skillName,
            certification: cert,
            daysUntilExpiry: Math.ceil((cert.expiryDate - new Date()) / (1000 * 60 * 60 * 24)),
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      count: expiringCerts.length,
      data: expiringCerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get skill recommendations for employee
// @route   GET /api/hrm/skills/recommendations/:employeeId
// @access  Private
exports.getSkillRecommendations = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Get employee's current skills
    const currentSkills = await Skill.find({ employee: employee._id }).select('skillName');
    const currentSkillNames = currentSkills.map(s => s.skillName);

    // Get recommended skills from library based on role and department
    const recommendedSkills = await SkillLibrary.find({
      isActive: true,
      'requiredLevelsByRole': {
        $elemMatch: {
          $or: [
            { role: employee.designation },
            { department: employee.department },
            { department: 'All' },
          ],
        },
      },
      skillName: { $nin: currentSkillNames }, // Exclude skills employee already has
    })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      count: recommendedSkills.length,
      data: recommendedSkills,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get skill matrix (all employees' skills)
// @route   GET /api/hrm/skills/matrix
// @access  Private
exports.getSkillMatrix = async (req, res) => {
  try {
    const { skillName, category, department } = req.query;
    const query = {};

    if (skillName) {
      query.skillName = { $regex: skillName, $options: 'i' };
    }
    if (category) query.category = category;

    // Role-based access control
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      // Non-admin users can only see their own skills
      const employee = await Employee.findOne({ user: req.user._id });
      if (employee) {
        query.employee = employee._id;
      } else {
        // If no employee record, return empty results instead of error
        return res.status(200).json({
          success: true,
          data: {},
        });
      }
    }

    let skills = await Skill.find(query)
      .populate({
        path: 'employee',
        select: 'employeeId user department designation',
        populate: {
          path: 'user',
          select: 'name email',
        },
      })
      .lean();

    // Filter by department if provided
    if (department) {
      skills = skills.filter(s => s.employee?.department === department);
    }

    // Group by skill name
    const matrix = {};
    skills.forEach(skill => {
      if (!matrix[skill.skillName]) {
        matrix[skill.skillName] = [];
      }
      matrix[skill.skillName].push({
        employee: skill.employee,
        proficiency: skill.proficiency,
        proficiencyLevel: skill.proficiencyLevel,
        currentLevel: skill.currentLevel,
        requiredLevel: skill.requiredLevel,
        gap: skill.gap,
        verified: skill.verified,
        skillStatus: skill.skillStatus,
        priority: skill.priority,
        lastAssessedDate: skill.lastAssessedDate,
      });
    });

    res.status(200).json({
      success: true,
      data: matrix,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


