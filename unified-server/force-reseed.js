const { databaseStorage } = require('./dist/services/database.service');
const { cacheFlush } = require('./dist/config/redis');

async function forceReseed() {
  try {
    console.log('Clearing cache...');
    await cacheFlush();
    
    console.log('Force reseeding database...');
    await databaseStorage.resetAndSeedDatabase();
    
    console.log('Clearing cache again...');
    await cacheFlush();
    
    console.log('Database force reseeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error force reseeding database:', error);
    process.exit(1);
  }
}

forceReseed();
