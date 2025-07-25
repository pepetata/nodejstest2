-- Create simple test menu item data for testing

-- Create a test menu item
DO $$
DECLARE
    test_restaurant_id uuid := 'c7742866-f77b-4f68-8586-57d631af301a';
    test_menu_item_id uuid;
    test_category_id integer;
BEGIN
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
    INSERT INTO menu_item_translations (
        id, item_id, language_code, name, description,
        ingredients, preparation_method
    ) VALUES (
        uuid_generate_v4(), test_menu_item_id, 'pt-BR',
        'Hambúrguer Artesanal',
        'Delicioso hambúrguer artesanal com carne bovina, queijo, alface e tomate',
        'Pão brioche, carne bovina 180g, queijo cheddar, alface, tomate, maionese especial',
        'Grelhado na chapa com temperos especiais, montado na hora'
    );

    -- Create English translation
    INSERT INTO menu_item_translations (
        id, item_id, language_code, name, description,
        ingredients, preparation_method
    ) VALUES (
        uuid_generate_v4(), test_menu_item_id, 'en',
        'Artisan Burger',
        'Delicious artisan burger with beef, cheese, lettuce and tomato',
        'Brioche bun, 180g beef patty, cheddar cheese, lettuce, tomato, special mayo',
        'Grilled with special seasoning, assembled fresh to order'
    );

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

-- Show the created item
SELECT
    mi.id, mi.sku, mi.base_price, mi.preparation_time_minutes, mi.is_available,
    mit.name, mit.description, mit.language_code
FROM menu_items mi
LEFT JOIN menu_item_translations mit ON mi.id = mit.item_id
WHERE mi.restaurant_id = 'c7742866-f77b-4f68-8586-57d631af301a'
ORDER BY mi.created_at DESC, mit.language_code
LIMIT 4;
