const Joi = require('joi');

/**
 * User Controller Validation Schemas
 * Comprehensive validation schemas for user management endpoints
 */

const userValidationSchemas = {
  // User creation schema
  createUser: Joi.object({
    email: Joi.string()
      .email()
      .when('role', {
        is: Joi.string().valid('restaurant_administrator', 'location_administrator'),
        then: Joi.required(),
        otherwise: Joi.optional().allow(null),
      })
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required for administrator roles',
      }),

    username: Joi.string()
      .alphanum()
      .min(3)
      .max(100)
      .when('email', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        'string.alphanum': 'Username must contain only alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 100 characters',
        'any.required': 'Username is required when email is not provided',
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

    role: Joi.string()
      .valid(
        'restaurant_administrator',
        'location_administrator',
        'waiter',
        'food_runner',
        'kds_operator',
        'pos_operator'
      )
      .required()
      .messages({
        'any.only':
          'Role must be one of: restaurant_administrator, location_administrator, waiter, food_runner, kds_operator, pos_operator',
        'any.required': 'Role is required',
      }),

    restaurant_id: Joi.string()
      .guid({ version: ['uuidv4'] })
      .when('role', {
        is: 'restaurant_administrator',
        then: Joi.required(),
        otherwise: Joi.optional().allow(null),
      })
      .messages({
        'string.guid': 'Restaurant ID must be a valid UUID',
        'any.required': 'Restaurant ID is required for restaurant administrators',
      }),

    status: Joi.string()
      .valid('pending', 'active', 'inactive', 'suspended')
      .default('pending')
      .messages({
        'any.only': 'Status must be one of: pending, active, inactive, suspended',
      }),
  }),

  // User update schema
  updateUser: Joi.object({
    email: Joi.string().email().allow(null).messages({
      'string.email': 'Please provide a valid email address',
    }),

    username: Joi.string().alphanum().min(3).max(100).allow(null).messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 100 characters',
    }),

    full_name: Joi.string().trim().min(2).max(255).messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name cannot exceed 255 characters',
    }),

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
      .valid(
        'restaurant_administrator',
        'location_administrator',
        'waiter',
        'food_runner',
        'kds_operator',
        'pos_operator'
      )
      .optional()
      .messages({
        'any.only':
          'Role filter must be one of: restaurant_administrator, location_administrator, waiter, food_runner, kds_operator, pos_operator',
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
      .valid('created_at', 'updated_at', 'full_name', 'email', 'username', 'status')
      .default('created_at')
      .messages({
        'any.only':
          'Sort by must be one of: created_at, updated_at, full_name, email, username, status',
      }),

    sort_order: Joi.string().valid('asc', 'desc').default('desc').messages({
      'any.only': 'Sort order must be either asc or desc',
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
      .valid(
        'restaurant_administrator',
        'location_administrator',
        'kitchen_manager',
        'server',
        'cook',
        'cashier',
        'delivery_driver'
      )
      .messages({
        'any.only': 'Role must be a valid user role',
      }),

    status: Joi.string().valid('active', 'inactive', 'suspended').messages({
      'any.only': 'Status must be one of: active, inactive, suspended',
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
