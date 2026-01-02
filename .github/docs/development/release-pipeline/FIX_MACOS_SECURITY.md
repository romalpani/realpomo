# Fixing macOS Security Warnings for Build Tools

## Problem

macOS is blocking native modules and binaries used by `electron-builder` because they're not code signed. You'll see errors like:
- `native.node` cannot be opened
- `app-builder_amd64` process failed

## Solution

### Option 1: Allow Through System Settings (Recommended)

1. **When you see the security dialog:**
   - Click **"Move to Trash"** (don't worry, we'll restore it)
   - Or click **"Done"** and go to System Settings

2. **Open System Settings:**
   - Apple Menu → System Settings
   - Go to **Privacy & Security**

3. **Allow the blocked application:**
   - Scroll down to see "Security" section
   - You should see a message about blocked software
   - Click **"Allow Anyway"** next to the blocked item
   - You may need to enter your password

4. **Try the build again:**
   ```bash
   npm run build
   ```

### Option 2: Remove Quarantine Attributes (Quick Fix)

Run these commands to remove security restrictions:

```bash
# Remove quarantine from electron-builder binaries
xattr -cr node_modules/app-builder-bin/mac/app-builder_amd64
xattr -cr node_modules/app-builder-bin/mac/app-builder_arm64

# Remove quarantine from native modules
xattr -cr node_modules/iconv-corefoundation/lib/native.node

# Make sure binaries are executable
chmod +x node_modules/app-builder-bin/mac/app-builder_amd64
chmod +x node_modules/app-builder-bin/mac/app-builder_arm64
```

### Option 3: Reinstall Dependencies

Sometimes a fresh install helps:

```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Then try build again
npm run build
```

## Why This Happens

- `electron-builder` uses native binaries (`app-builder_amd64`, `app-builder_arm64`)
- These binaries are not code signed by the developers
- macOS blocks unsigned binaries by default for security
- This is a **development-time issue only** - your built app will work fine

## After Fixing

Once you allow these binaries, builds will work normally. You only need to do this once per machine.

## Note

This only affects **building** on your Mac. The final DMG you create will work fine for users (they'll just see the normal "unidentified developer" warning we discussed earlier).

