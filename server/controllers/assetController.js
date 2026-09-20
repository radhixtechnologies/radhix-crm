const Asset = require('../models/Asset');
const Employee = require('../models/Employee');
const logActivity = require('../utils/activityLogger');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Get all assets
// @route   GET /api/employees/assets
// @access  Private
exports.getAssets = async (req, res) => {
  try {
    let query = {};

    // Get role slug
    const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;

    if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
        roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
        roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
      // Employees can only see their own assigned assets
      const employee = await Employee.findOne({ user: req.user._id });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found',
        });
      }
      query.assignedTo = employee._id;
    } else {
      // Admins can filter by status, type, employee
      if (req.query.status) query.currentStatus = req.query.status;
      if (req.query.type) query.type = req.query.type;
      if (req.query.employeeId) query.assignedTo = req.query.employeeId;
    }

    const assets = await Asset.find(query)
      .populate('assignedTo', 'employeeId user department designation')
      .populate('assignedTo.user', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assets.length,
      data: assets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single asset
// @route   GET /api/employees/assets/:id
// @access  Private
exports.getAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('assignedTo', 'employeeId user department designation')
      .populate('assignedTo.user', 'name email')
      .populate('createdBy', 'name email');

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    // Get role slug
    const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;

    // Check access - employees can only view their own assets
    if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
        roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
        roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (!employee || asset.assignedTo?._id.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create asset
// @route   POST /api/employees/assets
// @access  Private (Admin, Super Admin)
exports.createAsset = async (req, res) => {
  try {
    const { assetId, name, type, brand, model, serialNumber, purchaseDate, purchasePrice, warrantyExpiry, specifications, notes } = req.body;

    if (!assetId || !name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Asset ID, name, and type are required',
      });
    }

    const asset = await Asset.create({
      assetId,
      name,
      type,
      brand,
      model,
      serialNumber,
      purchaseDate,
      purchasePrice,
      warrantyExpiry,
      specifications,
      notes,
      createdBy: req.user._id,
      currentStatus: 'available',
    });

    logActivity(req.user._id, 'create', 'employee', 'Asset', asset._id, req.body, req.ip).catch(console.error);

    await asset.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field === 'assetId' ? 'Asset ID' : 'Serial number'} already exists`,
      });
    }
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update asset
// @route   PUT /api/employees/assets/:id
// @access  Private (Admin, Super Admin)
exports.updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    // Update fields (excluding assignment-related fields which are handled separately)
    const { assignedTo, assignedDate, returnedDate, currentStatus, ...updateFields } = req.body;

    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] !== undefined) {
        asset[key] = updateFields[key];
      }
    });

    await asset.save();

    logActivity(req.user._id, 'update', 'employee', 'Asset', asset._id, req.body, req.ip).catch(console.error);

    await asset.populate('assignedTo', 'employeeId user department designation');
    await asset.populate('assignedTo.user', 'name email');
    await asset.populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field === 'assetId' ? 'Asset ID' : 'Serial number'} already exists`,
      });
    }
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Assign asset to employee
// @route   POST /api/employees/assets/:id/assign
// @access  Private (Admin, Super Admin)
exports.assignAsset = async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required',
      });
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    if (asset.currentStatus === 'assigned' && asset.assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Asset is already assigned to another employee',
      });
    }

    if (asset.currentStatus === 'maintenance' || asset.currentStatus === 'retired' || asset.currentStatus === 'lost') {
      return res.status(400).json({
        success: false,
        message: `Cannot assign asset with status: ${asset.currentStatus}`,
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    asset.assignedTo = employeeId;
    asset.assignedDate = new Date();
    asset.currentStatus = 'assigned';
    asset.returnedDate = null;
    await asset.save();

    logActivity(req.user._id, 'update', 'employee', 'Asset', asset._id, { action: 'assign', employeeId }, req.ip).catch(console.error);

    // Notify employee about asset assignment
    if (employee.user) {
      createNotification(
        employee.user,
        'Asset Assigned',
        `You have been assigned a new asset: "${asset.name}" (${asset.assetId})`,
        'asset',
        { entityType: 'Asset', entityId: asset._id }
      ).catch(console.error);
    }

    await asset.populate('assignedTo', 'employeeId user department designation');
    await asset.populate('assignedTo.user', 'name email');

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Return asset from employee
// @route   POST /api/employees/assets/:id/return
// @access  Private (Admin, Super Admin)
exports.returnAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    if (asset.currentStatus !== 'assigned' || !asset.assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Asset is not currently assigned',
      });
    }

    const previousAssignee = asset.assignedTo;
    asset.assignedTo = null;
    asset.assignedDate = null;
    asset.returnedDate = new Date();
    asset.currentStatus = 'available';
    await asset.save();

    logActivity(req.user._id, 'update', 'employee', 'Asset', asset._id, { action: 'return', previousAssignee }, req.ip).catch(console.error);

    await asset.populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add maintenance record
// @route   POST /api/employees/assets/:id/maintenance
// @access  Private (Admin, Super Admin)
exports.addMaintenance = async (req, res) => {
  try {
    const { date, description, cost, performedBy, nextMaintenance } = req.body;

    if (!date || !description) {
      return res.status(400).json({
        success: false,
        message: 'Date and description are required',
      });
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    asset.maintenanceHistory.push({
      date: new Date(date),
      description,
      cost: cost || 0,
      performedBy: performedBy || 'External Service',
      nextMaintenance: nextMaintenance ? new Date(nextMaintenance) : null,
    });

    // If asset is assigned, set status to maintenance
    if (asset.currentStatus === 'assigned') {
      asset.currentStatus = 'maintenance';
    }

    await asset.save();

    logActivity(req.user._id, 'update', 'employee', 'Asset', asset._id, { action: 'maintenance', maintenance: req.body }, req.ip).catch(console.error);

    await asset.populate('assignedTo', 'employeeId user department designation');
    await asset.populate('assignedTo.user', 'name email');

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update asset status
// @route   PUT /api/employees/assets/:id/status
// @access  Private (Admin, Super Admin)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['available', 'assigned', 'maintenance', 'retired', 'lost'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required',
      });
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    // If setting to retired or lost, unassign the asset
    if ((status === 'retired' || status === 'lost') && asset.assignedTo) {
      asset.assignedTo = null;
      asset.assignedDate = null;
      asset.returnedDate = new Date();
    }

    // If setting to available or assigned, ensure proper state
    if (status === 'available' && asset.assignedTo) {
      asset.assignedTo = null;
      asset.assignedDate = null;
      asset.returnedDate = new Date();
    }

    asset.currentStatus = status;
    await asset.save();

    logActivity(req.user._id, 'update', 'employee', 'Asset', asset._id, { action: 'status', status }, req.ip).catch(console.error);

    await asset.populate('assignedTo', 'employeeId user department designation');
    await asset.populate('assignedTo.user', 'name email');

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete asset
// @route   DELETE /api/employees/assets/:id
// @access  Private (Admin, Super Admin)
exports.deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    if (asset.currentStatus === 'assigned') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete assigned asset. Please return it first.',
      });
    }

    await asset.deleteOne();

    logActivity(req.user._id, 'delete', 'employee', 'Asset', asset._id, null, req.ip).catch(console.error);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

