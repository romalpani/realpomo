# Quick Start: Setting Up Your Icon

## What I've Created

✅ **`build/icon.svg`** - Starter SVG icon (tomato with bite, Apple logo style)
✅ **Design guide** - See `ICON_DESIGN.md` for design principles
✅ **Setup instructions** - See `ICON_SETUP.md` for detailed steps

## Easiest Path (3 Steps)

### Step 1: Convert SVG to PNG

**Option A: Online (Easiest, No Installation)**
1. Go to: https://cloudconvert.com/svg-to-png
2. Upload `build/icon.svg`
3. Set width: 1024, height: 1024
4. Click "Convert"
5. Download and save as `build/icon.png`

**Option B: Install ImageMagick (Command Line)**
```bash
brew install imagemagick
./build/convert-icon.sh
```

**Option C: Design Tool (Most Control)**
1. Open `build/icon.svg` in Figma/Illustrator/Sketch
2. Refine the design if needed
3. Export as PNG: 1024x1024
4. Save as `build/icon.png`

### Step 2: Update package.json

I'll do this for you - just need the PNG file first!

### Step 3: Test

```bash
npm run build
```

Check `release/mac/RealPomo.app` - your icon should appear!

## Current Icon Design

The SVG includes:
- ✅ Tomato shape (slightly oval, wider than tall)
- ✅ Bite mark on upper right (Apple logo style)
- ✅ Small stem at top
- ✅ Pure black on white (monochrome)

## Refining the Design

If you want to improve it:

1. **Open `build/icon.svg`** in Figma/Illustrator
2. **Adjust**:
   - Tomato proportions
   - Bite size/position
   - Stem (or remove it)
   - Overall shape
3. **Test at small sizes** (zoom to 16x16 to verify readability)
4. **Export** as PNG (1024x1024)

## Design Tips

- **Keep it simple** - Must work at 16x16 pixels
- **High contrast** - Pure black (#000000) on white
- **Centered** - Leave ~10% padding around edges
- **No fine details** - Avoid thin lines or small elements

## Next Steps

1. Convert SVG → PNG (use online tool above)
2. Save as `build/icon.png`
3. Let me know when done, and I'll update `package.json`
4. Test with `npm run build`

That's it! 🎨

