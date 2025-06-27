const { databaseStorage } = require('./dist/services/database.service');

async function resetDatabase() {
  try {
    console.log('Resetting and reseeding database...');
    await databaseStorage.resetAndSeedDatabase();
    console.log('Database reset and seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
