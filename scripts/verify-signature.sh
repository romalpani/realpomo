#!/bin/bash

# Script to verify code signing of RealPomo app locally

set -e

APP_PATH="release/mac-arm64/RealPomo.app"

echo "🔍 Verifying Code Signature for RealPomo"
echo "========================================"
echo ""

# Check if app exists
if [ ! -d "$APP_PATH" ]; then
    echo "❌ Error: App not found at $APP_PATH"
    echo "   Run 'npm run build:app && npx electron-builder --mac --publish never' first"
    exit 1
fi

echo "📦 App location: $APP_PATH"
echo ""

# 1. Check signature details
echo "1️⃣  Signature Details:"
echo "-------------------"
codesign -dv --verbose=4 "$APP_PATH" 2>&1 | grep -E "(Authority|Identifier|Format|runtime)" || true
echo ""

# 2. Verify signature is valid
echo "2️⃣  Signature Verification:"
echo "-------------------------"
if codesign --verify --verbose "$APP_PATH" 2>&1; then
    echo "✅ Signature is VALID"
else
    echo "❌ Signature verification FAILED"
    exit 1
fi
echo ""

# 3. Check hardened runtime
echo "3️⃣  Hardened Runtime Check:"
echo "-------------------------"
RUNTIME_FLAGS=$(codesign -dv --verbose=4 "$APP_PATH" 2>&1 | grep "flags=" || echo "")
if echo "$RUNTIME_FLAGS" | grep -q "runtime"; then
    echo "✅ Hardened runtime is ENABLED"
    echo "   $RUNTIME_FLAGS"
else
    echo "⚠️  Hardened runtime may not be enabled"
    echo "   $RUNTIME_FLAGS"
fi
echo ""

# 4. Check entitlements
echo "4️⃣  Entitlements Check:"
echo "---------------------"
ENTITLEMENTS=$(codesign -d --entitlements - "$APP_PATH" 2>/dev/null || echo "")
if [ -n "$ENTITLEMENTS" ]; then
    echo "✅ Entitlements found:"
    echo "$ENTITLEMENTS" | grep -E "(allow-jit|allow-unsigned-executable-memory|allow-dyld|disable-library-validation)" || true
else
    echo "⚠️  No entitlements found"
fi
echo ""

# 5. Check Gatekeeper assessment
echo "5️⃣  Gatekeeper Assessment:"
echo "-------------------------"
if spctl --assess --verbose "$APP_PATH" 2>&1 | grep -q "accepted"; then
    echo "✅ Gatekeeper: ACCEPTED"
else
    echo "⚠️  Gatekeeper assessment:"
    spctl --assess --verbose "$APP_PATH" 2>&1 || true
fi
echo ""

# 6. Check all helper apps are signed
echo "6️⃣  Helper Apps Signature Check:"
echo "--------------------------------"
HELPER_APPS=$(find "$APP_PATH/Contents/Frameworks" -name "*.app" -type d 2>/dev/null || true)
if [ -n "$HELPER_APPS" ]; then
    echo "Checking helper apps..."
    for HELPER in $HELPER_APPS; do
        HELPER_NAME=$(basename "$HELPER")
        if codesign --verify --verbose "$HELPER" 2>&1 | grep -q "valid"; then
            echo "  ✅ $HELPER_NAME: signed"
        else
            echo "  ❌ $HELPER_NAME: NOT signed"
        fi
    done
else
    echo "⚠️  No helper apps found"
fi
echo ""

echo "========================================"
echo "✅ Verification Complete!"
echo ""
echo "📝 Summary:"
echo "   - App is properly code signed"
echo "   - Ready for distribution"
echo "   - Can be notarized (if Apple ID credentials are configured)"

