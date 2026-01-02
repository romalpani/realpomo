#!/usr/bin/env node

/**
 * Release script for RealPomo
 * 
 * This script handles:
 * 1. Pre-release checks (clean working directory, tests)
 * 2. Version bumping
 * 3. Git tagging
 * 4. Pushing to GitHub
 * 
 * Usage: npm run release
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function exec(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: 'inherit',
      ...options 
    });
  } catch (error) {
    console.error(`Error executing: ${command}`);
    process.exit(1);
  }
}

function checkWorkingDirectory() {
  console.log('Checking working directory...');
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    console.error('❌ Working directory is not clean. Please commit or stash changes.');
    process.exit(1);
  }
  console.log('✅ Working directory is clean');
}

function runPreReleaseChecks() {
  console.log('\nRunning pre-release checks...');
  
  console.log('Running type check...');
  exec('npm run typecheck');
  
  console.log('Running linter...');
  exec('npm run lint');
  
  console.log('Running unit tests...');
  exec('npm run test:unit');
  
  console.log('✅ All pre-release checks passed');
}

async function getVersionBumpType() {
  console.log('\nVersion bump options:');
  console.log('1. patch - 0.0.1 → 0.0.2 (bug fixes)');
  console.log('2. minor - 0.0.1 → 0.1.0 (new features)');
  console.log('3. major - 0.0.1 → 1.0.0 (breaking changes)');
  
  const answer = await question('\nSelect version bump type (1/2/3): ');
  
  const typeMap = {
    '1': 'patch',
    '2': 'minor',
    '3': 'major'
  };
  
  const type = typeMap[answer.trim()];
  if (!type) {
    console.error('Invalid selection. Please choose 1, 2, or 3.');
    process.exit(1);
  }
  
  return type;
}

function getCurrentVersion() {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
  );
  return packageJson.version;
}

function bumpVersion(type) {
  console.log(`\nBumping version (${type})...`);
  exec(`npm version ${type} --no-git-tag-version`);
  
  const newVersion = getCurrentVersion();
  console.log(`✅ Version bumped to ${newVersion}`);
  return newVersion;
}

async function confirmRelease(version) {
  console.log(`\nReady to create release v${version}`);
  const answer = await question('Continue? (yes/no): ');
  
  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('Release cancelled.');
    process.exit(0);
  }
}

function createReleaseCommit(version) {
  console.log('\nCreating release commit...');
  exec(`git add package.json package-lock.json`);
  exec(`git commit -m "chore: bump version to ${version}"`);
  console.log('✅ Release commit created');
}

function createTag(version) {
  console.log('\nCreating git tag...');
  const tag = `v${version}`;
  
  // Check if tag already exists
  try {
    execSync(`git rev-parse -q --verify "refs/tags/${tag}"`, { stdio: 'ignore' });
    console.error(`❌ Tag ${tag} already exists`);
    process.exit(1);
  } catch (e) {
    // Tag doesn't exist, which is good
  }
  
  exec(`git tag -a ${tag} -m "Release ${tag}"`);
  console.log(`✅ Tag ${tag} created`);
}

function pushToGitHub(version) {
  console.log('\nPushing to GitHub...');
  exec('git push origin HEAD');
  exec(`git push origin v${version}`);
  console.log('✅ Pushed to GitHub');
  console.log('\n🚀 GitHub Actions will now build and release automatically!');
}

async function main() {
  console.log('🚀 RealPomo Release Script\n');
  
  const currentVersion = getCurrentVersion();
  console.log(`Current version: ${currentVersion}\n`);
  
  checkWorkingDirectory();
  runPreReleaseChecks();
  
  const bumpType = await getVersionBumpType();
  const newVersion = bumpVersion(bumpType);
  
  await confirmRelease(newVersion);
  
  createReleaseCommit(newVersion);
  createTag(newVersion);
  pushToGitHub(newVersion);
  
  console.log('\n✅ Release process complete!');
  rl.close();
}

main().catch(error => {
  console.error('❌ Release failed:', error);
  process.exit(1);
});

