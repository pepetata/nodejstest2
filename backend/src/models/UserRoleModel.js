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
          loc.location_name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        LEFT JOIN restaurants rest ON ur.restaurant_id = rest.id
        LEFT JOIN restaurant_locations loc ON ur.location_id = loc.id
        WHERE ur.user_id = $1
          ${!includeInactive ? 'AND ur.is_active = true' : ''}
          AND (ur.valid_until IS NULL OR ur.valid_until > CURRENT_TIMESTAMP)
        ORDER BY ur.is_primary_role DESC, r.level DESC, ur.created_at ASC
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
   * Get user's primary role
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
          loc.location_name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        LEFT JOIN restaurants rest ON ur.restaurant_id = rest.id
        LEFT JOIN restaurant_locations loc ON ur.location_id = loc.id
        WHERE ur.user_id = $1
          AND ur.is_primary_role = true
          AND ur.is_active = true
          AND (ur.valid_until IS NULL OR ur.valid_until > CURRENT_TIMESTAMP)
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
   * Assign role to user
   * @param {Object} assignmentData - Role assignment data
   * @returns {Object} Created user role assignment
   */
  async assignRole(assignmentData) {
    this.logger.debug('Assigning role to user', { assignmentData });
    try {
      // Validate input
      const { error, value } = this.createSchema.validate(assignmentData);
      if (error) {
        const message = `Dados de atribuição inválidos: ${error.details[0].message}`;
        this.logger.warn('Role assignment validation failed', { error: message });
        throw new Error(message);
      }

      // If setting as primary role, remove primary flag from other roles
      if (value.is_primary_role) {
        await this.removePrimaryRoleFlag(value.user_id);
      }

      // Create the assignment
      const assignment = await super.create(value);
      this.logger.info('Role assigned successfully', {
        assignmentId: assignment.id,
        userId: value.user_id,
        roleId: value.role_id,
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
   * Remove primary role flag from all user's roles
   * @param {string} userId - User ID
   */
  async removePrimaryRoleFlag(userId) {
    this.logger.debug('Removing primary role flag', { userId });
    try {
      const query = `
        UPDATE user_roles
        SET is_primary_role = false, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND is_primary_role = true
      `;

      await this.executeQuery(query, [userId]);
    } catch (error) {
      this.logger.error('Failed to remove primary role flag', {
        userId,
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
   * Set primary role for user
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID to set as primary
   * @returns {boolean} True if primary role was set
   */
  async setPrimaryRole(userId, roleId) {
    this.logger.debug('Setting primary role', { userId, roleId });
    try {
      // First remove primary flag from all user's roles
      await this.removePrimaryRoleFlag(userId);

      // Then set the specified role as primary
      const query = `
        UPDATE user_roles
        SET is_primary_role = true, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND role_id = $2 AND is_active = true
      `;

      const result = await this.executeQuery(query, [userId, roleId]);
      const success = result.rowCount > 0;

      if (success) {
        this.logger.info('Primary role set successfully', { userId, roleId });
      } else {
        this.logger.warn('Failed to set primary role - assignment not found', { userId, roleId });
      }

      return success;
    } catch (error) {
      this.logger.error('Failed to set primary role', {
        userId,
        roleId,
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
      is_primary_role: Joi.boolean().default(false),
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
      is_primary_role: Joi.boolean(),
      permissions_override: Joi.object().allow(null),
      is_active: Joi.boolean(),
      valid_until: Joi.date().allow(null),
    }).min(1);
  }
}

module.exports = UserRoleModel;
