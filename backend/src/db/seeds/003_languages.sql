-- Seed data for languages table
-- Created: 2025-07-23
-- Purpose: Insert initial language data with native language names and proper icons
-- Note: Languages displayed in their native scripts

-- Clear existing data
TRUNCATE TABLE languages RESTART IDENTITY CASCADE;

-- Insert languages with native names, proper ordering and flag icons
INSERT INTO languages (name, language_code, icon_file, display_order, is_default, is_active) VALUES
    -- Default language (order 10)
    ('Português', 'pt-BR', 'br.svg', 10, true, true),

    -- Main international languages (order 20-80)
    ('English', 'en', 'us.svg', 20, false, true),
    ('Español', 'es', 'es.svg', 30, false, true),
    ('Deutsch', 'de', 'de.svg', 40, false, true),
    ('Italiano', 'it', 'it.svg', 50, false, true),
    ('Français', 'fr', 'fr.svg', 60, false, true),
    ('Nederlands', 'nl', 'nl.svg', 70, false, true),
    ('Svenska', 'sv', 'se.svg', 80, false, true);
    ('日本語', 'ja', 'jp.svg', 90, false, true),
    ('中文', 'zh', 'cn.svg', 100, false, true),
    ('العربية', 'ar', 'sa.svg', 110, false, true),
    ('עברית', 'he', 'il.svg', 120, false, true),
    ('Türkçe', 'tr', 'tr.svg', 130, false, true),
    ('Русский', 'ru', 'ru.svg', 140, false, true),
    ('한국어', 'ko', 'kr.svg', 150, false, true),

-- Verify insertion
SELECT
    name,
    language_code,
    icon_file,
    display_order,
    is_default,
    is_active
FROM languages
ORDER BY display_order;
