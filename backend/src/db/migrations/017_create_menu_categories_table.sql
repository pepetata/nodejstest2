-- Migration: Create menu_categories table
-- Created: 2025-07-24
-- Purpose: Store menu categories with hierarchical structure

CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    parent_category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_id ON menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_parent_id ON menu_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_order ON menu_categories(restaurant_id, display_order);
CREATE INDEX IF NOT EXISTS idx_menu_categories_active ON menu_categories(is_active);

-- Add trigger for updated_at
CREATE TRIGGER trigger_menu_categories_updated_at
    BEFORE UPDATE ON menu_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
