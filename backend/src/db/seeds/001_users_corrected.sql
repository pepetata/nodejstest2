-- Seed: Users for restaurant management system
-- Created: 2025-07-02
-- Updated: 2025-07-06 - Complete user role hierarchy with username support

-- Restaurant Administrators (2 per restaurant)
INSERT INTO users (
    id,
    email,
    username,
    password,
    full_name,
    role,
    restaurant_id,
    status,
    email_confirmed,
    first_login_password_change,
    created_at
) VALUES
-- Pizzaria Bella Vista Administrators
(
    '770e8400-e29b-41d4-a716-446655440001',
    'joao.silva@pizzariabellavista.com.br',
    null, -- username not needed when email is present
    '$2b$12$Ht0VFCQrwEkt9Il9X7vqEuIX6iEwJpzpUYI5Oxx0k7jxNQQXtdrXK', -- password: 'admin123'
    'João Silva',
    'restaurant_administrator',
    '550e8400-e29b-41d4-a716-446655440001',
    'active',
    true,
    false,
    CURRENT_TIMESTAMP - INTERVAL '30 days'
),
(
    '770e8400-e29b-41d4-a716-446655440002',
    'maria.santos@pizzariabellavista.com.br',
    null,
    '$2b$12$Ht0VFCQrwEkt9Il9X7vqEuIX6iEwJpzpUYI5Oxx0k7jxNQQXtdrXK', -- password: 'admin123'
    'Maria Santos',
    'restaurant_administrator',
    '550e8400-e29b-41d4-a716-446655440001',
    'active',
    true,
    false,
    CURRENT_TIMESTAMP - INTERVAL '25 days'
),
-- Tacos El Mariachi Administrators
(
    '770e8400-e29b-41d4-a716-446655440003',
    'carlos.rodriguez@tacosmariachi.com',
    null,
    '$2b$12$Ht0VFCQrwEkt9Il9X7vqEuIX6iEwJpzpUYI5Oxx0k7jxNQQXtdrXK', -- password: 'admin123'
    'Carlos Rodriguez',
    'restaurant_administrator',
    '550e8400-e29b-41d4-a716-446655440002',
    'active',
    true,
    false,
    CURRENT_TIMESTAMP - INTERVAL '40 days'
),
(
    '770e8400-e29b-41d4-a716-446655440004',
    'sofia.martinez@tacosmariachi.com',
    null,
    '$2b$12$Ht0VFCQrwEkt9Il9X7vqEuIX6iEwJpzpUYI5Oxx0k7jxNQQXtdrXK', -- password: 'admin123'
    'Sofia Martinez',
    'restaurant_administrator',
    '550e8400-e29b-41d4-a716-446655440002',
    'active',
    true,
    false,
    CURRENT_TIMESTAMP - INTERVAL '38 days'
),
-- Burger Empire Administrators
(
    '770e8400-e29b-41d4-a716-446655440005',
    'robert.davis@burgerempire.com',
    null,
    '$2b$12$Ht0VFCQrwEkt9Il9X7vqEuIX6iEwJpzpUYI5Oxx0k7jxNQQXtdrXK', -- password: 'admin123'
    'Robert Davis',
    'restaurant_administrator',
    '550e8400-e29b-41d4-a716-446655440003',
    'active',
    true,
    false,
    CURRENT_TIMESTAMP - INTERVAL '70 days'
),
(
    '770e8400-e29b-41d4-a716-446655440006',
    'jennifer.smith@burgerempire.com',
    null,
    '$2b$12$Ht0VFCQrwEkt9Il9X7vqEuIX6iEwJpzpUYI5Oxx0k7jxNQQXtdrXK', -- password: 'admin123'
    'Jennifer Smith',
    'restaurant_administrator',
    '550e8400-e29b-41d4-a716-446655440003',
    'active',
    true,
    false,
    CURRENT_TIMESTAMP - INTERVAL '65 days'
),
-- Sushi Zen Administrators
(
    '770e8400-e29b-41d4-a716-446655440007',
    'kenji.yamamoto@sushizen.com.br',
    null,
    '$2b$12$Ht0VFCQrwEkt9Il9X7vqEuIX6iEwJpzpUYI5Oxx0k7jxNQQXtdrXK', -- password: 'admin123'
    'Kenji Yamamoto',
    'restaurant_administrator',
    '550e8400-e29b-41d4-a716-446655440004',
    'active',
    true,
    false,
    CURRENT_TIMESTAMP - INTERVAL '90 days'
),
(
    '770e8400-e29b-41d4-a716-446655440008',
    'yuki.tanaka@sushizen.com.br',
    null,
    '$2b$12$Ht0VFCQrwEkt9Il9X7vqEuIX6iEwJpzpUYI5Oxx0k7jxNQQXtdrXK', -- password: 'admin123'
    'Yuki Tanaka',
    'restaurant_administrator',
    '550e8400-e29b-41d4-a716-446655440004',
    'active',
    true,
    false,
    CURRENT_TIMESTAMP - INTERVAL '85 days'
),

-- Location Administrators (2 per restaurant)
-- Pizzaria Bella Vista Location Administrators
(
    '770e8400-e29b-41d4-a716-446655440101',
    'paulo.oliveira@pizzariabellavista.com.br',
    null,
    '$2b$12$aIZ5VX2S9KUzXFTBZnIXuei8GCrZq9S5MZLv0ZpfTnDRQnS8KgYfm', -- password: 'location123'
    'Paulo Oliveira',
    'location_administrator',
    null,
    'active',
    true,
    true,
    CURRENT_TIMESTAMP - INTERVAL '28 days'
),
(
    '770e8400-e29b-41d4-a716-446655440102',
    'lucia.costa@pizzariabellavista.com.br',
    null,
    '$2b$12$aIZ5VX2S9KUzXFTBZnIXuei8GCrZq9S5MZLv0ZpfTnDRQnS8KgYfm', -- password: 'location123'
    'Lucia Costa',
    'location_administrator',
    null,
    'active',
    true,
    true,
    CURRENT_TIMESTAMP - INTERVAL '26 days'
),
-- Tacos El Mariachi Location Administrators
(
    '770e8400-e29b-41d4-a716-446655440103',
    'miguel.garcia@tacosmariachi.com',
    null,
    '$2b$12$aIZ5VX2S9KUzXFTBZnIXuei8GCrZq9S5MZLv0ZpfTnDRQnS8KgYfm', -- password: 'location123'
    'Miguel Garcia',
    'location_administrator',
    null,
    'active',
    true,
    true,
    CURRENT_TIMESTAMP - INTERVAL '38 days'
),
(
    '770e8400-e29b-41d4-a716-446655440104',
    'sofia.martinez@tacosmariachi.com',
    null,
    '$2b$12$aIZ5VX2S9KUzXFTBZnIXuei8GCrZq9S5MZLv0ZpfTnDRQnS8KgYfm', -- password: 'location123'
    'Sofia Martinez',
    'location_administrator',
    null,
    'active',
    true,
    true,
    CURRENT_TIMESTAMP - INTERVAL '35 days'
),
-- Burger Empire Location Administrators
(
    '770e8400-e29b-41d4-a716-446655440105',
    'robert.davis@burgerempire.com',
    null,
    '$2b$12$aIZ5VX2S9KUzXFTBZnIXuei8GCrZq9S5MZLv0ZpfTnDRQnS8KgYfm', -- password: 'location123'
    'Robert Davis',
    'location_administrator',
    null,
    'active',
    true,
    true,
    CURRENT_TIMESTAMP - INTERVAL '65 days'
),
(
    '770e8400-e29b-41d4-a716-446655440106',
    'jennifer.smith@burgerempire.com',
    null,
    '$2b$12$aIZ5VX2S9KUzXFTBZnIXuei8GCrZq9S5MZLv0ZpfTnDRQnS8KgYfm', -- password: 'location123'
    'Jennifer Smith',
    'location_administrator',
    null,
    'active',
    true,
    true,
    CURRENT_TIMESTAMP - INTERVAL '60 days'
),
-- Sushi Zen Location Administrators
(
    '770e8400-e29b-41d4-a716-446655440107',
    'hiroshi.sato@sushizen.com.br',
    null,
    '$2b$12$aIZ5VX2S9KUzXFTBZnIXuei8GCrZq9S5MZLv0ZpfTnDRQnS8KgYfm', -- password: 'location123'
    'Hiroshi Sato',
    'location_administrator',
    null,
    'active',
    true,
    true,
    CURRENT_TIMESTAMP - INTERVAL '88 days'
),
(
    '770e8400-e29b-41d4-a716-446655440108',
    'akiko.nakamura@sushizen.com.br',
    null,
    '$2b$12$aIZ5VX2S9KUzXFTBZnIXuei8GCrZq9S5MZLv0ZpfTnDRQnS8KgYfm', -- password: 'location123'
    'Akiko Nakamura',
    'location_administrator',
    null,
    'active',
    true,
    true,
    CURRENT_TIMESTAMP - INTERVAL '82 days'
),

-- Waiters (2 per restaurant) - Using usernames instead of emails
-- Pizzaria Bella Vista Waiters
(
    '770e8400-e29b-41d4-a716-446655440201',
    null,
    'bruno.ferreira',
    '$2b$12$7yLjlLGzT5BjRqKiVmX.SeFdOQzEhE.tA4xQhOxQkJJGsKvK9tVe2', -- password: 'waiter123'
    'Bruno Ferreira',
    'waiter',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '20 days'
),
(
    '770e8400-e29b-41d4-a716-446655440202',
    null,
    'camila.ribeiro',
    '$2b$12$7yLjlLGzT5BjRqKiVmX.SeFdOQzEhE.tA4xQhOxQkJJGsKvK9tVe2', -- password: 'waiter123'
    'Camila Ribeiro',
    'waiter',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '18 days'
),
-- Tacos El Mariachi Waiters
(
    '770e8400-e29b-41d4-a716-446655440203',
    null,
    'diego.morales',
    '$2b$12$7yLjlLGzT5BjRqKiVmX.SeFdOQzEhE.tA4xQhOxQkJJGsKvK9tVe2', -- password: 'waiter123'
    'Diego Morales',
    'waiter',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '35 days'
),
(
    '770e8400-e29b-41d4-a716-446655440204',
    null,
    'isabella.hernandez',
    '$2b$12$7yLjlLGzT5BjRqKiVmX.SeFdOQzEhE.tA4xQhOxQkJJGsKvK9tVe2', -- password: 'waiter123'
    'Isabella Hernandez',
    'waiter',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '32 days'
),
-- Burger Empire Waiters
(
    '770e8400-e29b-41d4-a716-446655440205',
    null,
    'michael.wilson',
    '$2b$12$7yLjlLGzT5BjRqKiVmX.SeFdOQzEhE.tA4xQhOxQkJJGsKvK9tVe2', -- password: 'waiter123'
    'Michael Wilson',
    'waiter',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '45 days'
),
(
    '770e8400-e29b-41d4-a716-446655440206',
    null,
    'ashley.thompson',
    '$2b$12$7yLjlLGzT5BjRqKiVmX.SeFdOQzEhE.tA4xQhOxQkJJGsKvK9tVe2', -- password: 'waiter123'
    'Ashley Thompson',
    'waiter',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '42 days'
),
-- Sushi Zen Waiters
(
    '770e8400-e29b-41d4-a716-446655440207',
    null,
    'takeshi.suzuki',
    '$2b$12$7yLjlLGzT5BjRqKiVmX.SeFdOQzEhE.tA4xQhOxQkJJGsKvK9tVe2', -- password: 'waiter123'
    'Takeshi Suzuki',
    'waiter',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '95 days'
),
(
    '770e8400-e29b-41d4-a716-446655440208',
    null,
    'sakura.yamada',
    '$2b$12$7yLjlLGzT5BjRqKiVmX.SeFdOQzEhE.tA4xQhOxQkJJGsKvK9tVe2', -- password: 'waiter123'
    'Sakura Yamada',
    'waiter',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '92 days'
),

-- Food Runners (2 per restaurant) - Using usernames
-- Pizzaria Bella Vista Food Runners
(
    '770e8400-e29b-41d4-a716-446655440301',
    null,
    'rafael.almeida',
    '$2b$12$qTvA6bF3hZLjR2K8eIdH.eN9Xm4qD1QzPyT7vE8OcMt5yK8F9aHjG', -- password: 'runner123'
    'Rafael Almeida',
    'food_runner',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '15 days'
),
(
    '770e8400-e29b-41d4-a716-446655440302',
    null,
    'carla.souza',
    '$2b$12$qTvA6bF3hZLjR2K8eIdH.eN9Xm4qD1QzPyT7vE8OcMt5yK8F9aHjG', -- password: 'runner123'
    'Carla Souza',
    'food_runner',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '12 days'
),
-- Tacos El Mariachi Food Runners
(
    '770e8400-e29b-41d4-a716-446655440303',
    null,
    'luis.valdez',
    '$2b$12$qTvA6bF3hZLjR2K8eIdH.eN9Xm4qD1QzPyT7vE8OcMt5yK8F9aHjG', -- password: 'runner123'
    'Luis Valdez',
    'food_runner',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '40 days'
),
(
    '770e8400-e29b-41d4-a716-446655440304',
    null,
    'carmen.lopez',
    '$2b$12$qTvA6bF3hZLjR2K8eIdH.eN9Xm4qD1QzPyT7vE8OcMt5yK8F9aHjG', -- password: 'runner123'
    'Carmen Lopez',
    'food_runner',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '38 days'
),
-- Burger Empire Food Runners
(
    '770e8400-e29b-41d4-a716-446655440305',
    null,
    'steve.johnson',
    '$2b$12$qTvA6bF3hZLjR2K8eIdH.eN9Xm4qD1QzPyT7vE8OcMt5yK8F9aHjG', -- password: 'runner123'
    'Steve Johnson',
    'food_runner',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '55 days'
),
(
    '770e8400-e29b-41d4-a716-446655440306',
    null,
    'lisa.anderson',
    '$2b$12$qTvA6bF3hZLjR2K8eIdH.eN9Xm4qD1QzPyT7vE8OcMt5yK8F9aHjG', -- password: 'runner123'
    'Lisa Anderson',
    'food_runner',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '52 days'
),
-- Sushi Zen Food Runners
(
    '770e8400-e29b-41d4-a716-446655440307',
    null,
    'rei.watanabe',
    '$2b$12$qTvA6bF3hZLjR2K8eIdH.eN9Xm4qD1QzPyT7vE8OcMt5yK8F9aHjG', -- password: 'runner123'
    'Rei Watanabe',
    'food_runner',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '105 days'
),
(
    '770e8400-e29b-41d4-a716-446655440308',
    null,
    'hana.kobayashi',
    '$2b$12$qTvA6bF3hZLjR2K8eIdH.eN9Xm4qD1QzPyT7vE8OcMt5yK8F9aHjG', -- password: 'runner123'
    'Hana Kobayashi',
    'food_runner',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '102 days'
),

-- KDS Operators (2 per restaurant) - Using usernames
-- Pizzaria Bella Vista KDS Operators
(
    '770e8400-e29b-41d4-a716-446655440401',
    null,
    'thiago.lima',
    '$2b$12$dHzB9pM8JkLwQ3vR2sF6VeW8X5gT9uY4bC6nA2zE7pK3jL1mR8hO', -- password: 'kds123'
    'Thiago Lima',
    'kds_operator',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '25 days'
),
(
    '770e8400-e29b-41d4-a716-446655440402',
    null,
    'fernanda.gomes',
    '$2b$12$dHzB9pM8JkLwQ3vR2sF6VeW8X5gT9uY4bC6nA2zE7pK3jL1mR8hO', -- password: 'kds123'
    'Fernanda Gomes',
    'kds_operator',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '22 days'
),
-- Tacos El Mariachi KDS Operators
(
    '770e8400-e29b-41d4-a716-446655440403',
    null,
    'eduardo.ramirez',
    '$2b$12$dHzB9pM8JkLwQ3vR2sF6VeW8X5gT9uY4bC6nA2zE7pK3jL1mR8hO', -- password: 'kds123'
    'Eduardo Ramirez',
    'kds_operator',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '45 days'
),
(
    '770e8400-e29b-41d4-a716-446655440404',
    null,
    'gabriela.moreno',
    '$2b$12$dHzB9pM8JkLwQ3vR2sF6VeW8X5gT9uY4bC6nA2zE7pK3jL1mR8hO', -- password: 'kds123'
    'Gabriela Moreno',
    'kds_operator',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '42 days'
),
-- Burger Empire KDS Operators
(
    '770e8400-e29b-41d4-a716-446655440405',
    null,
    'kevin.brown',
    '$2b$12$dHzB9pM8JkLwQ3vR2sF6VeW8X5gT9uY4bC6nA2zE7pK3jL1mR8hO', -- password: 'kds123'
    'Kevin Brown',
    'kds_operator',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '70 days'
),
(
    '770e8400-e29b-41d4-a716-446655440406',
    null,
    'sarah.white',
    '$2b$12$dHzB9pM8JkLwQ3vR2sF6VeW8X5gT9uY4bC6nA2zE7pK3jL1mR8hO', -- password: 'kds123'
    'Sarah White',
    'kds_operator',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '68 days'
),
-- Sushi Zen KDS Operators
(
    '770e8400-e29b-41d4-a716-446655440407',
    null,
    'ichiro.kimura',
    '$2b$12$dHzB9pM8JkLwQ3vR2sF6VeW8X5gT9uY4bC6nA2zE7pK3jL1mR8hO', -- password: 'kds123'
    'Ichiro Kimura',
    'kds_operator',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '110 days'
),
(
    '770e8400-e29b-41d4-a716-446655440408',
    null,
    'misaki.tanaka',
    '$2b$12$dHzB9pM8JkLwQ3vR2sF6VeW8X5gT9uY4bC6nA2zE7pK3jL1mR8hO', -- password: 'kds123'
    'Misaki Tanaka',
    'kds_operator',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '108 days'
),

-- POS Operators (2 per restaurant) - Using usernames
-- Pizzaria Bella Vista POS Operators
(
    '770e8400-e29b-41d4-a716-446655440501',
    null,
    'rodrigo.martins',
    '$2b$12$pL5mN8wQ9vZ2tX4fH7rB.uE1aK6jD9yR3oC8vT2nS5qA7zF1gMpL', -- password: 'pos123'
    'Rodrigo Martins',
    'pos_operator',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '30 days'
),
(
    '770e8400-e29b-41d4-a716-446655440502',
    null,
    'amanda.silva',
    '$2b$12$pL5mN8wQ9vZ2tX4fH7rB.uE1aK6jD9yR3oC8vT2nS5qA7zF1gMpL', -- password: 'pos123'
    'Amanda Silva',
    'pos_operator',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '28 days'
),
-- Tacos El Mariachi POS Operators
(
    '770e8400-e29b-41d4-a716-446655440503',
    null,
    'pedro.gutierrez',
    '$2b$12$pL5mN8wQ9vZ2tX4fH7rB.uE1aK6jD9yR3oC8vT2nS5qA7zF1gMpL', -- password: 'pos123'
    'Pedro Gutierrez',
    'pos_operator',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '50 days'
),
(
    '770e8400-e29b-41d4-a716-446655440504',
    null,
    'ana.vasquez',
    '$2b$12$pL5mN8wQ9vZ2tX4fH7rB.uE1aK6jD9yR3oC8vT2nS5qA7zF1gMpL', -- password: 'pos123'
    'Ana Vasquez',
    'pos_operator',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '48 days'
),
-- Burger Empire POS Operators
(
    '770e8400-e29b-41d4-a716-446655440505',
    null,
    'daniel.clark',
    '$2b$12$pL5mN8wQ9vZ2tX4fH7rB.uE1aK6jD9yR3oC8vT2nS5qA7zF1gMpL', -- password: 'pos123'
    'Daniel Clark',
    'pos_operator',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '75 days'
),
(
    '770e8400-e29b-41d4-a716-446655440506',
    null,
    'emily.rodriguez',
    '$2b$12$pL5mN8wQ9vZ2tX4fH7rB.uE1aK6jD9yR3oC8vT2nS5qA7zF1gMpL', -- password: 'pos123'
    'Emily Rodriguez',
    'pos_operator',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '72 days'
),
-- Sushi Zen POS Operators
(
    '770e8400-e29b-41d4-a716-446655440507',
    null,
    'shinji.hayashi',
    '$2b$12$pL5mN8wQ9vZ2tX4fH7rB.uE1aK6jD9yR3oC8vT2nS5qA7zF1gMpL', -- password: 'pos123'
    'Shinji Hayashi',
    'pos_operator',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '115 days'
),
(
    '770e8400-e29b-41d4-a716-446655440508',
    null,
    'yui.matsumoto',
    '$2b$12$pL5mN8wQ9vZ2tX4fH7rB.uE1aK6jD9yR3oC8vT2nS5qA7zF1gMpL', -- password: 'pos123'
    'Yui Matsumoto',
    'pos_operator',
    null,
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '112 days'
);

-- =============================================================================
-- SUMMARY OF CREATED USERS
-- =============================================================================

/*
RESTAURANT ADMINISTRATORS (8 total):
- Pizzaria Bella Vista: João Silva, Maria Santos (emails)
- Tacos El Mariachi: Carlos Rodriguez, Sofia Martinez (emails)
- Burger Empire: Robert Davis, Jennifer Smith (emails)
- Sushi Zen: Kenji Yamamoto, Yuki Tanaka (emails)

LOCATION ADMINISTRATORS (8 total):
- Pizzaria Bella Vista: Paulo Oliveira, Lucia Costa (emails)
- Tacos El Mariachi: Miguel Garcia, Sofia Martinez (emails)
- Burger Empire: Robert Davis, Jennifer Smith (emails)
- Sushi Zen: Hiroshi Sato, Akiko Nakamura (emails)

WAITERS (8 total):
- Pizzaria Bella Vista: Bruno Ferreira, Camila Ribeiro (usernames)
- Tacos El Mariachi: Diego Morales, Isabella Hernandez (usernames)
- Burger Empire: Michael Wilson, Ashley Thompson (usernames)
- Sushi Zen: Takeshi Suzuki, Sakura Yamada (usernames)

FOOD RUNNERS (8 total):
- Pizzaria Bella Vista: Rafael Almeida, Carla Souza (usernames)
- Tacos El Mariachi: Luis Valdez, Carmen Lopez (usernames)
- Burger Empire: Steve Johnson, Lisa Anderson (usernames)
- Sushi Zen: Rei Watanabe, Hana Kobayashi (usernames)

KDS OPERATORS (8 total):
- Pizzaria Bella Vista: Thiago Lima, Fernanda Gomes (usernames)
- Tacos El Mariachi: Eduardo Ramirez, Gabriela Moreno (usernames)
- Burger Empire: Kevin Brown, Sarah White (usernames)
- Sushi Zen: Ichiro Kimura, Misaki Tanaka (usernames)

POS OPERATORS (8 total):
- Pizzaria Bella Vista: Rodrigo Martins, Amanda Silva (usernames)
- Tacos El Mariachi: Pedro Gutierrez, Ana Vasquez (usernames)
- Burger Empire: Daniel Clark, Emily Rodriguez (usernames)
- Sushi Zen: Shinji Hayashi, Yui Matsumoto (usernames)

AUTHENTICATION:
- Admin roles (restaurant & location administrators): Use email + password
- Operational roles (waiters, food runners, KDS, POS): Use username + password
- All passwords are bcrypt hashed for security
- Different role-based password patterns for testing
*/
