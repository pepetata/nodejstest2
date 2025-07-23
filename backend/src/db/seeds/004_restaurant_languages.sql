-- Seed data for restaurant_languages table
-- Created: 2025-07-23
-- Purpose: Insert sample restaurant language configurations

-- First, let's get some restaurant IDs to work with
-- Note: This assumes restaurants exist in the database

-- Example seed data for restaurant language configurations
-- You can modify this based on actual restaurant IDs in your database

DO $$
DECLARE
    restaurant_uuid UUID;
    pt_br_id INTEGER;
    en_id INTEGER;
    es_id INTEGER;
    fr_id INTEGER;
BEGIN
    -- Get language IDs
    SELECT id INTO pt_br_id FROM languages WHERE language_code = 'pt-BR';
    SELECT id INTO en_id FROM languages WHERE language_code = 'en';
    SELECT id INTO es_id FROM languages WHERE language_code = 'es';
    SELECT id INTO fr_id FROM languages WHERE language_code = 'fr';

    -- Get first restaurant ID (adjust as needed)
    SELECT id INTO restaurant_uuid FROM restaurants LIMIT 1;

    -- If restaurant exists, add language configurations
    IF restaurant_uuid IS NOT NULL THEN
        -- Brazilian restaurant example: PT-BR as default, plus English and Spanish
        INSERT INTO restaurant_languages (restaurant_id, language_id, display_order, is_default, is_active) VALUES
            (restaurant_uuid, pt_br_id, 10, true, true),   -- Portuguese (default)
            (restaurant_uuid, en_id, 20, false, true),     -- English
            (restaurant_uuid, es_id, 30, false, true);     -- Spanish

        RAISE NOTICE 'Added language configuration for restaurant: %', restaurant_uuid;
    ELSE
        RAISE NOTICE 'No restaurants found in database. Skipping language configuration.';
    END IF;
END $$;

-- View the inserted data
SELECT
    rl.id,
    r.restaurant_name,
    l.name as language_name,
    l.language_code,
    rl.display_order,
    rl.is_default,
    rl.is_active
FROM restaurant_languages rl
JOIN restaurants r ON rl.restaurant_id = r.id
JOIN languages l ON rl.language_id = l.id
ORDER BY r.restaurant_name, rl.display_order;
