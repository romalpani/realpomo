# RealPomo Icon Design Guide

## Design Concept

**A tomato with a bite taken out** - inspired by Apple's logo style, in black and white.

### Why This Works

1. **Memorable**: References the iconic Apple logo, creating instant recognition
2. **Relevant**: Pomodoro technique is named after tomato-shaped kitchen timers
3. **Simple**: Works at all sizes (16x16 to 1024x1024)
4. **Professional**: Monochrome design fits modern macOS aesthetic
5. **Distinctive**: Unique silhouette that stands out

## Design Principles

### Shape
- **Tomato silhouette**: Rounded, slightly oval (not perfectly round)
- **Bite mark**: Clean, curved cutout on the right side (like Apple logo)
- **Stem**: Small, simple stem at top (optional, can be removed for simplicity)

### Style
- **Black and white**: Pure black (#000000) on white background
- **No gradients**: Flat design for clarity at small sizes
- **Clean edges**: Sharp, precise curves
- **Minimal detail**: Avoid texture, shadows, or complex elements

### Proportions
- **Bite size**: About 1/4 to 1/3 of the tomato
- **Bite position**: Upper right quadrant (matches Apple logo)
- **Overall shape**: Slightly wider than tall (1.1:1 ratio)

## Technical Requirements

### File Formats Needed

1. **Source**: SVG (vector, scalable)
2. **macOS**: `.icns` file (contains multiple sizes)
3. **Windows**: `.ico` file (optional, for Windows builds)

### Icon Sizes Required

For `.icns` file, electron-builder needs:
- 16x16
- 32x32
- 64x64
- 128x128
- 256x256
- 512x512
- 1024x1024

### Design Considerations

- **Readability at 16x16**: Must be recognizable even at smallest size
- **No fine details**: Avoid thin lines or small elements
- **High contrast**: Pure black on white ensures visibility
- **Centered**: Icon should be centered in the square canvas
- **Padding**: Leave ~10% padding around edges

## Design Variations to Consider

### Option 1: Simple Tomato (Recommended)
- Just the tomato shape with bite
- No stem
- Maximum simplicity

### Option 2: Tomato with Stem
- Small stem at top
- More "tomato-like"
- Slightly more complex

### Option 3: Stylized Timer
- Combine tomato with subtle timer elements
- More unique but potentially less recognizable

## Tools for Creation

### Option 1: Vector Graphics Software
- **Figma** (free, web-based) - Recommended
- **Adobe Illustrator**
- **Sketch**
- **Inkscape** (free, open-source)

### Option 2: Code-Based (SVG)
- Create SVG directly in code
- Edit with any text editor
- Perfect for simple geometric shapes

### Option 3: AI-Assisted
- Use AI tools to generate initial design
- Refine in vector editor
- Export as SVG

## Conversion to .icns

Once you have an SVG or PNG:

### macOS Native Method
```bash
# Create iconset directory
mkdir RealPomo.iconset

# Generate PNGs at all sizes (using ImageMagick or similar)
# Then convert to .icns
iconutil -c icns RealPomo.iconset
```

### Online Tools
- **CloudConvert**: SVG/PNG → ICNS
- **iConvert Icons**: Mac app for conversion
- **Image2icon**: Mac app

### Electron Builder Method
electron-builder can auto-convert if you provide:
- `icon.png` (1024x1024) - will auto-generate .icns
- Or `icon.icns` directly

## Integration

Once created, place icon files in `build/` directory:
```
build/
├── icon.png (1024x1024, for auto-conversion)
├── icon.icns (macOS, if created manually)
└── icon.ico (Windows, optional)
```

Then update `package.json`:
```json
{
  "build": {
    "icon": "build/icon.png"
  }
}
```

## References

- **Apple Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/app-icons
- **Electron Builder Icons**: https://www.electron.build/icons

