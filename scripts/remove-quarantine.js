#!/usr/bin/env node

/**
 * Post-build script to remove quarantine attributes from DMG files
 * 
 * This script runs after electron-builder creates DMG files.
 * It removes quarantine attributes to make the DMG easier to open.
 * 
 * Note: When users download the DMG from the internet, macOS will
 * add quarantine back, but the app bundle inside will be cleaner.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const releaseDir = path.join(__dirname, '..', 'release');

function removeQuarantineFromDMG(dmgPath) {
  try {
    console.log(`🔓 Removing quarantine from ${path.basename(dmgPath)}...`);
    execSync(`xattr -d com.apple.quarantine "${dmgPath}" 2>/dev/null || true`, { stdio: 'inherit' });
    console.log(`✅ Removed quarantine from ${path.basename(dmgPath)}`);
  } catch (error) {
    console.warn(`⚠️  Warning: Could not remove quarantine from ${dmgPath}: ${error.message}`);
  }
}

function main() {
  // Only run on macOS
  if (process.platform !== 'darwin') {
    console.log('ℹ️  Skipping quarantine removal (not on macOS)');
    return;
  }

  if (!fs.existsSync(releaseDir)) {
    console.log(`ℹ️  Release directory not found at ${releaseDir}, skipping`);
    return;
  }

  // Find all DMG files in the release directory
  const files = fs.readdirSync(releaseDir);
  const dmgFiles = files.filter(file => file.endsWith('.dmg'));

  if (dmgFiles.length === 0) {
    console.log('ℹ️  No DMG files found in release directory');
    return;
  }

  console.log(`\n🔓 Removing quarantine attributes from ${dmgFiles.length} DMG file(s)...\n`);

  dmgFiles.forEach(file => {
    const dmgPath = path.join(releaseDir, file);
    removeQuarantineFromDMG(dmgPath);
  });

  console.log('\n✅ Quarantine removal complete');
}

main();

