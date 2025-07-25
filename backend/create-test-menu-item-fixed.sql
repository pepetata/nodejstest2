-- Create test menu item data for testing
-- First, let's check existing data

\echo 'Restaurants:'
SELECT id, restaurant_name, restaurant_url_name FROM restaurants LIMIT 3;

\echo 'Categories:'
SELECT mc.id, mc.restaurant_id, mct.name
FROM menu_categories mc
JOIN menu_category_translations mct ON mc.id = mct.category_id
JOIN restaurant_languages rl ON mct.language_id = rl.id
JOIN languages l ON rl.language_id = l.id
WHERE l.language_code = 'pt-BR'
LIMIT 3;

\echo 'Languages:'
SELECT id, language_code, name, native_name FROM languages WHERE language_code IN ('pt-BR', 'en');

\echo 'Restaurant Languages:'
SELECT rl.id, rl.restaurant_id, l.language_code, l.name
FROM restaurant_languages rl
JOIN languages l ON rl.language_id = l.id
WHERE rl.restaurant_id = 'c7742866-f77b-4f68-8586-57d631af301a';

-- Create a test menu item
DO $$
DECLARE
    test_restaurant_id uuid := 'c7742866-f77b-4f68-8586-57d631af301a';
    test_menu_item_id uuid;
    test_category_id integer;
    pt_br_lang_id integer;
    en_lang_id integer;
BEGIN
    -- Get language IDs
    SELECT rl.id INTO pt_br_lang_id
    FROM restaurant_languages rl
    JOIN languages l ON rl.language_id = l.id
    WHERE rl.restaurant_id = test_restaurant_id
    AND l.language_code = 'pt-BR';

    SELECT rl.id INTO en_lang_id
    FROM restaurant_languages rl
    JOIN languages l ON rl.language_id = l.id
    WHERE rl.restaurant_id = test_restaurant_id
    AND l.language_code = 'en';

    -- Get a category ID
    SELECT id INTO test_category_id
    FROM menu_categories
    WHERE restaurant_id = test_restaurant_id
    LIMIT 1;

    -- Create menu item
    INSERT INTO menu_items (
        id, restaurant_id, sku, base_price,
        preparation_time_minutes, is_available
    ) VALUES (
        uuid_generate_v4(), test_restaurant_id, 'BURGER-001', 25.90,
        15, true
    ) RETURNING id INTO test_menu_item_id;

    -- Create Portuguese translation
    IF pt_br_lang_id IS NOT NULL THEN
        INSERT INTO menu_item_translations (
            id, item_id, language_code, name, description,
            ingredients, allergens, preparation_notes
        ) VALUES (
            uuid_generate_v4(), test_menu_item_id, 'pt-BR',
            'Hambúrguer Artesanal',
            'Delicioso hambúrguer artesanal com carne bovina, queijo, alface e tomate',
            'Pão brioche, carne bovina 180g, queijo cheddar, alface, tomate, maionese especial',
            'Glúten, Lactose',
            'Grelhado na chapa com temperos especiais, montado na hora'
        );
    END IF;

    -- Create English translation
    IF en_lang_id IS NOT NULL THEN
        INSERT INTO menu_item_translations (
            id, item_id, language_code, name, description,
            ingredients, allergens, preparation_notes
        ) VALUES (
            uuid_generate_v4(), test_menu_item_id, 'en',
            'Artisan Burger',
            'Delicious artisan burger with beef, cheese, lettuce and tomato',
            'Brioche bun, 180g beef patty, cheddar cheese, lettuce, tomato, special mayo',
            'Gluten, Lactose',
            'Grilled with special seasoning, assembled fresh to order'
        );
    END IF;

    -- Associate with category if available
    IF test_category_id IS NOT NULL THEN
        INSERT INTO menu_item_categories (
            id, item_id, category_id, display_order
        ) VALUES (
            uuid_generate_v4(), test_menu_item_id, test_category_id, 1
        );
    END IF;

    RAISE NOTICE 'Test menu item created with ID: %', test_menu_item_id;
END $$;

\echo 'Test Menu Item Created:'
SELECT
    mi.id, mi.sku, mi.base_price, mi.preparation_time_minutes, mi.is_available,
    mit.name, mit.description, mit.language_code
FROM menu_items mi
LEFT JOIN menu_item_translations mit ON mi.id = mit.item_id
WHERE mi.restaurant_id = 'c7742866-f77b-4f68-8586-57d631af301a'
ORDER BY mi.created_at DESC, mit.language_code
LIMIT 4;
