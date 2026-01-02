// Configuration - Update these with your repository details
const REPO_OWNER = 'YOUR_USERNAME'; // Replace with your GitHub username
const REPO_NAME = 'realpomo'; // Replace if different

// Cache configuration
const CACHE_KEY = 'realpomo_latest_release';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Platform detection
function detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) return 'mac';
    if (userAgent.includes('win')) return 'win';
    return 'mac'; // Default to macOS
}

// Cache helpers
function getCachedRelease() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        console.error('Error reading cache:', e);
    }
    return null;
}

function cacheRelease(data) {
    try {
        const cacheData = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
        console.error('Error caching release:', e);
    }
}

function isCacheExpired(cached) {
    if (!cached || !cached.timestamp) return true;
    return Date.now() - cached.timestamp > CACHE_DURATION;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Fetch latest release from GitHub API
async function fetchLatestRelease() {
    // Check cache first
    const cached = getCachedRelease();
    if (cached && !isCacheExpired(cached)) {
        console.log('Using cached release data');
        return cached.data;
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Cache the response
        cacheRelease(data);
        
        return data;
    } catch (error) {
        console.error('Error fetching release:', error);
        
        // Return cached data even if expired, as fallback
        if (cached && cached.data) {
            console.log('Using expired cache as fallback');
            return cached.data;
        }
        
        // Last resort: return null to show error state
        return null;
    }
}

// Update download links based on release data
function updateDownloadLinks(release) {
    if (!release) {
        // Error state
        document.getElementById('download-btn').textContent = 'Download (Error loading version)';
        document.getElementById('version').textContent = '';
        return;
    }

    const platform = detectPlatform();
    const downloadBtn = document.getElementById('download-btn');
    const versionEl = document.getElementById('version');
    const dateEl = document.getElementById('release-date');

    // Find appropriate asset for platform
    let asset = null;
    
    if (platform === 'mac') {
        // Prefer DMG files, can handle both arm64 and x64
        asset = release.assets.find(a => a.name.endsWith('.dmg'));
    } else if (platform === 'win') {
        // Look for Windows installer
        asset = release.assets.find(a => 
            a.name.endsWith('.exe') || 
            a.name.includes('installer') ||
            a.name.includes('Setup')
        );
    }

    if (asset) {
        downloadBtn.href = asset.browser_download_url;
        downloadBtn.download = asset.name;
        downloadBtn.classList.remove('loading');
    } else {
        // Fallback: link to releases page
        downloadBtn.href = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
        downloadBtn.classList.remove('loading');
    }

    // Update version display
    if (versionEl) {
        versionEl.textContent = release.tag_name || '';
    }

    // Update release date
    if (dateEl && release.published_at) {
        dateEl.textContent = `Released ${formatDate(release.published_at)} • `;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading state
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.classList.add('loading');
    downloadBtn.textContent = 'Loading...';

    // Fetch and update
    const release = await fetchLatestRelease();
    updateDownloadLinks(release);
});

