#!/usr/bin/env node

/**
 * Electron Builder afterPack hook
 * Removes quarantine attributes from the macOS app bundle to prevent
 * Gatekeeper warnings for unsigned apps.
 * 
 * This runs automatically after electron-builder packages the app
 * but before it creates the DMG.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = async function afterPack(context) {
  // Only run on macOS builds
  if (context.electronPlatformName !== 'darwin') {
    return;
  }

  const appPath = context.appOutDir;
  const appName = context.packager.appInfo.productFilename;
  const appBundlePath = path.join(appPath, `${appName}.app`);

  // Check if the app bundle exists
  if (!fs.existsSync(appBundlePath)) {
    console.log(`⚠️  App bundle not found at ${appBundlePath}, skipping quarantine removal`);
    return;
  }

  try {
    console.log(`🔓 Removing quarantine attribute from ${appBundlePath}...`);
    
    // Remove quarantine attribute recursively from the entire app bundle
    // This prevents Gatekeeper warnings when users download and run the app
    execSync(`xattr -cr "${appBundlePath}"`, { stdio: 'inherit' });
    
    console.log(`✅ Successfully removed quarantine attribute from app bundle`);
  } catch (error) {
    // Don't fail the build if this fails - it's a nice-to-have feature
    console.warn(`⚠️  Warning: Failed to remove quarantine attribute: ${error.message}`);
    console.warn(`   The app will still work, but users may see a security warning.`);
  }
};

