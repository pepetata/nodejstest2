// Create test categories directly in the database
const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'alacarte_dev',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
});

async function createTestCategories() {
  const restaurantId = 'c7742866-f77b-4f68-8586-57d631af301a'; // Padre restaurant

  try {
    console.log('Connecting to database...');

    // First check if categories already exist
    const checkResult = await pool.query(
      `
      SELECT mc.id, mct.name
      FROM menu_categories mc
      LEFT JOIN menu_category_translations mct ON mc.id = mct.category_id
      WHERE mc.restaurant_id = $1 AND mct.language_id = 1
    `,
      [restaurantId]
    );

    if (checkResult.rows.length > 0) {
      console.log(`Found ${checkResult.rows.length} existing categories:`);
      checkResult.rows.forEach((cat) => {
        console.log(`- ${cat.name} (ID: ${cat.id})`);
      });
      return;
    }

    console.log('No categories found. Creating test categories...\n');

    const categories = [
      { name: 'Entradas', display_order: 1 },
      { name: 'Pratos Principais', display_order: 2 },
      { name: 'Sobremesas', display_order: 3 },
      { name: 'Bebidas', display_order: 4 },
      { name: 'Especiais do Dia', display_order: 5 },
    ];

    for (const category of categories) {
      // Create the category
      const categoryResult = await pool.query(
        `INSERT INTO menu_categories (restaurant_id, display_order, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id`,
        [restaurantId, category.display_order, true]
      );

      const categoryId = categoryResult.rows[0].id;

      // Create the translation for Portuguese
      await pool.query(
        `INSERT INTO menu_category_translations (category_id, language_id, name, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [categoryId, 1, category.name]
      );

      console.log(`✅ Created: ${category.name} (ID: ${categoryId})`);
    }

    console.log('\n🎉 Test categories created successfully!');

    // Verify creation
    const verifyResult = await pool.query(
      `
      SELECT mc.id, mct.name, mc.display_order
      FROM menu_categories mc
      LEFT JOIN menu_category_translations mct ON mc.id = mct.category_id
      WHERE mc.restaurant_id = $1 AND mct.language_id = 1
      ORDER BY mc.display_order
    `,
      [restaurantId]
    );

    console.log(`\n📋 Total categories now: ${verifyResult.rows.length}`);
    verifyResult.rows.forEach((cat) => {
      console.log(`   ${cat.display_order}. ${cat.name} (ID: ${cat.id})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

createTestCategories();
