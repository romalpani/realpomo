# Release from Main Branch - Quick Guide

## ✅ Step 1: Merge to Main (Do this now)

You can either:

### Option A: Merge via GitHub (Recommended)
1. Go to: https://github.com/romalpani/realpomo/pull/new/release/setup
2. Create Pull Request
3. Review changes
4. Merge PR to main

### Option B: Merge locally
```bash
git checkout main
git pull origin main
git merge release/setup
git push origin main
```

## ✅ Step 2: Switch to Main in IDE

After merging:
1. Switch branch in your IDE to `main`
2. Pull latest: `git pull origin main`
3. Verify you're on main: `git branch --show-current`

## ✅ Step 3: Release from Main

Once on main branch:

```bash
# Make sure you're on main and up to date
git checkout main
git pull origin main

# Verify everything is clean
git status

# Run the release script
npm run release
```

## What Happens Next

1. **Release script** will:
   - Check working directory is clean
   - Run pre-release checks (typecheck, lint, tests)
   - Ask for version bump (1=patch, 2=minor, 3=major)
   - Bump version in package.json
   - Create commit and tag (e.g., v0.1.0)
   - Push to GitHub

2. **GitHub Actions** will:
   - Detect the tag push
   - Build macOS DMG and Windows installer
   - Create GitHub Release
   - Upload artifacts

3. **Website** will:
   - Auto-update to show latest release
   - Download button will link to new DMG

## Verify After Release

1. **Check GitHub Actions**: https://github.com/romalpani/realpomo/actions
2. **Check Releases**: https://github.com/romalpani/realpomo/releases
3. **Check Website**: https://romalpani.github.io/realpomo

## Notes

- ✅ Release workflow triggers on tags (works from any branch)
- ✅ But releasing from `main` is best practice
- ✅ CI workflow runs on pushes to `main`
- ✅ Website auto-updates from GitHub Releases API

You're all set! 🚀

