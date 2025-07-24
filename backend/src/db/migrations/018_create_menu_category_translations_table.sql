-- Migration: Create menu_category_translations table
-- Created: 2025-07-24
-- Purpose: Store multilingual content for menu categories

CREATE TABLE IF NOT EXISTS menu_category_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL REFERENCES languages(language_code) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique combination of category and language
    UNIQUE(category_id, language_code)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_category_translations_category_id ON menu_category_translations(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_category_translations_language ON menu_category_translations(language_code);

-- Add trigger for updated_at
CREATE TRIGGER trigger_menu_category_translations_updated_at
    BEFORE UPDATE ON menu_category_translations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
