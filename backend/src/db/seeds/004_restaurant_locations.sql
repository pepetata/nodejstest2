-- Seed data for restaurant locations
-- Created: 2025-07-04

-- Insert restaurant locations
INSERT INTO restaurant_locations (
  restaurant_id, name, url_name, phone, whatsapp,
  address_zip_code, address_street, address_street_number,
  address_complement, address_city, address_state,
  operating_hours, selected_features, is_primary, status
) VALUES
-- Pizzaria Bella - Main Location
(
  1,
  'Pizzaria Bella - Matriz',
  'matriz',
  '11987654321',
  '11987654321',
  '01310-100',
  'Avenida Paulista',
  '1578',
  'Loja 2',
  'São Paulo',
  'SP',
  '{"monday": {"open": "18:00", "close": "23:00", "closed": false}, "tuesday": {"open": "18:00", "close": "23:00", "closed": false}, "wednesday": {"open": "18:00", "close": "23:00", "closed": false}, "thursday": {"open": "18:00", "close": "23:00", "closed": false}, "friday": {"open": "18:00", "close": "00:00", "closed": false}, "saturday": {"open": "18:00", "close": "00:00", "closed": false}, "sunday": {"open": "18:00", "close": "23:00", "closed": false}, "holidays": {"open": "19:00", "close": "22:00", "closed": false}}',
  ARRAY['digital_menu', 'online_ordering', 'delivery_tracking'],
  true,
  'active'
),
-- Burger House - Shopping Center Norte (Primary)
(
  2,
  'Burger House - Shopping Center Norte',
  'center-norte',
  '11876543210',
  '11876543210',
  '02071-000',
  'Travessa Casalbuono',
  '120',
  'Loja 245 - Piso L2',
  'São Paulo',
  'SP',
  '{"monday": {"open": "10:00", "close": "22:00", "closed": false}, "tuesday": {"open": "10:00", "close": "22:00", "closed": false}, "wednesday": {"open": "10:00", "close": "22:00", "closed": false}, "thursday": {"open": "10:00", "close": "22:00", "closed": false}, "friday": {"open": "10:00", "close": "23:00", "closed": false}, "saturday": {"open": "10:00", "close": "23:00", "closed": false}, "sunday": {"open": "12:00", "close": "22:00", "closed": false}, "holidays": {"open": "12:00", "close": "20:00", "closed": false}}',
  ARRAY['digital_menu', 'online_ordering', 'delivery_tracking', 'table_booking'],
  true,
  'active'
),
-- Burger House - Vila Madalena
(
  2,
  'Burger House - Vila Madalena',
  'vila-madalena',
  '11876543211',
  '11876543211',
  '05414-002',
  'Rua Aspicuelta',
  '332',
  '',
  'São Paulo',
  'SP',
  '{"monday": {"open": "17:00", "close": "01:00", "closed": false}, "tuesday": {"open": "17:00", "close": "01:00", "closed": false}, "wednesday": {"open": "17:00", "close": "01:00", "closed": false}, "thursday": {"open": "17:00", "close": "02:00", "closed": false}, "friday": {"open": "17:00", "close": "03:00", "closed": false}, "saturday": {"open": "12:00", "close": "03:00", "closed": false}, "sunday": {"open": "12:00", "close": "01:00", "closed": false}, "holidays": {"open": "17:00", "close": "23:00", "closed": false}}',
  ARRAY['digital_menu', 'online_ordering', 'live_music', 'happy_hour'],
  false,
  'active'
),
-- Burger House - Alphaville
(
  2,
  'Burger House - Alphaville',
  'alphaville',
  '11876543212',
  '11876543212',
  '06454-070',
  'Alameda Rio Negro',
  '111',
  'Loja 15',
  'Barueri',
  'SP',
  '{"monday": {"open": "11:00", "close": "23:00", "closed": false}, "tuesday": {"open": "11:00", "close": "23:00", "closed": false}, "wednesday": {"open": "11:00", "close": "23:00", "closed": false}, "thursday": {"open": "11:00", "close": "23:00", "closed": false}, "friday": {"open": "11:00", "close": "00:00", "closed": false}, "saturday": {"open": "11:00", "close": "00:00", "closed": false}, "sunday": {"open": "11:00", "close": "23:00", "closed": false}, "holidays": {"open": "12:00", "close": "22:00", "closed": false}}',
  ARRAY['digital_menu', 'online_ordering', 'delivery_tracking', 'drive_thru'],
  false,
  'active'
),
-- Sabor Tropical - Main Location
(
  3,
  'Sabor Tropical',
  'principal',
  '11765432109',
  '11765432109',
  '03310-000',
  'Rua da Mooca',
  '2560',
  '',
  'São Paulo',
  'SP',
  '{"monday": {"open": "11:00", "close": "15:00", "closed": false}, "tuesday": {"open": "11:00", "close": "15:00", "closed": false}, "wednesday": {"open": "11:00", "close": "15:00", "closed": false}, "thursday": {"open": "11:00", "close": "15:00", "closed": false}, "friday": {"open": "11:00", "close": "15:00", "closed": false}, "saturday": {"open": "11:00", "close": "16:00", "closed": false}, "sunday": {"open": "00:00", "close": "00:00", "closed": true}, "holidays": {"open": "00:00", "close": "00:00", "closed": true}}',
  ARRAY['digital_menu'],
  true,
  'active'
);
