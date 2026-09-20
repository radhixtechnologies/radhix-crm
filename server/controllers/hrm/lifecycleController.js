const LifecycleEvent = require('../../models/LifecycleEvent');
const Employee = require('../../models/Employee');
const logActivity = require('../../utils/activityLogger');

// @desc    Create lifecycle event
// @route   POST /api/hrm/lifecycle
// @access  Private (Admin)
exports.createLifecycleEvent = async (req, res) => {
  try {
    const {
      employeeId,
      eventType,
      eventDate,
      title,
      description,
      details,
    } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const event = await LifecycleEvent.create({
      employee: employeeId,
      eventType,
      eventDate,
      title,
      description,
      details,
      initiatedBy: req.user._id,
    });

    // Update employee record based on event type
    if (eventType === 'promotion' && details.newDesignation) {
      employee.designation = details.newDesignation;
      if (details.newDepartment) {
        employee.department = details.newDepartment;
      }
      if (details.reportingManager?.new) {
        employee.manager = details.reportingManager.new;
      }
    } else if (eventType === 'transfer' && details.newDepartment) {
      employee.department = details.newDepartment;
      if (details.reportingManager?.new) {
        employee.manager = details.reportingManager.new;
      }
    } else if (eventType === 'compensation_update' && details.newSalary) {
      // Note: Salary updates typically go through payroll system
      // This is just tracking the event
    } else if (eventType === 'role_change' && details.newRole) {
      employee.designation = details.newRole;
      if (details.reportingManager?.new) {
        employee.manager = details.reportingManager.new;
      }
    } else if (eventType === 'department_change' && details.newDepartment) {
      employee.department = details.newDepartment;
      if (details.reportingManager?.new) {
        employee.manager = details.reportingManager.new;
      }
    } else if (eventType === 'probation_complete') {
      employee.probationStatus = 'completed';
    }

    await employee.save();

    await logActivity(req.user._id, 'created_lifecycle_event', `Created ${eventType} event for ${employee.employeeId}`);

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get lifecycle events
// @route   GET /api/hrm/lifecycle
// @access  Private
exports.getLifecycleEvents = async (req, res) => {
  try {
    const { employeeId, eventType } = req.query;
    const query = {};

    if (employeeId) {
      query.employee = employeeId;
    } else if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      // Employees can only see their own events
      const employee = await Employee.findOne({ user: req.user._id });
      if (employee) {
        query.employee = employee._id;
      }
    }

    if (eventType) query.eventType = eventType;

    const events = await LifecycleEvent.find(query)
      .populate('employee', 'employeeId user')
      .populate('employee.user', 'name email')
      .populate('approvedBy', 'name email')
      .populate('initiatedBy', 'name email')
      .sort({ eventDate: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get lifecycle timeline for employee
// @route   GET /api/hrm/lifecycle/employee/:employeeId/timeline
// @access  Private
exports.getEmployeeTimeline = async (req, res) => {
  try {
    const events = await LifecycleEvent.find({ employee: req.params.employeeId })
      .populate('approvedBy', 'name email')
      .populate('initiatedBy', 'name email')
      .sort({ eventDate: 1 })
      .lean();

    // Get employee joining date
    const employee = await Employee.findById(req.params.employeeId);
    const timeline = [];

    if (employee) {
      timeline.push({
        eventType: 'joining',
        eventDate: employee.joiningDate,
        title: 'Joined Organization',
        description: `Started as ${employee.designation} in ${employee.department}`,
        status: 'completed',
      });
    }

    events.forEach(event => {
      timeline.push(event);
    });

    res.status(200).json({
      success: true,
      count: timeline.length,
      data: timeline,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single lifecycle event
// @route   GET /api/hrm/lifecycle/:id
// @access  Private
exports.getLifecycleEvent = async (req, res) => {
  try {
    const event = await LifecycleEvent.findById(req.params.id)
      .populate('employee', 'employeeId user')
      .populate('employee.user', 'name email')
      .populate('approvedBy', 'name email')
      .populate('initiatedBy', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Lifecycle event not found',
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update lifecycle event
// @route   PUT /api/hrm/lifecycle/:id
// @access  Private (Admin)
exports.updateLifecycleEvent = async (req, res) => {
  try {
    const event = await LifecycleEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Lifecycle event not found',
      });
    }

    const updated = await LifecycleEvent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    await logActivity(req.user._id, 'updated_lifecycle_event', `Updated lifecycle event ${req.params.id}`);

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

// @desc    Approve lifecycle event
// @route   PUT /api/hrm/lifecycle/:id/approve
// @access  Private (Admin)
exports.approveLifecycleEvent = async (req, res) => {
  try {
    const event = await LifecycleEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Lifecycle event not found',
      });
    }

    event.status = 'approved';
    event.approvedBy = req.user._id;

    await event.save();

    await logActivity(req.user._id, 'approved_lifecycle_event', `Approved lifecycle event ${req.params.id}`);

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

