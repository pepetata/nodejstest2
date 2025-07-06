-- Seed: Restaurants for testing
-- Created: 2025-07-06
-- Purpose: Create 4 test restaurants - 2 single location, 2 multi-location

-- Single Location Restaurants
INSERT INTO restaurants (
    id,
    restaurant_name,
    restaurant_url_name,
    business_type,
    cuisine_type,
    phone,
    whatsapp,
    website,
    description,
    status,
    subscription_plan,
    subscription_status,
    terms_accepted,
    terms_accepted_at,
    marketing_consent
) VALUES
-- Restaurant 1: Single Location Italian
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Pizzaria Bella Vista',
    'pizzaria-bella-vista',
    'single',
    'Italian',
    '11987654321',
    '11987654321',
    'https://pizzariabellavista.com.br',
    'Authentic Italian pizza restaurant with wood-fired oven and fresh ingredients',
    'active',
    'professional',
    'active',
    true,
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    true
),
-- Restaurant 2: Single Location Mexican
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Tacos El Mariachi',
    'tacos-el-mariachi',
    'single',
    'Mexican',
    '11987654322',
    '11987654322',
    'https://tacosmariachi.com',
    'Traditional Mexican tacos and authentic street food experience',
    'active',
    'starter',
    'active',
    true,
    CURRENT_TIMESTAMP - INTERVAL '45 days',
    false
),
-- Restaurant 3: Multi-Location Burger Chain
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Burger Empire',
    'burger-empire',
    'chain',
    'American',
    '11987654323',
    '11987654323',
    'https://burgerempire.com',
    'Premium burger chain with artisanal ingredients and innovative flavors',
    'active',
    'premium',
    'active',
    true,
    CURRENT_TIMESTAMP - INTERVAL '60 days',
    true
),
-- Restaurant 4: Multi-Location Sushi Chain
(
    '550e8400-e29b-41d4-a716-446655440004',
    'Sushi Zen',
    'sushi-zen',
    'chain',
    'Japanese',
    '11987654324',
    '11987654324',
    'https://sushizen.com.br',
    'Modern sushi restaurant chain with fresh fish and contemporary Japanese cuisine',
    'active',
    'enterprise',
    'active',
    true,
    CURRENT_TIMESTAMP - INTERVAL '90 days',
    true
)
ON CONFLICT (restaurant_url_name) DO NOTHING;
