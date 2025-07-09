const userModel = require('../models/userModel');
const { logger } = require('../utils/logger');
const ResponseFormatter = require('../utils/responseFormatter');
const { sendMail } = require('../utils/mailer');
const crypto = require('crypto');
const ejs = require('ejs');
const path = require('path');

/**
 * User Service
 * Handles business logic for user management operations
 * Provides dependency injection interface for controllers
 */
class UserService {
  constructor(userModelInstance = userModel) {
    this.userModel = userModelInstance;
    this.logger = logger.child({ service: 'UserService' });
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData, currentUser = null) {
    const operationId = `create_user_${Date.now()}`;
    const logMeta = {
      operation: 'createUser',
      operationId,
      currentUserId: currentUser?.id,
    };

    this.logger.info('Creating new user', {
      ...logMeta,
      role: userData.role,
      hasEmail: !!userData.email,
      hasUsername: !!userData.username,
      restaurantId: userData.restaurant_id,
    });

    try {
      // Add created_by field if current user exists
      if (currentUser) {
        userData.created_by = currentUser.id;
      }

      // Check authorization for restaurant assignment
      if (userData.restaurant_id && currentUser) {
        await this.validateRestaurantAccess(userData.restaurant_id, currentUser);
      }

      // Generate email confirmation token and expiration if email is present
      // if (userData.email) {
      //   userData.email_confirmation_token = crypto.randomBytes(32).toString('hex');
      //   userData.email_confirmation_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h expiry
      // }

      const newUser = await this.userModel.create(userData);

      this.logger.info('User created successfully', {
        ...logMeta,
        userId: newUser.id,
        role: newUser.role,
        status: newUser.status,
      });

      this.logger.info('user ==================', { to: newUser });

      // Send email confirmation if email exists
      if (newUser.email && newUser.email_confirmation_token) {
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const confirmUrl = `${appUrl}/confirm-email?token=${newUser.email_confirmation_token}`;
        const templatePath = path.join(__dirname, '../templates/confirmationEmail.ejs');
        const html = await ejs.renderFile(templatePath, {
          name: newUser.full_name || newUser.username || newUser.email,
          confirmUrl,
          year: new Date().getFullYear(),
          logoUrl: `${appUrl}/images/logo.png`,
        });
        try {
          await sendMail({
            to: newUser.email,
            cc: 'flavio_luiz_ferreira@hotmail.com',
            subject: 'Bem-vindo ao À La Carte! Confirme seu e-mail',
            html,
            text: `Olá,\n\nBem-vindo ao À La Carte! Por favor, confirme seu e-mail acessando o link: ${confirmUrl}\n\nSe você não solicitou este cadastro, ignore este e-mail.`,
          });
          this.logger.info('Confirmation email sent', { to: newUser.email });
        } catch (mailErr) {
          this.logger.error('Failed to send confirmation email', { error: mailErr.message });
        }
      }

      return newUser;
    } catch (error) {
      // Translate error for end user
      let mensagemErro = error.message;
      if (mensagemErro.includes('duplicate key') && mensagemErro.includes('email')) {
        mensagemErro = 'Já existe um usuário cadastrado com este e-mail.';
      } else if (mensagemErro === 'User not found') {
        mensagemErro = 'Usuário não encontrado.';
      } else if (mensagemErro === 'Insufficient permissions to access this user') {
        mensagemErro = 'Permissões insuficientes para acessar este usuário.';
      } else if (mensagemErro === 'Cannot deactivate your own account') {
        mensagemErro = 'Não é possível desativar a sua própria conta.';
      } else if (mensagemErro === 'Unauthorized to change this password') {
        mensagemErro = 'Não autorizado a alterar esta senha.';
      } else if (mensagemErro === 'Current password is incorrect') {
        mensagemErro = 'A senha atual está incorreta.';
      }
      this.logger.error('Failed to create user', {
        ...logMeta,
        error: mensagemErro,
        code: error.code,
      });
      throw new Error(mensagemErro);
    }
  }

  /**
   * Get user by ID
   * @param {String} userId - User ID
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object|null>} User data or null
   */
  async getUserById(userId, currentUser) {
    const logMeta = {
      operation: 'getUserById',
      userId,
      currentUserId: currentUser?.id,
    };

    this.logger.debug('Fetching user by ID', logMeta);

    try {
      const user = await this.userModel.findById(userId);

      if (!user) {
        this.logger.warn('User not found', { ...logMeta, userId });
        // Translate error for end user
        throw new Error('Usuário não encontrado.');
      }

      // Check if current user can access this user's data
      await this.validateUserAccess(user, currentUser);

      this.logger.debug('User retrieved successfully', {
        ...logMeta,
        targetUserId: user.id,
        role: user.role,
        status: user.status,
      });

      return user;
    } catch (error) {
      this.logger.error('Failed to get user by ID', {
        ...logMeta,
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  async getUserByEmail(email) {
    const logMeta = {
      operation: 'getUserByEmail',
      email,
    };

    this.logger.debug('Fetching user by email', logMeta);

    try {
      const user = await this.userModel.findByEmail(email);

      if (!user) {
        this.logger.warn('User not found', { ...logMeta, email });
        return null;
      }

      this.logger.debug('User retrieved successfully', {
        ...logMeta,
        userId: user.id,
        role: user.role,
        status: user.status,
      });

      return user;
    } catch (error) {
      this.logger.error('Failed to get user by email', {
        ...logMeta,
        error: error.message,
        email,
      });
      throw error;
    }
  }

  /**
   * Get users with filtering and pagination
   * @param {Object} options - Query options
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Paginated users list
   */
  async getUsers(options, currentUser) {
    const logMeta = {
      operation: 'getUsers',
      currentUserId: currentUser?.id,
      filters: options,
    };

    this.logger.debug('Fetching users list', logMeta);

    try {
      const { page, limit, restaurant_id, role, status, search, sort_by, sort_order } = options;

      // Build query filters
      const filters = {};

      // Restrict access based on current user's role and restaurant
      if (currentUser.role === 'restaurant_administrator') {
        filters.restaurant_id = currentUser.restaurant_id;
      } else if (restaurant_id && currentUser.role !== 'restaurant_administrator') {
        await this.validateRestaurantAccess(restaurant_id, currentUser);
        filters.restaurant_id = restaurant_id;
      }

      if (role) filters.role = role;
      if (status) filters.status = status;

      // Build query options
      const queryOptions = {
        limit,
        offset: (page - 1) * limit,
        orderBy: `${sort_by} ${sort_order.toUpperCase()}`,
      };

      // Add search if provided
      if (search) {
        queryOptions.search = {
          fields: ['full_name', 'email', 'username'],
          term: search,
        };
      }

      const result = await this.userModel.findWithPagination(filters, queryOptions);

      const totalPages = Math.ceil(result.total / limit);

      this.logger.info('Users retrieved successfully', {
        ...logMeta,
        total: result.total,
        page,
        totalPages,
        returned: result.users.length,
      });

      return {
        users: result.users,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get users', {
        ...logMeta,
        error: error.message,
        options,
      });
      throw error;
    }
  }

  /**
   * Update user
   * @param {String} userId - User ID
   * @param {Object} updateData - Update data
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updateData, currentUser) {
    const operationId = `update_user_${userId}_${Date.now()}`;
    const logMeta = {
      operation: 'updateUser',
      operationId,
      userId,
      currentUserId: currentUser?.id,
    };

    this.logger.info('Updating user', {
      ...logMeta,
      fieldsToUpdate: Object.keys(updateData),
    });

    try {
      // Get existing user to validate access
      const existingUser = await this.userModel.findById(userId);
      if (!existingUser) {
        // Translate error for end user
        const error = new Error('Usuário não encontrado.');
        error.statusCode = 404;
        throw error;
      }

      // Validate access to update this user
      await this.validateUserAccess(existingUser, currentUser, 'update');

      // Validate restaurant assignment if being updated
      if (updateData.restaurant_id) {
        await this.validateRestaurantAccess(updateData.restaurant_id, currentUser);
      }

      // Prevent self-status changes for certain scenarios
      if (currentUser.id === userId && updateData.status === 'inactive') {
        // Translate error for end user
        const error = new Error('Não é possível desativar a sua própria conta.');
        error.statusCode = 403;
        throw error;
      }

      const updatedUser = await this.userModel.update(userId, updateData);

      this.logger.info('User updated successfully', {
        ...logMeta,
        userId: updatedUser.id,
        updatedFields: Object.keys(updateData),
      });

      return updatedUser;
    } catch (error) {
      this.logger.error('Failed to update user', {
        ...logMeta,
        error: error.message,
        userId,
        updateData: Object.keys(updateData),
      });
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   * @param {String} userId - User ID
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Boolean>} Success status
   */
  async deleteUser(userId, currentUser) {
    const logMeta = {
      operation: 'deleteUser',
      userId,
      currentUserId: currentUser?.id,
    };

    this.logger.info('Deleting user', logMeta);

    try {
      // Get existing user to validate access
      const existingUser = await this.userModel.findById(userId);
      if (!existingUser) {
        // Translate error for end user
        const error = new Error('Usuário não encontrado.');
        error.statusCode = 404;
        throw error;
      }

      // Prevent self-deletion
      if (currentUser.id === userId) {
        // Translate error for end user
        const error = new Error('Não é possível excluir a sua própria conta.');
        error.statusCode = 403;
        throw error;
      }

      // Validate access to delete this user
      await this.validateUserAccess(existingUser, currentUser, 'delete');

      const result = await this.userModel.deleteUser(userId);

      this.logger.info('User deleted successfully', {
        ...logMeta,
        deleted: result,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to delete user', {
        ...logMeta,
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Change user password
   * @param {String} userId - User ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Updated user
   */
  async changePassword(userId, currentPassword, newPassword, currentUser) {
    const logMeta = {
      operation: 'changePassword',
      userId,
      currentUserId: currentUser?.id,
    };

    this.logger.info('Changing user password', logMeta);

    try {
      // Get existing user
      const existingUser = await this.userModel.findById(userId);
      if (!existingUser) {
        // Translate error for end user
        const error = new Error('Usuário não encontrado.');
        error.statusCode = 404;
        throw error;
      }

      // Only allow users to change their own password or admin to change any
      if (currentUser.id !== userId && !this.isAdmin(currentUser)) {
        // Translate error for end user
        const error = new Error('Não autorizado a alterar esta senha.');
        error.statusCode = 403;
        throw error;
      }

      // Verify current password (skip for admin changing other's password)
      if (currentUser.id === userId) {
        const isValidPassword = await this.userModel.verifyPassword(
          currentPassword,
          existingUser.password
        );

        if (!isValidPassword) {
          // Translate error for end user
          const error = new Error('A senha atual está incorreta.');
          error.statusCode = 400;
          throw error;
        }
      }

      const updatedUser = await this.userModel.changePassword(userId, newPassword);

      this.logger.info('Password changed successfully', {
        ...logMeta,
        userId,
      });

      return updatedUser;
    } catch (error) {
      this.logger.error('Failed to change password', {
        ...logMeta,
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Confirm email address
   * @param {String} token - Confirmation token
   * @returns {Promise<Object>} Updated user
   */
  async confirmEmail(token) {
    const serviceLogger = this.logger.child({
      operation: 'confirmEmail',
    });

    serviceLogger.info('Confirming email');

    try {
      const user = await this.userModel.confirmEmail(token);

      if (!user) {
        // Translate error for end user
        const error = new Error('Token de confirmação inválido ou expirado.');
        error.statusCode = 400;
        throw error;
      }

      serviceLogger.info('Email confirmed successfully', {
        userId: user.id,
      });

      return user;
    } catch (error) {
      serviceLogger.error('Failed to confirm email', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get users by restaurant
   * @param {String} restaurantId - Restaurant ID
   * @param {Object} filters - Optional filters
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Users and pagination info
   */
  async getUsersByRestaurant(restaurantId, filters = {}, currentUser = null) {
    const operationId = `get_users_by_restaurant_${Date.now()}`;
    const logMeta = {
      operation: 'getUsersByRestaurant',
      operationId,
      restaurantId,
      currentUserId: currentUser?.id,
    };

    this.logger.info('Retrieving users by restaurant', {
      ...logMeta,
      filters,
    });

    try {
      // Validate restaurant access
      await this.validateRestaurantAccess(restaurantId, currentUser);

      // Get users from restaurant
      const result = await this.userModel.getUsersByRestaurant(restaurantId, filters);

      this.logger.info('Users retrieved successfully', {
        ...logMeta,
        userCount: result.users.length,
        totalCount: result.pagination.total,
      });

      return result;
    } catch (error) {
      this.logger.error('Error retrieving users by restaurant', {
        ...logMeta,
        error: error.message,
        restaurantId,
      });
      throw error;
    }
  }

  /**
   * Resend confirmation email
   * @param {Object} params - { email, username }
   * @returns {Promise<void>}
   */
  async resendConfirmationEmail({ email_confirmation_token }) {
    const serviceLogger = this.logger.child({ operation: 'resendConfirmationEmail' });
    serviceLogger.info('Resending confirmation email', { email_confirmation_token });
    // Find user by email or username
    let user = null;
    if (email_confirmation_token) {
      user = await this.userModel.findByEmailConfirmationToken(email_confirmation_token);
    }

    if (!user) {
      // Translate error for end user
      const error = new Error('Usuário não encontrado. Verifique o token de confirmação.');
      error.statusCode = 404;
      serviceLogger.warn('User not found for confirmation email', {
        email_confirmation_token,
      });
      throw error;
    }

    if (user.email_confirmed) {
      throw new Error('O e-mail já foi confirmado.');
    }
    // Generate new token and expiration
    const token = this.userModel.generateEmailConfirmationToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.userModel.updateEmailConfirmationToken(user.id, token, expires);
    // Send confirmation email
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const confirmUrl = `${appUrl}/confirm-email?token=${token}`;
    const templatePath = path.join(__dirname, '../templates/confirmationEmail.ejs');
    const html = await ejs.renderFile(templatePath, {
      name: user.full_name || user.username || user.email,
      confirmUrl,
      year: new Date().getFullYear(),
      logoUrl: `${appUrl}/images/logo.png`,
    });
    try {
      await sendMail({
        to: user.email,
        cc: 'flavio_luiz_ferreira@hotmail.com',
        subject: 'Bem-vindo ao À La Carte! Confirme seu e-mail',
        html,
        text: `Olá,\n\nBem-vindo ao À La Carte! Por favor, confirme seu e-mail acessando o link: ${confirmUrl}\n\nSe você não solicitou este cadastro, ignore este e-mail.`,
      });
      serviceLogger.info('Confirmation email resent', { to: user.email });
    } catch (mailErr) {
      serviceLogger.error('Failed to resend confirmation email', { error: mailErr.message });
      throw new Error('Erro ao enviar o e-mail de confirmação.');
    }
  }

  /**
   * Validate user access permissions
   * @param {Object} targetUser - User being accessed
   * @param {Object} currentUser - Current authenticated user
   * @param {String} operation - Operation being performed
   */
  async validateUserAccess(targetUser, currentUser, operation = 'read') {
    const serviceLogger = this.logger.child({
      operation: 'validateUserAccess',
      targetUserId: targetUser.id,
      currentUserId: currentUser.id,
      accessOperation: operation,
    });

    // Super admin can access everything
    if (this.isSuperAdmin(currentUser)) {
      return true;
    }

    // Restaurant administrators can manage users in their restaurant
    if (currentUser.role === 'restaurant_administrator') {
      if (targetUser.restaurant_id !== currentUser.restaurant_id) {
        // Translate error for end user
        const error = new Error('Permissões insuficientes para acessar este usuário.');
        error.statusCode = 403;
        serviceLogger.warn('Access denied - different restaurant', {
          currentUserRestaurant: currentUser.restaurant_id,
          targetUserRestaurant: targetUser.restaurant_id,
        });
        throw error;
      }
      return true;
    }

    // Users can only access their own data
    if (currentUser.id === targetUser.id) {
      return true;
    }

    const error = new Error('Permissões insuficientes para acessar este usuário.');
    error.statusCode = 403;
    serviceLogger.warn('Access denied - insufficient permissions');
    throw error;
  }

  /**
   * Validate restaurant access permissions
   * @param {String} restaurantId - Restaurant ID
   * @param {Object} currentUser - Current authenticated user
   */
  async validateRestaurantAccess(restaurantId, currentUser) {
    if (this.isSuperAdmin(currentUser)) {
      return true;
    }

    if (
      currentUser.role === 'restaurant_administrator' &&
      currentUser.restaurant_id === restaurantId
    ) {
      return true;
    }

    const error = new Error('Insufficient permissions to access this restaurant');
    error.statusCode = 403;
    throw error;
  }

  /**
   * Check if user is super admin
   * @param {Object} user - User object
   * @returns {Boolean} Is super admin
   */
  isSuperAdmin(user) {
    return user.role === 'restaurant_administrator' && !user.restaurant_id;
  }

  /**
   * Check if user is admin (any admin role)
   * @param {Object} user - User object
   * @returns {Boolean} Is admin
   */
  isAdmin(user) {
    return ['restaurant_administrator', 'location_administrator'].includes(user.role);
  }
}

module.exports = UserService;
