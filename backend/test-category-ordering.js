const db = require('./src/config/db');
const jwt = require('jsonwebtoken');

async function testCategoryOrdering() {
  try {
    console.log('🧪 Testing category-specific ordering functionality...\n');

    // 1. Get a test user and restaurant
    const userResult = await db.query('SELECT * FROM users WHERE username = $1', ['joao1']);
    if (userResult.rows.length === 0) {
      console.log('❌ Test user not found');
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Using test user: ${user.username} (Restaurant: ${user.restaurant_id})`);

    // 2. Get existing categories for this restaurant (simplified)
    const categoriesResult = await db.query(
      `
      SELECT mc.id, 'Test Category ' || ROW_NUMBER() OVER() as name
      FROM menu_categories mc
      WHERE mc.restaurant_id = $1
      LIMIT 3
    `,
      [user.restaurant_id]
    );

    if (categoriesResult.rows.length === 0) {
      console.log('❌ No categories found for testing');
      return;
    }

    console.log(`✅ Found ${categoriesResult.rows.length} categories for testing:`);
    categoriesResult.rows.forEach((cat, idx) => {
      console.log(`   ${idx + 1}. ${cat.name} (ID: ${cat.id})`);
    });

    // 3. Create a test menu item with multiple categories and different orders
    const testItemData = {
      restaurant_id: user.restaurant_id,
      sku: 'TEST-MULTI-CAT-001',
      base_price: 25.99,
      preparation_time_minutes: 15,
      is_available: true,
      is_featured: false,
    };

    const testTranslations = [
      {
        language_code: 'pt-BR',
        name: 'Item Teste Multi-Categoria',
        description: 'Item de teste com múltiplas categorias e ordens diferentes',
        ingredients: 'Ingredientes de teste',
        preparation_method: 'Método de preparo teste',
      },
    ];

    // Use different display orders for each category
    const testCategories = categoriesResult.rows.map((cat, idx) => ({
      category_id: cat.id,
      display_order: (idx + 1) * 10, // 10, 20, 30...
    }));

    console.log('\\n🔧 Creating test menu item with categories:');
    testCategories.forEach((cat, idx) => {
      const categoryName = categoriesResult.rows[idx].name;
      console.log(`   - ${categoryName}: display_order = ${cat.display_order}`);
    });

    // 4. Use the MenuItemModel to create the item
    const MenuItemModel = require('./src/models/menu/menuItemModel');
    const newItem = await MenuItemModel.create(testItemData, testTranslations, testCategories);

    console.log(`\\n✅ Created menu item: ${newItem.id}`);

    // 5. Test retrieval and verify ordering
    console.log('\\n🔍 Testing category-specific ordering...');

    for (let i = 0; i < categoriesResult.rows.length; i++) {
      const category = categoriesResult.rows[i];
      const itemsInCategory = await MenuItemModel.getByCategory(category.id, 'pt-BR');

      const testItem = itemsInCategory.find((item) => item.id === newItem.id);
      if (testItem) {
        console.log(
          `✅ ${category.name}: Found item with category_order = ${testItem.category_order}`
        );

        if (testItem.category_order === testCategories[i].display_order) {
          console.log(
            `   ✅ Order matches expected: ${testItem.category_order} === ${testCategories[i].display_order}`
          );
        } else {
          console.log(
            `   ❌ Order mismatch: ${testItem.category_order} !== ${testCategories[i].display_order}`
          );
        }
      } else {
        console.log(`❌ ${category.name}: Item not found in category`);
      }
    }

    // 6. Test getByRestaurant to see if categories include display_order
    console.log('\\n🔍 Testing getByRestaurant with category orders...');
    const allItems = await MenuItemModel.getByRestaurant(user.restaurant_id, 'pt-BR');
    const retrievedItem = allItems.find((item) => item.id === newItem.id);

    if (retrievedItem && retrievedItem.categories) {
      console.log(
        `✅ Retrieved item has ${retrievedItem.categories.length} categories with orders:`
      );
      retrievedItem.categories.forEach((cat) => {
        console.log(`   - Category ${cat.id}: display_order = ${cat.display_order}`);
      });
    } else {
      console.log('❌ Item not found or missing category data');
    }

    // 7. Cleanup: Delete the test item
    console.log('\\n🧹 Cleaning up test data...');
    await MenuItemModel.delete(newItem.id);
    console.log('✅ Test item deleted');

    console.log('\\n🎉 Category-specific ordering test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit();
  }
}

testCategoryOrdering();
