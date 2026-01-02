# Phase 5: Single-Page Website Setup

## Overview
Create a modern, minimalist single-page website to host DMG downloads with automatic updates to latest release.

## Tasks

### 5.1 Website Technology Choice
- [ ] **Option A**: Static HTML/CSS/JS (simplest, no build step)
- [ ] **Option B**: GitHub Pages with Jekyll (automatic deployment)
- [ ] **Option C**: Vite-based static site (matches your stack)
- [ ] **Recommendation**: Start with Option A (static HTML), upgrade later if needed

### 5.2 Website Structure
- [ ] Create `docs/` directory (for GitHub Pages) or `website/` directory
- [ ] Create `index.html` - Main landing page
- [ ] Create `styles.css` - Minimalist styling
- [ ] Create `app.js` - JavaScript for dynamic download links

### 5.3 Auto-Update Mechanism
- [ ] Use GitHub Releases API to fetch latest release
- [ ] Endpoint: `https://api.github.com/repos/USERNAME/realpomo/releases/latest`
- [ ] Parse release data to find DMG asset
- [ ] Update download button/link dynamically
- [ ] Cache API response (5-10 minutes) to reduce API calls
- [ ] Fallback to hardcoded version if API fails

### 5.4 Website Features
- [ ] Hero section with app name and tagline
- [ ] Download button (auto-updates to latest)
- [ ] Screenshot/gif of the app
- [ ] Feature list
- [ ] Link to GitHub releases page
- [ ] Minimal, modern design
- [ ] Mobile responsive

### 5.5 GitHub Pages Setup
- [ ] Enable GitHub Pages in repository settings
- [ ] Set source to `/docs` folder or `gh-pages` branch
- [ ] Custom domain (optional): `realpomo.com` or `realpomo.app`
- [ ] HTTPS enabled automatically

### 5.6 Website Deployment
- [ ] **Option A**: Manual (commit HTML files)
- [ ] **Option B**: GitHub Actions (auto-deploy on push to main)
- [ ] **Recommendation**: Option B for automatic updates

## File Structure

```
docs/
├── index.html
├── styles.css
├── app.js
└── assets/
    └── screenshot.png (or gif)
```

## API Integration Example

```javascript
async function updateDownloadLink() {
  try {
    const response = await fetch('https://api.github.com/repos/USERNAME/realpomo/releases/latest');
    const data = await response.json();
    
    // Find DMG asset
    const dmgAsset = data.assets.find(asset => asset.name.endsWith('.dmg'));
    
    if (dmgAsset) {
      document.getElementById('download-btn').href = dmgAsset.browser_download_url;
      document.getElementById('version').textContent = `v${data.tag_name}`;
    }
  } catch (error) {
    console.error('Failed to fetch latest release:', error);
    // Fallback to hardcoded version
  }
}
```

## Notes
- GitHub Pages is free for public repos
- Custom domains are free
- API rate limit: 60 requests/hour unauthenticated, 5,000/hour authenticated
- Consider adding a loading state while fetching release info
- Cache API responses to stay within rate limits

