const Employee = require('../models/Employee');
const User = require('../models/User');

/**
 * Employee Repository
 * Handles all database operations for Employee model
 */
class EmployeeRepository {
  /**
   * Find all employees with filters
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options (populate, select, sort, pagination)
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}, options = {}) {
    const {
      populate = 'user manager',
      select,
      sort = { createdAt: -1 },
      skip = 0,
      limit = 50,
      includeDeleted = false,
    } = options;

    // Build query object - merge deletedAt filter with existing filters
    const queryFilters = { ...filters };
    
    // Exclude soft-deleted records by default
    if (!includeDeleted) {
      queryFilters.deletedAt = null;
    }

    let query = Employee.find(queryFilters);

    // Select specific fields if provided
    if (select) {
      query = query.select(select);
    }

    // Populate relations
    if (populate) {
      const populateFields = populate.split(' ').map(field => {
        if (field === 'user') return { path: 'user', select: 'name email avatar' };
        if (field === 'manager') return { path: 'manager', select: 'employeeId designation department user' };
        return field;
      });
      query = query.populate(populateFields);
    }

    // Apply sorting
    if (sort) {
      query = query.sort(sort);
    }

    // Apply pagination
    query = query.skip(skip).limit(limit);

    return await query.exec();
  }

  /**
   * Find employee by ID
   * @param {String} id - Employee ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async findById(id, options = {}) {
    const { populate = 'user manager documents.uploadedBy', includeDeleted = false } = options;

    let query = Employee.findById(id);

    if (!includeDeleted) {
      query = query.where({ deletedAt: null });
    }

    if (populate) {
      const populateFields = populate.split(' ').map(field => {
        if (field === 'user') return { path: 'user', select: 'name email avatar' };
        if (field === 'manager') return { path: 'manager', select: 'employeeId designation department user' };
        if (field === 'documents.uploadedBy') return { path: 'documents.uploadedBy', select: 'name email' };
        return field;
      });
      query = query.populate(populateFields);
    }

    return await query.exec();
  }

  /**
   * Find employee by user ID
   * @param {String} userId - User ID
   * @returns {Promise<Object>}
   */
  async findByUserId(userId) {
    return await Employee.findOne({ user: userId, deletedAt: null })
      .populate('user', 'name email avatar')
      .populate('manager', 'employeeId designation')
      .exec();
  }

  /**
   * Find employee by employee ID
   * @param {String} employeeId - Employee ID
   * @returns {Promise<Object>}
   */
  async findByEmployeeId(employeeId) {
    return await Employee.findOne({ employeeId, deletedAt: null })
      .populate('user', 'name email avatar')
      .exec();
  }

  /**
   * Create new employee
   * @param {Object} data - Employee data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const employee = new Employee(data);
    return await employee.save();
  }

  /**
   * Update employee by ID
   * @param {String} id - Employee ID
   * @param {Object} data - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>}
   */
  async updateById(id, data, options = {}) {
    const { new: returnNew = true, populate = 'user manager' } = options;

    const employee = await Employee.findByIdAndUpdate(
      id,
      { ...data, updatedAt: Date.now() },
      { new: returnNew, runValidators: true }
    );

    if (!employee) {
      return null;
    }

    if (populate) {
      const populateFields = populate.split(' ').map(field => {
        if (field === 'user') return { path: 'user', select: 'name email avatar' };
        if (field === 'manager') return { path: 'manager', select: 'employeeId designation department user' };
        return field;
      });
      await employee.populate(populateFields);
    }

    return employee;
  }

  /**
   * Soft delete employee
   * @param {String} id - Employee ID
   * @param {String} deletedBy - User ID who deleted
   * @returns {Promise<Object>}
   */
  async softDelete(id, deletedBy) {
    return await Employee.findByIdAndUpdate(
      id,
      {
        deletedAt: Date.now(),
        deletedBy,
        status: 'inactive',
        updatedAt: Date.now(),
      },
      { new: true }
    );
  }

  /**
   * Hard delete employee
   * @param {String} id - Employee ID
   * @returns {Promise<Object>}
   */
  async deleteById(id) {
    return await Employee.findByIdAndDelete(id);
  }

  /**
   * Restore soft-deleted employee
   * @param {String} id - Employee ID
   * @returns {Promise<Object>}
   */
  async restore(id) {
    return await Employee.findByIdAndUpdate(
      id,
      {
        deletedAt: null,
        deletedBy: null,
        updatedAt: Date.now(),
      },
      { new: true }
    );
  }

  /**
   * Count employees with filters
   * @param {Object} filters - Query filters
   * @param {Boolean} includeDeleted - Include soft-deleted records
   * @returns {Promise<Number>}
   */
  async count(filters = {}, includeDeleted = false) {
    if (!includeDeleted) {
      filters.deletedAt = null;
    }
    return await Employee.countDocuments(filters);
  }

  /**
   * Add document to employee
   * @param {String} id - Employee ID
   * @param {Object} document - Document data
   * @returns {Promise<Object>}
   */
  async addDocument(id, document) {
    return await Employee.findByIdAndUpdate(
      id,
      { $push: { documents: document } },
      { new: true }
    );
  }

  /**
   * Remove document from employee
   * @param {String} id - Employee ID
   * @param {String} docId - Document ID
   * @returns {Promise<Object>}
   */
  async removeDocument(id, docId) {
    return await Employee.findByIdAndUpdate(
      id,
      { $pull: { documents: { _id: docId } } },
      { new: true }
    );
  }

  /**
   * Add skill to employee
   * @param {String} id - Employee ID
   * @param {Object} skill - Skill data
   * @returns {Promise<Object>}
   */
  async addSkill(id, skill) {
    return await Employee.findByIdAndUpdate(
      id,
      { $push: { skills: skill } },
      { new: true }
    );
  }

  /**
   * Update skill in employee
   * @param {String} id - Employee ID
   * @param {String} skillId - Skill ID
   * @param {Object} skillData - Updated skill data
   * @returns {Promise<Object>}
   */
  async updateSkill(id, skillId, skillData) {
    return await Employee.findOneAndUpdate(
      { _id: id, 'skills._id': skillId },
      { $set: { 'skills.$': { ...skillData, _id: skillId } } },
      { new: true }
    );
  }

  /**
   * Remove skill from employee
   * @param {String} id - Employee ID
   * @param {String} skillId - Skill ID
   * @returns {Promise<Object>}
   */
  async removeSkill(id, skillId) {
    return await Employee.findByIdAndUpdate(
      id,
      { $pull: { skills: { _id: skillId } } },
      { new: true }
    );
  }

  /**
   * Add salary history entry
   * @param {String} id - Employee ID
   * @param {Object} salaryEntry - Salary history entry
   * @returns {Promise<Object>}
   */
  async addSalaryHistory(id, salaryEntry) {
    return await Employee.findByIdAndUpdate(
      id,
      { $push: { salaryHistory: salaryEntry } },
      { new: true }
    );
  }

  /**
   * Check if employee ID exists
   * @param {String} employeeId - Employee ID
   * @param {String} excludeId - Exclude this employee ID
   * @returns {Promise<Boolean>}
   */
  async employeeIdExists(employeeId, excludeId = null) {
    const query = { employeeId, deletedAt: null };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const count = await Employee.countDocuments(query);
    return count > 0;
  }
}

module.exports = new EmployeeRepository();

