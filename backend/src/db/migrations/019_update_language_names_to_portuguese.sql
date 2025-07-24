-- Update languages to use Portuguese names
-- Created: 2025-07-24

-- Update language names to Portuguese while keeping native names
UPDATE languages SET name = 'Português' WHERE language_code = 'pt-BR';
UPDATE languages SET name = 'Inglês' WHERE language_code = 'en';
UPDATE languages SET name = 'Espanhol' WHERE language_code = 'es';
UPDATE languages SET name = 'Alemão' WHERE language_code = 'de';
UPDATE languages SET name = 'Italiano' WHERE language_code = 'it';
UPDATE languages SET name = 'Francês' WHERE language_code = 'fr';
UPDATE languages SET name = 'Holandês' WHERE language_code = 'nl';
UPDATE languages SET name = 'Sueco' WHERE language_code = 'sv';
UPDATE languages SET name = 'Japonês' WHERE language_code = 'ja';
UPDATE languages SET name = 'Chinês' WHERE language_code = 'zh';
UPDATE languages SET name = 'Árabe' WHERE language_code = 'ar';
UPDATE languages SET name = 'Hebraico' WHERE language_code = 'he';
UPDATE languages SET name = 'Turco' WHERE language_code = 'tr';
UPDATE languages SET name = 'Russo' WHERE language_code = 'ru';
UPDATE languages SET name = 'Coreano' WHERE language_code = 'ko';

-- Verify the update
SELECT name, native_name, language_code, flag_file FROM languages ORDER BY display_order;
