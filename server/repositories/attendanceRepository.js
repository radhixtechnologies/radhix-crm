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
   * Helper to check if two dates share the same calendar day in Server local or IST (+5:30)
   * @param {Date|String} d1
   * @param {Date|String} d2
   * @returns {Boolean}
   */
  isSameDay(d1, d2) {
    if (!d1 || !d2) return false;
    const a = new Date(d1);
    const b = new Date(d2);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return false;

    // Check server local
    if (a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()) {
      return true;
    }

    // Check IST (+5.5h)
    const aIST = new Date(a.getTime() + 5.5 * 3600000);
    const bIST = new Date(b.getTime() + 5.5 * 3600000);
    return aIST.getUTCFullYear() === bIST.getUTCFullYear() &&
      aIST.getUTCMonth() === bIST.getUTCMonth() &&
      aIST.getUTCDate() === bIST.getUTCDate();
  }

  /**
   * Find today's attendance for employee
   * Strictly matches the current calendar day (local or IST).
   * Returns null if the employee has not checked in today.
   * @param {String} employeeId - Employee ID
   * @returns {Promise<Object|null>}
   */
  async findTodayAttendance(employeeId) {
    const now = new Date();
    // Search within +/- 36 hours window to accommodate UTC and IST (+5:30) differences
    const windowStart = new Date(now.getTime() - 36 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 36 * 60 * 60 * 1000);

    const records = await Attendance.find({
      employee: employeeId,
      $or: [
        { date: { $gte: windowStart, $lte: windowEnd } },
        { checkIn: { $gte: windowStart, $lte: windowEnd } }
      ]
    })
      .sort({ checkIn: -1, date: -1 })
      .populate('employee', 'employeeId designation')
      .exec();

    if (!records || records.length === 0) {
      return null;
    }

    // Find record strictly matching today's calendar day by date or checkIn
    const match = records.find(r => {
      if (this.isSameDay(r.date, now) || this.isSameDay(r.checkIn, now)) {
        return true;
      }
      return false;
    });

    // Return the match if found for today, otherwise strictly null (NEVER fallback to records[0])
    return match || null;
  }

  /**
   * Find active open attendance session (checked in, not checked out yet)
   * within a reasonable shift window (e.g. 16 hours)
   * @param {String} employeeId
   * @returns {Promise<Object|null>}
   */
  async findActiveSession(employeeId) {
    const now = new Date();
    const maxShiftStart = new Date(now.getTime() - 16 * 60 * 60 * 1000);

    const activeRecord = await Attendance.findOne({
      employee: employeeId,
      checkIn: { $gte: maxShiftStart, $lte: now },
      checkOut: null
    })
      .sort({ checkIn: -1 })
      .populate('employee', 'employeeId designation')
      .exec();

    return activeRecord || null;
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

