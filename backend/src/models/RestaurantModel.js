const BaseModel = require('./BaseModel');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

/**
 * Restaurant Model
 * Handles restaurant registration, authentication, and management
 */
class RestaurantModel extends BaseModel {
  constructor() {
    super();
    this.tableName = 'restaurants';
    this.sensitiveFields = ['password', 'email_confirmation_token'];
    this.logger = logger.child({ model: 'RestaurantModel' });
  }

  /**
   * UUID validation schema
   */
  get uuidSchema() {
    return Joi.string()
      .uuid({ version: ['uuidv4'] })
      .required();
  }

  /**
   * Validate and sanitize UUID
   * @param {String} uuid - UUID string to validate
   * @returns {Object} Validation result with sanitized UUID
   */
  validateUuid(uuid) {
    this.logger.debug('Validating UUID', { uuid: uuid ? uuid.substring(0, 8) + '...' : null });

    const { error, value } = this.uuidSchema.validate(uuid);

    if (error) {
      this.logger.warn('UUID validation failed', {
        uuid: uuid ? uuid.substring(0, 8) + '...' : null,
        error: error.details[0].message,
      });
      throw new Error(`Invalid UUID format: ${error.details[0].message}`);
    }

    this.logger.debug('UUID validation successful');
    return {
      isValid: true,
      sanitizedUuid: value.toLowerCase(), // Ensure lowercase for consistency
    };
  }

  /**
   * Check if a string is a valid UUID v4
   * @param {String} uuid - UUID string to check
   * @returns {Boolean} True if valid UUID v4
   */
  isValidUuid(uuid) {
    try {
      const result = this.validateUuid(uuid);
      return result.isValid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validation schema for restaurant creation
   */
  get createSchema() {
    return Joi.object({
      owner_name: Joi.string().trim().min(2).max(255).required(),
      email: Joi.string().email().lowercase().max(255).required(),
      password: Joi.string().min(8).max(128).required(),
      phone: Joi.string()
        .pattern(/^\d{10,15}$/)
        .allow(null),
      whatsapp: Joi.string()
        .pattern(/^\d{10,15}$/)
        .allow(null),
      restaurant_name: Joi.string().trim().min(2).max(255).required(),
      restaurant_url_name: Joi.string()
        .lowercase()
        .pattern(/^[a-z0-9-]+$/)
        .min(2)
        .max(100)
        .required(),
      business_type: Joi.string().valid('single', 'multi-location').default('single'),
      cuisine_type: Joi.string().trim().max(100).allow(null),
      website: Joi.string().uri().max(255).allow(null),
      description: Joi.string().trim().max(2000).allow(null),
      subscription_plan: Joi.string().valid('starter', 'premium', 'enterprise').default('starter'),
      marketing_consent: Joi.boolean().default(false),
      terms_accepted: Joi.boolean().valid(true).required(),
    });
  }

  /**
   * Validation schema for restaurant updates
   */
  get updateSchema() {
    return Joi.object({
      owner_name: Joi.string().trim().min(2).max(255),
      phone: Joi.string()
        .pattern(/^\d{10,15}$/)
        .allow(null),
      whatsapp: Joi.string()
        .pattern(/^\d{10,15}$/)
        .allow(null),
      restaurant_name: Joi.string().trim().min(2).max(255),
      restaurant_url_name: Joi.string()
        .lowercase()
        .pattern(/^[a-z0-9-]+$/)
        .min(2)
        .max(100),
      business_type: Joi.string().valid('single', 'multi-location'),
      cuisine_type: Joi.string().trim().max(100).allow(null),
      website: Joi.string().uri().max(255).allow(null),
      description: Joi.string().trim().max(2000).allow(null),
      subscription_plan: Joi.string().valid('starter', 'premium', 'enterprise'),
      marketing_consent: Joi.boolean(),
    });
  }

  /**
   * Validation schema for password change
   */
  get passwordSchema() {
    return Joi.object({
      current_password: Joi.string().required(),
      new_password: Joi.string().min(8).max(128).required(),
      confirm_password: Joi.string().valid(Joi.ref('new_password')).required(),
    });
  }

  /**
   * Hash password using bcrypt
   * @param {String} password - Plain text password
   * @returns {String} Hashed password
   */
  async hashPassword(password) {
    const saltRounds = 12; // Higher salt rounds for better security
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password
   * @param {String} password - Plain text password
   * @param {String} hashedPassword - Hashed password from database
   * @returns {Boolean} Password match result
   */
  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate email confirmation token
   * @returns {Object} Token and expiry date
   */
  generateEmailConfirmationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hours from now

    return { token, expires };
  }

  /**
   * Create new restaurant
   * @param {Object} restaurantData - Restaurant data
   * @returns {Object} Created restaurant (sanitized)
   */
  async create(restaurantData) {
    this.logger.info('Creating new restaurant', {
      email: restaurantData.email,
      restaurant_name: restaurantData.restaurant_name,
      restaurant_url_name: restaurantData.restaurant_url_name,
    });

    try {
      // Validate input data
      const validatedData = await this.validate(restaurantData, this.createSchema);
      this.logger.debug('Restaurant data validation successful', {
        email: validatedData.email,
      });

      // Hash password
      this.logger.debug('Hashing password');
      const hashedPassword = await this.hashPassword(validatedData.password);

      // Generate email confirmation token
      this.logger.debug('Generating email confirmation token');
      const { token, expires } = this.generateEmailConfirmationToken();

      // Prepare data for insertion
      const insertData = Object.assign({}, validatedData, {
        password: hashedPassword,
        email_confirmation_token: token,
        email_confirmation_expires: expires,
        terms_accepted_at: new Date(),
        status: 'pending',
      });

      // Remove password from validated data for query building
      delete insertData.password;

      const columns = Object.keys(insertData);
      const placeholders = columns.map((_, index) => `$${index + 1}`);
      const values = Object.values(insertData);

      // Add password back to values array at correct position
      const passwordIndex = columns.indexOf('owner_name'); // Insert after owner_name
      columns.splice(passwordIndex + 1, 0, 'password');
      placeholders.splice(passwordIndex + 1, 0, `$${passwordIndex + 2}`);
      values.splice(passwordIndex + 1, 0, hashedPassword);

      // Update placeholders after password insertion
      for (let i = passwordIndex + 2; i < placeholders.length; i++) {
        placeholders[i] = `$${i + 1}`;
      }

      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING id, owner_name, email, email_confirmed, restaurant_name,
                  restaurant_url_name, business_type, cuisine_type, website,
                  description, subscription_plan, marketing_consent, terms_accepted,
                  status, created_at, updated_at
      `;

      this.logger.debug('Executing restaurant creation query', {
        columns: columns.length,
        table: this.tableName,
      });

      const result = await this.executeQuery(query, values);
      const restaurant = result.rows[0];

      this.logger.info('Restaurant created successfully', {
        id: restaurant.id,
        email: restaurant.email,
        restaurant_name: restaurant.restaurant_name,
        status: restaurant.status,
      });

      // Return sanitized restaurant data with confirmation token for email sending
      return Object.assign({}, restaurant, {
        email_confirmation_token: token,
        email_confirmation_expires: expires,
      });
    } catch (error) {
      this.logger.error('Failed to create restaurant', {
        email: restaurantData.email,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Find restaurant by email
   * @param {String} email - Restaurant email
   * @param {Boolean} includePassword - Whether to include password field
   * @returns {Object|null} Restaurant data
   */
  async findByEmail(email, includePassword = false) {
    const columns = includePassword
      ? ['*']
      : [
          'id',
          'owner_name',
          'email',
          'email_confirmed',
          'restaurant_name',
          'restaurant_url_name',
          'business_type',
          'cuisine_type',
          'website',
          'description',
          'subscription_plan',
          'marketing_consent',
          'terms_accepted',
          'status',
          'created_at',
          'updated_at',
        ];

    const result = await this.find({ email: email.toLowerCase() }, {}, columns);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find restaurant by URL name
   * @param {String} urlName - Restaurant URL name
   * @returns {Object|null} Restaurant data
   */
  async findByUrlName(urlName) {
    const result = await this.find({ restaurant_url_name: urlName.toLowerCase() });
    return result.length > 0 ? this.sanitizeOutput(result[0], this.sensitiveFields) : null;
  }

  /**
   * Authenticate restaurant
   * @param {String} email - Restaurant email
   * @param {String} password - Plain text password
   * @returns {Object|null} Restaurant data if authenticated
   */
  async authenticate(email, password) {
    this.logger.info('Attempting restaurant authentication', { email });

    try {
      const restaurant = await this.findByEmail(email, true);

      if (!restaurant) {
        this.logger.warn('Authentication failed - restaurant not found', { email });
        return null;
      }

      this.logger.debug('Restaurant found, verifying password', {
        id: restaurant.id,
        email: restaurant.email,
        status: restaurant.status,
      });

      const isValidPassword = await this.verifyPassword(password, restaurant.password);

      if (!isValidPassword) {
        this.logger.warn('Authentication failed - invalid password', {
          id: restaurant.id,
          email: restaurant.email,
        });
        return null;
      }

      this.logger.info('Restaurant authentication successful', {
        id: restaurant.id,
        email: restaurant.email,
        restaurant_name: restaurant.restaurant_name,
        status: restaurant.status,
      });

      // Return sanitized restaurant data
      return this.sanitizeOutput(restaurant, this.sensitiveFields);
    } catch (error) {
      this.logger.error('Authentication process failed', {
        email,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Confirm email address
   * @param {String} token - Email confirmation token
   * @returns {Object|null} Updated restaurant data
   */
  async confirmEmail(token) {
    const restaurant = await this.find({
      email_confirmation_token: token,
      email_confirmed: false,
      email_confirmation_expires: { operator: '>', value: new Date() },
    });

    if (restaurant.length === 0) {
      return null;
    }

    const updateData = {
      email_confirmed: true,
      email_confirmation_token: null,
      email_confirmation_expires: null,
      status: 'active',
    };

    const { clause, params } = this.buildSetClause(updateData);
    const query = `
      UPDATE ${this.tableName}
      SET ${clause}
      WHERE id = $${params.length + 1}
      RETURNING id, owner_name, email, email_confirmed, restaurant_name,
                restaurant_url_name, business_type, cuisine_type, website,
                description, subscription_plan, marketing_consent, terms_accepted,
                status, created_at, updated_at
    `;

    const result = await this.executeQuery(query, [...params, restaurant[0].id]);
    return result.rows[0];
  }

  /**
   * Update restaurant data
   * @param {String} id - Restaurant UUID
   * @param {Object} updateData - Data to update
   * @returns {Object|null} Updated restaurant data
   */
  async update(id, updateData) {
    this.logger.info('Updating restaurant', {
      id: id ? id.substring(0, 8) + '...' : null,
      fields: Object.keys(updateData),
    });

    try {
      // Validate and sanitize UUID
      if (!this.isValidUuid(id)) {
        throw new Error('Invalid restaurant ID format. Must be a valid UUID.');
      }

      const { sanitizedUuid } = this.validateUuid(id);

      // Validate update data
      const validatedData = await this.validate(updateData, this.updateSchema);
      this.logger.debug('Update data validation successful', {
        id: sanitizedUuid.substring(0, 8) + '...',
        validatedFields: Object.keys(validatedData),
      });

      if (Object.keys(validatedData).length === 0) {
        this.logger.warn('Update attempted with no valid fields', {
          id: sanitizedUuid.substring(0, 8) + '...',
          originalFields: Object.keys(updateData),
        });
        throw new Error('No valid fields to update');
      }

      const { clause, params } = this.buildSetClause(validatedData);
      const query = `
        UPDATE ${this.tableName}
        SET ${clause}
        WHERE id = $${params.length + 1}
        RETURNING id, owner_name, email, email_confirmed, restaurant_name,
                  restaurant_url_name, business_type, cuisine_type, website,
                  description, subscription_plan, marketing_consent, terms_accepted,
                  status, created_at, updated_at
      `;

      this.logger.debug('Executing restaurant update query', {
        id: sanitizedUuid.substring(0, 8) + '...',
        fieldsToUpdate: Object.keys(validatedData).length,
      });

      const result = await this.executeQuery(query, [...params, sanitizedUuid]);
      const updatedRestaurant = result.rows[0];

      if (updatedRestaurant) {
        this.logger.info('Restaurant updated successfully', {
          id: updatedRestaurant.id.substring(0, 8) + '...',
          restaurant_name: updatedRestaurant.restaurant_name,
          fieldsUpdated: Object.keys(validatedData),
        });
      } else {
        this.logger.warn('Restaurant update completed but no restaurant returned', {
          id: sanitizedUuid.substring(0, 8) + '...',
        });
      }

      return updatedRestaurant || null;
    } catch (error) {
      this.logger.error('Failed to update restaurant', {
        id: id ? id.substring(0, 8) + '...' : null,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Change restaurant password
   * @param {String} id - Restaurant UUID
   * @param {Object} passwordData - Password change data
   * @returns {Boolean} Success status
   */
  async changePassword(id, passwordData) {
    this.logger.info('Changing restaurant password', {
      id: id ? id.substring(0, 8) + '...' : null,
    });

    try {
      // Validate and sanitize UUID
      if (!this.isValidUuid(id)) {
        throw new Error('Invalid restaurant ID format. Must be a valid UUID.');
      }

      const { sanitizedUuid } = this.validateUuid(id);

      // Validate password data
      const validatedData = await this.validate(passwordData, this.passwordSchema);
      this.logger.debug('Password change data validation successful', {
        id: sanitizedUuid.substring(0, 8) + '...',
      });

      // Get current restaurant data with password
      const restaurant = await this.findById(sanitizedUuid, ['id', 'password']);
      if (!restaurant) {
        this.logger.warn('Password change failed - restaurant not found', {
          id: sanitizedUuid.substring(0, 8) + '...',
        });
        throw new Error('Restaurant not found');
      }

      this.logger.debug('Restaurant found, verifying current password', {
        id: restaurant.id.substring(0, 8) + '...',
      });

      // Verify current password
      const isValidPassword = await this.verifyPassword(
        validatedData.current_password,
        restaurant.password
      );

      if (!isValidPassword) {
        this.logger.warn('Password change failed - current password incorrect', {
          id: restaurant.id.substring(0, 8) + '...',
        });
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      this.logger.debug('Hashing new password', {
        id: restaurant.id.substring(0, 8) + '...',
      });
      const hashedPassword = await this.hashPassword(validatedData.new_password);

      // Update password
      const query = `
        UPDATE ${this.tableName}
        SET password = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;

      this.logger.debug('Executing password update query', {
        id: restaurant.id.substring(0, 8) + '...',
      });

      await this.executeQuery(query, [hashedPassword, sanitizedUuid]);

      this.logger.info('Restaurant password changed successfully', {
        id: restaurant.id.substring(0, 8) + '...',
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to change restaurant password', {
        id: id ? id.substring(0, 8) + '...' : null,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get restaurants with pagination and filtering
   * @param {Object} filters - Filter conditions
   * @param {Object} pagination - Pagination options
   * @returns {Object} Restaurants and metadata
   */
  async getRestaurants(filters = {}, pagination = {}) {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } = pagination;
    const offset = (page - 1) * limit;

    // Build filter conditions
    const conditions = {};
    if (filters.status) conditions.status = filters.status;
    if (filters.business_type) conditions.business_type = filters.business_type;
    if (filters.cuisine_type) conditions.cuisine_type = filters.cuisine_type;
    if (filters.subscription_plan) conditions.subscription_plan = filters.subscription_plan;

    // Get total count
    const total = await this.count(conditions);

    // Get restaurants
    const options = {
      limit,
      offset,
      orderBy: `${sortBy} ${sortOrder}`,
    };

    const columns = [
      'id',
      'owner_name',
      'email',
      'email_confirmed',
      'restaurant_name',
      'restaurant_url_name',
      'business_type',
      'cuisine_type',
      'website',
      'description',
      'subscription_plan',
      'marketing_consent',
      'terms_accepted',
      'status',
      'created_at',
      'updated_at',
    ];

    const restaurants = await this.find(conditions, options, columns);

    return {
      restaurants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get restaurant by ID (sanitized output)
   * @param {String} id - Restaurant UUID
   * @returns {Object|null} Restaurant data
   */
  async findById(id, columns = null) {
    this.logger.debug('Finding restaurant by ID', {
      id: id ? id.substring(0, 8) + '...' : null,
      includeColumns: columns ? columns.length : 'default',
    });

    try {
      // Validate and sanitize UUID
      if (!this.isValidUuid(id)) {
        throw new Error('Invalid restaurant ID format. Must be a valid UUID.');
      }

      const { sanitizedUuid } = this.validateUuid(id);

      const defaultColumns = [
        'id',
        'owner_name',
        'email',
        'email_confirmed',
        'restaurant_name',
        'restaurant_url_name',
        'business_type',
        'cuisine_type',
        'website',
        'description',
        'subscription_plan',
        'marketing_consent',
        'terms_accepted',
        'status',
        'created_at',
        'updated_at',
      ];

      const selectColumns = columns || defaultColumns;
      this.logger.debug('Executing findById query', {
        id: sanitizedUuid.substring(0, 8) + '...',
        columns: selectColumns.length,
      });

      const result = await super.findById(sanitizedUuid, selectColumns);

      if (result) {
        this.logger.debug('Restaurant found successfully', {
          id: result.id.substring(0, 8) + '...',
          restaurant_name: result.restaurant_name,
          status: result.status,
        });
      } else {
        this.logger.info('Restaurant not found', {
          id: sanitizedUuid.substring(0, 8) + '...',
        });
      }

      return result ? this.sanitizeOutput(result, this.sensitiveFields) : null;
    } catch (error) {
      this.logger.error('Failed to find restaurant by ID', {
        id: id ? id.substring(0, 8) + '...' : null,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

module.exports = new RestaurantModel();
