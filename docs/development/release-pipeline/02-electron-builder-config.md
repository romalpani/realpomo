# Phase 2: Electron Builder Configuration

## Overview
Configure `electron-builder` to produce DMG files for macOS and proper installers for Windows, with code signing and auto-update support.

## Tasks

### 2.1 Update package.json Build Configuration
- [ ] Change macOS target from `zip` to `dmg`
- [ ] Add DMG configuration:
  - Background image (optional, for branded DMG)
  - Icon size and position
  - Window size
- [ ] Configure Windows NSIS installer properly
- [ ] Add `publish` configuration for GitHub releases

### 2.2 Code Signing Setup (macOS)
- [ ] **Required for DMG distribution**: Set up Apple Developer account
- [ ] Create App-Specific Password for notarization
- [ ] Configure environment variables:
  - `APPLE_ID` - Your Apple ID email
  - `APPLE_ID_PASS` - App-specific password
  - `APPLE_TEAM_ID` - Your Team ID
- [ ] Add code signing certificates to keychain
- [ ] Configure `mac.identity` in electron-builder config

### 2.3 Code Signing Setup (Windows)
- [ ] **Optional but recommended**: Set up code signing certificate
- [ ] Configure `win.certificateFile` and `win.certificatePassword` if using

### 2.4 Version Management
- [ ] Ensure `package.json` version is properly maintained
- [ ] Consider using `npm version` commands for version bumps
- [ ] Add script: `npm run version:patch`, `npm run version:minor`, `npm run version:major`

### 2.5 Build Artifacts
- [ ] Configure `directories.output` to `release`
- [ ] Ensure proper file inclusion/exclusion
- [ ] Test local builds produce expected artifacts

## Configuration Example

```json
{
  "build": {
    "appId": "com.realpomo.app",
    "productName": "RealPomo",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**"
    ],
    "mac": {
      "target": [
        {
          "target": "dmg",
          "arch": ["arm64", "x64"]
        }
      ],
      "category": "public.app-category.productivity",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist"
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "ia32"]
        }
      ]
    },
    "publish": {
      "provider": "github",
      "owner": "YOUR_GITHUB_USERNAME",
      "repo": "realpomo"
    }
  }
}
```

## Notes
- Code signing is **required** for macOS DMG distribution outside the App Store
- Notarization is required for macOS 10.15+ (handled automatically by electron-builder)
- Windows code signing is optional but builds trust
- GitHub Actions will handle signing using secrets

