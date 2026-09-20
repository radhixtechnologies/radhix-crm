const LeaveBalance = require('../models/LeaveBalance');

/**
 * Leave Balance Repository
 * Handles all database operations for LeaveBalance model
 */
class LeaveBalanceRepository {
  /**
   * Find leave balance by employee ID
   * @param {String} employeeId - Employee ID
   * @param {Number} year - Year (optional, defaults to current year)
   * @returns {Promise<Object>}
   */
  async findByEmployee(employeeId, year = null) {
    const query = { employee: employeeId };
    if (year) {
      query.year = year;
    } else {
      query.year = new Date().getFullYear();
    }

    return await LeaveBalance.findOne(query).exec();
  }

  /**
   * Create leave balance
   * @param {Object} data - Leave balance data
   * @returns {Promise<Object>}
   */
  async create(data) {
    try {
      const leaveBalance = new LeaveBalance(data);
      return await leaveBalance.save();
    } catch (error) {
      // If duplicate key error, try to find existing balance
      if (error.code === 11000) {
        const existingBalance = await LeaveBalance.findOne({
          employee: data.employee,
          year: data.year || new Date().getFullYear(),
        });
        if (existingBalance) {
          return existingBalance;
        }
      }
      throw error;
    }
  }

  /**
   * Update leave balance
   * @param {String} employeeId - Employee ID
   * @param {Object} updates - Update data
   * @param {Number} year - Year (optional)
   * @returns {Promise<Object>}
   */
  async update(employeeId, updates, year = null) {
    const query = { employee: employeeId };
    if (year) {
      query.year = year;
    } else {
      query.year = new Date().getFullYear();
    }

    return await LeaveBalance.findOneAndUpdate(
      query,
      { ...updates, updatedAt: Date.now() },
      { new: true, upsert: true, runValidators: true }
    );
  }

  /**
   * Reset leave balance for new year
   * @param {String} employeeId - Employee ID
   * @param {Number} year - Year
   * @param {Object} balances - New balances
   * @returns {Promise<Object>}
   */
  async resetForYear(employeeId, year, balances) {
    return await LeaveBalance.findOneAndUpdate(
      { employee: employeeId, year },
      {
        year,
        balances,
        lastResetDate: new Date(),
        updatedAt: Date.now(),
      },
      { new: true, upsert: true, runValidators: true }
    );
  }

  /**
   * Update leave balance for specific leave type
   * @param {String} employeeId - Employee ID
   * @param {String} leaveType - Leave type
   * @param {Object} updates - Updates (used, available, pending)
   * @param {Number} year - Year (optional)
   * @returns {Promise<Object>}
   */
  async updateLeaveType(employeeId, leaveType, updates, year = null) {
    const query = { employee: employeeId };
    if (year) {
      query.year = year;
    } else {
      query.year = new Date().getFullYear();
    }

    const setFields = {};
    if (updates.used !== undefined) {
      setFields[`balances.${leaveType}.used`] = updates.used;
    }
    if (updates.available !== undefined) {
      setFields[`balances.${leaveType}.available`] = updates.available;
    }
    if (updates.pending !== undefined) {
      setFields[`balances.${leaveType}.pending`] = updates.pending;
    }
    if (updates.total !== undefined) {
      setFields[`balances.${leaveType}.total`] = updates.total;
    }

    return await LeaveBalance.findOneAndUpdate(
      query,
      { ...setFields, updatedAt: Date.now() },
      { new: true, upsert: true, runValidators: true }
    );
  }

  /**
   * Get leave balance with calculated available
   * @param {String} employeeId - Employee ID
   * @param {Number} year - Year (optional)
   * @returns {Promise<Object>}
   */
  async getBalance(employeeId, year = null) {
    const currentYear = year || new Date().getFullYear();
    
    // Use findOneAndUpdate with upsert to atomically create if not exists
    // This prevents race conditions and duplicate key errors
    const defaultBalances = {
      casual: { total: 12, used: 0, available: 12, pending: 0 },
      sick: { total: 10, used: 0, available: 10, pending: 0 },
      annual: { total: 15, used: 0, available: 15, pending: 0 },
      maternity: { total: 0, used: 0, available: 0, pending: 0 },
      paternity: { total: 0, used: 0, available: 0, pending: 0 },
      unpaid: { total: 0, used: 0, available: 0, pending: 0 },
    };

    const balance = await LeaveBalance.findOneAndUpdate(
      { employee: employeeId, year: currentYear },
      {
        $setOnInsert: {
          employee: employeeId,
          year: currentYear,
          balances: defaultBalances,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    // Ensure balances object exists and all leave types are initialized
    let needsUpdate = false;
    if (!balance.balances) {
      balance.balances = defaultBalances;
      needsUpdate = true;
    }

    // Ensure available is calculated correctly
    const leaveTypes = ['casual', 'sick', 'annual', 'maternity', 'paternity', 'unpaid'];

    leaveTypes.forEach(type => {
      const balanceType = balance.balances[type];
      
      // Check if balanceType exists
      if (!balanceType) {
        // Initialize balance type with defaults
        balance.balances[type] = {
          total: type === 'casual' ? 12 : type === 'sick' ? 10 : type === 'annual' ? 15 : 0,
          used: 0,
          available: type === 'casual' ? 12 : type === 'sick' ? 10 : type === 'annual' ? 15 : 0,
          pending: 0,
        };
        needsUpdate = true;
        return;
      }

      const total = balanceType.total || 0;
      const used = balanceType.used || 0;
      const pending = balanceType.pending || 0;
      const calculatedAvailable = total - used - pending;
      
      if (balanceType.available !== calculatedAvailable) {
        balance.balances[type].available = calculatedAvailable;
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      await balance.save();
    }

    return balance;
  }
}

module.exports = new LeaveBalanceRepository();

