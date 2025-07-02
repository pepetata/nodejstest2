const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
// JWT functionality is provided by jwtUtils
const { generateToken } = require('../utils/jwtUtils');

class AuthService {
  async register(userData) {
    const { email, password, name } = userData;

    // Check if user already exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await userModel.create({
      email,
      password: hashedPassword,
      name,
    });

    // Generate token
    const token = generateToken(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    };
  }

  async login(credentials) {
    const { email, password } = credentials;

    // Find user
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = generateToken(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    };
  }

  async logout(_userId) {
    // In a real app, you might blacklist the token or handle session cleanup
    return { message: 'Logged out successfully' };
  }
}

module.exports = new AuthService();
