#!/bin/bash
# Quick icon conversion script for RealPomo
# Converts SVG to PNG for electron-builder auto-conversion

echo "RealPomo Icon Converter"
echo "======================"
echo ""

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    echo "✓ ImageMagick found"
    echo "Converting SVG to PNG (1024x1024)..."
    convert -background none -resize 1024x1024 build/icon.svg build/icon.png
    echo "✓ Created build/icon.png"
    echo ""
    echo "Done! electron-builder will auto-generate .icns from this PNG."
elif command -v magick &> /dev/null; then
    echo "✓ ImageMagick found (magick command)"
    echo "Converting SVG to PNG (1024x1024)..."
    magick -background none -resize 1024x1024 build/icon.svg build/icon.png
    echo "✓ Created build/icon.png"
    echo ""
    echo "Done! electron-builder will auto-generate .icns from this PNG."
else
    echo "ImageMagick not found."
    echo ""
    echo "Option 1: Install ImageMagick"
    echo "  brew install imagemagick"
    echo "  Then run this script again"
    echo ""
    echo "Option 2: Use online converter"
    echo "  1. Go to: https://cloudconvert.com/svg-to-png"
    echo "  2. Upload build/icon.svg"
    echo "  3. Set size to 1024x1024"
    echo "  4. Download and save as build/icon.png"
    echo ""
    echo "Option 3: Use Figma/Illustrator/Sketch"
    echo "  1. Open build/icon.svg"
    echo "  2. Export as PNG at 1024x1024"
    echo "  3. Save as build/icon.png"
    exit 1
fi

