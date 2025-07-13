-- Seed: User Location Assignments
-- Created: 2025-07-06
-- Purpose: Assign users to specific restaurant locations for multi-location management

-- Restaurant Administrators don't need location assignments as they have restaurant-wide access
-- Location Administrators are assigned to all locations of their restaurants
-- Other roles (waiters, food runners, KDS operators, POS operators) are assigned to specific locations

-- =============================================================================
-- SINGLE-LOCATION RESTAURANT ASSIGNMENTS
-- =============================================================================

-- Pizzaria Bella Vista (single location) - All non-admin users to main location
INSERT INTO user_location_assignments (
    id,
    user_id,
    location_id,
    is_primary_location,
    assigned_by,
    kds_stations,
    created_at
) VALUES
-- Location Administrators
(
    '880e8400-e29b-41d4-a716-446655440101',
    '770e8400-e29b-41d4-a716-446655440101', -- Paulo Oliveira
    '660e8400-e29b-41d4-a716-446655440001', -- Pizzaria Bella Vista - Main
    true,
    '770e8400-e29b-41d4-a716-446655440001', -- Assigned by João Silva (restaurant admin)
    null,
    CURRENT_TIMESTAMP - INTERVAL '28 days'
),
(
    '880e8400-e29b-41d4-a716-446655440102',
    '770e8400-e29b-41d4-a716-446655440102', -- Lucia Costa
    '660e8400-e29b-41d4-a716-446655440001', -- Pizzaria Bella Vista - Main
    true,
    '770e8400-e29b-41d4-a716-446655440001', -- Assigned by João Silva (restaurant admin)
    null,
    CURRENT_TIMESTAMP - INTERVAL '26 days'
),

-- Waiters
(
    '880e8400-e29b-41d4-a716-446655440201',
    '770e8400-e29b-41d4-a716-446655440201', -- Bruno Ferreira
    '660e8400-e29b-41d4-a716-446655440001', -- Pizzaria Bella Vista - Main
    true,
    '770e8400-e29b-41d4-a716-446655440101', -- Assigned by Paulo Oliveira (location admin)
    null,
    CURRENT_TIMESTAMP - INTERVAL '20 days'
),
(
    '880e8400-e29b-41d4-a716-446655440202',
    '770e8400-e29b-41d4-a716-446655440202', -- Camila Ribeiro
    '660e8400-e29b-41d4-a716-446655440001', -- Pizzaria Bella Vista - Main
    true,
    '770e8400-e29b-41d4-a716-446655440101', -- Assigned by Paulo Oliveira (location admin)
    null,
    CURRENT_TIMESTAMP - INTERVAL '18 days'
),

-- Food Runners
(
    '880e8400-e29b-41d4-a716-446655440301',
    '770e8400-e29b-41d4-a716-446655440301', -- Rafael Almeida
    '660e8400-e29b-41d4-a716-446655440001', -- Pizzaria Bella Vista - Main
    true,
    '770e8400-e29b-41d4-a716-446655440101', -- Assigned by Paulo Oliveira (location admin)
    null,
    CURRENT_TIMESTAMP - INTERVAL '15 days'
),
(
    '880e8400-e29b-41d4-a716-446655440302',
    '770e8400-e29b-41d4-a716-446655440302', -- Carla Souza
    '660e8400-e29b-41d4-a716-446655440001', -- Pizzaria Bella Vista - Main
    true,
    '770e8400-e29b-41d4-a716-446655440101', -- Assigned by Paulo Oliveira (location admin)
    null,
    CURRENT_TIMESTAMP - INTERVAL '12 days'
),

-- KDS Operators
(
    '880e8400-e29b-41d4-a716-446655440401',
    '770e8400-e29b-41d4-a716-446655440401', -- Thiago Lima
    '660e8400-e29b-41d4-a716-446655440001', -- Pizzaria Bella Vista - Main
    true,
    '770e8400-e29b-41d4-a716-446655440101', -- Assigned by Paulo Oliveira (location admin)
    ARRAY['PIZZA_STATION', 'SALAD_STATION'],
    CURRENT_TIMESTAMP - INTERVAL '25 days'
),
(
    '880e8400-e29b-41d4-a716-446655440402',
    '770e8400-e29b-41d4-a716-446655440402', -- Fernanda Gomes
    '660e8400-e29b-41d4-a716-446655440001', -- Pizzaria Bella Vista - Main
    true,
    '770e8400-e29b-41d4-a716-446655440101', -- Assigned by Paulo Oliveira (location admin)
    ARRAY['PASTA_STATION', 'DESSERT_STATION'],
    CURRENT_TIMESTAMP - INTERVAL '22 days'
),

-- POS Operators
(
    '880e8400-e29b-41d4-a716-446655440501',
    '770e8400-e29b-41d4-a716-446655440501', -- Rodrigo Martins
    '660e8400-e29b-41d4-a716-446655440001', -- Pizzaria Bella Vista - Main
    true,
    '770e8400-e29b-41d4-a716-446655440101', -- Assigned by Paulo Oliveira (location admin)
    null,
    CURRENT_TIMESTAMP - INTERVAL '30 days'
),
(
    '880e8400-e29b-41d4-a716-446655440502',
    '770e8400-e29b-41d4-a716-446655440502', -- Amanda Silva
    '660e8400-e29b-41d4-a716-446655440001', -- Pizzaria Bella Vista - Main
    true,
    '770e8400-e29b-41d4-a716-446655440101', -- Assigned by Paulo Oliveira (location admin)
    null,
    CURRENT_TIMESTAMP - INTERVAL '28 days'
),

-- =============================================================================
-- Tacos El Mariachi (single location) - All non-admin users to centro location
-- =============================================================================

-- Location Administrators
(
    '880e8400-e29b-41d4-a716-446655440103',
    '770e8400-e29b-41d4-a716-446655440103', -- Miguel Garcia
    '660e8400-e29b-41d4-a716-446655440002', -- Tacos El Mariachi - Centro
    true,
    '770e8400-e29b-41d4-a716-446655440003', -- Assigned by Carlos Rodriguez (restaurant admin)
    null,
    CURRENT_TIMESTAMP - INTERVAL '38 days'
),
(
    '880e8400-e29b-41d4-a716-446655440104',
    '770e8400-e29b-41d4-a716-446655440104', -- Sofia Ruiz
    '660e8400-e29b-41d4-a716-446655440002', -- Tacos El Mariachi - Centro
    true,
    '770e8400-e29b-41d4-a716-446655440003', -- Assigned by Carlos Rodriguez (restaurant admin)
    null,
    CURRENT_TIMESTAMP - INTERVAL '35 days'
),

-- Waiters
(
    '880e8400-e29b-41d4-a716-446655440203',
    '770e8400-e29b-41d4-a716-446655440203', -- Diego Morales
    '660e8400-e29b-41d4-a716-446655440002', -- Tacos El Mariachi - Centro
    true,
    '770e8400-e29b-41d4-a716-446655440103', -- Assigned by Miguel Garcia (location admin)
    null,
    CURRENT_TIMESTAMP - INTERVAL '35 days'
),
(
    '880e8400-e29b-41d4-a716-446655440204',
    '770e8400-e29b-41d4-a716-446655440204', -- Isabella Hernandez
    '660e8400-e29b-41d4-a716-446655440002', -- Tacos El Mariachi - Centro
    true,
    '770e8400-e29b-41d4-a716-446655440103', -- Assigned by Miguel Garcia (location admin)
    null,
    CURRENT_TIMESTAMP - INTERVAL '32 days'
),

-- Food Runners
(
    '880e8400-e29b-41d4-a716-446655440303',
    '770e8400-e29b-41d4-a716-446655440303', -- Luis Valdez
    '660e8400-e29b-41d4-a716-446655440002', -- Tacos El Mariachi - Centro
    true,
    '770e8400-e29b-41d4-a716-446655440103', -- Assigned by Miguel Garcia (location admin)
    null,
    CURRENT_TIMESTAMP - INTERVAL '40 days'
),
(
    '880e8400-e29b-41d4-a716-446655440304',
    '770e8400-e29b-41d4-a716-446655440304', -- Carmen Lopez
    '660e8400-e29b-41d4-a716-446655440002', -- Tacos El Mariachi - Centro
    true,
    '770e8400-e29b-41d4-a716-446655440103', -- Assigned by Miguel Garcia (location admin)
    null,
    CURRENT_TIMESTAMP - INTERVAL '38 days'
),

-- KDS Operators
(
    '880e8400-e29b-41d4-a716-446655440403',
    '770e8400-e29b-41d4-a716-446655440403', -- Eduardo Ramirez
    '660e8400-e29b-41d4-a716-446655440002', -- Tacos El Mariachi - Centro
    true,
    '770e8400-e29b-41d4-a716-446655440103', -- Assigned by Miguel Garcia (location admin)
    ARRAY['GRILL_STATION', 'FRYER_STATION'],
    CURRENT_TIMESTAMP - INTERVAL '45 days'
),
(
    '880e8400-e29b-41d4-a716-446655440404',
    '770e8400-e29b-41d4-a716-446655440404', -- Gabriela Moreno
    '660e8400-e29b-41d4-a716-446655440002', -- Tacos El Mariachi - Centro
    true,
    '770e8400-e29b-41d4-a716-446655440103', -- Assigned by Miguel Garcia (location admin)
    ARRAY['PREP_STATION', 'ASSEMBLY_STATION'],
    CURRENT_TIMESTAMP - INTERVAL '42 days'
),

-- POS Operators
(
    '880e8400-e29b-41d4-a716-446655440503',
    '770e8400-e29b-41d4-a716-446655440503', -- Pedro Gutierrez
    '660e8400-e29b-41d4-a716-446655440002', -- Tacos El Mariachi - Centro
    true,
    '770e8400-e29b-41d4-a716-446655440103', -- Assigned by Miguel Garcia (location admin)
    null,
    CURRENT_TIMESTAMP - INTERVAL '50 days'
),
(
    '880e8400-e29b-41d4-a716-446655440504',
    '770e8400-e29b-41d4-a716-446655440504', -- Ana Vasquez
    '660e8400-e29b-41d4-a716-446655440002', -- Tacos El Mariachi - Centro
    true,
    '770e8400-e29b-41d4-a716-446655440103', -- Assigned by Miguel Garcia (location admin)
    null,
    CURRENT_TIMESTAMP - INTERVAL '48 days'
);

-- =============================================================================
-- SUMMARY OF ASSIGNMENTS (SINGLE LOCATIONS ONLY FOR NOW)
-- =============================================================================

/*
SINGLE LOCATIONS CREATED:
- Pizzaria Bella Vista: 10 users assigned to 1 location
- Tacos El Mariachi: 10 users assigned to 1 location

MULTI-LOCATION ASSIGNMENTS:
Multi-location assignments are more complex and would require separate entries
for each user-location combination. For now, focusing on single-location assignments.

TOTAL ASSIGNMENTS: 20 location assignments for single-location restaurants

BUSINESS LOGIC:
- Location administrators manage their assigned locations
- Operational staff work at specific locations
- KDS operators have station-specific assignments for kitchen workflow
- Assignment history provides audit trail for management decisions
*/
