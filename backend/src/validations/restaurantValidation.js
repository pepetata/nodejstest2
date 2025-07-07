const Joi = require('joi');

/**
 * Restaurant Validation Schemas
 * Comprehensive validation for restaurant operations
 */
class RestaurantValidation {
  /**
   * Validation schema for creating a restaurant
   */
  static get createSchema() {
    return Joi.object({
      restaurant_name: Joi.string().trim().min(2).max(255).required().messages({
        'string.empty': 'Restaurant name is required',
        'string.min': 'Restaurant name must be at least 2 characters long',
        'string.max': 'Restaurant name cannot exceed 255 characters',
      }),

      restaurant_url_name: Joi.string()
        .trim()
        .lowercase()
        .min(2)
        .max(100)
        .pattern(/^[a-z0-9-]+$/)
        .required()
        .messages({
          'string.empty': 'URL name is required',
          'string.min': 'URL name must be at least 2 characters long',
          'string.max': 'URL name cannot exceed 100 characters',
          'string.pattern.base':
            'URL name can only contain lowercase letters, numbers, and hyphens',
        }),

      business_type: Joi.string().valid('single', 'chain', 'franchise').default('single').messages({
        'any.only': 'Business type must be single, chain, or franchise',
      }),

      cuisine_type: Joi.string().trim().max(100).allow(null).messages({
        'string.max': 'Cuisine type cannot exceed 100 characters',
      }),

      phone: Joi.string()
        .pattern(/^\d{10,20}$/)
        .allow(null)
        .messages({
          'string.pattern.base':
            'Phone number must contain only digits and be 10-20 characters long',
        }),

      whatsapp: Joi.string()
        .pattern(/^\d{10,20}$/)
        .allow(null)
        .messages({
          'string.pattern.base':
            'WhatsApp number must contain only digits and be 10-20 characters long',
        }),

      website: Joi.string().uri().trim().max(255).allow(null).messages({
        'string.uri': 'Please provide a valid website URL',
        'string.max': 'Website URL cannot exceed 255 characters',
      }),

      description: Joi.string().trim().max(2000).allow(null).messages({
        'string.max': 'Description cannot exceed 2000 characters',
      }),

      status: Joi.string()
        .valid('pending', 'active', 'inactive', 'suspended')
        .default('pending')
        .messages({
          'any.only': 'Status must be pending, active, inactive, or suspended',
        }),

      subscription_plan: Joi.string()
        .valid('starter', 'professional', 'premium', 'enterprise')
        .default('starter')
        .messages({
          'any.only': 'Subscription plan must be starter, professional, premium, or enterprise',
        }),

      subscription_status: Joi.string()
        .valid('active', 'cancelled', 'expired', 'suspended')
        .default('active')
        .messages({
          'any.only': 'Subscription status must be active, cancelled, expired, or suspended',
        }),

      subscription_expires_at: Joi.date().iso().allow(null).messages({
        'date.format': 'Subscription expiry date must be in ISO format',
      }),

      terms_accepted: Joi.boolean().valid(true).required().messages({
        'any.only': 'Terms and conditions must be accepted',
        'any.required': 'Terms acceptance is required',
      }),

      marketing_consent: Joi.boolean().default(false),
    });
  }

  /**
   * Validation schema for updating a restaurant
   */
  static get updateSchema() {
    return this.createSchema.fork(
      ['restaurant_name', 'restaurant_url_name', 'terms_accepted'],
      (schema) => schema.optional()
    );
  }

  /**
   * Validation schema for restaurant query parameters
   */
  static get querySchema() {
    return Joi.object({
      page: Joi.number().integer().min(1).default(1).messages({
        'number.min': 'Page must be at least 1',
      }),

      limit: Joi.number().integer().min(1).max(100).default(10).messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100',
      }),

      status: Joi.string().valid('pending', 'active', 'inactive', 'suspended').messages({
        'any.only': 'Status must be pending, active, inactive, or suspended',
      }),

      business_type: Joi.string().valid('single', 'chain', 'franchise').messages({
        'any.only': 'Business type must be single, chain, or franchise',
      }),

      cuisine_type: Joi.string().trim().max(100).messages({
        'string.max': 'Cuisine type cannot exceed 100 characters',
      }),

      subscription_plan: Joi.string()
        .valid('starter', 'professional', 'premium', 'enterprise')
        .messages({
          'any.only': 'Subscription plan must be starter, professional, premium, or enterprise',
        }),

      subscription_status: Joi.string()
        .valid('active', 'cancelled', 'expired', 'suspended')
        .messages({
          'any.only': 'Subscription status must be active, cancelled, expired, or suspended',
        }),

      sortBy: Joi.string()
        .valid('restaurant_name', 'status', 'business_type', 'created_at', 'updated_at')
        .default('created_at')
        .messages({
          'any.only':
            'Sort by must be one of: restaurant_name, status, business_type, created_at, updated_at',
        }),

      sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC').messages({
        'any.only': 'Sort order must be either ASC or DESC',
      }),
    });
  }

  /**
   * Validation schema for UUID parameters
   */
  static get uuidSchema() {
    return Joi.string()
      .uuid({ version: ['uuidv4'] })
      .required()
      .messages({
        'string.guid': 'Please provide a valid UUID',
        'string.empty': 'ID is required',
      });
  }

  /**
   * Validation schema for URL name parameter
   */
  static get urlNameSchema() {
    return Joi.string()
      .trim()
      .lowercase()
      .min(2)
      .max(100)
      .pattern(/^[a-z0-9-]+$/)
      .required()
      .messages({
        'string.empty': 'URL name is required',
        'string.min': 'URL name must be at least 2 characters long',
        'string.max': 'URL name cannot exceed 100 characters',
        'string.pattern.base': 'URL name can only contain lowercase letters, numbers, and hyphens',
      });
  }

  /**
   * Validate restaurant creation data
   * @param {Object} data - Restaurant data to validate
   * @returns {Object} Validation result
   */
  static validateCreate(data) {
    return this.createSchema.validate(data, { abortEarly: false });
  }

  /**
   * Validate restaurant update data
   * @param {Object} data - Restaurant data to validate
   * @returns {Object} Validation result
   */
  static validateUpdate(data) {
    return this.updateSchema.validate(data, { abortEarly: false });
  }

  /**
   * Validate query parameters
   * @param {Object} query - Query parameters to validate
   * @returns {Object} Validation result
   */
  static validateQuery(query) {
    return this.querySchema.validate(query, { abortEarly: false });
  }

  /**
   * Validate UUID parameter
   * @param {String} uuid - UUID to validate
   * @returns {Object} Validation result
   */
  static validateUuid(uuid) {
    return this.uuidSchema.validate(uuid);
  }

  /**
   * Validate URL name parameter
   * @param {String} urlName - URL name to validate
   * @returns {Object} Validation result
   */
  static validateUrlName(urlName) {
    return this.urlNameSchema.validate(urlName);
  }
}

module.exports = RestaurantValidation;
