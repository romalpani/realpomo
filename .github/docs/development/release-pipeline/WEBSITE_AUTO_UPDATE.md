# Website Auto-Update Mechanism

## How It Works

The website automatically fetches the latest release information from GitHub's Releases API and updates download links dynamically. This ensures users always download the latest version without manual website updates.

## Flow Diagram

```
User visits website
        │
        ▼
Website loads (index.html)
        │
        ▼
JavaScript executes (app.js)
        │
        ▼
Fetch GitHub Releases API
GET https://api.github.com/repos/USERNAME/realpomo/releases/latest
        │
        ▼
Parse JSON response
{
  "tag_name": "v1.0.0",
  "assets": [
    {
      "name": "RealPomo-1.0.0-arm64-mac.dmg",
      "browser_download_url": "https://github.com/.../RealPomo-1.0.0-arm64-mac.dmg"
    },
    {
      "name": "RealPomo-1.0.0-x64-mac.dmg",
      "browser_download_url": "https://github.com/.../RealPomo-1.0.0-x64-mac.dmg"
    }
  ]
}
        │
        ▼
Find DMG asset(s) for user's platform
        │
        ▼
Update DOM elements:
- Download button href
- Version number display
- Release date
        │
        ▼
User clicks download
        │
        ▼
Downloads latest DMG from GitHub Releases
```

## Implementation Details

### 1. API Endpoint
```javascript
const API_URL = 'https://api.github.com/repos/USERNAME/realpomo/releases/latest';
```

### 2. Platform Detection
- Detect user's OS (macOS vs Windows)
- Select appropriate asset (DMG for macOS, installer for Windows)
- Handle universal binaries or separate arm64/x64 builds

### 3. Caching Strategy
- Cache API response in `localStorage` or `sessionStorage`
- Cache duration: 5-10 minutes
- Reduces API calls and improves performance
- Respects GitHub API rate limits (60 requests/hour unauthenticated)

### 4. Error Handling
- Fallback to hardcoded version if API fails
- Show error message if fetch fails
- Graceful degradation

### 5. Loading States
- Show loading indicator while fetching
- Update UI smoothly when data arrives
- Handle slow network connections

## Example Implementation

```javascript
// app.js
const REPO_OWNER = 'yourusername';
const REPO_NAME = 'realpomo';
const CACHE_KEY = 'latestRelease';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchLatestRelease() {
  // Check cache first
  const cached = getCachedRelease();
  if (cached && !isCacheExpired(cached)) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch release');
    }
    
    const data = await response.json();
    
    // Cache the response
    cacheRelease(data);
    
    return data;
  } catch (error) {
    console.error('Error fetching release:', error);
    // Return cached data even if expired, or fallback
    return cached?.data || getFallbackRelease();
  }
}

function updateDownloadLinks(release) {
  const platform = detectPlatform(); // 'mac' or 'win'
  
  // Find appropriate asset
  const asset = release.assets.find(asset => {
    if (platform === 'mac') {
      return asset.name.endsWith('.dmg');
    } else {
      return asset.name.endsWith('.exe') || asset.name.includes('installer');
    }
  });
  
  if (asset) {
    // Update download button
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.href = asset.browser_download_url;
    downloadBtn.download = asset.name;
    
    // Update version display
    const versionEl = document.getElementById('version');
    versionEl.textContent = release.tag_name;
    
    // Update release date
    const dateEl = document.getElementById('release-date');
    dateEl.textContent = formatDate(release.published_at);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  const release = await fetchLatestRelease();
  updateDownloadLinks(release);
});
```

## GitHub API Considerations

### Rate Limits
- **Unauthenticated**: 60 requests/hour per IP
- **Authenticated**: 5,000 requests/hour per token
- **Solution**: Cache responses, use client-side caching

### CORS
- GitHub API supports CORS
- No CORS issues when fetching from browser
- Works with `fetch()` API

### Authentication (Optional)
- Can use GitHub token for higher rate limits
- Store token securely (not in client-side code)
- Use GitHub Pages environment variables if needed
- For public repos, unauthenticated is usually sufficient

## Alternative Approaches

### 1. Server-Side Rendering (SSG)
- Pre-build website with latest release info
- Update on each release via GitHub Actions
- No client-side API calls needed
- More reliable but requires build step

### 2. GitHub Pages with Jekyll
- Use Jekyll plugins to fetch release data at build time
- GitHub Actions rebuilds site on release
- Static site with latest data baked in

### 3. Webhook Integration
- GitHub webhook triggers website rebuild
- Website always has latest data
- Requires webhook endpoint (can use GitHub Actions)

## Recommended Approach

**Start with client-side API fetching** (simplest):
- No build step required
- Works immediately
- Easy to implement
- Good enough for most use cases

**Upgrade to SSG later** if needed:
- If API rate limits become an issue
- If you want better SEO
- If you want more control

## Testing

- Test with network throttling
- Test with API failure (offline mode)
- Test on different platforms
- Verify cache expiration works
- Test rate limit handling

## Security Considerations

- GitHub API is public, no sensitive data exposed
- Validate asset URLs before using
- Sanitize any user-facing data from API
- Use HTTPS for all requests

