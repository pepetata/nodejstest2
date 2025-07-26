// Test script to verify frontend category ordering and no duplicate keys
const axios = require('axios');

async function testFrontendCategoryDisplay() {
  try {
    console.log('🧪 Testing frontend category display...\n');

    // Test the API endpoint that the frontend uses
    const response = await axios.get(
      'http://localhost:5000/api/v1/restaurants/c7742866-f77b-4f68-8586-57d631af301a/menu-items?language=pt-BR',
      {
        headers: {
          Authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjODZiYmZhZS0zNTUzLTQ4YzgtOTNjMS1iZTQ0ZmI5OTRiMDYiLCJ1c2VybmFtZSI6ImpvYW8xIiwicmVzdGF1cmFudElkIjoiYzc3NDI4NjYtZjc3Yi00ZjY4LTg1ODYtNTdkNjMxYWYzMDFhIiwicm9sZSI6ImFkbWluaXN0cmF0b3IiLCJpYXQiOjE3Mzc5NzEzNzN9.p1ZeJqvUqOiXEYzQKB9h41r8MZdVWL6vrlzCRK_rFJk',
        },
      }
    );

    const menuItems = response.data.data;
    console.log(`✅ Retrieved ${menuItems.length} menu items`);

    // Check for items with multiple categories
    const itemsWithMultipleCategories = menuItems.filter(
      (item) => item.categories && item.categories.length > 1
    );

    if (itemsWithMultipleCategories.length > 0) {
      console.log(
        `\n🔍 Found ${itemsWithMultipleCategories.length} items with multiple categories:`
      );

      itemsWithMultipleCategories.forEach((item, index) => {
        console.log(`\n${index + 1}. Item: ${item.name || item.sku}`);
        console.log(`   Categories (${item.categories.length}):`);

        // Check for duplicate category IDs
        const categoryIds = item.categories.map((cat) => cat.id);
        const uniqueIds = [...new Set(categoryIds)];

        if (categoryIds.length !== uniqueIds.length) {
          console.log(`   ❌ DUPLICATE CATEGORIES DETECTED!`);
          console.log(`   Raw IDs: ${categoryIds.join(', ')}`);
          console.log(`   Unique IDs: ${uniqueIds.join(', ')}`);
        } else {
          console.log(`   ✅ No duplicate categories`);
        }

        item.categories.forEach((cat, catIndex) => {
          console.log(
            `     ${catIndex + 1}. ${cat.name} (ID: ${cat.id}, Order: ${cat.display_order})`
          );
        });

        // Check if categories are properly ordered
        const orders = item.categories.map((cat) => cat.display_order || 0);
        const sortedOrders = [...orders].sort((a, b) => a - b);
        const isProperlyOrdered = JSON.stringify(orders) === JSON.stringify(sortedOrders);

        console.log(
          `   Order check: ${isProperlyOrdered ? '✅ Properly ordered' : '⚠️ Not in display order'}`
        );
      });
    } else {
      console.log('\n📝 No items with multiple categories found');
    }

    console.log('\n🎉 Frontend category display test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFrontendCategoryDisplay();
