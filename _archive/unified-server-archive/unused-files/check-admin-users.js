const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkAdminUsers() {
  try {
    const result = await pool.query('SELECT id, username, role FROM users WHERE role = $1', ['admin']);
    console.log('Admin users found:', result.rows.length);
    result.rows.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
    });
    
    // Also check all users
    const allUsers = await pool.query('SELECT id, username, role FROM users');
    console.log('\nAll users:');
    allUsers.rows.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

checkAdminUsers();
