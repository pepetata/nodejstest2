const BaseModel = require('./BaseModel');
const Joi = require('joi');
const { logger } = require('../utils/logger');

class RoleModel extends BaseModel {
  constructor() {
    super();
    this.tableName = 'roles';
    this.sensitiveFields = [];
    this.logger = logger.child({ model: 'RoleModel' });
  }

  /**
   * Find role by name
   * @param {string} name - Role name
   * @returns {Object|null} Role object or null
   */
  async findByName(name) {
    this.logger.debug('Finding role by name', { name });
    try {
      const result = await this.find({ name: name.toLowerCase() });
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logger.error('Failed to find role by name', {
        name,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get all active roles
   * @returns {Array} Array of active roles
   */
  async getActiveRoles() {
    this.logger.debug('Getting all active roles');
    try {
      return await this.find({ is_active: true });
    } catch (error) {
      this.logger.error('Failed to get active roles', { error: error.message });
      throw error;
    }
  }

  /**
   * Get roles by scope
   * @param {string} scope - Role scope (system, restaurant, location)
   * @returns {Array} Array of roles for the specified scope
   */
  async getRolesByScope(scope) {
    this.logger.debug('Getting roles by scope', { scope });
    try {
      return await this.find({
        scope,
        is_active: true,
      });
    } catch (error) {
      this.logger.error('Failed to get roles by scope', {
        scope,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get admin roles
   * @returns {Array} Array of admin roles
   */
  async getAdminRoles() {
    this.logger.debug('Getting admin roles');
    try {
      return await this.find({
        is_admin_role: true,
        is_active: true,
      });
    } catch (error) {
      this.logger.error('Failed to get admin roles', { error: error.message });
      throw error;
    }
  }

  /**
   * Validation schema for role creation
   */
  get createSchema() {
    return Joi.object({
      name: Joi.string().alphanum().min(2).max(50).required(),
      display_name: Joi.string().trim().min(2).max(100).required(),
      description: Joi.string().trim().max(500).optional().allow(''),
      level: Joi.number().integer().min(1).max(5).default(1),
      is_admin_role: Joi.boolean().default(false),
      can_manage_users: Joi.boolean().default(false),
      can_manage_locations: Joi.boolean().default(false),
      scope: Joi.string().valid('system', 'restaurant', 'location').default('location'),
      is_active: Joi.boolean().default(true),
    });
  }

  /**
   * Validation schema for role updates
   */
  get updateSchema() {
    return Joi.object({
      display_name: Joi.string().trim().min(2).max(100),
      description: Joi.string().trim().max(500).allow(''),
      level: Joi.number().integer().min(1).max(5),
      is_admin_role: Joi.boolean(),
      can_manage_users: Joi.boolean(),
      can_manage_locations: Joi.boolean(),
      scope: Joi.string().valid('system', 'restaurant', 'location'),
      is_active: Joi.boolean(),
    }).min(1);
  }

  /**
   * Create a new role
   * @param {Object} roleData - Role data
   * @param {Object} options - Additional options
   * @returns {Object} Created role
   */
  async create(roleData, options = {}) {
    this.logger.debug('Creating role', { roleData: { ...roleData, name: roleData.name } });

    try {
      // Validate input
      const { error, value } = this.createSchema.validate(roleData);
      if (error) {
        const message = `Dados de role inválidos: ${error.details[0].message}`;
        this.logger.warn('Role validation failed', { error: message });
        throw new Error(message);
      }

      // Normalize role name to lowercase
      value.name = value.name.toLowerCase();

      // Check if role already exists
      const existingRole = await this.findByName(value.name);
      if (existingRole) {
        const message = `Role '${value.name}' already exists`;
        this.logger.warn('Role creation failed - already exists', { name: value.name });
        throw new Error(message);
      }

      // Create the role
      const newRole = await super.create(value, options);
      this.logger.info('Role created successfully', {
        roleId: newRole.id,
        name: newRole.name,
      });

      return newRole;
    } catch (error) {
      this.logger.error('Failed to create role', {
        roleData: { ...roleData, name: roleData.name },
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update role
   * @param {string} id - Role ID
   * @param {Object} updateData - Update data
   * @param {Object} options - Additional options
   * @returns {Object} Updated role
   */
  async update(id, updateData, options = {}) {
    this.logger.debug('Updating role', { roleId: id, updateData });

    try {
      // Validate input
      const { error, value } = this.updateSchema.validate(updateData);
      if (error) {
        const message = `Dados de atualização inválidos: ${error.details[0].message}`;
        this.logger.warn('Role update validation failed', { error: message });
        throw new Error(message);
      }

      // Update the role
      const updatedRole = await super.update(id, value, options);

      if (!updatedRole) {
        const message = 'Role not found';
        this.logger.warn('Role update failed - not found', { roleId: id });
        throw new Error(message);
      }

      this.logger.info('Role updated successfully', {
        roleId: id,
        changes: Object.keys(value),
      });

      return updatedRole;
    } catch (error) {
      this.logger.error('Failed to update role', {
        roleId: id,
        updateData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Soft delete role (deactivate)
   * @param {string} id - Role ID
   * @returns {Object} Deactivated role
   */
  async softDelete(id) {
    this.logger.debug('Soft deleting role', { roleId: id });
    try {
      return await this.update(id, { is_active: false });
    } catch (error) {
      this.logger.error('Failed to soft delete role', {
        roleId: id,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = RoleModel;
