const { z } = require('zod');
const { validationResult } = require('express-validator');

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const patientSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  cin: z.string().min(3, 'CIN is required'),
  phone: z.string().min(5, 'Phone number is required'),
  birthDate: z.string().optional(),
  address: z.string().optional(),
});

const appointmentSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID format'),
  appointmentDate: z.string().datetime({ message: 'Invalid ISO datetime format' }),
  reason: z.string().min(3, 'Reason is required'),
  notes: z.string().optional(),
});

const validate = (schema) => {
  return async (req, res, next) => {
    if (!schema) {
      return next();
    }

    try {
      if (typeof schema.validate === 'function') {
        const { error } = schema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: error.details[0].message });
        }
      } 
      else if (typeof schema.parse === 'function') {
        schema.parse(req.body);
      }
      else if (Array.isArray(schema)) {
        for (const rule of schema) {
          if (typeof rule.run === 'function') {
            await rule.run(req);
          }
        }
      }

      next();
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Validation failed' });
    }
  };
};

module.exports = { loginSchema, patientSchema, appointmentSchema, validate };