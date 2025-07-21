const UserModel = require('../models/userModel');
const RoleModel = require('../models/RoleModel');
const UserRoleModel = require('../models/UserRoleModel');
const userModel = new UserModel();
const { logger } = require('../utils/logger');
const ResponseFormatter = require('../utils/responseFormatter');
const { sendMail } = require('../utils/mailer');
const { sendConfirmationEmail, sendPostConfirmationEmail } = require('./emailService');
const crypto = require('crypto');
const ejs = require('ejs');
const path = require('path');
const db = require('../config/db');

// ...existing code...
class UserService {
  constructor(userModelInstance = userModel) {
    this.userModel = userModelInstance;
    this.roleModel = new RoleModel();
    this.UserRoleModel = new UserRoleModel();
    this.logger = logger.child({ service: 'UserService' });
    this.db = db;
  }

  /**
   * Forgot password (send reset link)
   * @param {string} email
   */
  async forgotPassword(email) {
    this.logger.info('Forgot password requested', { email });
    if (!email) throw new Error('E-mail é obrigatório.');
    const user = await this.userModel.findByEmail(email);
    // Always respond as if successful for security
    if (!user) return;
    // Generate reset token and expiry
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.userModel.update(user.id, {
      password_reset_token: token,
      password_reset_expires: expires,
    });
    // Send email using professional template
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    const logoUrl = `${appUrl}/images/logo.png`;
    const year = new Date().getFullYear();
    const templatePath = path.join(__dirname, '../templates/passwordResetEmail.ejs');
    try {
      const html = await ejs.renderFile(templatePath, {
        name: user.full_name || user.username || user.email,
        resetUrl,
        year,
        logoUrl,
      });
      await sendMail({
        to: user.email,
        subject: 'Redefinição de senha',
        html,
        text: `Olá, recebemos uma solicitação para redefinir sua senha no À La Carte. Se não foi você, ignore este e-mail. Para redefinir, acesse: ${resetUrl}`,
      });
      this.logger.info('Password reset email sent', { to: user.email });
    } catch (mailErr) {
      this.logger.error('Failed to send password reset email', { error: mailErr.message });
    }
  }

  /**
   * Reset password using token
   * @param {string} token
   * @param {string} newPassword
   */
  async resetPassword(token, newPassword) {
    this.logger.info('Reset password requested', { token });
    if (!token || !newPassword) throw new Error('Token e nova senha são obrigatórios.');
    // Find user by password reset token
    const user = await this.userModel.findByPasswordResetToken(token);
    if (!user) throw new Error('Token de redefinição inválido ou expirado.');
    if (!user.password_reset_expires || new Date(user.password_reset_expires) < new Date()) {
      throw new Error('Token de redefinição expirado. Solicite um novo link.');
    }
    // Update password, clear token/expiry
    await this.userModel.update(user.id, {
      password: await this.userModel.hashPassword(newPassword),
      password_reset_token: null,
      password_reset_expires: null,
    });
    // Send success email (optional)
    try {
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const logoUrl = `${appUrl}/images/logo.png`;
      const year = new Date().getFullYear();
      const templatePath = path.join(__dirname, '../templates/passwordResetSuccessEmail.ejs');
      const html = await ejs.renderFile(templatePath, {
        name: user.full_name || user.username || user.email,
        year,
        logoUrl,
      });
      await sendMail({
        to: user.email,
        subject: 'Senha redefinida com sucesso',
        html,
        text: `Olá, sua senha foi redefinida com sucesso no À La Carte. Se não foi você, entre em contato imediatamente.`,
      });
      this.logger.info('Password reset success email sent', { to: user.email });
    } catch (mailErr) {
      this.logger.error('Failed to send password reset success email', { error: mailErr.message });
    }
  }

  /**
   * Create a new user with role assignments
   * @param {Object} userData - User data with role_location_pairs
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData, currentUser = null, { onUserExists } = {}) {
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
      roleLocationPairs: userData.role_location_pairs?.length || 0,
    });

    try {
      // Add created_by field if current user exists
      if (currentUser) {
        userData.created_by = currentUser.id;

        // Auto-assign restaurant_id from current user if not provided
        if (!userData.restaurant_id && currentUser.restaurant_id) {
          userData.restaurant_id = currentUser.restaurant_id;
          this.logger.info('Auto-assigned restaurant_id from current user', {
            ...logMeta,
            assignedRestaurantId: currentUser.restaurant_id,
          });
        }
      }

      // Check authorization for restaurant assignment
      if (userData.restaurant_id && currentUser) {
        await this.validateRestaurantAccess(userData.restaurant_id, currentUser);
      }

      // Check if user already exists by email
      if (userData.email) {
        const existingUser = await this.userModel.findByEmail(userData.email);
        if (existingUser) {
          this.logger.warn('User already exists with this email', { email: userData.email });
          if (onUserExists && typeof onUserExists === 'function') {
            await onUserExists(existingUser);
          }
          throw new Error('Já existe um usuário cadastrado com este e-mail.');
        }

        // Only set email confirmation for restaurant registration users
        // Admin created users don't need email confirmation
        if (!currentUser || userData.isRegistration === true) {
          userData.email_confirmation_token = crypto.randomBytes(32).toString('hex');
          userData.email_confirmation_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h expiry
        }
      }

      // Extract role_location_pairs before creating user
      const roleLocationPairs = userData.role_location_pairs || [];

      // Validate role_location_pairs
      if (!roleLocationPairs || roleLocationPairs.length === 0) {
        throw new Error('Role is required');
      }

      delete userData.role_location_pairs;

      // Convert empty email to null to avoid database constraint issues
      if (!userData.email || userData.email.trim() === '') {
        userData.email = null;
      }

      // Convert empty username to null to avoid database constraint issues
      if (!userData.username || userData.username.trim() === '') {
        userData.username = null;
      }

      // Ensure at least one of email or username is provided (database constraint requires one or the other)
      if (!userData.email && !userData.username) {
        // Generate username automatically if neither email nor username is provided
        const nameBase = userData.full_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const timestamp = Date.now().toString().slice(-6);
        userData.username = `${nameBase}${timestamp}`;

        this.logger.info('Auto-generated username for user', {
          ...logMeta,
          generatedUsername: userData.username,
        });
      }

      // Set status to active for admin created users, pending for registration users
      if (currentUser && !userData.isRegistration) {
        userData.status = 'active';
      } else if (!userData.status) {
        userData.status = 'pending';
      }

      const newUser = await this.userModel.create(userData);

      this.logger.info('User created successfully', {
        ...logMeta,
        userId: newUser.id,
        role: newUser.role,
        status: newUser.status,
      });

      // Handle role assignments if provided
      if (roleLocationPairs.length > 0) {
        this.logger.info('Assigning roles to new user', {
          userId: newUser.id,
          roleCount: roleLocationPairs.length,
        });

        // Create role assignments with location context
        for (const pair of roleLocationPairs) {
          await this.UserRoleModel.create({
            user_id: newUser.id,
            role_id: pair.role_id,
            location_id: pair.location_id, // Include location_id in role assignment
            assigned_by: currentUser?.id,
          });
        }

        this.logger.info('Role assignments completed', {
          userId: newUser.id,
          assignmentsCreated: roleLocationPairs.length,
        });
      }

      this.logger.info('user ==================', { to: newUser });

      // Send email confirmation if email exists and user requires confirmation
      if (newUser.email && newUser.email_confirmation_token) {
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const confirmUrl = `${appUrl}/confirm-email?token=${newUser.email_confirmation_token}`;
        const logoUrl = `${appUrl}/images/logo.png`;
        try {
          await sendConfirmationEmail({
            to: newUser.email,
            name: newUser.full_name || newUser.username || newUser.email,
            confirmUrl,
            year: new Date().getFullYear(),
            logoUrl,
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
      const user = await this.userModel.findByIdWithCreator(userId);

      if (!user) {
        this.logger.warn('User not found', { ...logMeta, userId });
        // Translate error for end user
        throw new Error('Usuário não encontrado.');
      }

      // Check if current user can access this user's data
      await this.validateUserAccess(user, currentUser);

      // Add role_location_pairs to the user
      try {
        const roleLocationPairs = await this.getUserRoleLocationPairs(user.id);
        user.role_location_pairs = roleLocationPairs;
      } catch (error) {
        this.logger.warn('Failed to get role-location pairs for user', {
          userId: user.id,
          error: error.message,
        });
        user.role_location_pairs = [];
      }

      this.logger.debug('User retrieved successfully', {
        ...logMeta,
        targetUserId: user.id,
        role: user.role,
        status: user.status,
        roleLocationPairsCount: user.role_location_pairs?.length || 0,
        hasCreatorName: !!user.created_by_name,
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
   * Get role-location pairs for a user (for frontend compatibility)
   * @param {String} userId - User ID
   * @returns {Array} Array of role-location pairs
   */
  async getUserRoleLocationPairs(userId) {
    try {
      const query = `
        SELECT DISTINCT
          ur.role_id,
          ur.restaurant_id,
          ur.location_id,
          r.name as role_name,
          r.display_name as role_display_name,
          rl.name as location_name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        LEFT JOIN restaurant_locations rl ON ur.location_id = rl.id
        WHERE ur.user_id = $1 AND ur.is_active = true
        ORDER BY r.name, rl.name
      `;

      const result = await this.db.query(query, [userId]);

      return result.rows.map((row) => ({
        role_id: row.role_id,
        restaurant_id: row.restaurant_id,
        location_id: row.location_id,
        role_name: row.role_name,
        role_display_name: row.role_display_name,
        location_name: row.location_name,
      }));
    } catch (error) {
      this.logger.error('Failed to get user role-location pairs', {
        userId,
        error: error.message,
      });
      return [];
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

    // Add detailed logging for debugging sorting/filtering issues
    this.logger.info('=== DEBUGGING USER RETRIEVAL ===', {
      receivedOptions: options,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      sort_by: options.sort_by,
      sort_order: options.sort_order,
      location: options.location,
      role: options.role,
      status: options.status,
      allKeys: Object.keys(options),
    });

    this.logger.debug('Fetching users list', logMeta);

    try {
      const {
        page = 1,
        limit = 10,
        restaurant_id,
        role,
        status,
        search,
        location,
        sort_by = 'full_name',
        sort_order = 'asc',
        sortBy = 'full_name',
        sortOrder = 'asc',
      } = options;

      // Use frontend parameter names if provided, fallback to backend names
      const finalSortBy = sortBy || sort_by;
      const finalSortOrder = sortOrder || sort_order;

      // Add detailed logging for debugging
      this.logger.info('=== SORTING PARAMETERS ===', {
        originalSortBy: sortBy,
        originalSortOrder: sortOrder,
        fallbackSortBy: sort_by,
        fallbackSortOrder: sort_order,
        finalSortBy,
        finalSortOrder,
        willCreateOrderBy: `${finalSortBy} ${finalSortOrder.toUpperCase()}`,
      });

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
      if (location) {
        filters.location = location;
        this.logger.info('=== LOCATION FILTER APPLIED ===', {
          locationId: location,
          locationUUID: location,
        });
      }

      // Build query options
      const queryOptions = {
        limit: parseInt(limit),
        page: parseInt(page),
        orderBy: `${finalSortBy} ${finalSortOrder.toUpperCase()}`,
      };

      // Add search if provided
      if (search) {
        queryOptions.search = {
          fields: ['full_name', 'email', 'username'],
          term: search,
        };
      }

      const result = await this.userModel.findWithPagination(filters, queryOptions);

      // Add detailed logging for debugging results
      this.logger.info('=== QUERY RESULTS ===', {
        totalUsers: result.total,
        returnedUsers: result.users.length,
        firstUser: result.users[0]
          ? {
              name: result.users[0].full_name,
              email: result.users[0].email,
            }
          : null,
        lastUser: result.users[result.users.length - 1]
          ? {
              name: result.users[result.users.length - 1].full_name,
              email: result.users[result.users.length - 1].email,
            }
          : null,
        queryOptions,
        appliedFilters: filters,
      });

      // Add role_location_pairs to each user while preserving order
      const usersWithRolePairs = [];
      for (let i = 0; i < result.users.length; i++) {
        const user = result.users[i];
        try {
          // Get user's role-location pairs
          const roleLocationPairs = await this.getUserRoleLocationPairs(user.id);
          usersWithRolePairs.push({
            ...user,
            role_location_pairs: roleLocationPairs,
          });
        } catch (error) {
          this.logger.warn('Failed to get role-location pairs for user', {
            userId: user.id,
            error: error.message,
          });
          usersWithRolePairs.push({
            ...user,
            role_location_pairs: [],
          });
        }
      }

      const totalPages = Math.ceil(result.total / limit);

      this.logger.info('Users retrieved successfully', {
        ...logMeta,
        total: result.total,
        page,
        totalPages,
        returned: usersWithRolePairs.length,
      });

      return {
        users: usersWithRolePairs,
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

      // Extract role_location_pairs from updateData before updating basic user fields
      const roleLocationPairs = updateData.role_location_pairs;
      const userFieldsToUpdate = { ...updateData };
      delete userFieldsToUpdate.role_location_pairs;

      // Convert empty email to null to avoid database constraint issues
      if (
        userFieldsToUpdate.email !== undefined &&
        (!userFieldsToUpdate.email || userFieldsToUpdate.email.trim() === '')
      ) {
        userFieldsToUpdate.email = null;
      }

      // Convert empty username to null to avoid database constraint issues
      if (
        userFieldsToUpdate.username !== undefined &&
        (!userFieldsToUpdate.username || userFieldsToUpdate.username.trim() === '')
      ) {
        userFieldsToUpdate.username = null;
      }

      // Update basic user fields
      const updatedUser = await this.userModel.update(userId, userFieldsToUpdate);

      // Handle role_location_pairs if provided
      if (roleLocationPairs && Array.isArray(roleLocationPairs)) {
        this.logger.info('Updating role location pairs', {
          ...logMeta,
          pairsCount: roleLocationPairs.length,
        });

        // First, delete all existing role assignments for this user
        const deleteQuery = `
          DELETE FROM user_roles
          WHERE user_id = $1
        `;
        await this.UserRoleModel.executeQuery(deleteQuery, [userId]);

        // Create new role assignments
        for (let i = 0; i < roleLocationPairs.length; i++) {
          const pair = roleLocationPairs[i];
          const roleAssignment = {
            user_id: userId,
            role_id: pair.role_id,
            restaurant_id: updatedUser.restaurant_id,
            location_id: pair.location_id,
            assigned_by: currentUser?.id,
            is_primary_role: i === 0, // Set first role as primary
            is_active: true,
          };

          await this.UserRoleModel.create(roleAssignment);
        }
      }

      this.logger.info('User updated successfully', {
        ...logMeta,
        userId: updatedUser.id,
        updatedFields: Object.keys(userFieldsToUpdate),
        roleLocationPairsUpdated: !!roleLocationPairs,
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

      // Send post-confirmation email
      if (user.email) {
        // Lazy require to break circular dependency
        const restaurantService = require('./restaurantService');
        const restaurant = await restaurantService.getRestaurantById(user.restaurant_id);
        await sendPostConfirmationEmail({
          to: user.email,
          userName: user.full_name || user.username || user.email,
          restaurantUrlName: restaurant?.restaurant_url_name,
        });
        serviceLogger.info('Post-confirmation email sent', { to: user.email });
      }

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
   * @param {Object} params - { email_confirmation_token, email }
   * @returns {Promise<void>}
   */
  async resendConfirmationEmail({ email_confirmation_token, email }) {
    const serviceLogger = this.logger.child({ operation: 'resendConfirmationEmail' });
    serviceLogger.info('Resending confirmation email', { email_confirmation_token, email });
    // Find user by email or token
    let user = null;
    if (email_confirmation_token) {
      user = await this.userModel.findByEmailConfirmationToken(email_confirmation_token);
    }

    // If no user found with token (expired/cleared), try to find by email
    if (!user && email) {
      user = await this.userModel.findByEmail(email);
    }

    if (!user) {
      // If still no user found, provide helpful guidance
      // For expired tokens without email, we can't identify the user
      if (email_confirmation_token && !email) {
        const error = new Error(
          'Token de confirmação expirado. Por favor, informe seu e-mail para reenviar a confirmação.'
        );
        error.statusCode = 400;
        error.needsEmail = true;
        serviceLogger.warn('Expired token without email provided', {
          email_confirmation_token,
        });
        throw error;
      } else {
        const error = new Error(
          'Usuário não encontrado. Verifique se o e-mail está correto ou entre em contato com o suporte.'
        );
        error.statusCode = 404;
        serviceLogger.warn('User not found for confirmation email', {
          email_confirmation_token,
          email,
        });
        throw error;
      }
    }

    // Check if email is already confirmed but allow resending if explicitly requested
    if (user.email_confirmed) {
      serviceLogger.info('Email already confirmed, but allowing resend as requested', {
        user_id: user.id,
        current_status: user.status,
      });
      // Don't throw error, continue to send new confirmation email
      // This allows users to get a fresh confirmation link even if already confirmed
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
   * Check if user is admin (any admin role) - Updated for multiple roles
   * @param {Object} user - User object
   * @returns {Boolean} Is admin
   */
  isAdmin(user) {
    // Backward compatibility - check old role field
    if (user.role) {
      return ['restaurant_administrator', 'location_administrator'].includes(user.role);
    }
    // New role system - check is_admin flag
    return user.is_admin === true;
  }

  // ============================================
  // NEW ROLE SYSTEM METHODS
  // ============================================

  /**
   * Create a user with multiple roles
   * @param {Object} userData - User data
   * @param {Array} roles - Array of role assignments { roleName, restaurantId?, locationId?, isPrimary? }
   * @param {String} createdBy - ID of user creating this user
   * @returns {Object} Created user with roles
   */
  async createUserWithRoles(userData, roles = [], createdBy = null) {
    this.logger.info('Creating user with roles', {
      email: userData.email,
      username: userData.username,
      rolesCount: roles.length,
    });

    try {
      // Create the user first (using existing createUser method)
      const user = await this.createUser(userData, createdBy ? { id: createdBy } : null);

      // Assign roles if provided
      if (roles.length > 0) {
        await this.assignRolesToUser(user.id, roles, createdBy);
      }

      // Return user with roles
      const userWithRoles = await this.getUserWithRoles(user.id);

      this.logger.info('User created successfully with roles', {
        userId: user.id,
        rolesAssigned: roles.length,
      });

      return userWithRoles;
    } catch (error) {
      this.logger.error('Failed to create user with roles', {
        userData: { email: userData.email, username: userData.username },
        roles,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create a restaurant administrator
   * @param {Object} userData - User data
   * @param {String} restaurantId - Restaurant ID
   * @param {String} createdBy - ID of user creating this user
   * @param {Array} roleAssignments - Role assignments from frontend (optional)
   * @returns {Object} Created restaurant administrator
   */
  async createRestaurantAdministrator(
    userData,
    restaurantId,
    createdBy = null,
    roleAssignments = null
  ) {
    this.logger.info('Creating restaurant administrator', {
      email: userData.email,
      restaurantId,
      hasRoleAssignments: !!roleAssignments,
    });

    // Ensure email is required for restaurant administrators
    if (!userData.email) {
      throw new Error('Email é obrigatório para administradores de restaurante');
    }

    try {
      // First, get all locations for this restaurant
      const query = `
        SELECT id, name, is_primary
        FROM restaurant_locations
        WHERE restaurant_id = $1
        ORDER BY is_primary DESC, created_at ASC
      `;
      const locationResult = await this.db.query(query, [restaurantId]);
      const locations = locationResult.rows;

      // Prepare role assignments for all locations
      const roles = [];

      if (roleAssignments && roleAssignments.length > 0) {
        // Use role assignments from frontend
        for (const roleAssignment of roleAssignments) {
          const { role_name, is_primary_role, location_assignments } = roleAssignment;

          for (const locationAssignment of location_assignments) {
            const { location_index, is_primary_location } = locationAssignment;
            const location = locations[location_index];

            if (location) {
              // Create role assignment with location context
              roles.push({
                roleName: role_name,
                restaurantId: restaurantId,
                locationId: location.id,
                isPrimary: is_primary_role && is_primary_location, // Only first location gets primary role
              });
            }
          }
        }
      } else {
        // Fallback: legacy behavior for backward compatibility
        if (locations.length > 0) {
          // For each location, assign restaurant_administrator role
          locations.forEach((location, index) => {
            const isPrimary = index === 0;

            roles.push({
              roleName: 'restaurant_administrator',
              restaurantId: restaurantId,
              locationId: location.id,
              isPrimary: isPrimary, // First location (primary) gets primary role
            });
          });
        } else {
          // Fallback: if no locations found, assign at restaurant level only
          roles.push({
            roleName: 'restaurant_administrator',
            restaurantId: restaurantId,
            isPrimary: true,
          });
        }
      }

      this.logger.info('Role assignments prepared', {
        restaurantId,
        locationCount: locations.length,
        rolesCount: roles.length,
        source: roleAssignments ? 'frontend' : 'legacy',
      });

      // Create user with roles
      const userWithRoles = await this.createUserWithRoles(
        { ...userData, restaurant_id: restaurantId },
        roles,
        createdBy
      );

      this.logger.info('Restaurant administrator created successfully', {
        userId: userWithRoles.id,
        restaurantId,
        rolesAssigned: roles.length,
      });

      return userWithRoles;
    } catch (error) {
      this.logger.error('Failed to create restaurant administrator', {
        restaurantId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Assign roles to a user
   * @param {String} userId - User ID
   * @param {Array} roles - Array of role assignments
   * @param {String} assignedBy - ID of user assigning roles
   */
  async assignRolesToUser(userId, roles, assignedBy = null) {
    this.logger.info('Assigning roles to user', { userId, rolesCount: roles.length });

    try {
      for (const roleAssignment of roles) {
        const {
          roleName,
          restaurantId = null,
          locationId = null,
          isPrimary = false,
        } = roleAssignment;

        // Find the role
        const role = await this.roleModel.findByName(roleName);
        if (!role) {
          throw new Error(`Role '${roleName}' not found`);
        }

        // Create the assignment
        await this.UserRoleModel.assignRole({
          user_id: userId,
          role_id: role.id,
          restaurant_id: restaurantId,
          location_id: locationId,
          is_primary_role: isPrimary,
          assigned_by: assignedBy,
        });
      }

      this.logger.info('Roles assigned successfully', { userId, rolesCount: roles.length });
    } catch (error) {
      this.logger.error('Failed to assign roles to user', {
        userId,
        roles,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get user with all roles
   * @param {String} userId - User ID
   * @returns {Object} User with roles information
   */
  async getUserWithRoles(userId) {
    this.logger.debug('Getting user with roles', { userId });

    try {
      // Get basic user data
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user roles
      const roles = await this.UserRoleModel.getUserRoles(userId);
      const primaryRole = await this.UserRoleModel.getUserPrimaryRole(userId);

      return {
        ...user,
        roles: roles || [],
        primaryRole: primaryRole || null,
        // Backward compatibility
        role: primaryRole?.role_name || null,
        is_admin: primaryRole?.is_admin_role || false,
      };
    } catch (error) {
      this.logger.error('Failed to get user with roles', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get user with roles and accessible locations
   * @param {String} userId - User ID
   * @returns {Object} User with roles and locations information
   */
  async getUserWithRolesAndLocations(userId) {
    this.logger.debug('Getting user with roles and locations', { userId });

    try {
      // Get user with roles
      const userWithRoles = await this.getUserWithRoles(userId);

      // Get accessible locations based on user roles
      const locations = await this.getUserAccessibleLocations(userId);

      return {
        ...userWithRoles,
        locations: locations || [],
      };
    } catch (error) {
      this.logger.error('Failed to get user with roles and locations', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get locations accessible by user based on their roles
   * @param {String} userId - User ID
   * @returns {Array} Array of accessible locations
   */
  async getUserAccessibleLocations(userId) {
    this.logger.debug('Getting user accessible locations', { userId });

    try {
      // Get locations from user_roles table with location context
      const query = `
        SELECT DISTINCT
          rl.id as location_id,
          rl.name as location_name,
          rl.address_street,
          rl.address_city,
          rl.address_state,
          rl.restaurant_id,
          ur.is_primary_role as is_primary_location,
          ur.created_at
        FROM user_roles ur
        JOIN restaurant_locations rl ON ur.location_id = rl.id
        WHERE ur.user_id = $1 AND ur.is_active = true
        ORDER BY ur.is_primary_role DESC, ur.created_at ASC
      `;

      const result = await this.db.query(query, [userId]);

      // Transform the data to match the expected format
      const locations = result.rows.map((assignment) => ({
        id: assignment.location_id,
        name: assignment.location_name,
        address_street: assignment.address_street,
        address_city: assignment.address_city,
        address_state: assignment.address_state,
        restaurant_id: assignment.restaurant_id,
        is_primary_location: assignment.is_primary_location,
        access_level: 'full', // Users with roles have full access
        via_assignment: 'role_assignment',
        assigned_at: assignment.created_at,
      }));

      return locations;
    } catch (error) {
      this.logger.error('Failed to get user accessible locations', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check if user has a specific role
   * @param {String} userId - User ID
   * @param {String} roleName - Role name
   * @param {Object} context - Optional context (restaurant_id, location_id)
   * @returns {Boolean} True if user has the role
   */
  async userHasRole(userId, roleName, context = {}) {
    try {
      return await this.UserRoleModel.userHasRole(userId, roleName, context);
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
   * @param {String} userId - User ID
   * @returns {Boolean} True if user has admin access
   */
  async userHasAdminAccess(userId) {
    try {
      return await this.UserRoleModel.userHasAdminAccess(userId);
    } catch (error) {
      this.logger.error('Failed to check user admin access', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update user's primary role
   * @param {String} userId - User ID
   * @param {String} roleName - Role name to set as primary
   * @returns {Boolean} True if successful
   */
  async setUserPrimaryRole(userId, roleName) {
    this.logger.info('Setting user primary role', { userId, roleName });

    try {
      const role = await this.roleModel.findByName(roleName);
      if (!role) {
        throw new Error(`Role '${roleName}' not found`);
      }

      const success = await this.UserRoleModel.setPrimaryRole(userId, role.id);

      if (success) {
        this.logger.info('Primary role set successfully', { userId, roleName });
      } else {
        this.logger.warn('Failed to set primary role', { userId, roleName });
      }

      return success;
    } catch (error) {
      this.logger.error('Failed to set user primary role', {
        userId,
        roleName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Revoke role from user
   * @param {String} userId - User ID
   * @param {String} roleName - Role name to revoke
   * @param {Object} context - Optional context (restaurant_id, location_id)
   * @returns {Boolean} True if successful
   */
  async revokeUserRole(userId, roleName, context = {}) {
    this.logger.info('Revoking user role', { userId, roleName, context });

    try {
      const role = await this.roleModel.findByName(roleName);
      if (!role) {
        throw new Error(`Role '${roleName}' not found`);
      }

      const success = await this.UserRoleModel.revokeRole(userId, role.id, context);

      if (success) {
        this.logger.info('Role revoked successfully', { userId, roleName, context });
      } else {
        this.logger.warn('Failed to revoke role', { userId, roleName, context });
      }

      return success;
    } catch (error) {
      this.logger.error('Failed to revoke user role', {
        userId,
        roleName,
        context,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get all available roles (filtered based on current user permissions)
   * @param {Object} currentUser - Current authenticated user
   * @returns {Array} Array of roles
   */
  async getAvailableRoles(currentUser = null) {
    try {
      const allRoles = await this.roleModel.getActiveRoles();

      // If no current user provided, return all active roles
      if (!currentUser) {
        return allRoles;
      }

      // Filter roles based on current user's permissions
      const currentUserRole = currentUser.role || currentUser.primaryRole?.role_name;

      // Superadmin can see all roles except superadmin itself (for assignment purposes)
      if (currentUserRole === 'superadmin') {
        return allRoles.filter((role) => role.name !== 'superadmin');
      }

      // Restaurant administrators can assign all roles except superadmin
      if (currentUserRole === 'restaurant_administrator') {
        return allRoles.filter((role) => role.name !== 'superadmin');
      }

      // Location administrators cannot see restaurant_administrator or superadmin roles
      if (currentUserRole === 'location_administrator') {
        return allRoles.filter(
          (role) => role.name !== 'superadmin' && role.name !== 'restaurant_administrator'
        );
      }

      // For other roles, show only non-admin roles
      return allRoles.filter(
        (role) =>
          role.name !== 'superadmin' &&
          role.name !== 'restaurant_administrator' &&
          role.name !== 'location_administrator'
      );
    } catch (error) {
      this.logger.error('Failed to get available roles', { error: error.message });
      throw error;
    }
  }

  /**
   * Get available locations for a user based on their role
   * @param {Object} currentUser - Current authenticated user
   * @param {string} targetRole - The role for which locations are requested
   * @returns {Array} Array of available locations
   */
  async getAvailableLocations(currentUser, targetRole = null) {
    try {
      const currentUserRole = currentUser.role || currentUser.primaryRole?.role_name;

      // Superadmin can access all locations
      if (currentUserRole === 'superadmin') {
        const query = `
          SELECT id, name, restaurant_id, address_street, address_city, address_state, is_primary
          FROM restaurant_locations
          ORDER BY name ASC
        `;
        const result = await this.db.query(query);
        return result.rows;
      }

      // Get current user's role-location pairs
      const userRolePairs =
        currentUser.roleLocationPairs ||
        (await this.getUserRoleLocationPairs(currentUser.id || currentUser.user_id));

      // Restaurant administrators can access all locations in their restaurants
      if (currentUserRole === 'restaurant_administrator') {
        const restaurantIds = [
          ...new Set(
            userRolePairs
              .filter((pair) => pair.role_name === 'restaurant_administrator')
              .map((pair) => pair.restaurant_id)
          ),
        ];

        if (restaurantIds.length === 0) {
          // Fallback: use current user's restaurant_id
          restaurantIds.push(currentUser.restaurant_id);
        }

        const query = `
          SELECT id, name, restaurant_id, address_street, address_city, address_state, is_primary
          FROM restaurant_locations
          WHERE restaurant_id = ANY($1::uuid[])
          ORDER BY name ASC
        `;
        const result = await this.db.query(query, [restaurantIds]);
        return result.rows;
      }

      // Location administrators can only access their assigned locations
      if (currentUserRole === 'location_administrator') {
        const locationIds = [
          ...new Set(
            userRolePairs
              .filter((pair) => pair.role_name === 'location_administrator')
              .map((pair) => pair.location_id)
          ),
        ];

        if (locationIds.length === 0) {
          return [];
        }

        const query = `
          SELECT id, name, restaurant_id, address_street, address_city, address_state, is_primary
          FROM restaurant_locations
          WHERE id = ANY($1::uuid[])
          ORDER BY name ASC
        `;
        const result = await this.db.query(query, [locationIds]);
        return result.rows;
      }

      // For other roles, return only their assigned locations
      const locationIds = [...new Set(userRolePairs.map((pair) => pair.location_id))].filter(
        Boolean
      );

      if (locationIds.length === 0) {
        return [];
      }

      const query = `
        SELECT id, name, restaurant_id, address_street, address_city, address_state, is_primary
        FROM restaurant_locations
        WHERE id = ANY($1::uuid[])
        ORDER BY name ASC
      `;
      const result = await this.db.query(query, [locationIds]);
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get available locations', {
        error: error.message,
        currentUser: currentUser.id || currentUser.user_id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get roles by scope
   * @param {String} scope - Role scope (system, restaurant, location)
   * @returns {Array} Array of roles
   */
  async getRolesByScope(scope) {
    try {
      return await this.roleModel.getRolesByScope(scope);
    } catch (error) {
      this.logger.error('Failed to get roles by scope', { scope, error: error.message });
      throw error;
    }
  }

  /**
   * Get user's primary location based on their primary role
   * @param {String} userId - User ID
   * @returns {Object|null} Primary location assignment
   */
  async getUserPrimaryLocation(userId) {
    this.logger.debug('Getting user primary location', { userId });

    try {
      // Get primary location from user_roles table
      const query = `
        SELECT
          rl.id as location_id,
          rl.name as location_name,
          rl.address_street,
          rl.address_city,
          rl.address_state,
          rl.restaurant_id,
          ur.created_at
        FROM user_roles ur
        JOIN restaurant_locations rl ON ur.location_id = rl.id
        WHERE ur.user_id = $1
          AND ur.is_active = true
          AND ur.is_primary_role = true
        ORDER BY ur.created_at ASC
        LIMIT 1
      `;

      const result = await this.db.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error('Failed to get user primary location', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = UserService;
