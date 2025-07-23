require('dotenv').config();
const db = require('../config/db');

async function seedLanguages() {
  try {
    console.log('Seeding languages with native names...');

    // Clear existing data
    await db.query('TRUNCATE TABLE languages RESTART IDENTITY CASCADE');

    // Languages with native names
    const languages = [
      // Default language (order 10)
      { name: 'Português Brasileiro', code: 'pt-BR', icon: 'br.svg', order: 10, isDefault: true },

      // Main international languages (order 20-80)
      { name: 'English', code: 'en', icon: 'us.svg', order: 20, isDefault: false },
      { name: 'Español', code: 'es', icon: 'es.svg', order: 30, isDefault: false },
      { name: '日本語', code: 'ja', icon: 'jp.svg', order: 40, isDefault: false },
      { name: '中文', code: 'zh', icon: 'cn.svg', order: 50, isDefault: false },
      { name: 'العربية', code: 'ar', icon: 'sa.svg', order: 60, isDefault: false },
      { name: 'עברית', code: 'he', icon: 'il.svg', order: 70, isDefault: false },
      { name: 'Türkçe', code: 'tr', icon: 'tr.svg', order: 80, isDefault: false },

      // Additional European languages (order 90-150)
      { name: 'Français', code: 'fr', icon: 'fr.svg', order: 90, isDefault: false },
      { name: 'Deutsch', code: 'de', icon: 'de.svg', order: 100, isDefault: false },
      { name: 'Italiano', code: 'it', icon: 'it.svg', order: 110, isDefault: false },
      { name: 'Русский', code: 'ru', icon: 'ru.svg', order: 120, isDefault: false },
      { name: '한국어', code: 'ko', icon: 'kr.svg', order: 130, isDefault: false },
      { name: 'Nederlands', code: 'nl', icon: 'nl.svg', order: 140, isDefault: false },
      { name: 'Svenska', code: 'sv', icon: 'se.svg', order: 150, isDefault: false },
    ];

    // Insert languages
    const insertQuery = `
      INSERT INTO languages (name, language_code, icon_file, display_order, is_default, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    for (const lang of languages) {
      await db.query(insertQuery, [
        lang.name,
        lang.code,
        lang.icon,
        lang.order,
        lang.isDefault,
        true,
      ]);
      console.log(`✓ Inserted: ${lang.name} (${lang.code})`);
    }

    // Verify insertion
    const result = await db.query(`
      SELECT name, language_code, icon_file, display_order, is_default, is_active
      FROM languages
      ORDER BY display_order
    `);

    console.log('\n📋 Inserted Languages:');
    console.table(result.rows);

    console.log('\n✅ Languages seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding languages:', error);
    throw error;
  } finally {
    await db.closePool();
  }
}

// Run if called directly
if (require.main === module) {
  seedLanguages();
}

module.exports = seedLanguages;
