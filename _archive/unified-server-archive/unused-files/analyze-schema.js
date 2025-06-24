const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function analyzeSchema() {
  try {
    const client = await pool.connect();
    
    console.log('=== DATABASE SCHEMA ANALYSIS ===\n');
    
    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables found:', tablesResult.rows.length);
    tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));
    console.log();
    
    // Analyze each table structure
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      console.log(`🔍 Table: ${tableName}`);
      
      // Get column information
      const columnsResult = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);
      
      columnsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        console.log(`  ${col.column_name}: ${col.data_type}${maxLength} ${nullable}${defaultVal}`);
      });
      
      // Get foreign key constraints
      const fkResult = await client.query(`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = $1;
      `, [tableName]);
      
      if (fkResult.rows.length > 0) {
        console.log('  Foreign Keys:');
        fkResult.rows.forEach(fk => {
          console.log(`    ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      }
      
      // Get sample data count
      const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      console.log(`  📊 Records: ${countResult.rows[0].count}`);
      console.log();
    }
    
    // Check for enum types
    const enumResult = await client.query(`
      SELECT 
        t.typname as enum_name,
        e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder;
    `);
    
    if (enumResult.rows.length > 0) {
      console.log('🏷️  Enum Types:');
      const enums = {};
      enumResult.rows.forEach(row => {
        if (!enums[row.enum_name]) enums[row.enum_name] = [];
        enums[row.enum_name].push(row.enum_value);
      });
      
      Object.entries(enums).forEach(([name, values]) => {
        console.log(`  ${name}: [${values.join(', ')}]`);
      });
      console.log();
    }
    
    client.release();
    console.log('✅ Schema analysis complete!');
    
  } catch (error) {
    console.error('❌ Schema analysis failed:', error);
  } finally {
    pool.end();
  }
}

analyzeSchema();
