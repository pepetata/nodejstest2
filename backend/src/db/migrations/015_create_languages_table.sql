-- Migration: Create languages table
-- Created: 2025-07-23
-- Purpose: Store supported languages for internationalization

CREATE TABLE languages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    language_code VARCHAR(10) NOT NULL UNIQUE,
    icon_file VARCHAR(255),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_languages_code ON languages(language_code);
CREATE INDEX idx_languages_order ON languages(display_order);
CREATE INDEX idx_languages_default ON languages(is_default) WHERE is_default = true;

-- Add constraint to ensure only one default language
CREATE UNIQUE INDEX idx_languages_single_default ON languages(is_default) WHERE is_default = true;

-- Create function to update updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for updated_at
CREATE TRIGGER trigger_languages_updated_at
    BEFORE UPDATE ON languages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
