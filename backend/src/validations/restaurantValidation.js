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
    // Location address schema
    const addressSchema = Joi.object({
      zipCode: Joi.string()
        .pattern(/^\d{5}-?\d{3}$/)
        .required()
        .messages({
          'string.pattern.base': 'CEP deve ter o formato 12345-123',
          'string.empty': 'CEP é obrigatório',
        }),
      street: Joi.string().trim().min(2).max(255).required().messages({
        'string.empty': 'Logradouro é obrigatório',
        'string.min': 'Logradouro deve ter pelo menos 2 caracteres',
        'string.max': 'Logradouro não pode exceder 255 caracteres',
      }),
      streetNumber: Joi.string().trim().min(1).max(20).required().messages({
        'string.empty': 'Número é obrigatório',
        'string.min': 'Número deve ter pelo menos 1 caractere',
        'string.max': 'Número não pode exceder 20 caracteres',
      }),
      complement: Joi.string().trim().max(100).allow('', null).messages({
        'string.max': 'Complemento não pode exceder 100 caracteres',
      }),
      city: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Cidade é obrigatória',
        'string.min': 'Cidade deve ter pelo menos 2 caracteres',
        'string.max': 'Cidade não pode exceder 100 caracteres',
      }),
      state: Joi.string().trim().min(2).max(50).required().messages({
        'string.empty': 'Estado é obrigatório',
        'string.min': 'Estado deve ter pelo menos 2 caracteres',
        'string.max': 'Estado não pode exceder 50 caracteres',
      }),
    });

    // Operating hours schema (basic validation)
    const operatingHoursSchema = Joi.object().pattern(
      Joi.string(),
      Joi.object({
        open: Joi.string()
          .pattern(/^\d{2}:\d{2}$/)
          .required()
          .messages({
            'string.pattern.base': 'Horário de abertura deve estar no formato HH:MM',
            'string.empty': 'Horário de abertura é obrigatório',
          }),
        close: Joi.string()
          .pattern(/^\d{2}:\d{2}$/)
          .required()
          .messages({
            'string.pattern.base': 'Horário de fechamento deve estar no formato HH:MM',
            'string.empty': 'Horário de fechamento é obrigatório',
          }),
        closed: Joi.boolean().required(),
      })
    );

    // Location schema
    const locationSchema = Joi.object({
      id: Joi.any().optional(), // Accept any id (frontend uses timestamp)
      name: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Nome da Unidade é obrigatório',
        'string.min': 'Nome da Unidade deve ter pelo menos 2 caracteres',
        'string.max': 'Nome da Unidade não pode exceder 100 caracteres',
      }),
      urlName: Joi.string()
        .trim()
        .min(3)
        .max(50)
        .pattern(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/)
        .required()
        .messages({
          'string.empty': 'Nome para URL da Unidade é obrigatório',
          'string.min': 'Nome para URL deve ter pelo menos 3 caracteres',
          'string.max': 'Nome para URL não pode exceder 50 caracteres',
          'string.pattern.base':
            'Nome para URL deve conter apenas letras minúsculas, números e hífens, sem hífens consecutivos',
        }),
      phone: Joi.string().max(20).required().messages({
        'string.max': 'Telefone da Unidade não pode exceder 20 caracteres',
        'string.empty': 'Telefone da Unidade é obrigatório',
      }),
      whatsapp: Joi.string().max(20).allow('', null).messages({
        'string.max': 'WhatsApp da Unidade não pode exceder 20 caracteres',
      }),
      address: addressSchema.required(),
      operatingHours: operatingHoursSchema.required(),
      selectedFeatures: Joi.array().items(Joi.string()).min(1).required().messages({
        'array.min': 'Selecione pelo menos um recurso para a Unidade',
      }),
    });

    return Joi.object({
      restaurant_name: Joi.string().trim().min(2).max(255).required().messages({
        'string.empty': 'Restaurant name is required',
        'string.min': 'Restaurant name must be at least 2 characters long',
        'string.max': 'Restaurant name cannot exceed 255 characters',
      }),

      userPayload: Joi.object().optional().unknown(true), // this  is to allow the register to send the userPayload object with the restaurant data

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

      business_type: Joi.string().valid('single', 'multi').default('single').messages({
        'any.only': 'Business type must be single or multi',
      }),

      cuisine_type: Joi.string().trim().max(100).allow(null).messages({
        'string.max': 'Cuisine type cannot exceed 100 characters',
      }),

      phone: Joi.string().max(20).allow(null).messages({
        'string.max': 'Phone number cannot exceed 20 characters',
      }),

      whatsapp: Joi.string().max(20).allow(null).messages({
        'string.max': 'WhatsApp number cannot exceed 20 characters',
      }),

      website: Joi.string().uri().trim().max(255).allow(null, '').optional().messages({
        'string.uri': 'Please provide a valid website URL',
        'string.max': 'Website URL cannot exceed 255 characters',
      }),

      description: Joi.string().trim().max(2000).allow(null).messages({
        'string.max': 'Description cannot exceed 2000 characters',
      }),

      locations: Joi.array().items(locationSchema).min(1).required().messages({
        'array.base': 'Deve haver pelo menos uma localização',
        'array.min': 'Deve haver pelo menos uma localização',
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
      ['restaurant_name', 'restaurant_url_name', 'terms_accepted', 'locations'],
      (schema) => schema.optional()
    );
  }

  /**
   * Validation schema for updating a restaurant location
   */
  static get locationUpdateSchema() {
    const addressSchema = Joi.object({
      address_zip_code: Joi.string()
        .pattern(/^\d{5}-?\d{3}$/)
        .messages({
          'string.pattern.base': 'CEP deve ter o formato 12345-123',
        }),
      address_street: Joi.string().trim().min(2).max(255).messages({
        'string.min': 'Logradouro deve ter pelo menos 2 caracteres',
        'string.max': 'Logradouro não pode exceder 255 caracteres',
      }),
      address_street_number: Joi.string().trim().min(1).max(20).messages({
        'string.min': 'Número deve ter pelo menos 1 caractere',
        'string.max': 'Número não pode exceder 20 caracteres',
      }),
      address_complement: Joi.string().trim().max(100).allow('', null).messages({
        'string.max': 'Complemento não pode exceder 100 caracteres',
      }),
      address_city: Joi.string().trim().min(2).max(100).messages({
        'string.min': 'Cidade deve ter pelo menos 2 caracteres',
        'string.max': 'Cidade não pode exceder 100 caracteres',
      }),
      address_state: Joi.string().trim().min(2).max(50).messages({
        'string.min': 'Estado deve ter pelo menos 2 caracteres',
        'string.max': 'Estado não pode exceder 50 caracteres',
      }),
    });

    const operatingHoursSchema = Joi.object().pattern(
      Joi.string(),
      Joi.object({
        open_time: Joi.string()
          .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .allow(''),
        close_time: Joi.string()
          .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .allow(''),
        is_closed: Joi.boolean(),
      })
    );

    return Joi.object({
      name: Joi.string().trim().min(1).max(100).messages({
        'string.min': 'Nome da Unidade deve ter pelo menos 1 caractere',
        'string.max': 'Nome da Unidade não pode exceder 100 caracteres',
      }),
      url_name: Joi.string()
        .trim()
        .lowercase()
        .pattern(/^[a-z0-9-]+$/)
        .min(3)
        .max(50)
        .messages({
          'string.pattern.base': 'URL deve conter apenas letras minúsculas, números e hífens',
          'string.min': 'URL deve ter pelo menos 3 caracteres',
          'string.max': 'URL não pode exceder 50 caracteres',
        }),
      phone: Joi.string().trim().min(10).max(20).messages({
        'string.min': 'Telefone deve ter pelo menos 10 caracteres',
        'string.max': 'Telefone não pode exceder 20 caracteres',
      }),
      whatsapp: Joi.string().trim().min(10).max(20).messages({
        'string.min': 'WhatsApp deve ter pelo menos 10 caracteres',
        'string.max': 'WhatsApp não pode exceder 20 caracteres',
      }),
      address: addressSchema,
      operating_hours: operatingHoursSchema,
      selected_features: Joi.array().items(Joi.string()).max(20),
      is_primary: Joi.boolean(),
    });
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

      business_type: Joi.string().valid('single', 'multi').messages({
        'any.only': 'Business type must be single or multi',
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
   * Decode HTML-encoded slashes in a string (e.g., &#x2F; to /)
   * @param {string} str
   * @returns {string}
   */
  static decodeHtmlSlashes(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&#x2F;/g, '/');
  }

  /**
   * Validate restaurant creation data
   * @param {Object} data - Restaurant data to validate
   * @returns {Object} Validation result
   */
  static validateCreate(data) {
    // Decode HTML-encoded slashes in website before validation
    const preprocessed = { ...data };
    if (preprocessed.website) {
      preprocessed.website = this.decodeHtmlSlashes(preprocessed.website);
    }
    return this.createSchema.validate(preprocessed, { abortEarly: false });
  }

  /**
   * Validate restaurant update data
   * @param {Object} data - Restaurant data to validate
   * @returns {Object} Validation result
   */
  static validateUpdate(data) {
    // Decode HTML-encoded slashes in website before validation
    const preprocessed = { ...data };
    if (preprocessed.website) {
      preprocessed.website = this.decodeHtmlSlashes(preprocessed.website);
    }
    return this.updateSchema.validate(preprocessed, { abortEarly: false });
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
