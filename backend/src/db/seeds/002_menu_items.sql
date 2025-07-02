-- Seed: Menu items
-- Created: 2025-07-02

-- Appetizers
INSERT INTO menu_items (name, description, price, category, image, is_available)
VALUES 
    ('Garlic Bread', 'Freshly baked bread with garlic butter and herbs', 4.99, 'appetizers', 'garlic_bread.jpg', true),
    ('Mozzarella Sticks', 'Deep-fried mozzarella sticks served with marinara sauce', 6.99, 'appetizers', 'mozzarella_sticks.jpg', true),
    ('Buffalo Wings', 'Crispy chicken wings tossed in spicy buffalo sauce', 9.99, 'appetizers', 'buffalo_wings.jpg', true),
    ('Calamari', 'Fried squid rings served with lemon and tartar sauce', 8.99, 'appetizers', 'calamari.jpg', true);

-- Main Courses
INSERT INTO menu_items (name, description, price, category, image, is_available)
VALUES 
    ('Margherita Pizza', 'Classic pizza with tomato sauce, fresh mozzarella, and basil', 12.99, 'main', 'margherita_pizza.jpg', true),
    ('Spaghetti Bolognese', 'Spaghetti with rich beef and tomato sauce', 11.99, 'main', 'spaghetti_bolognese.jpg', true),
    ('Grilled Salmon', 'Fresh salmon fillet grilled to perfection with lemon butter sauce', 17.99, 'main', 'grilled_salmon.jpg', true),
    ('Chicken Alfredo', 'Fettuccine pasta with creamy alfredo sauce and grilled chicken', 14.99, 'main', 'chicken_alfredo.jpg', true),
    ('Vegetable Stir Fry', 'Mixed vegetables stir-fried in a savory sauce', 10.99, 'main', 'vegetable_stir_fry.jpg', true);

-- Desserts
INSERT INTO menu_items (name, description, price, category, image, is_available)
VALUES 
    ('Tiramisu', 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone cream', 6.99, 'desserts', 'tiramisu.jpg', true),
    ('Chocolate Lava Cake', 'Warm chocolate cake with molten center, served with vanilla ice cream', 7.99, 'desserts', 'chocolate_lava_cake.jpg', true),
    ('New York Cheesecake', 'Creamy cheesecake with a graham cracker crust', 6.99, 'desserts', 'new_york_cheesecake.jpg', true);

-- Beverages
INSERT INTO menu_items (name, description, price, category, image, is_available)
VALUES 
    ('Soft Drinks', 'Cola, lemon-lime, or orange soda', 2.49, 'beverages', 'soft_drinks.jpg', true),
    ('Fresh Lemonade', 'Freshly squeezed lemonade with mint', 3.49, 'beverages', 'fresh_lemonade.jpg', true),
    ('Iced Tea', 'Homemade sweet or unsweetened iced tea', 2.99, 'beverages', 'iced_tea.jpg', true),
    ('Espresso', 'Strong Italian coffee', 2.99, 'beverages', 'espresso.jpg', true);
