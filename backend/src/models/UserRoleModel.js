const BaseModel = require('./BaseModel');
const Joi = require('joi');
const { logger } = require('../utils/logger');

class UserRoleModel extends BaseModel {
  constructor() {
    super();
    this.tableName = 'user_roles';
    this.sensitiveFields = [];
    this.logger = logger.child({ model: 'UserRoleModel' });
  }

  /**
   * Get all roles for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Array} Array of user roles with role details
   */
  async getUserRoles(userId, options = {}) {
    this.logger.debug('Getting user roles', { userId });
    try {
      const { includeInactive = false } = options;

      const query = `
        SELECT
          ur.*,
          r.name as role_name,
          r.display_name as role_display_name,
          r.description as role_description,
          r.level as role_level,
          r.is_admin_role,
          r.can_manage_users,
          r.can_manage_locations,
          r.scope as role_scope,
          rest.restaurant_name,
          rest.restaurant_url_name,
          loc.name as location_name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        LEFT JOIN restaurants rest ON ur.restaurant_id = rest.id
        LEFT JOIN restaurant_locations loc ON ur.location_id = loc.id
        WHERE ur.user_id = $1
          ${!includeInactive ? 'AND ur.is_active = true' : ''}
          AND (ur.valid_until IS NULL OR ur.valid_until > CURRENT_TIMESTAMP)
        ORDER BY r.level DESC, ur.created_at ASC
      `;

      const result = await this.executeQuery(query, [userId]);
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get user roles', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get user's primary role (highest level active role)
   * @param {string} userId - User ID
   * @returns {Object|null} Primary role data or null
   */
  async getUserPrimaryRole(userId) {
    this.logger.debug('Getting user primary role', { userId });
    try {
      const query = `
        SELECT
          ur.*,
          r.name as role_name,
          r.display_name as role_display_name,
          r.description as role_description,
          r.level as role_level,
          r.is_admin_role,
          r.can_manage_users,
          r.can_manage_locations,
          r.scope as role_scope,
          rest.restaurant_name,
          rest.restaurant_url_name,
          loc.name as location_name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        LEFT JOIN restaurants rest ON ur.restaurant_id = rest.id
        LEFT JOIN restaurant_locations loc ON ur.location_id = loc.id
        WHERE ur.user_id = $1
          AND ur.is_active = true
          AND (ur.valid_until IS NULL OR ur.valid_until > CURRENT_TIMESTAMP)
        ORDER BY r.level DESC, ur.created_at ASC
        LIMIT 1
      `;

      const result = await this.executeQuery(query, [userId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      this.logger.error('Failed to get user primary role', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check if user has a specific role
   * @param {string} userId - User ID
   * @param {string} roleName - Role name to check
   * @param {Object} context - Optional context (restaurant_id, location_id)
   * @returns {boolean} True if user has the role
   */
  async userHasRole(userId, roleName, context = {}) {
    this.logger.debug('Checking if user has role', { userId, roleName, context });
    try {
      let query = `
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1
          AND r.name = $2
          AND ur.is_active = true
          AND (ur.valid_until IS NULL OR ur.valid_until > CURRENT_TIMESTAMP)
      `;

      const values = [userId, roleName];
      let paramCount = 2;

      // Add context filters if provided
      if (context.restaurant_id) {
        paramCount++;
        query += ` AND ur.restaurant_id = $${paramCount}`;
        values.push(context.restaurant_id);
      }

      if (context.location_id) {
        paramCount++;
        query += ` AND ur.location_id = $${paramCount}`;
        values.push(context.location_id);
      }

      query += ' LIMIT 1';

      const result = await this.executeQuery(query, values);
      return result.rows.length > 0;
    } catch (error) {
      this.logger.error('Failed to check user role', {
        userId,
        roleName,
        context,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check if user has admin access
   * @param {string} userId - User ID
   * @returns {boolean} True if user has any admin role
   */
  async userHasAdminAccess(userId) {
    this.logger.debug('Checking if user has admin access', { userId });
    try {
      const query = `
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1
          AND r.is_admin_role = true
          AND ur.is_active = true
          AND (ur.valid_until IS NULL OR ur.valid_until > CURRENT_TIMESTAMP)
        LIMIT 1
      `;

      const result = await this.executeQuery(query, [userId]);
      return result.rows.length > 0;
    } catch (error) {
      this.logger.error('Failed to check user admin access', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create a new user role assignment
   * @param {Object} assignmentData - Role assignment data
   * @returns {Object} Created user role assignment
   */
  async create(assignmentData) {
    this.logger.debug('Creating user role assignment', { assignmentData });
    try {
      // Validate input
      const { error, value } = this.createSchema.validate(assignmentData);
      if (error) {
        const message = `Dados de atribuição inválidos: ${error.details[0].message}`;
        this.logger.warn('Role assignment validation failed', { error: message });
        throw new Error(message);
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

      this.logger.info('Role assignment created successfully', {
        assignmentId: assignment.id,
        userId: value.user_id,
        roleId: value.role_id,
      });

      return assignment;
    } catch (error) {
      this.logger.error('Failed to create role assignment', {
        assignmentData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Assign role to user
   * @param {Object} assignmentData - Role assignment data
   * @returns {Object} Created user role assignment
   */
  async assignRole(assignmentData) {
    this.logger.debug('Assigning role to user', { assignmentData });
    try {
      // Use the create method to assign the role
      const assignment = await this.create(assignmentData);

      this.logger.info('Role assigned successfully', {
        assignmentId: assignment.id,
        userId: assignmentData.user_id,
        roleId: assignmentData.role_id,
      });

      return assignment;
    } catch (error) {
      this.logger.error('Failed to assign role', {
        assignmentData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Revoke role from user
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID
   * @param {Object} context - Optional context (restaurant_id, location_id)
   * @returns {boolean} True if role was revoked
   */
  async revokeRole(userId, roleId, context = {}) {
    this.logger.debug('Revoking role from user', { userId, roleId, context });
    try {
      let query = `
        UPDATE user_roles
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND role_id = $2
      `;

      const values = [userId, roleId];
      let paramCount = 2;

      // Add context filters if provided
      if (context.restaurant_id) {
        paramCount++;
        query += ` AND restaurant_id = $${paramCount}`;
        values.push(context.restaurant_id);
      }

      if (context.location_id) {
        paramCount++;
        query += ` AND location_id = $${paramCount}`;
        values.push(context.location_id);
      }

      const result = await this.executeQuery(query, values);
      const revoked = result.rowCount > 0;

      if (revoked) {
        this.logger.info('Role revoked successfully', { userId, roleId, context });
      } else {
        this.logger.warn('Role revocation failed - assignment not found', {
          userId,
          roleId,
          context,
        });
      }

      return revoked;
    } catch (error) {
      this.logger.error('Failed to revoke role', {
        userId,
        roleId,
        context,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Validation schema for user role assignment
   */
  get createSchema() {
    return Joi.object({
      user_id: Joi.string().guid().required(),
      role_id: Joi.string().guid().required(),
      restaurant_id: Joi.string().guid().optional().allow(null),
      location_id: Joi.string().guid().optional().allow(null),
      assigned_by: Joi.string().guid().optional().allow(null),
      permissions_override: Joi.object().optional().allow(null),
      is_active: Joi.boolean().default(true),
      valid_from: Joi.date().default(() => new Date()),
      valid_until: Joi.date().optional().allow(null),
    });
  }

  /**
   * Validation schema for user role updates
   */
  get updateSchema() {
    return Joi.object({
      permissions_override: Joi.object().allow(null),
      is_active: Joi.boolean(),
      valid_until: Joi.date().allow(null),
    }).min(1);
  }
}

module.exports = UserRoleModel;
