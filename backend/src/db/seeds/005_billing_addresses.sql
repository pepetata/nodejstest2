-- Seed data for billing addresses
-- Created: 2025-07-04

-- Insert billing addresses for restaurants
INSERT INTO billing_addresses (
  id, restaurant_id, zip_code, street, street_number,
  complement, city, state, same_as_restaurant
) VALUES
-- Pizzaria Bella - Billing Address
(
  '750e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440001',
  '01310-100',
  'Avenida Paulista',
  '1578',
  'Conjunto 123',
  'São Paulo',
  'SP',
  false
),
-- Burger House - Billing Address
(
  '750e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440002',
  '02071-000',
  'Travessa Casalbuono',
  '120',
  'Escritório Central',
  'São Paulo',
  'SP',
  false
),
-- Sabor Tropical - Billing Address
(
  '750e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440003',
  '03310-000',
  'Rua da Mooca',
  '2560',
  '',
  'São Paulo',
  'SP',
  true
);
