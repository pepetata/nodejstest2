require('dotenv').config();
const MediaCleanupUtil = require('../src/utils/mediaCleanupUtil');

/**
 * Media Cleanup Script
 * Run this script to clean up orphaned and inactive media files
 */
async function runCleanup() {
  try {
    console.log('🚀 Starting media cleanup process...');

    const result = await MediaCleanupUtil.fullCleanup();

    console.log('📊 Cleanup Summary:');
    console.log(`   Orphaned files deleted: ${result.orphanedFilesDeleted}`);
    console.log(`   Inactive files deleted: ${result.inactiveFilesDeleted}`);
    console.log(`   Total files deleted: ${result.totalDeleted}`);

    if (result.totalDeleted > 0) {
      console.log('✅ Media cleanup completed successfully!');
    } else {
      console.log('✅ No files needed cleanup - system is clean!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Media cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup if script is called directly
if (require.main === module) {
  runCleanup();
}

module.exports = { runCleanup };
