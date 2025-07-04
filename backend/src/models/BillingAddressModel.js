const BaseModel = require('./BaseModel');
const Joi = require('joi');

/**
 * Billing Address Model
 * Handles billing address data for restaurants
 */
class BillingAddressModel extends BaseModel {
  constructor() {
    super();
    this.tableName = 'billing_addresses';
  }

  /**
   * Validation schema for billing address creation/update
   */
  get schema() {
    return Joi.object({
      restaurant_id: Joi.number().integer().positive().required(),
      zip_code: Joi.string().max(10).allow(null),
      street: Joi.string().trim().max(255).allow(null),
      street_number: Joi.string().max(10).allow(null),
      complement: Joi.string().trim().max(255).allow(null, ''),
      city: Joi.string().trim().max(100).allow(null),
      state: Joi.string().trim().max(50).allow(null),
      same_as_restaurant: Joi.boolean().default(true),
    });
  }

  /**
   * Validation schema for updates (without restaurant_id)
   */
  get updateSchema() {
    return Joi.object({
      zip_code: Joi.string().max(10).allow(null),
      street: Joi.string().trim().max(255).allow(null),
      street_number: Joi.string().max(10).allow(null),
      complement: Joi.string().trim().max(255).allow(null, ''),
      city: Joi.string().trim().max(100).allow(null),
      state: Joi.string().trim().max(50).allow(null),
      same_as_restaurant: Joi.boolean(),
    });
  }

  /**
   * Create or update billing address for restaurant
   * @param {Object} addressData - Address data
   * @returns {Object} Created/Updated address
   */
  async createOrUpdate(addressData) {
    // Validate input data
    const validatedData = await this.validate(addressData, this.schema);

    // Check if restaurant exists
    const restaurantExists = await this.checkRestaurantExists(validatedData.restaurant_id);
    if (!restaurantExists) {
      throw new Error('Restaurant not found');
    }

    // Check if billing address already exists for this restaurant
    const existingAddress = await this.getByRestaurantId(validatedData.restaurant_id);

    if (existingAddress) {
      // Update existing address
      const updateData = Object.assign({}, validatedData);
      delete updateData.restaurant_id; // Remove restaurant_id from update data

      return await this.updateByRestaurantId(validatedData.restaurant_id, updateData);
    } else {
      // Create new address
      const columns = Object.keys(validatedData);
      const placeholders = columns.map((_, index) => `$${index + 1}`);
      const values = Object.values(validatedData);

      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;

      const result = await this.executeQuery(query, values);
      return result.rows[0];
    }
  }

  /**
   * Get billing address by restaurant ID
   * @param {Number} restaurantId - Restaurant ID
   * @returns {Object|null} Billing address data
   */
  async getByRestaurantId(restaurantId) {
    const conditions = { restaurant_id: restaurantId };
    const result = await this.find(conditions);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Update billing address by restaurant ID
   * @param {Number} restaurantId - Restaurant ID
   * @param {Object} updateData - Data to update
   * @returns {Object|null} Updated address
   */
  async updateByRestaurantId(restaurantId, updateData) {
    // Validate update data
    const validatedData = await this.validate(updateData, this.updateSchema);

    if (Object.keys(validatedData).length === 0) {
      throw new Error('No valid fields to update');
    }

    const { clause, params } = this.buildSetClause(validatedData);
    const query = `
      UPDATE ${this.tableName}
      SET ${clause}
      WHERE restaurant_id = $${params.length + 1}
      RETURNING *
    `;

    const result = await this.executeQuery(query, [...params, restaurantId]);
    return result.rows[0] || null;
  }

  /**
   * Delete billing address by restaurant ID
   * @param {Number} restaurantId - Restaurant ID
   * @returns {Boolean} Success status
   */
  async deleteByRestaurantId(restaurantId) {
    const deletedCount = await this.delete({ restaurant_id: restaurantId });
    return deletedCount > 0;
  }

  /**
   * Get complete address string
   * @param {Number} restaurantId - Restaurant ID
   * @returns {String|null} Formatted address string
   */
  async getFormattedAddress(restaurantId) {
    const address = await this.getByRestaurantId(restaurantId);

    if (!address) {
      return null;
    }

    const parts = [];

    if (address.street) {
      let streetPart = address.street;
      if (address.street_number) {
        streetPart += `, ${address.street_number}`;
      }
      if (address.complement) {
        streetPart += `, ${address.complement}`;
      }
      parts.push(streetPart);
    }

    if (address.city && address.state) {
      parts.push(`${address.city}, ${address.state}`);
    } else if (address.city) {
      parts.push(address.city);
    } else if (address.state) {
      parts.push(address.state);
    }

    if (address.zip_code) {
      parts.push(`CEP: ${address.zip_code}`);
    }

    return parts.length > 0 ? parts.join(' - ') : null;
  }

  /**
   * Copy address from primary restaurant location
   * @param {Number} restaurantId - Restaurant ID
   * @returns {Object|null} Created billing address
   */
  async copyFromPrimaryLocation(restaurantId) {
    // Get primary location
    const locationQuery = `
      SELECT address_zip_code, address_street, address_street_number,
             address_complement, address_city, address_state
      FROM restaurant_locations
      WHERE restaurant_id = $1 AND is_primary = true AND status = 'active'
      LIMIT 1
    `;

    const locationResult = await this.executeQuery(locationQuery, [restaurantId]);

    if (locationResult.rows.length === 0) {
      throw new Error('No primary location found to copy address from');
    }

    const location = locationResult.rows[0];

    // Create billing address with location data
    const addressData = {
      restaurant_id: restaurantId,
      zip_code: location.address_zip_code,
      street: location.address_street,
      street_number: location.address_street_number,
      complement: location.address_complement,
      city: location.address_city,
      state: location.address_state,
      same_as_restaurant: true,
    };

    return await this.createOrUpdate(addressData);
  }

  /**
   * Validate ZIP code format (Brazilian CEP)
   * @param {String} zipCode - ZIP code to validate
   * @returns {Boolean} Validation result
   */
  validateZipCode(zipCode) {
    if (!zipCode) return true; // Allow null/empty

    // Brazilian ZIP code format: 12345-678 or 12345678
    const cepRegex = /^\d{5}-?\d{3}$/;
    return cepRegex.test(zipCode);
  }

  /**
   * Format ZIP code to standard format
   * @param {String} zipCode - ZIP code to format
   * @returns {String} Formatted ZIP code
   */
  formatZipCode(zipCode) {
    if (!zipCode) return zipCode;

    // Remove any non-digit characters
    const digitsOnly = zipCode.replace(/\D/g, '');

    // Format as 12345-678
    if (digitsOnly.length === 8) {
      return `${digitsOnly.substring(0, 5)}-${digitsOnly.substring(5)}`;
    }

    return zipCode; // Return original if not 8 digits
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
   * Get billing addresses with restaurant info
   * @param {Object} filters - Filter conditions
   * @param {Object} pagination - Pagination options
   * @returns {Object} Addresses with restaurant data
   */
  async getBillingAddressesWithRestaurants(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    if (filters.restaurant_id) {
      whereClause = `WHERE ba.restaurant_id = $${paramIndex++}`;
      params.push(filters.restaurant_id);
    }

    const query = `
      SELECT
        ba.*,
        r.restaurant_name,
        r.owner_name,
        r.email as restaurant_email
      FROM ${this.tableName} ba
      JOIN restaurants r ON ba.restaurant_id = r.id
      ${whereClause}
      ORDER BY ba.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);

    const result = await this.executeQuery(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*)
      FROM ${this.tableName} ba
      JOIN restaurants r ON ba.restaurant_id = r.id
      ${whereClause}
    `;

    const countResult = await this.executeQuery(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    return {
      addresses: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = new BillingAddressModel();
