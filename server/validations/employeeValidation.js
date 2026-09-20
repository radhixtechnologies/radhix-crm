const Joi = require('joi');

// Employee validation schemas
const createEmployeeSchema = Joi.object({
  userId: Joi.string().hex().length(24).optional(),
  employeeId: Joi.string().required().min(3).max(20),
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  dateOfBirth: Joi.date().optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer-not-to-say').optional(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional().allow(''),
  alternatePhone: Joi.string().pattern(/^[0-9]{10}$/).optional().allow(''),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    country: Joi.string().optional(),
  }).optional(),
  emergencyContact: Joi.object({
    name: Joi.string().optional(),
    relation: Joi.string().optional(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    email: Joi.string().email().optional(),
    address: Joi.string().optional(),
  }).optional(),
  department: Joi.string().valid('IT', 'HR', 'Finance', 'Sales', 'Management', 'Operations').required(),
  designation: Joi.string().required().min(2).max(100),
  manager: Joi.string().hex().length(24).optional().allow(null, ''),
  workLocation: Joi.string().valid('remote', 'hybrid', 'office').optional(),
  employmentType: Joi.string().valid('full-time', 'part-time', 'intern', 'contract', 'consultant').optional(),
  joiningDate: Joi.date().optional(),
  probationEndDate: Joi.date().optional(),
  probationStatus: Joi.string().valid('not-started', 'in-progress', 'completed', 'extended').optional(),
  status: Joi.string().valid('active', 'inactive', 'onboarding', 'terminated', 'resigned').optional(),
  salary: Joi.number().min(0).optional(),
  salaryStructure: Joi.object({
    basic: Joi.number().min(0).optional(),
    hra: Joi.number().min(0).optional(),
    allowances: Joi.number().min(0).optional(),
    pf: Joi.number().min(0).optional(),
    esi: Joi.number().min(0).optional(),
    tds: Joi.number().min(0).optional(),
    netSalary: Joi.number().min(0).optional(),
  }).optional(),
});

const updateEmployeeSchema = Joi.object({
  employeeId: Joi.string().min(3).max(20).optional(),
  dateOfBirth: Joi.date().optional().allow(null),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer-not-to-say').optional().allow(null),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional().allow(''),
  alternatePhone: Joi.string().pattern(/^[0-9]{10}$/).optional().allow(''),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    country: Joi.string().optional(),
  }).optional(),
  emergencyContact: Joi.object({
    name: Joi.string().optional(),
    relation: Joi.string().optional(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    email: Joi.string().email().optional(),
    address: Joi.string().optional(),
  }).optional(),
  department: Joi.string().valid('IT', 'HR', 'Finance', 'Sales', 'Management', 'Operations').optional(),
  designation: Joi.string().min(2).max(100).optional(),
  manager: Joi.string().hex().length(24).optional().allow(null, ''),
  workLocation: Joi.string().valid('remote', 'hybrid', 'office').optional(),
  employmentType: Joi.string().valid('full-time', 'part-time', 'intern', 'contract', 'consultant').optional(),
  joiningDate: Joi.date().optional(),
  probationEndDate: Joi.date().optional().allow(null),
  probationStatus: Joi.string().valid('not-started', 'in-progress', 'completed', 'extended').optional(),
  status: Joi.string().valid('active', 'inactive', 'onboarding', 'terminated', 'resigned').optional(),
  salary: Joi.number().min(0).optional(),
  salaryStructure: Joi.object({
    basic: Joi.number().min(0).optional(),
    hra: Joi.number().min(0).optional(),
    allowances: Joi.number().min(0).optional(),
    pf: Joi.number().min(0).optional(),
    esi: Joi.number().min(0).optional(),
    tds: Joi.number().min(0).optional(),
    netSalary: Joi.number().min(0).optional(),
  }).optional(),
  attendanceSettings: Joi.object({
    gracePeriod: Joi.number().min(0).max(60).optional(),
    requireLocation: Joi.boolean().optional(),
    shift: Joi.string().valid('general', 'morning', 'evening', 'night').optional(),
    shiftTimings: Joi.object({
      startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    }).optional(),
  }).optional(),
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  createEmployee: validate(createEmployeeSchema),
  updateEmployee: validate(updateEmployeeSchema),
};

