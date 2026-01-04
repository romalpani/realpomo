# Manual Certificate Export Guide

If the automated script fails, you can export the certificate manually using Keychain Access.

## Method 1: Using Keychain Access (GUI) - Recommended

### Step 1: Open Keychain Access
1. Open **Keychain Access** app (Applications → Utilities → Keychain Access)
2. Make sure **"login"** keychain is selected (left sidebar)
3. If it's locked, right-click it and select **"Unlock Keychain"**
4. Enter your Mac password when prompted

### Step 2: Find Your Certificate
1. In the search box, type: `Developer ID Application: Rohan Malpani`
2. You should see: **"Developer ID Application: Rohan Malpani (U2YWB8CCXX)"**
3. Click on it to select it

### Step 3: Export Certificate
1. Right-click the certificate → **"Export 'Developer ID Application: Rohan Malpani (U2YWB8CCXX)'..."**
   - Or: File → Export Items...
2. Choose a location (e.g., Desktop or project folder)
3. Name it: `certificate.p12`
4. File Format: Select **"Personal Information Exchange (.p12)"**
5. Click **"Save"**

### Step 4: Set Password
1. You'll be prompted to set a password for the exported file
2. **Enter a password** (remember this - you'll need it for GitHub secret `CSC_KEY_PASSWORD`)
3. Click **"OK"**
4. You may be prompted to enter your Mac password again - do so

### Step 5: Convert to Base64
Open Terminal and run:

```bash
cd /path/to/where/you/saved/certificate.p12
base64 -i certificate.p12 -o certificate.p12.base64
```

Or if you saved it in your project folder:

```bash
cd /Users/rohanmalpani/Source/realpomo
base64 -i certificate.p12 -o certificate.p12.base64
```

### Step 6: Get the Base64 Content
```bash
cat certificate.p12.base64
```

Copy the entire output - this is what goes into GitHub secret `CSC_LINK`.

## Method 2: Using Terminal (If Keychain is Unlocked)

If your keychain is unlocked, try the improved script:

```bash
./scripts/export-certificate.sh
```

Or manually:

```bash
# Get certificate hash
CERT_HASH=$(security find-identity -v -p codesigning | grep "Developer ID Application: Rohan Malpani" | head -1 | awk '{print $2}')

# Export (you'll be prompted for password)
security export -f pkcs12 -k "$CERT_HASH" -P "your-password-here" -o certificate.p12

# Convert to base64
base64 -i certificate.p12 -o certificate.p12.base64

# View it
cat certificate.p12.base64
```

## Troubleshooting

### "Keychain is locked"
1. Open Keychain Access app
2. Right-click "login" keychain → Unlock
3. Enter your Mac password
4. Try exporting again

### "Permission denied"
- Make sure you're exporting from the "login" keychain (not "System")
- You may need to enter your Mac password multiple times

### "Certificate not found"
- Verify certificate exists: `security find-identity -v -p codesigning`
- Make sure you're looking in the correct keychain

## Next Steps

After you have `certificate.p12.base64`:

1. **Copy the base64 content:**
   ```bash
   cat certificate.p12.base64
   ```

2. **Add to GitHub:**
   - Go to: Settings → Secrets → Actions
   - Create secret: `CSC_LINK` (paste base64 content)
   - Create secret: `CSC_KEY_PASSWORD` (the password you set)

3. **Clean up:**
   ```bash
   rm -f certificate.p12 certificate.p12.base64
   ```

## Security Reminder

⚠️ **Never commit these files to git!** They're already in `.gitignore`, but double-check before committing.

