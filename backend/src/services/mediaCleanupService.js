const MediaCleanupUtil = require('../utils/mediaCleanupUtil');
const { logger } = require('../utils/logger');

/**
 * Scheduled Media Cleanup Service
 * Runs periodic cleanup of orphaned and inactive media files
 */
class MediaCleanupService {
  constructor() {
    this.cleanupInterval = null;
    this.isRunning = false;
    this.logger = logger.child({ service: 'MediaCleanupService' });
  }

  /**
   * Start the scheduled cleanup service
   * @param {number} intervalHours - Cleanup interval in hours (default: 24)
   */
  start(intervalHours = 24) {
    if (this.isRunning) {
      this.logger.warn('Media cleanup service is already running');
      return;
    }

    const intervalMs = intervalHours * 60 * 60 * 1000; // Convert hours to milliseconds

    this.logger.info('Starting media cleanup service', {
      intervalHours,
      intervalMs,
      nextCleanup: new Date(Date.now() + intervalMs).toISOString(),
    });

    // Run initial cleanup after 1 minute
    setTimeout(() => {
      this.runCleanup();
    }, 60000);

    // Set up recurring cleanup
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, intervalMs);

    this.isRunning = true;
  }

  /**
   * Stop the scheduled cleanup service
   */
  stop() {
    if (!this.isRunning) {
      this.logger.warn('Media cleanup service is not running');
      return;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.isRunning = false;
    this.logger.info('Media cleanup service stopped');
  }

  /**
   * Run cleanup manually
   */
  async runCleanup() {
    if (process.env.NODE_ENV === 'production') {
      this.logger.info('Starting scheduled media cleanup');
    }

    try {
      const result = await MediaCleanupUtil.fullCleanup();

      this.logger.info('Scheduled media cleanup completed', {
        orphanedFilesDeleted: result.orphanedFilesDeleted,
        inactiveFilesDeleted: result.inactiveFilesDeleted,
        totalDeleted: result.totalDeleted,
      });

      return result;
    } catch (error) {
      this.logger.error('Scheduled media cleanup failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get cleanup service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextCleanup: this.cleanupInterval
        ? new Date(Date.now() + this.cleanupInterval._idleTimeout).toISOString()
        : null,
    };
  }
}

module.exports = new MediaCleanupService();
