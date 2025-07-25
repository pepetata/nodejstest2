-- Test script to create a sample menu item
-- This will help us test the menu items functionality

-- First, let's see what restaurants and categories we have
SELECT 'Restaurants:' as info;
SELECT id, restaurant_name, url FROM restaurants LIMIT 3;

SELECT 'Categories:' as info;
SELECT mc.id, mct.name, mc.restaurant_id
FROM menu_categories mc
LEFT JOIN menu_category_translations mct ON mc.id = mct.category_id AND mct.language_code = 'pt-BR'
LIMIT 5;

SELECT 'Languages:' as info;
SELECT language_code, name, native_name FROM languages LIMIT 5;

-- Insert a test menu item
INSERT INTO menu_items (
    restaurant_id,
    sku,
    base_price,
    preparation_time_minutes,
    is_available,
    is_featured,
    display_order
) VALUES (
    'c7742866-f63b-4f68-8586-57d631af301a', -- Using the restaurant ID from our test
    'HAMBURGUER-001',
    25.90,
    15,
    true,
    true,
    1
) RETURNING id;

-- Get the item ID for translations (replace with actual ID returned above)
-- Let's assume the item ID is the one returned, we'll use a variable approach

-- For now, let's insert translations for the most recent item
INSERT INTO menu_item_translations (
    item_id,
    language_code,
    name,
    description,
    ingredients,
    preparation_method
) VALUES
-- Portuguese translation
((SELECT id FROM menu_items ORDER BY created_at DESC LIMIT 1),
 'pt-BR',
 'Hambúrguer Artesanal',
 'Delicioso hambúrguer artesanal com carne bovina, queijo, alface, tomate e molho especial da casa',
 'Pão brioche, carne bovina 180g, queijo cheddar, alface, tomate, cebola roxa, molho especial',
 'Grelhado na chapa com temperos especiais, montado na hora'
),
-- English translation
((SELECT id FROM menu_items ORDER BY created_at DESC LIMIT 1),
 'en-US',
 'Artisanal Burger',
 'Delicious artisanal burger with beef, cheese, lettuce, tomato and special house sauce',
 'Brioche bun, 180g beef patty, cheddar cheese, lettuce, tomato, red onion, special sauce',
 'Grilled with special seasoning, assembled fresh'
);

-- Link the item to a category (using the first category we find)
INSERT INTO menu_item_categories (
    item_id,
    category_id,
    display_order
) VALUES (
    (SELECT id FROM menu_items ORDER BY created_at DESC LIMIT 1),
    (SELECT id FROM menu_categories LIMIT 1),
    1
);

-- Verify the test item was created
SELECT 'Test Menu Item Created:' as info;
SELECT
    mi.id,
    mi.sku,
    mi.base_price,
    mi.preparation_time_minutes,
    mi.is_available,
    mit.name,
    mit.description,
    mit.language_code
FROM menu_items mi
LEFT JOIN menu_item_translations mit ON mi.id = mit.item_id
WHERE mi.sku = 'HAMBURGUER-001'
ORDER BY mit.language_code;
