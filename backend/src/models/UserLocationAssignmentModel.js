const { logger } = require('../utils/logger');
const Joi = require('joi');

/**
 * UserLocationAssignmentModel
 * Manages user assignments to restaurant locations
 */
class UserLocationAssignmentModel {
  constructor() {
    this.logger = logger.child({ model: 'UserLocationAssignmentModel' });
    this.tableName = 'user_location_assignments';
    this.db = require('../config/db');
  }

  /**
   * Execute database query with error handling
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async executeQuery(query, params = []) {
    try {
      const result = await this.db.query(query, params);
      return result;
    } catch (error) {
      this.logger.error('Database query failed', {
        query: query.substring(0, 100) + '...',
        params,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create a new user location assignment
   * @param {Object} assignmentData - Assignment data
   * @returns {Object} Created assignment
   */
  async create(assignmentData) {
    this.logger.debug('Creating user location assignment', { assignmentData });

    try {
      // Validate input
      const { error, value } = this.createSchema.validate(assignmentData);
      if (error) {
        const message = `Dados de atribuição de localização inválidos: ${error.details[0].message}`;
        this.logger.warn('Location assignment validation failed', { error: message });
        throw new Error(message);
      }

      // If setting as primary location, remove primary flag from other locations for this user
      if (value.is_primary_location) {
        await this.removePrimaryLocationFlag(value.user_id);
      }

      // Build the insert query
      const columns = Object.keys(value);
      const placeholders = columns.map((_, index) => `$${index + 1}`);
      const values = columns.map((col) => value[col]);

      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;

      const result = await this.executeQuery(query, values);
      const assignment = result.rows[0];

      this.logger.info('Location assignment created successfully', {
        assignmentId: assignment.id,
        userId: value.user_id,
        locationId: value.location_id,
        isPrimary: value.is_primary_location,
      });

      return assignment;
    } catch (error) {
      this.logger.error('Failed to create location assignment', {
        assignmentData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Remove primary location flag from all user's location assignments
   * @param {string} userId - User ID
   */
  async removePrimaryLocationFlag(userId) {
    this.logger.debug('Removing primary location flag', { userId });

    try {
      const query = `
        UPDATE ${this.tableName}
        SET is_primary_location = false, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND is_primary_location = true
      `;

      await this.executeQuery(query, [userId]);
    } catch (error) {
      this.logger.error('Failed to remove primary location flag', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get user location assignments
   * @param {string} userId - User ID
   * @returns {Array} User location assignments
   */
  async getUserLocationAssignments(userId) {
    this.logger.debug('Getting user location assignments', { userId });

    try {
      const query = `
        SELECT
          ula.*,
          rl.name as location_name,
          rl.address_street,
          rl.address_city,
          rl.address_state,
          rl.restaurant_id
        FROM ${this.tableName} ula
        JOIN restaurant_locations rl ON ula.location_id = rl.id
        WHERE ula.user_id = $1
        ORDER BY ula.is_primary_location DESC, rl.name ASC
      `;

      const result = await this.executeQuery(query, [userId]);
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get user location assignments', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get user's primary location
   * @param {string} userId - User ID
   * @returns {Object|null} Primary location assignment
   */
  async getUserPrimaryLocation(userId) {
    this.logger.debug('Getting user primary location', { userId });

    try {
      const query = `
        SELECT
          ula.*,
          rl.name as location_name,
          rl.address_street,
          rl.address_city,
          rl.address_state,
          rl.restaurant_id
        FROM ${this.tableName} ula
        JOIN restaurant_locations rl ON ula.location_id = rl.id
        WHERE ula.user_id = $1 AND ula.is_primary_location = true
        LIMIT 1
      `;

      const result = await this.executeQuery(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error('Failed to get user primary location', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check if user has access to a specific location
   * @param {string} userId - User ID
   * @param {string} locationId - Location ID
   * @returns {boolean} True if user has access
   */
  async userHasLocationAccess(userId, locationId) {
    this.logger.debug('Checking user location access', { userId, locationId });

    try {
      const query = `
        SELECT 1 FROM ${this.tableName}
        WHERE user_id = $1 AND location_id = $2
        LIMIT 1
      `;

      const result = await this.executeQuery(query, [userId, locationId]);
      return result.rows.length > 0;
    } catch (error) {
      this.logger.error('Failed to check user location access', {
        userId,
        locationId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Assign user to location
   * @param {Object} assignmentData - Assignment data
   * @returns {Object} Created assignment
   */
  async assignUserToLocation(assignmentData) {
    this.logger.info('Assigning user to location', { assignmentData });

    try {
      // Check if assignment already exists
      const existingQuery = `
        SELECT id FROM ${this.tableName}
        WHERE user_id = $1 AND location_id = $2
      `;

      const existingResult = await this.executeQuery(existingQuery, [
        assignmentData.user_id,
        assignmentData.location_id,
      ]);

      if (existingResult.rows.length > 0) {
        this.logger.warn('User already assigned to location', {
          userId: assignmentData.user_id,
          locationId: assignmentData.location_id,
        });
        return existingResult.rows[0];
      }

      // Create new assignment
      return await this.create(assignmentData);
    } catch (error) {
      this.logger.error('Failed to assign user to location', {
        assignmentData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Remove user from location
   * @param {string} userId - User ID
   * @param {string} locationId - Location ID
   * @returns {boolean} True if successful
   */
  async removeUserFromLocation(userId, locationId) {
    this.logger.info('Removing user from location', { userId, locationId });

    try {
      const query = `
        DELETE FROM ${this.tableName}
        WHERE user_id = $1 AND location_id = $2
        RETURNING id
      `;

      const result = await this.executeQuery(query, [userId, locationId]);
      const success = result.rows.length > 0;

      if (success) {
        this.logger.info('User removed from location successfully', {
          userId,
          locationId,
          removedId: result.rows[0].id,
        });
      } else {
        this.logger.warn('No location assignment found to remove', {
          userId,
          locationId,
        });
      }

      return success;
    } catch (error) {
      this.logger.error('Failed to remove user from location', {
        userId,
        locationId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Set user's primary location
   * @param {string} userId - User ID
   * @param {string} locationId - Location ID
   * @returns {boolean} True if successful
   */
  async setPrimaryLocation(userId, locationId) {
    this.logger.info('Setting user primary location', { userId, locationId });

    try {
      // First, remove primary flag from all locations
      await this.removePrimaryLocationFlag(userId);

      // Then set the new primary location
      const query = `
        UPDATE ${this.tableName}
        SET is_primary_location = true, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND location_id = $2
        RETURNING id
      `;

      const result = await this.executeQuery(query, [userId, locationId]);
      const success = result.rows.length > 0;

      if (success) {
        this.logger.info('Primary location set successfully', {
          userId,
          locationId,
          assignmentId: result.rows[0].id,
        });
      } else {
        this.logger.warn('No location assignment found to set as primary', {
          userId,
          locationId,
        });
      }

      return success;
    } catch (error) {
      this.logger.error('Failed to set primary location', {
        userId,
        locationId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Validation schema for location assignment creation
   */
  get createSchema() {
    return Joi.object({
      user_id: Joi.string().guid().required(),
      location_id: Joi.string().guid().required(),
      is_primary_location: Joi.boolean().default(false),
      assigned_by: Joi.string().guid().optional().allow(null),
      kds_stations: Joi.array().items(Joi.string()).optional().allow(null),
    });
  }
}

module.exports = UserLocationAssignmentModel;
