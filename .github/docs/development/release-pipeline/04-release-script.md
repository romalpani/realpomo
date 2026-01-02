# Phase 4: Release Script

## Overview
Create a secure, accurate release script that handles version bumping, tagging, and triggering GitHub Actions.

## Tasks

### 4.1 Create Release Script
- [ ] Create `scripts/release.js` or `scripts/release.sh`
- [ ] Script should:
  1. Check working directory is clean (no uncommitted changes)
  2. Run pre-release checks:
     - `npm run typecheck`
     - `npm run lint`
     - `npm run test:unit`
  3. Prompt for version bump type (patch/minor/major)
  4. Update `package.json` version
  5. Update `package-lock.json` version
  6. Create commit with version bump
  7. Create git tag (e.g., `v1.0.0`)
  8. Push commit and tag to GitHub
  9. GitHub Actions will automatically build and release

### 4.2 Script Safety Features
- [ ] Validate version format
- [ ] Check if tag already exists
- [ ] Require confirmation before pushing
- [ ] Rollback on failure
- [ ] Clear error messages

### 4.3 Add npm Scripts
- [ ] Add to `package.json`:
  ```json
  {
    "scripts": {
      "release": "node scripts/release.js",
      "version:patch": "npm version patch",
      "version:minor": "npm version minor",
      "version:major": "npm version major"
    }
  }
  ```

### 4.4 Alternative: Use Standard Version
- [ ] Consider using `standard-version` or `semantic-release` for automated versioning
- [ ] These tools handle CHANGELOG generation automatically
- [ ] More complex but more professional

## Script Example (Node.js)

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

// Check git status
// Bump version
// Create tag
// Push to GitHub
```

## Usage

```bash
npm run release
# Follow prompts for version type
# Script handles the rest
```

## Notes
- Script should be idempotent (safe to run multiple times)
- Should provide clear feedback at each step
- Consider dry-run mode for testing
- Can integrate with conventional commits for auto-versioning

