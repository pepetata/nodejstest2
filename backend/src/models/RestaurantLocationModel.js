const BaseModel = require('./BaseModel');
const Joi = require('joi');

/**
 * Restaurant Location Model
 * Handles restaurant location data for multi-location restaurants
 */
class RestaurantLocationModel extends BaseModel {
  constructor() {
    super();
    this.tableName = 'restaurant_locations';
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
    const { error, value } = this.uuidSchema.validate(uuid);

    if (error) {
      throw new Error(`Invalid UUID format: ${error.details[0].message}`);
    }

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
      phone: Joi.string()
        .pattern(/^\d{10,15}$/)
        .allow(null),
      whatsapp: Joi.string()
        .pattern(/^\d{10,15}$/)
        .allow(null),
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
      phone: Joi.string()
        .pattern(/^\d{10,15}$/)
        .allow(null),
      whatsapp: Joi.string()
        .pattern(/^\d{10,15}$/)
        .allow(null),
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
    // Validate input data
    const validatedData = await this.validate(locationData, this.createSchema);

    // Check if restaurant exists
    const restaurantExists = await this.checkRestaurantExists(validatedData.restaurant_id);
    if (!restaurantExists) {
      throw new Error('Restaurant not found');
    }

    // Check for unique url_name within restaurant
    const existingLocation = await this.findByRestaurantAndUrlName(
      validatedData.restaurant_id,
      validatedData.url_name
    );
    if (existingLocation) {
      throw new Error('Location URL name already exists for this restaurant');
    }

    // If this is marked as primary, unset other primary locations
    if (validatedData.is_primary) {
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

    const result = await this.executeQuery(query, values);
    return result.rows[0];
  }

  /**
   * Update restaurant location
   * @param {Number} id - Location ID
   * @param {Object} updateData - Data to update
   * @returns {Object|null} Updated location
   */
  async update(id, updateData) {
    // Validate update data
    const validatedData = await this.validate(updateData, this.updateSchema);

    if (Object.keys(validatedData).length === 0) {
      throw new Error('No valid fields to update');
    }

    // Get current location
    const currentLocation = await this.findById(id);
    if (!currentLocation) {
      throw new Error('Location not found');
    }

    // Check for unique url_name within restaurant if url_name is being updated
    if (validatedData.url_name) {
      const existingLocation = await this.findByRestaurantAndUrlName(
        currentLocation.restaurant_id,
        validatedData.url_name
      );
      if (existingLocation && existingLocation.id !== id) {
        throw new Error('Location URL name already exists for this restaurant');
      }
    }

    // If this is being marked as primary, unset other primary locations
    if (validatedData.is_primary) {
      await this.unsetPrimaryLocations(currentLocation.restaurant_id, id);
    }

    // Convert operating_hours to JSON string if present
    if (validatedData.operating_hours) {
      validatedData.operating_hours = JSON.stringify(validatedData.operating_hours);
    }

    const { clause, params } = this.buildSetClause(validatedData);
    const query = `
      UPDATE ${this.tableName}
      SET ${clause}
      WHERE id = $${params.length + 1}
      RETURNING *
    `;

    const result = await this.executeQuery(query, [...params, id]);
    return result.rows[0] || null;
  }

  /**
   * Get locations by restaurant ID
   * @param {String} restaurantId - Restaurant UUID
   * @param {Object} options - Query options
   * @returns {Array} Restaurant locations
   */
  async getByRestaurantId(restaurantId, options = {}) {
    // Validate and sanitize restaurant UUID
    if (!this.isValidUuid(restaurantId)) {
      throw new Error('Invalid restaurant ID format. Must be a valid UUID.');
    }

    const { sanitizedUuid } = this.validateUuid(restaurantId);
    const conditions = { restaurant_id: sanitizedUuid };

    if (options.status) {
      conditions.status = options.status;
    }

    const queryOptions = {
      orderBy: 'is_primary DESC, created_at ASC',
    };

    return await this.find(conditions, queryOptions);
  }

  /**
   * Find location by restaurant ID and URL name
   * @param {String} restaurantId - Restaurant UUID
   * @param {String} urlName - Location URL name
   * @returns {Object|null} Location data
   */
  async findByRestaurantAndUrlName(restaurantId, urlName) {
    // Validate and sanitize restaurant UUID
    if (!this.isValidUuid(restaurantId)) {
      throw new Error('Invalid restaurant ID format. Must be a valid UUID.');
    }

    const { sanitizedUuid } = this.validateUuid(restaurantId);

    const conditions = {
      restaurant_id: sanitizedUuid,
      url_name: urlName.toLowerCase(),
    };

    const result = await this.find(conditions);
    return result.length > 0 ? result[0] : null;
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
    const location = await this.findById(id);
    if (!location) {
      throw new Error('Location not found');
    }

    // Use transaction to ensure atomicity
    const client = await this.beginTransaction();

    try {
      // Unset other primary locations
      await this.executeInTransaction(
        client,
        `UPDATE ${this.tableName} SET is_primary = false WHERE restaurant_id = $1 AND id != $2`,
        [location.restaurant_id, id]
      );

      // Set this location as primary
      const result = await this.executeInTransaction(
        client,
        `UPDATE ${this.tableName} SET is_primary = true, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 RETURNING *`,
        [id]
      );

      await this.commitTransaction(client);
      return result.rows[0];
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Delete location (with primary location protection)
   * @param {Number} id - Location ID
   * @returns {Boolean} Success status
   */
  async deleteLocation(id) {
    const location = await this.findById(id);
    if (!location) {
      throw new Error('Location not found');
    }

    // Count total locations for this restaurant
    const totalLocations = await this.count({ restaurant_id: location.restaurant_id });

    // Prevent deletion if this is the only location
    if (totalLocations === 1) {
      throw new Error('Cannot delete the only location of a restaurant');
    }

    // If this is the primary location, set another location as primary
    if (location.is_primary) {
      const otherLocations = await this.find({
        restaurant_id: location.restaurant_id,
        id: { operator: '!=', value: id },
        status: 'active',
      });

      if (otherLocations.length > 0) {
        await this.setPrimary(otherLocations[0].id);
      }
    }

    const deletedCount = await this.delete({ id });
    return deletedCount > 0;
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

    return stats;
  }
}

module.exports = new RestaurantLocationModel();
