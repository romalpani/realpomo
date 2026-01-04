# Local Code Signing Verification Guide

Quick guide to verify code signing is working correctly on your local machine.

## 🚀 Quick Check

Run the verification script:
```bash
./scripts/verify-signature.sh
```

## 📋 Manual Verification Commands

### 1. Build the app (if not already built)
```bash
npm run build:app
npx electron-builder --mac --publish never
```

### 2. Check signature details
```bash
codesign -dv --verbose=4 release/mac-arm64/RealPomo.app
```

**Expected output should show:**
- `Authority=Developer ID Application: Rohan Malpani (U2YWB8CCXX)`
- `flags=0x10000(runtime)` (hardened runtime enabled)
- `TeamIdentifier=U2YWB8CCXX`

### 3. Verify signature is valid
```bash
codesign --verify --verbose release/mac-arm64/RealPomo.app
```

**Expected output:**
```
release/mac-arm64/RealPomo.app: valid on disk
release/mac-arm64/RealPomo.app: satisfies its Designated Requirement
```

### 4. Check entitlements
```bash
codesign -d --entitlements - release/mac-arm64/RealPomo.app
```

**Should show all 4 entitlements:**
- `com.apple.security.cs.allow-jit`
- `com.apple.security.cs.allow-unsigned-executable-memory`
- `com.apple.security.cs.allow-dyld-environment-variables`
- `com.apple.security.cs.disable-library-validation`

### 5. Check hardened runtime
```bash
codesign -dv --verbose=4 release/mac-arm64/RealPomo.app | grep runtime
```

**Should show:** `flags=0x10000(runtime)`

### 6. Verify helper apps are signed
```bash
codesign --verify --verbose release/mac-arm64/RealPomo.app/Contents/Frameworks/RealPomo\ Helper.app
```

**Expected:** `valid on disk` and `satisfies its Designated Requirement`

## ⚠️ Gatekeeper Note

You may see:
```
spctl --assess: rejected
source=Unnotarized Developer ID
```

**This is normal!** The app is properly signed, but Gatekeeper requires **notarization** for macOS 10.15+. Notarization happens automatically in CI when you configure the Apple ID secrets.

## ✅ What Success Looks Like

- ✅ Signature shows your Developer ID certificate
- ✅ Signature verification passes
- ✅ Hardened runtime is enabled
- ✅ All entitlements are present
- ✅ Helper apps are signed
- ⚠️ Gatekeeper may reject until notarized (expected)

## 🔧 Troubleshooting

### "No such file or directory"
Build the app first:
```bash
npm run build:app && npx electron-builder --mac --publish never
```

### "code object is not signed"
Check that `package.json` has the correct `identity` field:
```json
"mac": {
  "identity": "Rohan Malpani (U2YWB8CCXX)",
  ...
}
```

### "certificate not found"
Verify certificate is installed:
```bash
security find-identity -v -p codesigning
```

## 📚 Additional Resources

- Full setup guide: `docs/CODE_SIGNING_SETUP.md`
- Implementation summary: `docs/CODE_SIGNING_SUMMARY.md`

