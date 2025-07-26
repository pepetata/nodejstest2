const http = require('http');

async function testMenuItemsAPI() {
  console.log('🔍 Testing menu items API endpoint...\n');

  // Generate a valid token using the correct secret and payload structure
  const jwt = require('jsonwebtoken');
  require('dotenv').config();

  const secret = process.env.JWT_SECRET || 'AlAcArteSecret';
  const payload = {
    userId: 'cac1c5de-58d8-437a-af5b-3de78830125a',
    email: 'flavio_luiz_ferreira@hotmail.com',
    role: 'restaurant_administrator',
    restaurantId: 'c7742866-f77b-4f68-8586-57d631af301a',
  };

  const token = jwt.sign(payload, secret, { expiresIn: '1h' });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/restaurants/c7742866-f77b-4f68-8586-57d631af301a/menu-items?language=pt-BR',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`✅ API Response Status: ${res.statusCode}`);

          if (response.data && Array.isArray(response.data)) {
            console.log(`✅ Found ${response.data.length} menu items`);

            // Check for duplicate categories
            response.data.forEach((item, itemIndex) => {
              if (item.categories && Array.isArray(item.categories)) {
                const categoryIds = item.categories.map((cat) => cat.id);
                const uniqueIds = [...new Set(categoryIds)];

                console.log(`📋 Item ${itemIndex + 1}: ${item.name || 'Unnamed'}`);
                console.log(
                  `   - Categories: ${item.categories.length} total, ${uniqueIds.length} unique`
                );

                if (categoryIds.length !== uniqueIds.length) {
                  console.log(`   ❌ DUPLICATE CATEGORIES DETECTED!`);
                  console.log(`   - All IDs: [${categoryIds.join(', ')}]`);
                  console.log(`   - Unique IDs: [${uniqueIds.join(', ')}]`);
                } else {
                  console.log(`   ✅ No duplicate categories`);
                }

                // Show category orders
                item.categories.forEach((cat) => {
                  console.log(`   - ${cat.name}: display_order = ${cat.display_order}`);
                });
              }
              console.log('');
            });
          }

          resolve(response);
        } catch (error) {
          console.error('❌ Error parsing response:', error.message);
          console.error('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });

    req.end();
  });
}

testMenuItemsAPI().catch(console.error);
