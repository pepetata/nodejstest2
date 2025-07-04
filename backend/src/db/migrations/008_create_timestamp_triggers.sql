-- Create function and triggers for automatic updated_at timestamps
-- Created: 2025-07-04

-- Create or replace the function that updates the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for each table that has an updated_at column

-- Restaurants table trigger
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON restaurants;
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Restaurant locations table trigger
DROP TRIGGER IF EXISTS update_restaurant_locations_updated_at ON restaurant_locations;
CREATE TRIGGER update_restaurant_locations_updated_at
  BEFORE UPDATE ON restaurant_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Billing addresses table trigger
DROP TRIGGER IF EXISTS update_billing_addresses_updated_at ON billing_addresses;
CREATE TRIGGER update_billing_addresses_updated_at
  BEFORE UPDATE ON billing_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Payment info table trigger
DROP TRIGGER IF EXISTS update_payment_info_updated_at ON payment_info;
CREATE TRIGGER update_payment_info_updated_at
  BEFORE UPDATE ON payment_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
