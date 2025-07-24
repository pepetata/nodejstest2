-- Migration: Add native_name column to languages table
-- Created: 2025-07-24
-- Purpose: Add native language names (e.g., "English" for English, "Español" for Spanish)

-- Add native_name column
ALTER TABLE languages ADD COLUMN IF NOT EXISTS native_name VARCHAR(100);

-- Update existing languages with native names
UPDATE languages SET native_name = 'Português' WHERE language_code = 'pt-BR';
UPDATE languages SET native_name = 'English' WHERE language_code = 'en';
UPDATE languages SET native_name = 'Español' WHERE language_code = 'es';
UPDATE languages SET native_name = 'Deutsch' WHERE language_code = 'de';
UPDATE languages SET native_name = 'Italiano' WHERE language_code = 'it';
UPDATE languages SET native_name = 'Français' WHERE language_code = 'fr';
UPDATE languages SET native_name = 'Nederlands' WHERE language_code = 'nl';
UPDATE languages SET native_name = 'Svenska' WHERE language_code = 'sv';
UPDATE languages SET native_name = '日本語' WHERE language_code = 'ja';
UPDATE languages SET native_name = '中文' WHERE language_code = 'zh';
UPDATE languages SET native_name = 'العربية' WHERE language_code = 'ar';
UPDATE languages SET native_name = 'עברית' WHERE language_code = 'he';
UPDATE languages SET native_name = 'Türkçe' WHERE language_code = 'tr';
UPDATE languages SET native_name = 'Русский' WHERE language_code = 'ru';
UPDATE languages SET native_name = '한국어' WHERE language_code = 'ko';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_languages_native_name ON languages(native_name);
