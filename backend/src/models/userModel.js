const BaseModel = require('./BaseModel');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

class UserModel extends BaseModel {
  constructor() {
    super();
    this.tableName = 'users';
    // this.sensitiveFields = ['password', 'email_confirmation_token', 'password_reset_token'];
    this.sensitiveFields = ['password'];
    this.logger = logger.child({ model: 'UserModel' });
  }

  /**
   * Find user by password reset token
   */
  async findByPasswordResetToken(token) {
    this.logger.debug('Finding user by password reset token', { token });
    try {
      const result = await this.find({ password_reset_token: token });
      const user = result.length > 0 ? result[0] : null;
      if (user) {
        return this.sanitizeOutput(user, this.sensitiveFields);
      }
      return null;
    } catch (error) {
      this.logger.error('Failed to find user by password reset token', {
        token,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Find user by email for login (returns full user object, including password)
   * Use ONLY for authentication logic, never expose result to client
   */
  async findUserForLogin(email) {
    this.logger.debug('Finding user for login by email (with restaurant and role data)', { email });
    try {
      // Join users with restaurants and primary role to get full data for authentication
      const query = `
        SELECT
          u.*,
          r.id AS restaurant_id,
          r.restaurant_name AS restaurant_name,
          r.restaurant_url_name AS restaurant_subdomain,
          r.business_type AS restaurant_business_type,
          r.status AS restaurant_status,
          r.logo AS restaurant_logo,
          r.favicon AS restaurant_favicon,
          primary_role.role_name AS primary_role,
          primary_role.role_display_name AS primary_role_display,
          primary_role.is_admin_role AS is_admin
        FROM users u
        LEFT JOIN restaurants r ON u.restaurant_id = r.id
        LEFT JOIN (
          SELECT
            ur.user_id,
            roles.name as role_name,
            roles.display_name as role_display_name,
            roles.is_admin_role
          FROM user_roles ur
          JOIN roles ON ur.role_id = roles.id
          WHERE ur.is_primary_role = true
            AND ur.is_active = true
            AND (ur.valid_until IS NULL OR ur.valid_until > CURRENT_TIMESTAMP)
        ) primary_role ON u.id = primary_role.user_id
        WHERE LOWER(u.email) = $1
        LIMIT 1
      `;
      const values = [email.toLowerCase()];
      const result = await this.executeQuery(query, values);
      if (result.rows.length > 0) {
        const row = result.rows[0];

        // Separate user and restaurant data
        const userData = {
          id: row.id,
          email: row.email,
          password: row.password, // Include for login validation
          full_name: row.full_name,
          username: row.username,
          status: row.status,
          restaurant_id: row.restaurant_id,
          restaurant_subdomain: row.restaurant_subdomain,
          created_at: row.created_at,
          updated_at: row.updated_at,
          // Role information for backward compatibility
          role: row.primary_role, // Primary role name
          is_admin: row.is_admin,
        };

        // Add restaurant data if user has a restaurant
        if (row.restaurant_id) {
          userData.restaurant = {
            id: row.restaurant_id,
            name: row.restaurant_name,
            url: row.restaurant_subdomain,
            business_type: row.restaurant_business_type,
            status: row.restaurant_status,
            logo: row.restaurant_logo,
            favicon: row.restaurant_favicon,
          };
        }

        return userData;
      }
      return null;
    } catch (error) {
      this.logger.error('Failed to find user for login by email (with joins)', {
        email,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * UUID validation schema
   */
  get uuidSchema() {
    return Joi.string().guid().required();
  }

  /**
   * Validation schema for user creation (updated for multiple roles)
   */
  get createSchema() {
    return Joi.object({
      email: Joi.string().email().optional().allow(null),
      username: Joi.string().alphanum().min(3).max(100).when('email', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required(),
      }),
      password: Joi.string().min(8).max(255).required(),
      full_name: Joi.string().trim().min(2).max(255).required(),
      restaurant_id: Joi.string().guid().optional().allow(null),
      status: Joi.string().valid('pending', 'active', 'inactive', 'suspended').default('pending'),
      created_by: Joi.string()
        .uuid({ version: ['uuidv4'] })
        .optional()
        .allow(null),
      first_login_password_change: Joi.boolean().default(true),
    });
  }

  /**
   * Validation schema for user updates (updated for multiple roles)
   */
  get updateSchema() {
    return Joi.object({
      email: Joi.string().email().allow(null),
      username: Joi.string().alphanum().min(3).max(100).allow(null),
      full_name: Joi.string().trim().min(2).max(255),
      restaurant_id: Joi.string().guid().allow(null),
      status: Joi.string().valid('pending', 'active', 'inactive', 'suspended'),
      email_confirmed: Joi.boolean(),
      first_login_password_change: Joi.boolean(),
      last_login_at: Joi.date(),
      password_reset_token: Joi.string().allow(null),
      password_reset_expires: Joi.date().allow(null),
    }).min(1);
  }

  /**
   * Validate and sanitize UUID
   */
  validateUuid(uuid) {
    this.logger.debug('Validating UUID', { uuid: uuid ? uuid.substring(0, 8) + '...' : null });

    const { error, value } = this.uuidSchema.validate(uuid);
    if (error) {
      this.logger.warn('UUID validation failed', {
        uuid: uuid ? uuid.substring(0, 8) + '...' : null,
        error: error.details[0].message,
      });
      throw new Error(`Formato de UUID inválido: ${error.details[0].message}`);
    }

    return {
      isValid: true,
      sanitizedUuid: value.toLowerCase(),
    };
  }

  /**
   * Check if UUID is valid
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
   * Hash password
   */
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password
   */
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate email confirmation token
   */
  generateEmailConfirmationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate password reset token
   */
  generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create new user (updated for multiple roles)
   */
  async create(userData) {
    this.logger.info('Creating new user', {
      email: userData.email,
      username: userData.username,
      restaurant_id: userData.restaurant_id,
    });

    try {
      // Validate input data
      const validatedData = await this.validate(userData, this.createSchema);
      this.logger.debug('User data validation successful');

      // Hash password
      validatedData.password = await this.hashPassword(validatedData.password);

      // Generate email confirmation token if email provided
      if (validatedData.email) {
        validatedData.email_confirmation_token = this.generateEmailConfirmationToken();
        validatedData.email_confirmation_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      }

      // Check for unique email/username
      if (validatedData.email) {
        const existingEmail = await this.findByEmail(validatedData.email);
        if (existingEmail) {
          throw new Error('Email já cadastrado');
        }
      }

      if (validatedData.username) {
        const existingUsername = await this.findByUsername(validatedData.username);
        if (existingUsername) {
          throw new Error('Nome de usuário já cadastrado');
        }
      }

      // Validate restaurant exists if restaurant_id provided
      if (validatedData.restaurant_id) {
        const restaurantExists = await this.checkRestaurantExists(validatedData.restaurant_id);
        if (!restaurantExists) {
          throw new Error('Restaurante não encontrado');
        }
      }

      const columns = Object.keys(validatedData);
      const placeholders = columns.map((_, index) => `$${index + 1}`);
      const values = Object.values(validatedData);

      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;

      const result = await this.executeQuery(query, values);
      const user = this.sanitizeOutput(result.rows[0], this.sensitiveFields);

      this.logger.info('User created successfully', {
        user_id: user.id,
        email: user.email,
        username: user.username,
      });

      return user;
    } catch (error) {
      this.logger.error('Failed to create user', {
        email: userData.email,
        username: userData.username,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id, columns = ['*']) {
    this.logger.debug('Finding user by ID', { user_id: id });
    try {
      let user;
      // Accept UUID, integer, or string IDs
      if (this.isValidUuid(id)) {
        const { sanitizedUuid } = this.validateUuid(id);
        user = await super.findById(sanitizedUuid, columns);
      } else if (/^\d+$/.test(id)) {
        // Numeric ID (integer as string)
        user = await super.findById(Number(id), columns);
      } else if (typeof id === 'string') {
        // Fallback: try as plain string (for legacy or string PKs)
        user = await super.findById(id, columns);
      } else {
        throw new Error('Formato de ID de usuário inválido. Deve ser um UUID, número ou string.');
      }
      if (user) {
        return this.sanitizeOutput(user, this.sensitiveFields);
      }
      return null;
    } catch (error) {
      this.logger.error('Failed to find user by ID', {
        user_id: id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Find user by ID with restaurant data (for authentication)
   */
  async findByIdWithRestaurant(id) {
    this.logger.debug('Finding user by ID with restaurant and role data', { user_id: id });
    try {
      let query, values;

      if (this.isValidUuid(id)) {
        const { sanitizedUuid } = this.validateUuid(id);
        query = `
          SELECT
            u.*,
            r.id AS restaurant_id,
            r.restaurant_name AS restaurant_name,
            r.restaurant_url_name AS restaurant_subdomain,
            r.business_type AS restaurant_business_type,
            r.status AS restaurant_status,
            r.logo AS restaurant_logo,
            r.favicon AS restaurant_favicon,
            primary_role.role_name AS primary_role,
            primary_role.role_display_name AS primary_role_display,
            primary_role.is_admin_role AS is_admin
          FROM users u
          LEFT JOIN restaurants r ON u.restaurant_id = r.id
          LEFT JOIN (
            SELECT
              ur.user_id,
              roles.name as role_name,
              roles.display_name as role_display_name,
              roles.is_admin_role
            FROM user_roles ur
            JOIN roles ON ur.role_id = roles.id
            WHERE ur.is_primary_role = true
              AND ur.is_active = true
              AND (ur.valid_until IS NULL OR ur.valid_until > CURRENT_TIMESTAMP)
          ) primary_role ON u.id = primary_role.user_id
          WHERE u.id = $1
          LIMIT 1
        `;
        values = [sanitizedUuid];
      } else if (/^\d+$/.test(id)) {
        query = `
          SELECT
            u.*,
            r.id AS restaurant_id,
            r.restaurant_name AS restaurant_name,
            r.restaurant_url_name AS restaurant_subdomain,
            r.business_type AS restaurant_business_type,
            r.status AS restaurant_status,
            r.logo AS restaurant_logo,
            r.favicon AS restaurant_favicon,
            primary_role.role_name AS primary_role,
            primary_role.role_display_name AS primary_role_display,
            primary_role.is_admin_role AS is_admin
          FROM users u
          LEFT JOIN restaurants r ON u.restaurant_id = r.id
          LEFT JOIN (
            SELECT
              ur.user_id,
              roles.name as role_name,
              roles.display_name as role_display_name,
              roles.is_admin_role
            FROM user_roles ur
            JOIN roles ON ur.role_id = roles.id
            WHERE ur.is_primary_role = true
              AND ur.is_active = true
              AND (ur.valid_until IS NULL OR ur.valid_until > CURRENT_TIMESTAMP)
          ) primary_role ON u.id = primary_role.user_id
          WHERE u.id = $1
          LIMIT 1
        `;
        values = [Number(id)];
      } else {
        throw new Error('Formato de ID de usuário inválido. Deve ser um UUID ou número.');
      }

      const result = await this.executeQuery(query, values);
      if (result.rows.length > 0) {
        const row = result.rows[0];

        // Separate user and restaurant data
        const userData = {
          id: row.id,
          email: row.email,
          full_name: row.full_name,
          username: row.username,
          status: row.status,
          restaurant_id: row.restaurant_id,
          restaurant_subdomain: row.restaurant_subdomain,
          created_at: row.created_at,
          updated_at: row.updated_at,
          // Role information for backward compatibility
          role: row.primary_role, // Primary role name
          is_admin: row.is_admin,
        };

        // Add restaurant data if user has a restaurant
        if (row.restaurant_id) {
          userData.restaurant = {
            id: row.restaurant_id,
            name: row.restaurant_name,
            url: row.restaurant_subdomain,
            business_type: row.restaurant_business_type,
            status: row.restaurant_status,
            logo: row.restaurant_logo,
            favicon: row.restaurant_favicon,
          };
        }

        return userData;
      }
      return null;
    } catch (error) {
      this.logger.error('Failed to find user by ID with restaurant and role data', {
        user_id: id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    this.logger.debug('Finding user by email', { email });

    try {
      const result = await this.find({ email: email.toLowerCase() });
      const user = result.length > 0 ? result[0] : null;

      if (user) {
        return this.sanitizeOutput(user, this.sensitiveFields);
      }
      return null;
    } catch (error) {
      this.logger.error('Failed to find user by email', {
        email,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Find user by username
   */
  async findByUsername(username) {
    this.logger.debug('Finding user by username', { username });

    try {
      const result = await this.find({ username: username.toLowerCase() });
      const user = result.length > 0 ? result[0] : null;

      if (user) {
        return this.sanitizeOutput(user, this.sensitiveFields);
      }
      return null;
    } catch (error) {
      this.logger.error('Failed to find user by username', {
        username,
        error: error.message,
      });
      throw error;
    }
  }

  async findByEmailConfirmationToken(token) {
    this.logger.debug('Finding user by email confirmation token', { token });

    try {
      const result = await this.find({ email_confirmation_token: token });
      const user = result.length > 0 ? result[0] : null;

      if (user) {
        return this.sanitizeOutput(user, this.sensitiveFields);
      }
      return null;
    } catch (error) {
      this.logger.error('Failed to find user by email confirmation token', {
        token,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Authenticate user
   */
  async authenticate(identifier, password) {
    this.logger.info('Attempting user authentication', { identifier });

    try {
      // Find by email or username
      let user;
      if (identifier.includes('@')) {
        user = await this.find({ email: identifier.toLowerCase() });
      } else {
        user = await this.find({ username: identifier.toLowerCase() });
      }

      if (!user.length) {
        this.logger.warn('Authentication failed - user not found', { identifier });
        return null;
      }

      const foundUser = user[0];

      // Check if user is active
      if (foundUser.status !== 'active') {
        this.logger.warn('Authentication failed - user not active', {
          user_id: foundUser.id,
          status: foundUser.status,
        });
        return null;
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, foundUser.password);
      if (!isValidPassword) {
        this.logger.warn('Authentication failed - invalid password', { user_id: foundUser.id });
        return null;
      }

      // Update last login
      await this.update(foundUser.id, { last_login_at: new Date() });

      this.logger.info('Authentication successful', { user_id: foundUser.id });
      return this.sanitizeOutput(foundUser, this.sensitiveFields);
    } catch (error) {
      this.logger.error('Authentication error', {
        identifier,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update user
   */
  async update(id, updateData) {
    this.logger.info('Updating user', { user_id: id, fields: Object.keys(updateData) });

    try {
      if (!this.isValidUuid(id)) {
        throw new Error('Formato de ID de usuário inválido. Deve ser um UUID válido.');
      }

      const { sanitizedUuid } = this.validateUuid(id);

      // Validate update data
      const validatedData = await this.validate(updateData, this.updateSchema);

      if (Object.keys(validatedData).length === 0) {
        throw new Error('Nenhum campo válido para atualizar');
      }

      // Check current user exists
      const currentUser = await super.findById(sanitizedUuid);
      if (!currentUser) {
        throw new Error('Usuário não encontrado.');
      }

      // Check for unique email/username if being updated
      if (validatedData.email && validatedData.email !== currentUser.email) {
        const existingEmail = await this.findByEmail(validatedData.email);
        if (existingEmail) {
          throw new Error('Email já cadastrado');
        }
      }

      if (validatedData.username && validatedData.username !== currentUser.username) {
        const existingUsername = await this.findByUsername(validatedData.username);
        if (existingUsername) {
          throw new Error('Nome de usuário já cadastrado');
        }
      }

      // Validate restaurant exists if restaurant_id provided
      if (validatedData.restaurant_id) {
        const restaurantExists = await this.checkRestaurantExists(validatedData.restaurant_id);
        if (!restaurantExists) {
          throw new Error('Restaurante não encontrado');
        }
      }

      const { clause, params } = this.buildSetClause(validatedData);
      const query = `
        UPDATE ${this.tableName}
        SET ${clause}
        WHERE id = $${params.length + 1}
        RETURNING *
      `;

      const result = await this.executeQuery(query, [...params, sanitizedUuid]);
      const user = result.rows[0]
        ? this.sanitizeOutput(result.rows[0], this.sensitiveFields)
        : null;

      this.logger.info('User updated successfully', {
        user_id: sanitizedUuid,
        updated_fields: Object.keys(validatedData),
      });

      return user;
    } catch (error) {
      this.logger.error('Failed to update user', {
        user_id: id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete user (soft delete by setting status to inactive)
   */
  async deleteUser(id) {
    this.logger.info('Attempting to delete user', { user_id: id });

    try {
      if (!this.isValidUuid(id)) {
        throw new Error('Formato de ID de usuário inválido. Deve ser um UUID válido.');
      }

      const { sanitizedUuid } = this.validateUuid(id);
      const result = await this.update(sanitizedUuid, { status: 'inactive' });

      const success = !!result;
      if (success) {
        this.logger.info('User deleted successfully', { user_id: sanitizedUuid });
      }

      return success;
    } catch (error) {
      this.logger.error('Failed to delete user', {
        user_id: id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Confirm email
   */
  async confirmEmail(token) {
    this.logger.info('Confirming email with token');

    try {
      const query = `
        UPDATE ${this.tableName}
        SET email_confirmed = true,
            email_confirmation_token = NULL,
            email_confirmation_expires = NULL,
            status = 'active',
            updated_at = CURRENT_TIMESTAMP
        WHERE email_confirmation_token = $1
          AND email_confirmation_expires > CURRENT_TIMESTAMP
        RETURNING *
      `;

      const result = await this.executeQuery(query, [token]);

      if (result.rows.length > 0) {
        const user = this.sanitizeOutput(result.rows[0], this.sensitiveFields);
        this.logger.info('Email confirmed successfully', { user_id: user.id });
        return user;
      }

      // If not updated, the token is either:
      // 1. Invalid/expired
      // 2. Already used (cleared after confirmation)
      // Since we clear tokens after confirmation for security, we can't check by token
      // Just return a generic error message for security
      throw new Error(
        'Token de confirmação inválido ou expirado. Se você já confirmou seu e-mail, tente fazer login.'
      );
    } catch (error) {
      this.logger.error('Failed to confirm email', { error: error.message });
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(id, newPassword) {
    this.logger.info('Changing user password', { user_id: id });

    try {
      if (!this.isValidUuid(id)) {
        throw new Error('Formato de ID de usuário inválido. Deve ser um UUID válido.');
      }

      const { sanitizedUuid } = this.validateUuid(id);
      const hashedPassword = await this.hashPassword(newPassword);

      const result = await this.update(sanitizedUuid, {
        password: hashedPassword,
        password_changed_at: new Date(),
        first_login_password_change: false,
      });

      this.logger.info('Password changed successfully', { user_id: sanitizedUuid });
      return result;
    } catch (error) {
      this.logger.error('Failed to change password', {
        user_id: id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update email confirmation token and expiration
   */
  async updateEmailConfirmationToken(userId, token, expires) {
    this.logger.info('Updating email confirmation token', { user_id: userId });
    const query = `
      UPDATE ${this.tableName}
      SET email_confirmation_token = $1,
          email_confirmation_expires = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await this.executeQuery(query, [token, expires, userId]);
    return result.rows[0] ? this.sanitizeOutput(result.rows[0], this.sensitiveFields) : null;
  }

  /**
   * Check if a restaurant exists by ID
   */
  async checkRestaurantExists(restaurantId) {
    // Assumes you have a RestaurantModel or a direct query to the restaurants table
    const query = 'SELECT 1 FROM restaurants WHERE id = $1 LIMIT 1';
    const result = await this.executeQuery(query, [restaurantId]);
    return result.rows.length > 0;
  }

  /**
   * Find users with pagination and filtering
   * @param {Object} filters - Filter conditions
   * @param {Object} queryOptions - Query options (page, limit, search, orderBy)
   * @returns {Object} { users: Array, total: Number }
   */
  async findWithPagination(filters = {}, queryOptions = {}) {
    this.logger.debug('Finding users with pagination', { filters, queryOptions });

    try {
      const { page = 1, limit = 10, search, orderBy = 'created_at DESC' } = queryOptions;

      // Calculate offset
      const offset = (page - 1) * limit;

      // Build base query with joins for restaurant and role information
      let query = `
        SELECT DISTINCT
          u.*,
          r.restaurant_name,
          r.restaurant_url_name,
          ur.role_id,
          ro.name as role_name,
          ro.display_name as role_display_name,
          ro.description as role_description
        FROM users u
        LEFT JOIN restaurants r ON u.restaurant_id = r.id
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary_role = true AND ur.is_active = true
        LEFT JOIN roles ro ON ur.role_id = ro.id
      `;

      // Build count query
      let countQuery = `
        SELECT COUNT(DISTINCT u.id) as total
        FROM users u
        LEFT JOIN restaurants r ON u.restaurant_id = r.id
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary_role = true AND ur.is_active = true
        LEFT JOIN roles ro ON ur.role_id = ro.id
      `;

      const params = [];
      const whereConditions = [];
      let paramCount = 0;

      // Add restaurant filter for multi-tenant security
      if (filters.restaurant_id) {
        paramCount++;
        whereConditions.push(`u.restaurant_id = $${paramCount}`);
        params.push(filters.restaurant_id);
      }

      // Add role filter
      if (filters.role_id) {
        paramCount++;
        whereConditions.push(`ur.role_id = $${paramCount}`);
        params.push(filters.role_id);
      }

      // Add status filter
      if (filters.is_active !== undefined) {
        paramCount++;
        whereConditions.push(`u.is_active = $${paramCount}`);
        params.push(filters.is_active);
      }

      // Add search functionality
      if (search && search.fields && search.term) {
        paramCount++;
        const searchConditions = search.fields
          .map((field) => {
            if (field === 'full_name') {
              return `u.name ILIKE $${paramCount}`;
            } else {
              return `u.${field} ILIKE $${paramCount}`;
            }
          })
          .join(' OR ');
        whereConditions.push(`(${searchConditions})`);
        params.push(`%${search.term}%`);
      }

      // Add WHERE clause if conditions exist
      if (whereConditions.length > 0) {
        const whereClause = ` WHERE ${whereConditions.join(' AND ')}`;
        query += whereClause;
        countQuery += whereClause;
      }

      // Add ORDER BY, LIMIT, and OFFSET to main query
      query += ` ORDER BY u.${orderBy.replace(/[^a-zA-Z0-9_\s]/g, '')} LIMIT ${limit} OFFSET ${offset}`;

      // Execute queries
      const [usersResult, countResult] = await Promise.all([
        this.executeQuery(query, params),
        this.executeQuery(countQuery, params),
      ]);

      const users = usersResult.rows.map((user) => this.sanitizeOutput(user, this.sensitiveFields));
      const total = parseInt(countResult.rows[0].total);

      this.logger.info('Users retrieved with pagination', {
        total,
        page,
        limit,
        returned: users.length,
      });

      return {
        users,
        total,
      };
    } catch (error) {
      this.logger.error('Failed to find users with pagination', {
        filters,
        queryOptions,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = UserModel;
