# Fix: .p12 Export Option Disabled

If the .p12 export option is grayed out in Keychain Access, you need to export **both the certificate AND its private key together**.

## Solution: Export Certificate + Private Key Together

### Method 1: Select Both Items in Keychain Access

1. **Open Keychain Access**
2. **Make sure "login" keychain is unlocked** (right-click → Unlock)
3. **Search for:** `Developer ID Application: Rohan Malpani`
4. **You should see TWO items:**
   - One labeled as **"certificate"** (has a certificate icon)
   - One labeled as **"private key"** (has a key icon, usually named something like "Developer ID Application: Rohan Malpani" or just shows a key)

5. **Select BOTH items:**
   - Click the certificate
   - Hold **⌘ (Command)** key
   - Click the private key
   - Both should be selected (highlighted)

6. **Right-click on the selected items** → **"Export 2 items..."**
   - Or: **File → Export Items...**

7. **Now the .p12 option should be available!**
   - Choose **"Personal Information Exchange (.p12)"**
   - Save as `certificate.p12`
   - Set a password when prompted

### Method 2: Use Terminal (More Reliable)

If the GUI method still doesn't work, use Terminal:

```bash
# Get certificate hash
CERT_HASH=$(security find-identity -v -p codesigning | grep "Developer ID Application: Rohan Malpani" | head -1 | awk '{print $2}')

# Export certificate + private key as .p12
# You'll be prompted for:
# 1. A password to protect the .p12 file (remember this!)
# 2. Your Mac password to access the keychain
security export -f pkcs12 -k "$CERT_HASH" -P "your-p12-password" -o certificate.p12

# Convert to base64
base64 -i certificate.p12 -o certificate.p12.base64

# View the base64 content
cat certificate.p12.base64
```

**Note:** Replace `"your-p12-password"` with a password of your choice. You'll need this password for the GitHub secret `CSC_KEY_PASSWORD`.

### Method 3: Improved Script

Try the improved export script (make sure keychain is unlocked first):

```bash
# Unlock keychain first (if needed)
security unlock-keychain ~/Library/Keychains/login.keychain-db

# Run the export script
./scripts/export-certificate.sh
```

## Why .p12 Option is Disabled

The .p12 format requires **both**:
- ✅ The certificate (public key)
- ✅ The private key

If you only select the certificate, the .p12 option will be grayed out. You must select both items together.

## Finding the Private Key

If you can't find the private key:

1. In Keychain Access, make sure you're viewing **"All Items"** or **"My Certificates"**
2. Look for an item with a **key icon** 🔑
3. It might be named:
   - "Developer ID Application: Rohan Malpani"
   - Or just show as a key without a specific name
4. The key and certificate are usually grouped together

## Verification

After exporting, verify the .p12 file contains both:

```bash
# Check if .p12 file has private key
openssl pkcs12 -in certificate.p12 -noout -info
```

You should see both certificate and private key information.

## Next Steps

Once you have `certificate.p12.base64`:

1. Copy the base64 content: `cat certificate.p12.base64`
2. Add to GitHub secret: `CSC_LINK`
3. Add password to GitHub secret: `CSC_KEY_PASSWORD`
4. Clean up: `rm -f certificate.p12 certificate.p12.base64`

