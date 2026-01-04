#!/bin/bash

# Helper script to export code signing certificate for GitHub Actions
# This exports your Developer ID certificate as a base64-encoded .p12 file
# that can be stored as a GitHub secret (CSC_LINK)

set -e

CERT_NAME="Developer ID Application: Rohan Malpani (U2YWB8CCXX)"
OUTPUT_FILE="certificate.p12"
TEMP_KEYCHAIN="temp-build-keychain"

echo "🔐 Exporting code signing certificate for GitHub Actions"
echo "Certificate: $CERT_NAME"
echo ""

# Check if certificate exists
if ! security find-identity -v -p codesigning | grep -q "$CERT_NAME"; then
    echo "❌ Error: Certificate '$CERT_NAME' not found in Keychain"
    echo "   Please make sure your certificate is installed in Keychain Access"
    exit 1
fi

# Prompt for certificate password
echo "Enter a password to protect the exported .p12 file:"
read -s CERT_PASSWORD
echo ""

if [ -z "$CERT_PASSWORD" ]; then
    echo "❌ Error: Password cannot be empty"
    exit 1
fi

# Get certificate hash
echo "📦 Finding certificate..."
CERT_HASH=$(security find-identity -v -p codesigning | grep "$CERT_NAME" | head -1 | awk '{print $2}')

if [ -z "$CERT_HASH" ]; then
    echo "❌ Error: Could not find certificate hash"
    exit 1
fi

echo "   Found certificate hash: $CERT_HASH"

# Export certificate
echo "📦 Exporting certificate..."
echo "   You may be prompted to unlock your keychain or enter your Mac password..."
security export -f pkcs12 -k "$CERT_HASH" -P "$CERT_PASSWORD" -o "$OUTPUT_FILE" 2>&1 || {
    echo ""
    echo "❌ Error: Failed to export certificate"
    echo ""
    echo "💡 Troubleshooting:"
    echo "   1. Make sure your login keychain is unlocked"
    echo "   2. You may need to enter your Mac password when prompted"
    echo "   3. Try unlocking Keychain Access app manually:"
    echo "      - Open Keychain Access app"
    echo "      - Right-click 'login' keychain → Unlock"
    echo ""
    echo "   Alternatively, you can export manually:"
    echo "   1. Open Keychain Access app"
    echo "   2. Find 'Developer ID Application: Rohan Malpani'"
    echo "   3. Right-click → Export"
    echo "   4. Save as 'certificate.p12'"
    echo "   5. Then run: base64 -i certificate.p12 -o certificate.p12.base64"
    exit 1
}

# Convert to base64
echo "📝 Converting to base64..."
BASE64_OUTPUT="${OUTPUT_FILE}.base64"
base64 -i "$OUTPUT_FILE" -o "$BASE64_OUTPUT"

# Get file size
FILE_SIZE=$(wc -c < "$BASE64_OUTPUT" | tr -d ' ')

echo ""
echo "✅ Certificate exported successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Copy the contents of '$BASE64_OUTPUT' (${FILE_SIZE} bytes)"
echo "   2. Go to: https://github.com/YOUR_USERNAME/realpomo/settings/secrets/actions"
echo "   3. Add a new secret named: CSC_LINK"
echo "   4. Paste the base64 content as the value"
echo ""
echo "   5. Add another secret named: CSC_KEY_PASSWORD"
echo "   6. Use the password you entered above: $CERT_PASSWORD"
echo ""
echo "⚠️  Security notes:"
echo "   - Keep '$OUTPUT_FILE' and '$BASE64_OUTPUT' secure"
echo "   - Delete these files after adding to GitHub secrets"
echo "   - Never commit these files to git"
echo ""
echo "🧹 To clean up, run: rm -f $OUTPUT_FILE $BASE64_OUTPUT"

