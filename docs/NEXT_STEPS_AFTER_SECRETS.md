# Next Steps: Testing Code Signing in CI

Now that all GitHub secrets are configured, let's test the code signing setup!

## ✅ What's Done

- ✅ Certificate exported and added to GitHub secrets
- ✅ All 5 secrets configured:
  - `CSC_LINK`
  - `CSC_KEY_PASSWORD`
  - `APPLE_ID`
  - `APPLE_ID_PASS`
  - `APPLE_TEAM_ID`

## 📋 Next Steps

### Step 1: Commit Code Signing Changes

First, commit all the code signing configuration files:

```bash
# Add all the new files
git add build/entitlements.mac.plist
git add package.json
git add .gitignore
git add scripts/export-certificate.sh
git add scripts/verify-signature.sh
git add docs/

# Commit
git commit -m "feat: add code signing configuration for macOS

- Add entitlements.mac.plist for hardened runtime
- Configure code signing in package.json
- Add helper scripts for certificate export and verification
- Add documentation for code signing setup"
```

### Step 2: Push to GitHub

```bash
git push origin main
```

### Step 3: Test CI Build

You have two options to test:

#### Option A: Create a Test Tag (Recommended)

This will trigger a full release build:

```bash
# Create a test tag
git tag v1.0.5-test

# Push the tag
git push origin v1.0.5-test
```

#### Option B: Manual Workflow Trigger

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Release** workflow
4. Click **Run workflow** → **Run workflow**

### Step 4: Monitor the Build

1. Go to **Actions** tab in your GitHub repository
2. Click on the running workflow
3. Watch for these key steps:

   **✅ Code Signing:**
   - Look for: `signing file=.../RealPomo.app`
   - Should show: `identity=E0A9AC4D31B4E4FF9A166A56F208B9186C9FD95A`
   - Status: Should complete successfully

   **✅ Notarization:**
   - Look for: `notarizing` or `submitting to Apple`
   - This may take 10-30 minutes
   - Status: Should complete successfully

### Step 5: Verify the Signed App

After the build completes:

1. **Download the DMG** from the GitHub Release
2. **Mount the DMG** and copy the app
3. **Verify signature:**

```bash
# Check signature
codesign -dv --verbose=4 /Applications/RealPomo.app

# Verify signature
codesign --verify --verbose /Applications/RealPomo.app

# Check notarization status
spctl --assess --verbose /Applications/RealPomo.app
```

**Expected results:**
- ✅ Signature is valid
- ✅ Hardened runtime enabled
- ✅ Notarization accepted (after Apple processes it)

## 🔍 What to Look For in CI Logs

### Successful Code Signing

```
• signing         file=release/mac-arm64/RealPomo.app platform=darwin type=distribution identity=E0A9AC4D31B4E4FF9A166A56F208B9186C9FD95A
```

### Successful Notarization

```
• notarizing      file=release/RealPomo-1.0.5-test-arm64.dmg
• notarized       id=abc123-def456-ghi789
```

### If Notarization Takes Time

Notarization can take 10-30 minutes. You'll see:
- "submitting to Apple"
- "waiting for notarization"
- Eventually: "notarized" or "notarization complete"

## ⚠️ Troubleshooting

### Code Signing Fails

**Error:** "certificate not found" or "identity not found"
- ✅ Check `CSC_LINK` secret is correct (base64 content)
- ✅ Verify `CSC_KEY_PASSWORD` matches export password
- ✅ Check certificate is valid: `security find-identity -v -p codesigning`

### Notarization Fails

**Error:** "Invalid credentials" or "Authentication failed"
- ✅ Verify `APPLE_ID` is correct email
- ✅ Check `APPLE_ID_PASS` is valid App-Specific Password
- ✅ Verify `APPLE_TEAM_ID` matches your Team ID (`U2YWB8CCXX`)

**Error:** "Notarization timeout"
- This is normal - can take up to 30 minutes
- Check Apple's status: https://developer.apple.com/system-status/

### Build Succeeds But App Shows Warning

- First-time notarization can take time to propagate
- Users may need to wait a few hours after release
- This is normal for new apps

## 🎉 Success Criteria

Your setup is working if:

- ✅ Build completes successfully
- ✅ Code signing step shows your certificate
- ✅ Notarization completes (may take time)
- ✅ DMG downloads from GitHub Release
- ✅ App signature verifies locally
- ✅ No Gatekeeper warnings (after notarization)

## 📚 Additional Resources

- Local verification: `docs/LOCAL_CODE_SIGNING_CHECK.md`
- Setup guide: `docs/CODE_SIGNING_SETUP.md`
- GitHub secrets: `docs/GITHUB_SECRETS_GUIDE.md`

## 🚀 After Testing

Once everything works:

1. **Remove test tag** (optional):
   ```bash
   git tag -d v1.0.5-test
   git push origin :refs/tags/v1.0.5-test
   ```

2. **Create real release** when ready:
   ```bash
   npm run release
   ```

3. **Future releases** will automatically be signed and notarized! 🎉

