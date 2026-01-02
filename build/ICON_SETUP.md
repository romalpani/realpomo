# Icon Setup Instructions

## Quick Start

I've created a starter SVG icon (`build/icon.svg`) that you can refine. Here's how to set it up:

## Step 1: Refine the Design (Optional)

The current SVG is a basic template. You can:

1. **Open in Figma/Illustrator/Sketch**:
   - Import `build/icon.svg`
   - Refine the curves and proportions
   - Make sure it looks good at small sizes
   - Export as SVG or PNG (1024x1024)

2. **Edit the SVG directly**:
   - Open `build/icon.svg` in any text editor
   - Adjust the path coordinates
   - The bite mark is the white circle on the right side

## Step 2: Convert to Required Formats

### Option A: Use electron-builder Auto-Conversion (Easiest)

electron-builder can automatically convert a PNG to `.icns`:

1. **Export PNG from SVG**:
   ```bash
   # If you have ImageMagick installed:
   convert -background none -resize 1024x1024 build/icon.svg build/icon.png
   
   # Or use any graphics tool to export SVG → PNG at 1024x1024
   ```

2. **Update package.json**:
   ```json
   {
     "build": {
       "icon": "build/icon.png"
     }
   }
   ```

3. **electron-builder will auto-generate .icns** during build!

### Option B: Manual .icns Creation (More Control)

1. **Create iconset directory structure**:
   ```bash
   mkdir -p build/RealPomo.iconset
   ```

2. **Generate PNGs at all required sizes**:
   ```bash
   # Using ImageMagick (install via: brew install imagemagick)
   sizes=(16 32 64 128 256 512 1024)
   for size in "${sizes[@]}"; do
     convert -background none -resize ${size}x${size} build/icon.svg \
       build/RealPomo.iconset/icon_${size}x${size}.png
     # Also create @2x versions for Retina
     convert -background none -resize $((size*2))x$((size*2)) build/icon.svg \
       build/RealPomo.iconset/icon_${size}x${size}@2x.png
   done
   ```

3. **Convert to .icns**:
   ```bash
   iconutil -c icns build/RealPomo.iconset -o build/icon.icns
   ```

4. **Update package.json**:
   ```json
   {
     "build": {
       "icon": "build/icon.icns"
     }
   }
   ```

### Option C: Online Tools (No Command Line)

1. Go to https://cloudconvert.com/svg-to-icns
2. Upload `build/icon.svg`
3. Download `icon.icns`
4. Place in `build/` directory
5. Update `package.json` as shown above

## Step 3: Test the Icon

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Check the built app**:
   - Open `release/mac/RealPomo.app`
   - Check if icon appears correctly in Finder
   - Verify it looks good at different sizes

3. **Preview in Finder**:
   - Right-click app → Get Info
   - See icon at various sizes

## Design Tips

### For Best Results:

1. **Keep it simple**: The icon should be recognizable at 16x16 pixels
2. **High contrast**: Pure black (#000000) on white works best
3. **Centered**: Icon should be centered in the 1024x1024 canvas
4. **Padding**: Leave ~10% padding around edges (don't fill entire square)
5. **Test at small sizes**: Zoom out to 16x16 to verify readability

### Common Issues:

- **Too detailed**: Simplify if it's blurry at small sizes
- **Off-center**: Use guides in your design tool
- **Low contrast**: Ensure pure black, not gray
- **Wrong proportions**: Tomato should be slightly wider than tall

## Alternative: Use Online Icon Generator

If you want to start from scratch:

1. **Figma** (free): https://figma.com
   - Create design
   - Export as SVG
   - Export as PNG (1024x1024)

2. **Canva** (free): https://canva.com
   - Design icon
   - Download as PNG

3. **AI Tools**:
   - Use ChatGPT/DALL-E to generate concept
   - Refine in vector editor
   - Export as SVG/PNG

## Current Files

- `build/icon.svg` - Source SVG (edit this)
- `build/ICON_DESIGN.md` - Design guidelines
- `build/ICON_SETUP.md` - This file

## Next Steps

1. Refine the SVG design (optional)
2. Convert to PNG (1024x1024) or .icns
3. Update `package.json` with icon path
4. Test with `npm run build`
5. Iterate until satisfied!

## Quick Test Command

After setting up, test quickly:
```bash
# Build just to check icon
npm run build

# Check the app bundle
ls -la release/mac/RealPomo.app/Contents/Resources/
# Should see icon.icns or electron.icns (if using default)
```

