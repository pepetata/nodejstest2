-- Migration: Create restaurant_languages table
-- Created: 2025-07-23
-- Purpose: Link restaurants to supported languages with custom ordering and default settings

CREATE TABLE restaurant_languages (
    id SERIAL PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique combination of restaurant and language
    UNIQUE(restaurant_id, language_id)
);

-- Create indexes for performance
CREATE INDEX idx_restaurant_languages_restaurant_id ON restaurant_languages(restaurant_id);
CREATE INDEX idx_restaurant_languages_language_id ON restaurant_languages(language_id);
CREATE INDEX idx_restaurant_languages_order ON restaurant_languages(restaurant_id, display_order);
CREATE INDEX idx_restaurant_languages_default ON restaurant_languages(restaurant_id, is_default) WHERE is_default = true;

-- Ensure only one default language per restaurant
CREATE UNIQUE INDEX idx_restaurant_languages_single_default
ON restaurant_languages(restaurant_id, is_default)
WHERE is_default = true;

-- Add trigger for updated_at
CREATE TRIGGER trigger_restaurant_languages_updated_at
    BEFORE UPDATE ON restaurant_languages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
