const db = require('./src/config/db');

(async () => {
  try {
    console.log('Testing menu items query...');

    const result = await db.query(
      'SELECT COUNT(*) as count FROM menu_items WHERE restaurant_id = $1',
      ['c7742866-f77b-4f68-8586-57d631af301a']
    );
    console.log('Menu items count for restaurant:', result.rows[0].count);

    const items = await db.query(
      'SELECT id, sku, base_price, is_available FROM menu_items WHERE restaurant_id = $1 LIMIT 5',
      ['c7742866-f77b-4f68-8586-57d631af301a']
    );
    console.log('Sample menu items:', items.rows);

    console.log('Testing menu item translations...');
    const translations = await db.query(
      'SELECT COUNT(*) as count FROM menu_item_translations WHERE item_id IN (SELECT id FROM menu_items WHERE restaurant_id = $1)',
      ['c7742866-f77b-4f68-8586-57d631af301a']
    );
    console.log('Menu item translations count:', translations.rows[0].count);

    await db.end();
    console.log('Test completed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
