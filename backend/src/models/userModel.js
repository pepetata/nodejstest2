const BaseModel = require('./BaseModel');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

/**
 * User Model
 * Handles user management with role-based access control for restaurant operations
 */
class UserModel extends BaseModel {
  constructor() {
    super();
    this.tableName = 'users';
    // this.sensitiveFields = ['password', 'email_confirmation_token', 'password_reset_token'];
    this.sensitiveFields = ['password'];
    this.logger = logger.child({ model: 'UserModel' });
  }

  /**
   * UUID validation schema
   */
  get uuidSchema() {
    return Joi.string().guid().required();
  }

  /**
   * Validation schema for user creation
   */
  get createSchema() {
    return Joi.object({
      email: Joi.string()
        .email()
        .when('role', {
          is: Joi.string().valid('restaurant_administrator', 'location_administrator'),
          then: Joi.required(),
          otherwise: Joi.optional().allow(null),
        }),
      username: Joi.string().alphanum().min(3).max(100).when('email', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required(),
      }),
      password: Joi.string().min(8).max(255).required(),
      full_name: Joi.string().trim().min(2).max(255).required(),
      role: Joi.string()
        .valid(
          'restaurant_administrator',
          'location_administrator',
          'waiter',
          'food_runner',
          'kds_operator',
          'pos_operator'
        )
        .required(),
      restaurant_id: Joi.string()
        .guid()
        .when('role', {
          is: 'restaurant_administrator',
          then: Joi.required(),
          otherwise: Joi.optional().allow(null),
        }),
      status: Joi.string().valid('pending', 'active', 'inactive', 'suspended').default('pending'),
      created_by: Joi.string()
        .uuid({ version: ['uuidv4'] })
        .optional()
        .allow(null),
      first_login_password_change: Joi.boolean().default(true),
    });
  }

  /**
   * Validation schema for user updates
   */
  get updateSchema() {
    return Joi.object({
      email: Joi.string().email().allow(null),
      username: Joi.string().alphanum().min(3).max(100).allow(null),
      full_name: Joi.string().trim().min(2).max(255),
      role: Joi.string().valid(
        'restaurant_administrator',
        'location_administrator',
        'waiter',
        'food_runner',
        'kds_operator',
        'pos_operator'
      ),
      restaurant_id: Joi.string().guid().allow(null),
      status: Joi.string().valid('pending', 'active', 'inactive', 'suspended'),
      email_confirmed: Joi.boolean(),
      first_login_password_change: Joi.boolean(),
      last_login_at: Joi.date(),
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
   * Create new user
   */
  async create(userData) {
    this.logger.info('Creating new user', {
      email: userData.email,
      username: userData.username,
      role: userData.role,
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
        role: user.role,
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
      if (!this.isValidUuid(id)) {
        throw new Error('Formato de ID de usuário inválido. Deve ser um UUID válido.');
      }

      const { sanitizedUuid } = this.validateUuid(id);
      const user = await super.findById(sanitizedUuid, columns);

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
        SET ${clause}, updated_at = CURRENT_TIMESTAMP
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
            email_confirmation_expires = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE email_confirmation_token = $1
          AND email_confirmation_expires > CURRENT_TIMESTAMP
          AND email_confirmed = false
        RETURNING *
      `;

      const result = await this.executeQuery(query, [token]);

      if (result.rows.length > 0) {
        const user = this.sanitizeOutput(result.rows[0], this.sensitiveFields);
        this.logger.info('Email confirmed successfully', { user_id: user.id });
        return user;
      }

      // If not updated, check if already confirmed
      const alreadyConfirmed = await this.find({
        email_confirmation_token: token,
        email_confirmed: true,
      });
      if (alreadyConfirmed && alreadyConfirmed.length > 0) {
        const user = this.sanitizeOutput(alreadyConfirmed[0], this.sensitiveFields);
        const err = new Error('E-mail já confirmado.');
        err.code = 'ALREADY_CONFIRMED';
        err.alreadyConfirmed = true;
        err.user = user;
        throw err;
      }

      throw new Error('Token de confirmação inválido ou expirado.');
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
}

module.exports = UserModel;
