import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1';

async function testCreatedByField() {
  try {
    console.log('=== Testing Created By Field ===');

    // Step 1: Login to get auth token
    console.log('\n1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'flavio_luiz_ferreira@hotmail.com',
      password: '12345678',
    });

    const token = loginResponse.data.token;
    console.log('✓ Login successful');

    // Step 2: Get list of users
    console.log('\n2. Fetching users list...');
    const usersResponse = await axios.get(`${BASE_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const users = usersResponse.data.data || usersResponse.data;
    console.log(`✓ Found ${users.length} users`);

    // Step 3: Get first user by ID to check created_by_name field
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`\n3. Fetching user details for: ${firstUser.full_name} (ID: ${firstUser.id})`);

      const userDetailResponse = await axios.get(`${BASE_URL}/users/${firstUser.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userDetail = userDetailResponse.data.data || userDetailResponse.data;
      console.log('\n=== User Detail Response ===');
      console.log('User Name:', userDetail.full_name);
      console.log('Created By ID:', userDetail.created_by);
      console.log('Created By Name:', userDetail.created_by_name || 'NOT FOUND');
      console.log('Created At:', userDetail.created_at);

      if (userDetail.created_by_name) {
        console.log('\n✅ SUCCESS: created_by_name field is working!');
      } else {
        console.log('\n❌ ISSUE: created_by_name field is not populated');
      }
    } else {
      console.log('\n❌ No users found to test');
    }
  } catch (error) {
    console.error('\n❌ Error during test:', error.response?.data || error.message);
  }
}

// Make function available globally for browser console
window.testCreatedByField = testCreatedByField;

export default testCreatedByField;
