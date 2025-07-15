const BaseModel = require('./BaseModel');

/**
 * RestaurantMedia Model
 * Handles all restaurant media-related database operations
 */
class RestaurantMedia extends BaseModel {
  constructor() {
    super();
    this.tableName = 'restaurant_media';
  }

  /**
   * Create a new media record
   * @param {Object} mediaData - Media data
   * @returns {Promise<Object>} Created media record
   */
  async create(mediaData) {
    const logger = this.logger.child({ method: 'create' });

    try {
      logger.debug('Creating media record', {
        restaurantId: mediaData.restaurant_id,
        mediaType: mediaData.media_type,
        filename: mediaData.filename,
      });

      const query = `
        INSERT INTO ${this.tableName} (
          restaurant_id, location_id, media_type, filename, original_filename,
          file_path, file_url, file_size, mime_type, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        mediaData.restaurant_id,
        mediaData.location_id || null,
        mediaData.media_type,
        mediaData.filename,
        mediaData.original_filename,
        mediaData.file_path,
        mediaData.file_url,
        mediaData.file_size,
        mediaData.mime_type,
        mediaData.uploaded_by,
      ];

      const result = await this.executeQuery(query, values);

      logger.debug('Media record created successfully', {
        mediaId: result.rows[0].id,
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating media record', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get media by restaurant ID and type
   * @param {string} restaurantId - Restaurant ID
   * @param {string} mediaType - Media type (logo, favicon, images, videos)
   * @param {string} locationId - Location ID (for images/videos)
   * @returns {Promise<Array>} Media records
   */
  async getByRestaurantAndType(restaurantId, mediaType, locationId = null) {
    const logger = this.logger.child({ method: 'getByRestaurantAndType' });

    try {
      logger.debug('Getting media by restaurant and type', {
        restaurantId,
        mediaType,
        locationId,
      });

      let query = `
        SELECT * FROM ${this.tableName}
        WHERE restaurant_id = $1 AND media_type = $2 AND is_active = true
      `;
      let values = [restaurantId, mediaType];

      if (locationId) {
        query += ' AND location_id = $3';
        values.push(locationId);
      } else if (mediaType === 'images' || mediaType === 'videos') {
        // For images/videos without location, return empty array
        return [];
      } else {
        query += ' AND location_id IS NULL';
      }

      query += ' ORDER BY created_at DESC';

      const result = await this.executeQuery(query, values);

      logger.debug('Media records retrieved successfully', {
        count: result.rows.length,
      });

      return result.rows;
    } catch (error) {
      logger.error('Error getting media by restaurant and type', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get all media for a restaurant
   * @param {string} restaurantId - Restaurant ID
   * @returns {Promise<Object>} Organized media by type
   */
  async getAllByRestaurant(restaurantId) {
    const logger = this.logger.child({ method: 'getAllByRestaurant' });

    try {
      logger.debug('Getting all media for restaurant', { restaurantId });

      const query = `
        SELECT * FROM ${this.tableName}
        WHERE restaurant_id = $1 AND is_active = true
        ORDER BY media_type, created_at DESC
      `;

      const result = await this.executeQuery(query, [restaurantId]);

      // Organize media by type
      const media = {
        logo: null,
        favicon: null,
        images: [],
        videos: [],
      };

      result.rows.forEach((row) => {
        if (row.media_type === 'logo' || row.media_type === 'favicon') {
          media[row.media_type] = row;
        } else {
          media[row.media_type].push(row);
        }
      });

      logger.debug('All media retrieved successfully', {
        logoCount: media.logo ? 1 : 0,
        faviconCount: media.favicon ? 1 : 0,
        imagesCount: media.images.length,
        videosCount: media.videos.length,
      });

      return media;
    } catch (error) {
      logger.error('Error getting all media for restaurant', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete media record
   * @param {string} mediaId - Media ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(mediaId) {
    const logger = this.logger.child({ method: 'delete' });

    try {
      logger.debug('Deleting media record', { mediaId });

      const query = `
        UPDATE ${this.tableName}
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await this.executeQuery(query, [mediaId]);

      if (result.rows.length === 0) {
        logger.warn('Media record not found for deletion', { mediaId });
        return false;
      }

      logger.debug('Media record deleted successfully', { mediaId });
      return true;
    } catch (error) {
      logger.error('Error deleting media record', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get media by ID
   * @param {string} mediaId - Media ID
   * @returns {Promise<Object|null>} Media record
   */
  async getById(mediaId) {
    const logger = this.logger.child({ method: 'getById' });

    try {
      logger.debug('Getting media by ID', { mediaId });

      const query = `
        SELECT * FROM ${this.tableName}
        WHERE id = $1 AND is_active = true
      `;

      const result = await this.executeQuery(query, [mediaId]);

      if (result.rows.length === 0) {
        logger.debug('Media record not found', { mediaId });
        return null;
      }

      logger.debug('Media record retrieved successfully', { mediaId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting media by ID', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Update media record
   * @param {string} mediaId - Media ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated media record
   */
  async update(mediaId, updateData) {
    const logger = this.logger.child({ method: 'update' });

    try {
      logger.debug('Updating media record', { mediaId });

      const allowedFields = [
        'filename',
        'original_filename',
        'file_path',
        'file_url',
        'file_size',
        'mime_type',
      ];
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(updateData[key]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(mediaId);
      const query = `
        UPDATE ${this.tableName}
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.executeQuery(query, values);

      if (result.rows.length === 0) {
        throw new Error('Media record not found');
      }

      logger.debug('Media record updated successfully', { mediaId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating media record', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

module.exports = new RestaurantMedia();
