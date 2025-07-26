-- Migration: Remove display_order from menu_items table
-- The ordering should be per-category in the menu_item_categories junction table

-- Remove display_order column from menu_items table
ALTER TABLE menu_items DROP COLUMN IF EXISTS display_order;

-- Remove the old index that included display_order
DROP INDEX IF EXISTS idx_menu_items_order;

-- Add index for better performance on category-specific ordering
CREATE INDEX IF NOT EXISTS idx_menu_item_categories_order ON menu_item_categories(category_id, display_order);
