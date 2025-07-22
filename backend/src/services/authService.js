const UserModel = require('../models/userModel');
const UserService = require('./userService');
const userModel = new UserModel();
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwtUtils');
const { logger } = require('../utils/logger');

class AuthService {
  constructor() {
    // Initialize UserService
    this.userService = new UserService();

    // Defensive logger initialization
    try {
      if (logger && typeof logger.child === 'function') {
        this.logger = logger.child({ service: 'AuthService' });
      } else {
        this.logger = {
          child: () => ({ info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }),
          info: () => {},
          warn: () => {},
          error: () => {},
          debug: () => {},
        };
      }
    } catch (error) {
      this.logger = {
        child: () => ({ info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }),
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      };
    }
  }

  async register(userData) {
    const { email, password, name } = userData;
    const serviceLogger = this.logger.child({ operation: 'register', email });
    try {
      // Check if user already exists
      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        serviceLogger.warn('User already exists with this email', { email });
        const error = new Error('Já existe um usuário cadastrado com este e-mail.');
        error.statusCode = 409;
        throw error;
      }
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      // Create user
      const user = await userModel.create({ email, password: hashedPassword, name });
      // Generate token
      const token = generateToken(user.id);
      serviceLogger.info('User registered successfully', { userId: user.id });
      return {
        user: { id: user.id, email: user.email, name: user.name },
        token,
      };
    } catch (error) {
      serviceLogger.error('Failed to register user', { error: error.message });
      // Translate error for end user
      let mensagemErro = error.message;
      if (mensagemErro.includes('duplicate key') && mensagemErro.includes('email')) {
        mensagemErro = 'Já existe um usuário cadastrado com este e-mail.';
      }
      const err = new Error(mensagemErro);
      err.statusCode = error.statusCode || 400;
      throw err;
    }
  }

  async login(credentials) {
    const { email, password } = credentials;
    const serviceLogger = this.logger.child({ operation: 'login', emailOrUsername: email });
    try {
      // TEMPORARY TEST: Simulate pending status for test email
      if (email === 'test@pending.com') {
        serviceLogger.warn('TESTING: Simulating pending status for test email');
        const error = new Error(
          'Sua conta ainda não foi confirmada. Verifique seu e-mail para confirmar sua conta.'
        );
        error.statusCode = 403;
        error.code = 'PENDING_CONFIRMATION';
        error.email = email;
        throw error;
      }

      // Find user (with password, for login only) - now supports both email and username
      const user = await userModel.findUserForLogin(email);
      if (!user) {
        serviceLogger.warn('Invalid credentials: user not found', { emailOrUsername: email });
        const error = new Error('Credenciais inválidas. Verifique seu e-mail/usuário e senha.');
        error.statusCode = 401;
        throw error;
      }
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        serviceLogger.warn('Invalid credentials: wrong password', { emailOrUsername: email });
        const error = new Error('Credenciais inválidas. Verifique seu e-mail/usuário e senha.');
        error.statusCode = 401;
        throw error;
      }

      // Check if user status is pending (needs email confirmation)
      if (user.status === 'pending') {
        serviceLogger.warn('Login attempt with pending status', {
          emailOrUsername: email,
          userId: user.id,
        });
        const error = new Error(
          'Sua conta ainda não foi confirmada. Verifique seu e-mail para confirmar sua conta.'
        );
        error.statusCode = 403;
        error.code = 'PENDING_CONFIRMATION';
        error.email = user.email;
        throw error;
      }

      // Check if user status allows login (inactive, suspended cannot login)
      if (!['active'].includes(user.status)) {
        serviceLogger.warn('Login attempt with non-active status', {
          emailOrUsername: email,
          userId: user.id,
          status: user.status,
        });
        let errorMessage = 'Você não tem acesso a esta página.';
        if (user.status === 'inactive') {
          errorMessage = 'Você não tem acesso a esta página.';
        } else if (user.status === 'suspended') {
          errorMessage = 'Você não tem acesso a esta página.';
        }
        const error = new Error(errorMessage);
        error.statusCode = 403;
        throw error;
      }

      // Update last login information in the database
      try {
        await userModel.updateLastLogin(user.id);
        serviceLogger.info('Updated last login time', { userId: user.id });
      } catch (updateError) {
        serviceLogger.warn('Failed to update last login time', {
          userId: user.id,
          error: updateError.message,
        });
        // Don't fail login if we can't update last login time
      }

      // Generate token
      const token = generateToken(user.id);
      serviceLogger.info('User logged in successfully', { userId: user.id });

      // Get user with roles and accessible locations
      const userWithRolesAndLocations = await this.userService.getUserWithRolesAndLocations(
        user.id
      );

      // Sanitize user before returning (remove password)
      const { password: _pw, ...userSafe } = userWithRolesAndLocations;

      // Structure the response with restaurant data if available
      const response = {
        user: userSafe,
        token,
      };

      // Add restaurant data to the response if user has a restaurant
      if (user.restaurant) {
        response.restaurant = user.restaurant;
        serviceLogger.info('Including restaurant data in login response', {
          restaurantId: user.restaurant.id,
          restaurantName: user.restaurant.name,
        });
      }

      serviceLogger.info('Login response prepared with roles and locations', {
        userId: user.id,
        rolesCount: userSafe.roles?.length || 0,
        locationsCount: userSafe.locations?.length || 0,
      });

      return response;
    } catch (error) {
      serviceLogger.error('Failed to login', { error: error.message });

      // If this is a PENDING_CONFIRMATION error, preserve all properties
      if (error.code === 'PENDING_CONFIRMATION') {
        throw error; // Re-throw the original error with all properties intact
      }

      let mensagemErro = error.message;
      if (mensagemErro === 'Invalid credentials') {
        mensagemErro = 'Credenciais inválidas. Verifique seu e-mail/usuário e senha.';
      }
      const err = new Error(mensagemErro);
      err.statusCode = error.statusCode || 401;
      throw err;
    }
  }

  async logout(_userId) {
    // In a real app, you might blacklist the token or handle session cleanup
    return { message: 'Logged out successfully' };
  }
}

module.exports = new AuthService();
