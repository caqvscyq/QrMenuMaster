#!/usr/bin/env node

/**
 * Admin UI Switcher Script
 * 
 * This script helps you switch between different admin UI versions:
 * - old: The powerful Admin_databoard UI (currently active)
 * - new: The current admin-client build
 * - backup: The previous admin UI that was replaced
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const adminDir = path.join(publicDir, 'admin');
const adminNewDir = path.join(publicDir, 'admin-new');
const adminBackupDir = path.join(publicDir, 'admin-backup');
const adminOldDir = path.join(publicDir, 'admin-old');

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`Source directory does not exist: ${src}`);
    return false;
  }
  
  // Remove destination if it exists
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  
  // Copy source to destination
  fs.cpSync(src, dest, { recursive: true });
  return true;
}

function getCurrentVersion() {
  const indexPath = path.join(adminDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return 'none';
  }
  
  const content = fs.readFileSync(indexPath, 'utf8');
  
  // Check for old admin UI (Admin_databoard)
  if (content.includes('index-CUBM0RXN.js')) {
    return 'old (Admin_databoard - powerful UI)';
  }
  
  // Check for new admin UI (admin-client)
  if (content.includes('index-DLUjdBZR.js') || content.includes('index-BTvdLh9y.css')) {
    return 'new (admin-client)';
  }
  
  return 'unknown';
}

function switchToOld() {
  console.log('Switching to old powerful Admin_databoard UI...');
  
  // Backup current admin if it's not already the old version
  const current = getCurrentVersion();
  if (!current.includes('old')) {
    if (!fs.existsSync(adminOldDir)) {
      copyDirectory(adminDir, adminOldDir);
      console.log('Current admin UI backed up to admin-old/');
    }
  }
  
  // Copy from _archive/Admin_databoard/dist/public
  const archiveAdminPath = path.join(__dirname, '..', '_archive', 'Admin_databoard', 'dist', 'public');
  if (copyDirectory(archiveAdminPath, adminDir)) {
    console.log('✅ Successfully switched to old powerful Admin_databoard UI');
    console.log('🌐 Access at: http://localhost:5000/admin');
  } else {
    console.error('❌ Failed to switch to old UI');
  }
}

function switchToNew() {
  console.log('Switching to new admin-client UI...');
  
  if (!fs.existsSync(adminNewDir)) {
    console.error('❌ New admin UI not found. Run "npm run build" in admin-client first.');
    return;
  }
  
  // Backup current admin
  if (!fs.existsSync(adminOldDir)) {
    copyDirectory(adminDir, adminOldDir);
    console.log('Current admin UI backed up to admin-old/');
  }
  
  if (copyDirectory(adminNewDir, adminDir)) {
    console.log('✅ Successfully switched to new admin-client UI');
    console.log('🌐 Access at: http://localhost:5000/admin');
  } else {
    console.error('❌ Failed to switch to new UI');
  }
}

function showStatus() {
  console.log('\n📊 Admin UI Status:');
  console.log('==================');
  console.log(`Current active UI: ${getCurrentVersion()}`);
  console.log(`Old UI available: ${fs.existsSync(adminOldDir) ? '✅' : '❌'}`);
  console.log(`New UI available: ${fs.existsSync(adminNewDir) ? '✅' : '❌'}`);
  console.log(`Backup available: ${fs.existsSync(adminBackupDir) ? '✅' : '❌'}`);
  console.log('\n🌐 Admin URL: http://localhost:5000/admin');
}

// Main script logic
const command = process.argv[2];

switch (command) {
  case 'old':
    switchToOld();
    break;
  case 'new':
    switchToNew();
    break;
  case 'status':
    showStatus();
    break;
  default:
    console.log('Admin UI Switcher');
    console.log('================');
    console.log('Usage: node switch-admin-ui.js [command]');
    console.log('');
    console.log('Commands:');
    console.log('  old     - Switch to old powerful Admin_databoard UI');
    console.log('  new     - Switch to new admin-client UI');
    console.log('  status  - Show current UI status');
    console.log('');
    showStatus();
}
