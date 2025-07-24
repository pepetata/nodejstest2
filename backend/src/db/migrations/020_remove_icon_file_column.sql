-- Migration: Remove icon_file column from languages table
-- Created: 2025-07-24
-- Purpose: Remove deprecated icon_file column - now using flag_file exclusively

-- Drop the icon_file column
ALTER TABLE languages DROP COLUMN IF EXISTS icon_file;
