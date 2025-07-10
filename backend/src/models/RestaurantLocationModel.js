const BaseModel = require('./BaseModel');
const Joi = require('joi');
const { logger } = require('../utils/logger');

/**
 * Restaurant Location Model
 * Handles restaurant location data for multi-location restaurants
 */
class RestaurantLocationModel extends BaseModel {
  constructor() {
    super();
    this.tableName = 'restaurant_locations';
    this.logger = logger.child({ model: 'RestaurantLocationModel' });
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
   * Validation schema for operating hours
   */
  get operatingHoursSchema() {
    const daySchema = Joi.object({
      open: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: Joi.boolean().default(false),
    });

    return Joi.object({
      monday: daySchema,
      tuesday: daySchema,
      wednesday: daySchema,
      thursday: daySchema,
      friday: daySchema,
      saturday: daySchema,
      sunday: daySchema,
      holidays: daySchema,
    });
  }

  /**
   * Validation schema for location creation
   */
  get createSchema() {
    return Joi.object({
      restaurant_id: Joi.string()
        .uuid({ version: ['uuidv4'] })
        .required(),
      name: Joi.string().trim().min(2).max(255).required(),
      url_name: Joi.string()
        .lowercase()
        .pattern(/^[a-z0-9-]+$/)
        .min(2)
        .max(100)
        .required(),
      phone: Joi.string().max(20).allow('', null),
      whatsapp: Joi.string().max(20).allow('', null),
      address_zip_code: Joi.string().max(10).allow(null),
      address_street: Joi.string().trim().max(255).allow(null),
      address_street_number: Joi.string().max(10).allow(null),
      address_complement: Joi.string().trim().max(255).allow(null, ''),
      address_city: Joi.string().trim().max(100).allow(null),
      address_state: Joi.string().trim().max(50).allow(null),
      operating_hours: this.operatingHoursSchema.required(),
      selected_features: Joi.array().items(Joi.string()).default([]),
      is_primary: Joi.boolean().default(false),
      status: Joi.string().valid('active', 'inactive').default('active'),
    });
  }

  /**
   * Validation schema for location updates
   */
  get updateSchema() {
    return Joi.object({
      name: Joi.string().trim().min(2).max(255),
      url_name: Joi.string()
        .lowercase()
        .pattern(/^[a-z0-9-]+$/)
        .min(2)
        .max(100),
      phone: Joi.string().max(20).allow('', null),
      whatsapp: Joi.string().max(20).allow('', null),
      address_zip_code: Joi.string().max(10).allow(null),
      address_street: Joi.string().trim().max(255).allow(null),
      address_street_number: Joi.string().max(10).allow(null),
      address_complement: Joi.string().trim().max(255).allow(null, ''),
      address_city: Joi.string().trim().max(100).allow(null),
      address_state: Joi.string().trim().max(50).allow(null),
      operating_hours: this.operatingHoursSchema,
      selected_features: Joi.array().items(Joi.string()),
      is_primary: Joi.boolean(),
      status: Joi.string().valid('active', 'inactive'),
    });
  }

  /**
   * Create new restaurant location
   * @param {Object} locationData - Location data
   * @returns {Object} Created location
   */
  async create(locationData) {
    this.logger.info('Creating new restaurant location', {
      restaurant_id: locationData.restaurant_id,
      name: locationData.name,
      url_name: locationData.url_name,
      is_primary: locationData.is_primary,
    });

    try {
      // Validate input data
      const validatedData = await this.validate(locationData, this.createSchema);
      this.logger.debug('Location data validation successful', {
        restaurant_id: validatedData.restaurant_id,
        name: validatedData.name,
      });

      // Check if restaurant exists
      this.logger.debug('Checking if restaurant exists');
      const restaurantExists = await this.checkRestaurantExists(validatedData.restaurant_id);
      if (!restaurantExists) {
        this.logger.warn('Restaurant not found for location creation', {
          restaurant_id: validatedData.restaurant_id,
        });
        throw new Error('Restaurant not found');
      }

      // Check for unique url_name within restaurant
      this.logger.debug('Checking for URL name uniqueness', {
        restaurant_id: validatedData.restaurant_id,
        url_name: validatedData.url_name,
      });
      const existingLocation = await this.findByRestaurantAndUrlName(
        validatedData.restaurant_id,
        validatedData.url_name
      );
      if (existingLocation) {
        this.logger.warn('Location URL name already exists', {
          restaurant_id: validatedData.restaurant_id,
          url_name: validatedData.url_name,
          existing_location_id: existingLocation.id,
        });
        throw new Error('Location URL name already exists for this restaurant');
      }

      // If this is marked as primary, unset other primary locations
      if (validatedData.is_primary) {
        this.logger.debug('Unsetting other primary locations', {
          restaurant_id: validatedData.restaurant_id,
        });
        await this.unsetPrimaryLocations(validatedData.restaurant_id);
      }

      const columns = Object.keys(validatedData);
      const placeholders = columns.map((_, index) => `$${index + 1}`);
      const values = Object.values(validatedData);

      // Convert operating_hours to JSON string
      const operatingHoursIndex = columns.indexOf('operating_hours');
      values[operatingHoursIndex] = JSON.stringify(validatedData.operating_hours);

      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;

      this.logger.debug('Executing location creation query', {
        restaurant_id: validatedData.restaurant_id,
        name: validatedData.name,
      });

      const result = await this.executeQuery(query, values);

      this.logger.info('Restaurant location created successfully', {
        location_id: result.rows[0].id,
        restaurant_id: validatedData.restaurant_id,
        name: validatedData.name,
        is_primary: validatedData.is_primary,
      });

      return result.rows[0];
    } catch (error) {
      this.logger.error('Failed to create restaurant location', {
        restaurant_id: locationData.restaurant_id,
        name: locationData.name,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Update restaurant location
   * @param {Number} id - Location ID
   * @param {Object} updateData - Data to update
   * @returns {Object|null} Updated location
   */
  async update(id, updateData) {
    this.logger.info('Updating restaurant location', {
      location_id: id,
      fields: Object.keys(updateData),
    });

    try {
      // Validate update data
      const validatedData = await this.validate(updateData, this.updateSchema);

      if (Object.keys(validatedData).length === 0) {
        this.logger.warn('No valid fields to update', { location_id: id });
        throw new Error('No valid fields to update');
      }

      // Get current location
      this.logger.debug('Fetching current location data', { location_id: id });
      const currentLocation = await this.findById(id);
      if (!currentLocation) {
        this.logger.warn('Location not found for update', { location_id: id });
        throw new Error('Location not found');
      }

      // Check for unique url_name within restaurant if url_name is being updated
      if (validatedData.url_name) {
        this.logger.debug('Checking URL name uniqueness for update', {
          location_id: id,
          restaurant_id: currentLocation.restaurant_id,
          new_url_name: validatedData.url_name,
        });
        const existingLocation = await this.findByRestaurantAndUrlName(
          currentLocation.restaurant_id,
          validatedData.url_name
        );
        if (existingLocation && existingLocation.id !== id) {
          this.logger.warn('URL name already exists for update', {
            location_id: id,
            existing_location_id: existingLocation.id,
            url_name: validatedData.url_name,
          });
          throw new Error('Location URL name already exists for this restaurant');
        }
      }

      // If this is being marked as primary, unset other primary locations
      if (validatedData.is_primary) {
        this.logger.debug('Unsetting other primary locations for update', {
          location_id: id,
          restaurant_id: currentLocation.restaurant_id,
        });
        await this.unsetPrimaryLocations(currentLocation.restaurant_id, id);
      }

      // Convert operating_hours to JSON string if present
      if (validatedData.operating_hours) {
        this.logger.debug('Converting operating hours to JSON');
        validatedData.operating_hours = JSON.stringify(validatedData.operating_hours);
      }

      const { clause, params } = this.buildSetClause(validatedData);
      const query = `
        UPDATE ${this.tableName}
        SET ${clause}
        WHERE id = $${params.length + 1}
        RETURNING *
      `;

      this.logger.debug('Executing location update query', {
        location_id: id,
        fields: Object.keys(validatedData),
      });

      const result = await this.executeQuery(query, [...params, id]);

      if (result.rows[0]) {
        this.logger.info('Restaurant location updated successfully', {
          location_id: id,
          restaurant_id: currentLocation.restaurant_id,
          updated_fields: Object.keys(validatedData),
        });
      } else {
        this.logger.warn('Location update returned no results', { location_id: id });
      }

      return result.rows[0] || null;
    } catch (error) {
      this.logger.error('Failed to update restaurant location', {
        location_id: id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get locations by restaurant ID
   * @param {String} restaurantId - Restaurant UUID
   * @param {Object} options - Query options
   * @returns {Array} Restaurant locations
   */
  async getByRestaurantId(restaurantId, options = {}) {
    this.logger.info('Getting locations by restaurant ID', {
      restaurant_id: restaurantId,
      options,
    });

    try {
      // Validate and sanitize restaurant UUID
      if (!this.isValidUuid(restaurantId)) {
        this.logger.warn('Invalid restaurant ID format for location retrieval', {
          restaurant_id: restaurantId,
        });
        throw new Error('Invalid restaurant ID format. Must be a valid UUID.');
      }

      const { sanitizedUuid } = this.validateUuid(restaurantId);
      const conditions = { restaurant_id: sanitizedUuid };

      if (options.status) {
        conditions.status = options.status;
        this.logger.debug('Filtering by status', { status: options.status });
      }

      const queryOptions = {
        orderBy: 'is_primary DESC, created_at ASC',
      };

      const locations = await this.find(conditions, queryOptions);

      this.logger.info('Successfully retrieved restaurant locations', {
        restaurant_id: sanitizedUuid,
        location_count: locations.length,
      });

      return locations;
    } catch (error) {
      this.logger.error('Failed to get locations by restaurant ID', {
        restaurant_id: restaurantId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Find location by restaurant ID and URL name
   * @param {String} restaurantId - Restaurant UUID
   * @param {String} urlName - Location URL name
   * @returns {Object|null} Location data
   */
  async findByRestaurantAndUrlName(restaurantId, urlName) {
    this.logger.debug('Finding location by restaurant ID and URL name', {
      restaurant_id: restaurantId,
      url_name: urlName,
    });

    try {
      // Validate and sanitize restaurant UUID
      if (!this.isValidUuid(restaurantId)) {
        this.logger.warn('Invalid restaurant ID format for location search', {
          restaurant_id: restaurantId,
          url_name: urlName,
        });
        throw new Error('Invalid restaurant ID format. Must be a valid UUID.');
      }

      const { sanitizedUuid } = this.validateUuid(restaurantId);

      const conditions = {
        restaurant_id: sanitizedUuid,
        url_name: urlName.toLowerCase(),
      };

      const result = await this.find(conditions);
      const location = result.length > 0 ? result[0] : null;

      this.logger.debug('Location search completed', {
        restaurant_id: sanitizedUuid,
        url_name: urlName,
        found: !!location,
        location_id: location?.id,
      });

      return location;
    } catch (error) {
      this.logger.error('Failed to find location by restaurant and URL name', {
        restaurant_id: restaurantId,
        url_name: urlName,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get primary location for restaurant
   * @param {Number} restaurantId - Restaurant ID
   * @returns {Object|null} Primary location
   */
  async getPrimaryLocation(restaurantId) {
    const conditions = {
      restaurant_id: restaurantId,
      is_primary: true,
      status: 'active',
    };

    const result = await this.find(conditions);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Set location as primary
   * @param {Number} id - Location ID
   * @returns {Object|null} Updated location
   */
  async setPrimary(id) {
    this.logger.info('Setting location as primary', { location_id: id });

    try {
      const location = await this.findById(id);
      if (!location) {
        this.logger.warn('Location not found for primary setting', { location_id: id });
        throw new Error('Location not found');
      }

      // Use transaction to ensure atomicity
      this.logger.debug('Starting transaction for primary location update', {
        location_id: id,
        restaurant_id: location.restaurant_id,
      });
      const client = await this.beginTransaction();

      try {
        // Unset other primary locations
        this.logger.debug('Unsetting other primary locations in transaction', {
          restaurant_id: location.restaurant_id,
          exclude_id: id,
        });
        await this.executeInTransaction(
          client,
          `UPDATE ${this.tableName} SET is_primary = false WHERE restaurant_id = $1 AND id != $2`,
          [location.restaurant_id, id]
        );

        // Set this location as primary
        this.logger.debug('Setting location as primary in transaction', { location_id: id });
        const result = await this.executeInTransaction(
          client,
          `UPDATE ${this.tableName} SET is_primary = true, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 RETURNING *`,
          [id]
        );

        await this.commitTransaction(client);

        this.logger.info('Successfully set location as primary', {
          location_id: id,
          restaurant_id: location.restaurant_id,
        });

        return result.rows[0];
      } catch (error) {
        this.logger.error('Transaction failed for primary location update', {
          location_id: id,
          restaurant_id: location.restaurant_id,
          error: error.message,
        });
        await this.rollbackTransaction(client);
        throw error;
      }
    } catch (error) {
      this.logger.error('Failed to set location as primary', {
        location_id: id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete location (with primary location protection)
   * @param {Number} id - Location ID
   * @returns {Boolean} Success status
   */
  async deleteLocation(id) {
    this.logger.info('Attempting to delete restaurant location', { location_id: id });

    try {
      const location = await this.findById(id);
      if (!location) {
        this.logger.warn('Location not found for deletion', { location_id: id });
        throw new Error('Location not found');
      }

      this.logger.debug('Found location for deletion', {
        location_id: id,
        restaurant_id: location.restaurant_id,
        is_primary: location.is_primary,
        name: location.name,
      });

      // Count total locations for this restaurant
      const totalLocations = await this.count({ restaurant_id: location.restaurant_id });
      this.logger.debug('Checking location count for restaurant', {
        restaurant_id: location.restaurant_id,
        total_locations: totalLocations,
      });

      // Prevent deletion if this is the only location
      if (totalLocations === 1) {
        this.logger.warn('Cannot delete the only location of a restaurant', {
          location_id: id,
          restaurant_id: location.restaurant_id,
        });
        throw new Error('Cannot delete the only location of a restaurant');
      }

      // If this is the primary location, set another location as primary
      if (location.is_primary) {
        this.logger.debug('Deleting primary location, need to set new primary', {
          location_id: id,
          restaurant_id: location.restaurant_id,
        });

        const otherLocations = await this.find({
          restaurant_id: location.restaurant_id,
          id: { operator: '!=', value: id },
          status: 'active',
        });

        if (otherLocations.length > 0) {
          this.logger.debug('Setting new primary location', {
            old_primary_id: id,
            new_primary_id: otherLocations[0].id,
            restaurant_id: location.restaurant_id,
          });
          await this.setPrimary(otherLocations[0].id);
        }
      }

      const deletedCount = await this.delete({ id });
      const success = deletedCount > 0;

      if (success) {
        this.logger.info('Restaurant location deleted successfully', {
          location_id: id,
          restaurant_id: location.restaurant_id,
          was_primary: location.is_primary,
        });
      } else {
        this.logger.warn('Location deletion returned no results', { location_id: id });
      }

      return success;
    } catch (error) {
      this.logger.error('Failed to delete restaurant location', {
        location_id: id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Check if restaurant exists
   * @param {Number} restaurantId - Restaurant ID
   * @returns {Boolean} Existence status
   * @private
   */
  async checkRestaurantExists(restaurantId) {
    const query = 'SELECT 1 FROM restaurants WHERE id = $1';
    const result = await this.executeQuery(query, [restaurantId]);
    return result.rows.length > 0;
  }

  /**
   * Unset primary locations for restaurant
   * @param {Number} restaurantId - Restaurant ID
   * @param {Number} excludeId - Location ID to exclude
   * @private
   */
  async unsetPrimaryLocations(restaurantId, excludeId = null) {
    let query = `UPDATE ${this.tableName} SET is_primary = false WHERE restaurant_id = $1`;
    const params = [restaurantId];

    if (excludeId) {
      query += ` AND id != $2`;
      params.push(excludeId);
    }

    await this.executeQuery(query, params);
  }

  /**
   * Get location statistics for restaurant
   * @param {Number} restaurantId - Restaurant ID
   * @returns {Object} Location statistics
   */
  async getLocationStats(restaurantId) {
    this.logger.info('Getting location statistics', { restaurant_id: restaurantId });

    try {
      const query = `
        SELECT
          COUNT(*) as total_locations,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_locations,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_locations,
          COUNT(CASE WHEN is_primary = true THEN 1 END) as primary_locations
        FROM ${this.tableName}
        WHERE restaurant_id = $1
      `;

      const result = await this.executeQuery(query, [restaurantId]);
      const stats = result.rows[0];

      // Convert string counts to numbers
      Object.keys(stats).forEach((key) => {
        stats[key] = parseInt(stats[key]);
      });

      this.logger.info('Successfully retrieved location statistics', {
        restaurant_id: restaurantId,
        stats,
      });

      return stats;
    } catch (error) {
      this.logger.error('Failed to get location statistics', {
        restaurant_id: restaurantId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Safely get location by ID with detailed error handling
   * @param {Number} id - Location ID
   * @returns {Object} Location data with metadata
   */
  async safeGetById(id) {
    this.logger.info('Safely retrieving location by ID', { location_id: id });

    try {
      if (!id || (typeof id !== 'number' && typeof id !== 'string')) {
        this.logger.warn('Invalid location ID provided', { location_id: id, type: typeof id });
        return {
          success: false,
          error: 'INVALID_ID',
          message: 'Invalid location ID. Must be a valid number or string.',
          location: null,
        };
      }

      const location = await this.findById(id);

      if (!location) {
        this.logger.warn('Location not found for safe retrieval', { location_id: id });
        return {
          success: false,
          error: 'NOT_FOUND',
          message: `Location with ID ${id} not found.`,
          location: null,
        };
      }

      this.logger.info('Location retrieved successfully', {
        location_id: id,
        restaurant_id: location.restaurant_id,
        name: location.name,
      });

      return {
        success: true,
        error: null,
        message: 'Location retrieved successfully.',
        location,
      };
    } catch (error) {
      this.logger.error('Failed to safely retrieve location', {
        location_id: id,
        error: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'An error occurred while retrieving the location.',
        location: null,
      };
    }
  }

  /**
   * Safely find location by restaurant and URL name with detailed error handling
   * @param {String} restaurantId - Restaurant UUID
   * @param {String} urlName - Location URL name
   * @returns {Object} Location data with metadata
   */
  async safeGetByRestaurantAndUrlName(restaurantId, urlName) {
    this.logger.info('Safely finding location by restaurant and URL name', {
      restaurant_id: restaurantId,
      url_name: urlName,
    });

    try {
      if (!restaurantId || !urlName) {
        this.logger.warn('Missing required parameters for location search', {
          restaurant_id: restaurantId,
          url_name: urlName,
        });
        return {
          success: false,
          error: 'MISSING_PARAMETERS',
          message: 'Both restaurant ID and URL name are required.',
          location: null,
        };
      }

      if (!this.isValidUuid(restaurantId)) {
        this.logger.warn('Invalid restaurant ID format for safe location search', {
          restaurant_id: restaurantId,
          url_name: urlName,
        });
        return {
          success: false,
          error: 'INVALID_RESTAURANT_ID',
          message: 'Invalid restaurant ID format. Must be a valid UUID.',
          location: null,
        };
      }

      const location = await this.findByRestaurantAndUrlName(restaurantId, urlName);

      if (!location) {
        this.logger.warn('Location not found by restaurant and URL name', {
          restaurant_id: restaurantId,
          url_name: urlName,
        });
        return {
          success: false,
          error: 'NOT_FOUND',
          message: `Location '${urlName}' not found for this restaurant.`,
          location: null,
        };
      }

      this.logger.info('Location found successfully by restaurant and URL name', {
        restaurant_id: restaurantId,
        url_name: urlName,
        location_id: location.id,
      });

      return {
        success: true,
        error: null,
        message: 'Location found successfully.',
        location,
      };
    } catch (error) {
      this.logger.error('Failed to safely find location by restaurant and URL name', {
        restaurant_id: restaurantId,
        url_name: urlName,
        error: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'An error occurred while searching for the location.',
        location: null,
      };
    }
  }

  /**
   * Check if location exists and is accessible
   * @param {Number} id - Location ID
   * @param {String} restaurantId - Restaurant ID (optional, for additional validation)
   * @returns {Object} Existence check result
   */
  async checkLocationExists(id, restaurantId = null) {
    this.logger.debug('Checking if location exists', {
      location_id: id,
      restaurant_id: restaurantId,
    });

    try {
      const location = await this.findById(id);

      if (!location) {
        this.logger.debug('Location existence check: not found', { location_id: id });
        return {
          exists: false,
          accessible: false,
          reason: 'NOT_FOUND',
          location: null,
        };
      }

      // Additional validation if restaurant ID is provided
      if (restaurantId && location.restaurant_id !== restaurantId) {
        this.logger.warn('Location exists but belongs to different restaurant', {
          location_id: id,
          expected_restaurant_id: restaurantId,
          actual_restaurant_id: location.restaurant_id,
        });
        return {
          exists: true,
          accessible: false,
          reason: 'WRONG_RESTAURANT',
          location: null,
        };
      }

      this.logger.debug('Location existence check: found and accessible', {
        location_id: id,
        restaurant_id: location.restaurant_id,
      });

      return {
        exists: true,
        accessible: true,
        reason: null,
        location,
      };
    } catch (error) {
      this.logger.error('Failed to check location existence', {
        location_id: id,
        restaurant_id: restaurantId,
        error: error.message,
      });

      return {
        exists: false,
        accessible: false,
        reason: 'DATABASE_ERROR',
        location: null,
      };
    }
  }
}

module.exports = new RestaurantLocationModel();
