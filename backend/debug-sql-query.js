// Debug the actual SQL query being executed
const UserModel = require('./src/models/userModel');

async function debugSQLQuery() {
  console.log('Debugging SQL query for sorting...\n');

  const userModel = new UserModel();

  // Mock the executeQuery method to see what SQL is actually being run
  const originalExecuteQuery = userModel.executeQuery;

  userModel.executeQuery = function (query, params) {
    console.log('=== SQL QUERY ===');
    console.log(query);
    console.log('=== PARAMETERS ===');
    console.log(params);
    console.log('=== END ===\n');

    // Return a mock result to avoid database issues
    return Promise.resolve({
      rows: [
        { id: 1, full_name: 'Alice Test', email: 'alice@example.com', created_at: '2025-07-18' },
        { id: 2, full_name: 'Bob Test', email: 'bob@example.com', created_at: '2025-07-17' },
        {
          id: 3,
          full_name: 'Charlie Test',
          email: 'charlie@example.com',
          created_at: '2025-07-16',
        },
      ],
    });
  };

  try {
    console.log('1. Testing ORDER BY full_name ASC:');
    await userModel.findWithPagination(
      { restaurant_id: 'test-restaurant' },
      { page: 1, limit: 5, orderBy: 'full_name ASC' }
    );

    console.log('2. Testing ORDER BY full_name DESC:');
    await userModel.findWithPagination(
      { restaurant_id: 'test-restaurant' },
      { page: 1, limit: 5, orderBy: 'full_name DESC' }
    );

    console.log('3. Testing ORDER BY email ASC:');
    await userModel.findWithPagination(
      { restaurant_id: 'test-restaurant' },
      { page: 1, limit: 5, orderBy: 'email ASC' }
    );
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Restore original method
  userModel.executeQuery = originalExecuteQuery;
}

debugSQLQuery().catch(console.error);
