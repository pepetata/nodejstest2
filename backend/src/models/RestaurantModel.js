const BaseModel = require('./BaseModel');
const Joi = require('joi');
const { logger } = require('../utils/logger');

/**
 * Restaurant Model
 * Handles restaurant business information and management
 * Note: Authentication and user management is now handled by UserModel
 */
class RestaurantModel extends BaseModel {
  constructor() {
    super();
    this.tableName = 'restaurants';
    this.sensitiveFields = []; // No sensitive fields in restaurant table
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
      restaurant_name: Joi.string().trim().min(2).max(255).required(),
      restaurant_url_name: Joi.string()
        .lowercase()
        .pattern(/^[a-z0-9-]+$/)
        .min(2)
        .max(100)
        .required(),
      business_type: Joi.string().valid('single', 'chain', 'franchise').default('single'),
      cuisine_type: Joi.string().trim().max(100).allow(null),
      phone: Joi.string()
        .pattern(/^\d{10,20}$/)
        .allow(null),
      whatsapp: Joi.string()
        .pattern(/^\d{10,20}$/)
        .allow(null),
      website: Joi.string().uri().max(255).allow(null),
      description: Joi.string().trim().max(2000).allow(null),
      status: Joi.string().valid('pending', 'active', 'inactive', 'suspended').default('pending'),
      subscription_plan: Joi.string()
        .valid('starter', 'professional', 'premium', 'enterprise')
        .default('starter'),
      subscription_status: Joi.string()
        .valid('active', 'cancelled', 'expired', 'suspended')
        .default('active'),
      subscription_expires_at: Joi.date().iso().allow(null),
      terms_accepted: Joi.boolean().valid(true).required(),
      marketing_consent: Joi.boolean().default(false),
    });
  }

  /**
   * Validation schema for restaurant updates
   */
  get updateSchema() {
    return Joi.object({
      restaurant_name: Joi.string().trim().min(2).max(255),
      restaurant_url_name: Joi.string()
        .lowercase()
        .pattern(/^[a-z0-9-]+$/)
        .min(2)
        .max(100),
      business_type: Joi.string().valid('single', 'chain', 'franchise'),
      cuisine_type: Joi.string().trim().max(100).allow(null),
      phone: Joi.string()
        .pattern(/^\d{10,20}$/)
        .allow(null),
      whatsapp: Joi.string()
        .pattern(/^\d{10,20}$/)
        .allow(null),
      website: Joi.string().uri().max(255).allow(null),
      description: Joi.string().trim().max(2000).allow(null),
      status: Joi.string().valid('pending', 'active', 'inactive', 'suspended'),
      subscription_plan: Joi.string().valid('starter', 'professional', 'premium', 'enterprise'),
      subscription_status: Joi.string().valid('active', 'cancelled', 'expired', 'suspended'),
      subscription_expires_at: Joi.date().iso().allow(null),
      marketing_consent: Joi.boolean(),
    });
  }

  /**
   * Create new restaurant
   * @param {Object} restaurantData - Restaurant data
   * @returns {Object} Created restaurant
   */
  async create(restaurantData) {
    this.logger.info('Creating new restaurant', {
      restaurant_name: restaurantData.restaurant_name,
      restaurant_url_name: restaurantData.restaurant_url_name,
      business_type: restaurantData.business_type,
    });

    try {
      // Validate input data
      const validatedData = await this.validate(restaurantData, this.createSchema);
      this.logger.debug('Restaurant data validation successful', {
        restaurant_name: validatedData.restaurant_name,
        business_type: validatedData.business_type,
      });

      // Set terms accepted timestamp if not provided
      if (validatedData.terms_accepted && !validatedData.terms_accepted_at) {
        validatedData.terms_accepted_at = new Date();
      }

      const columns = Object.keys(validatedData);
      const placeholders = columns.map((_, index) => `$${index + 1}`);
      const values = Object.values(validatedData);

      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING id, restaurant_name, restaurant_url_name, business_type,
                  cuisine_type, phone, whatsapp, website, description,
                  status, subscription_plan, subscription_status, subscription_expires_at,
                  terms_accepted, terms_accepted_at, marketing_consent, created_at, updated_at
      `;

      this.logger.debug('Executing restaurant creation query', {
        columns: columns.length,
        table: this.tableName,
      });

      const result = await this.executeQuery(query, values);
      const restaurant = result.rows[0];

      this.logger.info('Restaurant created successfully', {
        id: restaurant.id,
        restaurant_name: restaurant.restaurant_name,
        status: restaurant.status,
      });

      return restaurant;
    } catch (error) {
      this.logger.error('Failed to create restaurant', {
        restaurant_name: restaurantData.restaurant_name,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Find restaurant by URL name
   * @param {String} urlName - Restaurant URL name
   * @returns {Object|null} Restaurant data
   */
  async findByUrlName(urlName) {
    this.logger.debug('Finding restaurant by URL name', { urlName });

    try {
      const result = await this.find({ restaurant_url_name: urlName.toLowerCase() });
      const restaurant = result.length > 0 ? result[0] : null;

      if (restaurant) {
        this.logger.debug('Restaurant found by URL name', {
          id: restaurant.id.substring(0, 8) + '...',
          restaurant_name: restaurant.restaurant_name,
        });
      } else {
        this.logger.debug('Restaurant not found by URL name', { urlName });
      }

      return restaurant;
    } catch (error) {
      this.logger.error('Failed to find restaurant by URL name', {
        urlName,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
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
        const error = new Error('Invalid restaurant ID format. Must be a valid UUID.');
        error.statusCode = 400;
        throw error;
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
        RETURNING id, restaurant_name, restaurant_url_name, business_type,
                  cuisine_type, phone, whatsapp, website, description,
                  status, subscription_plan, subscription_status, subscription_expires_at,
                  terms_accepted, terms_accepted_at, marketing_consent, created_at, updated_at
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
   * Get restaurants with pagination and filtering
   * @param {Object} filters - Filter conditions
   * @param {Object} pagination - Pagination options
   * @returns {Object} Restaurants and metadata
   */
  async getRestaurants(filters = {}, pagination = {}) {
    this.logger.debug('Getting restaurants with filters and pagination', {
      filters: Object.keys(filters),
      pagination,
    });

    try {
      const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } = pagination;
      const offset = (page - 1) * limit;

      // Validate sort parameters to prevent SQL injection
      const validSortColumns = [
        'created_at',
        'updated_at',
        'restaurant_name',
        'status',
        'business_type',
        'subscription_plan',
      ];
      const validSortOrders = ['ASC', 'DESC'];

      if (!validSortColumns.includes(sortBy)) {
        throw new Error(`Invalid sort column: ${sortBy}`);
      }

      if (!validSortOrders.includes(sortOrder.toUpperCase())) {
        throw new Error(`Invalid sort order: ${sortOrder}`);
      }

      // Build filter conditions
      const conditions = {};
      if (filters.status) conditions.status = filters.status;
      if (filters.business_type) conditions.business_type = filters.business_type;
      if (filters.cuisine_type) conditions.cuisine_type = filters.cuisine_type;
      if (filters.subscription_plan) conditions.subscription_plan = filters.subscription_plan;
      if (filters.subscription_status) conditions.subscription_status = filters.subscription_status;

      // Get total count
      const total = await this.count(conditions);

      // Get restaurants
      const options = {
        limit,
        offset,
        orderBy: `${sortBy} ${sortOrder.toUpperCase()}`,
      };

      const columns = [
        'id',
        'restaurant_name',
        'restaurant_url_name',
        'business_type',
        'cuisine_type',
        'phone',
        'whatsapp',
        'website',
        'description',
        'status',
        'subscription_plan',
        'subscription_status',
        'subscription_expires_at',
        'terms_accepted',
        'terms_accepted_at',
        'marketing_consent',
        'created_at',
        'updated_at',
      ];

      const restaurants = await this.find(conditions, options, columns);

      this.logger.debug('Restaurants retrieved successfully', {
        count: restaurants.length,
        total,
        page,
      });

      return {
        restaurants,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get restaurants', {
        filters,
        pagination,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get restaurant by ID
   * @param {String} id - Restaurant UUID
   * @param {Array} columns - Specific columns to select (optional)
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
        const error = new Error('Invalid restaurant ID format. Must be a valid UUID.');
        error.statusCode = 400;
        throw error;
      }

      const { sanitizedUuid } = this.validateUuid(id);

      const defaultColumns = [
        'id',
        'restaurant_name',
        'restaurant_url_name',
        'business_type',
        'cuisine_type',
        'phone',
        'whatsapp',
        'website',
        'description',
        'status',
        'subscription_plan',
        'subscription_status',
        'subscription_expires_at',
        'terms_accepted',
        'terms_accepted_at',
        'marketing_consent',
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

      return result;
    } catch (error) {
      this.logger.error('Failed to find restaurant by ID', {
        id: id ? id.substring(0, 8) + '...' : null,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete restaurant (soft delete by setting status to inactive)
   * @param {String} id - Restaurant UUID
   * @returns {Boolean} Success status
   */
  async deleteRestaurant(id) {
    this.logger.info('Soft deleting restaurant', {
      id: id ? id.substring(0, 8) + '...' : null,
    });

    try {
      // Validate and sanitize UUID
      if (!this.isValidUuid(id)) {
        const error = new Error('Invalid restaurant ID format. Must be a valid UUID.');
        error.statusCode = 400;
        throw error;
      }

      const { sanitizedUuid } = this.validateUuid(id);

      // Soft delete by setting status to inactive
      const result = await this.update(sanitizedUuid, { status: 'inactive' });

      if (result) {
        this.logger.info('Restaurant soft deleted successfully', {
          id: result.id.substring(0, 8) + '...',
          restaurant_name: result.restaurant_name,
        });
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to delete restaurant', {
        id: id ? id.substring(0, 8) + '...' : null,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Check if restaurant URL name is available
   * @param {String} urlName - Restaurant URL name to check
   * @param {String} excludeId - Restaurant ID to exclude from check (for updates)
   * @returns {Boolean} True if available
   */
  async isUrlNameAvailable(urlName, excludeId = null) {
    this.logger.debug('Checking URL name availability', { urlName, excludeId });

    try {
      const conditions = { restaurant_url_name: urlName.toLowerCase() };

      if (excludeId) {
        if (!this.isValidUuid(excludeId)) {
          throw new Error('Invalid exclude ID format. Must be a valid UUID.');
        }
        const { sanitizedUuid } = this.validateUuid(excludeId);
        conditions.id = { operator: '!=', value: sanitizedUuid };
      }

      const existing = await this.find(conditions, {}, ['id']);
      const isAvailable = existing.length === 0;

      this.logger.debug('URL name availability check completed', {
        urlName,
        isAvailable,
        existingCount: existing.length,
      });

      return isAvailable;
    } catch (error) {
      this.logger.error('Failed to check URL name availability', {
        urlName,
        excludeId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get restaurant statistics
   * @param {String} id - Restaurant UUID
   * @returns {Object} Restaurant statistics
   */
  async getRestaurantStats(id) {
    this.logger.debug('Getting restaurant statistics', {
      id: id ? id.substring(0, 8) + '...' : null,
    });

    try {
      // Validate and sanitize UUID
      if (!this.isValidUuid(id)) {
        const error = new Error('Invalid restaurant ID format. Must be a valid UUID.');
        error.statusCode = 400;
        throw error;
      }

      const { sanitizedUuid } = this.validateUuid(id);

      // Basic stats query - you can expand this based on your needs
      const query = `
        SELECT
          r.id,
          r.restaurant_name,
          r.status,
          r.subscription_plan,
          r.created_at,
          (SELECT COUNT(*) FROM restaurant_locations WHERE restaurant_id = r.id) as location_count
        FROM restaurants r
        WHERE r.id = $1
      `;

      const result = await this.executeQuery(query, [sanitizedUuid]);
      const stats = result.rows[0] || null;

      if (stats) {
        this.logger.debug('Restaurant statistics retrieved successfully', {
          id: stats.id.substring(0, 8) + '...',
          restaurant_name: stats.restaurant_name,
          location_count: stats.location_count,
        });
      } else {
        this.logger.warn('Restaurant not found for statistics', {
          id: sanitizedUuid.substring(0, 8) + '...',
        });
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get restaurant statistics', {
        id: id ? id.substring(0, 8) + '...' : null,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Check if restaurant has active locations
   * @param {String} restaurantId - Restaurant ID
   * @returns {Promise<Boolean>} Whether restaurant has active locations
   */
  async hasActiveLocations(restaurantId) {
    this.logger.debug('Checking for active locations', {
      restaurantId: restaurantId ? restaurantId.substring(0, 8) + '...' : null,
    });

    try {
      // For now, return false as we don't have a locations table implemented
      // In a real application, this would query the locations table
      return false;
    } catch (error) {
      this.logger.error('Failed to check active locations', {
        restaurantId: restaurantId ? restaurantId.substring(0, 8) + '...' : null,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new RestaurantModel();
