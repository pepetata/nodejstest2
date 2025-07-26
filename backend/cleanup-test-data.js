const db = require('./src/config/db');

async function cleanupTestData() {
  try {
    console.log('🧹 Cleaning up test menu items...');

    // Delete test items created during testing
    const deleteResult = await db.query(
      `DELETE FROM menu_items
       WHERE sku LIKE 'TEST-MULTI-CAT-%'
       AND restaurant_id = $1`,
      ['c7742866-f77b-4f68-8586-57d631af301a']
    );

    console.log(`✅ Deleted ${deleteResult.rowCount} test menu items`);

    // Also clean up any orphaned translations
    const cleanupTranslations = await db.query(
      `DELETE FROM menu_item_translations
       WHERE item_id NOT IN (SELECT id FROM menu_items)`
    );

    console.log(`✅ Cleaned up ${cleanupTranslations.rowCount} orphaned translations`);

    // Clean up orphaned category assignments
    const cleanupCategories = await db.query(
      `DELETE FROM menu_item_categories
       WHERE item_id NOT IN (SELECT id FROM menu_items)`
    );

    console.log(`✅ Cleaned up ${cleanupCategories.rowCount} orphaned category assignments`);

    console.log('\n🎉 Cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  } finally {
    await db.end();
  }
}

cleanupTestData();
