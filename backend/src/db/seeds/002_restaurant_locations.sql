-- Seed: Restaurant Locations
-- Created: 2025-07-06
-- Purpose: Create locations for restaurants (1 each for single, 4 each for multi-location)

-- Single Location Restaurant Locations
INSERT INTO restaurant_locations (
    id,
    restaurant_id,
    name,
    url_name,
    phone,
    whatsapp,
    address_zip_code,
    address_street,
    address_street_number,
    address_complement,
    address_city,
    address_state,
    operating_hours,
    selected_features,
    is_primary,
    status
) VALUES
-- Pizzaria Bella Vista - Single Location
(
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'Pizzaria Bella Vista - Main',
    'main',
    '11987654321',
    '11987654321',
    '01310-100',
    'Avenida Paulista',
    '1578',
    'Loja 2',
    'São Paulo',
    'SP',
    '{
        "monday": {"open": "18:00", "close": "23:00", "closed": false},
        "tuesday": {"open": "18:00", "close": "23:00", "closed": false},
        "wednesday": {"open": "18:00", "close": "23:00", "closed": false},
        "thursday": {"open": "18:00", "close": "23:00", "closed": false},
        "friday": {"open": "18:00", "close": "00:00", "closed": false},
        "saturday": {"open": "18:00", "close": "00:00", "closed": false},
        "sunday": {"open": "18:00", "close": "23:00", "closed": false},
        "holidays": {"open": "19:00", "close": "22:00", "closed": false}
    }',
    ARRAY['digital_menu', 'online_ordering', 'delivery_tracking', 'table_reservations'],
    true,
    'active'
),
-- Tacos El Mariachi - Single Location
(
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    'Tacos El Mariachi - Centro',
    'centro',
    '11987654322',
    '11987654322',
    '01001-000',
    'Rua do Comércio',
    '45',
    '',
    'São Paulo',
    'SP',
    '{
        "monday": {"open": "11:00", "close": "22:00", "closed": false},
        "tuesday": {"open": "11:00", "close": "22:00", "closed": false},
        "wednesday": {"open": "11:00", "close": "22:00", "closed": false},
        "thursday": {"open": "11:00", "close": "22:00", "closed": false},
        "friday": {"open": "11:00", "close": "23:00", "closed": false},
        "saturday": {"open": "11:00", "close": "23:00", "closed": false},
        "sunday": {"open": "12:00", "close": "21:00", "closed": false},
        "holidays": {"open": "00:00", "close": "00:00", "closed": true}
    }',
    ARRAY['digital_menu', 'takeout', 'delivery'],
    true,
    'active'
),
-- Burger Empire - Location 1 (Downtown)
(
    '660e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440003',
    'Burger Empire - Downtown',
    'downtown',
    '11987654323',
    '11987654323',
    '01311-000',
    'Rua Augusta',
    '2500',
    'Shopping Center Paulista, Piso L1',
    'São Paulo',
    'SP',
    '{
        "monday": {"open": "10:00", "close": "22:00", "closed": false},
        "tuesday": {"open": "10:00", "close": "22:00", "closed": false},
        "wednesday": {"open": "10:00", "close": "22:00", "closed": false},
        "thursday": {"open": "10:00", "close": "22:00", "closed": false},
        "friday": {"open": "10:00", "close": "23:00", "closed": false},
        "saturday": {"open": "10:00", "close": "23:00", "closed": false},
        "sunday": {"open": "12:00", "close": "22:00", "closed": false}
    }',
    ARRAY['digital_menu', 'online_ordering', 'delivery_tracking', 'loyalty_program', 'mobile_payments'],
    true,
    'active'
),
-- Burger Empire - Location 2 (Vila Madalena)
(
    '660e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440003',
    'Burger Empire - Vila Madalena',
    'vila-madalena',
    '11987654324',
    '11987654324',
    '05414-001',
    'Rua Harmonia',
    '123',
    '',
    'São Paulo',
    'SP',
    '{
        "monday": {"open": "11:00", "close": "23:00", "closed": false},
        "tuesday": {"open": "11:00", "close": "23:00", "closed": false},
        "wednesday": {"open": "11:00", "close": "23:00", "closed": false},
        "thursday": {"open": "11:00", "close": "23:00", "closed": false},
        "friday": {"open": "11:00", "close": "00:00", "closed": false},
        "saturday": {"open": "11:00", "close": "00:00", "closed": false},
        "sunday": {"open": "12:00", "close": "23:00", "closed": false}
    }',
    ARRAY['digital_menu', 'online_ordering', 'delivery_tracking', 'table_reservations', 'live_music'],
    false,
    'active'
),
-- Burger Empire - Location 3 (Morumbi)
(
    '660e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440003',
    'Burger Empire - Morumbi',
    'morumbi',
    '11987654325',
    '11987654325',
    '05651-901',
    'Avenida Giovanni Gronchi',
    '5930',
    'Shopping Morumbi, Piso Superior',
    'São Paulo',
    'SP',
    '{
        "monday": {"open": "10:00", "close": "22:00", "closed": false},
        "tuesday": {"open": "10:00", "close": "22:00", "closed": false},
        "wednesday": {"open": "10:00", "close": "22:00", "closed": false},
        "thursday": {"open": "10:00", "close": "22:00", "closed": false},
        "friday": {"open": "10:00", "close": "23:00", "closed": false},
        "saturday": {"open": "10:00", "close": "23:00", "closed": false},
        "sunday": {"open": "12:00", "close": "22:00", "closed": false}
    }',
    ARRAY['digital_menu', 'online_ordering', 'delivery_tracking', 'loyalty_program'],
    false,
    'active'
),
-- Burger Empire - Location 4 (Ipiranga)
(
    '660e8400-e29b-41d4-a716-446655440014',
    '550e8400-e29b-41d4-a716-446655440003',
    'Burger Empire - Ipiranga',
    'ipiranga',
    '11987654326',
    '11987654326',
    '04263-000',
    'Rua Silva Bueno',
    '1821',
    '',
    'São Paulo',
    'SP',
    '{
        "monday": {"open": "11:00", "close": "22:00", "closed": false},
        "tuesday": {"open": "11:00", "close": "22:00", "closed": false},
        "wednesday": {"open": "11:00", "close": "22:00", "closed": false},
        "thursday": {"open": "11:00", "close": "22:00", "closed": false},
        "friday": {"open": "11:00", "close": "23:00", "closed": false},
        "saturday": {"open": "11:00", "close": "23:00", "closed": false},
        "sunday": {"open": "12:00", "close": "22:00", "closed": false}
    }',
    ARRAY['digital_menu', 'takeout', 'delivery'],
    false,
    'active'
),
-- Sushi Zen - Location 1 (Jardins)
(
    '660e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440004',
    'Sushi Zen - Jardins',
    'jardins',
    '11987654327',
    '11987654327',
    '01419-001',
    'Rua Oscar Freire',
    '608',
    '',
    'São Paulo',
    'SP',
    '{
        "monday": {"open": "18:00", "close": "23:30", "closed": false},
        "tuesday": {"open": "18:00", "close": "23:30", "closed": false},
        "wednesday": {"open": "18:00", "close": "23:30", "closed": false},
        "thursday": {"open": "18:00", "close": "23:30", "closed": false},
        "friday": {"open": "18:00", "close": "00:30", "closed": false},
        "saturday": {"open": "18:00", "close": "00:30", "closed": false},
        "sunday": {"open": "18:00", "close": "23:00", "closed": false}
    }',
    ARRAY['digital_menu', 'online_ordering', 'table_reservations', 'premium_service', 'sake_pairing'],
    true,
    'active'
),
-- Sushi Zen - Location 2 (Itaim Bibi)
(
    '660e8400-e29b-41d4-a716-446655440022',
    '550e8400-e29b-41d4-a716-446655440004',
    'Sushi Zen - Itaim Bibi',
    'itaim-bibi',
    '11987654328',
    '11987654328',
    '04534-001',
    'Rua João Cachoeira',
    '899',
    '',
    'São Paulo',
    'SP',
    '{
        "monday": {"open": "18:30", "close": "23:00", "closed": false},
        "tuesday": {"open": "18:30", "close": "23:00", "closed": false},
        "wednesday": {"open": "18:30", "close": "23:00", "closed": false},
        "thursday": {"open": "18:30", "close": "23:00", "closed": false},
        "friday": {"open": "18:30", "close": "00:00", "closed": false},
        "saturday": {"open": "18:30", "close": "00:00", "closed": false},
        "sunday": {"open": "18:30", "close": "22:30", "closed": false}
    }',
    ARRAY['digital_menu', 'online_ordering', 'delivery_tracking', 'premium_service'],
    false,
    'active'
),
-- Sushi Zen - Location 3 (Moema)
(
    '660e8400-e29b-41d4-a716-446655440023',
    '550e8400-e29b-41d4-a716-446655440004',
    'Sushi Zen - Moema',
    'moema',
    '11987654329',
    '11987654329',
    '04038-001',
    'Avenida Ibirapuera',
    '3103',
    'Shopping Ibirapuera, Piso Expansão',
    'São Paulo',
    'SP',
    '{
        "monday": {"open": "12:00", "close": "22:00", "closed": false},
        "tuesday": {"open": "12:00", "close": "22:00", "closed": false},
        "wednesday": {"open": "12:00", "close": "22:00", "closed": false},
        "thursday": {"open": "12:00", "close": "22:00", "closed": false},
        "friday": {"open": "12:00", "close": "23:00", "closed": false},
        "saturday": {"open": "12:00", "close": "23:00", "closed": false},
        "sunday": {"open": "12:00", "close": "22:00", "closed": false}
    }',
    ARRAY['digital_menu', 'online_ordering', 'delivery_tracking', 'lunch_specials'],
    false,
    'active'
),
-- Sushi Zen - Location 4 (Pinheiros)
(
    '660e8400-e29b-41d4-a716-446655440024',
    '550e8400-e29b-41d4-a716-446655440004',
    'Sushi Zen - Pinheiros',
    'pinheiros',
    '11987654330',
    '11987654330',
    '05422-001',
    'Rua dos Pinheiros',
    '498',
    '',
    'São Paulo',
    'SP',
    '{
        "monday": {"open": "19:00", "close": "23:30", "closed": false},
        "tuesday": {"open": "19:00", "close": "23:30", "closed": false},
        "wednesday": {"open": "19:00", "close": "23:30", "closed": false},
        "thursday": {"open": "19:00", "close": "23:30", "closed": false},
        "friday": {"open": "19:00", "close": "00:30", "closed": false},
        "saturday": {"open": "19:00", "close": "00:30", "closed": false},
        "sunday": {"open": "19:00", "close": "23:00", "closed": false}
    }',
    ARRAY['digital_menu', 'online_ordering', 'table_reservations', 'omakase_menu'],
    false,
    'active'
)
ON CONFLICT (restaurant_id, url_name) DO NOTHING;
