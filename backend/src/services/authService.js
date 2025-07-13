const UserModel = require('../models/userModel');
const userModel = new UserModel();
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwtUtils');
const { logger } = require('../utils/logger');

class AuthService {
  constructor() {
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
    const serviceLogger = this.logger.child({ operation: 'login', email });
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

      // Find user (with password, for login only)
      const user = await userModel.findUserForLogin(email);
      if (!user) {
        serviceLogger.warn('Invalid credentials: user not found', { email });
        const error = new Error('Credenciais inválidas. Verifique seu e-mail e senha.');
        error.statusCode = 401;
        throw error;
      }
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        serviceLogger.warn('Invalid credentials: wrong password', { email });
        const error = new Error('Credenciais inválidas. Verifique seu e-mail e senha.');
        error.statusCode = 401;
        throw error;
      }

      // Check if user status is pending (needs email confirmation)
      if (user.status === 'pending') {
        serviceLogger.warn('Login attempt with pending status', { email, userId: user.id });
        const error = new Error(
          'Sua conta ainda não foi confirmada. Verifique seu e-mail para confirmar sua conta.'
        );
        error.statusCode = 403;
        error.code = 'PENDING_CONFIRMATION';
        error.email = user.email;
        throw error;
      }

      // Check if user is active
      if (user.status !== 'active') {
        serviceLogger.warn('Login attempt with inactive status', {
          email,
          userId: user.id,
          status: user.status,
        });
        const error = new Error('Sua conta não está ativa. Entre em contato com o suporte.');
        error.statusCode = 403;
        throw error;
      }

      // Generate token
      const token = generateToken(user.id);
      serviceLogger.info('User logged in successfully', { userId: user.id });

      // Sanitize user before returning (remove password)
      const { password: _pw, ...userSafe } = user;

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

      return response;
    } catch (error) {
      serviceLogger.error('Failed to login', { error: error.message });

      // If this is a PENDING_CONFIRMATION error, preserve all properties
      if (error.code === 'PENDING_CONFIRMATION') {
        throw error; // Re-throw the original error with all properties intact
      }

      let mensagemErro = error.message;
      if (mensagemErro === 'Invalid credentials') {
        mensagemErro = 'Credenciais inválidas. Verifique seu e-mail e senha.';
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
