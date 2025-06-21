// Script to list all desks
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function listDesks() {
  console.log('Fetching all desks...');
  try {
    const res = await pool.query('SELECT id, number, name, area, is_occupied FROM desks ORDER BY number');
    console.log('--- Desks ---');
    res.rows.forEach(desk => {
      console.log(`ID: ${desk.id}, Number: ${desk.number}, Name: ${desk.name}, Area: ${desk.area}, Occupied: ${desk.is_occupied}`);
    });
    console.log('-------------');
  } catch (err) {
    console.error('Error fetching desks', err);
  } finally {
    await pool.end();
  }
}

listDesks(); 