const { query } = require('./src/config/db');

(async () => {
  try {
    const result = await query(
      `
      SELECT rl.id, rl.language_id, l.language_code, l.name
      FROM restaurant_languages rl
      JOIN languages l ON rl.language_id = l.id
      WHERE rl.restaurant_id = $1
    `,
      ['c7742866-f77b-4f68-8586-57d631af301a']
    );

    console.log('Restaurant Languages:', result.rows);
  } catch (error) {
    console.error('Error:', error);
  }
})();
