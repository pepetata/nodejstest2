-- Seed data for languages table
-- Created: 2025-07-23
-- Updated: 2025-07-24
-- Purpose: Insert initial language data with native language names and proper flag files
-- Note: Languages displayed in their native scripts

-- Clear existing data
TRUNCATE TABLE languages RESTART IDENTITY CASCADE;

-- Insert languages with Portuguese names, native names, proper ordering and flag files
INSERT INTO languages (name, native_name, language_code, flag_file, display_order, is_default, is_active) VALUES
    -- Default language (order 10)
    ('Português', 'Português', 'pt-BR', 'brazil.png', 10, true, true),

    -- Main international languages (order 20-80)
    ('Inglês', 'English', 'en', 'uk.png', 20, false, true),
    ('Espanhol', 'Español', 'es', 'spain.png', 30, false, true),
    ('Alemão', 'Deutsch', 'de', 'germany.png', 40, false, true),
    ('Italiano', 'Italiano', 'it', 'italy.png', 50, false, true),
    ('Francês', 'Français', 'fr', 'france.png', 60, false, true),
    ('Holandês', 'Nederlands', 'nl', 'netherlands.png', 70, false, true),
    ('Sueco', 'Svenska', 'sv', 'sweden.png', 80, false, true),
    ('Japonês', '日本語', 'ja', 'japan.png', 90, false, true),
    ('Chinês', '中文', 'zh', 'china.png', 100, false, true),
    ('Árabe', 'العربية', 'ar', 'saudi-arabia.png', 110, false, true),
    ('Hebraico', 'עברית', 'he', 'israel.png', 120, false, true),
    ('Turco', 'Türkçe', 'tr', 'turkey.png', 130, false, true),
    ('Russo', 'Русский', 'ru', 'russia.png', 140, false, true),
    ('Coreano', '한국어', 'ko', 'korea.png', 150, false, true);

-- Verify insertion
SELECT
    name,
    native_name,
    language_code,
    flag_file,
    display_order,
    is_default,
    is_active
FROM languages
ORDER BY display_order;
