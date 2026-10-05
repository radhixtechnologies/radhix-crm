const Attendance = require('../models/Attendance');

/**
 * Attendance Repository
 * Handles all database operations for Attendance model
 */
class AttendanceRepository {
  /**
   * Find all attendance records with filters
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}, options = {}) {
    const {
      populate = 'employee',
      select,
      sort = { date: -1 },
      skip = 0,
      limit = 100,
    } = options;

    let query = Attendance.find(filters);

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
   * Find attendance by ID
   * @param {String} id - Attendance ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async findById(id, options = {}) {
    const { populate = 'employee' } = options;

    let query = Attendance.findById(id);

    if (populate) {
      const populateFields = populate.split(' ').map(field => {
        if (field === 'employee') {
          return {
            path: 'employee',
            select: 'employeeId designation department user',
            populate: { path: 'user', select: 'name email' },
          };
        }
        return field;
      });
      query = query.populate(populateFields);
    }

    return await query.exec();
  }

  /**
   * Find today's attendance for employee
   * @param {String} employeeId - Employee ID
   * @returns {Promise<Object>}
   */
  async findTodayAttendance(employeeId) {
    const now = new Date();
    // Search within +/- 24 hours window to accommodate UTC and IST (+5:30) differences
    const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const records = await Attendance.find({
      employee: employeeId,
      $or: [
        { date: { $gte: windowStart, $lte: windowEnd } },
        { checkIn: { $gte: windowStart, $lte: windowEnd } },
        { createdAt: { $gte: windowStart } }
      ]
    })
      .sort({ checkIn: -1, date: -1, createdAt: -1 })
      .populate('employee', 'employeeId designation')
      .exec();

    if (!records || records.length === 0) {
      return null;
    }

    // Helper to check if two dates share the same calendar day in local or IST
    const isSameDay = (d1, d2) => {
      if (!d1 || !d2) return false;
      const a = new Date(d1);
      const b = new Date(d2);
      // Check server local
      if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()) {
        return true;
      }
      // Check IST (+5.5h)
      const aIST = new Date(a.getTime() + 5.5 * 3600000);
      const bIST = new Date(b.getTime() + 5.5 * 3600000);
      return aIST.getUTCFullYear() === bIST.getUTCFullYear() &&
        aIST.getUTCMonth() === bIST.getUTCMonth() &&
        aIST.getUTCDate() === bIST.getUTCDate();
    };

    // Find record matching today
    const match = records.find(r => {
      if (isSameDay(r.date, now) || isSameDay(r.checkIn, now)) return true;
      // If checked in within the last 18 hours and not checked out yet
      if (r.checkIn && !r.checkOut && (now - new Date(r.checkIn)) < 18 * 3600000) return true;
      return false;
    });

    return match || records[0];
  }

  /**
   * Find attendance for date range
   * @param {String} employeeId - Employee ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByDateRange(employeeId, startDate, endDate, options = {}) {
    const {
      populate = 'employee',
      sort = { date: -1 },
    } = options;

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let query = Attendance.find({
      employee: employeeId,
      date: { $gte: start, $lte: end },
    });

    if (populate) {
      const populateFields = populate.split(' ').map(field => {
        if (field === 'employee') {
          return {
            path: 'employee',
            select: 'employeeId designation department user',
            populate: { path: 'user', select: 'name email' },
          };
        }
        return field;
      });
      query = query.populate(populateFields);
    }

    if (sort) {
      query = query.sort(sort);
    }

    return await query.exec();
  }

  /**
   * Find attendance for month
   * @param {String} employeeId - Employee ID
   * @param {Number} year - Year
   * @param {Number} month - Month (1-12)
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByMonth(employeeId, year, month, options = {}) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return await this.findByDateRange(employeeId, startDate, endDate, options);
  }

  /**
   * Create attendance record
   * @param {Object} data - Attendance data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const attendance = new Attendance(data);
    return await attendance.save();
  }

  /**
   * Update attendance by ID
   * @param {String} id - Attendance ID
   * @param {Object} data - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>}
   */
  async updateById(id, data, options = {}) {
    const { new: returnNew = true, populate = 'employee' } = options;

    const attendance = await Attendance.findByIdAndUpdate(
      id,
      { ...data, updatedAt: Date.now() },
      { new: returnNew, runValidators: true }
    );

    if (!attendance) {
      return null;
    }

    if (populate) {
      await attendance.populate({
        path: 'employee',
        select: 'employeeId designation department user',
        populate: { path: 'user', select: 'name email' },
      });
    }

    return attendance;
  }

  /**
   * Upsert attendance (create or update)
   * @param {Object} filter - Filter criteria
   * @param {Object} data - Attendance data
   * @returns {Promise<Object>}
   */
  async upsert(filter, data) {
    return await Attendance.findOneAndUpdate(
      filter,
      { ...data, updatedAt: Date.now() },
      { new: true, upsert: true, runValidators: true }
    );
  }

  /**
   * Delete attendance by ID
   * @param {String} id - Attendance ID
   * @returns {Promise<Object>}
   */
  async deleteById(id) {
    return await Attendance.findByIdAndDelete(id);
  }

  /**
   * Count attendance records
   * @param {Object} filters - Query filters
   * @returns {Promise<Number>}
   */
  async count(filters = {}) {
    return await Attendance.countDocuments(filters);
  }

  /**
   * Aggregate attendance statistics
   * @param {String} employeeId - Employee ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>}
   */
  async aggregateStats(employeeId, startDate, endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const stats = await Attendance.aggregate([
      {
        $match: {
          employee: employeeId,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
          },
          halfDays: {
            $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] },
          },
          leaveDays: {
            $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] },
          },
          lateDays: {
            $sum: { $cond: [{ $eq: ['$isLate', true] }, 1, 0] },
          },
          totalHours: { $sum: '$hoursWorked' },
        },
      },
    ]);

    return stats[0] || {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      halfDays: 0,
      leaveDays: 0,
      lateDays: 0,
      totalHours: 0,
    };
  }
}

module.exports = new AttendanceRepository();

