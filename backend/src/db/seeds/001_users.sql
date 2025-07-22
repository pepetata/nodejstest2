-- Seed: Users for restaurant management system with multiple roles
-- Created: 2025-07-13
-- Purpose: Simple seed data for testing the new multiple roles system

-- Insert sample users (without roles initially)
INSERT INTO users (
    id,
    email,
    username,
    password,
    full_name,
    restaurant_id,
    status,
    email_confirmed,
    first_login_password_change,
    created_at
) VALUES
-- Restaurant Administrator for Pizzaria Bella Vista
(
    '770e8400-e29b-41d4-a716-446655440001',
    'admin@pizzariabellavista.com.br',
    null,
    'plaintext_admin123', -- will be hashed by application
    'João Silva',
    '550e8400-e29b-41d4-a716-446655440001', -- Pizzaria Bella Vista
    'active',
    true,
    false,
    CURRENT_TIMESTAMP - INTERVAL '30 days'
),
-- Multi-role user (Restaurant Admin + Waiter)
(
    '770e8400-e29b-41d4-a716-446655440002',
    'maria@pizzariabellavista.com.br',
    null,
    'plaintext_admin123', -- will be hashed by application
    'Maria Santos',
    '550e8400-e29b-41d4-a716-446655440001', -- Pizzaria Bella Vista
    'active',
    true,
    false,
    CURRENT_TIMESTAMP - INTERVAL '25 days'
),
-- Waiter (username-based authentication)
(
    '770e8400-e29b-41d4-a716-446655440003',
    null,
    'waiter_carlos',
    'plaintext_waiter123', -- will be hashed by application
    'Carlos Pereira',
    '550e8400-e29b-41d4-a716-446655440001', -- Pizzaria Bella Vista
    'active',
    false,
    true,
    CURRENT_TIMESTAMP - INTERVAL '15 days'
),
-- Super Admin (system-wide access)
(
    '770e8400-e29b-41d4-a716-446655440005',
    'superadmin@alacarte.com',
    null,
    'plaintext_super123', -- will be hashed by application
    'System Administrator',
    null, -- No specific restaurant
    'active',
    true,
    false,
    CURRENT_TIMESTAMP - INTERVAL '60 days'
)
ON CONFLICT (id) DO NOTHING;

-- Now assign roles to users via user_roles table

-- João Silva: Restaurant Administrator
INSERT INTO user_roles (
    id,
    user_id,
    role_id,
    restaurant_id,
    location_id,
    assigned_by,
    is_active,
    valid_from,
    created_at
) VALUES (
    uuid_generate_v4(),
    '770e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM roles WHERE name = 'restaurant_administrator'),
    '550e8400-e29b-41d4-a716-446655440001', -- Pizzaria Bella Vista
    null, -- Restaurant-wide access
    '770e8400-e29b-41d4-a716-446655440005', -- Assigned by super admin
    true,
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_TIMESTAMP - INTERVAL '30 days'
) ON CONFLICT DO NOTHING;

-- Maria Santos: Restaurant Administrator + Waiter (demonstrating multiple roles)
INSERT INTO user_roles (
    id,
    user_id,
    role_id,
    restaurant_id,
    location_id,
    assigned_by,
    is_active,
    valid_from,
    created_at
) VALUES
-- Primary role: Restaurant Administrator
(
    uuid_generate_v4(),
    '770e8400-e29b-41d4-a716-446655440002',
    (SELECT id FROM roles WHERE name = 'restaurant_administrator'),
    '550e8400-e29b-41d4-a716-446655440001', -- Pizzaria Bella Vista
    null, -- Restaurant-wide access
    '770e8400-e29b-41d4-a716-446655440001', -- Assigned by João Silva
    true,
    CURRENT_TIMESTAMP - INTERVAL '25 days',
    CURRENT_TIMESTAMP - INTERVAL '25 days'
),
-- Secondary role: Waiter
(
    uuid_generate_v4(),
    '770e8400-e29b-41d4-a716-446655440002',
    (SELECT id FROM roles WHERE name = 'waiter'),
    '550e8400-e29b-41d4-a716-446655440001', -- Pizzaria Bella Vista
    null, -- Restaurant-wide access (no specific location)
    '770e8400-e29b-41d4-a716-446655440001', -- Assigned by João Silva
    true,
    CURRENT_TIMESTAMP - INTERVAL '20 days',
    CURRENT_TIMESTAMP - INTERVAL '20 days'
) ON CONFLICT DO NOTHING;

-- Carlos Pereira: Waiter
INSERT INTO user_roles (
    id,
    user_id,
    role_id,
    restaurant_id,
    location_id,
    assigned_by,
    is_active,
    valid_from,
    created_at
) VALUES (
    uuid_generate_v4(),
    '770e8400-e29b-41d4-a716-446655440003',
    (SELECT id FROM roles WHERE name = 'waiter'),
    '550e8400-e29b-41d4-a716-446655440001', -- Pizzaria Bella Vista
    null, -- Restaurant-wide access (no specific location)
    '770e8400-e29b-41d4-a716-446655440001', -- Assigned by João Silva
    true,
    CURRENT_TIMESTAMP - INTERVAL '15 days',
    CURRENT_TIMESTAMP - INTERVAL '15 days'
) ON CONFLICT DO NOTHING;

-- System Administrator: Super Admin
INSERT INTO user_roles (
    id,
    user_id,
    role_id,
    restaurant_id,
    location_id,
    assigned_by,
    is_active,
    valid_from,
    created_at
) VALUES (
    uuid_generate_v4(),
    '770e8400-e29b-41d4-a716-446655440005',
    (SELECT id FROM roles WHERE name = 'superadmin'),
    null, -- System-wide access
    null, -- System-wide access
    null, -- Self-assigned or system-assigned
    true,
    CURRENT_TIMESTAMP - INTERVAL '60 days',
    CURRENT_TIMESTAMP - INTERVAL '60 days'
) ON CONFLICT DO NOTHING;

-- End of seed file
