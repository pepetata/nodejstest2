-- Seed data for payment info
-- Created: 2025-07-04

-- Insert payment info for restaurants (tokenized data for security)
INSERT INTO payment_info (
  id, restaurant_id, card_token, cardholder_name,
  last_four_digits, card_type, expiry_month, expiry_year, is_active
) VALUES
-- Pizzaria Bella - Payment Info
(
  '850e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440001',
  'tok_pizzaria_bella_001_secure',
  'João Silva',
  '4321',
  'Visa',
  12,
  2026,
  true
),
-- Burger House - Payment Info
(
  '850e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440002',
  'tok_burger_house_001_secure',
  'Maria Santos',
  '8765',
  'Mastercard',
  8,
  2027,
  true
),
-- Sabor Tropical - Payment Info (pending approval, inactive)
(
  '850e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440003',
  'tok_sabor_tropical_001_secure',
  'Carlos Oliveira',
  '1234',
  'Visa',
  5,
  2025,
  false
);
