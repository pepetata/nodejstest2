-- Migration: Create restaurant_media table
-- Created: 2025-07-15
-- Purpose: Store media files metadata with organized folder structure

CREATE TABLE restaurant_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    location_id UUID REFERENCES restaurant_locations(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('logo', 'favicon', 'images', 'videos')),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_restaurant_media_restaurant_id ON restaurant_media(restaurant_id);
CREATE INDEX idx_restaurant_media_location_id ON restaurant_media(location_id);
CREATE INDEX idx_restaurant_media_type ON restaurant_media(media_type);
CREATE INDEX idx_restaurant_media_active ON restaurant_media(is_active);

-- Create composite index for common queries
CREATE INDEX idx_restaurant_media_restaurant_type ON restaurant_media(restaurant_id, media_type);
CREATE INDEX idx_restaurant_media_location_type ON restaurant_media(location_id, media_type);

-- Add comments for documentation
COMMENT ON TABLE restaurant_media IS 'Stores metadata for all restaurant media files (logo, favicon, images, videos)';
COMMENT ON COLUMN restaurant_media.media_type IS 'Type of media: logo, favicon, images, videos';
COMMENT ON COLUMN restaurant_media.file_path IS 'Physical file path on server';
COMMENT ON COLUMN restaurant_media.file_url IS 'Public URL for accessing the file';
COMMENT ON COLUMN restaurant_media.location_id IS 'Required for images and videos, null for logo and favicon';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_restaurant_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_restaurant_media_updated_at
    BEFORE UPDATE ON restaurant_media
    FOR EACH ROW
    EXECUTE FUNCTION update_restaurant_media_updated_at();
