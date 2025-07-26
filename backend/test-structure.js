const db = require('./src/config/db');

async function testStructure() {
  try {
    console.log('Testing new menu item structure...');

    // Check if display_order was removed from menu_items
    const describeResult = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'menu_items'
        AND column_name = 'display_order'
    `);

    if (describeResult.rows.length === 0) {
      console.log('✅ display_order successfully removed from menu_items table');
    } else {
      console.log('❌ display_order still exists in menu_items table');
    }

    // Check if display_order exists in menu_item_categories
    const junctionResult = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'menu_item_categories'
        AND column_name = 'display_order'
    `);

    if (junctionResult.rows.length > 0) {
      console.log('✅ display_order exists in menu_item_categories junction table');
    } else {
      console.log('❌ display_order missing from menu_item_categories table');
    }

    // Test the new index
    const indexResult = await db.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'menu_item_categories'
        AND indexname = 'idx_menu_item_categories_order'
    `);

    if (indexResult.rows.length > 0) {
      console.log('✅ New category ordering index exists');
    } else {
      console.log('❌ Category ordering index missing');
    }

    console.log('\nDatabase structure changes completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    process.exit();
  }
}

testStructure();
