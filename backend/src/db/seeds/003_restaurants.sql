-- Seed data for restaurants
-- Created: 2025-07-04

-- Clear existing restaurant data (in proper order due to foreign keys)
DELETE FROM payment_info;
DELETE FROM billing_addresses;
DELETE FROM restaurant_locations;
DELETE FROM restaurants;

-- Reset sequences
ALTER SEQUENCE restaurants_id_seq RESTART WITH 1;
ALTER SEQUENCE restaurant_locations_id_seq RESTART WITH 1;
ALTER SEQUENCE billing_addresses_id_seq RESTART WITH 1;
ALTER SEQUENCE payment_info_id_seq RESTART WITH 1;

-- Insert sample restaurants
INSERT INTO restaurants (
  owner_name, email, email_confirmed, email_confirmation_token,
  email_confirmation_expires, password, phone, whatsapp,
  restaurant_name, restaurant_url_name, business_type, cuisine_type,
  website, description, subscription_plan, marketing_consent,
  terms_accepted, terms_accepted_at, status
) VALUES
-- 1. Pizzaria Bella (single location, active)
(
  'João Silva',
  'joao@pizzariabella.com.br',
  true,
  null,
  null,
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/l5xW3G.', -- password: pizza123
  '11987654321',
  '11987654321',
  'Pizzaria Bella',
  'pizzaria-bella',
  'single',
  'Italiana',
  'https://pizzariabella.com.br',
  'A melhor pizzaria italiana da região, com massa artesanal e ingredientes frescos.',
  'premium',
  true,
  true,
  CURRENT_TIMESTAMP,
  'active'
),
-- 2. Burger House (multi-location, active)
(
  'Maria Santos',
  'maria@burgerhouse.com.br',
  true,
  null,
  null,
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/l5xW3G.', -- password: burger456
  '11876543210',
  '11876543210',
  'Burger House',
  'burger-house',
  'multi-location',
  'Americana',
  'https://burgerhouse.com.br',
  'Rede de hamburguerias artesanais com ingredientes selecionados e carnes premium.',
  'enterprise',
  true,
  true,
  CURRENT_TIMESTAMP,
  'active'
),
-- 3. Sabor Tropical (single location, pending)
(
  'Carlos Oliveira',
  'carlos@sabortropical.com.br',
  false,
  'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
  CURRENT_TIMESTAMP + INTERVAL '24 hours',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/l5xW3G.', -- password: tropical789
  '11765432109',
  '11765432109',
  'Sabor Tropical',
  'sabor-tropical',
  'single',
  'Brasileira',
  'https://sabortropical.com.br',
  'Restaurante especializado em culinária nordestina com pratos típicos e ambiente acolhedor.',
  'starter',
  false,
  true,
  CURRENT_TIMESTAMP,
  'pending'
);
