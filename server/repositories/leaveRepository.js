const Leave = require('../models/Leave');

/**
 * Leave Repository
 * Handles all database operations for Leave model
 */
class LeaveRepository {
  /**
   * Find all leaves with filters
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}, options = {}) {
    const {
      populate = 'employee approvedBy rejectedBy',
      select,
      sort = { createdAt: -1 },
      skip = 0,
      limit = 50,
    } = options;

    let query = Leave.find(filters);

    if (select) {
      query = query.select(select);
    }

    if (populate) {
      const populateFields = populate.split(' ').map(field => {
        if (field === 'employee') {
          return {
            path: 'employee',
            select: 'employeeId designation department user',
            populate: { path: 'user', select: 'name email' },
          };
        }
        if (field === 'approvedBy' || field === 'rejectedBy') {
          return { path: field, select: 'name email' };
        }
        return field;
      });
      query = query.populate(populateFields);
    }

    if (sort) {
      query = query.sort(sort);
    }

    query = query.skip(skip).limit(limit);

    return await query.exec();
  }

  /**
   * Find leave by ID
   * @param {String} id - Leave ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async findById(id, options = {}) {
    const { populate = 'employee approvedBy rejectedBy' } = options;

    let query = Leave.findById(id);

    if (populate) {
      const populateFields = populate.split(' ').map(field => {
        if (field === 'employee') {
          return {
            path: 'employee',
            select: 'employeeId designation department user',
            populate: { path: 'user', select: 'name email' },
          };
        }
        if (field === 'approvedBy' || field === 'rejectedBy') {
          return { path: field, select: 'name email' };
        }
        return field;
      });
      query = query.populate(populateFields);
    }

    return await query.exec();
  }

  /**
   * Find leaves for employee
   * @param {String} employeeId - Employee ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByEmployee(employeeId, options = {}) {
    return await this.findAll({ employee: employeeId }, options);
  }

  /**
   * Find overlapping leaves
   * @param {String} employeeId - Employee ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {String} excludeId - Exclude this leave ID
   * @returns {Promise<Array>}
   */
  async findOverlapping(employeeId, startDate, endDate, excludeId = null) {
    const query = {
      employee: employeeId,
      $or: [
        // Leave starts within the date range
        { startDate: { $gte: startDate, $lte: endDate } },
        // Leave ends within the date range
        { endDate: { $gte: startDate, $lte: endDate } },
        // Leave completely covers the date range
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
      ],
      status: { $in: ['pending', 'approved'] },
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    return await Leave.find(query).exec();
  }

  /**
   * Create leave
   * @param {Object} data - Leave data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const leave = new Leave(data);
    return await leave.save();
  }

  /**
   * Update leave by ID
   * @param {String} id - Leave ID
   * @param {Object} data - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>}
   */
  async updateById(id, data, options = {}) {
    const { new: returnNew = true, populate = 'employee approvedBy rejectedBy' } = options;

    const leave = await Leave.findByIdAndUpdate(
      id,
      { ...data, updatedAt: Date.now() },
      { new: returnNew, runValidators: true }
    );

    if (!leave) {
      return null;
    }

    if (populate) {
      const populateFields = populate.split(' ').map(field => {
        if (field === 'employee') {
          return {
            path: 'employee',
            select: 'employeeId designation department user',
            populate: { path: 'user', select: 'name email' },
          };
        }
        if (field === 'approvedBy' || field === 'rejectedBy') {
          return { path: field, select: 'name email' };
        }
        return field;
      });
      await leave.populate(populateFields);
    }

    return leave;
  }

  /**
   * Delete leave by ID
   * @param {String} id - Leave ID
   * @returns {Promise<Object>}
   */
  async deleteById(id) {
    return await Leave.findByIdAndDelete(id);
  }

  /**
   * Count leaves
   * @param {Object} filters - Query filters
   * @returns {Promise<Number>}
   */
  async count(filters = {}) {
    return await Leave.countDocuments(filters);
  }

  /**
   * Get leave statistics for employee
   * @param {String} employeeId - Employee ID
   * @param {Number} year - Year
   * @returns {Promise<Object>}
   */
  async getEmployeeLeaveStats(employeeId, year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const stats = await Leave.aggregate([
      {
        $match: {
          employee: employeeId,
          startDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$days' },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$days', 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$days', 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, '$days', 0] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {};
    stats.forEach(stat => {
      result[stat._id] = {
        total: stat.total,
        approved: stat.approved,
        pending: stat.pending,
        rejected: stat.rejected,
        count: stat.count,
      };
    });

    return result;
  }
}

module.exports = new LeaveRepository();

