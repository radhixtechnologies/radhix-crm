const Employee = require('../models/Employee');

/**
 * Policy Targeting Service
 * Determines which employees a policy applies to based on targeting criteria
 */

/**
 * Get all employees that match the policy targeting criteria
 * @param {Object} applicableTo - Policy applicableTo object
 * @returns {Promise<Array>} Array of employee IDs
 */
exports.getApplicableEmployees = async (applicableTo) => {
    try {
        // If applicable to all employees, return all active employees
        if (applicableTo.allEmployees) {
            const employees = await Employee.find({
                status: { $in: ['active', 'onboarding'] },
                deletedAt: null
            }).select('_id');
            return employees.map(emp => emp._id);
        }

        // Build query based on targeting criteria
        const query = {
            status: { $in: ['active', 'onboarding'] },
            deletedAt: null,
            $or: []
        };

        if (applicableTo.departments && applicableTo.departments.length > 0) {
            query.$or.push({ department: { $in: applicableTo.departments } });
        }

        if (applicableTo.roles && applicableTo.roles.length > 0) {
            query.$or.push({ designation: { $in: applicableTo.roles } });
        }

        if (applicableTo.locations && applicableTo.locations.length > 0) {
            query.$or.push({ workLocation: { $in: applicableTo.locations } });
        }

        if (applicableTo.employmentTypes && applicableTo.employmentTypes.length > 0) {
            query.$or.push({ employmentType: { $in: applicableTo.employmentTypes } });
        }

        // If no specific criteria, return empty array
        if (query.$or.length === 0) {
            return [];
        }

        const employees = await Employee.find(query).select('_id');
        return employees.map(emp => emp._id);
    } catch (error) {
        console.error('Error getting applicable employees:', error);
        throw error;
    }
};

/**
 * Check if a specific employee matches the policy targeting criteria
 * @param {Object} applicableTo - Policy applicableTo object
 * @param {String} employeeId - Employee ID to check
 * @returns {Promise<Boolean>} True if policy applies to employee
 */
exports.isPolicyApplicableToEmployee = async (applicableTo, employeeId) => {
    try {
        // If applicable to all employees, return true
        if (applicableTo.allEmployees) {
            return true;
        }

        const employee = await Employee.findById(employeeId);
        if (!employee || employee.deletedAt) {
            return false;
        }

        // Check if employee is active or onboarding
        if (!['active', 'onboarding'].includes(employee.status)) {
            return false;
        }

        // Check department match
        if (applicableTo.departments && applicableTo.departments.length > 0) {
            if (applicableTo.departments.includes(employee.department)) {
                return true;
            }
        }

        // Check role/designation match
        if (applicableTo.roles && applicableTo.roles.length > 0) {
            if (applicableTo.roles.includes(employee.designation)) {
                return true;
            }
        }

        // Check location match
        if (applicableTo.locations && applicableTo.locations.length > 0) {
            if (applicableTo.locations.includes(employee.workLocation)) {
                return true;
            }
        }

        // Check employment type match
        if (applicableTo.employmentTypes && applicableTo.employmentTypes.length > 0) {
            if (applicableTo.employmentTypes.includes(employee.employmentType)) {
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking policy applicability:', error);
        throw error;
    }
};

/**
 * Get all policies applicable to a specific employee
 * @param {String} employeeId - Employee ID
 * @returns {Promise<Array>} Array of applicable policy IDs
 */
exports.getEmployeePolicies = async (employeeId) => {
    try {
        const Policy = require('../models/Policy');
        const employee = await Employee.findById(employeeId);

        if (!employee || employee.deletedAt) {
            return [];
        }

        // Get all active policies
        const policies = await Policy.find({
            status: 'active',
            isLatestVersion: true
        });

        const applicablePolicies = [];

        for (const policy of policies) {
            const isApplicable = await this.isPolicyApplicableToEmployee(
                policy.applicableTo,
                employeeId
            );

            if (isApplicable) {
                applicablePolicies.push(policy._id);
            }
        }

        return applicablePolicies;
    } catch (error) {
        console.error('Error getting employee policies:', error);
        throw error;
    }
};

/**
 * Get count of employees a policy applies to
 * @param {Object} applicableTo - Policy applicableTo object
 * @returns {Promise<Number>} Count of applicable employees
 */
exports.getApplicableEmployeesCount = async (applicableTo) => {
    try {
        const employeeIds = await this.getApplicableEmployees(applicableTo);
        return employeeIds.length;
    } catch (error) {
        console.error('Error getting applicable employees count:', error);
        throw error;
    }
};
