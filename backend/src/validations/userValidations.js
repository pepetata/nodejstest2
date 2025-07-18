const Joi = require('joi');

/**
 * User Controller Validation Schemas
 * Comprehensive validation schemas for user management endpoints
 */

const userValidationSchemas = {
  // User creation schema
  createUser: Joi.object({
    email: Joi.string().email().optional().allow(null, '').messages({
      'string.email': 'Please provide a valid email address',
    }),

    username: Joi.string().alphanum().min(3).max(100).optional().allow(null, '').messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 100 characters',
    }),

    password: Joi.string()
      .min(8)
      .max(255)
      // .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 255 characters',
        'string.pattern.base':
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required',
      }),

    full_name: Joi.string().trim().min(2).max(255).required().messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name cannot exceed 255 characters',
      'any.required': 'Full name is required',
    }),

    role_location_pairs: Joi.array()
      .items(
        Joi.object({
          role_id: Joi.string().uuid().required(),
          location_id: Joi.string().uuid().required(),
        })
      )
      .min(1)
      .required()
      .messages({
        'array.min': 'Role is required',
        'any.required': 'Role is required',
      }),

    restaurant_id: Joi.string()
      .guid({ version: ['uuidv4'] })
      .optional()
      .allow(null)
      .messages({
        'string.guid': 'Restaurant ID must be a valid UUID',
      }),

    status: Joi.string()
      .valid('pending', 'active', 'inactive', 'suspended')
      .default('pending')
      .messages({
        'any.only': 'Status must be one of: pending, active, inactive, suspended',
      }),

    phone: Joi.string().allow(null, ''),
    whatsapp: Joi.string().allow(null, ''),
  }),

  // User update schema
  updateUser: Joi.object({
    email: Joi.string().email().allow(null, '').messages({
      'string.email': 'Please provide a valid email address',
    }),

    username: Joi.string().alphanum().min(3).max(100).allow(null, '').messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 100 characters',
    }),

    full_name: Joi.string().trim().min(2).max(255).messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name cannot exceed 255 characters',
    }),

    // Support for new role_location_pairs format
    role_location_pairs: Joi.array()
      .items(
        Joi.object({
          role_id: Joi.string()
            .guid({ version: ['uuidv4'] })
            .required()
            .messages({
              'string.guid': 'Role ID must be a valid UUID',
              'any.required': 'Role ID is required',
            }),
          location_id: Joi.string()
            .guid({ version: ['uuidv4'] })
            .required()
            .messages({
              'string.guid': 'Location ID must be a valid UUID',
              'any.required': 'Location ID is required',
            }),
        })
      )
      .min(1)
      .messages({
        'array.min': 'At least one role-location pair is required',
      }),

    // Legacy role field for backward compatibility
    role: Joi.string()
      .valid(
        'restaurant_administrator',
        'location_administrator',
        'waiter',
        'food_runner',
        'kds_operator',
        'pos_operator'
      )
      .messages({
        'any.only':
          'Role must be one of: restaurant_administrator, location_administrator, waiter, food_runner, kds_operator, pos_operator',
      }),

    restaurant_id: Joi.string()
      .guid({ version: ['uuidv4'] })
      .allow(null)
      .messages({
        'string.guid': 'Restaurant ID must be a valid UUID',
      }),

    status: Joi.string().valid('pending', 'active', 'inactive', 'suspended').messages({
      'any.only': 'Status must be one of: pending, active, inactive, suspended',
    }),

    email_confirmed: Joi.boolean().messages({
      'boolean.base': 'Email confirmed must be a boolean value',
    }),

    phone: Joi.string().allow('', null).messages({
      'string.base': 'Phone must be a string',
    }),

    whatsapp: Joi.string().allow('', null).messages({
      'string.base': 'WhatsApp must be a string',
    }),

    password: Joi.string().min(8).max(255).messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 255 characters',
    }),

    is_active: Joi.boolean().messages({
      'boolean.base': 'Is active must be a boolean value',
    }),

    is_admin: Joi.boolean().messages({
      'boolean.base': 'Is admin must be a boolean value',
    }),
  })
    .min(1)
    .messages({
      'object.min': 'At least one field must be provided for update',
    }),

  // Password change schema
  changePassword: Joi.object({
    current_password: Joi.string().required().messages({
      'any.required': 'Current password is required',
    }),

    new_password: Joi.string()
      .min(8)
      .max(255)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.max': 'New password cannot exceed 255 characters',
        'string.pattern.base':
          'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required',
      }),

    confirm_password: Joi.string().valid(Joi.ref('new_password')).required().messages({
      'any.only': 'Password confirmation must match the new password',
      'any.required': 'Password confirmation is required',
    }),

    email_confirmation_token: Joi.string(),
  }),

  // Query parameters schema
  getUsersQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),

    limit: Joi.number().integer().min(1).max(100).default(20).messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),

    search: Joi.string().max(255).optional().messages({
      'string.max': 'Search term cannot exceed 255 characters',
    }),

    role: Joi.string()
      .guid({ version: ['uuidv4'] })
      .optional()
      .messages({
        'string.guid': 'Role ID must be a valid UUID',
      }),

    status: Joi.string().valid('pending', 'active', 'inactive', 'suspended').optional().messages({
      'any.only': 'Status filter must be one of: pending, active, inactive, suspended',
    }),

    restaurant_id: Joi.string()
      .guid({ version: ['uuidv4'] })
      .optional()
      .messages({
        'string.guid': 'Restaurant ID must be a valid UUID',
      }),

    sort_by: Joi.string()
      .valid(
        'created_at',
        'updated_at',
        'full_name',
        'email',
        'username',
        'status',
        'last_login_at'
      )
      .default('full_name')
      .messages({
        'any.only':
          'Sort by must be one of: created_at, updated_at, full_name, email, username, status, last_login_at',
      }),

    sort_order: Joi.string().valid('asc', 'desc').default('asc').messages({
      'any.only': 'Sort order must be either asc or desc',
    }),

    // Frontend parameter names (for compatibility)
    sortBy: Joi.string()
      .valid(
        'created_at',
        'updated_at',
        'full_name',
        'email',
        'username',
        'status',
        'last_login_at'
      )
      .optional()
      .messages({
        'any.only':
          'Sort by must be one of: created_at, updated_at, full_name, email, username, status, last_login_at',
      }),

    sortOrder: Joi.string().valid('asc', 'desc').optional().messages({
      'any.only': 'Sort order must be either asc or desc',
    }),

    // Location filter parameter
    location: Joi.string()
      .guid({ version: ['uuidv4'] })
      .optional()
      .messages({
        'string.guid': 'Location ID must be a valid UUID',
      }),
  }),

  // UUID parameter schema
  userIdParam: Joi.object({
    id: Joi.string()
      .guid({ version: ['uuidv4'] })
      .required()
      .messages({
        'string.guid': 'User ID must be a valid UUID',
        'any.required': 'User ID is required',
      }),
  }),

  // Email confirmation schema
  confirmEmail: Joi.object({
    token: Joi.string().length(64).hex().required().messages({
      'string.length': 'Confirmation token must be exactly 64 characters',
      'string.hex': 'Confirmation token must be a valid hexadecimal string',
      'any.required': 'Confirmation token is required',
    }),
  }),

  // Password reset request schema
  requestPasswordReset: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  }),

  // Password reset schema
  resetPassword: Joi.object({
    token: Joi.string().length(64).hex().required().messages({
      'string.length': 'Reset token must be exactly 64 characters',
      'string.hex': 'Reset token must be a valid hexadecimal string',
      'any.required': 'Reset token is required',
    }),

    new_password: Joi.string()
      .min(8)
      .max(255)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 255 characters',
        'string.pattern.base':
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required',
      }),

    confirm_password: Joi.string().valid(Joi.ref('new_password')).required().messages({
      'any.only': 'Password confirmation must match the new password',
      'any.required': 'Password confirmation is required',
    }),
  }),

  // Get users by restaurant validation
  getUsersByRestaurant: Joi.object({
    restaurantId: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
      'string.guid': 'Restaurant ID must be a valid UUID',
      'any.required': 'Restaurant ID is required',
    }),
  }),

  // Get users by restaurant query validation
  getUsersByRestaurantQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),

    limit: Joi.number().integer().min(1).max(100).default(20).messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),

    role: Joi.string()
      .guid({ version: ['uuidv4'] })
      .optional()
      .messages({
        'string.guid': 'Role ID must be a valid UUID',
      }),

    status: Joi.string().valid('active', 'inactive', 'suspended', 'pending').messages({
      'any.only': 'Status must be one of: active, inactive, suspended, pending',
    }),

    search: Joi.string().min(1).max(100).messages({
      'string.min': 'Search term must be at least 1 character',
      'string.max': 'Search term cannot exceed 100 characters',
    }),
  }),

  // Resend confirmation email schema
  resendConfirmation: Joi.object({
    email_confirmation_token: Joi.string(),
    email: Joi.string().email(),
  })
    .or('email_confirmation_token', 'email')
    .messages({
      'object.missing': 'O token de confirmação ou e-mail é obrigatório.',
    }),
};

module.exports = userValidationSchemas;
