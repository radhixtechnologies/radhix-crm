const Joi = require('joi');

const createLeaveSchema = Joi.object({
  type: Joi.string().valid('sick', 'casual', 'annual', 'maternity', 'paternity', 'unpaid').required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  halfDay: Joi.boolean().optional(),
  halfDayType: Joi.string().valid('first-half', 'second-half').when('halfDay', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  reason: Joi.string().required().min(10).max(500),
  documentUrl: Joi.string().uri().optional().allow(''),
});

const updateLeaveSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected', 'cancelled').required(),
  comments: Joi.string().optional().allow(''),
  rejectionReason: Joi.string().when('status', {
    is: 'rejected',
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
});

const getLeaveSchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled').optional(),
  type: Joi.string().valid('sick', 'casual', 'annual', 'maternity', 'paternity', 'unpaid').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  employee: Joi.string().hex().length(24).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
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

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
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

    req.query = value;
    next();
  };
};

module.exports = {
  createLeave: validate(createLeaveSchema),
  updateLeave: validate(updateLeaveSchema),
  getLeaves: validateQuery(getLeaveSchema),
};

