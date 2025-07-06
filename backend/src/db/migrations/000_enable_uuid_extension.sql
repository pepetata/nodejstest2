-- Migration: Enable UUID extension
-- Created: 2025-07-06
-- Purpose: Enable uuid-ossp extension for UUID generation

-- Enable UUID extension (required for uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify extension is loaded
SELECT 'UUID extension enabled successfully' AS status;
