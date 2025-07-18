// Debug script to trace sorting and filtering issues
console.log('=== User Management Debug Script ===');

// Test the userService getUsers method directly
const userService = require('./src/services/userService');
const UserModel = require('./src/models/userModel');

const debugUserRetrieval = async () => {
  try {
    console.log('\n1. Testing sortBy=email, sortOrder=desc');

    // Mock current user (restaurant admin)
    const mockCurrentUser = {
      id: '1',
      role: 'restaurant_administrator',
      restaurant_id: 1,
    };

    const options1 = {
      page: 1,
      limit: 10,
      sortBy: 'email',
      sortOrder: 'desc',
    };

    console.log('Calling userService.getUsers with options:', options1);

    // Initialize userService with mock database
    const service = new userService();
    const result1 = await service.getUsers(options1, mockCurrentUser);

    console.log('Result pagination:', result1.pagination);
    console.log('Users returned:', result1.users.length);

    if (result1.users.length > 0) {
      console.log('=== Email sorting (DESC) ===');
      result1.users.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.email || 'NO EMAIL'} - ${user.full_name}`);
      });
    }

    console.log('\n2. Testing sortBy=full_name, sortOrder=asc');
    const options2 = {
      page: 1,
      limit: 10,
      sortBy: 'full_name',
      sortOrder: 'asc',
    };

    const result2 = await service.getUsers(options2, mockCurrentUser);

    if (result2.users.length > 0) {
      console.log('=== Full Name sorting (ASC) ===');
      result2.users.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.full_name} - ${user.email || 'NO EMAIL'}`);
      });
    }

    console.log('\n3. Testing location filter');
    const options3 = {
      page: 1,
      limit: 10,
      location: 1,
      sortBy: 'full_name',
      sortOrder: 'asc',
    };

    const result3 = await service.getUsers(options3, mockCurrentUser);
    console.log('Users with location filter (location_id=1):', result3.users.length);

    if (result3.users.length > 0) {
      console.log('=== Location filtered users ===');
      result3.users.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.full_name} - ${user.email || 'NO EMAIL'}`);
      });
    } else {
      console.log(
        'No users found with location filter - this might indicate the location filter issue'
      );
    }
  } catch (error) {
    console.error('Error during debug:', error.message);
    console.error('Stack:', error.stack);
  }

  process.exit(0);
};

debugUserRetrieval();
