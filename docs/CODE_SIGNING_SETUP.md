# Code Signing Setup Guide

This guide walks you through setting up code signing for RealPomo on GitHub Actions.

## ✅ What's Already Configured

- ✅ Certificate verified: `Developer ID Application: Rohan Malpani (U2YWB8CCXX)`
- ✅ Entitlements file created: `build/entitlements.mac.plist`
- ✅ Build configuration updated in `package.json`
- ✅ GitHub Actions workflow ready (uses secrets if available)
- ✅ Local code signing tested and verified

## 📋 Required GitHub Secrets

You need to set up the following secrets in your GitHub repository:

1. **CSC_LINK** - Base64-encoded certificate (.p12 file)
2. **CSC_KEY_PASSWORD** - Password for the certificate
3. **APPLE_ID** - Your Apple ID email (for notarization)
4. **APPLE_ID_PASS** - App-Specific Password (for notarization)
5. **APPLE_TEAM_ID** - Your Team ID: `U2YWB8CCXX`

## 🔐 Step 1: Export Certificate

Run the helper script to export your certificate:

```bash
./scripts/export-certificate.sh
```

This will:
- Export your certificate as a `.p12` file
- Convert it to base64 format
- Provide instructions for adding to GitHub

**Alternative manual method:**

```bash
# Find your certificate hash
security find-identity -v -p codesigning

# Export certificate (replace HASH with your certificate hash)
security export -f pkcs12 -k HASH -P "your-password" -o certificate.p12

# Convert to base64
base64 -i certificate.p12 -o certificate.p12.base64
```

## 🔑 Step 2: Create App-Specific Password

For notarization, you need an App-Specific Password:

1. Go to https://appleid.apple.com/
2. Sign in with your Apple ID
3. Navigate to "Sign-In and Security" → "App-Specific Passwords"
4. Click "Generate an app-specific password"
5. Label it: "RealPomo Notarization"
6. Copy the password (you'll only see it once!)

## 📝 Step 3: Add GitHub Secrets

**Important:** For a public repository, use **Repository secrets** (not Environment secrets). Repository secrets are encrypted and only accessible to workflows - they're perfect for code signing.

### Steps:

1. Go to your repository: `https://github.com/YOUR_USERNAME/realpomo`
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Make sure you're on the **"Secrets"** tab (not "Variables" or "Environments")
4. Click **"New repository secret"** for each secret below:

   **CSC_LINK:**
   - Name: `CSC_LINK`
   - Value: Paste the entire contents of `certificate.p12.base64` file
   
   **CSC_KEY_PASSWORD:**
   - Name: `CSC_KEY_PASSWORD`
   - Value: The password you used when exporting the certificate
   
   **APPLE_ID:**
   - Name: `APPLE_ID`
   - Value: Your Apple ID email address
   
   **APPLE_ID_PASS:**
   - Name: `APPLE_ID_PASS`
   - Value: The App-Specific Password you created
   
   **APPLE_TEAM_ID:**
   - Name: `APPLE_TEAM_ID`
   - Value: `U2YWB8CCXX`

## ✅ Step 4: Verify Setup

1. Create a test tag to trigger a build:
   ```bash
   git tag v1.0.5-test
   git push origin v1.0.5-test
   ```

2. Check the GitHub Actions workflow:
   - Go to **Actions** tab in your repository
   - Watch the build progress
   - Look for "signing" step - it should show your certificate
   - Check for "notarization" - it should complete successfully

3. Download the built DMG and verify:
   ```bash
   # Check signature
   codesign -dv --verbose=4 RealPomo.app
   
   # Verify signature
   codesign --verify --verbose RealPomo.app
   
   # Check notarization (if enabled)
   spctl --assess --verbose RealPomo.app
   ```

## 🔍 Troubleshooting

### Code signing fails
- Verify certificate is valid: `security find-identity -v -p codesigning`
- Check CSC_LINK secret is correct (should be base64)
- Verify CSC_KEY_PASSWORD matches the export password

### Notarization fails
- Verify APPLE_ID and APPLE_ID_PASS are correct
- Check APPLE_TEAM_ID matches your Team ID
- App-Specific Password must be valid (regenerate if expired)
- Check Apple's notarization status: https://developer.apple.com/system-status/

### Build works but app shows warning
- This is normal for first-time notarization (can take 10-30 minutes)
- Check notarization status in GitHub Actions logs
- Users may need to wait for Apple's servers to update

## 📚 Additional Resources

- [electron-builder Code Signing Docs](https://www.electron.build/code-signing)
- [Apple Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## 🧹 Cleanup

After adding secrets to GitHub, delete local certificate files:

```bash
rm -f certificate.p12 certificate.p12.base64
```

**Never commit these files to git!**

