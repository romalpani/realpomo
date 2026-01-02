# Quick Start Guide

## Overview

This guide provides a high-level overview and quick reference for setting up the RealPomo release pipeline.

## Prerequisites Checklist

- [ ] GitHub account
- [ ] Apple Developer account ($99/year) - **Required for macOS DMG distribution**
- [ ] Node.js and npm installed
- [ ] Git configured locally
- [ ] Repository already exists on GitHub

## Implementation Order

### Step 1: Repository Setup (30 min)
1. Configure GitHub repository settings
2. Set up branch protection (optional)
3. Create initial release tag

**Files**: `01-github-repo-setup.md`

### Step 2: Electron Builder Config (2-4 hours)
1. Update `package.json` to build DMG instead of ZIP
2. Set up Apple Developer account (if not done)
3. Configure code signing secrets
4. Test local build

**Files**: `02-electron-builder-config.md`

**Critical**: You need Apple Developer account for macOS code signing. This is the longest step.

### Step 3: GitHub Actions (2-3 hours)
1. Create `.github/workflows/` directory
2. Copy example workflows from `EXAMPLES/`
3. Configure secrets in GitHub
4. Test workflow with a test tag

**Files**: `03-github-actions-pipeline.md`, `EXAMPLES/github-actions-*.yml`

### Step 4: Release Script (1-2 hours)
1. Create `scripts/` directory
2. Copy release script from `EXAMPLES/`
3. Add npm script to `package.json`
4. Test script locally (dry run)

**Files**: `04-release-script.md`, `EXAMPLES/release-script.js`

### Step 5: Website (2-3 hours)
1. Create `docs/` directory
2. Copy website files from `EXAMPLES/`
3. Update repository references
4. Enable GitHub Pages
5. Test auto-update mechanism

**Files**: `05-website-setup.md`, `WEBSITE_AUTO_UPDATE.md`, `EXAMPLES/website-*`

### Step 6: README Updates (30 min)
1. Add download section
2. Update links
3. Add badges (optional)

**Files**: `06-readme-updates.md`

### Step 7: Polish (Ongoing)
1. Create CHANGELOG.md
2. Set up Dependabot
3. Add security policy
4. Review additional recommendations

**Files**: `07-additional-recommendations.md`

## Quick Command Reference

```bash
# Build locally
npm run build

# Run release script
npm run release

# Test website locally
cd docs && python3 -m http.server 8000
# Then visit http://localhost:8000

# Create a test release tag (for testing GitHub Actions)
git tag v0.0.2-test
git push origin v0.0.2-test
# Delete test tag: git tag -d v0.0.2-test && git push origin --delete v0.0.2-test
```

## GitHub Secrets Setup

Go to: Repository → Settings → Secrets and variables → Actions → New repository secret

Required secrets:
- `APPLE_ID` - Your Apple ID email
- `APPLE_ID_PASS` - App-specific password (not your regular password!)
- `APPLE_TEAM_ID` - Your Team ID from Apple Developer
- `CSC_LINK` - Base64 encoded certificate (if needed)
- `CSC_KEY_PASSWORD` - Certificate password (if needed)

**Note**: `GITHUB_TOKEN` is automatically provided by GitHub Actions.

## Website Auto-Update Flow

1. User visits website
2. JavaScript fetches latest release from GitHub API
3. Finds DMG asset for user's platform
4. Updates download button link
5. User clicks download → Gets latest DMG

See `WEBSITE_AUTO_UPDATE.md` for detailed explanation.

## Release Flow

```
Developer runs: npm run release
    ↓
Script bumps version in package.json
    ↓
Creates git commit and tag (v1.0.0)
    ↓
Pushes to GitHub
    ↓
GitHub Actions detects tag
    ↓
Builds macOS DMG and Windows installer
    ↓
Code signs and notarizes macOS build
    ↓
Creates GitHub Release
    ↓
Uploads artifacts
    ↓
Website auto-updates to show latest release
```

## Troubleshooting

### Build fails in GitHub Actions
- Check secrets are configured correctly
- Verify Apple Developer credentials
- Check build logs for specific errors

### Website doesn't update
- Check browser console for errors
- Verify GitHub API rate limits (60/hour unauthenticated)
- Check repository name matches in `website-app.js`

### Code signing fails
- Verify Apple Developer account is active
- Check certificate is installed in keychain
- Verify Team ID matches

### Release script fails
- Ensure working directory is clean
- Check all tests pass locally
- Verify git is configured correctly

## Next Steps After Setup

1. **First Release**: Create v0.1.0 or v1.0.0 release
2. **Monitor**: Watch GitHub Actions for any issues
3. **Test**: Download DMG from website and test installation
4. **Iterate**: Improve based on feedback

## Support Resources

- [Electron Builder Docs](https://www.electron.build/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [GitHub Releases API](https://docs.github.com/en/rest/releases/releases)
- [Apple Code Signing Guide](https://developer.apple.com/documentation/security/code_signing_services)

## Estimated Total Time

- **Initial Setup**: 8-13 hours
- **First Release**: 1-2 hours (mostly waiting for builds)
- **Subsequent Releases**: 5-10 minutes (automated)

## Cost Breakdown

- **GitHub Actions**: Free (public repos) or 2,000 min/month (private repos)
- **GitHub Pages**: Free
- **Apple Developer**: $99/year (required)
- **Windows Code Signing**: ~$200/year (optional)
- **Custom Domain**: ~$10-15/year (optional)

**Total Minimum**: $99/year (Apple Developer account)

