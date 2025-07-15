const fs = require('fs').promises;
const path = require('path');
const db = require('../config/db');

/**
 * Media Cleanup Utility
 * Handles cleanup of orphaned media files and database records
 */
class MediaCleanupUtil {
  /**
   * Remove orphaned files that exist in file system but not in database
   */
  static async removeOrphanedFiles() {
    try {
      console.log('🧹 Starting orphaned file cleanup...');

      const publicDir = path.join(__dirname, '../../public');
      const mediaTypes = ['logo', 'favicons', 'restaurant_images', 'restaurant_videos'];

      let deletedCount = 0;

      for (const mediaType of mediaTypes) {
        const mediaDir = path.join(publicDir, mediaType);

        try {
          await this.cleanupDirectoryRecursive(mediaDir, deletedCount);
        } catch (error) {
          console.warn(`Directory ${mediaType} not found or error:`, error.message);
        }
      }

      console.log(`✅ Orphaned file cleanup completed. Deleted ${deletedCount} files.`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error during orphaned file cleanup:', error);
      throw error;
    }
  }

  /**
   * Recursively clean up directory
   */
  static async cleanupDirectoryRecursive(dir, deletedCount) {
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        await this.cleanupDirectoryRecursive(fullPath, deletedCount);
      } else if (item.isFile()) {
        // Check if file exists in database
        const relativePath = path.relative(path.join(__dirname, '../../public'), fullPath);
        const normalizedPath = relativePath.replace(/\\/g, '/');

        const result = await db.query('SELECT id FROM restaurant_media WHERE file_path = $1', [
          normalizedPath,
        ]);

        if (result.rows.length === 0) {
          // File exists but no database record - it's orphaned
          console.log(`🗑️  Deleting orphaned file: ${normalizedPath}`);
          await fs.unlink(fullPath);
          deletedCount++;
        }
      }
    }
  }

  /**
   * Remove inactive media files that should have been deleted
   */
  static async removeInactiveFiles() {
    try {
      console.log('🧹 Starting inactive file cleanup...');

      const result = await db.query(
        'SELECT file_path FROM restaurant_media WHERE is_active = false'
      );

      const publicDir = path.join(__dirname, '../../public');
      let deletedCount = 0;

      for (const record of result.rows) {
        const filePath = path.join(publicDir, record.file_path);

        try {
          await fs.unlink(filePath);
          console.log(`🗑️  Deleted inactive file: ${record.file_path}`);
          deletedCount++;
        } catch (error) {
          if (error.code !== 'ENOENT') {
            console.warn(`Failed to delete ${record.file_path}:`, error.message);
          }
        }
      }

      console.log(`✅ Inactive file cleanup completed. Deleted ${deletedCount} files.`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error during inactive file cleanup:', error);
      throw error;
    }
  }

  /**
   * Full cleanup - remove both orphaned and inactive files
   */
  static async fullCleanup() {
    const orphanedCount = await this.removeOrphanedFiles();
    const inactiveCount = await this.removeInactiveFiles();

    return {
      orphanedFilesDeleted: orphanedCount,
      inactiveFilesDeleted: inactiveCount,
      totalDeleted: orphanedCount + inactiveCount,
    };
  }
}

module.exports = MediaCleanupUtil;
