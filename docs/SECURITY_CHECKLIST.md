# Security Checklist Before Committing

## ✅ Pre-Commit Security Verification

### 1. Certificate Files (MUST be ignored)
- ✅ `.p12` files are in `.gitignore`
- ✅ `.p12.base64` files are in `.gitignore`
- ✅ No certificate files exist in the repository
- ✅ No certificate files are tracked by git

**Verification:**
```bash
# Should return nothing
find . -name "*.p12" -o -name "*.p12.base64" | grep -v node_modules
git ls-files | grep -E "\.p12|\.base64"
```

### 2. Secrets and Passwords
- ✅ No passwords hardcoded in files
- ✅ No API keys or tokens in code
- ✅ Secrets are stored in GitHub Secrets (not in code)
- ✅ Scripts only contain variable names, not actual values

**Verification:**
```bash
# Should only show variable names, not actual secrets
grep -r "CSC_KEY_PASSWORD\|APPLE_ID_PASS" --include="*.sh" --include="*.js" --include="*.ts" .
```

### 3. Public Information (Safe to Commit)
These are **public** and safe to commit:
- ✅ Team ID: `U2YWB8CCXX` (visible in signed apps)
- ✅ Certificate identity: `Rohan Malpani (U2YWB8CCXX)` (public info)
- ✅ Certificate hash: `E0A9AC4D31B4E4FF9A166A56F208B9186C9FD95A` (public info)

### 4. Files Safe to Commit
- ✅ `build/entitlements.mac.plist` - Required entitlements (no secrets)
- ✅ `package.json` - Build config (only public certificate identity)
- ✅ `scripts/export-certificate.sh` - Helper script (no secrets)
- ✅ `scripts/verify-signature.sh` - Verification script (no secrets)
- ✅ All `.md` documentation files (instructions only, no secrets)
- ✅ `.gitignore` - Properly configured

### 5. Files That Must NOT Be Committed
- ❌ `*.p12` - Certificate files
- ❌ `*.p12.base64` - Base64 certificate files
- ❌ `certificate.p12` - Any certificate file
- ❌ `.env` files with secrets
- ❌ Any file containing actual passwords or API keys

## 🔒 Security Best Practices

### What's Protected
1. **GitHub Secrets** - All sensitive data stored encrypted in GitHub
2. **`.gitignore`** - Prevents accidental commits of sensitive files
3. **No Hardcoded Secrets** - All secrets use environment variables

### What's Public (By Design)
1. **Team ID** - Public information, visible in signed apps
2. **Certificate Identity** - Public information
3. **Build Configuration** - Public configuration (no secrets)

## ✅ Final Verification Commands

Run these before committing:

```bash
# 1. Check for certificate files
find . -name "*.p12" -o -name "*.p12.base64" | grep -v node_modules
# Should return nothing

# 2. Check git status
git status
# Should NOT show any .p12, .base64, or certificate files

# 3. Verify .gitignore is working
git check-ignore certificate.p12 certificate.p12.base64
# Should show that these patterns are ignored

# 4. Check for hardcoded secrets (should only show variable names)
grep -r "password\|secret\|key\|token" --include="*.json" --include="*.ts" --include="*.js" . | grep -v node_modules | grep -v ".git"
# Should only show documentation/instructions, not actual values
```

## 📋 Files Ready to Commit

All these files are **safe to commit**:

```
✅ .gitignore (enhanced with certificate patterns)
✅ package.json (build config with public identity)
✅ build/entitlements.mac.plist (required entitlements)
✅ scripts/export-certificate.sh (helper script)
✅ scripts/verify-signature.sh (verification script)
✅ docs/*.md (all documentation files)
```

## 🚨 Red Flags (Don't Commit)

If you see any of these, **DO NOT COMMIT**:
- ❌ Files with `.p12` extension
- ❌ Files with `.base64` extension  
- ❌ Files named `certificate.*`
- ❌ Files containing actual passwords or API keys
- ❌ `.env` files with secrets

## ✅ You're Safe to Commit!

If all checks pass, you're good to go:

```bash
git add .
git commit -m "feat: add code signing configuration"
git push
```

