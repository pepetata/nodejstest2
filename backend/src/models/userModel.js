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
   * Find user by email or username for login (returns full user object, including password)
   * Use ONLY for authentication logic, never expose result to client
   */
  async findUserForLogin(emailOrUsername) {
    this.logger.debug(
      'Finding user for login by email or username (with restaurant and role data)',
      { emailOrUsername }
    );
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
        LEFT JOIN LATERAL (
          SELECT
            roles.name as role_name,
            roles.display_name as role_display_name,
            roles.is_admin_role
          FROM user_roles ur
          JOIN roles ON ur.role_id = roles.id
          WHERE ur.user_id = u.id
            AND ur.is_active = true
            AND (ur.valid_until IS NULL OR ur.valid_until > CURRENT_TIMESTAMP)
          ORDER BY roles.level DESC, ur.created_at ASC
          LIMIT 1
        ) primary_role ON true
        WHERE (LOWER(u.email) = $1 OR LOWER(u.username) = $1)
        LIMIT 1
      `;
      const values = [emailOrUsername.toLowerCase()];
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
          is_active: row.status === 'active', // Convert status to boolean
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
      this.logger.error('Failed to find user for login by email or username (with joins)', {
        emailOrUsername,
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
      email: Joi.string().email().optional().allow(null, ''),
      username: Joi.string().alphanum().min(3).max(100).optional().allow(null),
      password: Joi.string().min(8).max(255).required(),
      full_name: Joi.string().trim().min(2).max(255).required(),
      restaurant_id: Joi.string().guid().optional().allow(null),
      status: Joi.string().valid('pending', 'active', 'inactive', 'suspended').default('pending'),
      created_by: Joi.string()
        .uuid({ version: ['uuidv4'] })
        .optional()
        .allow(null),
      first_login_password_change: Joi.boolean().default(true),
      phone: Joi.string().allow(null, ''),
      whatsapp: Joi.string().allow(null, ''),
    })
      .custom((value, helpers) => {
        // Ensure at least one of email or username is provided
        const hasEmail = value.email && value.email.trim() !== '';
        const hasUsername = value.username && value.username.trim() !== '';

        if (!hasEmail && !hasUsername) {
          return helpers.error('custom.usernameOrEmail');
        }

        return value;
      })
      .messages({
        'custom.usernameOrEmail': 'É necessário fornecer pelo menos um e-mail ou nome de usuário',
      });
  }

  /**
   * Validation schema for user updates (updated for multiple roles)
   */
  get updateSchema() {
    return Joi.object({
      email: Joi.string().email().allow(null, ''),
      username: Joi.string().alphanum().min(3).max(100).allow(null),
      full_name: Joi.string().trim().min(2).max(255),
      restaurant_id: Joi.string().guid().allow(null),
      status: Joi.string().valid('pending', 'active', 'inactive', 'suspended'),
      email_confirmed: Joi.boolean(),
      first_login_password_change: Joi.boolean(),
      last_login_at: Joi.date(),
      password_reset_token: Joi.string().allow(null),
      password_reset_expires: Joi.date().allow(null),
      phone: Joi.string().allow(null, ''),
      whatsapp: Joi.string().allow(null, ''),
    }).min(1);
  }

  /**
   * Override sanitizeOutput to add computed fields
   * @param {Object} data - Raw data from database
   * @param {Array} sensitiveFields - Fields to remove
   * @returns {Object} Sanitized data with computed fields
   */
  sanitizeOutput(data, sensitiveFields = []) {
    if (!data) return data;

    // Call parent sanitizeOutput first
    const sanitized = super.sanitizeOutput(data, sensitiveFields);

    // Add computed fields
    if (sanitized.status) {
      sanitized.is_active = sanitized.status === 'active';
    }

    return sanitized;
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
   * Find user by ID with creator name
   */
  async findByIdWithCreator(id) {
    this.logger.debug('Finding user by ID with creator name', { user_id: id });
    try {
      let query, values;

      if (this.isValidUuid(id)) {
        const { sanitizedUuid } = this.validateUuid(id);
        query = `
          SELECT
            u.*,
            creator.full_name AS created_by_name
          FROM users u
          LEFT JOIN users creator ON u.created_by = creator.id
          WHERE u.id = $1
          LIMIT 1
        `;
        values = [sanitizedUuid];
      } else if (/^\d+$/.test(id)) {
        query = `
          SELECT
            u.*,
            creator.full_name AS created_by_name
          FROM users u
          LEFT JOIN users creator ON u.created_by = creator.id
          WHERE u.id = $1
          LIMIT 1
        `;
        values = [Number(id)];
      } else {
        throw new Error('Formato de ID de usuário inválido. Deve ser um UUID ou número.');
      }

      const result = await this.executeQuery(query, values);

      console.log('=== findByIdWithCreator Debug ===');
      console.log('Query:', query);
      console.log('Values:', values);
      console.log('Result rows:', result.rows?.length);
      if (result.rows?.length > 0) {
        console.log('User data:', result.rows[0]);
        console.log('created_by_name value:', result.rows[0].created_by_name);
      }
      console.log('=====================================');

      if (result.rows && result.rows.length > 0) {
        const user = result.rows[0];
        return this.sanitizeOutput(user, this.sensitiveFields);
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to find user by ID with creator', {
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
          LEFT JOIN LATERAL (
            SELECT
              roles.name as role_name,
              roles.display_name as role_display_name,
              roles.is_admin_role
            FROM user_roles ur
            JOIN roles ON ur.role_id = roles.id
            WHERE ur.user_id = u.id
              AND ur.is_active = true
              AND (ur.valid_until IS NULL OR ur.valid_until > CURRENT_TIMESTAMP)
            ORDER BY roles.level DESC, ur.created_at ASC
            LIMIT 1
          ) primary_role ON true
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
          LEFT JOIN LATERAL (
            SELECT
              roles.name as role_name,
              roles.display_name as role_display_name,
              roles.is_admin_role
            FROM user_roles ur
            JOIN roles ON ur.role_id = roles.id
            WHERE ur.user_id = u.id
              AND ur.is_active = true
              AND (ur.valid_until IS NULL OR ur.valid_until > CURRENT_TIMESTAMP)
            ORDER BY roles.level DESC, ur.created_at ASC
            LIMIT 1
          ) primary_role ON true
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
          is_active: row.status === 'active', // Convert status to boolean
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

      // Ensure user will still have at least one of email or username after update
      const finalEmail = validatedData.hasOwnProperty('email')
        ? validatedData.email
        : currentUser.email;
      const finalUsername = validatedData.hasOwnProperty('username')
        ? validatedData.username
        : currentUser.username;

      const hasEmail = finalEmail && finalEmail.trim() !== '';
      const hasUsername = finalUsername && finalUsername.trim() !== '';

      if (!hasEmail && !hasUsername) {
        throw new Error('É necessário manter pelo menos um e-mail ou nome de usuário');
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
   * Update last login timestamp for a user
   */
  async updateLastLogin(userId) {
    this.logger.debug('Updating last login time', { userId });
    try {
      const query = `
        UPDATE ${this.tableName}
        SET last_login_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, last_login_at
      `;
      const result = await this.executeQuery(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error('Failed to update last login time', {
        userId,
        error: error.message,
      });
      throw error;
    }
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
          creator.full_name AS created_by_name
        FROM users u
        LEFT JOIN restaurants r ON u.restaurant_id = r.id
        LEFT JOIN users creator ON u.created_by = creator.id
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
        LEFT JOIN roles ro ON ur.role_id = ro.id
      `;

      // Build count query
      let countQuery = `
        SELECT COUNT(DISTINCT u.id) as total
        FROM users u
        LEFT JOIN restaurants r ON u.restaurant_id = r.id
        LEFT JOIN users creator ON u.created_by = creator.id
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
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
      if (filters.role) {
        paramCount++;
        whereConditions.push(`ur.role_id = $${paramCount}`);
        params.push(filters.role);
      }

      // Add status filter
      if (filters.status) {
        paramCount++;
        whereConditions.push(`u.status = $${paramCount}`);
        params.push(filters.status);
      }

      // Add location filter - using the correct table structure
      if (filters.location) {
        paramCount++;
        whereConditions.push(`EXISTS (
          SELECT 1 FROM user_location_assignments ula
          WHERE ula.user_id = u.id AND ula.location_id = $${paramCount}
        )`);
        params.push(filters.location);
      }

      // Add search functionality
      if (search && search.fields && search.term) {
        paramCount++;
        const searchConditions = search.fields
          .map((field) => {
            if (field === 'full_name') {
              return `u.full_name ILIKE $${paramCount}`;
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
      const orderByClause = orderBy || 'created_at DESC';
      // Parse the orderBy to separate column and direction
      const orderByParts = orderByClause.split(' ');
      const sortColumn = orderByParts[0];
      const sortDirection = orderByParts[1] || 'ASC';

      // Use the column name as provided - the database has full_name column
      query += ` ORDER BY u.${sortColumn} ${sortDirection} LIMIT ${limit} OFFSET ${offset}`;

      // Add detailed logging for debugging
      this.logger.info('=== SQL QUERY DEBUG ===', {
        finalQuery: query,
        parameters: params,
        sortColumn,
        sortDirection,
        orderByClause,
        limit,
        offset,
      });

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

  /**
   * Get users by restaurant with filters and pagination
   * @param {string} restaurantId - Restaurant ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Users with pagination info
   */
  async getUsersByRestaurant(restaurantId, filters = {}) {
    this.logger.debug('Getting users by restaurant', { restaurantId, filters });

    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'full_name',
        sortOrder = 'asc',
        status,
        role,
        search,
      } = filters;

      const offset = (page - 1) * limit;
      const validSortOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

      // Build WHERE conditions
      const conditions = ['u.restaurant_id = $1'];
      const params = [restaurantId];
      let paramIndex = 2;

      // Status filter
      if (status) {
        conditions.push(`u.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      // Role filter by role ID
      if (role) {
        conditions.push(`EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = u.id AND ur.role_id = $${paramIndex}
        )`);
        params.push(role);
        paramIndex++;
      }

      // Search filter
      if (search) {
        conditions.push(`(
          u.full_name ILIKE $${paramIndex} OR
          u.email ILIKE $${paramIndex} OR
          u.username ILIKE $${paramIndex}
        )`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        ${whereClause}
      `;

      const countResult = await this.executeQuery(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].total);

      // Main query with role and location data
      const query = `
        SELECT
          u.id,
          u.full_name,
          u.email,
          u.username,
          u.phone,
          u.status,
          u.restaurant_id,
          u.created_at,
          u.updated_at,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'role_id', r.id,
                'role_name', r.name,
                'role_display_name', r.display_name,
                'location_id', rl.id,
                'location_name', rl.name,
                'location_url_name', rl.url_name
              )
            ) FILTER (WHERE r.id IS NOT NULL),
            '[]'
          ) as role_location_pairs
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        LEFT JOIN restaurant_locations rl ON ur.location_id = rl.id
        ${whereClause}
        GROUP BY u.id, u.full_name, u.email, u.username, u.phone, u.status, u.restaurant_id, u.created_at, u.updated_at
        ORDER BY u.${sortBy} ${validSortOrder}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const result = await this.executeQuery(query, params);
      const users = result.rows.map((user) => ({
        ...user,
        role_location_pairs:
          typeof user.role_location_pairs === 'string'
            ? JSON.parse(user.role_location_pairs)
            : user.role_location_pairs,
      }));

      return {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get users by restaurant', {
        restaurantId,
        filters,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = UserModel;
