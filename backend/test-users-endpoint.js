const express = require('express');
const UserService = require('./src/services/userService');
const { generateToken } = require('./src/utils/token');
const UserModel = require('./src/models/userModel');

async function testUsersEndpoint() {
  try {
    console.log('Testing users endpoint...');

    // Create a test user service
    const userService = new UserService();

    // Generate a token for testing (this is a simplified approach)
    const testUser = {
      id: 'test-user-id',
      email: 'admin@test.com',
      role: 'superadmin',
    };

    const token = generateToken(testUser);
    console.log('Generated token:', token);

    // Test the getUsers method directly
    const options = {
      page: 1,
      limit: 10,
      sort_by: 'created_at',
      sort_order: 'desc',
    };

    const result = await userService.getUsers(options, testUser);
    console.log('Users retrieved successfully:', result);
  } catch (error) {
    console.error('Error testing users endpoint:', error);
    console.error('Stack:', error.stack);
  }
}

testUsersEndpoint();
