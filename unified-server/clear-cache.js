const { cacheFlush } = require('./dist/config/redis');

async function clearCache() {
  try {
    console.log('Clearing Redis cache...');
    await cacheFlush();
    console.log('Cache cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing cache:', error);
    process.exit(1);
  }
}

clearCache();
