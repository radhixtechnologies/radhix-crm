const mongoose = require('mongoose');

/**
 * Enterprise-level Query Builder
 * Builds MongoDB queries from request parameters
 * Supports: text search, department filtering, date ranges, number ranges, multi-select, pagination, sorting
 */
class QueryBuilder {
  constructor() {
    this.mongoQuery = {};
    this.queryOptions = {
      page: 1,
      limit: 50,
      skip: 0,
      sort: { createdAt: -1 },
    };
  }

  /**
   * Build query from request parameters
   * @param {Object} reqQuery - Request query parameters
   * @param {Object} config - Configuration for field mappings and custom handlers
   * @returns {Object} - { query, options }
   */
  build(reqQuery = {}, config = {}) {
    this.mongoQuery = {};
    this.queryOptions = {
      page: 1,
      limit: 50,
      skip: 0,
      sort: { createdAt: -1 },
    };

    const {
      // Text search fields
      textSearchFields = [],
      // Date range fields
      dateRangeFields = [],
      // Number range fields
      numberRangeFields = [],
      // Multi-select fields
      multiSelectFields = [],
      // Direct mapping fields (fieldName: dbFieldName)
      directFields = {},
      // Custom handlers
      customHandlers = {},
      // Default filters (always applied)
      defaultFilters = {},
    } = config;

    // Apply default filters
    Object.assign(this.mongoQuery, defaultFilters);

    // Text search (global search across multiple fields)
    if (reqQuery.search || reqQuery.query) {
      const searchTerm = (reqQuery.search || reqQuery.query).trim();
      if (searchTerm && textSearchFields.length > 0) {
        this.mongoQuery.$or = (this.mongoQuery.$or || []).concat(
          textSearchFields.map(field => ({
            [field]: { $regex: searchTerm, $options: 'i' },
          }))
        );
      }
    }

    // Department filtering (supports single or comma-separated values)
    if (reqQuery.department) {
      const departments = Array.isArray(reqQuery.department)
        ? reqQuery.department
        : reqQuery.department.split(',').map(d => d.trim()).filter(Boolean);
      
      if (departments.length === 1) {
        this.mongoQuery.department = departments[0];
      } else if (departments.length > 1) {
        this.mongoQuery.department = { $in: departments };
      }
    }

    // Status filtering
    if (reqQuery.status) {
      const statuses = Array.isArray(reqQuery.status)
        ? reqQuery.status
        : reqQuery.status.split(',').map(s => s.trim()).filter(Boolean);
      
      if (statuses.length === 1) {
        this.mongoQuery.status = statuses[0];
      } else if (statuses.length > 1) {
        this.mongoQuery.status = { $in: statuses };
      }
    }

    // Date range filtering
    dateRangeFields.forEach(field => {
      const startField = `${field}Start` || `${field}_start`;
      const endField = `${field}End` || `${field}_end`;
      
      if (reqQuery[startField] || reqQuery[endField]) {
        this.mongoQuery[field] = {};
        if (reqQuery[startField]) {
          this.mongoQuery[field].$gte = new Date(reqQuery[startField]);
        }
        if (reqQuery[endField]) {
          const endDate = new Date(reqQuery[endField]);
          endDate.setHours(23, 59, 59, 999); // Include full day
          this.mongoQuery[field].$lte = endDate;
        }
      }
    });

    // Special handling for date ranges (joiningDate, attendanceDate, etc.)
    if (reqQuery.startDate || reqQuery.endDate) {
      if (reqQuery.startDate) {
        this.mongoQuery.date = this.mongoQuery.date || {};
        this.mongoQuery.date.$gte = new Date(reqQuery.startDate);
      }
      if (reqQuery.endDate) {
        const endDate = new Date(reqQuery.endDate);
        endDate.setHours(23, 59, 59, 999);
        this.mongoQuery.date = this.mongoQuery.date || {};
        this.mongoQuery.date.$lte = endDate;
      }
    }

    // Number range filtering (salary, experience, hours)
    numberRangeFields.forEach(field => {
      const minField = `${field}Min` || `${field}_min`;
      const maxField = `${field}Max` || `${field}_max`;
      
      if (reqQuery[minField] || reqQuery[maxField]) {
        this.mongoQuery[field] = {};
        if (reqQuery[minField]) {
          this.mongoQuery[field].$gte = parseFloat(reqQuery[minField]);
        }
        if (reqQuery[maxField]) {
          this.mongoQuery[field].$lte = parseFloat(reqQuery[maxField]);
        }
      }
    });

    // Multi-select fields (skills, projects, etc.)
    multiSelectFields.forEach(field => {
      if (reqQuery[field]) {
        const values = Array.isArray(reqQuery[field])
          ? reqQuery[field]
          : reqQuery[field].split(',').map(v => v.trim()).filter(Boolean);
        
        if (values.length > 0) {
          this.mongoQuery[field] = { $in: values };
        }
      }
    });

    // Direct field mapping
    Object.keys(directFields).forEach(queryField => {
      const dbField = directFields[queryField];
      if (reqQuery[queryField] !== undefined && reqQuery[queryField] !== null && reqQuery[queryField] !== '') {
        if (typeof reqQuery[queryField] === 'boolean' || reqQuery[queryField] === 'true' || reqQuery[queryField] === 'false') {
          this.mongoQuery[dbField] = reqQuery[queryField] === 'true' || reqQuery[queryField] === true;
        } else {
          this.mongoQuery[dbField] = reqQuery[queryField];
        }
      }
    });

    // Custom handlers
    Object.keys(customHandlers).forEach(field => {
      const handler = customHandlers[field];
      if (reqQuery[field] !== undefined && reqQuery[field] !== null && reqQuery[field] !== '') {
        const customQuery = handler(reqQuery[field], this.mongoQuery);
        // Merge $or arrays if both exist
        if (customQuery.$or && this.mongoQuery.$or) {
          this.mongoQuery.$or = this.mongoQuery.$or.concat(customQuery.$or);
          delete customQuery.$or;
        }
        Object.assign(this.mongoQuery, customQuery);
      }
    });

    // Pagination
    if (reqQuery.page) {
      this.queryOptions.page = parseInt(reqQuery.page) || 1;
    }
    if (reqQuery.limit) {
      this.queryOptions.limit = parseInt(reqQuery.limit) || 50;
    }
    this.queryOptions.skip = (this.queryOptions.page - 1) * this.queryOptions.limit;

    // Sorting
    if (reqQuery.sortBy) {
      const sortOrder = reqQuery.sortOrder === 'asc' ? 1 : -1;
      this.queryOptions.sort = { [reqQuery.sortBy]: sortOrder };
    } else if (reqQuery.sort) {
      // Support format: "field:order" or "-field"
      const sortParts = reqQuery.sort.split(':');
      if (sortParts.length === 2) {
        this.queryOptions.sort = { [sortParts[0]]: sortParts[1] === 'asc' ? 1 : -1 };
      } else if (reqQuery.sort.startsWith('-')) {
        this.queryOptions.sort = { [reqQuery.sort.substring(1)]: -1 };
      } else {
        this.queryOptions.sort = { [reqQuery.sort]: -1 };
      }
    }

    return {
      query: this.mongoQuery,
      options: this.queryOptions,
    };
  }

  /**
   * Build employee-specific query
   */
  buildEmployeeQuery(reqQuery = {}) {
    return this.build(reqQuery, {
      textSearchFields: ['employeeId', 'designation'],
      dateRangeFields: ['joiningDate', 'birthDate'],
      numberRangeFields: ['salary', 'experience'],
      multiSelectFields: ['skills', 'department', 'status'],
      directFields: {
        role: 'user.role',
        email: 'user.email',
        name: 'user.name',
        phone: 'phone',
        designation: 'designation',
        workLocation: 'workLocation',
        managerId: 'manager',
      },
      customHandlers: {
        name: (value, currentQuery) => {
          // Merge with existing $or if present
          const existingOr = currentQuery.$or || [];
          return {
            $or: existingOr.concat([
              { 'user.name': { $regex: value, $options: 'i' } },
            ]),
          };
        },
        email: (value) => ({
          'user.email': { $regex: value, $options: 'i' },
        }),
        experienceMin: (value) => ({
          experience: { $gte: parseFloat(value) },
        }),
        experienceMax: (value) => ({
          experience: { $lte: parseFloat(value) },
        }),
      },
    });
  }

  /**
   * Build leave-specific query
   */
  buildLeaveQuery(reqQuery = {}) {
    return this.build(reqQuery, {
      textSearchFields: ['reason', 'type'],
      dateRangeFields: ['startDate', 'endDate'],
      multiSelectFields: ['type', 'status'],
      directFields: {
        employeeId: 'employee',
        type: 'type',
        status: 'status',
      },
      customHandlers: {
        department: (value) => {
          // Need to filter by employee's department
          return {
            'employee.department': Array.isArray(value)
              ? { $in: value }
              : value.split(',').length > 1
              ? { $in: value.split(',').map(d => d.trim()) }
              : value,
          };
        },
      },
    });
  }

  /**
   * Build task-specific query
   */
  buildTaskQuery(reqQuery = {}) {
    return this.build(reqQuery, {
      textSearchFields: ['title', 'description'],
      dateRangeFields: ['dueDate', 'createdAt'],
      multiSelectFields: ['priority', 'status', 'tags'],
      directFields: {
        assignedTo: 'assignedTo',
        priority: 'priority',
        status: 'status',
        project: 'project',
      },
      customHandlers: {
        department: (value) => ({
          'assignedTo.department': Array.isArray(value)
            ? { $in: value }
            : value.split(',').length > 1
            ? { $in: value.split(',').map(d => d.trim()) }
            : value,
        }),
      },
    });
  }

  /**
   * Build attendance-specific query
   */
  buildAttendanceQuery(reqQuery = {}) {
    return this.build(reqQuery, {
      dateRangeFields: ['date', 'checkIn', 'checkOut'],
      multiSelectFields: ['status'],
      directFields: {
        employeeId: 'employee',
        status: 'status',
      },
      customHandlers: {
        department: (value) => ({
          'employee.department': Array.isArray(value)
            ? { $in: value }
            : value.split(',').length > 1
            ? { $in: value.split(',').map(d => d.trim()) }
            : value,
        }),
      },
    });
  }

  /**
   * Build timesheet-specific query
   */
  buildTimesheetQuery(reqQuery = {}) {
    return this.build(reqQuery, {
      dateRangeFields: ['date'],
      numberRangeFields: ['totalHours', 'billableHours', 'nonBillableHours'],
      multiSelectFields: ['status', 'project'],
      directFields: {
        employeeId: 'employee',
        status: 'status',
        project: 'project',
      },
      customHandlers: {
        department: (value) => ({
          'employee.department': Array.isArray(value)
            ? { $in: value }
            : value.split(',').length > 1
            ? { $in: value.split(',').map(d => d.trim()) }
            : value,
        }),
        hoursMin: (value) => ({
          totalHours: { $gte: parseFloat(value) },
        }),
        hoursMax: (value) => ({
          totalHours: { $lte: parseFloat(value) },
        }),
      },
    });
  }
}

// Export singleton instance
module.exports = new QueryBuilder();

