const Joi = require('joi');

const checkInSchema = Joi.object({
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    address: Joi.string().optional(),
  }).optional(),
  notes: Joi.string().optional().allow(''),
});

const checkOutSchema = Joi.object({
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    address: Joi.string().optional(),
  }).optional(),
  notes: Joi.string().optional().allow(''),
});

const updateAttendanceSchema = Joi.object({
  checkIn: Joi.date().optional(),
  checkOut: Joi.date().optional(),
  status: Joi.string().valid('present', 'absent', 'half-day', 'leave', 'late').optional(),
  notes: Joi.string().optional().allow(''),
  correctionReason: Joi.string().when('checkIn', {
    is: Joi.exist(),
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
});

const getAttendanceSchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  month: Joi.string().pattern(/^\d{4}-\d{2}$/).optional(), // YYYY-MM format
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
  checkIn: validate(checkInSchema),
  checkOut: validate(checkOutSchema),
  updateAttendance: validate(updateAttendanceSchema),
  getAttendance: validateQuery(getAttendanceSchema),
};

