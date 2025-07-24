const { query } = require('../src/config/db');

async function insertLanguages() {
  const languages = [
    {
      name: 'Português',
      native_name: 'Português',
      code: 'pt-BR',
      flag: 'brazil.png',
      order: 10,
      default: true,
    },
    {
      name: 'Inglês',
      native_name: 'English',
      code: 'en',
      flag: 'uk.png',
      order: 20,
      default: false,
    },
    {
      name: 'Espanhol',
      native_name: 'Español',
      code: 'es',
      flag: 'spain.png',
      order: 30,
      default: false,
    },
    {
      name: 'Alemão',
      native_name: 'Deutsch',
      code: 'de',
      flag: 'germany.png',
      order: 40,
      default: false,
    },
    {
      name: 'Italiano',
      native_name: 'Italiano',
      code: 'it',
      flag: 'italy.png',
      order: 50,
      default: false,
    },
    {
      name: 'Francês',
      native_name: 'Français',
      code: 'fr',
      flag: 'france.png',
      order: 60,
      default: false,
    },
    {
      name: 'Holandês',
      native_name: 'Nederlands',
      code: 'nl',
      flag: 'netherlands.png',
      order: 70,
      default: false,
    },
    {
      name: 'Sueco',
      native_name: 'Svenska',
      code: 'sv',
      flag: 'sweden.png',
      order: 80,
      default: false,
    },
    {
      name: 'Japonês',
      native_name: '日本語',
      code: 'ja',
      flag: 'japan.png',
      order: 90,
      default: false,
    },
    {
      name: 'Chinês',
      native_name: '中文',
      code: 'zh',
      flag: 'china.png',
      order: 100,
      default: false,
    },
    {
      name: 'Árabe',
      native_name: 'العربية',
      code: 'ar',
      flag: 'saudi-arabia.png',
      order: 110,
      default: false,
    },
    {
      name: 'Hebraico',
      native_name: 'עברית',
      code: 'he',
      flag: 'israel.png',
      order: 120,
      default: false,
    },
    {
      name: 'Turco',
      native_name: 'Türkçe',
      code: 'tr',
      flag: 'turkey.png',
      order: 130,
      default: false,
    },
    {
      name: 'Russo',
      native_name: 'Русский',
      code: 'ru',
      flag: 'russia.png',
      order: 140,
      default: false,
    },
    {
      name: 'Coreano',
      native_name: '한국어',
      code: 'ko',
      flag: 'korea.png',
      order: 150,
      default: false,
    },
  ];

  try {
    for (const lang of languages) {
      await query(
        `INSERT INTO languages (name, native_name, language_code, flag_file, display_order, is_default, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [lang.name, lang.native_name, lang.code, lang.flag, lang.order, lang.default]
      );
      console.log(`✓ Inserted ${lang.name} (${lang.native_name})`);
    }

    // Verify insertion
    const result = await query(
      'SELECT name, native_name, language_code, flag_file FROM languages ORDER BY display_order'
    );
    console.log('\n📋 Languages inserted:');
    result.rows.forEach((row) => {
      console.log(`${row.name} (${row.native_name}) - ${row.language_code} - ${row.flag_file}`);
    });
  } catch (error) {
    console.error('❌ Error inserting languages:', error);
  }
}

insertLanguages();
