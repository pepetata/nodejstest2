// Debug the SQL query generation
const UserModel = require('./src/models/userModel');

async function debugQuery() {
  console.log('Debugging UserModel query generation...\n');

  const userModel = new UserModel();

  // Test different sorting options
  const tests = [
    {
      name: 'Default sorting',
      filters: { restaurant_id: 'test-restaurant' },
      queryOptions: { page: 1, limit: 3 },
    },
    {
      name: 'Sort by full_name ASC',
      filters: { restaurant_id: 'test-restaurant' },
      queryOptions: { page: 1, limit: 3, orderBy: 'full_name ASC' },
    },
    {
      name: 'Sort by full_name DESC',
      filters: { restaurant_id: 'test-restaurant' },
      queryOptions: { page: 1, limit: 3, orderBy: 'full_name DESC' },
    },
    {
      name: 'Sort by email ASC',
      filters: { restaurant_id: 'test-restaurant' },
      queryOptions: { page: 1, limit: 3, orderBy: 'email ASC' },
    },
  ];

  for (const test of tests) {
    console.log(`\n${test.name}:`);

    try {
      // Mock the executeQuery method to log the SQL
      const originalExecuteQuery = userModel.executeQuery;
      userModel.executeQuery = function (query, params) {
        console.log('   SQL Query:', query.replace(/\s+/g, ' ').trim());
        console.log('   Parameters:', params);
        // Return empty result to avoid database error
        return Promise.resolve({ rows: [] });
      };

      await userModel.findWithPagination(test.filters, test.queryOptions);

      // Restore original method
      userModel.executeQuery = originalExecuteQuery;
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
  }
}

debugQuery().catch(console.error);
