const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:2025@localhost:5432/qrmenu'
});

async function checkTables() {
  try {
    const client = await pool.connect();
    
    console.log('Checking database tables...');
    
    // List all tables in the public schema
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Tables found:', tablesResult.rows.length);
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // If no tables found, we need to run migrations
    if (tablesResult.rows.length === 0) {
      console.log('No tables found. Database needs to be initialized.');
    }
    
    client.release();
  } catch (err) {
    console.error('Error checking tables:', err);
  } finally {
    pool.end();
  }
}

checkTables(); 