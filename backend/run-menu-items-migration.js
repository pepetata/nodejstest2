const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'alacarte_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

async function runMigration() {
  try {
    console.log('Running menu items migration...');

    const migrationSQL = `
      -- Migration: Create enhanced menu_items table
      -- Created: 2025-07-25
      -- Purpose: Enhanced menu items table following the suggested implementation

      -- Drop the old simple menu_items table if it exists
      DROP TABLE IF EXISTS menu_items CASCADE;

      -- Create the new enhanced menu_items table
      CREATE TABLE IF NOT EXISTS menu_items (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
          sku VARCHAR(100),
          base_price DECIMAL(10, 2) NOT NULL,
          preparation_time_minutes INTEGER,
          is_available BOOLEAN DEFAULT true,
          is_featured BOOLEAN DEFAULT false,
          display_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create menu_item_translations table for multilingual support
      CREATE TABLE IF NOT EXISTS menu_item_translations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
          language_code VARCHAR(10) NOT NULL REFERENCES languages(language_code) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          ingredients TEXT,
          preparation_method TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(item_id, language_code)
      );

      -- Create menu_item_categories table for category relationships
      CREATE TABLE IF NOT EXISTS menu_item_categories (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
          category_id INTEGER NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
          display_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(item_id, category_id)
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
      CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
      CREATE INDEX IF NOT EXISTS idx_menu_items_featured ON menu_items(is_featured);
      CREATE INDEX IF NOT EXISTS idx_menu_items_order ON menu_items(restaurant_id, display_order);
      CREATE INDEX IF NOT EXISTS idx_menu_items_sku ON menu_items(restaurant_id, sku);

      CREATE INDEX IF NOT EXISTS idx_menu_item_translations_item_id ON menu_item_translations(item_id);
      CREATE INDEX IF NOT EXISTS idx_menu_item_translations_language ON menu_item_translations(language_code);

      CREATE INDEX IF NOT EXISTS idx_menu_item_categories_item_id ON menu_item_categories(item_id);
      CREATE INDEX IF NOT EXISTS idx_menu_item_categories_category_id ON menu_item_categories(category_id);

      -- Add triggers for updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS trigger_menu_items_updated_at ON menu_items;
      CREATE TRIGGER trigger_menu_items_updated_at
          BEFORE UPDATE ON menu_items
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS trigger_menu_item_translations_updated_at ON menu_item_translations;
      CREATE TRIGGER trigger_menu_item_translations_updated_at
          BEFORE UPDATE ON menu_item_translations
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `;

    await pool.query(migrationSQL);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();
