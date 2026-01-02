# Next Steps - Ready to Release! 🚀

## Current Status

✅ Icon created and configured
✅ Website updated with screenshots
✅ Build pipeline configured
✅ GitHub Actions workflows ready
✅ Release script ready

## Step-by-Step Checklist

### 1. Commit All Changes

Commit all your new files and updates:

```bash
# Add all new files
git add .github/
git add build/
git add docs/
git add scripts/
git add docs/development/
git add package.json
git add README.md

# Commit
git commit -m "feat: set up release pipeline, website, and icon"
```

### 2. Push to GitHub

```bash
git push origin release/setup
```

Or if you want to merge to main first:
```bash
git checkout main
git merge release/setup
git push origin main
```

### 3. Verify GitHub Pages

After pushing, check:
- Go to: https://github.com/romalpani/realpomo/settings/pages
- Verify source is set to `/docs` folder
- Your site should be live at: https://romalpani.github.io/realpomo

### 4. Test the Build Locally

Make sure everything builds correctly:

```bash
# Clean previous builds
rm -rf release/

# Build the app
npm run build

# Verify icon appears in the built app
open release/mac/RealPomo.app
```

### 5. Make Your First Release

When ready to release:

```bash
# Run the release script
npm run release

# Follow the prompts:
# 1. Select version bump (1 = patch, 2 = minor, 3 = major)
# 2. Confirm the release
# 3. Script will push to GitHub
# 4. GitHub Actions will automatically build and create release
```

### 6. Verify the Release

After GitHub Actions completes:

1. **Check GitHub Releases**:
   - Go to: https://github.com/romalpani/realpomo/releases
   - Verify DMG files are uploaded
   - Check release notes

2. **Test the Website**:
   - Visit: https://romalpani.github.io/realpomo
   - Download button should show latest version
   - Click download to test

3. **Test the DMG**:
   - Download DMG from GitHub Releases
   - Open it (may need to right-click → Open first time)
   - Install and test the app

## Pre-Release Checklist

Before running `npm run release`, verify:

- [ ] All tests pass: `npm run test:unit`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Build works: `npm run build`
- [ ] Icon appears correctly in built app
- [ ] Website looks good and works
- [ ] All changes committed and pushed

## What Happens When You Run `npm run release`

1. ✅ Checks working directory is clean
2. ✅ Runs pre-release checks (typecheck, lint, tests)
3. ✅ Bumps version in package.json
4. ✅ Creates git commit with version bump
5. ✅ Creates git tag (e.g., v0.1.0)
6. ✅ Pushes commit and tag to GitHub
7. ✅ GitHub Actions detects the tag
8. ✅ Builds macOS DMG and Windows installer
9. ✅ Creates GitHub Release with artifacts
10. ✅ Website auto-updates to show latest release

## Troubleshooting

### Build Fails
- Check GitHub Actions logs
- Verify all dependencies are installed
- Ensure code signing secrets are set (if using)

### Website Doesn't Update
- Check browser console for errors
- Verify GitHub API is accessible
- Check repository name matches in `docs/app.js`

### Release Script Fails
- Ensure working directory is clean
- Make sure all tests pass
- Verify you're on the correct branch

## Quick Commands Reference

```bash
# Test everything
npm run typecheck
npm run lint
npm run test:unit
npm run build

# Make a release
npm run release

# View website locally
cd docs && python3 -m http.server 8000
# Then open http://localhost:8000
```

## You're Ready! 🎉

Everything is set up. When you're ready, just run:
```bash
npm run release
```

And watch the magic happen! ✨

