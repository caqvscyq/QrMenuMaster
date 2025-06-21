#!/usr/bin/env node

/**
 * Database Management Utility
 * 
 * This script provides various database management operations:
 * - init: Initialize database schema only
 * - seed: Smart seed (only if database is empty)
 * - force-seed: Force complete reseed (destructive)
 * - reset: Complete database reset and reseed
 * - status: Check database initialization status
 */

const { spawn } = require('child_process');
const path = require('path');

const commands = {
  init: {
    description: 'Initialize database schema without seeding data',
    script: 'npm run db:init'
  },
  seed: {
    description: 'Smart seed - only seed if database is empty',
    script: 'npm run seed'
  },
  'force-seed': {
    description: 'Force complete reseed (DESTRUCTIVE - clears all data)',
    script: 'npm run seed:force'
  },
  reset: {
    description: 'Complete database reset and reseed (DESTRUCTIVE)',
    script: 'npm run db:reset'
  },
  status: {
    description: 'Check database initialization status',
    script: 'ts-node -e "import(\'./src/db/seed\').then(async m => { const isDatabaseInitialized = async () => { try { const { db } = await import(\'./src/config/database\'); const { sql } = await import(\'drizzle-orm\'); const result = await db.execute(sql`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = \'shops\' AND table_schema = \'public\'`); return result.rows[0].count !== \'0\'; } catch { return false; } }; const initialized = await isDatabaseInitialized(); console.log(initialized ? \'✅ Database is initialized\' : \'❌ Database is not initialized\'); process.exit(0); })"'
  }
};

function showHelp() {
  console.log('🗄️  Database Management Utility\n');
  console.log('Usage: node db-manager.js <command>\n');
  console.log('Available commands:');
  
  Object.entries(commands).forEach(([cmd, info]) => {
    console.log(`  ${cmd.padEnd(12)} - ${info.description}`);
  });
  
  console.log('\nExamples:');
  console.log('  node db-manager.js status      # Check if database is initialized');
  console.log('  node db-manager.js seed        # Smart seed (preserves existing data)');
  console.log('  node db-manager.js force-seed  # Force reseed (clears all data)');
  console.log('  node db-manager.js reset       # Complete reset and reseed');
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Running: ${command}`);
    
    const child = spawn(command, [], {
      shell: true,
      stdio: 'inherit',
      cwd: __dirname
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }
  
  if (!commands[command]) {
    console.error(`❌ Unknown command: ${command}`);
    console.error('Run "node db-manager.js help" to see available commands.');
    process.exit(1);
  }
  
  try {
    if (command === 'force-seed' || command === 'reset') {
      console.log('⚠️  WARNING: This operation will DELETE ALL existing data!');
      console.log('   - All orders will be lost');
      console.log('   - All sessions will be invalidated');
      console.log('   - All user data will be cleared');
      console.log('');
      
      // In a real interactive environment, you might want to add a confirmation prompt
      // For now, we'll just show the warning
      console.log('Proceeding with destructive operation...');
    }
    
    await runCommand(commands[command].script);
    console.log(`✅ Command "${command}" completed successfully!`);
    
  } catch (error) {
    console.error(`❌ Command "${command}" failed:`, error.message);
    process.exit(1);
  }
}

main().catch(console.error);
